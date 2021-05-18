// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
// Structured similarly to Go's cookie.go
// https://github.com/golang/go/blob/master/src/net/http/cookie.go
import { assert } from "../_util/assert.ts";
import { toIMF } from "../datetime/mod.ts";
function toString(cookie) {
    if (!cookie.name) {
        return "";
    }
    const out = [];
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
    // TODO (zekth) : Add proper parsing of Set-Cookie headers
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC42OS4wL2h0dHAvY29va2llLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIwIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gU3RydWN0dXJlZCBzaW1pbGFybHkgdG8gR28ncyBjb29raWUuZ29cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9nb2xhbmcvZ28vYmxvYi9tYXN0ZXIvc3JjL25ldC9odHRwL2Nvb2tpZS5nb1xuaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcIi4uL191dGlsL2Fzc2VydC50c1wiO1xuaW1wb3J0IHsgdG9JTUYgfSBmcm9tIFwiLi4vZGF0ZXRpbWUvbW9kLnRzXCI7XG5cbmV4cG9ydCB0eXBlIENvb2tpZXMgPSBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuXG5leHBvcnQgaW50ZXJmYWNlIENvb2tpZSB7XG4gIC8qKiBOYW1lIG9mIHRoZSBjb29raWUuICovXG4gIG5hbWU6IHN0cmluZztcbiAgLyoqIFZhbHVlIG9mIHRoZSBjb29raWUuICovXG4gIHZhbHVlOiBzdHJpbmc7XG4gIC8qKiBFeHBpcmF0aW9uIGRhdGUgb2YgdGhlIGNvb2tpZS4gKi9cbiAgZXhwaXJlcz86IERhdGU7XG4gIC8qKiBNYXgtQWdlIG9mIHRoZSBDb29raWUuIE11c3QgYmUgaW50ZWdlciBzdXBlcmlvciB0byAwLiAqL1xuICBtYXhBZ2U/OiBudW1iZXI7XG4gIC8qKiBTcGVjaWZpZXMgdGhvc2UgaG9zdHMgdG8gd2hpY2ggdGhlIGNvb2tpZSB3aWxsIGJlIHNlbnQuICovXG4gIGRvbWFpbj86IHN0cmluZztcbiAgLyoqIEluZGljYXRlcyBhIFVSTCBwYXRoIHRoYXQgbXVzdCBleGlzdCBpbiB0aGUgcmVxdWVzdC4gKi9cbiAgcGF0aD86IHN0cmluZztcbiAgLyoqIEluZGljYXRlcyBpZiB0aGUgY29va2llIGlzIG1hZGUgdXNpbmcgU1NMICYgSFRUUFMuICovXG4gIHNlY3VyZT86IGJvb2xlYW47XG4gIC8qKiBJbmRpY2F0ZXMgdGhhdCBjb29raWUgaXMgbm90IGFjY2Vzc2libGUgdmlhIEphdmFTY3JpcHQuICoqL1xuICBodHRwT25seT86IGJvb2xlYW47XG4gIC8qKiBBbGxvd3Mgc2VydmVycyB0byBhc3NlcnQgdGhhdCBhIGNvb2tpZSBvdWdodCBub3QgdG9cbiAgICogYmUgc2VudCBhbG9uZyB3aXRoIGNyb3NzLXNpdGUgcmVxdWVzdHMuICovXG4gIHNhbWVTaXRlPzogU2FtZVNpdGU7XG4gIC8qKiBBZGRpdGlvbmFsIGtleSB2YWx1ZSBwYWlycyB3aXRoIHRoZSBmb3JtIFwia2V5PXZhbHVlXCIgKi9cbiAgdW5wYXJzZWQ/OiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IHR5cGUgU2FtZVNpdGUgPSBcIlN0cmljdFwiIHwgXCJMYXhcIiB8IFwiTm9uZVwiO1xuXG5mdW5jdGlvbiB0b1N0cmluZyhjb29raWU6IENvb2tpZSk6IHN0cmluZyB7XG4gIGlmICghY29va2llLm5hbWUpIHtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxuICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG4gIG91dC5wdXNoKGAke2Nvb2tpZS5uYW1lfT0ke2Nvb2tpZS52YWx1ZX1gKTtcblxuICAvLyBGYWxsYmFjayBmb3IgaW52YWxpZCBTZXQtQ29va2llXG4gIC8vIHJlZjogaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL2RyYWZ0LWlldGYtaHR0cGJpcy1jb29raWUtcHJlZml4ZXMtMDAjc2VjdGlvbi0zLjFcbiAgaWYgKGNvb2tpZS5uYW1lLnN0YXJ0c1dpdGgoXCJfX1NlY3VyZVwiKSkge1xuICAgIGNvb2tpZS5zZWN1cmUgPSB0cnVlO1xuICB9XG4gIGlmIChjb29raWUubmFtZS5zdGFydHNXaXRoKFwiX19Ib3N0XCIpKSB7XG4gICAgY29va2llLnBhdGggPSBcIi9cIjtcbiAgICBjb29raWUuc2VjdXJlID0gdHJ1ZTtcbiAgICBkZWxldGUgY29va2llLmRvbWFpbjtcbiAgfVxuXG4gIGlmIChjb29raWUuc2VjdXJlKSB7XG4gICAgb3V0LnB1c2goXCJTZWN1cmVcIik7XG4gIH1cbiAgaWYgKGNvb2tpZS5odHRwT25seSkge1xuICAgIG91dC5wdXNoKFwiSHR0cE9ubHlcIik7XG4gIH1cbiAgaWYgKHR5cGVvZiBjb29raWUubWF4QWdlID09PSBcIm51bWJlclwiICYmIE51bWJlci5pc0ludGVnZXIoY29va2llLm1heEFnZSkpIHtcbiAgICBhc3NlcnQoY29va2llLm1heEFnZSA+IDAsIFwiTWF4LUFnZSBtdXN0IGJlIGFuIGludGVnZXIgc3VwZXJpb3IgdG8gMFwiKTtcbiAgICBvdXQucHVzaChgTWF4LUFnZT0ke2Nvb2tpZS5tYXhBZ2V9YCk7XG4gIH1cbiAgaWYgKGNvb2tpZS5kb21haW4pIHtcbiAgICBvdXQucHVzaChgRG9tYWluPSR7Y29va2llLmRvbWFpbn1gKTtcbiAgfVxuICBpZiAoY29va2llLnNhbWVTaXRlKSB7XG4gICAgb3V0LnB1c2goYFNhbWVTaXRlPSR7Y29va2llLnNhbWVTaXRlfWApO1xuICB9XG4gIGlmIChjb29raWUucGF0aCkge1xuICAgIG91dC5wdXNoKGBQYXRoPSR7Y29va2llLnBhdGh9YCk7XG4gIH1cbiAgaWYgKGNvb2tpZS5leHBpcmVzKSB7XG4gICAgY29uc3QgZGF0ZVN0cmluZyA9IHRvSU1GKGNvb2tpZS5leHBpcmVzKTtcbiAgICBvdXQucHVzaChgRXhwaXJlcz0ke2RhdGVTdHJpbmd9YCk7XG4gIH1cbiAgaWYgKGNvb2tpZS51bnBhcnNlZCkge1xuICAgIG91dC5wdXNoKGNvb2tpZS51bnBhcnNlZC5qb2luKFwiOyBcIikpO1xuICB9XG4gIHJldHVybiBvdXQuam9pbihcIjsgXCIpO1xufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBjb29raWVzIG9mIHRoZSBTZXJ2ZXIgUmVxdWVzdFxuICogQHBhcmFtIHJlcSBBbiBvYmplY3Qgd2hpY2ggaGFzIGEgYGhlYWRlcnNgIHByb3BlcnR5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb29raWVzKHJlcTogeyBoZWFkZXJzOiBIZWFkZXJzIH0pOiBDb29raWVzIHtcbiAgY29uc3QgY29va2llID0gcmVxLmhlYWRlcnMuZ2V0KFwiQ29va2llXCIpO1xuICBpZiAoY29va2llICE9IG51bGwpIHtcbiAgICBjb25zdCBvdXQ6IENvb2tpZXMgPSB7fTtcbiAgICBjb25zdCBjID0gY29va2llLnNwbGl0KFwiO1wiKTtcbiAgICBmb3IgKGNvbnN0IGt2IG9mIGMpIHtcbiAgICAgIGNvbnN0IFtjb29raWVLZXksIC4uLmNvb2tpZVZhbF0gPSBrdi5zcGxpdChcIj1cIik7XG4gICAgICBhc3NlcnQoY29va2llS2V5ICE9IG51bGwpO1xuICAgICAgY29uc3Qga2V5ID0gY29va2llS2V5LnRyaW0oKTtcbiAgICAgIG91dFtrZXldID0gY29va2llVmFsLmpvaW4oXCI9XCIpO1xuICAgIH1cbiAgICByZXR1cm4gb3V0O1xuICB9XG4gIHJldHVybiB7fTtcbn1cblxuLyoqXG4gKiBTZXQgdGhlIGNvb2tpZSBoZWFkZXIgcHJvcGVybHkgaW4gdGhlIFJlc3BvbnNlXG4gKiBAcGFyYW0gcmVzIEFuIG9iamVjdCB3aGljaCBoYXMgYSBoZWFkZXJzIHByb3BlcnR5XG4gKiBAcGFyYW0gY29va2llIENvb2tpZSB0byBzZXRcbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYHRzXG4gKiBzZXRDb29raWUocmVzcG9uc2UsIHsgbmFtZTogJ2Rlbm8nLCB2YWx1ZTogJ3J1bnRpbWUnLFxuICogICBodHRwT25seTogdHJ1ZSwgc2VjdXJlOiB0cnVlLCBtYXhBZ2U6IDIsIGRvbWFpbjogXCJkZW5vLmxhbmRcIiB9KTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0Q29va2llKHJlczogeyBoZWFkZXJzPzogSGVhZGVycyB9LCBjb29raWU6IENvb2tpZSk6IHZvaWQge1xuICBpZiAoIXJlcy5oZWFkZXJzKSB7XG4gICAgcmVzLmhlYWRlcnMgPSBuZXcgSGVhZGVycygpO1xuICB9XG4gIC8vIFRPRE8gKHpla3RoKSA6IEFkZCBwcm9wZXIgcGFyc2luZyBvZiBTZXQtQ29va2llIGhlYWRlcnNcbiAgLy8gUGFyc2luZyBjb29raWUgaGVhZGVycyB0byBtYWtlIGNvbnNpc3RlbnQgc2V0LWNvb2tpZSBoZWFkZXJcbiAgLy8gcmVmOiBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjNjI2NSNzZWN0aW9uLTQuMS4xXG4gIGNvbnN0IHYgPSB0b1N0cmluZyhjb29raWUpO1xuICBpZiAodikge1xuICAgIHJlcy5oZWFkZXJzLmFwcGVuZChcIlNldC1Db29raWVcIiwgdik7XG4gIH1cbn1cblxuLyoqXG4gKiAgU2V0IHRoZSBjb29raWUgaGVhZGVyIHByb3Blcmx5IGluIHRoZSBSZXNwb25zZSB0byBkZWxldGUgaXRcbiAqIEBwYXJhbSByZXMgU2VydmVyIFJlc3BvbnNlXG4gKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBjb29raWUgdG8gRGVsZXRlXG4gKiBFeGFtcGxlOlxuICpcbiAqICAgICBkZWxldGVDb29raWUocmVzLCdmb28nKTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlbGV0ZUNvb2tpZShyZXM6IHsgaGVhZGVycz86IEhlYWRlcnMgfSwgbmFtZTogc3RyaW5nKTogdm9pZCB7XG4gIHNldENvb2tpZShyZXMsIHtcbiAgICBuYW1lOiBuYW1lLFxuICAgIHZhbHVlOiBcIlwiLFxuICAgIGV4cGlyZXM6IG5ldyBEYXRlKDApLFxuICB9KTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUEwRSxBQUExRSx3RUFBMEU7QUFDMUUsRUFBeUMsQUFBekMsdUNBQXlDO0FBQ3pDLEVBQWtFLEFBQWxFLGdFQUFrRTtTQUN6RCxNQUFNLFNBQVEsa0JBQW9CO1NBQ2xDLEtBQUssU0FBUSxrQkFBb0I7U0E4QmpDLFFBQVEsQ0FBQyxNQUFjO1NBQ3pCLE1BQU0sQ0FBQyxJQUFJOzs7VUFHVixHQUFHO0lBQ1QsR0FBRyxDQUFDLElBQUksSUFBSSxNQUFNLENBQUMsSUFB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