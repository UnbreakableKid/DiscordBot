/*!
 * Port of serve-static (https://github.com/expressjs/serve-static) for Deno.
 *
 * Licensed as follows:
 *
 * (The MIT License)
 * 
 * Copyright (c) 2010 Sencha Inc.
 * Copyright (c) 2011 LearnBoost
 * Copyright (c) 2011 TJ Holowaychuk
 * Copyright (c) 2014-2016 Douglas Christopher Wilson
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
 */ import { createError, encodeUrl, escapeHtml, fromFileUrl } from "../../deps.ts";
import { originalUrl as original, parseUrl } from "../utils/parseUrl.ts";
import { hasTrailingSlash, send, sendError } from "../utils/send.ts";
/**
 * Serve static files.
 * 
 * @param {string} root
 * @param {object} [options]
 * @return {Handler}
 * @public
 */ export function serveStatic(root, options = {
}) {
    // fall-though
    const fallthrough = options.fallthrough !== false;
    // default redirect
    const redirect = options.redirect !== false;
    // before hook
    const before = options.before;
    if (before && typeof before !== "function") {
        throw new TypeError("option before must be function");
    }
    // setup options for send
    options.maxage = (options.maxage ?? options.maxAge) ?? 0;
    options.root = root.startsWith("file:") ? fromFileUrl(root) : root;
    // construct directory listener
    const onDirectory = redirect ? createRedirectDirectoryListener : createNotFoundDirectoryListener;
    return async function serveStatic(req, res, next) {
        if (req.method !== "GET" && req.method !== "HEAD") {
            if (fallthrough) {
                return next();
            }
            // method not allowed
            res.status = 405;
            res.set("Allow", "GET, HEAD");
            res.end();
            return;
        }
        const forwardError = !fallthrough;
        const originalUrl = original(req);
        let path = parseUrl(req).pathname;
        // make sure redirect occurs at mount
        if (path === "/" && originalUrl.pathname.substr(-1) !== "/") {
            path = "";
        }
        options.onDirectory = onDirectory(req, res, path);
        try {
            return await send(req, res, path, options);
        } catch (err) {
            if (forwardError) {
                return next(err);
            }
            next();
        }
    };
}
/**
 * Collapse all leading slashes into a single slash
 * @private
 */ function collapseLeadingSlashes(str) {
    let i = 0;
    for(; i < str.length; i++){
        if (str.charCodeAt(i) !== 47) {
            break;
        }
    }
    return i > 1 ? "/" + str.substr(i) : str;
}
/**
 * Create a minimal HTML document.
 *
 * @param {string} title
 * @param {string} body
 * @private
 */ function createHtmlDocument(title, body) {
    return "<!DOCTYPE html>\n" + '<html lang="en">\n' + "<head>\n" + '<meta charset="utf-8">\n' + "<title>" + title + "</title>\n" + "</head>\n" + "<body>\n" + "<pre>" + body + "</pre>\n" + "</body>\n" + "</html>\n";
}
/**
 * Create a directory listener that just 404s.
 * @private
 */ function createNotFoundDirectoryListener(_req, res, _path) {
    return function notFound() {
        return sendError(res, createError(404));
    };
}
/**
 * Create a directory listener that performs a redirect.
 * @private
 */ function createRedirectDirectoryListener(req, res, path) {
    return function redirect() {
        if (hasTrailingSlash(path)) {
            return sendError(res, createError(404));
        }
        // get original URL
        const originalUrl = original(req);
        // append trailing slash
        originalUrl.path = null;
        originalUrl.pathname = collapseLeadingSlashes(originalUrl.pathname + "/");
        // reformat the URL
        const loc = encodeUrl(originalUrl.pathname);
        const doc = createHtmlDocument("Redirecting", 'Redirecting to <a href="' + escapeHtml(loc) + '">' + escapeHtml(loc) + "</a>");
        // send redirect response
        res.status = 301;
        res.set("Content-Type", "text/html; charset=UTF-8");
        res.set("Content-Security-Policy", "default-src 'none'");
        res.set("X-Content-Type-Options", "nosniff");
        res.set("Location", loc);
        res.send(doc);
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy9taWRkbGV3YXJlL3NlcnZlU3RhdGljLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIFBvcnQgb2Ygc2VydmUtc3RhdGljIChodHRwczovL2dpdGh1Yi5jb20vZXhwcmVzc2pzL3NlcnZlLXN0YXRpYykgZm9yIERlbm8uXG4gKlxuICogTGljZW5zZWQgYXMgZm9sbG93czpcbiAqXG4gKiAoVGhlIE1JVCBMaWNlbnNlKVxuICogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAgU2VuY2hhIEluYy5cbiAqIENvcHlyaWdodCAoYykgMjAxMSBMZWFybkJvb3N0XG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEgVEogSG9sb3dheWNodWtcbiAqIENvcHlyaWdodCAoYykgMjAxNC0yMDE2IERvdWdsYXMgQ2hyaXN0b3BoZXIgV2lsc29uXG4gKiBcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZ1xuICogYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4gKiAnU29mdHdhcmUnKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4gKiB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4gKiBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG9cbiAqIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0b1xuICogdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICogXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZVxuICogaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKiBcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELFxuICogRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4gKiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuXG4gKiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWVxuICogQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCxcbiAqIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFXG4gKiBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqXG4gKi9cblxuaW1wb3J0IHsgY3JlYXRlRXJyb3IsIGVuY29kZVVybCwgZXNjYXBlSHRtbCwgZnJvbUZpbGVVcmwgfSBmcm9tIFwiLi4vLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgb3JpZ2luYWxVcmwgYXMgb3JpZ2luYWwsIHBhcnNlVXJsIH0gZnJvbSBcIi4uL3V0aWxzL3BhcnNlVXJsLnRzXCI7XG5pbXBvcnQgeyBoYXNUcmFpbGluZ1NsYXNoLCBzZW5kLCBzZW5kRXJyb3IgfSBmcm9tIFwiLi4vdXRpbHMvc2VuZC50c1wiO1xuaW1wb3J0IHR5cGUge1xuICBIYW5kbGVyLFxuICBOZXh0RnVuY3Rpb24sXG4gIFBhcnNlZFVSTCxcbiAgUmVxdWVzdCxcbiAgUmVzcG9uc2UsXG59IGZyb20gXCIuLi90eXBlcy50c1wiO1xuXG4vKipcbiAqIFNlcnZlIHN0YXRpYyBmaWxlcy5cbiAqIFxuICogQHBhcmFtIHtzdHJpbmd9IHJvb3RcbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc11cbiAqIEByZXR1cm4ge0hhbmRsZXJ9XG4gKiBAcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXJ2ZVN0YXRpYyhyb290OiBzdHJpbmcsIG9wdGlvbnM6IGFueSA9IHt9KTogSGFuZGxlciB7XG4gIC8vIGZhbGwtdGhvdWdoXG4gIGNvbnN0IGZhbGx0aHJvdWdoID0gb3B0aW9ucy5mYWxsdGhyb3VnaCAhPT0gZmFsc2U7XG5cbiAgLy8gZGVmYXVsdCByZWRpcmVjdFxuICBjb25zdCByZWRpcmVjdCA9IG9wdGlvbnMucmVkaXJlY3QgIT09IGZhbHNlO1xuXG4gIC8vIGJlZm9yZSBob29rXG4gIGNvbnN0IGJlZm9yZSA9IG9wdGlvbnMuYmVmb3JlO1xuXG4gIGlmIChiZWZvcmUgJiYgdHlwZW9mIGJlZm9yZSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIm9wdGlvbiBiZWZvcmUgbXVzdCBiZSBmdW5jdGlvblwiKTtcbiAgfVxuXG4gIC8vIHNldHVwIG9wdGlvbnMgZm9yIHNlbmRcbiAgb3B0aW9ucy5tYXhhZ2UgPSBvcHRpb25zLm1heGFnZSA/PyBvcHRpb25zLm1heEFnZSA/PyAwO1xuICBvcHRpb25zLnJvb3QgPSByb290LnN0YXJ0c1dpdGgoXCJmaWxlOlwiKSA/IGZyb21GaWxlVXJsKHJvb3QpIDogcm9vdDtcblxuICAvLyBjb25zdHJ1Y3QgZGlyZWN0b3J5IGxpc3RlbmVyXG4gIGNvbnN0IG9uRGlyZWN0b3J5ID0gcmVkaXJlY3RcbiAgICA/IGNyZWF0ZVJlZGlyZWN0RGlyZWN0b3J5TGlzdGVuZXJcbiAgICA6IGNyZWF0ZU5vdEZvdW5kRGlyZWN0b3J5TGlzdGVuZXI7XG5cbiAgcmV0dXJuIGFzeW5jIGZ1bmN0aW9uIHNlcnZlU3RhdGljKFxuICAgIHJlcTogUmVxdWVzdCxcbiAgICByZXM6IFJlc3BvbnNlLFxuICAgIG5leHQ6IE5leHRGdW5jdGlvbixcbiAgKSB7XG4gICAgaWYgKHJlcS5tZXRob2QgIT09IFwiR0VUXCIgJiYgcmVxLm1ldGhvZCAhPT0gXCJIRUFEXCIpIHtcbiAgICAgIGlmIChmYWxsdGhyb3VnaCkge1xuICAgICAgICByZXR1cm4gbmV4dCgpO1xuICAgICAgfVxuXG4gICAgICAvLyBtZXRob2Qgbm90IGFsbG93ZWRcbiAgICAgIHJlcy5zdGF0dXMgPSA0MDU7XG4gICAgICByZXMuc2V0KFwiQWxsb3dcIiwgXCJHRVQsIEhFQURcIik7XG4gICAgICByZXMuZW5kKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZm9yd2FyZEVycm9yID0gIWZhbGx0aHJvdWdoO1xuICAgIGNvbnN0IG9yaWdpbmFsVXJsID0gb3JpZ2luYWwocmVxKSBhcyBQYXJzZWRVUkw7XG4gICAgbGV0IHBhdGggPSAocGFyc2VVcmwocmVxKSBhcyBQYXJzZWRVUkwpLnBhdGhuYW1lO1xuXG4gICAgLy8gbWFrZSBzdXJlIHJlZGlyZWN0IG9jY3VycyBhdCBtb3VudFxuICAgIGlmIChwYXRoID09PSBcIi9cIiAmJiBvcmlnaW5hbFVybC5wYXRobmFtZS5zdWJzdHIoLTEpICE9PSBcIi9cIikge1xuICAgICAgcGF0aCA9IFwiXCI7XG4gICAgfVxuXG4gICAgb3B0aW9ucy5vbkRpcmVjdG9yeSA9IG9uRGlyZWN0b3J5KHJlcSwgcmVzLCBwYXRoKTtcblxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgc2VuZChyZXEsIHJlcywgcGF0aCwgb3B0aW9ucyk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBpZiAoZm9yd2FyZEVycm9yKSB7XG4gICAgICAgIHJldHVybiBuZXh0KGVycik7XG4gICAgICB9XG5cbiAgICAgIG5leHQoKTtcbiAgICB9XG4gIH07XG59XG5cbi8qKlxuICogQ29sbGFwc2UgYWxsIGxlYWRpbmcgc2xhc2hlcyBpbnRvIGEgc2luZ2xlIHNsYXNoXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBjb2xsYXBzZUxlYWRpbmdTbGFzaGVzKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IGkgPSAwO1xuICBmb3IgKDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIGlmIChzdHIuY2hhckNvZGVBdChpKSAhPT0gMHgyZiAvKiAvICovKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gaSA+IDEgPyBcIi9cIiArIHN0ci5zdWJzdHIoaSkgOiBzdHI7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgbWluaW1hbCBIVE1MIGRvY3VtZW50LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0aXRsZVxuICogQHBhcmFtIHtzdHJpbmd9IGJvZHlcbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUh0bWxEb2N1bWVudCh0aXRsZTogc3RyaW5nLCBib2R5OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gXCI8IURPQ1RZUEUgaHRtbD5cXG5cIiArXG4gICAgJzxodG1sIGxhbmc9XCJlblwiPlxcbicgK1xuICAgIFwiPGhlYWQ+XFxuXCIgK1xuICAgICc8bWV0YSBjaGFyc2V0PVwidXRmLThcIj5cXG4nICtcbiAgICBcIjx0aXRsZT5cIiArIHRpdGxlICsgXCI8L3RpdGxlPlxcblwiICtcbiAgICBcIjwvaGVhZD5cXG5cIiArXG4gICAgXCI8Ym9keT5cXG5cIiArXG4gICAgXCI8cHJlPlwiICsgYm9keSArIFwiPC9wcmU+XFxuXCIgK1xuICAgIFwiPC9ib2R5PlxcblwiICtcbiAgICBcIjwvaHRtbD5cXG5cIjtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBkaXJlY3RvcnkgbGlzdGVuZXIgdGhhdCBqdXN0IDQwNHMuXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBjcmVhdGVOb3RGb3VuZERpcmVjdG9yeUxpc3RlbmVyKFxuICBfcmVxOiBSZXF1ZXN0LFxuICByZXM6IFJlc3BvbnNlLFxuICBfcGF0aDogc3RyaW5nLFxuKTogRnVuY3Rpb24ge1xuICByZXR1cm4gZnVuY3Rpb24gbm90Rm91bmQoKTogdm9pZCB7XG4gICAgcmV0dXJuIHNlbmRFcnJvcihyZXMsIGNyZWF0ZUVycm9yKDQwNCkpO1xuICB9O1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIGRpcmVjdG9yeSBsaXN0ZW5lciB0aGF0IHBlcmZvcm1zIGEgcmVkaXJlY3QuXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBjcmVhdGVSZWRpcmVjdERpcmVjdG9yeUxpc3RlbmVyKFxuICByZXE6IFJlcXVlc3QsXG4gIHJlczogUmVzcG9uc2UsXG4gIHBhdGg6IHN0cmluZyxcbik6IEZ1bmN0aW9uIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHJlZGlyZWN0KCk6IHZvaWQge1xuICAgIGlmIChoYXNUcmFpbGluZ1NsYXNoKHBhdGgpKSB7XG4gICAgICByZXR1cm4gc2VuZEVycm9yKHJlcywgY3JlYXRlRXJyb3IoNDA0KSk7XG4gICAgfVxuXG4gICAgLy8gZ2V0IG9yaWdpbmFsIFVSTFxuICAgIGNvbnN0IG9yaWdpbmFsVXJsID0gb3JpZ2luYWwocmVxKSBhcyBQYXJzZWRVUkw7XG5cbiAgICAvLyBhcHBlbmQgdHJhaWxpbmcgc2xhc2hcbiAgICBvcmlnaW5hbFVybC5wYXRoID0gbnVsbDtcbiAgICBvcmlnaW5hbFVybC5wYXRobmFtZSA9IGNvbGxhcHNlTGVhZGluZ1NsYXNoZXMob3JpZ2luYWxVcmwucGF0aG5hbWUgKyBcIi9cIik7XG5cbiAgICAvLyByZWZvcm1hdCB0aGUgVVJMXG4gICAgY29uc3QgbG9jID0gZW5jb2RlVXJsKG9yaWdpbmFsVXJsLnBhdGhuYW1lKTtcbiAgICBjb25zdCBkb2MgPSBjcmVhdGVIdG1sRG9jdW1lbnQoXG4gICAgICBcIlJlZGlyZWN0aW5nXCIsXG4gICAgICAnUmVkaXJlY3RpbmcgdG8gPGEgaHJlZj1cIicgKyBlc2NhcGVIdG1sKGxvYykgKyAnXCI+JyArXG4gICAgICAgIGVzY2FwZUh0bWwobG9jKSArIFwiPC9hPlwiLFxuICAgICk7XG5cbiAgICAvLyBzZW5kIHJlZGlyZWN0IHJlc3BvbnNlXG4gICAgcmVzLnN0YXR1cyA9IDMwMTtcbiAgICByZXMuc2V0KFwiQ29udGVudC1UeXBlXCIsIFwidGV4dC9odG1sOyBjaGFyc2V0PVVURi04XCIpO1xuICAgIHJlcy5zZXQoXCJDb250ZW50LVNlY3VyaXR5LVBvbGljeVwiLCBcImRlZmF1bHQtc3JjICdub25lJ1wiKTtcbiAgICByZXMuc2V0KFwiWC1Db250ZW50LVR5cGUtT3B0aW9uc1wiLCBcIm5vc25pZmZcIik7XG4gICAgcmVzLnNldChcIkxvY2F0aW9uXCIsIGxvYyk7XG4gICAgcmVzLnNlbmQoZG9jKTtcbiAgfTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQStCRyxBQS9CSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQStCRyxBQS9CSCxFQStCRyxVQUVNLFdBQVcsRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLFdBQVcsU0FBUSxhQUFlO1NBQ3RFLFdBQVcsSUFBSSxRQUFRLEVBQUUsUUFBUSxTQUFRLG9CQUFzQjtTQUMvRCxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsU0FBUyxTQUFRLGdCQUFrQjtBQVNwRSxFQU9HLEFBUEg7Ozs7Ozs7Q0FPRyxBQVBILEVBT0csaUJBQ2EsV0FBVyxDQUFDLElBQVksRUFBRSxPQUFZOztJQUNwRCxFQUFjLEFBQWQsWUFBYztVQUNSLFdBQVcsR0FBRyxPQUFPLENBQUMsV0FBVyxLQUFLLEtBQUs7SUFFakQsRUFBbUIsQUFBbkIsaUJBQW1CO1VBQ2IsUUFBUSxHQUFHLE9BQU8sQ0FBQyxRQUFRLEtBQUssS0FBSztJQUUzQyxFQUFjLEFBQWQsWUFBYztVQUNSLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTTtRQUV6QixNQUFNLFdBQVcsTUFBTSxNQUFLLFFBQVU7a0JBQzlCLFNBQVMsRUFBQyw4QkFBZ0M7O0lBR3RE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