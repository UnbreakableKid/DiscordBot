/**
 * Ported and modified from: https://github.com/beatgammit/tar-js and
 * licensed as:
 *
 * (The MIT License)
 *
 * Copyright (c) 2011 T. Jameson Little
 * Copyright (c) 2019 Jun Kato
 * Copyright (c) 2020 the Deno authors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
import { MultiReader } from "../io/readers.ts";
import { PartialReadError } from "../io/bufio.ts";
import { assert } from "../_util/assert.ts";
const recordSize = 512;
const ustar = "ustar\u000000";
// https://pubs.opengroup.org/onlinepubs/9699919799/utilities/pax.html#tag_20_92_13_06
// eight checksum bytes taken to be ascii spaces (decimal value 32)
const initialChecksum = 8 * 32;
async function readBlock(reader, p) {
  let bytesRead = 0;
  while (bytesRead < p.length) {
    const rr = await reader.read(p.subarray(bytesRead));
    if (rr === null) {
      if (bytesRead === 0) {
        return null;
      } else {
        throw new PartialReadError();
      }
    }
    bytesRead += rr;
  }
  return bytesRead;
}
/**
 * Simple file reader
 */ class FileReader1 {
  filePath;
  file;
  constructor(filePath) {
    this.filePath = filePath;
  }
  async read(p) {
    if (!this.file) {
      this.file = await Deno.open(this.filePath, {
        read: true,
      });
    }
    const res = await Deno.read(this.file.rid, p);
    if (res === null) {
      Deno.close(this.file.rid);
      this.file = undefined;
    }
    return res;
  }
}
/**
 * Remove the trailing null codes
 * @param buffer
 */ function trim(buffer) {
  const index = buffer.findIndex((v) => v === 0);
  if (index < 0) return buffer;
  return buffer.subarray(0, index);
}
/**
 * Initialize Uint8Array of the specified length filled with 0
 * @param length
 */ function clean(length) {
  const buffer = new Uint8Array(length);
  buffer.fill(0, 0, length - 1);
  return buffer;
}
function pad(num, bytes, base) {
  const numString = num.toString(base || 8);
  return "000000000000".substr(numString.length + 12 - bytes) + numString;
}
var FileTypes;
(function (FileTypes) {
  FileTypes[FileTypes["file"] = 0] = "file";
  FileTypes[FileTypes["link"] = 1] = "link";
  FileTypes[FileTypes["symlink"] = 2] = "symlink";
  FileTypes[FileTypes["character-device"] = 3] = "character-device";
  FileTypes[FileTypes["block-device"] = 4] = "block-device";
  FileTypes[FileTypes["directory"] = 5] = "directory";
  FileTypes[FileTypes["fifo"] = 6] = "fifo";
  FileTypes[FileTypes["contiguous-file"] = 7] = "contiguous-file";
})(FileTypes || (FileTypes = {}));
/*
struct posix_header {           // byte offset
  char name[100];               //   0
  char mode[8];                 // 100
  char uid[8];                  // 108
  char gid[8];                  // 116
  char size[12];                // 124
  char mtime[12];               // 136
  char chksum[8];               // 148
  char typeflag;                // 156
  char linkname[100];           // 157
  char magic[6];                // 257
  char version[2];              // 263
  char uname[32];               // 265
  char gname[32];               // 297
  char devmajor[8];             // 329
  char devminor[8];             // 337
  char prefix[155];             // 345
                                // 500
};
*/ const ustarStructure = [
  {
    field: "fileName",
    length: 100,
  },
  {
    field: "fileMode",
    length: 8,
  },
  {
    field: "uid",
    length: 8,
  },
  {
    field: "gid",
    length: 8,
  },
  {
    field: "fileSize",
    length: 12,
  },
  {
    field: "mtime",
    length: 12,
  },
  {
    field: "checksum",
    length: 8,
  },
  {
    field: "type",
    length: 1,
  },
  {
    field: "linkName",
    length: 100,
  },
  {
    field: "ustar",
    length: 8,
  },
  {
    field: "owner",
    length: 32,
  },
  {
    field: "group",
    length: 32,
  },
  {
    field: "majorNumber",
    length: 8,
  },
  {
    field: "minorNumber",
    length: 8,
  },
  {
    field: "fileNamePrefix",
    length: 155,
  },
  {
    field: "padding",
    length: 12,
  },
];
/**
 * Create header for a file in a tar archive
 */ function formatHeader(data) {
  const encoder = new TextEncoder(), buffer = clean(512);
  let offset = 0;
  ustarStructure.forEach(function (value) {
    const entry = encoder.encode(data[value.field] || "");
    buffer.set(entry, offset);
    offset += value.length; // space it out with nulls
  });
  return buffer;
}
/**
 * Parse file header in a tar archive
 * @param length
 */ function parseHeader(buffer) {
  const data = {};
  let offset = 0;
  ustarStructure.forEach(function (value) {
    const arr = buffer.subarray(offset, offset + value.length);
    data[value.field] = arr;
    offset += value.length;
  });
  return data;
}
/**
 * A class to create a tar archive
 */ export class Tar {
  data;
  constructor() {
    this.data = [];
  }
  /**
   * Append a file to this tar archive
   * @param fn file name
   *                 e.g., test.txt; use slash for directory separators
   * @param opts options
   */ async append(fn, opts) {
    if (typeof fn !== "string") {
      throw new Error("file name not specified");
    }
    let fileName = fn;
    // separate file name into two parts if needed
    let fileNamePrefix;
    if (fileName.length > 100) {
      let i = fileName.length;
      while (i >= 0) {
        i = fileName.lastIndexOf("/", i);
        if (i <= 155) {
          fileNamePrefix = fileName.substr(0, i);
          fileName = fileName.substr(i + 1);
          break;
        }
        i--;
      }
      const errMsg =
        "ustar format does not allow a long file name (length of [file name" +
        "prefix] + / + [file name] must be shorter than 256 bytes)";
      if (i < 0 || fileName.length > 100) {
        throw new Error(errMsg);
      } else {
        assert(fileNamePrefix != null);
        if (fileNamePrefix.length > 155) {
          throw new Error(errMsg);
        }
      }
    }
    opts = opts || {};
    // set meta data
    let info;
    if (opts.filePath) {
      info = await Deno.stat(opts.filePath);
      if (info.isDirectory) {
        info.size = 0;
        opts.reader = new Deno.Buffer();
      }
    }
    const mode = opts.fileMode || info && info.mode ||
        parseInt("777", 8) & 4095,
      mtime = Math.floor(
        opts.mtime ?? (info?.mtime ?? new Date()).valueOf() / 1000,
      ),
      uid = opts.uid || 0,
      gid = opts.gid || 0;
    if (typeof opts.owner === "string" && opts.owner.length >= 32) {
      throw new Error(
        "ustar format does not allow owner name length >= 32 bytes",
      );
    }
    if (typeof opts.group === "string" && opts.group.length >= 32) {
      throw new Error(
        "ustar format does not allow group name length >= 32 bytes",
      );
    }
    const fileSize = info?.size ?? opts.contentSize;
    assert(fileSize != null, "fileSize must be set");
    const type = opts.type
      ? FileTypes[opts.type]
      : info?.isDirectory
      ? FileTypes.directory
      : FileTypes.file;
    const tarData = {
      fileName,
      fileNamePrefix,
      fileMode: pad(mode, 7),
      uid: pad(uid, 7),
      gid: pad(gid, 7),
      fileSize: pad(fileSize, 11),
      mtime: pad(mtime, 11),
      checksum: "        ",
      type: type.toString(),
      ustar,
      owner: opts.owner || "",
      group: opts.group || "",
      filePath: opts.filePath,
      reader: opts.reader,
    };
    // calculate the checksum
    let checksum = 0;
    const encoder = new TextEncoder();
    Object.keys(tarData).filter((key) =>
      [
        "filePath",
        "reader",
      ].indexOf(key) < 0
    ).forEach(function (key) {
      checksum += encoder.encode(tarData[key]).reduce((p, c) => p + c, 0);
    });
    tarData.checksum = pad(checksum, 6) + "\u0000 ";
    this.data.push(tarData);
  }
  /**
   * Get a Reader instance for this tar data
   */ getReader() {
    const readers = [];
    this.data.forEach((tarData) => {
      let { reader } = tarData;
      const { filePath } = tarData;
      const headerArr = formatHeader(tarData);
      readers.push(new Deno.Buffer(headerArr));
      if (!reader) {
        assert(filePath != null);
        reader = new FileReader1(filePath);
      }
      readers.push(reader);
      // to the nearest multiple of recordSize
      assert(tarData.fileSize != null, "fileSize must be set");
      readers.push(
        new Deno.Buffer(
          clean(
            recordSize -
              (parseInt(tarData.fileSize, 8) % recordSize || recordSize),
          ),
        ),
      );
    });
    // append 2 empty records
    readers.push(new Deno.Buffer(clean(recordSize * 2)));
    return new MultiReader(...readers);
  }
}
class TarEntry {
  #header;
  #reader;
  #size;
  #read = 0;
  #consumed = false;
  #entrySize;
  constructor(meta, header, reader) {
    Object.assign(this, meta);
    this.#header = header;
    this.#reader = reader;
    // File Size
    this.#size = this.fileSize || 0;
    // Entry Size
    const blocks = Math.ceil(this.#size / recordSize);
    this.#entrySize = blocks * recordSize;
  }
  get consumed() {
    return this.#consumed;
  }
  async read(p) {
    // Bytes left for entry
    const entryBytesLeft = this.#entrySize - this.#read;
    const bufSize = Math.min( // bufSize can't be greater than p.length nor bytes left in the entry
      p.length,
      entryBytesLeft,
    );
    if (entryBytesLeft <= 0) return null;
    const block = new Uint8Array(bufSize);
    const n = await readBlock(this.#reader, block);
    const bytesLeft = this.#size - this.#read;
    this.#read += n || 0;
    if (n === null || bytesLeft <= 0) {
      if (null) this.#consumed = true;
      return null;
    }
    // Remove zero filled
    const offset = bytesLeft < n ? bytesLeft : n;
    p.set(block.subarray(0, offset), 0);
    return offset < 0 ? n - Math.abs(offset) : offset;
  }
  async discard() {
    // Discard current entry
    if (this.#consumed) return;
    this.#consumed = true;
    if (typeof this.#reader.seek === "function") {
      await this.#reader.seek(
        this.#entrySize - this.#read,
        Deno.SeekMode.Current,
      );
      this.#read = this.#entrySize;
    } else {
      await Deno.readAll(this);
    }
  }
}
/**
 * A class to extract a tar archive
 */ export class Untar {
  reader;
  block;
  #entry;
  constructor(reader) {
    this.reader = reader;
    this.block = new Uint8Array(recordSize);
  }
  #checksum = (header) => {
    let sum = initialChecksum;
    for (let i = 0; i < 512; i++) {
      if (i >= 148 && i < 156) {
        continue;
      }
      sum += header[i];
    }
    return sum;
  };
  #getHeader = async () => {
    await readBlock(this.reader, this.block);
    const header = parseHeader(this.block);
    // calculate the checksum
    const decoder = new TextDecoder();
    const checksum = this.#checksum(this.block);
    if (parseInt(decoder.decode(header.checksum), 8) !== checksum) {
      if (checksum === initialChecksum) {
        // EOF
        return null;
      }
      throw new Error("checksum error");
    }
    const magic = decoder.decode(header.ustar);
    if (magic.indexOf("ustar")) {
      throw new Error(`unsupported archive format: ${magic}`);
    }
    return header;
  };
  #getMetadata = (header) => {
    const decoder = new TextDecoder();
    // get meta data
    const meta = {
      fileName: decoder.decode(trim(header.fileName)),
    };
    const fileNamePrefix = trim(header.fileNamePrefix);
    if (fileNamePrefix.byteLength > 0) {
      meta.fileName = decoder.decode(fileNamePrefix) + "/" + meta.fileName;
    }
    [
      "fileMode",
      "mtime",
      "uid",
      "gid",
    ].forEach((key) => {
      const arr = trim(header[key]);
      if (arr.byteLength > 0) {
        meta[key] = parseInt(decoder.decode(arr), 8);
      }
    });
    [
      "owner",
      "group",
      "type",
    ].forEach((key) => {
      const arr = trim(header[key]);
      if (arr.byteLength > 0) {
        meta[key] = decoder.decode(arr);
      }
    });
    meta.fileSize = parseInt(decoder.decode(header.fileSize), 8);
    meta.type = FileTypes[parseInt(meta.type)] ?? meta.type;
    return meta;
  };
  async extract() {
    if (this.#entry && !this.#entry.consumed) {
      // If entry body was not read, discard the body
      // so we can read the next entry.
      await this.#entry.discard();
    }
    const header = await this.#getHeader();
    if (header === null) return null;
    const meta = this.#getMetadata(header);
    this.#entry = new TarEntry(meta, header, this.reader);
    return this.#entry;
  }
  async *[Symbol.asyncIterator]() {
    while (true) {
      const entry = await this.extract();
      if (entry === null) return;
      yield entry;
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC43MS4wL2FyY2hpdmUvdGFyLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFBvcnRlZCBhbmQgbW9kaWZpZWQgZnJvbTogaHR0cHM6Ly9naXRodWIuY29tL2JlYXRnYW1taXQvdGFyLWpzIGFuZFxuICogbGljZW5zZWQgYXM6XG4gKlxuICogKFRoZSBNSVQgTGljZW5zZSlcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEgVC4gSmFtZXNvbiBMaXR0bGVcbiAqIENvcHlyaWdodCAoYykgMjAxOSBKdW4gS2F0b1xuICogQ29weXJpZ2h0IChjKSAyMDIwIHRoZSBEZW5vIGF1dGhvcnNcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5pbXBvcnQgeyBNdWx0aVJlYWRlciB9IGZyb20gXCIuLi9pby9yZWFkZXJzLnRzXCI7XG5pbXBvcnQgeyBQYXJ0aWFsUmVhZEVycm9yIH0gZnJvbSBcIi4uL2lvL2J1ZmlvLnRzXCI7XG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiLi4vX3V0aWwvYXNzZXJ0LnRzXCI7XG5cbnR5cGUgUmVhZGVyID0gRGVuby5SZWFkZXI7XG50eXBlIFNlZWtlciA9IERlbm8uU2Vla2VyO1xuXG5jb25zdCByZWNvcmRTaXplID0gNTEyO1xuY29uc3QgdXN0YXIgPSBcInVzdGFyXFx1MDAwMDAwXCI7XG5cbi8vIGh0dHBzOi8vcHVicy5vcGVuZ3JvdXAub3JnL29ubGluZXB1YnMvOTY5OTkxOTc5OS91dGlsaXRpZXMvcGF4Lmh0bWwjdGFnXzIwXzkyXzEzXzA2XG4vLyBlaWdodCBjaGVja3N1bSBieXRlcyB0YWtlbiB0byBiZSBhc2NpaSBzcGFjZXMgKGRlY2ltYWwgdmFsdWUgMzIpXG5jb25zdCBpbml0aWFsQ2hlY2tzdW0gPSA4ICogMzI7XG5cbmFzeW5jIGZ1bmN0aW9uIHJlYWRCbG9jayhcbiAgcmVhZGVyOiBEZW5vLlJlYWRlcixcbiAgcDogVWludDhBcnJheSxcbik6IFByb21pc2U8bnVtYmVyIHwgbnVsbD4ge1xuICBsZXQgYnl0ZXNSZWFkID0gMDtcbiAgd2hpbGUgKGJ5dGVzUmVhZCA8IHAubGVuZ3RoKSB7XG4gICAgY29uc3QgcnIgPSBhd2FpdCByZWFkZXIucmVhZChwLnN1YmFycmF5KGJ5dGVzUmVhZCkpO1xuICAgIGlmIChyciA9PT0gbnVsbCkge1xuICAgICAgaWYgKGJ5dGVzUmVhZCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBQYXJ0aWFsUmVhZEVycm9yKCk7XG4gICAgICB9XG4gICAgfVxuICAgIGJ5dGVzUmVhZCArPSBycjtcbiAgfVxuICByZXR1cm4gYnl0ZXNSZWFkO1xufVxuXG4vKipcbiAqIFNpbXBsZSBmaWxlIHJlYWRlclxuICovXG5jbGFzcyBGaWxlUmVhZGVyIGltcGxlbWVudHMgUmVhZGVyIHtcbiAgcHJpdmF0ZSBmaWxlPzogRGVuby5GaWxlO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgZmlsZVBhdGg6IHN0cmluZykge31cblxuICBwdWJsaWMgYXN5bmMgcmVhZChwOiBVaW50OEFycmF5KTogUHJvbWlzZTxudW1iZXIgfCBudWxsPiB7XG4gICAgaWYgKCF0aGlzLmZpbGUpIHtcbiAgICAgIHRoaXMuZmlsZSA9IGF3YWl0IERlbm8ub3Blbih0aGlzLmZpbGVQYXRoLCB7IHJlYWQ6IHRydWUgfSk7XG4gICAgfVxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IERlbm8ucmVhZCh0aGlzLmZpbGUucmlkLCBwKTtcbiAgICBpZiAocmVzID09PSBudWxsKSB7XG4gICAgICBEZW5vLmNsb3NlKHRoaXMuZmlsZS5yaWQpO1xuICAgICAgdGhpcy5maWxlID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlIHRoZSB0cmFpbGluZyBudWxsIGNvZGVzXG4gKiBAcGFyYW0gYnVmZmVyXG4gKi9cbmZ1bmN0aW9uIHRyaW0oYnVmZmVyOiBVaW50OEFycmF5KTogVWludDhBcnJheSB7XG4gIGNvbnN0IGluZGV4ID0gYnVmZmVyLmZpbmRJbmRleCgodik6IGJvb2xlYW4gPT4gdiA9PT0gMCk7XG4gIGlmIChpbmRleCA8IDApIHJldHVybiBidWZmZXI7XG4gIHJldHVybiBidWZmZXIuc3ViYXJyYXkoMCwgaW5kZXgpO1xufVxuXG4vKipcbiAqIEluaXRpYWxpemUgVWludDhBcnJheSBvZiB0aGUgc3BlY2lmaWVkIGxlbmd0aCBmaWxsZWQgd2l0aCAwXG4gKiBAcGFyYW0gbGVuZ3RoXG4gKi9cbmZ1bmN0aW9uIGNsZWFuKGxlbmd0aDogbnVtYmVyKTogVWludDhBcnJheSB7XG4gIGNvbnN0IGJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KGxlbmd0aCk7XG4gIGJ1ZmZlci5maWxsKDAsIDAsIGxlbmd0aCAtIDEpO1xuICByZXR1cm4gYnVmZmVyO1xufVxuXG5mdW5jdGlvbiBwYWQobnVtOiBudW1iZXIsIGJ5dGVzOiBudW1iZXIsIGJhc2U/OiBudW1iZXIpOiBzdHJpbmcge1xuICBjb25zdCBudW1TdHJpbmcgPSBudW0udG9TdHJpbmcoYmFzZSB8fCA4KTtcbiAgcmV0dXJuIFwiMDAwMDAwMDAwMDAwXCIuc3Vic3RyKG51bVN0cmluZy5sZW5ndGggKyAxMiAtIGJ5dGVzKSArIG51bVN0cmluZztcbn1cblxuZW51bSBGaWxlVHlwZXMge1xuICBcImZpbGVcIiA9IDAsXG4gIFwibGlua1wiID0gMSxcbiAgXCJzeW1saW5rXCIgPSAyLFxuICBcImNoYXJhY3Rlci1kZXZpY2VcIiA9IDMsXG4gIFwiYmxvY2stZGV2aWNlXCIgPSA0LFxuICBcImRpcmVjdG9yeVwiID0gNSxcbiAgXCJmaWZvXCIgPSA2LFxuICBcImNvbnRpZ3VvdXMtZmlsZVwiID0gNyxcbn1cblxuLypcbnN0cnVjdCBwb3NpeF9oZWFkZXIgeyAgICAgICAgICAgLy8gYnl0ZSBvZmZzZXRcbiAgY2hhciBuYW1lWzEwMF07ICAgICAgICAgICAgICAgLy8gICAwXG4gIGNoYXIgbW9kZVs4XTsgICAgICAgICAgICAgICAgIC8vIDEwMFxuICBjaGFyIHVpZFs4XTsgICAgICAgICAgICAgICAgICAvLyAxMDhcbiAgY2hhciBnaWRbOF07ICAgICAgICAgICAgICAgICAgLy8gMTE2XG4gIGNoYXIgc2l6ZVsxMl07ICAgICAgICAgICAgICAgIC8vIDEyNFxuICBjaGFyIG10aW1lWzEyXTsgICAgICAgICAgICAgICAvLyAxMzZcbiAgY2hhciBjaGtzdW1bOF07ICAgICAgICAgICAgICAgLy8gMTQ4XG4gIGNoYXIgdHlwZWZsYWc7ICAgICAgICAgICAgICAgIC8vIDE1NlxuICBjaGFyIGxpbmtuYW1lWzEwMF07ICAgICAgICAgICAvLyAxNTdcbiAgY2hhciBtYWdpY1s2XTsgICAgICAgICAgICAgICAgLy8gMjU3XG4gIGNoYXIgdmVyc2lvblsyXTsgICAgICAgICAgICAgIC8vIDI2M1xuICBjaGFyIHVuYW1lWzMyXTsgICAgICAgICAgICAgICAvLyAyNjVcbiAgY2hhciBnbmFtZVszMl07ICAgICAgICAgICAgICAgLy8gMjk3XG4gIGNoYXIgZGV2bWFqb3JbOF07ICAgICAgICAgICAgIC8vIDMyOVxuICBjaGFyIGRldm1pbm9yWzhdOyAgICAgICAgICAgICAvLyAzMzdcbiAgY2hhciBwcmVmaXhbMTU1XTsgICAgICAgICAgICAgLy8gMzQ1XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDUwMFxufTtcbiovXG5cbmNvbnN0IHVzdGFyU3RydWN0dXJlOiBBcnJheTx7IGZpZWxkOiBzdHJpbmc7IGxlbmd0aDogbnVtYmVyIH0+ID0gW1xuICB7XG4gICAgZmllbGQ6IFwiZmlsZU5hbWVcIixcbiAgICBsZW5ndGg6IDEwMCxcbiAgfSxcbiAge1xuICAgIGZpZWxkOiBcImZpbGVNb2RlXCIsXG4gICAgbGVuZ3RoOiA4LFxuICB9LFxuICB7XG4gICAgZmllbGQ6IFwidWlkXCIsXG4gICAgbGVuZ3RoOiA4LFxuICB9LFxuICB7XG4gICAgZmllbGQ6IFwiZ2lkXCIsXG4gICAgbGVuZ3RoOiA4LFxuICB9LFxuICB7XG4gICAgZmllbGQ6IFwiZmlsZVNpemVcIixcbiAgICBsZW5ndGg6IDEyLFxuICB9LFxuICB7XG4gICAgZmllbGQ6IFwibXRpbWVcIixcbiAgICBsZW5ndGg6IDEyLFxuICB9LFxuICB7XG4gICAgZmllbGQ6IFwiY2hlY2tzdW1cIixcbiAgICBsZW5ndGg6IDgsXG4gIH0sXG4gIHtcbiAgICBmaWVsZDogXCJ0eXBlXCIsXG4gICAgbGVuZ3RoOiAxLFxuICB9LFxuICB7XG4gICAgZmllbGQ6IFwibGlua05hbWVcIixcbiAgICBsZW5ndGg6IDEwMCxcbiAgfSxcbiAge1xuICAgIGZpZWxkOiBcInVzdGFyXCIsXG4gICAgbGVuZ3RoOiA4LFxuICB9LFxuICB7XG4gICAgZmllbGQ6IFwib3duZXJcIixcbiAgICBsZW5ndGg6IDMyLFxuICB9LFxuICB7XG4gICAgZmllbGQ6IFwiZ3JvdXBcIixcbiAgICBsZW5ndGg6IDMyLFxuICB9LFxuICB7XG4gICAgZmllbGQ6IFwibWFqb3JOdW1iZXJcIixcbiAgICBsZW5ndGg6IDgsXG4gIH0sXG4gIHtcbiAgICBmaWVsZDogXCJtaW5vck51bWJlclwiLFxuICAgIGxlbmd0aDogOCxcbiAgfSxcbiAge1xuICAgIGZpZWxkOiBcImZpbGVOYW1lUHJlZml4XCIsXG4gICAgbGVuZ3RoOiAxNTUsXG4gIH0sXG4gIHtcbiAgICBmaWVsZDogXCJwYWRkaW5nXCIsXG4gICAgbGVuZ3RoOiAxMixcbiAgfSxcbl07XG5cbi8qKlxuICogQ3JlYXRlIGhlYWRlciBmb3IgYSBmaWxlIGluIGEgdGFyIGFyY2hpdmVcbiAqL1xuZnVuY3Rpb24gZm9ybWF0SGVhZGVyKGRhdGE6IFRhckRhdGEpOiBVaW50OEFycmF5IHtcbiAgY29uc3QgZW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpLFxuICAgIGJ1ZmZlciA9IGNsZWFuKDUxMik7XG4gIGxldCBvZmZzZXQgPSAwO1xuICB1c3RhclN0cnVjdHVyZS5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSk6IHZvaWQge1xuICAgIGNvbnN0IGVudHJ5ID0gZW5jb2Rlci5lbmNvZGUoZGF0YVt2YWx1ZS5maWVsZCBhcyBrZXlvZiBUYXJEYXRhXSB8fCBcIlwiKTtcbiAgICBidWZmZXIuc2V0KGVudHJ5LCBvZmZzZXQpO1xuICAgIG9mZnNldCArPSB2YWx1ZS5sZW5ndGg7IC8vIHNwYWNlIGl0IG91dCB3aXRoIG51bGxzXG4gIH0pO1xuICByZXR1cm4gYnVmZmVyO1xufVxuXG4vKipcbiAqIFBhcnNlIGZpbGUgaGVhZGVyIGluIGEgdGFyIGFyY2hpdmVcbiAqIEBwYXJhbSBsZW5ndGhcbiAqL1xuZnVuY3Rpb24gcGFyc2VIZWFkZXIoYnVmZmVyOiBVaW50OEFycmF5KTogeyBba2V5OiBzdHJpbmddOiBVaW50OEFycmF5IH0ge1xuICBjb25zdCBkYXRhOiB7IFtrZXk6IHN0cmluZ106IFVpbnQ4QXJyYXkgfSA9IHt9O1xuICBsZXQgb2Zmc2V0ID0gMDtcbiAgdXN0YXJTdHJ1Y3R1cmUuZm9yRWFjaChmdW5jdGlvbiAodmFsdWUpOiB2b2lkIHtcbiAgICBjb25zdCBhcnIgPSBidWZmZXIuc3ViYXJyYXkob2Zmc2V0LCBvZmZzZXQgKyB2YWx1ZS5sZW5ndGgpO1xuICAgIGRhdGFbdmFsdWUuZmllbGRdID0gYXJyO1xuICAgIG9mZnNldCArPSB2YWx1ZS5sZW5ndGg7XG4gIH0pO1xuICByZXR1cm4gZGF0YTtcbn1cblxuaW50ZXJmYWNlIFRhckhlYWRlciB7XG4gIFtrZXk6IHN0cmluZ106IFVpbnQ4QXJyYXk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGFyRGF0YSB7XG4gIGZpbGVOYW1lPzogc3RyaW5nO1xuICBmaWxlTmFtZVByZWZpeD86IHN0cmluZztcbiAgZmlsZU1vZGU/OiBzdHJpbmc7XG4gIHVpZD86IHN0cmluZztcbiAgZ2lkPzogc3RyaW5nO1xuICBmaWxlU2l6ZT86IHN0cmluZztcbiAgbXRpbWU/OiBzdHJpbmc7XG4gIGNoZWNrc3VtPzogc3RyaW5nO1xuICB0eXBlPzogc3RyaW5nO1xuICB1c3Rhcj86IHN0cmluZztcbiAgb3duZXI/OiBzdHJpbmc7XG4gIGdyb3VwPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRhckRhdGFXaXRoU291cmNlIGV4dGVuZHMgVGFyRGF0YSB7XG4gIC8qKlxuICAgKiBmaWxlIHRvIHJlYWRcbiAgICovXG4gIGZpbGVQYXRoPzogc3RyaW5nO1xuICAvKipcbiAgICogYnVmZmVyIHRvIHJlYWRcbiAgICovXG4gIHJlYWRlcj86IFJlYWRlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUYXJJbmZvIHtcbiAgZmlsZU1vZGU/OiBudW1iZXI7XG4gIG10aW1lPzogbnVtYmVyO1xuICB1aWQ/OiBudW1iZXI7XG4gIGdpZD86IG51bWJlcjtcbiAgb3duZXI/OiBzdHJpbmc7XG4gIGdyb3VwPzogc3RyaW5nO1xuICB0eXBlPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRhck9wdGlvbnMgZXh0ZW5kcyBUYXJJbmZvIHtcbiAgLyoqXG4gICAqIGFwcGVuZCBmaWxlXG4gICAqL1xuICBmaWxlUGF0aD86IHN0cmluZztcblxuICAvKipcbiAgICogYXBwZW5kIGFueSBhcmJpdHJhcnkgY29udGVudFxuICAgKi9cbiAgcmVhZGVyPzogUmVhZGVyO1xuXG4gIC8qKlxuICAgKiBzaXplIG9mIHRoZSBjb250ZW50IHRvIGJlIGFwcGVuZGVkXG4gICAqL1xuICBjb250ZW50U2l6ZT86IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUYXJNZXRhIGV4dGVuZHMgVGFySW5mbyB7XG4gIGZpbGVOYW1lOiBzdHJpbmc7XG4gIGZpbGVTaXplPzogbnVtYmVyO1xufVxuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWVtcHR5LWludGVyZmFjZVxuaW50ZXJmYWNlIFRhckVudHJ5IGV4dGVuZHMgVGFyTWV0YSB7fVxuXG4vKipcbiAqIEEgY2xhc3MgdG8gY3JlYXRlIGEgdGFyIGFyY2hpdmVcbiAqL1xuZXhwb3J0IGNsYXNzIFRhciB7XG4gIGRhdGE6IFRhckRhdGFXaXRoU291cmNlW107XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5kYXRhID0gW107XG4gIH1cblxuICAvKipcbiAgICogQXBwZW5kIGEgZmlsZSB0byB0aGlzIHRhciBhcmNoaXZlXG4gICAqIEBwYXJhbSBmbiBmaWxlIG5hbWVcbiAgICogICAgICAgICAgICAgICAgIGUuZy4sIHRlc3QudHh0OyB1c2Ugc2xhc2ggZm9yIGRpcmVjdG9yeSBzZXBhcmF0b3JzXG4gICAqIEBwYXJhbSBvcHRzIG9wdGlvbnNcbiAgICovXG4gIGFzeW5jIGFwcGVuZChmbjogc3RyaW5nLCBvcHRzOiBUYXJPcHRpb25zKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZmlsZSBuYW1lIG5vdCBzcGVjaWZpZWRcIik7XG4gICAgfVxuICAgIGxldCBmaWxlTmFtZSA9IGZuO1xuICAgIC8vIHNlcGFyYXRlIGZpbGUgbmFtZSBpbnRvIHR3byBwYXJ0cyBpZiBuZWVkZWRcbiAgICBsZXQgZmlsZU5hbWVQcmVmaXg6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICBpZiAoZmlsZU5hbWUubGVuZ3RoID4gMTAwKSB7XG4gICAgICBsZXQgaSA9IGZpbGVOYW1lLmxlbmd0aDtcbiAgICAgIHdoaWxlIChpID49IDApIHtcbiAgICAgICAgaSA9IGZpbGVOYW1lLmxhc3RJbmRleE9mKFwiL1wiLCBpKTtcbiAgICAgICAgaWYgKGkgPD0gMTU1KSB7XG4gICAgICAgICAgZmlsZU5hbWVQcmVmaXggPSBmaWxlTmFtZS5zdWJzdHIoMCwgaSk7XG4gICAgICAgICAgZmlsZU5hbWUgPSBmaWxlTmFtZS5zdWJzdHIoaSArIDEpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGktLTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGVyck1zZyA9XG4gICAgICAgIFwidXN0YXIgZm9ybWF0IGRvZXMgbm90IGFsbG93IGEgbG9uZyBmaWxlIG5hbWUgKGxlbmd0aCBvZiBbZmlsZSBuYW1lXCIgK1xuICAgICAgICBcInByZWZpeF0gKyAvICsgW2ZpbGUgbmFtZV0gbXVzdCBiZSBzaG9ydGVyIHRoYW4gMjU2IGJ5dGVzKVwiO1xuICAgICAgaWYgKGkgPCAwIHx8IGZpbGVOYW1lLmxlbmd0aCA+IDEwMCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyTXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFzc2VydChmaWxlTmFtZVByZWZpeCAhPSBudWxsKTtcbiAgICAgICAgaWYgKGZpbGVOYW1lUHJlZml4Lmxlbmd0aCA+IDE1NSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJNc2cpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgb3B0cyA9IG9wdHMgfHwge307XG5cbiAgICAvLyBzZXQgbWV0YSBkYXRhXG4gICAgbGV0IGluZm86IERlbm8uRmlsZUluZm8gfCB1bmRlZmluZWQ7XG4gICAgaWYgKG9wdHMuZmlsZVBhdGgpIHtcbiAgICAgIGluZm8gPSBhd2FpdCBEZW5vLnN0YXQob3B0cy5maWxlUGF0aCk7XG4gICAgICBpZiAoaW5mby5pc0RpcmVjdG9yeSkge1xuICAgICAgICBpbmZvLnNpemUgPSAwO1xuICAgICAgICBvcHRzLnJlYWRlciA9IG5ldyBEZW5vLkJ1ZmZlcigpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IG1vZGUgPSBvcHRzLmZpbGVNb2RlIHx8IChpbmZvICYmIGluZm8ubW9kZSkgfHxcbiAgICAgICAgcGFyc2VJbnQoXCI3NzdcIiwgOCkgJiAweGZmZixcbiAgICAgIG10aW1lID0gTWF0aC5mbG9vcihcbiAgICAgICAgb3B0cy5tdGltZSA/PyAoaW5mbz8ubXRpbWUgPz8gbmV3IERhdGUoKSkudmFsdWVPZigpIC8gMTAwMCxcbiAgICAgICksXG4gICAgICB1aWQgPSBvcHRzLnVpZCB8fCAwLFxuICAgICAgZ2lkID0gb3B0cy5naWQgfHwgMDtcbiAgICBpZiAodHlwZW9mIG9wdHMub3duZXIgPT09IFwic3RyaW5nXCIgJiYgb3B0cy5vd25lci5sZW5ndGggPj0gMzIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJ1c3RhciBmb3JtYXQgZG9lcyBub3QgYWxsb3cgb3duZXIgbmFtZSBsZW5ndGggPj0gMzIgYnl0ZXNcIixcbiAgICAgICk7XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygb3B0cy5ncm91cCA9PT0gXCJzdHJpbmdcIiAmJiBvcHRzLmdyb3VwLmxlbmd0aCA+PSAzMikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBcInVzdGFyIGZvcm1hdCBkb2VzIG5vdCBhbGxvdyBncm91cCBuYW1lIGxlbmd0aCA+PSAzMiBieXRlc1wiLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlU2l6ZSA9IGluZm8/LnNpemUgPz8gb3B0cy5jb250ZW50U2l6ZTtcbiAgICBhc3NlcnQoZmlsZVNpemUgIT0gbnVsbCwgXCJmaWxlU2l6ZSBtdXN0IGJlIHNldFwiKTtcblxuICAgIGNvbnN0IHR5cGUgPSBvcHRzLnR5cGVcbiAgICAgID8gRmlsZVR5cGVzW29wdHMudHlwZSBhcyBrZXlvZiB0eXBlb2YgRmlsZVR5cGVzXVxuICAgICAgOiAoaW5mbz8uaXNEaXJlY3RvcnkgPyBGaWxlVHlwZXMuZGlyZWN0b3J5IDogRmlsZVR5cGVzLmZpbGUpO1xuICAgIGNvbnN0IHRhckRhdGE6IFRhckRhdGFXaXRoU291cmNlID0ge1xuICAgICAgZmlsZU5hbWUsXG4gICAgICBmaWxlTmFtZVByZWZpeCxcbiAgICAgIGZpbGVNb2RlOiBwYWQobW9kZSwgNyksXG4gICAgICB1aWQ6IHBhZCh1aWQsIDcpLFxuICAgICAgZ2lkOiBwYWQoZ2lkLCA3KSxcbiAgICAgIGZpbGVTaXplOiBwYWQoZmlsZVNpemUsIDExKSxcbiAgICAgIG10aW1lOiBwYWQobXRpbWUsIDExKSxcbiAgICAgIGNoZWNrc3VtOiBcIiAgICAgICAgXCIsXG4gICAgICB0eXBlOiB0eXBlLnRvU3RyaW5nKCksXG4gICAgICB1c3RhcixcbiAgICAgIG93bmVyOiBvcHRzLm93bmVyIHx8IFwiXCIsXG4gICAgICBncm91cDogb3B0cy5ncm91cCB8fCBcIlwiLFxuICAgICAgZmlsZVBhdGg6IG9wdHMuZmlsZVBhdGgsXG4gICAgICByZWFkZXI6IG9wdHMucmVhZGVyLFxuICAgIH07XG5cbiAgICAvLyBjYWxjdWxhdGUgdGhlIGNoZWNrc3VtXG4gICAgbGV0IGNoZWNrc3VtID0gMDtcbiAgICBjb25zdCBlbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG4gICAgT2JqZWN0LmtleXModGFyRGF0YSlcbiAgICAgIC5maWx0ZXIoKGtleSk6IGJvb2xlYW4gPT4gW1wiZmlsZVBhdGhcIiwgXCJyZWFkZXJcIl0uaW5kZXhPZihrZXkpIDwgMClcbiAgICAgIC5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpOiB2b2lkIHtcbiAgICAgICAgY2hlY2tzdW0gKz0gZW5jb2RlclxuICAgICAgICAgIC5lbmNvZGUodGFyRGF0YVtrZXkgYXMga2V5b2YgVGFyRGF0YV0pXG4gICAgICAgICAgLnJlZHVjZSgocCwgYyk6IG51bWJlciA9PiBwICsgYywgMCk7XG4gICAgICB9KTtcblxuICAgIHRhckRhdGEuY2hlY2tzdW0gPSBwYWQoY2hlY2tzdW0sIDYpICsgXCJcXHUwMDAwIFwiO1xuICAgIHRoaXMuZGF0YS5wdXNoKHRhckRhdGEpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIFJlYWRlciBpbnN0YW5jZSBmb3IgdGhpcyB0YXIgZGF0YVxuICAgKi9cbiAgZ2V0UmVhZGVyKCk6IFJlYWRlciB7XG4gICAgY29uc3QgcmVhZGVyczogUmVhZGVyW10gPSBbXTtcbiAgICB0aGlzLmRhdGEuZm9yRWFjaCgodGFyRGF0YSk6IHZvaWQgPT4ge1xuICAgICAgbGV0IHsgcmVhZGVyIH0gPSB0YXJEYXRhO1xuICAgICAgY29uc3QgeyBmaWxlUGF0aCB9ID0gdGFyRGF0YTtcbiAgICAgIGNvbnN0IGhlYWRlckFyciA9IGZvcm1hdEhlYWRlcih0YXJEYXRhKTtcbiAgICAgIHJlYWRlcnMucHVzaChuZXcgRGVuby5CdWZmZXIoaGVhZGVyQXJyKSk7XG4gICAgICBpZiAoIXJlYWRlcikge1xuICAgICAgICBhc3NlcnQoZmlsZVBhdGggIT0gbnVsbCk7XG4gICAgICAgIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKGZpbGVQYXRoKTtcbiAgICAgIH1cbiAgICAgIHJlYWRlcnMucHVzaChyZWFkZXIpO1xuXG4gICAgICAvLyB0byB0aGUgbmVhcmVzdCBtdWx0aXBsZSBvZiByZWNvcmRTaXplXG4gICAgICBhc3NlcnQodGFyRGF0YS5maWxlU2l6ZSAhPSBudWxsLCBcImZpbGVTaXplIG11c3QgYmUgc2V0XCIpO1xuICAgICAgcmVhZGVycy5wdXNoKFxuICAgICAgICBuZXcgRGVuby5CdWZmZXIoXG4gICAgICAgICAgY2xlYW4oXG4gICAgICAgICAgICByZWNvcmRTaXplIC1cbiAgICAgICAgICAgICAgKHBhcnNlSW50KHRhckRhdGEuZmlsZVNpemUsIDgpICUgcmVjb3JkU2l6ZSB8fCByZWNvcmRTaXplKSxcbiAgICAgICAgICApLFxuICAgICAgICApLFxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIC8vIGFwcGVuZCAyIGVtcHR5IHJlY29yZHNcbiAgICByZWFkZXJzLnB1c2gobmV3IERlbm8uQnVmZmVyKGNsZWFuKHJlY29yZFNpemUgKiAyKSkpO1xuICAgIHJldHVybiBuZXcgTXVsdGlSZWFkZXIoLi4ucmVhZGVycyk7XG4gIH1cbn1cblxuY2xhc3MgVGFyRW50cnkgaW1wbGVtZW50cyBSZWFkZXIge1xuICAjaGVhZGVyOiBUYXJIZWFkZXI7XG4gICNyZWFkZXI6IFJlYWRlciB8IChSZWFkZXIgJiBEZW5vLlNlZWtlcik7XG4gICNzaXplOiBudW1iZXI7XG4gICNyZWFkID0gMDtcbiAgI2NvbnN1bWVkID0gZmFsc2U7XG4gICNlbnRyeVNpemU6IG51bWJlcjtcbiAgY29uc3RydWN0b3IoXG4gICAgbWV0YTogVGFyTWV0YSxcbiAgICBoZWFkZXI6IFRhckhlYWRlcixcbiAgICByZWFkZXI6IFJlYWRlciB8IChSZWFkZXIgJiBEZW5vLlNlZWtlciksXG4gICkge1xuICAgIE9iamVjdC5hc3NpZ24odGhpcywgbWV0YSk7XG4gICAgdGhpcy4jaGVhZGVyID0gaGVhZGVyO1xuICAgIHRoaXMuI3JlYWRlciA9IHJlYWRlcjtcblxuICAgIC8vIEZpbGUgU2l6ZVxuICAgIHRoaXMuI3NpemUgPSB0aGlzLmZpbGVTaXplIHx8IDA7XG4gICAgLy8gRW50cnkgU2l6ZVxuICAgIGNvbnN0IGJsb2NrcyA9IE1hdGguY2VpbCh0aGlzLiNzaXplIC8gcmVjb3JkU2l6ZSk7XG4gICAgdGhpcy4jZW50cnlTaXplID0gYmxvY2tzICogcmVjb3JkU2l6ZTtcbiAgfVxuXG4gIGdldCBjb25zdW1lZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4jY29uc3VtZWQ7XG4gIH1cblxuICBhc3luYyByZWFkKHA6IFVpbnQ4QXJyYXkpOiBQcm9taXNlPG51bWJlciB8IG51bGw+IHtcbiAgICAvLyBCeXRlcyBsZWZ0IGZvciBlbnRyeVxuICAgIGNvbnN0IGVudHJ5Qnl0ZXNMZWZ0ID0gdGhpcy4jZW50cnlTaXplIC0gdGhpcy4jcmVhZDtcbiAgICBjb25zdCBidWZTaXplID0gTWF0aC5taW4oXG4gICAgICAvLyBidWZTaXplIGNhbid0IGJlIGdyZWF0ZXIgdGhhbiBwLmxlbmd0aCBub3IgYnl0ZXMgbGVmdCBpbiB0aGUgZW50cnlcbiAgICAgIHAubGVuZ3RoLFxuICAgICAgZW50cnlCeXRlc0xlZnQsXG4gICAgKTtcblxuICAgIGlmIChlbnRyeUJ5dGVzTGVmdCA8PSAwKSByZXR1cm4gbnVsbDtcblxuICAgIGNvbnN0IGJsb2NrID0gbmV3IFVpbnQ4QXJyYXkoYnVmU2l6ZSk7XG4gICAgY29uc3QgbiA9IGF3YWl0IHJlYWRCbG9jayh0aGlzLiNyZWFkZXIsIGJsb2NrKTtcbiAgICBjb25zdCBieXRlc0xlZnQgPSB0aGlzLiNzaXplIC0gdGhpcy4jcmVhZDtcblxuICAgIHRoaXMuI3JlYWQgKz0gbiB8fCAwO1xuICAgIGlmIChuID09PSBudWxsIHx8IGJ5dGVzTGVmdCA8PSAwKSB7XG4gICAgICBpZiAobnVsbCkgdGhpcy4jY29uc3VtZWQgPSB0cnVlO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlIHplcm8gZmlsbGVkXG4gICAgY29uc3Qgb2Zmc2V0ID0gYnl0ZXNMZWZ0IDwgbiA/IGJ5dGVzTGVmdCA6IG47XG4gICAgcC5zZXQoYmxvY2suc3ViYXJyYXkoMCwgb2Zmc2V0KSwgMCk7XG5cbiAgICByZXR1cm4gb2Zmc2V0IDwgMCA/IG4gLSBNYXRoLmFicyhvZmZzZXQpIDogb2Zmc2V0O1xuICB9XG5cbiAgYXN5bmMgZGlzY2FyZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyBEaXNjYXJkIGN1cnJlbnQgZW50cnlcbiAgICBpZiAodGhpcy4jY29uc3VtZWQpIHJldHVybjtcbiAgICB0aGlzLiNjb25zdW1lZCA9IHRydWU7XG5cbiAgICBpZiAodHlwZW9mICh0aGlzLiNyZWFkZXIgYXMgU2Vla2VyKS5zZWVrID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIGF3YWl0ICh0aGlzLiNyZWFkZXIgYXMgU2Vla2VyKS5zZWVrKFxuICAgICAgICB0aGlzLiNlbnRyeVNpemUgLSB0aGlzLiNyZWFkLFxuICAgICAgICBEZW5vLlNlZWtNb2RlLkN1cnJlbnQsXG4gICAgICApO1xuICAgICAgdGhpcy4jcmVhZCA9IHRoaXMuI2VudHJ5U2l6ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXdhaXQgRGVuby5yZWFkQWxsKHRoaXMpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEEgY2xhc3MgdG8gZXh0cmFjdCBhIHRhciBhcmNoaXZlXG4gKi9cbmV4cG9ydCBjbGFzcyBVbnRhciB7XG4gIHJlYWRlcjogUmVhZGVyO1xuICBibG9jazogVWludDhBcnJheTtcbiAgI2VudHJ5OiBUYXJFbnRyeSB8IHVuZGVmaW5lZDtcblxuICBjb25zdHJ1Y3RvcihyZWFkZXI6IFJlYWRlcikge1xuICAgIHRoaXMucmVhZGVyID0gcmVhZGVyO1xuICAgIHRoaXMuYmxvY2sgPSBuZXcgVWludDhBcnJheShyZWNvcmRTaXplKTtcbiAgfVxuXG4gICNjaGVja3N1bSA9IChoZWFkZXI6IFVpbnQ4QXJyYXkpOiBudW1iZXIgPT4ge1xuICAgIGxldCBzdW0gPSBpbml0aWFsQ2hlY2tzdW07XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCA1MTI7IGkrKykge1xuICAgICAgaWYgKGkgPj0gMTQ4ICYmIGkgPCAxNTYpIHtcbiAgICAgICAgLy8gSWdub3JlIGNoZWNrc3VtIGhlYWRlclxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHN1bSArPSBoZWFkZXJbaV07XG4gICAgfVxuICAgIHJldHVybiBzdW07XG4gIH07XG5cbiAgI2dldEhlYWRlciA9IGFzeW5jICgpOiBQcm9taXNlPFRhckhlYWRlciB8IG51bGw+ID0+IHtcbiAgICBhd2FpdCByZWFkQmxvY2sodGhpcy5yZWFkZXIsIHRoaXMuYmxvY2spO1xuICAgIGNvbnN0IGhlYWRlciA9IHBhcnNlSGVhZGVyKHRoaXMuYmxvY2spO1xuXG4gICAgLy8gY2FsY3VsYXRlIHRoZSBjaGVja3N1bVxuICAgIGNvbnN0IGRlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoKTtcbiAgICBjb25zdCBjaGVja3N1bSA9IHRoaXMuI2NoZWNrc3VtKHRoaXMuYmxvY2spO1xuXG4gICAgaWYgKHBhcnNlSW50KGRlY29kZXIuZGVjb2RlKGhlYWRlci5jaGVja3N1bSksIDgpICE9PSBjaGVja3N1bSkge1xuICAgICAgaWYgKGNoZWNrc3VtID09PSBpbml0aWFsQ2hlY2tzdW0pIHtcbiAgICAgICAgLy8gRU9GXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY2hlY2tzdW0gZXJyb3JcIik7XG4gICAgfVxuXG4gICAgY29uc3QgbWFnaWMgPSBkZWNvZGVyLmRlY29kZShoZWFkZXIudXN0YXIpO1xuXG4gICAgaWYgKG1hZ2ljLmluZGV4T2YoXCJ1c3RhclwiKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGB1bnN1cHBvcnRlZCBhcmNoaXZlIGZvcm1hdDogJHttYWdpY31gKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaGVhZGVyO1xuICB9O1xuXG4gICNnZXRNZXRhZGF0YSA9IChoZWFkZXI6IFRhckhlYWRlcik6IFRhck1ldGEgPT4ge1xuICAgIGNvbnN0IGRlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoKTtcbiAgICAvLyBnZXQgbWV0YSBkYXRhXG4gICAgY29uc3QgbWV0YTogVGFyTWV0YSA9IHtcbiAgICAgIGZpbGVOYW1lOiBkZWNvZGVyLmRlY29kZSh0cmltKGhlYWRlci5maWxlTmFtZSkpLFxuICAgIH07XG4gICAgY29uc3QgZmlsZU5hbWVQcmVmaXggPSB0cmltKGhlYWRlci5maWxlTmFtZVByZWZpeCk7XG4gICAgaWYgKGZpbGVOYW1lUHJlZml4LmJ5dGVMZW5ndGggPiAwKSB7XG4gICAgICBtZXRhLmZpbGVOYW1lID0gZGVjb2Rlci5kZWNvZGUoZmlsZU5hbWVQcmVmaXgpICsgXCIvXCIgKyBtZXRhLmZpbGVOYW1lO1xuICAgIH1cbiAgICAoW1wiZmlsZU1vZGVcIiwgXCJtdGltZVwiLCBcInVpZFwiLCBcImdpZFwiXSBhcyBbXG4gICAgICBcImZpbGVNb2RlXCIsXG4gICAgICBcIm10aW1lXCIsXG4gICAgICBcInVpZFwiLFxuICAgICAgXCJnaWRcIixcbiAgICBdKS5mb3JFYWNoKChrZXkpOiB2b2lkID0+IHtcbiAgICAgIGNvbnN0IGFyciA9IHRyaW0oaGVhZGVyW2tleV0pO1xuICAgICAgaWYgKGFyci5ieXRlTGVuZ3RoID4gMCkge1xuICAgICAgICBtZXRhW2tleV0gPSBwYXJzZUludChkZWNvZGVyLmRlY29kZShhcnIpLCA4KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAoW1wib3duZXJcIiwgXCJncm91cFwiLCBcInR5cGVcIl0gYXMgW1wib3duZXJcIiwgXCJncm91cFwiLCBcInR5cGVcIl0pLmZvckVhY2goXG4gICAgICAoa2V5KTogdm9pZCA9PiB7XG4gICAgICAgIGNvbnN0IGFyciA9IHRyaW0oaGVhZGVyW2tleV0pO1xuICAgICAgICBpZiAoYXJyLmJ5dGVMZW5ndGggPiAwKSB7XG4gICAgICAgICAgbWV0YVtrZXldID0gZGVjb2Rlci5kZWNvZGUoYXJyKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICApO1xuXG4gICAgbWV0YS5maWxlU2l6ZSA9IHBhcnNlSW50KGRlY29kZXIuZGVjb2RlKGhlYWRlci5maWxlU2l6ZSksIDgpO1xuICAgIG1ldGEudHlwZSA9IEZpbGVUeXBlc1twYXJzZUludChtZXRhLnR5cGUhKV0gPz8gbWV0YS50eXBlO1xuXG4gICAgcmV0dXJuIG1ldGE7XG4gIH07XG5cbiAgYXN5bmMgZXh0cmFjdCgpOiBQcm9taXNlPFRhckVudHJ5IHwgbnVsbD4ge1xuICAgIGlmICh0aGlzLiNlbnRyeSAmJiAhdGhpcy4jZW50cnkuY29uc3VtZWQpIHtcbiAgICAgIC8vIElmIGVudHJ5IGJvZHkgd2FzIG5vdCByZWFkLCBkaXNjYXJkIHRoZSBib2R5XG4gICAgICAvLyBzbyB3ZSBjYW4gcmVhZCB0aGUgbmV4dCBlbnRyeS5cbiAgICAgIGF3YWl0IHRoaXMuI2VudHJ5LmRpc2NhcmQoKTtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkZXIgPSBhd2FpdCB0aGlzLiNnZXRIZWFkZXIoKTtcbiAgICBpZiAoaGVhZGVyID09PSBudWxsKSByZXR1cm4gbnVsbDtcblxuICAgIGNvbnN0IG1ldGEgPSB0aGlzLiNnZXRNZXRhZGF0YShoZWFkZXIpO1xuXG4gICAgdGhpcy4jZW50cnkgPSBuZXcgVGFyRW50cnkobWV0YSwgaGVhZGVyLCB0aGlzLnJlYWRlcik7XG5cbiAgICByZXR1cm4gdGhpcy4jZW50cnk7XG4gIH1cblxuICBhc3luYyAqW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSgpOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8VGFyRW50cnk+IHtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgY29uc3QgZW50cnkgPSBhd2FpdCB0aGlzLmV4dHJhY3QoKTtcblxuICAgICAgaWYgKGVudHJ5ID09PSBudWxsKSByZXR1cm47XG5cbiAgICAgIHlpZWxkIGVudHJ5O1xuICAgIH1cbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEVBMkJHLEFBM0JIOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0EyQkcsQUEzQkgsRUEyQkcsVUFDTSxXQUFXLFNBQVEsZ0JBQWtCO1NBQ3JDLGdCQUFnQixTQUFRLGNBQWdCO1NBQ3hDLE1BQU0sU0FBUSxrQkFBb0I7TUFLckMsVUFBVSxHQUFHLEdBQUc7TUFDaEIsS0FBSyxJQUFHLGFBQWU7QUFFN0IsRUFBc0YsQUFBdEYsb0ZBQXNGO0FBQ3RGLEVBQW1FLEFBQW5FLGlFQUFtRTtNQUM3RCxlQUFlLEdBQUcsQ0FBQyxHQUFHLEVBQUU7ZUFFZixTQUFTLENBQ3RCLE1BQW1CLEVBQ25CLENBQWE7UUFFVCxTQUFTLEdBQUcsQ0FBQztVQUNWLFNBQVMsR0FBRyxDQUFDLENBQUMsTUFBTTtjQUNuQixFQUFFLFNBQVMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFNBQVM7WUFDN0MsRUFBRSxLQUFLLElBQUk7Z0JBQ1QsU0FBUyxLQUFLLENBQUM7dUJBQ1YsSUFBSTs7MEJBRUQsZ0JBQWdCOzs7UUFHOUIsU0FBUyxJQUFJLEVBQUU7O1dBRVYsU0FBUzs7QUFHbEIsRUFFRyxBQUZIOztDQUVHLEFBRkgsRUFFRyxPQUNHLFdBQVU7SUFHTSxR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
