// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
import * as path from "../path/mod.ts";
import { ensureDir, ensureDirSync } from "./ensure_dir.ts";
import { getFileInfoType } from "./_util.ts";
/**
 * Ensures that the file exists.
 * If the file that is requested to be created is in directories that do not
 * exist.
 * these directories are created. If the file already exists,
 * it is NOTMODIFIED.
 * Requires the `--allow-read` and `--allow-write` flag.
 */ export async function ensureFile(filePath) {
  try {
    // if file exists
    const stat = await Deno.lstat(filePath);
    if (!stat.isFile) {
      throw new Error(
        `Ensure path exists, expected 'file', got '${getFileInfoType(stat)}'`,
      );
    }
  } catch (err) {
    // if file not exists
    if (err instanceof Deno.errors.NotFound) {
      // ensure dir exists
      await ensureDir(path.dirname(filePath));
      // create file
      await Deno.writeFile(filePath, new Uint8Array());
      return;
    }
    throw err;
  }
}
/**
 * Ensures that the file exists.
 * If the file that is requested to be created is in directories that do not
 * exist,
 * these directories are created. If the file already exists,
 * it is NOT MODIFIED.
 * Requires the `--allow-read` and `--allow-write` flag.
 */ export function ensureFileSync(filePath) {
  try {
    // if file exists
    const stat = Deno.lstatSync(filePath);
    if (!stat.isFile) {
      throw new Error(
        `Ensure path exists, expected 'file', got '${getFileInfoType(stat)}'`,
      );
    }
  } catch (err) {
    // if file not exists
    if (err instanceof Deno.errors.NotFound) {
      // ensure dir exists
      ensureDirSync(path.dirname(filePath));
      // create file
      Deno.writeFileSync(filePath, new Uint8Array());
      return;
    }
    throw err;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC43MS4wL2ZzL2Vuc3VyZV9maWxlLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIwIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwiLi4vcGF0aC9tb2QudHNcIjtcbmltcG9ydCB7IGVuc3VyZURpciwgZW5zdXJlRGlyU3luYyB9IGZyb20gXCIuL2Vuc3VyZV9kaXIudHNcIjtcbmltcG9ydCB7IGdldEZpbGVJbmZvVHlwZSB9IGZyb20gXCIuL191dGlsLnRzXCI7XG5cbi8qKlxuICogRW5zdXJlcyB0aGF0IHRoZSBmaWxlIGV4aXN0cy5cbiAqIElmIHRoZSBmaWxlIHRoYXQgaXMgcmVxdWVzdGVkIHRvIGJlIGNyZWF0ZWQgaXMgaW4gZGlyZWN0b3JpZXMgdGhhdCBkbyBub3RcbiAqIGV4aXN0LlxuICogdGhlc2UgZGlyZWN0b3JpZXMgYXJlIGNyZWF0ZWQuIElmIHRoZSBmaWxlIGFscmVhZHkgZXhpc3RzLFxuICogaXQgaXMgTk9UTU9ESUZJRUQuXG4gKiBSZXF1aXJlcyB0aGUgYC0tYWxsb3ctcmVhZGAgYW5kIGAtLWFsbG93LXdyaXRlYCBmbGFnLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW5zdXJlRmlsZShmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gIHRyeSB7XG4gICAgLy8gaWYgZmlsZSBleGlzdHNcbiAgICBjb25zdCBzdGF0ID0gYXdhaXQgRGVuby5sc3RhdChmaWxlUGF0aCk7XG4gICAgaWYgKCFzdGF0LmlzRmlsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgRW5zdXJlIHBhdGggZXhpc3RzLCBleHBlY3RlZCAnZmlsZScsIGdvdCAnJHtnZXRGaWxlSW5mb1R5cGUoc3RhdCl9J2AsXG4gICAgICApO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgLy8gaWYgZmlsZSBub3QgZXhpc3RzXG4gICAgaWYgKGVyciBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLk5vdEZvdW5kKSB7XG4gICAgICAvLyBlbnN1cmUgZGlyIGV4aXN0c1xuICAgICAgYXdhaXQgZW5zdXJlRGlyKHBhdGguZGlybmFtZShmaWxlUGF0aCkpO1xuICAgICAgLy8gY3JlYXRlIGZpbGVcbiAgICAgIGF3YWl0IERlbm8ud3JpdGVGaWxlKGZpbGVQYXRoLCBuZXcgVWludDhBcnJheSgpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cblxuLyoqXG4gKiBFbnN1cmVzIHRoYXQgdGhlIGZpbGUgZXhpc3RzLlxuICogSWYgdGhlIGZpbGUgdGhhdCBpcyByZXF1ZXN0ZWQgdG8gYmUgY3JlYXRlZCBpcyBpbiBkaXJlY3RvcmllcyB0aGF0IGRvIG5vdFxuICogZXhpc3QsXG4gKiB0aGVzZSBkaXJlY3RvcmllcyBhcmUgY3JlYXRlZC4gSWYgdGhlIGZpbGUgYWxyZWFkeSBleGlzdHMsXG4gKiBpdCBpcyBOT1QgTU9ESUZJRUQuXG4gKiBSZXF1aXJlcyB0aGUgYC0tYWxsb3ctcmVhZGAgYW5kIGAtLWFsbG93LXdyaXRlYCBmbGFnLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5zdXJlRmlsZVN5bmMoZmlsZVBhdGg6IHN0cmluZyk6IHZvaWQge1xuICB0cnkge1xuICAgIC8vIGlmIGZpbGUgZXhpc3RzXG4gICAgY29uc3Qgc3RhdCA9IERlbm8ubHN0YXRTeW5jKGZpbGVQYXRoKTtcbiAgICBpZiAoIXN0YXQuaXNGaWxlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBFbnN1cmUgcGF0aCBleGlzdHMsIGV4cGVjdGVkICdmaWxlJywgZ290ICcke2dldEZpbGVJbmZvVHlwZShzdGF0KX0nYCxcbiAgICAgICk7XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICAvLyBpZiBmaWxlIG5vdCBleGlzdHNcbiAgICBpZiAoZXJyIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuTm90Rm91bmQpIHtcbiAgICAgIC8vIGVuc3VyZSBkaXIgZXhpc3RzXG4gICAgICBlbnN1cmVEaXJTeW5jKHBhdGguZGlybmFtZShmaWxlUGF0aCkpO1xuICAgICAgLy8gY3JlYXRlIGZpbGVcbiAgICAgIERlbm8ud3JpdGVGaWxlU3luYyhmaWxlUGF0aCwgbmV3IFVpbnQ4QXJyYXkoKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRocm93IGVycjtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEVBQTBFLEFBQTFFLHdFQUEwRTtZQUM5RCxJQUFJLE9BQU0sY0FBZ0I7U0FDN0IsU0FBUyxFQUFFLGFBQWEsU0FBUSxlQUFpQjtTQUNqRCxlQUFlLFNBQVEsVUFBWTtBQUU1QyxFQU9HLEFBUEg7Ozs7Ozs7Q0FPRyxBQVBILEVBT0csdUJBQ21CLFVBQVUsQ0FBQyxRQUFnQjs7UUFFN0MsRUFBaUIsQUFBakIsZUFBaUI7Y0FDWCxJQUFJLFNBQVMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRO2FBQ2pDLElBQUksQ0FBQyxNQUFNO3NCQUNKLEtBQUssRUFDWiwwQ0FBMEMsRUFBRSxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUM7O2FBR2pFLEdBQUc7UUFDVixFQUFxQixBQUFyQixtQkFBcUI7WUFDakIsR0FBRyxZQUFZLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUTtZQUNyQyxFQUFvQixBQUFwQixrQkFBb0I7a0JBQ2QsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUTtZQUNyQyxFQUFjLEFBQWQsWUFBYztrQkFDUixJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsTUFBTSxVQUFVOzs7Y0FJekMsR0FBRzs7O0FBSWIsRUFPRyxBQVBIOzs7Ozs7O0NBT0csQUFQSCxFQU9HLGlCQUNhLGNBQWMsQ0FBQyxRQUFnQjs7UUFFM0MsRUFBaUIsQUFBakIsZUFBaUI7Y0FDWCxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRO2FBQy9CLElBQUksQ0FBQyxNQUFNO3NCQUNKLEtBQUssRUFDWiwwQ0FBMEMsRUFBRSxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUM7O2FBR2pFLEdBQUc7UUFDVixFQUFxQixBQUFyQixtQkFBcUI7WUFDakIsR0FBRyxZQUFZLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUTtZQUNyQyxFQUFvQixBQUFwQixrQkFBb0I7WUFDcEIsYUFBYSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUTtZQUNuQyxFQUFjLEFBQWQsWUFBYztZQUNkLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxNQUFNLFVBQVU7OztjQUd2QyxHQUFHIn0=
