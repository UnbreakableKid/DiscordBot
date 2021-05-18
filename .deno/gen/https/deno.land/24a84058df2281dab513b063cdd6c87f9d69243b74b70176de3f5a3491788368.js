// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
//
// Adapted from Node.js. Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// These are simplified versions of the "real" errors in Node.
class NodeFalsyValueRejectionError extends Error {
  reason;
  code = "ERR_FALSY_VALUE_REJECTION";
  constructor(reason) {
    super("Promise was rejected with falsy value");
    this.reason = reason;
  }
}
class NodeInvalidArgTypeError extends TypeError {
  code = "ERR_INVALID_ARG_TYPE";
  constructor(argumentName) {
    super(`The ${argumentName} argument must be of type function.`);
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function callbackify(original) {
  if (typeof original !== "function") {
    throw new NodeInvalidArgTypeError('"original"');
  }
  const callbackified = function (...args) {
    const maybeCb = args.pop();
    if (typeof maybeCb !== "function") {
      throw new NodeInvalidArgTypeError("last");
    }
    const cb = (...args) => {
      maybeCb.apply(this, args);
    };
    original.apply(this, args).then((ret) => {
      queueMicrotask(cb.bind(this, null, ret));
    }, (rej) => {
      rej = rej || new NodeFalsyValueRejectionError(rej);
      queueMicrotask(cb.bind(this, rej));
    });
  };
  const descriptors = Object.getOwnPropertyDescriptors(original);
  // It is possible to manipulate a functions `length` or `name` property. This
  // guards against the manipulation.
  if (typeof descriptors.length.value === "number") {
    descriptors.length.value++;
  }
  if (typeof descriptors.name.value === "string") {
    descriptors.name.value += "Callbackified";
  }
  Object.defineProperties(callbackified, descriptors);
  return callbackified;
}
export { callbackify };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC42Ni4wL25vZGUvX3V0aWwvX3V0aWxfY2FsbGJhY2tpZnkudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjAgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vL1xuLy8gQWRhcHRlZCBmcm9tIE5vZGUuanMuIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyBUaGVzZSBhcmUgc2ltcGxpZmllZCB2ZXJzaW9ucyBvZiB0aGUgXCJyZWFsXCIgZXJyb3JzIGluIE5vZGUuXG5jbGFzcyBOb2RlRmFsc3lWYWx1ZVJlamVjdGlvbkVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBwdWJsaWMgcmVhc29uOiB1bmtub3duO1xuICBwdWJsaWMgY29kZSA9IFwiRVJSX0ZBTFNZX1ZBTFVFX1JFSkVDVElPTlwiO1xuICBjb25zdHJ1Y3RvcihyZWFzb246IHVua25vd24pIHtcbiAgICBzdXBlcihcIlByb21pc2Ugd2FzIHJlamVjdGVkIHdpdGggZmFsc3kgdmFsdWVcIik7XG4gICAgdGhpcy5yZWFzb24gPSByZWFzb247XG4gIH1cbn1cbmNsYXNzIE5vZGVJbnZhbGlkQXJnVHlwZUVycm9yIGV4dGVuZHMgVHlwZUVycm9yIHtcbiAgcHVibGljIGNvZGUgPSBcIkVSUl9JTlZBTElEX0FSR19UWVBFXCI7XG4gIGNvbnN0cnVjdG9yKGFyZ3VtZW50TmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFRoZSAke2FyZ3VtZW50TmFtZX0gYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIGZ1bmN0aW9uLmApO1xuICB9XG59XG5cbnR5cGUgQ2FsbGJhY2s8UmVzdWx0VD4gPVxuICB8ICgoZXJyOiBFcnJvcikgPT4gdm9pZClcbiAgfCAoKGVycjogbnVsbCwgcmVzdWx0OiBSZXN1bHRUKSA9PiB2b2lkKTtcblxuZnVuY3Rpb24gY2FsbGJhY2tpZnk8UmVzdWx0VD4oXG4gIGZuOiAoKSA9PiBQcm9taXNlTGlrZTxSZXN1bHRUPixcbik6IChjYWxsYmFjazogQ2FsbGJhY2s8UmVzdWx0VD4pID0+IHZvaWQ7XG5mdW5jdGlvbiBjYWxsYmFja2lmeTxBcmdULCBSZXN1bHRUPihcbiAgZm46IChhcmc6IEFyZ1QpID0+IFByb21pc2VMaWtlPFJlc3VsdFQ+LFxuKTogKGFyZzogQXJnVCwgY2FsbGJhY2s6IENhbGxiYWNrPFJlc3VsdFQ+KSA9PiB2b2lkO1xuZnVuY3Rpb24gY2FsbGJhY2tpZnk8QXJnMVQsIEFyZzJULCBSZXN1bHRUPihcbiAgZm46IChhcmcxOiBBcmcxVCwgYXJnMjogQXJnMlQpID0+IFByb21pc2VMaWtlPFJlc3VsdFQ+LFxuKTogKGFyZzE6IEFyZzFULCBhcmcyOiBBcmcyVCwgY2FsbGJhY2s6IENhbGxiYWNrPFJlc3VsdFQ+KSA9PiB2b2lkO1xuZnVuY3Rpb24gY2FsbGJhY2tpZnk8QXJnMVQsIEFyZzJULCBBcmczVCwgUmVzdWx0VD4oXG4gIGZuOiAoYXJnMTogQXJnMVQsIGFyZzI6IEFyZzJULCBhcmczOiBBcmczVCkgPT4gUHJvbWlzZUxpa2U8UmVzdWx0VD4sXG4pOiAoYXJnMTogQXJnMVQsIGFyZzI6IEFyZzJULCBhcmczOiBBcmczVCwgY2FsbGJhY2s6IENhbGxiYWNrPFJlc3VsdFQ+KSA9PiB2b2lkO1xuZnVuY3Rpb24gY2FsbGJhY2tpZnk8QXJnMVQsIEFyZzJULCBBcmczVCwgQXJnNFQsIFJlc3VsdFQ+KFxuICBmbjogKFxuICAgIGFyZzE6IEFyZzFULFxuICAgIGFyZzI6IEFyZzJULFxuICAgIGFyZzM6IEFyZzNULFxuICAgIGFyZzQ6IEFyZzRULFxuICApID0+IFByb21pc2VMaWtlPFJlc3VsdFQ+LFxuKTogKFxuICBhcmcxOiBBcmcxVCxcbiAgYXJnMjogQXJnMlQsXG4gIGFyZzM6IEFyZzNULFxuICBhcmc0OiBBcmc0VCxcbiAgY2FsbGJhY2s6IENhbGxiYWNrPFJlc3VsdFQ+LFxuKSA9PiB2b2lkO1xuZnVuY3Rpb24gY2FsbGJhY2tpZnk8QXJnMVQsIEFyZzJULCBBcmczVCwgQXJnNFQsIEFyZzVULCBSZXN1bHRUPihcbiAgZm46IChcbiAgICBhcmcxOiBBcmcxVCxcbiAgICBhcmcyOiBBcmcyVCxcbiAgICBhcmczOiBBcmczVCxcbiAgICBhcmc0OiBBcmc0VCxcbiAgICBhcmc1OiBBcmc1VCxcbiAgKSA9PiBQcm9taXNlTGlrZTxSZXN1bHRUPixcbik6IChcbiAgYXJnMTogQXJnMVQsXG4gIGFyZzI6IEFyZzJULFxuICBhcmczOiBBcmczVCxcbiAgYXJnNDogQXJnNFQsXG4gIGFyZzU6IEFyZzVULFxuICBjYWxsYmFjazogQ2FsbGJhY2s8UmVzdWx0VD4sXG4pID0+IHZvaWQ7XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG5mdW5jdGlvbiBjYWxsYmFja2lmeShvcmlnaW5hbDogYW55KTogYW55IHtcbiAgaWYgKHR5cGVvZiBvcmlnaW5hbCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgdGhyb3cgbmV3IE5vZGVJbnZhbGlkQXJnVHlwZUVycm9yKCdcIm9yaWdpbmFsXCInKTtcbiAgfVxuXG4gIGNvbnN0IGNhbGxiYWNraWZpZWQgPSBmdW5jdGlvbiAodGhpczogdW5rbm93biwgLi4uYXJnczogdW5rbm93bltdKTogdm9pZCB7XG4gICAgY29uc3QgbWF5YmVDYiA9IGFyZ3MucG9wKCk7XG4gICAgaWYgKHR5cGVvZiBtYXliZUNiICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIHRocm93IG5ldyBOb2RlSW52YWxpZEFyZ1R5cGVFcnJvcihcImxhc3RcIik7XG4gICAgfVxuICAgIGNvbnN0IGNiID0gKC4uLmFyZ3M6IHVua25vd25bXSk6IHZvaWQgPT4ge1xuICAgICAgbWF5YmVDYi5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9O1xuICAgIG9yaWdpbmFsLmFwcGx5KHRoaXMsIGFyZ3MpLnRoZW4oXG4gICAgICAocmV0OiB1bmtub3duKSA9PiB7XG4gICAgICAgIHF1ZXVlTWljcm90YXNrKGNiLmJpbmQodGhpcywgbnVsbCwgcmV0KSk7XG4gICAgICB9LFxuICAgICAgKHJlajogdW5rbm93bikgPT4ge1xuICAgICAgICByZWogPSByZWogfHwgbmV3IE5vZGVGYWxzeVZhbHVlUmVqZWN0aW9uRXJyb3IocmVqKTtcbiAgICAgICAgcXVldWVNaWNyb3Rhc2soY2IuYmluZCh0aGlzLCByZWopKTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfTtcblxuICBjb25zdCBkZXNjcmlwdG9ycyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKG9yaWdpbmFsKTtcbiAgLy8gSXQgaXMgcG9zc2libGUgdG8gbWFuaXB1bGF0ZSBhIGZ1bmN0aW9ucyBgbGVuZ3RoYCBvciBgbmFtZWAgcHJvcGVydHkuIFRoaXNcbiAgLy8gZ3VhcmRzIGFnYWluc3QgdGhlIG1hbmlwdWxhdGlvbi5cbiAgaWYgKHR5cGVvZiBkZXNjcmlwdG9ycy5sZW5ndGgudmFsdWUgPT09IFwibnVtYmVyXCIpIHtcbiAgICBkZXNjcmlwdG9ycy5sZW5ndGgudmFsdWUrKztcbiAgfVxuICBpZiAodHlwZW9mIGRlc2NyaXB0b3JzLm5hbWUudmFsdWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICBkZXNjcmlwdG9ycy5uYW1lLnZhbHVlICs9IFwiQ2FsbGJhY2tpZmllZFwiO1xuICB9XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKGNhbGxiYWNraWZpZWQsIGRlc2NyaXB0b3JzKTtcbiAgcmV0dXJu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
