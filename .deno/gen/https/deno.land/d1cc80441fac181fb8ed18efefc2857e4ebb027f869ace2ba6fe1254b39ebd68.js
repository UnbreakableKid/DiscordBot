import { copyBytes } from "../bytes/mod.ts";
import { assert } from "../_util/assert.ts";
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
export class PartialReadError extends Deno.errors.UnexpectedEof {
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
    const copied = copyBytes(this.buf.subarray(this.r, this.w), p, 0);
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
      await Deno.writeAll(
        this.writer,
        this.buf.subarray(0, this.usedBufferBytes),
      );
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
        numBytesWritten = copyBytes(data, this.buf, this.usedBufferBytes);
        this.usedBufferBytes += numBytesWritten;
        await this.flush();
      }
      totalBytesWritten += numBytesWritten;
      data = data.subarray(numBytesWritten);
    }
    numBytesWritten = copyBytes(data, this.buf, this.usedBufferBytes);
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
      Deno.writeAllSync(
        this.writer,
        this.buf.subarray(0, this.usedBufferBytes),
      );
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
        numBytesWritten = copyBytes(data, this.buf, this.usedBufferBytes);
        this.usedBufferBytes += numBytesWritten;
        this.flush();
      }
      totalBytesWritten += numBytesWritten;
      data = data.subarray(numBytesWritten);
    }
    numBytesWritten = copyBytes(data, this.buf, this.usedBufferBytes);
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
  let inputBuffer = new Deno.Buffer();
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
    await Deno.writeAll(inputBuffer, sliceRead);
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
    inputBuffer = new Deno.Buffer(sliceToProcess);
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
/** Read strings line-by-line from a Reader. */
// eslint-disable-next-line require-await
export async function* readLines(reader) {
  yield* readStringDelim(reader, "\n");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC43MS4wL2lvL2J1ZmlvLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIwIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gQmFzZWQgb24gaHR0cHM6Ly9naXRodWIuY29tL2dvbGFuZy9nby9ibG9iLzg5MTY4Mi9zcmMvYnVmaW8vYnVmaW8uZ29cbi8vIENvcHlyaWdodCAyMDA5IFRoZSBHbyBBdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYSBCU0Qtc3R5bGVcbi8vIGxpY2Vuc2UgdGhhdCBjYW4gYmUgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZS5cblxudHlwZSBSZWFkZXIgPSBEZW5vLlJlYWRlcjtcbnR5cGUgV3JpdGVyID0gRGVuby5Xcml0ZXI7XG50eXBlIFdyaXRlclN5bmMgPSBEZW5vLldyaXRlclN5bmM7XG5pbXBvcnQgeyBjb3B5Qnl0ZXMgfSBmcm9tIFwiLi4vYnl0ZXMvbW9kLnRzXCI7XG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiLi4vX3V0aWwvYXNzZXJ0LnRzXCI7XG5cbmNvbnN0IERFRkFVTFRfQlVGX1NJWkUgPSA0MDk2O1xuY29uc3QgTUlOX0JVRl9TSVpFID0gMTY7XG5jb25zdCBNQVhfQ09OU0VDVVRJVkVfRU1QVFlfUkVBRFMgPSAxMDA7XG5jb25zdCBDUiA9IFwiXFxyXCIuY2hhckNvZGVBdCgwKTtcbmNvbnN0IExGID0gXCJcXG5cIi5jaGFyQ29kZUF0KDApO1xuXG5leHBvcnQgY2xhc3MgQnVmZmVyRnVsbEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBuYW1lID0gXCJCdWZmZXJGdWxsRXJyb3JcIjtcbiAgY29uc3RydWN0b3IocHVibGljIHBhcnRpYWw6IFVpbnQ4QXJyYXkpIHtcbiAgICBzdXBlcihcIkJ1ZmZlciBmdWxsXCIpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBQYXJ0aWFsUmVhZEVycm9yIGV4dGVuZHMgRGVuby5lcnJvcnMuVW5leHBlY3RlZEVvZiB7XG4gIG5hbWUgPSBcIlBhcnRpYWxSZWFkRXJyb3JcIjtcbiAgcGFydGlhbD86IFVpbnQ4QXJyYXk7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRW5jb3VudGVyZWQgVW5leHBlY3RlZEVvZiwgZGF0YSBvbmx5IHBhcnRpYWxseSByZWFkXCIpO1xuICB9XG59XG5cbi8qKiBSZXN1bHQgdHlwZSByZXR1cm5lZCBieSBvZiBCdWZSZWFkZXIucmVhZExpbmUoKS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUmVhZExpbmVSZXN1bHQge1xuICBsaW5lOiBVaW50OEFycmF5O1xuICBtb3JlOiBib29sZWFuO1xufVxuXG4vKiogQnVmUmVhZGVyIGltcGxlbWVudHMgYnVmZmVyaW5nIGZvciBhIFJlYWRlciBvYmplY3QuICovXG5leHBvcnQgY2xhc3MgQnVmUmVhZGVyIGltcGxlbWVudHMgUmVhZGVyIHtcbiAgcHJpdmF0ZSBidWYhOiBVaW50OEFycmF5O1xuICBwcml2YXRlIHJkITogUmVhZGVyOyAvLyBSZWFkZXIgcHJvdmlkZWQgYnkgY2FsbGVyLlxuICBwcml2YXRlIHIgPSAwOyAvLyBidWYgcmVhZCBwb3NpdGlvbi5cbiAgcHJpdmF0ZSB3ID0gMDsgLy8gYnVmIHdyaXRlIHBvc2l0aW9uLlxuICBwcml2YXRlIGVvZiA9IGZhbHNlO1xuICAvLyBwcml2YXRlIGxhc3RCeXRlOiBudW1iZXI7XG4gIC8vIHByaXZhdGUgbGFzdENoYXJTaXplOiBudW1iZXI7XG5cbiAgLyoqIHJldHVybiBuZXcgQnVmUmVhZGVyIHVubGVzcyByIGlzIEJ1ZlJlYWRlciAqL1xuICBzdGF0aWMgY3JlYXRlKHI6IFJlYWRlciwgc2l6ZTogbnVtYmVyID0gREVGQVVMVF9CVUZfU0laRSk6IEJ1ZlJlYWRlciB7XG4gICAgcmV0dXJuIHIgaW5zdGFuY2VvZiBCdWZSZWFkZXIgPyByIDogbmV3IEJ1ZlJlYWRlcihyLCBzaXplKTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKHJkOiBSZWFkZXIsIHNpemU6IG51bWJlciA9IERFRkFVTFRfQlVGX1NJWkUpIHtcbiAgICBpZiAoc2l6ZSA8IE1JTl9CVUZfU0laRSkge1xuICAgICAgc2l6ZSA9IE1JTl9CVUZfU0laRTtcbiAgICB9XG4gICAgdGhpcy5fcmVzZXQobmV3IFVpbnQ4QXJyYXkoc2l6ZSksIHJkKTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHRoZSBzaXplIG9mIHRoZSB1bmRlcmx5aW5nIGJ1ZmZlciBpbiBieXRlcy4gKi9cbiAgc2l6ZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmJ1Zi5ieXRlTGVuZ3RoO1xuICB9XG5cbiAgYnVmZmVyZWQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy53IC0gdGhpcy5yO1xuICB9XG5cbiAgLy8gUmVhZHMgYSBuZXcgY2h1bmsgaW50byB0aGUgYnVmZmVyLlxuICBwcml2YXRlIGFzeW5jIF9maWxsKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIFNsaWRlIGV4aXN0aW5nIGRhdGEgdG8gYmVnaW5uaW5nLlxuICAgIGlmICh0aGlzLnIgPiAwKSB7XG4gICAgICB0aGlzLmJ1Zi5jb3B5V2l0aGluKDAsIHRoaXMuciwgdGhpcy53KTtcbiAgICAgIHRoaXMudyAtPSB0aGlzLnI7XG4gICAgICB0aGlzLnIgPSAwO1xuICAgIH1cblxuICAgIGlmICh0aGlzLncgPj0gdGhpcy5idWYuYnl0ZUxlbmd0aCkge1xuICAgICAgdGhyb3cgRXJyb3IoXCJidWZpbzogdHJpZWQgdG8gZmlsbCBmdWxsIGJ1ZmZlclwiKTtcbiAgICB9XG5cbiAgICAvLyBSZWFkIG5ldyBkYXRhOiB0cnkgYSBsaW1pdGVkIG51bWJlciBvZiB0aW1lcy5cbiAgICBmb3IgKGxldCBpID0gTUFYX0NPTlNFQ1VUSVZFX0VNUFRZX1JFQURTOyBpID4gMDsgaS0tKSB7XG4gICAgICBjb25zdCByciA9IGF3YWl0IHRoaXMucmQucmVhZCh0aGlzLmJ1Zi5zdWJhcnJheSh0aGlzLncpKTtcbiAgICAgIGlmIChyciA9PT0gbnVsbCkge1xuICAgICAgICB0aGlzLmVvZiA9IHRydWU7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGFzc2VydChyciA+PSAwLCBcIm5lZ2F0aXZlIHJlYWRcIik7XG4gICAgICB0aGlzLncgKz0gcnI7XG4gICAgICBpZiAocnIgPiAwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgTm8gcHJvZ3Jlc3MgYWZ0ZXIgJHtNQVhfQ09OU0VDVVRJVkVfRU1QVFlfUkVBRFN9IHJlYWQoKSBjYWxsc2AsXG4gICAgKTtcbiAgfVxuXG4gIC8qKiBEaXNjYXJkcyBhbnkgYnVmZmVyZWQgZGF0YSwgcmVzZXRzIGFsbCBzdGF0ZSwgYW5kIHN3aXRjaGVzXG4gICAqIHRoZSBidWZmZXJlZCByZWFkZXIgdG8gcmVhZCBmcm9tIHIuXG4gICAqL1xuICByZXNldChyOiBSZWFkZXIpOiB2b2lkIHtcbiAgICB0aGlzLl9yZXNldCh0aGlzLmJ1Ziwgcik7XG4gIH1cblxuICBwcml2YXRlIF9yZXNldChidWY6IFVpbnQ4QXJyYXksIHJkOiBSZWFkZXIpOiB2b2lkIHtcbiAgICB0aGlzLmJ1ZiA9IGJ1ZjtcbiAgICB0aGlzLnJkID0gcmQ7XG4gICAgdGhpcy5lb2YgPSBmYWxzZTtcbiAgICAvLyB0aGlzLmxhc3RCeXRlID0gLTE7XG4gICAgLy8gdGhpcy5sYXN0Q2hhclNpemUgPSAtMTtcbiAgfVxuXG4gIC8qKiByZWFkcyBkYXRhIGludG8gcC5cbiAgICogSXQgcmV0dXJucyB0aGUgbnVtYmVyIG9mIGJ5dGVzIHJlYWQgaW50byBwLlxuICAgKiBUaGUgYnl0ZXMgYXJlIHRha2VuIGZyb20gYXQgbW9zdCBvbmUgUmVhZCBvbiB0aGUgdW5kZXJseWluZyBSZWFkZXIsXG4gICAqIGhlbmNlIG4gbWF5IGJlIGxlc3MgdGhhbiBsZW4ocCkuXG4gICAqIFRvIHJlYWQgZXhhY3RseSBsZW4ocCkgYnl0ZXMsIHVzZSBpby5SZWFkRnVsbChiLCBwKS5cbiAgICovXG4gIGFzeW5jIHJlYWQocDogVWludDhBcnJheSk6IFByb21pc2U8bnVtYmVyIHwgbnVsbD4ge1xuICAgIGxldCBycjogbnVtYmVyIHwgbnVsbCA9IHAuYnl0ZUxlbmd0aDtcbiAgICBpZiAocC5ieXRlTGVuZ3RoID09PSAwKSByZXR1cm4gcnI7XG5cbiAgICBpZiAodGhpcy5yID09PSB0aGlzLncpIHtcbiAgICAgIGlmIChwLmJ5dGVMZW5ndGggPj0gdGhpcy5idWYuYnl0ZUxlbmd0aCkge1xuICAgICAgICAvLyBMYXJnZSByZWFkLCBlbXB0eSBidWZmZXIuXG4gICAgICAgIC8vIFJlYWQgZGlyZWN0bHkgaW50byBwIHRvIGF2b2lkIGNvcHkuXG4gICAgICAgIGNvbnN0IHJyID0gYXdhaXQgdGhpcy5yZC5yZWFkKHApO1xuICAgICAgICBjb25zdCBucmVhZCA9IHJyID8/IDA7XG4gICAgICAgIGFzc2VydChucmVhZCA+PSAwLCBcIm5lZ2F0aXZlIHJlYWRcIik7XG4gICAgICAgIC8vIGlmIChyci5ucmVhZCA+IDApIHtcbiAgICAgICAgLy8gICB0aGlzLmxhc3RCeXRlID0gcFtyci5ucmVhZCAtIDFdO1xuICAgICAgICAvLyAgIHRoaXMubGFzdENoYXJTaXplID0gLTE7XG4gICAgICAgIC8vIH1cbiAgICAgICAgcmV0dXJuIHJyO1xuICAgICAgfVxuXG4gICAgICAvLyBPbmUgcmVhZC5cbiAgICAgIC8vIERvIG5vdCB1c2UgdGhpcy5maWxsLCB3aGljaCB3aWxsIGxvb3AuXG4gICAgICB0aGlzLnIgPSAwO1xuICAgICAgdGhpcy53ID0gMDtcbiAgICAgIHJyID0gYXdhaXQgdGhpcy5yZC5yZWFkKHRoaXMuYnVmKTtcbiAgICAgIGlmIChyciA9PT0gMCB8fCByciA9PT0gbnVsbCkgcmV0dXJuIHJyO1xuICAgICAgYXNzZXJ0KHJyID49IDAsIFwibmVnYXRpdmUgcmVhZFwiKTtcbiAgICAgIHRoaXMudyArPSBycjtcbiAgICB9XG5cbiAgICAvLyBjb3B5IGFzIG11Y2ggYXMgd2UgY2FuXG4gICAgY29uc3QgY29waWVkID0gY29weUJ5dGVzKHRoaXMuYnVmLnN1YmFycmF5KHRoaXMuciwgdGhpcy53KSwgcCwgMCk7XG4gICAgdGhpcy5yICs9IGNvcGllZDtcbiAgICAvLyB0aGlzLmxhc3RCeXRlID0gdGhpcy5idWZbdGhpcy5yIC0gMV07XG4gICAgLy8gdGhpcy5sYXN0Q2hhclNpemUgPSAtMTtcbiAgICByZXR1cm4gY29waWVkO1xuICB9XG5cbiAgLyoqIHJlYWRzIGV4YWN0bHkgYHAubGVuZ3RoYCBieXRlcyBpbnRvIGBwYC5cbiAgICpcbiAgICogSWYgc3VjY2Vzc2Z1bCwgYHBgIGlzIHJldHVybmVkLlxuICAgKlxuICAgKiBJZiB0aGUgZW5kIG9mIHRoZSB1bmRlcmx5aW5nIHN0cmVhbSBoYXMgYmVlbiByZWFjaGVkLCBhbmQgdGhlcmUgYXJlIG5vIG1vcmVcbiAgICogYnl0ZXMgYXZhaWxhYmxlIGluIHRoZSBidWZmZXIsIGByZWFkRnVsbCgpYCByZXR1cm5zIGBudWxsYCBpbnN0ZWFkLlxuICAgKlxuICAgKiBBbiBlcnJvciBpcyB0aHJvd24gaWYgc29tZSBieXRlcyBjb3VsZCBiZSByZWFkLCBidXQgbm90IGVub3VnaCB0byBmaWxsIGBwYFxuICAgKiBlbnRpcmVseSBiZWZvcmUgdGhlIHVuZGVybHlpbmcgc3RyZWFtIHJlcG9ydGVkIGFuIGVycm9yIG9yIEVPRi4gQW55IGVycm9yXG4gICAqIHRocm93biB3aWxsIGhhdmUgYSBgcGFydGlhbGAgcHJvcGVydHkgdGhhdCBpbmRpY2F0ZXMgdGhlIHNsaWNlIG9mIHRoZVxuICAgKiBidWZmZXIgdGhhdCBoYXMgYmVlbiBzdWNjZXNzZnVsbHkgZmlsbGVkIHdpdGggZGF0YS5cbiAgICpcbiAgICogUG9ydGVkIGZyb20gaHR0cHM6Ly9nb2xhbmcub3JnL3BrZy9pby8jUmVhZEZ1bGxcbiAgICovXG4gIGFzeW5jIHJlYWRGdWxsKHA6IFVpbnQ4QXJyYXkpOiBQcm9taXNlPFVpbnQ4QXJyYXkgfCBudWxsPiB7XG4gICAgbGV0IGJ5dGVzUmVhZCA9IDA7XG4gICAgd2hpbGUgKGJ5dGVzUmVhZCA8IHAubGVuZ3RoKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByciA9IGF3YWl0IHRoaXMucmVhZChwLnN1YmFycmF5KGJ5dGVzUmVhZCkpO1xuICAgICAgICBpZiAocnIgPT09IG51bGwpIHtcbiAgICAgICAgICBpZiAoYnl0ZXNSZWFkID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFBhcnRpYWxSZWFkRXJyb3IoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnl0ZXNSZWFkICs9IHJyO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGVyci5wYXJ0aWFsID0gcC5zdWJhcnJheSgwLCBieXRlc1JlYWQpO1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdGhlIG5leHQgYnl0ZSBbMCwgMjU1XSBvciBgbnVsbGAuICovXG4gIGFzeW5jIHJlYWRCeXRlKCk6IFByb21pc2U8bnVtYmVyIHwgbnVsbD4ge1xuICAgIHdoaWxlICh0aGlzLnIgPT09IHRoaXMudykge1xuICAgICAgaWYgKHRoaXMuZW9mKSByZXR1cm4gbnVsbDtcbiAgICAgIGF3YWl0IHRoaXMuX2ZpbGwoKTsgLy8gYnVmZmVyIGlzIGVtcHR5LlxuICAgIH1cbiAgICBjb25zdCBjID0gdGhpcy5idWZbdGhpcy5yXTtcbiAgICB0aGlzLnIrKztcbiAgICAvLyB0aGlzLmxhc3RCeXRlID0gYztcbiAgICByZXR1cm4gYztcbiAgfVxuXG4gIC8qKiByZWFkU3RyaW5nKCkgcmVhZHMgdW50aWwgdGhlIGZpcnN0IG9jY3VycmVuY2Ugb2YgZGVsaW0gaW4gdGhlIGlucHV0LFxuICAgKiByZXR1cm5pbmcgYSBzdHJpbmcgY29udGFpbmluZyB0aGUgZGF0YSB1cCB0byBhbmQgaW5jbHVkaW5nIHRoZSBkZWxpbWl0ZXIuXG4gICAqIElmIFJlYWRTdHJpbmcgZW5jb3VudGVycyBhbiBlcnJvciBiZWZvcmUgZmluZGluZyBhIGRlbGltaXRlcixcbiAgICogaXQgcmV0dXJucyB0aGUgZGF0YSByZWFkIGJlZm9yZSB0aGUgZXJyb3IgYW5kIHRoZSBlcnJvciBpdHNlbGZcbiAgICogKG9mdGVuIGBudWxsYCkuXG4gICAqIFJlYWRTdHJpbmcgcmV0dXJucyBlcnIgIT0gbmlsIGlmIGFuZCBvbmx5IGlmIHRoZSByZXR1cm5lZCBkYXRhIGRvZXMgbm90IGVuZFxuICAgKiBpbiBkZWxpbS5cbiAgICogRm9yIHNpbXBsZSB1c2VzLCBhIFNjYW5uZXIgbWF5IGJlIG1vcmUgY29udmVuaWVudC5cbiAgICovXG4gIGFzeW5jIHJlYWRTdHJpbmcoZGVsaW06IHN0cmluZyk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICAgIGlmIChkZWxpbS5sZW5ndGggIT09IDEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkRlbGltaXRlciBzaG91bGQgYmUgYSBzaW5nbGUgY2hhcmFjdGVyXCIpO1xuICAgIH1cbiAgICBjb25zdCBidWZmZXIgPSBhd2FpdCB0aGlzLnJlYWRTbGljZShkZWxpbS5jaGFyQ29kZUF0KDApKTtcbiAgICBpZiAoYnVmZmVyID09PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4gbmV3IFRleHREZWNvZGVyKCkuZGVjb2RlKGJ1ZmZlcik7XG4gIH1cblxuICAvKiogYHJlYWRMaW5lKClgIGlzIGEgbG93LWxldmVsIGxpbmUtcmVhZGluZyBwcmltaXRpdmUuIE1vc3QgY2FsbGVycyBzaG91bGRcbiAgICogdXNlIGByZWFkU3RyaW5nKCdcXG4nKWAgaW5zdGVhZCBvciB1c2UgYSBTY2FubmVyLlxuICAgKlxuICAgKiBgcmVhZExpbmUoKWAgdHJpZXMgdG8gcmV0dXJuIGEgc2luZ2xlIGxpbmUsIG5vdCBpbmNsdWRpbmcgdGhlIGVuZC1vZi1saW5lXG4gICAqIGJ5dGVzLiBJZiB0aGUgbGluZSB3YXMgdG9vIGxvbmcgZm9yIHRoZSBidWZmZXIgdGhlbiBgbW9yZWAgaXMgc2V0IGFuZCB0aGVcbiAgICogYmVnaW5uaW5nIG9mIHRoZSBsaW5lIGlzIHJldHVybmVkLiBUaGUgcmVzdCBvZiB0aGUgbGluZSB3aWxsIGJlIHJldHVybmVkXG4gICAqIGZyb20gZnV0dXJlIGNhbGxzLiBgbW9yZWAgd2lsbCBiZSBmYWxzZSB3aGVuIHJldHVybmluZyB0aGUgbGFzdCBmcmFnbWVudFxuICAgKiBvZiB0aGUgbGluZS4gVGhlIHJldHVybmVkIGJ1ZmZlciBpcyBvbmx5IHZhbGlkIHVudGlsIHRoZSBuZXh0IGNhbGwgdG9cbiAgICogYHJlYWRMaW5lKClgLlxuICAgKlxuICAgKiBUaGUgdGV4dCByZXR1cm5lZCBmcm9tIFJlYWRMaW5lIGRvZXMgbm90IGluY2x1ZGUgdGhlIGxpbmUgZW5kIChcIlxcclxcblwiIG9yXG4gICAqIFwiXFxuXCIpLlxuICAgKlxuICAgKiBXaGVuIHRoZSBlbmQgb2YgdGhlIHVuZGVybHlpbmcgc3RyZWFtIGlzIHJlYWNoZWQsIHRoZSBmaW5hbCBieXRlcyBpbiB0aGVcbiAgICogc3RyZWFtIGFyZSByZXR1cm5lZC4gTm8gaW5kaWNhdGlvbiBvciBlcnJvciBpcyBnaXZlbiBpZiB0aGUgaW5wdXQgZW5kc1xuICAgKiB3aXRob3V0IGEgZmluYWwgbGluZSBlbmQuIFdoZW4gdGhlcmUgYXJlIG5vIG1vcmUgdHJhaWxpbmcgYnl0ZXMgdG8gcmVhZCxcbiAgICogYHJlYWRMaW5lKClgIHJldHVybnMgYG51bGxgLlxuICAgKlxuICAgKiBDYWxsaW5nIGB1bnJlYWRCeXRlKClgIGFmdGVyIGByZWFkTGluZSgpYCB3aWxsIGFsd2F5cyB1bnJlYWQgdGhlIGxhc3QgYnl0ZVxuICAgKiByZWFkIChwb3NzaWJseSBhIGNoYXJhY3RlciBiZWxvbmdpbmcgdG8gdGhlIGxpbmUgZW5kKSBldmVuIGlmIHRoYXQgYnl0ZSBpc1xuICAgKiBub3QgcGFydCBvZiB0aGUgbGluZSByZXR1cm5lZCBieSBgcmVhZExpbmUoKWAuXG4gICAqL1xuICBhc3luYyByZWFkTGluZSgpOiBQcm9taXNlPFJlYWRMaW5lUmVzdWx0IHwgbnVsbD4ge1xuICAgIGxldCBsaW5lOiBVaW50OEFycmF5IHwgbnVsbDtcblxuICAgIHRyeSB7XG4gICAgICBsaW5lID0gYXdhaXQgdGhpcy5yZWFkU2xpY2UoTEYpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgbGV0IHsgcGFydGlhbCB9ID0gZXJyO1xuICAgICAgYXNzZXJ0KFxuICAgICAgICBwYXJ0aWFsIGluc3RhbmNlb2YgVWludDhBcnJheSxcbiAgICAgICAgXCJidWZpbzogY2F1Z2h0IGVycm9yIGZyb20gYHJlYWRTbGljZSgpYCB3aXRob3V0IGBwYXJ0aWFsYCBwcm9wZXJ0eVwiLFxuICAgICAgKTtcblxuICAgICAgLy8gRG9uJ3QgdGhyb3cgaWYgYHJlYWRTbGljZSgpYCBmYWlsZWQgd2l0aCBgQnVmZmVyRnVsbEVycm9yYCwgaW5zdGVhZCB3ZVxuICAgICAgLy8ganVzdCByZXR1cm4gd2hhdGV2ZXIgaXMgYXZhaWxhYmxlIGFuZCBzZXQgdGhlIGBtb3JlYCBmbGFnLlxuICAgICAgaWYgKCEoZXJyIGluc3RhbmNlb2YgQnVmZmVyRnVsbEVycm9yKSkge1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG5cbiAgICAgIC8vIEhhbmRsZSB0aGUgY2FzZSB3aGVyZSBcIlxcclxcblwiIHN0cmFkZGxlcyB0aGUgYnVmZmVyLlxuICAgICAgaWYgKFxuICAgICAgICAhdGhpcy5lb2YgJiZcbiAgICAgICAgcGFydGlhbC5ieXRlTGVuZ3RoID4gMCAmJlxuICAgICAgICBwYXJ0aWFsW3BhcnRpYWwuYnl0ZUxlbmd0aCAtIDFdID09PSBDUlxuICAgICAgKSB7XG4gICAgICAgIC8vIFB1dCB0aGUgJ1xccicgYmFjayBvbiBidWYgYW5kIGRyb3AgaXQgZnJvbSBsaW5lLlxuICAgICAgICAvLyBMZXQgdGhlIG5leHQgY2FsbCB0byBSZWFkTGluZSBjaGVjayBmb3IgXCJcXHJcXG5cIi5cbiAgICAgICAgYXNzZXJ0KHRoaXMuciA+IDAsIFwiYnVmaW86IHRyaWVkIHRvIHJld2luZCBwYXN0IHN0YXJ0IG9mIGJ1ZmZlclwiKTtcbiAgICAgICAgdGhpcy5yLS07XG4gICAgICAgIHBhcnRpYWwgPSBwYXJ0aWFsLnN1YmFycmF5KDAsIHBhcnRpYWwuYnl0ZUxlbmd0aCAtIDEpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4geyBsaW5lOiBwYXJ0aWFsLCBtb3JlOiAhdGhpcy5lb2YgfTtcbiAgICB9XG5cbiAgICBpZiAobGluZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKGxpbmUuYnl0ZUxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHsgbGluZSwgbW9yZTogZmFsc2UgfTtcbiAgICB9XG5cbiAgICBpZiAobGluZVtsaW5lLmJ5dGVMZW5ndGggLSAxXSA9PSBMRikge1xuICAgICAgbGV0IGRyb3AgPSAxO1xuICAgICAgaWYgKGxpbmUuYnl0ZUxlbmd0aCA+IDEgJiYgbGluZVtsaW5lLmJ5dGVMZW5ndGggLSAyXSA9PT0gQ1IpIHtcbiAgICAgICAgZHJvcCA9IDI7XG4gICAgICB9XG4gICAgICBsaW5lID0gbGluZS5zdWJhcnJheSgwLCBsaW5lLmJ5dGVMZW5ndGggLSBkcm9wKTtcbiAgICB9XG4gICAgcmV0dXJuIHsgbGluZSwgbW9yZTogZmFsc2UgfTtcbiAgfVxuXG4gIC8qKiBgcmVhZFNsaWNlKClgIHJlYWRzIHVudGlsIHRoZSBmaXJzdCBvY2N1cnJlbmNlIG9mIGBkZWxpbWAgaW4gdGhlIGlucHV0LFxuICAgKiByZXR1cm5pbmcgYSBzbGljZSBwb2ludGluZyBhdCB0aGUgYnl0ZXMgaW4gdGhlIGJ1ZmZlci4gVGhlIGJ5dGVzIHN0b3BcbiAgICogYmVpbmcgdmFsaWQgYXQgdGhlIG5leHQgcmVhZC5cbiAgICpcbiAgICogSWYgYHJlYWRTbGljZSgpYCBlbmNvdW50ZXJzIGFuIGVycm9yIGJlZm9yZSBmaW5kaW5nIGEgZGVsaW1pdGVyLCBvciB0aGVcbiAgICogYnVmZmVyIGZpbGxzIHdpdGhvdXQgZmluZGluZyBhIGRlbGltaXRlciwgaXQgdGhyb3dzIGFuIGVycm9yIHdpdGggYVxuICAgKiBgcGFydGlhbGAgcHJvcGVydHkgdGhhdCBjb250YWlucyB0aGUgZW50aXJlIGJ1ZmZlci5cbiAgICpcbiAgICogSWYgYHJlYWRTbGljZSgpYCBlbmNvdW50ZXJzIHRoZSBlbmQgb2YgdGhlIHVuZGVybHlpbmcgc3RyZWFtIGFuZCB0aGVyZSBhcmVcbiAgICogYW55IGJ5dGVzIGxlZnQgaW4gdGhlIGJ1ZmZlciwgdGhlIHJlc3Qgb2YgdGhlIGJ1ZmZlciBpcyByZXR1cm5lZC4gSW4gb3RoZXJcbiAgICogd29yZHMsIEVPRiBpcyBhbHdheXMgdHJlYXRlZCBhcyBhIGRlbGltaXRlci4gT25jZSB0aGUgYnVmZmVyIGlzIGVtcHR5LFxuICAgKiBpdCByZXR1cm5zIGBudWxsYC5cbiAgICpcbiAgICogQmVjYXVzZSB0aGUgZGF0YSByZXR1cm5lZCBmcm9tIGByZWFkU2xpY2UoKWAgd2lsbCBiZSBvdmVyd3JpdHRlbiBieSB0aGVcbiAgICogbmV4dCBJL08gb3BlcmF0aW9uLCBtb3N0IGNsaWVudHMgc2hvdWxkIHVzZSBgcmVhZFN0cmluZygpYCBpbnN0ZWFkLlxuICAgKi9cbiAgYXN5bmMgcmVhZFNsaWNlKGRlbGltOiBudW1iZXIpOiBQcm9taXNlPFVpbnQ4QXJyYXkgfCBudWxsPiB7XG4gICAgbGV0IHMgPSAwOyAvLyBzZWFyY2ggc3RhcnQgaW5kZXhcbiAgICBsZXQgc2xpY2U6IFVpbnQ4QXJyYXkgfCB1bmRlZmluZWQ7XG5cbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgLy8gU2VhcmNoIGJ1ZmZlci5cbiAgICAgIGxldCBpID0gdGhpcy5idWYuc3ViYXJyYXkodGhpcy5yICsgcywgdGhpcy53KS5pbmRleE9mKGRlbGltKTtcbiAgICAgIGlmIChpID49IDApIHtcbiAgICAgICAgaSArPSBzO1xuICAgICAgICBzbGljZSA9IHRoaXMuYnVmLnN1YmFycmF5KHRoaXMuciwgdGhpcy5yICsgaSArIDEpO1xuICAgICAgICB0aGlzLnIgKz0gaSArIDE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBFT0Y/XG4gICAgICBpZiAodGhpcy5lb2YpIHtcbiAgICAgICAgaWYgKHRoaXMuciA9PT0gdGhpcy53KSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgc2xpY2UgPSB0aGlzLmJ1Zi5zdWJhcnJheSh0aGlzLnIsIHRoaXMudyk7XG4gICAgICAgIHRoaXMuciA9IHRoaXMudztcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIEJ1ZmZlciBmdWxsP1xuICAgICAgaWYgKHRoaXMuYnVmZmVyZWQoKSA+PSB0aGlzLmJ1Zi5ieXRlTGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuciA9IHRoaXMudztcbiAgICAgICAgLy8gIzQ1MjEgVGhlIGludGVybmFsIGJ1ZmZlciBzaG91bGQgbm90IGJlIHJldXNlZCBhY3Jvc3MgcmVhZHMgYmVjYXVzZSBpdCBjYXVzZXMgY29ycnVwdGlvbiBvZiBkYXRhLlxuICAgICAgICBjb25zdCBvbGRidWYgPSB0aGlzLmJ1ZjtcbiAgICAgICAgY29uc3QgbmV3YnVmID0gdGhpcy5idWYuc2xpY2UoMCk7XG4gICAgICAgIHRoaXMuYnVmID0gbmV3YnVmO1xuICAgICAgICB0aHJvdyBuZXcgQnVmZmVyRnVsbEVycm9yKG9sZGJ1Zik7XG4gICAgICB9XG5cbiAgICAgIHMgPSB0aGlzLncgLSB0aGlzLnI7IC8vIGRvIG5vdCByZXNjYW4gYXJlYSB3ZSBzY2FubmVkIGJlZm9yZVxuXG4gICAgICAvLyBCdWZmZXIgaXMgbm90IGZ1bGwuXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCB0aGlzLl9maWxsKCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgZXJyLnBhcnRpYWwgPSBzbGljZTtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEhhbmRsZSBsYXN0IGJ5dGUsIGlmIGFueS5cbiAgICAvLyBjb25zdCBpID0gc2xpY2UuYnl0ZUxlbmd0aCAtIDE7XG4gICAgLy8gaWYgKGkgPj0gMCkge1xuICAgIC8vICAgdGhpcy5sYXN0Qnl0ZSA9IHNsaWNlW2ldO1xuICAgIC8vICAgdGhpcy5sYXN0Q2hhclNpemUgPSAtMVxuICAgIC8vIH1cblxuICAgIHJldHVybiBzbGljZTtcbiAgfVxuXG4gIC8qKiBgcGVlaygpYCByZXR1cm5zIHRoZSBuZXh0IGBuYCBieXRlcyB3aXRob3V0IGFkdmFuY2luZyB0aGUgcmVhZGVyLiBUaGVcbiAgICogYnl0ZXMgc3RvcCBiZWluZyB2YWxpZCBhdCB0aGUgbmV4dCByZWFkIGNhbGwuXG4gICAqXG4gICAqIFdoZW4gdGhlIGVuZCBvZiB0aGUgdW5kZXJseWluZyBzdHJlYW0gaXMgcmVhY2hlZCwgYnV0IHRoZXJlIGFyZSB1bnJlYWRcbiAgICogYnl0ZXMgbGVmdCBpbiB0aGUgYnVmZmVyLCB0aG9zZSBieXRlcyBhcmUgcmV0dXJuZWQuIElmIHRoZXJlIGFyZSBubyBieXRlc1xuICAgKiBsZWZ0IGluIHRoZSBidWZmZXIsIGl0IHJldHVybnMgYG51bGxgLlxuICAgKlxuICAgKiBJZiBhbiBlcnJvciBpcyBlbmNvdW50ZXJlZCBiZWZvcmUgYG5gIGJ5dGVzIGFyZSBhdmFpbGFibGUsIGBwZWVrKClgIHRocm93c1xuICAgKiBhbiBlcnJvciB3aXRoIHRoZSBgcGFydGlhbGAgcHJvcGVydHkgc2V0IHRvIGEgc2xpY2Ugb2YgdGhlIGJ1ZmZlciB0aGF0XG4gICAqIGNvbnRhaW5zIHRoZSBieXRlcyB0aGF0IHdlcmUgYXZhaWxhYmxlIGJlZm9yZSB0aGUgZXJyb3Igb2NjdXJyZWQuXG4gICAqL1xuICBhc3luYyBwZWVrKG46IG51bWJlcik6IFByb21pc2U8VWludDhBcnJheSB8IG51bGw+IHtcbiAgICBpZiAobiA8IDApIHtcbiAgICAgIHRocm93IEVycm9yKFwibmVnYXRpdmUgY291bnRcIik7XG4gICAgfVxuXG4gICAgbGV0IGF2YWlsID0gdGhpcy53IC0gdGhpcy5yO1xuICAgIHdoaWxlIChhdmFpbCA8IG4gJiYgYXZhaWwgPCB0aGlzLmJ1Zi5ieXRlTGVuZ3RoICYmICF0aGlzLmVvZikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgdGhpcy5fZmlsbCgpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGVyci5wYXJ0aWFsID0gdGhpcy5idWYuc3ViYXJyYXkodGhpcy5yLCB0aGlzLncpO1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG4gICAgICBhdmFpbCA9IHRoaXMudyAtIHRoaXMucjtcbiAgICB9XG5cbiAgICBpZiAoYXZhaWwgPT09IDAgJiYgdGhpcy5lb2YpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0gZWxzZSBpZiAoYXZhaWwgPCBuICYmIHRoaXMuZW9mKSB7XG4gICAgICByZXR1cm4gdGhpcy5idWYuc3ViYXJyYXkodGhpcy5yLCB0aGlzLnIgKyBhdmFpbCk7XG4gICAgfSBlbHNlIGlmIChhdmFpbCA8IG4pIHtcbiAgICAgIHRocm93IG5ldyBCdWZmZXJGdWxsRXJyb3IodGhpcy5idWYuc3ViYXJyYXkodGhpcy5yLCB0aGlzLncpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5idWYuc3ViYXJyYXkodGhpcy5yLCB0aGlzLnIgKyBuKTtcbiAgfVxufVxuXG5hYnN0cmFjdCBjbGFzcyBBYnN0cmFjdEJ1ZkJhc2Uge1xuICBidWYhOiBVaW50OEFycmF5O1xuICB1c2VkQnVmZmVyQnl0ZXMgPSAwO1xuICBlcnI6IEVycm9yIHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqIFNpemUgcmV0dXJucyB0aGUgc2l6ZSBvZiB0aGUgdW5kZXJseWluZyBidWZmZXIgaW4gYnl0ZXMuICovXG4gIHNpemUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5idWYuYnl0ZUxlbmd0aDtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIGhvdyBtYW55IGJ5dGVzIGFyZSB1bnVzZWQgaW4gdGhlIGJ1ZmZlci4gKi9cbiAgYXZhaWxhYmxlKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuYnVmLmJ5dGVMZW5ndGggLSB0aGlzLnVzZWRCdWZmZXJCeXRlcztcbiAgfVxuXG4gIC8qKiBidWZmZXJlZCByZXR1cm5zIHRoZSBudW1iZXIgb2YgYnl0ZXMgdGhhdCBoYXZlIGJlZW4gd3JpdHRlbiBpbnRvIHRoZVxuICAgKiBjdXJyZW50IGJ1ZmZlci5cbiAgICovXG4gIGJ1ZmZlcmVkKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMudXNlZEJ1ZmZlckJ5dGVzO1xuICB9XG59XG5cbi8qKiBCdWZXcml0ZXIgaW1wbGVtZW50cyBidWZmZXJpbmcgZm9yIGFuIGRlbm8uV3JpdGVyIG9iamVjdC5cbiAqIElmIGFuIGVycm9yIG9jY3VycyB3cml0aW5nIHRvIGEgV3JpdGVyLCBubyBtb3JlIGRhdGEgd2lsbCBiZVxuICogYWNjZXB0ZWQgYW5kIGFsbCBzdWJzZXF1ZW50IHdyaXRlcywgYW5kIGZsdXNoKCksIHdpbGwgcmV0dXJuIHRoZSBlcnJvci5cbiAqIEFmdGVyIGFsbCBkYXRhIGhhcyBiZWVuIHdyaXR0ZW4sIHRoZSBjbGllbnQgc2hvdWxkIGNhbGwgdGhlXG4gKiBmbHVzaCgpIG1ldGhvZCB0byBndWFyYW50ZWUgYWxsIGRhdGEgaGFzIGJlZW4gZm9yd2FyZGVkIHRvXG4gKiB0aGUgdW5kZXJseWluZyBkZW5vLldyaXRlci5cbiAqL1xuZXhwb3J0IGNsYXNzIEJ1ZldyaXRlciBleHRlbmRzIEFic3RyYWN0QnVmQmFzZSBpbXBsZW1lbnRzIFdyaXRlciB7XG4gIC8qKiByZXR1cm4gbmV3IEJ1ZldyaXRlciB1bmxlc3Mgd3JpdGVyIGlzIEJ1ZldyaXRlciAqL1xuICBzdGF0aWMgY3JlYXRlKHdyaXRlcjogV3JpdGVyLCBzaXplOiBudW1iZXIgPSBERUZBVUxUX0JVRl9TSVpFKTogQnVmV3JpdGVyIHtcbiAgICByZXR1cm4gd3JpdGVyIGluc3RhbmNlb2YgQnVmV3JpdGVyID8gd3JpdGVyIDogbmV3IEJ1ZldyaXRlcih3cml0ZXIsIHNpemUpO1xuICB9XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSB3cml0ZXI6IFdyaXRlciwgc2l6ZTogbnVtYmVyID0gREVGQVVMVF9CVUZfU0laRSkge1xuICAgIHN1cGVyKCk7XG4gICAgaWYgKHNpemUgPD0gMCkge1xuICAgICAgc2l6ZSA9IERFRkFVTFRfQlVGX1NJWkU7XG4gICAgfVxuICAgIHRoaXMuYnVmID0gbmV3IFVpbnQ4QXJyYXkoc2l6ZSk7XG4gIH1cblxuICAvKiogRGlzY2FyZHMgYW55IHVuZmx1c2hlZCBidWZmZXJlZCBkYXRhLCBjbGVhcnMgYW55IGVycm9yLCBhbmRcbiAgICogcmVzZXRzIGJ1ZmZlciB0byB3cml0ZSBpdHMgb3V0cHV0IHRvIHcuXG4gICAqL1xuICByZXNldCh3OiBXcml0ZXIpOiB2b2lkIHtcbiAgICB0aGlzLmVyciA9IG51bGw7XG4gICAgdGhpcy51c2VkQnVmZmVyQnl0ZXMgPSAwO1xuICAgIHRoaXMud3JpdGVyID0gdztcbiAgfVxuXG4gIC8qKiBGbHVzaCB3cml0ZXMgYW55IGJ1ZmZlcmVkIGRhdGEgdG8gdGhlIHVuZGVybHlpbmcgaW8uV3JpdGVyLiAqL1xuICBhc3luYyBmbHVzaCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5lcnIgIT09IG51bGwpIHRocm93IHRoaXMuZXJyO1xuICAgIGlmICh0aGlzLnVzZWRCdWZmZXJCeXRlcyA9PT0gMCkgcmV0dXJuO1xuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IERlbm8ud3JpdGVBbGwoXG4gICAgICAgIHRoaXMud3JpdGVyLFxuICAgICAgICB0aGlzLmJ1Zi5zdWJhcnJheSgwLCB0aGlzLnVzZWRCdWZmZXJCeXRlcyksXG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRoaXMuZXJyID0gZTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuXG4gICAgdGhpcy5idWYgPSBuZXcgVWludDhBcnJheSh0aGlzLmJ1Zi5sZW5ndGgpO1xuICAgIHRoaXMudXNlZEJ1ZmZlckJ5dGVzID0gMDtcbiAgfVxuXG4gIC8qKiBXcml0ZXMgdGhlIGNvbnRlbnRzIG9mIGBkYXRhYCBpbnRvIHRoZSBidWZmZXIuICBJZiB0aGUgY29udGVudHMgd29uJ3QgZnVsbHlcbiAgICogZml0IGludG8gdGhlIGJ1ZmZlciwgdGhvc2UgYnl0ZXMgdGhhdCBjYW4gYXJlIGNvcGllZCBpbnRvIHRoZSBidWZmZXIsIHRoZVxuICAgKiBidWZmZXIgaXMgdGhlIGZsdXNoZWQgdG8gdGhlIHdyaXRlciBhbmQgdGhlIHJlbWFpbmluZyBieXRlcyBhcmUgY29waWVkIGludG9cbiAgICogdGhlIG5vdyBlbXB0eSBidWZmZXIuXG4gICAqXG4gICAqIEByZXR1cm4gdGhlIG51bWJlciBvZiBieXRlcyB3cml0dGVuIHRvIHRoZSBidWZmZXIuXG4gICAqL1xuICBhc3luYyB3cml0ZShkYXRhOiBVaW50OEFycmF5KTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5lcnIgIT09IG51bGwpIHRocm93IHRoaXMuZXJyO1xuICAgIGlmIChkYXRhLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDA7XG5cbiAgICBsZXQgdG90YWxCeXRlc1dyaXR0ZW4gPSAwO1xuICAgIGxldCBudW1CeXRlc1dyaXR0ZW4gPSAwO1xuICAgIHdoaWxlIChkYXRhLmJ5dGVMZW5ndGggPiB0aGlzLmF2YWlsYWJsZSgpKSB7XG4gICAgICBpZiAodGhpcy5idWZmZXJlZCgpID09PSAwKSB7XG4gICAgICAgIC8vIExhcmdlIHdyaXRlLCBlbXB0eSBidWZmZXIuXG4gICAgICAgIC8vIFdyaXRlIGRpcmVjdGx5IGZyb20gZGF0YSB0byBhdm9pZCBjb3B5LlxuICAgICAgICB0cnkge1xuICAgICAgICAgIG51bUJ5dGVzV3JpdHRlbiA9IGF3YWl0IHRoaXMud3JpdGVyLndyaXRlKGRhdGEpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgdGhpcy5lcnIgPSBlO1xuICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG51bUJ5dGVzV3JpdHRlbiA9IGNvcHlCeXRlcyhkYXRhLCB0aGlzLmJ1ZiwgdGhpcy51c2VkQnVmZmVyQnl0ZXMpO1xuICAgICAgICB0aGlzLnVzZWRCdWZmZXJCeXRlcyArPSBudW1CeXRlc1dyaXR0ZW47XG4gICAgICAgIGF3YWl0IHRoaXMuZmx1c2goKTtcbiAgICAgIH1cbiAgICAgIHRvdGFsQnl0ZXNXcml0dGVuICs9IG51bUJ5dGVzV3JpdHRlbjtcbiAgICAgIGRhdGEgPSBkYXRhLnN1YmFycmF5KG51bUJ5dGVzV3JpdHRlbik7XG4gICAgfVxuXG4gICAgbnVtQnl0ZXNXcml0dGVuID0gY29weUJ5dGVzKGRhdGEsIHRoaXMuYnVmLCB0aGlzLnVzZWRCdWZmZXJCeXRlcyk7XG4gICAgdGhpcy51c2VkQnVmZmVyQnl0ZXMgKz0gbnVtQnl0ZXNXcml0dGVuO1xuICAgIHRvdGFsQnl0ZXNXcml0dGVuICs9IG51bUJ5dGVzV3JpdHRlbjtcbiAgICByZXR1cm4gdG90YWxCeXRlc1dyaXR0ZW47XG4gIH1cbn1cblxuLyoqIEJ1ZldyaXRlclN5bmMgaW1wbGVtZW50cyBidWZmZXJpbmcgZm9yIGEgZGVuby5Xcml0ZXJTeW5jIG9iamVjdC5cbiAqIElmIGFuIGVycm9yIG9jY3VycyB3cml0aW5nIHRvIGEgV3JpdGVyU3luYywgbm8gbW9yZSBkYXRhIHdpbGwgYmVcbiAqIGFjY2VwdGVkIGFuZCBhbGwgc3Vic2VxdWVudCB3cml0ZXMsIGFuZCBmbHVzaCgpLCB3aWxsIHJldHVybiB0aGUgZXJyb3IuXG4gKiBBZnRlciBhbGwgZGF0YSBoYXMgYmVlbiB3cml0dGVuLCB0aGUgY2xpZW50IHNob3VsZCBjYWxsIHRoZVxuICogZmx1c2goKSBtZXRob2QgdG8gZ3VhcmFudGVlIGFsbCBkYXRhIGhhcyBiZWVuIGZvcndhcmRlZCB0b1xuICogdGhlIHVuZGVybHlpbmcgZGVuby5Xcml0ZXJTeW5jLlxuICovXG5leHBvcnQgY2xhc3MgQnVmV3JpdGVyU3luYyBleHRlbmRzIEFic3RyYWN0QnVmQmFzZSBpbXBsZW1lbnRzIFdyaXRlclN5bmMge1xuICAvKiogcmV0dXJuIG5ldyBCdWZXcml0ZXJTeW5jIHVubGVzcyB3cml0ZXIgaXMgQnVmV3JpdGVyU3luYyAqL1xuICBzdGF0aWMgY3JlYXRlKFxuICAgIHdyaXRlcjogV3JpdGVyU3luYyxcbiAgICBzaXplOiBudW1iZXIgPSBERUZBVUxUX0JVRl9TSVpFLFxuICApOiBCdWZXcml0ZXJTeW5jIHtcbiAgICByZXR1cm4gd3JpdGVyIGluc3RhbmNlb2YgQnVmV3JpdGVyU3luY1xuICAgICAgPyB3cml0ZXJcbiAgICAgIDogbmV3IEJ1ZldyaXRlclN5bmMod3JpdGVyLCBzaXplKTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgd3JpdGVyOiBXcml0ZXJTeW5jLCBzaXplOiBudW1iZXIgPSBERUZBVUxUX0JVRl9TSVpFKSB7XG4gICAgc3VwZXIoKTtcbiAgICBpZiAoc2l6ZSA8PSAwKSB7XG4gICAgICBzaXplID0gREVGQVVMVF9CVUZfU0laRTtcbiAgICB9XG4gICAgdGhpcy5idWYgPSBuZXcgVWludDhBcnJheShzaXplKTtcbiAgfVxuXG4gIC8qKiBEaXNjYXJkcyBhbnkgdW5mbHVzaGVkIGJ1ZmZlcmVkIGRhdGEsIGNsZWFycyBhbnkgZXJyb3IsIGFuZFxuICAgKiByZXNldHMgYnVmZmVyIHRvIHdyaXRlIGl0cyBvdXRwdXQgdG8gdy5cbiAgICovXG4gIHJlc2V0KHc6IFdyaXRlclN5bmMpOiB2b2lkIHtcbiAgICB0aGlzLmVyciA9IG51bGw7XG4gICAgdGhpcy51c2VkQnVmZmVyQnl0ZXMgPSAwO1xuICAgIHRoaXMud3JpdGVyID0gdztcbiAgfVxuXG4gIC8qKiBGbHVzaCB3cml0ZXMgYW55IGJ1ZmZlcmVkIGRhdGEgdG8gdGhlIHVuZGVybHlpbmcgaW8uV3JpdGVyU3luYy4gKi9cbiAgZmx1c2goKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuZXJyICE9PSBudWxsKSB0aHJvdyB0aGlzLmVycjtcbiAgICBpZiAodGhpcy51c2VkQnVmZmVyQnl0ZXMgPT09IDApIHJldHVybjtcblxuICAgIHRyeSB7XG4gICAgICBEZW5vLndyaXRlQWxsU3luYyhcbiAgICAgICAgdGhpcy53cml0ZXIsXG4gICAgICAgIHRoaXMuYnVmLnN1YmFycmF5KDAsIHRoaXMudXNlZEJ1ZmZlckJ5dGVzKSxcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhpcy5lcnIgPSBlO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG5cbiAgICB0aGlzLmJ1ZiA9IG5ldyBVaW50OEFycmF5KHRoaXMuYnVmLmxlbmd0aCk7XG4gICAgdGhpcy51c2VkQnVmZmVyQnl0ZXMgPSAwO1xuICB9XG5cbiAgLyoqIFdyaXRlcyB0aGUgY29udGVudHMgb2YgYGRhdGFgIGludG8gdGhlIGJ1ZmZlci4gIElmIHRoZSBjb250ZW50cyB3b24ndCBmdWxseVxuICAgKiBmaXQgaW50byB0aGUgYnVmZmVyLCB0aG9zZSBieXRlcyB0aGF0IGNhbiBhcmUgY29waWVkIGludG8gdGhlIGJ1ZmZlciwgdGhlXG4gICAqIGJ1ZmZlciBpcyB0aGUgZmx1c2hlZCB0byB0aGUgd3JpdGVyIGFuZCB0aGUgcmVtYWluaW5nIGJ5dGVzIGFyZSBjb3BpZWQgaW50b1xuICAgKiB0aGUgbm93IGVtcHR5IGJ1ZmZlci5cbiAgICpcbiAgICogQHJldHVybiB0aGUgbnVtYmVyIG9mIGJ5dGVzIHdyaXR0ZW4gdG8gdGhlIGJ1ZmZlci5cbiAgICovXG4gIHdyaXRlU3luYyhkYXRhOiBVaW50OEFycmF5KTogbnVtYmVyIHtcbiAgICBpZiAodGhpcy5lcnIgIT09IG51bGwpIHRocm93IHRoaXMuZXJyO1xuICAgIGlmIChkYXRhLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDA7XG5cbiAgICBsZXQgdG90YWxCeXRlc1dyaXR0ZW4gPSAwO1xuICAgIGxldCBudW1CeXRlc1dyaXR0ZW4gPSAwO1xuICAgIHdoaWxlIChkYXRhLmJ5dGVMZW5ndGggPiB0aGlzLmF2YWlsYWJsZSgpKSB7XG4gICAgICBpZiAodGhpcy5idWZmZXJlZCgpID09PSAwKSB7XG4gICAgICAgIC8vIExhcmdlIHdyaXRlLCBlbXB0eSBidWZmZXIuXG4gICAgICAgIC8vIFdyaXRlIGRpcmVjdGx5IGZyb20gZGF0YSB0byBhdm9pZCBjb3B5LlxuICAgICAgICB0cnkge1xuICAgICAgICAgIG51bUJ5dGVzV3JpdHRlbiA9IHRoaXMud3JpdGVyLndyaXRlU3luYyhkYXRhKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHRoaXMuZXJyID0gZTtcbiAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBudW1CeXRlc1dyaXR0ZW4gPSBjb3B5Qnl0ZXMoZGF0YSwgdGhpcy5idWYsIHRoaXMudXNlZEJ1ZmZlckJ5dGVzKTtcbiAgICAgICAgdGhpcy51c2VkQnVmZmVyQnl0ZXMgKz0gbnVtQnl0ZXNXcml0dGVuO1xuICAgICAgICB0aGlzLmZsdXNoKCk7XG4gICAgICB9XG4gICAgICB0b3RhbEJ5dGVzV3JpdHRlbiArPSBudW1CeXRlc1dyaXR0ZW47XG4gICAgICBkYXRhID0gZGF0YS5zdWJhcnJheShudW1CeXRlc1dyaXR0ZW4pO1xuICAgIH1cblxuICAgIG51bUJ5dGVzV3JpdHRlbiA9IGNvcHlCeXRlcyhkYXRhLCB0aGlzLmJ1ZiwgdGhpcy51c2VkQnVmZmVyQnl0ZXMpO1xuICAgIHRoaXMudXNlZEJ1ZmZlckJ5dGVzICs9IG51bUJ5dGVzV3JpdHRlbjtcbiAgICB0b3RhbEJ5dGVzV3JpdHRlbiArPSBudW1CeXRlc1dyaXR0ZW47XG4gICAgcmV0dXJuIHRvdGFsQnl0ZXNXcml0dGVuO1xuICB9XG59XG5cbi8qKiBHZW5lcmF0ZSBsb25nZXN0IHByb3BlciBwcmVmaXggd2hpY2ggaXMgYWxzbyBzdWZmaXggYXJyYXkuICovXG5mdW5jdGlvbiBjcmVhdGVMUFMocGF0OiBVaW50OEFycmF5KTogVWludDhBcnJheSB7XG4gIGNvbnN0IGxwcyA9IG5ldyBVaW50OEFycmF5KHBhdC5sZW5ndGgpO1xuICBscHNbMF0gPSAwO1xuICBsZXQgcHJlZml4RW5kID0gMDtcbiAgbGV0IGkgPSAxO1xuICB3aGlsZSAoaSA8IGxwcy5sZW5ndGgpIHtcbiAgICBpZiAocGF0W2ldID09IHBhdFtwcmVmaXhFbmRdKSB7XG4gICAgICBwcmVmaXhFbmQrKztcbiAgICAgIGxwc1tpXSA9IHByZWZpeEVuZDtcbiAgICAgIGkrKztcbiAgICB9IGVsc2UgaWYgKHByZWZpeEVuZCA9PT0gMCkge1xuICAgICAgbHBzW2ldID0gMDtcbiAgICAgIGkrKztcbiAgICB9IGVsc2Uge1xuICAgICAgcHJlZml4RW5kID0gcGF0W3ByZWZpeEVuZCAtIDFdO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbHBzO1xufVxuXG4vKiogUmVhZCBkZWxpbWl0ZWQgYnl0ZXMgZnJvbSBhIFJlYWRlci4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiogcmVhZERlbGltKFxuICByZWFkZXI6IFJlYWRlcixcbiAgZGVsaW06IFVpbnQ4QXJyYXksXG4pOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8VWludDhBcnJheT4ge1xuICAvLyBBdm9pZCB1bmljb2RlIHByb2JsZW1zXG4gIGNvbnN0IGRlbGltTGVuID0gZGVsaW0ubGVuZ3RoO1xuICBjb25zdCBkZWxpbUxQUyA9IGNyZWF0ZUxQUyhkZWxpbSk7XG5cbiAgbGV0IGlucHV0QnVmZmVyID0gbmV3IERlbm8uQnVmZmVyKCk7XG4gIGNvbnN0IGluc3BlY3RBcnIgPSBuZXcgVWludDhBcnJheShNYXRoLm1heCgxMDI0LCBkZWxpbUxlbiArIDEpKTtcblxuICAvLyBNb2RpZmllZCBLTVBcbiAgbGV0IGluc3BlY3RJbmRleCA9IDA7XG4gIGxldCBtYXRjaEluZGV4ID0gMDtcbiAgd2hpbGUgKHRydWUpIHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZWFkZXIucmVhZChpbnNwZWN0QXJyKTtcbiAgICBpZiAocmVzdWx0ID09PSBudWxsKSB7XG4gICAgICAvLyBZaWVsZCBsYXN0IGNodW5rLlxuICAgICAgeWllbGQgaW5wdXRCdWZmZXIuYnl0ZXMoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKChyZXN1bHQgYXMgbnVtYmVyKSA8IDApIHtcbiAgICAgIC8vIERpc2NhcmQgYWxsIHJlbWFpbmluZyBhbmQgc2lsZW50bHkgZmFpbC5cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc2xpY2VSZWFkID0gaW5zcGVjdEFyci5zdWJhcnJheSgwLCByZXN1bHQgYXMgbnVtYmVyKTtcbiAgICBhd2FpdCBEZW5vLndyaXRlQWxsKGlucHV0QnVmZmVyLCBzbGljZVJlYWQpO1xuXG4gICAgbGV0IHNsaWNlVG9Qcm9jZXNzID0gaW5wdXRCdWZmZXIuYnl0ZXMoKTtcbiAgICB3aGlsZSAoaW5zcGVjdEluZGV4IDwgc2xpY2VUb1Byb2Nlc3MubGVuZ3RoKSB7XG4gICAgICBpZiAoc2xpY2VUb1Byb2Nlc3NbaW5zcGVjdEluZGV4XSA9PT0gZGVsaW1bbWF0Y2hJbmRleF0pIHtcbiAgICAgICAgaW5zcGVjdEluZGV4Kys7XG4gICAgICAgIG1hdGNoSW5kZXgrKztcbiAgICAgICAgaWYgKG1hdGNoSW5kZXggPT09IGRlbGltTGVuKSB7XG4gICAgICAgICAgLy8gRnVsbCBtYXRjaFxuICAgICAgICAgIGNvbnN0IG1hdGNoRW5kID0gaW5zcGVjdEluZGV4IC0gZGVsaW1MZW47XG4gICAgICAgICAgY29uc3QgcmVhZHlCeXRlcyA9IHNsaWNlVG9Qcm9jZXNzLnN1YmFycmF5KDAsIG1hdGNoRW5kKTtcbiAgICAgICAgICAvLyBDb3B5XG4gICAgICAgICAgY29uc3QgcGVuZGluZ0J5dGVzID0gc2xpY2VUb1Byb2Nlc3Muc2xpY2UoaW5zcGVjdEluZGV4KTtcbiAgICAgICAgICB5aWVsZCByZWFkeUJ5dGVzO1xuICAgICAgICAgIC8vIFJlc2V0IG1hdGNoLCBkaWZmZXJlbnQgZnJvbSBLTVAuXG4gICAgICAgICAgc2xpY2VUb1Byb2Nlc3MgPSBwZW5kaW5nQnl0ZXM7XG4gICAgICAgICAgaW5zcGVjdEluZGV4ID0gMDtcbiAgICAgICAgICBtYXRjaEluZGV4ID0gMDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKG1hdGNoSW5kZXggPT09IDApIHtcbiAgICAgICAgICBpbnNwZWN0SW5kZXgrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtYXRjaEluZGV4ID0gZGVsaW1MUFNbbWF0Y2hJbmRleCAtIDFdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8vIEtlZXAgaW5zcGVjdEluZGV4IGFuZCBtYXRjaEluZGV4LlxuICAgIGlucHV0QnVmZmVyID0gbmV3IERlbm8uQnVmZmVyKHNsaWNlVG9Qcm9jZXNzKTtcbiAgfVxufVxuXG4vKiogUmVhZCBkZWxpbWl0ZWQgc3RyaW5ncyBmcm9tIGEgUmVhZGVyLiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uKiByZWFkU3RyaW5nRGVsaW0oXG4gIHJlYWRlcjogUmVhZGVyLFxuICBkZWxpbTogc3RyaW5nLFxuKTogQXN5bmNJdGVyYWJsZUl0ZXJhdG9yPHN0cmluZz4ge1xuICBjb25zdCBlbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG4gIGNvbnN0IGRlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoKTtcbiAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiByZWFkRGVsaW0ocmVhZGVyLCBlbmNvZGVyLmVuY29kZShkZWxpbSkpKSB7XG4gICAgeWllbGQgZGVjb2Rlci5kZWNvZGUoY2h1bmspO1xuICB9XG59XG5cbi8qKiBSZWFkIHN0cmluZ3MgbGluZS1ieS1saW5lIGZyb20gYSBSZWFkZXIuICovXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVxdWlyZS1hd2FpdFxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uKiByZWFkTGluZXMoXG4gIHJlYWRlcjogUmVhZGVyLFxuKTogQXN5bmNJdGVyYWJsZUl0ZXJhdG9yPHN0cmluZz4ge1xuICB5aWVsZCogcmVhZFN0cmluZ0RlbGltKHJlYWRlciwgXCJcXG5cIik7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBU1MsU0FBUyxTQUFRLGVBQWlCO1NBQ2xDLE1BQU0sU0FBUSxrQkFBb0I7TUFFckMsZ0JBQWdCLEdBQUcsSUFBSTtNQUN2QixZQUFZLEdBQUcsRUFBRTtNQUNqQiwyQkFBMkIsR0FBRyxHQUFHO01BQ2pDLEVBQUUsSUFBRyxFQUFJLEVBQUMsVUFBVSxDQUFDLENBQUM7TUFDdEIsRUFBRSxJQUFHLEVBQUksRUFBQyxVQUFVLENBQUMsQ0FBQzthQUVmLGVBQWUsU0FBUyxLQUFLO0lBRXJCLE9BQW1CO0lBRHRDLElBQUksSUFBRyxlQUFpQjtnQkFDTCxPQUFtQjtRQUNwQyxLQUFLLEVBQUMsV0FBYTthQURGLE9BQW1CLEdBQW5CLE9BQW1COzs7YUFLM0IsZ0JBQWdCLFNBQVMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhO0lBQzdELElBQUksSUFBRyxnQkFBa0I7SUFDekIsT0FBTzs7UUFFTCxLQUFLLEVBQUMsbURBQXFEOzs7QUFVL0QsRUFBMEQsQUFBMUQsc0RBQTBELEFBQTFELEVBQTBELGNBQzdDLFNBQVM7SUFDWixHQUFHO0lBQ0gsRUFBRTtJQUNGLENBQUMsR0FBRyxDQUFDO0lBQ0wsQ0FBQyxHQUFHLENBQUM7SUFDTCxHQUFHLEdBQUcsS0FBSztJQUNuQixFQUE0QixBQUE1QiwwQkFBNEI7SUFDNUIsRUFBZ0MsQUFBaEMsOEJBQWdDO0lBRWhDLEVBQWlELEFBQWpELDZDQUFpRCxBQUFqRCxFQUFpRCxRQUMxQyxNQUFNLENBQUMsQ0FBUyxFQUFFLElBQVksR0FBRyxnQkFBZ0I7ZUFDL0MsQ0FBQyxZQUFZLFNBQVMsR0FBRyxDQUFDLE9BQU8sU0FBUyxDQUFDLENBQUMsRUFBRSxJQUFJOztnQkFHL0MsRUFBVSxFQUFFLElBQVksR0FBRyxnQkFBZ0I7WUFDakQsSUFBSSxHQUFHLFlBQVk7WUFD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
