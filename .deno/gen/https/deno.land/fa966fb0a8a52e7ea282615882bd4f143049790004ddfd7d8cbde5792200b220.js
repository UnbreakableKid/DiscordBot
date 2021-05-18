// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible. Do not rely on good formatting of values
// for AssertionError messages in browsers.
import { bold, gray, green, red, stripColor, white } from "../fmt/colors.ts";
import { diff, DiffType } from "./_diff.ts";
const CAN_NOT_DISPLAY = "[Cannot display]";
export class AssertionError extends Error {
  constructor(message) {
    super(message);
    this.name = "AssertionError";
  }
}
/**
 * Converts the input into a string. Objects, Sets and Maps are sorted so as to
 * make tests less flaky
 * @param v Value to be formatted
 */ export function _format(v) {
  return globalThis.Deno
    ? Deno.inspect(v, {
      depth: Infinity,
      sorted: true,
      trailingComma: true,
      compact: false,
      iterableLimit: Infinity,
    })
    : `"${String(v).replace(/(?=["\\])/g, "\\")}"`;
}
/**
 * Colors the output of assertion diffs
 * @param diffType Difference type, either added or removed
 */ function createColor(diffType) {
  switch (diffType) {
    case DiffType.added:
      return (s) => green(bold(s));
    case DiffType.removed:
      return (s) => red(bold(s));
    default:
      return white;
  }
}
/**
 * Prefixes `+` or `-` in diff output
 * @param diffType Difference type, either added or removed
 */ function createSign(diffType) {
  switch (diffType) {
    case DiffType.added:
      return "+   ";
    case DiffType.removed:
      return "-   ";
    default:
      return "    ";
  }
}
function buildMessage(diffResult) {
  const messages = [];
  messages.push("");
  messages.push("");
  messages.push(
    `    ${gray(bold("[Diff]"))} ${red(bold("Actual"))} / ${
      green(bold("Expected"))
    }`,
  );
  messages.push("");
  messages.push("");
  diffResult.forEach((result) => {
    const c = createColor(result.type);
    messages.push(c(`${createSign(result.type)}${result.value}`));
  });
  messages.push("");
  return messages;
}
function isKeyedCollection(x) {
  return [
    Symbol.iterator,
    "size",
  ].every((k) => k in x);
}
/**
 * Deep equality comparison used in assertions
 * @param c actual value
 * @param d expected value
 */ export function equal(c, d) {
  const seen = new Map();
  return (function compare(a, b) {
    // Have to render RegExp & Date for string comparison
    // unless it's mistreated as object
    if (
      a && b &&
      (a instanceof RegExp && b instanceof RegExp ||
        a instanceof URL && b instanceof URL)
    ) {
      return String(a) === String(b);
    }
    if (a instanceof Date && b instanceof Date) {
      const aTime = a.getTime();
      const bTime = b.getTime();
      // Check for NaN equality manually since NaN is not
      // equal to itself.
      if (Number.isNaN(aTime) && Number.isNaN(bTime)) {
        return true;
      }
      return a.getTime() === b.getTime();
    }
    if (Object.is(a, b)) {
      return true;
    }
    if (a && typeof a === "object" && b && typeof b === "object") {
      if (seen.get(a) === b) {
        return true;
      }
      if (Object.keys(a || {}).length !== Object.keys(b || {}).length) {
        return false;
      }
      if (isKeyedCollection(a) && isKeyedCollection(b)) {
        if (a.size !== b.size) {
          return false;
        }
        let unmatchedEntries = a.size;
        for (const [aKey, aValue] of a.entries()) {
          for (const [bKey, bValue] of b.entries()) {
            /* Given that Map keys can be references, we need
             * to ensure that they are also deeply equal */ if (
              aKey === aValue && bKey === bValue && compare(aKey, bKey) ||
              compare(aKey, bKey) && compare(aValue, bValue)
            ) {
              unmatchedEntries--;
            }
          }
        }
        return unmatchedEntries === 0;
      }
      const merged = {
        ...a,
        ...b,
      };
      for (
        const key of [
          ...Object.getOwnPropertyNames(merged),
          ...Object.getOwnPropertySymbols(merged),
        ]
      ) {
        if (!compare(a && a[key], b && b[key])) {
          return false;
        }
        if (key in a && !(key in b) || key in b && !(key in a)) {
          return false;
        }
      }
      seen.set(a, b);
      return true;
    }
    return false;
  })(c, d);
}
/** Make an assertion, error will be thrown if `expr` does not have truthy value. */ export function assert(
  expr,
  msg = "",
) {
  if (!expr) {
    throw new AssertionError(msg);
  }
}
export function assertEquals(actual, expected, msg) {
  if (equal(actual, expected)) {
    return;
  }
  let message = "";
  const actualString = _format(actual);
  const expectedString = _format(expected);
  try {
    const diffResult = diff(
      actualString.split("\n"),
      expectedString.split("\n"),
    );
    const diffMsg = buildMessage(diffResult).join("\n");
    message = `Values are not equal:\n${diffMsg}`;
  } catch {
    message = `\n${red(CAN_NOT_DISPLAY)} + \n\n`;
  }
  if (msg) {
    message = msg;
  }
  throw new AssertionError(message);
}
export function assertNotEquals(actual, expected, msg) {
  if (!equal(actual, expected)) {
    return;
  }
  let actualString;
  let expectedString;
  try {
    actualString = String(actual);
  } catch {
    actualString = "[Cannot display]";
  }
  try {
    expectedString = String(expected);
  } catch {
    expectedString = "[Cannot display]";
  }
  if (!msg) {
    msg = `actual: ${actualString} expected: ${expectedString}`;
  }
  throw new AssertionError(msg);
}
export function assertStrictEquals(actual, expected, msg) {
  if (actual === expected) {
    return;
  }
  let message;
  if (msg) {
    message = msg;
  } else {
    const actualString = _format(actual);
    const expectedString = _format(expected);
    if (actualString === expectedString) {
      const withOffset = actualString.split("\n").map((l) => `    ${l}`).join(
        "\n",
      );
      message =
        `Values have the same structure but are not reference-equal:\n\n${
          red(withOffset)
        }\n`;
    } else {
      try {
        const diffResult = diff(
          actualString.split("\n"),
          expectedString.split("\n"),
        );
        const diffMsg = buildMessage(diffResult).join("\n");
        message = `Values are not strictly equal:\n${diffMsg}`;
      } catch {
        message = `\n${red(CAN_NOT_DISPLAY)} + \n\n`;
      }
    }
  }
  throw new AssertionError(message);
}
export function assertNotStrictEquals(actual, expected, msg) {
  if (actual !== expected) {
    return;
  }
  throw new AssertionError(
    msg ?? `Expected "actual" to be strictly unequal to: ${_format(actual)}\n`,
  );
}
/**
 * Make an assertion that actual is not null or undefined. If not
 * then thrown.
 */ export function assertExists(actual, msg) {
  if (actual === undefined || actual === null) {
    if (!msg) {
      msg =
        `actual: "${actual}" expected to match anything but null or undefined`;
    }
    throw new AssertionError(msg);
  }
}
/**
 * Make an assertion that actual includes expected. If not
 * then thrown.
 */ export function assertStringIncludes(actual, expected, msg) {
  if (!actual.includes(expected)) {
    if (!msg) {
      msg = `actual: "${actual}" expected to contain: "${expected}"`;
    }
    throw new AssertionError(msg);
  }
}
export function assertArrayIncludes(actual, expected, msg) {
  const missing = [];
  for (let i = 0; i < expected.length; i++) {
    let found = false;
    for (let j = 0; j < actual.length; j++) {
      if (equal(expected[i], actual[j])) {
        found = true;
        break;
      }
    }
    if (!found) {
      missing.push(expected[i]);
    }
  }
  if (missing.length === 0) {
    return;
  }
  if (!msg) {
    msg = `actual: "${_format(actual)}" expected to include: "${
      _format(expected)
    }"\nmissing: ${_format(missing)}`;
  }
  throw new AssertionError(msg);
}
/**
 * Make an assertion that `actual` match RegExp `expected`. If not
 * then thrown
 */ export function assertMatch(actual, expected, msg) {
  if (!expected.test(actual)) {
    if (!msg) {
      msg = `actual: "${actual}" expected to match: "${expected}"`;
    }
    throw new AssertionError(msg);
  }
}
/**
 * Make an assertion that `actual` not match RegExp `expected`. If match
 * then thrown
 */ export function assertNotMatch(actual, expected, msg) {
  if (expected.test(actual)) {
    if (!msg) {
      msg = `actual: "${actual}" expected to not match: "${expected}"`;
    }
    throw new AssertionError(msg);
  }
}
/**
 * Make an assertion that `actual` object is a subset of `expected` object, deeply.
 * If not, then throw.
 */ export function assertObjectMatch( // deno-lint-ignore no-explicit-any
  actual,
  expected,
) {
  const seen = new WeakMap();
  return assertEquals(
    function filter(a, b) {
      // Prevent infinite loop with circular references with same filter
      if (seen.has(a) && seen.get(a) === b) {
        return a;
      }
      seen.set(a, b);
      // Filter keys and symbols which are present in both actual and expected
      const filtered = {};
      const entries = [
        ...Object.getOwnPropertyNames(a),
        ...Object.getOwnPropertySymbols(a),
      ].filter((key) => key in b).map((key) => [
        key,
        a[key],
      ]);
      // Build filtered object and filter recursively on nested objects references
      for (const [key, value] of entries) {
        if (typeof value === "object") {
          const subset = b[key];
          if (typeof subset === "object" && subset) {
            filtered[key] = filter(value, subset);
            continue;
          }
        }
        filtered[key] = value;
      }
      return filtered;
    }(actual, expected),
    expected,
  );
}
/**
 * Forcefully throws a failed assertion
 */ export function fail(msg) {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  assert(false, `Failed assertion${msg ? `: ${msg}` : "."}`);
}
/**
 * Executes a function, expecting it to throw.  If it does not, then it
 * throws.  An error class and a string that should be included in the
 * error message can also be asserted.
 */ export function assertThrows(fn, ErrorClass, msgIncludes = "", msg) {
  let doesThrow = false;
  let error = null;
  try {
    fn();
  } catch (e) {
    if (e instanceof Error === false) {
      throw new AssertionError("A non-Error object was thrown.");
    }
    if (ErrorClass && !(e instanceof ErrorClass)) {
      msg =
        `Expected error to be instance of "${ErrorClass.name}", but was "${e.constructor.name}"${
          msg ? `: ${msg}` : "."
        }`;
      throw new AssertionError(msg);
    }
    if (
      msgIncludes && !stripColor(e.message).includes(stripColor(msgIncludes))
    ) {
      msg =
        `Expected error message to include "${msgIncludes}", but got "${e.message}"${
          msg ? `: ${msg}` : "."
        }`;
      throw new AssertionError(msg);
    }
    doesThrow = true;
    error = e;
  }
  if (!doesThrow) {
    msg = `Expected function to throw${msg ? `: ${msg}` : "."}`;
    throw new AssertionError(msg);
  }
  return error;
}
/**
 * Executes a function which returns a promise, expecting it to throw or reject.
 * If it does not, then it throws.  An error class and a string that should be
 * included in the error message can also be asserted.
 */ export async function assertThrowsAsync(
  fn,
  ErrorClass,
  msgIncludes = "",
  msg,
) {
  let doesThrow = false;
  let error = null;
  try {
    await fn();
  } catch (e) {
    if (e instanceof Error === false) {
      throw new AssertionError("A non-Error object was thrown or rejected.");
    }
    if (ErrorClass && !(e instanceof ErrorClass)) {
      msg =
        `Expected error to be instance of "${ErrorClass.name}", but got "${e.name}"${
          msg ? `: ${msg}` : "."
        }`;
      throw new AssertionError(msg);
    }
    if (
      msgIncludes && !stripColor(e.message).includes(stripColor(msgIncludes))
    ) {
      msg =
        `Expected error message to include "${msgIncludes}", but got "${e.message}"${
          msg ? `: ${msg}` : "."
        }`;
      throw new AssertionError(msg);
    }
    doesThrow = true;
    error = e;
  }
  if (!doesThrow) {
    msg = `Expected function to throw${msg ? `: ${msg}` : "."}`;
    throw new AssertionError(msg);
  }
  return error;
}
/** Use this to stub out methods that will throw when invoked. */ export function unimplemented(
  msg,
) {
  throw new AssertionError(msg || "unimplemented");
}
/** Use this to assert unreachable code. */ export function unreachable() {
  throw new AssertionError("unreachable");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45NS4wL3Rlc3RpbmcvYXNzZXJ0cy50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMSB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS4gRG8gbm90IHJlbHkgb24gZ29vZCBmb3JtYXR0aW5nIG9mIHZhbHVlc1xuLy8gZm9yIEFzc2VydGlvbkVycm9yIG1lc3NhZ2VzIGluIGJyb3dzZXJzLlxuXG5pbXBvcnQgeyBib2xkLCBncmF5LCBncmVlbiwgcmVkLCBzdHJpcENvbG9yLCB3aGl0ZSB9IGZyb20gXCIuLi9mbXQvY29sb3JzLnRzXCI7XG5pbXBvcnQgeyBkaWZmLCBEaWZmUmVzdWx0LCBEaWZmVHlwZSB9IGZyb20gXCIuL19kaWZmLnRzXCI7XG5cbmNvbnN0IENBTl9OT1RfRElTUExBWSA9IFwiW0Nhbm5vdCBkaXNwbGF5XVwiO1xuXG5pbnRlcmZhY2UgQ29uc3RydWN0b3Ige1xuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBuZXcgKC4uLmFyZ3M6IGFueVtdKTogYW55O1xufVxuXG5leHBvcnQgY2xhc3MgQXNzZXJ0aW9uRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZykge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgIHRoaXMubmFtZSA9IFwiQXNzZXJ0aW9uRXJyb3JcIjtcbiAgfVxufVxuXG4vKipcbiAqIENvbnZlcnRzIHRoZSBpbnB1dCBpbnRvIGEgc3RyaW5nLiBPYmplY3RzLCBTZXRzIGFuZCBNYXBzIGFyZSBzb3J0ZWQgc28gYXMgdG9cbiAqIG1ha2UgdGVzdHMgbGVzcyBmbGFreVxuICogQHBhcmFtIHYgVmFsdWUgdG8gYmUgZm9ybWF0dGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfZm9ybWF0KHY6IHVua25vd24pOiBzdHJpbmcge1xuICByZXR1cm4gZ2xvYmFsVGhpcy5EZW5vXG4gICAgPyBEZW5vLmluc3BlY3Qodiwge1xuICAgICAgZGVwdGg6IEluZmluaXR5LFxuICAgICAgc29ydGVkOiB0cnVlLFxuICAgICAgdHJhaWxpbmdDb21tYTogdHJ1ZSxcbiAgICAgIGNvbXBhY3Q6IGZhbHNlLFxuICAgICAgaXRlcmFibGVMaW1pdDogSW5maW5pdHksXG4gICAgfSlcbiAgICA6IGBcIiR7U3RyaW5nKHYpLnJlcGxhY2UoLyg/PVtcIlxcXFxdKS9nLCBcIlxcXFxcIil9XCJgO1xufVxuXG4vKipcbiAqIENvbG9ycyB0aGUgb3V0cHV0IG9mIGFzc2VydGlvbiBkaWZmc1xuICogQHBhcmFtIGRpZmZUeXBlIERpZmZlcmVuY2UgdHlwZSwgZWl0aGVyIGFkZGVkIG9yIHJlbW92ZWRcbiAqL1xuZnVuY3Rpb24gY3JlYXRlQ29sb3IoZGlmZlR5cGU6IERpZmZUeXBlKTogKHM6IHN0cmluZykgPT4gc3RyaW5nIHtcbiAgc3dpdGNoIChkaWZmVHlwZSkge1xuICAgIGNhc2UgRGlmZlR5cGUuYWRkZWQ6XG4gICAgICByZXR1cm4gKHM6IHN0cmluZyk6IHN0cmluZyA9PiBncmVlbihib2xkKHMpKTtcbiAgICBjYXNlIERpZmZUeXBlLnJlbW92ZWQ6XG4gICAgICByZXR1cm4gKHM6IHN0cmluZyk6IHN0cmluZyA9PiByZWQoYm9sZChzKSk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB3aGl0ZTtcbiAgfVxufVxuXG4vKipcbiAqIFByZWZpeGVzIGArYCBvciBgLWAgaW4gZGlmZiBvdXRwdXRcbiAqIEBwYXJhbSBkaWZmVHlwZSBEaWZmZXJlbmNlIHR5cGUsIGVpdGhlciBhZGRlZCBvciByZW1vdmVkXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVNpZ24oZGlmZlR5cGU6IERpZmZUeXBlKTogc3RyaW5nIHtcbiAgc3dpdGNoIChkaWZmVHlwZSkge1xuICAgIGNhc2UgRGlmZlR5cGUuYWRkZWQ6XG4gICAgICByZXR1cm4gXCIrICAgXCI7XG4gICAgY2FzZSBEaWZmVHlwZS5yZW1vdmVkOlxuICAgICAgcmV0dXJuIFwiLSAgIFwiO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gXCIgICAgXCI7XG4gIH1cbn1cblxuZnVuY3Rpb24gYnVpbGRNZXNzYWdlKGRpZmZSZXN1bHQ6IFJlYWRvbmx5QXJyYXk8RGlmZlJlc3VsdDxzdHJpbmc+Pik6IHN0cmluZ1tdIHtcbiAgY29uc3QgbWVzc2FnZXM6IHN0cmluZ1tdID0gW107XG4gIG1lc3NhZ2VzLnB1c2goXCJcIik7XG4gIG1lc3NhZ2VzLnB1c2goXCJcIik7XG4gIG1lc3NhZ2VzLnB1c2goXG4gICAgYCAgICAke2dyYXkoYm9sZChcIltEaWZmXVwiKSl9ICR7cmVkKGJvbGQoXCJBY3R1YWxcIikpfSAvICR7XG4gICAgICBncmVlbihib2xkKFwiRXhwZWN0ZWRcIikpXG4gICAgfWAsXG4gICk7XG4gIG1lc3NhZ2VzLnB1c2goXCJcIik7XG4gIG1lc3NhZ2VzLnB1c2goXCJcIik7XG4gIGRpZmZSZXN1bHQuZm9yRWFjaCgocmVzdWx0OiBEaWZmUmVzdWx0PHN0cmluZz4pOiB2b2lkID0+IHtcbiAgICBjb25zdCBjID0gY3JlYXRlQ29sb3IocmVzdWx0LnR5cGUpO1xuICAgIG1lc3NhZ2VzLnB1c2goYyhgJHtjcmVhdGVTaWduKHJlc3VsdC50eXBlKX0ke3Jlc3VsdC52YWx1ZX1gKSk7XG4gIH0pO1xuICBtZXNzYWdlcy5wdXNoKFwiXCIpO1xuXG4gIHJldHVybiBtZXNzYWdlcztcbn1cblxuZnVuY3Rpb24gaXNLZXllZENvbGxlY3Rpb24oeDogdW5rbm93bik6IHggaXMgU2V0PHVua25vd24+IHtcbiAgcmV0dXJuIFtTeW1ib2wuaXRlcmF0b3IsIFwic2l6ZVwiXS5ldmVyeSgoaykgPT4gayBpbiAoeCBhcyBTZXQ8dW5rbm93bj4pKTtcbn1cblxuLyoqXG4gKiBEZWVwIGVxdWFsaXR5IGNvbXBhcmlzb24gdXNlZCBpbiBhc3NlcnRpb25zXG4gKiBAcGFyYW0gYyBhY3R1YWwgdmFsdWVcbiAqIEBwYXJhbSBkIGV4cGVjdGVkIHZhbHVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlcXVhbChjOiB1bmtub3duLCBkOiB1bmtub3duKTogYm9vbGVhbiB7XG4gIGNvbnN0IHNlZW4gPSBuZXcgTWFwKCk7XG4gIHJldHVybiAoZnVuY3Rpb24gY29tcGFyZShhOiB1bmtub3duLCBiOiB1bmtub3duKTogYm9vbGVhbiB7XG4gICAgLy8gSGF2ZSB0byByZW5kZXIgUmVnRXhwICYgRGF0ZSBmb3Igc3RyaW5nIGNvbXBhcmlzb25cbiAgICAvLyB1bmxlc3MgaXQncyBtaXN0cmVhdGVkIGFzIG9iamVjdFxuICAgIGlmIChcbiAgICAgIGEgJiZcbiAgICAgIGIgJiZcbiAgICAgICgoYSBpbnN0YW5jZW9mIFJlZ0V4cCAmJiBiIGluc3RhbmNlb2YgUmVnRXhwKSB8fFxuICAgICAgICAoYSBpbnN0YW5jZW9mIFVSTCAmJiBiIGluc3RhbmNlb2YgVVJMKSlcbiAgICApIHtcbiAgICAgIHJldHVybiBTdHJpbmcoYSkgPT09IFN0cmluZyhiKTtcbiAgICB9XG4gICAgaWYgKGEgaW5zdGFuY2VvZiBEYXRlICYmIGIgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgICBjb25zdCBhVGltZSA9IGEuZ2V0VGltZSgpO1xuICAgICAgY29uc3QgYlRpbWUgPSBiLmdldFRpbWUoKTtcbiAgICAgIC8vIENoZWNrIGZvciBOYU4gZXF1YWxpdHkgbWFudWFsbHkgc2luY2UgTmFOIGlzIG5vdFxuICAgICAgLy8gZXF1YWwgdG8gaXRzZWxmLlxuICAgICAgaWYgKE51bWJlci5pc05hTihhVGltZSkgJiYgTnVtYmVyLmlzTmFOKGJUaW1lKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhLmdldFRpbWUoKSA9PT0gYi5nZXRUaW1lKCk7XG4gICAgfVxuICAgIGlmIChPYmplY3QuaXMoYSwgYikpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoYSAmJiB0eXBlb2YgYSA9PT0gXCJvYmplY3RcIiAmJiBiICYmIHR5cGVvZiBiID09PSBcIm9iamVjdFwiKSB7XG4gICAgICBpZiAoc2Vlbi5nZXQoYSkgPT09IGIpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBpZiAoT2JqZWN0LmtleXMoYSB8fCB7fSkubGVuZ3RoICE9PSBPYmplY3Qua2V5cyhiIHx8IHt9KS5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKGlzS2V5ZWRDb2xsZWN0aW9uKGEpICYmIGlzS2V5ZWRDb2xsZWN0aW9uKGIpKSB7XG4gICAgICAgIGlmIChhLnNpemUgIT09IGIuc2l6ZSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB1bm1hdGNoZWRFbnRyaWVzID0gYS5zaXplO1xuXG4gICAgICAgIGZvciAoY29uc3QgW2FLZXksIGFWYWx1ZV0gb2YgYS5lbnRyaWVzKCkpIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IFtiS2V5LCBiVmFsdWVdIG9mIGIuZW50cmllcygpKSB7XG4gICAgICAgICAgICAvKiBHaXZlbiB0aGF0IE1hcCBrZXlzIGNhbiBiZSByZWZlcmVuY2VzLCB3ZSBuZWVkXG4gICAgICAgICAgICAgKiB0byBlbnN1cmUgdGhhdCB0aGV5IGFyZSBhbHNvIGRlZXBseSBlcXVhbCAqL1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAoYUtleSA9PT0gYVZhbHVlICYmIGJLZXkgPT09IGJWYWx1ZSAmJiBjb21wYXJlKGFLZXksIGJLZXkpKSB8fFxuICAgICAgICAgICAgICAoY29tcGFyZShhS2V5LCBiS2V5KSAmJiBjb21wYXJlKGFWYWx1ZSwgYlZhbHVlKSlcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICB1bm1hdGNoZWRFbnRyaWVzLS07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHVubWF0Y2hlZEVudHJpZXMgPT09IDA7XG4gICAgICB9XG4gICAgICBjb25zdCBtZXJnZWQgPSB7IC4uLmEsIC4uLmIgfTtcbiAgICAgIGZvciAoXG4gICAgICAgIGNvbnN0IGtleSBvZiBbXG4gICAgICAgICAgLi4uT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMobWVyZ2VkKSxcbiAgICAgICAgICAuLi5PYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKG1lcmdlZCksXG4gICAgICAgIF1cbiAgICAgICkge1xuICAgICAgICB0eXBlIEtleSA9IGtleW9mIHR5cGVvZiBtZXJnZWQ7XG4gICAgICAgIGlmICghY29tcGFyZShhICYmIGFba2V5IGFzIEtleV0sIGIgJiYgYltrZXkgYXMgS2V5XSkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCgoa2V5IGluIGEpICYmICghKGtleSBpbiBiKSkpIHx8ICgoa2V5IGluIGIpICYmICghKGtleSBpbiBhKSkpKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzZWVuLnNldChhLCBiKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0pKGMsIGQpO1xufVxuXG4vKiogTWFrZSBhbiBhc3NlcnRpb24sIGVycm9yIHdpbGwgYmUgdGhyb3duIGlmIGBleHByYCBkb2VzIG5vdCBoYXZlIHRydXRoeSB2YWx1ZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnQoZXhwcjogdW5rbm93biwgbXNnID0gXCJcIik6IGFzc2VydHMgZXhwciB7XG4gIGlmICghZXhwcikge1xuICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xuICB9XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBhbmQgYGV4cGVjdGVkYCBhcmUgZXF1YWwsIGRlZXBseS4gSWYgbm90XG4gKiBkZWVwbHkgZXF1YWwsIHRoZW4gdGhyb3cuXG4gKlxuICogVHlwZSBwYXJhbWV0ZXIgY2FuIGJlIHNwZWNpZmllZCB0byBlbnN1cmUgdmFsdWVzIHVuZGVyIGNvbXBhcmlzb24gaGF2ZSB0aGUgc2FtZSB0eXBlLlxuICogRm9yIGV4YW1wbGU6XG4gKmBgYHRzXG4gKmFzc2VydEVxdWFsczxudW1iZXI+KDEsIDIpXG4gKmBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0RXF1YWxzKFxuICBhY3R1YWw6IHVua25vd24sXG4gIGV4cGVjdGVkOiB1bmtub3duLFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEVxdWFsczxUPihhY3R1YWw6IFQsIGV4cGVjdGVkOiBULCBtc2c/OiBzdHJpbmcpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEVxdWFscyhcbiAgYWN0dWFsOiB1bmtub3duLFxuICBleHBlY3RlZDogdW5rbm93bixcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZCB7XG4gIGlmIChlcXVhbChhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIHJldHVybjtcbiAgfVxuICBsZXQgbWVzc2FnZSA9IFwiXCI7XG4gIGNvbnN0IGFjdHVhbFN0cmluZyA9IF9mb3JtYXQoYWN0dWFsKTtcbiAgY29uc3QgZXhwZWN0ZWRTdHJpbmcgPSBfZm9ybWF0KGV4cGVjdGVkKTtcbiAgdHJ5IHtcbiAgICBjb25zdCBkaWZmUmVzdWx0ID0gZGlmZihcbiAgICAgIGFjdHVhbFN0cmluZy5zcGxpdChcIlxcblwiKSxcbiAgICAgIGV4cGVjdGVkU3RyaW5nLnNwbGl0KFwiXFxuXCIpLFxuICAgICk7XG4gICAgY29uc3QgZGlmZk1zZyA9IGJ1aWxkTWVzc2FnZShkaWZmUmVzdWx0KS5qb2luKFwiXFxuXCIpO1xuICAgIG1lc3NhZ2UgPSBgVmFsdWVzIGFyZSBub3QgZXF1YWw6XFxuJHtkaWZmTXNnfWA7XG4gIH0gY2F0Y2gge1xuICAgIG1lc3NhZ2UgPSBgXFxuJHtyZWQoQ0FOX05PVF9ESVNQTEFZKX0gKyBcXG5cXG5gO1xuICB9XG4gIGlmIChtc2cpIHtcbiAgICBtZXNzYWdlID0gbXNnO1xuICB9XG4gIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtZXNzYWdlKTtcbn1cblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBhY3R1YWxgIGFuZCBgZXhwZWN0ZWRgIGFyZSBub3QgZXF1YWwsIGRlZXBseS5cbiAqIElmIG5vdCB0aGVuIHRocm93LlxuICpcbiAqIFR5cGUgcGFyYW1ldGVyIGNhbiBiZSBzcGVjaWZpZWQgdG8gZW5zdXJlIHZhbHVlcyB1bmRlciBjb21wYXJpc29uIGhhdmUgdGhlIHNhbWUgdHlwZS5cbiAqIEZvciBleGFtcGxlOlxuICpgYGB0c1xuICphc3NlcnROb3RFcXVhbHM8bnVtYmVyPigxLCAyKVxuICpgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vdEVxdWFscyhcbiAgYWN0dWFsOiB1bmtub3duLFxuICBleHBlY3RlZDogdW5rbm93bixcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROb3RFcXVhbHM8VD4oYWN0dWFsOiBULCBleHBlY3RlZDogVCwgbXNnPzogc3RyaW5nKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROb3RFcXVhbHMoXG4gIGFjdHVhbDogdW5rbm93bixcbiAgZXhwZWN0ZWQ6IHVua25vd24sXG4gIG1zZz86IHN0cmluZyxcbik6IHZvaWQge1xuICBpZiAoIWVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGxldCBhY3R1YWxTdHJpbmc6IHN0cmluZztcbiAgbGV0IGV4cGVjdGVkU3RyaW5nOiBzdHJpbmc7XG4gIHRyeSB7XG4gICAgYWN0dWFsU3RyaW5nID0gU3RyaW5nKGFjdHVhbCk7XG4gIH0gY2F0Y2gge1xuICAgIGFjdHVhbFN0cmluZyA9IFwiW0Nhbm5vdCBkaXNwbGF5XVwiO1xuICB9XG4gIHRyeSB7XG4gICAgZXhwZWN0ZWRTdHJpbmcgPSBTdHJpbmcoZXhwZWN0ZWQpO1xuICB9IGNhdGNoIHtcbiAgICBleHBlY3RlZFN0cmluZyA9IFwiW0Nhbm5vdCBkaXNwbGF5XVwiO1xuICB9XG4gIGlmICghbXNnKSB7XG4gICAgbXNnID0gYGFjdHVhbDogJHthY3R1YWxTdHJpbmd9IGV4cGVjdGVkOiAke2V4cGVjdGVkU3RyaW5nfWA7XG4gIH1cbiAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBhbmQgYGV4cGVjdGVkYCBhcmUgc3RyaWN0bHkgZXF1YWwuICBJZlxuICogbm90IHRoZW4gdGhyb3cuXG4gKiBgYGB0c1xuICogYXNzZXJ0U3RyaWN0RXF1YWxzKDEsIDIpXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFN0cmljdEVxdWFscyhcbiAgYWN0dWFsOiB1bmtub3duLFxuICBleHBlY3RlZDogdW5rbm93bixcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRTdHJpY3RFcXVhbHM8VD4oXG4gIGFjdHVhbDogVCxcbiAgZXhwZWN0ZWQ6IFQsXG4gIG1zZz86IHN0cmluZyxcbik6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0U3RyaWN0RXF1YWxzKFxuICBhY3R1YWw6IHVua25vd24sXG4gIGV4cGVjdGVkOiB1bmtub3duLFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkIHtcbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBsZXQgbWVzc2FnZTogc3RyaW5nO1xuXG4gIGlmIChtc2cpIHtcbiAgICBtZXNzYWdlID0gbXNnO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGFjdHVhbFN0cmluZyA9IF9mb3JtYXQoYWN0dWFsKTtcbiAgICBjb25zdCBleHBlY3RlZFN0cmluZyA9IF9mb3JtYXQoZXhwZWN0ZWQpO1xuXG4gICAgaWYgKGFjdHVhbFN0cmluZyA9PT0gZXhwZWN0ZWRTdHJpbmcpIHtcbiAgICAgIGNvbnN0IHdpdGhPZmZzZXQgPSBhY3R1YWxTdHJpbmdcbiAgICAgICAgLnNwbGl0KFwiXFxuXCIpXG4gICAgICAgIC5tYXAoKGwpID0+IGAgICAgJHtsfWApXG4gICAgICAgIC5qb2luKFwiXFxuXCIpO1xuICAgICAgbWVzc2FnZSA9XG4gICAgICAgIGBWYWx1ZXMgaGF2ZSB0aGUgc2FtZSBzdHJ1Y3R1cmUgYnV0IGFyZSBub3QgcmVmZXJlbmNlLWVxdWFsOlxcblxcbiR7XG4gICAgICAgICAgcmVkKHdpdGhPZmZzZXQpXG4gICAgICAgIH1cXG5gO1xuICAgIH0gZWxzZSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBkaWZmUmVzdWx0ID0gZGlmZihcbiAgICAgICAgICBhY3R1YWxTdHJpbmcuc3BsaXQoXCJcXG5cIiksXG4gICAgICAgICAgZXhwZWN0ZWRTdHJpbmcuc3BsaXQoXCJcXG5cIiksXG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IGRpZmZNc2cgPSBidWlsZE1lc3NhZ2UoZGlmZlJlc3VsdCkuam9pbihcIlxcblwiKTtcbiAgICAgICAgbWVzc2FnZSA9IGBWYWx1ZXMgYXJlIG5vdCBzdHJpY3RseSBlcXVhbDpcXG4ke2RpZmZNc2d9YDtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICBtZXNzYWdlID0gYFxcbiR7cmVkKENBTl9OT1RfRElTUExBWSl9ICsgXFxuXFxuYDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobWVzc2FnZSk7XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBhbmQgYGV4cGVjdGVkYCBhcmUgbm90IHN0cmljdGx5IGVxdWFsLlxuICogSWYgdGhlIHZhbHVlcyBhcmUgc3RyaWN0bHkgZXF1YWwgdGhlbiB0aHJvdy5cbiAqIGBgYHRzXG4gKiBhc3NlcnROb3RTdHJpY3RFcXVhbHMoMSwgMSlcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0Tm90U3RyaWN0RXF1YWxzKFxuICBhY3R1YWw6IHVua25vd24sXG4gIGV4cGVjdGVkOiB1bmtub3duLFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vdFN0cmljdEVxdWFsczxUPihcbiAgYWN0dWFsOiBULFxuICBleHBlY3RlZDogVCxcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROb3RTdHJpY3RFcXVhbHMoXG4gIGFjdHVhbDogdW5rbm93bixcbiAgZXhwZWN0ZWQ6IHVua25vd24sXG4gIG1zZz86IHN0cmluZyxcbik6IHZvaWQge1xuICBpZiAoYWN0dWFsICE9PSBleHBlY3RlZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICBtc2cgPz8gYEV4cGVjdGVkIFwiYWN0dWFsXCIgdG8gYmUgc3RyaWN0bHkgdW5lcXVhbCB0bzogJHtfZm9ybWF0KGFjdHVhbCl9XFxuYCxcbiAgKTtcbn1cblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGFjdHVhbCBpcyBub3QgbnVsbCBvciB1bmRlZmluZWQuIElmIG5vdFxuICogdGhlbiB0aHJvd24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRFeGlzdHMoXG4gIGFjdHVhbDogdW5rbm93bixcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZCB7XG4gIGlmIChhY3R1YWwgPT09IHVuZGVmaW5lZCB8fCBhY3R1YWwgPT09IG51bGwpIHtcbiAgICBpZiAoIW1zZykge1xuICAgICAgbXNnID1cbiAgICAgICAgYGFjdHVhbDogXCIke2FjdHVhbH1cIiBleHBlY3RlZCB0byBtYXRjaCBhbnl0aGluZyBidXQgbnVsbCBvciB1bmRlZmluZWRgO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbiAgfVxufVxuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYWN0dWFsIGluY2x1ZGVzIGV4cGVjdGVkLiBJZiBub3RcbiAqIHRoZW4gdGhyb3duLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0U3RyaW5nSW5jbHVkZXMoXG4gIGFjdHVhbDogc3RyaW5nLFxuICBleHBlY3RlZDogc3RyaW5nLFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkIHtcbiAgaWYgKCFhY3R1YWwuaW5jbHVkZXMoZXhwZWN0ZWQpKSB7XG4gICAgaWYgKCFtc2cpIHtcbiAgICAgIG1zZyA9IGBhY3R1YWw6IFwiJHthY3R1YWx9XCIgZXhwZWN0ZWQgdG8gY29udGFpbjogXCIke2V4cGVjdGVkfVwiYDtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG4gIH1cbn1cblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBhY3R1YWxgIGluY2x1ZGVzIHRoZSBgZXhwZWN0ZWRgIHZhbHVlcy5cbiAqIElmIG5vdCB0aGVuIGFuIGVycm9yIHdpbGwgYmUgdGhyb3duLlxuICpcbiAqIFR5cGUgcGFyYW1ldGVyIGNhbiBiZSBzcGVjaWZpZWQgdG8gZW5zdXJlIHZhbHVlcyB1bmRlciBjb21wYXJpc29uIGhhdmUgdGhlIHNhbWUgdHlwZS5cbiAqIEZvciBleGFtcGxlOlxuICpgYGB0c1xuICphc3NlcnRBcnJheUluY2x1ZGVzPG51bWJlcj4oWzEsIDJdLCBbMl0pXG4gKmBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0QXJyYXlJbmNsdWRlcyhcbiAgYWN0dWFsOiBBcnJheUxpa2U8dW5rbm93bj4sXG4gIGV4cGVjdGVkOiBBcnJheUxpa2U8dW5rbm93bj4sXG4gIG1zZz86IHN0cmluZyxcbik6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0QXJyYXlJbmNsdWRlczxUPihcbiAgYWN0dWFsOiBBcnJheUxpa2U8VD4sXG4gIGV4cGVjdGVkOiBBcnJheUxpa2U8VD4sXG4gIG1zZz86IHN0cmluZyxcbik6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0QXJyYXlJbmNsdWRlcyhcbiAgYWN0dWFsOiBBcnJheUxpa2U8dW5rbm93bj4sXG4gIGV4cGVjdGVkOiBBcnJheUxpa2U8dW5rbm93bj4sXG4gIG1zZz86IHN0cmluZyxcbik6IHZvaWQge1xuICBjb25zdCBtaXNzaW5nOiB1bmtub3duW10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBleHBlY3RlZC5sZW5ndGg7IGkrKykge1xuICAgIGxldCBmb3VuZCA9IGZhbHNlO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgYWN0dWFsLmxlbmd0aDsgaisrKSB7XG4gICAgICBpZiAoZXF1YWwoZXhwZWN0ZWRbaV0sIGFjdHVhbFtqXSkpIHtcbiAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFmb3VuZCkge1xuICAgICAgbWlzc2luZy5wdXNoKGV4cGVjdGVkW2ldKTtcbiAgICB9XG4gIH1cbiAgaWYgKG1pc3NpbmcubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmICghbXNnKSB7XG4gICAgbXNnID0gYGFjdHVhbDogXCIke19mb3JtYXQoYWN0dWFsKX1cIiBleHBlY3RlZCB0byBpbmNsdWRlOiBcIiR7XG4gICAgICBfZm9ybWF0KGV4cGVjdGVkKVxuICAgIH1cIlxcbm1pc3Npbmc6ICR7X2Zvcm1hdChtaXNzaW5nKX1gO1xuICB9XG4gIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xufVxuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgbWF0Y2ggUmVnRXhwIGBleHBlY3RlZGAuIElmIG5vdFxuICogdGhlbiB0aHJvd25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE1hdGNoKFxuICBhY3R1YWw6IHN0cmluZyxcbiAgZXhwZWN0ZWQ6IFJlZ0V4cCxcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZCB7XG4gIGlmICghZXhwZWN0ZWQudGVzdChhY3R1YWwpKSB7XG4gICAgaWYgKCFtc2cpIHtcbiAgICAgIG1zZyA9IGBhY3R1YWw6IFwiJHthY3R1YWx9XCIgZXhwZWN0ZWQgdG8gbWF0Y2g6IFwiJHtleHBlY3RlZH1cImA7XG4gICAgfVxuICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xuICB9XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBub3QgbWF0Y2ggUmVnRXhwIGBleHBlY3RlZGAuIElmIG1hdGNoXG4gKiB0aGVuIHRocm93blxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0Tm90TWF0Y2goXG4gIGFjdHVhbDogc3RyaW5nLFxuICBleHBlY3RlZDogUmVnRXhwLFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkIHtcbiAgaWYgKGV4cGVjdGVkLnRlc3QoYWN0dWFsKSkge1xuICAgIGlmICghbXNnKSB7XG4gICAgICBtc2cgPSBgYWN0dWFsOiBcIiR7YWN0dWFsfVwiIGV4cGVjdGVkIHRvIG5vdCBtYXRjaDogXCIke2V4cGVjdGVkfVwiYDtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG4gIH1cbn1cblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBhY3R1YWxgIG9iamVjdCBpcyBhIHN1YnNldCBvZiBgZXhwZWN0ZWRgIG9iamVjdCwgZGVlcGx5LlxuICogSWYgbm90LCB0aGVuIHRocm93LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0T2JqZWN0TWF0Y2goXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIGFjdHVhbDogUmVjb3JkPFByb3BlcnR5S2V5LCBhbnk+LFxuICBleHBlY3RlZDogUmVjb3JkPFByb3BlcnR5S2V5LCB1bmtub3duPixcbik6IHZvaWQge1xuICB0eXBlIGxvb3NlID0gUmVjb3JkPFByb3BlcnR5S2V5LCB1bmtub3duPjtcbiAgY29uc3Qgc2VlbiA9IG5ldyBXZWFrTWFwKCk7XG4gIHJldHVybiBhc3NlcnRFcXVhbHMoXG4gICAgKGZ1bmN0aW9uIGZpbHRlcihhOiBsb29zZSwgYjogbG9vc2UpOiBsb29zZSB7XG4gICAgICAvLyBQcmV2ZW50IGluZmluaXRlIGxvb3Agd2l0aCBjaXJjdWxhciByZWZlcmVuY2VzIHdpdGggc2FtZSBmaWx0ZXJcbiAgICAgIGlmICgoc2Vlbi5oYXMoYSkpICYmIChzZWVuLmdldChhKSA9PT0gYikpIHtcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgICB9XG4gICAgICBzZWVuLnNldChhLCBiKTtcbiAgICAgIC8vIEZpbHRlciBrZXlzIGFuZCBzeW1ib2xzIHdoaWNoIGFyZSBwcmVzZW50IGluIGJvdGggYWN0dWFsIGFuZCBleHBlY3RlZFxuICAgICAgY29uc3QgZmlsdGVyZWQgPSB7fSBhcyBsb29zZTtcbiAgICAgIGNvbnN0IGVudHJpZXMgPSBbXG4gICAgICAgIC4uLk9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGEpLFxuICAgICAgICAuLi5PYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKGEpLFxuICAgICAgXVxuICAgICAgICAuZmlsdGVyKChrZXkpID0+IGtleSBpbiBiKVxuICAgICAgICAubWFwKChrZXkpID0+IFtrZXksIGFba2V5IGFzIHN0cmluZ11dKSBhcyBBcnJheTxbc3RyaW5nLCB1bmtub3duXT47XG4gICAgICAvLyBCdWlsZCBmaWx0ZXJlZCBvYmplY3QgYW5kIGZpbHRlciByZWN1cnNpdmVseSBvbiBuZXN0ZWQgb2JqZWN0cyByZWZlcmVuY2VzXG4gICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBlbnRyaWVzKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICBjb25zdCBzdWJzZXQgPSAoYiBhcyBsb29zZSlba2V5XTtcbiAgICAgICAgICBpZiAoKHR5cGVvZiBzdWJzZXQgPT09IFwib2JqZWN0XCIpICYmIChzdWJzZXQpKSB7XG4gICAgICAgICAgICBmaWx0ZXJlZFtrZXldID0gZmlsdGVyKHZhbHVlIGFzIGxvb3NlLCBzdWJzZXQgYXMgbG9vc2UpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZpbHRlcmVkW2tleV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmaWx0ZXJlZDtcbiAgICB9KShhY3R1YWwsIGV4cGVjdGVkKSxcbiAgICBleHBlY3RlZCxcbiAgKTtcbn1cblxuLyoqXG4gKiBGb3JjZWZ1bGx5IHRocm93cyBhIGZhaWxlZCBhc3NlcnRpb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZhaWwobXNnPzogc3RyaW5nKTogdm9pZCB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdXNlLWJlZm9yZS1kZWZpbmVcbiAgYXNzZXJ0KGZhbHNlLCBgRmFpbGVkIGFzc2VydGlvbiR7bXNnID8gYDogJHttc2d9YCA6IFwiLlwifWApO1xufVxuXG4vKipcbiAqIEV4ZWN1dGVzIGEgZnVuY3Rpb24sIGV4cGVjdGluZyBpdCB0byB0aHJvdy4gIElmIGl0IGRvZXMgbm90LCB0aGVuIGl0XG4gKiB0aHJvd3MuICBBbiBlcnJvciBjbGFzcyBhbmQgYSBzdHJpbmcgdGhhdCBzaG91bGQgYmUgaW5jbHVkZWQgaW4gdGhlXG4gKiBlcnJvciBtZXNzYWdlIGNhbiBhbHNvIGJlIGFzc2VydGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0VGhyb3dzPFQgPSB2b2lkPihcbiAgZm46ICgpID0+IFQsXG4gIEVycm9yQ2xhc3M/OiBDb25zdHJ1Y3RvcixcbiAgbXNnSW5jbHVkZXMgPSBcIlwiLFxuICBtc2c/OiBzdHJpbmcsXG4pOiBFcnJvciB7XG4gIGxldCBkb2VzVGhyb3cgPSBmYWxzZTtcbiAgbGV0IGVycm9yID0gbnVsbDtcbiAgdHJ5IHtcbiAgICBmbigpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKGUgaW5zdGFuY2VvZiBFcnJvciA9PT0gZmFsc2UpIHtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcIkEgbm9uLUVycm9yIG9iamVjdCB3YXMgdGhyb3duLlwiKTtcbiAgICB9XG4gICAgaWYgKEVycm9yQ2xhc3MgJiYgIShlIGluc3RhbmNlb2YgRXJyb3JDbGFzcykpIHtcbiAgICAgIG1zZyA9XG4gICAgICAgIGBFeHBlY3RlZCBlcnJvciB0byBiZSBpbnN0YW5jZSBvZiBcIiR7RXJyb3JDbGFzcy5uYW1lfVwiLCBidXQgd2FzIFwiJHtlLmNvbnN0cnVjdG9yLm5hbWV9XCIke1xuICAgICAgICAgIG1zZyA/IGA6ICR7bXNnfWAgOiBcIi5cIlxuICAgICAgICB9YDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xuICAgIH1cbiAgICBpZiAoXG4gICAgICBtc2dJbmNsdWRlcyAmJlxuICAgICAgIXN0cmlwQ29sb3IoZS5tZXNzYWdlKS5pbmNsdWRlcyhzdHJpcENvbG9yKG1zZ0luY2x1ZGVzKSlcbiAgICApIHtcbiAgICAgIG1zZyA9XG4gICAgICAgIGBFeHBlY3RlZCBlcnJvciBtZXNzYWdlIHRvIGluY2x1ZGUgXCIke21zZ0luY2x1ZGVzfVwiLCBidXQgZ290IFwiJHtlLm1lc3NhZ2V9XCIke1xuICAgICAgICAgIG1zZyA/IGA6ICR7bXNnfWAgOiBcIi5cIlxuICAgICAgICB9YDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xuICAgIH1cbiAgICBkb2VzVGhyb3cgPSB0cnVlO1xuICAgIGVycm9yID0gZTtcbiAgfVxuICBpZiAoIWRvZXNUaHJvdykge1xuICAgIG1zZyA9IGBFeHBlY3RlZCBmdW5jdGlvbiB0byB0aHJvdyR7bXNnID8gYDogJHttc2d9YCA6IFwiLlwifWA7XG4gICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG4gIH1cbiAgcmV0dXJuIGVycm9yO1xufVxuXG4vKipcbiAqIEV4ZWN1dGVzIGEgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyBhIHByb21pc2UsIGV4cGVjdGluZyBpdCB0byB0aHJvdyBvciByZWplY3QuXG4gKiBJZiBpdCBkb2VzIG5vdCwgdGhlbiBpdCB0aHJvd3MuICBBbiBlcnJvciBjbGFzcyBhbmQgYSBzdHJpbmcgdGhhdCBzaG91bGQgYmVcbiAqIGluY2x1ZGVkIGluIHRoZSBlcnJvciBtZXNzYWdlIGNhbiBhbHNvIGJlIGFzc2VydGVkLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYXNzZXJ0VGhyb3dzQXN5bmM8VCA9IHZvaWQ+KFxuICBmbjogKCkgPT4gUHJvbWlzZTxUPixcbiAgRXJyb3JDbGFzcz86IENvbnN0cnVjdG9yLFxuICBtc2dJbmNsdWRlcyA9IFwiXCIsXG4gIG1zZz86IHN0cmluZyxcbik6IFByb21pc2U8RXJyb3I+IHtcbiAgbGV0IGRvZXNUaHJvdyA9IGZhbHNlO1xuICBsZXQgZXJyb3IgPSBudWxsO1xuICB0cnkge1xuICAgIGF3YWl0IGZuKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAoZSBpbnN0YW5jZW9mIEVycm9yID09PSBmYWxzZSkge1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFwiQSBub24tRXJyb3Igb2JqZWN0IHdhcyB0aHJvd24gb3IgcmVqZWN0ZWQuXCIpO1xuICAgIH1cbiAgICBpZiAoRXJyb3JDbGFzcyAmJiAhKGUgaW5zdGFuY2VvZiBFcnJvckNsYXNzKSkge1xuICAgICAgbXNnID1cbiAgICAgICAgYEV4cGVjdGVkIGVycm9yIHRvIGJlIGluc3RhbmNlIG9mIFwiJHtFcnJvckNsYXNzLm5hbWV9XCIsIGJ1dCBnb3QgXCIke2UubmFtZX1cIiR7XG4gICAgICAgICAgbXNnID8gYDogJHttc2d9YCA6IFwiLlwiXG4gICAgICAgIH1gO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG4gICAgfVxuICAgIGlmIChcbiAgICAgIG1zZ0luY2x1ZGVzICYmXG4gICAgICAhc3RyaXBDb2xvcihlLm1lc3NhZ2UpLmluY2x1ZGVzKHN0cmlwQ29sb3IobXNnSW5jbHVkZXMpKVxuICAgICkge1xuICAgICAgbXNnID1cbiAgICAgICAgYEV4cGVjdGVkIGVycm9yIG1lc3NhZ2UgdG8gaW5jbHVkZSBcIiR7bXNnSW5jbHVkZXN9XCIsIGJ1dCBnb3QgXCIke2UubWVzc2FnZX1cIiR7XG4gICAgICAgICAgbXNnID8gYDogJHttc2d9YCA6IFwiLlwiXG4gICAgICAgIH1gO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG4gICAgfVxuICAgIGRvZXNUaHJvdyA9IHRydWU7XG4gICAgZXJyb3IgPSBlO1xuICB9XG4gIGlmICghZG9lc1Rocm93KSB7XG4gICAgbXNnID0gYEV4cGVjdGVkIGZ1bmN0aW9uIHRvIHRocm93JHttc2cgPyBgOiAke21zZ31gIDogXCIuXCJ9YDtcbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbiAgfVxuICByZXR1cm4gZXJyb3I7XG59XG5cbi8qKiBVc2UgdGhpcyB0byBzdHViIG91dCBtZXRob2RzIHRoYXQgd2lsbCB0aHJvdyB3aGVuIGludm9rZWQuICovXG5leHBvcnQgZnVuY3Rpb24gdW5pbXBsZW1lbnRlZChtc2c/OiBzdHJpbmcpOiBuZXZlciB7XG4gIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cgfHwgXCJ1bmltcGxlbWVudGVkXCIpO1xufVxuXG4vKiogVXNlIHRoaXMgdG8gYXNzZXJ0IHVucmVhY2hhYmxlIGNvZGUuICovXG5leHBvcnQgZnVuY3Rpb24gdW5yZWFjaGFibGUoKTogbmV2ZXIge1xuICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXCJ1bnJlYWNoYWJsZVwiKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUEwRSxBQUExRSx3RUFBMEU7QUFDMUUsRUFBOEUsQUFBOUUsNEVBQThFO0FBQzlFLEVBQTJDLEFBQTNDLHlDQUEyQztTQUVsQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLEtB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
