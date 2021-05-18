// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { isWindows, osType } from "../_util/os.ts";
import { SEP, SEP_PATTERN } from "./separator.ts";
import * as _win32 from "./win32.ts";
import * as _posix from "./posix.ts";
const path = isWindows ? _win32 : _posix;
const { join , normalize  } = path;
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
    "]"
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
 *   the group occurs not nested at the end of the segment. */ export function globToRegExp(glob, { extended =true , globstar: globstarOption = true , os =osType  } = {
}) {
    if (glob == "") {
        return /(?!)/;
    }
    const sep = os == "windows" ? "(?:\\\\|/)+" : "/+";
    const sepMaybe = os == "windows" ? "(?:\\\\|/)*" : "/*";
    const seps = os == "windows" ? [
        "\\",
        "/"
    ] : [
        "/"
    ];
    const globstar = os == "windows" ? "(?:[^\\\\/]*(?:\\\\|/|$)+)*" : "(?:[^/]*(?:/|$)+)*";
    const wildcard = os == "windows" ? "[^\\\\/]*" : "[^/]*";
    const escapePrefix = os == "windows" ? "`" : "\\";
    // Remove trailing separators.
    let newLength = glob.length;
    for(; newLength > 1 && seps.includes(glob[newLength - 1]); newLength--);
    glob = glob.slice(0, newLength);
    let regExpString = "";
    // Terminates correctly. Trust that `j` is incremented every iteration.
    for(let j = 0; j < glob.length;){
        let segment = "";
        const groupStack = [];
        let inRange = false;
        let inEscape = false;
        let endsWithSep = false;
        let i = j;
        // Terminates with `i` at the non-inclusive end of the current segment.
        for(; i < glob.length && !seps.includes(glob[i]); i++){
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
                    while(glob[k + 1] != null && glob[k + 1] != ":"){
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
            if (glob[i] == ")" && groupStack.length > 0 && groupStack[groupStack.length - 1] != "BRACE") {
                segment += ")";
                const type = groupStack.pop();
                if (type == "!") {
                    segment += wildcard;
                } else if (type != "@") {
                    segment += type;
                }
                continue;
            }
            if (glob[i] == "|" && groupStack.length > 0 && groupStack[groupStack.length - 1] != "BRACE") {
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
                    while(glob[i + 1] == "*"){
                        i++;
                        numStars++;
                    }
                    const nextChar = glob[i + 1];
                    if (globstarOption && numStars == 2 && [
                        ...seps,
                        undefined
                    ].includes(prevChar) && [
                        ...seps,
                        undefined
                    ].includes(nextChar)) {
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
            for (const c of glob.slice(j, i)){
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
        while(seps.includes(glob[i]))i++;
        // Check that the next value of `j` is indeed higher than the current value.
        if (!(i > j)) {
            throw new Error("Assertion failure: i > j (potential infinite loop)");
        }
        j = i;
    }
    regExpString = `^${regExpString}$`;
    return new RegExp(regExpString);
}
/** Test whether the given string is a glob */ export function isGlob(str) {
    const chars = {
        "{": "}",
        "(": ")",
        "[": "]"
    };
    const regex = /\\(.)|(^!|\*|[\].+)]\?|\[[^\\\]]+\]|\{[^\\}]+\}|\(\?[:!=][^\\)]+\)|\([^|]+\|[^\\)]+\))/;
    if (str === "") {
        return false;
    }
    let match;
    while(match = regex.exec(str)){
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
/** Like normalize(), but doesn't collapse "**\/.." when `globstar` is true. */ export function normalizeGlob(glob, { globstar =false  } = {
}) {
    if (glob.match(/\0/g)) {
        throw new Error(`Glob contains invalid characters: "${glob}"`);
    }
    if (!globstar) {
        return normalize(glob);
    }
    const s = SEP_PATTERN.source;
    const badParentPattern = new RegExp(`(?<=(${s}|^)\\*\\*${s})\\.\\.(?=${s}|$)`, "g");
    return normalize(glob.replace(badParentPattern, "\0")).replace(/\0/g, "..");
}
/** Like join(), but doesn't collapse "**\/.." when `globstar` is true. */ export function joinGlobs(globs, { extended =false , globstar =false  } = {
}) {
    if (!globstar || globs.length == 0) {
        return join(...globs);
    }
    if (globs.length === 0) return ".";
    let joined;
    for (const glob of globs){
        const path = glob;
        if (path.length > 0) {
            if (!joined) joined = path;
            else joined += `${SEP}${path}`;
        }
    }
    if (!joined) return ".";
    return normalizeGlob(joined, {
        extended,
        globstar
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45NC4wL3BhdGgvZ2xvYi50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMSB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgaXNXaW5kb3dzLCBvc1R5cGUgfSBmcm9tIFwiLi4vX3V0aWwvb3MudHNcIjtcbmltcG9ydCB7IFNFUCwgU0VQX1BBVFRFUk4gfSBmcm9tIFwiLi9zZXBhcmF0b3IudHNcIjtcbmltcG9ydCAqIGFzIF93aW4zMiBmcm9tIFwiLi93aW4zMi50c1wiO1xuaW1wb3J0ICogYXMgX3Bvc2l4IGZyb20gXCIuL3Bvc2l4LnRzXCI7XG5cbmNvbnN0IHBhdGggPSBpc1dpbmRvd3MgPyBfd2luMzIgOiBfcG9zaXg7XG5jb25zdCB7IGpvaW4sIG5vcm1hbGl6ZSB9ID0gcGF0aDtcblxuZXhwb3J0IGludGVyZmFjZSBHbG9iT3B0aW9ucyB7XG4gIC8qKiBFeHRlbmRlZCBnbG9iIHN5bnRheC5cbiAgICogU2VlIGh0dHBzOi8vd3d3LmxpbnV4am91cm5hbC5jb20vY29udGVudC9iYXNoLWV4dGVuZGVkLWdsb2JiaW5nLiBEZWZhdWx0c1xuICAgKiB0byB0cnVlLiAqL1xuICBleHRlbmRlZD86IGJvb2xlYW47XG4gIC8qKiBHbG9ic3RhciBzeW50YXguXG4gICAqIFNlZSBodHRwczovL3d3dy5saW51eGpvdXJuYWwuY29tL2NvbnRlbnQvZ2xvYnN0YXItbmV3LWJhc2gtZ2xvYmJpbmctb3B0aW9uLlxuICAgKiBJZiBmYWxzZSwgYCoqYCBpcyB0cmVhdGVkIGxpa2UgYCpgLiBEZWZhdWx0cyB0byB0cnVlLiAqL1xuICBnbG9ic3Rhcj86IGJvb2xlYW47XG4gIC8qKiBPcGVyYXRpbmcgc3lzdGVtLiBEZWZhdWx0cyB0byB0aGUgbmF0aXZlIE9TLiAqL1xuICBvcz86IHR5cGVvZiBEZW5vLmJ1aWxkLm9zO1xufVxuXG5leHBvcnQgdHlwZSBHbG9iVG9SZWdFeHBPcHRpb25zID0gR2xvYk9wdGlvbnM7XG5cbi8vIGRlbm8tZm10LWlnbm9yZVxuY29uc3QgcmVnRXhwRXNjYXBlQ2hhcnMgPSBbXCIhXCIsIFwiJFwiLCBcIihcIiwgXCIpXCIsIFwiKlwiLCBcIitcIiwgXCIuXCIsIFwiPVwiLCBcIj9cIiwgXCJbXCIsIFwiXFxcXFwiLCBcIl5cIiwgXCJ7XCIsIFwifFwiXTtcbmNvbnN0IHJhbmdlRXNjYXBlQ2hhcnMgPSBbXCItXCIsIFwiXFxcXFwiLCBcIl1cIl07XG5cbi8qKiBDb252ZXJ0IGEgZ2xvYiBzdHJpbmcgdG8gYSByZWd1bGFyIGV4cHJlc3Npb24uXG4gKlxuICogVHJpZXMgdG8gbWF0Y2ggYmFzaCBnbG9iIGV4cGFuc2lvbiBhcyBjbG9zZWx5IGFzIHBvc3NpYmxlLlxuICpcbiAqIEJhc2ljIGdsb2Igc3ludGF4OlxuICogLSBgKmAgLSBNYXRjaGVzIGV2ZXJ5dGhpbmcgd2l0aG91dCBsZWF2aW5nIHRoZSBwYXRoIHNlZ21lbnQuXG4gKiAtIGB7Zm9vLGJhcn1gIC0gTWF0Y2hlcyBgZm9vYCBvciBgYmFyYC5cbiAqIC0gYFthYmNkXWAgLSBNYXRjaGVzIGBhYCwgYGJgLCBgY2Agb3IgYGRgLlxuICogLSBgW2EtZF1gIC0gTWF0Y2hlcyBgYWAsIGBiYCwgYGNgIG9yIGBkYC5cbiAqIC0gYFshYWJjZF1gIC0gTWF0Y2hlcyBhbnkgc2luZ2xlIGNoYXJhY3RlciBiZXNpZGVzIGBhYCwgYGJgLCBgY2Agb3IgYGRgLlxuICogLSBgW1s6PGNsYXNzPjpdXWAgLSBNYXRjaGVzIGFueSBjaGFyYWN0ZXIgYmVsb25naW5nIHRvIGA8Y2xhc3M+YC5cbiAqICAgICAtIGBbWzphbG51bTpdXWAgLSBNYXRjaGVzIGFueSBkaWdpdCBvciBsZXR0ZXIuXG4gKiAgICAgLSBgW1s6ZGlnaXQ6XWFiY11gIC0gTWF0Y2hlcyBhbnkgZGlnaXQsIGBhYCwgYGJgIG9yIGBjYC5cbiAqICAgICAtIFNlZSBodHRwczovL2ZhY2VsZXNzdXNlci5naXRodWIuaW8vd2NtYXRjaC9nbG9iLyNwb3NpeC1jaGFyYWN0ZXItY2xhc3Nlc1xuICogICAgICAgZm9yIGEgY29tcGxldGUgbGlzdCBvZiBzdXBwb3J0ZWQgY2hhcmFjdGVyIGNsYXNzZXMuXG4gKiAtIGBcXGAgLSBFc2NhcGVzIHRoZSBuZXh0IGNoYXJhY3RlciBmb3IgYW4gYG9zYCBvdGhlciB0aGFuIGBcIndpbmRvd3NcImAuXG4gKiAtIFxcYCAtIEVzY2FwZXMgdGhlIG5leHQgY2hhcmFjdGVyIGZvciBgb3NgIHNldCB0byBgXCJ3aW5kb3dzXCJgLlxuICogLSBgL2AgLSBQYXRoIHNlcGFyYXRvci5cbiAqIC0gYFxcYCAtIEFkZGl0aW9uYWwgcGF0aCBzZXBhcmF0b3Igb25seSBmb3IgYG9zYCBzZXQgdG8gYFwid2luZG93c1wiYC5cbiAqXG4gKiBFeHRlbmRlZCBzeW50YXg6XG4gKiAtIFJlcXVpcmVzIGB7IGV4dGVuZGVkOiB0cnVlIH1gLlxuICogLSBgPyhmb298YmFyKWAgLSBNYXRjaGVzIDAgb3IgMSBpbnN0YW5jZSBvZiBge2ZvbyxiYXJ9YC5cbiAqIC0gYEAoZm9vfGJhcilgIC0gTWF0Y2hlcyAxIGluc3RhbmNlIG9mIGB7Zm9vLGJhcn1gLiBUaGV5IGJlaGF2ZSB0aGUgc2FtZS5cbiAqIC0gYCooZm9vfGJhcilgIC0gTWF0Y2hlcyBfbl8gaW5zdGFuY2VzIG9mIGB7Zm9vLGJhcn1gLlxuICogLSBgKyhmb298YmFyKWAgLSBNYXRjaGVzIF9uID4gMF8gaW5zdGFuY2VzIG9mIGB7Zm9vLGJhcn1gLlxuICogLSBgIShmb298YmFyKWAgLSBNYXRjaGVzIGFueXRoaW5nIG90aGVyIHRoYW4gYHtmb28sYmFyfWAuXG4gKiAtIFNlZSBodHRwczovL3d3dy5saW51eGpvdXJuYWwuY29tL2NvbnRlbnQvYmFzaC1leHRlbmRlZC1nbG9iYmluZy5cbiAqXG4gKiBHbG9ic3RhciBzeW50YXg6XG4gKiAtIFJlcXVpcmVzIGB7IGdsb2JzdGFyOiB0cnVlIH1gLlxuICogLSBgKipgIC0gTWF0Y2hlcyBhbnkgbnVtYmVyIG9mIGFueSBwYXRoIHNlZ21lbnRzLlxuICogICAgIC0gTXVzdCBjb21wcmlzZSBpdHMgZW50aXJlIHBhdGggc2VnbWVudCBpbiB0aGUgcHJvdmlkZWQgZ2xvYi5cbiAqIC0gU2VlIGh0dHBzOi8vd3d3LmxpbnV4am91cm5hbC5jb20vY29udGVudC9nbG9ic3Rhci1uZXctYmFzaC1nbG9iYmluZy1vcHRpb24uXG4gKlxuICogTm90ZSB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gKiAtIFRoZSBnZW5lcmF0ZWQgYFJlZ0V4cGAgaXMgYW5jaG9yZWQgYXQgYm90aCBzdGFydCBhbmQgZW5kLlxuICogLSBSZXBlYXRpbmcgYW5kIHRyYWlsaW5nIHNlcGFyYXRvcnMgYXJlIHRvbGVyYXRlZC4gVHJhaWxpbmcgc2VwYXJhdG9ycyBpbiB0aGVcbiAqICAgcHJvdmlkZWQgZ2xvYiBoYXZlIG5vIG1lYW5pbmcgYW5kIGFyZSBkaXNjYXJkZWQuXG4gKiAtIEFic29sdXRlIGdsb2JzIHdpbGwgb25seSBtYXRjaCBhYnNvbHV0ZSBwYXRocywgZXRjLlxuICogLSBFbXB0eSBnbG9icyB3aWxsIG1hdGNoIG5vdGhpbmcuXG4gKiAtIEFueSBzcGVjaWFsIGdsb2Igc3ludGF4IG11c3QgYmUgY29udGFpbmVkIHRvIG9uZSBwYXRoIHNlZ21lbnQuIEZvciBleGFtcGxlLFxuICogICBgPyhmb298YmFyL2JheilgIGlzIGludmFsaWQuIFRoZSBzZXBhcmF0b3Igd2lsbCB0YWtlIHByZWNlbmRlbmNlIGFuZCB0aGVcbiAqICAgZmlyc3Qgc2VnbWVudCBlbmRzIHdpdGggYW4gdW5jbG9zZWQgZ3JvdXAuXG4gKiAtIElmIGEgcGF0aCBzZWdtZW50IGVuZHMgd2l0aCB1bmNsb3NlZCBncm91cHMgb3IgYSBkYW5nbGluZyBlc2NhcGUgcHJlZml4LCBhXG4gKiAgIHBhcnNlIGVycm9yIGhhcyBvY2N1cmVkLiBFdmVyeSBjaGFyYWN0ZXIgZm9yIHRoYXQgc2VnbWVudCBpcyB0YWtlblxuICogICBsaXRlcmFsbHkgaW4gdGhpcyBldmVudC5cbiAqXG4gKiBMaW1pdGF0aW9uczpcbiAqIC0gQSBuZWdhdGl2ZSBncm91cCBsaWtlIGAhKGZvb3xiYXIpYCB3aWxsIHdyb25nbHkgYmUgY29udmVydGVkIHRvIGEgbmVnYXRpdmVcbiAqICAgbG9vay1haGVhZCBmb2xsb3dlZCBieSBhIHdpbGRjYXJkLiBUaGlzIG1lYW5zIHRoYXQgYCEoZm9vKS5qc2Agd2lsbCB3cm9uZ2x5XG4gKiAgIGZhaWwgdG8gbWF0Y2ggYGZvb2Jhci5qc2AsIGV2ZW4gdGhvdWdoIGBmb29iYXJgIGlzIG5vdCBgZm9vYC4gRWZmZWN0aXZlbHksXG4gKiAgIGAhKGZvb3xiYXIpYCBpcyB0cmVhdGVkIGxpa2UgYCEoQChmb298YmFyKSopYC4gVGhpcyB3aWxsIHdvcmsgY29ycmVjdGx5IGlmXG4gKiAgIHRoZSBncm91cCBvY2N1cnMgbm90IG5lc3RlZCBhdCB0aGUgZW5kIG9mIHRoZSBzZWdtZW50LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdsb2JUb1JlZ0V4cChcbiAgZ2xvYjogc3RyaW5nLFxuICB7IGV4dGVuZGVkID0gdHJ1ZSwgZ2xvYnN0YXI6IGdsb2JzdGFyT3B0aW9uID0gdHJ1ZSwgb3MgPSBvc1R5cGUgfTpcbiAgICBHbG9iVG9SZWdFeHBPcHRpb25zID0ge30sXG4pOiBSZWdFeHAge1xuICBpZiAoZ2xvYiA9PSBcIlwiKSB7XG4gICAgcmV0dXJuIC8oPyEpLztcbiAgfVxuXG4gIGNvbnN0IHNlcCA9IG9zID09IFwid2luZG93c1wiID8gXCIoPzpcXFxcXFxcXHwvKStcIiA6IFwiLytcIjtcbiAgY29uc3Qgc2VwTWF5YmUgPSBvcyA9PSBcIndpbmRvd3NcIiA/IFwiKD86XFxcXFxcXFx8LykqXCIgOiBcIi8qXCI7XG4gIGNvbnN0IHNlcHMgPSBvcyA9PSBcIndpbmRvd3NcIiA/IFtcIlxcXFxcIiwgXCIvXCJdIDogW1wiL1wiXTtcbiAgY29uc3QgZ2xvYnN0YXIgPSBvcyA9PSBcIndpbmRvd3NcIlxuICAgID8gXCIoPzpbXlxcXFxcXFxcL10qKD86XFxcXFxcXFx8L3wkKSspKlwiXG4gICAgOiBcIig/OlteL10qKD86L3wkKSspKlwiO1xuICBjb25zdCB3aWxkY2FyZCA9IG9zID09IFwid2luZG93c1wiID8gXCJbXlxcXFxcXFxcL10qXCIgOiBcIlteL10qXCI7XG4gIGNvbnN0IGVzY2FwZVByZWZpeCA9IG9zID09IFwid2luZG93c1wiID8gXCJgXCIgOiBcIlxcXFxcIjtcblxuICAvLyBSZW1vdmUgdHJhaWxpbmcgc2VwYXJhdG9ycy5cbiAgbGV0IG5ld0xlbmd0aCA9IGdsb2IubGVuZ3RoO1xuICBmb3IgKDsgbmV3TGVuZ3RoID4gMSAmJiBzZXBzLmluY2x1ZGVzKGdsb2JbbmV3TGVuZ3RoIC0gMV0pOyBuZXdMZW5ndGgtLSk7XG4gIGdsb2IgPSBnbG9iLnNsaWNlKDAsIG5ld0xlbmd0aCk7XG5cbiAgbGV0IHJlZ0V4cFN0cmluZyA9IFwiXCI7XG5cbiAgLy8gVGVybWluYXRlcyBjb3JyZWN0bHkuIFRydXN0IHRoYXQgYGpgIGlzIGluY3JlbWVudGVkIGV2ZXJ5IGl0ZXJhdGlvbi5cbiAgZm9yIChsZXQgaiA9IDA7IGogPCBnbG9iLmxlbmd0aDspIHtcbiAgICBsZXQgc2VnbWVudCA9IFwiXCI7XG4gICAgY29uc3QgZ3JvdXBTdGFjayA9IFtdO1xuICAgIGxldCBpblJhbmdlID0gZmFsc2U7XG4gICAgbGV0IGluRXNjYXBlID0gZmFsc2U7XG4gICAgbGV0IGVuZHNXaXRoU2VwID0gZmFsc2U7XG4gICAgbGV0IGkgPSBqO1xuXG4gICAgLy8gVGVybWluYXRlcyB3aXRoIGBpYCBhdCB0aGUgbm9uLWluY2x1c2l2ZSBlbmQgb2YgdGhlIGN1cnJlbnQgc2VnbWVudC5cbiAgICBmb3IgKDsgaSA8IGdsb2IubGVuZ3RoICYmICFzZXBzLmluY2x1ZGVzKGdsb2JbaV0pOyBpKyspIHtcbiAgICAgIGlmIChpbkVzY2FwZSkge1xuICAgICAgICBpbkVzY2FwZSA9IGZhbHNlO1xuICAgICAgICBjb25zdCBlc2NhcGVDaGFycyA9IGluUmFuZ2UgPyByYW5nZUVzY2FwZUNoYXJzIDogcmVnRXhwRXNjYXBlQ2hhcnM7XG4gICAgICAgIHNlZ21lbnQgKz0gZXNjYXBlQ2hhcnMuaW5jbHVkZXMoZ2xvYltpXSkgPyBgXFxcXCR7Z2xvYltpXX1gIDogZ2xvYltpXTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09IGVzY2FwZVByZWZpeCkge1xuICAgICAgICBpbkVzY2FwZSA9IHRydWU7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZ2xvYltpXSA9PSBcIltcIikge1xuICAgICAgICBpZiAoIWluUmFuZ2UpIHtcbiAgICAgICAgICBpblJhbmdlID0gdHJ1ZTtcbiAgICAgICAgICBzZWdtZW50ICs9IFwiW1wiO1xuICAgICAgICAgIGlmIChnbG9iW2kgKyAxXSA9PSBcIiFcIikge1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgc2VnbWVudCArPSBcIl5cIjtcbiAgICAgICAgICB9IGVsc2UgaWYgKGdsb2JbaSArIDFdID09IFwiXlwiKSB7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgICAgICBzZWdtZW50ICs9IFwiXFxcXF5cIjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gZWxzZSBpZiAoZ2xvYltpICsgMV0gPT0gXCI6XCIpIHtcbiAgICAgICAgICBsZXQgayA9IGkgKyAxO1xuICAgICAgICAgIGxldCB2YWx1ZSA9IFwiXCI7XG4gICAgICAgICAgd2hpbGUgKGdsb2JbayArIDFdICE9IG51bGwgJiYgZ2xvYltrICsgMV0gIT0gXCI6XCIpIHtcbiAgICAgICAgICAgIHZhbHVlICs9IGdsb2JbayArIDFdO1xuICAgICAgICAgICAgaysrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZ2xvYltrICsgMV0gPT0gXCI6XCIgJiYgZ2xvYltrICsgMl0gPT0gXCJdXCIpIHtcbiAgICAgICAgICAgIGkgPSBrICsgMjtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcImFsbnVtXCIpIHNlZ21lbnQgKz0gXCJcXFxcZEEtWmEtelwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT0gXCJhbHBoYVwiKSBzZWdtZW50ICs9IFwiQS1aYS16XCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PSBcImFzY2lpXCIpIHNlZ21lbnQgKz0gXCJcXHgwMC1cXHg3RlwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT0gXCJibGFua1wiKSBzZWdtZW50ICs9IFwiXFx0IFwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT0gXCJjbnRybFwiKSBzZWdtZW50ICs9IFwiXFx4MDAtXFx4MUZcXHg3RlwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT0gXCJkaWdpdFwiKSBzZWdtZW50ICs9IFwiXFxcXGRcIjtcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlID09IFwiZ3JhcGhcIikgc2VnbWVudCArPSBcIlxceDIxLVxceDdFXCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PSBcImxvd2VyXCIpIHNlZ21lbnQgKz0gXCJhLXpcIjtcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlID09IFwicHJpbnRcIikgc2VnbWVudCArPSBcIlxceDIwLVxceDdFXCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PSBcInB1bmN0XCIpIHtcbiAgICAgICAgICAgICAgc2VnbWVudCArPSBcIiFcXFwiIyQlJicoKSorLFxcXFwtLi86Ozw9Pj9AW1xcXFxcXFxcXFxcXF1eX+KAmHt8fX5cIjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT0gXCJzcGFjZVwiKSBzZWdtZW50ICs9IFwiXFxcXHNcXHZcIjtcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlID09IFwidXBwZXJcIikgc2VnbWVudCArPSBcIkEtWlwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT0gXCJ3b3JkXCIpIHNlZ21lbnQgKz0gXCJcXFxcd1wiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT0gXCJ4ZGlnaXRcIikgc2VnbWVudCArPSBcIlxcXFxkQS1GYS1mXCI7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGdsb2JbaV0gPT0gXCJdXCIgJiYgaW5SYW5nZSkge1xuICAgICAgICBpblJhbmdlID0gZmFsc2U7XG4gICAgICAgIHNlZ21lbnQgKz0gXCJdXCI7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoaW5SYW5nZSkge1xuICAgICAgICBpZiAoZ2xvYltpXSA9PSBcIlxcXFxcIikge1xuICAgICAgICAgIHNlZ21lbnQgKz0gYFxcXFxcXFxcYDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZWdtZW50ICs9IGdsb2JbaV07XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChcbiAgICAgICAgZ2xvYltpXSA9PSBcIilcIiAmJiBncm91cFN0YWNrLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgZ3JvdXBTdGFja1tncm91cFN0YWNrLmxlbmd0aCAtIDFdICE9IFwiQlJBQ0VcIlxuICAgICAgKSB7XG4gICAgICAgIHNlZ21lbnQgKz0gXCIpXCI7XG4gICAgICAgIGNvbnN0IHR5cGUgPSBncm91cFN0YWNrLnBvcCgpITtcbiAgICAgICAgaWYgKHR5cGUgPT0gXCIhXCIpIHtcbiAgICAgICAgICBzZWdtZW50ICs9IHdpbGRjYXJkO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgIT0gXCJAXCIpIHtcbiAgICAgICAgICBzZWdtZW50ICs9IHR5cGU7XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChcbiAgICAgICAgZ2xvYltpXSA9PSBcInxcIiAmJiBncm91cFN0YWNrLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgZ3JvdXBTdGFja1tncm91cFN0YWNrLmxlbmd0aCAtIDFdICE9IFwiQlJBQ0VcIlxuICAgICAgKSB7XG4gICAgICAgIHNlZ21lbnQgKz0gXCJ8XCI7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZ2xvYltpXSA9PSBcIitcIiAmJiBleHRlbmRlZCAmJiBnbG9iW2kgKyAxXSA9PSBcIihcIikge1xuICAgICAgICBpKys7XG4gICAgICAgIGdyb3VwU3RhY2sucHVzaChcIitcIik7XG4gICAgICAgIHNlZ21lbnQgKz0gXCIoPzpcIjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09IFwiQFwiICYmIGV4dGVuZGVkICYmIGdsb2JbaSArIDFdID09IFwiKFwiKSB7XG4gICAgICAgIGkrKztcbiAgICAgICAgZ3JvdXBTdGFjay5wdXNoKFwiQFwiKTtcbiAgICAgICAgc2VnbWVudCArPSBcIig/OlwiO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGdsb2JbaV0gPT0gXCI/XCIpIHtcbiAgICAgICAgaWYgKGV4dGVuZGVkICYmIGdsb2JbaSArIDFdID09IFwiKFwiKSB7XG4gICAgICAgICAgaSsrO1xuICAgICAgICAgIGdyb3VwU3RhY2sucHVzaChcIj9cIik7XG4gICAgICAgICAgc2VnbWVudCArPSBcIig/OlwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlZ21lbnQgKz0gXCIuXCI7XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09IFwiIVwiICYmIGV4dGVuZGVkICYmIGdsb2JbaSArIDFdID09IFwiKFwiKSB7XG4gICAgICAgIGkrKztcbiAgICAgICAgZ3JvdXBTdGFjay5wdXNoKFwiIVwiKTtcbiAgICAgICAgc2VnbWVudCArPSBcIig/IVwiO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGdsb2JbaV0gPT0gXCJ7XCIpIHtcbiAgICAgICAgZ3JvdXBTdGFjay5wdXNoKFwiQlJBQ0VcIik7XG4gICAgICAgIHNlZ21lbnQgKz0gXCIoPzpcIjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09IFwifVwiICYmIGdyb3VwU3RhY2tbZ3JvdXBTdGFjay5sZW5ndGggLSAxXSA9PSBcIkJSQUNFXCIpIHtcbiAgICAgICAgZ3JvdXBTdGFjay5wb3AoKTtcbiAgICAgICAgc2VnbWVudCArPSBcIilcIjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09IFwiLFwiICYmIGdyb3VwU3RhY2tbZ3JvdXBTdGFjay5sZW5ndGggLSAxXSA9PSBcIkJSQUNFXCIpIHtcbiAgICAgICAgc2VnbWVudCArPSBcInxcIjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09IFwiKlwiKSB7XG4gICAgICAgIGlmIChleHRlbmRlZCAmJiBnbG9iW2kgKyAxXSA9PSBcIihcIikge1xuICAgICAgICAgIGkrKztcbiAgICAgICAgICBncm91cFN0YWNrLnB1c2goXCIqXCIpO1xuICAgICAgICAgIHNlZ21lbnQgKz0gXCIoPzpcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBwcmV2Q2hhciA9IGdsb2JbaSAtIDFdO1xuICAgICAgICAgIGxldCBudW1TdGFycyA9IDE7XG4gICAgICAgICAgd2hpbGUgKGdsb2JbaSArIDFdID09IFwiKlwiKSB7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgICAgICBudW1TdGFycysrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBuZXh0Q2hhciA9IGdsb2JbaSArIDFdO1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIGdsb2JzdGFyT3B0aW9uICYmIG51bVN0YXJzID09IDIgJiZcbiAgICAgICAgICAgIFsuLi5zZXBzLCB1bmRlZmluZWRdLmluY2x1ZGVzKHByZXZDaGFyKSAmJlxuICAgICAgICAgICAgWy4uLnNlcHMsIHVuZGVmaW5lZF0uaW5jbHVkZXMobmV4dENoYXIpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBzZWdtZW50ICs9IGdsb2JzdGFyO1xuICAgICAgICAgICAgZW5kc1dpdGhTZXAgPSB0cnVlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWdtZW50ICs9IHdpbGRjYXJkO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgc2VnbWVudCArPSByZWdFeHBFc2NhcGVDaGFycy5pbmNsdWRlcyhnbG9iW2ldKSA/IGBcXFxcJHtnbG9iW2ldfWAgOiBnbG9iW2ldO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciB1bmNsb3NlZCBncm91cHMgb3IgYSBkYW5nbGluZyBiYWNrc2xhc2guXG4gICAgaWYgKGdyb3VwU3RhY2subGVuZ3RoID4gMCB8fCBpblJhbmdlIHx8IGluRXNjYXBlKSB7XG4gICAgICAvLyBQYXJzZSBmYWlsdXJlLiBUYWtlIGFsbCBjaGFyYWN0ZXJzIGZyb20gdGhpcyBzZWdtZW50IGxpdGVyYWxseS5cbiAgICAgIHNlZ21lbnQgPSBcIlwiO1xuICAgICAgZm9yIChjb25zdCBjIG9mIGdsb2Iuc2xpY2UoaiwgaSkpIHtcbiAgICAgICAgc2VnbWVudCArPSByZWdFeHBFc2NhcGVDaGFycy5pbmNsdWRlcyhjKSA/IGBcXFxcJHtjfWAgOiBjO1xuICAgICAgICBlbmRzV2l0aFNlcCA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJlZ0V4cFN0cmluZyArPSBzZWdtZW50O1xuICAgIGlmICghZW5kc1dpdGhTZXApIHtcbiAgICAgIHJlZ0V4cFN0cmluZyArPSBpIDwgZ2xvYi5sZW5ndGggPyBzZXAgOiBzZXBNYXliZTtcbiAgICAgIGVuZHNXaXRoU2VwID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBUZXJtaW5hdGVzIHdpdGggYGlgIGF0IHRoZSBzdGFydCBvZiB0aGUgbmV4dCBzZWdtZW50LlxuICAgIHdoaWxlIChzZXBzLmluY2x1ZGVzKGdsb2JbaV0pKSBpKys7XG5cbiAgICAvLyBDaGVjayB0aGF0IHRoZSBuZXh0IHZhbHVlIG9mIGBqYCBpcyBpbmRlZWQgaGlnaGVyIHRoYW4gdGhlIGN1cnJlbnQgdmFsdWUuXG4gICAgaWYgKCEoaSA+IGopKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBc3NlcnRpb24gZmFpbHVyZTogaSA+IGogKHBvdGVudGlhbCBpbmZpbml0ZSBsb29wKVwiKTtcbiAgICB9XG4gICAgaiA9IGk7XG4gIH1cblxuICByZWdFeHBTdHJpbmcgPSBgXiR7cmVnRXhwU3RyaW5nfSRgO1xuICByZXR1cm4gbmV3IFJlZ0V4cChyZWdFeHBTdHJpbmcpO1xufVxuXG4vKiogVGVzdCB3aGV0aGVyIHRoZSBnaXZlbiBzdHJpbmcgaXMgYSBnbG9iICovXG5leHBvcnQgZnVuY3Rpb24gaXNHbG9iKHN0cjogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IGNoYXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0geyBcIntcIjogXCJ9XCIsIFwiKFwiOiBcIilcIiwgXCJbXCI6IFwiXVwiIH07XG4gIGNvbnN0IHJlZ2V4ID1cbiAgICAvXFxcXCguKXwoXiF8XFwqfFtcXF0uKyldXFw/fFxcW1teXFxcXFxcXV0rXFxdfFxce1teXFxcXH1dK1xcfXxcXChcXD9bOiE9XVteXFxcXCldK1xcKXxcXChbXnxdK1xcfFteXFxcXCldK1xcKSkvO1xuXG4gIGlmIChzdHIgPT09IFwiXCIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBsZXQgbWF0Y2g6IFJlZ0V4cEV4ZWNBcnJheSB8IG51bGw7XG5cbiAgd2hpbGUgKChtYXRjaCA9IHJlZ2V4LmV4ZWMoc3RyKSkpIHtcbiAgICBpZiAobWF0Y2hbMl0pIHJldHVybiB0cnVlO1xuICAgIGxldCBpZHggPSBtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aDtcblxuICAgIC8vIGlmIGFuIG9wZW4gYnJhY2tldC9icmFjZS9wYXJlbiBpcyBlc2NhcGVkLFxuICAgIC8vIHNldCB0aGUgaW5kZXggdG8gdGhlIG5leHQgY2xvc2luZyBjaGFyYWN0ZXJcbiAgICBjb25zdCBvcGVuID0gbWF0Y2hbMV07XG4gICAgY29uc3QgY2xvc2UgPSBvcGVuID8gY2hhcnNbb3Blbl0gOiBudWxsO1xuICAgIGlmIChvcGVuICYmIGNsb3NlKSB7XG4gICAgICBjb25zdCBuID0gc3RyLmluZGV4T2YoY2xvc2UsIGlkeCk7XG4gICAgICBpZiAobiAhPT0gLTEpIHtcbiAgICAgICAgaWR4ID0gbiArIDE7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc3RyID0gc3RyLnNsaWNlKGlkeCk7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKiBMaWtlIG5vcm1hbGl6ZSgpLCBidXQgZG9lc24ndCBjb2xsYXBzZSBcIioqXFwvLi5cIiB3aGVuIGBnbG9ic3RhcmAgaXMgdHJ1ZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVHbG9iKFxuICBnbG9iOiBzdHJpbmcsXG4gIHsgZ2xvYnN0YXIgPSBmYWxzZSB9OiBHbG9iT3B0aW9ucyA9IHt9LFxuKTogc3RyaW5nIHtcbiAgaWYgKGdsb2IubWF0Y2goL1xcMC9nKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgR2xvYiBjb250YWlucyBpbnZhbGlkIGNoYXJhY3RlcnM6IFwiJHtnbG9ifVwiYCk7XG4gIH1cbiAgaWYgKCFnbG9ic3Rhcikge1xuICAgIHJldHVybiBub3JtYWxpemUoZ2xvYik7XG4gIH1cbiAgY29uc3QgcyA9IFNFUF9QQVRURVJOLnNvdXJjZTtcbiAgY29uc3QgYmFkUGFyZW50UGF0dGVybiA9IG5ldyBSZWdFeHAoXG4gICAgYCg/PD0oJHtzfXxeKVxcXFwqXFxcXCoke3N9KVxcXFwuXFxcXC4oPz0ke3N9fCQpYCxcbiAgICBcImdcIixcbiAgKTtcbiAgcmV0dXJuIG5vcm1hbGl6ZShnbG9iLnJlcGxhY2UoYmFkUGFyZW50UGF0dGVybiwgXCJcXDBcIikpLnJlcGxhY2UoL1xcMC9nLCBcIi4uXCIpO1xufVxuXG4vKiogTGlrZSBqb2luKCksIGJ1dCBkb2Vzbid0IGNvbGxhcHNlIFwiKipcXC8uLlwiIHdoZW4gYGdsb2JzdGFyYCBpcyB0cnVlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGpvaW5HbG9icyhcbiAgZ2xvYnM6IHN0cmluZ1tdLFxuICB7IGV4dGVuZGVkID0gZmFsc2UsIGdsb2JzdGFyID0gZmFsc2UgfTogR2xvYk9wdGlvbnMgPSB7fSxcbik6IHN0cmluZyB7XG4gIGlmICghZ2xvYnN0YXIgfHwgZ2xvYnMubGVuZ3RoID09IDApIHtcbiAgICByZXR1cm4gam9pbiguLi5nbG9icyk7XG4gIH1cbiAgaWYgKGdsb2JzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFwiLlwiO1xuICBsZXQgam9pbmVkOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIGZvciAoY29uc3QgZ2xvYiBvZiBnbG9icykge1xuICAgIGNvbnN0IHBhdGggPSBnbG9iO1xuICAgIGlmIChwYXRoLmxlbmd0aCA+IDApIHtcbiAgICAgIGlmICgham9pbmVkKSBqb2luZWQgPSBwYXRoO1xuICAgICAgZWxzZSBqb2luZWQgKz0gYCR7U0VQfSR7cGF0aH1gO1xuICAgIH1cbiAgfVxuICBpZiAoIWpvaW5lZCkgcmV0dXJuIFwiLlwiO1xuICByZXR1cm4gbm9ybWFsaXplR2xvYihqb2luZWQsIHsgZXh0ZW5kZWQsIGdsb2JzdGFyIH0pO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEVBQTBFLEFBQTFFLHdFQUEwRTtBQUMxRSxFQUFxQyxBQUFyQyxtQ0FBcUM7U0FFNUIsU0FBUyxFQUFFLE1BQU0sU0FBUSxjQUFnQjtTQUN6QyxHQUFHLEVBQUUsV0FBVyxTQUFRLGNBQWdCO1lBQ3JDLE1BQU0sT0FBTSxVQUFZO1lBQ3hCLE1BQU0sT0FBTSxVQUFZO01BRTlCLElBQUksR0FB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