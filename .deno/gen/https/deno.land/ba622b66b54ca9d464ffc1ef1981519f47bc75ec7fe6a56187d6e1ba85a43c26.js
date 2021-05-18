// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
/**
 * A module to print ANSI terminal colors. Inspired by chalk, kleur, and colors
 * on npm.
 *
 * ```
 * import { bgBlue, red, bold } from "https://deno.land/std/fmt/colors.ts";
 * console.log(bgBlue(red(bold("Hello world!"))));
 * ```
 *
 * This module supports `NO_COLOR` environmental variable disabling any coloring
 * if `NO_COLOR` is set.
 */ const { noColor } = Deno;
let enabled = !noColor;
export function setColorEnabled(value) {
  if (noColor) {
    return;
  }
  enabled = value;
}
export function getColorEnabled() {
  return enabled;
}
function code(open, close) {
  return {
    open: `\x1b[${open.join(";")}m`,
    close: `\x1b[${close}m`,
    regexp: new RegExp(`\\x1b\\[${close}m`, "g"),
  };
}
function run(str, code) {
  return enabled
    ? `${code.open}${str.replace(code.regexp, code.open)}${code.close}`
    : str;
}
export function reset(str) {
  return run(
    str,
    code([
      0,
    ], 0),
  );
}
export function bold(str) {
  return run(
    str,
    code([
      1,
    ], 22),
  );
}
export function dim(str) {
  return run(
    str,
    code([
      2,
    ], 22),
  );
}
export function italic(str) {
  return run(
    str,
    code([
      3,
    ], 23),
  );
}
export function underline(str) {
  return run(
    str,
    code([
      4,
    ], 24),
  );
}
export function inverse(str) {
  return run(
    str,
    code([
      7,
    ], 27),
  );
}
export function hidden(str) {
  return run(
    str,
    code([
      8,
    ], 28),
  );
}
export function strikethrough(str) {
  return run(
    str,
    code([
      9,
    ], 29),
  );
}
export function black(str) {
  return run(
    str,
    code([
      30,
    ], 39),
  );
}
export function red(str) {
  return run(
    str,
    code([
      31,
    ], 39),
  );
}
export function green(str) {
  return run(
    str,
    code([
      32,
    ], 39),
  );
}
export function yellow(str) {
  return run(
    str,
    code([
      33,
    ], 39),
  );
}
export function blue(str) {
  return run(
    str,
    code([
      34,
    ], 39),
  );
}
export function magenta(str) {
  return run(
    str,
    code([
      35,
    ], 39),
  );
}
export function cyan(str) {
  return run(
    str,
    code([
      36,
    ], 39),
  );
}
export function white(str) {
  return run(
    str,
    code([
      37,
    ], 39),
  );
}
export function gray(str) {
  return run(
    str,
    code([
      90,
    ], 39),
  );
}
export function bgBlack(str) {
  return run(
    str,
    code([
      40,
    ], 49),
  );
}
export function bgRed(str) {
  return run(
    str,
    code([
      41,
    ], 49),
  );
}
export function bgGreen(str) {
  return run(
    str,
    code([
      42,
    ], 49),
  );
}
export function bgYellow(str) {
  return run(
    str,
    code([
      43,
    ], 49),
  );
}
export function bgBlue(str) {
  return run(
    str,
    code([
      44,
    ], 49),
  );
}
export function bgMagenta(str) {
  return run(
    str,
    code([
      45,
    ], 49),
  );
}
export function bgCyan(str) {
  return run(
    str,
    code([
      46,
    ], 49),
  );
}
export function bgWhite(str) {
  return run(
    str,
    code([
      47,
    ], 49),
  );
}
/* Special Color Sequences */ function clampAndTruncate(n, max = 255, min = 0) {
  return Math.trunc(Math.max(Math.min(n, max), min));
}
/** Set text color using paletted 8bit colors.
 * https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit */ export function rgb8(
  str,
  color,
) {
  return run(
    str,
    code([
      38,
      5,
      clampAndTruncate(color),
    ], 39),
  );
}
/** Set background color using paletted 8bit colors.
 * https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit */ export function bgRgb8(
  str,
  color,
) {
  return run(
    str,
    code([
      48,
      5,
      clampAndTruncate(color),
    ], 49),
  );
}
/** Set text color using 24bit rgb. */ export function rgb24(str, color) {
  return run(
    str,
    code([
      38,
      2,
      clampAndTruncate(color.r),
      clampAndTruncate(color.g),
      clampAndTruncate(color.b),
    ], 39),
  );
}
/** Set background color using 24bit rgb. */ export function bgRgb24(
  str,
  color,
) {
  return run(
    str,
    code([
      48,
      2,
      clampAndTruncate(color.r),
      clampAndTruncate(color.g),
      clampAndTruncate(color.b),
    ], 49),
  );
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC41MS4wL2ZtdC9jb2xvcnMudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjAgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vKipcbiAqIEEgbW9kdWxlIHRvIHByaW50IEFOU0kgdGVybWluYWwgY29sb3JzLiBJbnNwaXJlZCBieSBjaGFsaywga2xldXIsIGFuZCBjb2xvcnNcbiAqIG9uIG5wbS5cbiAqXG4gKiBgYGBcbiAqIGltcG9ydCB7IGJnQmx1ZSwgcmVkLCBib2xkIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZC9mbXQvY29sb3JzLnRzXCI7XG4gKiBjb25zb2xlLmxvZyhiZ0JsdWUocmVkKGJvbGQoXCJIZWxsbyB3b3JsZCFcIikpKSk7XG4gKiBgYGBcbiAqXG4gKiBUaGlzIG1vZHVsZSBzdXBwb3J0cyBgTk9fQ09MT1JgIGVudmlyb25tZW50YWwgdmFyaWFibGUgZGlzYWJsaW5nIGFueSBjb2xvcmluZ1xuICogaWYgYE5PX0NPTE9SYCBpcyBzZXQuXG4gKi9cbmNvbnN0IHsgbm9Db2xvciB9ID0gRGVubztcblxuaW50ZXJmYWNlIENvZGUge1xuICBvcGVuOiBzdHJpbmc7XG4gIGNsb3NlOiBzdHJpbmc7XG4gIHJlZ2V4cDogUmVnRXhwO1xufVxuXG4vKiogUkdCIDgtYml0cyBwZXIgY2hhbm5lbC4gRWFjaCBpbiByYW5nZSBgMC0+MjU1YCBvciBgMHgwMC0+MHhmZmAgKi9cbmludGVyZmFjZSBSZ2Ige1xuICByOiBudW1iZXI7XG4gIGc6IG51bWJlcjtcbiAgYjogbnVtYmVyO1xufVxuXG5sZXQgZW5hYmxlZCA9ICFub0NvbG9yO1xuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q29sb3JFbmFibGVkKHZhbHVlOiBib29sZWFuKTogdm9pZCB7XG4gIGlmIChub0NvbG9yKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgZW5hYmxlZCA9IHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29sb3JFbmFibGVkKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gZW5hYmxlZDtcbn1cblxuZnVuY3Rpb24gY29kZShvcGVuOiBudW1iZXJbXSwgY2xvc2U6IG51bWJlcik6IENvZGUge1xuICByZXR1cm4ge1xuICAgIG9wZW46IGBcXHgxYlske29wZW4uam9pbihcIjtcIil9bWAsXG4gICAgY2xvc2U6IGBcXHgxYlske2Nsb3NlfW1gLFxuICAgIHJlZ2V4cDogbmV3IFJlZ0V4cChgXFxcXHgxYlxcXFxbJHtjbG9zZX1tYCwgXCJnXCIpLFxuICB9O1xufVxuXG5mdW5jdGlvbiBydW4oc3RyOiBzdHJpbmcsIGNvZGU6IENvZGUpOiBzdHJpbmcge1xuICByZXR1cm4gZW5hYmxlZFxuICAgID8gYCR7Y29kZS5vcGVufSR7c3RyLnJlcGxhY2UoY29kZS5yZWdleHAsIGNvZGUub3Blbil9JHtjb2RlLmNsb3NlfWBcbiAgICA6IHN0cjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0KHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzBdLCAwKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBib2xkKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzFdLCAyMikpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGltKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzJdLCAyMikpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXRhbGljKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzNdLCAyMykpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5kZXJsaW5lKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzRdLCAyNCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW52ZXJzZShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs3XSwgMjcpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhpZGRlbihzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs4XSwgMjgpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmlrZXRocm91Z2goc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbOV0sIDI5KSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBibGFjayhzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFszMF0sIDM5KSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWQoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMzFdLCAzOSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ3JlZW4oc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMzJdLCAzOSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24geWVsbG93KHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzMzXSwgMzkpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJsdWUoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMzRdLCAzOSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFnZW50YShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFszNV0sIDM5KSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjeWFuKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzM2XSwgMzkpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdoaXRlKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzM3XSwgMzkpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdyYXkoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbOTBdLCAzOSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYmdCbGFjayhzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs0MF0sIDQ5KSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBiZ1JlZChzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs0MV0sIDQ5KSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBiZ0dyZWVuKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzQyXSwgNDkpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJnWWVsbG93KHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzQzXSwgNDkpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJnQmx1ZShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs0NF0sIDQ5KSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBiZ01hZ2VudGEoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbNDVdLCA0OSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYmdDeWFuKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzQ2XSwgNDkpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJnV2hpdGUoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbNDddLCA0OSkpO1xufVxuXG4vKiBTcGVjaWFsIENvbG9yIFNlcXVlbmNlcyAqL1xuXG5mdW5jdGlvbiBjbGFtcEFuZFRydW5jYXRlKG46IG51bWJlciwgbWF4ID0gMjU1LCBtaW4gPSAwKTogbnVtYmVyIHtcbiAgcmV0dXJuIE1hdGgudHJ1bmMoTWF0aC5tYXgoTWF0aC5taW4obiwgbWF4KSwgbWluKSk7XG59XG5cbi8qKiBTZXQgdGV4dCBjb2xvciB1c2luZyBwYWxldHRlZCA4Yml0IGNvbG9ycy5cbiAqIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjOC1iaXQgKi9cbmV4cG9ydCBmdW5jdGlvbiByZ2I4KHN0cjogc3RyaW5nLCBjb2xvcjogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzM4LCA1LCBjbGFtcEFuZFRydW5jYXRlKGNvbG9yKV0sIDM5KSk7XG59XG5cbi8qKiBTZXQgYmFja2dyb3VuZCBjb2xvciB1c2luZyBwYWxldHRlZCA4Yml0IGNvbG9ycy5cbiAqIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjOC1iaXQgKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ1JnYjgoc3RyOiBzdHJpbmcsIGNvbG9yOiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbNDgsIDUsIGNsYW1wQW5kVHJ1bmNhdGUoY29sb3IpXSwgNDkpKTtcbn1cblxuLyoqIFNldCB0ZXh0IGNvbG9yIHVzaW5nIDI0Yml0IHJnYi4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZ2IyNChzdHI6IHN0cmluZywgY29sb3I6IFJnYik6IHN0cmluZyB7XG4gIHJldHVybiBydW4oXG4gICAgc3RyLFxuICAgIGNvZGUoXG4gICAgICBbXG4gICAgICAgIDM4LFxuICAgICAgICAyLFxuICAgICAgICBjbGFtcEFuZFRydW5jYXRlKGNvbG9yLnIpLFxuICAgICAgICBjbGFtcEFuZFRydW5jYXRlKGNvbG9yLmcpLFxuICAgICAgICBjbGFtcEFuZFRydW5jYXRlKGNvbG9yLmIpLFxuICAgICAgXSxcbiAgICAgIDM5XG4gICAgKVxuICApO1xufVxuXG4vKiogU2V0IGJhY2tncm91bmQgY29sb3IgdXNpbmcgMjRiaXQgcmdiLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnUmdiMjQoc3RyOiBzdHJpbmcsIGNvbG9yOiBSZ2IpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKFxuICAgIHN0cixcbiAgICBjb2RlKFxuICAgICAgW1xuICAgICAgICA0OCxcbiAgICAgICAgMixcbiAgICAgICAgY2xhbXBBbmRUcnVuY2F0ZShjb2xvci5yKSxcbiAgICAgICAgY2xhbXBBbmRUcnVuY2F0ZShjb2xvci5nKSxcbiAgICAgICAgY2xhbXBBbmRUcnVuY2F0ZShjb2xvci5iKSxcbiAgICAgIF0sXG4gICAgICA0OVxuICAgIClcbiAgKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUEwRSxBQUExRSx3RUFBMEU7QUFDMUUsRUFXRyxBQVhIOzs7Ozs7Ozs7OztDQVdHLEFBWEgsRUFXRyxTQUNLLE9BQU8sTUFBSyxJQUFJO0lBZXBCLE9BQU8sSUFBSSxPQUFPO2dCQUVOLGVBQWUsQ0FBQyxLQUFjO1FBQ3hDLE9BQU87OztJQUlYLE9BQU8sR0FBRyxLQUFLOztnQkFHRCxlQUFlO1dBQ3RCLE9BQU87O1NBR1AsSUFBSSxDQUFDLElBQWMsRUFBRSxLQUFhOztRQUV2QyxJQUFJLEdBQUcsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUMsQ0FBRyxHQUFFLENBQUM7UUFDOUIsS0FBSyxHQUFHLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN0QixNQUFNLE1BQU0sTUFBTSxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQyxJQUFHLENBQUc7OztTQUl0QyxHQUFHLENBQUMsR0FBVyxFQUFFLElBQVU7V0FDM0IsT0FBTyxNQUNQLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUssS0FDL0QsR0FBRzs7Z0JBR08sS0FBSyxDQUFD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
