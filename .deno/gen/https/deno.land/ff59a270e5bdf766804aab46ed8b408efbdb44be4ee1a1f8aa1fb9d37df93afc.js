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
import { createError } from "../../../deps.ts";
import { read } from "./read.ts";
import { getCharset } from "./getCharset.ts";
import { hasBody, qs } from "../../../deps.ts";
import { typeChecker } from "./typeChecker.ts";
/**
 * Create a middleware to parse urlencoded bodies.
 *
 * @param {object} [options]
 * @return {function}
 * @public
 */ export function urlencoded(options = {}) {
  const extended = options.extended !== false;
  const inflate = options.inflate !== false;
  const type = options.type || "application/x-www-form-urlencoded";
  const verify = options.verify || false;
  if (verify !== false && typeof verify !== "function") {
    throw new TypeError("option verify must be function");
  }
  const queryParse = extended ? extendedParser(options) : simpleParser(options);
  // create the appropriate type checking function
  const shouldParse = typeof type !== "function" ? typeChecker(type) : type;
  function parse(body) {
    return body.length ? queryParse(body) : {};
  }
  return function urlencodedParser(req, res, next) {
    if (req._parsedBody) {
      next();
      return;
    }
    // skip requests without bodies
    if (
      !hasBody(req.headers) ||
      parseInt(req.headers.get("content-length") || "") === 0
    ) {
      req.parsedBody = Object.fromEntries(new URLSearchParams().entries());
      next();
      return;
    }
    // determine if request should be parsed
    if (!shouldParse(req)) {
      next();
      return;
    }
    // assert charset
    const charset = getCharset(req) || "utf-8";
    if (charset !== "utf-8") {
      next(
        createError(415, 'unsupported charset "' + charset.toUpperCase() + '"'),
      );
      return;
    }
    // read
    read(req, res, next, parse, {
      encoding: charset,
      inflate: inflate,
      verify: verify,
    });
  };
}
/**
 * Get the simple query parser.
 *
 * @param {object} options
 * @private
 */ function simpleParser(options) {
  let parameterLimit = options.parameterLimit !== undefined
    ? options.parameterLimit
    : 1000;
  if (isNaN(parameterLimit) || parameterLimit < 1) {
    throw new TypeError("option parameterLimit must be a positive number");
  }
  if (isFinite(parameterLimit)) {
    parameterLimit = parameterLimit | 0;
  }
  return function queryParse(body) {
    const decodedBody = decode(body);
    const paramCount = parameterCount(decodedBody, parameterLimit);
    if (paramCount === undefined) {
      throw createError(413, "too many parameters", {
        type: "parameters.too.many",
      });
    }
    return Object.fromEntries(new URLSearchParams(decodedBody).entries());
  };
}
/**
 * Get the extended query parser.
 *
 * @param {object} options
 * @private
 */ function extendedParser(options) {
  let parameterLimit = options.parameterLimit !== undefined
    ? options.parameterLimit
    : 1000;
  if (isNaN(parameterLimit) || parameterLimit < 1) {
    throw new TypeError("option parameterLimit must be a positive number");
  }
  if (isFinite(parameterLimit)) {
    parameterLimit = parameterLimit | 0;
  }
  return function queryParse(body) {
    const decodedBody = decode(body);
    const paramCount = parameterCount(decodedBody, parameterLimit);
    if (paramCount === undefined) {
      throw createError(413, "too many parameters", {
        type: "parameters.too.many",
      });
    }
    const arrayLimit = Math.max(100, paramCount);
    return qs.parse(decodedBody, {
      allowPrototypes: true,
      arrayLimit,
      depth: Infinity,
      parameterLimit,
    });
  };
}
/**
 * Count the number of parameters, stopping once limit reached
 *
 * @param {string} body
 * @param {number} limit
 * @private
 */ function parameterCount(body, limit) {
  let count = 0;
  let index = 0;
  while ((index = body.indexOf("&", index)) !== -1) {
    count++;
    index++;
    if (count === limit) {
      return undefined;
    }
  }
  return count;
}
/**
 * URI decode a string
 *
 * @param {string} str
 * @returns {string} decoded string
 * @private
 */ function decode(str) {
  return decodeURIComponent(str.replace(/\+/g, " "));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy9taWRkbGV3YXJlL2JvZHlQYXJzZXIvdXJsZW5jb2RlZC50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLyohXG4gKiBQb3J0IG9mIGJvZHktcGFyc2VyIChodHRwczovL2dpdGh1Yi5jb20vZXhwcmVzc2pzL2JvZHktcGFyc2VyKSBmb3IgRGVuby5cbiAqXG4gKiBMaWNlbnNlZCBhcyBmb2xsb3dzOlxuICpcbiAqIChUaGUgTUlUIExpY2Vuc2UpXG4gKiBcbiAqIENvcHlyaWdodCAoYykgMjAxNCBKb25hdGhhbiBPbmcgPG1lQGpvbmdsZWJlcnJ5LmNvbT5cbiAqIENvcHlyaWdodCAoYykgMjAxNC0yMDE1IERvdWdsYXMgQ2hyaXN0b3BoZXIgV2lsc29uIDxkb3VnQHNvbWV0aGluZ2RvdWcuY29tPlxuICogXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmdcbiAqIGEgY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuICogJ1NvZnR3YXJlJyksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuICogd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuICogZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvXG4gKiBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG9cbiAqIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqIFxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmVcbiAqIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICogXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCxcbiAqIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuICogTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULlxuICogSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTllcbiAqIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsXG4gKiBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRVxuICogU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG4gKiBcbiAqL1xuXG5pbXBvcnQgeyBjcmVhdGVFcnJvciB9IGZyb20gXCIuLi8uLi8uLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyByZWFkIH0gZnJvbSBcIi4vcmVhZC50c1wiO1xuaW1wb3J0IHsgZ2V0Q2hhcnNldCB9IGZyb20gXCIuL2dldENoYXJzZXQudHNcIjtcbmltcG9ydCB0eXBlIHsgTmV4dEZ1bmN0aW9uLCBSZXF1ZXN0LCBSZXNwb25zZSB9IGZyb20gXCIuLi8uLi90eXBlcy50c1wiO1xuaW1wb3J0IHsgaGFzQm9keSwgcXMgfSBmcm9tIFwiLi4vLi4vLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgdHlwZUNoZWNrZXIgfSBmcm9tIFwiLi90eXBlQ2hlY2tlci50c1wiO1xuXG4vKipcbiAqIENyZWF0ZSBhIG1pZGRsZXdhcmUgdG8gcGFyc2UgdXJsZW5jb2RlZCBib2RpZXMuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxuICogQHJldHVybiB7ZnVuY3Rpb259XG4gKiBAcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cmxlbmNvZGVkKG9wdGlvbnM6IGFueSA9IHt9KSB7XG4gIGNvbnN0IGV4dGVuZGVkID0gb3B0aW9ucy5leHRlbmRlZCAhPT0gZmFsc2U7XG4gIGNvbnN0IGluZmxhdGUgPSBvcHRpb25zLmluZmxhdGUgIT09IGZhbHNlO1xuICBjb25zdCB0eXBlID0gb3B0aW9ucy50eXBlIHx8IFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkXCI7XG4gIGNvbnN0IHZlcmlmeSA9IG9wdGlvbnMudmVyaWZ5IHx8IGZhbHNlO1xuXG4gIGlmICh2ZXJpZnkgIT09IGZhbHNlICYmIHR5cGVvZiB2ZXJpZnkgIT09IFwiZnVuY3Rpb25cIikge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJvcHRpb24gdmVyaWZ5IG11c3QgYmUgZnVuY3Rpb25cIik7XG4gIH1cblxuICBjb25zdCBxdWVyeVBhcnNlID0gZXh0ZW5kZWQgPyBleHRlbmRlZFBhcnNlcihvcHRpb25zKSA6IHNpbXBsZVBhcnNlcihvcHRpb25zKTtcblxuICAvLyBjcmVhdGUgdGhlIGFwcHJvcHJpYXRlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25cbiAgY29uc3Qgc2hvdWxkUGFyc2UgPSB0eXBlb2YgdHlwZSAhPT0gXCJmdW5jdGlvblwiID8gdHlwZUNoZWNrZXIodHlwZSkgOiB0eXBlO1xuXG4gIGZ1bmN0aW9uIHBhcnNlKGJvZHk6IHN0cmluZykge1xuICAgIHJldHVybiBib2R5Lmxlbmd0aCA/IHF1ZXJ5UGFyc2UoYm9keSkgOiB7fTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiB1cmxlbmNvZGVkUGFyc2VyKFxuICAgIHJlcTogUmVxdWVzdCxcbiAgICByZXM6IFJlc3BvbnNlLFxuICAgIG5leHQ6IE5leHRGdW5jdGlvbixcbiAgKSB7XG4gICAgaWYgKHJlcS5fcGFyc2VkQm9keSkge1xuICAgICAgbmV4dCgpO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gc2tpcCByZXF1ZXN0cyB3aXRob3V0IGJvZGllc1xuICAgIGlmIChcbiAgICAgICFoYXNCb2R5KHJlcS5oZWFkZXJzKSB8fFxuICAgICAgcGFyc2VJbnQocmVxLmhlYWRlcnMuZ2V0KFwiY29udGVudC1sZW5ndGhcIikgfHwgXCJcIikgPT09IDBcbiAgICApIHtcbiAgICAgIHJlcS5wYXJzZWRCb2R5ID0gT2JqZWN0LmZyb21FbnRyaWVzKFxuICAgICAgICBuZXcgVVJMU2VhcmNoUGFyYW1zKCkuZW50cmllcygpLFxuICAgICAgKTtcbiAgICAgIG5leHQoKTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGRldGVybWluZSBpZiByZXF1ZXN0IHNob3VsZCBiZSBwYXJzZWRcbiAgICBpZiAoIXNob3VsZFBhcnNlKHJlcSkpIHtcbiAgICAgIG5leHQoKTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGFzc2VydCBjaGFyc2V0XG4gICAgY29uc3QgY2hhcnNldCA9IGdldENoYXJzZXQocmVxKSB8fCBcInV0Zi04XCI7XG4gICAgaWYgKGNoYXJzZXQgIT09IFwidXRmLThcIikge1xuICAgICAgbmV4dChcbiAgICAgICAgY3JlYXRlRXJyb3IoXG4gICAgICAgICAgNDE1LFxuICAgICAgICAgICd1bnN1cHBvcnRlZCBjaGFyc2V0IFwiJyArIGNoYXJzZXQudG9VcHBlckNhc2UoKSArICdcIicsXG4gICAgICAgICksXG4gICAgICApO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gcmVhZFxuICAgIHJlYWQocmVxLCByZXMsIG5leHQsIHBhcnNlLCB7XG4gICAgICBlbmNvZGluZzogY2hhcnNldCxcbiAgICAgIGluZmxhdGU6IGluZmxhdGUsXG4gICAgICB2ZXJpZnk6IHZlcmlmeSxcbiAgICB9KTtcbiAgfTtcbn1cblxuLyoqXG4gKiBHZXQgdGhlIHNpbXBsZSBxdWVyeSBwYXJzZXIuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnNcbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIHNpbXBsZVBhcnNlcihvcHRpb25zOiBhbnkpIHtcbiAgbGV0IHBhcmFtZXRlckxpbWl0ID0gb3B0aW9ucy5wYXJhbWV0ZXJMaW1pdCAhPT0gdW5kZWZpbmVkXG4gICAgPyBvcHRpb25zLnBhcmFtZXRlckxpbWl0XG4gICAgOiAxMDAwO1xuXG4gIGlmIChpc05hTihwYXJhbWV0ZXJMaW1pdCkgfHwgcGFyYW1ldGVyTGltaXQgPCAxKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIm9wdGlvbiBwYXJhbWV0ZXJMaW1pdCBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyXCIpO1xuICB9XG5cbiAgaWYgKGlzRmluaXRlKHBhcmFtZXRlckxpbWl0KSkge1xuICAgIHBhcmFtZXRlckxpbWl0ID0gcGFyYW1ldGVyTGltaXQgfCAwO1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIHF1ZXJ5UGFyc2UoYm9keTogc3RyaW5nKSB7XG4gICAgY29uc3QgZGVjb2RlZEJvZHkgPSBkZWNvZGUoYm9keSk7XG4gICAgY29uc3QgcGFyYW1Db3VudCA9IHBhcmFtZXRlckNvdW50KGRlY29kZWRCb2R5LCBwYXJhbWV0ZXJMaW1pdCk7XG5cbiAgICBpZiAocGFyYW1Db3VudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBjcmVhdGVFcnJvcig0MTMsIFwidG9vIG1hbnkgcGFyYW1ldGVyc1wiLCB7XG4gICAgICAgIHR5cGU6IFwicGFyYW1ldGVycy50b28ubWFueVwiLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyhcbiAgICAgIG5ldyBVUkxTZWFyY2hQYXJhbXMoZGVjb2RlZEJvZHkpXG4gICAgICAgIC5lbnRyaWVzKCksXG4gICAgKTtcbiAgfTtcbn1cblxuLyoqXG4gKiBHZXQgdGhlIGV4dGVuZGVkIHF1ZXJ5IHBhcnNlci5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gZXh0ZW5kZWRQYXJzZXIob3B0aW9uczogYW55KSB7XG4gIGxldCBwYXJhbWV0ZXJMaW1pdCA9IG9wdGlvbnMucGFyYW1ldGVyTGltaXQgIT09IHVuZGVmaW5lZFxuICAgID8gb3B0aW9ucy5wYXJhbWV0ZXJMaW1pdFxuICAgIDogMTAwMDtcblxuICBpZiAoaXNOYU4ocGFyYW1ldGVyTGltaXQpIHx8IHBhcmFtZXRlckxpbWl0IDwgMSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJvcHRpb24gcGFyYW1ldGVyTGltaXQgbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlclwiKTtcbiAgfVxuXG4gIGlmIChpc0Zpbml0ZShwYXJhbWV0ZXJMaW1pdCkpIHtcbiAgICBwYXJhbWV0ZXJMaW1pdCA9IHBhcmFtZXRlckxpbWl0IHwgMDtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiBxdWVyeVBhcnNlKGJvZHk6IHN0cmluZykge1xuICAgIGNvbnN0IGRlY29kZWRCb2R5ID0gZGVjb2RlKGJvZHkpO1xuICAgIGNvbnN0IHBhcmFtQ291bnQgPSBwYXJhbWV0ZXJDb3VudChkZWNvZGVkQm9keSwgcGFyYW1ldGVyTGltaXQpO1xuXG4gICAgaWYgKHBhcmFtQ291bnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgY3JlYXRlRXJyb3IoNDEzLCBcInRvbyBtYW55IHBhcmFtZXRlcnNcIiwge1xuICAgICAgICB0eXBlOiBcInBhcmFtZXRlcnMudG9vLm1hbnlcIixcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGFycmF5TGltaXQgPSBNYXRoLm1heCgxMDAsIHBhcmFtQ291bnQpO1xuXG4gICAgcmV0dXJuIHFzLnBhcnNlKGRlY29kZWRCb2R5LCB7XG4gICAgICBhbGxvd1Byb3RvdHlwZXM6IHRydWUsXG4gICAgICBhcnJheUxpbWl0LFxuICAgICAgZGVwdGg6IEluZmluaXR5LFxuICAgICAgcGFyYW1ldGVyTGltaXQsXG4gICAgfSk7XG4gIH07XG59XG5cbi8qKlxuICogQ291bnQgdGhlIG51bWJlciBvZiBwYXJhbWV0ZXJzLCBzdG9wcGluZyBvbmNlIGxpbWl0IHJlYWNoZWRcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gYm9keVxuICogQHBhcmFtIHtudW1iZXJ9IGxpbWl0XG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBwYXJhbWV0ZXJDb3VudChib2R5OiBzdHJpbmcsIGxpbWl0OiBudW1iZXIpIHtcbiAgbGV0IGNvdW50ID0gMDtcbiAgbGV0IGluZGV4ID0gMDtcblxuICB3aGlsZSAoKGluZGV4ID0gYm9keS5pbmRleE9mKFwiJlwiLCBpbmRleCkpICE9PSAtMSkge1xuICAgIGNvdW50Kys7XG4gICAgaW5kZXgrKztcblxuICAgIGlmIChjb3VudCA9PT0gbGltaXQpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNvdW50O1xufVxuXG4vKipcbiAqIFVSSSBkZWNvZGUgYSBzdHJpbmdcbiAqIFxuICogQHBhcmFtIHtzdHJpbmd9IHN0ciBcbiAqIEByZXR1cm5zIHtzdHJpbmd9IGRlY29kZWQgc3RyaW5nXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBkZWNvZGUoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHN0ci5yZXBsYWNlKC9cXCsvZywgXCIgXCIpKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQTZCRyxBQTdCSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0E2QkcsQUE3QkgsRUE2QkcsVUFFTSxXQUFXLFNBQVEsZ0JBQWtCO1NBQ3JDLElBQUksU0FBUSxTQUFXO1NBQ3ZCLFVBQVUsU0FBUSxlQUFpQjtTQUVuQyxP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
