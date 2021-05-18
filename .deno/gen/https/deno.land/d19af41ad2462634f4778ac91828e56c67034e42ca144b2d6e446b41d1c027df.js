import { pathToRegexp } from "../utils/pathToRegex.ts";
export const Layer = function Layer(path, options = {
}, fn) {
    if (!(this instanceof Layer)) {
        return new Layer(path, options, fn);
    }
    this.handle = fn;
    this.name = fn.name || "<anonymous>";
    this.params = undefined;
    this.path = undefined;
    this.regexp = pathToRegexp(path, this.keys = [], options);
    // set fast path flags
    (this).regexp.fast_star = path === "*";
    this.regexp.fast_slash = path === "/" && options.end === false;
};
/**
 * Handle the error for the layer.
 *
 * @param {Error|string} error
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @private
 */ Layer.prototype.handle_error = async function handle_error(error, req, res, next) {
    let fn = this.handle;
    if (fn.length !== 4) {
        // not a standard error handler
        return next(error);
    }
    try {
        await fn(error, req, res, next);
    } catch (err) {
        next(err);
    }
};
/**
 * Handle the request for the layer.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @private
 */ Layer.prototype.handle_request = async function handle(req, res, next) {
    let fn = this.handle;
    if (fn.length > 3) {
        // not a standard request handler
        return next();
    }
    try {
        await fn(req, res, next);
    } catch (err) {
        next(err);
    }
};
/**
 * Check if this route matches `path`, if so
 * populate `.params`.
 *
 * @param {String} path
 * @return {Boolean}
 * @private
 */ Layer.prototype.match = function match(path) {
    let match;
    if (path != null) {
        // fast path non-ending match for / (any path matches)
        if (this.regexp.fast_slash) {
            this.params = {
            };
            this.path = "";
            return true;
        }
        // fast path for * (everything matched in a param)
        if (this.regexp.fast_star) {
            this.params = {
                "0": decode_param(path)
            };
            this.path = path;
            return true;
        }
        // match the path
        match = this.regexp.exec(path);
    }
    if (!match) {
        this.params = undefined;
        this.path = undefined;
        return false;
    }
    // store values
    this.params = {
    };
    this.path = match[0];
    let keys = this.keys;
    let params = this.params;
    for(let i = 1; i < match.length; i++){
        let key = keys[i - 1];
        let prop = key.name;
        let val = decode_param(match[i]);
        if (val !== undefined || !Object.prototype.hasOwnProperty.call(params, prop)) {
            params[prop] = val;
        }
    }
    return true;
};
/**
 * Decode param value.
 *
 * @param {string} val
 * @return {string}
 * @private
 */ function decode_param(val) {
    if (typeof val !== "string" || val.length === 0) {
        return val;
    }
    try {
        return decodeURIComponent(val);
    } catch (err) {
        if (err instanceof URIError) {
            err.message = "Failed to decode param '" + val + "'";
            err.status = 400;
        }
        throw err;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy9yb3V0ZXIvbGF5ZXIudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHBhdGhUb1JlZ2V4cCB9IGZyb20gXCIuLi91dGlscy9wYXRoVG9SZWdleC50c1wiO1xuaW1wb3J0IHR5cGUgeyBOZXh0RnVuY3Rpb24sIFJlcXVlc3QsIFJlc3BvbnNlIH0gZnJvbSBcIi4uL3R5cGVzLnRzXCI7XG5cbmV4cG9ydCBjb25zdCBMYXllcjogYW55ID0gZnVuY3Rpb24gTGF5ZXIoXG4gIHRoaXM6IGFueSxcbiAgcGF0aDogYW55LFxuICBvcHRpb25zOiBhbnkgPSB7fSxcbiAgZm46IGFueSxcbikge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgTGF5ZXIpKSB7XG4gICAgcmV0dXJuIG5ldyAoTGF5ZXIgYXMgYW55KShwYXRoLCBvcHRpb25zLCBmbik7XG4gIH1cblxuICAodGhpcyBhcyBhbnkpLmhhbmRsZSA9IGZuO1xuICAodGhpcyBhcyBhbnkpLm5hbWUgPSBmbi5uYW1lIHx8IFwiPGFub255bW91cz5cIjtcbiAgKHRoaXMgYXMgYW55KS5wYXJhbXMgPSB1bmRlZmluZWQ7XG4gICh0aGlzIGFzIGFueSkucGF0aCA9IHVuZGVmaW5lZDtcbiAgKHRoaXMgYXMgYW55KS5yZWdleHAgPSBwYXRoVG9SZWdleHAocGF0aCwgKHRoaXMgYXMgYW55KS5rZXlzID0gW10sIG9wdGlvbnMpO1xuXG4gIC8vIHNldCBmYXN0IHBhdGggZmxhZ3NcbiAgKHRoaXMgYXMgYW55KS5yZWdleHAuZmFzdF9zdGFyID0gcGF0aCA9PT0gXCIqXCI7XG4gICh0aGlzIGFzIGFueSkucmVnZXhwLmZhc3Rfc2xhc2ggPSBwYXRoID09PSBcIi9cIiAmJiBvcHRpb25zLmVuZCA9PT0gZmFsc2U7XG59O1xuXG4vKipcbiAqIEhhbmRsZSB0aGUgZXJyb3IgZm9yIHRoZSBsYXllci5cbiAqXG4gKiBAcGFyYW0ge0Vycm9yfHN0cmluZ30gZXJyb3JcbiAqIEBwYXJhbSB7UmVxdWVzdH0gcmVxXG4gKiBAcGFyYW0ge1Jlc3BvbnNlfSByZXNcbiAqIEBwYXJhbSB7TmV4dEZ1bmN0aW9ufSBuZXh0XG4gKiBAcHJpdmF0ZVxuICovXG5cbkxheWVyLnByb3RvdHlwZS5oYW5kbGVfZXJyb3IgPSBhc3luYyBmdW5jdGlvbiBoYW5kbGVfZXJyb3IoXG4gIGVycm9yOiBhbnksXG4gIHJlcTogUmVxdWVzdCxcbiAgcmVzOiBSZXNwb25zZSxcbiAgbmV4dDogTmV4dEZ1bmN0aW9uLFxuKSB7XG4gIGxldCBmbiA9IHRoaXMuaGFuZGxlO1xuXG4gIGlmIChmbi5sZW5ndGggIT09IDQpIHtcbiAgICAvLyBub3QgYSBzdGFuZGFyZCBlcnJvciBoYW5kbGVyXG4gICAgcmV0dXJuIG5leHQoZXJyb3IpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCBmbihlcnJvciwgcmVxLCByZXMsIG5leHQpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBuZXh0KGVycik7XG4gIH1cbn07XG5cbi8qKlxuICogSGFuZGxlIHRoZSByZXF1ZXN0IGZvciB0aGUgbGF5ZXIuXG4gKlxuICogQHBhcmFtIHtSZXF1ZXN0fSByZXFcbiAqIEBwYXJhbSB7UmVzcG9uc2V9IHJlc1xuICogQHBhcmFtIHtOZXh0RnVuY3Rpb259IG5leHRcbiAqIEBwcml2YXRlXG4gKi9cbkxheWVyLnByb3RvdHlwZS5oYW5kbGVfcmVxdWVzdCA9IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZShcbiAgcmVxOiBSZXF1ZXN0LFxuICByZXM6IFJlc3BvbnNlLFxuICBuZXh0OiBOZXh0RnVuY3Rpb24sXG4pIHtcbiAgbGV0IGZuID0gdGhpcy5oYW5kbGU7XG5cbiAgaWYgKGZuLmxlbmd0aCA+IDMpIHtcbiAgICAvLyBub3QgYSBzdGFuZGFyZCByZXF1ZXN0IGhhbmRsZXJcbiAgICByZXR1cm4gbmV4dCgpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCBmbihyZXEsIHJlcywgbmV4dCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIG5leHQoZXJyKTtcbiAgfVxufTtcblxuLyoqXG4gKiBDaGVjayBpZiB0aGlzIHJvdXRlIG1hdGNoZXMgYHBhdGhgLCBpZiBzb1xuICogcG9wdWxhdGUgYC5wYXJhbXNgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQHByaXZhdGVcbiAqL1xuTGF5ZXIucHJvdG90eXBlLm1hdGNoID0gZnVuY3Rpb24gbWF0Y2gocGF0aDogYW55KSB7XG4gIGxldCBtYXRjaDtcblxuICBpZiAocGF0aCAhPSBudWxsKSB7XG4gICAgLy8gZmFzdCBwYXRoIG5vbi1lbmRpbmcgbWF0Y2ggZm9yIC8gKGFueSBwYXRoIG1hdGNoZXMpXG4gICAgaWYgKHRoaXMucmVnZXhwLmZhc3Rfc2xhc2gpIHtcbiAgICAgIHRoaXMucGFyYW1zID0ge307XG4gICAgICB0aGlzLnBhdGggPSBcIlwiO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLy8gZmFzdCBwYXRoIGZvciAqIChldmVyeXRoaW5nIG1hdGNoZWQgaW4gYSBwYXJhbSlcbiAgICBpZiAodGhpcy5yZWdleHAuZmFzdF9zdGFyKSB7XG4gICAgICB0aGlzLnBhcmFtcyA9IHsgXCIwXCI6IGRlY29kZV9wYXJhbShwYXRoKSB9O1xuICAgICAgdGhpcy5wYXRoID0gcGF0aDtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vIG1hdGNoIHRoZSBwYXRoXG4gICAgbWF0Y2ggPSB0aGlzLnJlZ2V4cC5leGVjKHBhdGgpO1xuICB9XG5cbiAgaWYgKCFtYXRjaCkge1xuICAgIHRoaXMucGFyYW1zID0gdW5kZWZpbmVkO1xuICAgIHRoaXMucGF0aCA9IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBzdG9yZSB2YWx1ZXNcbiAgdGhpcy5wYXJhbXMgPSB7fTtcbiAgdGhpcy5wYXRoID0gbWF0Y2hbMF07XG5cbiAgbGV0IGtleXMgPSB0aGlzLmtleXM7XG4gIGxldCBwYXJhbXMgPSB0aGlzLnBhcmFtcztcblxuICBmb3IgKGxldCBpID0gMTsgaSA8IG1hdGNoLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGtleSA9IGtleXNbaSAtIDFdO1xuICAgIGxldCBwcm9wID0ga2V5Lm5hbWU7XG4gICAgbGV0IHZhbCA9IGRlY29kZV9wYXJhbShtYXRjaFtpXSk7XG5cbiAgICBpZiAoXG4gICAgICB2YWwgIT09IHVuZGVmaW5lZCB8fFxuICAgICAgIShPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocGFyYW1zLCBwcm9wKSlcbiAgICApIHtcbiAgICAgIHBhcmFtc1twcm9wXSA9IHZhbDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogRGVjb2RlIHBhcmFtIHZhbHVlLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWxcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGRlY29kZV9wYXJhbSh2YWw6IGFueSkge1xuICBpZiAodHlwZW9mIHZhbCAhPT0gXCJzdHJpbmdcIiB8fCB2YWwubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIHZhbDtcbiAgfVxuXG4gIHRyeSB7XG4gICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudCh2YWwpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoZXJyIGluc3RhbmNlb2YgVVJJRXJyb3IpIHtcbiAgICAgIGVyci5tZXNzYWdlID0gXCJGYWlsZWQgdG8gZGVjb2RlIHBhcmFtICdcIiArIHZhbCArIFwiJ1wiO1xuICAgICAgKGVyciBhcyBhbnkpLnN0YXR1cyA9IDQwMDtcbiAgICB9XG5cbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxZQUFZLFNBQVEsdUJBQXlCO2FBR3pDLEtBQUssWUFBaUIsS0FBSyxDQUV0QyxJQUFTLEVBQ1QsT0FBWTtHQUNaLEVBQU87MEJBRWUsS0FBSztt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