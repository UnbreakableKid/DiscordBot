/*!
 * Port of body-parser (https://github.com/expressjs/body-parser) for Deno.
 *
 * Licensed as follows:
 *
 * (The MIT License)
 *
 * Copyright (c) 2014 Jonathan Ong <me@jongleberry.com>
 * Copyright (c) 2014-2015 Douglas Christopher Wilson <doug@somethingdoug.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * 'Software'), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */
import { createError, hasBody } from "../../../deps.ts";
import { read } from "./read.ts";
import { getCharset } from "./getCharset.ts";
import { typeChecker } from "./typeChecker.ts";
/**
 * RegExp to match the first non-space in a string.
 *
 * Allowed whitespace is defined in RFC 7159:
 *
 *    ws = *(
 *            %x20 /              ; Space
 *            %x09 /              ; Horizontal tab
 *            %x0A /              ; Line feed or New line
 *            %x0D )              ; Carriage return
 */ const FIRST_CHAR_REGEXP = /^[\x20\x09\x0a\x0d]*(.)/; // eslint-disable-line no-control-regex
/**
 * Create a middleware to parse JSON bodies.
 *
 * @param {object} [options]
 * @return {function}
 * @public
 */ export function json(options = {}) {
  const inflate = options.inflate !== false;
  const reviver = options.reviver;
  const strict = options.strict !== false;
  const type = options.type || "application/json";
  const verify = options.verify || false;
  if (verify !== false && typeof verify !== "function") {
    throw new TypeError("option verify must be function");
  }
  // create the appropriate type checking function
  const shouldParse = typeof type !== "function" ? typeChecker(type) : type;
  function parse(buf) {
    if (buf.length === 0) {
      // special-case empty json body, as it's a common client-side mistake
      return {};
    }
    if (strict) {
      const first = firstChar(buf);
      if (first !== "{" && first !== "[") {
        throw createStrictSyntaxError(buf, first);
      }
    }
    try {
      return JSON.parse(buf, reviver);
    } catch (e) {
      throw normalizeJsonSyntaxError(e, {
        message: e.message,
        stack: e.stack,
      });
    }
  }
  return async function jsonParser(req, res, next) {
    if (req._parsedBody) {
      next();
      return;
    }
    // skip requests without bodies
    if (
      !hasBody(req.headers) ||
      parseInt(req.headers.get("content-length") || "") === 0
    ) {
      req.parsedBody = {};
      next();
      return;
    }
    // determine if request should be parsed
    if (!shouldParse(req)) {
      next();
      return;
    }
    // assert charset per RFC 7159 sec 8.1
    const charset = getCharset(req) || "utf-8";
    if (charset.substr(0, 4) !== "utf-") {
      next(
        createError(415, 'unsupported charset "' + charset.toUpperCase() + '"'),
      );
      return;
    }
    // read
    await read(req, res, next, parse, {
      encoding: charset,
      inflate: inflate,
      verify: verify,
    });
  };
}
/**
 * Create strict violation syntax error matching native error.
 *
 * @param {string} str
 * @param {string} char
 * @return {Error}
 * @private
 */ function createStrictSyntaxError(str, char) {
  const index = str.indexOf(char);
  const partial = str.substring(0, index) + "#";
  try {
    JSON.parse(partial); /* istanbul ignore next */
    throw new SyntaxError("strict violation");
  } catch (e) {
    return normalizeJsonSyntaxError(e, {
      message: e.message.replace("#", char),
      stack: e.stack,
    });
  }
}
/**
 * Get the first non-whitespace character in a string.
 *
 * @param {string} str
 * @return {function}
 * @private
 */ function firstChar(str) {
  return FIRST_CHAR_REGEXP.exec(str)[1];
}
/**
 * Normalize a SyntaxError for JSON.parse.
 *
 * @param {SyntaxError} error
 * @param {object} obj
 * @return {SyntaxError}
 */ function normalizeJsonSyntaxError(error, obj) {
  const keys = Object.getOwnPropertyNames(error);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key !== "stack" && key !== "message") {
      delete error[key];
    }
  }
  // replace stack before message for Node.js 0.10 and below
  error.stack = obj.stack.replace(error.message, obj.message);
  error.message = obj.message;
  return error;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy9taWRkbGV3YXJlL2JvZHlQYXJzZXIvanNvbi50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLyohXG4gKiBQb3J0IG9mIGJvZHktcGFyc2VyIChodHRwczovL2dpdGh1Yi5jb20vZXhwcmVzc2pzL2JvZHktcGFyc2VyKSBmb3IgRGVuby5cbiAqXG4gKiBMaWNlbnNlZCBhcyBmb2xsb3dzOlxuICpcbiAqIChUaGUgTUlUIExpY2Vuc2UpXG4gKiBcbiAqIENvcHlyaWdodCAoYykgMjAxNCBKb25hdGhhbiBPbmcgPG1lQGpvbmdsZWJlcnJ5LmNvbT5cbiAqIENvcHlyaWdodCAoYykgMjAxNC0yMDE1IERvdWdsYXMgQ2hyaXN0b3BoZXIgV2lsc29uIDxkb3VnQHNvbWV0aGluZ2RvdWcuY29tPlxuICogXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmdcbiAqIGEgY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuICogJ1NvZnR3YXJlJyksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuICogd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuICogZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvXG4gKiBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG9cbiAqIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqIFxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmVcbiAqIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICogXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCxcbiAqIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuICogTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULlxuICogSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTllcbiAqIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsXG4gKiBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRVxuICogU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG4gKiBcbiAqL1xuXG5pbXBvcnQgeyBjcmVhdGVFcnJvciwgaGFzQm9keSB9IGZyb20gXCIuLi8uLi8uLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyByZWFkIH0gZnJvbSBcIi4vcmVhZC50c1wiO1xuaW1wb3J0IHsgZ2V0Q2hhcnNldCB9IGZyb20gXCIuL2dldENoYXJzZXQudHNcIjtcbmltcG9ydCB7IHR5cGVDaGVja2VyIH0gZnJvbSBcIi4vdHlwZUNoZWNrZXIudHNcIjtcbmltcG9ydCB0eXBlIHsgTmV4dEZ1bmN0aW9uLCBSZXF1ZXN0LCBSZXNwb25zZSB9IGZyb20gXCIuLi8uLi90eXBlcy50c1wiO1xuXG4vKipcbiAqIFJlZ0V4cCB0byBtYXRjaCB0aGUgZmlyc3Qgbm9uLXNwYWNlIGluIGEgc3RyaW5nLlxuICpcbiAqIEFsbG93ZWQgd2hpdGVzcGFjZSBpcyBkZWZpbmVkIGluIFJGQyA3MTU5OlxuICpcbiAqICAgIHdzID0gKihcbiAqICAgICAgICAgICAgJXgyMCAvICAgICAgICAgICAgICA7IFNwYWNlXG4gKiAgICAgICAgICAgICV4MDkgLyAgICAgICAgICAgICAgOyBIb3Jpem9udGFsIHRhYlxuICogICAgICAgICAgICAleDBBIC8gICAgICAgICAgICAgIDsgTGluZSBmZWVkIG9yIE5ldyBsaW5lXG4gKiAgICAgICAgICAgICV4MEQgKSAgICAgICAgICAgICAgOyBDYXJyaWFnZSByZXR1cm5cbiAqL1xuXG5jb25zdCBGSVJTVF9DSEFSX1JFR0VYUCA9IC9eW1xceDIwXFx4MDlcXHgwYVxceDBkXSooLikvOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnRyb2wtcmVnZXhcblxuLyoqXG4gKiBDcmVhdGUgYSBtaWRkbGV3YXJlIHRvIHBhcnNlIEpTT04gYm9kaWVzLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc11cbiAqIEByZXR1cm4ge2Z1bmN0aW9ufVxuICogQHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24ganNvbihvcHRpb25zOiBhbnkgPSB7fSkge1xuICBjb25zdCBpbmZsYXRlID0gb3B0aW9ucy5pbmZsYXRlICE9PSBmYWxzZTtcbiAgY29uc3QgcmV2aXZlciA9IG9wdGlvbnMucmV2aXZlcjtcbiAgY29uc3Qgc3RyaWN0ID0gb3B0aW9ucy5zdHJpY3QgIT09IGZhbHNlO1xuICBjb25zdCB0eXBlID0gb3B0aW9ucy50eXBlIHx8IFwiYXBwbGljYXRpb24vanNvblwiO1xuICBjb25zdCB2ZXJpZnkgPSBvcHRpb25zLnZlcmlmeSB8fCBmYWxzZTtcblxuICBpZiAodmVyaWZ5ICE9PSBmYWxzZSAmJiB0eXBlb2YgdmVyaWZ5ICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwib3B0aW9uIHZlcmlmeSBtdXN0IGJlIGZ1bmN0aW9uXCIpO1xuICB9XG5cbiAgLy8gY3JlYXRlIHRoZSBhcHByb3ByaWF0ZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9uXG4gIGNvbnN0IHNob3VsZFBhcnNlID0gdHlwZW9mIHR5cGUgIT09IFwiZnVuY3Rpb25cIiA/IHR5cGVDaGVja2VyKHR5cGUpIDogdHlwZTtcblxuICBmdW5jdGlvbiBwYXJzZShidWY6IHN0cmluZykge1xuICAgIGlmIChidWYubGVuZ3RoID09PSAwKSB7XG4gICAgICAvLyBzcGVjaWFsLWNhc2UgZW1wdHkganNvbiBib2R5LCBhcyBpdCdzIGEgY29tbW9uIGNsaWVudC1zaWRlIG1pc3Rha2VcbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG5cbiAgICBpZiAoc3RyaWN0KSB7XG4gICAgICBjb25zdCBmaXJzdCA9IGZpcnN0Q2hhcihidWYpO1xuXG4gICAgICBpZiAoZmlyc3QgIT09IFwie1wiICYmIGZpcnN0ICE9PSBcIltcIikge1xuICAgICAgICB0aHJvdyBjcmVhdGVTdHJpY3RTeW50YXhFcnJvcihidWYsIGZpcnN0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2UoYnVmLCByZXZpdmVyKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aHJvdyBub3JtYWxpemVKc29uU3ludGF4RXJyb3IoZSwge1xuICAgICAgICBtZXNzYWdlOiBlLm1lc3NhZ2UsXG4gICAgICAgIHN0YWNrOiBlLnN0YWNrLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGFzeW5jIGZ1bmN0aW9uIGpzb25QYXJzZXIoXG4gICAgcmVxOiBSZXF1ZXN0LFxuICAgIHJlczogUmVzcG9uc2UsXG4gICAgbmV4dDogTmV4dEZ1bmN0aW9uLFxuICApIHtcbiAgICBpZiAocmVxLl9wYXJzZWRCb2R5KSB7XG4gICAgICBuZXh0KCk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBza2lwIHJlcXVlc3RzIHdpdGhvdXQgYm9kaWVzXG4gICAgaWYgKFxuICAgICAgIWhhc0JvZHkocmVxLmhlYWRlcnMpIHx8XG4gICAgICBwYXJzZUludChyZXEuaGVhZGVycy5nZXQoXCJjb250ZW50LWxlbmd0aFwiKSB8fCBcIlwiKSA9PT0gMFxuICAgICkge1xuICAgICAgcmVxLnBhcnNlZEJvZHkgPSB7fTtcbiAgICAgIG5leHQoKTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGRldGVybWluZSBpZiByZXF1ZXN0IHNob3VsZCBiZSBwYXJzZWRcbiAgICBpZiAoIXNob3VsZFBhcnNlKHJlcSkpIHtcbiAgICAgIG5leHQoKTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGFzc2VydCBjaGFyc2V0IHBlciBSRkMgNzE1OSBzZWMgOC4xXG4gICAgY29uc3QgY2hhcnNldCA9IGdldENoYXJzZXQocmVxKSB8fCBcInV0Zi04XCI7XG4gICAgaWYgKGNoYXJzZXQuc3Vic3RyKDAsIDQpICE9PSBcInV0Zi1cIikge1xuICAgICAgbmV4dChcbiAgICAgICAgY3JlYXRlRXJyb3IoXG4gICAgICAgICAgNDE1LFxuICAgICAgICAgICd1bnN1cHBvcnRlZCBjaGFyc2V0IFwiJyArIGNoYXJzZXQudG9VcHBlckNhc2UoKSArICdcIicsXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gcmVhZFxuICAgIGF3YWl0IHJlYWQocmVxLCByZXMsIG5leHQsIHBhcnNlLCB7XG4gICAgICBlbmNvZGluZzogY2hhcnNldCxcbiAgICAgIGluZmxhdGU6IGluZmxhdGUsXG4gICAgICB2ZXJpZnk6IHZlcmlmeSxcbiAgICB9KTtcbiAgfTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgc3RyaWN0IHZpb2xhdGlvbiBzeW50YXggZXJyb3IgbWF0Y2hpbmcgbmF0aXZlIGVycm9yLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBjaGFyXG4gKiBAcmV0dXJuIHtFcnJvcn1cbiAqIEBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gY3JlYXRlU3RyaWN0U3ludGF4RXJyb3Ioc3RyOiBzdHJpbmcsIGNoYXI6IHN0cmluZykge1xuICBjb25zdCBpbmRleCA9IHN0ci5pbmRleE9mKGNoYXIpO1xuICBjb25zdCBwYXJ0aWFsID0gc3RyLnN1YnN0cmluZygwLCBpbmRleCkgKyBcIiNcIjtcblxuICB0cnkge1xuICAgIEpTT04ucGFyc2UocGFydGlhbCk7IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKFwic3RyaWN0IHZpb2xhdGlvblwiKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBub3JtYWxpemVKc29uU3ludGF4RXJyb3IoZSwge1xuICAgICAgbWVzc2FnZTogZS5tZXNzYWdlLnJlcGxhY2UoXCIjXCIsIGNoYXIpLFxuICAgICAgc3RhY2s6IGUuc3RhY2ssXG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBHZXQgdGhlIGZpcnN0IG5vbi13aGl0ZXNwYWNlIGNoYXJhY3RlciBpbiBhIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtmdW5jdGlvbn1cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGZpcnN0Q2hhcihzdHI6IHN0cmluZykge1xuICByZXR1cm4gKEZJUlNUX0NIQVJfUkVHRVhQLmV4ZWMoc3RyKSBhcyBhbnlbXSlbMV07XG59XG5cbi8qKlxuICogTm9ybWFsaXplIGEgU3ludGF4RXJyb3IgZm9yIEpTT04ucGFyc2UuXG4gKlxuICogQHBhcmFtIHtTeW50YXhFcnJvcn0gZXJyb3JcbiAqIEBwYXJhbSB7b2JqZWN0fSBvYmpcbiAqIEByZXR1cm4ge1N5bnRheEVycm9yfVxuICovXG5mdW5jdGlvbiBub3JtYWxpemVKc29uU3ludGF4RXJyb3IoZXJyb3I6IGFueSwgb2JqOiBhbnkpIHtcbiAgY29uc3Qga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGVycm9yKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBrZXkgPSBrZXlzW2ldO1xuICAgIGlmIChrZXkgIT09IFwic3RhY2tcIiAmJiBrZXkgIT09IFwibWVzc2FnZVwiKSB7XG4gICAgICBkZWxldGUgZXJyb3Jba2V5XTtcbiAgICB9XG4gIH1cblxuICAvLyByZXBsYWNlIHN0YWNrIGJlZm9yZSBtZXNzYWdlIGZvciBOb2RlLmpzIDAuMTAgYW5kIGJlbG93XG4gIGVycm9yLnN0YWNrID0gb2JqLnN0YWNrLnJlcGxhY2UoZXJyb3IubWVzc2FnZSwgb2JqLm1lc3NhZ2UpO1xuICBlcnJvci5tZXNzYWdlID0gb2JqLm1lc3NhZ2U7XG5cbiAgcmV0dXJuIGVycm9yO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEVBNkJHLEFBN0JIOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQTZCRyxBQTdCSCxFQTZCRyxVQUVNLFdBQVcsRUFBRSxPQUFPLFNBQVEsZ0JBQWtCO1NBQzlDLElBQUksU0FBUSxTQUFXO1NBQ3ZCLFVBQVUsU0FBUSxlQUFpQjtTQUNuQyxXQUFXLFNBQVEsZ0JBQWtCO0FBRzlDLEVBVUcsQUFWSDs7Ozs7Ozs7OztDQVVHLEFBVkgsRUFVRyxPQUVHLGlCQUFpQiw2QkFBOEIsQ0FBdUMsQUFBdkMsRUFBdUMsQUFBdkMscUNBQXVDO0FBRTVGLEVBTUcsQUFOSDs7Ozs7O0NBTUcsQUFOSCxFQU1HLGlCQUNhLElBQUksQ0FBQyxPQUFZOztVQUN6QixPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sS0FBSyxLQUFLO1VBQ25DLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTztVQUN6QixNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sS0FBSyxLQUFLO1VBQ2pDLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxLQUFJLGdCQUFrQjtVQUN6QyxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0s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
