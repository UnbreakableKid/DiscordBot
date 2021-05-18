// from https://github.com/nodeca/pako
import * as zlib_deflate from "./zlib/deflate.ts";
import { concatUint8Array } from "../utils/uint8.ts";
import { message as msg } from "./zlib/messages.ts";
import ZStream from "./zlib/zstream.ts";
import STATUS from "./zlib/status.ts";
export class Deflate {
  err = 0;
  msg = "";
  ended = false;
  strm;
  _dict_set = false;
  options;
  constructor(options = {}) {
    this.options = Object.assign({
      level: STATUS.Z_DEFAULT_COMPRESSION,
      method: STATUS.Z_DEFLATED,
      chunkSize: 16384,
      windowBits: 15,
      memLevel: 8,
      strategy: STATUS.Z_DEFAULT_STRATEGY,
      to: "",
    }, options);
    const opt = this.options;
    if (opt.raw && opt.windowBits > 0) {
      opt.windowBits = -opt.windowBits;
    } else if (opt.gzip && opt.windowBits > 0 && opt.windowBits < 16) {
      opt.windowBits += 16;
    }
    this.strm = new ZStream();
    this.strm.avail_out = 0;
    let status = zlib_deflate.deflateInit2(
      this.strm,
      opt.level,
      opt.method,
      opt.windowBits,
      opt.memLevel,
      opt.strategy,
    );
    if (status !== STATUS.Z_OK) {
      throw new Error(msg[status]);
    }
    if (opt.header) {
      zlib_deflate.deflateSetHeader(this.strm, opt.header);
    }
    if (opt.dictionary) {
      status = zlib_deflate.deflateSetDictionary(this.strm, opt.dictionary);
      if (status !== STATUS.Z_OK) {
        throw new Error(msg[status]);
      }
      this._dict_set = true;
    }
  }
  push(data, mode) {
    const strm = this.strm;
    const chunkSize = this.options.chunkSize;
    const chunks = [];
    let status;
    if (this.ended) {
      throw new Error("can not call after ended");
    }
    const _mode = mode === ~~mode
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
      status = zlib_deflate.deflate(strm, _mode); /* no bad return value */
      if (status !== STATUS.Z_STREAM_END && status !== STATUS.Z_OK) {
        this.ended = true;
        throw new Error(this.strm.msg);
      }
      if (
        strm.avail_out === 0 ||
        strm.avail_in === 0 &&
          (_mode === STATUS.Z_FINISH || _mode === STATUS.Z_SYNC_FLUSH)
      ) {
        chunks.push(strm.output.subarray(0, strm.next_out));
      }
    } while (
      (strm.avail_in > 0 || strm.avail_out === 0) &&
      status !== STATUS.Z_STREAM_END
    );
    // Finalize on the last chunk.
    if (_mode === STATUS.Z_FINISH) {
      status = zlib_deflate.deflateEnd(this.strm);
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
export function deflate(input, options = {}) {
  const deflator = new Deflate(options);
  const result = deflator.push(input, true);
  // That will never happens, if you don't cheat with options :)
  if (deflator.err) throw deflator.msg || msg[deflator.err];
  return result;
}
export function deflateRaw(input, options = {}) {
  options.raw = true;
  return deflate(input, options);
}
export function gzip(input, options = {}) {
  options.gzip = true;
  return deflate(input, options);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L2NvbXByZXNzQHYwLjMuNi96bGliL2RlZmxhdGUudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8vIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL25vZGVjYS9wYWtvXG5pbXBvcnQgKiBhcyB6bGliX2RlZmxhdGUgZnJvbSBcIi4vemxpYi9kZWZsYXRlLnRzXCI7XG5pbXBvcnQgeyBjb25jYXRVaW50OEFycmF5IH0gZnJvbSBcIi4uL3V0aWxzL3VpbnQ4LnRzXCI7XG5pbXBvcnQgeyBtZXNzYWdlIGFzIG1zZywgQ09ERSB9IGZyb20gXCIuL3psaWIvbWVzc2FnZXMudHNcIjtcbmltcG9ydCBaU3RyZWFtIGZyb20gXCIuL3psaWIvenN0cmVhbS50c1wiO1xuaW1wb3J0IFNUQVRVUyBmcm9tIFwiLi96bGliL3N0YXR1cy50c1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIERlZmxhdGVPcHRpb25zIHtcbiAgbGV2ZWw/OiBudW1iZXI7XG4gIG1ldGhvZD86IG51bWJlcjtcbiAgY2h1bmtTaXplPzogbnVtYmVyO1xuICB3aW5kb3dCaXRzPzogbnVtYmVyO1xuICBtZW1MZXZlbD86IG51bWJlcjtcbiAgc3RyYXRlZ3k/OiBudW1iZXI7XG4gIHRvPzogc3RyaW5nO1xuICByYXc/OiBib29sZWFuO1xuICBnemlwPzogYm9vbGVhbjtcbiAgZGljdGlvbmFyeT86IFVpbnQ4QXJyYXk7XG4gIGhlYWRlcj86IHpsaWJfZGVmbGF0ZS5IZWFkZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBEZWZsYXRlIHtcbiAgZXJyOiBTVEFUVVMgPSAwOyAvLyBlcnJvciBjb2RlLCBpZiBoYXBwZW5zICgwID0gWl9PSylcbiAgbXNnOiBzdHJpbmcgPSBcIlwiOyAvLyBlcnJvciBtZXNzYWdlXG4gIGVuZGVkOiBib29sZWFuID0gZmFsc2U7IC8vIHVzZWQgdG8gYXZvaWQgbXVsdGlwbGUgb25FbmQoKSBjYWxsc1xuICBzdHJtOiBaU3RyZWFtO1xuICBfZGljdF9zZXQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgb3B0aW9uczogYW55O1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IERlZmxhdGVPcHRpb25zID0ge30pIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIGxldmVsOiBTVEFUVVMuWl9ERUZBVUxUX0NPTVBSRVNTSU9OLFxuICAgICAgbWV0aG9kOiBTVEFUVVMuWl9ERUZMQVRFRCxcbiAgICAgIGNodW5rU2l6ZTogMTYzODQsXG4gICAgICB3aW5kb3dCaXRzOiAxNSxcbiAgICAgIG1lbUxldmVsOiA4LFxuICAgICAgc3RyYXRlZ3k6IFNUQVRVUy5aX0RFRkFVTFRfU1RSQVRFR1ksXG4gICAgICB0bzogXCJcIixcbiAgICB9LCBvcHRpb25zKTtcblxuICAgIGNvbnN0IG9wdCA9IHRoaXMub3B0aW9ucztcblxuICAgIGlmIChvcHQucmF3ICYmIChvcHQud2luZG93Qml0cyA+IDApKSB7XG4gICAgICBvcHQud2luZG93Qml0cyA9IC1vcHQud2luZG93Qml0cztcbiAgICB9IGVsc2UgaWYgKG9wdC5nemlwICYmIChvcHQud2luZG93Qml0cyA+IDApICYmIChvcHQud2luZG93Qml0cyA8IDE2KSkge1xuICAgICAgb3B0LndpbmRvd0JpdHMgKz0gMTY7XG4gICAgfVxuXG4gICAgdGhpcy5zdHJtID0gbmV3IFpTdHJlYW0oKTtcbiAgICB0aGlzLnN0cm0uYXZhaWxfb3V0ID0gMDtcblxuICAgIGxldCBzdGF0dXMgPSB6bGliX2RlZmxhdGUuZGVmbGF0ZUluaXQyKFxuICAgICAgdGhpcy5zdHJtLFxuICAgICAgb3B0LmxldmVsLFxuICAgICAgb3B0Lm1ldGhvZCxcbiAgICAgIG9wdC53aW5kb3dCaXRzLFxuICAgICAgb3B0Lm1lbUxldmVsLFxuICAgICAgb3B0LnN0cmF0ZWd5LFxuICAgICk7XG5cbiAgICBpZiAoc3RhdHVzICE9PSBTVEFUVVMuWl9PSykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZ1tzdGF0dXNdKTtcbiAgICB9XG5cbiAgICBpZiAob3B0LmhlYWRlcikge1xuICAgICAgemxpYl9kZWZsYXRlLmRlZmxhdGVTZXRIZWFkZXIodGhpcy5zdHJtLCBvcHQuaGVhZGVyKTtcbiAgICB9XG5cbiAgICBpZiAob3B0LmRpY3Rpb25hcnkpIHtcbiAgICAgIHN0YXR1cyA9IHpsaWJfZGVmbGF0ZS5kZWZsYXRlU2V0RGljdGlvbmFyeSh0aGlzLnN0cm0sIG9wdC5kaWN0aW9uYXJ5KTtcblxuICAgICAgaWYgKHN0YXR1cyAhPT0gU1RBVFVTLlpfT0spIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZ1tzdGF0dXNdKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fZGljdF9zZXQgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHB1c2goZGF0YTogVWludDhBcnJheSwgbW9kZTogYm9vbGVhbiB8IG51bWJlcik6IFVpbnQ4QXJyYXkge1xuICAgIGNvbnN0IHN0cm0gPSB0aGlzLnN0cm07XG4gICAgY29uc3QgY2h1bmtTaXplID0gdGhpcy5vcHRpb25zLmNodW5rU2l6ZTtcbiAgICBjb25zdCBjaHVua3M6IFVpbnQ4QXJyYXlbXSA9IFtdO1xuICAgIGxldCBzdGF0dXM7XG5cbiAgICBpZiAodGhpcy5lbmRlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY2FuIG5vdCBjYWxsIGFmdGVyIGVuZGVkXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IF9tb2RlID0gbW9kZSA9PT0gfn5tb2RlXG4gICAgICA/IG1vZGVcbiAgICAgIDogKG1vZGUgPT09IHRydWUgPyBTVEFUVVMuWl9GSU5JU0ggOiBTVEFUVVMuWl9OT19GTFVTSCk7XG5cbiAgICBzdHJtLmlucHV0ID0gZGF0YTtcbiAgICBzdHJtLm5leHRfaW4gPSAwO1xuICAgIHN0cm0uYXZhaWxfaW4gPSBzdHJtLmlucHV0Lmxlbmd0aDtcblxuICAgIGRvIHtcbiAgICAgIGlmIChzdHJtLmF2YWlsX291dCA9PT0gMCkge1xuICAgICAgICBzdHJtLm91dHB1dCA9IG5ldyBVaW50OEFycmF5KGNodW5rU2l6ZSk7XG4gICAgICAgIHN0cm0ubmV4dF9vdXQgPSAwO1xuICAgICAgICBzdHJtLmF2YWlsX291dCA9IGNodW5rU2l6ZTtcbiAgICAgIH1cbiAgICAgIHN0YXR1cyA9IHpsaWJfZGVmbGF0ZS5kZWZsYXRlKHN0cm0sIF9tb2RlKTsgLyogbm8gYmFkIHJldHVybiB2YWx1ZSAqL1xuXG4gICAgICBpZiAoc3RhdHVzICE9PSBTVEFUVVMuWl9TVFJFQU1fRU5EICYmIHN0YXR1cyAhPT0gU1RBVFVTLlpfT0spIHtcbiAgICAgICAgdGhpcy5lbmRlZCA9IHRydWU7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcih0aGlzLnN0cm0ubXNnKTtcbiAgICAgIH1cbiAgICAgIGlmIChcbiAgICAgICAgc3RybS5hdmFpbF9vdXQgPT09IDAgfHxcbiAgICAgICAgKHN0cm0uYXZhaWxfaW4gPT09IDAgJiZcbiAgICAgICAgICAoX21vZGUgPT09IFNUQVRVUy5aX0ZJTklTSCB8fCBfbW9kZSA9PT0gU1RBVFVTLlpfU1lOQ19GTFVTSCkpXG4gICAgICApIHtcbiAgICAgICAgY2h1bmtzLnB1c2goc3RybS5vdXRwdXQhLnN1YmFycmF5KDAsIHN0cm0ubmV4dF9vdXQpKTtcbiAgICAgIH1cbiAgICB9IHdoaWxlIChcbiAgICAgIChzdHJtLmF2YWlsX2luID4gMCB8fCBzdHJtLmF2YWlsX291dCA9PT0gMCkgJiZcbiAgICAgIHN0YXR1cyAhPT0gU1RBVFVTLlpfU1RSRUFNX0VORFxuICAgICk7XG5cbiAgICAvLyBGaW5hbGl6ZSBvbiB0aGUgbGFzdCBjaHVuay5cbiAgICBpZiAoX21vZGUgPT09IFNUQVRVUy5aX0ZJTklTSCkge1xuICAgICAgc3RhdHVzID0gemxpYl9kZWZsYXRlLmRlZmxhdGVFbmQodGhpcy5zdHJtKTtcbiAgICAgIHRoaXMuZW5kZWQgPSB0cnVlO1xuICAgICAgaWYgKHN0YXR1cyAhPT0gU1RBVFVTLlpfT0spIHRocm93IG5ldyBFcnJvcih0aGlzLnN0cm0ubXNnKTtcbiAgICB9XG5cbiAgICAvLyBjYWxsYmFjayBpbnRlcmltIHJlc3VsdHMgaWYgWl9TWU5DX0ZMVVNILlxuICAgIGlmIChfbW9kZSA9PT0gU1RBVFVTLlpfU1lOQ19GTFVTSCkge1xuICAgICAgc3RybS5hdmFpbF9vdXQgPSAwO1xuICAgIH1cblxuICAgIHJldHVybiBjb25jYXRVaW50OEFycmF5KGNodW5rcyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlZmxhdGUoaW5wdXQ6IFVpbnQ4QXJyYXksIG9wdGlvbnM6IERlZmxhdGVPcHRpb25zID0ge30pIHtcbiAgY29uc3QgZGVmbGF0b3IgPSBuZXcgRGVmbGF0ZShvcHRpb25zKTtcbiAgY29uc3QgcmVzdWx0ID0gZGVmbGF0b3IucHVzaChpbnB1dCwgdHJ1ZSk7XG4gIC8vIFRoYXQgd2lsbCBuZXZlciBoYXBwZW5zLCBpZiB5b3UgZG9uJ3QgY2hlYXQgd2l0aCBvcHRpb25zIDopXG4gIGlmIChkZWZsYXRvci5lcnIpIHRocm93IGRlZmxhdG9yLm1zZyB8fCBtc2dbZGVmbGF0b3IuZXJyIGFzIENPREVdO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVmbGF0ZVJhdyhpbnB1dDogVWludDhBcnJheSwgb3B0aW9uczogRGVmbGF0ZU9wdGlvbnMgPSB7fSkge1xuICBvcHRpb25zLnJhdyA9IHRydWU7XG4gIHJldHVybiBkZWZsYXRlKGlucHV0LCBvcHRpb25zKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGd6aXAoaW5wdXQ6IFVpbnQ4QXJyYXksIG9wdGlvbnM6IERlZmxhdGVPcHRpb25zID0ge30pIHtcbiAgb3B0aW9ucy5nemlwID0gdHJ1ZTtcbiAgcmV0dXJuIGRlZmxhdGUoaW5wdXQsIG9wdGlvbnMpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEVBQXNDLEFBQXRDLG9DQUFzQztZQUMxQixZQUFZLE9BQU0saUJBQW1CO1NBQ3hDLGdCQUFnQixTQUFRLGlCQUFtQjtTQUMzQyxPQUFPLElBQUksR0FBRyxTQUFjLGtC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
