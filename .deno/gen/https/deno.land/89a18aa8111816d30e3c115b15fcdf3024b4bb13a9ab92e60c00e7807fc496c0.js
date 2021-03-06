// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
import * as path from "../path/mod.ts";
/**
 * Test whether or not `dest` is a sub-directory of `src`
 * @param src src file path
 * @param dest dest file path
 * @param sep path separator
 */ export function isSubdir(src, dest, sep = path.sep) {
  if (src === dest) {
    return false;
  }
  const srcArray = src.split(sep);
  const destArray = dest.split(sep);
  return srcArray.every((current, i) => destArray[i] === current);
}
/**
 * Get a human readable file type string.
 *
 * @param fileInfo A FileInfo describes a file and is returned by `stat`,
 *                 `lstat`
 */ export function getFileInfoType(fileInfo) {
  return fileInfo.isFile
    ? "file"
    : fileInfo.isDirectory
    ? "dir"
    : fileInfo.isSymlink
    ? "symlink"
    : undefined;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC43MS4wL2ZzL191dGlsLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIwIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwiLi4vcGF0aC9tb2QudHNcIjtcblxuLyoqXG4gKiBUZXN0IHdoZXRoZXIgb3Igbm90IGBkZXN0YCBpcyBhIHN1Yi1kaXJlY3Rvcnkgb2YgYHNyY2BcbiAqIEBwYXJhbSBzcmMgc3JjIGZpbGUgcGF0aFxuICogQHBhcmFtIGRlc3QgZGVzdCBmaWxlIHBhdGhcbiAqIEBwYXJhbSBzZXAgcGF0aCBzZXBhcmF0b3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzU3ViZGlyKFxuICBzcmM6IHN0cmluZyxcbiAgZGVzdDogc3RyaW5nLFxuICBzZXA6IHN0cmluZyA9IHBhdGguc2VwLFxuKTogYm9vbGVhbiB7XG4gIGlmIChzcmMgPT09IGRlc3QpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3Qgc3JjQXJyYXkgPSBzcmMuc3BsaXQoc2VwKTtcbiAgY29uc3QgZGVzdEFycmF5ID0gZGVzdC5zcGxpdChzZXApO1xuICByZXR1cm4gc3JjQXJyYXkuZXZlcnkoKGN1cnJlbnQsIGkpID0+IGRlc3RBcnJheVtpXSA9PT0gY3VycmVudCk7XG59XG5cbmV4cG9ydCB0eXBlIFBhdGhUeXBlID0gXCJmaWxlXCIgfCBcImRpclwiIHwgXCJzeW1saW5rXCI7XG5cbi8qKlxuICogR2V0IGEgaHVtYW4gcmVhZGFibGUgZmlsZSB0eXBlIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0gZmlsZUluZm8gQSBGaWxlSW5mbyBkZXNjcmliZXMgYSBmaWxlIGFuZCBpcyByZXR1cm5lZCBieSBgc3RhdGAsXG4gKiAgICAgICAgICAgICAgICAgYGxzdGF0YFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RmlsZUluZm9UeXBlKGZpbGVJbmZvOiBEZW5vLkZpbGVJbmZvKTogUGF0aFR5cGUgfCB1bmRlZmluZWQge1xuICByZXR1cm4gZmlsZUluZm8uaXNGaWxlXG4gICAgPyBcImZpbGVcIlxuICAgIDogZmlsZUluZm8uaXNEaXJlY3RvcnlcbiAgICA/IFwiZGlyXCJcbiAgICA6IGZpbGVJbmZvLmlzU3ltbGlua1xuICAgID8gXCJzeW1saW5rXCJcbiAgICA6IHVuZGVmaW5lZDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUEwRSxBQUExRSx3RUFBMEU7WUFDOUQsSUFBSSxPQUFNLGNBQWdCO0FBRXRDLEVBS0csQUFMSDs7Ozs7Q0FLRyxBQUxILEVBS0csaUJBQ2EsUUFBUSxDQUN0QixHQUFXLEVBQ1gsSUFBWSxFQUNaLEdBQVcsR0FBRyxJQUFJLENBQUMsR0FBRztRQUVsQixHQUFHLEtBQUssSUFBSTtlQUNQLEtBQUs7O1VBRVIsUUFBUSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRztVQUN4QixTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHO1dBQ3pCLFFBQVEsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUMsR0FBSyxTQUFTLENBQUMsQ0FBQyxNQUFNLE9BQU87OztBQUtoRSxFQUtHLEFBTEg7Ozs7O0NBS0csQUFMSCxFQUtHLGlCQUNhLGVBQWUsQ0FBQyxRQUF1QjtXQUM5QyxRQUFRLENBQUMsTUFBTSxJQUNsQixJQUFNLElBQ04sUUFBUSxDQUFDLFdBQVcsSUFDcEIsR0FBSyxJQUNMLFFBQVEsQ0FBQyxTQUFTLElBQ2xCLE9BQVMsSUFDVCxTQUFTIn0=
