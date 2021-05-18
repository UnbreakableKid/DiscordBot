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
 */ import { read } from "./read.ts";
import { hasBody } from "../../../deps.ts";
import { typeChecker } from "./typeChecker.ts";
/**
 * Create a middleware to parse raw bodies.
 *
 * @param {object} [options]
 * @return {function}
 * @public
 */ export function raw(options = {
}) {
    const inflate = options.inflate !== false;
    const type = options.type || "application/octet-stream";
    const verify = options.verify || false;
    if (verify !== false && typeof verify !== "function") {
        throw new TypeError("option verify must be function");
    }
    // create the appropriate type checking function
    const shouldParse = typeof type !== "function" ? typeChecker(type) : type;
    function parse(body) {
        return body;
    }
    return function rawParser(req, res, next) {
        if (req._parsedBody) {
            next();
            return;
        }
        // skip requests without bodies
        if (!hasBody(req.headers) || parseInt(req.headers.get("content-length") || "") === 0) {
            req.parsedBody = "";
            next();
            return;
        }
        // determine if request should be parsed
        if (!shouldParse(req)) {
            next();
            return;
        }
        // read
        read(req, res, next, parse, {
            encoding: null,
            inflate: inflate,
            verify: verify
        });
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy9taWRkbGV3YXJlL2JvZHlQYXJzZXIvcmF3LnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIFBvcnQgb2YgYm9keS1wYXJzZXIgKGh0dHBzOi8vZ2l0aHViLmNvbS9leHByZXNzanMvYm9keS1wYXJzZXIpIGZvciBEZW5vLlxuICpcbiAqIExpY2Vuc2VkIGFzIGZvbGxvd3M6XG4gKlxuICogKFRoZSBNSVQgTGljZW5zZSlcbiAqIFxuICogQ29weXJpZ2h0IChjKSAyMDE0IEpvbmF0aGFuIE9uZyA8bWVAam9uZ2xlYmVycnkuY29tPlxuICogQ29weXJpZ2h0IChjKSAyMDE0LTIwMTUgRG91Z2xhcyBDaHJpc3RvcGhlciBXaWxzb24gPGRvdWdAc29tZXRoaW5nZG91Zy5jb20+XG4gKiBcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZ1xuICogYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4gKiAnU29mdHdhcmUnKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4gKiB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4gKiBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG9cbiAqIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0b1xuICogdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICogXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZVxuICogaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKiBcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELFxuICogRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4gKiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuXG4gKiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWVxuICogQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCxcbiAqIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFXG4gKiBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqIFxuICovXG5cbmltcG9ydCB7IHJlYWQgfSBmcm9tIFwiLi9yZWFkLnRzXCI7XG5pbXBvcnQgdHlwZSB7IE5leHRGdW5jdGlvbiwgUmVxdWVzdCwgUmVzcG9uc2UgfSBmcm9tIFwiLi4vLi4vdHlwZXMudHNcIjtcbmltcG9ydCB7IGhhc0JvZHkgfSBmcm9tIFwiLi4vLi4vLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgdHlwZUNoZWNrZXIgfSBmcm9tIFwiLi90eXBlQ2hlY2tlci50c1wiO1xuXG4vKipcbiAqIENyZWF0ZSBhIG1pZGRsZXdhcmUgdG8gcGFyc2UgcmF3IGJvZGllcy5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXG4gKiBAcmV0dXJuIHtmdW5jdGlvbn1cbiAqIEBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJhdyhvcHRpb25zOiBhbnkgPSB7fSkge1xuICBjb25zdCBpbmZsYXRlID0gb3B0aW9ucy5pbmZsYXRlICE9PSBmYWxzZTtcbiAgY29uc3QgdHlwZSA9IG9wdGlvbnMudHlwZSB8fCBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiO1xuICBjb25zdCB2ZXJpZnkgPSBvcHRpb25zLnZlcmlmeSB8fCBmYWxzZTtcblxuICBpZiAodmVyaWZ5ICE9PSBmYWxzZSAmJiB0eXBlb2YgdmVyaWZ5ICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwib3B0aW9uIHZlcmlmeSBtdXN0IGJlIGZ1bmN0aW9uXCIpO1xuICB9XG5cbiAgLy8gY3JlYXRlIHRoZSBhcHByb3ByaWF0ZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9uXG4gIGNvbnN0IHNob3VsZFBhcnNlID0gdHlwZW9mIHR5cGUgIT09IFwiZnVuY3Rpb25cIiA/IHR5cGVDaGVja2VyKHR5cGUpIDogdHlwZTtcblxuICBmdW5jdGlvbiBwYXJzZShib2R5OiBhbnkpIHtcbiAgICByZXR1cm4gYm9keTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiByYXdQYXJzZXIocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlLCBuZXh0OiBOZXh0RnVuY3Rpb24pIHtcbiAgICBpZiAocmVxLl9wYXJzZWRCb2R5KSB7XG4gICAgICBuZXh0KCk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBza2lwIHJlcXVlc3RzIHdpdGhvdXQgYm9kaWVzXG4gICAgaWYgKFxuICAgICAgIWhhc0JvZHkocmVxLmhlYWRlcnMpIHx8XG4gICAgICBwYXJzZUludChyZXEuaGVhZGVycy5nZXQoXCJjb250ZW50LWxlbmd0aFwiKSB8fCBcIlwiKSA9PT0gMFxuICAgICkge1xuICAgICAgcmVxLnBhcnNlZEJvZHkgPSBcIlwiO1xuICAgICAgbmV4dCgpO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gZGV0ZXJtaW5lIGlmIHJlcXVlc3Qgc2hvdWxkIGJlIHBhcnNlZFxuICAgIGlmICghc2hvdWxkUGFyc2UocmVxKSkge1xuICAgICAgbmV4dCgpO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gcmVhZFxuICAgIHJlYWQocmVxLCByZXMsIG5leHQsIHBhcnNlLCB7XG4gICAgICBlbmNvZGluZzogbnVsbCxcbiAgICAgIGluZmxhdGU6IGluZmxhdGUsXG4gICAgICB2ZXJpZnk6IHZlcmlmeSxcbiAgICB9KTtcbiAgfTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQTZCRyxBQTdCSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0E2QkcsQUE3QkgsRUE2QkcsVUFFTSxJQUFJLFNBQVEsU0FBVztTQUV2QixPQUFPLFNBQVEsZ0JBQWtCO1NBQ2pDLFdBQVcsU0FBUSxnQkFBa0I7QUFFOUMsRUFNRyxBQU5IOzs7Ozs7Q0FNRyxBQU5ILEVBTUcsaUJBQ2EsR0FBRyxDQUFDLE9BQVk7O1VBQ3hCLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxLQUFLLEtBQUs7VUFDbkMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLEtBQUksd0JBQTBCO1VBQ2pELE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxJQUFJLEtBQUs7UUFFbEMsTUFBTSxLQUFLLEtBQUssV0FBVyxNQUFNLE1BQUssUUFBVTtrQkFDeEMsU0FBUyxFQUFDLDhCQUFnQzs7SUFHdEQsRUFBZ0QsQUFBaEQsOENBQWdEO1VBQzFDLFdBQVcsVUFBVSxJQUFJLE1BQUssUUFBVSxJQUFHLFdBQVcsQ0FBQyxJQUFJLElBQUksSUFBSTthQUVoRSxLQUFLLENBQUMsSUFBUztlQUNmLElBQUk7O29CQUdHLFNBQVMsQ0FBQyxHQUFZLEVBQUUsR0FBYSxFQUFFLElBQWtCO1lBQ25FLEdBQUcsQ0FBQyxXQUFXO1lBQ2pCLElBQUk7OztRQUtOLEVBQStCLEFBQS9CLDZCQUErQjthQUU1QixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sS0FDcEIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFDLGNBQWdCLGNBQWEsQ0FBQztZQUV2RCxHQUFHLENBQUMsVUFBVTtZQUNkLElBQUk7OztRQUtOLEVBQXdDLEFBQXhDLHNDQUF3QzthQUNuQyxXQUFXLENBQUMsR0FBRztZQUNsQixJQUFJOzs7UUFLTixFQUFPLEFBQVAsS0FBTztRQUNQLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLO1lBQ3hCLFFBQVEsRUFBRSxJQUFJO1lBQ2QsT0FBTyxFQUFFLE9BQU87WUFDaEIsTUFBTSxFQUFFLE1BQU0ifQ==