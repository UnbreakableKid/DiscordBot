import { contentDisposition } from "./utils/contentDisposition.ts";
import { stringify } from "./utils/stringify.ts";
import { normalizeType, normalizeTypes } from "./utils/normalizeType.ts";
import { hasCookieNameProperty, hasCookieRequiredProperties } from "./utils/cookies.ts";
import { send, sendError } from "./utils/send.ts";
import { contentType, encodeUrl, escapeHtml, extname, fromFileUrl, isAbsolute, resolve, setCookie, STATUS_TEXT, vary } from "../deps.ts";
class Response1 {
    status = 200;
    headers = new Headers();
    written = false;
    body;
    app;
    req;
    locals;
    #resources = [];
    /**
   * Add a resource ID to the list of resources to be
   * closed after the .end() method has been called.
   * 
   * @param {number} rid Resource ID
   * @public
   */ addResource(rid) {
        this.#resources.push(rid);
    }
    /**
   * Append additional header `field` with value `val`.
   * Value can be either a `string` or an array of `string`.
   * 
   * Example:
   *
   *    res.append('Set-Cookie', 'foo=bar; Path=/; HttpOnly');
   *    res.append('Warning', '199 Miscellaneous warning');
   *    res.append("cache-control", ["public", "max-age=604800", "immutable"]);
   * 
   * @param {string} field
   * @param {string|string[]} value
   * @return {Response} for chaining
   * @public
   */ append(field, value) {
        if (Array.isArray(value)) {
            for(let i = 0, len = value.length; i < len; i++){
                this.headers.append(field, value[i]);
            }
        } else {
            this.headers.append(field, value);
        }
        return this;
    }
    /**
   * Set _Content-Disposition_ header to _attachment_ with optional `filename`.
   *
   * @param {string} filename
   * @return {Response} for chaining
   * @public
   */ attachment(filename) {
        if (filename) {
            this.type(extname(filename));
        }
        this.set("Content-Disposition", contentDisposition("attachment", filename));
        return this;
    }
    cookie(nameOrCookie) {
        let cookie;
        if (typeof nameOrCookie === "string") {
            cookie = {
                ...arguments[2],
                name: nameOrCookie,
                value: arguments[1] ?? ""
            };
        } else if (hasCookieRequiredProperties(nameOrCookie)) {
            cookie = nameOrCookie;
        } else {
            throw new TypeError("response.cookie, args provided do not match one of the supported signatures: " + Array.prototype.join.call(arguments, ", "));
        }
        if (cookie.path == null) {
            cookie.path = "/";
        }
        setCookie(this, cookie);
        return this;
    }
    clearCookie(nameOrCookie) {
        if (typeof nameOrCookie === "string") {
            setCookie(this, {
                path: "/",
                ...arguments[1],
                value: "",
                expires: new Date(0),
                name: nameOrCookie
            });
        } else if (hasCookieNameProperty(nameOrCookie)) {
            setCookie(this, {
                path: "/",
                ...nameOrCookie,
                value: "",
                expires: new Date(0)
            });
        } else {
            throw new TypeError("res.clearCookie, args provided do not match one of the supported signatures: " + Array.prototype.join.call(arguments, ", "));
        }
        return this;
    }
    /**
   * Transfer the file at the given `path` as an attachment.
   *
   * Optionally providing an alternate attachment `filename`.
   * 
   * Optionally providing an `options` object to use with `res.sendFile()`.
   *
   * This function will set the `Content-Disposition` header, overriding
   * any existing `Content-Disposition` header in order to set the attachment
   * and filename.
   *
   * This method uses `res.sendFile()`.
   *
   * @param {string} path
   * @param {string} [filename]
   * @param {object} [options]
   * @return {Promise<Response>}
   * @public
   */ async download(path, filename, options) {
        const headers = {
            "Content-Disposition": contentDisposition("attachment", filename || path)
        };
        // Merge user-provided headers
        if (options?.headers) {
            const keys = Object.keys(options.headers);
            for(let i = 0; i < keys.length; i++){
                const key = keys[i];
                if (key.toLowerCase() !== "content-disposition") {
                    headers[key] = options.headers[key];
                }
            }
        }
        // Merge user-provided options
        options = {
            ...options,
            headers
        };
        const fullPath = resolve(path.startsWith("file:") ? fromFileUrl(path) : path);
        // Send file
        return await this.sendFile(fullPath, options);
    }
    /**
   * Ends the response process.
   *
   * @param {DenoResponseBody} body
   * @return {Promise<void>}
   * @public
   */ async end(body) {
        if (body) {
            this.body = body;
        }
        this.written = true;
        try {
            await this.req.respond(this);
        } catch (e) {
            // Connection might have been already closed
            if (!(e instanceof Deno.errors.BadResource)) {
                throw e;
            }
        }
        for (const rid of this.#resources){
            try {
                Deno.close(rid);
            } catch (e) {
                // Resource might have been already closed
                if (!(e instanceof Deno.errors.BadResource)) {
                    throw e;
                }
            }
        }
        this.#resources = [];
    }
    /**
   * Sets an ETag header.
   * 
   * @param {string|Uint8Array|Deno.FileInfo} chunk 
   * @returns {Response} for chaining
   * @public
   */ etag(chunk) {
        const etagFn = this.app.get("etag fn");
        if (typeof etagFn === "function" && typeof chunk.length) {
            const etag = etagFn(chunk);
            if (etag) {
                this.set("ETag", etag);
            }
        }
        return this;
    }
    /**
   * Respond to the Acceptable formats using an `obj`
   * of mime-type callbacks.
   *
   * This method uses `req.accepted`, an array of
   * acceptable types ordered by their quality values.
   * When "Accept" is not present the _first_ callback
   * is invoked, otherwise the first match is used. When
   * no match is performed the server responds with
   * 406 "Not Acceptable".
   *
   * Content-Type is set for you, however if you choose
   * you may alter this within the callback using `res.type()`
   * or `res.set('Content-Type', ...)`.
   *
   *    res.format({
   *      'text/plain': function(){
   *        res.send('hey');
   *      },
   *
   *      'text/html': function(){
   *        res.send('<p>hey</p>');
   *      },
   *
   *      'application/json': function(){
   *        res.send({ message: 'hey' });
   *      }
   *    });
   *
   * In addition to canonicalized MIME types you may
   * also use extnames mapped to these types:
   *
   *    res.format({
   *      text: function(){
   *        res.send('hey');
   *      },
   *
   *      html: function(){
   *        res.send('<p>hey</p>');
   *      },
   *
   *      json: function(){
   *        res.send({ message: 'hey' });
   *      }
   *    });
   *
   * By default Express passes an `Error`
   * with a `.status` of 406 to `next(err)`
   * if a match is not made. If you provide
   * a `.default` callback it will be invoked
   * instead.
   *
   * @param {Object} obj
   * @return {Response} for chaining
   * @public
   */ format(obj) {
        const req = this.req;
        const next = req.next;
        const { default: fn , ...rest } = obj;
        const keys = Object.keys(rest);
        const accepts = keys.length > 0 ? req.accepts(keys) : false;
        this.vary("Accept");
        if (accepts) {
            const key = Array.isArray(accepts) ? accepts[0] : accepts;
            this.set("Content-Type", normalizeType(key).value);
            obj[key](req, this, next);
        } else if (fn) {
            fn();
        } else {
            const err = new Error("Not Acceptable");
            err.status = err.statusCode = 406;
            err.types = normalizeTypes(keys).map(function(o) {
                return o.value;
            });
            next(err);
        }
        return this;
    }
    /**
   * Get value for header `field`.
   *
   * @param {string} field
   * @return {string} the header
   * @public
   */ get(field) {
        return this.headers.get(field.toLowerCase()) || "";
    }
    /**
   * Send JSON response.
   *
   * Examples:
   *
   *     res.json(null);
   *     res.json({ user: 'deno' });
   *
   * @param {ResponseBody} body
   * @return {Response} for chaining
   * @public
   */ json(body) {
        const app = this.app;
        const replacer = app.get("json replacer");
        const spaces = app.get("json spaces");
        const escape = app.get("json escape");
        body = stringify(body, replacer, spaces, escape);
        if (!this.get("Content-Type")) {
            this.type("application/json");
        }
        return this.send(body);
    }
    /**
   * Send JSON response with JSONP callback support.
   *
   * Examples:
   *
   *     res.jsonp(null);
   *     res.jsonp({ user: 'deno' });
   *
   * @param {ResponseBody} body
   * @return {Response} for chaining
   * @public
   */ jsonp(body) {
        const app = this.app;
        const replacer = app.get("json replacer");
        const spaces = app.get("json spaces");
        const escape = app.get("json escape");
        body = stringify(body, replacer, spaces, escape);
        let callback = this.req.query[app.get("jsonp callback name")];
        if (Array.isArray(callback)) {
            callback = callback[0];
        }
        if (typeof callback === "string" && callback.length !== 0) {
            this.set("X-Content-Type-Options", "nosniff");
            this.type("text/javascript");
            // restrict callback charset
            callback = callback.replace(/[^\[\]\w$.]/g, "");
            // replace chars not allowed in JavaScript that are in JSON
            body = body.replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
            // the /**/ is a specific security mitigation for "Rosetta Flash JSONP abuse"
            // the typeof check is just to reduce client error noise
            body = `/**/ typeof ${callback} === 'function' && ${callback}(${body});`;
        } else if (!this.get("Content-Type")) {
            this.set("X-Content-Type-Options", "nosniff");
            this.set("Content-Type", "application/json");
        }
        return this.send(body);
    }
    /**
   * Set Link header field with the given `links`.
   *
   * Examples:
   *
   *    res.links({
   *      next: 'http://api.example.com/users?page=2',
   *      last: 'http://api.example.com/users?page=5'
   *    });
   *
   * @param {any} links
   * @return {Response} for chaining
   * @public
   */ links(links) {
        let currentLink = this.get("Link");
        if (currentLink) {
            currentLink += ", ";
        }
        const link = currentLink + Object.entries(links).map(([rel, field])=>`<${field}>; rel="${rel}"`
        ).join(", ");
        return this.set("Link", link);
    }
    /**
   * Set the location header to `url`.
   *
   * The given `url` can also be "back", which redirects
   * to the _Referrer_ or _Referer_ headers or "/".
   *
   * Examples:
   *
   *    res.location('/foo/bar').;
   *    res.location('http://example.com');
   *    res.location('../login');
   *
   * @param {string} url
   * @return {Response} for chaining
   * @public
   */ location(url) {
        const loc = url === "back" ? this.req.get("Referrer") || "/" : url;
        // set location
        return this.set("Location", encodeUrl(loc));
    }
    redirect() {
        let address;
        let body = "";
        let status;
        if (arguments.length === 0) {
            throw new TypeError("res.redirect: requires a location url");
        } else if (arguments.length === 1) {
            address = arguments[0] + "";
            status = 302;
        } else {
            if (typeof arguments[0] !== "number" || Number.isNaN(arguments[0])) {
                throw new TypeError("res.redirect: expected status code to be a valid number");
            }
            address = arguments[1] + "";
            status = arguments[0];
        }
        // Set location header
        address = this.location(address).get("Location");
        // Support text/{plain,html} by default
        this.format({
            text: function _renderRedirectBody() {
                body = `${STATUS_TEXT.get(status)}. Redirecting to ${address}`;
            },
            html: function _renderRedirectHtmlBoby() {
                const u = escapeHtml(address);
                body = `<p>${STATUS_TEXT.get(status)}. Redirecting to <a href="${u}">${u}</a></p>`;
            },
            default: function _renderDefaultRedirectBody() {
                body = "";
            }
        });
        // Respond
        this.status = status;
        if (this.req.method === "HEAD") {
            this.end();
        } else {
            this.end(body);
        }
    }
    /**
   * Render `view` with the given `options` and optional callback `fn`.
   * When a callback function is given a response will _not_ be made
   * automatically, otherwise a response of _200_ and _text/html_ is given.
   *
   * Options:
   *
   *  - `cache`     boolean hinting to the engine it should cache
   *  - `filename`  filename of the view being rendered
   *
   * @public
   */ render(view, options = {
    }, callback) {
        const app = this.req.app;
        const req = this.req;
        const self = this;
        let done = callback;
        // support callback function as second arg
        if (typeof options === "function") {
            done = options;
            options = {
            };
        }
        // merge res.locals
        options._locals = self.locals;
        // default callback to respond
        done = done || function(err, str) {
            if (err) {
                return req.next(err);
            }
            self.send(str);
        };
        // render
        app.render(view, options, done);
    }
    /**
   * Send a response.
   *
   * Examples:
   *
   *     res.send({ some: 'json' });
   *     res.send('<p>some html</p>');
   *
   * @param {ResponseBody} body
   * @return {Response} for chaining
   * @public
   */ send(body) {
        let chunk;
        let isUndefined = body === undefined;
        if (isUndefined || body === null) {
            body = "";
        }
        switch(typeof body){
            case "string":
                chunk = body;
                break;
            case "boolean":
            case "number":
                return this.json(body);
            case "object":
            default:
                if (body instanceof Uint8Array || typeof body.read === "function") {
                    chunk = body;
                    if (!this.get("Content-Type")) {
                        this.type("bin");
                    }
                } else {
                    return this.json(body);
                }
        }
        if (typeof chunk === "string" && !this.get("Content-Type")) {
            this.type("html");
        }
        if (!this.get("ETag") && (typeof chunk === "string" || chunk instanceof Uint8Array) && !isUndefined) {
            this.etag(chunk);
        }
        if (this.req.fresh) {
            this.status = 304;
        }
        if (this.status === 204 || this.status === 304) {
            this.unset("Content-Type");
            this.unset("Content-Length");
            this.unset("Transfer-Encoding");
            chunk = "";
        }
        if (this.req.method === "HEAD") {
            this.end();
        } else {
            this.end(chunk);
        }
        return this;
    }
    /**
   * Transfer the file at the given `path`.
   *
   * Automatically sets the _Content-Type_ response header field.
   *
   * @param {string} path
   * @param {object} [options]
   * @return {Promise<Response>}
   * @public
   */ async sendFile(path, options = {
    }) {
        if (!path) {
            throw new TypeError("path argument is required to res.sendFile");
        } else if (typeof path !== "string") {
            throw new TypeError("path must be a string to res.sendFile");
        }
        path = path.startsWith("file:") ? fromFileUrl(path) : path;
        if (!options.root && !isAbsolute(path)) {
            throw new TypeError("path must be absolute or specify root to res.sendFile");
        }
        const onDirectory = async ()=>{
            let stat;
            try {
                stat = await Deno.stat(path);
            } catch (err) {
                return sendError(this, err);
            }
            if (stat.isDirectory) {
                return sendError(this);
            }
        };
        options.onDirectory = onDirectory;
        if (options.headers) {
            const obj = options.headers;
            const keys = Object.keys(obj);
            for(let i = 0; i < keys.length; i++){
                const k = keys[i];
                this.set(k, obj[k]);
            }
        }
        return await send(this.req, this, path, options);
    }
    /**
   * Send given HTTP status code.
   *
   * Sets the response status to `code` and the body of the
   * response to the standard description from deno's http_status.STATUS_TEXT
   * or the code number if no description.
   *
   * Examples:
   *
   *     res.sendStatus(200);
   *
   * @param {Status} code
   * @return {Response} for chaining
   * @public
   */ sendStatus(code) {
        const body = STATUS_TEXT.get(code) || String(code);
        this.setStatus(code);
        this.type("txt");
        return this.send(body);
    }
    set(field, value) {
        if (arguments.length === 2) {
            const lowerCaseField = (field + "").toLowerCase();
            const coercedVal = value + "";
            if (lowerCaseField === "content-type") {
                this.type(coercedVal);
            } else {
                this.headers.set(lowerCaseField, coercedVal);
            }
        } else if (typeof field === "object" && field) {
            const entries = Object.entries(field);
            for (const [key, val] of entries){
                this.set(key, val);
            }
        }
        return this;
    }
    /**
   * Set status `code`.
   * 
   * This method deviates from Express due to the naming clash
   * with Deno.Response `status` property.
   *
   * @param {Status} code
   * @return {Response} for chaining
   * @public
   */ setStatus(code) {
        this.status = code;
        return this;
    }
    /**
   * Set _Content-Type_ response header with `type`.
   *
   * Examples:
   *
   *     res.type('.html');
   *     res.type('html');
   *     res.type('json');
   *     res.type('application/json');
   *     res.type('png');
   * 
   * @param {string} type
   * @return {Response} for chaining
   * @public
   */ type(type) {
        const ct = contentType(type) || "application/octet-stream";
        this.headers.set("content-type", ct);
        return this;
    }
    /**
   * Deletes a header.
   * 
   * @param {string} field
   * @return {Response} for chaining
   * @public
   */ unset(field) {
        this.headers.delete(field);
        return this;
    }
    /**
   * Add `field` to Vary. If already present in the Vary set, then
   * this call is simply ignored.
   *
   * @param {Array|String} field
   * @return {Response} for chaining
   * @public
   */ vary(field) {
        vary(this.headers, field);
        return this;
    }
}
/**
 * Response class.
 * 
 * @public
 */ export { Response1 as Response };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy9yZXNwb25zZS50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY29udGVudERpc3Bvc2l0aW9uIH0gZnJvbSBcIi4vdXRpbHMvY29udGVudERpc3Bvc2l0aW9uLnRzXCI7XG5pbXBvcnQgeyBzdHJpbmdpZnkgfSBmcm9tIFwiLi91dGlscy9zdHJpbmdpZnkudHNcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZVR5cGUsIG5vcm1hbGl6ZVR5cGVzIH0gZnJvbSBcIi4vdXRpbHMvbm9ybWFsaXplVHlwZS50c1wiO1xuaW1wb3J0IHtcbiAgaGFzQ29va2llTmFtZVByb3BlcnR5LFxuICBoYXNDb29raWVSZXF1aXJlZFByb3BlcnRpZXMsXG59IGZyb20gXCIuL3V0aWxzL2Nvb2tpZXMudHNcIjtcbmltcG9ydCB7IHNlbmQsIHNlbmRFcnJvciB9IGZyb20gXCIuL3V0aWxzL3NlbmQudHNcIjtcbmltcG9ydCB7XG4gIGNvbnRlbnRUeXBlLFxuICBDb29raWUsXG4gIGVuY29kZVVybCxcbiAgZXNjYXBlSHRtbCxcbiAgZXh0bmFtZSxcbiAgZnJvbUZpbGVVcmwsXG4gIGlzQWJzb2x1dGUsXG4gIHJlc29sdmUsXG4gIHNldENvb2tpZSxcbiAgU3RhdHVzLFxuICBTVEFUVVNfVEVYVCxcbiAgdmFyeSxcbn0gZnJvbSBcIi4uL2RlcHMudHNcIjtcbmltcG9ydCB0eXBlIHtcbiAgQXBwbGljYXRpb24sXG4gIENvb2tpZU9wdGlvbnMsXG4gIENvb2tpZVdpdGhPcHRpb25hbFZhbHVlLFxuICBEZW5vUmVzcG9uc2VCb2R5LFxuICBOZXh0RnVuY3Rpb24sXG4gIFJlcXVlc3QsXG4gIFJlc3BvbnNlIGFzIERlbm9SZXNwb25zZSxcbiAgUmVzcG9uc2VCb2R5LFxufSBmcm9tIFwiLi4vc3JjL3R5cGVzLnRzXCI7XG5cbi8qKlxuICogUmVzcG9uc2UgY2xhc3MuXG4gKiBcbiAqIEBwdWJsaWNcbiAqL1xuZXhwb3J0IGNsYXNzIFJlc3BvbnNlIGltcGxlbWVudHMgRGVub1Jlc3BvbnNlIHtcbiAgc3RhdHVzOiBTdGF0dXMgPSAyMDA7XG4gIGhlYWRlcnM6IEhlYWRlcnMgPSBuZXcgSGVhZGVycygpO1xuICB3cml0dGVuOiBCb29sZWFuID0gZmFsc2U7XG4gIGJvZHkhOiBEZW5vUmVzcG9uc2VCb2R5O1xuICBhcHAhOiBBcHBsaWNhdGlvbjtcbiAgcmVxITogUmVxdWVzdDtcbiAgbG9jYWxzITogYW55O1xuXG4gICNyZXNvdXJjZXM6IG51bWJlcltdID0gW107XG5cbiAgLyoqXG4gICAqIEFkZCBhIHJlc291cmNlIElEIHRvIHRoZSBsaXN0IG9mIHJlc291cmNlcyB0byBiZVxuICAgKiBjbG9zZWQgYWZ0ZXIgdGhlIC5lbmQoKSBtZXRob2QgaGFzIGJlZW4gY2FsbGVkLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IHJpZCBSZXNvdXJjZSBJRFxuICAgKiBAcHVibGljXG4gICAqL1xuICBhZGRSZXNvdXJjZShyaWQ6IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMuI3Jlc291cmNlcy5wdXNoKHJpZCk7XG4gIH1cblxuICAvKipcbiAgICogQXBwZW5kIGFkZGl0aW9uYWwgaGVhZGVyIGBmaWVsZGAgd2l0aCB2YWx1ZSBgdmFsYC5cbiAgICogVmFsdWUgY2FuIGJlIGVpdGhlciBhIGBzdHJpbmdgIG9yIGFuIGFycmF5IG9mIGBzdHJpbmdgLlxuICAgKiBcbiAgICogRXhhbXBsZTpcbiAgICpcbiAgICogICAgcmVzLmFwcGVuZCgnU2V0LUNvb2tpZScsICdmb289YmFyOyBQYXRoPS87IEh0dHBPbmx5Jyk7XG4gICAqICAgIHJlcy5hcHBlbmQoJ1dhcm5pbmcnLCAnMTk5IE1pc2NlbGxhbmVvdXMgd2FybmluZycpO1xuICAgKiAgICByZXMuYXBwZW5kKFwiY2FjaGUtY29udHJvbFwiLCBbXCJwdWJsaWNcIiwgXCJtYXgtYWdlPTYwNDgwMFwiLCBcImltbXV0YWJsZVwiXSk7XG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gZmllbGRcbiAgICogQHBhcmFtIHtzdHJpbmd8c3RyaW5nW119IHZhbHVlXG4gICAqIEByZXR1cm4ge1Jlc3BvbnNlfSBmb3IgY2hhaW5pbmdcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgYXBwZW5kKGZpZWxkOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBzdHJpbmdbXSk6IHRoaXMge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHZhbHVlLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHRoaXMuaGVhZGVycy5hcHBlbmQoZmllbGQsIHZhbHVlW2ldKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5oZWFkZXJzLmFwcGVuZChmaWVsZCwgdmFsdWUpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBfQ29udGVudC1EaXNwb3NpdGlvbl8gaGVhZGVyIHRvIF9hdHRhY2htZW50XyB3aXRoIG9wdGlvbmFsIGBmaWxlbmFtZWAuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZVxuICAgKiBAcmV0dXJuIHtSZXNwb25zZX0gZm9yIGNoYWluaW5nXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIGF0dGFjaG1lbnQoZmlsZW5hbWU6IHN0cmluZyk6IHRoaXMge1xuICAgIGlmIChmaWxlbmFtZSkge1xuICAgICAgdGhpcy50eXBlKGV4dG5hbWUoZmlsZW5hbWUpKTtcbiAgICB9XG5cbiAgICB0aGlzLnNldChcIkNvbnRlbnQtRGlzcG9zaXRpb25cIiwgY29udGVudERpc3Bvc2l0aW9uKFwiYXR0YWNobWVudFwiLCBmaWxlbmFtZSkpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGEgY29va2llLiBTZXRzIHRoZSBjb29raWUgcGF0aCB0byBcIi9cIiBpZiBub3QgZGVmaW5lZC5cbiAgICpcbiAgICogRXhhbXBsZXM6XG4gICAqXG4gICAqICAgIC8vIFwiUmVtZW1iZXIgTWVcIiBmb3IgMTUgbWludXRlc1xuICAgKiAgICByZXMuY29va2llKHsgbmFtZTogXCJyZW1lbWJlcm1lXCIsIHZhbHVlOiBcIjFcIiwgZXhwaXJlczogbmV3IERhdGUoRGF0ZS5ub3coKSArIDkwMDAwMCksIGh0dHBPbmx5OiB0cnVlIH0pO1xuICAgKlxuICAgKiBAcGFyYW0ge0Nvb2tpZX0gY29va2llXG4gICAqIEByZXR1cm4ge1Jlc3BvbnNlfSBmb3IgY2hhaW5pbmdcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgY29va2llKG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZywgb3B0aW9uczogQ29va2llT3B0aW9ucyk6IHRoaXM7XG4gIGNvb2tpZShjb29raWU6IENvb2tpZSk6IHRoaXM7XG4gIGNvb2tpZShuYW1lT3JDb29raWU6IHVua25vd24pOiB0aGlzIHtcbiAgICBsZXQgY29va2llOiBDb29raWU7XG5cbiAgICBpZiAodHlwZW9mIG5hbWVPckNvb2tpZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgY29va2llID0ge1xuICAgICAgICAuLi5hcmd1bWVudHNbMl0sXG4gICAgICAgIG5hbWU6IG5hbWVPckNvb2tpZSxcbiAgICAgICAgdmFsdWU6IGFyZ3VtZW50c1sxXSA/PyBcIlwiLFxuICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKGhhc0Nvb2tpZVJlcXVpcmVkUHJvcGVydGllcyhuYW1lT3JDb29raWUpKSB7XG4gICAgICBjb29raWUgPSBuYW1lT3JDb29raWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgIFwicmVzcG9uc2UuY29va2llLCBhcmdzIHByb3ZpZGVkIGRvIG5vdCBtYXRjaCBvbmUgb2YgdGhlIHN1cHBvcnRlZCBzaWduYXR1cmVzOiBcIiArXG4gICAgICAgICAgQXJyYXkucHJvdG90eXBlLmpvaW4uY2FsbChhcmd1bWVudHMsIFwiLCBcIiksXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmIChjb29raWUucGF0aCA9PSBudWxsKSB7XG4gICAgICBjb29raWUucGF0aCA9IFwiL1wiO1xuICAgIH1cblxuICAgIHNldENvb2tpZSh0aGlzLCBjb29raWUpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXIgYSBjb29raWUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfENvb2tpZVdpdGhPcHRpb25hbFZhbHVlfSBjb29raWVcbiAgICogQHJldHVybiB7UmVzcG9uc2V9IGZvciBjaGFpbmluZ1xuICAgKiBAcHVibGljXG4gICAqL1xuICBjbGVhckNvb2tpZShjb29raWU6IENvb2tpZVdpdGhPcHRpb25hbFZhbHVlKTogdGhpcztcbiAgY2xlYXJDb29raWUobmFtZTogc3RyaW5nLCBvcHRpb25zPzogQ29va2llT3B0aW9ucyk6IHRoaXM7XG4gIGNsZWFyQ29va2llKG5hbWVPckNvb2tpZTogdW5rbm93bik6IHRoaXMge1xuICAgIGlmICh0eXBlb2YgbmFtZU9yQ29va2llID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBzZXRDb29raWUoXG4gICAgICAgIHRoaXMsXG4gICAgICAgIHtcbiAgICAgICAgICBwYXRoOiBcIi9cIixcbiAgICAgICAgICAuLi5hcmd1bWVudHNbMV0sXG4gICAgICAgICAgdmFsdWU6IFwiXCIsXG4gICAgICAgICAgZXhwaXJlczogbmV3IERhdGUoMCksXG4gICAgICAgICAgbmFtZTogbmFtZU9yQ29va2llLFxuICAgICAgICB9LFxuICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKGhhc0Nvb2tpZU5hbWVQcm9wZXJ0eShuYW1lT3JDb29raWUpKSB7XG4gICAgICBzZXRDb29raWUodGhpcywge1xuICAgICAgICBwYXRoOiBcIi9cIixcbiAgICAgICAgLi4ubmFtZU9yQ29va2llLFxuICAgICAgICB2YWx1ZTogXCJcIixcbiAgICAgICAgZXhwaXJlczogbmV3IERhdGUoMCksXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgXCJyZXMuY2xlYXJDb29raWUsIGFyZ3MgcHJvdmlkZWQgZG8gbm90IG1hdGNoIG9uZSBvZiB0aGUgc3VwcG9ydGVkIHNpZ25hdHVyZXM6IFwiICtcbiAgICAgICAgICBBcnJheS5wcm90b3R5cGUuam9pbi5jYWxsKGFyZ3VtZW50cywgXCIsIFwiKSxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogVHJhbnNmZXIgdGhlIGZpbGUgYXQgdGhlIGdpdmVuIGBwYXRoYCBhcyBhbiBhdHRhY2htZW50LlxuICAgKlxuICAgKiBPcHRpb25hbGx5IHByb3ZpZGluZyBhbiBhbHRlcm5hdGUgYXR0YWNobWVudCBgZmlsZW5hbWVgLlxuICAgKiBcbiAgICogT3B0aW9uYWxseSBwcm92aWRpbmcgYW4gYG9wdGlvbnNgIG9iamVjdCB0byB1c2Ugd2l0aCBgcmVzLnNlbmRGaWxlKClgLlxuICAgKlxuICAgKiBUaGlzIGZ1bmN0aW9uIHdpbGwgc2V0IHRoZSBgQ29udGVudC1EaXNwb3NpdGlvbmAgaGVhZGVyLCBvdmVycmlkaW5nXG4gICAqIGFueSBleGlzdGluZyBgQ29udGVudC1EaXNwb3NpdGlvbmAgaGVhZGVyIGluIG9yZGVyIHRvIHNldCB0aGUgYXR0YWNobWVudFxuICAgKiBhbmQgZmlsZW5hbWUuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIHVzZXMgYHJlcy5zZW5kRmlsZSgpYC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGhcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtmaWxlbmFtZV1cbiAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFJlc3BvbnNlPn1cbiAgICogQHB1YmxpY1xuICAgKi9cbiAgYXN5bmMgZG93bmxvYWQoXG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGZpbGVuYW1lPzogc3RyaW5nLFxuICAgIG9wdGlvbnM/OiBhbnksXG4gICk6IFByb21pc2U8dGhpcyB8IHZvaWQ+IHtcbiAgICBjb25zdCBoZWFkZXJzOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9ID0ge1xuICAgICAgXCJDb250ZW50LURpc3Bvc2l0aW9uXCI6IGNvbnRlbnREaXNwb3NpdGlvbihcImF0dGFjaG1lbnRcIiwgZmlsZW5hbWUgfHwgcGF0aCksXG4gICAgfTtcblxuICAgIC8vIE1lcmdlIHVzZXItcHJvdmlkZWQgaGVhZGVyc1xuICAgIGlmIChvcHRpb25zPy5oZWFkZXJzKSB7XG4gICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMob3B0aW9ucy5oZWFkZXJzKTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IGtleXNbaV07XG5cbiAgICAgICAgaWYgKGtleS50b0xvd2VyQ2FzZSgpICE9PSBcImNvbnRlbnQtZGlzcG9zaXRpb25cIikge1xuICAgICAgICAgIGhlYWRlcnNba2V5XSA9IG9wdGlvbnMuaGVhZGVyc1trZXldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTWVyZ2UgdXNlci1wcm92aWRlZCBvcHRpb25zXG4gICAgb3B0aW9ucyA9IHtcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgICBoZWFkZXJzLFxuICAgIH07XG5cbiAgICBjb25zdCBmdWxsUGF0aCA9IHJlc29sdmUoXG4gICAgICBwYXRoLnN0YXJ0c1dpdGgoXCJmaWxlOlwiKSA/IGZyb21GaWxlVXJsKHBhdGgpIDogcGF0aCxcbiAgICApO1xuXG4gICAgLy8gU2VuZCBmaWxlXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuc2VuZEZpbGUoZnVsbFBhdGgsIG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuZHMgdGhlIHJlc3BvbnNlIHByb2Nlc3MuXG4gICAqXG4gICAqIEBwYXJhbSB7RGVub1Jlc3BvbnNlQm9keX0gYm9keVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKiBAcHVibGljXG4gICAqL1xuICBhc3luYyBlbmQoXG4gICAgYm9keT86IERlbm9SZXNwb25zZUJvZHksXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmIChib2R5KSB7XG4gICAgICB0aGlzLmJvZHkgPSBib2R5O1xuICAgIH1cblxuICAgIHRoaXMud3JpdHRlbiA9IHRydWU7XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5yZXEucmVzcG9uZCh0aGlzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAvLyBDb25uZWN0aW9uIG1pZ2h0IGhhdmUgYmVlbiBhbHJlYWR5IGNsb3NlZFxuICAgICAgaWYgKCEoZSBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLkJhZFJlc291cmNlKSkge1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3QgcmlkIG9mIHRoaXMuI3Jlc291cmNlcykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgRGVuby5jbG9zZShyaWQpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBSZXNvdXJjZSBtaWdodCBoYXZlIGJlZW4gYWxyZWFkeSBjbG9zZWRcbiAgICAgICAgaWYgKCEoZSBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLkJhZFJlc291cmNlKSkge1xuICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLiNyZXNvdXJjZXMgPSBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGFuIEVUYWcgaGVhZGVyLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd8VWludDhBcnJheXxEZW5vLkZpbGVJbmZvfSBjaHVuayBcbiAgICogQHJldHVybnMge1Jlc3BvbnNlfSBmb3IgY2hhaW5pbmdcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgZXRhZyhjaHVuazogc3RyaW5nIHwgVWludDhBcnJheSB8IERlbm8uRmlsZUluZm8pOiB0aGlzIHtcbiAgICBjb25zdCBldGFnRm4gPSB0aGlzLmFwcC5nZXQoXCJldGFnIGZuXCIpO1xuXG4gICAgaWYgKHR5cGVvZiBldGFnRm4gPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgKGNodW5rIGFzIGFueSkubGVuZ3RoKSB7XG4gICAgICBjb25zdCBldGFnID0gZXRhZ0ZuKGNodW5rKTtcblxuICAgICAgaWYgKGV0YWcpIHtcbiAgICAgICAgdGhpcy5zZXQoXCJFVGFnXCIsIGV0YWcpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc3BvbmQgdG8gdGhlIEFjY2VwdGFibGUgZm9ybWF0cyB1c2luZyBhbiBgb2JqYFxuICAgKiBvZiBtaW1lLXR5cGUgY2FsbGJhY2tzLlxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCB1c2VzIGByZXEuYWNjZXB0ZWRgLCBhbiBhcnJheSBvZlxuICAgKiBhY2NlcHRhYmxlIHR5cGVzIG9yZGVyZWQgYnkgdGhlaXIgcXVhbGl0eSB2YWx1ZXMuXG4gICAqIFdoZW4gXCJBY2NlcHRcIiBpcyBub3QgcHJlc2VudCB0aGUgX2ZpcnN0XyBjYWxsYmFja1xuICAgKiBpcyBpbnZva2VkLCBvdGhlcndpc2UgdGhlIGZpcnN0IG1hdGNoIGlzIHVzZWQuIFdoZW5cbiAgICogbm8gbWF0Y2ggaXMgcGVyZm9ybWVkIHRoZSBzZXJ2ZXIgcmVzcG9uZHMgd2l0aFxuICAgKiA0MDYgXCJOb3QgQWNjZXB0YWJsZVwiLlxuICAgKlxuICAgKiBDb250ZW50LVR5cGUgaXMgc2V0IGZvciB5b3UsIGhvd2V2ZXIgaWYgeW91IGNob29zZVxuICAgKiB5b3UgbWF5IGFsdGVyIHRoaXMgd2l0aGluIHRoZSBjYWxsYmFjayB1c2luZyBgcmVzLnR5cGUoKWBcbiAgICogb3IgYHJlcy5zZXQoJ0NvbnRlbnQtVHlwZScsIC4uLilgLlxuICAgKlxuICAgKiAgICByZXMuZm9ybWF0KHtcbiAgICogICAgICAndGV4dC9wbGFpbic6IGZ1bmN0aW9uKCl7XG4gICAqICAgICAgICByZXMuc2VuZCgnaGV5Jyk7XG4gICAqICAgICAgfSxcbiAgICpcbiAgICogICAgICAndGV4dC9odG1sJzogZnVuY3Rpb24oKXtcbiAgICogICAgICAgIHJlcy5zZW5kKCc8cD5oZXk8L3A+Jyk7XG4gICAqICAgICAgfSxcbiAgICpcbiAgICogICAgICAnYXBwbGljYXRpb24vanNvbic6IGZ1bmN0aW9uKCl7XG4gICAqICAgICAgICByZXMuc2VuZCh7IG1lc3NhZ2U6ICdoZXknIH0pO1xuICAgKiAgICAgIH1cbiAgICogICAgfSk7XG4gICAqXG4gICAqIEluIGFkZGl0aW9uIHRvIGNhbm9uaWNhbGl6ZWQgTUlNRSB0eXBlcyB5b3UgbWF5XG4gICAqIGFsc28gdXNlIGV4dG5hbWVzIG1hcHBlZCB0byB0aGVzZSB0eXBlczpcbiAgICpcbiAgICogICAgcmVzLmZvcm1hdCh7XG4gICAqICAgICAgdGV4dDogZnVuY3Rpb24oKXtcbiAgICogICAgICAgIHJlcy5zZW5kKCdoZXknKTtcbiAgICogICAgICB9LFxuICAgKlxuICAgKiAgICAgIGh0bWw6IGZ1bmN0aW9uKCl7XG4gICAqICAgICAgICByZXMuc2VuZCgnPHA+aGV5PC9wPicpO1xuICAgKiAgICAgIH0sXG4gICAqXG4gICAqICAgICAganNvbjogZnVuY3Rpb24oKXtcbiAgICogICAgICAgIHJlcy5zZW5kKHsgbWVzc2FnZTogJ2hleScgfSk7XG4gICAqICAgICAgfVxuICAgKiAgICB9KTtcbiAgICpcbiAgICogQnkgZGVmYXVsdCBFeHByZXNzIHBhc3NlcyBhbiBgRXJyb3JgXG4gICAqIHdpdGggYSBgLnN0YXR1c2Agb2YgNDA2IHRvIGBuZXh0KGVycilgXG4gICAqIGlmIGEgbWF0Y2ggaXMgbm90IG1hZGUuIElmIHlvdSBwcm92aWRlXG4gICAqIGEgYC5kZWZhdWx0YCBjYWxsYmFjayBpdCB3aWxsIGJlIGludm9rZWRcbiAgICogaW5zdGVhZC5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IG9ialxuICAgKiBAcmV0dXJuIHtSZXNwb25zZX0gZm9yIGNoYWluaW5nXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIGZvcm1hdChvYmo6IGFueSk6IHRoaXMge1xuICAgIGNvbnN0IHJlcSA9IHRoaXMucmVxO1xuICAgIGNvbnN0IG5leHQgPSByZXEubmV4dCBhcyBOZXh0RnVuY3Rpb247XG5cbiAgICBjb25zdCB7IGRlZmF1bHQ6IGZuLCAuLi5yZXN0IH0gPSBvYmo7XG4gICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHJlc3QpO1xuICAgIGNvbnN0IGFjY2VwdHMgPSBrZXlzLmxlbmd0aCA+IDAgPyByZXEuYWNjZXB0cyhrZXlzKSA6IGZhbHNlO1xuXG4gICAgdGhpcy52YXJ5KFwiQWNjZXB0XCIpO1xuXG4gICAgaWYgKGFjY2VwdHMpIHtcbiAgICAgIGNvbnN0IGtleSA9IEFycmF5LmlzQXJyYXkoYWNjZXB0cykgPyBhY2NlcHRzWzBdIDogYWNjZXB0cztcbiAgICAgIHRoaXMuc2V0KFwiQ29udGVudC1UeXBlXCIsIG5vcm1hbGl6ZVR5cGUoa2V5KS52YWx1ZSk7XG4gICAgICBvYmpba2V5XShyZXEsIHRoaXMsIG5leHQpO1xuICAgIH0gZWxzZSBpZiAoZm4pIHtcbiAgICAgIGZuKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcihcIk5vdCBBY2NlcHRhYmxlXCIpIGFzIGFueTtcbiAgICAgIGVyci5zdGF0dXMgPSBlcnIuc3RhdHVzQ29kZSA9IDQwNjtcbiAgICAgIGVyci50eXBlcyA9IG5vcm1hbGl6ZVR5cGVzKGtleXMpLm1hcChmdW5jdGlvbiAobykge1xuICAgICAgICByZXR1cm4gby52YWx1ZTtcbiAgICAgIH0pO1xuXG4gICAgICBuZXh0KGVycik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHZhbHVlIGZvciBoZWFkZXIgYGZpZWxkYC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkXG4gICAqIEByZXR1cm4ge3N0cmluZ30gdGhlIGhlYWRlclxuICAgKiBAcHVibGljXG4gICAqL1xuICBnZXQoZmllbGQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuaGVhZGVycy5nZXQoZmllbGQudG9Mb3dlckNhc2UoKSkgfHwgXCJcIjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIEpTT04gcmVzcG9uc2UuXG4gICAqXG4gICAqIEV4YW1wbGVzOlxuICAgKlxuICAgKiAgICAgcmVzLmpzb24obnVsbCk7XG4gICAqICAgICByZXMuanNvbih7IHVzZXI6ICdkZW5vJyB9KTtcbiAgICpcbiAgICogQHBhcmFtIHtSZXNwb25zZUJvZHl9IGJvZHlcbiAgICogQHJldHVybiB7UmVzcG9uc2V9IGZvciBjaGFpbmluZ1xuICAgKiBAcHVibGljXG4gICAqL1xuICBqc29uKGJvZHk6IFJlc3BvbnNlQm9keSk6IHRoaXMge1xuICAgIGNvbnN0IGFwcCA9IHRoaXMuYXBwO1xuICAgIGNvbnN0IHJlcGxhY2VyID0gYXBwLmdldChcImpzb24gcmVwbGFjZXJcIik7XG4gICAgY29uc3Qgc3BhY2VzID0gYXBwLmdldChcImpzb24gc3BhY2VzXCIpO1xuICAgIGNvbnN0IGVzY2FwZSA9IGFwcC5nZXQoXCJqc29uIGVzY2FwZVwiKTtcbiAgICBib2R5ID0gc3RyaW5naWZ5KGJvZHksIHJlcGxhY2VyLCBzcGFjZXMsIGVzY2FwZSk7XG5cbiAgICBpZiAoIXRoaXMuZ2V0KFwiQ29udGVudC1UeXBlXCIpKSB7XG4gICAgICB0aGlzLnR5cGUoXCJhcHBsaWNhdGlvbi9qc29uXCIpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnNlbmQoYm9keSk7XG4gIH1cblxuICAvKipcbiAgICogU2VuZCBKU09OIHJlc3BvbnNlIHdpdGggSlNPTlAgY2FsbGJhY2sgc3VwcG9ydC5cbiAgICpcbiAgICogRXhhbXBsZXM6XG4gICAqXG4gICAqICAgICByZXMuanNvbnAobnVsbCk7XG4gICAqICAgICByZXMuanNvbnAoeyB1c2VyOiAnZGVubycgfSk7XG4gICAqXG4gICAqIEBwYXJhbSB7UmVzcG9uc2VCb2R5fSBib2R5XG4gICAqIEByZXR1cm4ge1Jlc3BvbnNlfSBmb3IgY2hhaW5pbmdcbiAgICogQHB1YmxpY1xuICAgKi9cbiAganNvbnAoYm9keTogUmVzcG9uc2VCb2R5KSB7XG4gICAgY29uc3QgYXBwID0gdGhpcy5hcHA7XG4gICAgY29uc3QgcmVwbGFjZXIgPSBhcHAuZ2V0KFwianNvbiByZXBsYWNlclwiKTtcbiAgICBjb25zdCBzcGFjZXMgPSBhcHAuZ2V0KFwianNvbiBzcGFjZXNcIik7XG4gICAgY29uc3QgZXNjYXBlID0gYXBwLmdldChcImpzb24gZXNjYXBlXCIpO1xuICAgIGJvZHkgPSBzdHJpbmdpZnkoYm9keSwgcmVwbGFjZXIsIHNwYWNlcywgZXNjYXBlKTtcblxuICAgIGxldCBjYWxsYmFjayA9IHRoaXMucmVxLnF1ZXJ5W2FwcC5nZXQoXCJqc29ucCBjYWxsYmFjayBuYW1lXCIpXTtcblxuICAgIGlmIChBcnJheS5pc0FycmF5KGNhbGxiYWNrKSkge1xuICAgICAgY2FsbGJhY2sgPSBjYWxsYmFja1swXTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSBcInN0cmluZ1wiICYmIGNhbGxiYWNrLmxlbmd0aCAhPT0gMCkge1xuICAgICAgdGhpcy5zZXQoXCJYLUNvbnRlbnQtVHlwZS1PcHRpb25zXCIsIFwibm9zbmlmZlwiKTtcbiAgICAgIHRoaXMudHlwZShcInRleHQvamF2YXNjcmlwdFwiKTtcblxuICAgICAgLy8gcmVzdHJpY3QgY2FsbGJhY2sgY2hhcnNldFxuICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjay5yZXBsYWNlKC9bXlxcW1xcXVxcdyQuXS9nLCBcIlwiKTtcblxuICAgICAgLy8gcmVwbGFjZSBjaGFycyBub3QgYWxsb3dlZCBpbiBKYXZhU2NyaXB0IHRoYXQgYXJlIGluIEpTT05cbiAgICAgIGJvZHkgPSBib2R5XG4gICAgICAgIC5yZXBsYWNlKC9cXHUyMDI4L2csIFwiXFxcXHUyMDI4XCIpXG4gICAgICAgIC5yZXBsYWNlKC9cXHUyMDI5L2csIFwiXFxcXHUyMDI5XCIpO1xuXG4gICAgICAvLyB0aGUgLyoqLyBpcyBhIHNwZWNpZmljIHNlY3VyaXR5IG1pdGlnYXRpb24gZm9yIFwiUm9zZXR0YSBGbGFzaCBKU09OUCBhYnVzZVwiXG4gICAgICAvLyB0aGUgdHlwZW9mIGNoZWNrIGlzIGp1c3QgdG8gcmVkdWNlIGNsaWVudCBlcnJvciBub2lzZVxuICAgICAgYm9keSA9IGAvKiovIHR5cGVvZiAke2NhbGxiYWNrfSA9PT0gJ2Z1bmN0aW9uJyAmJiAke2NhbGxiYWNrfSgke2JvZHl9KTtgO1xuICAgIH0gZWxzZSBpZiAoIXRoaXMuZ2V0KFwiQ29udGVudC1UeXBlXCIpKSB7XG4gICAgICB0aGlzLnNldChcIlgtQ29udGVudC1UeXBlLU9wdGlvbnNcIiwgXCJub3NuaWZmXCIpO1xuICAgICAgdGhpcy5zZXQoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uXCIpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnNlbmQoYm9keSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IExpbmsgaGVhZGVyIGZpZWxkIHdpdGggdGhlIGdpdmVuIGBsaW5rc2AuXG4gICAqXG4gICAqIEV4YW1wbGVzOlxuICAgKlxuICAgKiAgICByZXMubGlua3Moe1xuICAgKiAgICAgIG5leHQ6ICdodHRwOi8vYXBpLmV4YW1wbGUuY29tL3VzZXJzP3BhZ2U9MicsXG4gICAqICAgICAgbGFzdDogJ2h0dHA6Ly9hcGkuZXhhbXBsZS5jb20vdXNlcnM/cGFnZT01J1xuICAgKiAgICB9KTtcbiAgICpcbiAgICogQHBhcmFtIHthbnl9IGxpbmtzXG4gICAqIEByZXR1cm4ge1Jlc3BvbnNlfSBmb3IgY2hhaW5pbmdcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgbGlua3MobGlua3M6IGFueSkge1xuICAgIGxldCBjdXJyZW50TGluayA9IHRoaXMuZ2V0KFwiTGlua1wiKTtcblxuICAgIGlmIChjdXJyZW50TGluaykge1xuICAgICAgY3VycmVudExpbmsgKz0gXCIsIFwiO1xuICAgIH1cblxuICAgIGNvbnN0IGxpbmsgPSBjdXJyZW50TGluayArXG4gICAgICBPYmplY3QuZW50cmllcyhsaW5rcykubWFwKChbcmVsLCBmaWVsZF0pID0+IGA8JHtmaWVsZH0+OyByZWw9XCIke3JlbH1cImApXG4gICAgICAgIC5qb2luKFwiLCBcIik7XG5cbiAgICByZXR1cm4gdGhpcy5zZXQoXCJMaW5rXCIsIGxpbmspO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgbG9jYXRpb24gaGVhZGVyIHRvIGB1cmxgLlxuICAgKlxuICAgKiBUaGUgZ2l2ZW4gYHVybGAgY2FuIGFsc28gYmUgXCJiYWNrXCIsIHdoaWNoIHJlZGlyZWN0c1xuICAgKiB0byB0aGUgX1JlZmVycmVyXyBvciBfUmVmZXJlcl8gaGVhZGVycyBvciBcIi9cIi5cbiAgICpcbiAgICogRXhhbXBsZXM6XG4gICAqXG4gICAqICAgIHJlcy5sb2NhdGlvbignL2Zvby9iYXInKS47XG4gICAqICAgIHJlcy5sb2NhdGlvbignaHR0cDovL2V4YW1wbGUuY29tJyk7XG4gICAqICAgIHJlcy5sb2NhdGlvbignLi4vbG9naW4nKTtcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVybFxuICAgKiBAcmV0dXJuIHtSZXNwb25zZX0gZm9yIGNoYWluaW5nXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIGxvY2F0aW9uKHVybDogc3RyaW5nKTogdGhpcyB7XG4gICAgY29uc3QgbG9jID0gdXJsID09PSBcImJhY2tcIiA/ICh0aGlzLnJlcS5nZXQoXCJSZWZlcnJlclwiKSB8fCBcIi9cIikgOiB1cmw7XG5cbiAgICAvLyBzZXQgbG9jYXRpb25cbiAgICByZXR1cm4gdGhpcy5zZXQoXCJMb2NhdGlvblwiLCBlbmNvZGVVcmwobG9jKSk7XG4gIH1cblxuICAvKipcbiAqIFJlZGlyZWN0IHRvIHRoZSBnaXZlbiBgdXJsYCB3aXRoIG9wdGlvbmFsIHJlc3BvbnNlIGBzdGF0dXNgXG4gKiBkZWZhdWx0aW5nIHRvIGAzMDJgLlxuICpcbiAqIFRoZSByZXN1bHRpbmcgYHVybGAgaXMgZGV0ZXJtaW5lZCBieSBgcmVzLmxvY2F0aW9uKClgLlxuICogXG4gKiBFeGFtcGxlczpcbiAqXG4gKiAgICByZXMucmVkaXJlY3QoJy9mb28vYmFyJyk7XG4gKiAgICByZXMucmVkaXJlY3QoJ2h0dHA6Ly9leGFtcGxlLmNvbScpO1xuICogICAgcmVzLnJlZGlyZWN0KDMwMSwgJ2h0dHA6Ly9leGFtcGxlLmNvbScpO1xuICogICAgcmVzLnJlZGlyZWN0KCcuLi9sb2dpbicpOyAvLyAvYmxvZy9wb3N0LzEgLT4gL2Jsb2cvbG9naW5cbiAqXG4gKiBAcGFyYW0ge1N0YXR1c30gc3RhdHVzQ29kZVxuICogQHBhcmFtIHtzdHJpbmd9IHVybFxuICogQHB1YmxpY1xuICovXG4gIHJlZGlyZWN0KHVybDogc3RyaW5nKTogdm9pZDtcbiAgcmVkaXJlY3Qoc3RhdHVzQ29kZTogU3RhdHVzLCB1cmw6IHN0cmluZyk6IHZvaWQ7XG4gIHJlZGlyZWN0KCkge1xuICAgIGxldCBhZGRyZXNzOiBzdHJpbmc7XG4gICAgbGV0IGJvZHk6IHN0cmluZyA9IFwiXCI7XG4gICAgbGV0IHN0YXR1czogU3RhdHVzO1xuXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJyZXMucmVkaXJlY3Q6IHJlcXVpcmVzIGEgbG9jYXRpb24gdXJsXCIpO1xuICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgYWRkcmVzcyA9IGFyZ3VtZW50c1swXSArIFwiXCI7XG4gICAgICBzdGF0dXMgPSAzMDI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0eXBlb2YgYXJndW1lbnRzWzBdICE9PSBcIm51bWJlclwiIHx8IE51bWJlci5pc05hTihhcmd1bWVudHNbMF0pKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgXCJyZXMucmVkaXJlY3Q6IGV4cGVjdGVkIHN0YXR1cyBjb2RlIHRvIGJlIGEgdmFsaWQgbnVtYmVyXCIsXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGFkZHJlc3MgPSBhcmd1bWVudHNbMV0gKyBcIlwiO1xuICAgICAgc3RhdHVzID0gYXJndW1lbnRzWzBdO1xuICAgIH1cblxuICAgIC8vIFNldCBsb2NhdGlvbiBoZWFkZXJcbiAgICBhZGRyZXNzID0gdGhpcy5sb2NhdGlvbihhZGRyZXNzKS5nZXQoXCJMb2NhdGlvblwiKTtcblxuICAgIC8vIFN1cHBvcnQgdGV4dC97cGxhaW4saHRtbH0gYnkgZGVmYXVsdFxuICAgIHRoaXMuZm9ybWF0KHtcbiAgICAgIHRleHQ6IGZ1bmN0aW9uIF9yZW5kZXJSZWRpcmVjdEJvZHkoKSB7XG4gICAgICAgIGJvZHkgPSBgJHtTVEFUVVNfVEVYVC5nZXQoc3RhdHVzKX0uIFJlZGlyZWN0aW5nIHRvICR7YWRkcmVzc31gO1xuICAgICAgfSxcblxuICAgICAgaHRtbDogZnVuY3Rpb24gX3JlbmRlclJlZGlyZWN0SHRtbEJvYnkoKSB7XG4gICAgICAgIGNvbnN0IHUgPSBlc2NhcGVIdG1sKGFkZHJlc3MpO1xuICAgICAgICBib2R5ID0gYDxwPiR7XG4gICAgICAgICAgU1RBVFVTX1RFWFQuZ2V0KHN0YXR1cylcbiAgICAgICAgfS4gUmVkaXJlY3RpbmcgdG8gPGEgaHJlZj1cIiR7dX1cIj4ke3V9PC9hPjwvcD5gO1xuICAgICAgfSxcblxuICAgICAgZGVmYXVsdDogZnVuY3Rpb24gX3JlbmRlckRlZmF1bHRSZWRpcmVjdEJvZHkoKSB7XG4gICAgICAgIGJvZHkgPSBcIlwiO1xuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIFJlc3BvbmRcbiAgICB0aGlzLnN0YXR1cyA9IHN0YXR1cztcblxuICAgIGlmICh0aGlzLnJlcS5tZXRob2QgPT09IFwiSEVBRFwiKSB7XG4gICAgICB0aGlzLmVuZCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVuZChib2R5KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVuZGVyIGB2aWV3YCB3aXRoIHRoZSBnaXZlbiBgb3B0aW9uc2AgYW5kIG9wdGlvbmFsIGNhbGxiYWNrIGBmbmAuXG4gICAqIFdoZW4gYSBjYWxsYmFjayBmdW5jdGlvbiBpcyBnaXZlbiBhIHJlc3BvbnNlIHdpbGwgX25vdF8gYmUgbWFkZVxuICAgKiBhdXRvbWF0aWNhbGx5LCBvdGhlcndpc2UgYSByZXNwb25zZSBvZiBfMjAwXyBhbmQgX3RleHQvaHRtbF8gaXMgZ2l2ZW4uXG4gICAqXG4gICAqIE9wdGlvbnM6XG4gICAqXG4gICAqICAtIGBjYWNoZWAgICAgIGJvb2xlYW4gaGludGluZyB0byB0aGUgZW5naW5lIGl0IHNob3VsZCBjYWNoZVxuICAgKiAgLSBgZmlsZW5hbWVgICBmaWxlbmFtZSBvZiB0aGUgdmlldyBiZWluZyByZW5kZXJlZFxuICAgKlxuICAgKiBAcHVibGljXG4gICAqL1xuICByZW5kZXIodmlldzogc3RyaW5nLCBvcHRpb25zOiBhbnkgPSB7fSwgY2FsbGJhY2s/OiBhbnkpIHtcbiAgICBjb25zdCBhcHAgPSB0aGlzLnJlcS5hcHA7XG4gICAgY29uc3QgcmVxID0gdGhpcy5yZXE7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgbGV0IGRvbmUgPSBjYWxsYmFjaztcblxuICAgIC8vIHN1cHBvcnQgY2FsbGJhY2sgZnVuY3Rpb24gYXMgc2Vjb25kIGFyZ1xuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBkb25lID0gb3B0aW9ucztcbiAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG5cbiAgICAvLyBtZXJnZSByZXMubG9jYWxzXG4gICAgb3B0aW9ucy5fbG9jYWxzID0gc2VsZi5sb2NhbHM7XG5cbiAgICAvLyBkZWZhdWx0IGNhbGxiYWNrIHRvIHJlc3BvbmRcbiAgICBkb25lID0gZG9uZSB8fCBmdW5jdGlvbiAoZXJyOiBhbnksIHN0cjogc3RyaW5nKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiAocmVxIGFzIGFueSkubmV4dChlcnIpO1xuICAgICAgfVxuXG4gICAgICBzZWxmLnNlbmQoc3RyKTtcbiAgICB9O1xuXG4gICAgLy8gcmVuZGVyXG4gICAgYXBwLnJlbmRlcih2aWV3LCBvcHRpb25zLCBkb25lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIGEgcmVzcG9uc2UuXG4gICAqXG4gICAqIEV4YW1wbGVzOlxuICAgKlxuICAgKiAgICAgcmVzLnNlbmQoeyBzb21lOiAnanNvbicgfSk7XG4gICAqICAgICByZXMuc2VuZCgnPHA+c29tZSBodG1sPC9wPicpO1xuICAgKlxuICAgKiBAcGFyYW0ge1Jlc3BvbnNlQm9keX0gYm9keVxuICAgKiBAcmV0dXJuIHtSZXNwb25zZX0gZm9yIGNoYWluaW5nXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIHNlbmQoYm9keTogUmVzcG9uc2VCb2R5KTogdGhpcyB7XG4gICAgbGV0IGNodW5rOiBEZW5vUmVzcG9uc2VCb2R5O1xuICAgIGxldCBpc1VuZGVmaW5lZCA9IGJvZHkgPT09IHVuZGVmaW5lZDtcblxuICAgIGlmIChpc1VuZGVmaW5lZCB8fCBib2R5ID09PSBudWxsKSB7XG4gICAgICBib2R5ID0gXCJcIjtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKHR5cGVvZiBib2R5KSB7XG4gICAgICBjYXNlIFwic3RyaW5nXCI6XG4gICAgICAgIGNodW5rID0gYm9keTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiYm9vbGVhblwiOlxuICAgICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgICByZXR1cm4gdGhpcy5qc29uKGJvZHkpO1xuICAgICAgY2FzZSBcIm9iamVjdFwiOlxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGJvZHkgaW5zdGFuY2VvZiBVaW50OEFycmF5IHx8XG4gICAgICAgICAgdHlwZW9mIChib2R5IGFzIERlbm8uUmVhZGVyKS5yZWFkID09PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgKSB7XG4gICAgICAgICAgY2h1bmsgPSBib2R5IGFzIFVpbnQ4QXJyYXkgfCBEZW5vLlJlYWRlcjtcblxuICAgICAgICAgIGlmICghdGhpcy5nZXQoXCJDb250ZW50LVR5cGVcIikpIHtcbiAgICAgICAgICAgIHRoaXMudHlwZShcImJpblwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuanNvbihib2R5KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgY2h1bmsgPT09IFwic3RyaW5nXCIgJiYgIXRoaXMuZ2V0KFwiQ29udGVudC1UeXBlXCIpKSB7XG4gICAgICB0aGlzLnR5cGUoXCJodG1sXCIpO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgICF0aGlzLmdldChcIkVUYWdcIikgJiYgKHR5cGVvZiBjaHVuayA9PT0gXCJzdHJpbmdcIiB8fFxuICAgICAgICBjaHVuayBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpICYmXG4gICAgICAhaXNVbmRlZmluZWRcbiAgICApIHtcbiAgICAgIHRoaXMuZXRhZyhjaHVuayk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucmVxLmZyZXNoKSB7XG4gICAgICB0aGlzLnN0YXR1cyA9IDMwNDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zdGF0dXMgPT09IDIwNCB8fCB0aGlzLnN0YXR1cyA9PT0gMzA0KSB7XG4gICAgICB0aGlzLnVuc2V0KFwiQ29udGVudC1UeXBlXCIpO1xuICAgICAgdGhpcy51bnNldChcIkNvbnRlbnQtTGVuZ3RoXCIpO1xuICAgICAgdGhpcy51bnNldChcIlRyYW5zZmVyLUVuY29kaW5nXCIpO1xuXG4gICAgICBjaHVuayA9IFwiXCI7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucmVxLm1ldGhvZCA9PT0gXCJIRUFEXCIpIHtcbiAgICAgIHRoaXMuZW5kKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZW5kKGNodW5rKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFuc2ZlciB0aGUgZmlsZSBhdCB0aGUgZ2l2ZW4gYHBhdGhgLlxuICAgKlxuICAgKiBBdXRvbWF0aWNhbGx5IHNldHMgdGhlIF9Db250ZW50LVR5cGVfIHJlc3BvbnNlIGhlYWRlciBmaWVsZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGhcbiAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFJlc3BvbnNlPn1cbiAgICogQHB1YmxpY1xuICAgKi9cbiAgYXN5bmMgc2VuZEZpbGUocGF0aDogc3RyaW5nLCBvcHRpb25zOiBhbnkgPSB7fSk6IFByb21pc2U8dGhpcyB8IHZvaWQ+IHtcbiAgICBpZiAoIXBhdGgpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJwYXRoIGFyZ3VtZW50IGlzIHJlcXVpcmVkIHRvIHJlcy5zZW5kRmlsZVwiKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBwYXRoICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwicGF0aCBtdXN0IGJlIGEgc3RyaW5nIHRvIHJlcy5zZW5kRmlsZVwiKTtcbiAgICB9XG5cbiAgICBwYXRoID0gcGF0aC5zdGFydHNXaXRoKFwiZmlsZTpcIikgPyBmcm9tRmlsZVVybChwYXRoKSA6IHBhdGg7XG5cbiAgICBpZiAoIW9wdGlvbnMucm9vdCAmJiAhaXNBYnNvbHV0ZShwYXRoKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgXCJwYXRoIG11c3QgYmUgYWJzb2x1dGUgb3Igc3BlY2lmeSByb290IHRvIHJlcy5zZW5kRmlsZVwiLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBvbkRpcmVjdG9yeSA9IGFzeW5jICgpID0+IHtcbiAgICAgIGxldCBzdGF0OiBEZW5vLkZpbGVJbmZvO1xuXG4gICAgICB0cnkge1xuICAgICAgICBzdGF0ID0gYXdhaXQgRGVuby5zdGF0KHBhdGgpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJldHVybiBzZW5kRXJyb3IodGhpcywgZXJyKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgcmV0dXJuIHNlbmRFcnJvcih0aGlzKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgb3B0aW9ucy5vbkRpcmVjdG9yeSA9IG9uRGlyZWN0b3J5O1xuXG4gICAgaWYgKG9wdGlvbnMuaGVhZGVycykge1xuICAgICAgY29uc3Qgb2JqID0gb3B0aW9ucy5oZWFkZXJzO1xuICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKG9iaik7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBrID0ga2V5c1tpXTtcbiAgICAgICAgdGhpcy5zZXQoaywgb2JqW2tdKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYXdhaXQgc2VuZCh0aGlzLnJlcSBhcyBSZXF1ZXN0LCB0aGlzLCBwYXRoLCBvcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIGdpdmVuIEhUVFAgc3RhdHVzIGNvZGUuXG4gICAqXG4gICAqIFNldHMgdGhlIHJlc3BvbnNlIHN0YXR1cyB0byBgY29kZWAgYW5kIHRoZSBib2R5IG9mIHRoZVxuICAgKiByZXNwb25zZSB0byB0aGUgc3RhbmRhcmQgZGVzY3JpcHRpb24gZnJvbSBkZW5vJ3MgaHR0cF9zdGF0dXMuU1RBVFVTX1RFWFRcbiAgICogb3IgdGhlIGNvZGUgbnVtYmVyIGlmIG5vIGRlc2NyaXB0aW9uLlxuICAgKlxuICAgKiBFeGFtcGxlczpcbiAgICpcbiAgICogICAgIHJlcy5zZW5kU3RhdHVzKDIwMCk7XG4gICAqXG4gICAqIEBwYXJhbSB7U3RhdHVzfSBjb2RlXG4gICAqIEByZXR1cm4ge1Jlc3BvbnNlfSBmb3IgY2hhaW5pbmdcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgc2VuZFN0YXR1cyhjb2RlOiBTdGF0dXMpOiB0aGlzIHtcbiAgICBjb25zdCBib2R5OiBzdHJpbmcgPSBTVEFUVVNfVEVYVC5nZXQoY29kZSkgfHwgU3RyaW5nKGNvZGUpO1xuXG4gICAgdGhpcy5zZXRTdGF0dXMoY29kZSk7XG4gICAgdGhpcy50eXBlKFwidHh0XCIpO1xuXG4gICAgcmV0dXJuIHRoaXMuc2VuZChib2R5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgaGVhZGVyIGBmaWVsZGAgdG8gYHZhbHVlYCwgb3IgcGFzc1xuICAgKiBhbiBvYmplY3Qgb2YgaGVhZGVyIGZpZWxkcy5cbiAgICpcbiAgICogRXhhbXBsZXM6XG4gICAqXG4gICAqICAgICByZXMuc2V0KCdBY2NlcHQnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgKiAgICAgcmVzLnNldCh7XG4gICAqICAgICAgICdBY2NlcHQtTGFuZ3VhZ2UnOiBcImVuLVVTLCBlbjtxPTAuNVwiLFxuICAgKiAgICAgICAnQWNjZXB0JzogJ3RleHQvaHRtbCcsXG4gICAqICAgICB9KTtcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICAgKiBAcmV0dXJuIHtSZXNwb25zZX0gZm9yIGNoYWluaW5nXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIHNldChmaWVsZDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKTogdGhpcztcbiAgc2V0KG9iajogUmVjb3JkPHN0cmluZywgc3RyaW5nPik6IHRoaXM7XG4gIHNldChmaWVsZDogdW5rbm93biwgdmFsdWU/OiB1bmtub3duKTogdGhpcyB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcbiAgICAgIGNvbnN0IGxvd2VyQ2FzZUZpZWxkID0gKGZpZWxkICsgXCJcIikudG9Mb3dlckNhc2UoKTtcbiAgICAgIGNvbnN0IGNvZXJjZWRWYWwgPSB2YWx1ZSArIFwiXCI7XG5cbiAgICAgIGlmIChsb3dlckNhc2VGaWVsZCA9PT0gXCJjb250ZW50LXR5cGVcIikge1xuICAgICAgICB0aGlzLnR5cGUoY29lcmNlZFZhbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmhlYWRlcnMuc2V0KGxvd2VyQ2FzZUZpZWxkLCBjb2VyY2VkVmFsKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBmaWVsZCA9PT0gXCJvYmplY3RcIiAmJiBmaWVsZCkge1xuICAgICAgY29uc3QgZW50cmllcyA9IE9iamVjdC5lbnRyaWVzKGZpZWxkKTtcblxuICAgICAgZm9yIChjb25zdCBba2V5LCB2YWxdIG9mIGVudHJpZXMpIHtcbiAgICAgICAgdGhpcy5zZXQoa2V5LCB2YWwpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBzdGF0dXMgYGNvZGVgLlxuICAgKiBcbiAgICogVGhpcyBtZXRob2QgZGV2aWF0ZXMgZnJvbSBFeHByZXNzIGR1ZSB0byB0aGUgbmFtaW5nIGNsYXNoXG4gICAqIHdpdGggRGVuby5SZXNwb25zZSBgc3RhdHVzYCBwcm9wZXJ0eS5cbiAgICpcbiAgICogQHBhcmFtIHtTdGF0dXN9IGNvZGVcbiAgICogQHJldHVybiB7UmVzcG9uc2V9IGZvciBjaGFpbmluZ1xuICAgKiBAcHVibGljXG4gICAqL1xuICBzZXRTdGF0dXMoY29kZTogU3RhdHVzKTogdGhpcyB7XG4gICAgdGhpcy5zdGF0dXMgPSBjb2RlO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0IF9Db250ZW50LVR5cGVfIHJlc3BvbnNlIGhlYWRlciB3aXRoIGB0eXBlYC5cbiAgICpcbiAgICogRXhhbXBsZXM6XG4gICAqXG4gICAqICAgICByZXMudHlwZSgnLmh0bWwnKTtcbiAgICogICAgIHJlcy50eXBlKCdodG1sJyk7XG4gICAqICAgICByZXMudHlwZSgnanNvbicpO1xuICAgKiAgICAgcmVzLnR5cGUoJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICogICAgIHJlcy50eXBlKCdwbmcnKTtcbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlXG4gICAqIEByZXR1cm4ge1Jlc3BvbnNlfSBmb3IgY2hhaW5pbmdcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgdHlwZSh0eXBlOiBzdHJpbmcpOiB0aGlzIHtcbiAgICBjb25zdCBjdCA9IGNvbnRlbnRUeXBlKHR5cGUpIHx8IFwiYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXCI7XG4gICAgdGhpcy5oZWFkZXJzLnNldChcImNvbnRlbnQtdHlwZVwiLCBjdCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGVzIGEgaGVhZGVyLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZpZWxkXG4gICAqIEByZXR1cm4ge1Jlc3BvbnNlfSBmb3IgY2hhaW5pbmdcbiAgICogQHB1YmxpY1xuICAgKi9cbiAgdW5zZXQoZmllbGQ6IHN0cmluZyk6IHRoaXMge1xuICAgIHRoaXMuaGVhZGVycy5kZWxldGUoZmllbGQpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGBmaWVsZGAgdG8gVmFyeS4gSWYgYWxyZWFkeSBwcmVzZW50IGluIHRoZSBWYXJ5IHNldCwgdGhlblxuICAgKiB0aGlzIGNhbGwgaXMgc2ltcGx5IGlnbm9yZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7QXJyYXl8U3RyaW5nfSBmaWVsZFxuICAgKiBAcmV0dXJuIHtSZXNwb25zZX0gZm9yIGNoYWluaW5nXG4gICAqIEBwdWJsaWNcbiAgICovXG4gIHZhcnkoZmllbGQ6IHN0cmluZyB8IHN0cmluZ1tdKTogdGhpcyB7XG4gICAgdmFyeSh0aGlzLmhlYWRlcnMsIGZpZWxkKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsa0JBQWtCLFNBQVEsNkJBQStCO1NBQ3pELFNBQVMsU0FBUSxvQkFBc0I7U0FDdkMsYUFBYSxFQUFFLGNBQWMsU0FBUSx3QkFBMEI7U0FFdEUscUJBQXFCLEVBQ3JCLDJC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