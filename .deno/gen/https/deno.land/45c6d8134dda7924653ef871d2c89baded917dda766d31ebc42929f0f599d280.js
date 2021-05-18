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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC42OS4wL2lvL2J1ZmlvLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBCYXNlZCBvbiBodHRwczovL2dpdGh1Yi5jb20vZ29sYW5nL2dvL2Jsb2IvODkxNjgyL3NyYy9idWZpby9idWZpby5nb1xuLy8gQ29weXJpZ2h0IDIwMDkgVGhlIEdvIEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhIEJTRC1zdHlsZVxuLy8gbGljZW5zZSB0aGF0IGNhbiBiZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlLlxuXG50eXBlIFJlYWRlciA9IERlbm8uUmVhZGVyO1xudHlwZSBXcml0ZXIgPSBEZW5vLldyaXRlcjtcbnR5cGUgV3JpdGVyU3luYyA9IERlbm8uV3JpdGVyU3luYztcbmltcG9ydCB7IGNvcHlCeXRlcyB9IGZyb20gXCIuLi9ieXRlcy9tb2QudHNcIjtcbmltcG9ydCB7IGFzc2VydCB9IGZyb20gXCIuLi9fdXRpbC9hc3NlcnQudHNcIjtcblxuY29uc3QgREVGQVVMVF9CVUZfU0laRSA9IDQwOTY7XG5jb25zdCBNSU5fQlVGX1NJWkUgPSAxNjtcbmNvbnN0IE1BWF9DT05TRUNVVElWRV9FTVBUWV9SRUFEUyA9IDEwMDtcbmNvbnN0IENSID0gXCJcXHJcIi5jaGFyQ29kZUF0KDApO1xuY29uc3QgTEYgPSBcIlxcblwiLmNoYXJDb2RlQXQoMCk7XG5cbmV4cG9ydCBjbGFzcyBCdWZmZXJGdWxsRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIG5hbWUgPSBcIkJ1ZmZlckZ1bGxFcnJvclwiO1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgcGFydGlhbDogVWludDhBcnJheSkge1xuICAgIHN1cGVyKFwiQnVmZmVyIGZ1bGxcIik7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFBhcnRpYWxSZWFkRXJyb3IgZXh0ZW5kcyBEZW5vLmVycm9ycy5VbmV4cGVjdGVkRW9mIHtcbiAgbmFtZSA9IFwiUGFydGlhbFJlYWRFcnJvclwiO1xuICBwYXJ0aWFsPzogVWludDhBcnJheTtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFbmNvdW50ZXJlZCBVbmV4cGVjdGVkRW9mLCBkYXRhIG9ubHkgcGFydGlhbGx5IHJlYWRcIik7XG4gIH1cbn1cblxuLyoqIFJlc3VsdCB0eXBlIHJldHVybmVkIGJ5IG9mIEJ1ZlJlYWRlci5yZWFkTGluZSgpLiAqL1xuZXhwb3J0IGludGVyZmFjZSBSZWFkTGluZVJlc3VsdCB7XG4gIGxpbmU6IFVpbnQ4QXJyYXk7XG4gIG1vcmU6IGJvb2xlYW47XG59XG5cbi8qKiBCdWZSZWFkZXIgaW1wbGVtZW50cyBidWZmZXJpbmcgZm9yIGEgUmVhZGVyIG9iamVjdC4gKi9cbmV4cG9ydCBjbGFzcyBCdWZSZWFkZXIgaW1wbGVtZW50cyBSZWFkZXIge1xuICBwcml2YXRlIGJ1ZiE6IFVpbnQ4QXJyYXk7XG4gIHByaXZhdGUgcmQhOiBSZWFkZXI7IC8vIFJlYWRlciBwcm92aWRlZCBieSBjYWxsZXIuXG4gIHByaXZhdGUgciA9IDA7IC8vIGJ1ZiByZWFkIHBvc2l0aW9uLlxuICBwcml2YXRlIHcgPSAwOyAvLyBidWYgd3JpdGUgcG9zaXRpb24uXG4gIHByaXZhdGUgZW9mID0gZmFsc2U7XG4gIC8vIHByaXZhdGUgbGFzdEJ5dGU6IG51bWJlcjtcbiAgLy8gcHJpdmF0ZSBsYXN0Q2hhclNpemU6IG51bWJlcjtcblxuICAvKiogcmV0dXJuIG5ldyBCdWZSZWFkZXIgdW5sZXNzIHIgaXMgQnVmUmVhZGVyICovXG4gIHN0YXRpYyBjcmVhdGUocjogUmVhZGVyLCBzaXplOiBudW1iZXIgPSBERUZBVUxUX0JVRl9TSVpFKTogQnVmUmVhZGVyIHtcbiAgICByZXR1cm4gciBpbnN0YW5jZW9mIEJ1ZlJlYWRlciA/IHIgOiBuZXcgQnVmUmVhZGVyKHIsIHNpemUpO1xuICB9XG5cbiAgY29uc3RydWN0b3IocmQ6IFJlYWRlciwgc2l6ZTogbnVtYmVyID0gREVGQVVMVF9CVUZfU0laRSkge1xuICAgIGlmIChzaXplIDwgTUlOX0JVRl9TSVpFKSB7XG4gICAgICBzaXplID0gTUlOX0JVRl9TSVpFO1xuICAgIH1cbiAgICB0aGlzLl9yZXNldChuZXcgVWludDhBcnJheShzaXplKSwgcmQpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdGhlIHNpemUgb2YgdGhlIHVuZGVybHlpbmcgYnVmZmVyIGluIGJ5dGVzLiAqL1xuICBzaXplKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuYnVmLmJ5dGVMZW5ndGg7XG4gIH1cblxuICBidWZmZXJlZCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLncgLSB0aGlzLnI7XG4gIH1cblxuICAvLyBSZWFkcyBhIG5ldyBjaHVuayBpbnRvIHRoZSBidWZmZXIuXG4gIHByaXZhdGUgYXN5bmMgX2ZpbGwoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gU2xpZGUgZXhpc3RpbmcgZGF0YSB0byBiZWdpbm5pbmcuXG4gICAgaWYgKHRoaXMuciA+IDApIHtcbiAgICAgIHRoaXMuYnVmLmNvcHlXaXRoaW4oMCwgdGhpcy5yLCB0aGlzLncpO1xuICAgICAgdGhpcy53IC09IHRoaXMucjtcbiAgICAgIHRoaXMuciA9IDA7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMudyA+PSB0aGlzLmJ1Zi5ieXRlTGVuZ3RoKSB7XG4gICAgICB0aHJvdyBFcnJvcihcImJ1ZmlvOiB0cmllZCB0byBmaWxsIGZ1bGwgYnVmZmVyXCIpO1xuICAgIH1cblxuICAgIC8vIFJlYWQgbmV3IGRhdGE6IHRyeSBhIGxpbWl0ZWQgbnVtYmVyIG9mIHRpbWVzLlxuICAgIGZvciAobGV0IGkgPSBNQVhfQ09OU0VDVVRJVkVfRU1QVFlfUkVBRFM7IGkgPiAwOyBpLS0pIHtcbiAgICAgIGNvbnN0IHJyID0gYXdhaXQgdGhpcy5yZC5yZWFkKHRoaXMuYnVmLnN1YmFycmF5KHRoaXMudykpO1xuICAgICAgaWYgKHJyID09PSBudWxsKSB7XG4gICAgICAgIHRoaXMuZW9mID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgYXNzZXJ0KHJyID49IDAsIFwibmVnYXRpdmUgcmVhZFwiKTtcbiAgICAgIHRoaXMudyArPSBycjtcbiAgICAgIGlmIChyciA+IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBObyBwcm9ncmVzcyBhZnRlciAke01BWF9DT05TRUNVVElWRV9FTVBUWV9SRUFEU30gcmVhZCgpIGNhbGxzYCxcbiAgICApO1xuICB9XG5cbiAgLyoqIERpc2NhcmRzIGFueSBidWZmZXJlZCBkYXRhLCByZXNldHMgYWxsIHN0YXRlLCBhbmQgc3dpdGNoZXNcbiAgICogdGhlIGJ1ZmZlcmVkIHJlYWRlciB0byByZWFkIGZyb20gci5cbiAgICovXG4gIHJlc2V0KHI6IFJlYWRlcik6IHZvaWQge1xuICAgIHRoaXMuX3Jlc2V0KHRoaXMuYnVmLCByKTtcbiAgfVxuXG4gIHByaXZhdGUgX3Jlc2V0KGJ1ZjogVWludDhBcnJheSwgcmQ6IFJlYWRlcik6IHZvaWQge1xuICAgIHRoaXMuYnVmID0gYnVmO1xuICAgIHRoaXMucmQgPSByZDtcbiAgICB0aGlzLmVvZiA9IGZhbHNlO1xuICAgIC8vIHRoaXMubGFzdEJ5dGUgPSAtMTtcbiAgICAvLyB0aGlzLmxhc3RDaGFyU2l6ZSA9IC0xO1xuICB9XG5cbiAgLyoqIHJlYWRzIGRhdGEgaW50byBwLlxuICAgKiBJdCByZXR1cm5zIHRoZSBudW1iZXIgb2YgYnl0ZXMgcmVhZCBpbnRvIHAuXG4gICAqIFRoZSBieXRlcyBhcmUgdGFrZW4gZnJvbSBhdCBtb3N0IG9uZSBSZWFkIG9uIHRoZSB1bmRlcmx5aW5nIFJlYWRlcixcbiAgICogaGVuY2UgbiBtYXkgYmUgbGVzcyB0aGFuIGxlbihwKS5cbiAgICogVG8gcmVhZCBleGFjdGx5IGxlbihwKSBieXRlcywgdXNlIGlvLlJlYWRGdWxsKGIsIHApLlxuICAgKi9cbiAgYXN5bmMgcmVhZChwOiBVaW50OEFycmF5KTogUHJvbWlzZTxudW1iZXIgfCBudWxsPiB7XG4gICAgbGV0IHJyOiBudW1iZXIgfCBudWxsID0gcC5ieXRlTGVuZ3RoO1xuICAgIGlmIChwLmJ5dGVMZW5ndGggPT09IDApIHJldHVybiBycjtcblxuICAgIGlmICh0aGlzLnIgPT09IHRoaXMudykge1xuICAgICAgaWYgKHAuYnl0ZUxlbmd0aCA+PSB0aGlzLmJ1Zi5ieXRlTGVuZ3RoKSB7XG4gICAgICAgIC8vIExhcmdlIHJlYWQsIGVtcHR5IGJ1ZmZlci5cbiAgICAgICAgLy8gUmVhZCBkaXJlY3RseSBpbnRvIHAgdG8gYXZvaWQgY29weS5cbiAgICAgICAgY29uc3QgcnIgPSBhd2FpdCB0aGlzLnJkLnJlYWQocCk7XG4gICAgICAgIGNvbnN0IG5yZWFkID0gcnIgPz8gMDtcbiAgICAgICAgYXNzZXJ0KG5yZWFkID49IDAsIFwibmVnYXRpdmUgcmVhZFwiKTtcbiAgICAgICAgLy8gaWYgKHJyLm5yZWFkID4gMCkge1xuICAgICAgICAvLyAgIHRoaXMubGFzdEJ5dGUgPSBwW3JyLm5yZWFkIC0gMV07XG4gICAgICAgIC8vICAgdGhpcy5sYXN0Q2hhclNpemUgPSAtMTtcbiAgICAgICAgLy8gfVxuICAgICAgICByZXR1cm4gcnI7XG4gICAgICB9XG5cbiAgICAgIC8vIE9uZSByZWFkLlxuICAgICAgLy8gRG8gbm90IHVzZSB0aGlzLmZpbGwsIHdoaWNoIHdpbGwgbG9vcC5cbiAgICAgIHRoaXMuciA9IDA7XG4gICAgICB0aGlzLncgPSAwO1xuICAgICAgcnIgPSBhd2FpdCB0aGlzLnJkLnJlYWQodGhpcy5idWYpO1xuICAgICAgaWYgKHJyID09PSAwIHx8IHJyID09PSBudWxsKSByZXR1cm4gcnI7XG4gICAgICBhc3NlcnQocnIgPj0gMCwgXCJuZWdhdGl2ZSByZWFkXCIpO1xuICAgICAgdGhpcy53ICs9IHJyO1xuICAgIH1cblxuICAgIC8vIGNvcHkgYXMgbXVjaCBhcyB3ZSBjYW5cbiAgICBjb25zdCBjb3BpZWQgPSBjb3B5Qnl0ZXModGhpcy5idWYuc3ViYXJyYXkodGhpcy5yLCB0aGlzLncpLCBwLCAwKTtcbiAgICB0aGlzLnIgKz0gY29waWVkO1xuICAgIC8vIHRoaXMubGFzdEJ5dGUgPSB0aGlzLmJ1Zlt0aGlzLnIgLSAxXTtcbiAgICAvLyB0aGlzLmxhc3RDaGFyU2l6ZSA9IC0xO1xuICAgIHJldHVybiBjb3BpZWQ7XG4gIH1cblxuICAvKiogcmVhZHMgZXhhY3RseSBgcC5sZW5ndGhgIGJ5dGVzIGludG8gYHBgLlxuICAgKlxuICAgKiBJZiBzdWNjZXNzZnVsLCBgcGAgaXMgcmV0dXJuZWQuXG4gICAqXG4gICAqIElmIHRoZSBlbmQgb2YgdGhlIHVuZGVybHlpbmcgc3RyZWFtIGhhcyBiZWVuIHJlYWNoZWQsIGFuZCB0aGVyZSBhcmUgbm8gbW9yZVxuICAgKiBieXRlcyBhdmFpbGFibGUgaW4gdGhlIGJ1ZmZlciwgYHJlYWRGdWxsKClgIHJldHVybnMgYG51bGxgIGluc3RlYWQuXG4gICAqXG4gICAqIEFuIGVycm9yIGlzIHRocm93biBpZiBzb21lIGJ5dGVzIGNvdWxkIGJlIHJlYWQsIGJ1dCBub3QgZW5vdWdoIHRvIGZpbGwgYHBgXG4gICAqIGVudGlyZWx5IGJlZm9yZSB0aGUgdW5kZXJseWluZyBzdHJlYW0gcmVwb3J0ZWQgYW4gZXJyb3Igb3IgRU9GLiBBbnkgZXJyb3JcbiAgICogdGhyb3duIHdpbGwgaGF2ZSBhIGBwYXJ0aWFsYCBwcm9wZXJ0eSB0aGF0IGluZGljYXRlcyB0aGUgc2xpY2Ugb2YgdGhlXG4gICAqIGJ1ZmZlciB0aGF0IGhhcyBiZWVuIHN1Y2Nlc3NmdWxseSBmaWxsZWQgd2l0aCBkYXRhLlxuICAgKlxuICAgKiBQb3J0ZWQgZnJvbSBodHRwczovL2dvbGFuZy5vcmcvcGtnL2lvLyNSZWFkRnVsbFxuICAgKi9cbiAgYXN5bmMgcmVhZEZ1bGwocDogVWludDhBcnJheSk6IFByb21pc2U8VWludDhBcnJheSB8IG51bGw+IHtcbiAgICBsZXQgYnl0ZXNSZWFkID0gMDtcbiAgICB3aGlsZSAoYnl0ZXNSZWFkIDwgcC5sZW5ndGgpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJyID0gYXdhaXQgdGhpcy5yZWFkKHAuc3ViYXJyYXkoYnl0ZXNSZWFkKSk7XG4gICAgICAgIGlmIChyciA9PT0gbnVsbCkge1xuICAgICAgICAgIGlmIChieXRlc1JlYWQgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgUGFydGlhbFJlYWRFcnJvcigpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBieXRlc1JlYWQgKz0gcnI7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgZXJyLnBhcnRpYWwgPSBwLnN1YmFycmF5KDAsIGJ5dGVzUmVhZCk7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHA7XG4gIH1cblxuICAvKiogUmV0dXJucyB0aGUgbmV4dCBieXRlIFswLCAyNTVdIG9yIGBudWxsYC4gKi9cbiAgYXN5bmMgcmVhZEJ5dGUoKTogUHJvbWlzZTxudW1iZXIgfCBudWxsPiB7XG4gICAgd2hpbGUgKHRoaXMuciA9PT0gdGhpcy53KSB7XG4gICAgICBpZiAodGhpcy5lb2YpIHJldHVybiBudWxsO1xuICAgICAgYXdhaXQgdGhpcy5fZmlsbCgpOyAvLyBidWZmZXIgaXMgZW1wdHkuXG4gICAgfVxuICAgIGNvbnN0IGMgPSB0aGlzLmJ1Zlt0aGlzLnJdO1xuICAgIHRoaXMucisrO1xuICAgIC8vIHRoaXMubGFzdEJ5dGUgPSBjO1xuICAgIHJldHVybiBjO1xuICB9XG5cbiAgLyoqIHJlYWRTdHJpbmcoKSByZWFkcyB1bnRpbCB0aGUgZmlyc3Qgb2NjdXJyZW5jZSBvZiBkZWxpbSBpbiB0aGUgaW5wdXQsXG4gICAqIHJldHVybmluZyBhIHN0cmluZyBjb250YWluaW5nIHRoZSBkYXRhIHVwIHRvIGFuZCBpbmNsdWRpbmcgdGhlIGRlbGltaXRlci5cbiAgICogSWYgUmVhZFN0cmluZyBlbmNvdW50ZXJzIGFuIGVycm9yIGJlZm9yZSBmaW5kaW5nIGEgZGVsaW1pdGVyLFxuICAgKiBpdCByZXR1cm5zIHRoZSBkYXRhIHJlYWQgYmVmb3JlIHRoZSBlcnJvciBhbmQgdGhlIGVycm9yIGl0c2VsZlxuICAgKiAob2Z0ZW4gYG51bGxgKS5cbiAgICogUmVhZFN0cmluZyByZXR1cm5zIGVyciAhPSBuaWwgaWYgYW5kIG9ubHkgaWYgdGhlIHJldHVybmVkIGRhdGEgZG9lcyBub3QgZW5kXG4gICAqIGluIGRlbGltLlxuICAgKiBGb3Igc2ltcGxlIHVzZXMsIGEgU2Nhbm5lciBtYXkgYmUgbW9yZSBjb252ZW5pZW50LlxuICAgKi9cbiAgYXN5bmMgcmVhZFN0cmluZyhkZWxpbTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gICAgaWYgKGRlbGltLmxlbmd0aCAhPT0gMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRGVsaW1pdGVyIHNob3VsZCBiZSBhIHNpbmdsZSBjaGFyYWN0ZXJcIik7XG4gICAgfVxuICAgIGNvbnN0IGJ1ZmZlciA9IGF3YWl0IHRoaXMucmVhZFNsaWNlKGRlbGltLmNoYXJDb2RlQXQoMCkpO1xuICAgIGlmIChidWZmZXIgPT09IG51bGwpIHJldHVybiBudWxsO1xuICAgIHJldHVybiBuZXcgVGV4dERlY29kZXIoKS5kZWNvZGUoYnVmZmVyKTtcbiAgfVxuXG4gIC8qKiBgcmVhZExpbmUoKWAgaXMgYSBsb3ctbGV2ZWwgbGluZS1yZWFkaW5nIHByaW1pdGl2ZS4gTW9zdCBjYWxsZXJzIHNob3VsZFxuICAgKiB1c2UgYHJlYWRTdHJpbmcoJ1xcbicpYCBpbnN0ZWFkIG9yIHVzZSBhIFNjYW5uZXIuXG4gICAqXG4gICAqIGByZWFkTGluZSgpYCB0cmllcyB0byByZXR1cm4gYSBzaW5nbGUgbGluZSwgbm90IGluY2x1ZGluZyB0aGUgZW5kLW9mLWxpbmVcbiAgICogYnl0ZXMuIElmIHRoZSBsaW5lIHdhcyB0b28gbG9uZyBmb3IgdGhlIGJ1ZmZlciB0aGVuIGBtb3JlYCBpcyBzZXQgYW5kIHRoZVxuICAgKiBiZWdpbm5pbmcgb2YgdGhlIGxpbmUgaXMgcmV0dXJuZWQuIFRoZSByZXN0IG9mIHRoZSBsaW5lIHdpbGwgYmUgcmV0dXJuZWRcbiAgICogZnJvbSBmdXR1cmUgY2FsbHMuIGBtb3JlYCB3aWxsIGJlIGZhbHNlIHdoZW4gcmV0dXJuaW5nIHRoZSBsYXN0IGZyYWdtZW50XG4gICAqIG9mIHRoZSBsaW5lLiBUaGUgcmV0dXJuZWQgYnVmZmVyIGlzIG9ubHkgdmFsaWQgdW50aWwgdGhlIG5leHQgY2FsbCB0b1xuICAgKiBgcmVhZExpbmUoKWAuXG4gICAqXG4gICAqIFRoZSB0ZXh0IHJldHVybmVkIGZyb20gUmVhZExpbmUgZG9lcyBub3QgaW5jbHVkZSB0aGUgbGluZSBlbmQgKFwiXFxyXFxuXCIgb3JcbiAgICogXCJcXG5cIikuXG4gICAqXG4gICAqIFdoZW4gdGhlIGVuZCBvZiB0aGUgdW5kZXJseWluZyBzdHJlYW0gaXMgcmVhY2hlZCwgdGhlIGZpbmFsIGJ5dGVzIGluIHRoZVxuICAgKiBzdHJlYW0gYXJlIHJldHVybmVkLiBObyBpbmRpY2F0aW9uIG9yIGVycm9yIGlzIGdpdmVuIGlmIHRoZSBpbnB1dCBlbmRzXG4gICAqIHdpdGhvdXQgYSBmaW5hbCBsaW5lIGVuZC4gV2hlbiB0aGVyZSBhcmUgbm8gbW9yZSB0cmFpbGluZyBieXRlcyB0byByZWFkLFxuICAgKiBgcmVhZExpbmUoKWAgcmV0dXJucyBgbnVsbGAuXG4gICAqXG4gICAqIENhbGxpbmcgYHVucmVhZEJ5dGUoKWAgYWZ0ZXIgYHJlYWRMaW5lKClgIHdpbGwgYWx3YXlzIHVucmVhZCB0aGUgbGFzdCBieXRlXG4gICAqIHJlYWQgKHBvc3NpYmx5IGEgY2hhcmFjdGVyIGJlbG9uZ2luZyB0byB0aGUgbGluZSBlbmQpIGV2ZW4gaWYgdGhhdCBieXRlIGlzXG4gICAqIG5vdCBwYXJ0IG9mIHRoZSBsaW5lIHJldHVybmVkIGJ5IGByZWFkTGluZSgpYC5cbiAgICovXG4gIGFzeW5jIHJlYWRMaW5lKCk6IFByb21pc2U8UmVhZExpbmVSZXN1bHQgfCBudWxsPiB7XG4gICAgbGV0IGxpbmU6IFVpbnQ4QXJyYXkgfCBudWxsO1xuXG4gICAgdHJ5IHtcbiAgICAgIGxpbmUgPSBhd2FpdCB0aGlzLnJlYWRTbGljZShMRik7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBsZXQgeyBwYXJ0aWFsIH0gPSBlcnI7XG4gICAgICBhc3NlcnQoXG4gICAgICAgIHBhcnRpYWwgaW5zdGFuY2VvZiBVaW50OEFycmF5LFxuICAgICAgICBcImJ1ZmlvOiBjYXVnaHQgZXJyb3IgZnJvbSBgcmVhZFNsaWNlKClgIHdpdGhvdXQgYHBhcnRpYWxgIHByb3BlcnR5XCIsXG4gICAgICApO1xuXG4gICAgICAvLyBEb24ndCB0aHJvdyBpZiBgcmVhZFNsaWNlKClgIGZhaWxlZCB3aXRoIGBCdWZmZXJGdWxsRXJyb3JgLCBpbnN0ZWFkIHdlXG4gICAgICAvLyBqdXN0IHJldHVybiB3aGF0ZXZlciBpcyBhdmFpbGFibGUgYW5kIHNldCB0aGUgYG1vcmVgIGZsYWcuXG4gICAgICBpZiAoIShlcnIgaW5zdGFuY2VvZiBCdWZmZXJGdWxsRXJyb3IpKSB7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cblxuICAgICAgLy8gSGFuZGxlIHRoZSBjYXNlIHdoZXJlIFwiXFxyXFxuXCIgc3RyYWRkbGVzIHRoZSBidWZmZXIuXG4gICAgICBpZiAoXG4gICAgICAgICF0aGlzLmVvZiAmJlxuICAgICAgICBwYXJ0aWFsLmJ5dGVMZW5ndGggPiAwICYmXG4gICAgICAgIHBhcnRpYWxbcGFydGlhbC5ieXRlTGVuZ3RoIC0gMV0gPT09IENSXG4gICAgICApIHtcbiAgICAgICAgLy8gUHV0IHRoZSAnXFxyJyBiYWNrIG9uIGJ1ZiBhbmQgZHJvcCBpdCBmcm9tIGxpbmUuXG4gICAgICAgIC8vIExldCB0aGUgbmV4dCBjYWxsIHRvIFJlYWRMaW5lIGNoZWNrIGZvciBcIlxcclxcblwiLlxuICAgICAgICBhc3NlcnQodGhpcy5yID4gMCwgXCJidWZpbzogdHJpZWQgdG8gcmV3aW5kIHBhc3Qgc3RhcnQgb2YgYnVmZmVyXCIpO1xuICAgICAgICB0aGlzLnItLTtcbiAgICAgICAgcGFydGlhbCA9IHBhcnRpYWwuc3ViYXJyYXkoMCwgcGFydGlhbC5ieXRlTGVuZ3RoIC0gMSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7IGxpbmU6IHBhcnRpYWwsIG1vcmU6ICF0aGlzLmVvZiB9O1xuICAgIH1cblxuICAgIGlmIChsaW5lID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAobGluZS5ieXRlTGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4geyBsaW5lLCBtb3JlOiBmYWxzZSB9O1xuICAgIH1cblxuICAgIGlmIChsaW5lW2xpbmUuYnl0ZUxlbmd0aCAtIDFdID09IExGKSB7XG4gICAgICBsZXQgZHJvcCA9IDE7XG4gICAgICBpZiAobGluZS5ieXRlTGVuZ3RoID4gMSAmJiBsaW5lW2xpbmUuYnl0ZUxlbmd0aCAtIDJdID09PSBDUikge1xuICAgICAgICBkcm9wID0gMjtcbiAgICAgIH1cbiAgICAgIGxpbmUgPSBsaW5lLnN1YmFycmF5KDAsIGxpbmUuYnl0ZUxlbmd0aCAtIGRyb3ApO1xuICAgIH1cbiAgICByZXR1cm4geyBsaW5lLCBtb3JlOiBmYWxzZSB9O1xuICB9XG5cbiAgLyoqIGByZWFkU2xpY2UoKWAgcmVhZHMgdW50aWwgdGhlIGZpcnN0IG9jY3VycmVuY2Ugb2YgYGRlbGltYCBpbiB0aGUgaW5wdXQsXG4gICAqIHJldHVybmluZyBhIHNsaWNlIHBvaW50aW5nIGF0IHRoZSBieXRlcyBpbiB0aGUgYnVmZmVyLiBUaGUgYnl0ZXMgc3RvcFxuICAgKiBiZWluZyB2YWxpZCBhdCB0aGUgbmV4dCByZWFkLlxuICAgKlxuICAgKiBJZiBgcmVhZFNsaWNlKClgIGVuY291bnRlcnMgYW4gZXJyb3IgYmVmb3JlIGZpbmRpbmcgYSBkZWxpbWl0ZXIsIG9yIHRoZVxuICAgKiBidWZmZXIgZmlsbHMgd2l0aG91dCBmaW5kaW5nIGEgZGVsaW1pdGVyLCBpdCB0aHJvd3MgYW4gZXJyb3Igd2l0aCBhXG4gICAqIGBwYXJ0aWFsYCBwcm9wZXJ0eSB0aGF0IGNvbnRhaW5zIHRoZSBlbnRpcmUgYnVmZmVyLlxuICAgKlxuICAgKiBJZiBgcmVhZFNsaWNlKClgIGVuY291bnRlcnMgdGhlIGVuZCBvZiB0aGUgdW5kZXJseWluZyBzdHJlYW0gYW5kIHRoZXJlIGFyZVxuICAgKiBhbnkgYnl0ZXMgbGVmdCBpbiB0aGUgYnVmZmVyLCB0aGUgcmVzdCBvZiB0aGUgYnVmZmVyIGlzIHJldHVybmVkLiBJbiBvdGhlclxuICAgKiB3b3JkcywgRU9GIGlzIGFsd2F5cyB0cmVhdGVkIGFzIGEgZGVsaW1pdGVyLiBPbmNlIHRoZSBidWZmZXIgaXMgZW1wdHksXG4gICAqIGl0IHJldHVybnMgYG51bGxgLlxuICAgKlxuICAgKiBCZWNhdXNlIHRoZSBkYXRhIHJldHVybmVkIGZyb20gYHJlYWRTbGljZSgpYCB3aWxsIGJlIG92ZXJ3cml0dGVuIGJ5IHRoZVxuICAgKiBuZXh0IEkvTyBvcGVyYXRpb24sIG1vc3QgY2xpZW50cyBzaG91bGQgdXNlIGByZWFkU3RyaW5nKClgIGluc3RlYWQuXG4gICAqL1xuICBhc3luYyByZWFkU2xpY2UoZGVsaW06IG51bWJlcik6IFByb21pc2U8VWludDhBcnJheSB8IG51bGw+IHtcbiAgICBsZXQgcyA9IDA7IC8vIHNlYXJjaCBzdGFydCBpbmRleFxuICAgIGxldCBzbGljZTogVWludDhBcnJheSB8IHVuZGVmaW5lZDtcblxuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAvLyBTZWFyY2ggYnVmZmVyLlxuICAgICAgbGV0IGkgPSB0aGlzLmJ1Zi5zdWJhcnJheSh0aGlzLnIgKyBzLCB0aGlzLncpLmluZGV4T2YoZGVsaW0pO1xuICAgICAgaWYgKGkgPj0gMCkge1xuICAgICAgICBpICs9IHM7XG4gICAgICAgIHNsaWNlID0gdGhpcy5idWYuc3ViYXJyYXkodGhpcy5yLCB0aGlzLnIgKyBpICsgMSk7XG4gICAgICAgIHRoaXMuciArPSBpICsgMTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIEVPRj9cbiAgICAgIGlmICh0aGlzLmVvZikge1xuICAgICAgICBpZiAodGhpcy5yID09PSB0aGlzLncpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBzbGljZSA9IHRoaXMuYnVmLnN1YmFycmF5KHRoaXMuciwgdGhpcy53KTtcbiAgICAgICAgdGhpcy5yID0gdGhpcy53O1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgLy8gQnVmZmVyIGZ1bGw/XG4gICAgICBpZiAodGhpcy5idWZmZXJlZCgpID49IHRoaXMuYnVmLmJ5dGVMZW5ndGgpIHtcbiAgICAgICAgdGhpcy5yID0gdGhpcy53O1xuICAgICAgICAvLyAjNDUyMSBUaGUgaW50ZXJuYWwgYnVmZmVyIHNob3VsZCBub3QgYmUgcmV1c2VkIGFjcm9zcyByZWFkcyBiZWNhdXNlIGl0IGNhdXNlcyBjb3JydXB0aW9uIG9mIGRhdGEuXG4gICAgICAgIGNvbnN0IG9sZGJ1ZiA9IHRoaXMuYnVmO1xuICAgICAgICBjb25zdCBuZXdidWYgPSB0aGlzLmJ1Zi5zbGljZSgwKTtcbiAgICAgICAgdGhpcy5idWYgPSBuZXdidWY7XG4gICAgICAgIHRocm93IG5ldyBCdWZmZXJGdWxsRXJyb3Iob2xkYnVmKTtcbiAgICAgIH1cblxuICAgICAgcyA9IHRoaXMudyAtIHRoaXMucjsgLy8gZG8gbm90IHJlc2NhbiBhcmVhIHdlIHNjYW5uZWQgYmVmb3JlXG5cbiAgICAgIC8vIEJ1ZmZlciBpcyBub3QgZnVsbC5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHRoaXMuX2ZpbGwoKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBlcnIucGFydGlhbCA9IHNsaWNlO1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSGFuZGxlIGxhc3QgYnl0ZSwgaWYgYW55LlxuICAgIC8vIGNvbnN0IGkgPSBzbGljZS5ieXRlTGVuZ3RoIC0gMTtcbiAgICAvLyBpZiAoaSA+PSAwKSB7XG4gICAgLy8gICB0aGlzLmxhc3RCeXRlID0gc2xpY2VbaV07XG4gICAgLy8gICB0aGlzLmxhc3RDaGFyU2l6ZSA9IC0xXG4gICAgLy8gfVxuXG4gICAgcmV0dXJuIHNsaWNlO1xuICB9XG5cbiAgLyoqIGBwZWVrKClgIHJldHVybnMgdGhlIG5leHQgYG5gIGJ5dGVzIHdpdGhvdXQgYWR2YW5jaW5nIHRoZSByZWFkZXIuIFRoZVxuICAgKiBieXRlcyBzdG9wIGJlaW5nIHZhbGlkIGF0IHRoZSBuZXh0IHJlYWQgY2FsbC5cbiAgICpcbiAgICogV2hlbiB0aGUgZW5kIG9mIHRoZSB1bmRlcmx5aW5nIHN0cmVhbSBpcyByZWFjaGVkLCBidXQgdGhlcmUgYXJlIHVucmVhZFxuICAgKiBieXRlcyBsZWZ0IGluIHRoZSBidWZmZXIsIHRob3NlIGJ5dGVzIGFyZSByZXR1cm5lZC4gSWYgdGhlcmUgYXJlIG5vIGJ5dGVzXG4gICAqIGxlZnQgaW4gdGhlIGJ1ZmZlciwgaXQgcmV0dXJucyBgbnVsbGAuXG4gICAqXG4gICAqIElmIGFuIGVycm9yIGlzIGVuY291bnRlcmVkIGJlZm9yZSBgbmAgYnl0ZXMgYXJlIGF2YWlsYWJsZSwgYHBlZWsoKWAgdGhyb3dzXG4gICAqIGFuIGVycm9yIHdpdGggdGhlIGBwYXJ0aWFsYCBwcm9wZXJ0eSBzZXQgdG8gYSBzbGljZSBvZiB0aGUgYnVmZmVyIHRoYXRcbiAgICogY29udGFpbnMgdGhlIGJ5dGVzIHRoYXQgd2VyZSBhdmFpbGFibGUgYmVmb3JlIHRoZSBlcnJvciBvY2N1cnJlZC5cbiAgICovXG4gIGFzeW5jIHBlZWsobjogbnVtYmVyKTogUHJvbWlzZTxVaW50OEFycmF5IHwgbnVsbD4ge1xuICAgIGlmIChuIDwgMCkge1xuICAgICAgdGhyb3cgRXJyb3IoXCJuZWdhdGl2ZSBjb3VudFwiKTtcbiAgICB9XG5cbiAgICBsZXQgYXZhaWwgPSB0aGlzLncgLSB0aGlzLnI7XG4gICAgd2hpbGUgKGF2YWlsIDwgbiAmJiBhdmFpbCA8IHRoaXMuYnVmLmJ5dGVMZW5ndGggJiYgIXRoaXMuZW9mKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCB0aGlzLl9maWxsKCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgZXJyLnBhcnRpYWwgPSB0aGlzLmJ1Zi5zdWJhcnJheSh0aGlzLnIsIHRoaXMudyk7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICAgIGF2YWlsID0gdGhpcy53IC0gdGhpcy5yO1xuICAgIH1cblxuICAgIGlmIChhdmFpbCA9PT0gMCAmJiB0aGlzLmVvZikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBlbHNlIGlmIChhdmFpbCA8IG4gJiYgdGhpcy5lb2YpIHtcbiAgICAgIHJldHVybiB0aGlzLmJ1Zi5zdWJhcnJheSh0aGlzLnIsIHRoaXMuciArIGF2YWlsKTtcbiAgICB9IGVsc2UgaWYgKGF2YWlsIDwgbikge1xuICAgICAgdGhyb3cgbmV3IEJ1ZmZlckZ1bGxFcnJvcih0aGlzLmJ1Zi5zdWJhcnJheSh0aGlzLnIsIHRoaXMudykpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmJ1Zi5zdWJhcnJheSh0aGlzLnIsIHRoaXMuciArIG4pO1xuICB9XG59XG5cbmFic3RyYWN0IGNsYXNzIEFic3RyYWN0QnVmQmFzZSB7XG4gIGJ1ZiE6IFVpbnQ4QXJyYXk7XG4gIHVzZWRCdWZmZXJCeXRlcyA9IDA7XG4gIGVycjogRXJyb3IgfCBudWxsID0gbnVsbDtcblxuICAvKiogU2l6ZSByZXR1cm5zIHRoZSBzaXplIG9mIHRoZSB1bmRlcmx5aW5nIGJ1ZmZlciBpbiBieXRlcy4gKi9cbiAgc2l6ZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmJ1Zi5ieXRlTGVuZ3RoO1xuICB9XG5cbiAgLyoqIFJldHVybnMgaG93IG1hbnkgYnl0ZXMgYXJlIHVudXNlZCBpbiB0aGUgYnVmZmVyLiAqL1xuICBhdmFpbGFibGUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5idWYuYnl0ZUxlbmd0aCAtIHRoaXMudXNlZEJ1ZmZlckJ5dGVzO1xuICB9XG5cbiAgLyoqIGJ1ZmZlcmVkIHJldHVybnMgdGhlIG51bWJlciBvZiBieXRlcyB0aGF0IGhhdmUgYmVlbiB3cml0dGVuIGludG8gdGhlXG4gICAqIGN1cnJlbnQgYnVmZmVyLlxuICAgKi9cbiAgYnVmZmVyZWQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy51c2VkQnVmZmVyQnl0ZXM7XG4gIH1cbn1cblxuLyoqIEJ1ZldyaXRlciBpbXBsZW1lbnRzIGJ1ZmZlcmluZyBmb3IgYW4gZGVuby5Xcml0ZXIgb2JqZWN0LlxuICogSWYgYW4gZXJyb3Igb2NjdXJzIHdyaXRpbmcgdG8gYSBXcml0ZXIsIG5vIG1vcmUgZGF0YSB3aWxsIGJlXG4gKiBhY2NlcHRlZCBhbmQgYWxsIHN1YnNlcXVlbnQgd3JpdGVzLCBhbmQgZmx1c2goKSwgd2lsbCByZXR1cm4gdGhlIGVycm9yLlxuICogQWZ0ZXIgYWxsIGRhdGEgaGFzIGJlZW4gd3JpdHRlbiwgdGhlIGNsaWVudCBzaG91bGQgY2FsbCB0aGVcbiAqIGZsdXNoKCkgbWV0aG9kIHRvIGd1YXJhbnRlZSBhbGwgZGF0YSBoYXMgYmVlbiBmb3J3YXJkZWQgdG9cbiAqIHRoZSB1bmRlcmx5aW5nIGRlbm8uV3JpdGVyLlxuICovXG5leHBvcnQgY2xhc3MgQnVmV3JpdGVyIGV4dGVuZHMgQWJzdHJhY3RCdWZCYXNlIGltcGxlbWVudHMgV3JpdGVyIHtcbiAgLyoqIHJldHVybiBuZXcgQnVmV3JpdGVyIHVubGVzcyB3cml0ZXIgaXMgQnVmV3JpdGVyICovXG4gIHN0YXRpYyBjcmVhdGUod3JpdGVyOiBXcml0ZXIsIHNpemU6IG51bWJlciA9IERFRkFVTFRfQlVGX1NJWkUpOiBCdWZXcml0ZXIge1xuICAgIHJldHVybiB3cml0ZXIgaW5zdGFuY2VvZiBCdWZXcml0ZXIgPyB3cml0ZXIgOiBuZXcgQnVmV3JpdGVyKHdyaXRlciwgc2l6ZSk7XG4gIH1cblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHdyaXRlcjogV3JpdGVyLCBzaXplOiBudW1iZXIgPSBERUZBVUxUX0JVRl9TSVpFKSB7XG4gICAgc3VwZXIoKTtcbiAgICBpZiAoc2l6ZSA8PSAwKSB7XG4gICAgICBzaXplID0gREVGQVVMVF9CVUZfU0laRTtcbiAgICB9XG4gICAgdGhpcy5idWYgPSBuZXcgVWludDhBcnJheShzaXplKTtcbiAgfVxuXG4gIC8qKiBEaXNjYXJkcyBhbnkgdW5mbHVzaGVkIGJ1ZmZlcmVkIGRhdGEsIGNsZWFycyBhbnkgZXJyb3IsIGFuZFxuICAgKiByZXNldHMgYnVmZmVyIHRvIHdyaXRlIGl0cyBvdXRwdXQgdG8gdy5cbiAgICovXG4gIHJlc2V0KHc6IFdyaXRlcik6IHZvaWQge1xuICAgIHRoaXMuZXJyID0gbnVsbDtcbiAgICB0aGlzLnVzZWRCdWZmZXJCeXRlcyA9IDA7XG4gICAgdGhpcy53cml0ZXIgPSB3O1xuICB9XG5cbiAgLyoqIEZsdXNoIHdyaXRlcyBhbnkgYnVmZmVyZWQgZGF0YSB0byB0aGUgdW5kZXJseWluZyBpby5Xcml0ZXIuICovXG4gIGFzeW5jIGZsdXNoKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmVyciAhPT0gbnVsbCkgdGhyb3cgdGhpcy5lcnI7XG4gICAgaWYgKHRoaXMudXNlZEJ1ZmZlckJ5dGVzID09PSAwKSByZXR1cm47XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgRGVuby53cml0ZUFsbChcbiAgICAgICAgdGhpcy53cml0ZXIsXG4gICAgICAgIHRoaXMuYnVmLnN1YmFycmF5KDAsIHRoaXMudXNlZEJ1ZmZlckJ5dGVzKSxcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhpcy5lcnIgPSBlO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG5cbiAgICB0aGlzLmJ1ZiA9IG5ldyBVaW50OEFycmF5KHRoaXMuYnVmLmxlbmd0aCk7XG4gICAgdGhpcy51c2VkQnVmZmVyQnl0ZXMgPSAwO1xuICB9XG5cbiAgLyoqIFdyaXRlcyB0aGUgY29udGVudHMgb2YgYGRhdGFgIGludG8gdGhlIGJ1ZmZlci4gIElmIHRoZSBjb250ZW50cyB3b24ndCBmdWxseVxuICAgKiBmaXQgaW50byB0aGUgYnVmZmVyLCB0aG9zZSBieXRlcyB0aGF0IGNhbiBhcmUgY29waWVkIGludG8gdGhlIGJ1ZmZlciwgdGhlXG4gICAqIGJ1ZmZlciBpcyB0aGUgZmx1c2hlZCB0byB0aGUgd3JpdGVyIGFuZCB0aGUgcmVtYWluaW5nIGJ5dGVzIGFyZSBjb3BpZWQgaW50b1xuICAgKiB0aGUgbm93IGVtcHR5IGJ1ZmZlci5cbiAgICpcbiAgICogQHJldHVybiB0aGUgbnVtYmVyIG9mIGJ5dGVzIHdyaXR0ZW4gdG8gdGhlIGJ1ZmZlci5cbiAgICovXG4gIGFzeW5jIHdyaXRlKGRhdGE6IFVpbnQ4QXJyYXkpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmVyciAhPT0gbnVsbCkgdGhyb3cgdGhpcy5lcnI7XG4gICAgaWYgKGRhdGEubGVuZ3RoID09PSAwKSByZXR1cm4gMDtcblxuICAgIGxldCB0b3RhbEJ5dGVzV3JpdHRlbiA9IDA7XG4gICAgbGV0IG51bUJ5dGVzV3JpdHRlbiA9IDA7XG4gICAgd2hpbGUgKGRhdGEuYnl0ZUxlbmd0aCA+IHRoaXMuYXZhaWxhYmxlKCkpIHtcbiAgICAgIGlmICh0aGlzLmJ1ZmZlcmVkKCkgPT09IDApIHtcbiAgICAgICAgLy8gTGFyZ2Ugd3JpdGUsIGVtcHR5IGJ1ZmZlci5cbiAgICAgICAgLy8gV3JpdGUgZGlyZWN0bHkgZnJvbSBkYXRhIHRvIGF2b2lkIGNvcHkuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgbnVtQnl0ZXNXcml0dGVuID0gYXdhaXQgdGhpcy53cml0ZXIud3JpdGUoZGF0YSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICB0aGlzLmVyciA9IGU7XG4gICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbnVtQnl0ZXNXcml0dGVuID0gY29weUJ5dGVzKGRhdGEsIHRoaXMuYnVmLCB0aGlzLnVzZWRCdWZmZXJCeXRlcyk7XG4gICAgICAgIHRoaXMudXNlZEJ1ZmZlckJ5dGVzICs9IG51bUJ5dGVzV3JpdHRlbjtcbiAgICAgICAgYXdhaXQgdGhpcy5mbHVzaCgpO1xuICAgICAgfVxuICAgICAgdG90YWxCeXRlc1dyaXR0ZW4gKz0gbnVtQnl0ZXNXcml0dGVuO1xuICAgICAgZGF0YSA9IGRhdGEuc3ViYXJyYXkobnVtQnl0ZXNXcml0dGVuKTtcbiAgICB9XG5cbiAgICBudW1CeXRlc1dyaXR0ZW4gPSBjb3B5Qnl0ZXMoZGF0YSwgdGhpcy5idWYsIHRoaXMudXNlZEJ1ZmZlckJ5dGVzKTtcbiAgICB0aGlzLnVzZWRCdWZmZXJCeXRlcyArPSBudW1CeXRlc1dyaXR0ZW47XG4gICAgdG90YWxCeXRlc1dyaXR0ZW4gKz0gbnVtQnl0ZXNXcml0dGVuO1xuICAgIHJldHVybiB0b3RhbEJ5dGVzV3JpdHRlbjtcbiAgfVxufVxuXG4vKiogQnVmV3JpdGVyU3luYyBpbXBsZW1lbnRzIGJ1ZmZlcmluZyBmb3IgYSBkZW5vLldyaXRlclN5bmMgb2JqZWN0LlxuICogSWYgYW4gZXJyb3Igb2NjdXJzIHdyaXRpbmcgdG8gYSBXcml0ZXJTeW5jLCBubyBtb3JlIGRhdGEgd2lsbCBiZVxuICogYWNjZXB0ZWQgYW5kIGFsbCBzdWJzZXF1ZW50IHdyaXRlcywgYW5kIGZsdXNoKCksIHdpbGwgcmV0dXJuIHRoZSBlcnJvci5cbiAqIEFmdGVyIGFsbCBkYXRhIGhhcyBiZWVuIHdyaXR0ZW4sIHRoZSBjbGllbnQgc2hvdWxkIGNhbGwgdGhlXG4gKiBmbHVzaCgpIG1ldGhvZCB0byBndWFyYW50ZWUgYWxsIGRhdGEgaGFzIGJlZW4gZm9yd2FyZGVkIHRvXG4gKiB0aGUgdW5kZXJseWluZyBkZW5vLldyaXRlclN5bmMuXG4gKi9cbmV4cG9ydCBjbGFzcyBCdWZXcml0ZXJTeW5jIGV4dGVuZHMgQWJzdHJhY3RCdWZCYXNlIGltcGxlbWVudHMgV3JpdGVyU3luYyB7XG4gIC8qKiByZXR1cm4gbmV3IEJ1ZldyaXRlclN5bmMgdW5sZXNzIHdyaXRlciBpcyBCdWZXcml0ZXJTeW5jICovXG4gIHN0YXRpYyBjcmVhdGUoXG4gICAgd3JpdGVyOiBXcml0ZXJTeW5jLFxuICAgIHNpemU6IG51bWJlciA9IERFRkFVTFRfQlVGX1NJWkUsXG4gICk6IEJ1ZldyaXRlclN5bmMge1xuICAgIHJldHVybiB3cml0ZXIgaW5zdGFuY2VvZiBCdWZXcml0ZXJTeW5jXG4gICAgICA/IHdyaXRlclxuICAgICAgOiBuZXcgQnVmV3JpdGVyU3luYyh3cml0ZXIsIHNpemUpO1xuICB9XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSB3cml0ZXI6IFdyaXRlclN5bmMsIHNpemU6IG51bWJlciA9IERFRkFVTFRfQlVGX1NJWkUpIHtcbiAgICBzdXBlcigpO1xuICAgIGlmIChzaXplIDw9IDApIHtcbiAgICAgIHNpemUgPSBERUZBVUxUX0JVRl9TSVpFO1xuICAgIH1cbiAgICB0aGlzLmJ1ZiA9IG5ldyBVaW50OEFycmF5KHNpemUpO1xuICB9XG5cbiAgLyoqIERpc2NhcmRzIGFueSB1bmZsdXNoZWQgYnVmZmVyZWQgZGF0YSwgY2xlYXJzIGFueSBlcnJvciwgYW5kXG4gICAqIHJlc2V0cyBidWZmZXIgdG8gd3JpdGUgaXRzIG91dHB1dCB0byB3LlxuICAgKi9cbiAgcmVzZXQodzogV3JpdGVyU3luYyk6IHZvaWQge1xuICAgIHRoaXMuZXJyID0gbnVsbDtcbiAgICB0aGlzLnVzZWRCdWZmZXJCeXRlcyA9IDA7XG4gICAgdGhpcy53cml0ZXIgPSB3O1xuICB9XG5cbiAgLyoqIEZsdXNoIHdyaXRlcyBhbnkgYnVmZmVyZWQgZGF0YSB0byB0aGUgdW5kZXJseWluZyBpby5Xcml0ZXJTeW5jLiAqL1xuICBmbHVzaCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5lcnIgIT09IG51bGwpIHRocm93IHRoaXMuZXJyO1xuICAgIGlmICh0aGlzLnVzZWRCdWZmZXJCeXRlcyA9PT0gMCkgcmV0dXJuO1xuXG4gICAgdHJ5IHtcbiAgICAgIERlbm8ud3JpdGVBbGxTeW5jKFxuICAgICAgICB0aGlzLndyaXRlcixcbiAgICAgICAgdGhpcy5idWYuc3ViYXJyYXkoMCwgdGhpcy51c2VkQnVmZmVyQnl0ZXMpLFxuICAgICAgKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aGlzLmVyciA9IGU7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cblxuICAgIHRoaXMuYnVmID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5idWYubGVuZ3RoKTtcbiAgICB0aGlzLnVzZWRCdWZmZXJCeXRlcyA9IDA7XG4gIH1cblxuICAvKiogV3JpdGVzIHRoZSBjb250ZW50cyBvZiBgZGF0YWAgaW50byB0aGUgYnVmZmVyLiAgSWYgdGhlIGNvbnRlbnRzIHdvbid0IGZ1bGx5XG4gICAqIGZpdCBpbnRvIHRoZSBidWZmZXIsIHRob3NlIGJ5dGVzIHRoYXQgY2FuIGFyZSBjb3BpZWQgaW50byB0aGUgYnVmZmVyLCB0aGVcbiAgICogYnVmZmVyIGlzIHRoZSBmbHVzaGVkIHRvIHRoZSB3cml0ZXIgYW5kIHRoZSByZW1haW5pbmcgYnl0ZXMgYXJlIGNvcGllZCBpbnRvXG4gICAqIHRoZSBub3cgZW1wdHkgYnVmZmVyLlxuICAgKlxuICAgKiBAcmV0dXJuIHRoZSBudW1iZXIgb2YgYnl0ZXMgd3JpdHRlbiB0byB0aGUgYnVmZmVyLlxuICAgKi9cbiAgd3JpdGVTeW5jKGRhdGE6IFVpbnQ4QXJyYXkpOiBudW1iZXIge1xuICAgIGlmICh0aGlzLmVyciAhPT0gbnVsbCkgdGhyb3cgdGhpcy5lcnI7XG4gICAgaWYgKGRhdGEubGVuZ3RoID09PSAwKSByZXR1cm4gMDtcblxuICAgIGxldCB0b3RhbEJ5dGVzV3JpdHRlbiA9IDA7XG4gICAgbGV0IG51bUJ5dGVzV3JpdHRlbiA9IDA7XG4gICAgd2hpbGUgKGRhdGEuYnl0ZUxlbmd0aCA+IHRoaXMuYXZhaWxhYmxlKCkpIHtcbiAgICAgIGlmICh0aGlzLmJ1ZmZlcmVkKCkgPT09IDApIHtcbiAgICAgICAgLy8gTGFyZ2Ugd3JpdGUsIGVtcHR5IGJ1ZmZlci5cbiAgICAgICAgLy8gV3JpdGUgZGlyZWN0bHkgZnJvbSBkYXRhIHRvIGF2b2lkIGNvcHkuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgbnVtQnl0ZXNXcml0dGVuID0gdGhpcy53cml0ZXIud3JpdGVTeW5jKGRhdGEpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgdGhpcy5lcnIgPSBlO1xuICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG51bUJ5dGVzV3JpdHRlbiA9IGNvcHlCeXRlcyhkYXRhLCB0aGlzLmJ1ZiwgdGhpcy51c2VkQnVmZmVyQnl0ZXMpO1xuICAgICAgICB0aGlzLnVzZWRCdWZmZXJCeXRlcyArPSBudW1CeXRlc1dyaXR0ZW47XG4gICAgICAgIHRoaXMuZmx1c2goKTtcbiAgICAgIH1cbiAgICAgIHRvdGFsQnl0ZXNXcml0dGVuICs9IG51bUJ5dGVzV3JpdHRlbjtcbiAgICAgIGRhdGEgPSBkYXRhLnN1YmFycmF5KG51bUJ5dGVzV3JpdHRlbik7XG4gICAgfVxuXG4gICAgbnVtQnl0ZXNXcml0dGVuID0gY29weUJ5dGVzKGRhdGEsIHRoaXMuYnVmLCB0aGlzLnVzZWRCdWZmZXJCeXRlcyk7XG4gICAgdGhpcy51c2VkQnVmZmVyQnl0ZXMgKz0gbnVtQnl0ZXNXcml0dGVuO1xuICAgIHRvdGFsQnl0ZXNXcml0dGVuICs9IG51bUJ5dGVzV3JpdHRlbjtcbiAgICByZXR1cm4gdG90YWxCeXRlc1dyaXR0ZW47XG4gIH1cbn1cblxuLyoqIEdlbmVyYXRlIGxvbmdlc3QgcHJvcGVyIHByZWZpeCB3aGljaCBpcyBhbHNvIHN1ZmZpeCBhcnJheS4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUxQUyhwYXQ6IFVpbnQ4QXJyYXkpOiBVaW50OEFycmF5IHtcbiAgY29uc3QgbHBzID0gbmV3IFVpbnQ4QXJyYXkocGF0Lmxlbmd0aCk7XG4gIGxwc1swXSA9IDA7XG4gIGxldCBwcmVmaXhFbmQgPSAwO1xuICBsZXQgaSA9IDE7XG4gIHdoaWxlIChpIDwgbHBzLmxlbmd0aCkge1xuICAgIGlmIChwYXRbaV0gPT0gcGF0W3ByZWZpeEVuZF0pIHtcbiAgICAgIHByZWZpeEVuZCsrO1xuICAgICAgbHBzW2ldID0gcHJlZml4RW5kO1xuICAgICAgaSsrO1xuICAgIH0gZWxzZSBpZiAocHJlZml4RW5kID09PSAwKSB7XG4gICAgICBscHNbaV0gPSAwO1xuICAgICAgaSsrO1xuICAgIH0gZWxzZSB7XG4gICAgICBwcmVmaXhFbmQgPSBwYXRbcHJlZml4RW5kIC0gMV07XG4gICAgfVxuICB9XG4gIHJldHVybiBscHM7XG59XG5cbi8qKiBSZWFkIGRlbGltaXRlZCBieXRlcyBmcm9tIGEgUmVhZGVyLiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uKiByZWFkRGVsaW0oXG4gIHJlYWRlcjogUmVhZGVyLFxuICBkZWxpbTogVWludDhBcnJheSxcbik6IEFzeW5jSXRlcmFibGVJdGVyYXRvcjxVaW50OEFycmF5PiB7XG4gIC8vIEF2b2lkIHVuaWNvZGUgcHJvYmxlbXNcbiAgY29uc3QgZGVsaW1MZW4gPSBkZWxpbS5sZW5ndGg7XG4gIGNvbnN0IGRlbGltTFBTID0gY3JlYXRlTFBTKGRlbGltKTtcblxuICBsZXQgaW5wdXRCdWZmZXIgPSBuZXcgRGVuby5CdWZmZXIoKTtcbiAgY29uc3QgaW5zcGVjdEFyciA9IG5ldyBVaW50OEFycmF5KE1hdGgubWF4KDEwMjQsIGRlbGltTGVuICsgMSkpO1xuXG4gIC8vIE1vZGlmaWVkIEtNUFxuICBsZXQgaW5zcGVjdEluZGV4ID0gMDtcbiAgbGV0IG1hdGNoSW5kZXggPSAwO1xuICB3aGlsZSAodHJ1ZSkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlYWRlci5yZWFkKGluc3BlY3RBcnIpO1xuICAgIGlmIChyZXN1bHQgPT09IG51bGwpIHtcbiAgICAgIC8vIFlpZWxkIGxhc3QgY2h1bmsuXG4gICAgICB5aWVsZCBpbnB1dEJ1ZmZlci5ieXRlcygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoKHJlc3VsdCBhcyBudW1iZXIpIDwgMCkge1xuICAgICAgLy8gRGlzY2FyZCBhbGwgcmVtYWluaW5nIGFuZCBzaWxlbnRseSBmYWlsLlxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBzbGljZVJlYWQgPSBpbnNwZWN0QXJyLnN1YmFycmF5KDAsIHJlc3VsdCBhcyBudW1iZXIpO1xuICAgIGF3YWl0IERlbm8ud3JpdGVBbGwoaW5wdXRCdWZmZXIsIHNsaWNlUmVhZCk7XG5cbiAgICBsZXQgc2xpY2VUb1Byb2Nlc3MgPSBpbnB1dEJ1ZmZlci5ieXRlcygpO1xuICAgIHdoaWxlIChpbnNwZWN0SW5kZXggPCBzbGljZVRvUHJvY2Vzcy5sZW5ndGgpIHtcbiAgICAgIGlmIChzbGljZVRvUHJvY2Vzc1tpbnNwZWN0SW5kZXhdID09PSBkZWxpbVttYXRjaEluZGV4XSkge1xuICAgICAgICBpbnNwZWN0SW5kZXgrKztcbiAgICAgICAgbWF0Y2hJbmRleCsrO1xuICAgICAgICBpZiAobWF0Y2hJbmRleCA9PT0gZGVsaW1MZW4pIHtcbiAgICAgICAgICAvLyBGdWxsIG1hdGNoXG4gICAgICAgICAgY29uc3QgbWF0Y2hFbmQgPSBpbnNwZWN0SW5kZXggLSBkZWxpbUxlbjtcbiAgICAgICAgICBjb25zdCByZWFkeUJ5dGVzID0gc2xpY2VUb1Byb2Nlc3Muc3ViYXJyYXkoMCwgbWF0Y2hFbmQpO1xuICAgICAgICAgIC8vIENvcHlcbiAgICAgICAgICBjb25zdCBwZW5kaW5nQnl0ZXMgPSBzbGljZVRvUHJvY2Vzcy5zbGljZShpbnNwZWN0SW5kZXgpO1xuICAgICAgICAgIHlpZWxkIHJlYWR5Qnl0ZXM7XG4gICAgICAgICAgLy8gUmVzZXQgbWF0Y2gsIGRpZmZlcmVudCBmcm9tIEtNUC5cbiAgICAgICAgICBzbGljZVRvUHJvY2VzcyA9IHBlbmRpbmdCeXRlcztcbiAgICAgICAgICBpbnNwZWN0SW5kZXggPSAwO1xuICAgICAgICAgIG1hdGNoSW5kZXggPSAwO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAobWF0Y2hJbmRleCA9PT0gMCkge1xuICAgICAgICAgIGluc3BlY3RJbmRleCsrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1hdGNoSW5kZXggPSBkZWxpbUxQU1ttYXRjaEluZGV4IC0gMV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gS2VlcCBpbnNwZWN0SW5kZXggYW5kIG1hdGNoSW5kZXguXG4gICAgaW5wdXRCdWZmZXIgPSBuZXcgRGVuby5CdWZmZXIoc2xpY2VUb1Byb2Nlc3MpO1xuICB9XG59XG5cbi8qKiBSZWFkIGRlbGltaXRlZCBzdHJpbmdzIGZyb20gYSBSZWFkZXIuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24qIHJlYWRTdHJpbmdEZWxpbShcbiAgcmVhZGVyOiBSZWFkZXIsXG4gIGRlbGltOiBzdHJpbmcsXG4pOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8c3RyaW5nPiB7XG4gIGNvbnN0IGVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcbiAgY29uc3QgZGVjb2RlciA9IG5ldyBUZXh0RGVjb2RlcigpO1xuICBmb3IgYXdhaXQgKGNvbnN0IGNodW5rIG9mIHJlYWREZWxpbShyZWFkZXIsIGVuY29kZXIuZW5jb2RlKGRlbGltKSkpIHtcbiAgICB5aWVsZCBkZWNvZGVyLmRlY29kZShjaHVuayk7XG4gIH1cbn1cblxuLyoqIFJlYWQgc3RyaW5ncyBsaW5lLWJ5LWxpbmUgZnJvbSBhIFJlYWRlci4gKi9cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZXF1aXJlLWF3YWl0XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24qIHJlYWRMaW5lcyhcbiAgcmVhZGVyOiBSZWFkZXIsXG4pOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8c3RyaW5nPiB7XG4gIHlpZWxkKiByZWFkU3RyaW5nRGVsaW0ocmVhZGVyLCBc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
