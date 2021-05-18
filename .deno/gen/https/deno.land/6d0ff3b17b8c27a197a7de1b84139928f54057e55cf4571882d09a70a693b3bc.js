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
import { read } from "./read.ts";
import { getCharset } from "./getCharset.ts";
import { hasBody } from "../../../deps.ts";
import { typeChecker } from "./typeChecker.ts";
/**
 * Create a middleware to parse text bodies.
 *
 * @param {object} [options]
 * @return {function}
 * @public
 */ export function text(options = {}) {
  const defaultCharset = options.defaultCharset || "utf-8";
  const inflate = options.inflate !== false;
  const type = options.type || "text/plain";
  const verify = options.verify || false;
  if (verify !== false && typeof verify !== "function") {
    throw new TypeError("option verify must be function");
  }
  // create the appropriate type checking function
  const shouldParse = typeof type !== "function" ? typeChecker(type) : type;
  function parse(buf) {
    return buf;
  }
  return function textParser(req, res, next) {
    if (req._parsedBody) {
      next();
      return;
    }
    // skip requests without bodies
    if (
      !hasBody(req.headers) ||
      parseInt(req.headers.get("content-length") || "") === 0
    ) {
      req.parsedBody = "";
      next();
      return;
    }
    // determine if request should be parsed
    if (!shouldParse(req)) {
      next();
      return;
    }
    // get charset
    const charset = getCharset(req) || defaultCharset;
    // read
    read(req, res, next, parse, {
      encoding: charset,
      inflate: inflate,
      verify: verify,
    });
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy9taWRkbGV3YXJlL2JvZHlQYXJzZXIvdGV4dC50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLyohXG4gKiBQb3J0IG9mIGJvZHktcGFyc2VyIChodHRwczovL2dpdGh1Yi5jb20vZXhwcmVzc2pzL2JvZHktcGFyc2VyKSBmb3IgRGVuby5cbiAqXG4gKiBMaWNlbnNlZCBhcyBmb2xsb3dzOlxuICpcbiAqIChUaGUgTUlUIExpY2Vuc2UpXG4gKiBcbiAqIENvcHlyaWdodCAoYykgMjAxNCBKb25hdGhhbiBPbmcgPG1lQGpvbmdsZWJlcnJ5LmNvbT5cbiAqIENvcHlyaWdodCAoYykgMjAxNC0yMDE1IERvdWdsYXMgQ2hyaXN0b3BoZXIgV2lsc29uIDxkb3VnQHNvbWV0aGluZ2RvdWcuY29tPlxuICogXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmdcbiAqIGEgY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuICogJ1NvZnR3YXJlJyksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuICogd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuICogZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvXG4gKiBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG9cbiAqIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqIFxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmVcbiAqIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICogXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCxcbiAqIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuICogTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULlxuICogSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTllcbiAqIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsXG4gKiBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRVxuICogU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG4gKiBcbiAqL1xuXG5pbXBvcnQgeyByZWFkIH0gZnJvbSBcIi4vcmVhZC50c1wiO1xuaW1wb3J0IHsgZ2V0Q2hhcnNldCB9IGZyb20gXCIuL2dldENoYXJzZXQudHNcIjtcbmltcG9ydCB0eXBlIHsgTmV4dEZ1bmN0aW9uLCBSZXF1ZXN0LCBSZXNwb25zZSB9IGZyb20gXCIuLi8uLi90eXBlcy50c1wiO1xuaW1wb3J0IHsgaGFzQm9keSB9IGZyb20gXCIuLi8uLi8uLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyB0eXBlQ2hlY2tlciB9IGZyb20gXCIuL3R5cGVDaGVja2VyLnRzXCI7XG5cbi8qKlxuICogQ3JlYXRlIGEgbWlkZGxld2FyZSB0byBwYXJzZSB0ZXh0IGJvZGllcy5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXG4gKiBAcmV0dXJuIHtmdW5jdGlvbn1cbiAqIEBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRleHQob3B0aW9uczogYW55ID0ge30pIHtcbiAgY29uc3QgZGVmYXVsdENoYXJzZXQgPSBvcHRpb25zLmRlZmF1bHRDaGFyc2V0IHx8IFwidXRmLThcIjtcbiAgY29uc3QgaW5mbGF0ZSA9IG9wdGlvbnMuaW5mbGF0ZSAhPT0gZmFsc2U7XG4gIGNvbnN0IHR5cGUgPSBvcHRpb25zLnR5cGUgfHwgXCJ0ZXh0L3BsYWluXCI7XG4gIGNvbnN0IHZlcmlmeSA9IG9wdGlvbnMudmVyaWZ5IHx8IGZhbHNlO1xuXG4gIGlmICh2ZXJpZnkgIT09IGZhbHNlICYmIHR5cGVvZiB2ZXJpZnkgIT09IFwiZnVuY3Rpb25cIikge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJvcHRpb24gdmVyaWZ5IG11c3QgYmUgZnVuY3Rpb25cIik7XG4gIH1cblxuICAvLyBjcmVhdGUgdGhlIGFwcHJvcHJpYXRlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25cbiAgY29uc3Qgc2hvdWxkUGFyc2UgPSB0eXBlb2YgdHlwZSAhPT0gXCJmdW5jdGlvblwiID8gdHlwZUNoZWNrZXIodHlwZSkgOiB0eXBlO1xuXG4gIGZ1bmN0aW9uIHBhcnNlKGJ1Zjogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGJ1ZjtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiB0ZXh0UGFyc2VyKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKSB7XG4gICAgaWYgKHJlcS5fcGFyc2VkQm9keSkge1xuICAgICAgbmV4dCgpO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gc2tpcCByZXF1ZXN0cyB3aXRob3V0IGJvZGllc1xuICAgIGlmIChcbiAgICAgICFoYXNCb2R5KHJlcS5oZWFkZXJzKSB8fFxuICAgICAgcGFyc2VJbnQocmVxLmhlYWRlcnMuZ2V0KFwiY29udGVudC1sZW5ndGhcIikgfHwgXCJcIikgPT09IDBcbiAgICApIHtcbiAgICAgIHJlcS5wYXJzZWRCb2R5ID0gXCJcIjtcbiAgICAgIG5leHQoKTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGRldGVybWluZSBpZiByZXF1ZXN0IHNob3VsZCBiZSBwYXJzZWRcbiAgICBpZiAoIXNob3VsZFBhcnNlKHJlcSkpIHtcbiAgICAgIG5leHQoKTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGdldCBjaGFyc2V0XG4gICAgY29uc3QgY2hhcnNldCA9IGdldENoYXJzZXQocmVxKSB8fCBkZWZhdWx0Q2hhcnNldDtcblxuICAgIC8vIHJlYWRcbiAgICByZWFkKHJlcSwgcmVzLCBuZXh0LCBwYXJzZSwge1xuICAgICAgZW5jb2Rpbmc6IGNoYXJzZXQsXG4gICAgICBpbmZsYXRlOiBpbmZsYXRlLFxuICAgICAgdmVyaWZ5OiB2ZXJpZnksXG4gICAgfSk7XG4gIH07XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUE2QkcsQUE3Qkg7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBNkJHLEFBN0JILEVBNkJHLFVBRU0sSUFBSSxTQUFRLFNBQVc7U0FDdkIsVUFBVSxTQUFRLGVBQWlCO1NBRW5DLE9BQU8sU0FBUSxnQkFBa0I7U0FDakMsV0FBVyxTQUFRLGdCQUFrQjtBQUU5QyxFQU1HLEFBTkg7Ozs7OztDQU1HLEFBTkgsRUFNRyxpQkFDYSxJQUFJLENBQUMsT0FBWTs7VUFDekIsY0FBYyxHQUFHLE9BQU8sQ0FBQyxjQUFjLEtBQUksS0FBTztVQUNsRCxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sS0FBSyxLQUFLO1VBQ25DLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxLQUFJLFVBQVk7VUFDbkMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLElBQUksS0FBSztRQUVsQyxNQUFNLEtBQUssS0FBSyxXQUFXLE1BQU0sTUFBSyxRQUFVO2tCQUN4QyxTQUFTLEVBQUMsOEJBQWdDOztJQUd0RCxFQUFnRCxBQUFoRCw4Q0FBZ0Q7VUFDMUMsV0FBVyxVQUFVLElBQUksTUFBSyxRQUFVLElBQUcsV0FBVyxDQUFDLElBQUksSUFBSSxJQUFJO2FBRWhFLEtBQUssQ0FBQyxHQUFXO2VBQ2pCLEdBQUc7O29CQUdJLFVBQVUsQ0FBQyxHQUFZLEVBQUUsR0FBYSxFQUFFLElBQWtCO1lBQ3BFLEdBQUcsQ0FBQyxXQUFXO1lBQ2pCLElBQUk7OztRQUtOLEVBQStCLEFBQS9CLDZCQUErQjthQUU1QixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sS0FDcEIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFDLGNBQWdCLGNBQWEsQ0FBQztZQUV2RCxHQUFHLENBQUMsVUFBVTtZQUNkLElBQUk7OztRQUtOLEVBQXdDLEFBQXhDLHNDQUF3QzthQUNuQyxXQUFXLENBQUMsR0FBRztZQUNsQixJQUFJOzs7UUFLTixFQUFjLEFBQWQsWUFBYztjQUNSLE9BQU8sR0FBRyxVQUFVLENBQUMsR0FBRyxLQUFLLGNBQWM7UUFFakQsRUFBTyxBQUFQLEtBQU87UUFDUCxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsS0FBSztZQUN4QixRQUFRLEVBQUUsT0FBTztZQUNqQixPQUFPLEVBQUUsT0FBTztZQUNoQixNQUFNLEVBQUUsTUFBTSJ9
