// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { SEP } from "./separator.ts";
/** Determines the common path from a set of paths, using an optional separator,
 * which defaults to the OS default separator.
 *
 *       import { common } from "https://deno.land/std/path/mod.ts";
 *       const p = common([
 *         "./deno/std/path/mod.ts",
 *         "./deno/std/fs/mod.ts",
 *       ]);
 *       console.log(p); // "./deno/std/"
 *
 */ export function common(paths, sep = SEP) {
  const [first = "", ...remaining] = paths;
  if (first === "" || remaining.length === 0) {
    return first.substring(0, first.lastIndexOf(sep) + 1);
  }
  const parts = first.split(sep);
  let endOfPrefix = parts.length;
  for (const path of remaining) {
    const compare = path.split(sep);
    for (let i = 0; i < endOfPrefix; i++) {
      if (compare[i] !== parts[i]) {
        endOfPrefix = i;
      }
    }
    if (endOfPrefix === 0) {
      return "";
    }
  }
  const prefix = parts.slice(0, endOfPrefix).join(sep);
  return prefix.endsWith(sep) ? prefix : `${prefix}${sep}`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45NC4wL3BhdGgvY29tbW9uLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBTRVAgfSBmcm9tIFwiLi9zZXBhcmF0b3IudHNcIjtcblxuLyoqIERldGVybWluZXMgdGhlIGNvbW1vbiBwYXRoIGZyb20gYSBzZXQgb2YgcGF0aHMsIHVzaW5nIGFuIG9wdGlvbmFsIHNlcGFyYXRvcixcbiAqIHdoaWNoIGRlZmF1bHRzIHRvIHRoZSBPUyBkZWZhdWx0IHNlcGFyYXRvci5cbiAqXG4gKiAgICAgICBpbXBvcnQgeyBjb21tb24gfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkL3BhdGgvbW9kLnRzXCI7XG4gKiAgICAgICBjb25zdCBwID0gY29tbW9uKFtcbiAqICAgICAgICAgXCIuL2Rlbm8vc3RkL3BhdGgvbW9kLnRzXCIsXG4gKiAgICAgICAgIFwiLi9kZW5vL3N0ZC9mcy9tb2QudHNcIixcbiAqICAgICAgIF0pO1xuICogICAgICAgY29uc29sZS5sb2cocCk7IC8vIFwiLi9kZW5vL3N0ZC9cIlxuICpcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbW1vbihwYXRoczogc3RyaW5nW10sIHNlcCA9IFNFUCk6IHN0cmluZyB7XG4gIGNvbnN0IFtmaXJzdCA9IFwiXCIsIC4uLnJlbWFpbmluZ10gPSBwYXRocztcbiAgaWYgKGZpcnN0ID09PSBcIlwiIHx8IHJlbWFpbmluZy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gZmlyc3Quc3Vic3RyaW5nKDAsIGZpcnN0Lmxhc3RJbmRleE9mKHNlcCkgKyAxKTtcbiAgfVxuICBjb25zdCBwYXJ0cyA9IGZpcnN0LnNwbGl0KHNlcCk7XG5cbiAgbGV0IGVuZE9mUHJlZml4ID0gcGFydHMubGVuZ3RoO1xuICBmb3IgKGNvbnN0IHBhdGggb2YgcmVtYWluaW5nKSB7XG4gICAgY29uc3QgY29tcGFyZSA9IHBhdGguc3BsaXQoc2VwKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVuZE9mUHJlZml4OyBpKyspIHtcbiAgICAgIGlmIChjb21wYXJlW2ldICE9PSBwYXJ0c1tpXSkge1xuICAgICAgICBlbmRPZlByZWZpeCA9IGk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGVuZE9mUHJlZml4ID09PSAwKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gIH1cbiAgY29uc3QgcHJlZml4ID0gcGFydHMuc2xpY2UoMCwgZW5kT2ZQcmVmaXgpLmpvaW4oc2VwKTtcbiAgcmV0dXJuIHByZWZpeC5lbmRzV2l0aChzZXApID8gcHJlZml4IDogYCR7cHJlZml4fSR7c2VwfWA7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUFBMEUsQUFBMUUsd0VBQTBFO0FBQzFFLEVBQXFDLEFBQXJDLG1DQUFxQztTQUU1QixHQUFHLFNBQVEsY0FBZ0I7QUFFcEMsRUFVRyxBQVZIOzs7Ozs7Ozs7O0NBVUcsQUFWSCxFQVVHLGlCQUNhLE1BQU0sQ0FBQyxLQUFlLEVBQUUsR0FBRyxHQUFHLEdBQUc7V0FDeEMsS0FBSyxVQUFVLFNBQVMsSUFBSSxLQUFLO1FBQ3BDLEtBQUssV0FBVyxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUM7ZUFDakMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLElBQUksQ0FBQzs7VUFFaEQsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRztRQUV6QixXQUFXLEdBQUcsS0FBSyxDQUFDLE1BQU07ZUFDbkIsSUFBSSxJQUFJLFNBQVM7Y0FDcEIsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRztnQkFDckIsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsV0FBVyxFQUFFLENBQUM7Z0JBQzVCLE9BQU8sQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7Z0JBQ3hCLFdBQVcsR0FBRyxDQUFDOzs7WUFJZixXQUFXLEtBQUssQ0FBQzs7OztVQUlqQixNQUFNLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxHQUFHO1dBQzVDLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLE1BQU0sTUFBTSxNQUFNLEdBQUcsR0FBRyJ9
