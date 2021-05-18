export function notImplemented(msg) {
    const message = msg ? `Not implemented: ${msg}` : "Not implemented";
    throw new Error(message);
}
export const _TextDecoder = TextDecoder;
export const _TextEncoder = TextEncoder;
export function intoCallbackAPI(// eslint-disable-next-line @typescript-eslint/no-explicit-any
func, cb, // eslint-disable-next-line @typescript-eslint/no-explicit-any
...args) {
    func(...args).then((value)=>cb && cb(null, value)
    ).catch((err)=>cb && cb(err, null)
    );
}
export function intoCallbackAPIWithIntercept(// eslint-disable-next-line @typescript-eslint/no-explicit-any
func, interceptor, cb, // eslint-disable-next-line @typescript-eslint/no-explicit-any
...args) {
    func(...args).then((value)=>cb && cb(null, interceptor(value))
    ).catch((err)=>cb && cb(err, null)
    );
}
export function spliceOne(list, index) {
    for(; index + 1 < list.length; index++)list[index] = list[index + 1];
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
    switch(enc.length){
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
            if (enc === "utf16le" || enc === "UTF16LE" || `${enc}`.toLowerCase() === "utf16le") {
                return "utf16le";
            }
            break;
        case 8:
            if (enc === "utf-16le" || enc === "UTF-16LE" || `${enc}`.toLowerCase() === "utf-16le") {
                return "utf16le";
            }
            break;
        default:
            if (enc === "") return "utf8";
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC42Ni4wL25vZGUvX3V0aWxzLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZnVuY3Rpb24gbm90SW1wbGVtZW50ZWQobXNnPzogc3RyaW5nKTogbmV2ZXIge1xuICBjb25zdCBtZXNzYWdlID0gbXNnID8gYE5vdCBpbXBsZW1lbnRlZDogJHttc2d9YCA6IFwiTm90IGltcGxlbWVudGVkXCI7XG4gIHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcbn1cblxuZXhwb3J0IHR5cGUgX1RleHREZWNvZGVyID0gdHlwZW9mIFRleHREZWNvZGVyLnByb3RvdHlwZTtcbmV4cG9ydCBjb25zdCBfVGV4dERlY29kZXIgPSBUZXh0RGVjb2RlcjtcblxuZXhwb3J0IHR5cGUgX1RleHRFbmNvZGVyID0gdHlwZW9mIFRleHRFbmNvZGVyLnByb3RvdHlwZTtcbmV4cG9ydCBjb25zdCBfVGV4dEVuY29kZXIgPSBUZXh0RW5jb2RlcjtcblxuLy8gQVBJIGhlbHBlcnNcblxuZXhwb3J0IHR5cGUgTWF5YmVOdWxsPFQ+ID0gVCB8IG51bGw7XG5leHBvcnQgdHlwZSBNYXliZURlZmluZWQ8VD4gPSBUIHwgdW5kZWZpbmVkO1xuZXhwb3J0IHR5cGUgTWF5YmVFbXB0eTxUPiA9IFQgfCBudWxsIHwgdW5kZWZpbmVkO1xuXG5leHBvcnQgZnVuY3Rpb24gaW50b0NhbGxiYWNrQVBJPFQ+KFxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICBmdW5jOiAoLi4uYXJnczogYW55W10pID0+IFByb21pc2U8VD4sXG4gIGNiOiBNYXliZUVtcHR5PChlcnI6IE1heWJlTnVsbDxFcnJvcj4sIHZhbHVlOiBNYXliZUVtcHR5PFQ+KSA9PiB2b2lkPixcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgLi4uYXJnczogYW55W11cbik6IHZvaWQge1xuICBmdW5jKC4uLmFyZ3MpXG4gICAgLnRoZW4oKHZhbHVlKSA9PiBjYiAmJiBjYihudWxsLCB2YWx1ZSkpXG4gICAgLmNhdGNoKChlcnIpID0+IGNiICYmIGNiKGVyciwgbnVsbCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW50b0NhbGxiYWNrQVBJV2l0aEludGVyY2VwdDxUMSwgVDI+KFxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICBmdW5jOiAoLi4uYXJnczogYW55W10pID0+IFByb21pc2U8VDE+LFxuICBpbnRlcmNlcHRvcjogKHY6IFQxKSA9PiBUMixcbiAgY2I6IE1heWJlRW1wdHk8KGVycjogTWF5YmVOdWxsPEVycm9yPiwgdmFsdWU6IE1heWJlRW1wdHk8VDI+KSA9PiB2b2lkPixcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgLi4uYXJnczogYW55W11cbik6IHZvaWQge1xuICBmdW5jKC4uLmFyZ3MpXG4gICAgLnRoZW4oKHZhbHVlKSA9PiBjYiAmJiBjYihudWxsLCBpbnRlcmNlcHRvcih2YWx1ZSkpKVxuICAgIC5jYXRjaCgoZXJyKSA9PiBjYiAmJiBjYihlcnIsIG51bGwpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNwbGljZU9uZShsaXN0OiBzdHJpbmdbXSwgaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBmb3IgKDsgaW5kZXggKyAxIDwgbGlzdC5sZW5ndGg7IGluZGV4KyspIGxpc3RbaW5kZXhdID0gbGlzdFtpbmRleCArIDFdO1xuICBsaXN0LnBvcCgpO1xufVxuXG4vLyBUYWtlbiBmcm9tOiBodHRwczovL2dpdGh1Yi5jb20vbm9kZWpzL25vZGUvYmxvYi9iYTY4NDgwNWI2YzBlZGVkNzZlNWNkODllZTAwMzI4YWM3YTU5MzY1L2xpYi9pbnRlcm5hbC91dGlsLmpzI0wxMjVcbi8vIFJldHVybiB1bmRlZmluZWQgaWYgdGhlcmUgaXMgbm8gbWF0Y2guXG4vLyBNb3ZlIHRoZSBcInNsb3cgY2FzZXNcIiB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHRvIG1ha2Ugc3VyZSB0aGlzIGZ1bmN0aW9uIGdldHNcbi8vIGlubGluZWQgcHJvcGVybHkuIFRoYXQgcHJpb3JpdGl6ZXMgdGhlIGNvbW1vbiBjYXNlLlxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUVuY29kaW5nKGVuYzogc3RyaW5nIHwgbnVsbCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIGlmIChlbmMgPT0gbnVsbCB8fCBlbmMgPT09IFwidXRmOFwiIHx8IGVuYyA9PT0gXCJ1dGYtOFwiKSByZXR1cm4gXCJ1dGY4XCI7XG4gIHJldHVybiBzbG93Q2FzZXMoZW5jKTtcbn1cblxuLy8gaHR0cHM6Ly9naXRodWIuY29tL25vZGVqcy9ub2RlL2Jsb2IvYmE2ODQ4MDViNmMwZWRlZDc2ZTVjZDg5ZWUwMDMyOGFjN2E1OTM2NS9saWIvaW50ZXJuYWwvdXRpbC5qcyNMMTMwXG5mdW5jdGlvbiBzbG93Q2FzZXMoZW5jOiBzdHJpbmcpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICBzd2l0Y2ggKGVuYy5sZW5ndGgpIHtcbiAgICBjYXNlIDQ6XG4gICAgICBpZiAoZW5jID09PSBcIlVURjhcIikgcmV0dXJuIFwidXRmOFwiO1xuICAgICAgaWYgKGVuYyA9PT0gXCJ1Y3MyXCIgfHwgZW5jID09PSBcIlVDUzJcIikgcmV0dXJuIFwidXRmMTZsZVwiO1xuICAgICAgZW5jID0gYCR7ZW5jfWAudG9Mb3dlckNhc2UoKTtcbiAgICAgIGlmIChlbmMgPT09IFwidXRmOFwiKSByZXR1cm4gXCJ1dGY4XCI7XG4gICAgICBpZiAoZW5jID09PSBcInVjczJcIikgcmV0dXJuIFwidXRmMTZsZVwiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAzOlxuICAgICAgaWYgKGVuYyA9PT0gXCJoZXhcIiB8fCBlbmMgPT09IFwiSEVYXCIgfHwgYCR7ZW5jfWAudG9Mb3dlckNhc2UoKSA9PT0gXCJoZXhcIikge1xuICAgICAgICByZXR1cm4gXCJoZXhcIjtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgNTpcbiAgICAgIGlmIChlbmMgPT09IFwiYXNjaWlcIikgcmV0dXJuIFwiYXNjaWlcIjtcbiAgICAgIGlmIChlbmMgPT09IFwidWNzLTJcIikgcmV0dXJuIFwidXRmMTZsZVwiO1xuICAgICAgaWYgKGVuYyA9PT0gXCJVVEYtOFwiKSByZXR1cm4gXCJ1dGY4XCI7XG4gICAgICBpZiAoZW5jID09PSBcIkFTQ0lJXCIpIHJldHVybiBcImFzY2lpXCI7XG4gICAgICBpZiAoZW5jID09PSBcIlVDUy0yXCIpIHJldHVybiBcInV0ZjE2bGVcIjtcbiAgICAgIGVuYyA9IGAke2VuY31gLnRvTG93ZXJDYXNlKCk7XG4gICAgICBpZiAoZW5jID09PSBcInV0Zi04XCIpIHJldHVybiBcInV0ZjhcIjtcbiAgICAgIGlmIChlbmMgPT09IFwiYXNjaWlcIikgcmV0dXJuIFwiYXNjaWlcIjtcbiAgICAgIGlmIChlbmMgPT09IFwidWNzLTJcIikgcmV0dXJuIFwidXRmMTZsZVwiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSA2OlxuICAgICAgaWYgKGVuYyA9PT0gXCJiYXNlNjRcIikgcmV0dXJuIFwiYmFzZTY0XCI7XG4gICAgICBpZiAoZW5jID09PSBcImxhdGluMVwiIHx8IGVuYyA9PT0gXCJiaW5hcnlcIikgcmV0dXJuIFwibGF0aW4xXCI7XG4gICAgICBpZiAoZW5jID09PSBcIkJBU0U2NFwiKSByZXR1cm4gXCJiYXNlNjRcIjtcbiAgICAgIGlmIChlbmMgPT09IFwiTEFUSU4xXCIgfHwgZW5jID09PSBcIkJJTkFSWVwiKSByZXR1cm4gXCJsYXRpbjFcIjtcbiAgICAgIGVuYyA9IGAke2VuY31gLnRvTG93ZXJDYXNlKCk7XG4gICAgICBpZiAoZW5jID09PSBcImJhc2U2NFwiKSByZXR1cm4gXCJiYXNlNjRcIjtcbiAgICAgIGlmIChlbmMgPT09IFwibGF0aW4xXCIgfHwgZW5jID09PSBcImJpbmFyeVwiKSByZXR1cm4gXCJsYXRpbjFcIjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgNzpcbiAgICAgIGlmIChcbiAgICAgICAgZW5jID09PSBcInV0ZjE2bGVcIiB8fFxuICAgICAgICBlbmMgPT09IFwiVVRGMTZMRVwiIHx8XG4gICAgICAgIGAke2VuY31gLnRvTG93ZXJDYXNlKCkgPT09IFwidXRmMTZsZVwiXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIFwidXRmMTZsZVwiO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSA4OlxuICAgICAgaWYgKFxuICAgICAgICBlbmMgPT09IFwidXRmLTE2bGVcIiB8fFxuICAgICAgICBlbmMgPT09IFwiVVRGLTE2TEVcIiB8fFxuICAgICAgICBgJHtlbmN9YC50b0xvd2VyQ2FzZSgpID09PSBcInV0Zi0xNmxlXCJcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gXCJ1dGYxNmxlXCI7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgaWYgKGVuYyA9PT0gXCJcIikgcmV0dXJuIFwidXRmOFwiO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6ImdCQUFnQixjQUFjLENBQUMsR0FBWTtVQUNuQyxPQUFPLEdBQUcsR0FBRyxJQUFJLGlCQUFpQixFQUFFLEdBQUcsTUFBSyxlQUFpQjtjQUN6RCxLQUFLLENBQUMsT0FBTzs7YUFJWixZQUFZLEdBQUcsV0FBVzthQUcxQixZQUFZLEdBQUcsV0FBVztnQkFRdkIsZUFBZSxDQUM3QixFQUE4RCxBQUE5RCw0REFBOEQ7QUFDOUQsSUFBb0MsRUFDcEMsRUFBcUUsRUFDckUsRUFBOEQsQUFBOUQsNERBQThEO0dBQzNELElBQUk7SUFFUCxJQUFJLElBQUksSUFBSSxFQUNULElBQUksRUFBRSxLQUFLLEdBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsS0FBSztNQUNwQyxLQUFLLEVBQUUsR0FBRyxHQUFLLEVB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