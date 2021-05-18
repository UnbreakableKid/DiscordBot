import { Crc32Stream, EventEmitter } from "../deps.ts";
import { concatUint8Array } from "../utils/uint8.ts";
import { checkHeader, checkTail } from "./gzip.ts";
import { Inflate } from "../zlib/mod.ts";
class Writer extends EventEmitter {
  writer;
  bytesWritten = 0;
  path;
  chuncks = [];
  onceSize;
  chuncksBytes = 0;
  isCheckHeader = false;
  writtenSize = 0;
  crc32Stream = new Crc32Stream();
  inflate = new Inflate({
    raw: true,
  });
  constructor(path, options) {
    super();
    this.path = path;
    this.onceSize = options?.onceSize ?? 1024 * 1024;
  }
  async setup() {
    this.writer = await Deno.open(this.path, {
      write: true,
      create: true,
      truncate: true,
    });
  }
  async write(p) {
    const readed = p.byteLength;
    this.chuncksBytes += readed;
    this.bytesWritten += readed;
    const arr = Array.from(p);
    if (!this.isCheckHeader) {
      this.isCheckHeader = true;
      checkHeader(arr);
    }
    if (readed < 16384) {
      const { size, crc32 } = checkTail(arr);
      this.chuncks.push(new Uint8Array(arr));
      const buf = concatUint8Array(this.chuncks);
      const decompressed = this.inflate.push(buf, true);
      this.writtenSize += decompressed.byteLength;
      await Deno.writeAll(this.writer, decompressed);
      this.crc32Stream.append(decompressed);
      if (crc32 !== parseInt(this.crc32Stream.crc32, 16)) {
        throw "Checksum does not match";
      }
      if (size !== this.writtenSize) {
        throw "Size of decompressed file not correct";
      }
      return readed;
    }
    this.chuncks.push(new Uint8Array(arr));
    if (this.chuncksBytes >= this.onceSize) {
      const buf = concatUint8Array(this.chuncks);
      const decompressed = this.inflate.push(buf, false);
      this.writtenSize += decompressed.byteLength;
      await Deno.writeAll(this.writer, decompressed);
      this.crc32Stream.append(decompressed);
      this.chuncks.length = 0;
      this.chuncksBytes = 0;
      this.emit("bytesWritten", this.bytesWritten);
    }
    return readed;
  }
  close() {
    this.emit("bytesWritten", this.bytesWritten);
    Deno.close(this.writer.rid);
  }
}
export { Writer as default };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L2NvbXByZXNzQHYwLjMuNi9nemlwL3dyaXRlcl9ndW56aXAudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEV2ZW50RW1pdHRlciwgQ3JjMzJTdHJlYW0gfSBmcm9tIFwiLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgY29uY2F0VWludDhBcnJheSB9IGZyb20gXCIuLi91dGlscy91aW50OC50c1wiO1xuaW1wb3J0IHsgY2hlY2tIZWFkZXIsIGNoZWNrVGFpbCB9IGZyb20gXCIuL2d6aXAudHNcIjtcbmltcG9ydCB7IEluZmxhdGUgfSBmcm9tIFwiLi4vemxpYi9tb2QudHNcIjtcblxudHlwZSBGaWxlID0gRGVuby5GaWxlO1xuXG5pbnRlcmZhY2UgT3B0aW9ucyB7XG4gIG9uY2VTaXplPzogbnVtYmVyO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBXcml0ZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXIgaW1wbGVtZW50cyBEZW5vLldyaXRlciB7XG4gIHByb3RlY3RlZCB3cml0ZXIhOiBGaWxlO1xuICBwcm90ZWN0ZWQgYnl0ZXNXcml0dGVuID0gMDsgLy8gcmVhZGVkIHNpemUgb2YgcmVhZGVyXG4gIHByaXZhdGUgcGF0aDogc3RyaW5nO1xuICBwcml2YXRlIGNodW5ja3M6IFVpbnQ4QXJyYXlbXSA9IFtdO1xuICBwcml2YXRlIG9uY2VTaXplOiBudW1iZXI7XG4gIHByaXZhdGUgY2h1bmNrc0J5dGVzID0gMDtcbiAgcHJpdmF0ZSBpc0NoZWNrSGVhZGVyID0gZmFsc2U7XG4gIHByaXZhdGUgd3JpdHRlblNpemU6IG51bWJlciA9IDA7IC8vIHdyaXR0ZW4gc2l6ZSBvZiB3cml0ZXJcbiAgcHJpdmF0ZSBjcmMzMlN0cmVhbSA9IG5ldyBDcmMzMlN0cmVhbSgpO1xuICBwcml2YXRlIGluZmxhdGU6IEluZmxhdGUgPSBuZXcgSW5mbGF0ZSh7IHJhdzogdHJ1ZSB9KTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgb3B0aW9ucz86IE9wdGlvbnMsXG4gICkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5wYXRoID0gcGF0aDtcbiAgICB0aGlzLm9uY2VTaXplID0gb3B0aW9ucz8ub25jZVNpemUgPz8gMTAyNCAqIDEwMjQ7XG4gIH1cblxuICBhc3luYyBzZXR1cCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLndyaXRlciA9IGF3YWl0IERlbm8ub3Blbih0aGlzLnBhdGgsIHtcbiAgICAgIHdyaXRlOiB0cnVlLFxuICAgICAgY3JlYXRlOiB0cnVlLFxuICAgICAgdHJ1bmNhdGU6IHRydWUsXG4gICAgfSk7XG4gIH1cblxuICBhc3luYyB3cml0ZShwOiBVaW50OEFycmF5KTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBjb25zdCByZWFkZWQgPSBwLmJ5dGVMZW5ndGg7XG4gICAgdGhpcy5jaHVuY2tzQnl0ZXMgKz0gcmVhZGVkO1xuICAgIHRoaXMuYnl0ZXNXcml0dGVuICs9IHJlYWRlZDtcbiAgICBjb25zdCBhcnIgPSBBcnJheS5mcm9tKHApO1xuICAgIGlmICghdGhpcy5pc0NoZWNrSGVhZGVyKSB7XG4gICAgICB0aGlzLmlzQ2hlY2tIZWFkZXIgPSB0cnVlO1xuICAgICAgY2hlY2tIZWFkZXIoYXJyKTtcbiAgICB9XG4gICAgaWYgKHJlYWRlZCA8IDE2Mzg0KSB7XG4gICAgICBjb25zdCB7IHNpemUsIGNyYzMyIH0gPSBjaGVja1RhaWwoYXJyKTtcbiAgICAgIHRoaXMuY2h1bmNrcy5wdXNoKG5ldyBVaW50OEFycmF5KGFycikpO1xuICAgICAgY29uc3QgYnVmID0gY29uY2F0VWludDhBcnJheSh0aGlzLmNodW5ja3MpO1xuICAgICAgY29uc3QgZGVjb21wcmVzc2VkID0gdGhpcy5pbmZsYXRlLnB1c2goYnVmLCB0cnVlKTtcbiAgICAgIHRoaXMud3JpdHRlblNpemUgKz0gZGVjb21wcmVzc2VkLmJ5dGVMZW5ndGg7XG4gICAgICBhd2FpdCBEZW5vLndyaXRlQWxsKHRoaXMud3JpdGVyLCBkZWNvbXByZXNzZWQpO1xuICAgICAgdGhpcy5jcmMzMlN0cmVhbS5hcHBlbmQoZGVjb21wcmVzc2VkKTtcbiAgICAgIGlmIChjcmMzMiAhPT0gcGFyc2VJbnQodGhpcy5jcmMzMlN0cmVhbS5jcmMzMiwgMTYpKSB7XG4gICAgICAgIHRocm93IFwiQ2hlY2tzdW0gZG9lcyBub3QgbWF0Y2hcIjtcbiAgICAgIH1cbiAgICAgIGlmIChzaXplICE9PSB0aGlzLndyaXR0ZW5TaXplKSB7XG4gICAgICAgIHRocm93IFwiU2l6ZSBvZiBkZWNvbXByZXNzZWQgZmlsZSBub3QgY29ycmVjdFwiO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlYWRlZDtcbiAgICB9XG4gICAgdGhpcy5jaHVuY2tzLnB1c2gobmV3IFVpbnQ4QXJyYXkoYXJyKSk7XG4gICAgaWYgKHRoaXMuY2h1bmNrc0J5dGVzID49IHRoaXMub25jZVNpemUpIHtcbiAgICAgIGNvbnN0IGJ1ZiA9IGNvbmNhdFVpbnQ4QXJyYXkodGhpcy5jaHVuY2tzKTtcbiAgICAgIGNvbnN0IGRlY29tcHJlc3NlZCA9IHRoaXMuaW5mbGF0ZS5wdXNoKGJ1ZiwgZmFsc2UpO1xuICAgICAgdGhpcy53cml0dGVuU2l6ZSArPSBkZWNvbXByZXNzZWQuYnl0ZUxlbmd0aDtcbiAgICAgIGF3YWl0IERlbm8ud3JpdGVBbGwodGhpcy53cml0ZXIsIGRlY29tcHJlc3NlZCk7XG4gICAgICB0aGlzLmNyYzMyU3RyZWFtLmFwcGVuZChkZWNvbXByZXNzZWQpO1xuICAgICAgdGhpcy5jaHVuY2tzLmxlbmd0aCA9IDA7XG4gICAgICB0aGlzLmNodW5ja3NCeXRlcyA9IDA7XG4gICAgICB0aGlzLmVtaXQoXCJieXRlc1dyaXR0ZW5cIiwgdGhpcy5ieXRlc1dyaXR0ZW4pO1xuICAgIH1cbiAgICByZXR1cm4gcmVhZGVkO1xuICB9XG5cbiAgY2xvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5lbWl0KFwiYnl0ZXNXcml0dGVuXCIsIHRoaXMuYnl0ZXNXcml0dGVuKTtcbiAg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
