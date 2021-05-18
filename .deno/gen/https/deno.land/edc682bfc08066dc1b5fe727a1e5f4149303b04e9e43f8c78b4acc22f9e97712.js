// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
/** This module is browser compatible. */ import { isWindows } from "./_constants.ts";
export const SEP = isWindows ? "\\" : "/";
export const SEP_PATTERN = isWindows ? /[\\/]+/ : /\/+/;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC43MS4wL3BhdGgvc2VwYXJhdG9yLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIwIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLyoqIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS4gKi9cblxuaW1wb3J0IHsgaXNXaW5kb3dzIH0gZnJvbSBcIi4vX2NvbnN0YW50cy50c1wiO1xuXG5leHBvcnQgY29uc3QgU0VQID0gaXNXaW5kb3dzID8gXCJcXFxcXCIgOiBcIi9cIjtcbmV4cG9ydCBjb25zdCBTRVBfUEFUVEVSTiA9IGlzV2luZG93cyA/IC9bXFxcXC9dKy8gOiAvXFwvKy87XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUFBMEUsQUFBMUUsd0VBQTBFO0FBQzFFLEVBQXlDLEFBQXpDLHFDQUF5QyxBQUF6QyxFQUF5QyxVQUVoQyxTQUFTLFNBQVEsZUFBaUI7YUFFOUIsR0FBRyxHQUFHLFNBQVMsSUFBRyxFQUFJLEtBQUcsQ0FBRzthQUM1QixXQUFXLEdBQUcsU0FBUyJ9
