// Copyright the Browserify authors. MIT License.
// Ported mostly from https://github.com/browserify/path-browserify/
// This module is browser compatible.
import { isWindows } from "../_util/os.ts";
import * as _win32 from "./win32.ts";
import * as _posix from "./posix.ts";
const path = isWindows ? _win32 : _posix;
export const win32 = _win32;
export const posix = _posix;
export const { basename , delimiter , dirname , extname , format , fromFileUrl , isAbsolute , join , normalize , parse , relative , resolve , sep , toFileUrl , toNamespacedPath ,  } = path;
export * from "./common.ts";
export { SEP, SEP_PATTERN } from "./separator.ts";
export * from "./_interface.ts";
export * from "./glob.ts";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45NS4wL3BhdGgvbW9kLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgdGhlIEJyb3dzZXJpZnkgYXV0aG9ycy4gTUlUIExpY2Vuc2UuXG4vLyBQb3J0ZWQgbW9zdGx5IGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2Jyb3dzZXJpZnkvcGF0aC1icm93c2VyaWZ5L1xuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBpc1dpbmRvd3MgfSBmcm9tIFwiLi4vX3V0aWwvb3MudHNcIjtcbmltcG9ydCAqIGFzIF93aW4zMiBmcm9tIFwiLi93aW4zMi50c1wiO1xuaW1wb3J0ICogYXMgX3Bvc2l4IGZyb20gXCIuL3Bvc2l4LnRzXCI7XG5cbmNvbnN0IHBhdGggPSBpc1dpbmRvd3MgPyBfd2luMzIgOiBfcG9zaXg7XG5cbmV4cG9ydCBjb25zdCB3aW4zMiA9IF93aW4zMjtcbmV4cG9ydCBjb25zdCBwb3NpeCA9IF9wb3NpeDtcbmV4cG9ydCBjb25zdCB7XG4gIGJhc2VuYW1lLFxuICBkZWxpbWl0ZXIsXG4gIGRpcm5hbWUsXG4gIGV4dG5hbWUsXG4gIGZvcm1hdCxcbiAgZnJvbUZpbGVVcmwsXG4gIGlzQWJzb2x1dGUsXG4gIGpvaW4sXG4gIG5vcm1hbGl6ZSxcbiAgcGFyc2UsXG4gIHJlbGF0aXZlLFxuICByZXNvbHZlLFxuICBzZXAsXG4gIHRvRmlsZVVybCxcbiAgdG9OYW1lc3BhY2VkUGF0aCxcbn0gPSBwYXRoO1xuXG5leHBvcnQgKiBmcm9tIFwiLi9jb21tb24udHNcIjtcbmV4cG9ydCB7IFNFUCwgU0VQX1BBVFRFUk4gfSBmcm9tIFwiLi9zZXBhcmF0b3IudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL19pbnRlcmZhY2UudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2dsb2IudHNcIjtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUFpRCxBQUFqRCwrQ0FBaUQ7QUFDakQsRUFBb0UsQUFBcEUsa0VBQW9FO0FBQ3BFLEVBQXFDLEFBQXJDLG1DQUFxQztTQUU1QixTQUFTLFNBQVEsY0FBZ0I7WUFDOUIsTUFBTSxPQUFNLFVBQVk7WUFDeEIsTUFBTSxPQUFNLFVBQVk7TUFFOUIsSUFBSSxHQUFHLFNBQVMsR0FBRyxNQUFNLEdBQUcsTUFBTTthQUUzQixLQUFLLEdBQUcsTUFBTTthQUNkLEtBQUssR0FBRyxNQUFNO2VBRXpCLFFBQVEsR0FDUixTQUFTLEdBQ1QsT0FBTyxHQUNQLE9BQU8sR0FDUCxNQUFNLEdBQ04sV0FBVyxHQUNYLFVBQVUsR0FDVixJQUFJLEdBQ0osU0FBUyxHQUNULEtBQUssR0FDTCxRQUFRLEdBQ1IsT0FBTyxHQUNQLEdBQUcsR0FDSCxTQUFTLEdBQ1QsZ0JBQWdCLFFBQ2QsSUFBSTtlQUVNLFdBQWE7U0FDbEIsR0FBRyxFQUFFLFdBQVcsU0FBUSxjQUFnQjtlQUNuQyxlQUFpQjtlQUNqQixTQUFXIn0=