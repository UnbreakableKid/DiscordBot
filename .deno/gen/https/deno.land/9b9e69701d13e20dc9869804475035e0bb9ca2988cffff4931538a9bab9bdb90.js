// from https://github.com/nodeca/pako
import { concatUint8Array } from "../utils/uint8.ts";
import * as zlib_inflate from "./zlib/inflate.ts";
import STATUS from "./zlib/status.ts";
import { message as msg } from "./zlib/messages.ts";
import ZStream from "./zlib/zstream.ts";
import GZheader from "./zlib/gzheader.ts";
export class Inflate {
  err = 0;
  msg = "";
  ended = false;
  strm;
  options;
  header;
  constructor(options) {
    this.options = {
      chunkSize: 16384,
      windowBits: 0,
      to: "",
      ...options,
    };
    const opt = this.options;
    // Force window size for `raw` data, if not set directly,
    // because we have no header for autodetect.
    if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
      opt.windowBits = -opt.windowBits;
      if (opt.windowBits === 0) opt.windowBits = -15;
    }
    // If `windowBits` not defined (and mode not raw) - set autodetect flag for gzip/deflate
    if (
      opt.windowBits >= 0 && opt.windowBits < 16 &&
      !(options && options.windowBits)
    ) {
      opt.windowBits += 32;
    }
    // Gzip header has no info about windows size, we can do autodetect only
    // for deflate. So, if window size not set, force it to max when gzip possible
    if (opt.windowBits > 15 && opt.windowBits < 48) {
      // bit 3 (16) -> gzipped data
      // bit 4 (32) -> autodetect gzip/deflate
      if ((opt.windowBits & 15) === 0) {
        opt.windowBits |= 15;
      }
    }
    this.strm = new ZStream();
    this.strm.avail_out = 0;
    var status = zlib_inflate.inflateInit2(this.strm, opt.windowBits);
    if (status !== STATUS.Z_OK) {
      throw new Error(msg[status]);
    }
    this.header = new GZheader();
    zlib_inflate.inflateGetHeader(this.strm, this.header);
    // Setup dictionary
    if (opt.dictionary) {
      if (opt.raw) {
        status = zlib_inflate.inflateSetDictionary(this.strm, opt.dictionary);
        if (status !== STATUS.Z_OK) {
          throw new Error(msg[status]);
        }
      }
    }
  }
  push(data, mode) {
    const strm = this.strm;
    const chunkSize = this.options.chunkSize;
    const dictionary = this.options.dictionary;
    const chunks = [];
    let status;
    // Flag to properly process Z_BUF_ERROR on testing inflate call
    // when we check that all output data was flushed.
    var allowBufError = false;
    if (this.ended) {
      throw new Error("can not call after ended");
    }
    let _mode = mode === ~~mode
      ? mode
      : mode === true
      ? STATUS.Z_FINISH
      : STATUS.Z_NO_FLUSH;
    strm.input = data;
    strm.next_in = 0;
    strm.avail_in = strm.input.length;
    do {
      if (strm.avail_out === 0) {
        strm.output = new Uint8Array(chunkSize);
        strm.next_out = 0;
        strm.avail_out = chunkSize;
      }
      status = zlib_inflate.inflate(
        strm,
        STATUS.Z_NO_FLUSH,
      ); /* no bad return value */
      if (status === STATUS.Z_NEED_DICT && dictionary) {
        status = zlib_inflate.inflateSetDictionary(this.strm, dictionary);
      }
      if (status === STATUS.Z_BUF_ERROR && allowBufError === true) {
        status = STATUS.Z_OK;
        allowBufError = false;
      }
      if (status !== STATUS.Z_STREAM_END && status !== STATUS.Z_OK) {
        this.ended = true;
        throw new Error(this.strm.msg);
      }
      if (strm.next_out) {
        if (
          strm.avail_out === 0 || status === STATUS.Z_STREAM_END ||
          strm.avail_in === 0 &&
            (_mode === STATUS.Z_FINISH || _mode === STATUS.Z_SYNC_FLUSH)
        ) {
          chunks.push(strm.output.subarray(0, strm.next_out));
        }
      }
      // When no more input data, we should check that internal inflate buffers
      // are flushed. The only way to do it when avail_out = 0 - run one more
      // inflate pass. But if output data not exists, inflate return Z_BUF_ERROR.
      // Here we set flag to process this error properly.
      //
      // NOTE. Deflate does not return error in this case and does not needs such
      // logic.
      if (strm.avail_in === 0 && strm.avail_out === 0) {
        allowBufError = true;
      }
    } while (
      (strm.avail_in > 0 || strm.avail_out === 0) &&
      status !== STATUS.Z_STREAM_END
    );
    if (status === STATUS.Z_STREAM_END) {
      _mode = STATUS.Z_FINISH;
    }
    // Finalize on the last chunk.
    if (_mode === STATUS.Z_FINISH) {
      status = zlib_inflate.inflateEnd(this.strm);
      this.ended = true;
      if (status !== STATUS.Z_OK) throw new Error(this.strm.msg);
    }
    // callback interim results if Z_SYNC_FLUSH.
    if (_mode === STATUS.Z_SYNC_FLUSH) {
      strm.avail_out = 0;
    }
    return concatUint8Array(chunks);
  }
}
export function inflate(input, options = {}) {
  const inflator = new Inflate(options);
  const result = inflator.push(input, true);
  // That will never happens, if you don't cheat with options :)
  if (inflator.err) throw inflator.msg || msg[inflator.err];
  return result;
}
export function inflateRaw(input, options = {}) {
  options.raw = true;
  return inflate(input, options);
}
export const gunzip = inflate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L2NvbXByZXNzQHYwLjMuNi96bGliL2luZmxhdGUudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8vIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL25vZGVjYS9wYWtvXG5pbXBvcnQgeyBjb25jYXRVaW50OEFycmF5IH0gZnJvbSBcIi4uL3V0aWxzL3VpbnQ4LnRzXCI7XG5pbXBvcnQgKiBhcyB6bGliX2luZmxhdGUgZnJvbSBcIi4vemxpYi9pbmZsYXRlLnRzXCI7XG5pbXBvcnQgU1RBVFVTIGZyb20gXCIuL3psaWIvc3RhdHVzLnRzXCI7XG5pbXBvcnQgeyBtZXNzYWdlIGFzIG1zZywgQ09ERSB9IGZyb20gXCIuL3psaWIvbWVzc2FnZXMudHNcIjtcbmltcG9ydCBaU3RyZWFtIGZyb20gXCIuL3psaWIvenN0cmVhbS50c1wiO1xuaW1wb3J0IEdaaGVhZGVyIGZyb20gXCIuL3psaWIvZ3poZWFkZXIudHNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBJbmZsYXRlT3B0aW9ucyB7XG4gIHdpbmRvd0JpdHM/OiBudW1iZXI7XG4gIGRpY3Rpb25hcnk/OiBVaW50OEFycmF5O1xuICBjaHVua1NpemU/OiBudW1iZXI7XG4gIHRvPzogc3RyaW5nO1xuICByYXc/OiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgSW5mbGF0ZSB7XG4gIGVycjogU1RBVFVTID0gMDsgLy8gZXJyb3IgY29kZSwgaWYgaGFwcGVucyAoMCA9IFpfT0spXG4gIG1zZzogc3RyaW5nID0gXCJcIjsgLy8gZXJyb3IgbWVzc2FnZVxuICBlbmRlZDogYm9vbGVhbiA9IGZhbHNlOyAvLyB1c2VkIHRvIGF2b2lkIG11bHRpcGxlIG9uRW5kKCkgY2FsbHNcbiAgc3RybTogWlN0cmVhbTtcbiAgb3B0aW9uczogYW55O1xuICBoZWFkZXI6IEdaaGVhZGVyO1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IEluZmxhdGVPcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0ge1xuICAgICAgY2h1bmtTaXplOiAxNjM4NCxcbiAgICAgIHdpbmRvd0JpdHM6IDAsXG4gICAgICB0bzogXCJcIixcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgfTtcblxuICAgIGNvbnN0IG9wdCA9IHRoaXMub3B0aW9ucztcblxuICAgIC8vIEZvcmNlIHdpbmRvdyBzaXplIGZvciBgcmF3YCBkYXRhLCBpZiBub3Qgc2V0IGRpcmVjdGx5LFxuICAgIC8vIGJlY2F1c2Ugd2UgaGF2ZSBubyBoZWFkZXIgZm9yIGF1dG9kZXRlY3QuXG4gICAgaWYgKG9wdC5yYXcgJiYgKG9wdC53aW5kb3dCaXRzID49IDApICYmIChvcHQud2luZG93Qml0cyA8IDE2KSkge1xuICAgICAgb3B0LndpbmRvd0JpdHMgPSAtb3B0LndpbmRvd0JpdHM7XG4gICAgICBpZiAob3B0LndpbmRvd0JpdHMgPT09IDApIG9wdC53aW5kb3dCaXRzID0gLTE1O1xuICAgIH1cblxuICAgIC8vIElmIGB3aW5kb3dCaXRzYCBub3QgZGVmaW5lZCAoYW5kIG1vZGUgbm90IHJhdykgLSBzZXQgYXV0b2RldGVjdCBmbGFnIGZvciBnemlwL2RlZmxhdGVcbiAgICBpZiAoXG4gICAgICAob3B0LndpbmRvd0JpdHMgPj0gMCkgJiYgKG9wdC53aW5kb3dCaXRzIDwgMTYpICYmXG4gICAgICAhKG9wdGlvbnMgJiYgb3B0aW9ucy53aW5kb3dCaXRzKVxuICAgICkge1xuICAgICAgb3B0LndpbmRvd0JpdHMgKz0gMzI7XG4gICAgfVxuXG4gICAgLy8gR3ppcCBoZWFkZXIgaGFzIG5vIGluZm8gYWJvdXQgd2luZG93cyBzaXplLCB3ZSBjYW4gZG8gYXV0b2RldGVjdCBvbmx5XG4gICAgLy8gZm9yIGRlZmxhdGUuIFNvLCBpZiB3aW5kb3cgc2l6ZSBub3Qgc2V0LCBmb3JjZSBpdCB0byBtYXggd2hlbiBnemlwIHBvc3NpYmxlXG4gICAgaWYgKChvcHQud2luZG93Qml0cyA+IDE1KSAmJiAob3B0LndpbmRvd0JpdHMgPCA0OCkpIHtcbiAgICAgIC8vIGJpdCAzICgxNikgLT4gZ3ppcHBlZCBkYXRhXG4gICAgICAvLyBiaXQgNCAoMzIpIC0+IGF1dG9kZXRlY3QgZ3ppcC9kZWZsYXRlXG4gICAgICBpZiAoKG9wdC53aW5kb3dCaXRzICYgMTUpID09PSAwKSB7XG4gICAgICAgIG9wdC53aW5kb3dCaXRzIHw9IDE1O1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuc3RybSA9IG5ldyBaU3RyZWFtKCk7XG4gICAgdGhpcy5zdHJtLmF2YWlsX291dCA9IDA7XG5cbiAgICB2YXIgc3RhdHVzID0gemxpYl9pbmZsYXRlLmluZmxhdGVJbml0MihcbiAgICAgIHRoaXMuc3RybSxcbiAgICAgIG9wdC53aW5kb3dCaXRzLFxuICAgICk7XG5cbiAgICBpZiAoc3RhdHVzICE9PSBTVEFUVVMuWl9PSykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZ1tzdGF0dXMgYXMgQ09ERV0pO1xuICAgIH1cblxuICAgIHRoaXMuaGVhZGVyID0gbmV3IEdaaGVhZGVyKCk7XG4gICAgemxpYl9pbmZsYXRlLmluZmxhdGVHZXRIZWFkZXIodGhpcy5zdHJtLCB0aGlzLmhlYWRlcik7XG5cbiAgICAvLyBTZXR1cCBkaWN0aW9uYXJ5XG4gICAgaWYgKG9wdC5kaWN0aW9uYXJ5KSB7XG4gICAgICBpZiAob3B0LnJhdykgeyAvL0luIHJhdyBtb2RlIHdlIG5lZWQgdG8gc2V0IHRoZSBkaWN0aW9uYXJ5IGVhcmx5XG4gICAgICAgIHN0YXR1cyA9IHpsaWJfaW5mbGF0ZS5pbmZsYXRlU2V0RGljdGlvbmFyeSh0aGlzLnN0cm0sIG9wdC5kaWN0aW9uYXJ5KTtcbiAgICAgICAgaWYgKHN0YXR1cyAhPT0gU1RBVFVTLlpfT0spIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnW3N0YXR1cyBhcyBDT0RFXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwdXNoKGRhdGE6IFVpbnQ4QXJyYXksIG1vZGU6IGJvb2xlYW4gfCBudW1iZXIpOiBVaW50OEFycmF5IHtcbiAgICBjb25zdCBzdHJtID0gdGhpcy5zdHJtO1xuICAgIGNvbnN0IGNodW5rU2l6ZSA9IHRoaXMub3B0aW9ucy5jaHVua1NpemU7XG4gICAgY29uc3QgZGljdGlvbmFyeSA9IHRoaXMub3B0aW9ucy5kaWN0aW9uYXJ5O1xuICAgIGNvbnN0IGNodW5rczogVWludDhBcnJheVtdID0gW107XG4gICAgbGV0IHN0YXR1cztcblxuICAgIC8vIEZsYWcgdG8gcHJvcGVybHkgcHJvY2VzcyBaX0JVRl9FUlJPUiBvbiB0ZXN0aW5nIGluZmxhdGUgY2FsbFxuICAgIC8vIHdoZW4gd2UgY2hlY2sgdGhhdCBhbGwgb3V0cHV0IGRhdGEgd2FzIGZsdXNoZWQuXG4gICAgdmFyIGFsbG93QnVmRXJyb3IgPSBmYWxzZTtcblxuICAgIGlmICh0aGlzLmVuZGVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjYW4gbm90IGNhbGwgYWZ0ZXIgZW5kZWRcIik7XG4gICAgfVxuXG4gICAgbGV0IF9tb2RlID0gKG1vZGUgPT09IH5+bW9kZSlcbiAgICAgID8gbW9kZVxuICAgICAgOiAoKG1vZGUgPT09IHRydWUpID8gU1RBVFVTLlpfRklOSVNIIDogU1RBVFVTLlpfTk9fRkxVU0gpO1xuXG4gICAgc3RybS5pbnB1dCA9IGRhdGE7XG4gICAgc3RybS5uZXh0X2luID0gMDtcbiAgICBzdHJtLmF2YWlsX2luID0gc3RybS5pbnB1dC5sZW5ndGg7XG5cbiAgICBkbyB7XG4gICAgICBpZiAoc3RybS5hdmFpbF9vdXQgPT09IDApIHtcbiAgICAgICAgc3RybS5vdXRwdXQgPSBuZXcgVWludDhBcnJheShjaHVua1NpemUpO1xuICAgICAgICBzdHJtLm5leHRfb3V0ID0gMDtcbiAgICAgICAgc3RybS5hdmFpbF9vdXQgPSBjaHVua1NpemU7XG4gICAgICB9XG5cbiAgICAgIHN0YXR1cyA9IHpsaWJfaW5mbGF0ZS5pbmZsYXRlKFxuICAgICAgICBzdHJtLFxuICAgICAgICBTVEFUVVMuWl9OT19GTFVTSCxcbiAgICAgICk7IC8qIG5vIGJhZCByZXR1cm4gdmFsdWUgKi9cblxuICAgICAgaWYgKHN0YXR1cyA9PT0gU1RBVFVTLlpfTkVFRF9ESUNUICYmIGRpY3Rpb25hcnkpIHtcbiAgICAgICAgc3RhdHVzID0gemxpYl9pbmZsYXRlLmluZmxhdGVTZXREaWN0aW9uYXJ5KHRoaXMuc3RybSwgZGljdGlvbmFyeSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChzdGF0dXMgPT09IFNUQVRVUy5aX0JVRl9FUlJPUiAmJiBhbGxvd0J1ZkVycm9yID09PSB0cnVlKSB7XG4gICAgICAgIHN0YXR1cyA9IFNUQVRVUy5aX09LO1xuICAgICAgICBhbGxvd0J1ZkVycm9yID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmIChzdGF0dXMgIT09IFNUQVRVUy5aX1NUUkVBTV9FTkQgJiYgc3RhdHVzICE9PSBTVEFUVVMuWl9PSykge1xuICAgICAgICB0aGlzLmVuZGVkID0gdHJ1ZTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKHRoaXMuc3RybS5tc2cpO1xuICAgICAgfVxuXG4gICAgICBpZiAoc3RybS5uZXh0X291dCkge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgc3RybS5hdmFpbF9vdXQgPT09IDAgfHwgc3RhdHVzID09PSBTVEFUVVMuWl9TVFJFQU1fRU5EIHx8XG4gICAgICAgICAgKHN0cm0uYXZhaWxfaW4gPT09IDAgJiZcbiAgICAgICAgICAgIChfbW9kZSA9PT0gU1RBVFVTLlpfRklOSVNIIHx8IF9tb2RlID09PSBTVEFUVVMuWl9TWU5DX0ZMVVNIKSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgY2h1bmtzLnB1c2goc3RybS5vdXRwdXQhLnN1YmFycmF5KDAsIHN0cm0ubmV4dF9vdXQpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBXaGVuIG5vIG1vcmUgaW5wdXQgZGF0YSwgd2Ugc2hvdWxkIGNoZWNrIHRoYXQgaW50ZXJuYWwgaW5mbGF0ZSBidWZmZXJzXG4gICAgICAvLyBhcmUgZmx1c2hlZC4gVGhlIG9ubHkgd2F5IHRvIGRvIGl0IHdoZW4gYXZhaWxfb3V0ID0gMCAtIHJ1biBvbmUgbW9yZVxuICAgICAgLy8gaW5mbGF0ZSBwYXNzLiBCdXQgaWYgb3V0cHV0IGRhdGEgbm90IGV4aXN0cywgaW5mbGF0ZSByZXR1cm4gWl9CVUZfRVJST1IuXG4gICAgICAvLyBIZXJlIHdlIHNldCBmbGFnIHRvIHByb2Nlc3MgdGhpcyBlcnJvciBwcm9wZXJseS5cbiAgICAgIC8vXG4gICAgICAvLyBOT1RFLiBEZWZsYXRlIGRvZXMgbm90IHJldHVybiBlcnJvciBpbiB0aGlzIGNhc2UgYW5kIGRvZXMgbm90IG5lZWRzIHN1Y2hcbiAgICAgIC8vIGxvZ2ljLlxuICAgICAgaWYgKHN0cm0uYXZhaWxfaW4gPT09IDAgJiYgc3RybS5hdmFpbF9vdXQgPT09IDApIHtcbiAgICAgICAgYWxsb3dCdWZFcnJvciA9IHRydWU7XG4gICAgICB9XG4gICAgfSB3aGlsZSAoXG4gICAgICAoc3RybS5hdmFpbF9pbiA+IDAgfHwgc3RybS5hdmFpbF9vdXQgPT09IDApICYmXG4gICAgICBzdGF0dXMgIT09IFNUQVRVUy5aX1NUUkVBTV9FTkRcbiAgICApO1xuXG4gICAgaWYgKHN0YXR1cyA9PT0gU1RBVFVTLlpfU1RSRUFNX0VORCkge1xuICAgICAgX21vZGUgPSBTVEFUVVMuWl9GSU5JU0g7XG4gICAgfVxuXG4gICAgLy8gRmluYWxpemUgb24gdGhlIGxhc3QgY2h1bmsuXG4gICAgaWYgKF9tb2RlID09PSBTVEFUVVMuWl9GSU5JU0gpIHtcbiAgICAgIHN0YXR1cyA9IHpsaWJfaW5mbGF0ZS5pbmZsYXRlRW5kKHRoaXMuc3RybSk7XG4gICAgICB0aGlzLmVuZGVkID0gdHJ1ZTtcbiAgICAgIGlmIChzdGF0dXMgIT09IFNUQVRVUy5aX09LKSB0aHJvdyBuZXcgRXJyb3IodGhpcy5zdHJtLm1zZyk7XG4gICAgfVxuXG4gICAgLy8gY2FsbGJhY2sgaW50ZXJpbSByZXN1bHRzIGlmIFpfU1lOQ19GTFVTSC5cbiAgICBpZiAoX21vZGUgPT09IFNUQVRVUy5aX1NZTkNfRkxVU0gpIHtcbiAgICAgIHN0cm0uYXZhaWxfb3V0ID0gMDtcbiAgICB9XG5cbiAgICByZXR1cm4gY29uY2F0VWludDhBcnJheShjaHVua3MpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmZsYXRlKGlucHV0OiBVaW50OEFycmF5LCBvcHRpb25zOiBJbmZsYXRlT3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IGluZmxhdG9yID0gbmV3IEluZmxhdGUob3B0aW9ucyk7XG4gIGNvbnN0IHJlc3VsdCA9IGluZmxhdG9yLnB1c2goaW5wdXQsIHRydWUpO1xuICAvLyBUaGF0IHdpbGwgbmV2ZXIgaGFwcGVucywgaWYgeW91IGRvbid0IGNoZWF0IHdpdGggb3B0aW9ucyA6KVxuICBpZiAoaW5mbGF0b3IuZXJyKSB0aHJvdyBpbmZsYXRvci5tc2cgfHwgbXNnW2luZmxhdG9yLmVyciBhcyBDT0RFXTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluZmxhdGVSYXcoaW5wdXQ6IFVpbnQ4QXJyYXksIG9wdGlvbnM6IEluZmxhdGVPcHRpb25zID0ge30pIHtcbiAgb3B0aW9ucy5yYXcgPSB0cnVlO1xuICByZXR1cm4gaW5mbGF0ZShpbnB1dCwgb3B0aW9ucyk7XG59XG5cbmV4cG9ydCBjb25zdCBndW56aXAgPSBpbmZsYXRlOyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUFzQyxBQUF0QyxvQ0FBc0M7U0FDN0IsZ0JBQWdCLFNBQVEsaUJBQW1CO1lBQ3hDLFlBQVksT0FBTSxpQkFBbUI7T0FDMUMsTUFBTSxPQUFNLGdCQUFrQjtTQUM1QixPQUFPLElBQUksR0FBRyxTQUFjLGtCQUFvQjtPQUNsRCxPQUFPLE9BQU0saUJBQW1CO09BQ2hDLFFBQVEsT0FBTSxrQkFBb0I7YUFVNUIsT0FBTztJQUNsQixHQUFHLEdBQVcsQ0FBQztJQUNmLEdBQUc7SUFDSCxLQUFLLEdBQVksS0FBSztJQUN0QixJQUFJO0lBQ0osT0FBTztJQUNQLE1BQU07Z0JBRU0sT0FBdUI7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
