// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// Structured similarly to Go's cookie.go
// https://github.com/golang/go/blob/master/src/net/http/cookie.go
import { assert } from "../_util/assert.ts";
import { toIMF } from "../datetime/mod.ts";
const FIELD_CONTENT_REGEXP = /^(?=[\x20-\x7E]*$)[^()@<>,;:\\"\[\]?={}\s]+$/;
function toString(cookie) {
    if (!cookie.name) {
        return "";
    }
    const out = [];
    validateCookieName(cookie.name);
    validateCookieValue(cookie.name, cookie.value);
    out.push(`${cookie.name}=${cookie.value}`);
    // Fallback for invalid Set-Cookie
    // ref: https://tools.ietf.org/html/draft-ietf-httpbis-cookie-prefixes-00#section-3.1
    if (cookie.name.startsWith("__Secure")) {
        cookie.secure = true;
    }
    if (cookie.name.startsWith("__Host")) {
        cookie.path = "/";
        cookie.secure = true;
        delete cookie.domain;
    }
    if (cookie.secure) {
        out.push("Secure");
    }
    if (cookie.httpOnly) {
        out.push("HttpOnly");
    }
    if (typeof cookie.maxAge === "number" && Number.isInteger(cookie.maxAge)) {
        assert(cookie.maxAge > 0, "Max-Age must be an integer superior to 0");
        out.push(`Max-Age=${cookie.maxAge}`);
    }
    if (cookie.domain) {
        out.push(`Domain=${cookie.domain}`);
    }
    if (cookie.sameSite) {
        out.push(`SameSite=${cookie.sameSite}`);
    }
    if (cookie.path) {
        validatePath(cookie.path);
        out.push(`Path=${cookie.path}`);
    }
    if (cookie.expires) {
        const dateString = toIMF(cookie.expires);
        out.push(`Expires=${dateString}`);
    }
    if (cookie.unparsed) {
        out.push(cookie.unparsed.join("; "));
    }
    return out.join("; ");
}
/**
 * Validate Cookie Name.
 * @param name Cookie name.
 */ function validateCookieName(name) {
    if (name && !FIELD_CONTENT_REGEXP.test(name)) {
        throw new TypeError(`Invalid cookie name: "${name}".`);
    }
}
/**
 * Validate Path Value.
 * @see https://tools.ietf.org/html/rfc6265#section-4.1.2.4
 * @param path Path value.
 */ function validatePath(path) {
    if (path == null) {
        return;
    }
    for(let i = 0; i < path.length; i++){
        const c = path.charAt(i);
        if (c < String.fromCharCode(32) || c > String.fromCharCode(126) || c == ";") {
            throw new Error(path + ": Invalid cookie path char '" + c + "'");
        }
    }
}
/**
 *Validate Cookie Value.
 * @see https://tools.ietf.org/html/rfc6265#section-4.1
 * @param value Cookie value.
 */ function validateCookieValue(name, value) {
    if (value == null || name == null) return;
    for(let i = 0; i < value.length; i++){
        const c = value.charAt(i);
        if (c < String.fromCharCode(33) || c == String.fromCharCode(34) || c == String.fromCharCode(44) || c == String.fromCharCode(59) || c == String.fromCharCode(92) || c == String.fromCharCode(127)) {
            throw new Error("RFC2616 cookie '" + name + "' cannot have '" + c + "' as value");
        }
        if (c > String.fromCharCode(128)) {
            throw new Error("RFC2616 cookie '" + name + "' can only have US-ASCII chars as value" + c.charCodeAt(0).toString(16));
        }
    }
}
/**
 * Parse the cookies of the Server Request
 * @param req An object which has a `headers` property
 */ export function getCookies(req) {
    const cookie = req.headers.get("Cookie");
    if (cookie != null) {
        const out = {
        };
        const c = cookie.split(";");
        for (const kv of c){
            const [cookieKey, ...cookieVal] = kv.split("=");
            assert(cookieKey != null);
            const key = cookieKey.trim();
            out[key] = cookieVal.join("=");
        }
        return out;
    }
    return {
    };
}
/**
 * Set the cookie header properly in the Response
 * @param res An object which has a headers property
 * @param cookie Cookie to set
 *
 * Example:
 *
 * ```ts
 * setCookie(response, { name: 'deno', value: 'runtime',
 *   httpOnly: true, secure: true, maxAge: 2, domain: "deno.land" });
 * ```
 */ export function setCookie(res, cookie) {
    if (!res.headers) {
        res.headers = new Headers();
    }
    // TODO(zekth) : Add proper parsing of Set-Cookie headers
    // Parsing cookie headers to make consistent set-cookie header
    // ref: https://tools.ietf.org/html/rfc6265#section-4.1.1
    const v = toString(cookie);
    if (v) {
        res.headers.append("Set-Cookie", v);
    }
}
/**
 *  Set the cookie header properly in the Response to delete it
 * @param res Server Response
 * @param name Name of the cookie to Delete
 * Example:
 *
 *     deleteCookie(res,'foo');
 */ export function deleteCookie(res, name) {
    setCookie(res, {
        name: name,
        value: "",
        expires: new Date(0)
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45NS4wL2h0dHAvY29va2llLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gU3RydWN0dXJlZCBzaW1pbGFybHkgdG8gR28ncyBjb29raWUuZ29cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9nb2xhbmcvZ28vYmxvYi9tYXN0ZXIvc3JjL25ldC9odHRwL2Nvb2tpZS5nb1xuaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcIi4uL191dGlsL2Fzc2VydC50c1wiO1xuaW1wb3J0IHsgdG9JTUYgfSBmcm9tIFwiLi4vZGF0ZXRpbWUvbW9kLnRzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29va2llIHtcbiAgLyoqIE5hbWUgb2YgdGhlIGNvb2tpZS4gKi9cbiAgbmFtZTogc3RyaW5nO1xuICAvKiogVmFsdWUgb2YgdGhlIGNvb2tpZS4gKi9cbiAgdmFsdWU6IHN0cmluZztcbiAgLyoqIEV4cGlyYXRpb24gZGF0ZSBvZiB0aGUgY29va2llLiAqL1xuICBleHBpcmVzPzogRGF0ZTtcbiAgLyoqIE1heC1BZ2Ugb2YgdGhlIENvb2tpZS4gTXVzdCBiZSBpbnRlZ2VyIHN1cGVyaW9yIHRvIDAuICovXG4gIG1heEFnZT86IG51bWJlcjtcbiAgLyoqIFNwZWNpZmllcyB0aG9zZSBob3N0cyB0byB3aGljaCB0aGUgY29va2llIHdpbGwgYmUgc2VudC4gKi9cbiAgZG9tYWluPzogc3RyaW5nO1xuICAvKiogSW5kaWNhdGVzIGEgVVJMIHBhdGggdGhhdCBtdXN0IGV4aXN0IGluIHRoZSByZXF1ZXN0LiAqL1xuICBwYXRoPzogc3RyaW5nO1xuICAvKiogSW5kaWNhdGVzIGlmIHRoZSBjb29raWUgaXMgbWFkZSB1c2luZyBTU0wgJiBIVFRQUy4gKi9cbiAgc2VjdXJlPzogYm9vbGVhbjtcbiAgLyoqIEluZGljYXRlcyB0aGF0IGNvb2tpZSBpcyBub3QgYWNjZXNzaWJsZSB2aWEgSmF2YVNjcmlwdC4gKiovXG4gIGh0dHBPbmx5PzogYm9vbGVhbjtcbiAgLyoqIEFsbG93cyBzZXJ2ZXJzIHRvIGFzc2VydCB0aGF0IGEgY29va2llIG91Z2h0IG5vdCB0b1xuICAgKiBiZSBzZW50IGFsb25nIHdpdGggY3Jvc3Mtc2l0ZSByZXF1ZXN0cy4gKi9cbiAgc2FtZVNpdGU/OiBcIlN0cmljdFwiIHwgXCJMYXhcIiB8IFwiTm9uZVwiO1xuICAvKiogQWRkaXRpb25hbCBrZXkgdmFsdWUgcGFpcnMgd2l0aCB0aGUgZm9ybSBcImtleT12YWx1ZVwiICovXG4gIHVucGFyc2VkPzogc3RyaW5nW107XG59XG5cbmNvbnN0IEZJRUxEX0NPTlRFTlRfUkVHRVhQID0gL14oPz1bXFx4MjAtXFx4N0VdKiQpW14oKUA8Piw7OlxcXFxcIlxcW1xcXT89e31cXHNdKyQvO1xuXG5mdW5jdGlvbiB0b1N0cmluZyhjb29raWU6IENvb2tpZSk6IHN0cmluZyB7XG4gIGlmICghY29va2llLm5hbWUpIHtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxuICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG4gIHZhbGlkYXRlQ29va2llTmFtZShjb29raWUubmFtZSk7XG4gIHZhbGlkYXRlQ29va2llVmFsdWUoY29va2llLm5hbWUsIGNvb2tpZS52YWx1ZSk7XG4gIG91dC5wdXNoKGAke2Nvb2tpZS5uYW1lfT0ke2Nvb2tpZS52YWx1ZX1gKTtcblxuICAvLyBGYWxsYmFjayBmb3IgaW52YWxpZCBTZXQtQ29va2llXG4gIC8vIHJlZjogaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL2RyYWZ0LWlldGYtaHR0cGJpcy1jb29raWUtcHJlZml4ZXMtMDAjc2VjdGlvbi0zLjFcbiAgaWYgKGNvb2tpZS5uYW1lLnN0YXJ0c1dpdGgoXCJfX1NlY3VyZVwiKSkge1xuICAgIGNvb2tpZS5zZWN1cmUgPSB0cnVlO1xuICB9XG4gIGlmIChjb29raWUubmFtZS5zdGFydHNXaXRoKFwiX19Ib3N0XCIpKSB7XG4gICAgY29va2llLnBhdGggPSBcIi9cIjtcbiAgICBjb29raWUuc2VjdXJlID0gdHJ1ZTtcbiAgICBkZWxldGUgY29va2llLmRvbWFpbjtcbiAgfVxuXG4gIGlmIChjb29raWUuc2VjdXJlKSB7XG4gICAgb3V0LnB1c2goXCJTZWN1cmVcIik7XG4gIH1cbiAgaWYgKGNvb2tpZS5odHRwT25seSkge1xuICAgIG91dC5wdXNoKFwiSHR0cE9ubHlcIik7XG4gIH1cbiAgaWYgKHR5cGVvZiBjb29raWUubWF4QWdlID09PSBcIm51bWJlclwiICYmIE51bWJlci5pc0ludGVnZXIoY29va2llLm1heEFnZSkpIHtcbiAgICBhc3NlcnQoY29va2llLm1heEFnZSA+IDAsIFwiTWF4LUFnZSBtdXN0IGJlIGFuIGludGVnZXIgc3VwZXJpb3IgdG8gMFwiKTtcbiAgICBvdXQucHVzaChgTWF4LUFnZT0ke2Nvb2tpZS5tYXhBZ2V9YCk7XG4gIH1cbiAgaWYgKGNvb2tpZS5kb21haW4pIHtcbiAgICBvdXQucHVzaChgRG9tYWluPSR7Y29va2llLmRvbWFpbn1gKTtcbiAgfVxuICBpZiAoY29va2llLnNhbWVTaXRlKSB7XG4gICAgb3V0LnB1c2goYFNhbWVTaXRlPSR7Y29va2llLnNhbWVTaXRlfWApO1xuICB9XG4gIGlmIChjb29raWUucGF0aCkge1xuICAgIHZhbGlkYXRlUGF0aChjb29raWUucGF0aCk7XG4gICAgb3V0LnB1c2goYFBhdGg9JHtjb29raWUucGF0aH1gKTtcbiAgfVxuICBpZiAoY29va2llLmV4cGlyZXMpIHtcbiAgICBjb25zdCBkYXRlU3RyaW5nID0gdG9JTUYoY29va2llLmV4cGlyZXMpO1xuICAgIG91dC5wdXNoKGBFeHBpcmVzPSR7ZGF0ZVN0cmluZ31gKTtcbiAgfVxuICBpZiAoY29va2llLnVucGFyc2VkKSB7XG4gICAgb3V0LnB1c2goY29va2llLnVucGFyc2VkLmpvaW4oXCI7IFwiKSk7XG4gIH1cbiAgcmV0dXJuIG91dC5qb2luKFwiOyBcIik7XG59XG5cbi8qKlxuICogVmFsaWRhdGUgQ29va2llIE5hbWUuXG4gKiBAcGFyYW0gbmFtZSBDb29raWUgbmFtZS5cbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVDb29raWVOYW1lKG5hbWU6IHN0cmluZyB8IHVuZGVmaW5lZCB8IG51bGwpOiB2b2lkIHtcbiAgaWYgKG5hbWUgJiYgIUZJRUxEX0NPTlRFTlRfUkVHRVhQLnRlc3QobmFtZSkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBJbnZhbGlkIGNvb2tpZSBuYW1lOiBcIiR7bmFtZX1cIi5gKTtcbiAgfVxufVxuXG4vKipcbiAqIFZhbGlkYXRlIFBhdGggVmFsdWUuXG4gKiBAc2VlIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmM2MjY1I3NlY3Rpb24tNC4xLjIuNFxuICogQHBhcmFtIHBhdGggUGF0aCB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVQYXRoKHBhdGg6IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcbiAgaWYgKHBhdGggPT0gbnVsbCkge1xuICAgIHJldHVybjtcbiAgfVxuICBmb3IgKGxldCBpID0gMDsgaSA8IHBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjID0gcGF0aC5jaGFyQXQoaSk7XG4gICAgaWYgKFxuICAgICAgYyA8IFN0cmluZy5mcm9tQ2hhckNvZGUoMHgyMCkgfHwgYyA+IFN0cmluZy5mcm9tQ2hhckNvZGUoMHg3RSkgfHwgYyA9PSBcIjtcIlxuICAgICkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBwYXRoICsgXCI6IEludmFsaWQgY29va2llIHBhdGggY2hhciAnXCIgKyBjICsgXCInXCIsXG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqVmFsaWRhdGUgQ29va2llIFZhbHVlLlxuICogQHNlZSBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjNjI2NSNzZWN0aW9uLTQuMVxuICogQHBhcmFtIHZhbHVlIENvb2tpZSB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVDb29raWVWYWx1ZShuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gIGlmICh2YWx1ZSA9PSBudWxsIHx8IG5hbWUgPT0gbnVsbCkgcmV0dXJuO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYyA9IHZhbHVlLmNoYXJBdChpKTtcbiAgICBpZiAoXG4gICAgICBjIDwgU3RyaW5nLmZyb21DaGFyQ29kZSgweDIxKSB8fCBjID09IFN0cmluZy5mcm9tQ2hhckNvZGUoMHgyMikgfHxcbiAgICAgIGMgPT0gU3RyaW5nLmZyb21DaGFyQ29kZSgweDJjKSB8fCBjID09IFN0cmluZy5mcm9tQ2hhckNvZGUoMHgzYikgfHxcbiAgICAgIGMgPT0gU3RyaW5nLmZyb21DaGFyQ29kZSgweDVjKSB8fCBjID09IFN0cmluZy5mcm9tQ2hhckNvZGUoMHg3ZilcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJSRkMyNjE2IGNvb2tpZSAnXCIgKyBuYW1lICsgXCInIGNhbm5vdCBoYXZlICdcIiArIGMgKyBcIicgYXMgdmFsdWVcIixcbiAgICAgICk7XG4gICAgfVxuICAgIGlmIChjID4gU3RyaW5nLmZyb21DaGFyQ29kZSgweDgwKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBcIlJGQzI2MTYgY29va2llICdcIiArIG5hbWUgKyBcIicgY2FuIG9ubHkgaGF2ZSBVUy1BU0NJSSBjaGFycyBhcyB2YWx1ZVwiICtcbiAgICAgICAgICBjLmNoYXJDb2RlQXQoMCkudG9TdHJpbmcoMTYpLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgY29va2llcyBvZiB0aGUgU2VydmVyIFJlcXVlc3RcbiAqIEBwYXJhbSByZXEgQW4gb2JqZWN0IHdoaWNoIGhhcyBhIGBoZWFkZXJzYCBwcm9wZXJ0eVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29va2llcyhyZXE6IHsgaGVhZGVyczogSGVhZGVycyB9KTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB7XG4gIGNvbnN0IGNvb2tpZSA9IHJlcS5oZWFkZXJzLmdldChcIkNvb2tpZVwiKTtcbiAgaWYgKGNvb2tpZSAhPSBudWxsKSB7XG4gICAgY29uc3Qgb3V0OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gICAgY29uc3QgYyA9IGNvb2tpZS5zcGxpdChcIjtcIik7XG4gICAgZm9yIChjb25zdCBrdiBvZiBjKSB7XG4gICAgICBjb25zdCBbY29va2llS2V5LCAuLi5jb29raWVWYWxdID0ga3Yuc3BsaXQoXCI9XCIpO1xuICAgICAgYXNzZXJ0KGNvb2tpZUtleSAhPSBudWxsKTtcbiAgICAgIGNvbnN0IGtleSA9IGNvb2tpZUtleS50cmltKCk7XG4gICAgICBvdXRba2V5XSA9IGNvb2tpZVZhbC5qb2luKFwiPVwiKTtcbiAgICB9XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuICByZXR1cm4ge307XG59XG5cbi8qKlxuICogU2V0IHRoZSBjb29raWUgaGVhZGVyIHByb3Blcmx5IGluIHRoZSBSZXNwb25zZVxuICogQHBhcmFtIHJlcyBBbiBvYmplY3Qgd2hpY2ggaGFzIGEgaGVhZGVycyBwcm9wZXJ0eVxuICogQHBhcmFtIGNvb2tpZSBDb29raWUgdG8gc2V0XG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGB0c1xuICogc2V0Q29va2llKHJlc3BvbnNlLCB7IG5hbWU6ICdkZW5vJywgdmFsdWU6ICdydW50aW1lJyxcbiAqICAgaHR0cE9ubHk6IHRydWUsIHNlY3VyZTogdHJ1ZSwgbWF4QWdlOiAyLCBkb21haW46IFwiZGVuby5sYW5kXCIgfSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldENvb2tpZShyZXM6IHsgaGVhZGVycz86IEhlYWRlcnMgfSwgY29va2llOiBDb29raWUpOiB2b2lkIHtcbiAgaWYgKCFyZXMuaGVhZGVycykge1xuICAgIHJlcy5oZWFkZXJzID0gbmV3IEhlYWRlcnMoKTtcbiAgfVxuICAvLyBUT0RPKHpla3RoKSA6IEFkZCBwcm9wZXIgcGFyc2luZyBvZiBTZXQtQ29va2llIGhlYWRlcnNcbiAgLy8gUGFyc2luZyBjb29raWUgaGVhZGVycyB0byBtYWtlIGNvbnNpc3RlbnQgc2V0LWNvb2tpZSBoZWFkZXJcbiAgLy8gcmVmOiBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjNjI2NSNzZWN0aW9uLTQuMS4xXG4gIGNvbnN0IHYgPSB0b1N0cmluZyhjb29raWUpO1xuICBpZiAodikge1xuICAgIHJlcy5oZWFkZXJzLmFwcGVuZChcIlNldC1Db29raWVcIiwgdik7XG4gIH1cbn1cblxuLyoqXG4gKiAgU2V0IHRoZSBjb29raWUgaGVhZGVyIHByb3Blcmx5IGluIHRoZSBSZXNwb25zZSB0byBkZWxldGUgaXRcbiAqIEBwYXJhbSByZXMgU2VydmVyIFJlc3BvbnNlXG4gKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBjb29raWUgdG8gRGVsZXRlXG4gKiBFeGFtcGxlOlxuICpcbiAqICAgICBkZWxldGVDb29raWUocmVzLCdmb28nKTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlbGV0ZUNvb2tpZShyZXM6IHsgaGVhZGVycz86IEhlYWRlcnMgfSwgbmFtZTogc3RyaW5nKTogdm9pZCB7XG4gIHNldENvb2tpZShyZXMsIHtcbiAgICBuYW1lOiBuYW1lLFxuICAgIHZhbHVlOiBcIlwiLFxuICAgIGV4cGlyZXM6IG5ldyBEYXRlKDApLFxuICB9KTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUEwRSxBQUExRSx3RUFBMEU7QUFDMUUsRUFBeUMsQUFBekMsdUNBQXlDO0FBQ3pDLEVBQWtFLEFBQWxFLGdFQUFrRTtTQUN6RCxNQUFNLFNBQVEsa0JBQW9CO1NBQ2xDLEtBQUssU0FBUSxrQkFBb0I7TUEwQnBDLG9CQUFvQjtTQUVqQixRQUFRLENBQUMsTUFBYztTQUN6QixNQUFNLENBQUMsSUFBSTs7O1VBR1YsR0FBRztJQUNULGtC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