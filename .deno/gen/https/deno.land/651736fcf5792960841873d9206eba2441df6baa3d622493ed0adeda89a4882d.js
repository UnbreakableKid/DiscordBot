import { Buffer } from "./buffer.ts";
const DEFAULT_BUFFER_SIZE = 32 * 1024;
/** Read Reader `r` until EOF (`null`) and resolve to the content as
 * Uint8Array`.
 *
 * ```ts
 *
 * // Example from stdin
 * const stdinContent = await readAll(Deno.stdin);
 *
 * // Example from file
 * const file = await Deno.open("my_file.txt", {read: true});
 * const myFileContent = await readAll(file);
 * Deno.close(file.rid);
 *
 * // Example from buffer
 * const myData = new Uint8Array(100);
 * // ... fill myData array with data
 * const reader = new Buffer(myData.buffer as ArrayBuffer);
 * const bufferContent = await readAll(reader);
 * ```
 */ export async function readAll(r) {
  const buf = new Buffer();
  await buf.readFrom(r);
  return buf.bytes();
}
/** Synchronously reads Reader `r` until EOF (`null`) and returns the content
 * as `Uint8Array`.
 *
 * ```ts
 * // Example from stdin
 * const stdinContent = readAllSync(Deno.stdin);
 *
 * // Example from file
 * const file = Deno.openSync("my_file.txt", {read: true});
 * const myFileContent = readAllSync(file);
 * Deno.close(file.rid);
 *
 * // Example from buffer
 * const myData = new Uint8Array(100);
 * // ... fill myData array with data
 * const reader = new Buffer(myData.buffer as ArrayBuffer);
 * const bufferContent = readAllSync(reader);
 * ```
 */ export function readAllSync(r) {
  const buf = new Buffer();
  buf.readFromSync(r);
  return buf.bytes();
}
/** Write all the content of the array buffer (`arr`) to the writer (`w`).
 *
 * ```ts
 * // Example writing to stdout
 * const contentBytes = new TextEncoder().encode("Hello World");
 * await writeAll(Deno.stdout, contentBytes);
 *
 * // Example writing to file
 * const contentBytes = new TextEncoder().encode("Hello World");
 * const file = await Deno.open('test.file', {write: true});
 * await writeAll(file, contentBytes);
 * Deno.close(file.rid);
 *
 * // Example writing to buffer
 * const contentBytes = new TextEncoder().encode("Hello World");
 * const writer = new Buffer();
 * await writeAll(writer, contentBytes);
 * console.log(writer.bytes().length);  // 11
 * ```
 */ export async function writeAll(w, arr) {
  let nwritten = 0;
  while (nwritten < arr.length) {
    nwritten += await w.write(arr.subarray(nwritten));
  }
}
/** Synchronously write all the content of the array buffer (`arr`) to the
 * writer (`w`).
 *
 * ```ts
 * // Example writing to stdout
 * const contentBytes = new TextEncoder().encode("Hello World");
 * writeAllSync(Deno.stdout, contentBytes);
 *
 * // Example writing to file
 * const contentBytes = new TextEncoder().encode("Hello World");
 * const file = Deno.openSync('test.file', {write: true});
 * writeAllSync(file, contentBytes);
 * Deno.close(file.rid);
 *
 * // Example writing to buffer
 * const contentBytes = new TextEncoder().encode("Hello World");
 * const writer = new Buffer();
 * writeAllSync(writer, contentBytes);
 * console.log(writer.bytes().length);  // 11
 * ```
 */ export function writeAllSync(w, arr) {
  let nwritten = 0;
  while (nwritten < arr.length) {
    nwritten += w.writeSync(arr.subarray(nwritten));
  }
}
/** Turns a Reader, `r`, into an async iterator.
 *
 * ```ts
 * let f = await Deno.open("/etc/passwd");
 * for await (const chunk of iter(f)) {
 *   console.log(chunk);
 * }
 * f.close();
 * ```
 *
 * Second argument can be used to tune size of a buffer.
 * Default size of the buffer is 32kB.
 *
 * ```ts
 * let f = await Deno.open("/etc/passwd");
 * const iter = iter(f, {
 *   bufSize: 1024 * 1024
 * });
 * for await (const chunk of iter) {
 *   console.log(chunk);
 * }
 * f.close();
 * ```
 *
 * Iterator uses an internal buffer of fixed size for efficiency; it returns
 * a view on that buffer on each iteration. It is therefore caller's
 * responsibility to copy contents of the buffer if needed; otherwise the
 * next iteration will overwrite contents of previously returned chunk.
 */ export async function* iter(r, options) {
  const bufSize = options?.bufSize ?? DEFAULT_BUFFER_SIZE;
  const b = new Uint8Array(bufSize);
  while (true) {
    const result = await r.read(b);
    if (result === null) {
      break;
    }
    yield b.subarray(0, result);
  }
}
/** Turns a ReaderSync, `r`, into an iterator.
 *
 * ```ts
 * let f = Deno.openSync("/etc/passwd");
 * for (const chunk of iterSync(f)) {
 *   console.log(chunk);
 * }
 * f.close();
 * ```
 *
 * Second argument can be used to tune size of a buffer.
 * Default size of the buffer is 32kB.
 *
 * ```ts
 * let f = await Deno.open("/etc/passwd");
 * const iter = iterSync(f, {
 *   bufSize: 1024 * 1024
 * });
 * for (const chunk of iter) {
 *   console.log(chunk);
 * }
 * f.close();
 * ```
 *
 * Iterator uses an internal buffer of fixed size for efficiency; it returns
 * a view on that buffer on each iteration. It is therefore caller's
 * responsibility to copy contents of the buffer if needed; otherwise the
 * next iteration will overwrite contents of previously returned chunk.
 */ export function* iterSync(r, options) {
  const bufSize = options?.bufSize ?? DEFAULT_BUFFER_SIZE;
  const b = new Uint8Array(bufSize);
  while (true) {
    const result = r.readSync(b);
    if (result === null) {
      break;
    }
    yield b.subarray(0, result);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45NS4wL2lvL3V0aWwudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCIuL2J1ZmZlci50c1wiO1xuXG5jb25zdCBERUZBVUxUX0JVRkZFUl9TSVpFID0gMzIgKiAxMDI0O1xuXG4vKiogUmVhZCBSZWFkZXIgYHJgIHVudGlsIEVPRiAoYG51bGxgKSBhbmQgcmVzb2x2ZSB0byB0aGUgY29udGVudCBhc1xuICogVWludDhBcnJheWAuXG4gKlxuICogYGBgdHNcbiAqIFxuICogLy8gRXhhbXBsZSBmcm9tIHN0ZGluXG4gKiBjb25zdCBzdGRpbkNvbnRlbnQgPSBhd2FpdCByZWFkQWxsKERlbm8uc3RkaW4pO1xuICpcbiAqIC8vIEV4YW1wbGUgZnJvbSBmaWxlXG4gKiBjb25zdCBmaWxlID0gYXdhaXQgRGVuby5vcGVuKFwibXlfZmlsZS50eHRcIiwge3JlYWQ6IHRydWV9KTtcbiAqIGNvbnN0IG15RmlsZUNvbnRlbnQgPSBhd2FpdCByZWFkQWxsKGZpbGUpO1xuICogRGVuby5jbG9zZShmaWxlLnJpZCk7XG4gKlxuICogLy8gRXhhbXBsZSBmcm9tIGJ1ZmZlclxuICogY29uc3QgbXlEYXRhID0gbmV3IFVpbnQ4QXJyYXkoMTAwKTtcbiAqIC8vIC4uLiBmaWxsIG15RGF0YSBhcnJheSB3aXRoIGRhdGFcbiAqIGNvbnN0IHJlYWRlciA9IG5ldyBCdWZmZXIobXlEYXRhLmJ1ZmZlciBhcyBBcnJheUJ1ZmZlcik7XG4gKiBjb25zdCBidWZmZXJDb250ZW50ID0gYXdhaXQgcmVhZEFsbChyZWFkZXIpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkQWxsKHI6IERlbm8uUmVhZGVyKTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG4gIGNvbnN0IGJ1ZiA9IG5ldyBCdWZmZXIoKTtcbiAgYXdhaXQgYnVmLnJlYWRGcm9tKHIpO1xuICByZXR1cm4gYnVmLmJ5dGVzKCk7XG59XG5cbi8qKiBTeW5jaHJvbm91c2x5IHJlYWRzIFJlYWRlciBgcmAgdW50aWwgRU9GIChgbnVsbGApIGFuZCByZXR1cm5zIHRoZSBjb250ZW50XG4gKiBhcyBgVWludDhBcnJheWAuXG4gKlxuICogYGBgdHNcbiAqIC8vIEV4YW1wbGUgZnJvbSBzdGRpblxuICogY29uc3Qgc3RkaW5Db250ZW50ID0gcmVhZEFsbFN5bmMoRGVuby5zdGRpbik7XG4gKlxuICogLy8gRXhhbXBsZSBmcm9tIGZpbGVcbiAqIGNvbnN0IGZpbGUgPSBEZW5vLm9wZW5TeW5jKFwibXlfZmlsZS50eHRcIiwge3JlYWQ6IHRydWV9KTtcbiAqIGNvbnN0IG15RmlsZUNvbnRlbnQgPSByZWFkQWxsU3luYyhmaWxlKTtcbiAqIERlbm8uY2xvc2UoZmlsZS5yaWQpO1xuICpcbiAqIC8vIEV4YW1wbGUgZnJvbSBidWZmZXJcbiAqIGNvbnN0IG15RGF0YSA9IG5ldyBVaW50OEFycmF5KDEwMCk7XG4gKiAvLyAuLi4gZmlsbCBteURhdGEgYXJyYXkgd2l0aCBkYXRhXG4gKiBjb25zdCByZWFkZXIgPSBuZXcgQnVmZmVyKG15RGF0YS5idWZmZXIgYXMgQXJyYXlCdWZmZXIpO1xuICogY29uc3QgYnVmZmVyQ29udGVudCA9IHJlYWRBbGxTeW5jKHJlYWRlcik7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRBbGxTeW5jKHI6IERlbm8uUmVhZGVyU3luYyk6IFVpbnQ4QXJyYXkge1xuICBjb25zdCBidWYgPSBuZXcgQnVmZmVyKCk7XG4gIGJ1Zi5yZWFkRnJvbVN5bmMocik7XG4gIHJldHVybiBidWYuYnl0ZXMoKTtcbn1cblxuLyoqIFdyaXRlIGFsbCB0aGUgY29udGVudCBvZiB0aGUgYXJyYXkgYnVmZmVyIChgYXJyYCkgdG8gdGhlIHdyaXRlciAoYHdgKS5cbiAqXG4gKiBgYGB0c1xuICogLy8gRXhhbXBsZSB3cml0aW5nIHRvIHN0ZG91dFxuICogY29uc3QgY29udGVudEJ5dGVzID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiSGVsbG8gV29ybGRcIik7XG4gKiBhd2FpdCB3cml0ZUFsbChEZW5vLnN0ZG91dCwgY29udGVudEJ5dGVzKTtcbiAqXG4gKiAvLyBFeGFtcGxlIHdyaXRpbmcgdG8gZmlsZVxuICogY29uc3QgY29udGVudEJ5dGVzID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiSGVsbG8gV29ybGRcIik7XG4gKiBjb25zdCBmaWxlID0gYXdhaXQgRGVuby5vcGVuKCd0ZXN0LmZpbGUnLCB7d3JpdGU6IHRydWV9KTtcbiAqIGF3YWl0IHdyaXRlQWxsKGZpbGUsIGNvbnRlbnRCeXRlcyk7XG4gKiBEZW5vLmNsb3NlKGZpbGUucmlkKTtcbiAqXG4gKiAvLyBFeGFtcGxlIHdyaXRpbmcgdG8gYnVmZmVyXG4gKiBjb25zdCBjb250ZW50Qnl0ZXMgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJIZWxsbyBXb3JsZFwiKTtcbiAqIGNvbnN0IHdyaXRlciA9IG5ldyBCdWZmZXIoKTtcbiAqIGF3YWl0IHdyaXRlQWxsKHdyaXRlciwgY29udGVudEJ5dGVzKTtcbiAqIGNvbnNvbGUubG9nKHdyaXRlci5ieXRlcygpLmxlbmd0aCk7ICAvLyAxMVxuICogYGBgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3cml0ZUFsbCh3OiBEZW5vLldyaXRlciwgYXJyOiBVaW50OEFycmF5KSB7XG4gIGxldCBud3JpdHRlbiA9IDA7XG4gIHdoaWxlIChud3JpdHRlbiA8IGFyci5sZW5ndGgpIHtcbiAgICBud3JpdHRlbiArPSBhd2FpdCB3LndyaXRlKGFyci5zdWJhcnJheShud3JpdHRlbikpO1xuICB9XG59XG5cbi8qKiBTeW5jaHJvbm91c2x5IHdyaXRlIGFsbCB0aGUgY29udGVudCBvZiB0aGUgYXJyYXkgYnVmZmVyIChgYXJyYCkgdG8gdGhlXG4gKiB3cml0ZXIgKGB3YCkuXG4gKlxuICogYGBgdHNcbiAqIC8vIEV4YW1wbGUgd3JpdGluZyB0byBzdGRvdXRcbiAqIGNvbnN0IGNvbnRlbnRCeXRlcyA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcIkhlbGxvIFdvcmxkXCIpO1xuICogd3JpdGVBbGxTeW5jKERlbm8uc3Rkb3V0LCBjb250ZW50Qnl0ZXMpO1xuICpcbiAqIC8vIEV4YW1wbGUgd3JpdGluZyB0byBmaWxlXG4gKiBjb25zdCBjb250ZW50Qnl0ZXMgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJIZWxsbyBXb3JsZFwiKTtcbiAqIGNvbnN0IGZpbGUgPSBEZW5vLm9wZW5TeW5jKCd0ZXN0LmZpbGUnLCB7d3JpdGU6IHRydWV9KTtcbiAqIHdyaXRlQWxsU3luYyhmaWxlLCBjb250ZW50Qnl0ZXMpO1xuICogRGVuby5jbG9zZShmaWxlLnJpZCk7XG4gKlxuICogLy8gRXhhbXBsZSB3cml0aW5nIHRvIGJ1ZmZlclxuICogY29uc3QgY29udGVudEJ5dGVzID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiSGVsbG8gV29ybGRcIik7XG4gKiBjb25zdCB3cml0ZXIgPSBuZXcgQnVmZmVyKCk7XG4gKiB3cml0ZUFsbFN5bmMod3JpdGVyLCBjb250ZW50Qnl0ZXMpO1xuICogY29uc29sZS5sb2cod3JpdGVyLmJ5dGVzKCkubGVuZ3RoKTsgIC8vIDExXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlQWxsU3luYyh3OiBEZW5vLldyaXRlclN5bmMsIGFycjogVWludDhBcnJheSk6IHZvaWQge1xuICBsZXQgbndyaXR0ZW4gPSAwO1xuICB3aGlsZSAobndyaXR0ZW4gPCBhcnIubGVuZ3RoKSB7XG4gICAgbndyaXR0ZW4gKz0gdy53cml0ZVN5bmMoYXJyLnN1YmFycmF5KG53cml0dGVuKSk7XG4gIH1cbn1cblxuLyoqIFR1cm5zIGEgUmVhZGVyLCBgcmAsIGludG8gYW4gYXN5bmMgaXRlcmF0b3IuXG4gKlxuICogYGBgdHNcbiAqIGxldCBmID0gYXdhaXQgRGVuby5vcGVuKFwiL2V0Yy9wYXNzd2RcIik7XG4gKiBmb3IgYXdhaXQgKGNvbnN0IGNodW5rIG9mIGl0ZXIoZikpIHtcbiAqICAgY29uc29sZS5sb2coY2h1bmspO1xuICogfVxuICogZi5jbG9zZSgpO1xuICogYGBgXG4gKlxuICogU2Vjb25kIGFyZ3VtZW50IGNhbiBiZSB1c2VkIHRvIHR1bmUgc2l6ZSBvZiBhIGJ1ZmZlci5cbiAqIERlZmF1bHQgc2l6ZSBvZiB0aGUgYnVmZmVyIGlzIDMya0IuXG4gKlxuICogYGBgdHNcbiAqIGxldCBmID0gYXdhaXQgRGVuby5vcGVuKFwiL2V0Yy9wYXNzd2RcIik7XG4gKiBjb25zdCBpdGVyID0gaXRlcihmLCB7XG4gKiAgIGJ1ZlNpemU6IDEwMjQgKiAxMDI0XG4gKiB9KTtcbiAqIGZvciBhd2FpdCAoY29uc3QgY2h1bmsgb2YgaXRlcikge1xuICogICBjb25zb2xlLmxvZyhjaHVuayk7XG4gKiB9XG4gKiBmLmNsb3NlKCk7XG4gKiBgYGBcbiAqXG4gKiBJdGVyYXRvciB1c2VzIGFuIGludGVybmFsIGJ1ZmZlciBvZiBmaXhlZCBzaXplIGZvciBlZmZpY2llbmN5OyBpdCByZXR1cm5zXG4gKiBhIHZpZXcgb24gdGhhdCBidWZmZXIgb24gZWFjaCBpdGVyYXRpb24uIEl0IGlzIHRoZXJlZm9yZSBjYWxsZXInc1xuICogcmVzcG9uc2liaWxpdHkgdG8gY29weSBjb250ZW50cyBvZiB0aGUgYnVmZmVyIGlmIG5lZWRlZDsgb3RoZXJ3aXNlIHRoZVxuICogbmV4dCBpdGVyYXRpb24gd2lsbCBvdmVyd3JpdGUgY29udGVudHMgb2YgcHJldmlvdXNseSByZXR1cm5lZCBjaHVuay5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uKiBpdGVyKFxuICByOiBEZW5vLlJlYWRlcixcbiAgb3B0aW9ucz86IHtcbiAgICBidWZTaXplPzogbnVtYmVyO1xuICB9LFxuKTogQXN5bmNJdGVyYWJsZUl0ZXJhdG9yPFVpbnQ4QXJyYXk+IHtcbiAgY29uc3QgYnVmU2l6ZSA9IG9wdGlvbnM/LmJ1ZlNpemUgPz8gREVGQVVMVF9CVUZGRVJfU0laRTtcbiAgY29uc3QgYiA9IG5ldyBVaW50OEFycmF5KGJ1ZlNpemUpO1xuICB3aGlsZSAodHJ1ZSkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHIucmVhZChiKTtcbiAgICBpZiAocmVzdWx0ID09PSBudWxsKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICB5aWVsZCBiLnN1YmFycmF5KDAsIHJlc3VsdCk7XG4gIH1cbn1cblxuLyoqIFR1cm5zIGEgUmVhZGVyU3luYywgYHJgLCBpbnRvIGFuIGl0ZXJhdG9yLlxuICpcbiAqIGBgYHRzXG4gKiBsZXQgZiA9IERlbm8ub3BlblN5bmMoXCIvZXRjL3Bhc3N3ZFwiKTtcbiAqIGZvciAoY29uc3QgY2h1bmsgb2YgaXRlclN5bmMoZikpIHtcbiAqICAgY29uc29sZS5sb2coY2h1bmspO1xuICogfVxuICogZi5jbG9zZSgpO1xuICogYGBgXG4gKlxuICogU2Vjb25kIGFyZ3VtZW50IGNhbiBiZSB1c2VkIHRvIHR1bmUgc2l6ZSBvZiBhIGJ1ZmZlci5cbiAqIERlZmF1bHQgc2l6ZSBvZiB0aGUgYnVmZmVyIGlzIDMya0IuXG4gKlxuICogYGBgdHNcbiAqIGxldCBmID0gYXdhaXQgRGVuby5vcGVuKFwiL2V0Yy9wYXNzd2RcIik7XG4gKiBjb25zdCBpdGVyID0gaXRlclN5bmMoZiwge1xuICogICBidWZTaXplOiAxMDI0ICogMTAyNFxuICogfSk7XG4gKiBmb3IgKGNvbnN0IGNodW5rIG9mIGl0ZXIpIHtcbiAqICAgY29uc29sZS5sb2coY2h1bmspO1xuICogfVxuICogZi5jbG9zZSgpO1xuICogYGBgXG4gKlxuICogSXRlcmF0b3IgdXNlcyBhbiBpbnRlcm5hbCBidWZmZXIgb2YgZml4ZWQgc2l6ZSBmb3IgZWZmaWNpZW5jeTsgaXQgcmV0dXJuc1xuICogYSB2aWV3IG9uIHRoYXQgYnVmZmVyIG9uIGVhY2ggaXRlcmF0aW9uLiBJdCBpcyB0aGVyZWZvcmUgY2FsbGVyJ3NcbiAqIHJlc3BvbnNpYmlsaXR5IHRvIGNvcHkgY29udGVudHMgb2YgdGhlIGJ1ZmZlciBpZiBuZWVkZWQ7IG90aGVyd2lzZSB0aGVcbiAqIG5leHQgaXRlcmF0aW9uIHdpbGwgb3ZlcndyaXRlIGNvbnRlbnRzIG9mIHByZXZpb3VzbHkgcmV0dXJuZWQgY2h1bmsuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiogaXRlclN5bmMoXG4gIHI6IERlbm8uUmVhZGVyU3luYyxcbiAgb3B0aW9ucz86IHtcbiAgICBidWZTaXplPzogbnVtYmVyO1xuICB9LFxuKTogSXRlcmFibGVJdGVyYXRvcjxVaW50OEFycmF5PiB7XG4gIGNvbnN0IGJ1ZlNpemUgPSBvcHRpb25zPy5idWZTaXplID8/IERFRkFVTFRfQlVGRkVSX1NJWkU7XG4gIGNvbnN0IGIgPSBuZXcgVWludDhBcnJheShidWZTaXplKTtcbiAgd2hpbGUgKHRydWUpIHtcbiAgICBjb25zdCByZXN1bHQgPSByLnJlYWRTeW5jKGIpO1xuICAgIGlmIChyZXN1bHQgPT09IG51bGwpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHlpZWxkIGIuc3ViYXJyYXkoMCwgcmVzdWx0KTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLE1BQU0sU0FBUSxXQUFhO01BRTlCLG1CQUFtQixHQUFHLEVBQUUsR0FBRyxJQUFJO0FBRXJDLEVBbUJHLEFBbkJIOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBbUJHLEFBbkJILEVBbUJHLHVCQUNtQixPQUFPLENBQUMsQ0FBYztVQUNwQyxHQUFHLE9BQU8sTUFBTTtVQUNoQixHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7V0FDYixHQUFHLENBQUMsS0FBSzs7QUFHbEIsRUFrQkcsQUFsQkg7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQWtCRyxBQWxCSCxFQWtCRyxpQkFDYSxXQUFXLENBQUMsQ0FBa0I7VUFDdEMsR0FBRyxPQUFPLE1BQU07SUFDdEIsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO1dBQ1gsR0FBRyxDQUFDLEtBQUs7O0FBR2xCLEVBbUJHLEFBbkJIOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBbUJHLEFBbkJILEVBbUJHLHVCQUNtQixRQUFRLENBQUMsQ0FBYyxFQUFFLEdBQWU7UUFDeEQsUUFBUSxHQUFHLENBQUM7VUFDVCxRQUFRLEdBQUcsR0FBRyxDQUFDLE1BQU07UUFDMUIsUUFBUSxVQUFVLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFROzs7QUFJbkQsRUFvQkcsQUFwQkg7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBb0JHLEFBcEJILEVBb0JHLGlCQUNhLFlBQVksQ0FBQyxDQUFrQixFQUFFLEdBQWU7UUFDMUQsUUFBUSxHQUFHLENBQUM7VUFDVCxRQUFRLEdBQUcsR0FBRyxDQUFDLE1BQU07UUFDMUIsUUFBUSxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFROzs7QUFJakQsRUE0QkcsQUE1Qkg7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0E0QkcsQUE1QkgsRUE0Qkcsd0JBQ29CLElBQUksQ0FDekIsQ0FBYyxFQUNkLE9BRUM7VUFFSyxPQUFPLEdBQUcsT0FBTyxFQUFFLE9BQU8sSUFBSSxtQkFBbUI7VUFDakQsQ0FBQyxPQUFPLFVBQVUsQ0FBQyxPQUFPO1VBQ3pCLElBQUk7Y0FDSCxNQUFNLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pCLE1BQU0sS0FBSyxJQUFJOzs7Y0FJYixDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxNQUFNOzs7QUFJOUIsRUE0QkcsQUE1Qkg7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0E0QkcsQUE1QkgsRUE0Qkcsa0JBQ2MsUUFBUSxDQUN2QixDQUFrQixFQUNsQixPQUVDO1VBRUssT0FBTyxHQUFHLE9BQU8sRUFBRSxPQUFPLElBQUksbUJBQW1CO1VBQ2pELENBQUMsT0FBTyxVQUFVLENBQUMsT0FBTztVQUN6QixJQUFJO2NBQ0gsTUFBTSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN2QixNQUFNLEtBQUssSUFBSTs7O2NBSWIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsTUFBTSJ9
