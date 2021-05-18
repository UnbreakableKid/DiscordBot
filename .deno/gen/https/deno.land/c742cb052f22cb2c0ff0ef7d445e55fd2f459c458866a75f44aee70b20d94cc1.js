import { assert } from "../_util/assert.ts";
import { copy } from "../bytes/mod.ts";
// MIN_READ is the minimum ArrayBuffer size passed to a read call by
// buffer.ReadFrom. As long as the Buffer has at least MIN_READ bytes beyond
// what is required to hold the contents of r, readFrom() will not grow the
// underlying buffer.
const MIN_READ = 32 * 1024;
const MAX_SIZE = 2 ** 32 - 2;
/** A variable-sized buffer of bytes with `read()` and `write()` methods.
 *
 * Buffer is almost always used with some I/O like files and sockets. It allows
 * one to buffer up a download from a socket. Buffer grows and shrinks as
 * necessary.
 *
 * Buffer is NOT the same thing as Node's Buffer. Node's Buffer was created in
 * 2009 before JavaScript had the concept of ArrayBuffers. It's simply a
 * non-standard ArrayBuffer.
 *
 * ArrayBuffer is a fixed memory allocation. Buffer is implemented on top of
 * ArrayBuffer.
 *
 * Based on [Go Buffer](https://golang.org/pkg/bytes/#Buffer). */ export class Buffer {
  #buf;
  #off = 0;
  constructor(ab) {
    if (ab === undefined) {
      this.#buf = new Uint8Array(0);
      return;
    }
    this.#buf = new Uint8Array(ab);
  }
  /** Returns a slice holding the unread portion of the buffer.
   *
   * The slice is valid for use only until the next buffer modification (that
   * is, only until the next call to a method like `read()`, `write()`,
   * `reset()`, or `truncate()`). If `options.copy` is false the slice aliases the buffer content at
   * least until the next buffer modification, so immediate changes to the
   * slice will affect the result of future reads.
   * @param options Defaults to `{ copy: true }`
   */ bytes(options = {
    copy: true,
  }) {
    if (options.copy === false) return this.#buf.subarray(this.#off);
    return this.#buf.slice(this.#off);
  }
  /** Returns whether the unread portion of the buffer is empty. */ empty() {
    return this.#buf.byteLength <= this.#off;
  }
  /** A read only number of bytes of the unread portion of the buffer. */ get length() {
    return this.#buf.byteLength - this.#off;
  }
  /** The read only capacity of the buffer's underlying byte slice, that is,
   * the total space allocated for the buffer's data. */ get capacity() {
    return this.#buf.buffer.byteLength;
  }
  /** Discards all but the first `n` unread bytes from the buffer but
   * continues to use the same allocated storage. It throws if `n` is
   * negative or greater than the length of the buffer. */ truncate(n) {
    if (n === 0) {
      this.reset();
      return;
    }
    if (n < 0 || n > this.length) {
      throw Error("bytes.Buffer: truncation out of range");
    }
    this.#reslice(this.#off + n);
  }
  reset() {
    this.#reslice(0);
    this.#off = 0;
  }
  #tryGrowByReslice = (n) => {
    const l = this.#buf.byteLength;
    if (n <= this.capacity - l) {
      this.#reslice(l + n);
      return l;
    }
    return -1;
  };
  #reslice = (len) => {
    assert(len <= this.#buf.buffer.byteLength);
    this.#buf = new Uint8Array(this.#buf.buffer, 0, len);
  };
  /** Reads the next `p.length` bytes from the buffer or until the buffer is
   * drained. Returns the number of bytes read. If the buffer has no data to
   * return, the return is EOF (`null`). */ readSync(p) {
    if (this.empty()) {
      // Buffer is empty, reset to recover space.
      this.reset();
      if (p.byteLength === 0) {
        // this edge case is tested in 'bufferReadEmptyAtEOF' test
        return 0;
      }
      return null;
    }
    const nread = copy(this.#buf.subarray(this.#off), p);
    this.#off += nread;
    return nread;
  }
  /** Reads the next `p.length` bytes from the buffer or until the buffer is
   * drained. Resolves to the number of bytes read. If the buffer has no
   * data to return, resolves to EOF (`null`).
   *
   * NOTE: This methods reads bytes synchronously; it's provided for
   * compatibility with `Reader` interfaces.
   */ read(p) {
    const rr = this.readSync(p);
    return Promise.resolve(rr);
  }
  writeSync(p) {
    const m = this.#grow(p.byteLength);
    return copy(p, this.#buf, m);
  }
  /** NOTE: This methods writes bytes synchronously; it's provided for
   * compatibility with `Writer` interface. */ write(p) {
    const n = this.writeSync(p);
    return Promise.resolve(n);
  }
  #grow = (n) => {
    const m = this.length;
    // If buffer is empty, reset to recover space.
    if (m === 0 && this.#off !== 0) {
      this.reset();
    }
    // Fast: Try to grow by means of a reslice.
    const i = this.#tryGrowByReslice(n);
    if (i >= 0) {
      return i;
    }
    const c = this.capacity;
    if (n <= Math.floor(c / 2) - m) {
      // We can slide things down instead of allocating a new
      // ArrayBuffer. We only need m+n <= c to slide, but
      // we instead let capacity get twice as large so we
      // don't spend all our time copying.
      copy(this.#buf.subarray(this.#off), this.#buf);
    } else if (c + n > MAX_SIZE) {
      throw new Error("The buffer cannot be grown beyond the maximum size.");
    } else {
      // Not enough space anywhere, we need to allocate.
      const buf = new Uint8Array(Math.min(2 * c + n, MAX_SIZE));
      copy(this.#buf.subarray(this.#off), buf);
      this.#buf = buf;
    }
    // Restore this.#off and len(this.#buf).
    this.#off = 0;
    this.#reslice(Math.min(m + n, MAX_SIZE));
    return m;
  };
  /** Grows the buffer's capacity, if necessary, to guarantee space for
   * another `n` bytes. After `.grow(n)`, at least `n` bytes can be written to
   * the buffer without another allocation. If `n` is negative, `.grow()` will
   * throw. If the buffer can't grow it will throw an error.
   *
   * Based on Go Lang's
   * [Buffer.Grow](https://golang.org/pkg/bytes/#Buffer.Grow). */ grow(n) {
    if (n < 0) {
      throw Error("Buffer.grow: negative count");
    }
    const m = this.#grow(n);
    this.#reslice(m);
  }
  /** Reads data from `r` until EOF (`null`) and appends it to the buffer,
   * growing the buffer as needed. It resolves to the number of bytes read.
   * If the buffer becomes too large, `.readFrom()` will reject with an error.
   *
   * Based on Go Lang's
   * [Buffer.ReadFrom](https://golang.org/pkg/bytes/#Buffer.ReadFrom). */ async readFrom(
    r,
  ) {
    let n = 0;
    const tmp = new Uint8Array(MIN_READ);
    while (true) {
      const shouldGrow = this.capacity - this.length < MIN_READ;
      // read into tmp buffer if there's not enough room
      // otherwise read directly into the internal buffer
      const buf = shouldGrow
        ? tmp
        : new Uint8Array(this.#buf.buffer, this.length);
      const nread = await r.read(buf);
      if (nread === null) {
        return n;
      }
      // write will grow if needed
      if (shouldGrow) this.writeSync(buf.subarray(0, nread));
      else this.#reslice(this.length + nread);
      n += nread;
    }
  }
  /** Reads data from `r` until EOF (`null`) and appends it to the buffer,
   * growing the buffer as needed. It returns the number of bytes read. If the
   * buffer becomes too large, `.readFromSync()` will throw an error.
   *
   * Based on Go Lang's
   * [Buffer.ReadFrom](https://golang.org/pkg/bytes/#Buffer.ReadFrom). */ readFromSync(
    r,
  ) {
    let n = 0;
    const tmp = new Uint8Array(MIN_READ);
    while (true) {
      const shouldGrow = this.capacity - this.length < MIN_READ;
      // read into tmp buffer if there's not enough room
      // otherwise read directly into the internal buffer
      const buf = shouldGrow
        ? tmp
        : new Uint8Array(this.#buf.buffer, this.length);
      const nread = r.readSync(buf);
      if (nread === null) {
        return n;
      }
      // write will grow if needed
      if (shouldGrow) this.writeSync(buf.subarray(0, nread));
      else this.#reslice(this.length + nread);
      n += nread;
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45NS4wL2lvL2J1ZmZlci50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcIi4uL191dGlsL2Fzc2VydC50c1wiO1xuaW1wb3J0IHsgY29weSB9IGZyb20gXCIuLi9ieXRlcy9tb2QudHNcIjtcblxuLy8gTUlOX1JFQUQgaXMgdGhlIG1pbmltdW0gQXJyYXlCdWZmZXIgc2l6ZSBwYXNzZWQgdG8gYSByZWFkIGNhbGwgYnlcbi8vIGJ1ZmZlci5SZWFkRnJvbS4gQXMgbG9uZyBhcyB0aGUgQnVmZmVyIGhhcyBhdCBsZWFzdCBNSU5fUkVBRCBieXRlcyBiZXlvbmRcbi8vIHdoYXQgaXMgcmVxdWlyZWQgdG8gaG9sZCB0aGUgY29udGVudHMgb2YgciwgcmVhZEZyb20oKSB3aWxsIG5vdCBncm93IHRoZVxuLy8gdW5kZXJseWluZyBidWZmZXIuXG5jb25zdCBNSU5fUkVBRCA9IDMyICogMTAyNDtcbmNvbnN0IE1BWF9TSVpFID0gMiAqKiAzMiAtIDI7XG5cbi8qKiBBIHZhcmlhYmxlLXNpemVkIGJ1ZmZlciBvZiBieXRlcyB3aXRoIGByZWFkKClgIGFuZCBgd3JpdGUoKWAgbWV0aG9kcy5cbiAqXG4gKiBCdWZmZXIgaXMgYWxtb3N0IGFsd2F5cyB1c2VkIHdpdGggc29tZSBJL08gbGlrZSBmaWxlcyBhbmQgc29ja2V0cy4gSXQgYWxsb3dzXG4gKiBvbmUgdG8gYnVmZmVyIHVwIGEgZG93bmxvYWQgZnJvbSBhIHNvY2tldC4gQnVmZmVyIGdyb3dzIGFuZCBzaHJpbmtzIGFzXG4gKiBuZWNlc3NhcnkuXG4gKlxuICogQnVmZmVyIGlzIE5PVCB0aGUgc2FtZSB0aGluZyBhcyBOb2RlJ3MgQnVmZmVyLiBOb2RlJ3MgQnVmZmVyIHdhcyBjcmVhdGVkIGluXG4gKiAyMDA5IGJlZm9yZSBKYXZhU2NyaXB0IGhhZCB0aGUgY29uY2VwdCBvZiBBcnJheUJ1ZmZlcnMuIEl0J3Mgc2ltcGx5IGFcbiAqIG5vbi1zdGFuZGFyZCBBcnJheUJ1ZmZlci5cbiAqXG4gKiBBcnJheUJ1ZmZlciBpcyBhIGZpeGVkIG1lbW9yeSBhbGxvY2F0aW9uLiBCdWZmZXIgaXMgaW1wbGVtZW50ZWQgb24gdG9wIG9mXG4gKiBBcnJheUJ1ZmZlci5cbiAqXG4gKiBCYXNlZCBvbiBbR28gQnVmZmVyXShodHRwczovL2dvbGFuZy5vcmcvcGtnL2J5dGVzLyNCdWZmZXIpLiAqL1xuXG5leHBvcnQgY2xhc3MgQnVmZmVyIHtcbiAgI2J1ZjogVWludDhBcnJheTsgLy8gY29udGVudHMgYXJlIHRoZSBieXRlcyBidWZbb2ZmIDogbGVuKGJ1ZildXG4gICNvZmYgPSAwOyAvLyByZWFkIGF0IGJ1ZltvZmZdLCB3cml0ZSBhdCBidWZbYnVmLmJ5dGVMZW5ndGhdXG5cbiAgY29uc3RydWN0b3IoYWI/OiBBcnJheUJ1ZmZlcikge1xuICAgIGlmIChhYiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLiNidWYgPSBuZXcgVWludDhBcnJheSgwKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy4jYnVmID0gbmV3IFVpbnQ4QXJyYXkoYWIpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgYSBzbGljZSBob2xkaW5nIHRoZSB1bnJlYWQgcG9ydGlvbiBvZiB0aGUgYnVmZmVyLlxuICAgKlxuICAgKiBUaGUgc2xpY2UgaXMgdmFsaWQgZm9yIHVzZSBvbmx5IHVudGlsIHRoZSBuZXh0IGJ1ZmZlciBtb2RpZmljYXRpb24gKHRoYXRcbiAgICogaXMsIG9ubHkgdW50aWwgdGhlIG5leHQgY2FsbCB0byBhIG1ldGhvZCBsaWtlIGByZWFkKClgLCBgd3JpdGUoKWAsXG4gICAqIGByZXNldCgpYCwgb3IgYHRydW5jYXRlKClgKS4gSWYgYG9wdGlvbnMuY29weWAgaXMgZmFsc2UgdGhlIHNsaWNlIGFsaWFzZXMgdGhlIGJ1ZmZlciBjb250ZW50IGF0XG4gICAqIGxlYXN0IHVudGlsIHRoZSBuZXh0IGJ1ZmZlciBtb2RpZmljYXRpb24sIHNvIGltbWVkaWF0ZSBjaGFuZ2VzIHRvIHRoZVxuICAgKiBzbGljZSB3aWxsIGFmZmVjdCB0aGUgcmVzdWx0IG9mIGZ1dHVyZSByZWFkcy5cbiAgICogQHBhcmFtIG9wdGlvbnMgRGVmYXVsdHMgdG8gYHsgY29weTogdHJ1ZSB9YFxuICAgKi9cbiAgYnl0ZXMob3B0aW9ucyA9IHsgY29weTogdHJ1ZSB9KTogVWludDhBcnJheSB7XG4gICAgaWYgKG9wdGlvbnMuY29weSA9PT0gZmFsc2UpIHJldHVybiB0aGlzLiNidWYuc3ViYXJyYXkodGhpcy4jb2ZmKTtcbiAgICByZXR1cm4gdGhpcy4jYnVmLnNsaWNlKHRoaXMuI29mZik7XG4gIH1cblxuICAvKiogUmV0dXJucyB3aGV0aGVyIHRoZSB1bnJlYWQgcG9ydGlvbiBvZiB0aGUgYnVmZmVyIGlzIGVtcHR5LiAqL1xuICBlbXB0eSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4jYnVmLmJ5dGVMZW5ndGggPD0gdGhpcy4jb2ZmO1xuICB9XG5cbiAgLyoqIEEgcmVhZCBvbmx5IG51bWJlciBvZiBieXRlcyBvZiB0aGUgdW5yZWFkIHBvcnRpb24gb2YgdGhlIGJ1ZmZlci4gKi9cbiAgZ2V0IGxlbmd0aCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLiNidWYuYnl0ZUxlbmd0aCAtIHRoaXMuI29mZjtcbiAgfVxuXG4gIC8qKiBUaGUgcmVhZCBvbmx5IGNhcGFjaXR5IG9mIHRoZSBidWZmZXIncyB1bmRlcmx5aW5nIGJ5dGUgc2xpY2UsIHRoYXQgaXMsXG4gICAqIHRoZSB0b3RhbCBzcGFjZSBhbGxvY2F0ZWQgZm9yIHRoZSBidWZmZXIncyBkYXRhLiAqL1xuICBnZXQgY2FwYWNpdHkoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy4jYnVmLmJ1ZmZlci5ieXRlTGVuZ3RoO1xuICB9XG5cbiAgLyoqIERpc2NhcmRzIGFsbCBidXQgdGhlIGZpcnN0IGBuYCB1bnJlYWQgYnl0ZXMgZnJvbSB0aGUgYnVmZmVyIGJ1dFxuICAgKiBjb250aW51ZXMgdG8gdXNlIHRoZSBzYW1lIGFsbG9jYXRlZCBzdG9yYWdlLiBJdCB0aHJvd3MgaWYgYG5gIGlzXG4gICAqIG5lZ2F0aXZlIG9yIGdyZWF0ZXIgdGhhbiB0aGUgbGVuZ3RoIG9mIHRoZSBidWZmZXIuICovXG4gIHRydW5jYXRlKG46IG51bWJlcik6IHZvaWQge1xuICAgIGlmIChuID09PSAwKSB7XG4gICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChuIDwgMCB8fCBuID4gdGhpcy5sZW5ndGgpIHtcbiAgICAgIHRocm93IEVycm9yKFwiYnl0ZXMuQnVmZmVyOiB0cnVuY2F0aW9uIG91dCBvZiByYW5nZVwiKTtcbiAgICB9XG4gICAgdGhpcy4jcmVzbGljZSh0aGlzLiNvZmYgKyBuKTtcbiAgfVxuXG4gIHJlc2V0KCk6IHZvaWQge1xuICAgIHRoaXMuI3Jlc2xpY2UoMCk7XG4gICAgdGhpcy4jb2ZmID0gMDtcbiAgfVxuXG4gICN0cnlHcm93QnlSZXNsaWNlID0gKG46IG51bWJlcikgPT4ge1xuICAgIGNvbnN0IGwgPSB0aGlzLiNidWYuYnl0ZUxlbmd0aDtcbiAgICBpZiAobiA8PSB0aGlzLmNhcGFjaXR5IC0gbCkge1xuICAgICAgdGhpcy4jcmVzbGljZShsICsgbik7XG4gICAgICByZXR1cm4gbDtcbiAgICB9XG4gICAgcmV0dXJuIC0xO1xuICB9O1xuXG4gICNyZXNsaWNlID0gKGxlbjogbnVtYmVyKSA9PiB7XG4gICAgYXNzZXJ0KGxlbiA8PSB0aGlzLiNidWYuYnVmZmVyLmJ5dGVMZW5ndGgpO1xuICAgIHRoaXMuI2J1ZiA9IG5ldyBVaW50OEFycmF5KHRoaXMuI2J1Zi5idWZmZXIsIDAsIGxlbik7XG4gIH07XG5cbiAgLyoqIFJlYWRzIHRoZSBuZXh0IGBwLmxlbmd0aGAgYnl0ZXMgZnJvbSB0aGUgYnVmZmVyIG9yIHVudGlsIHRoZSBidWZmZXIgaXNcbiAgICogZHJhaW5lZC4gUmV0dXJucyB0aGUgbnVtYmVyIG9mIGJ5dGVzIHJlYWQuIElmIHRoZSBidWZmZXIgaGFzIG5vIGRhdGEgdG9cbiAgICogcmV0dXJuLCB0aGUgcmV0dXJuIGlzIEVPRiAoYG51bGxgKS4gKi9cbiAgcmVhZFN5bmMocDogVWludDhBcnJheSk6IG51bWJlciB8IG51bGwge1xuICAgIGlmICh0aGlzLmVtcHR5KCkpIHtcbiAgICAgIC8vIEJ1ZmZlciBpcyBlbXB0eSwgcmVzZXQgdG8gcmVjb3ZlciBzcGFjZS5cbiAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgIGlmIChwLmJ5dGVMZW5ndGggPT09IDApIHtcbiAgICAgICAgLy8gdGhpcyBlZGdlIGNhc2UgaXMgdGVzdGVkIGluICdidWZmZXJSZWFkRW1wdHlBdEVPRicgdGVzdFxuICAgICAgICByZXR1cm4gMDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBucmVhZCA9IGNvcHkodGhpcy4jYnVmLnN1YmFycmF5KHRoaXMuI29mZiksIHApO1xuICAgIHRoaXMuI29mZiArPSBucmVhZDtcbiAgICByZXR1cm4gbnJlYWQ7XG4gIH1cblxuICAvKiogUmVhZHMgdGhlIG5leHQgYHAubGVuZ3RoYCBieXRlcyBmcm9tIHRoZSBidWZmZXIgb3IgdW50aWwgdGhlIGJ1ZmZlciBpc1xuICAgKiBkcmFpbmVkLiBSZXNvbHZlcyB0byB0aGUgbnVtYmVyIG9mIGJ5dGVzIHJlYWQuIElmIHRoZSBidWZmZXIgaGFzIG5vXG4gICAqIGRhdGEgdG8gcmV0dXJuLCByZXNvbHZlcyB0byBFT0YgKGBudWxsYCkuXG4gICAqXG4gICAqIE5PVEU6IFRoaXMgbWV0aG9kcyByZWFkcyBieXRlcyBzeW5jaHJvbm91c2x5OyBpdCdzIHByb3ZpZGVkIGZvclxuICAgKiBjb21wYXRpYmlsaXR5IHdpdGggYFJlYWRlcmAgaW50ZXJmYWNlcy5cbiAgICovXG4gIHJlYWQocDogVWludDhBcnJheSk6IFByb21pc2U8bnVtYmVyIHwgbnVsbD4ge1xuICAgIGNvbnN0IHJyID0gdGhpcy5yZWFkU3luYyhwKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJyKTtcbiAgfVxuXG4gIHdyaXRlU3luYyhwOiBVaW50OEFycmF5KTogbnVtYmVyIHtcbiAgICBjb25zdCBtID0gdGhpcy4jZ3JvdyhwLmJ5dGVMZW5ndGgpO1xuICAgIHJldHVybiBjb3B5KHAsIHRoaXMuI2J1ZiwgbSk7XG4gIH1cblxuICAvKiogTk9URTogVGhpcyBtZXRob2RzIHdyaXRlcyBieXRlcyBzeW5jaHJvbm91c2x5OyBpdCdzIHByb3ZpZGVkIGZvclxuICAgKiBjb21wYXRpYmlsaXR5IHdpdGggYFdyaXRlcmAgaW50ZXJmYWNlLiAqL1xuICB3cml0ZShwOiBVaW50OEFycmF5KTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBjb25zdCBuID0gdGhpcy53cml0ZVN5bmMocCk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuKTtcbiAgfVxuXG4gICNncm93ID0gKG46IG51bWJlcikgPT4ge1xuICAgIGNvbnN0IG0gPSB0aGlzLmxlbmd0aDtcbiAgICAvLyBJZiBidWZmZXIgaXMgZW1wdHksIHJlc2V0IHRvIHJlY292ZXIgc3BhY2UuXG4gICAgaWYgKG0gPT09IDAgJiYgdGhpcy4jb2ZmICE9PSAwKSB7XG4gICAgICB0aGlzLnJlc2V0KCk7XG4gICAgfVxuICAgIC8vIEZhc3Q6IFRyeSB0byBncm93IGJ5IG1lYW5zIG9mIGEgcmVzbGljZS5cbiAgICBjb25zdCBpID0gdGhpcy4jdHJ5R3Jvd0J5UmVzbGljZShuKTtcbiAgICBpZiAoaSA+PSAwKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gICAgY29uc3QgYyA9IHRoaXMuY2FwYWNpdHk7XG4gICAgaWYgKG4gPD0gTWF0aC5mbG9vcihjIC8gMikgLSBtKSB7XG4gICAgICAvLyBXZSBjYW4gc2xpZGUgdGhpbmdzIGRvd24gaW5zdGVhZCBvZiBhbGxvY2F0aW5nIGEgbmV3XG4gICAgICAvLyBBcnJheUJ1ZmZlci4gV2Ugb25seSBuZWVkIG0rbiA8PSBjIHRvIHNsaWRlLCBidXRcbiAgICAgIC8vIHdlIGluc3RlYWQgbGV0IGNhcGFjaXR5IGdldCB0d2ljZSBhcyBsYXJnZSBzbyB3ZVxuICAgICAgLy8gZG9uJ3Qgc3BlbmQgYWxsIG91ciB0aW1lIGNvcHlpbmcuXG4gICAgICBjb3B5KHRoaXMuI2J1Zi5zdWJhcnJheSh0aGlzLiNvZmYpLCB0aGlzLiNidWYpO1xuICAgIH0gZWxzZSBpZiAoYyArIG4gPiBNQVhfU0laRSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIGJ1ZmZlciBjYW5ub3QgYmUgZ3Jvd24gYmV5b25kIHRoZSBtYXhpbXVtIHNpemUuXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBOb3QgZW5vdWdoIHNwYWNlIGFueXdoZXJlLCB3ZSBuZWVkIHRvIGFsbG9jYXRlLlxuICAgICAgY29uc3QgYnVmID0gbmV3IFVpbnQ4QXJyYXkoTWF0aC5taW4oMiAqIGMgKyBuLCBNQVhfU0laRSkpO1xuICAgICAgY29weSh0aGlzLiNidWYuc3ViYXJyYXkodGhpcy4jb2ZmKSwgYnVmKTtcbiAgICAgIHRoaXMuI2J1ZiA9IGJ1ZjtcbiAgICB9XG4gICAgLy8gUmVzdG9yZSB0aGlzLiNvZmYgYW5kIGxlbih0aGlzLiNidWYpLlxuICAgIHRoaXMuI29mZiA9IDA7XG4gICAgdGhpcy4jcmVzbGljZShNYXRoLm1pbihtICsgbiwgTUFYX1NJWkUpKTtcbiAgICByZXR1cm4gbTtcbiAgfTtcblxuICAvKiogR3Jvd3MgdGhlIGJ1ZmZlcidzIGNhcGFjaXR5LCBpZiBuZWNlc3NhcnksIHRvIGd1YXJhbnRlZSBzcGFjZSBmb3JcbiAgICogYW5vdGhlciBgbmAgYnl0ZXMuIEFmdGVyIGAuZ3JvdyhuKWAsIGF0IGxlYXN0IGBuYCBieXRlcyBjYW4gYmUgd3JpdHRlbiB0b1xuICAgKiB0aGUgYnVmZmVyIHdpdGhvdXQgYW5vdGhlciBhbGxvY2F0aW9uLiBJZiBgbmAgaXMgbmVnYXRpdmUsIGAuZ3JvdygpYCB3aWxsXG4gICAqIHRocm93LiBJZiB0aGUgYnVmZmVyIGNhbid0IGdyb3cgaXQgd2lsbCB0aHJvdyBhbiBlcnJvci5cbiAgICpcbiAgICogQmFzZWQgb24gR28gTGFuZydzXG4gICAqIFtCdWZmZXIuR3Jvd10oaHR0cHM6Ly9nb2xhbmcub3JnL3BrZy9ieXRlcy8jQnVmZmVyLkdyb3cpLiAqL1xuICBncm93KG46IG51bWJlcik6IHZvaWQge1xuICAgIGlmIChuIDwgMCkge1xuICAgICAgdGhyb3cgRXJyb3IoXCJCdWZmZXIuZ3JvdzogbmVnYXRpdmUgY291bnRcIik7XG4gICAgfVxuICAgIGNvbnN0IG0gPSB0aGlzLiNncm93KG4pO1xuICAgIHRoaXMuI3Jlc2xpY2UobSk7XG4gIH1cblxuICAvKiogUmVhZHMgZGF0YSBmcm9tIGByYCB1bnRpbCBFT0YgKGBudWxsYCkgYW5kIGFwcGVuZHMgaXQgdG8gdGhlIGJ1ZmZlcixcbiAgICogZ3Jvd2luZyB0aGUgYnVmZmVyIGFzIG5lZWRlZC4gSXQgcmVzb2x2ZXMgdG8gdGhlIG51bWJlciBvZiBieXRlcyByZWFkLlxuICAgKiBJZiB0aGUgYnVmZmVyIGJlY29tZXMgdG9vIGxhcmdlLCBgLnJlYWRGcm9tKClgIHdpbGwgcmVqZWN0IHdpdGggYW4gZXJyb3IuXG4gICAqXG4gICAqIEJhc2VkIG9uIEdvIExhbmcnc1xuICAgKiBbQnVmZmVyLlJlYWRGcm9tXShodHRwczovL2dvbGFuZy5vcmcvcGtnL2J5dGVzLyNCdWZmZXIuUmVhZEZyb20pLiAqL1xuICBhc3luYyByZWFkRnJvbShyOiBEZW5vLlJlYWRlcik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgbGV0IG4gPSAwO1xuICAgIGNvbnN0IHRtcCA9IG5ldyBVaW50OEFycmF5KE1JTl9SRUFEKTtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgY29uc3Qgc2hvdWxkR3JvdyA9IHRoaXMuY2FwYWNpdHkgLSB0aGlzLmxlbmd0aCA8IE1JTl9SRUFEO1xuICAgICAgLy8gcmVhZCBpbnRvIHRtcCBidWZmZXIgaWYgdGhlcmUncyBub3QgZW5vdWdoIHJvb21cbiAgICAgIC8vIG90aGVyd2lzZSByZWFkIGRpcmVjdGx5IGludG8gdGhlIGludGVybmFsIGJ1ZmZlclxuICAgICAgY29uc3QgYnVmID0gc2hvdWxkR3Jvd1xuICAgICAgICA/IHRtcFxuICAgICAgICA6IG5ldyBVaW50OEFycmF5KHRoaXMuI2J1Zi5idWZmZXIsIHRoaXMubGVuZ3RoKTtcblxuICAgICAgY29uc3QgbnJlYWQgPSBhd2FpdCByLnJlYWQoYnVmKTtcbiAgICAgIGlmIChucmVhZCA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbjtcbiAgICAgIH1cblxuICAgICAgLy8gd3JpdGUgd2lsbCBncm93IGlmIG5lZWRlZFxuICAgICAgaWYgKHNob3VsZEdyb3cpIHRoaXMud3JpdGVTeW5jKGJ1Zi5zdWJhcnJheSgwLCBucmVhZCkpO1xuICAgICAgZWxzZSB0aGlzLiNyZXNsaWNlKHRoaXMubGVuZ3RoICsgbnJlYWQpO1xuXG4gICAgICBuICs9IG5yZWFkO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSZWFkcyBkYXRhIGZyb20gYHJgIHVudGlsIEVPRiAoYG51bGxgKSBhbmQgYXBwZW5kcyBpdCB0byB0aGUgYnVmZmVyLFxuICAgKiBncm93aW5nIHRoZSBidWZmZXIgYXMgbmVlZGVkLiBJdCByZXR1cm5zIHRoZSBudW1iZXIgb2YgYnl0ZXMgcmVhZC4gSWYgdGhlXG4gICAqIGJ1ZmZlciBiZWNvbWVzIHRvbyBsYXJnZSwgYC5yZWFkRnJvbVN5bmMoKWAgd2lsbCB0aHJvdyBhbiBlcnJvci5cbiAgICpcbiAgICogQmFzZWQgb24gR28gTGFuZydzXG4gICAqIFtCdWZmZXIuUmVhZEZyb21dKGh0dHBzOi8vZ29sYW5nLm9yZy9wa2cvYnl0ZXMvI0J1ZmZlci5SZWFkRnJvbSkuICovXG4gIHJlYWRGcm9tU3luYyhyOiBEZW5vLlJlYWRlclN5bmMpOiBudW1iZXIge1xuICAgIGxldCBuID0gMDtcbiAgICBjb25zdCB0bXAgPSBuZXcgVWludDhBcnJheShNSU5fUkVBRCk7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGNvbnN0IHNob3VsZEdyb3cgPSB0aGlzLmNhcGFjaXR5IC0gdGhpcy5sZW5ndGggPCBNSU5fUkVBRDtcbiAgICAgIC8vIHJlYWQgaW50byB0bXAgYnVmZmVyIGlmIHRoZXJlJ3Mgbm90IGVub3VnaCByb29tXG4gICAgICAvLyBvdGhlcndpc2UgcmVhZCBkaXJlY3RseSBpbnRvIHRoZSBpbnRlcm5hbCBidWZmZXJcbiAgICAgIGNvbnN0IGJ1ZiA9IHNob3VsZEdyb3dcbiAgICAgICAgPyB0bXBcbiAgICAgICAgOiBuZXcgVWludDhBcnJheSh0aGlzLiNidWYuYnVmZmVyLCB0aGlzLmxlbmd0aCk7XG5cbiAgICAgIGNvbnN0IG5yZWFkID0gci5yZWFkU3luYyhidWYpO1xuICAgICAgaWYgKG5yZWFkID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBuO1xuICAgICAgfVxuXG4gICAgICAvLyB3cml0ZSB3aWxsIGdyb3cgaWYgbmVlZGVkXG4gICAgICBpZiAoc2hvdWxkR3JvdykgdGhpcy53cml0ZVN5bmMoYnVmLnN1YmFycmF5KDAsIG5yZWFkKSk7XG4gICAgICBlbHNlIHRoaXMuI3Jlc2xpY2UodGhpcy5sZW5ndGggKyBucmVhZCk7XG5cbiAgICAgIG4gKz0gbnJlYWQ7XG4gICAgfVxuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsTUFBTSxTQUFRLGtCQUFvQjtTQUNsQyxJQUFJLFNBQVEsZUFBaUI7QUFFdEMsRUFBb0UsQUFBcEUsa0VBQW9FO0FBQ3BFLEVBQTRFLEFBQTVFLDBFQUE0RTtBQUM1RSxFQUEyRSxBQUEzRSx5RUFBMkU7QUFDM0UsRUFBcUIsQUFBckIsbUJBQXFCO01BQ2YsUUFBUSxHQUFHLEVBQUUsR0FBRyxJQUFJO01BQ3BCLFFBQVEsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUM7QUFFNUIsRUFhaUUsQUFiakU7Ozs7Ozs7Ozs7Ozs7K0RBYWlFLEFBYmpFLEVBYWlFLGNBRXBELE1BQU07S0FDaEIsR0FBRztLQUNILEdBQUcsR0FBRyxDQUFDO2dCQUVJLEVBQWdCO1lBQ3RCLEVBQUUsS0FBSyxTQUFT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
