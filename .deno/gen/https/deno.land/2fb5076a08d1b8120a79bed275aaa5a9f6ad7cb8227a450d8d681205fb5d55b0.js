import { copy } from "../bytes/mod.ts";
import { assert } from "../_util/assert.ts";
import { Buffer } from "./buffer.ts";
import { writeAll, writeAllSync } from "./util.ts";
const DEFAULT_BUF_SIZE = 4096;
const MIN_BUF_SIZE = 16;
const MAX_CONSECUTIVE_EMPTY_READS = 100;
const CR = "\r".charCodeAt(0);
const LF = "\n".charCodeAt(0);
export class BufferFullError extends Error {
  partial;
  name = "BufferFullError";
  constructor(partial) {
    super("Buffer full");
    this.partial = partial;
  }
}
export class PartialReadError extends Error {
  name = "PartialReadError";
  partial;
  constructor() {
    super("Encountered UnexpectedEof, data only partially read");
  }
}
/** BufReader implements buffering for a Reader object. */ export class BufReader {
  buf;
  rd;
  r = 0;
  w = 0;
  eof = false;
  // private lastByte: number;
  // private lastCharSize: number;
  /** return new BufReader unless r is BufReader */ static create(
    r,
    size = DEFAULT_BUF_SIZE,
  ) {
    return r instanceof BufReader ? r : new BufReader(r, size);
  }
  constructor(rd, size = DEFAULT_BUF_SIZE) {
    if (size < MIN_BUF_SIZE) {
      size = MIN_BUF_SIZE;
    }
    this._reset(new Uint8Array(size), rd);
  }
  /** Returns the size of the underlying buffer in bytes. */ size() {
    return this.buf.byteLength;
  }
  buffered() {
    return this.w - this.r;
  }
  // Reads a new chunk into the buffer.
  async _fill() {
    // Slide existing data to beginning.
    if (this.r > 0) {
      this.buf.copyWithin(0, this.r, this.w);
      this.w -= this.r;
      this.r = 0;
    }
    if (this.w >= this.buf.byteLength) {
      throw Error("bufio: tried to fill full buffer");
    }
    // Read new data: try a limited number of times.
    for (let i = MAX_CONSECUTIVE_EMPTY_READS; i > 0; i--) {
      const rr = await this.rd.read(this.buf.subarray(this.w));
      if (rr === null) {
        this.eof = true;
        return;
      }
      assert(rr >= 0, "negative read");
      this.w += rr;
      if (rr > 0) {
        return;
      }
    }
    throw new Error(
      `No progress after ${MAX_CONSECUTIVE_EMPTY_READS} read() calls`,
    );
  }
  /** Discards any buffered data, resets all state, and switches
   * the buffered reader to read from r.
   */ reset(r) {
    this._reset(this.buf, r);
  }
  _reset(buf, rd) {
    this.buf = buf;
    this.rd = rd;
    this.eof = false;
    // this.lastByte = -1;
    // this.lastCharSize = -1;
  }
  /** reads data into p.
   * It returns the number of bytes read into p.
   * The bytes are taken from at most one Read on the underlying Reader,
   * hence n may be less than len(p).
   * To read exactly len(p) bytes, use io.ReadFull(b, p).
   */ async read(p) {
    let rr = p.byteLength;
    if (p.byteLength === 0) return rr;
    if (this.r === this.w) {
      if (p.byteLength >= this.buf.byteLength) {
        // Large read, empty buffer.
        // Read directly into p to avoid copy.
        const rr = await this.rd.read(p);
        const nread = rr ?? 0;
        assert(nread >= 0, "negative read");
        // if (rr.nread > 0) {
        //   this.lastByte = p[rr.nread - 1];
        //   this.lastCharSize = -1;
        // }
        return rr;
      }
      // One read.
      // Do not use this.fill, which will loop.
      this.r = 0;
      this.w = 0;
      rr = await this.rd.read(this.buf);
      if (rr === 0 || rr === null) return rr;
      assert(rr >= 0, "negative read");
      this.w += rr;
    }
    // copy as much as we can
    const copied = copy(this.buf.subarray(this.r, this.w), p, 0);
    this.r += copied;
    // this.lastByte = this.buf[this.r - 1];
    // this.lastCharSize = -1;
    return copied;
  }
  /** reads exactly `p.length` bytes into `p`.
   *
   * If successful, `p` is returned.
   *
   * If the end of the underlying stream has been reached, and there are no more
   * bytes available in the buffer, `readFull()` returns `null` instead.
   *
   * An error is thrown if some bytes could be read, but not enough to fill `p`
   * entirely before the underlying stream reported an error or EOF. Any error
   * thrown will have a `partial` property that indicates the slice of the
   * buffer that has been successfully filled with data.
   *
   * Ported from https://golang.org/pkg/io/#ReadFull
   */ async readFull(p) {
    let bytesRead = 0;
    while (bytesRead < p.length) {
      try {
        const rr = await this.read(p.subarray(bytesRead));
        if (rr === null) {
          if (bytesRead === 0) {
            return null;
          } else {
            throw new PartialReadError();
          }
        }
        bytesRead += rr;
      } catch (err) {
        err.partial = p.subarray(0, bytesRead);
        throw err;
      }
    }
    return p;
  }
  /** Returns the next byte [0, 255] or `null`. */ async readByte() {
    while (this.r === this.w) {
      if (this.eof) return null;
      await this._fill(); // buffer is empty.
    }
    const c = this.buf[this.r];
    this.r++;
    // this.lastByte = c;
    return c;
  }
  /** readString() reads until the first occurrence of delim in the input,
   * returning a string containing the data up to and including the delimiter.
   * If ReadString encounters an error before finding a delimiter,
   * it returns the data read before the error and the error itself
   * (often `null`).
   * ReadString returns err != nil if and only if the returned data does not end
   * in delim.
   * For simple uses, a Scanner may be more convenient.
   */ async readString(delim) {
    if (delim.length !== 1) {
      throw new Error("Delimiter should be a single character");
    }
    const buffer = await this.readSlice(delim.charCodeAt(0));
    if (buffer === null) return null;
    return new TextDecoder().decode(buffer);
  }
  /** `readLine()` is a low-level line-reading primitive. Most callers should
   * use `readString('\n')` instead or use a Scanner.
   *
   * `readLine()` tries to return a single line, not including the end-of-line
   * bytes. If the line was too long for the buffer then `more` is set and the
   * beginning of the line is returned. The rest of the line will be returned
   * from future calls. `more` will be false when returning the last fragment
   * of the line. The returned buffer is only valid until the next call to
   * `readLine()`.
   *
   * The text returned from ReadLine does not include the line end ("\r\n" or
   * "\n").
   *
   * When the end of the underlying stream is reached, the final bytes in the
   * stream are returned. No indication or error is given if the input ends
   * without a final line end. When there are no more trailing bytes to read,
   * `readLine()` returns `null`.
   *
   * Calling `unreadByte()` after `readLine()` will always unread the last byte
   * read (possibly a character belonging to the line end) even if that byte is
   * not part of the line returned by `readLine()`.
   */ async readLine() {
    let line;
    try {
      line = await this.readSlice(LF);
    } catch (err) {
      let { partial } = err;
      assert(
        partial instanceof Uint8Array,
        "bufio: caught error from `readSlice()` without `partial` property",
      );
      // Don't throw if `readSlice()` failed with `BufferFullError`, instead we
      // just return whatever is available and set the `more` flag.
      if (!(err instanceof BufferFullError)) {
        throw err;
      }
      // Handle the case where "\r\n" straddles the buffer.
      if (
        !this.eof && partial.byteLength > 0 &&
        partial[partial.byteLength - 1] === CR
      ) {
        // Put the '\r' back on buf and drop it from line.
        // Let the next call to ReadLine check for "\r\n".
        assert(this.r > 0, "bufio: tried to rewind past start of buffer");
        this.r--;
        partial = partial.subarray(0, partial.byteLength - 1);
      }
      return {
        line: partial,
        more: !this.eof,
      };
    }
    if (line === null) {
      return null;
    }
    if (line.byteLength === 0) {
      return {
        line,
        more: false,
      };
    }
    if (line[line.byteLength - 1] == LF) {
      let drop = 1;
      if (line.byteLength > 1 && line[line.byteLength - 2] === CR) {
        drop = 2;
      }
      line = line.subarray(0, line.byteLength - drop);
    }
    return {
      line,
      more: false,
    };
  }
  /** `readSlice()` reads until the first occurrence of `delim` in the input,
   * returning a slice pointing at the bytes in the buffer. The bytes stop
   * being valid at the next read.
   *
   * If `readSlice()` encounters an error before finding a delimiter, or the
   * buffer fills without finding a delimiter, it throws an error with a
   * `partial` property that contains the entire buffer.
   *
   * If `readSlice()` encounters the end of the underlying stream and there are
   * any bytes left in the buffer, the rest of the buffer is returned. In other
   * words, EOF is always treated as a delimiter. Once the buffer is empty,
   * it returns `null`.
   *
   * Because the data returned from `readSlice()` will be overwritten by the
   * next I/O operation, most clients should use `readString()` instead.
   */ async readSlice(delim) {
    let s = 0; // search start index
    let slice;
    while (true) {
      // Search buffer.
      let i = this.buf.subarray(this.r + s, this.w).indexOf(delim);
      if (i >= 0) {
        i += s;
        slice = this.buf.subarray(this.r, this.r + i + 1);
        this.r += i + 1;
        break;
      }
      // EOF?
      if (this.eof) {
        if (this.r === this.w) {
          return null;
        }
        slice = this.buf.subarray(this.r, this.w);
        this.r = this.w;
        break;
      }
      // Buffer full?
      if (this.buffered() >= this.buf.byteLength) {
        this.r = this.w;
        // #4521 The internal buffer should not be reused across reads because it causes corruption of data.
        const oldbuf = this.buf;
        const newbuf = this.buf.slice(0);
        this.buf = newbuf;
        throw new BufferFullError(oldbuf);
      }
      s = this.w - this.r; // do not rescan area we scanned before
      // Buffer is not full.
      try {
        await this._fill();
      } catch (err) {
        err.partial = slice;
        throw err;
      }
    }
    // Handle last byte, if any.
    // const i = slice.byteLength - 1;
    // if (i >= 0) {
    //   this.lastByte = slice[i];
    //   this.lastCharSize = -1
    // }
    return slice;
  }
  /** `peek()` returns the next `n` bytes without advancing the reader. The
   * bytes stop being valid at the next read call.
   *
   * When the end of the underlying stream is reached, but there are unread
   * bytes left in the buffer, those bytes are returned. If there are no bytes
   * left in the buffer, it returns `null`.
   *
   * If an error is encountered before `n` bytes are available, `peek()` throws
   * an error with the `partial` property set to a slice of the buffer that
   * contains the bytes that were available before the error occurred.
   */ async peek(n) {
    if (n < 0) {
      throw Error("negative count");
    }
    let avail = this.w - this.r;
    while (avail < n && avail < this.buf.byteLength && !this.eof) {
      try {
        await this._fill();
      } catch (err) {
        err.partial = this.buf.subarray(this.r, this.w);
        throw err;
      }
      avail = this.w - this.r;
    }
    if (avail === 0 && this.eof) {
      return null;
    } else if (avail < n && this.eof) {
      return this.buf.subarray(this.r, this.r + avail);
    } else if (avail < n) {
      throw new BufferFullError(this.buf.subarray(this.r, this.w));
    }
    return this.buf.subarray(this.r, this.r + n);
  }
}
class AbstractBufBase {
  buf;
  usedBufferBytes = 0;
  err = null;
  /** Size returns the size of the underlying buffer in bytes. */ size() {
    return this.buf.byteLength;
  }
  /** Returns how many bytes are unused in the buffer. */ available() {
    return this.buf.byteLength - this.usedBufferBytes;
  }
  /** buffered returns the number of bytes that have been written into the
   * current buffer.
   */ buffered() {
    return this.usedBufferBytes;
  }
}
/** BufWriter implements buffering for an deno.Writer object.
 * If an error occurs writing to a Writer, no more data will be
 * accepted and all subsequent writes, and flush(), will return the error.
 * After all data has been written, the client should call the
 * flush() method to guarantee all data has been forwarded to
 * the underlying deno.Writer.
 */ export class BufWriter extends AbstractBufBase {
  writer;
  /** return new BufWriter unless writer is BufWriter */ static create(
    writer,
    size = DEFAULT_BUF_SIZE,
  ) {
    return writer instanceof BufWriter ? writer : new BufWriter(writer, size);
  }
  constructor(writer, size = DEFAULT_BUF_SIZE) {
    super();
    this.writer = writer;
    if (size <= 0) {
      size = DEFAULT_BUF_SIZE;
    }
    this.buf = new Uint8Array(size);
  }
  /** Discards any unflushed buffered data, clears any error, and
   * resets buffer to write its output to w.
   */ reset(w) {
    this.err = null;
    this.usedBufferBytes = 0;
    this.writer = w;
  }
  /** Flush writes any buffered data to the underlying io.Writer. */ async flush() {
    if (this.err !== null) throw this.err;
    if (this.usedBufferBytes === 0) return;
    try {
      await writeAll(this.writer, this.buf.subarray(0, this.usedBufferBytes));
    } catch (e) {
      this.err = e;
      throw e;
    }
    this.buf = new Uint8Array(this.buf.length);
    this.usedBufferBytes = 0;
  }
  /** Writes the contents of `data` into the buffer.  If the contents won't fully
   * fit into the buffer, those bytes that can are copied into the buffer, the
   * buffer is the flushed to the writer and the remaining bytes are copied into
   * the now empty buffer.
   *
   * @return the number of bytes written to the buffer.
   */ async write(data) {
    if (this.err !== null) throw this.err;
    if (data.length === 0) return 0;
    let totalBytesWritten = 0;
    let numBytesWritten = 0;
    while (data.byteLength > this.available()) {
      if (this.buffered() === 0) {
        // Large write, empty buffer.
        // Write directly from data to avoid copy.
        try {
          numBytesWritten = await this.writer.write(data);
        } catch (e) {
          this.err = e;
          throw e;
        }
      } else {
        numBytesWritten = copy(data, this.buf, this.usedBufferBytes);
        this.usedBufferBytes += numBytesWritten;
        await this.flush();
      }
      totalBytesWritten += numBytesWritten;
      data = data.subarray(numBytesWritten);
    }
    numBytesWritten = copy(data, this.buf, this.usedBufferBytes);
    this.usedBufferBytes += numBytesWritten;
    totalBytesWritten += numBytesWritten;
    return totalBytesWritten;
  }
}
/** BufWriterSync implements buffering for a deno.WriterSync object.
 * If an error occurs writing to a WriterSync, no more data will be
 * accepted and all subsequent writes, and flush(), will return the error.
 * After all data has been written, the client should call the
 * flush() method to guarantee all data has been forwarded to
 * the underlying deno.WriterSync.
 */ export class BufWriterSync extends AbstractBufBase {
  writer;
  /** return new BufWriterSync unless writer is BufWriterSync */ static create(
    writer,
    size = DEFAULT_BUF_SIZE,
  ) {
    return writer instanceof BufWriterSync
      ? writer
      : new BufWriterSync(writer, size);
  }
  constructor(writer, size = DEFAULT_BUF_SIZE) {
    super();
    this.writer = writer;
    if (size <= 0) {
      size = DEFAULT_BUF_SIZE;
    }
    this.buf = new Uint8Array(size);
  }
  /** Discards any unflushed buffered data, clears any error, and
   * resets buffer to write its output to w.
   */ reset(w) {
    this.err = null;
    this.usedBufferBytes = 0;
    this.writer = w;
  }
  /** Flush writes any buffered data to the underlying io.WriterSync. */ flush() {
    if (this.err !== null) throw this.err;
    if (this.usedBufferBytes === 0) return;
    try {
      writeAllSync(this.writer, this.buf.subarray(0, this.usedBufferBytes));
    } catch (e) {
      this.err = e;
      throw e;
    }
    this.buf = new Uint8Array(this.buf.length);
    this.usedBufferBytes = 0;
  }
  /** Writes the contents of `data` into the buffer.  If the contents won't fully
   * fit into the buffer, those bytes that can are copied into the buffer, the
   * buffer is the flushed to the writer and the remaining bytes are copied into
   * the now empty buffer.
   *
   * @return the number of bytes written to the buffer.
   */ writeSync(data) {
    if (this.err !== null) throw this.err;
    if (data.length === 0) return 0;
    let totalBytesWritten = 0;
    let numBytesWritten = 0;
    while (data.byteLength > this.available()) {
      if (this.buffered() === 0) {
        // Large write, empty buffer.
        // Write directly from data to avoid copy.
        try {
          numBytesWritten = this.writer.writeSync(data);
        } catch (e) {
          this.err = e;
          throw e;
        }
      } else {
        numBytesWritten = copy(data, this.buf, this.usedBufferBytes);
        this.usedBufferBytes += numBytesWritten;
        this.flush();
      }
      totalBytesWritten += numBytesWritten;
      data = data.subarray(numBytesWritten);
    }
    numBytesWritten = copy(data, this.buf, this.usedBufferBytes);
    this.usedBufferBytes += numBytesWritten;
    totalBytesWritten += numBytesWritten;
    return totalBytesWritten;
  }
}
/** Generate longest proper prefix which is also suffix array. */ function createLPS(
  pat,
) {
  const lps = new Uint8Array(pat.length);
  lps[0] = 0;
  let prefixEnd = 0;
  let i = 1;
  while (i < lps.length) {
    if (pat[i] == pat[prefixEnd]) {
      prefixEnd++;
      lps[i] = prefixEnd;
      i++;
    } else if (prefixEnd === 0) {
      lps[i] = 0;
      i++;
    } else {
      prefixEnd = pat[prefixEnd - 1];
    }
  }
  return lps;
}
/** Read delimited bytes from a Reader. */ export async function* readDelim(
  reader,
  delim,
) {
  // Avoid unicode problems
  const delimLen = delim.length;
  const delimLPS = createLPS(delim);
  let inputBuffer = new Buffer();
  const inspectArr = new Uint8Array(Math.max(1024, delimLen + 1));
  // Modified KMP
  let inspectIndex = 0;
  let matchIndex = 0;
  while (true) {
    const result = await reader.read(inspectArr);
    if (result === null) {
      // Yield last chunk.
      yield inputBuffer.bytes();
      return;
    }
    if (result < 0) {
      // Discard all remaining and silently fail.
      return;
    }
    const sliceRead = inspectArr.subarray(0, result);
    await writeAll(inputBuffer, sliceRead);
    let sliceToProcess = inputBuffer.bytes();
    while (inspectIndex < sliceToProcess.length) {
      if (sliceToProcess[inspectIndex] === delim[matchIndex]) {
        inspectIndex++;
        matchIndex++;
        if (matchIndex === delimLen) {
          // Full match
          const matchEnd = inspectIndex - delimLen;
          const readyBytes = sliceToProcess.subarray(0, matchEnd);
          // Copy
          const pendingBytes = sliceToProcess.slice(inspectIndex);
          yield readyBytes;
          // Reset match, different from KMP.
          sliceToProcess = pendingBytes;
          inspectIndex = 0;
          matchIndex = 0;
        }
      } else {
        if (matchIndex === 0) {
          inspectIndex++;
        } else {
          matchIndex = delimLPS[matchIndex - 1];
        }
      }
    }
    // Keep inspectIndex and matchIndex.
    inputBuffer = new Buffer(sliceToProcess);
  }
}
/** Read delimited strings from a Reader. */ export async function* readStringDelim(
  reader,
  delim,
) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  for await (const chunk of readDelim(reader, encoder.encode(delim))) {
    yield decoder.decode(chunk);
  }
}
/** Read strings line-by-line from a Reader. */ export async function* readLines(
  reader,
) {
  for await (let chunk of readStringDelim(reader, "\n")) {
    // Finding a CR at the end of the line is evidence of a
    // "\r\n" at the end of the line. The "\r" part should be
    // removed too.
    if (chunk.endsWith("\r")) {
      chunk = chunk.slice(0, -1);
    }
    yield chunk;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45NS4wL2lvL2J1ZmlvLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gQmFzZWQgb24gaHR0cHM6Ly9naXRodWIuY29tL2dvbGFuZy9nby9ibG9iLzg5MTY4Mi9zcmMvYnVmaW8vYnVmaW8uZ29cbi8vIENvcHlyaWdodCAyMDA5IFRoZSBHbyBBdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYSBCU0Qtc3R5bGVcbi8vIGxpY2Vuc2UgdGhhdCBjYW4gYmUgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZS5cblxudHlwZSBSZWFkZXIgPSBEZW5vLlJlYWRlcjtcbnR5cGUgV3JpdGVyID0gRGVuby5Xcml0ZXI7XG50eXBlIFdyaXRlclN5bmMgPSBEZW5vLldyaXRlclN5bmM7XG5pbXBvcnQgeyBjb3B5IH0gZnJvbSBcIi4uL2J5dGVzL21vZC50c1wiO1xuaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcIi4uL191dGlsL2Fzc2VydC50c1wiO1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcIi4vYnVmZmVyLnRzXCI7XG5pbXBvcnQgeyB3cml0ZUFsbCwgd3JpdGVBbGxTeW5jIH0gZnJvbSBcIi4vdXRpbC50c1wiO1xuXG5jb25zdCBERUZBVUxUX0JVRl9TSVpFID0gNDA5NjtcbmNvbnN0IE1JTl9CVUZfU0laRSA9IDE2O1xuY29uc3QgTUFYX0NPTlNFQ1VUSVZFX0VNUFRZX1JFQURTID0gMTAwO1xuY29uc3QgQ1IgPSBcIlxcclwiLmNoYXJDb2RlQXQoMCk7XG5jb25zdCBMRiA9IFwiXFxuXCIuY2hhckNvZGVBdCgwKTtcblxuZXhwb3J0IGNsYXNzIEJ1ZmZlckZ1bGxFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgbmFtZSA9IFwiQnVmZmVyRnVsbEVycm9yXCI7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBwYXJ0aWFsOiBVaW50OEFycmF5KSB7XG4gICAgc3VwZXIoXCJCdWZmZXIgZnVsbFwiKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUGFydGlhbFJlYWRFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgbmFtZSA9IFwiUGFydGlhbFJlYWRFcnJvclwiO1xuICBwYXJ0aWFsPzogVWludDhBcnJheTtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFbmNvdW50ZXJlZCBVbmV4cGVjdGVkRW9mLCBkYXRhIG9ubHkgcGFydGlhbGx5IHJlYWRcIik7XG4gIH1cbn1cblxuLyoqIFJlc3VsdCB0eXBlIHJldHVybmVkIGJ5IG9mIEJ1ZlJlYWRlci5yZWFkTGluZSgpLiAqL1xuZXhwb3J0IGludGVyZmFjZSBSZWFkTGluZVJlc3VsdCB7XG4gIGxpbmU6IFVpbnQ4QXJyYXk7XG4gIG1vcmU6IGJvb2xlYW47XG59XG5cbi8qKiBCdWZSZWFkZXIgaW1wbGVtZW50cyBidWZmZXJpbmcgZm9yIGEgUmVhZGVyIG9iamVjdC4gKi9cbmV4cG9ydCBjbGFzcyBCdWZSZWFkZXIgaW1wbGVtZW50cyBSZWFkZXIge1xuICBwcml2YXRlIGJ1ZiE6IFVpbnQ4QXJyYXk7XG4gIHByaXZhdGUgcmQhOiBSZWFkZXI7IC8vIFJlYWRlciBwcm92aWRlZCBieSBjYWxsZXIuXG4gIHByaXZhdGUgciA9IDA7IC8vIGJ1ZiByZWFkIHBvc2l0aW9uLlxuICBwcml2YXRlIHcgPSAwOyAvLyBidWYgd3JpdGUgcG9zaXRpb24uXG4gIHByaXZhdGUgZW9mID0gZmFsc2U7XG4gIC8vIHByaXZhdGUgbGFzdEJ5dGU6IG51bWJlcjtcbiAgLy8gcHJpdmF0ZSBsYXN0Q2hhclNpemU6IG51bWJlcjtcblxuICAvKiogcmV0dXJuIG5ldyBCdWZSZWFkZXIgdW5sZXNzIHIgaXMgQnVmUmVhZGVyICovXG4gIHN0YXRpYyBjcmVhdGUocjogUmVhZGVyLCBzaXplOiBudW1iZXIgPSBERUZBVUxUX0JVRl9TSVpFKTogQnVmUmVhZGVyIHtcbiAgICByZXR1cm4gciBpbnN0YW5jZW9mIEJ1ZlJlYWRlciA/IHIgOiBuZXcgQnVmUmVhZGVyKHIsIHNpemUpO1xuICB9XG5cbiAgY29uc3RydWN0b3IocmQ6IFJlYWRlciwgc2l6ZTogbnVtYmVyID0gREVGQVVMVF9CVUZfU0laRSkge1xuICAgIGlmIChzaXplIDwgTUlOX0JVRl9TSVpFKSB7XG4gICAgICBzaXplID0gTUlOX0JVRl9TSVpFO1xuICAgIH1cbiAgICB0aGlzLl9yZXNldChuZXcgVWludDhBcnJheShzaXplKSwgcmQpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdGhlIHNpemUgb2YgdGhlIHVuZGVybHlpbmcgYnVmZmVyIGluIGJ5dGVzLiAqL1xuICBzaXplKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuYnVmLmJ5dGVMZW5ndGg7XG4gIH1cblxuICBidWZmZXJlZCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLncgLSB0aGlzLnI7XG4gIH1cblxuICAvLyBSZWFkcyBhIG5ldyBjaHVuayBpbnRvIHRoZSBidWZmZXIuXG4gIHByaXZhdGUgYXN5bmMgX2ZpbGwoKSB7XG4gICAgLy8gU2xpZGUgZXhpc3RpbmcgZGF0YSB0byBiZWdpbm5pbmcuXG4gICAgaWYgKHRoaXMuciA+IDApIHtcbiAgICAgIHRoaXMuYnVmLmNvcHlXaXRoaW4oMCwgdGhpcy5yLCB0aGlzLncpO1xuICAgICAgdGhpcy53IC09IHRoaXMucjtcbiAgICAgIHRoaXMuciA9IDA7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMudyA+PSB0aGlzLmJ1Zi5ieXRlTGVuZ3RoKSB7XG4gICAgICB0aHJvdyBFcnJvcihcImJ1ZmlvOiB0cmllZCB0byBmaWxsIGZ1bGwgYnVmZmVyXCIpO1xuICAgIH1cblxuICAgIC8vIFJlYWQgbmV3IGRhdGE6IHRyeSBhIGxpbWl0ZWQgbnVtYmVyIG9mIHRpbWVzLlxuICAgIGZvciAobGV0IGkgPSBNQVhfQ09OU0VDVVRJVkVfRU1QVFlfUkVBRFM7IGkgPiAwOyBpLS0pIHtcbiAgICAgIGNvbnN0IHJyID0gYXdhaXQgdGhpcy5yZC5yZWFkKHRoaXMuYnVmLnN1YmFycmF5KHRoaXMudykpO1xuICAgICAgaWYgKHJyID09PSBudWxsKSB7XG4gICAgICAgIHRoaXMuZW9mID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgYXNzZXJ0KHJyID49IDAsIFwibmVnYXRpdmUgcmVhZFwiKTtcbiAgICAgIHRoaXMudyArPSBycjtcbiAgICAgIGlmIChyciA+IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBObyBwcm9ncmVzcyBhZnRlciAke01BWF9DT05TRUNVVElWRV9FTVBUWV9SRUFEU30gcmVhZCgpIGNhbGxzYCxcbiAgICApO1xuICB9XG5cbiAgLyoqIERpc2NhcmRzIGFueSBidWZmZXJlZCBkYXRhLCByZXNldHMgYWxsIHN0YXRlLCBhbmQgc3dpdGNoZXNcbiAgICogdGhlIGJ1ZmZlcmVkIHJlYWRlciB0byByZWFkIGZyb20gci5cbiAgICovXG4gIHJlc2V0KHI6IFJlYWRlcik6IHZvaWQge1xuICAgIHRoaXMuX3Jlc2V0KHRoaXMuYnVmLCByKTtcbiAgfVxuXG4gIHByaXZhdGUgX3Jlc2V0KGJ1ZjogVWludDhBcnJheSwgcmQ6IFJlYWRlcik6IHZvaWQge1xuICAgIHRoaXMuYnVmID0gYnVmO1xuICAgIHRoaXMucmQgPSByZDtcbiAgICB0aGlzLmVvZiA9IGZhbHNlO1xuICAgIC8vIHRoaXMubGFzdEJ5dGUgPSAtMTtcbiAgICAvLyB0aGlzLmxhc3RDaGFyU2l6ZSA9IC0xO1xuICB9XG5cbiAgLyoqIHJlYWRzIGRhdGEgaW50byBwLlxuICAgKiBJdCByZXR1cm5zIHRoZSBudW1iZXIgb2YgYnl0ZXMgcmVhZCBpbnRvIHAuXG4gICAqIFRoZSBieXRlcyBhcmUgdGFrZW4gZnJvbSBhdCBtb3N0IG9uZSBSZWFkIG9uIHRoZSB1bmRlcmx5aW5nIFJlYWRlcixcbiAgICogaGVuY2UgbiBtYXkgYmUgbGVzcyB0aGFuIGxlbihwKS5cbiAgICogVG8gcmVhZCBleGFjdGx5IGxlbihwKSBieXRlcywgdXNlIGlvLlJlYWRGdWxsKGIsIHApLlxuICAgKi9cbiAgYXN5bmMgcmVhZChwOiBVaW50OEFycmF5KTogUHJvbWlzZTxudW1iZXIgfCBudWxsPiB7XG4gICAgbGV0IHJyOiBudW1iZXIgfCBudWxsID0gcC5ieXRlTGVuZ3RoO1xuICAgIGlmIChwLmJ5dGVMZW5ndGggPT09IDApIHJldHVybiBycjtcblxuICAgIGlmICh0aGlzLnIgPT09IHRoaXMudykge1xuICAgICAgaWYgKHAuYnl0ZUxlbmd0aCA+PSB0aGlzLmJ1Zi5ieXRlTGVuZ3RoKSB7XG4gICAgICAgIC8vIExhcmdlIHJlYWQsIGVtcHR5IGJ1ZmZlci5cbiAgICAgICAgLy8gUmVhZCBkaXJlY3RseSBpbnRvIHAgdG8gYXZvaWQgY29weS5cbiAgICAgICAgY29uc3QgcnIgPSBhd2FpdCB0aGlzLnJkLnJlYWQocCk7XG4gICAgICAgIGNvbnN0IG5yZWFkID0gcnIgPz8gMDtcbiAgICAgICAgYXNzZXJ0KG5yZWFkID49IDAsIFwibmVnYXRpdmUgcmVhZFwiKTtcbiAgICAgICAgLy8gaWYgKHJyLm5yZWFkID4gMCkge1xuICAgICAgICAvLyAgIHRoaXMubGFzdEJ5dGUgPSBwW3JyLm5yZWFkIC0gMV07XG4gICAgICAgIC8vICAgdGhpcy5sYXN0Q2hhclNpemUgPSAtMTtcbiAgICAgICAgLy8gfVxuICAgICAgICByZXR1cm4gcnI7XG4gICAgICB9XG5cbiAgICAgIC8vIE9uZSByZWFkLlxuICAgICAgLy8gRG8gbm90IHVzZSB0aGlzLmZpbGwsIHdoaWNoIHdpbGwgbG9vcC5cbiAgICAgIHRoaXMuciA9IDA7XG4gICAgICB0aGlzLncgPSAwO1xuICAgICAgcnIgPSBhd2FpdCB0aGlzLnJkLnJlYWQodGhpcy5idWYpO1xuICAgICAgaWYgKHJyID09PSAwIHx8IHJyID09PSBudWxsKSByZXR1cm4gcnI7XG4gICAgICBhc3NlcnQocnIgPj0gMCwgXCJuZWdhdGl2ZSByZWFkXCIpO1xuICAgICAgdGhpcy53ICs9IHJyO1xuICAgIH1cblxuICAgIC8vIGNvcHkgYXMgbXVjaCBhcyB3ZSBjYW5cbiAgICBjb25zdCBjb3BpZWQgPSBjb3B5KHRoaXMuYnVmLnN1YmFycmF5KHRoaXMuciwgdGhpcy53KSwgcCwgMCk7XG4gICAgdGhpcy5yICs9IGNvcGllZDtcbiAgICAvLyB0aGlzLmxhc3RCeXRlID0gdGhpcy5idWZbdGhpcy5yIC0gMV07XG4gICAgLy8gdGhpcy5sYXN0Q2hhclNpemUgPSAtMTtcbiAgICByZXR1cm4gY29waWVkO1xuICB9XG5cbiAgLyoqIHJlYWRzIGV4YWN0bHkgYHAubGVuZ3RoYCBieXRlcyBpbnRvIGBwYC5cbiAgICpcbiAgICogSWYgc3VjY2Vzc2Z1bCwgYHBgIGlzIHJldHVybmVkLlxuICAgKlxuICAgKiBJZiB0aGUgZW5kIG9mIHRoZSB1bmRlcmx5aW5nIHN0cmVhbSBoYXMgYmVlbiByZWFjaGVkLCBhbmQgdGhlcmUgYXJlIG5vIG1vcmVcbiAgICogYnl0ZXMgYXZhaWxhYmxlIGluIHRoZSBidWZmZXIsIGByZWFkRnVsbCgpYCByZXR1cm5zIGBudWxsYCBpbnN0ZWFkLlxuICAgKlxuICAgKiBBbiBlcnJvciBpcyB0aHJvd24gaWYgc29tZSBieXRlcyBjb3VsZCBiZSByZWFkLCBidXQgbm90IGVub3VnaCB0byBmaWxsIGBwYFxuICAgKiBlbnRpcmVseSBiZWZvcmUgdGhlIHVuZGVybHlpbmcgc3RyZWFtIHJlcG9ydGVkIGFuIGVycm9yIG9yIEVPRi4gQW55IGVycm9yXG4gICAqIHRocm93biB3aWxsIGhhdmUgYSBgcGFydGlhbGAgcHJvcGVydHkgdGhhdCBpbmRpY2F0ZXMgdGhlIHNsaWNlIG9mIHRoZVxuICAgKiBidWZmZXIgdGhhdCBoYXMgYmVlbiBzdWNjZXNzZnVsbHkgZmlsbGVkIHdpdGggZGF0YS5cbiAgICpcbiAgICogUG9ydGVkIGZyb20gaHR0cHM6Ly9nb2xhbmcub3JnL3BrZy9pby8jUmVhZEZ1bGxcbiAgICovXG4gIGFzeW5jIHJlYWRGdWxsKHA6IFVpbnQ4QXJyYXkpOiBQcm9taXNlPFVpbnQ4QXJyYXkgfCBudWxsPiB7XG4gICAgbGV0IGJ5dGVzUmVhZCA9IDA7XG4gICAgd2hpbGUgKGJ5dGVzUmVhZCA8IHAubGVuZ3RoKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByciA9IGF3YWl0IHRoaXMucmVhZChwLnN1YmFycmF5KGJ5dGVzUmVhZCkpO1xuICAgICAgICBpZiAocnIgPT09IG51bGwpIHtcbiAgICAgICAgICBpZiAoYnl0ZXNSZWFkID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFBhcnRpYWxSZWFkRXJyb3IoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnl0ZXNSZWFkICs9IHJyO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGVyci5wYXJ0aWFsID0gcC5zdWJhcnJheSgwLCBieXRlc1JlYWQpO1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdGhlIG5leHQgYnl0ZSBbMCwgMjU1XSBvciBgbnVsbGAuICovXG4gIGFzeW5jIHJlYWRCeXRlKCk6IFByb21pc2U8bnVtYmVyIHwgbnVsbD4ge1xuICAgIHdoaWxlICh0aGlzLnIgPT09IHRoaXMudykge1xuICAgICAgaWYgKHRoaXMuZW9mKSByZXR1cm4gbnVsbDtcbiAgICAgIGF3YWl0IHRoaXMuX2ZpbGwoKTsgLy8gYnVmZmVyIGlzIGVtcHR5LlxuICAgIH1cbiAgICBjb25zdCBjID0gdGhpcy5idWZbdGhpcy5yXTtcbiAgICB0aGlzLnIrKztcbiAgICAvLyB0aGlzLmxhc3RCeXRlID0gYztcbiAgICByZXR1cm4gYztcbiAgfVxuXG4gIC8qKiByZWFkU3RyaW5nKCkgcmVhZHMgdW50aWwgdGhlIGZpcnN0IG9jY3VycmVuY2Ugb2YgZGVsaW0gaW4gdGhlIGlucHV0LFxuICAgKiByZXR1cm5pbmcgYSBzdHJpbmcgY29udGFpbmluZyB0aGUgZGF0YSB1cCB0byBhbmQgaW5jbHVkaW5nIHRoZSBkZWxpbWl0ZXIuXG4gICAqIElmIFJlYWRTdHJpbmcgZW5jb3VudGVycyBhbiBlcnJvciBiZWZvcmUgZmluZGluZyBhIGRlbGltaXRlcixcbiAgICogaXQgcmV0dXJucyB0aGUgZGF0YSByZWFkIGJlZm9yZSB0aGUgZXJyb3IgYW5kIHRoZSBlcnJvciBpdHNlbGZcbiAgICogKG9mdGVuIGBudWxsYCkuXG4gICAqIFJlYWRTdHJpbmcgcmV0dXJucyBlcnIgIT0gbmlsIGlmIGFuZCBvbmx5IGlmIHRoZSByZXR1cm5lZCBkYXRhIGRvZXMgbm90IGVuZFxuICAgKiBpbiBkZWxpbS5cbiAgICogRm9yIHNpbXBsZSB1c2VzLCBhIFNjYW5uZXIgbWF5IGJlIG1vcmUgY29udmVuaWVudC5cbiAgICovXG4gIGFzeW5jIHJlYWRTdHJpbmcoZGVsaW06IHN0cmluZyk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICAgIGlmIChkZWxpbS5sZW5ndGggIT09IDEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkRlbGltaXRlciBzaG91bGQgYmUgYSBzaW5nbGUgY2hhcmFjdGVyXCIpO1xuICAgIH1cbiAgICBjb25zdCBidWZmZXIgPSBhd2FpdCB0aGlzLnJlYWRTbGljZShkZWxpbS5jaGFyQ29kZUF0KDApKTtcbiAgICBpZiAoYnVmZmVyID09PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4gbmV3IFRleHREZWNvZGVyKCkuZGVjb2RlKGJ1ZmZlcik7XG4gIH1cblxuICAvKiogYHJlYWRMaW5lKClgIGlzIGEgbG93LWxldmVsIGxpbmUtcmVhZGluZyBwcmltaXRpdmUuIE1vc3QgY2FsbGVycyBzaG91bGRcbiAgICogdXNlIGByZWFkU3RyaW5nKCdcXG4nKWAgaW5zdGVhZCBvciB1c2UgYSBTY2FubmVyLlxuICAgKlxuICAgKiBgcmVhZExpbmUoKWAgdHJpZXMgdG8gcmV0dXJuIGEgc2luZ2xlIGxpbmUsIG5vdCBpbmNsdWRpbmcgdGhlIGVuZC1vZi1saW5lXG4gICAqIGJ5dGVzLiBJZiB0aGUgbGluZSB3YXMgdG9vIGxvbmcgZm9yIHRoZSBidWZmZXIgdGhlbiBgbW9yZWAgaXMgc2V0IGFuZCB0aGVcbiAgICogYmVnaW5uaW5nIG9mIHRoZSBsaW5lIGlzIHJldHVybmVkLiBUaGUgcmVzdCBvZiB0aGUgbGluZSB3aWxsIGJlIHJldHVybmVkXG4gICAqIGZyb20gZnV0dXJlIGNhbGxzLiBgbW9yZWAgd2lsbCBiZSBmYWxzZSB3aGVuIHJldHVybmluZyB0aGUgbGFzdCBmcmFnbWVudFxuICAgKiBvZiB0aGUgbGluZS4gVGhlIHJldHVybmVkIGJ1ZmZlciBpcyBvbmx5IHZhbGlkIHVudGlsIHRoZSBuZXh0IGNhbGwgdG9cbiAgICogYHJlYWRMaW5lKClgLlxuICAgKlxuICAgKiBUaGUgdGV4dCByZXR1cm5lZCBmcm9tIFJlYWRMaW5lIGRvZXMgbm90IGluY2x1ZGUgdGhlIGxpbmUgZW5kIChcIlxcclxcblwiIG9yXG4gICAqIFwiXFxuXCIpLlxuICAgKlxuICAgKiBXaGVuIHRoZSBlbmQgb2YgdGhlIHVuZGVybHlpbmcgc3RyZWFtIGlzIHJlYWNoZWQsIHRoZSBmaW5hbCBieXRlcyBpbiB0aGVcbiAgICogc3RyZWFtIGFyZSByZXR1cm5lZC4gTm8gaW5kaWNhdGlvbiBvciBlcnJvciBpcyBnaXZlbiBpZiB0aGUgaW5wdXQgZW5kc1xuICAgKiB3aXRob3V0IGEgZmluYWwgbGluZSBlbmQuIFdoZW4gdGhlcmUgYXJlIG5vIG1vcmUgdHJhaWxpbmcgYnl0ZXMgdG8gcmVhZCxcbiAgICogYHJlYWRMaW5lKClgIHJldHVybnMgYG51bGxgLlxuICAgKlxuICAgKiBDYWxsaW5nIGB1bnJlYWRCeXRlKClgIGFmdGVyIGByZWFkTGluZSgpYCB3aWxsIGFsd2F5cyB1bnJlYWQgdGhlIGxhc3QgYnl0ZVxuICAgKiByZWFkIChwb3NzaWJseSBhIGNoYXJhY3RlciBiZWxvbmdpbmcgdG8gdGhlIGxpbmUgZW5kKSBldmVuIGlmIHRoYXQgYnl0ZSBpc1xuICAgKiBub3QgcGFydCBvZiB0aGUgbGluZSByZXR1cm5lZCBieSBgcmVhZExpbmUoKWAuXG4gICAqL1xuICBhc3luYyByZWFkTGluZSgpOiBQcm9taXNlPFJlYWRMaW5lUmVzdWx0IHwgbnVsbD4ge1xuICAgIGxldCBsaW5lOiBVaW50OEFycmF5IHwgbnVsbDtcblxuICAgIHRyeSB7XG4gICAgICBsaW5lID0gYXdhaXQgdGhpcy5yZWFkU2xpY2UoTEYpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgbGV0IHsgcGFydGlhbCB9ID0gZXJyO1xuICAgICAgYXNzZXJ0KFxuICAgICAgICBwYXJ0aWFsIGluc3RhbmNlb2YgVWludDhBcnJheSxcbiAgICAgICAgXCJidWZpbzogY2F1Z2h0IGVycm9yIGZyb20gYHJlYWRTbGljZSgpYCB3aXRob3V0IGBwYXJ0aWFsYCBwcm9wZXJ0eVwiLFxuICAgICAgKTtcblxuICAgICAgLy8gRG9uJ3QgdGhyb3cgaWYgYHJlYWRTbGljZSgpYCBmYWlsZWQgd2l0aCBgQnVmZmVyRnVsbEVycm9yYCwgaW5zdGVhZCB3ZVxuICAgICAgLy8ganVzdCByZXR1cm4gd2hhdGV2ZXIgaXMgYXZhaWxhYmxlIGFuZCBzZXQgdGhlIGBtb3JlYCBmbGFnLlxuICAgICAgaWYgKCEoZXJyIGluc3RhbmNlb2YgQnVmZmVyRnVsbEVycm9yKSkge1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG5cbiAgICAgIC8vIEhhbmRsZSB0aGUgY2FzZSB3aGVyZSBcIlxcclxcblwiIHN0cmFkZGxlcyB0aGUgYnVmZmVyLlxuICAgICAgaWYgKFxuICAgICAgICAhdGhpcy5lb2YgJiZcbiAgICAgICAgcGFydGlhbC5ieXRlTGVuZ3RoID4gMCAmJlxuICAgICAgICBwYXJ0aWFsW3BhcnRpYWwuYnl0ZUxlbmd0aCAtIDFdID09PSBDUlxuICAgICAgKSB7XG4gICAgICAgIC8vIFB1dCB0aGUgJ1xccicgYmFjayBvbiBidWYgYW5kIGRyb3AgaXQgZnJvbSBsaW5lLlxuICAgICAgICAvLyBMZXQgdGhlIG5leHQgY2FsbCB0byBSZWFkTGluZSBjaGVjayBmb3IgXCJcXHJcXG5cIi5cbiAgICAgICAgYXNzZXJ0KHRoaXMuciA+IDAsIFwiYnVmaW86IHRyaWVkIHRvIHJld2luZCBwYXN0IHN0YXJ0IG9mIGJ1ZmZlclwiKTtcbiAgICAgICAgdGhpcy5yLS07XG4gICAgICAgIHBhcnRpYWwgPSBwYXJ0aWFsLnN1YmFycmF5KDAsIHBhcnRpYWwuYnl0ZUxlbmd0aCAtIDEpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4geyBsaW5lOiBwYXJ0aWFsLCBtb3JlOiAhdGhpcy5lb2YgfTtcbiAgICB9XG5cbiAgICBpZiAobGluZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuYnl0ZUxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHsgbGluZSwgbW9yZTogZmFsc2UgfTtcbiAgICB9XG5cbiAgICBpZiAobGluZVtsaW5lLmJ5dGVMZW5ndGggLSAxXSA9PSBMRikge1xuICAgICAgbGV0IGRyb3AgPSAxO1xuICAgICAgaWYgKGxpbmUuYnl0ZUxlbmd0aCA+IDEgJiYgbGluZVtsaW5lLmJ5dGVMZW5ndGggLSAyXSA9PT0gQ1IpIHtcbiAgICAgICAgZHJvcCA9IDI7XG4gICAgICB9XG4gICAgICBsaW5lID0gbGluZS5zdWJhcnJheSgwLCBsaW5lLmJ5dGVMZW5ndGggLSBkcm9wKTtcbiAgICB9XG4gICAgcmV0dXJuIHsgbGluZSwgbW9yZTogZmFsc2UgfTtcbiAgfVxuXG4gIC8qKiBgcmVhZFNsaWNlKClgIHJlYWRzIHVudGlsIHRoZSBmaXJzdCBvY2N1cnJlbmNlIG9mIGBkZWxpbWAgaW4gdGhlIGlucHV0LFxuICAgKiByZXR1cm5pbmcgYSBzbGljZSBwb2ludGluZyBhdCB0aGUgYnl0ZXMgaW4gdGhlIGJ1ZmZlci4gVGhlIGJ5dGVzIHN0b3BcbiAgICogYmVpbmcgdmFsaWQgYXQgdGhlIG5leHQgcmVhZC5cbiAgICpcbiAgICogSWYgYHJlYWRTbGljZSgpYCBlbmNvdW50ZXJzIGFuIGVycm9yIGJlZm9yZSBmaW5kaW5nIGEgZGVsaW1pdGVyLCBvciB0aGVcbiAgICogYnVmZmVyIGZpbGxzIHdpdGhvdXQgZmluZGluZyBhIGRlbGltaXRlciwgaXQgdGhyb3dzIGFuIGVycm9yIHdpdGggYVxuICAgKiBgcGFydGlhbGAgcHJvcGVydHkgdGhhdCBjb250YWlucyB0aGUgZW50aXJlIGJ1ZmZlci5cbiAgICpcbiAgICogSWYgYHJlYWRTbGljZSgpYCBlbmNvdW50ZXJzIHRoZSBlbmQgb2YgdGhlIHVuZGVybHlpbmcgc3RyZWFtIGFuZCB0aGVyZSBhcmVcbiAgICogYW55IGJ5dGVzIGxlZnQgaW4gdGhlIGJ1ZmZlciwgdGhlIHJlc3Qgb2YgdGhlIGJ1ZmZlciBpcyByZXR1cm5lZC4gSW4gb3RoZXJcbiAgICogd29yZHMsIEVPRiBpcyBhbHdheXMgdHJlYXRlZCBhcyBhIGRlbGltaXRlci4gT25jZSB0aGUgYnVmZmVyIGlzIGVtcHR5LFxuICAgKiBpdCByZXR1cm5zIGBudWxsYC5cbiAgICpcbiAgICogQmVjYXVzZSB0aGUgZGF0YSByZXR1cm5lZCBmcm9tIGByZWFkU2xpY2UoKWAgd2lsbCBiZSBvdmVyd3JpdHRlbiBieSB0aGVcbiAgICogbmV4dCBJL08gb3BlcmF0aW9uLCBtb3N0IGNsaWVudHMgc2hvdWxkIHVzZSBgcmVhZFN0cmluZygpYCBpbnN0ZWFkLlxuICAgKi9cbiAgYXN5bmMgcmVhZFNsaWNlKGRlbGltOiBudW1iZXIpOiBQcm9taXNlPFVpbnQ4QXJyYXkgfCBudWxsPiB7XG4gICAgbGV0IHMgPSAwOyAvLyBzZWFyY2ggc3RhcnQgaW5kZXhcbiAgICBsZXQgc2xpY2U6IFVpbnQ4QXJyYXkgfCB1bmRlZmluZWQ7XG5cbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgLy8gU2VhcmNoIGJ1ZmZlci5cbiAgICAgIGxldCBpID0gdGhpcy5idWYuc3ViYXJyYXkodGhpcy5yICsgcywgdGhpcy53KS5pbmRleE9mKGRlbGltKTtcbiAgICAgIGlmIChpID49IDApIHtcbiAgICAgICAgaSArPSBzO1xuICAgICAgICBzbGljZSA9IHRoaXMuYnVmLnN1YmFycmF5KHRoaXMuciwgdGhpcy5yICsgaSArIDEpO1xuICAgICAgICB0aGlzLnIgKz0gaSArIDE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBFT0Y/XG4gICAgICBpZiAodGhpcy5lb2YpIHtcbiAgICAgICAgaWYgKHRoaXMuciA9PT0gdGhpcy53KSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgc2xpY2UgPSB0aGlzLmJ1Zi5zdWJhcnJheSh0aGlzLnIsIHRoaXMudyk7XG4gICAgICAgIHRoaXMuciA9IHRoaXMudztcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIEJ1ZmZlciBmdWxsP1xuICAgICAgaWYgKHRoaXMuYnVmZmVyZWQoKSA+PSB0aGlzLmJ1Zi5ieXRlTGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuciA9IHRoaXMudztcbiAgICAgICAgLy8gIzQ1MjEgVGhlIGludGVybmFsIGJ1ZmZlciBzaG91bGQgbm90IGJlIHJldXNlZCBhY3Jvc3MgcmVhZHMgYmVjYXVzZSBpdCBjYXVzZXMgY29ycnVwdGlvbiBvZiBkYXRhLlxuICAgICAgICBjb25zdCBvbGRidWYgPSB0aGlzLmJ1ZjtcbiAgICAgICAgY29uc3QgbmV3YnVmID0gdGhpcy5idWYuc2xpY2UoMCk7XG4gICAgICAgIHRoaXMuYnVmID0gbmV3YnVmO1xuICAgICAgICB0aHJvdyBuZXcgQnVmZmVyRnVsbEVycm9yKG9sZGJ1Zik7XG4gICAgICB9XG5cbiAgICAgIHMgPSB0aGlzLncgLSB0aGlzLnI7IC8vIGRvIG5vdCByZXNjYW4gYXJlYSB3ZSBzY2FubmVkIGJlZm9yZVxuXG4gICAgICAvLyBCdWZmZXIgaXMgbm90IGZ1bGwuXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCB0aGlzLl9maWxsKCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgZXJyLnBhcnRpYWwgPSBzbGljZTtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEhhbmRsZSBsYXN0IGJ5dGUsIGlmIGFueS5cbiAgICAvLyBjb25zdCBpID0gc2xpY2UuYnl0ZUxlbmd0aCAtIDE7XG4gICAgLy8gaWYgKGkgPj0gMCkge1xuICAgIC8vICAgdGhpcy5sYXN0Qnl0ZSA9IHNsaWNlW2ldO1xuICAgIC8vICAgdGhpcy5sYXN0Q2hhclNpemUgPSAtMVxuICAgIC8vIH1cblxuICAgIHJldHVybiBzbGljZTtcbiAgfVxuXG4gIC8qKiBgcGVlaygpYCByZXR1cm5zIHRoZSBuZXh0IGBuYCBieXRlcyB3aXRob3V0IGFkdmFuY2luZyB0aGUgcmVhZGVyLiBUaGVcbiAgICogYnl0ZXMgc3RvcCBiZWluZyB2YWxpZCBhdCB0aGUgbmV4dCByZWFkIGNhbGwuXG4gICAqXG4gICAqIFdoZW4gdGhlIGVuZCBvZiB0aGUgdW5kZXJseWluZyBzdHJlYW0gaXMgcmVhY2hlZCwgYnV0IHRoZXJlIGFyZSB1bnJlYWRcbiAgICogYnl0ZXMgbGVmdCBpbiB0aGUgYnVmZmVyLCB0aG9zZSBieXRlcyBhcmUgcmV0dXJuZWQuIElmIHRoZXJlIGFyZSBubyBieXRlc1xuICAgKiBsZWZ0IGluIHRoZSBidWZmZXIsIGl0IHJldHVybnMgYG51bGxgLlxuICAgKlxuICAgKiBJZiBhbiBlcnJvciBpcyBlbmNvdW50ZXJlZCBiZWZvcmUgYG5gIGJ5dGVzIGFyZSBhdmFpbGFibGUsIGBwZWVrKClgIHRocm93c1xuICAgKiBhbiBlcnJvciB3aXRoIHRoZSBgcGFydGlhbGAgcHJvcGVydHkgc2V0IHRvIGEgc2xpY2Ugb2YgdGhlIGJ1ZmZlciB0aGF0XG4gICAqIGNvbnRhaW5zIHRoZSBieXRlcyB0aGF0IHdlcmUgYXZhaWxhYmxlIGJlZm9yZSB0aGUgZXJyb3Igb2NjdXJyZWQuXG4gICAqL1xuICBhc3luYyBwZWVrKG46IG51bWJlcik6IFByb21pc2U8VWludDhBcnJheSB8IG51bGw+IHtcbiAgICBpZiAobiA8IDApIHtcbiAgICAgIHRocm93IEVycm9yKFwibmVnYXRpdmUgY291bnRcIik7XG4gICAgfVxuXG4gICAgbGV0IGF2YWlsID0gdGhpcy53IC0gdGhpcy5yO1xuICAgIHdoaWxlIChhdmFpbCA8IG4gJiYgYXZhaWwgPCB0aGlzLmJ1Zi5ieXRlTGVuZ3RoICYmICF0aGlzLmVvZikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgdGhpcy5fZmlsbCgpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGVyci5wYXJ0aWFsID0gdGhpcy5idWYuc3ViYXJyYXkodGhpcy5yLCB0aGlzLncpO1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG4gICAgICBhdmFpbCA9IHRoaXMudyAtIHRoaXMucjtcbiAgICB9XG5cbiAgICBpZiAoYXZhaWwgPT09IDAgJiYgdGhpcy5lb2YpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0gZWxzZSBpZiAoYXZhaWwgPCBuICYmIHRoaXMuZW9mKSB7XG4gICAgICByZXR1cm4gdGhpcy5idWYuc3ViYXJyYXkodGhpcy5yLCB0aGlzLnIgKyBhdmFpbCk7XG4gICAgfSBlbHNlIGlmIChhdmFpbCA8IG4pIHtcbiAgICAgIHRocm93IG5ldyBCdWZmZXJGdWxsRXJyb3IodGhpcy5idWYuc3ViYXJyYXkodGhpcy5yLCB0aGlzLncpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5idWYuc3ViYXJyYXkodGhpcy5yLCB0aGlzLnIgKyBuKTtcbiAgfVxufVxuXG5hYnN0cmFjdCBjbGFzcyBBYnN0cmFjdEJ1ZkJhc2Uge1xuICBidWYhOiBVaW50OEFycmF5O1xuICB1c2VkQnVmZmVyQnl0ZXMgPSAwO1xuICBlcnI6IEVycm9yIHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqIFNpemUgcmV0dXJucyB0aGUgc2l6ZSBvZiB0aGUgdW5kZXJseWluZyBidWZmZXIgaW4gYnl0ZXMuICovXG4gIHNpemUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5idWYuYnl0ZUxlbmd0aDtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIGhvdyBtYW55IGJ5dGVzIGFyZSB1bnVzZWQgaW4gdGhlIGJ1ZmZlci4gKi9cbiAgYXZhaWxhYmxlKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuYnVmLmJ5dGVMZW5ndGggLSB0aGlzLnVzZWRCdWZmZXJCeXRlcztcbiAgfVxuXG4gIC8qKiBidWZmZXJlZCByZXR1cm5zIHRoZSBudW1iZXIgb2YgYnl0ZXMgdGhhdCBoYXZlIGJlZW4gd3JpdHRlbiBpbnRvIHRoZVxuICAgKiBjdXJyZW50IGJ1ZmZlci5cbiAgICovXG4gIGJ1ZmZlcmVkKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMudXNlZEJ1ZmZlckJ5dGVzO1xuICB9XG59XG5cbi8qKiBCdWZXcml0ZXIgaW1wbGVtZW50cyBidWZmZXJpbmcgZm9yIGFuIGRlbm8uV3JpdGVyIG9iamVjdC5cbiAqIElmIGFuIGVycm9yIG9jY3VycyB3cml0aW5nIHRvIGEgV3JpdGVyLCBubyBtb3JlIGRhdGEgd2lsbCBiZVxuICogYWNjZXB0ZWQgYW5kIGFsbCBzdWJzZXF1ZW50IHdyaXRlcywgYW5kIGZsdXNoKCksIHdpbGwgcmV0dXJuIHRoZSBlcnJvci5cbiAqIEFmdGVyIGFsbCBkYXRhIGhhcyBiZWVuIHdyaXR0ZW4sIHRoZSBjbGllbnQgc2hvdWxkIGNhbGwgdGhlXG4gKiBmbHVzaCgpIG1ldGhvZCB0byBndWFyYW50ZWUgYWxsIGRhdGEgaGFzIGJlZW4gZm9yd2FyZGVkIHRvXG4gKiB0aGUgdW5kZXJseWluZyBkZW5vLldyaXRlci5cbiAqL1xuZXhwb3J0IGNsYXNzIEJ1ZldyaXRlciBleHRlbmRzIEFic3RyYWN0QnVmQmFzZSBpbXBsZW1lbnRzIFdyaXRlciB7XG4gIC8qKiByZXR1cm4gbmV3IEJ1ZldyaXRlciB1bmxlc3Mgd3JpdGVyIGlzIEJ1ZldyaXRlciAqL1xuICBzdGF0aWMgY3JlYXRlKHdyaXRlcjogV3JpdGVyLCBzaXplOiBudW1iZXIgPSBERUZBVUxUX0JVRl9TSVpFKTogQnVmV3JpdGVyIHtcbiAgICByZXR1cm4gd3JpdGVyIGluc3RhbmNlb2YgQnVmV3JpdGVyID8gd3JpdGVyIDogbmV3IEJ1ZldyaXRlcih3cml0ZXIsIHNpemUpO1xuICB9XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSB3cml0ZXI6IFdyaXRlciwgc2l6ZTogbnVtYmVyID0gREVGQVVMVF9CVUZfU0laRSkge1xuICAgIHN1cGVyKCk7XG4gICAgaWYgKHNpemUgPD0gMCkge1xuICAgICAgc2l6ZSA9IERFRkFVTFRfQlVGX1NJWkU7XG4gICAgfVxuICAgIHRoaXMuYnVmID0gbmV3IFVpbnQ4QXJyYXkoc2l6ZSk7XG4gIH1cblxuICAvKiogRGlzY2FyZHMgYW55IHVuZmx1c2hlZCBidWZmZXJlZCBkYXRhLCBjbGVhcnMgYW55IGVycm9yLCBhbmRcbiAgICogcmVzZXRzIGJ1ZmZlciB0byB3cml0ZSBpdHMgb3V0cHV0IHRvIHcuXG4gICAqL1xuICByZXNldCh3OiBXcml0ZXIpOiB2b2lkIHtcbiAgICB0aGlzLmVyciA9IG51bGw7XG4gICAgdGhpcy51c2VkQnVmZmVyQnl0ZXMgPSAwO1xuICAgIHRoaXMud3JpdGVyID0gdztcbiAgfVxuXG4gIC8qKiBGbHVzaCB3cml0ZXMgYW55IGJ1ZmZlcmVkIGRhdGEgdG8gdGhlIHVuZGVybHlpbmcgaW8uV3JpdGVyLiAqL1xuICBhc3luYyBmbHVzaCgpIHtcbiAgICBpZiAodGhpcy5lcnIgIT09IG51bGwpIHRocm93IHRoaXMuZXJyO1xuICAgIGlmICh0aGlzLnVzZWRCdWZmZXJCeXRlcyA9PT0gMCkgcmV0dXJuO1xuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHdyaXRlQWxsKFxuICAgICAgICB0aGlzLndyaXRlcixcbiAgICAgICAgdGhpcy5idWYuc3ViYXJyYXkoMCwgdGhpcy51c2VkQnVmZmVyQnl0ZXMpLFxuICAgICAgKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aGlzLmVyciA9IGU7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cblxuICAgIHRoaXMuYnVmID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5idWYubGVuZ3RoKTtcbiAgICB0aGlzLnVzZWRCdWZmZXJCeXRlcyA9IDA7XG4gIH1cblxuICAvKiogV3JpdGVzIHRoZSBjb250ZW50cyBvZiBgZGF0YWAgaW50byB0aGUgYnVmZmVyLiAgSWYgdGhlIGNvbnRlbnRzIHdvbid0IGZ1bGx5XG4gICAqIGZpdCBpbnRvIHRoZSBidWZmZXIsIHRob3NlIGJ5dGVzIHRoYXQgY2FuIGFyZSBjb3BpZWQgaW50byB0aGUgYnVmZmVyLCB0aGVcbiAgICogYnVmZmVyIGlzIHRoZSBmbHVzaGVkIHRvIHRoZSB3cml0ZXIgYW5kIHRoZSByZW1haW5pbmcgYnl0ZXMgYXJlIGNvcGllZCBpbnRvXG4gICAqIHRoZSBub3cgZW1wdHkgYnVmZmVyLlxuICAgKlxuICAgKiBAcmV0dXJuIHRoZSBudW1iZXIgb2YgYnl0ZXMgd3JpdHRlbiB0byB0aGUgYnVmZmVyLlxuICAgKi9cbiAgYXN5bmMgd3JpdGUoZGF0YTogVWludDhBcnJheSk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuZXJyICE9PSBudWxsKSB0aHJvdyB0aGlzLmVycjtcbiAgICBpZiAoZGF0YS5sZW5ndGggPT09IDApIHJldHVybiAwO1xuXG4gICAgbGV0IHRvdGFsQnl0ZXNXcml0dGVuID0gMDtcbiAgICBsZXQgbnVtQnl0ZXNXcml0dGVuID0gMDtcbiAgICB3aGlsZSAoZGF0YS5ieXRlTGVuZ3RoID4gdGhpcy5hdmFpbGFibGUoKSkge1xuICAgICAgaWYgKHRoaXMuYnVmZmVyZWQoKSA9PT0gMCkge1xuICAgICAgICAvLyBMYXJnZSB3cml0ZSwgZW1wdHkgYnVmZmVyLlxuICAgICAgICAvLyBXcml0ZSBkaXJlY3RseSBmcm9tIGRhdGEgdG8gYXZvaWQgY29weS5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBudW1CeXRlc1dyaXR0ZW4gPSBhd2FpdCB0aGlzLndyaXRlci53cml0ZShkYXRhKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHRoaXMuZXJyID0gZTtcbiAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBudW1CeXRlc1dyaXR0ZW4gPSBjb3B5KGRhdGEsIHRoaXMuYnVmLCB0aGlzLnVzZWRCdWZmZXJCeXRlcyk7XG4gICAgICAgIHRoaXMudXNlZEJ1ZmZlckJ5dGVzICs9IG51bUJ5dGVzV3JpdHRlbjtcbiAgICAgICAgYXdhaXQgdGhpcy5mbHVzaCgpO1xuICAgICAgfVxuICAgICAgdG90YWxCeXRlc1dyaXR0ZW4gKz0gbnVtQnl0ZXNXcml0dGVuO1xuICAgICAgZGF0YSA9IGRhdGEuc3ViYXJyYXkobnVtQnl0ZXNXcml0dGVuKTtcbiAgICB9XG5cbiAgICBudW1CeXRlc1dyaXR0ZW4gPSBjb3B5KGRhdGEsIHRoaXMuYnVmLCB0aGlzLnVzZWRCdWZmZXJCeXRlcyk7XG4gICAgdGhpcy51c2VkQnVmZmVyQnl0ZXMgKz0gbnVtQnl0ZXNXcml0dGVuO1xuICAgIHRvdGFsQnl0ZXNXcml0dGVuICs9IG51bUJ5dGVzV3JpdHRlbjtcbiAgICByZXR1cm4gdG90YWxCeXRlc1dyaXR0ZW47XG4gIH1cbn1cblxuLyoqIEJ1ZldyaXRlclN5bmMgaW1wbGVtZW50cyBidWZmZXJpbmcgZm9yIGEgZGVuby5Xcml0ZXJTeW5jIG9iamVjdC5cbiAqIElmIGFuIGVycm9yIG9jY3VycyB3cml0aW5nIHRvIGEgV3JpdGVyU3luYywgbm8gbW9yZSBkYXRhIHdpbGwgYmVcbiAqIGFjY2VwdGVkIGFuZCBhbGwgc3Vic2VxdWVudCB3cml0ZXMsIGFuZCBmbHVzaCgpLCB3aWxsIHJldHVybiB0aGUgZXJyb3IuXG4gKiBBZnRlciBhbGwgZGF0YSBoYXMgYmVlbiB3cml0dGVuLCB0aGUgY2xpZW50IHNob3VsZCBjYWxsIHRoZVxuICogZmx1c2goKSBtZXRob2QgdG8gZ3VhcmFudGVlIGFsbCBkYXRhIGhhcyBiZWVuIGZvcndhcmRlZCB0b1xuICogdGhlIHVuZGVybHlpbmcgZGVuby5Xcml0ZXJTeW5jLlxuICovXG5leHBvcnQgY2xhc3MgQnVmV3JpdGVyU3luYyBleHRlbmRzIEFic3RyYWN0QnVmQmFzZSBpbXBsZW1lbnRzIFdyaXRlclN5bmMge1xuICAvKiogcmV0dXJuIG5ldyBCdWZXcml0ZXJTeW5jIHVubGVzcyB3cml0ZXIgaXMgQnVmV3JpdGVyU3luYyAqL1xuICBzdGF0aWMgY3JlYXRlKFxuICAgIHdyaXRlcjogV3JpdGVyU3luYyxcbiAgICBzaXplOiBudW1iZXIgPSBERUZBVUxUX0JVRl9TSVpFLFxuICApOiBCdWZXcml0ZXJTeW5jIHtcbiAgICByZXR1cm4gd3JpdGVyIGluc3RhbmNlb2YgQnVmV3JpdGVyU3luY1xuICAgICAgPyB3cml0ZXJcbiAgICAgIDogbmV3IEJ1ZldyaXRlclN5bmMod3JpdGVyLCBzaXplKTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgd3JpdGVyOiBXcml0ZXJTeW5jLCBzaXplOiBudW1iZXIgPSBERUZBVUxUX0JVRl9TSVpFKSB7XG4gICAgc3VwZXIoKTtcbiAgICBpZiAoc2l6ZSA8PSAwKSB7XG4gICAgICBzaXplID0gREVGQVVMVF9CVUZfU0laRTtcbiAgICB9XG4gICAgdGhpcy5idWYgPSBuZXcgVWludDhBcnJheShzaXplKTtcbiAgfVxuXG4gIC8qKiBEaXNjYXJkcyBhbnkgdW5mbHVzaGVkIGJ1ZmZlcmVkIGRhdGEsIGNsZWFycyBhbnkgZXJyb3IsIGFuZFxuICAgKiByZXNldHMgYnVmZmVyIHRvIHdyaXRlIGl0cyBvdXRwdXQgdG8gdy5cbiAgICovXG4gIHJlc2V0KHc6IFdyaXRlclN5bmMpOiB2b2lkIHtcbiAgICB0aGlzLmVyciA9IG51bGw7XG4gICAgdGhpcy51c2VkQnVmZmVyQnl0ZXMgPSAwO1xuICAgIHRoaXMud3JpdGVyID0gdztcbiAgfVxuXG4gIC8qKiBGbHVzaCB3cml0ZXMgYW55IGJ1ZmZlcmVkIGRhdGEgdG8gdGhlIHVuZGVybHlpbmcgaW8uV3JpdGVyU3luYy4gKi9cbiAgZmx1c2goKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuZXJyICE9PSBudWxsKSB0aHJvdyB0aGlzLmVycjtcbiAgICBpZiAodGhpcy51c2VkQnVmZmVyQnl0ZXMgPT09IDApIHJldHVybjtcblxuICAgIHRyeSB7XG4gICAgICB3cml0ZUFsbFN5bmMoXG4gICAgICAgIHRoaXMud3JpdGVyLFxuICAgICAgICB0aGlzLmJ1Zi5zdWJhcnJheSgwLCB0aGlzLnVzZWRCdWZmZXJCeXRlcyksXG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRoaXMuZXJyID0gZTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuXG4gICAgdGhpcy5idWYgPSBuZXcgVWludDhBcnJheSh0aGlzLmJ1Zi5sZW5ndGgpO1xuICAgIHRoaXMudXNlZEJ1ZmZlckJ5dGVzID0gMDtcbiAgfVxuXG4gIC8qKiBXcml0ZXMgdGhlIGNvbnRlbnRzIG9mIGBkYXRhYCBpbnRvIHRoZSBidWZmZXIuICBJZiB0aGUgY29udGVudHMgd29uJ3QgZnVsbHlcbiAgICogZml0IGludG8gdGhlIGJ1ZmZlciwgdGhvc2UgYnl0ZXMgdGhhdCBjYW4gYXJlIGNvcGllZCBpbnRvIHRoZSBidWZmZXIsIHRoZVxuICAgKiBidWZmZXIgaXMgdGhlIGZsdXNoZWQgdG8gdGhlIHdyaXRlciBhbmQgdGhlIHJlbWFpbmluZyBieXRlcyBhcmUgY29waWVkIGludG9cbiAgICogdGhlIG5vdyBlbXB0eSBidWZmZXIuXG4gICAqXG4gICAqIEByZXR1cm4gdGhlIG51bWJlciBvZiBieXRlcyB3cml0dGVuIHRvIHRoZSBidWZmZXIuXG4gICAqL1xuICB3cml0ZVN5bmMoZGF0YTogVWludDhBcnJheSk6IG51bWJlciB7XG4gICAgaWYgKHRoaXMuZXJyICE9PSBudWxsKSB0aHJvdyB0aGlzLmVycjtcbiAgICBpZiAoZGF0YS5sZW5ndGggPT09IDApIHJldHVybiAwO1xuXG4gICAgbGV0IHRvdGFsQnl0ZXNXcml0dGVuID0gMDtcbiAgICBsZXQgbnVtQnl0ZXNXcml0dGVuID0gMDtcbiAgICB3aGlsZSAoZGF0YS5ieXRlTGVuZ3RoID4gdGhpcy5hdmFpbGFibGUoKSkge1xuICAgICAgaWYgKHRoaXMuYnVmZmVyZWQoKSA9PT0gMCkge1xuICAgICAgICAvLyBMYXJnZSB3cml0ZSwgZW1wdHkgYnVmZmVyLlxuICAgICAgICAvLyBXcml0ZSBkaXJlY3RseSBmcm9tIGRhdGEgdG8gYXZvaWQgY29weS5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBudW1CeXRlc1dyaXR0ZW4gPSB0aGlzLndyaXRlci53cml0ZVN5bmMoZGF0YSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICB0aGlzLmVyciA9IGU7XG4gICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbnVtQnl0ZXNXcml0dGVuID0gY29weShkYXRhLCB0aGlzLmJ1ZiwgdGhpcy51c2VkQnVmZmVyQnl0ZXMpO1xuICAgICAgICB0aGlzLnVzZWRCdWZmZXJCeXRlcyArPSBudW1CeXRlc1dyaXR0ZW47XG4gICAgICAgIHRoaXMuZmx1c2goKTtcbiAgICAgIH1cbiAgICAgIHRvdGFsQnl0ZXNXcml0dGVuICs9IG51bUJ5dGVzV3JpdHRlbjtcbiAgICAgIGRhdGEgPSBkYXRhLnN1YmFycmF5KG51bUJ5dGVzV3JpdHRlbik7XG4gICAgfVxuXG4gICAgbnVtQnl0ZXNXcml0dGVuID0gY29weShkYXRhLCB0aGlzLmJ1ZiwgdGhpcy51c2VkQnVmZmVyQnl0ZXMpO1xuICAgIHRoaXMudXNlZEJ1ZmZlckJ5dGVzICs9IG51bUJ5dGVzV3JpdHRlbjtcbiAgICB0b3RhbEJ5dGVzV3JpdHRlbiArPSBudW1CeXRlc1dyaXR0ZW47XG4gICAgcmV0dXJuIHRvdGFsQnl0ZXNXcml0dGVuO1xuICB9XG59XG5cbi8qKiBHZW5lcmF0ZSBsb25nZXN0IHByb3BlciBwcmVmaXggd2hpY2ggaXMgYWxzbyBzdWZmaXggYXJyYXkuICovXG5mdW5jdGlvbiBjcmVhdGVMUFMocGF0OiBVaW50OEFycmF5KTogVWludDhBcnJheSB7XG4gIGNvbnN0IGxwcyA9IG5ldyBVaW50OEFycmF5KHBhdC5sZW5ndGgpO1xuICBscHNbMF0gPSAwO1xuICBsZXQgcHJlZml4RW5kID0gMDtcbiAgbGV0IGkgPSAxO1xuICB3aGlsZSAoaSA8IGxwcy5sZW5ndGgpIHtcbiAgICBpZiAocGF0W2ldID09IHBhdFtwcmVmaXhFbmRdKSB7XG4gICAgICBwcmVmaXhFbmQrKztcbiAgICAgIGxwc1tpXSA9IHByZWZpeEVuZDtcbiAgICAgIGkrKztcbiAgICB9IGVsc2UgaWYgKHByZWZpeEVuZCA9PT0gMCkge1xuICAgICAgbHBzW2ldID0gMDtcbiAgICAgIGkrKztcbiAgICB9IGVsc2Uge1xuICAgICAgcHJlZml4RW5kID0gcGF0W3ByZWZpeEVuZCAtIDFdO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbHBzO1xufVxuXG4vKiogUmVhZCBkZWxpbWl0ZWQgYnl0ZXMgZnJvbSBhIFJlYWRlci4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiogcmVhZERlbGltKFxuICByZWFkZXI6IFJlYWRlcixcbiAgZGVsaW06IFVpbnQ4QXJyYXksXG4pOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8VWludDhBcnJheT4ge1xuICAvLyBBdm9pZCB1bmljb2RlIHByb2JsZW1zXG4gIGNvbnN0IGRlbGltTGVuID0gZGVsaW0ubGVuZ3RoO1xuICBjb25zdCBkZWxpbUxQUyA9IGNyZWF0ZUxQUyhkZWxpbSk7XG5cbiAgbGV0IGlucHV0QnVmZmVyID0gbmV3IEJ1ZmZlcigpO1xuICBjb25zdCBpbnNwZWN0QXJyID0gbmV3IFVpbnQ4QXJyYXkoTWF0aC5tYXgoMTAyNCwgZGVsaW1MZW4gKyAxKSk7XG5cbiAgLy8gTW9kaWZpZWQgS01QXG4gIGxldCBpbnNwZWN0SW5kZXggPSAwO1xuICBsZXQgbWF0Y2hJbmRleCA9IDA7XG4gIHdoaWxlICh0cnVlKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVhZGVyLnJlYWQoaW5zcGVjdEFycik7XG4gICAgaWYgKHJlc3VsdCA9PT0gbnVsbCkge1xuICAgICAgLy8gWWllbGQgbGFzdCBjaHVuay5cbiAgICAgIHlpZWxkIGlucHV0QnVmZmVyLmJ5dGVzKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICgocmVzdWx0IGFzIG51bWJlcikgPCAwKSB7XG4gICAgICAvLyBEaXNjYXJkIGFsbCByZW1haW5pbmcgYW5kIHNpbGVudGx5IGZhaWwuXG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHNsaWNlUmVhZCA9IGluc3BlY3RBcnIuc3ViYXJyYXkoMCwgcmVzdWx0IGFzIG51bWJlcik7XG4gICAgYXdhaXQgd3JpdGVBbGwoaW5wdXRCdWZmZXIsIHNsaWNlUmVhZCk7XG5cbiAgICBsZXQgc2xpY2VUb1Byb2Nlc3MgPSBpbnB1dEJ1ZmZlci5ieXRlcygpO1xuICAgIHdoaWxlIChpbnNwZWN0SW5kZXggPCBzbGljZVRvUHJvY2Vzcy5sZW5ndGgpIHtcbiAgICAgIGlmIChzbGljZVRvUHJvY2Vzc1tpbnNwZWN0SW5kZXhdID09PSBkZWxpbVttYXRjaEluZGV4XSkge1xuICAgICAgICBpbnNwZWN0SW5kZXgrKztcbiAgICAgICAgbWF0Y2hJbmRleCsrO1xuICAgICAgICBpZiAobWF0Y2hJbmRleCA9PT0gZGVsaW1MZW4pIHtcbiAgICAgICAgICAvLyBGdWxsIG1hdGNoXG4gICAgICAgICAgY29uc3QgbWF0Y2hFbmQgPSBpbnNwZWN0SW5kZXggLSBkZWxpbUxlbjtcbiAgICAgICAgICBjb25zdCByZWFkeUJ5dGVzID0gc2xpY2VUb1Byb2Nlc3Muc3ViYXJyYXkoMCwgbWF0Y2hFbmQpO1xuICAgICAgICAgIC8vIENvcHlcbiAgICAgICAgICBjb25zdCBwZW5kaW5nQnl0ZXMgPSBzbGljZVRvUHJvY2Vzcy5zbGljZShpbnNwZWN0SW5kZXgpO1xuICAgICAgICAgIHlpZWxkIHJlYWR5Qnl0ZXM7XG4gICAgICAgICAgLy8gUmVzZXQgbWF0Y2gsIGRpZmZlcmVudCBmcm9tIEtNUC5cbiAgICAgICAgICBzbGljZVRvUHJvY2VzcyA9IHBlbmRpbmdCeXRlcztcbiAgICAgICAgICBpbnNwZWN0SW5kZXggPSAwO1xuICAgICAgICAgIG1hdGNoSW5kZXggPSAwO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAobWF0Y2hJbmRleCA9PT0gMCkge1xuICAgICAgICAgIGluc3BlY3RJbmRleCsrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1hdGNoSW5kZXggPSBkZWxpbUxQU1ttYXRjaEluZGV4IC0gMV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gS2VlcCBpbnNwZWN0SW5kZXggYW5kIG1hdGNoSW5kZXguXG4gICAgaW5wdXRCdWZmZXIgPSBuZXcgQnVmZmVyKHNsaWNlVG9Qcm9jZXNzKTtcbiAgfVxufVxuXG4vKiogUmVhZCBkZWxpbWl0ZWQgc3RyaW5ncyBmcm9tIGEgUmVhZGVyLiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uKiByZWFkU3RyaW5nRGVsaW0oXG4gIHJlYWRlcjogUmVhZGVyLFxuICBkZWxpbTogc3RyaW5nLFxuKTogQXN5bmNJdGVyYWJsZUl0ZXJhdG9yPHN0cmluZz4ge1xuICBjb25zdCBlbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG4gIGNvbnN0IGRlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoKTtcbiAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiByZWFkRGVsaW0ocmVhZGVyLCBlbmNvZGVyLmVuY29kZShkZWxpbSkpKSB7XG4gICAgeWllbGQgZGVjb2Rlci5kZWNvZGUoY2h1bmspO1xuICB9XG59XG5cbi8qKiBSZWFkIHN0cmluZ3MgbGluZS1ieS1saW5lIGZyb20gYSBSZWFkZXIuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24qIHJlYWRMaW5lcyhcbiAgcmVhZGVyOiBSZWFkZXIsXG4pOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8c3RyaW5nPiB7XG4gIGZvciBhd2FpdCAobGV0IGNodW5rIG9mIHJlYWRTdHJpbmdEZWxpbShyZWFkZXIsIFwiXFxuXCIpKSB7XG4gICAgLy8gRmluZGluZyBhIENSIGF0IHRoZSBlbmQgb2YgdGhlIGxpbmUgaXMgZXZpZGVuY2Ugb2YgYVxuICAgIC8vIFwiXFxyXFxuXCIgYXQgdGhlIGVuZCBvZiB0aGUgbGluZS4gVGhlIFwiXFxyXCIgcGFydCBzaG91bGQgYmVcbiAgICAvLyByZW1vdmVkIHRvby5cbiAgICBpZiAoY2h1bmsuZW5kc1dpdGgoXCJcXHJcIikpIHtcbiAgICAgIGNodW5rID0gY2h1bmsuc2xpY2UoMCwgLTEpO1xuICAgIH1cbiAgICB5aWVsZCBjaHVuaztcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQVNTLElBQUksU0FBUSxlQUFpQjtTQUM3QixNQUFNLFNBQVEsa0JBQW9CO1NBQ2xDLE1BQU0sU0FBUSxXQUFhO1NBQzNCLFFBQVEsRUFBRSxZQUFZLFNBQVEsU0FBVztNQUU1QyxnQkFBZ0IsR0FBRyxJQUFJO01BQ3ZCLFlBQVksR0FBRyxFQUFFO01BQ2pCLDJCQUEyQixHQUFHLEdBQUc7TUFDakMsRUFBRSxJQUFHLEVBQUksRUFBQyxVQUFVLENBQUMsQ0FBQztNQUN0QixFQUFFLElBQUcsRUFBSSxFQUFDLFVBQVUsQ0FBQyxDQUFDO2FBRWYsZUFBZSxTQUFTLEtBQUs7SUFFckIsT0FBbUI7SUFEdEMsSUFBSSxJQUFHLGVBQWlCO2dCQUNMLE9BQW1CO1FBQ3BDLEtBQUssRUFBQyxXQUFhO2FBREYsT0FBbUIsR0FBbkIsT0FBbUI7OzthQUszQixnQkFBZ0IsU0FBUyxLQUFLO0lBQ3pDLElBQUksSUFBRyxnQkFBa0I7SUFDekIsT0FBTzs7UUFFTCxLQUFLLEVBQUMsbURBQXFEOzs7QUFVL0QsRUFBMEQsQUFBMUQsc0RBQTBELEFBQTFELEVBQTBELGNBQzdDLFNBQVM7SUFDWixHQUFHO0lBQ0gsRUFBRTtJQUNGLENBQUMsR0FBRyxDQUFDO0lBQ0wsQ0FBQyxHQUFHLENBQUM7SUFDTCxHQUFHLEdBQUcsS0FB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
