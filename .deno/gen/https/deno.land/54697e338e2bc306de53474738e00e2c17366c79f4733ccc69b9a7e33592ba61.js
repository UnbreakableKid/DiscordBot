import { assert } from "../_util/assert.ts";
const DEFAULT_BUFFER_SIZE = 32 * 1024;
/** copy N size at the most.
 *  If read size is lesser than N, then returns nread
 * */ export async function copyN(r, dest, size) {
  let bytesRead = 0;
  let buf = new Uint8Array(DEFAULT_BUFFER_SIZE);
  while (bytesRead < size) {
    if (size - bytesRead < DEFAULT_BUFFER_SIZE) {
      buf = new Uint8Array(size - bytesRead);
    }
    const result = await r.read(buf);
    const nread = result ?? 0;
    bytesRead += nread;
    if (nread > 0) {
      let n = 0;
      while (n < nread) {
        n += await dest.write(buf.slice(n, nread));
      }
      assert(n === nread, "could not write");
    }
    if (result === null) {
      break;
    }
  }
  return bytesRead;
}
/** Read big endian 16bit short from BufReader */ export async function readShort(
  buf,
) {
  const high = await buf.readByte();
  if (high === null) return null;
  const low = await buf.readByte();
  if (low === null) throw new Deno.errors.UnexpectedEof();
  return high << 8 | low;
}
/** Read big endian 32bit integer from BufReader */ export async function readInt(
  buf,
) {
  const high = await readShort(buf);
  if (high === null) return null;
  const low = await readShort(buf);
  if (low === null) throw new Deno.errors.UnexpectedEof();
  return high << 16 | low;
}
const MAX_SAFE_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);
/** Read big endian 64bit long from BufReader */ export async function readLong(
  buf,
) {
  const high = await readInt(buf);
  if (high === null) return null;
  const low = await readInt(buf);
  if (low === null) throw new Deno.errors.UnexpectedEof();
  const big = BigInt(high) << 32n | BigInt(low);
  // We probably should provide a similar API that returns BigInt values.
  if (big > MAX_SAFE_INTEGER) {
    throw new RangeError(
      "Long value too big to be represented as a JavaScript number.",
    );
  }
  return Number(big);
}
/** Slice number into 64bit big endian byte array */ export function sliceLongToBytes(
  d,
  dest = new Array(8),
) {
  let big = BigInt(d);
  for (let i = 0; i < 8; i++) {
    dest[7 - i] = Number(big & 255n);
    big >>= 8n;
  }
  return dest;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC42Ni4wL2lvL2lvdXRpbC50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbmltcG9ydCB0eXBlIHsgQnVmUmVhZGVyIH0gZnJvbSBcIi4vYnVmaW8udHNcIjtcbnR5cGUgUmVhZGVyID0gRGVuby5SZWFkZXI7XG50eXBlIFdyaXRlciA9IERlbm8uV3JpdGVyO1xuaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcIi4uL191dGlsL2Fzc2VydC50c1wiO1xuXG5jb25zdCBERUZBVUxUX0JVRkZFUl9TSVpFID0gMzIgKiAxMDI0O1xuXG4vKiogY29weSBOIHNpemUgYXQgdGhlIG1vc3QuXG4gKiAgSWYgcmVhZCBzaXplIGlzIGxlc3NlciB0aGFuIE4sIHRoZW4gcmV0dXJucyBucmVhZFxuICogKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb3B5TihcbiAgcjogUmVhZGVyLFxuICBkZXN0OiBXcml0ZXIsXG4gIHNpemU6IG51bWJlcixcbik6IFByb21pc2U8bnVtYmVyPiB7XG4gIGxldCBieXRlc1JlYWQgPSAwO1xuICBsZXQgYnVmID0gbmV3IFVpbnQ4QXJyYXkoREVGQVVMVF9CVUZGRVJfU0laRSk7XG4gIHdoaWxlIChieXRlc1JlYWQgPCBzaXplKSB7XG4gICAgaWYgKHNpemUgLSBieXRlc1JlYWQgPCBERUZBVUxUX0JVRkZFUl9TSVpFKSB7XG4gICAgICBidWYgPSBuZXcgVWludDhBcnJheShzaXplIC0gYnl0ZXNSZWFkKTtcbiAgICB9XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgci5yZWFkKGJ1Zik7XG4gICAgY29uc3QgbnJlYWQgPSByZXN1bHQgPz8gMDtcbiAgICBieXRlc1JlYWQgKz0gbnJlYWQ7XG4gICAgaWYgKG5yZWFkID4gMCkge1xuICAgICAgbGV0IG4gPSAwO1xuICAgICAgd2hpbGUgKG4gPCBucmVhZCkge1xuICAgICAgICBuICs9IGF3YWl0IGRlc3Qud3JpdGUoYnVmLnNsaWNlKG4sIG5yZWFkKSk7XG4gICAgICB9XG4gICAgICBhc3NlcnQobiA9PT0gbnJlYWQsIFwiY291bGQgbm90IHdyaXRlXCIpO1xuICAgIH1cbiAgICBpZiAocmVzdWx0ID09PSBudWxsKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGJ5dGVzUmVhZDtcbn1cblxuLyoqIFJlYWQgYmlnIGVuZGlhbiAxNmJpdCBzaG9ydCBmcm9tIEJ1ZlJlYWRlciAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRTaG9ydChidWY6IEJ1ZlJlYWRlcik6IFByb21pc2U8bnVtYmVyIHwgbnVsbD4ge1xuICBjb25zdCBoaWdoID0gYXdhaXQgYnVmLnJlYWRCeXRlKCk7XG4gIGlmIChoaWdoID09PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgbG93ID0gYXdhaXQgYnVmLnJlYWRCeXRlKCk7XG4gIGlmIChsb3cgPT09IG51bGwpIHRocm93IG5ldyBEZW5vLmVycm9ycy5VbmV4cGVjdGVkRW9mKCk7XG4gIHJldHVybiAoaGlnaCA8PCA4KSB8IGxvdztcbn1cblxuLyoqIFJlYWQgYmlnIGVuZGlhbiAzMmJpdCBpbnRlZ2VyIGZyb20gQnVmUmVhZGVyICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZEludChidWY6IEJ1ZlJlYWRlcik6IFByb21pc2U8bnVtYmVyIHwgbnVsbD4ge1xuICBjb25zdCBoaWdoID0gYXdhaXQgcmVhZFNob3J0KGJ1Zik7XG4gIGlmIChoaWdoID09PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgbG93ID0gYXdhaXQgcmVhZFNob3J0KGJ1Zik7XG4gIGlmIChsb3cgPT09IG51bGwpIHRocm93IG5ldyBEZW5vLmVycm9ycy5VbmV4cGVjdGVkRW9mKCk7XG4gIHJldHVybiAoaGlnaCA8PCAxNikgfCBsb3c7XG59XG5cbmNvbnN0IE1BWF9TQUZFX0lOVEVHRVIgPSBCaWdJbnQoTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIpO1xuXG4vKiogUmVhZCBiaWcgZW5kaWFuIDY0Yml0IGxvbmcgZnJvbSBCdWZSZWFkZXIgKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkTG9uZyhidWY6IEJ1ZlJlYWRlcik6IFByb21pc2U8bnVtYmVyIHwgbnVsbD4ge1xuICBjb25zdCBoaWdoID0gYXdhaXQgcmVhZEludChidWYpO1xuICBpZiAoaGlnaCA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGxvdyA9IGF3YWl0IHJlYWRJbnQoYnVmKTtcbiAgaWYgKGxvdyA9PT0gbnVsbCkgdGhyb3cgbmV3IERlbm8uZXJyb3JzLlVuZXhwZWN0ZWRFb2YoKTtcbiAgY29uc3QgYmlnID0gKEJpZ0ludChoaWdoKSA8PCAzMm4pIHwgQmlnSW50KGxvdyk7XG4gIC8vIFdlIHByb2JhYmx5IHNob3VsZCBwcm92aWRlIGEgc2ltaWxhciBBUEkgdGhhdCByZXR1cm5zIEJpZ0ludCB2YWx1ZXMuXG4gIGlmIChiaWcgPiBNQVhfU0FGRV9JTlRFR0VSKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXG4gICAgICBcIkxvbmcgdmFsdWUgdG9vIGJpZyB0byBiZSByZXByZXNlbnRlZCBhcyBhIEphdmFTY3JpcHQgbnVtYmVyLlwiLFxuICAgICk7XG4gIH1cbiAgcmV0dXJuIE51bWJlcihiaWcpO1xufVxuXG4vKiogU2xpY2UgbnVtYmVyIGludG8gNjRiaXQgYmlnIGVuZGlhbiBieXRlIGFycmF5ICovXG5leHBvcnQgZnVuY3Rpb24gc2xpY2VMb25nVG9CeXRlcyhkOiBudW1iZXIsIGRlc3QgPSBuZXcgQXJyYXkoOCkpOiBudW1iZXJbXSB7XG4gIGxldCBiaWcgPSBCaWdJbnQoZCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgODsgaSsrKSB7XG4gICAgZGVzdFs3IC0gaV0gPSBOdW1iZXIoYmlnICYgMHhmZm4pO1xuICAgIGJpZyA+Pj0gOG47XG4gIH1cbiAgcmV0dXJuIGRlc3Q7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
