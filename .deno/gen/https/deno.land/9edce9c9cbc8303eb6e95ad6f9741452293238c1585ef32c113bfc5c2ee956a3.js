// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// TODO(bartlomieju): implement the 'NodeJS.Timeout' and 'NodeJS.Immediate' versions of the timers.
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/1163ead296d84e7a3c80d71e7c81ecbd1a130e9a/types/node/v12/globals.d.ts#L1120-L1131
export const setTimeout = globalThis.setTimeout;
export const clearTimeout = globalThis.clearTimeout;
export const setInterval = globalThis.setInterval;
export const clearInterval = globalThis.clearInterval;
export const setImmediate = ( // deno-lint-ignore no-explicit-any
  cb, // deno-lint-ignore no-explicit-any
  ...args
) => globalThis.setTimeout(cb, 0, ...args);
export const clearImmediate = globalThis.clearTimeout;
export default {
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  setImmediate,
  clearImmediate,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45NS4wL25vZGUvdGltZXJzLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVE9ETyhiYXJ0bG9taWVqdSk6IGltcGxlbWVudCB0aGUgJ05vZGVKUy5UaW1lb3V0JyBhbmQgJ05vZGVKUy5JbW1lZGlhdGUnIHZlcnNpb25zIG9mIHRoZSB0aW1lcnMuXG4vLyBodHRwczovL2dpdGh1Yi5jb20vRGVmaW5pdGVseVR5cGVkL0RlZmluaXRlbHlUeXBlZC9ibG9iLzExNjNlYWQyOTZkODRlN2EzYzgwZDcxZTdjODFlY2JkMWExMzBlOWEvdHlwZXMvbm9kZS92MTIvZ2xvYmFscy5kLnRzI0wxMTIwLUwxMTMxXG5leHBvcnQgY29uc3Qgc2V0VGltZW91dCA9IGdsb2JhbFRoaXMuc2V0VGltZW91dDtcbmV4cG9ydCBjb25zdCBjbGVhclRpbWVvdXQgPSBnbG9iYWxUaGlzLmNsZWFyVGltZW91dDtcbmV4cG9ydCBjb25zdCBzZXRJbnRlcnZhbCA9IGdsb2JhbFRoaXMuc2V0SW50ZXJ2YWw7XG5leHBvcnQgY29uc3QgY2xlYXJJbnRlcnZhbCA9IGdsb2JhbFRoaXMuY2xlYXJJbnRlcnZhbDtcbmV4cG9ydCBjb25zdCBzZXRJbW1lZGlhdGUgPSAoXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIGNiOiAoLi4uYXJnczogYW55W10pID0+IHZvaWQsXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIC4uLmFyZ3M6IGFueVtdXG4pOiBudW1iZXIgPT4gZ2xvYmFsVGhpcy5zZXRUaW1lb3V0KGNiLCAwLCAuLi5hcmdzKTtcbmV4cG9ydCBjb25zdCBjbGVhckltbWVkaWF0ZSA9IGdsb2JhbFRoaXMuY2xlYXJUaW1lb3V0O1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIHNldFRpbWVvdXQsXG4gIGNsZWFyVGltZW91dCxcbiAgc2V0SW50ZXJ2YWwsXG4gIGNsZWFySW50ZXJ2YWwsXG4gIHNldEltbWVkaWF0ZSxcbiAgY2xlYXJJbW1lZGlhdGUsXG59O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEVBQTBFLEFBQTFFLHdFQUEwRTtBQUMxRSxFQUFtRyxBQUFuRyxpR0FBbUc7QUFDbkcsRUFBMkksQUFBM0kseUlBQTJJO2FBQzlILFVBQVUsR0FBRyxVQUFVLENBQUMsVUFBVTthQUNsQyxZQUFZLEdBQUcsVUFBVSxDQUFDLFlBQVk7YUFDdEMsV0FBVyxHQUFHLFVBQVUsQ0FBQyxXQUFXO2FBQ3BDLGFBQWEsR0FBRyxVQUFVLENBQUMsYUFBYTthQUN4QyxZQUFZLElBQ3ZCLEVBQW1DLEFBQW5DLGlDQUFtQztBQUNuQyxFQUE0QixFQUM1QixFQUFtQyxBQUFuQyxpQ0FBbUM7R0FDaEMsSUFBSSxHQUNJLFVBQVUsQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLENBQUMsS0FBSyxJQUFJOzthQUNwQyxjQUFjLEdBQUcsVUFBVSxDQUFDLFlBQVk7O0lBR25ELFVBQVU7SUFDVixZQUFZO0lBQ1osV0FBVztJQUNYLGFBQWE7SUFDYixZQUFZO0lBQ1osY0FBYyJ9
