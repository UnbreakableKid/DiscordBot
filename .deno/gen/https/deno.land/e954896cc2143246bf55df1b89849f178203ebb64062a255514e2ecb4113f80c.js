// globToRegExp() is originall ported from globrex@0.1.2.
// Copyright 2018 Terkel Gjervig Nielsen. All rights reserved. MIT license.
// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { NATIVE_OS } from "./_constants.ts";
import { join, normalize } from "./mod.ts";
import { SEP, SEP_PATTERN } from "./separator.ts";
/** Convert a glob string to a regular expressions.
 *
 *      // Looking for all the `ts` files:
 *      walkSync(".", {
 *        match: [globToRegExp("*.ts")]
 *      });
 *
 *      Looking for all the `.json` files in any subfolder:
 *      walkSync(".", {
 *        match: [globToRegExp(join("a", "**", "*.json"), {
 *          extended: true,
 *          globstar: true
 *        })]
 *      }); */ export function globToRegExp(
  glob,
  { extended = true, globstar: globstarOption = true, os = NATIVE_OS } = {},
) {
  const sep = os == "windows" ? `(?:\\\\|\\/)+` : `\\/+`;
  const sepMaybe = os == "windows" ? `(?:\\\\|\\/)*` : `\\/*`;
  const seps = os == "windows"
    ? [
      "\\",
      "/",
    ]
    : [
      "/",
    ];
  const sepRaw = os == "windows" ? `\\` : `/`;
  const globstar = os == "windows"
    ? `(?:[^\\\\/]*(?:\\\\|\\/|$)+)*`
    : `(?:[^/]*(?:\\/|$)+)*`;
  const wildcard = os == "windows" ? `[^\\\\/]*` : `[^/]*`;
  // Keep track of scope for extended syntaxes.
  const extStack = [];
  // If we are doing extended matching, this boolean is true when we are inside
  // a group (eg {*.html,*.js}), and false otherwise.
  let inGroup = false;
  let inRange = false;
  let regExpString = "";
  // Remove trailing separators.
  let newLength = glob.length;
  for (; newLength > 0 && seps.includes(glob[newLength - 1]); newLength--);
  glob = glob.slice(0, newLength);
  let c, n;
  for (let i = 0; i < glob.length; i++) {
    c = glob[i];
    n = glob[i + 1];
    if (seps.includes(c)) {
      regExpString += sep;
      while (seps.includes(glob[i + 1])) i++;
      continue;
    }
    if (c == "[") {
      if (inRange && n == ":") {
        i++; // skip [
        let value = "";
        while (glob[++i] !== ":") value += glob[i];
        if (value == "alnum") regExpString += "\\w\\d";
        else if (value == "space") regExpString += "\\s";
        else if (value == "digit") regExpString += "\\d";
        i++; // skip last ]
        continue;
      }
      inRange = true;
      regExpString += c;
      continue;
    }
    if (c == "]") {
      inRange = false;
      regExpString += c;
      continue;
    }
    if (c == "!") {
      if (inRange) {
        if (glob[i - 1] == "[") {
          regExpString += "^";
          continue;
        }
      } else if (extended) {
        if (n == "(") {
          extStack.push(c);
          regExpString += "(?!";
          i++;
          continue;
        }
        regExpString += `\\${c}`;
        continue;
      } else {
        regExpString += `\\${c}`;
        continue;
      }
    }
    if (inRange) {
      if (c == "\\" || c == "^" && glob[i - 1] == "[") regExpString += `\\${c}`;
      else regExpString += c;
      continue;
    }
    if (
      [
        "\\",
        "$",
        "^",
        ".",
        "=",
      ].includes(c)
    ) {
      regExpString += `\\${c}`;
      continue;
    }
    if (c == "(") {
      if (extStack.length) {
        regExpString += `${c}?:`;
        continue;
      }
      regExpString += `\\${c}`;
      continue;
    }
    if (c == ")") {
      if (extStack.length) {
        regExpString += c;
        const type = extStack.pop();
        if (type == "@") {
          regExpString += "{1}";
        } else if (type == "!") {
          regExpString += wildcard;
        } else {
          regExpString += type;
        }
        continue;
      }
      regExpString += `\\${c}`;
      continue;
    }
    if (c == "|") {
      if (extStack.length) {
        regExpString += c;
        continue;
      }
      regExpString += `\\${c}`;
      continue;
    }
    if (c == "+") {
      if (n == "(" && extended) {
        extStack.push(c);
        continue;
      }
      regExpString += `\\${c}`;
      continue;
    }
    if (c == "@" && extended) {
      if (n == "(") {
        extStack.push(c);
        continue;
      }
    }
    if (c == "?") {
      if (extended) {
        if (n == "(") {
          extStack.push(c);
        }
        continue;
      } else {
        regExpString += ".";
        continue;
      }
    }
    if (c == "{") {
      inGroup = true;
      regExpString += "(?:";
      continue;
    }
    if (c == "}") {
      inGroup = false;
      regExpString += ")";
      continue;
    }
    if (c == ",") {
      if (inGroup) {
        regExpString += "|";
        continue;
      }
      regExpString += `\\${c}`;
      continue;
    }
    if (c == "*") {
      if (n == "(" && extended) {
        extStack.push(c);
        continue;
      }
      // Move over all consecutive "*"'s.
      // Also store the previous and next characters
      const prevChar = glob[i - 1];
      let starCount = 1;
      while (glob[i + 1] == "*") {
        starCount++;
        i++;
      }
      const nextChar = glob[i + 1];
      const isGlobstar = globstarOption && starCount > 1 && // from the start of the segment
        [
          sepRaw,
          "/",
          undefined,
        ].includes(prevChar) && // to the end of the segment
        [
          sepRaw,
          "/",
          undefined,
        ].includes(nextChar);
      if (isGlobstar) {
        // it's a globstar, so match zero or more path segments
        regExpString += globstar;
        while (seps.includes(glob[i + 1])) i++;
      } else {
        // it's not a globstar, so only match one path segment
        regExpString += wildcard;
      }
      continue;
    }
    regExpString += c;
  }
  regExpString = `^${regExpString}${regExpString != "" ? sepMaybe : ""}$`;
  return new RegExp(regExpString);
}
/** Test whether the given string is a glob */ export function isGlob(str) {
  const chars = {
    "{": "}",
    "(": ")",
    "[": "]",
  };
  /* eslint-disable-next-line max-len */ const regex =
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC43MS4wL3BhdGgvZ2xvYi50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLy8gZ2xvYlRvUmVnRXhwKCkgaXMgb3JpZ2luYWxsIHBvcnRlZCBmcm9tIGdsb2JyZXhAMC4xLjIuXG4vLyBDb3B5cmlnaHQgMjAxOCBUZXJrZWwgR2plcnZpZyBOaWVsc2VuLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIENvcHlyaWdodCAyMDE4LTIwMjAgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IE5BVElWRV9PUyB9IGZyb20gXCIuL19jb25zdGFudHMudHNcIjtcbmltcG9ydCB7IGpvaW4sIG5vcm1hbGl6ZSB9IGZyb20gXCIuL21vZC50c1wiO1xuaW1wb3J0IHsgU0VQLCBTRVBfUEFUVEVSTiB9IGZyb20gXCIuL3NlcGFyYXRvci50c1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEdsb2JPcHRpb25zIHtcbiAgLyoqIEV4dGVuZGVkIGdsb2Igc3ludGF4LlxuICAgKiBTZWUgaHR0cHM6Ly93d3cubGludXhqb3VybmFsLmNvbS9jb250ZW50L2Jhc2gtZXh0ZW5kZWQtZ2xvYmJpbmcuIERlZmF1bHRzXG4gICAqIHRvIHRydWUuICovXG4gIGV4dGVuZGVkPzogYm9vbGVhbjtcbiAgLyoqIEdsb2JzdGFyIHN5bnRheC5cbiAgICogU2VlIGh0dHBzOi8vd3d3LmxpbnV4am91cm5hbC5jb20vY29udGVudC9nbG9ic3Rhci1uZXctYmFzaC1nbG9iYmluZy1vcHRpb24uXG4gICAqIElmIGZhbHNlLCBgKipgIGlzIHRyZWF0ZWQgbGlrZSBgKmAuIERlZmF1bHRzIHRvIHRydWUuICovXG4gIGdsb2JzdGFyPzogYm9vbGVhbjtcbiAgLyoqIE9wZXJhdGluZyBzeXN0ZW0uIERlZmF1bHRzIHRvIHRoZSBuYXRpdmUgT1MuICovXG4gIG9zPzogdHlwZW9mIERlbm8uYnVpbGQub3M7XG59XG5cbmV4cG9ydCB0eXBlIEdsb2JUb1JlZ0V4cE9wdGlvbnMgPSBHbG9iT3B0aW9ucztcblxuLyoqIENvbnZlcnQgYSBnbG9iIHN0cmluZyB0byBhIHJlZ3VsYXIgZXhwcmVzc2lvbnMuXG4gKlxuICogICAgICAvLyBMb29raW5nIGZvciBhbGwgdGhlIGB0c2AgZmlsZXM6XG4gKiAgICAgIHdhbGtTeW5jKFwiLlwiLCB7XG4gKiAgICAgICAgbWF0Y2g6IFtnbG9iVG9SZWdFeHAoXCIqLnRzXCIpXVxuICogICAgICB9KTtcbiAqXG4gKiAgICAgIExvb2tpbmcgZm9yIGFsbCB0aGUgYC5qc29uYCBmaWxlcyBpbiBhbnkgc3ViZm9sZGVyOlxuICogICAgICB3YWxrU3luYyhcIi5cIiwge1xuICogICAgICAgIG1hdGNoOiBbZ2xvYlRvUmVnRXhwKGpvaW4oXCJhXCIsIFwiKipcIiwgXCIqLmpzb25cIiksIHtcbiAqICAgICAgICAgIGV4dGVuZGVkOiB0cnVlLFxuICogICAgICAgICAgZ2xvYnN0YXI6IHRydWVcbiAqICAgICAgICB9KV1cbiAqICAgICAgfSk7ICovXG5leHBvcnQgZnVuY3Rpb24gZ2xvYlRvUmVnRXhwKFxuICBnbG9iOiBzdHJpbmcsXG4gIHsgZXh0ZW5kZWQgPSB0cnVlLCBnbG9ic3RhcjogZ2xvYnN0YXJPcHRpb24gPSB0cnVlLCBvcyA9IE5BVElWRV9PUyB9OlxuICAgIEdsb2JUb1JlZ0V4cE9wdGlvbnMgPSB7fSxcbik6IFJlZ0V4cCB7XG4gIGNvbnN0IHNlcCA9IG9zID09IFwid2luZG93c1wiID8gYCg/OlxcXFxcXFxcfFxcXFwvKStgIDogYFxcXFwvK2A7XG4gIGNvbnN0IHNlcE1heWJlID0gb3MgPT0gXCJ3aW5kb3dzXCIgPyBgKD86XFxcXFxcXFx8XFxcXC8pKmAgOiBgXFxcXC8qYDtcbiAgY29uc3Qgc2VwcyA9IG9zID09IFwid2luZG93c1wiID8gW1wiXFxcXFwiLCBcIi9cIl0gOiBbXCIvXCJdO1xuICBjb25zdCBzZXBSYXcgPSBvcyA9PSBcIndpbmRvd3NcIiA/IGBcXFxcYCA6IGAvYDtcbiAgY29uc3QgZ2xvYnN0YXIgPSBvcyA9PSBcIndpbmRvd3NcIlxuICAgID8gYCg/OlteXFxcXFxcXFwvXSooPzpcXFxcXFxcXHxcXFxcL3wkKSspKmBcbiAgICA6IGAoPzpbXi9dKig/OlxcXFwvfCQpKykqYDtcbiAgY29uc3Qgd2lsZGNhcmQgPSBvcyA9PSBcIndpbmRvd3NcIiA/IGBbXlxcXFxcXFxcL10qYCA6IGBbXi9dKmA7XG5cbiAgLy8gS2VlcCB0cmFjayBvZiBzY29wZSBmb3IgZXh0ZW5kZWQgc3ludGF4ZXMuXG4gIGNvbnN0IGV4dFN0YWNrID0gW107XG5cbiAgLy8gSWYgd2UgYXJlIGRvaW5nIGV4dGVuZGVkIG1hdGNoaW5nLCB0aGlzIGJvb2xlYW4gaXMgdHJ1ZSB3aGVuIHdlIGFyZSBpbnNpZGVcbiAgLy8gYSBncm91cCAoZWcgeyouaHRtbCwqLmpzfSksIGFuZCBmYWxzZSBvdGhlcndpc2UuXG4gIGxldCBpbkdyb3VwID0gZmFsc2U7XG4gIGxldCBpblJhbmdlID0gZmFsc2U7XG5cbiAgbGV0IHJlZ0V4cFN0cmluZyA9IFwiXCI7XG5cbiAgLy8gUmVtb3ZlIHRyYWlsaW5nIHNlcGFyYXRvcnMuXG4gIGxldCBuZXdMZW5ndGggPSBnbG9iLmxlbmd0aDtcbiAgZm9yICg7IG5ld0xlbmd0aCA+IDAgJiYgc2Vwcy5pbmNsdWRlcyhnbG9iW25ld0xlbmd0aCAtIDFdKTsgbmV3TGVuZ3RoLS0pO1xuICBnbG9iID0gZ2xvYi5zbGljZSgwLCBuZXdMZW5ndGgpO1xuXG4gIGxldCBjLCBuO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGdsb2IubGVuZ3RoOyBpKyspIHtcbiAgICBjID0gZ2xvYltpXTtcbiAgICBuID0gZ2xvYltpICsgMV07XG5cbiAgICBpZiAoc2Vwcy5pbmNsdWRlcyhjKSkge1xuICAgICAgcmVnRXhwU3RyaW5nICs9IHNlcDtcbiAgICAgIHdoaWxlIChzZXBzLmluY2x1ZGVzKGdsb2JbaSArIDFdKSkgaSsrO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGMgPT0gXCJbXCIpIHtcbiAgICAgIGlmIChpblJhbmdlICYmIG4gPT0gXCI6XCIpIHtcbiAgICAgICAgaSsrOyAvLyBza2lwIFtcbiAgICAgICAgbGV0IHZhbHVlID0gXCJcIjtcbiAgICAgICAgd2hpbGUgKGdsb2JbKytpXSAhPT0gXCI6XCIpIHZhbHVlICs9IGdsb2JbaV07XG4gICAgICAgIGlmICh2YWx1ZSA9PSBcImFsbnVtXCIpIHJlZ0V4cFN0cmluZyArPSBcIlxcXFx3XFxcXGRcIjtcbiAgICAgICAgZWxzZSBpZiAodmFsdWUgPT0gXCJzcGFjZVwiKSByZWdFeHBTdHJpbmcgKz0gXCJcXFxcc1wiO1xuICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PSBcImRpZ2l0XCIpIHJlZ0V4cFN0cmluZyArPSBcIlxcXFxkXCI7XG4gICAgICAgIGkrKzsgLy8gc2tpcCBsYXN0IF1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpblJhbmdlID0gdHJ1ZTtcbiAgICAgIHJlZ0V4cFN0cmluZyArPSBjO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGMgPT0gXCJdXCIpIHtcbiAgICAgIGluUmFuZ2UgPSBmYWxzZTtcbiAgICAgIHJlZ0V4cFN0cmluZyArPSBjO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGMgPT0gXCIhXCIpIHtcbiAgICAgIGlmIChpblJhbmdlKSB7XG4gICAgICAgIGlmIChnbG9iW2kgLSAxXSA9PSBcIltcIikge1xuICAgICAgICAgIHJlZ0V4cFN0cmluZyArPSBcIl5cIjtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChleHRlbmRlZCkge1xuICAgICAgICBpZiAobiA9PSBcIihcIikge1xuICAgICAgICAgIGV4dFN0YWNrLnB1c2goYyk7XG4gICAgICAgICAgcmVnRXhwU3RyaW5nICs9IFwiKD8hXCI7XG4gICAgICAgICAgaSsrO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHJlZ0V4cFN0cmluZyArPSBgXFxcXCR7Y31gO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlZ0V4cFN0cmluZyArPSBgXFxcXCR7Y31gO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaW5SYW5nZSkge1xuICAgICAgaWYgKGMgPT0gXCJcXFxcXCIgfHwgYyA9PSBcIl5cIiAmJiBnbG9iW2kgLSAxXSA9PSBcIltcIikgcmVnRXhwU3RyaW5nICs9IGBcXFxcJHtjfWA7XG4gICAgICBlbHNlIHJlZ0V4cFN0cmluZyArPSBjO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKFtcIlxcXFxcIiwgXCIkXCIsIFwiXlwiLCBcIi5cIiwgXCI9XCJdLmluY2x1ZGVzKGMpKSB7XG4gICAgICByZWdFeHBTdHJpbmcgKz0gYFxcXFwke2N9YDtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjID09IFwiKFwiKSB7XG4gICAgICBpZiAoZXh0U3RhY2subGVuZ3RoKSB7XG4gICAgICAgIHJlZ0V4cFN0cmluZyArPSBgJHtjfT86YDtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICByZWdFeHBTdHJpbmcgKz0gYFxcXFwke2N9YDtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjID09IFwiKVwiKSB7XG4gICAgICBpZiAoZXh0U3RhY2subGVuZ3RoKSB7XG4gICAgICAgIHJlZ0V4cFN0cmluZyArPSBjO1xuICAgICAgICBjb25zdCB0eXBlID0gZXh0U3RhY2sucG9wKCkhO1xuICAgICAgICBpZiAodHlwZSA9PSBcIkBcIikge1xuICAgICAgICAgIHJlZ0V4cFN0cmluZyArPSBcInsxfVwiO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT0gXCIhXCIpIHtcbiAgICAgICAgICByZWdFeHBTdHJpbmcgKz0gd2lsZGNhcmQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVnRXhwU3RyaW5nICs9IHR5cGU7XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICByZWdFeHBTdHJpbmcgKz0gYFxcXFwke2N9YDtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjID09IFwifFwiKSB7XG4gICAgICBpZiAoZXh0U3RhY2subGVuZ3RoKSB7XG4gICAgICAgIHJlZ0V4cFN0cmluZyArPSBjO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHJlZ0V4cFN0cmluZyArPSBgXFxcXCR7Y31gO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGMgPT0gXCIrXCIpIHtcbiAgICAgIGlmIChuID09IFwiKFwiICYmIGV4dGVuZGVkKSB7XG4gICAgICAgIGV4dFN0YWNrLnB1c2goYyk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgcmVnRXhwU3RyaW5nICs9IGBcXFxcJHtjfWA7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoYyA9PSBcIkBcIiAmJiBleHRlbmRlZCkge1xuICAgICAgaWYgKG4gPT0gXCIoXCIpIHtcbiAgICAgICAgZXh0U3RhY2sucHVzaChjKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGMgPT0gXCI/XCIpIHtcbiAgICAgIGlmIChleHRlbmRlZCkge1xuICAgICAgICBpZiAobiA9PSBcIihcIikge1xuICAgICAgICAgIGV4dFN0YWNrLnB1c2goYyk7XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZWdFeHBTdHJpbmcgKz0gXCIuXCI7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjID09IFwie1wiKSB7XG4gICAgICBpbkdyb3VwID0gdHJ1ZTtcbiAgICAgIHJlZ0V4cFN0cmluZyArPSBcIig/OlwiO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGMgPT0gXCJ9XCIpIHtcbiAgICAgIGluR3JvdXAgPSBmYWxzZTtcbiAgICAgIHJlZ0V4cFN0cmluZyArPSBcIilcIjtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjID09IFwiLFwiKSB7XG4gICAgICBpZiAoaW5Hcm91cCkge1xuICAgICAgICByZWdFeHBTdHJpbmcgKz0gXCJ8XCI7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgcmVnRXhwU3RyaW5nICs9IGBcXFxcJHtjfWA7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoYyA9PSBcIipcIikge1xuICAgICAgaWYgKG4gPT0gXCIoXCIgJiYgZXh0ZW5kZWQpIHtcbiAgICAgICAgZXh0U3RhY2sucHVzaChjKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICAvLyBNb3ZlIG92ZXIgYWxsIGNvbnNlY3V0aXZlIFwiKlwiJ3MuXG4gICAgICAvLyBBbHNvIHN0b3JlIHRoZSBwcmV2aW91cyBhbmQgbmV4dCBjaGFyYWN0ZXJzXG4gICAgICBjb25zdCBwcmV2Q2hhciA9IGdsb2JbaSAtIDFdO1xuICAgICAgbGV0IHN0YXJDb3VudCA9IDE7XG4gICAgICB3aGlsZSAoZ2xvYltpICsgMV0gPT0gXCIqXCIpIHtcbiAgICAgICAgc3RhckNvdW50Kys7XG4gICAgICAgIGkrKztcbiAgICAgIH1cbiAgICAgIGNvbnN0IG5leHRDaGFyID0gZ2xvYltpICsgMV07XG4gICAgICBjb25zdCBpc0dsb2JzdGFyID0gZ2xvYnN0YXJPcHRpb24gJiYgc3RhckNvdW50ID4gMSAmJlxuICAgICAgICAvLyBmcm9tIHRoZSBzdGFydCBvZiB0aGUgc2VnbWVudFxuICAgICAgICBbc2VwUmF3LCBcIi9cIiwgdW5kZWZpbmVkXS5pbmNsdWRlcyhwcmV2Q2hhcikgJiZcbiAgICAgICAgLy8gdG8gdGhlIGVuZCBvZiB0aGUgc2VnbWVudFxuICAgICAgICBbc2VwUmF3LCBcIi9cIiwgdW5kZWZpbmVkXS5pbmNsdWRlcyhuZXh0Q2hhcik7XG4gICAgICBpZiAoaXNHbG9ic3Rhcikge1xuICAgICAgICAvLyBpdCdzIGEgZ2xvYnN0YXIsIHNvIG1hdGNoIHplcm8gb3IgbW9yZSBwYXRoIHNlZ21lbnRzXG4gICAgICAgIHJlZ0V4cFN0cmluZyArPSBnbG9ic3RhcjtcbiAgICAgICAgd2hpbGUgKHNlcHMuaW5jbHVkZXMoZ2xvYltpICsgMV0pKSBpKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBpdCdzIG5vdCBhIGdsb2JzdGFyLCBzbyBvbmx5IG1hdGNoIG9uZSBwYXRoIHNlZ21lbnRcbiAgICAgICAgcmVnRXhwU3RyaW5nICs9IHdpbGRjYXJkO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgcmVnRXhwU3RyaW5nICs9IGM7XG4gIH1cblxuICByZWdFeHBTdHJpbmcgPSBgXiR7cmVnRXhwU3RyaW5nfSR7cmVnRXhwU3RyaW5nICE9IFwiXCIgPyBzZXBNYXliZSA6IFwiXCJ9JGA7XG4gIHJldHVybiBuZXcgUmVnRXhwKHJlZ0V4cFN0cmluZyk7XG59XG5cbi8qKiBUZXN0IHdoZXRoZXIgdGhlIGdpdmVuIHN0cmluZyBpcyBhIGdsb2IgKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0dsb2Ioc3RyOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgY2hhcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7IFwie1wiOiBcIn1cIiwgXCIoXCI6IFwiKVwiLCBcIltcIjogXCJdXCIgfTtcbiAgLyogZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG1heC1sZW4gKi9cbiAgY29uc3QgcmVnZXggPVxuICAgIC9cXFxcKC4pfCheIXxcXCp8W1xcXS4rKV1cXD98XFxbW15cXFxcXFxdXStcXF18XFx7W15cXFxcfV0rXFx9fFxcKFxcP1s6IT1dW15cXFxcKV0rXFwpfFxcKFtefF0rXFx8W15cXFxcKV0rXFwpKS87XG5cbiAgaWYgKHN0ciA9PT0gXCJcIikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGxldCBtYXRjaDogUmVnRXhwRXhlY0FycmF5IHwgbnVsbDtcblxuICB3aGlsZSAoKG1hdGNoID0gcmVnZXguZXhlYyhzdHIpKSkge1xuICAgIGlmIChtYXRjaFsyXSkgcmV0dXJuIHRydWU7XG4gICAgbGV0IGlkeCA9IG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoO1xuXG4gICAgLy8gaWYgYW4gb3BlbiBicmFja2V0L2JyYWNlL3BhcmVuIGlzIGVzY2FwZWQsXG4gICAgLy8gc2V0IHRoZSBpbmRleCB0byB0aGUgbmV4dCBjbG9zaW5nIGNoYXJhY3RlclxuICAgIGNvbnN0IG9wZW4gPSBtYXRjaFsxXTtcbiAgICBjb25zdCBjbG9zZSA9IG9wZW4gPyBjaGFyc1tvcGVuXSA6IG51bGw7XG4gICAgaWYgKG9wZW4gJiYgY2xvc2UpIHtcbiAgICAgIGNvbnN0IG4gPSBzdHIuaW5kZXhPZihjbG9zZSwgaWR4KTtcbiAgICAgIGlmIChuICE9PSAtMSkge1xuICAgICAgICBpZHggPSBuICsgMTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzdHIgPSBzdHIuc2xpY2UoaWR4KTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqIExpa2Ugbm9ybWFsaXplKCksIGJ1dCBkb2Vzbid0IGNvbGxhcHNlIFwiKipcXC8uLlwiIHdoZW4gYGdsb2JzdGFyYCBpcyB0cnVlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUdsb2IoXG4gIGdsb2I6IHN0cmluZyxcbiAgeyBnbG9ic3RhciA9IGZhbHNlIH06IEdsb2JPcHRpb25zID0ge30sXG4pOiBzdHJpbmcge1xuICBpZiAoZ2xvYi5tYXRjaCgvXFwwL2cpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBHbG9iIGNvbnRhaW5zIGludmFsaWQgY2hhcmFjdGVyczogXCIke2dsb2J9XCJgKTtcbiAgfVxuICBpZiAoIWdsb2JzdGFyKSB7XG4gICAgcmV0dXJuIG5vcm1hbGl6ZShnbG9iKTtcbiAgfVxuICBjb25zdCBzID0gU0VQX1BBVFRFUk4uc291cmNlO1xuICBjb25zdCBiYWRQYXJlbnRQYXR0ZXJuID0gbmV3IFJlZ0V4cChcbiAgICBgKD88PSgke3N9fF4pXFxcXCpcXFxcKiR7c30pXFxcXC5cXFxcLig/PSR7c318JClgLFxuICAgIFwiZ1wiLFxuICApO1xuICByZXR1cm4gbm9ybWFsaXplKGdsb2IucmVwbGFjZShiYWRQYXJlbnRQYXR0ZXJuLCBcIlxcMFwiKSkucmVwbGFjZSgvXFwwL2csIFwiLi5cIik7XG59XG5cbi8qKiBMaWtlIGpvaW4oKSwgYnV0IGRvZXNuJ3QgY29sbGFwc2UgXCIqKlxcLy4uXCIgd2hlbiBgZ2xvYnN0YXJgIGlzIHRydWUuICovXG5leHBvcnQgZnVuY3Rpb24gam9pbkdsb2JzKFxuICBnbG9iczogc3RyaW5nW10sXG4gIHsgZXh0ZW5kZWQgPSBmYWxzZSwgZ2xvYnN0YXIgPSBmYWxzZSB9OiBHbG9iT3B0aW9ucyA9IHt9LFxuKTogc3RyaW5nIHtcbiAgaWYgKCFnbG9ic3RhciB8fCBnbG9icy5sZW5ndGggPT0gMCkge1xuICAgIHJldHVybiBqb2luKC4uLmdsb2JzKTtcbiAgfVxuICBpZiAoZ2xvYnMubGVuZ3RoID09PSAwKSByZXR1cm4gXCIuXCI7XG4gIGxldCBqb2luZWQ6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgZm9yIChjb25zdCBnbG9iIG9mIGdsb2JzKSB7XG4gICAgY29uc3QgcGF0aCA9IGdsb2I7XG4gICAgaWYgKHBhdGgubGVuZ3RoID4gMCkge1xuICAgICAgaWYgKCFqb2luZWQpIGpvaW5lZCA9IHBhdGg7XG4gICAgICBlbHNlIGpvaW5lZCArPSBgJHtTRVB9JHtwYXRofWA7XG4gICAgfVxuICB9XG4gIGlmICgham9pbmVkKSByZXR1cm4gXCIuXCI7XG4gIHJldHVybiBub3JtYWxpemVHbG9iKGpvaW5lZCwgeyBleHRlbmRlZCwgZ2xvYnN0YXIg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
