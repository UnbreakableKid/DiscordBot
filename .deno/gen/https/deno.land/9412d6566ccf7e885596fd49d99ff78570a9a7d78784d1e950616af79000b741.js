// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { deferred } from "../async/mod.ts";
import { assert, assertStringIncludes, fail } from "../testing/asserts.ts";
import { readAll } from "../io/util.ts";
export function notImplemented(msg) {
  const message = msg ? `Not implemented: ${msg}` : "Not implemented";
  throw new Error(message);
}
export const _TextDecoder = TextDecoder;
export const _TextEncoder = TextEncoder;
export function intoCallbackAPI( // deno-lint-ignore no-explicit-any
  func,
  cb, // deno-lint-ignore no-explicit-any
  ...args
) {
  func(...args).then((value) => cb && cb(null, value), (err) => cb && cb(err));
}
export function intoCallbackAPIWithIntercept( // deno-lint-ignore no-explicit-any
  func,
  interceptor,
  cb, // deno-lint-ignore no-explicit-any
  ...args
) {
  func(...args).then(
    (value) => cb && cb(null, interceptor(value)),
    (err) => cb && cb(err),
  );
}
export function spliceOne(list, index) {
  for (; index + 1 < list.length; index++) list[index] = list[index + 1];
  list.pop();
}
// Taken from: https://github.com/nodejs/node/blob/ba684805b6c0eded76e5cd89ee00328ac7a59365/lib/internal/util.js#L125
// Return undefined if there is no match.
// Move the "slow cases" to a separate function to make sure this function gets
// inlined properly. That prioritizes the common case.
export function normalizeEncoding(enc) {
  if (enc == null || enc === "utf8" || enc === "utf-8") return "utf8";
  return slowCases(enc);
}
// https://github.com/nodejs/node/blob/ba684805b6c0eded76e5cd89ee00328ac7a59365/lib/internal/util.js#L130
function slowCases(enc) {
  switch (enc.length) {
    case 4:
      if (enc === "UTF8") return "utf8";
      if (enc === "ucs2" || enc === "UCS2") return "utf16le";
      enc = `${enc}`.toLowerCase();
      if (enc === "utf8") return "utf8";
      if (enc === "ucs2") return "utf16le";
      break;
    case 3:
      if (enc === "hex" || enc === "HEX" || `${enc}`.toLowerCase() === "hex") {
        return "hex";
      }
      break;
    case 5:
      if (enc === "ascii") return "ascii";
      if (enc === "ucs-2") return "utf16le";
      if (enc === "UTF-8") return "utf8";
      if (enc === "ASCII") return "ascii";
      if (enc === "UCS-2") return "utf16le";
      enc = `${enc}`.toLowerCase();
      if (enc === "utf-8") return "utf8";
      if (enc === "ascii") return "ascii";
      if (enc === "ucs-2") return "utf16le";
      break;
    case 6:
      if (enc === "base64") return "base64";
      if (enc === "latin1" || enc === "binary") return "latin1";
      if (enc === "BASE64") return "base64";
      if (enc === "LATIN1" || enc === "BINARY") return "latin1";
      enc = `${enc}`.toLowerCase();
      if (enc === "base64") return "base64";
      if (enc === "latin1" || enc === "binary") return "latin1";
      break;
    case 7:
      if (
        enc === "utf16le" || enc === "UTF16LE" ||
        `${enc}`.toLowerCase() === "utf16le"
      ) {
        return "utf16le";
      }
      break;
    case 8:
      if (
        enc === "utf-16le" || enc === "UTF-16LE" ||
        `${enc}`.toLowerCase() === "utf-16le"
      ) {
        return "utf16le";
      }
      break;
    default:
      if (enc === "") return "utf8";
  }
}
export function validateIntegerRange(
  value,
  name,
  min = -2147483648,
  max = 2147483647,
) {
  // The defaults for min and max correspond to the limits of 32-bit integers.
  if (!Number.isInteger(value)) {
    throw new Error(`${name} must be 'an integer' but was ${value}`);
  }
  if (value < min || value > max) {
    throw new Error(
      `${name} must be >= ${min} && <= ${max}. Value was ${value}`,
    );
  }
}
export function once(callback) {
  let called = false;
  return function (...args) {
    if (called) return;
    called = true;
    callback.apply(this, args);
  };
}
/**
 * @param {number} [expectedExecutions = 1]
 * @param {number} [timeout = 1000] Milliseconds to wait before the promise is forcefully exited
*/ export function mustCall(
  fn = () => {
  },
  expectedExecutions = 1,
  timeout = 1000,
) {
  if (expectedExecutions < 1) {
    throw new Error("Expected executions can't be lower than 1");
  }
  let timesExecuted = 0;
  const completed = deferred();
  const abort = setTimeout(() => completed.reject(), timeout);
  function callback(...args) {
    timesExecuted++;
    if (timesExecuted === expectedExecutions) {
      completed.resolve();
    }
    fn.apply(this, args);
  }
  const result = completed.then(() => clearTimeout(abort)).catch(() =>
    fail(
      `Async operation not completed: Expected ${expectedExecutions}, executed ${timesExecuted}`,
    )
  );
  return [
    result,
    callback,
  ];
}
/** Asserts that an error thrown in a callback will not be wrongly caught. */ export async function assertCallbackErrorUncaught(
  { prelude, invocation, cleanup },
) {
  // Since the error has to be uncaught, and that will kill the Deno process,
  // the only way to test this is to spawn a subprocess.
  const p = Deno.run({
    cmd: [
      Deno.execPath(),
      "eval",
      "--no-check",
      "--unstable",
      `${prelude ??
        ""}\n\n      ${invocation}(err) => {\n        // If the bug is present and the callback is called again with an error,\n        // don't throw another error, so if the subprocess fails we know it had the correct behaviour.\n        if (!err) throw new Error("success");\n      });`,
    ],
    stderr: "piped",
  });
  const status = await p.status();
  const stderr = new TextDecoder().decode(await readAll(p.stderr));
  p.close();
  p.stderr.close();
  await cleanup?.();
  assert(!status.success);
  assertStringIncludes(stderr, "Error: success");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45NS4wL25vZGUvX3V0aWxzLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuaW1wb3J0IHsgZGVmZXJyZWQgfSBmcm9tIFwiLi4vYXN5bmMvbW9kLnRzXCI7XG5pbXBvcnQgeyBhc3NlcnQsIGFzc2VydFN0cmluZ0luY2x1ZGVzLCBmYWlsIH0gZnJvbSBcIi4uL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuaW1wb3J0IHsgcmVhZEFsbCB9IGZyb20gXCIuLi9pby91dGlsLnRzXCI7XG5cbmV4cG9ydCB0eXBlIEJpbmFyeUVuY29kaW5ncyA9IFwiYmluYXJ5XCI7XG5cbmV4cG9ydCB0eXBlIFRleHRFbmNvZGluZ3MgPVxuICB8IFwiYXNjaWlcIlxuICB8IFwidXRmOFwiXG4gIHwgXCJ1dGYtOFwiXG4gIHwgXCJ1dGYxNmxlXCJcbiAgfCBcInVjczJcIlxuICB8IFwidWNzLTJcIlxuICB8IFwiYmFzZTY0XCJcbiAgfCBcImxhdGluMVwiXG4gIHwgXCJoZXhcIjtcblxuZXhwb3J0IHR5cGUgRW5jb2RpbmdzID0gQmluYXJ5RW5jb2RpbmdzIHwgVGV4dEVuY29kaW5ncztcblxuZXhwb3J0IGZ1bmN0aW9uIG5vdEltcGxlbWVudGVkKG1zZz86IHN0cmluZyk6IG5ldmVyIHtcbiAgY29uc3QgbWVzc2FnZSA9IG1zZyA/IGBOb3QgaW1wbGVtZW50ZWQ6ICR7bXNnfWAgOiBcIk5vdCBpbXBsZW1lbnRlZFwiO1xuICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSk7XG59XG5cbmV4cG9ydCB0eXBlIF9UZXh0RGVjb2RlciA9IHR5cGVvZiBUZXh0RGVjb2Rlci5wcm90b3R5cGU7XG5leHBvcnQgY29uc3QgX1RleHREZWNvZGVyID0gVGV4dERlY29kZXI7XG5cbmV4cG9ydCB0eXBlIF9UZXh0RW5jb2RlciA9IHR5cGVvZiBUZXh0RW5jb2Rlci5wcm90b3R5cGU7XG5leHBvcnQgY29uc3QgX1RleHRFbmNvZGVyID0gVGV4dEVuY29kZXI7XG5cbi8vIEFQSSBoZWxwZXJzXG5cbmV4cG9ydCB0eXBlIE1heWJlTnVsbDxUPiA9IFQgfCBudWxsO1xuZXhwb3J0IHR5cGUgTWF5YmVEZWZpbmVkPFQ+ID0gVCB8IHVuZGVmaW5lZDtcbmV4cG9ydCB0eXBlIE1heWJlRW1wdHk8VD4gPSBUIHwgbnVsbCB8IHVuZGVmaW5lZDtcblxuZXhwb3J0IGZ1bmN0aW9uIGludG9DYWxsYmFja0FQSTxUPihcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgZnVuYzogKC4uLmFyZ3M6IGFueVtdKSA9PiBQcm9taXNlPFQ+LFxuICBjYjogTWF5YmVFbXB0eTwoZXJyOiBNYXliZU51bGw8RXJyb3I+LCB2YWx1ZT86IE1heWJlRW1wdHk8VD4pID0+IHZvaWQ+LFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAuLi5hcmdzOiBhbnlbXVxuKTogdm9pZCB7XG4gIGZ1bmMoLi4uYXJncykudGhlbihcbiAgICAodmFsdWUpID0+IGNiICYmIGNiKG51bGwsIHZhbHVlKSxcbiAgICAoZXJyKSA9PiBjYiAmJiBjYihlcnIpLFxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW50b0NhbGxiYWNrQVBJV2l0aEludGVyY2VwdDxUMSwgVDI+KFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBmdW5jOiAoLi4uYXJnczogYW55W10pID0+IFByb21pc2U8VDE+LFxuICBpbnRlcmNlcHRvcjogKHY6IFQxKSA9PiBUMixcbiAgY2I6IE1heWJlRW1wdHk8KGVycjogTWF5YmVOdWxsPEVycm9yPiwgdmFsdWU/OiBNYXliZUVtcHR5PFQyPikgPT4gdm9pZD4sXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIC4uLmFyZ3M6IGFueVtdXG4pOiB2b2lkIHtcbiAgZnVuYyguLi5hcmdzKS50aGVuKFxuICAgICh2YWx1ZSkgPT4gY2IgJiYgY2IobnVsbCwgaW50ZXJjZXB0b3IodmFsdWUpKSxcbiAgICAoZXJyKSA9PiBjYiAmJiBjYihlcnIpLFxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3BsaWNlT25lKGxpc3Q6IHN0cmluZ1tdLCBpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGZvciAoOyBpbmRleCArIDEgPCBsaXN0Lmxlbmd0aDsgaW5kZXgrKykgbGlzdFtpbmRleF0gPSBsaXN0W2luZGV4ICsgMV07XG4gIGxpc3QucG9wKCk7XG59XG5cbi8vIFRha2VuIGZyb206IGh0dHBzOi8vZ2l0aHViLmNvbS9ub2RlanMvbm9kZS9ibG9iL2JhNjg0ODA1YjZjMGVkZWQ3NmU1Y2Q4OWVlMDAzMjhhYzdhNTkzNjUvbGliL2ludGVybmFsL3V0aWwuanMjTDEyNVxuLy8gUmV0dXJuIHVuZGVmaW5lZCBpZiB0aGVyZSBpcyBubyBtYXRjaC5cbi8vIE1vdmUgdGhlIFwic2xvdyBjYXNlc1wiIHRvIGEgc2VwYXJhdGUgZnVuY3Rpb24gdG8gbWFrZSBzdXJlIHRoaXMgZnVuY3Rpb24gZ2V0c1xuLy8gaW5saW5lZCBwcm9wZXJseS4gVGhhdCBwcmlvcml0aXplcyB0aGUgY29tbW9uIGNhc2UuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplRW5jb2RpbmcoXG4gIGVuYzogc3RyaW5nIHwgbnVsbCxcbik6IFRleHRFbmNvZGluZ3MgfCB1bmRlZmluZWQge1xuICBpZiAoZW5jID09IG51bGwgfHwgZW5jID09PSBcInV0ZjhcIiB8fCBlbmMgPT09IFwidXRmLThcIikgcmV0dXJuIFwidXRmOFwiO1xuICByZXR1cm4gc2xvd0Nhc2VzKGVuYyk7XG59XG5cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ub2RlanMvbm9kZS9ibG9iL2JhNjg0ODA1YjZjMGVkZWQ3NmU1Y2Q4OWVlMDAzMjhhYzdhNTkzNjUvbGliL2ludGVybmFsL3V0aWwuanMjTDEzMFxuZnVuY3Rpb24gc2xvd0Nhc2VzKGVuYzogc3RyaW5nKTogVGV4dEVuY29kaW5ncyB8IHVuZGVmaW5lZCB7XG4gIHN3aXRjaCAoZW5jLmxlbmd0aCkge1xuICAgIGNhc2UgNDpcbiAgICAgIGlmIChlbmMgPT09IFwiVVRGOFwiKSByZXR1cm4gXCJ1dGY4XCI7XG4gICAgICBpZiAoZW5jID09PSBcInVjczJcIiB8fCBlbmMgPT09IFwiVUNTMlwiKSByZXR1cm4gXCJ1dGYxNmxlXCI7XG4gICAgICBlbmMgPSBgJHtlbmN9YC50b0xvd2VyQ2FzZSgpO1xuICAgICAgaWYgKGVuYyA9PT0gXCJ1dGY4XCIpIHJldHVybiBcInV0ZjhcIjtcbiAgICAgIGlmIChlbmMgPT09IFwidWNzMlwiKSByZXR1cm4gXCJ1dGYxNmxlXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDM6XG4gICAgICBpZiAoZW5jID09PSBcImhleFwiIHx8IGVuYyA9PT0gXCJIRVhcIiB8fCBgJHtlbmN9YC50b0xvd2VyQ2FzZSgpID09PSBcImhleFwiKSB7XG4gICAgICAgIHJldHVybiBcImhleFwiO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSA1OlxuICAgICAgaWYgKGVuYyA9PT0gXCJhc2NpaVwiKSByZXR1cm4gXCJhc2NpaVwiO1xuICAgICAgaWYgKGVuYyA9PT0gXCJ1Y3MtMlwiKSByZXR1cm4gXCJ1dGYxNmxlXCI7XG4gICAgICBpZiAoZW5jID09PSBcIlVURi04XCIpIHJldHVybiBcInV0ZjhcIjtcbiAgICAgIGlmIChlbmMgPT09IFwiQVNDSUlcIikgcmV0dXJuIFwiYXNjaWlcIjtcbiAgICAgIGlmIChlbmMgPT09IFwiVUNTLTJcIikgcmV0dXJuIFwidXRmMTZsZVwiO1xuICAgICAgZW5jID0gYCR7ZW5jfWAudG9Mb3dlckNhc2UoKTtcbiAgICAgIGlmIChlbmMgPT09IFwidXRmLThcIikgcmV0dXJuIFwidXRmOFwiO1xuICAgICAgaWYgKGVuYyA9PT0gXCJhc2NpaVwiKSByZXR1cm4gXCJhc2NpaVwiO1xuICAgICAgaWYgKGVuYyA9PT0gXCJ1Y3MtMlwiKSByZXR1cm4gXCJ1dGYxNmxlXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDY6XG4gICAgICBpZiAoZW5jID09PSBcImJhc2U2NFwiKSByZXR1cm4gXCJiYXNlNjRcIjtcbiAgICAgIGlmIChlbmMgPT09IFwibGF0aW4xXCIgfHwgZW5jID09PSBcImJpbmFyeVwiKSByZXR1cm4gXCJsYXRpbjFcIjtcbiAgICAgIGlmIChlbmMgPT09IFwiQkFTRTY0XCIpIHJldHVybiBcImJhc2U2NFwiO1xuICAgICAgaWYgKGVuYyA9PT0gXCJMQVRJTjFcIiB8fCBlbmMgPT09IFwiQklOQVJZXCIpIHJldHVybiBcImxhdGluMVwiO1xuICAgICAgZW5jID0gYCR7ZW5jfWAudG9Mb3dlckNhc2UoKTtcbiAgICAgIGlmIChlbmMgPT09IFwiYmFzZTY0XCIpIHJldHVybiBcImJhc2U2NFwiO1xuICAgICAgaWYgKGVuYyA9PT0gXCJsYXRpbjFcIiB8fCBlbmMgPT09IFwiYmluYXJ5XCIpIHJldHVybiBcImxhdGluMVwiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSA3OlxuICAgICAgaWYgKFxuICAgICAgICBlbmMgPT09IFwidXRmMTZsZVwiIHx8XG4gICAgICAgIGVuYyA9PT0gXCJVVEYxNkxFXCIgfHxcbiAgICAgICAgYCR7ZW5jfWAudG9Mb3dlckNhc2UoKSA9PT0gXCJ1dGYxNmxlXCJcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gXCJ1dGYxNmxlXCI7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIDg6XG4gICAgICBpZiAoXG4gICAgICAgIGVuYyA9PT0gXCJ1dGYtMTZsZVwiIHx8XG4gICAgICAgIGVuYyA9PT0gXCJVVEYtMTZMRVwiIHx8XG4gICAgICAgIGAke2VuY31gLnRvTG93ZXJDYXNlKCkgPT09IFwidXRmLTE2bGVcIlxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiBcInV0ZjE2bGVcIjtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBpZiAoZW5jID09PSBcIlwiKSByZXR1cm4gXCJ1dGY4XCI7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlSW50ZWdlclJhbmdlKFxuICB2YWx1ZTogbnVtYmVyLFxuICBuYW1lOiBzdHJpbmcsXG4gIG1pbiA9IC0yMTQ3NDgzNjQ4LFxuICBtYXggPSAyMTQ3NDgzNjQ3LFxuKTogdm9pZCB7XG4gIC8vIFRoZSBkZWZhdWx0cyBmb3IgbWluIGFuZCBtYXggY29ycmVzcG9uZCB0byB0aGUgbGltaXRzIG9mIDMyLWJpdCBpbnRlZ2Vycy5cbiAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKHZhbHVlKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHtuYW1lfSBtdXN0IGJlICdhbiBpbnRlZ2VyJyBidXQgd2FzICR7dmFsdWV9YCk7XG4gIH1cblxuICBpZiAodmFsdWUgPCBtaW4gfHwgdmFsdWUgPiBtYXgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgJHtuYW1lfSBtdXN0IGJlID49ICR7bWlufSAmJiA8PSAke21heH0uIFZhbHVlIHdhcyAke3ZhbHVlfWAsXG4gICAgKTtcbiAgfVxufVxuXG50eXBlIE9wdGlvbmFsU3ByZWFkPFQ+ID0gVCBleHRlbmRzIHVuZGVmaW5lZCA/IFtdXG4gIDogW1RdO1xuXG5leHBvcnQgZnVuY3Rpb24gb25jZTxUID0gdW5kZWZpbmVkPihcbiAgY2FsbGJhY2s6ICguLi5hcmdzOiBPcHRpb25hbFNwcmVhZDxUPikgPT4gdm9pZCxcbikge1xuICBsZXQgY2FsbGVkID0gZmFsc2U7XG4gIHJldHVybiBmdW5jdGlvbiAodGhpczogdW5rbm93biwgLi4uYXJnczogT3B0aW9uYWxTcHJlYWQ8VD4pIHtcbiAgICBpZiAoY2FsbGVkKSByZXR1cm47XG4gICAgY2FsbGVkID0gdHJ1ZTtcbiAgICBjYWxsYmFjay5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge251bWJlcn0gW2V4cGVjdGVkRXhlY3V0aW9ucyA9IDFdXG4gKiBAcGFyYW0ge251bWJlcn0gW3RpbWVvdXQgPSAxMDAwXSBNaWxsaXNlY29uZHMgdG8gd2FpdCBiZWZvcmUgdGhlIHByb21pc2UgaXMgZm9yY2VmdWxseSBleGl0ZWRcbiovXG5leHBvcnQgZnVuY3Rpb24gbXVzdENhbGw8VCBleHRlbmRzIHVua25vd25bXT4oXG4gIGZuOiAoKC4uLmFyZ3M6IFQpID0+IHZvaWQpID0gKCkgPT4ge30sXG4gIGV4cGVjdGVkRXhlY3V0aW9ucyA9IDEsXG4gIHRpbWVvdXQgPSAxMDAwLFxuKTogW1Byb21pc2U8dm9pZD4sICguLi5hcmdzOiBUKSA9PiB2b2lkXSB7XG4gIGlmIChleHBlY3RlZEV4ZWN1dGlvbnMgPCAxKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiRXhwZWN0ZWQgZXhlY3V0aW9ucyBjYW4ndCBiZSBsb3dlciB0aGFuIDFcIik7XG4gIH1cbiAgbGV0IHRpbWVzRXhlY3V0ZWQgPSAwO1xuICBjb25zdCBjb21wbGV0ZWQgPSBkZWZlcnJlZCgpO1xuXG4gIGNvbnN0IGFib3J0ID0gc2V0VGltZW91dCgoKSA9PiBjb21wbGV0ZWQucmVqZWN0KCksIHRpbWVvdXQpO1xuXG4gIGZ1bmN0aW9uIGNhbGxiYWNrKHRoaXM6IHVua25vd24sIC4uLmFyZ3M6IFQpIHtcbiAgICB0aW1lc0V4ZWN1dGVkKys7XG4gICAgaWYgKHRpbWVzRXhlY3V0ZWQgPT09IGV4cGVjdGVkRXhlY3V0aW9ucykge1xuICAgICAgY29tcGxldGVkLnJlc29sdmUoKTtcbiAgICB9XG4gICAgZm4uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICBjb25zdCByZXN1bHQgPSBjb21wbGV0ZWRcbiAgICAudGhlbigoKSA9PiBjbGVhclRpbWVvdXQoYWJvcnQpKVxuICAgIC5jYXRjaCgoKSA9PlxuICAgICAgZmFpbChcbiAgICAgICAgYEFzeW5jIG9wZXJhdGlvbiBub3QgY29tcGxldGVkOiBFeHBlY3RlZCAke2V4cGVjdGVkRXhlY3V0aW9uc30sIGV4ZWN1dGVkICR7dGltZXNFeGVjdXRlZH1gLFxuICAgICAgKVxuICAgICk7XG5cbiAgcmV0dXJuIFtcbiAgICByZXN1bHQsXG4gICAgY2FsbGJhY2ssXG4gIF07XG59XG4vKiogQXNzZXJ0cyB0aGF0IGFuIGVycm9yIHRocm93biBpbiBhIGNhbGxiYWNrIHdpbGwgbm90IGJlIHdyb25nbHkgY2F1Z2h0LiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFzc2VydENhbGxiYWNrRXJyb3JVbmNhdWdodChcbiAgeyBwcmVsdWRlLCBpbnZvY2F0aW9uLCBjbGVhbnVwIH06IHtcbiAgICAvKiogQW55IGNvZGUgd2hpY2ggbmVlZHMgdG8gcnVuIGJlZm9yZSB0aGUgYWN0dWFsIGludm9jYXRpb24gKG5vdGFibHksIGFueSBpbXBvcnQgc3RhdGVtZW50cykuICovXG4gICAgcHJlbHVkZT86IHN0cmluZztcbiAgICAvKiogXG4gICAgICogVGhlIHN0YXJ0IG9mIHRoZSBpbnZvY2F0aW9uIG9mIHRoZSBmdW5jdGlvbiwgZS5nLiBgb3BlbihcImZvby50eHRcIiwgYC5cbiAgICAgKiBUaGUgY2FsbGJhY2sgd2lsbCBiZSBhZGRlZCBhZnRlciBpdC4gXG4gICAgICovXG4gICAgaW52b2NhdGlvbjogc3RyaW5nO1xuICAgIC8qKiBDYWxsZWQgYWZ0ZXIgdGhlIHN1YnByb2Nlc3MgaXMgZmluaXNoZWQgYnV0IGJlZm9yZSBydW5uaW5nIHRoZSBhc3NlcnRpb25zLCBlLmcuIHRvIGNsZWFuIHVwIGNyZWF0ZWQgZmlsZXMuICovXG4gICAgY2xlYW51cD86ICgpID0+IFByb21pc2U8dm9pZD4gfCB2b2lkO1xuICB9LFxuKSB7XG4gIC8vIFNpbmNlIHRoZSBlcnJvciBoYXMgdG8gYmUgdW5jYXVnaHQsIGFuZCB0aGF0IHdpbGwga2lsbCB0aGUgRGVubyBwcm9jZXNzLFxuICAvLyB0aGUgb25seSB3YXkgdG8gdGVzdCB0aGlzIGlzIHRvIHNwYXduIGEgc3VicHJvY2Vzcy5cbiAgY29uc3QgcCA9IERlbm8ucnVuKHtcbiAgICBjbWQ6IFtcbiAgICAgIERlbm8uZXhlY1BhdGgoKSxcbiAgICAgIFwiZXZhbFwiLFxuICAgICAgXCItLW5vLWNoZWNrXCIsIC8vIFJ1bm5pbmcgVFNDIGZvciBldmVyeSBvbmUgb2YgdGhlc2UgdGVzdHMgd291bGQgdGFrZSB3YXkgdG9vIGxvbmdcbiAgICAgIFwiLS11bnN0YWJsZVwiLFxuICAgICAgYCR7cHJlbHVkZSA/PyBcIlwifVxuXG4gICAgICAke2ludm9jYXRpb259KGVycikgPT4ge1xuICAgICAgICAvLyBJZiB0aGUgYnVnIGlzIHByZXNlbnQgYW5kIHRoZSBjYWxsYmFjayBpcyBjYWxsZWQgYWdhaW4gd2l0aCBhbiBlcnJvcixcbiAgICAgICAgLy8gZG9uJ3QgdGhyb3cgYW5vdGhlciBlcnJvciwgc28gaWYgdGhlIHN1YnByb2Nlc3MgZmFpbHMgd2Uga25vdyBpdCBoYWQgdGhlIGNvcnJlY3QgYmVoYXZpb3VyLlxuICAgICAgICBpZiAoIWVycikgdGhyb3cgbmV3IEVycm9yKFwic3VjY2Vzc1wiKTtcbiAgICAgIH0pO2AsXG4gICAgXSxcbiAgICBzdGRlcnI6IFwicGlwZWRcIixcbiAgfSk7XG4gIGNvbnN0IHN0YXR1cyA9IGF3YWl0IHAuc3RhdHVzKCk7XG4gIGNvbnN0IHN0ZGVyciA9IG5ldyBUZXh0RGVjb2RlcigpLmRlY29kZShhd2FpdCByZWFkQWxsKHAuc3RkZXJyKSk7XG4gIHAuY2xvc2UoKTtcbiAgcC5zdGRlcnIuY2xvc2UoKTtcbiAgYXdhaXQgY2xlYW51cD8uKCk7XG4gIGFzc2VydCghc3RhdHVzLnN1Y2Nlc3MpO1xuICBhc3NlcnRTdHJpbmdJbmNsdWRlcyhzdGRlcnIsIFwiRXJyb3I6IHN1Y2Nlc3NcIik7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUFBMEUsQUFBMUUsd0VBQTBFO1NBQ2pFLFFBQVEsU0FBUSxlQUFpQjtTQUNqQyxNQUFNLEVBQUUsb0JBQW9CLEVBQUUsSUFBSSxTQUFRLHFCQUF1QjtTQUNqRSxPQUFPLFNBQVEsYUFBZTtnQkFpQnZCLGNBQWMsQ0FBQyxHQUFZO1VBQ25D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
