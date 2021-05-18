// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
import { red, green, white, gray, bold } from "../fmt/colors.ts";
import diff, { DiffType } from "./diff.ts";
const CAN_NOT_DISPLAY = "[Cannot display]";
export class AssertionError extends Error {
    constructor(message){
        super(message);
        this.name = "AssertionError";
    }
}
function format(v) {
    let string = Deno.inspect(v);
    if (typeof v == "string") {
        string = `"${string.replace(/(?=["\\])/g, "\\")}"`;
    }
    return string;
}
function createColor(diffType) {
    switch(diffType){
        case DiffType.added:
            return (s)=>green(bold(s))
            ;
        case DiffType.removed:
            return (s)=>red(bold(s))
            ;
        default:
            return white;
    }
}
function createSign(diffType) {
    switch(diffType){
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
    messages.push(`    ${gray(bold("[Diff]"))} ${red(bold("Actual"))} / ${green(bold("Expected"))}`);
    messages.push("");
    messages.push("");
    diffResult.forEach((result)=>{
        const c = createColor(result.type);
        messages.push(c(`${createSign(result.type)}${result.value}`));
    });
    messages.push("");
    return messages;
}
function isKeyedCollection(x) {
    return [
        Symbol.iterator,
        "size"
    ].every((k)=>k in x
    );
}
export function equal(c, d) {
    const seen = new Map();
    return (function compare(a, b) {
        // Have to render RegExp & Date for string comparison
        // unless it's mistreated as object
        if (a && b && (a instanceof RegExp && b instanceof RegExp || a instanceof Date && b instanceof Date)) {
            return String(a) === String(b);
        }
        if (Object.is(a, b)) {
            return true;
        }
        if (a && typeof a === "object" && b && typeof b === "object") {
            if (seen.get(a) === b) {
                return true;
            }
            if (Object.keys(a || {
            }).length !== Object.keys(b || {
            }).length) {
                return false;
            }
            if (isKeyedCollection(a) && isKeyedCollection(b)) {
                if (a.size !== b.size) {
                    return false;
                }
                let unmatchedEntries = a.size;
                for (const [aKey, aValue] of a.entries()){
                    for (const [bKey, bValue] of b.entries()){
                        /* Given that Map keys can be references, we need
             * to ensure that they are also deeply equal */ if (aKey === aValue && bKey === bValue && compare(aKey, bKey) || compare(aKey, bKey) && compare(aValue, bValue)) {
                            unmatchedEntries--;
                        }
                    }
                }
                return unmatchedEntries === 0;
            }
            const merged = {
                ...a,
                ...b
            };
            for(const key in merged){
                if (!compare(a && a[key], b && b[key])) {
                    return false;
                }
            }
            seen.set(a, b);
            return true;
        }
        return false;
    })(c, d);
}
/** Make an assertion, if not `true`, then throw. */ export function assert(expr, msg = "") {
    if (!expr) {
        throw new AssertionError(msg);
    }
}
/**
 * Make an assertion that `actual` and `expected` are equal, deeply. If not
 * deeply equal, then throw.
 */ export function assertEquals(actual, expected, msg) {
    if (equal(actual, expected)) {
        return;
    }
    let message = "";
    const actualString = format(actual);
    const expectedString = format(expected);
    try {
        const diffResult = diff(actualString.split("\n"), expectedString.split("\n"));
        message = buildMessage(diffResult).join("\n");
    } catch (e) {
        message = `\n${red(CAN_NOT_DISPLAY)} + \n\n`;
    }
    if (msg) {
        message = msg;
    }
    throw new AssertionError(message);
}
/**
 * Make an assertion that `actual` and `expected` are not equal, deeply.
 * If not then throw.
 */ export function assertNotEquals(actual, expected, msg) {
    if (!equal(actual, expected)) {
        return;
    }
    let actualString;
    let expectedString;
    try {
        actualString = String(actual);
    } catch (e) {
        actualString = "[Cannot display]";
    }
    try {
        expectedString = String(expected);
    } catch (e) {
        expectedString = "[Cannot display]";
    }
    if (!msg) {
        msg = `actual: ${actualString} expected: ${expectedString}`;
    }
    throw new AssertionError(msg);
}
/**
 * Make an assertion that `actual` and `expected` are strictly equal.  If
 * not then throw.
 */ export function assertStrictEq(actual, expected, msg) {
    if (actual !== expected) {
        let actualString;
        let expectedString;
        try {
            actualString = String(actual);
        } catch (e) {
            actualString = "[Cannot display]";
        }
        try {
            expectedString = String(expected);
        } catch (e) {
            expectedString = "[Cannot display]";
        }
        if (!msg) {
            msg = `actual: ${actualString} expected: ${expectedString}`;
        }
        throw new AssertionError(msg);
    }
}
/**
 * Make an assertion that actual contains expected. If not
 * then thrown.
 */ export function assertStrContains(actual, expected, msg) {
    if (!actual.includes(expected)) {
        if (!msg) {
            msg = `actual: "${actual}" expected to contains: "${expected}"`;
        }
        throw new AssertionError(msg);
    }
}
/**
 * Make an assertion that `actual` contains the `expected` values
 * If not then thrown.
 */ export function assertArrayContains(actual, expected, msg) {
    const missing = [];
    for(let i = 0; i < expected.length; i++){
        let found = false;
        for(let j = 0; j < actual.length; j++){
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
        msg = `actual: "${actual}" expected to contains: "${expected}"`;
        msg += "\n";
        msg += `missing: ${missing}`;
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
 * Forcefully throws a failed assertion
 */ export function fail(msg) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    assert(false, `Failed assertion${msg ? `: ${msg}` : "."}`);
}
/** Executes a function, expecting it to throw.  If it does not, then it
 * throws.  An error class and a string that should be included in the
 * error message can also be asserted.
 */ export function assertThrows(fn, ErrorClass, msgIncludes = "", msg) {
    let doesThrow = false;
    let error = null;
    try {
        fn();
    } catch (e) {
        if (ErrorClass && !(Object.getPrototypeOf(e) === ErrorClass.prototype)) {
            msg = `Expected error to be instance of "${ErrorClass.name}", but was "${e.constructor.name}"${msg ? `: ${msg}` : "."}`;
            throw new AssertionError(msg);
        }
        if (msgIncludes && !e.message.includes(msgIncludes)) {
            msg = `Expected error message to include "${msgIncludes}", but got "${e.message}"${msg ? `: ${msg}` : "."}`;
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
export async function assertThrowsAsync(fn, ErrorClass, msgIncludes = "", msg) {
    let doesThrow = false;
    let error = null;
    try {
        await fn();
    } catch (e) {
        if (ErrorClass && !(Object.getPrototypeOf(e) === ErrorClass.prototype)) {
            msg = `Expected error to be instance of "${ErrorClass.name}", but got "${e.name}"${msg ? `: ${msg}` : "."}`;
            throw new AssertionError(msg);
        }
        if (msgIncludes && !e.message.includes(msgIncludes)) {
            msg = `Expected error message to include "${msgIncludes}", but got "${e.message}"${msg ? `: ${msg}` : "."}`;
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
/** Use this to stub out methods that will throw when invoked. */ export function unimplemented(msg) {
    throw new AssertionError(msg || "unimplemented");
}
/** Use this to assert unreachable code. */ export function unreachable() {
    throw new AssertionError("unreachable");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC41MS4wL3Rlc3RpbmcvYXNzZXJ0cy50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbmltcG9ydCB7IHJlZCwgZ3JlZW4sIHdoaXRlLCBncmF5LCBib2xkIH0gZnJvbSBcIi4uL2ZtdC9jb2xvcnMudHNcIjtcbmltcG9ydCBkaWZmLCB7IERpZmZUeXBlLCBEaWZmUmVzdWx0IH0gZnJvbSBcIi4vZGlmZi50c1wiO1xuXG5jb25zdCBDQU5fTk9UX0RJU1BMQVkgPSBcIltDYW5ub3QgZGlzcGxheV1cIjtcblxuaW50ZXJmYWNlIENvbnN0cnVjdG9yIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgbmV3ICguLi5hcmdzOiBhbnlbXSk6IGFueTtcbn1cblxuZXhwb3J0IGNsYXNzIEFzc2VydGlvbkVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB0aGlzLm5hbWUgPSBcIkFzc2VydGlvbkVycm9yXCI7XG4gIH1cbn1cblxuZnVuY3Rpb24gZm9ybWF0KHY6IHVua25vd24pOiBzdHJpbmcge1xuICBsZXQgc3RyaW5nID0gRGVuby5pbnNwZWN0KHYpO1xuICBpZiAodHlwZW9mIHYgPT0gXCJzdHJpbmdcIikge1xuICAgIHN0cmluZyA9IGBcIiR7c3RyaW5nLnJlcGxhY2UoLyg/PVtcIlxcXFxdKS9nLCBcIlxcXFxcIil9XCJgO1xuICB9XG4gIHJldHVybiBzdHJpbmc7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUNvbG9yKGRpZmZUeXBlOiBEaWZmVHlwZSk6IChzOiBzdHJpbmcpID0+IHN0cmluZyB7XG4gIHN3aXRjaCAoZGlmZlR5cGUpIHtcbiAgICBjYXNlIERpZmZUeXBlLmFkZGVkOlxuICAgICAgcmV0dXJuIChzOiBzdHJpbmcpOiBzdHJpbmcgPT4gZ3JlZW4oYm9sZChzKSk7XG4gICAgY2FzZSBEaWZmVHlwZS5yZW1vdmVkOlxuICAgICAgcmV0dXJuIChzOiBzdHJpbmcpOiBzdHJpbmcgPT4gcmVkKGJvbGQocykpO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gd2hpdGU7XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlU2lnbihkaWZmVHlwZTogRGlmZlR5cGUpOiBzdHJpbmcge1xuICBzd2l0Y2ggKGRpZmZUeXBlKSB7XG4gICAgY2FzZSBEaWZmVHlwZS5hZGRlZDpcbiAgICAgIHJldHVybiBcIisgICBcIjtcbiAgICBjYXNlIERpZmZUeXBlLnJlbW92ZWQ6XG4gICAgICByZXR1cm4gXCItICAgXCI7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBcIiAgICBcIjtcbiAgfVxufVxuXG5mdW5jdGlvbiBidWlsZE1lc3NhZ2UoZGlmZlJlc3VsdDogUmVhZG9ubHlBcnJheTxEaWZmUmVzdWx0PHN0cmluZz4+KTogc3RyaW5nW10ge1xuICBjb25zdCBtZXNzYWdlczogc3RyaW5nW10gPSBbXTtcbiAgbWVzc2FnZXMucHVzaChcIlwiKTtcbiAgbWVzc2FnZXMucHVzaChcIlwiKTtcbiAgbWVzc2FnZXMucHVzaChcbiAgICBgICAgICR7Z3JheShib2xkKFwiW0RpZmZdXCIpKX0gJHtyZWQoYm9sZChcIkFjdHVhbFwiKSl9IC8gJHtncmVlbihcbiAgICAgIGJvbGQoXCJFeHBlY3RlZFwiKVxuICAgICl9YFxuICApO1xuICBtZXNzYWdlcy5wdXNoKFwiXCIpO1xuICBtZXNzYWdlcy5wdXNoKFwiXCIpO1xuICBkaWZmUmVzdWx0LmZvckVhY2goKHJlc3VsdDogRGlmZlJlc3VsdDxzdHJpbmc+KTogdm9pZCA9PiB7XG4gICAgY29uc3QgYyA9IGNyZWF0ZUNvbG9yKHJlc3VsdC50eXBlKTtcbiAgICBtZXNzYWdlcy5wdXNoKGMoYCR7Y3JlYXRlU2lnbihyZXN1bHQudHlwZSl9JHtyZXN1bHQudmFsdWV9YCkpO1xuICB9KTtcbiAgbWVzc2FnZXMucHVzaChcIlwiKTtcblxuICByZXR1cm4gbWVzc2FnZXM7XG59XG5cbmZ1bmN0aW9uIGlzS2V5ZWRDb2xsZWN0aW9uKHg6IHVua25vd24pOiB4IGlzIFNldDx1bmtub3duPiB7XG4gIHJldHVybiBbU3ltYm9sLml0ZXJhdG9yLCBcInNpemVcIl0uZXZlcnkoKGspID0+IGsgaW4gKHggYXMgU2V0PHVua25vd24+KSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlcXVhbChjOiB1bmtub3duLCBkOiB1bmtub3duKTogYm9vbGVhbiB7XG4gIGNvbnN0IHNlZW4gPSBuZXcgTWFwKCk7XG4gIHJldHVybiAoZnVuY3Rpb24gY29tcGFyZShhOiB1bmtub3duLCBiOiB1bmtub3duKTogYm9vbGVhbiB7XG4gICAgLy8gSGF2ZSB0byByZW5kZXIgUmVnRXhwICYgRGF0ZSBmb3Igc3RyaW5nIGNvbXBhcmlzb25cbiAgICAvLyB1bmxlc3MgaXQncyBtaXN0cmVhdGVkIGFzIG9iamVjdFxuICAgIGlmIChcbiAgICAgIGEgJiZcbiAgICAgIGIgJiZcbiAgICAgICgoYSBpbnN0YW5jZW9mIFJlZ0V4cCAmJiBiIGluc3RhbmNlb2YgUmVnRXhwKSB8fFxuICAgICAgICAoYSBpbnN0YW5jZW9mIERhdGUgJiYgYiBpbnN0YW5jZW9mIERhdGUpKVxuICAgICkge1xuICAgICAgcmV0dXJuIFN0cmluZyhhKSA9PT0gU3RyaW5nKGIpO1xuICAgIH1cbiAgICBpZiAoT2JqZWN0LmlzKGEsIGIpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKGEgJiYgdHlwZW9mIGEgPT09IFwib2JqZWN0XCIgJiYgYiAmJiB0eXBlb2YgYiA9PT0gXCJvYmplY3RcIikge1xuICAgICAgaWYgKHNlZW4uZ2V0KGEpID09PSBiKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKE9iamVjdC5rZXlzKGEgfHwge30pLmxlbmd0aCAhPT0gT2JqZWN0LmtleXMoYiB8fCB7fSkubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmIChpc0tleWVkQ29sbGVjdGlvbihhKSAmJiBpc0tleWVkQ29sbGVjdGlvbihiKSkge1xuICAgICAgICBpZiAoYS5zaXplICE9PSBiLnNpemUpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdW5tYXRjaGVkRW50cmllcyA9IGEuc2l6ZTtcblxuICAgICAgICBmb3IgKGNvbnN0IFthS2V5LCBhVmFsdWVdIG9mIGEuZW50cmllcygpKSB7XG4gICAgICAgICAgZm9yIChjb25zdCBbYktleSwgYlZhbHVlXSBvZiBiLmVudHJpZXMoKSkge1xuICAgICAgICAgICAgLyogR2l2ZW4gdGhhdCBNYXAga2V5cyBjYW4gYmUgcmVmZXJlbmNlcywgd2UgbmVlZFxuICAgICAgICAgICAgICogdG8gZW5zdXJlIHRoYXQgdGhleSBhcmUgYWxzbyBkZWVwbHkgZXF1YWwgKi9cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgKGFLZXkgPT09IGFWYWx1ZSAmJiBiS2V5ID09PSBiVmFsdWUgJiYgY29tcGFyZShhS2V5LCBiS2V5KSkgfHxcbiAgICAgICAgICAgICAgKGNvbXBhcmUoYUtleSwgYktleSkgJiYgY29tcGFyZShhVmFsdWUsIGJWYWx1ZSkpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgdW5tYXRjaGVkRW50cmllcy0tO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1bm1hdGNoZWRFbnRyaWVzID09PSAwO1xuICAgICAgfVxuICAgICAgY29uc3QgbWVyZ2VkID0geyAuLi5hLCAuLi5iIH07XG4gICAgICBmb3IgKGNvbnN0IGtleSBpbiBtZXJnZWQpIHtcbiAgICAgICAgdHlwZSBLZXkgPSBrZXlvZiB0eXBlb2YgbWVyZ2VkO1xuICAgICAgICBpZiAoIWNvbXBhcmUoYSAmJiBhW2tleSBhcyBLZXldLCBiICYmIGJba2V5IGFzIEtleV0pKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzZWVuLnNldChhLCBiKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0pKGMsIGQpO1xufVxuXG4vKiogTWFrZSBhbiBhc3NlcnRpb24sIGlmIG5vdCBgdHJ1ZWAsIHRoZW4gdGhyb3cuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0KGV4cHI6IHVua25vd24sIG1zZyA9IFwiXCIpOiBhc3NlcnRzIGV4cHIge1xuICBpZiAoIWV4cHIpIHtcbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbiAgfVxufVxuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgYW5kIGBleHBlY3RlZGAgYXJlIGVxdWFsLCBkZWVwbHkuIElmIG5vdFxuICogZGVlcGx5IGVxdWFsLCB0aGVuIHRocm93LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0RXF1YWxzKFxuICBhY3R1YWw6IHVua25vd24sXG4gIGV4cGVjdGVkOiB1bmtub3duLFxuICBtc2c/OiBzdHJpbmdcbik6IHZvaWQge1xuICBpZiAoZXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgbGV0IG1lc3NhZ2UgPSBcIlwiO1xuICBjb25zdCBhY3R1YWxTdHJpbmcgPSBmb3JtYXQoYWN0dWFsKTtcbiAgY29uc3QgZXhwZWN0ZWRTdHJpbmcgPSBmb3JtYXQoZXhwZWN0ZWQpO1xuICB0cnkge1xuICAgIGNvbnN0IGRpZmZSZXN1bHQgPSBkaWZmKFxuICAgICAgYWN0dWFsU3RyaW5nLnNwbGl0KFwiXFxuXCIpLFxuICAgICAgZXhwZWN0ZWRTdHJpbmcuc3BsaXQoXCJcXG5cIilcbiAgICApO1xuICAgIG1lc3NhZ2UgPSBidWlsZE1lc3NhZ2UoZGlmZlJlc3VsdCkuam9pbihcIlxcblwiKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIG1lc3NhZ2UgPSBgXFxuJHtyZWQoQ0FOX05PVF9ESVNQTEFZKX0gKyBcXG5cXG5gO1xuICB9XG4gIGlmIChtc2cpIHtcbiAgICBtZXNzYWdlID0gbXNnO1xuICB9XG4gIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtZXNzYWdlKTtcbn1cblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBhY3R1YWxgIGFuZCBgZXhwZWN0ZWRgIGFyZSBub3QgZXF1YWwsIGRlZXBseS5cbiAqIElmIG5vdCB0aGVuIHRocm93LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0Tm90RXF1YWxzKFxuICBhY3R1YWw6IHVua25vd24sXG4gIGV4cGVjdGVkOiB1bmtub3duLFxuICBtc2c/OiBzdHJpbmdcbik6IHZvaWQge1xuICBpZiAoIWVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGxldCBhY3R1YWxTdHJpbmc6IHN0cmluZztcbiAgbGV0IGV4cGVjdGVkU3RyaW5nOiBzdHJpbmc7XG4gIHRyeSB7XG4gICAgYWN0dWFsU3RyaW5nID0gU3RyaW5nKGFjdHVhbCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBhY3R1YWxTdHJpbmcgPSBcIltDYW5ub3QgZGlzcGxheV1cIjtcbiAgfVxuICB0cnkge1xuICAgIGV4cGVjdGVkU3RyaW5nID0gU3RyaW5nKGV4cGVjdGVkKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGV4cGVjdGVkU3RyaW5nID0gXCJbQ2Fubm90IGRpc3BsYXldXCI7XG4gIH1cbiAgaWYgKCFtc2cpIHtcbiAgICBtc2cgPSBgYWN0dWFsOiAke2FjdHVhbFN0cmluZ30gZXhwZWN0ZWQ6ICR7ZXhwZWN0ZWRTdHJpbmd9YDtcbiAgfVxuICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbn1cblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBhY3R1YWxgIGFuZCBgZXhwZWN0ZWRgIGFyZSBzdHJpY3RseSBlcXVhbC4gIElmXG4gKiBub3QgdGhlbiB0aHJvdy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFN0cmljdEVxKFxuICBhY3R1YWw6IHVua25vd24sXG4gIGV4cGVjdGVkOiB1bmtub3duLFxuICBtc2c/OiBzdHJpbmdcbik6IHZvaWQge1xuICBpZiAoYWN0dWFsICE9PSBleHBlY3RlZCkge1xuICAgIGxldCBhY3R1YWxTdHJpbmc6IHN0cmluZztcbiAgICBsZXQgZXhwZWN0ZWRTdHJpbmc6IHN0cmluZztcbiAgICB0cnkge1xuICAgICAgYWN0dWFsU3RyaW5nID0gU3RyaW5nKGFjdHVhbCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgYWN0dWFsU3RyaW5nID0gXCJbQ2Fubm90IGRpc3BsYXldXCI7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBleHBlY3RlZFN0cmluZyA9IFN0cmluZyhleHBlY3RlZCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZXhwZWN0ZWRTdHJpbmcgPSBcIltDYW5ub3QgZGlzcGxheV1cIjtcbiAgICB9XG4gICAgaWYgKCFtc2cpIHtcbiAgICAgIG1zZyA9IGBhY3R1YWw6ICR7YWN0dWFsU3RyaW5nfSBleHBlY3RlZDogJHtleHBlY3RlZFN0cmluZ31gO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbiAgfVxufVxuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYWN0dWFsIGNvbnRhaW5zIGV4cGVjdGVkLiBJZiBub3RcbiAqIHRoZW4gdGhyb3duLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0U3RyQ29udGFpbnMoXG4gIGFjdHVhbDogc3RyaW5nLFxuICBleHBlY3RlZDogc3RyaW5nLFxuICBtc2c/OiBzdHJpbmdcbik6IHZvaWQge1xuICBpZiAoIWFjdHVhbC5pbmNsdWRlcyhleHBlY3RlZCkpIHtcbiAgICBpZiAoIW1zZykge1xuICAgICAgbXNnID0gYGFjdHVhbDogXCIke2FjdHVhbH1cIiBleHBlY3RlZCB0byBjb250YWluczogXCIke2V4cGVjdGVkfVwiYDtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG4gIH1cbn1cblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBhY3R1YWxgIGNvbnRhaW5zIHRoZSBgZXhwZWN0ZWRgIHZhbHVlc1xuICogSWYgbm90IHRoZW4gdGhyb3duLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0QXJyYXlDb250YWlucyhcbiAgYWN0dWFsOiB1bmtub3duW10sXG4gIGV4cGVjdGVkOiB1bmtub3duW10sXG4gIG1zZz86IHN0cmluZ1xuKTogdm9pZCB7XG4gIGNvbnN0IG1pc3Npbmc6IHVua25vd25bXSA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGV4cGVjdGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGZvdW5kID0gZmFsc2U7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBhY3R1YWwubGVuZ3RoOyBqKyspIHtcbiAgICAgIGlmIChlcXVhbChleHBlY3RlZFtpXSwgYWN0dWFsW2pdKSkge1xuICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWZvdW5kKSB7XG4gICAgICBtaXNzaW5nLnB1c2goZXhwZWN0ZWRbaV0pO1xuICAgIH1cbiAgfVxuICBpZiAobWlzc2luZy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKCFtc2cpIHtcbiAgICBtc2cgPSBgYWN0dWFsOiBcIiR7YWN0dWFsfVwiIGV4cGVjdGVkIHRvIGNvbnRhaW5zOiBcIiR7ZXhwZWN0ZWR9XCJgO1xuICAgIG1zZyArPSBcIlxcblwiO1xuICAgIG1zZyArPSBgbWlzc2luZzogJHttaXNzaW5nfWA7XG4gIH1cbiAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBtYXRjaCBSZWdFeHAgYGV4cGVjdGVkYC4gSWYgbm90XG4gKiB0aGVuIHRocm93blxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0TWF0Y2goXG4gIGFjdHVhbDogc3RyaW5nLFxuICBleHBlY3RlZDogUmVnRXhwLFxuICBtc2c/OiBzdHJpbmdcbik6IHZvaWQge1xuICBpZiAoIWV4cGVjdGVkLnRlc3QoYWN0dWFsKSkge1xuICAgIGlmICghbXNnKSB7XG4gICAgICBtc2cgPSBgYWN0dWFsOiBcIiR7YWN0dWFsfVwiIGV4cGVjdGVkIHRvIG1hdGNoOiBcIiR7ZXhwZWN0ZWR9XCJgO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbiAgfVxufVxuXG4vKipcbiAqIEZvcmNlZnVsbHkgdGhyb3dzIGEgZmFpbGVkIGFzc2VydGlvblxuICovXG5leHBvcnQgZnVuY3Rpb24gZmFpbChtc2c/OiBzdHJpbmcpOiB2b2lkIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11c2UtYmVmb3JlLWRlZmluZVxuICBhc3NlcnQoZmFsc2UsIGBGYWlsZWQgYXNzZXJ0aW9uJHttc2cgPyBgOiAke21zZ31gIDogXCIuXCJ9YCk7XG59XG5cbi8qKiBFeGVjdXRlcyBhIGZ1bmN0aW9uLCBleHBlY3RpbmcgaXQgdG8gdGhyb3cuICBJZiBpdCBkb2VzIG5vdCwgdGhlbiBpdFxuICogdGhyb3dzLiAgQW4gZXJyb3IgY2xhc3MgYW5kIGEgc3RyaW5nIHRoYXQgc2hvdWxkIGJlIGluY2x1ZGVkIGluIHRoZVxuICogZXJyb3IgbWVzc2FnZSBjYW4gYWxzbyBiZSBhc3NlcnRlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFRocm93cyhcbiAgZm46ICgpID0+IHZvaWQsXG4gIEVycm9yQ2xhc3M/OiBDb25zdHJ1Y3RvcixcbiAgbXNnSW5jbHVkZXMgPSBcIlwiLFxuICBtc2c/OiBzdHJpbmdcbik6IEVycm9yIHtcbiAgbGV0IGRvZXNUaHJvdyA9IGZhbHNlO1xuICBsZXQgZXJyb3IgPSBudWxsO1xuICB0cnkge1xuICAgIGZuKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAoRXJyb3JDbGFzcyAmJiAhKE9iamVjdC5nZXRQcm90b3R5cGVPZihlKSA9PT0gRXJyb3JDbGFzcy5wcm90b3R5cGUpKSB7XG4gICAgICBtc2cgPSBgRXhwZWN0ZWQgZXJyb3IgdG8gYmUgaW5zdGFuY2Ugb2YgXCIke0Vycm9yQ2xhc3MubmFtZX1cIiwgYnV0IHdhcyBcIiR7XG4gICAgICAgIGUuY29uc3RydWN0b3IubmFtZVxuICAgICAgfVwiJHttc2cgPyBgOiAke21zZ31gIDogXCIuXCJ9YDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xuICAgIH1cbiAgICBpZiAobXNnSW5jbHVkZXMgJiYgIWUubWVzc2FnZS5pbmNsdWRlcyhtc2dJbmNsdWRlcykpIHtcbiAgICAgIG1zZyA9IGBFeHBlY3RlZCBlcnJvciBtZXNzYWdlIHRvIGluY2x1ZGUgXCIke21zZ0luY2x1ZGVzfVwiLCBidXQgZ290IFwiJHtcbiAgICAgICAgZS5tZXNzYWdlXG4gICAgICB9XCIke21zZyA/IGA6ICR7bXNnfWAgOiBcIi5cIn1gO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG4gICAgfVxuICAgIGRvZXNUaHJvdyA9IHRydWU7XG4gICAgZXJyb3IgPSBlO1xuICB9XG4gIGlmICghZG9lc1Rocm93KSB7XG4gICAgbXNnID0gYEV4cGVjdGVkIGZ1bmN0aW9uIHRvIHRocm93JHttc2cgPyBgOiAke21zZ31gIDogXCIuXCJ9YDtcbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbiAgfVxuICByZXR1cm4gZXJyb3I7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhc3NlcnRUaHJvd3NBc3luYyhcbiAgZm46ICgpID0+IFByb21pc2U8dm9pZD4sXG4gIEVycm9yQ2xhc3M/OiBDb25zdHJ1Y3RvcixcbiAgbXNnSW5jbHVkZXMgPSBcIlwiLFxuICBtc2c/OiBzdHJpbmdcbik6IFByb21pc2U8RXJyb3I+IHtcbiAgbGV0IGRvZXNUaHJvdyA9IGZhbHNlO1xuICBsZXQgZXJyb3IgPSBudWxsO1xuICB0cnkge1xuICAgIGF3YWl0IGZuKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAoRXJyb3JDbGFzcyAmJiAhKE9iamVjdC5nZXRQcm90b3R5cGVPZihlKSA9PT0gRXJyb3JDbGFzcy5wcm90b3R5cGUpKSB7XG4gICAgICBtc2cgPSBgRXhwZWN0ZWQgZXJyb3IgdG8gYmUgaW5zdGFuY2Ugb2YgXCIke0Vycm9yQ2xhc3MubmFtZX1cIiwgYnV0IGdvdCBcIiR7XG4gICAgICAgIGUubmFtZVxuICAgICAgfVwiJHttc2cgPyBgOiAke21zZ31gIDogXCIuXCJ9YDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xuICAgIH1cbiAgICBpZiAobXNnSW5jbHVkZXMgJiYgIWUubWVzc2FnZS5pbmNsdWRlcyhtc2dJbmNsdWRlcykpIHtcbiAgICAgIG1zZyA9IGBFeHBlY3RlZCBlcnJvciBtZXNzYWdlIHRvIGluY2x1ZGUgXCIke21zZ0luY2x1ZGVzfVwiLCBidXQgZ290IFwiJHtcbiAgICAgICAgZS5tZXNzYWdlXG4gICAgICB9XCIke21zZyA/IGA6ICR7bXNnfWAgOiBcIi5cIn1gO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG4gICAgfVxuICAgIGRvZXNUaHJvdyA9IHRydWU7XG4gICAgZXJyb3IgPSBlO1xuICB9XG4gIGlmICghZG9lc1Rocm93KSB7XG4gICAgbXNnID0gYEV4cGVjdGVkIGZ1bmN0aW9uIHRvIHRocm93JHttc2cgPyBgOiAke21zZ31gIDogXCIuXCJ9YDtcbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbiAgfVxuICByZXR1cm4gZXJyb3I7XG59XG5cbi8qKiBVc2UgdGhpcyB0byBzdHViIG91dCBtZXRob2RzIHRoYXQgd2lsbCB0aHJvdyB3aGVuIGludm9rZWQuICovXG5leHBvcnQgZnVuY3Rpb24gdW5pbXBsZW1lbnRlZChtc2c/OiBzdHJpbmcpOiBuZXZlciB7XG4gIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cgfHwgXCJ1bmltcGxlbWVudGVkXCIpO1xufVxuXG4vKiogVXNlIHRoaXMgdG8gYXNzZXJ0IHVucmVhY2hhYmxlIGNvZGUuICovXG5leHBvcnQgZnVuY3Rpb24gdW5yZWFjaGFibGUoKTogbmV2ZXIge1xuICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXCJ1bnJlYWNoYWJsZVwiKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUEwRSxBQUExRSx3RUFBMEU7U0FDakUsR0FBRyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksU0FBUSxnQkFBa0I7T0FDekQsSUFBSSxJQUFJLFFBQVEsU0FBb0IsU0FBVztNQUVoRCxlQUFlLElBQUcsZ0JBQWtCO2FBTzdCLGNBQWMsU0FBUyxLQUFLO2dCQUMzQixPQUFlO1FBQ3pCLEtBQUssQ0FBQyxPQUFPO2FBQ1IsSUFBSSxJQUFHLGNBQWdCOzs7U0FJdkIsTUFBTSxDQUFDLENBQVU7UUFDcEIsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztlQUNoQixDQUFDLEtBQUksTUFBUTtRQUN0QixNQUFNLElBQUksQ0FBQyxFQUFFLE1BQU0sQ0FBQyxPQUFPLGdCQUFlLEVBQUksR0FBRSxDQUFDOztXQUU1QyxNQUFNOztTQUdOLFdBQVcsQ0FBQyxRQUFrQjtXQUM3QixRQUFRO2FBQ1QsUUFBUSxDQUFDLEtBQUs7b0JBQ1QsQ0FBUyxHQUFhLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQzs7YUFDdkMsUUFBUSxDQUFDLE9BQU87b0JBQ1gsQ0FBUyxHQUFhLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7O21CQUVqQyxLQUFLOzs7U0FJVCxVQUFVLENBQUMsUUFBa0I7V0FDNUIsUUFB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