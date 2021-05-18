// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { deferred } from "./deferred.ts";
/** The MuxAsyncIterator class multiplexes multiple async iterators into a
 * single stream. It currently makes an assumption:
 * - The final result (the value returned and not yielded from the iterator)
 *   does not matter; if there is any, it is discarded.
 */ export class MuxAsyncIterator {
  iteratorCount = 0;
  yields = [];
  // deno-lint-ignore no-explicit-any
  throws = [];
  signal = deferred();
  add(iterator) {
    ++this.iteratorCount;
    this.callIteratorNext(iterator);
  }
  async callIteratorNext(iterator) {
    try {
      const { value, done } = await iterator.next();
      if (done) {
        --this.iteratorCount;
      } else {
        this.yields.push({
          iterator,
          value,
        });
      }
    } catch (e) {
      this.throws.push(e);
    }
    this.signal.resolve();
  }
  async *iterate() {
    while (this.iteratorCount > 0) {
      // Sleep until any of the wrapped iterators yields.
      await this.signal;
      // Note that while we're looping over `yields`, new items may be added.
      for (let i = 0; i < this.yields.length; i++) {
        const { iterator, value } = this.yields[i];
        yield value;
        this.callIteratorNext(iterator);
      }
      if (this.throws.length) {
        for (const e of this.throws) {
          throw e;
        }
        this.throws.length = 0;
      }
      // Clear the `yields` list and reset the `signal` promise.
      this.yields.length = 0;
      this.signal = deferred();
    }
  }
  [Symbol.asyncIterator]() {
    return this.iterate();
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45NS4wL2FzeW5jL211eF9hc3luY19pdGVyYXRvci50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMSB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbmltcG9ydCB7IERlZmVycmVkLCBkZWZlcnJlZCB9IGZyb20gXCIuL2RlZmVycmVkLnRzXCI7XG5cbmludGVyZmFjZSBUYWdnZWRZaWVsZGVkVmFsdWU8VD4ge1xuICBpdGVyYXRvcjogQXN5bmNJdGVyYWJsZUl0ZXJhdG9yPFQ+O1xuICB2YWx1ZTogVDtcbn1cblxuLyoqIFRoZSBNdXhBc3luY0l0ZXJhdG9yIGNsYXNzIG11bHRpcGxleGVzIG11bHRpcGxlIGFzeW5jIGl0ZXJhdG9ycyBpbnRvIGFcbiAqIHNpbmdsZSBzdHJlYW0uIEl0IGN1cnJlbnRseSBtYWtlcyBhbiBhc3N1bXB0aW9uOlxuICogLSBUaGUgZmluYWwgcmVzdWx0ICh0aGUgdmFsdWUgcmV0dXJuZWQgYW5kIG5vdCB5aWVsZGVkIGZyb20gdGhlIGl0ZXJhdG9yKVxuICogICBkb2VzIG5vdCBtYXR0ZXI7IGlmIHRoZXJlIGlzIGFueSwgaXQgaXMgZGlzY2FyZGVkLlxuICovXG5leHBvcnQgY2xhc3MgTXV4QXN5bmNJdGVyYXRvcjxUPiBpbXBsZW1lbnRzIEFzeW5jSXRlcmFibGU8VD4ge1xuICBwcml2YXRlIGl0ZXJhdG9yQ291bnQgPSAwO1xuICBwcml2YXRlIHlpZWxkczogQXJyYXk8VGFnZ2VkWWllbGRlZFZhbHVlPFQ+PiA9IFtdO1xuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBwcml2YXRlIHRocm93czogYW55W10gPSBbXTtcbiAgcHJpdmF0ZSBzaWduYWw6IERlZmVycmVkPHZvaWQ+ID0gZGVmZXJyZWQoKTtcblxuICBhZGQoaXRlcmF0b3I6IEFzeW5jSXRlcmFibGVJdGVyYXRvcjxUPik6IHZvaWQge1xuICAgICsrdGhpcy5pdGVyYXRvckNvdW50O1xuICAgIHRoaXMuY2FsbEl0ZXJhdG9yTmV4dChpdGVyYXRvcik7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNhbGxJdGVyYXRvck5leHQoXG4gICAgaXRlcmF0b3I6IEFzeW5jSXRlcmFibGVJdGVyYXRvcjxUPixcbiAgKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHsgdmFsdWUsIGRvbmUgfSA9IGF3YWl0IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgIGlmIChkb25lKSB7XG4gICAgICAgIC0tdGhpcy5pdGVyYXRvckNvdW50O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy55aWVsZHMucHVzaCh7IGl0ZXJhdG9yLCB2YWx1ZSB9KTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aGlzLnRocm93cy5wdXNoKGUpO1xuICAgIH1cbiAgICB0aGlzLnNpZ25hbC5yZXNvbHZlKCk7XG4gIH1cblxuICBhc3luYyAqaXRlcmF0ZSgpOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8VD4ge1xuICAgIHdoaWxlICh0aGlzLml0ZXJhdG9yQ291bnQgPiAwKSB7XG4gICAgICAvLyBTbGVlcCB1bnRpbCBhbnkgb2YgdGhlIHdyYXBwZWQgaXRlcmF0b3JzIHlpZWxkcy5cbiAgICAgIGF3YWl0IHRoaXMuc2lnbmFsO1xuXG4gICAgICAvLyBOb3RlIHRoYXQgd2hpbGUgd2UncmUgbG9vcGluZyBvdmVyIGB5aWVsZHNgLCBuZXcgaXRlbXMgbWF5IGJlIGFkZGVkLlxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnlpZWxkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCB7IGl0ZXJhdG9yLCB2YWx1ZSB9ID0gdGhpcy55aWVsZHNbaV07XG4gICAgICAgIHlpZWxkIHZhbHVlO1xuICAgICAgICB0aGlzLmNhbGxJdGVyYXRvck5leHQoaXRlcmF0b3IpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy50aHJvd3MubGVuZ3RoKSB7XG4gICAgICAgIGZvciAoY29uc3QgZSBvZiB0aGlzLnRocm93cykge1xuICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50aHJvd3MubGVuZ3RoID0gMDtcbiAgICAgIH1cbiAgICAgIC8vIENsZWFyIHRoZSBgeWllbGRzYCBsaXN0IGFuZCByZXNldCB0aGUgYHNpZ25hbGAgcHJvbWlzZS5cbiAgICAgIHRoaXMueWllbGRzLmxlbmd0aCA9IDA7XG4gICAgICB0aGlzLnNpZ25hbCA9IGRlZmVycmVkKCk7XG4gICAgfVxuICB9XG5cbiAgW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSgpOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8VD4ge1xuICAgIHJldHVybiB0aGlzLml0ZXJhdGUoKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEVBQTBFLEFBQTFFLHdFQUEwRTtTQUN2RCxRQUFRLFNBQVEsYUFBZTtBQU9sRCxFQUlHLEFBSkg7Ozs7Q0FJRyxBQUpILEVBSUcsY0FDVSxnQkFBZ0I7SUFDbkIsYUFBYSxHQUFHLENBQUM7SUFDakIsTUFBTTtJQUNkLEVBQW1DLEFBQW5DLGlDQUFtQztJQUMzQixNQUFNO0lBQ04sTUFBTSxHQUFtQixRQUFRO0lBRXpDLEdBQUcsQ0FBQyxRQUFrQztlQUM3QixhQUFhO2FBQ2YsZ0JBQWdCLENBQUMsUUFBUTs7VUFHbEIsZ0JBQWdCLENBQzVCLFFBQWtDOztvQkFHeEIsS0FBSyxHQUFFLElBQUksWUFBVyxRQUFRLENBQUMsSUFBSTtnQkFDdkMsSUFBSTt1QkFDQyxhQUFhOztxQkFFZixNQUFNLENBQUMsSUFBSTtvQkFBRyxRQUFRO29CQUFFLEtBQUs7OztpQkFFN0IsQ0FBQztpQkFDSCxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7O2FBRWYsTUFBTSxDQUFDLE9BQU87O1dBR2QsT0FBTzttQkFDQSxhQUFhLEdBQUcsQ0FBQztZQUMzQixFQUFtRCxBQUFuRCxpREFBbUQ7dUJBQ3hDLE1BQU07WUFFakIsRUFBdUUsQUFBdkUscUVBQXVFO29CQUM5RCxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsUUFBUSxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBQy9CLFFBQVEsR0FBRSxLQUFLLFdBQVUsTUFBTSxDQUFDLENBQUM7c0JBQ25DLEtBQUs7cUJBQ04sZ0JBQWdCLENBQUMsUUFBUTs7cUJBR3ZCLE1BQU0sQ0FBQyxNQUFNOzJCQUNULENBQUMsU0FBUyxNQUFNOzBCQUNuQixDQUFDOztxQkFFSixNQUFNLENBQUMsTUFBTSxHQUFHLENBQUM7O1lBRXhCLEVBQTBELEFBQTFELHdEQUEwRDtpQkFDckQsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDO2lCQUNqQixNQUFNLEdBQUcsUUFBUTs7O0tBSXpCLE1BQU0sQ0FBQyxhQUFhO29CQUNQLE9BQU8ifQ==
