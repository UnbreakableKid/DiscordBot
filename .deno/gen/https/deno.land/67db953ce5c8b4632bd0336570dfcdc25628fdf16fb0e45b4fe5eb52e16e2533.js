// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// A module to print ANSI terminal colors. Inspired by chalk, kleur, and colors
// on npm.
//
// ```
// import { bgBlue, red, bold } from "https://deno.land/std/fmt/colors.ts";
// console.log(bgBlue(red(bold("Hello world!"))));
// ```
//
// This module supports `NO_COLOR` environmental variable disabling any coloring
// if `NO_COLOR` is set.
//
// This module is browser compatible.
const noColor = globalThis.Deno?.noColor ?? true;
let enabled = !noColor;
/**
 * Set changing text color to enabled or disabled
 * @param value
 */ export function setColorEnabled(value) {
    if (noColor) {
        return;
    }
    enabled = value;
}
/** Get whether text color change is enabled or disabled. */ export function getColorEnabled() {
    return enabled;
}
/**
 * Builds color code
 * @param open
 * @param close
 */ function code(open, close) {
    return {
        open: `\x1b[${open.join(";")}m`,
        close: `\x1b[${close}m`,
        regexp: new RegExp(`\\x1b\\[${close}m`, "g")
    };
}
/**
 * Applies color and background based on color code and its associated text
 * @param str text to apply color settings to
 * @param code color code to apply
 */ function run(str, code) {
    return enabled ? `${code.open}${str.replace(code.regexp, code.open)}${code.close}` : str;
}
/**
 * Reset the text modified
 * @param str text to reset
 */ export function reset(str) {
    return run(str, code([
        0
    ], 0));
}
/**
 * Make the text bold.
 * @param str text to make bold
 */ export function bold(str) {
    return run(str, code([
        1
    ], 22));
}
/**
 * The text emits only a small amount of light.
 * @param str text to dim
 */ export function dim(str) {
    return run(str, code([
        2
    ], 22));
}
/**
 * Make the text italic.
 * @param str text to make italic
 */ export function italic(str) {
    return run(str, code([
        3
    ], 23));
}
/**
 * Make the text underline.
 * @param str text to underline
 */ export function underline(str) {
    return run(str, code([
        4
    ], 24));
}
/**
 * Invert background color and text color.
 * @param str text to invert its color
 */ export function inverse(str) {
    return run(str, code([
        7
    ], 27));
}
/**
 * Make the text hidden.
 * @param str text to hide
 */ export function hidden(str) {
    return run(str, code([
        8
    ], 28));
}
/**
 * Put horizontal line through the center of the text.
 * @param str text to strike through
 */ export function strikethrough(str) {
    return run(str, code([
        9
    ], 29));
}
/**
 * Set text color to black.
 * @param str text to make black
 */ export function black(str) {
    return run(str, code([
        30
    ], 39));
}
/**
 * Set text color to red.
 * @param str text to make red
 */ export function red(str) {
    return run(str, code([
        31
    ], 39));
}
/**
 * Set text color to green.
 * @param str text to make green
 */ export function green(str) {
    return run(str, code([
        32
    ], 39));
}
/**
 * Set text color to yellow.
 * @param str text to make yellow
 */ export function yellow(str) {
    return run(str, code([
        33
    ], 39));
}
/**
 * Set text color to blue.
 * @param str text to make blue
 */ export function blue(str) {
    return run(str, code([
        34
    ], 39));
}
/**
 * Set text color to magenta.
 * @param str text to make magenta
 */ export function magenta(str) {
    return run(str, code([
        35
    ], 39));
}
/**
 * Set text color to cyan.
 * @param str text to make cyan
 */ export function cyan(str) {
    return run(str, code([
        36
    ], 39));
}
/**
 * Set text color to white.
 * @param str text to make white
 */ export function white(str) {
    return run(str, code([
        37
    ], 39));
}
/**
 * Set text color to gray.
 * @param str text to make gray
 */ export function gray(str) {
    return brightBlack(str);
}
/**
 * Set text color to bright black.
 * @param str text to make bright-black
 */ export function brightBlack(str) {
    return run(str, code([
        90
    ], 39));
}
/**
 * Set text color to bright red.
 * @param str text to make bright-red
 */ export function brightRed(str) {
    return run(str, code([
        91
    ], 39));
}
/**
 * Set text color to bright green.
 * @param str text to make bright-green
 */ export function brightGreen(str) {
    return run(str, code([
        92
    ], 39));
}
/**
 * Set text color to bright yellow.
 * @param str text to make bright-yellow
 */ export function brightYellow(str) {
    return run(str, code([
        93
    ], 39));
}
/**
 * Set text color to bright blue.
 * @param str text to make bright-blue
 */ export function brightBlue(str) {
    return run(str, code([
        94
    ], 39));
}
/**
 * Set text color to bright magenta.
 * @param str text to make bright-magenta
 */ export function brightMagenta(str) {
    return run(str, code([
        95
    ], 39));
}
/**
 * Set text color to bright cyan.
 * @param str text to make bright-cyan
 */ export function brightCyan(str) {
    return run(str, code([
        96
    ], 39));
}
/**
 * Set text color to bright white.
 * @param str text to make bright-white
 */ export function brightWhite(str) {
    return run(str, code([
        97
    ], 39));
}
/**
 * Set background color to black.
 * @param str text to make its background black
 */ export function bgBlack(str) {
    return run(str, code([
        40
    ], 49));
}
/**
 * Set background color to red.
 * @param str text to make its background red
 */ export function bgRed(str) {
    return run(str, code([
        41
    ], 49));
}
/**
 * Set background color to green.
 * @param str text to make its background green
 */ export function bgGreen(str) {
    return run(str, code([
        42
    ], 49));
}
/**
 * Set background color to yellow.
 * @param str text to make its background yellow
 */ export function bgYellow(str) {
    return run(str, code([
        43
    ], 49));
}
/**
 * Set background color to blue.
 * @param str text to make its background blue
 */ export function bgBlue(str) {
    return run(str, code([
        44
    ], 49));
}
/**
 *  Set background color to magenta.
 * @param str text to make its background magenta
 */ export function bgMagenta(str) {
    return run(str, code([
        45
    ], 49));
}
/**
 * Set background color to cyan.
 * @param str text to make its background cyan
 */ export function bgCyan(str) {
    return run(str, code([
        46
    ], 49));
}
/**
 * Set background color to white.
 * @param str text to make its background white
 */ export function bgWhite(str) {
    return run(str, code([
        47
    ], 49));
}
/**
 * Set background color to bright black.
 * @param str text to make its background bright-black
 */ export function bgBrightBlack(str) {
    return run(str, code([
        100
    ], 49));
}
/**
 * Set background color to bright red.
 * @param str text to make its background bright-red
 */ export function bgBrightRed(str) {
    return run(str, code([
        101
    ], 49));
}
/**
 * Set background color to bright green.
 * @param str text to make its background bright-green
 */ export function bgBrightGreen(str) {
    return run(str, code([
        102
    ], 49));
}
/**
 * Set background color to bright yellow.
 * @param str text to make its background bright-yellow
 */ export function bgBrightYellow(str) {
    return run(str, code([
        103
    ], 49));
}
/**
 * Set background color to bright blue.
 * @param str text to make its background bright-blue
 */ export function bgBrightBlue(str) {
    return run(str, code([
        104
    ], 49));
}
/**
 * Set background color to bright magenta.
 * @param str text to make its background bright-magenta
 */ export function bgBrightMagenta(str) {
    return run(str, code([
        105
    ], 49));
}
/**
 * Set background color to bright cyan.
 * @param str text to make its background bright-cyan
 */ export function bgBrightCyan(str) {
    return run(str, code([
        106
    ], 49));
}
/**
 * Set background color to bright white.
 * @param str text to make its background bright-white
 */ export function bgBrightWhite(str) {
    return run(str, code([
        107
    ], 49));
}
/* Special Color Sequences */ /**
 * Clam and truncate color codes
 * @param n
 * @param max number to truncate to
 * @param min number to truncate from
 */ function clampAndTruncate(n, max = 255, min = 0) {
    return Math.trunc(Math.max(Math.min(n, max), min));
}
/**
 * Set text color using paletted 8bit colors.
 * https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
 * @param str text color to apply paletted 8bit colors to
 * @param color code
 */ export function rgb8(str, color) {
    return run(str, code([
        38,
        5,
        clampAndTruncate(color)
    ], 39));
}
/**
 * Set background color using paletted 8bit colors.
 * https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
 * @param str text color to apply paletted 8bit background colors to
 * @param color code
 */ export function bgRgb8(str, color) {
    return run(str, code([
        48,
        5,
        clampAndTruncate(color)
    ], 49));
}
/**
 * Set text color using 24bit rgb.
 * `color` can be a number in range `0x000000` to `0xffffff` or
 * an `Rgb`.
 *
 * To produce the color magenta:
 *
 *      rgb24("foo", 0xff00ff);
 *      rgb24("foo", {r: 255, g: 0, b: 255});
 * @param str text color to apply 24bit rgb to
 * @param color code
 */ export function rgb24(str, color) {
    if (typeof color === "number") {
        return run(str, code([
            38,
            2,
            color >> 16 & 255,
            color >> 8 & 255,
            color & 255
        ], 39));
    }
    return run(str, code([
        38,
        2,
        clampAndTruncate(color.r),
        clampAndTruncate(color.g),
        clampAndTruncate(color.b), 
    ], 39));
}
/**
 * Set background color using 24bit rgb.
 * `color` can be a number in range `0x000000` to `0xffffff` or
 * an `Rgb`.
 *
 * To produce the color magenta:
 *
 *      bgRgb24("foo", 0xff00ff);
 *      bgRgb24("foo", {r: 255, g: 0, b: 255});
 * @param str text color to apply 24bit rgb to
 * @param color code
 */ export function bgRgb24(str, color) {
    if (typeof color === "number") {
        return run(str, code([
            48,
            2,
            color >> 16 & 255,
            color >> 8 & 255,
            color & 255
        ], 49));
    }
    return run(str, code([
        48,
        2,
        clampAndTruncate(color.r),
        clampAndTruncate(color.g),
        clampAndTruncate(color.b), 
    ], 49));
}
// https://github.com/chalk/ansi-regex/blob/2b56fb0c7a07108e5b54241e8faec160d393aedb/index.js
const ANSI_PATTERN = new RegExp([
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))", 
].join("|"), "g");
/**
 * Remove ANSI escape codes from the string.
 * @param string to remove ANSI escape codes from
 */ export function stripColor(string) {
    return string.replace(ANSI_PATTERN, "");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45Ny4wL2ZtdC9jb2xvcnMudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjEgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBBIG1vZHVsZSB0byBwcmludCBBTlNJIHRlcm1pbmFsIGNvbG9ycy4gSW5zcGlyZWQgYnkgY2hhbGssIGtsZXVyLCBhbmQgY29sb3JzXG4vLyBvbiBucG0uXG4vL1xuLy8gYGBgXG4vLyBpbXBvcnQgeyBiZ0JsdWUsIHJlZCwgYm9sZCB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGQvZm10L2NvbG9ycy50c1wiO1xuLy8gY29uc29sZS5sb2coYmdCbHVlKHJlZChib2xkKFwiSGVsbG8gd29ybGQhXCIpKSkpO1xuLy8gYGBgXG4vL1xuLy8gVGhpcyBtb2R1bGUgc3VwcG9ydHMgYE5PX0NPTE9SYCBlbnZpcm9ubWVudGFsIHZhcmlhYmxlIGRpc2FibGluZyBhbnkgY29sb3Jpbmdcbi8vIGlmIGBOT19DT0xPUmAgaXMgc2V0LlxuLy9cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuY29uc3Qgbm9Db2xvciA9IGdsb2JhbFRoaXMuRGVubz8ubm9Db2xvciA/PyB0cnVlO1xuXG5pbnRlcmZhY2UgQ29kZSB7XG4gIG9wZW46IHN0cmluZztcbiAgY2xvc2U6IHN0cmluZztcbiAgcmVnZXhwOiBSZWdFeHA7XG59XG5cbi8qKiBSR0IgOC1iaXRzIHBlciBjaGFubmVsLiBFYWNoIGluIHJhbmdlIGAwLT4yNTVgIG9yIGAweDAwLT4weGZmYCAqL1xuaW50ZXJmYWNlIFJnYiB7XG4gIHI6IG51bWJlcjtcbiAgZzogbnVtYmVyO1xuICBiOiBudW1iZXI7XG59XG5cbmxldCBlbmFibGVkID0gIW5vQ29sb3I7XG5cbi8qKlxuICogU2V0IGNoYW5naW5nIHRleHQgY29sb3IgdG8gZW5hYmxlZCBvciBkaXNhYmxlZFxuICogQHBhcmFtIHZhbHVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRDb2xvckVuYWJsZWQodmFsdWU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgaWYgKG5vQ29sb3IpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBlbmFibGVkID0gdmFsdWU7XG59XG5cbi8qKiBHZXQgd2hldGhlciB0ZXh0IGNvbG9yIGNoYW5nZSBpcyBlbmFibGVkIG9yIGRpc2FibGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENvbG9yRW5hYmxlZCgpOiBib29sZWFuIHtcbiAgcmV0dXJuIGVuYWJsZWQ7XG59XG5cbi8qKlxuICogQnVpbGRzIGNvbG9yIGNvZGVcbiAqIEBwYXJhbSBvcGVuXG4gKiBAcGFyYW0gY2xvc2VcbiAqL1xuZnVuY3Rpb24gY29kZShvcGVuOiBudW1iZXJbXSwgY2xvc2U6IG51bWJlcik6IENvZGUge1xuICByZXR1cm4ge1xuICAgIG9wZW46IGBcXHgxYlske29wZW4uam9pbihcIjtcIil9bWAsXG4gICAgY2xvc2U6IGBcXHgxYlske2Nsb3NlfW1gLFxuICAgIHJlZ2V4cDogbmV3IFJlZ0V4cChgXFxcXHgxYlxcXFxbJHtjbG9zZX1tYCwgXCJnXCIpLFxuICB9O1xufVxuXG4vKipcbiAqIEFwcGxpZXMgY29sb3IgYW5kIGJhY2tncm91bmQgYmFzZWQgb24gY29sb3IgY29kZSBhbmQgaXRzIGFzc29jaWF0ZWQgdGV4dFxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIGFwcGx5IGNvbG9yIHNldHRpbmdzIHRvXG4gKiBAcGFyYW0gY29kZSBjb2xvciBjb2RlIHRvIGFwcGx5XG4gKi9cbmZ1bmN0aW9uIHJ1bihzdHI6IHN0cmluZywgY29kZTogQ29kZSk6IHN0cmluZyB7XG4gIHJldHVybiBlbmFibGVkXG4gICAgPyBgJHtjb2RlLm9wZW59JHtzdHIucmVwbGFjZShjb2RlLnJlZ2V4cCwgY29kZS5vcGVuKX0ke2NvZGUuY2xvc2V9YFxuICAgIDogc3RyO1xufVxuXG4vKipcbiAqIFJlc2V0IHRoZSB0ZXh0IG1vZGlmaWVkXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gcmVzZXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0KHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzBdLCAwKSk7XG59XG5cbi8qKlxuICogTWFrZSB0aGUgdGV4dCBib2xkLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgYm9sZFxuICovXG5leHBvcnQgZnVuY3Rpb24gYm9sZChzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFsxXSwgMjIpKTtcbn1cblxuLyoqXG4gKiBUaGUgdGV4dCBlbWl0cyBvbmx5IGEgc21hbGwgYW1vdW50IG9mIGxpZ2h0LlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIGRpbVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGltKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzJdLCAyMikpO1xufVxuXG4vKipcbiAqIE1ha2UgdGhlIHRleHQgaXRhbGljLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRhbGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpdGFsaWMoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbM10sIDIzKSk7XG59XG5cbi8qKlxuICogTWFrZSB0aGUgdGV4dCB1bmRlcmxpbmUuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gdW5kZXJsaW5lXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1bmRlcmxpbmUoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbNF0sIDI0KSk7XG59XG5cbi8qKlxuICogSW52ZXJ0IGJhY2tncm91bmQgY29sb3IgYW5kIHRleHQgY29sb3IuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gaW52ZXJ0IGl0cyBjb2xvclxuICovXG5leHBvcnQgZnVuY3Rpb24gaW52ZXJzZShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs3XSwgMjcpKTtcbn1cblxuLyoqXG4gKiBNYWtlIHRoZSB0ZXh0IGhpZGRlbi5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBoaWRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoaWRkZW4oc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbOF0sIDI4KSk7XG59XG5cbi8qKlxuICogUHV0IGhvcml6b250YWwgbGluZSB0aHJvdWdoIHRoZSBjZW50ZXIgb2YgdGhlIHRleHQuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gc3RyaWtlIHRocm91Z2hcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmlrZXRocm91Z2goc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbOV0sIDI5KSk7XG59XG5cbi8qKlxuICogU2V0IHRleHQgY29sb3IgdG8gYmxhY2suXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBibGFja1xuICovXG5leHBvcnQgZnVuY3Rpb24gYmxhY2soc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMzBdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIHJlZC5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIHJlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVkKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzMxXSwgMzkpKTtcbn1cblxuLyoqXG4gKiBTZXQgdGV4dCBjb2xvciB0byBncmVlbi5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGdyZWVuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBncmVlbihzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFszMl0sIDM5KSk7XG59XG5cbi8qKlxuICogU2V0IHRleHQgY29sb3IgdG8geWVsbG93LlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgeWVsbG93XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB5ZWxsb3coc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMzNdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGJsdWUuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBibHVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBibHVlKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzM0XSwgMzkpKTtcbn1cblxuLyoqXG4gKiBTZXQgdGV4dCBjb2xvciB0byBtYWdlbnRhLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgbWFnZW50YVxuICovXG5leHBvcnQgZnVuY3Rpb24gbWFnZW50YShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFszNV0sIDM5KSk7XG59XG5cbi8qKlxuICogU2V0IHRleHQgY29sb3IgdG8gY3lhbi5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGN5YW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGN5YW4oc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMzZdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIHdoaXRlLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2Ugd2hpdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdoaXRlKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzM3XSwgMzkpKTtcbn1cblxuLyoqXG4gKiBTZXQgdGV4dCBjb2xvciB0byBncmF5LlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgZ3JheVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ3JheShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBicmlnaHRCbGFjayhzdHIpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGJyaWdodCBibGFjay5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGJyaWdodC1ibGFja1xuICovXG5leHBvcnQgZnVuY3Rpb24gYnJpZ2h0QmxhY2soc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbOTBdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGJyaWdodCByZWQuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBicmlnaHQtcmVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBicmlnaHRSZWQoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbOTFdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGJyaWdodCBncmVlbi5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGJyaWdodC1ncmVlblxuICovXG5leHBvcnQgZnVuY3Rpb24gYnJpZ2h0R3JlZW4oc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbOTJdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGJyaWdodCB5ZWxsb3cuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBicmlnaHQteWVsbG93XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBicmlnaHRZZWxsb3coc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbOTNdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGJyaWdodCBibHVlLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgYnJpZ2h0LWJsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJyaWdodEJsdWUoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbOTRdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGJyaWdodCBtYWdlbnRhLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgYnJpZ2h0LW1hZ2VudGFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJyaWdodE1hZ2VudGEoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbOTVdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGJyaWdodCBjeWFuLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgYnJpZ2h0LWN5YW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJyaWdodEN5YW4oc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbOTZdLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGJyaWdodCB3aGl0ZS5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGJyaWdodC13aGl0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYnJpZ2h0V2hpdGUoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbOTddLCAzOSkpO1xufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHRvIGJsYWNrLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgYmxhY2tcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnQmxhY2soc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbNDBdLCA0OSkpO1xufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHRvIHJlZC5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGl0cyBiYWNrZ3JvdW5kIHJlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gYmdSZWQoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbNDFdLCA0OSkpO1xufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHRvIGdyZWVuLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgZ3JlZW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnR3JlZW4oc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbNDJdLCA0OSkpO1xufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHRvIHllbGxvdy5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGl0cyBiYWNrZ3JvdW5kIHllbGxvd1xuICovXG5leHBvcnQgZnVuY3Rpb24gYmdZZWxsb3coc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbNDNdLCA0OSkpO1xufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHRvIGJsdWUuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCBibHVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ0JsdWUoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbNDRdLCA0OSkpO1xufVxuXG4vKipcbiAqICBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBtYWdlbnRhLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgbWFnZW50YVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmdNYWdlbnRhKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzQ1XSwgNDkpKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBjeWFuLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgY3lhblxuICovXG5leHBvcnQgZnVuY3Rpb24gYmdDeWFuKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzQ2XSwgNDkpKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byB3aGl0ZS5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGl0cyBiYWNrZ3JvdW5kIHdoaXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ1doaXRlKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzQ3XSwgNDkpKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBicmlnaHQgYmxhY2suXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCBicmlnaHQtYmxhY2tcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnQnJpZ2h0QmxhY2soc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMTAwXSwgNDkpKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBicmlnaHQgcmVkLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgYnJpZ2h0LXJlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gYmdCcmlnaHRSZWQoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMTAxXSwgNDkpKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBicmlnaHQgZ3JlZW4uXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCBicmlnaHQtZ3JlZW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnQnJpZ2h0R3JlZW4oc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMTAyXSwgNDkpKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBicmlnaHQgeWVsbG93LlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgYnJpZ2h0LXllbGxvd1xuICovXG5leHBvcnQgZnVuY3Rpb24gYmdCcmlnaHRZZWxsb3coc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMTAzXSwgNDkpKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBicmlnaHQgYmx1ZS5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGl0cyBiYWNrZ3JvdW5kIGJyaWdodC1ibHVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ0JyaWdodEJsdWUoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMTA0XSwgNDkpKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBicmlnaHQgbWFnZW50YS5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGl0cyBiYWNrZ3JvdW5kIGJyaWdodC1tYWdlbnRhXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ0JyaWdodE1hZ2VudGEoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMTA1XSwgNDkpKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBicmlnaHQgY3lhbi5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGl0cyBiYWNrZ3JvdW5kIGJyaWdodC1jeWFuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ0JyaWdodEN5YW4oc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMTA2XSwgNDkpKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBicmlnaHQgd2hpdGUuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCBicmlnaHQtd2hpdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnQnJpZ2h0V2hpdGUoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMTA3XSwgNDkpKTtcbn1cblxuLyogU3BlY2lhbCBDb2xvciBTZXF1ZW5jZXMgKi9cblxuLyoqXG4gKiBDbGFtIGFuZCB0cnVuY2F0ZSBjb2xvciBjb2Rlc1xuICogQHBhcmFtIG5cbiAqIEBwYXJhbSBtYXggbnVtYmVyIHRvIHRydW5jYXRlIHRvXG4gKiBAcGFyYW0gbWluIG51bWJlciB0byB0cnVuY2F0ZSBmcm9tXG4gKi9cbmZ1bmN0aW9uIGNsYW1wQW5kVHJ1bmNhdGUobjogbnVtYmVyLCBtYXggPSAyNTUsIG1pbiA9IDApOiBudW1iZXIge1xuICByZXR1cm4gTWF0aC50cnVuYyhNYXRoLm1heChNYXRoLm1pbihuLCBtYXgpLCBtaW4pKTtcbn1cblxuLyoqXG4gKiBTZXQgdGV4dCBjb2xvciB1c2luZyBwYWxldHRlZCA4Yml0IGNvbG9ycy5cbiAqIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjOC1iaXRcbiAqIEBwYXJhbSBzdHIgdGV4dCBjb2xvciB0byBhcHBseSBwYWxldHRlZCA4Yml0IGNvbG9ycyB0b1xuICogQHBhcmFtIGNvbG9yIGNvZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJnYjgoc3RyOiBzdHJpbmcsIGNvbG9yOiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMzgsIDUsIGNsYW1wQW5kVHJ1bmNhdGUoY29sb3IpXSwgMzkpKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB1c2luZyBwYWxldHRlZCA4Yml0IGNvbG9ycy5cbiAqIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjOC1iaXRcbiAqIEBwYXJhbSBzdHIgdGV4dCBjb2xvciB0byBhcHBseSBwYWxldHRlZCA4Yml0IGJhY2tncm91bmQgY29sb3JzIHRvXG4gKiBAcGFyYW0gY29sb3IgY29kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmdSZ2I4KHN0cjogc3RyaW5nLCBjb2xvcjogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzQ4LCA1LCBjbGFtcEFuZFRydW5jYXRlKGNvbG9yKV0sIDQ5KSk7XG59XG5cbi8qKlxuICogU2V0IHRleHQgY29sb3IgdXNpbmcgMjRiaXQgcmdiLlxuICogYGNvbG9yYCBjYW4gYmUgYSBudW1iZXIgaW4gcmFuZ2UgYDB4MDAwMDAwYCB0byBgMHhmZmZmZmZgIG9yXG4gKiBhbiBgUmdiYC5cbiAqXG4gKiBUbyBwcm9kdWNlIHRoZSBjb2xvciBtYWdlbnRhOlxuICpcbiAqICAgICAgcmdiMjQoXCJmb29cIiwgMHhmZjAwZmYpO1xuICogICAgICByZ2IyNChcImZvb1wiLCB7cjogMjU1LCBnOiAwLCBiOiAyNTV9KTtcbiAqIEBwYXJhbSBzdHIgdGV4dCBjb2xvciB0byBhcHBseSAyNGJpdCByZ2IgdG9cbiAqIEBwYXJhbSBjb2xvciBjb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZ2IyNChzdHI6IHN0cmluZywgY29sb3I6IG51bWJlciB8IFJnYik6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgY29sb3IgPT09IFwibnVtYmVyXCIpIHtcbiAgICByZXR1cm4gcnVuKFxuICAgICAgc3RyLFxuICAgICAgY29kZShcbiAgICAgICAgWzM4LCAyLCAoY29sb3IgPj4gMTYpICYgMHhmZiwgKGNvbG9yID4+IDgpICYgMHhmZiwgY29sb3IgJiAweGZmXSxcbiAgICAgICAgMzksXG4gICAgICApLFxuICAgICk7XG4gIH1cbiAgcmV0dXJuIHJ1bihcbiAgICBzdHIsXG4gICAgY29kZShcbiAgICAgIFtcbiAgICAgICAgMzgsXG4gICAgICAgIDIsXG4gICAgICAgIGNsYW1wQW5kVHJ1bmNhdGUoY29sb3IuciksXG4gICAgICAgIGNsYW1wQW5kVHJ1bmNhdGUoY29sb3IuZyksXG4gICAgICAgIGNsYW1wQW5kVHJ1bmNhdGUoY29sb3IuYiksXG4gICAgICBdLFxuICAgICAgMzksXG4gICAgKSxcbiAgKTtcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB1c2luZyAyNGJpdCByZ2IuXG4gKiBgY29sb3JgIGNhbiBiZSBhIG51bWJlciBpbiByYW5nZSBgMHgwMDAwMDBgIHRvIGAweGZmZmZmZmAgb3JcbiAqIGFuIGBSZ2JgLlxuICpcbiAqIFRvIHByb2R1Y2UgdGhlIGNvbG9yIG1hZ2VudGE6XG4gKlxuICogICAgICBiZ1JnYjI0KFwiZm9vXCIsIDB4ZmYwMGZmKTtcbiAqICAgICAgYmdSZ2IyNChcImZvb1wiLCB7cjogMjU1LCBnOiAwLCBiOiAyNTV9KTtcbiAqIEBwYXJhbSBzdHIgdGV4dCBjb2xvciB0byBhcHBseSAyNGJpdCByZ2IgdG9cbiAqIEBwYXJhbSBjb2xvciBjb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ1JnYjI0KHN0cjogc3RyaW5nLCBjb2xvcjogbnVtYmVyIHwgUmdiKTogc3RyaW5nIHtcbiAgaWYgKHR5cGVvZiBjb2xvciA9PT0gXCJudW1iZXJcIikge1xuICAgIHJldHVybiBydW4oXG4gICAgICBzdHIsXG4gICAgICBjb2RlKFxuICAgICAgICBbNDgsIDIsIChjb2xvciA+PiAxNikgJiAweGZmLCAoY29sb3IgPj4gOCkgJiAweGZmLCBjb2xvciAmIDB4ZmZdLFxuICAgICAgICA0OSxcbiAgICAgICksXG4gICAgKTtcbiAgfVxuICByZXR1cm4gcnVuKFxuICAgIHN0cixcbiAgICBjb2RlKFxuICAgICAgW1xuICAgICAgICA0OCxcbiAgICAgICAgMixcbiAgICAgICAgY2xhbXBBbmRUcnVuY2F0ZShjb2xvci5yKSxcbiAgICAgICAgY2xhbXBBbmRUcnVuY2F0ZShjb2xvci5nKSxcbiAgICAgICAgY2xhbXBBbmRUcnVuY2F0ZShjb2xvci5iKSxcbiAgICAgIF0sXG4gICAgICA0OSxcbiAgICApLFxuICApO1xufVxuXG4vLyBodHRwczovL2dpdGh1Yi5jb20vY2hhbGsvYW5zaS1yZWdleC9ibG9iLzJiNTZmYjBjN2EwNzEwOGU1YjU0MjQxZThmYWVjMTYwZDM5M2FlZGIvaW5kZXguanNcbmNvbnN0IEFOU0lfUEFUVEVSTiA9IG5ldyBSZWdFeHAoXG4gIFtcbiAgICBcIltcXFxcdTAwMUJcXFxcdTAwOUJdW1tcXFxcXSgpIzs/XSooPzooPzooPzpbYS16QS1aXFxcXGRdKig/OjtbLWEtekEtWlxcXFxkXFxcXC8jJi46PT8lQH5fXSopKik/XFxcXHUwMDA3KVwiLFxuICAgIFwiKD86KD86XFxcXGR7MSw0fSg/OjtcXFxcZHswLDR9KSopP1tcXFxcZEEtUFItVFpjZi1udHFyeT0+PH5dKSlcIixcbiAgXS5qb2luKFwifFwiKSxcbiAgXCJnXCIsXG4pO1xuXG4vKipcbiAqIFJlbW92ZSBBTlNJIGVzY2FwZSBjb2RlcyBmcm9tIHRoZSBzdHJpbmcuXG4gKiBAcGFyYW0gc3RyaW5nIHRvIHJlbW92ZSBBTlNJIGVzY2FwZSBjb2RlcyBmcm9tXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdHJpcENvbG9yKHN0cmluZzogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKEFOU0lfUEFUVEVSTiwgXCJcIik7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUFBMEUsQUFBMUUsd0VBQTBFO0FBQzFFLEVBQStFLEFBQS9FLDZFQUErRTtBQUMvRSxFQUFVLEFBQVYsUUFBVTtBQUNWLEVBQUU7QUFDRixFQUFNLEFBQU4sSUFBTTtBQUNOLEVBQTJFLEFBQTNFLHlFQUEyRTtBQUMzRSxFQUFrRCxBQUFsRCxnREFBa0Q7QUFDbEQsRUFBTSxBQUFOLElBQU07QUFDTixFQUFFO0FBQ0YsRUFBZ0YsQUFBaEYsOEVBQWdGO0FBQ2hGLEVBQXdCLEFBQXhCLHNCQUF3QjtBQUN4QixFQUFFO0FBQ0YsRUFBcUMsQUFBckMsbUNBQXFDO01BRS9CLE9BQU8sR0FBRyxVQUFVLENBQUMsSUFBSSxFQUFFLE9BQU8sSUFBSSxJQUFJO0lBZTVDLE9BQU8sSUFBSSxPQUFPO0FBRXRCLEVBR0csQUFISDs7O0NBR0csQUFISCxFQUdHLGlC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