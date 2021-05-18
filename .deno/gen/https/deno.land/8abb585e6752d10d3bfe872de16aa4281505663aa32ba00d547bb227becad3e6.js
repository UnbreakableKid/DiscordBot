// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
import { getFileInfoType } from "./_util.ts";
/**
 * Ensures that the directory exists.
 * If the directory structure does not exist, it is created. Like mkdir -p.
 * Requires the `--allow-read` and `--allow-write` flag.
 */ export async function ensureDir(dir) {
    try {
        const fileInfo = await Deno.lstat(dir);
        if (!fileInfo.isDirectory) {
            throw new Error(`Ensure path exists, expected 'dir', got '${getFileInfoType(fileInfo)}'`);
        }
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            // if dir not exists. then create it.
            await Deno.mkdir(dir, {
                recursive: true
            });
            return;
        }
        throw err;
    }
}
/**
 * Ensures that the directory exists.
 * If the directory structure does not exist, it is created. Like mkdir -p.
 * Requires the `--allow-read` and `--allow-write` flag.
 */ export function ensureDirSync(dir) {
    try {
        const fileInfo = Deno.lstatSync(dir);
        if (!fileInfo.isDirectory) {
            throw new Error(`Ensure path exists, expected 'dir', got '${getFileInfoType(fileInfo)}'`);
        }
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            // if dir not exists. then create it.
            Deno.mkdirSync(dir, {
                recursive: true
            });
            return;
        }
        throw err;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC43MS4wL2ZzL2Vuc3VyZV9kaXIudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjAgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5pbXBvcnQgeyBnZXRGaWxlSW5mb1R5cGUgfSBmcm9tIFwiLi9fdXRpbC50c1wiO1xuXG4vKipcbiAqIEVuc3VyZXMgdGhhdCB0aGUgZGlyZWN0b3J5IGV4aXN0cy5cbiAqIElmIHRoZSBkaXJlY3Rvcnkgc3RydWN0dXJlIGRvZXMgbm90IGV4aXN0LCBpdCBpcyBjcmVhdGVkLiBMaWtlIG1rZGlyIC1wLlxuICogUmVxdWlyZXMgdGhlIGAtLWFsbG93LXJlYWRgIGFuZCBgLS1hbGxvdy13cml0ZWAgZmxhZy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVuc3VyZURpcihkaXI6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICB0cnkge1xuICAgIGNvbnN0IGZpbGVJbmZvID0gYXdhaXQgRGVuby5sc3RhdChkaXIpO1xuICAgIGlmICghZmlsZUluZm8uaXNEaXJlY3RvcnkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYEVuc3VyZSBwYXRoIGV4aXN0cywgZXhwZWN0ZWQgJ2RpcicsIGdvdCAnJHtcbiAgICAgICAgICBnZXRGaWxlSW5mb1R5cGUoZmlsZUluZm8pXG4gICAgICAgIH0nYCxcbiAgICAgICk7XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoZXJyIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuTm90Rm91bmQpIHtcbiAgICAgIC8vIGlmIGRpciBub3QgZXhpc3RzLiB0aGVuIGNyZWF0ZSBpdC5cbiAgICAgIGF3YWl0IERlbm8ubWtkaXIoZGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG5cbi8qKlxuICogRW5zdXJlcyB0aGF0IHRoZSBkaXJlY3RvcnkgZXhpc3RzLlxuICogSWYgdGhlIGRpcmVjdG9yeSBzdHJ1Y3R1cmUgZG9lcyBub3QgZXhpc3QsIGl0IGlzIGNyZWF0ZWQuIExpa2UgbWtkaXIgLXAuXG4gKiBSZXF1aXJlcyB0aGUgYC0tYWxsb3ctcmVhZGAgYW5kIGAtLWFsbG93LXdyaXRlYCBmbGFnLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5zdXJlRGlyU3luYyhkaXI6IHN0cmluZyk6IHZvaWQge1xuICB0cnkge1xuICAgIGNvbnN0IGZpbGVJbmZvID0gRGVuby5sc3RhdFN5bmMoZGlyKTtcbiAgICBpZiAoIWZpbGVJbmZvLmlzRGlyZWN0b3J5KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBFbnN1cmUgcGF0aCBleGlzdHMsIGV4cGVjdGVkICdkaXInLCBnb3QgJyR7XG4gICAgICAgICAgZ2V0RmlsZUluZm9UeXBlKGZpbGVJbmZvKVxuICAgICAgICB9J2AsXG4gICAgICApO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKGVyciBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLk5vdEZvdW5kKSB7XG4gICAgICAvLyBpZiBkaXIgbm90IGV4aXN0cy4gdGhlbiBjcmVhdGUgaXQuXG4gICAgICBEZW5vLm1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUEwRSxBQUExRSx3RUFBMEU7U0FDakUsZUFBZSxTQUFRLFVBQVk7QUFFNUMsRUFJRyxBQUpIOzs7O0NBSUcsQUFKSCxFQUlHLHVCQUNtQixTQUFTLENBQUMsR0FBVzs7Y0FFakMsUUFBUSxTQUFTLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRzthQUNoQyxRQUFRLENBQUMsV0FBVztzQkFDYixLQUFLLEVBQ1oseUNBQXlDLEVBQ3hDLGVBQWUsQ0FBQyxRQUFRLEVBQ3pCLENBQUM7O2FBR0MsR0FBRztZQUNOLEdBQUcsWUFBWSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVE7WUFDckMsRUFBcUMsQUFBckMsbUNBQXFDO2tCQUMvQixJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUc7Z0JBQUksU0FBUyxFQUFFLElBQUk7Ozs7Y0FHbkMsR0FBRzs7O0FBSWIsRUFJRyxBQUpIOzs7O0NBSUcsQUFKSCxFQUlHLGlCQUNhLGFBQWEsQ0FBQyxHQUFXOztjQUUvQixRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHO2FBQzlCLFFBQVEsQ0FBQyxXQUFXO3NCQUNiLEtBQUssRUFDWix5Q0FBeUMsRUFDeEMsZUFBZSxDQUFDLFFBQVEsRUFDekIsQ0FBQzs7YUFHQyxHQUFHO1lBQ04sR0FBRyxZQUFZLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUTtZQUNyQyxFQUFxQyxBQUFyQyxtQ0FBcUM7WUFDckMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHO2dCQUFJLFNBQVMsRUFBRSxJQUFJOzs7O2NBR2pDLEdBQUcifQ==