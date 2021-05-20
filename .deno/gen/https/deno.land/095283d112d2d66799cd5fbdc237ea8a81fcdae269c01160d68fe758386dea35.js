// Copyright the Browserify authors. MIT License.
// Ported mostly from https://github.com/browserify/path-browserify/
/** This module is browser compatible. */ import { isWindows } from "./_constants.ts";
import * as _win32 from "./win32.ts";
import * as _posix from "./posix.ts";
const path = isWindows ? _win32 : _posix;
export const win32 = _win32;
export const posix = _posix;
export const {
  basename,
  delimiter,
  dirname,
  extname,
  format,
  fromFileUrl,
  isAbsolute,
  join,
  normalize,
  parse,
  relative,
  resolve,
  sep,
  toNamespacedPath,
} = path;
export * from "./common.ts";
export { SEP, SEP_PATTERN } from "./separator.ts";
export * from "./_interface.ts";
export * from "./glob.ts";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC42OS4wL3BhdGgvbW9kLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgdGhlIEJyb3dzZXJpZnkgYXV0aG9ycy4gTUlUIExpY2Vuc2UuXG4vLyBQb3J0ZWQgbW9zdGx5IGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2Jyb3dzZXJpZnkvcGF0aC1icm93c2VyaWZ5L1xuLyoqIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS4gKi9cblxuaW1wb3J0IHsgaXNXaW5kb3dzIH0gZnJvbSBcIi4vX2NvbnN0YW50cy50c1wiO1xuaW1wb3J0ICogYXMgX3dpbjMyIGZyb20gXCIuL3dpbjMyLnRzXCI7XG5pbXBvcnQgKiBhcyBfcG9zaXggZnJvbSBcIi4vcG9zaXgudHNcIjtcblxuY29uc3QgcGF0aCA9IGlzV2luZG93cyA/IF93aW4zMiA6IF9wb3NpeDtcblxuZXhwb3J0IGNvbnN0IHdpbjMyID0gX3dpbjMyO1xuZXhwb3J0IGNvbnN0IHBvc2l4ID0gX3Bvc2l4O1xuZXhwb3J0IGNvbnN0IHtcbiAgYmFzZW5hbWUsXG4gIGRlbGltaXRlcixcbiAgZGlybmFtZSxcbiAgZXh0bmFtZSxcbiAgZm9ybWF0LFxuICBmcm9tRmlsZVVybCxcbiAgaXNBYnNvbHV0ZSxcbiAgam9pbixcbiAgbm9ybWFsaXplLFxuICBwYXJzZSxcbiAgcmVsYXRpdmUsXG4gIHJlc29sdmUsXG4gIHNlcCxcbiAgdG9OYW1lc3BhY2VkUGF0aCxcbn0gPSBwYXRoO1xuXG5leHBvcnQgKiBmcm9tIFwiLi9jb21tb24udHNcIjtcbmV4cG9ydCB7IFNFUCwgU0VQX1BBVFRFUk4gfSBmcm9tIFwiLi9zZXBhcmF0b3IudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL19pbnRlcmZhY2UudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2dsb2IudHNcIjtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUFpRCxBQUFqRCwrQ0FBaUQ7QUFDakQsRUFBb0UsQUFBcEUsa0VBQW9FO0FBQ3BFLEVBQXlDLEFBQXpDLHFDQUF5QyxBQUF6QyxFQUF5QyxVQUVoQyxTQUFTLFNBQVEsZUFBaUI7WUFDL0IsTUFBTSxPQUFNLFVBQVk7WUFDeEIsTUFBTSxPQUFNLFVBQVk7TUFFOUIsSUFBSSxHQUFHLFNBQVMsR0FBRyxNQUFNLEdBQUcsTUFBTTthQUUzQixLQUFLLEdBQUcsTUFBTTthQUNkLEtBQUssR0FBRyxNQUFNO2VBRXpCLFFBQVEsR0FDUixTQUFTLEdBQ1QsT0FBTyxHQUNQLE9BQU8sR0FDUCxNQUFNLEdBQ04sV0FBVyxHQUNYLFVBQVUsR0FDVixJQUFJLEdBQ0osU0FBUyxHQUNULEtBQUssR0FDTCxRQUFRLEdBQ1IsT0FBTyxHQUNQLEdBQUcsR0FDSCxnQkFBZ0IsUUFDZCxJQUFJO2VBRU0sV0FBYTtTQUNsQixHQUFHLEVBQUUsV0FBVyxTQUFRLGNBQWdCO2VBQ25DLGVBQWlCO2VBQ2pCLFNBQVcifQ==