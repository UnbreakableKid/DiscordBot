/*!
 * Port of finalHandler (https://github.com/jshttp/etag) for Deno.
 *
 * Licensed as follows:
 *
 * (The MIT License)
 * 
 * Copyright (c) 2014-2017 Douglas Christopher Wilson <doug@somethingdoug.com>
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
 */ import { parseUrl } from "./parseUrl.ts";
import { escapeHtml, STATUS_TEXT } from "../../deps.ts";
const DOUBLE_SPACE_REGEXP = /\x20{2}/g;
const NEWLINE_REGEXP = /\n/g;
/**
 * Create a minimal HTML document.
 *
 * @param {string} message
 * @private
 */ function createHtmlDocument(message) {
    const body = escapeHtml(message).replace(NEWLINE_REGEXP, "<br>").replace(DOUBLE_SPACE_REGEXP, " &nbsp;");
    return "<!DOCTYPE html>\n" + '<html lang="en">\n' + "<head>\n" + '<meta charset="utf-8">\n' + "<title>Error</title>\n" + "</head>\n" + "<body>\n" + "<pre>" + body + "</pre>\n" + "</body>\n" + "</html>\n";
}
/**
 * Create a function to handle the final response.
 *
 * @param {Request} req
 * @param {Response} res
 * @return {Function}
 * @public
 */ export function finalHandler(req, res) {
    return function(err) {
        let headers;
        let msg;
        let status;
        // unhandled error
        if (err) {
            // respect status code from error
            status = getErrorStatusCode(err);
            if (status === undefined) {
                // fallback to status code on response
                status = getResponseStatusCode(res);
            } else {
                // respect headers from error
                headers = getErrorHeaders(err);
            }
            // get error message
            msg = getErrorMessage(err, status);
        } else {
            // not found
            status = 404;
            msg = "Cannot " + req.method + " " + getResourceName(req);
        }
        // send response
        send(req, res, status, headers, msg);
    };
}
/**
 * Get headers from Error object.
 *
 * @param {Error} err
 * @return {object}
 * @private
 */ function getErrorHeaders(err) {
    if (!err.headers || typeof err.headers !== "object") {
        return undefined;
    }
    const headers = Object.create(null);
    const keys = Object.keys(err.headers);
    for(let i = 0; i < keys.length; i++){
        const key = keys[i];
        headers[key] = err.headers[key];
    }
    return headers;
}
/**
 * Get message from Error object, fallback to status message.
 *
 * @param {Error} err
 * @param {number} status
 * @param {string} env
 * @return {string}
 * @private
 */ function getErrorMessage(err, status) {
    // use err.stack, which typically includes err.message
    let msg = err.stack;
    // fallback to err.toString() when possible
    if (!msg && typeof err.toString === "function") {
        msg = err.toString();
    }
    return msg || STATUS_TEXT.get(status);
}
/**
 * Get status code from Error object.
 *
 * @param {Error} err
 * @return {number}
 * @private
 */ function getErrorStatusCode(err) {
    // check err.status
    if (typeof err.status === "number" && err.status >= 400 && err.status < 600) {
        return err.status;
    }
    return undefined;
}
/**
 * Get resource name for the request.
 *
 * This is typically just the original pathname of the request
 * but will fallback to "resource" is that cannot be determined.
 *
 * @param {Request} req
 * @return {string}
 * @private
 */ function getResourceName(req) {
    try {
        return parseUrl(req).pathname;
    } catch (e) {
        return "resource";
    }
}
/**
 * Get status code from response.
 *
 * @param {Response} res
 * @return {number}
 * @private
 */ function getResponseStatusCode(res) {
    let status = res.status;
    // default status code to 500 if outside valid range
    if (typeof status !== "number" || status < 400 || status > 599) {
        status = 500;
    }
    return status;
}
/**
 * Send response.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {number} status
 * @param {object} headers
 * @param {string} message
 * @private
 */ function send(req, res, status, headers, message) {
    // response body
    const body = createHtmlDocument(message);
    // response status
    res.status = status;
    res.statusMessage = STATUS_TEXT.get(status);
    // response headers
    setHeaders(res, headers);
    // security headers
    res.set("Content-Security-Policy", "default-src 'none'");
    res.set("X-Content-Type-Options", "nosniff");
    // standard headers
    res.set("Content-Type", "text/html; charset=utf-8");
    if (req.method !== "HEAD") {
        res.body = body;
    }
    if (!res.written) {
        req.respond(res);
    }
}
/**
 * Set response headers from an object.
 *
 * @param {Response} res
 * @param {object} headers
 * @private
 */ function setHeaders(res, headers) {
    if (!headers) {
        return;
    }
    const keys = Object.keys(headers);
    for(let i = 0; i < keys.length; i++){
        const key = keys[i];
        res.set(key, headers[key]);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy91dGlscy9maW5hbEhhbmRsZXIudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8qIVxuICogUG9ydCBvZiBmaW5hbEhhbmRsZXIgKGh0dHBzOi8vZ2l0aHViLmNvbS9qc2h0dHAvZXRhZykgZm9yIERlbm8uXG4gKlxuICogTGljZW5zZWQgYXMgZm9sbG93czpcbiAqXG4gKiAoVGhlIE1JVCBMaWNlbnNlKVxuICogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtMjAxNyBEb3VnbGFzIENocmlzdG9waGVyIFdpbHNvbiA8ZG91Z0Bzb21ldGhpbmdkb3VnLmNvbT5cbiAqIFxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nXG4gKiBhIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbiAqICdTb2Z0d2FyZScpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbiAqIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbiAqIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0b1xuICogcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvXG4gKiB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKiBcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlXG4gKiBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqIFxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICdBUyBJUycsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsXG4gKiBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0ZcbiAqIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC5cbiAqIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZXG4gKiBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULFxuICogVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEVcbiAqIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuICogXG4gKi9cblxuaW1wb3J0IHsgcGFyc2VVcmwgfSBmcm9tIFwiLi9wYXJzZVVybC50c1wiO1xuaW1wb3J0IHsgZXNjYXBlSHRtbCwgU3RhdHVzLCBTVEFUVVNfVEVYVCB9IGZyb20gXCIuLi8uLi9kZXBzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IE5leHRGdW5jdGlvbiwgUGFyc2VkVVJMLCBSZXF1ZXN0LCBSZXNwb25zZSB9IGZyb20gXCIuLi90eXBlcy50c1wiO1xuXG5jb25zdCBET1VCTEVfU1BBQ0VfUkVHRVhQID0gL1xceDIwezJ9L2c7XG5jb25zdCBORVdMSU5FX1JFR0VYUCA9IC9cXG4vZztcblxuLyoqXG4gKiBDcmVhdGUgYSBtaW5pbWFsIEhUTUwgZG9jdW1lbnQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUh0bWxEb2N1bWVudChtZXNzYWdlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBib2R5ID0gZXNjYXBlSHRtbChtZXNzYWdlKVxuICAgIC5yZXBsYWNlKE5FV0xJTkVfUkVHRVhQLCBcIjxicj5cIilcbiAgICAucmVwbGFjZShET1VCTEVfU1BBQ0VfUkVHRVhQLCBcIiAmbmJzcDtcIik7XG5cbiAgcmV0dXJuIChcbiAgICBcIjwhRE9DVFlQRSBodG1sPlxcblwiICtcbiAgICAnPGh0bWwgbGFuZz1cImVuXCI+XFxuJyArXG4gICAgXCI8aGVhZD5cXG5cIiArXG4gICAgJzxtZXRhIGNoYXJzZXQ9XCJ1dGYtOFwiPlxcbicgK1xuICAgIFwiPHRpdGxlPkVycm9yPC90aXRsZT5cXG5cIiArXG4gICAgXCI8L2hlYWQ+XFxuXCIgK1xuICAgIFwiPGJvZHk+XFxuXCIgK1xuICAgIFwiPHByZT5cIiArXG4gICAgYm9keSArXG4gICAgXCI8L3ByZT5cXG5cIiArXG4gICAgXCI8L2JvZHk+XFxuXCIgK1xuICAgIFwiPC9odG1sPlxcblwiXG4gICk7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgZnVuY3Rpb24gdG8gaGFuZGxlIHRoZSBmaW5hbCByZXNwb25zZS5cbiAqXG4gKiBAcGFyYW0ge1JlcXVlc3R9IHJlcVxuICogQHBhcmFtIHtSZXNwb25zZX0gcmVzXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqIEBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmFsSGFuZGxlcihyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpOiBOZXh0RnVuY3Rpb24ge1xuICByZXR1cm4gZnVuY3Rpb24gKGVycj86IGFueSkge1xuICAgIGxldCBoZWFkZXJzO1xuICAgIGxldCBtc2c7XG4gICAgbGV0IHN0YXR1cztcblxuICAgIC8vIHVuaGFuZGxlZCBlcnJvclxuICAgIGlmIChlcnIpIHtcbiAgICAgIC8vIHJlc3BlY3Qgc3RhdHVzIGNvZGUgZnJvbSBlcnJvclxuICAgICAgc3RhdHVzID0gZ2V0RXJyb3JTdGF0dXNDb2RlKGVycik7XG5cbiAgICAgIGlmIChzdGF0dXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBmYWxsYmFjayB0byBzdGF0dXMgY29kZSBvbiByZXNwb25zZVxuICAgICAgICBzdGF0dXMgPSBnZXRSZXNwb25zZVN0YXR1c0NvZGUocmVzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHJlc3BlY3QgaGVhZGVycyBmcm9tIGVycm9yXG4gICAgICAgIGhlYWRlcnMgPSBnZXRFcnJvckhlYWRlcnMoZXJyKTtcbiAgICAgIH1cblxuICAgICAgLy8gZ2V0IGVycm9yIG1lc3NhZ2VcbiAgICAgIG1zZyA9IGdldEVycm9yTWVzc2FnZShlcnIsIHN0YXR1cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIG5vdCBmb3VuZFxuICAgICAgc3RhdHVzID0gNDA0O1xuICAgICAgbXNnID0gXCJDYW5ub3QgXCIgKyByZXEubWV0aG9kICsgXCIgXCIgKyBnZXRSZXNvdXJjZU5hbWUocmVxKTtcbiAgICB9XG5cbiAgICAvLyBzZW5kIHJlc3BvbnNlXG4gICAgc2VuZChyZXEsIHJlcywgc3RhdHVzLCBoZWFkZXJzLCBtc2cpO1xuICB9O1xufVxuXG4vKipcbiAqIEdldCBoZWFkZXJzIGZyb20gRXJyb3Igb2JqZWN0LlxuICpcbiAqIEBwYXJhbSB7RXJyb3J9IGVyclxuICogQHJldHVybiB7b2JqZWN0fVxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gZ2V0RXJyb3JIZWFkZXJzKGVycj86IGFueSk6IGFueSB7XG4gIGlmICghZXJyLmhlYWRlcnMgfHwgdHlwZW9mIGVyci5oZWFkZXJzICE9PSBcIm9iamVjdFwiKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGNvbnN0IGhlYWRlcnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoZXJyLmhlYWRlcnMpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGtleSA9IGtleXNbaV07XG4gICAgaGVhZGVyc1trZXldID0gZXJyLmhlYWRlcnNba2V5XTtcbiAgfVxuXG4gIHJldHVybiBoZWFkZXJzO1xufVxuXG4vKipcbiAqIEdldCBtZXNzYWdlIGZyb20gRXJyb3Igb2JqZWN0LCBmYWxsYmFjayB0byBzdGF0dXMgbWVzc2FnZS5cbiAqXG4gKiBAcGFyYW0ge0Vycm9yfSBlcnJcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGF0dXNcbiAqIEBwYXJhbSB7c3RyaW5nfSBlbnZcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGdldEVycm9yTWVzc2FnZShlcnI6IGFueSwgc3RhdHVzOiBTdGF0dXMpOiBzdHJpbmcge1xuICAvLyB1c2UgZXJyLnN0YWNrLCB3aGljaCB0eXBpY2FsbHkgaW5jbHVkZXMgZXJyLm1lc3NhZ2VcbiAgbGV0IG1zZyA9IGVyci5zdGFjaztcblxuICAvLyBmYWxsYmFjayB0byBlcnIudG9TdHJpbmcoKSB3aGVuIHBvc3NpYmxlXG4gIGlmICghbXNnICYmIHR5cGVvZiBlcnIudG9TdHJpbmcgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIG1zZyA9IGVyci50b1N0cmluZygpO1xuICB9XG5cbiAgcmV0dXJuIG1zZyB8fCBTVEFUVVNfVEVYVC5nZXQoc3RhdHVzKTtcbn1cblxuLyoqXG4gKiBHZXQgc3RhdHVzIGNvZGUgZnJvbSBFcnJvciBvYmplY3QuXG4gKlxuICogQHBhcmFtIHtFcnJvcn0gZXJyXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBnZXRFcnJvclN0YXR1c0NvZGUoZXJyOiBhbnkpOiBudW1iZXIgfCB1bmRlZmluZWQge1xuICAvLyBjaGVjayBlcnIuc3RhdHVzXG4gIGlmICh0eXBlb2YgZXJyLnN0YXR1cyA9PT0gXCJudW1iZXJcIiAmJiBlcnIuc3RhdHVzID49IDQwMCAmJiBlcnIuc3RhdHVzIDwgNjAwKSB7XG4gICAgcmV0dXJuIGVyci5zdGF0dXM7XG4gIH1cblxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIEdldCByZXNvdXJjZSBuYW1lIGZvciB0aGUgcmVxdWVzdC5cbiAqXG4gKiBUaGlzIGlzIHR5cGljYWxseSBqdXN0IHRoZSBvcmlnaW5hbCBwYXRobmFtZSBvZiB0aGUgcmVxdWVzdFxuICogYnV0IHdpbGwgZmFsbGJhY2sgdG8gXCJyZXNvdXJjZVwiIGlzIHRoYXQgY2Fubm90IGJlIGRldGVybWluZWQuXG4gKlxuICogQHBhcmFtIHtSZXF1ZXN0fSByZXFcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGdldFJlc291cmNlTmFtZShyZXE6IFJlcXVlc3QpOiBzdHJpbmcge1xuICB0cnkge1xuICAgIHJldHVybiAocGFyc2VVcmwocmVxKSBhcyBQYXJzZWRVUkwpLnBhdGhuYW1lO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIFwicmVzb3VyY2VcIjtcbiAgfVxufVxuXG4vKipcbiAqIEdldCBzdGF0dXMgY29kZSBmcm9tIHJlc3BvbnNlLlxuICpcbiAqIEBwYXJhbSB7UmVzcG9uc2V9IHJlc1xuICogQHJldHVybiB7bnVtYmVyfVxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gZ2V0UmVzcG9uc2VTdGF0dXNDb2RlKHJlczogUmVzcG9uc2UpOiBudW1iZXIge1xuICBsZXQgc3RhdHVzID0gcmVzLnN0YXR1cztcblxuICAvLyBkZWZhdWx0IHN0YXR1cyBjb2RlIHRvIDUwMCBpZiBvdXRzaWRlIHZhbGlkIHJhbmdlXG4gIGlmICh0eXBlb2Ygc3RhdHVzICE9PSBcIm51bWJlclwiIHx8IHN0YXR1cyA8IDQwMCB8fCBzdGF0dXMgPiA1OTkpIHtcbiAgICBzdGF0dXMgPSA1MDA7XG4gIH1cblxuICByZXR1cm4gc3RhdHVzO1xufVxuXG4vKipcbiAqIFNlbmQgcmVzcG9uc2UuXG4gKlxuICogQHBhcmFtIHtSZXF1ZXN0fSByZXFcbiAqIEBwYXJhbSB7UmVzcG9uc2V9IHJlc1xuICogQHBhcmFtIHtudW1iZXJ9IHN0YXR1c1xuICogQHBhcmFtIHtvYmplY3R9IGhlYWRlcnNcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBzZW5kKFxuICByZXE6IFJlcXVlc3QsXG4gIHJlczogUmVzcG9uc2UsXG4gIHN0YXR1czogU3RhdHVzLFxuICBoZWFkZXJzOiBhbnksXG4gIG1lc3NhZ2U6IGFueSxcbik6IHZvaWQge1xuICAvLyByZXNwb25zZSBib2R5XG4gIGNvbnN0IGJvZHkgPSBjcmVhdGVIdG1sRG9jdW1lbnQobWVzc2FnZSk7XG5cbiAgLy8gcmVzcG9uc2Ugc3RhdHVzXG4gIHJlcy5zdGF0dXMgPSBzdGF0dXM7XG4gIHJlcy5zdGF0dXNNZXNzYWdlID0gU1RBVFVTX1RFWFQuZ2V0KHN0YXR1cyk7XG5cbiAgLy8gcmVzcG9uc2UgaGVhZGVyc1xuICBzZXRIZWFkZXJzKHJlcywgaGVhZGVycyk7XG5cbiAgLy8gc2VjdXJpdHkgaGVhZGVyc1xuICByZXMuc2V0KFwiQ29udGVudC1TZWN1cml0eS1Qb2xpY3lcIiwgXCJkZWZhdWx0LXNyYyAnbm9uZSdcIik7XG4gIHJlcy5zZXQoXCJYLUNvbnRlbnQtVHlwZS1PcHRpb25zXCIsIFwibm9zbmlmZlwiKTtcblxuICAvLyBzdGFuZGFyZCBoZWFkZXJzXG4gIHJlcy5zZXQoXCJDb250ZW50LVR5cGVcIiwgXCJ0ZXh0L2h0bWw7IGNoYXJzZXQ9dXRmLThcIik7XG5cbiAgaWYgKHJlcS5tZXRob2QgIT09IFwiSEVBRFwiKSB7XG4gICAgcmVzLmJvZHkgPSBib2R5O1xuICB9XG5cbiAgaWYgKCFyZXMud3JpdHRlbikge1xuICAgIHJlcS5yZXNwb25kKHJlcyk7XG4gIH1cbn1cblxuLyoqXG4gKiBTZXQgcmVzcG9uc2UgaGVhZGVycyBmcm9tIGFuIG9iamVjdC5cbiAqXG4gKiBAcGFyYW0ge1Jlc3BvbnNlfSByZXNcbiAqIEBwYXJhbSB7b2JqZWN0fSBoZWFkZXJzXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBzZXRIZWFkZXJzKHJlczogUmVzcG9uc2UsIGhlYWRlcnM6IGFueSk6IHZvaWQge1xuICBpZiAoIWhlYWRlcnMpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoaGVhZGVycyk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGtleSA9IGtleXNbaV07XG4gICAgcmVzLnNldChrZXksIGhlYWRlcnNba2V5XSk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQTRCRyxBQTVCSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQTRCRyxBQTVCSCxFQTRCRyxVQUVNLFFBQVEsU0FBUSxhQUFlO1NBQy9CLFVBQVUsRUFBVSxXQUFXLFNBQVEsYUFBZTtNQUd6RCxtQkFBbUI7TUFDbkIsY0FBYztBQUVwQixFQUtHLEFBTEg7Ozs7O0NBS0csQUFMSCxFQUtHLFVBQ00sa0JBQWtCLENBQUMsT0FBZTtVQUNuQyxJQUFJLEdBQUcsVUFBVSxDQUFDLE9BQU8sRUFDNUIsT0FBTyxDQUFDLGNBQWMsR0FBRSxJQUFNLEdBQzlCLE9BQU8sQ0FBQyxtQkFBbUIsR0FBRSxPQUFTO1lBR3ZDLGlCQUFtQixLQUNuQixrQkFBb0IsS0FDcEIsUUFBVSxLQUNWLHdCQUEwQixLQUMxQixzQkFBd0IsS0FDeEIsU0FBVyxLQUNYLFFBQVUsS0FDVixLQUFPLElBQ1AsSUFBSSxJQUNKLFFBQVUsS0FDVixTQUFXLEtBQ1gsU0FBVzs7QUFJZixFQU9HLEFBUEg7Ozs7Ozs7Q0FPRyxBQVBILEVBT0csaUJBQ2EsWUFBWSxDQUFDLEdBQVksRUFBRSxHQUFhO29CQUNyQyxHQUFTO1lBQ3BCLE9BQU87WUFDUCxHQUFHO1lBQ0gsTUFBTTtRQUVWLEVBQWtCLEFBQWxCLGdCQUFrQjtZQUNkLEdBQUc7WUFDTCxFQUFpQyxBQUFqQywrQkFBaUM7WUFDakMsTUFBTSxHQUFHLGtCQUFr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