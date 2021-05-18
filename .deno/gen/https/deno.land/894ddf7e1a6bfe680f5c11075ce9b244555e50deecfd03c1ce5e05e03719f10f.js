// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { isWindows, osType } from "../_util/os.ts";
import { SEP, SEP_PATTERN } from "./separator.ts";
import * as _win32 from "./win32.ts";
import * as _posix from "./posix.ts";
const path = isWindows ? _win32 : _posix;
const { join, normalize } = path;
// deno-fmt-ignore
const regExpEscapeChars = [
    "!",
    "$",
    "(",
    ")",
    "*",
    "+",
    ".",
    "=",
    "?",
    "[",
    "\\",
    "^",
    "{",
    "|"
];
const rangeEscapeChars = [
  "-",
  "\\",
  "]",
];
/** Convert a glob string to a regular expression.
 *
 * Tries to match bash glob expansion as closely as possible.
 *
 * Basic glob syntax:
 * - `*` - Matches everything without leaving the path segment.
 * - `{foo,bar}` - Matches `foo` or `bar`.
 * - `[abcd]` - Matches `a`, `b`, `c` or `d`.
 * - `[a-d]` - Matches `a`, `b`, `c` or `d`.
 * - `[!abcd]` - Matches any single character besides `a`, `b`, `c` or `d`.
 * - `[[:<class>:]]` - Matches any character belonging to `<class>`.
 *     - `[[:alnum:]]` - Matches any digit or letter.
 *     - `[[:digit:]abc]` - Matches any digit, `a`, `b` or `c`.
 *     - See https://facelessuser.github.io/wcmatch/glob/#posix-character-classes
 *       for a complete list of supported character classes.
 * - `\` - Escapes the next character for an `os` other than `"windows"`.
 * - \` - Escapes the next character for `os` set to `"windows"`.
 * - `/` - Path separator.
 * - `\` - Additional path separator only for `os` set to `"windows"`.
 *
 * Extended syntax:
 * - Requires `{ extended: true }`.
 * - `?(foo|bar)` - Matches 0 or 1 instance of `{foo,bar}`.
 * - `@(foo|bar)` - Matches 1 instance of `{foo,bar}`. They behave the same.
 * - `*(foo|bar)` - Matches _n_ instances of `{foo,bar}`.
 * - `+(foo|bar)` - Matches _n > 0_ instances of `{foo,bar}`.
 * - `!(foo|bar)` - Matches anything other than `{foo,bar}`.
 * - See https://www.linuxjournal.com/content/bash-extended-globbing.
 *
 * Globstar syntax:
 * - Requires `{ globstar: true }`.
 * - `**` - Matches any number of any path segments.
 *     - Must comprise its entire path segment in the provided glob.
 * - See https://www.linuxjournal.com/content/globstar-new-bash-globbing-option.
 *
 * Note the following properties:
 * - The generated `RegExp` is anchored at both start and end.
 * - Repeating and trailing separators are tolerated. Trailing separators in the
 *   provided glob have no meaning and are discarded.
 * - Absolute globs will only match absolute paths, etc.
 * - Empty globs will match nothing.
 * - Any special glob syntax must be contained to one path segment. For example,
 *   `?(foo|bar/baz)` is invalid. The separator will take precendence and the
 *   first segment ends with an unclosed group.
 * - If a path segment ends with unclosed groups or a dangling escape prefix, a
 *   parse error has occured. Every character for that segment is taken
 *   literally in this event.
 *
 * Limitations:
 * - A negative group like `!(foo|bar)` will wrongly be converted to a negative
 *   look-ahead followed by a wildcard. This means that `!(foo).js` will wrongly
 *   fail to match `foobar.js`, even though `foobar` is not `foo`. Effectively,
 *   `!(foo|bar)` is treated like `!(@(foo|bar)*)`. This will work correctly if
 *   the group occurs not nested at the end of the segment. */ export function globToRegExp(
  glob,
  {
    extended = true,
    globstar: globstarOption = true,
    os = osType,
    caseInsensitive = false,
  } = {},
) {
  if (glob == "") {
    return /(?!)/;
  }
  const sep = os == "windows" ? "(?:\\\\|/)+" : "/+";
  const sepMaybe = os == "windows" ? "(?:\\\\|/)*" : "/*";
  const seps = os == "windows"
    ? [
      "\\",
      "/",
    ]
    : [
      "/",
    ];
  const globstar = os == "windows"
    ? "(?:[^\\\\/]*(?:\\\\|/|$)+)*"
    : "(?:[^/]*(?:/|$)+)*";
  const wildcard = os == "windows" ? "[^\\\\/]*" : "[^/]*";
  const escapePrefix = os == "windows" ? "`" : "\\";
  // Remove trailing separators.
  let newLength = glob.length;
  for (; newLength > 1 && seps.includes(glob[newLength - 1]); newLength--);
  glob = glob.slice(0, newLength);
  let regExpString = "";
  // Terminates correctly. Trust that `j` is incremented every iteration.
  for (let j = 0; j < glob.length;) {
    let segment = "";
    const groupStack = [];
    let inRange = false;
    let inEscape = false;
    let endsWithSep = false;
    let i = j;
    // Terminates with `i` at the non-inclusive end of the current segment.
    for (; i < glob.length && !seps.includes(glob[i]); i++) {
      if (inEscape) {
        inEscape = false;
        const escapeChars = inRange ? rangeEscapeChars : regExpEscapeChars;
        segment += escapeChars.includes(glob[i]) ? `\\${glob[i]}` : glob[i];
        continue;
      }
      if (glob[i] == escapePrefix) {
        inEscape = true;
        continue;
      }
      if (glob[i] == "[") {
        if (!inRange) {
          inRange = true;
          segment += "[";
          if (glob[i + 1] == "!") {
            i++;
            segment += "^";
          } else if (glob[i + 1] == "^") {
            i++;
            segment += "\\^";
          }
          continue;
        } else if (glob[i + 1] == ":") {
          let k = i + 1;
          let value = "";
          while (glob[k + 1] != null && glob[k + 1] != ":") {
            value += glob[k + 1];
            k++;
          }
          if (glob[k + 1] == ":" && glob[k + 2] == "]") {
            i = k + 2;
            if (value == "alnum") segment += "\\dA-Za-z";
            else if (value == "alpha") segment += "A-Za-z";
            else if (value == "ascii") segment += "\x00-\x7F";
            else if (value == "blank") segment += "\t ";
            else if (value == "cntrl") segment += "\x00-\x1F\x7F";
            else if (value == "digit") segment += "\\d";
            else if (value == "graph") segment += "\x21-\x7E";
            else if (value == "lower") segment += "a-z";
            else if (value == "print") segment += "\x20-\x7E";
            else if (value == "punct") {
              segment += "!\"#$%&'()*+,\\-./:;<=>?@[\\\\\\]^_‘{|}~";
            } else if (value == "space") segment += "\\s\v";
            else if (value == "upper") segment += "A-Z";
            else if (value == "word") segment += "\\w";
            else if (value == "xdigit") segment += "\\dA-Fa-f";
            continue;
          }
        }
      }
      if (glob[i] == "]" && inRange) {
        inRange = false;
        segment += "]";
        continue;
      }
      if (inRange) {
        if (glob[i] == "\\") {
          segment += `\\\\`;
        } else {
          segment += glob[i];
        }
        continue;
      }
      if (
        glob[i] == ")" && groupStack.length > 0 &&
        groupStack[groupStack.length - 1] != "BRACE"
      ) {
        segment += ")";
        const type = groupStack.pop();
        if (type == "!") {
          segment += wildcard;
        } else if (type != "@") {
          segment += type;
        }
        continue;
      }
      if (
        glob[i] == "|" && groupStack.length > 0 &&
        groupStack[groupStack.length - 1] != "BRACE"
      ) {
        segment += "|";
        continue;
      }
      if (glob[i] == "+" && extended && glob[i + 1] == "(") {
        i++;
        groupStack.push("+");
        segment += "(?:";
        continue;
      }
      if (glob[i] == "@" && extended && glob[i + 1] == "(") {
        i++;
        groupStack.push("@");
        segment += "(?:";
        continue;
      }
      if (glob[i] == "?") {
        if (extended && glob[i + 1] == "(") {
          i++;
          groupStack.push("?");
          segment += "(?:";
        } else {
          segment += ".";
        }
        continue;
      }
      if (glob[i] == "!" && extended && glob[i + 1] == "(") {
        i++;
        groupStack.push("!");
        segment += "(?!";
        continue;
      }
      if (glob[i] == "{") {
        groupStack.push("BRACE");
        segment += "(?:";
        continue;
      }
      if (glob[i] == "}" && groupStack[groupStack.length - 1] == "BRACE") {
        groupStack.pop();
        segment += ")";
        continue;
      }
      if (glob[i] == "," && groupStack[groupStack.length - 1] == "BRACE") {
        segment += "|";
        continue;
      }
      if (glob[i] == "*") {
        if (extended && glob[i + 1] == "(") {
          i++;
          groupStack.push("*");
          segment += "(?:";
        } else {
          const prevChar = glob[i - 1];
          let numStars = 1;
          while (glob[i + 1] == "*") {
            i++;
            numStars++;
          }
          const nextChar = glob[i + 1];
          if (
            globstarOption && numStars == 2 && [
              ...seps,
              undefined,
            ].includes(prevChar) && [
              ...seps,
              undefined,
            ].includes(nextChar)
          ) {
            segment += globstar;
            endsWithSep = true;
          } else {
            segment += wildcard;
          }
        }
        continue;
      }
      segment += regExpEscapeChars.includes(glob[i]) ? `\\${glob[i]}` : glob[i];
    }
    // Check for unclosed groups or a dangling backslash.
    if (groupStack.length > 0 || inRange || inEscape) {
      // Parse failure. Take all characters from this segment literally.
      segment = "";
      for (const c of glob.slice(j, i)) {
        segment += regExpEscapeChars.includes(c) ? `\\${c}` : c;
        endsWithSep = false;
      }
    }
    regExpString += segment;
    if (!endsWithSep) {
      regExpString += i < glob.length ? sep : sepMaybe;
      endsWithSep = true;
    }
    // Terminates with `i` at the start of the next segment.
    while (seps.includes(glob[i])) i++;
    // Check that the next value of `j` is indeed higher than the current value.
    if (!(i > j)) {
      throw new Error("Assertion failure: i > j (potential infinite loop)");
    }
    j = i;
  }
  regExpString = `^${regExpString}$`;
  return new RegExp(regExpString, caseInsensitive ? "i" : "");
}
/** Test whether the given string is a glob */ export function isGlob(str) {
  const chars = {
    "{": "}",
    "(": ")",
    "[": "]",
  };
  const regex =
    /\\(.)|(^!|\*|[\].+)]\?|\[[^\\\]]+\]|\{[^\\}]+\}|\(\?[:!=][^\\)]+\)|\([^|]+\|[^\\)]+\))/;
  if (str === "") {
    return false;
  }
  let match;
  while (match = regex.exec(str)) {
    if (match[2]) return true;
    let idx = match.index + match[0].length;
    // if an open bracket/brace/paren is escaped,
    // set the index to the next closing character
    const open = match[1];
    const close = open ? chars[open] : null;
    if (open && close) {
      const n = str.indexOf(close, idx);
      if (n !== -1) {
        idx = n + 1;
      }
    }
    str = str.slice(idx);
  }
  return false;
}
/** Like normalize(), but doesn't collapse "**\/.." when `globstar` is true. */ export function normalizeGlob(
  glob,
  { globstar = false } = {},
) {
  if (glob.match(/\0/g)) {
    throw new Error(`Glob contains invalid characters: "${glob}"`);
  }
  if (!globstar) {
    return normalize(glob);
  }
  const s = SEP_PATTERN.source;
  const badParentPattern = new RegExp(
    `(?<=(${s}|^)\\*\\*${s})\\.\\.(?=${s}|$)`,
    "g",
  );
  return normalize(glob.replace(badParentPattern, "\0")).replace(/\0/g, "..");
}
/** Like join(), but doesn't collapse "**\/.." when `globstar` is true. */ export function joinGlobs(
  globs,
  { extended = false, globstar = false } = {},
) {
  if (!globstar || globs.length == 0) {
    return join(...globs);
  }
  if (globs.length === 0) return ".";
  let joined;
  for (const glob of globs) {
    const path = glob;
    if (path.length > 0) {
      if (!joined) joined = path;
      else joined += `${SEP}${path}`;
    }
  }
  if (!joined) return ".";
  return normalizeGlob(joined, {
    extended,
    globstar,
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45NS4wL3BhdGgvZ2xvYi50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMSB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgaXNXaW5kb3dzLCBvc1R5cGUgfSBmcm9tIFwiLi4vX3V0aWwvb3MudHNcIjtcbmltcG9ydCB7IFNFUCwgU0VQX1BBVFRFUk4gfSBmcm9tIFwiLi9zZXBhcmF0b3IudHNcIjtcbmltcG9ydCAqIGFzIF93aW4zMiBmcm9tIFwiLi93aW4zMi50c1wiO1xuaW1wb3J0ICogYXMgX3Bvc2l4IGZyb20gXCIuL3Bvc2l4LnRzXCI7XG5cbmNvbnN0IHBhdGggPSBpc1dpbmRvd3MgPyBfd2luMzIgOiBfcG9zaXg7XG5jb25zdCB7IGpvaW4sIG5vcm1hbGl6ZSB9ID0gcGF0aDtcblxuZXhwb3J0IGludGVyZmFjZSBHbG9iT3B0aW9ucyB7XG4gIC8qKiBFeHRlbmRlZCBnbG9iIHN5bnRheC5cbiAgICogU2VlIGh0dHBzOi8vd3d3LmxpbnV4am91cm5hbC5jb20vY29udGVudC9iYXNoLWV4dGVuZGVkLWdsb2JiaW5nLiBEZWZhdWx0c1xuICAgKiB0byB0cnVlLiAqL1xuICBleHRlbmRlZD86IGJvb2xlYW47XG4gIC8qKiBHbG9ic3RhciBzeW50YXguXG4gICAqIFNlZSBodHRwczovL3d3dy5saW51eGpvdXJuYWwuY29tL2NvbnRlbnQvZ2xvYnN0YXItbmV3LWJhc2gtZ2xvYmJpbmctb3B0aW9uLlxuICAgKiBJZiBmYWxzZSwgYCoqYCBpcyB0cmVhdGVkIGxpa2UgYCpgLiBEZWZhdWx0cyB0byB0cnVlLiAqL1xuICBnbG9ic3Rhcj86IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIGdsb2JzdGFyIHNob3VsZCBiZSBjYXNlIGluc2Vuc2l0aXZlLiAqL1xuICBjYXNlSW5zZW5zaXRpdmU/OiBib29sZWFuO1xuICAvKiogT3BlcmF0aW5nIHN5c3RlbS4gRGVmYXVsdHMgdG8gdGhlIG5hdGl2ZSBPUy4gKi9cbiAgb3M/OiB0eXBlb2YgRGVuby5idWlsZC5vcztcbn1cblxuZXhwb3J0IHR5cGUgR2xvYlRvUmVnRXhwT3B0aW9ucyA9IEdsb2JPcHRpb25zO1xuXG4vLyBkZW5vLWZtdC1pZ25vcmVcbmNvbnN0IHJlZ0V4cEVzY2FwZUNoYXJzID0gW1wiIVwiLCBcIiRcIiwgXCIoXCIsIFwiKVwiLCBcIipcIiwgXCIrXCIsIFwiLlwiLCBcIj1cIiwgXCI/XCIsIFwiW1wiLCBcIlxcXFxcIiwgXCJeXCIsIFwie1wiLCBcInxcIl07XG5jb25zdCByYW5nZUVzY2FwZUNoYXJzID0gW1wiLVwiLCBcIlxcXFxcIiwgXCJdXCJdO1xuXG4vKiogQ29udmVydCBhIGdsb2Igc3RyaW5nIHRvIGEgcmVndWxhciBleHByZXNzaW9uLlxuICpcbiAqIFRyaWVzIHRvIG1hdGNoIGJhc2ggZ2xvYiBleHBhbnNpb24gYXMgY2xvc2VseSBhcyBwb3NzaWJsZS5cbiAqXG4gKiBCYXNpYyBnbG9iIHN5bnRheDpcbiAqIC0gYCpgIC0gTWF0Y2hlcyBldmVyeXRoaW5nIHdpdGhvdXQgbGVhdmluZyB0aGUgcGF0aCBzZWdtZW50LlxuICogLSBge2ZvbyxiYXJ9YCAtIE1hdGNoZXMgYGZvb2Agb3IgYGJhcmAuXG4gKiAtIGBbYWJjZF1gIC0gTWF0Y2hlcyBgYWAsIGBiYCwgYGNgIG9yIGBkYC5cbiAqIC0gYFthLWRdYCAtIE1hdGNoZXMgYGFgLCBgYmAsIGBjYCBvciBgZGAuXG4gKiAtIGBbIWFiY2RdYCAtIE1hdGNoZXMgYW55IHNpbmdsZSBjaGFyYWN0ZXIgYmVzaWRlcyBgYWAsIGBiYCwgYGNgIG9yIGBkYC5cbiAqIC0gYFtbOjxjbGFzcz46XV1gIC0gTWF0Y2hlcyBhbnkgY2hhcmFjdGVyIGJlbG9uZ2luZyB0byBgPGNsYXNzPmAuXG4gKiAgICAgLSBgW1s6YWxudW06XV1gIC0gTWF0Y2hlcyBhbnkgZGlnaXQgb3IgbGV0dGVyLlxuICogICAgIC0gYFtbOmRpZ2l0Ol1hYmNdYCAtIE1hdGNoZXMgYW55IGRpZ2l0LCBgYWAsIGBiYCBvciBgY2AuXG4gKiAgICAgLSBTZWUgaHR0cHM6Ly9mYWNlbGVzc3VzZXIuZ2l0aHViLmlvL3djbWF0Y2gvZ2xvYi8jcG9zaXgtY2hhcmFjdGVyLWNsYXNzZXNcbiAqICAgICAgIGZvciBhIGNvbXBsZXRlIGxpc3Qgb2Ygc3VwcG9ydGVkIGNoYXJhY3RlciBjbGFzc2VzLlxuICogLSBgXFxgIC0gRXNjYXBlcyB0aGUgbmV4dCBjaGFyYWN0ZXIgZm9yIGFuIGBvc2Agb3RoZXIgdGhhbiBgXCJ3aW5kb3dzXCJgLlxuICogLSBcXGAgLSBFc2NhcGVzIHRoZSBuZXh0IGNoYXJhY3RlciBmb3IgYG9zYCBzZXQgdG8gYFwid2luZG93c1wiYC5cbiAqIC0gYC9gIC0gUGF0aCBzZXBhcmF0b3IuXG4gKiAtIGBcXGAgLSBBZGRpdGlvbmFsIHBhdGggc2VwYXJhdG9yIG9ubHkgZm9yIGBvc2Agc2V0IHRvIGBcIndpbmRvd3NcImAuXG4gKlxuICogRXh0ZW5kZWQgc3ludGF4OlxuICogLSBSZXF1aXJlcyBgeyBleHRlbmRlZDogdHJ1ZSB9YC5cbiAqIC0gYD8oZm9vfGJhcilgIC0gTWF0Y2hlcyAwIG9yIDEgaW5zdGFuY2Ugb2YgYHtmb28sYmFyfWAuXG4gKiAtIGBAKGZvb3xiYXIpYCAtIE1hdGNoZXMgMSBpbnN0YW5jZSBvZiBge2ZvbyxiYXJ9YC4gVGhleSBiZWhhdmUgdGhlIHNhbWUuXG4gKiAtIGAqKGZvb3xiYXIpYCAtIE1hdGNoZXMgX25fIGluc3RhbmNlcyBvZiBge2ZvbyxiYXJ9YC5cbiAqIC0gYCsoZm9vfGJhcilgIC0gTWF0Y2hlcyBfbiA+IDBfIGluc3RhbmNlcyBvZiBge2ZvbyxiYXJ9YC5cbiAqIC0gYCEoZm9vfGJhcilgIC0gTWF0Y2hlcyBhbnl0aGluZyBvdGhlciB0aGFuIGB7Zm9vLGJhcn1gLlxuICogLSBTZWUgaHR0cHM6Ly93d3cubGludXhqb3VybmFsLmNvbS9jb250ZW50L2Jhc2gtZXh0ZW5kZWQtZ2xvYmJpbmcuXG4gKlxuICogR2xvYnN0YXIgc3ludGF4OlxuICogLSBSZXF1aXJlcyBgeyBnbG9ic3RhcjogdHJ1ZSB9YC5cbiAqIC0gYCoqYCAtIE1hdGNoZXMgYW55IG51bWJlciBvZiBhbnkgcGF0aCBzZWdtZW50cy5cbiAqICAgICAtIE11c3QgY29tcHJpc2UgaXRzIGVudGlyZSBwYXRoIHNlZ21lbnQgaW4gdGhlIHByb3ZpZGVkIGdsb2IuXG4gKiAtIFNlZSBodHRwczovL3d3dy5saW51eGpvdXJuYWwuY29tL2NvbnRlbnQvZ2xvYnN0YXItbmV3LWJhc2gtZ2xvYmJpbmctb3B0aW9uLlxuICpcbiAqIE5vdGUgdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICogLSBUaGUgZ2VuZXJhdGVkIGBSZWdFeHBgIGlzIGFuY2hvcmVkIGF0IGJvdGggc3RhcnQgYW5kIGVuZC5cbiAqIC0gUmVwZWF0aW5nIGFuZCB0cmFpbGluZyBzZXBhcmF0b3JzIGFyZSB0b2xlcmF0ZWQuIFRyYWlsaW5nIHNlcGFyYXRvcnMgaW4gdGhlXG4gKiAgIHByb3ZpZGVkIGdsb2IgaGF2ZSBubyBtZWFuaW5nIGFuZCBhcmUgZGlzY2FyZGVkLlxuICogLSBBYnNvbHV0ZSBnbG9icyB3aWxsIG9ubHkgbWF0Y2ggYWJzb2x1dGUgcGF0aHMsIGV0Yy5cbiAqIC0gRW1wdHkgZ2xvYnMgd2lsbCBtYXRjaCBub3RoaW5nLlxuICogLSBBbnkgc3BlY2lhbCBnbG9iIHN5bnRheCBtdXN0IGJlIGNvbnRhaW5lZCB0byBvbmUgcGF0aCBzZWdtZW50LiBGb3IgZXhhbXBsZSxcbiAqICAgYD8oZm9vfGJhci9iYXopYCBpcyBpbnZhbGlkLiBUaGUgc2VwYXJhdG9yIHdpbGwgdGFrZSBwcmVjZW5kZW5jZSBhbmQgdGhlXG4gKiAgIGZpcnN0IHNlZ21lbnQgZW5kcyB3aXRoIGFuIHVuY2xvc2VkIGdyb3VwLlxuICogLSBJZiBhIHBhdGggc2VnbWVudCBlbmRzIHdpdGggdW5jbG9zZWQgZ3JvdXBzIG9yIGEgZGFuZ2xpbmcgZXNjYXBlIHByZWZpeCwgYVxuICogICBwYXJzZSBlcnJvciBoYXMgb2NjdXJlZC4gRXZlcnkgY2hhcmFjdGVyIGZvciB0aGF0IHNlZ21lbnQgaXMgdGFrZW5cbiAqICAgbGl0ZXJhbGx5IGluIHRoaXMgZXZlbnQuXG4gKlxuICogTGltaXRhdGlvbnM6XG4gKiAtIEEgbmVnYXRpdmUgZ3JvdXAgbGlrZSBgIShmb298YmFyKWAgd2lsbCB3cm9uZ2x5IGJlIGNvbnZlcnRlZCB0byBhIG5lZ2F0aXZlXG4gKiAgIGxvb2stYWhlYWQgZm9sbG93ZWQgYnkgYSB3aWxkY2FyZC4gVGhpcyBtZWFucyB0aGF0IGAhKGZvbykuanNgIHdpbGwgd3JvbmdseVxuICogICBmYWlsIHRvIG1hdGNoIGBmb29iYXIuanNgLCBldmVuIHRob3VnaCBgZm9vYmFyYCBpcyBub3QgYGZvb2AuIEVmZmVjdGl2ZWx5LFxuICogICBgIShmb298YmFyKWAgaXMgdHJlYXRlZCBsaWtlIGAhKEAoZm9vfGJhcikqKWAuIFRoaXMgd2lsbCB3b3JrIGNvcnJlY3RseSBpZlxuICogICB0aGUgZ3JvdXAgb2NjdXJzIG5vdCBuZXN0ZWQgYXQgdGhlIGVuZCBvZiB0aGUgc2VnbWVudC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnbG9iVG9SZWdFeHAoXG4gIGdsb2I6IHN0cmluZyxcbiAge1xuICAgIGV4dGVuZGVkID0gdHJ1ZSxcbiAgICBnbG9ic3RhcjogZ2xvYnN0YXJPcHRpb24gPSB0cnVlLFxuICAgIG9zID0gb3NUeXBlLFxuICAgIGNhc2VJbnNlbnNpdGl2ZSA9IGZhbHNlLFxuICB9OiBHbG9iVG9SZWdFeHBPcHRpb25zID0ge30sXG4pOiBSZWdFeHAge1xuICBpZiAoZ2xvYiA9PSBcIlwiKSB7XG4gICAgcmV0dXJuIC8oPyEpLztcbiAgfVxuXG4gIGNvbnN0IHNlcCA9IG9zID09IFwid2luZG93c1wiID8gXCIoPzpcXFxcXFxcXHwvKStcIiA6IFwiLytcIjtcbiAgY29uc3Qgc2VwTWF5YmUgPSBvcyA9PSBcIndpbmRvd3NcIiA/IFwiKD86XFxcXFxcXFx8LykqXCIgOiBcIi8qXCI7XG4gIGNvbnN0IHNlcHMgPSBvcyA9PSBcIndpbmRvd3NcIiA/IFtcIlxcXFxcIiwgXCIvXCJdIDogW1wiL1wiXTtcbiAgY29uc3QgZ2xvYnN0YXIgPSBvcyA9PSBcIndpbmRvd3NcIlxuICAgID8gXCIoPzpbXlxcXFxcXFxcL10qKD86XFxcXFxcXFx8L3wkKSspKlwiXG4gICAgOiBcIig/OlteL10qKD86L3wkKSspKlwiO1xuICBjb25zdCB3aWxkY2FyZCA9IG9zID09IFwid2luZG93c1wiID8gXCJbXlxcXFxcXFxcL10qXCIgOiBcIlteL10qXCI7XG4gIGNvbnN0IGVzY2FwZVByZWZpeCA9IG9zID09IFwid2luZG93c1wiID8gXCJgXCIgOiBcIlxcXFxcIjtcblxuICAvLyBSZW1vdmUgdHJhaWxpbmcgc2VwYXJhdG9ycy5cbiAgbGV0IG5ld0xlbmd0aCA9IGdsb2IubGVuZ3RoO1xuICBmb3IgKDsgbmV3TGVuZ3RoID4gMSAmJiBzZXBzLmluY2x1ZGVzKGdsb2JbbmV3TGVuZ3RoIC0gMV0pOyBuZXdMZW5ndGgtLSk7XG4gIGdsb2IgPSBnbG9iLnNsaWNlKDAsIG5ld0xlbmd0aCk7XG5cbiAgbGV0IHJlZ0V4cFN0cmluZyA9IFwiXCI7XG5cbiAgLy8gVGVybWluYXRlcyBjb3JyZWN0bHkuIFRydXN0IHRoYXQgYGpgIGlzIGluY3JlbWVudGVkIGV2ZXJ5IGl0ZXJhdGlvbi5cbiAgZm9yIChsZXQgaiA9IDA7IGogPCBnbG9iLmxlbmd0aDspIHtcbiAgICBsZXQgc2VnbWVudCA9IFwiXCI7XG4gICAgY29uc3QgZ3JvdXBTdGFjayA9IFtdO1xuICAgIGxldCBpblJhbmdlID0gZmFsc2U7XG4gICAgbGV0IGluRXNjYXBlID0gZmFsc2U7XG4gICAgbGV0IGVuZHNXaXRoU2VwID0gZmFsc2U7XG4gICAgbGV0IGkgPSBqO1xuXG4gICAgLy8gVGVybWluYXRlcyB3aXRoIGBpYCBhdCB0aGUgbm9uLWluY2x1c2l2ZSBlbmQgb2YgdGhlIGN1cnJlbnQgc2VnbWVudC5cbiAgICBmb3IgKDsgaSA8IGdsb2IubGVuZ3RoICYmICFzZXBzLmluY2x1ZGVzKGdsb2JbaV0pOyBpKyspIHtcbiAgICAgIGlmIChpbkVzY2FwZSkge1xuICAgICAgICBpbkVzY2FwZSA9IGZhbHNlO1xuICAgICAgICBjb25zdCBlc2NhcGVDaGFycyA9IGluUmFuZ2UgPyByYW5nZUVzY2FwZUNoYXJzIDogcmVnRXhwRXNjYXBlQ2hhcnM7XG4gICAgICAgIHNlZ21lbnQgKz0gZXNjYXBlQ2hhcnMuaW5jbHVkZXMoZ2xvYltpXSkgPyBgXFxcXCR7Z2xvYltpXX1gIDogZ2xvYltpXTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09IGVzY2FwZVByZWZpeCkge1xuICAgICAgICBpbkVzY2FwZSA9IHRydWU7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZ2xvYltpXSA9PSBcIltcIikge1xuICAgICAgICBpZiAoIWluUmFuZ2UpIHtcbiAgICAgICAgICBpblJhbmdlID0gdHJ1ZTtcbiAgICAgICAgICBzZWdtZW50ICs9IFwiW1wiO1xuICAgICAgICAgIGlmIChnbG9iW2kgKyAxXSA9PSBcIiFcIikge1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgc2VnbWVudCArPSBcIl5cIjtcbiAgICAgICAgICB9IGVsc2UgaWYgKGdsb2JbaSArIDFdID09IFwiXlwiKSB7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgICAgICBzZWdtZW50ICs9IFwiXFxcXF5cIjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gZWxzZSBpZiAoZ2xvYltpICsgMV0gPT0gXCI6XCIpIHtcbiAgICAgICAgICBsZXQgayA9IGkgKyAxO1xuICAgICAgICAgIGxldCB2YWx1ZSA9IFwiXCI7XG4gICAgICAgICAgd2hpbGUgKGdsb2JbayArIDFdICE9IG51bGwgJiYgZ2xvYltrICsgMV0gIT0gXCI6XCIpIHtcbiAgICAgICAgICAgIHZhbHVlICs9IGdsb2JbayArIDFdO1xuICAgICAgICAgICAgaysrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZ2xvYltrICsgMV0gPT0gXCI6XCIgJiYgZ2xvYltrICsgMl0gPT0gXCJdXCIpIHtcbiAgICAgICAgICAgIGkgPSBrICsgMjtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcImFsbnVtXCIpIHNlZ21lbnQgKz0gXCJcXFxcZEEtWmEtelwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT0gXCJhbHBoYVwiKSBzZWdtZW50ICs9IFwiQS1aYS16XCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PSBcImFzY2lpXCIpIHNlZ21lbnQgKz0gXCJcXHgwMC1cXHg3RlwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT0gXCJibGFua1wiKSBzZWdtZW50ICs9IFwiXFx0IFwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT0gXCJjbnRybFwiKSBzZWdtZW50ICs9IFwiXFx4MDAtXFx4MUZcXHg3RlwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT0gXCJkaWdpdFwiKSBzZWdtZW50ICs9IFwiXFxcXGRcIjtcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlID09IFwiZ3JhcGhcIikgc2VnbWVudCArPSBcIlxceDIxLVxceDdFXCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PSBcImxvd2VyXCIpIHNlZ21lbnQgKz0gXCJhLXpcIjtcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlID09IFwicHJpbnRcIikgc2VnbWVudCArPSBcIlxceDIwLVxceDdFXCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PSBcInB1bmN0XCIpIHtcbiAgICAgICAgICAgICAgc2VnbWVudCArPSBcIiFcXFwiIyQlJicoKSorLFxcXFwtLi86Ozw9Pj9AW1xcXFxcXFxcXFxcXF1eX+KAmHt8fX5cIjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT0gXCJzcGFjZVwiKSBzZWdtZW50ICs9IFwiXFxcXHNcXHZcIjtcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlID09IFwidXBwZXJcIikgc2VnbWVudCArPSBcIkEtWlwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT0gXCJ3b3JkXCIpIHNlZ21lbnQgKz0gXCJcXFxcd1wiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT0gXCJ4ZGlnaXRcIikgc2VnbWVudCArPSBcIlxcXFxkQS1GYS1mXCI7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGdsb2JbaV0gPT0gXCJdXCIgJiYgaW5SYW5nZSkge1xuICAgICAgICBpblJhbmdlID0gZmFsc2U7XG4gICAgICAgIHNlZ21lbnQgKz0gXCJdXCI7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoaW5SYW5nZSkge1xuICAgICAgICBpZiAoZ2xvYltpXSA9PSBcIlxcXFxcIikge1xuICAgICAgICAgIHNlZ21lbnQgKz0gYFxcXFxcXFxcYDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZWdtZW50ICs9IGdsb2JbaV07XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChcbiAgICAgICAgZ2xvYltpXSA9PSBcIilcIiAmJiBncm91cFN0YWNrLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgZ3JvdXBTdGFja1tncm91cFN0YWNrLmxlbmd0aCAtIDFdICE9IFwiQlJBQ0VcIlxuICAgICAgKSB7XG4gICAgICAgIHNlZ21lbnQgKz0gXCIpXCI7XG4gICAgICAgIGNvbnN0IHR5cGUgPSBncm91cFN0YWNrLnBvcCgpITtcbiAgICAgICAgaWYgKHR5cGUgPT0gXCIhXCIpIHtcbiAgICAgICAgICBzZWdtZW50ICs9IHdpbGRjYXJkO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgIT0gXCJAXCIpIHtcbiAgICAgICAgICBzZWdtZW50ICs9IHR5cGU7XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChcbiAgICAgICAgZ2xvYltpXSA9PSBcInxcIiAmJiBncm91cFN0YWNrLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgZ3JvdXBTdGFja1tncm91cFN0YWNrLmxlbmd0aCAtIDFdICE9IFwiQlJBQ0VcIlxuICAgICAgKSB7XG4gICAgICAgIHNlZ21lbnQgKz0gXCJ8XCI7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZ2xvYltpXSA9PSBcIitcIiAmJiBleHRlbmRlZCAmJiBnbG9iW2kgKyAxXSA9PSBcIihcIikge1xuICAgICAgICBpKys7XG4gICAgICAgIGdyb3VwU3RhY2sucHVzaChcIitcIik7XG4gICAgICAgIHNlZ21lbnQgKz0gXCIoPzpcIjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09IFwiQFwiICYmIGV4dGVuZGVkICYmIGdsb2JbaSArIDFdID09IFwiKFwiKSB7XG4gICAgICAgIGkrKztcbiAgICAgICAgZ3JvdXBTdGFjay5wdXNoKFwiQFwiKTtcbiAgICAgICAgc2VnbWVudCArPSBcIig/OlwiO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGdsb2JbaV0gPT0gXCI/XCIpIHtcbiAgICAgICAgaWYgKGV4dGVuZGVkICYmIGdsb2JbaSArIDFdID09IFwiKFwiKSB7XG4gICAgICAgICAgaSsrO1xuICAgICAgICAgIGdyb3VwU3RhY2sucHVzaChcIj9cIik7XG4gICAgICAgICAgc2VnbWVudCArPSBcIig/OlwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlZ21lbnQgKz0gXCIuXCI7XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09IFwiIVwiICYmIGV4dGVuZGVkICYmIGdsb2JbaSArIDFdID09IFwiKFwiKSB7XG4gICAgICAgIGkrKztcbiAgICAgICAgZ3JvdXBTdGFjay5wdXNoKFwiIVwiKTtcbiAgICAgICAgc2VnbWVudCArPSBcIig/IVwiO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGdsb2JbaV0gPT0gXCJ7XCIpIHtcbiAgICAgICAgZ3JvdXBTdGFjay5wdXNoKFwiQlJBQ0VcIik7XG4gICAgICAgIHNlZ21lbnQgKz0gXCIoPzpcIjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09IFwifVwiICYmIGdyb3VwU3RhY2tbZ3JvdXBTdGFjay5sZW5ndGggLSAxXSA9PSBcIkJSQUNFXCIpIHtcbiAgICAgICAgZ3JvdXBTdGFjay5wb3AoKTtcbiAgICAgICAgc2VnbWVudCArPSBcIilcIjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09IFwiLFwiICYmIGdyb3VwU3RhY2tbZ3JvdXBTdGFjay5sZW5ndGggLSAxXSA9PSBcIkJSQUNFXCIpIHtcbiAgICAgICAgc2VnbWVudCArPSBcInxcIjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09IFwiKlwiKSB7XG4gICAgICAgIGlmIChleHRlbmRlZCAmJiBnbG9iW2kgKyAxXSA9PSBcIihcIikge1xuICAgICAgICAgIGkrKztcbiAgICAgICAgICBncm91cFN0YWNrLnB1c2goXCIqXCIpO1xuICAgICAgICAgIHNlZ21lbnQgKz0gXCIoPzpcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBwcmV2Q2hhciA9IGdsb2JbaSAtIDFdO1xuICAgICAgICAgIGxldCBudW1TdGFycyA9IDE7XG4gICAgICAgICAgd2hpbGUgKGdsb2JbaSArIDFdID09IFwiKlwiKSB7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgICAgICBudW1TdGFycysrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBuZXh0Q2hhciA9IGdsb2JbaSArIDFdO1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIGdsb2JzdGFyT3B0aW9uICYmIG51bVN0YXJzID09IDIgJiZcbiAgICAgICAgICAgIFsuLi5zZXBzLCB1bmRlZmluZWRdLmluY2x1ZGVzKHByZXZDaGFyKSAmJlxuICAgICAgICAgICAgWy4uLnNlcHMsIHVuZGVmaW5lZF0uaW5jbHVkZXMobmV4dENoYXIpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBzZWdtZW50ICs9IGdsb2JzdGFyO1xuICAgICAgICAgICAgZW5kc1dpdGhTZXAgPSB0cnVlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWdtZW50ICs9IHdpbGRjYXJkO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgc2VnbWVudCArPSByZWdFeHBFc2NhcGVDaGFycy5pbmNsdWRlcyhnbG9iW2ldKSA/IGBcXFxcJHtnbG9iW2ldfWAgOiBnbG9iW2ldO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciB1bmNsb3NlZCBncm91cHMgb3IgYSBkYW5nbGluZyBiYWNrc2xhc2guXG4gICAgaWYgKGdyb3VwU3RhY2subGVuZ3RoID4gMCB8fCBpblJhbmdlIHx8IGluRXNjYXBlKSB7XG4gICAgICAvLyBQYXJzZSBmYWlsdXJlLiBUYWtlIGFsbCBjaGFyYWN0ZXJzIGZyb20gdGhpcyBzZWdtZW50IGxpdGVyYWxseS5cbiAgICAgIHNlZ21lbnQgPSBcIlwiO1xuICAgICAgZm9yIChjb25zdCBjIG9mIGdsb2Iuc2xpY2UoaiwgaSkpIHtcbiAgICAgICAgc2VnbWVudCArPSByZWdFeHBFc2NhcGVDaGFycy5pbmNsdWRlcyhjKSA/IGBcXFxcJHtjfWAgOiBjO1xuICAgICAgICBlbmRzV2l0aFNlcCA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJlZ0V4cFN0cmluZyArPSBzZWdtZW50O1xuICAgIGlmICghZW5kc1dpdGhTZXApIHtcbiAgICAgIHJlZ0V4cFN0cmluZyArPSBpIDwgZ2xvYi5sZW5ndGggPyBzZXAgOiBzZXBNYXliZTtcbiAgICAgIGVuZHNXaXRoU2VwID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBUZXJtaW5hdGVzIHdpdGggYGlgIGF0IHRoZSBzdGFydCBvZiB0aGUgbmV4dCBzZWdtZW50LlxuICAgIHdoaWxlIChzZXBzLmluY2x1ZGVzKGdsb2JbaV0pKSBpKys7XG5cbiAgICAvLyBDaGVjayB0aGF0IHRoZSBuZXh0IHZhbHVlIG9mIGBqYCBpcyBpbmRlZWQgaGlnaGVyIHRoYW4gdGhlIGN1cnJlbnQgdmFsdWUuXG4gICAgaWYgKCEoaSA+IGopKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBc3NlcnRpb24gZmFpbHVyZTogaSA+IGogKHBvdGVudGlhbCBpbmZpbml0ZSBsb29wKVwiKTtcbiAgICB9XG4gICAgaiA9IGk7XG4gIH1cblxuICByZWdFeHBTdHJpbmcgPSBgXiR7cmVnRXhwU3RyaW5nfSRgO1xuICByZXR1cm4gbmV3IFJlZ0V4cChyZWdFeHBTdHJpbmcsIGNhc2VJbnNlbnNpdGl2ZSA/IFwiaVwiIDogXCJcIik7XG59XG5cbi8qKiBUZXN0IHdoZXRoZXIgdGhlIGdpdmVuIHN0cmluZyBpcyBhIGdsb2IgKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0dsb2Ioc3RyOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgY2hhcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7IFwie1wiOiBcIn1cIiwgXCIoXCI6IFwiKVwiLCBcIltcIjogXCJdXCIgfTtcbiAgY29uc3QgcmVnZXggPVxuICAgIC9cXFxcKC4pfCheIXxcXCp8W1xcXS4rKV1cXD98XFxbW15cXFxcXFxdXStcXF18XFx7W15cXFxcfV0rXFx9fFxcKFxcP1s6IT1dW15cXFxcKV0rXFwpfFxcKFtefF0rXFx8W15cXFxcKV0rXFwpKS87XG5cbiAgaWYgKHN0ciA9PT0gXCJcIikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGxldCBtYXRjaDogUmVnRXhwRXhlY0FycmF5IHwgbnVsbDtcblxuICB3aGlsZSAoKG1hdGNoID0gcmVnZXguZXhlYyhzdHIpKSkge1xuICAgIGlmIChtYXRjaFsyXSkgcmV0dXJuIHRydWU7XG4gICAgbGV0IGlkeCA9IG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoO1xuXG4gICAgLy8gaWYgYW4gb3BlbiBicmFja2V0L2JyYWNlL3BhcmVuIGlzIGVzY2FwZWQsXG4gICAgLy8gc2V0IHRoZSBpbmRleCB0byB0aGUgbmV4dCBjbG9zaW5nIGNoYXJhY3RlclxuICAgIGNvbnN0IG9wZW4gPSBtYXRjaFsxXTtcbiAgICBjb25zdCBjbG9zZSA9IG9wZW4gPyBjaGFyc1tvcGVuXSA6IG51bGw7XG4gICAgaWYgKG9wZW4gJiYgY2xvc2UpIHtcbiAgICAgIGNvbnN0IG4gPSBzdHIuaW5kZXhPZihjbG9zZSwgaWR4KTtcbiAgICAgIGlmIChuICE9PSAtMSkge1xuICAgICAgICBpZHggPSBuICsgMTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzdHIgPSBzdHIuc2xpY2UoaWR4KTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqIExpa2Ugbm9ybWFsaXplKCksIGJ1dCBkb2Vzbid0IGNvbGxhcHNlIFwiKipcXC8uLlwiIHdoZW4gYGdsb2JzdGFyYCBpcyB0cnVlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUdsb2IoXG4gIGdsb2I6IHN0cmluZyxcbiAgeyBnbG9ic3RhciA9IGZhbHNlIH06IEdsb2JPcHRpb25zID0ge30sXG4pOiBzdHJpbmcge1xuICBpZiAoZ2xvYi5tYXRjaCgvXFwwL2cpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBHbG9iIGNvbnRhaW5zIGludmFsaWQgY2hhcmFjdGVyczogXCIke2dsb2J9XCJgKTtcbiAgfVxuICBpZiAoIWdsb2JzdGFyKSB7XG4gICAgcmV0dXJuIG5vcm1hbGl6ZShnbG9iKTtcbiAgfVxuICBjb25zdCBzID0gU0VQX1BBVFRFUk4uc291cmNlO1xuICBjb25zdCBiYWRQYXJlbnRQYXR0ZXJuID0gbmV3IFJlZ0V4cChcbiAgICBgKD88PSgke3N9fF4pXFxcXCpcXFxcKiR7c30pXFxcXC5cXFxcLig/PSR7c318JClgLFxuICAgIFwiZ1wiLFxuICApO1xuICByZXR1cm4gbm9ybWFsaXplKGdsb2IucmVwbGFjZShiYWRQYXJlbnRQYXR0ZXJuLCBcIlxcMFwiKSkucmVwbGFjZSgvXFwwL2csIFwiLi5cIik7XG59XG5cbi8qKiBMaWtlIGpvaW4oKSwgYnV0IGRvZXNuJ3QgY29sbGFwc2UgXCIqKlxcLy4uXCIgd2hlbiBgZ2xvYnN0YXJgIGlzIHRydWUuICovXG5leHBvcnQgZnVuY3Rpb24gam9pbkdsb2JzKFxuICBnbG9iczogc3RyaW5nW10sXG4gIHsgZXh0ZW5kZWQgPSBmYWxzZSwgZ2xvYnN0YXIgPSBmYWxzZSB9OiBHbG9iT3B0aW9ucyA9IHt9LFxuKTogc3RyaW5nIHtcbiAgaWYgKCFnbG9ic3RhciB8fCBnbG9icy5sZW5ndGggPT0gMCkge1xuICAgIHJldHVybiBqb2luKC4uLmdsb2JzKTtcbiAgfVxuICBpZiAoZ2xvYnMubGVuZ3RoID09PSAwKSByZXR1cm4gXCIuXCI7XG4gIGxldCBqb2luZWQ6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgZm9yIChjb25zdCBnbG9iIG9mIGdsb2JzKSB7XG4gICAgY29uc3QgcGF0aCA9IGdsb2I7XG4gICAgaWYgKHBhdGgubGVuZ3RoID4gMCkge1xuICAgICAgaWYgKCFqb2luZWQpIGpvaW5lZCA9IHBhdGg7XG4gICAgICBlbHNlIGpvaW5lZCArPSBgJHtTRVB9JHtwYXRofWA7XG4gICAgfVxuICB9XG4gIGlmICgham9pbmVkKSByZXR1cm4gXCIuXCI7XG4gIHJldHVybiBub3JtYWxpemVHbG9iKGpvaW5lZCwgeyBleHRlbmRlZCwgZ2xvYnN0YXIgfSk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUFB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
