import {
  Accepts,
  isIP,
  parseRange,
  ServerRequest,
  typeofrequest,
} from "../deps.ts";
import { defineGetter } from "./utils/defineGetter.ts";
import { fresh } from "./utils/fresh.ts";
import { parseUrl } from "./utils/parseUrl.ts";
import { all, proxyaddr } from "./utils/proxyAddr.ts";
/**
 * Request prototype.
 *
 * @public
 */ export const request = Object.create(ServerRequest.prototype);
/**
 * Check if the given `type(s)` is acceptable, returning
 * the best match when true, otherwise `undefined`, in which
 * case you should respond with 406 "Not Acceptable".
 *
 * The `type` value may be a single MIME type string
 * such as "application/json", an extension name
 * such as "json", a comma-delimited list such as "json, html, text/plain",
 * an argument list such as `"json", "html", "text/plain"`,
 * or an array `["json", "html", "text/plain"]`. When a list
 * or array is given, the _best_ match, if any is returned.
 *
 * Examples:
 *
 *     // Accept: text/html
 *     req.accepts('html');
 *     // => "html"
 *
 *     // Accept: text/*, application/json
 *     req.accepts('html');
 *     // => "html"
 *     req.accepts('text/html');
 *     // => "text/html"
 *     req.accepts('json, text');
 *     // => "json"
 *     req.accepts('application/json');
 *     // => "application/json"
 *
 *     // Accept: text/*, application/json
 *     req.accepts('image/png');
 *     req.accepts('png');
 *     // => undefined
 *
 *     // Accept: text/*;q=.5, application/json
 *     req.accepts(['html', 'json']);
 *     req.accepts('html', 'json');
 *     req.accepts('html, json');
 *     // => "json"
 *
 * @param {string|string[]} type
 * @return {string|string[]|false}
 * @public
 */ request.accepts = function (...args) {
  const accept = new Accepts(this.headers);
  return accept.types.call(accept, args.flat(1));
};
/**
 * Check if the given `charset`s are acceptable,
 * otherwise you should respond with 406 "Not Acceptable".
 *
 * @param {string|string[]} ...charset
 * @return {string|string[]|false}
 * @public
 */ request.acceptsCharsets = function (...args) {
  const accept = new Accepts(this.headers);
  return accept.charsets.call(accept, args.flat(1));
};
/**
 * Check if the given `encoding`s are accepted.
 *
 * @param {string|string[]} ...encoding
 * @return {string|string[]|false}
 * @public
 */ request.acceptsEncodings = function (...args) {
  const accept = new Accepts(this.headers);
  return accept.encodings.call(accept, args.flat(1));
};
/**
 * Check if the given `lang`s are acceptable,
 * otherwise you should respond with 406 "Not Acceptable".
 *
 * @param {string|string[]} ...lang
 * @return {string|string[]|false}
 * @public
 */ request.acceptsLanguages = function (...args) {
  const accept = new Accepts(this.headers);
  return accept.languages.call(accept, args.flat(1));
};
/**
 * Return request header.
 *
 * The `Referrer` header field is special-cased,
 * both `Referrer` and `Referer` are interchangeable.
 *
 * Examples:
 *
 *     req.get('Content-Type');
 *     // => "text/plain"
 *
 *     req.get('content-type');
 *     // => "text/plain"
 *
 *     req.get('Something');
 *     // => undefined
 *
 * Aliased as `req.header()`.
 *
 * @param {string} name
 * @return {string}
 * @public
 */ request.get = function get(name) {
  const lc = name.toLowerCase();
  switch (lc) {
    case "referer":
    case "referrer":
      return this.headers.get("referrer") || this.headers.get("referer") ||
        undefined;
    default:
      return this.headers.get(lc) || undefined;
  }
};
/**
 * Parse Range header field, capping to the given `size`.
 *
 * Unspecified ranges such as "0-" require knowledge of your resource length. In
 * the case of a byte range this is of course the total number of bytes. If the
 * Range header field is not given `undefined` is returned, `-1` when unsatisfiable,
 * and `-2` when syntactically invalid.
 *
 * When ranges are returned, the array has a "type" property which is the type of
 * range that is required (most commonly, "bytes"). Each array element is an object
 * with a "start" and "end" property for the portion of the range.
 *
 * The "combine" option can be set to `true` and overlapping & adjacent ranges
 * will be combined into a single range.
 *
 * NOTE: remember that ranges are inclusive, so for example "Range: users=0-3"
 * should respond with 4 users when available, not 3.
 *
 * @param {number} size
 * @param {object} [options]
 * @param {boolean} [options.combine=false]
 * @return {number|number[]|undefined}
 * @public
 */ request.range = function range(size, options) {
  const range = this.get("Range");
  if (!range) return;
  return parseRange(size, range, options);
};
/**
 * Check if the incoming request contains the "Content-Type"
 * header field, and it contains the give mime `type`.
 *
 * Examples:
 *
 *      // With Content-Type: text/html; charset=utf-8
 *      req.is('html');
 *      req.is('text/html');
 *      req.is('text/*');
 *      // => true
 *
 *      // When Content-Type is application/json
 *      req.is('json');
 *      req.is('application/json');
 *      req.is('application/*');
 *      // => true
 *
 *      req.is('html');
 *      // => false
 *
 * @param {String|Array} types...
 * @return {String|false|null}
 * @public
 */ request.is = function is(types) {
  let arr = types;
  // support flattened arguments
  if (!Array.isArray(types)) {
    arr = new Array(arguments.length);
    for (let i = 0; i < arr.length; i++) {
      arr[i] = arguments[i];
    }
  }
  return typeofrequest(this.headers, arr);
};
/**
 * Return the protocol string "http" or "https"
 * when requested with TLS. When the "trust proxy"
 * setting trusts the socket address, the
 * "X-Forwarded-Proto" header field will be trusted
 * and used if present.
 *
 * If you're running behind a reverse proxy that
 * supplies https for you this may be enabled.
 *
 * @return {string}
 * @public
 */ defineGetter(request, "protocol", function protocol() {
  const proto = this.proto.includes("https") ? "https" : "http";
  const trust = this.app.get("trust proxy fn");
  const { hostname: remoteAddress } = this.conn.remoteAddr;
  if (!trust(remoteAddress, 0)) {
    return proto;
  }
  // Note: X-Forwarded-Proto is normally only ever a
  // single value, but this is to be safe.
  const header = this.get("X-Forwarded-Proto") ?? proto;
  const index = header.indexOf(",");
  return index !== -1 ? header.substring(0, index).trim() : header.trim();
});
/**
 * Short-hand for:
 *
 *    req.protocol === 'https'
 *
 * @return {Boolean}
 * @public
 */ defineGetter(request, "secure", function secure() {
  return this.protocol === "https";
});
/**
 * Return the remote address from the trusted proxy.
 *
 * The is the remote address on the socket unless
 * "trust proxy" is set.
 *
 * @return {String}
 * @public
 */ defineGetter(request, "ip", function ip() {
  const trust = this.app.get("trust proxy fn");
  return proxyaddr(this, trust);
});
/**
 * When "trust proxy" is set, trusted proxy addresses + client.
 *
 * For example if the value were "client, proxy1, proxy2"
 * you would receive the array `["client", "proxy1", "proxy2"]`
 * where "proxy2" is the furthest down-stream and "proxy1" and
 * "proxy2" were trusted.
 *
 * @return {Array}
 * @public
 */ defineGetter(request, "ips", function ips() {
  const trust = this.app.get("trust proxy fn");
  const addrs = all(this, trust);
  // Reverse the order (to farthest -> closest)
  // and remove socket address
  addrs.reverse().pop();
  return addrs;
});
/**
 * Return subdomains as an array.
 *
 * Subdomains are the dot-separated parts of the host before the main domain of
 * the app. By default, the domain of the app is assumed to be the last two
 * parts of the host. This can be changed by setting "subdomain offset".
 *
 * For example, if the domain is "deno.dinosaurs.example.com":
 * If "subdomain offset" is not set, req.subdomains is `["dinosaurs", "deno"]`.
 * If "subdomain offset" is 3, req.subdomains is `["deno"]`.
 *
 * @return {Array}
 * @public
 */ defineGetter(request, "subdomains", function subdomains() {
  const hostname = this.hostname;
  if (!hostname) return [];
  const offset = this.app.get("subdomain offset");
  const subdomains = !isIP(hostname) ? hostname.split(".").reverse() : [
    hostname,
  ];
  return subdomains.slice(offset);
});
/**
 * Returns the pathname of the URL.
 *
 * @return {String}
 * @public
 */ defineGetter(request, "path", function path() {
  return (parseUrl(this) || {}).pathname;
});
/**
 * Parse the "Host" header field to a hostname.
 *
 * When the "trust proxy" setting trusts the socket
 * address, the "X-Forwarded-Host" header field will
 * be trusted.
 *
 * @return {String}
 * @public
 */ defineGetter(request, "hostname", function hostname() {
  const trust = this.app.get("trust proxy fn");
  let host = this.get("X-Forwarded-Host");
  const { hostname: remoteAddress } = this.conn.remoteAddr;
  if (!host || !trust(remoteAddress, 0)) {
    host = this.get("Host");
  } else if (host.indexOf(",") !== -1) {
    // Note: X-Forwarded-Host is normally only ever a
    // single value, but this is to be safe.
    host = host.substring(0, host.indexOf(",")).trimRight();
  }
  if (!host) return;
  // IPv6 literal support
  const offset = host[0] === "[" ? host.indexOf("]") + 1 : 0;
  const index = host.indexOf(":", offset);
  return index !== -1 ? host.substring(0, index) : host;
});
/**
 * Check if the request is fresh, aka
 * Last-Modified and/or the ETag
 * still match.
 *
 * @return {boolean}
 * @public
 */ defineGetter(request, "fresh", function () {
  const method = this.method;
  const res = this.res;
  const status = res.status;
  // GET or HEAD for weak freshness validation only
  if ("GET" !== method && "HEAD" !== method) {
    return false;
  }
  // 2xx or 304 as per rfc2616 14.26
  if (status >= 200 && status < 300 || 304 === status) {
    return fresh(Object.fromEntries(this.headers), {
      "etag": res.get("ETag"),
      "last-modified": res.get("Last-Modified"),
    });
  }
  return false;
});
/**
 * Check if the request is stale, aka
 * "Last-Modified" and / or the "ETag" for the
 * resource has changed.
 *
 * @return {Boolean}
 * @public
 */ defineGetter(request, "stale", function stale() {
  return !this.fresh;
});
/**
 * Check if the request was an _XMLHttpRequest_.
 *
 * @return {Boolean}
 * @public
 */ defineGetter(request, "xhr", function xhr() {
  const val = this.get("X-Requested-With") || "";
  return val.toLowerCase() === "xmlhttprequest";
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy9yZXF1ZXN0LnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBBY2NlcHRzLFxuICBpc0lQLFxuICBwYXJzZVJhbmdlLFxuICBTZXJ2ZXJSZXF1ZXN0LFxuICB0eXBlb2ZyZXF1ZXN0LFxufSBmcm9tIFwiLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgZGVmaW5lR2V0dGVyIH0gZnJvbSBcIi4vdXRpbHMvZGVmaW5lR2V0dGVyLnRzXCI7XG5pbXBvcnQgeyBmcmVzaCB9IGZyb20gXCIuL3V0aWxzL2ZyZXNoLnRzXCI7XG5pbXBvcnQgeyBwYXJzZVVybCB9IGZyb20gXCIuL3V0aWxzL3BhcnNlVXJsLnRzXCI7XG5pbXBvcnQgeyBhbGwsIHByb3h5YWRkciB9IGZyb20gXCIuL3V0aWxzL3Byb3h5QWRkci50c1wiO1xuaW1wb3J0IHR5cGUge1xuICBSYW5nZVBhcnNlck9wdGlvbnMsXG4gIFJhbmdlUGFyc2VyUmFuZ2VzLFxuICBSYW5nZVBhcnNlclJlc3VsdCxcbiAgUmVxdWVzdCxcbiAgUmVzcG9uc2UsXG59IGZyb20gXCIuLi9zcmMvdHlwZXMudHNcIjtcblxuLyoqXG4gKiBSZXF1ZXN0IHByb3RvdHlwZS5cbiAqIFxuICogQHB1YmxpY1xuICovXG5leHBvcnQgY29uc3QgcmVxdWVzdDogUmVxdWVzdCA9IE9iamVjdC5jcmVhdGUoU2VydmVyUmVxdWVzdC5wcm90b3R5cGUpO1xuXG4vKipcbiAqIENoZWNrIGlmIHRoZSBnaXZlbiBgdHlwZShzKWAgaXMgYWNjZXB0YWJsZSwgcmV0dXJuaW5nXG4gKiB0aGUgYmVzdCBtYXRjaCB3aGVuIHRydWUsIG90aGVyd2lzZSBgdW5kZWZpbmVkYCwgaW4gd2hpY2hcbiAqIGNhc2UgeW91IHNob3VsZCByZXNwb25kIHdpdGggNDA2IFwiTm90IEFjY2VwdGFibGVcIi5cbiAqXG4gKiBUaGUgYHR5cGVgIHZhbHVlIG1heSBiZSBhIHNpbmdsZSBNSU1FIHR5cGUgc3RyaW5nXG4gKiBzdWNoIGFzIFwiYXBwbGljYXRpb24vanNvblwiLCBhbiBleHRlbnNpb24gbmFtZVxuICogc3VjaCBhcyBcImpzb25cIiwgYSBjb21tYS1kZWxpbWl0ZWQgbGlzdCBzdWNoIGFzIFwianNvbiwgaHRtbCwgdGV4dC9wbGFpblwiLFxuICogYW4gYXJndW1lbnQgbGlzdCBzdWNoIGFzIGBcImpzb25cIiwgXCJodG1sXCIsIFwidGV4dC9wbGFpblwiYCxcbiAqIG9yIGFuIGFycmF5IGBbXCJqc29uXCIsIFwiaHRtbFwiLCBcInRleHQvcGxhaW5cIl1gLiBXaGVuIGEgbGlzdFxuICogb3IgYXJyYXkgaXMgZ2l2ZW4sIHRoZSBfYmVzdF8gbWF0Y2gsIGlmIGFueSBpcyByZXR1cm5lZC5cbiAqXG4gKiBFeGFtcGxlczpcbiAqXG4gKiAgICAgLy8gQWNjZXB0OiB0ZXh0L2h0bWxcbiAqICAgICByZXEuYWNjZXB0cygnaHRtbCcpO1xuICogICAgIC8vID0+IFwiaHRtbFwiXG4gKlxuICogICAgIC8vIEFjY2VwdDogdGV4dC8qLCBhcHBsaWNhdGlvbi9qc29uXG4gKiAgICAgcmVxLmFjY2VwdHMoJ2h0bWwnKTtcbiAqICAgICAvLyA9PiBcImh0bWxcIlxuICogICAgIHJlcS5hY2NlcHRzKCd0ZXh0L2h0bWwnKTtcbiAqICAgICAvLyA9PiBcInRleHQvaHRtbFwiXG4gKiAgICAgcmVxLmFjY2VwdHMoJ2pzb24sIHRleHQnKTtcbiAqICAgICAvLyA9PiBcImpzb25cIlxuICogICAgIHJlcS5hY2NlcHRzKCdhcHBsaWNhdGlvbi9qc29uJyk7XG4gKiAgICAgLy8gPT4gXCJhcHBsaWNhdGlvbi9qc29uXCJcbiAqXG4gKiAgICAgLy8gQWNjZXB0OiB0ZXh0LyosIGFwcGxpY2F0aW9uL2pzb25cbiAqICAgICByZXEuYWNjZXB0cygnaW1hZ2UvcG5nJyk7XG4gKiAgICAgcmVxLmFjY2VwdHMoJ3BuZycpO1xuICogICAgIC8vID0+IHVuZGVmaW5lZFxuICpcbiAqICAgICAvLyBBY2NlcHQ6IHRleHQvKjtxPS41LCBhcHBsaWNhdGlvbi9qc29uXG4gKiAgICAgcmVxLmFjY2VwdHMoWydodG1sJywgJ2pzb24nXSk7XG4gKiAgICAgcmVxLmFjY2VwdHMoJ2h0bWwnLCAnanNvbicpO1xuICogICAgIHJlcS5hY2NlcHRzKCdodG1sLCBqc29uJyk7XG4gKiAgICAgLy8gPT4gXCJqc29uXCJcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xzdHJpbmdbXX0gdHlwZVxuICogQHJldHVybiB7c3RyaW5nfHN0cmluZ1tdfGZhbHNlfVxuICogQHB1YmxpY1xuICovXG5yZXF1ZXN0LmFjY2VwdHMgPSBmdW5jdGlvbiAodGhpczogUmVxdWVzdCwgLi4uYXJnczogW3N0cmluZ1tdXSB8IHN0cmluZ1tdKSB7XG4gIGNvbnN0IGFjY2VwdCA9IG5ldyBBY2NlcHRzKHRoaXMuaGVhZGVycyk7XG5cbiAgcmV0dXJuIGFjY2VwdC50eXBlcy5jYWxsKGFjY2VwdCwgYXJncy5mbGF0KDEpKTtcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIGdpdmVuIGBjaGFyc2V0YHMgYXJlIGFjY2VwdGFibGUsXG4gKiBvdGhlcndpc2UgeW91IHNob3VsZCByZXNwb25kIHdpdGggNDA2IFwiTm90IEFjY2VwdGFibGVcIi5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xzdHJpbmdbXX0gLi4uY2hhcnNldFxuICogQHJldHVybiB7c3RyaW5nfHN0cmluZ1tdfGZhbHNlfVxuICogQHB1YmxpY1xuICovXG5yZXF1ZXN0LmFjY2VwdHNDaGFyc2V0cyA9IGZ1bmN0aW9uIChcbiAgdGhpczogUmVxdWVzdCxcbiAgLi4uYXJnczogW3N0cmluZ1tdXSB8IHN0cmluZ1tdXG4pIHtcbiAgY29uc3QgYWNjZXB0ID0gbmV3IEFjY2VwdHModGhpcy5oZWFkZXJzKTtcblxuICByZXR1cm4gYWNjZXB0LmNoYXJzZXRzLmNhbGwoYWNjZXB0LCBhcmdzLmZsYXQoMSkpO1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiB0aGUgZ2l2ZW4gYGVuY29kaW5nYHMgYXJlIGFjY2VwdGVkLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfHN0cmluZ1tdfSAuLi5lbmNvZGluZ1xuICogQHJldHVybiB7c3RyaW5nfHN0cmluZ1tdfGZhbHNlfVxuICogQHB1YmxpY1xuICovXG5cbnJlcXVlc3QuYWNjZXB0c0VuY29kaW5ncyA9IGZ1bmN0aW9uIChcbiAgdGhpczogUmVxdWVzdCxcbiAgLi4uYXJnczogW3N0cmluZ1tdXSB8IHN0cmluZ1tdXG4pIHtcbiAgY29uc3QgYWNjZXB0ID0gbmV3IEFjY2VwdHModGhpcy5oZWFkZXJzKTtcblxuICByZXR1cm4gYWNjZXB0LmVuY29kaW5ncy5jYWxsKGFjY2VwdCwgYXJncy5mbGF0KDEpKTtcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIGdpdmVuIGBsYW5nYHMgYXJlIGFjY2VwdGFibGUsXG4gKiBvdGhlcndpc2UgeW91IHNob3VsZCByZXNwb25kIHdpdGggNDA2IFwiTm90IEFjY2VwdGFibGVcIi5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xzdHJpbmdbXX0gLi4ubGFuZ1xuICogQHJldHVybiB7c3RyaW5nfHN0cmluZ1tdfGZhbHNlfVxuICogQHB1YmxpY1xuICovXG5yZXF1ZXN0LmFjY2VwdHNMYW5ndWFnZXMgPSBmdW5jdGlvbiAoXG4gIHRoaXM6IFJlcXVlc3QsXG4gIC4uLmFyZ3M6IFtzdHJpbmdbXV0gfCBzdHJpbmdbXVxuKSB7XG4gIGNvbnN0IGFjY2VwdCA9IG5ldyBBY2NlcHRzKHRoaXMuaGVhZGVycyk7XG5cbiAgcmV0dXJuIGFjY2VwdC5sYW5ndWFnZXMuY2FsbChhY2NlcHQsIGFyZ3MuZmxhdCgxKSk7XG59O1xuXG4vKipcbiAqIFJldHVybiByZXF1ZXN0IGhlYWRlci5cbiAqXG4gKiBUaGUgYFJlZmVycmVyYCBoZWFkZXIgZmllbGQgaXMgc3BlY2lhbC1jYXNlZCxcbiAqIGJvdGggYFJlZmVycmVyYCBhbmQgYFJlZmVyZXJgIGFyZSBpbnRlcmNoYW5nZWFibGUuXG4gKlxuICogRXhhbXBsZXM6XG4gKlxuICogICAgIHJlcS5nZXQoJ0NvbnRlbnQtVHlwZScpO1xuICogICAgIC8vID0+IFwidGV4dC9wbGFpblwiXG4gKlxuICogICAgIHJlcS5nZXQoJ2NvbnRlbnQtdHlwZScpO1xuICogICAgIC8vID0+IFwidGV4dC9wbGFpblwiXG4gKlxuICogICAgIHJlcS5nZXQoJ1NvbWV0aGluZycpO1xuICogICAgIC8vID0+IHVuZGVmaW5lZFxuICpcbiAqIEFsaWFzZWQgYXMgYHJlcS5oZWFkZXIoKWAuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqIEBwdWJsaWNcbiAqL1xucmVxdWVzdC5nZXQgPSBmdW5jdGlvbiBnZXQobmFtZTogc3RyaW5nKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgY29uc3QgbGMgPSBuYW1lLnRvTG93ZXJDYXNlKCk7XG5cbiAgc3dpdGNoIChsYykge1xuICAgIGNhc2UgXCJyZWZlcmVyXCI6XG4gICAgY2FzZSBcInJlZmVycmVyXCI6XG4gICAgICByZXR1cm4gdGhpcy5oZWFkZXJzLmdldChcInJlZmVycmVyXCIpIHx8XG4gICAgICAgIHRoaXMuaGVhZGVycy5nZXQoXCJyZWZlcmVyXCIpIHx8IHVuZGVmaW5lZDtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIHRoaXMuaGVhZGVycy5nZXQobGMpIHx8IHVuZGVmaW5lZDtcbiAgfVxufTtcblxuLyoqXG4gKiBQYXJzZSBSYW5nZSBoZWFkZXIgZmllbGQsIGNhcHBpbmcgdG8gdGhlIGdpdmVuIGBzaXplYC5cbiAqXG4gKiBVbnNwZWNpZmllZCByYW5nZXMgc3VjaCBhcyBcIjAtXCIgcmVxdWlyZSBrbm93bGVkZ2Ugb2YgeW91ciByZXNvdXJjZSBsZW5ndGguIEluXG4gKiB0aGUgY2FzZSBvZiBhIGJ5dGUgcmFuZ2UgdGhpcyBpcyBvZiBjb3Vyc2UgdGhlIHRvdGFsIG51bWJlciBvZiBieXRlcy4gSWYgdGhlXG4gKiBSYW5nZSBoZWFkZXIgZmllbGQgaXMgbm90IGdpdmVuIGB1bmRlZmluZWRgIGlzIHJldHVybmVkLCBgLTFgIHdoZW4gdW5zYXRpc2ZpYWJsZSxcbiAqIGFuZCBgLTJgIHdoZW4gc3ludGFjdGljYWxseSBpbnZhbGlkLlxuICpcbiAqIFdoZW4gcmFuZ2VzIGFyZSByZXR1cm5lZCwgdGhlIGFycmF5IGhhcyBhIFwidHlwZVwiIHByb3BlcnR5IHdoaWNoIGlzIHRoZSB0eXBlIG9mXG4gKiByYW5nZSB0aGF0IGlzIHJlcXVpcmVkIChtb3N0IGNvbW1vbmx5LCBcImJ5dGVzXCIpLiBFYWNoIGFycmF5IGVsZW1lbnQgaXMgYW4gb2JqZWN0XG4gKiB3aXRoIGEgXCJzdGFydFwiIGFuZCBcImVuZFwiIHByb3BlcnR5IGZvciB0aGUgcG9ydGlvbiBvZiB0aGUgcmFuZ2UuXG4gKlxuICogVGhlIFwiY29tYmluZVwiIG9wdGlvbiBjYW4gYmUgc2V0IHRvIGB0cnVlYCBhbmQgb3ZlcmxhcHBpbmcgJiBhZGphY2VudCByYW5nZXNcbiAqIHdpbGwgYmUgY29tYmluZWQgaW50byBhIHNpbmdsZSByYW5nZS5cbiAqXG4gKiBOT1RFOiByZW1lbWJlciB0aGF0IHJhbmdlcyBhcmUgaW5jbHVzaXZlLCBzbyBmb3IgZXhhbXBsZSBcIlJhbmdlOiB1c2Vycz0wLTNcIlxuICogc2hvdWxkIHJlc3BvbmQgd2l0aCA0IHVzZXJzIHdoZW4gYXZhaWxhYmxlLCBub3QgMy5cbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gc2l6ZVxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5jb21iaW5lPWZhbHNlXVxuICogQHJldHVybiB7bnVtYmVyfG51bWJlcltdfHVuZGVmaW5lZH1cbiAqIEBwdWJsaWNcbiAqL1xucmVxdWVzdC5yYW5nZSA9IGZ1bmN0aW9uIHJhbmdlKFxuICBzaXplOiBudW1iZXIsXG4gIG9wdGlvbnM/OiBSYW5nZVBhcnNlck9wdGlvbnMsXG4pOiBSYW5nZVBhcnNlclJhbmdlcyB8IFJhbmdlUGFyc2VyUmVzdWx0IHwgdW5kZWZpbmVkIHtcbiAgY29uc3QgcmFuZ2UgPSB0aGlzLmdldChcIlJhbmdlXCIpO1xuXG4gIGlmICghcmFuZ2UpIHJldHVybjtcblxuICByZXR1cm4gcGFyc2VSYW5nZShzaXplLCByYW5nZSwgb3B0aW9ucykgYXNcbiAgICB8IFJhbmdlUGFyc2VyUmFuZ2VzXG4gICAgfCBSYW5nZVBhcnNlclJlc3VsdDtcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIGluY29taW5nIHJlcXVlc3QgY29udGFpbnMgdGhlIFwiQ29udGVudC1UeXBlXCJcbiAqIGhlYWRlciBmaWVsZCwgYW5kIGl0IGNvbnRhaW5zIHRoZSBnaXZlIG1pbWUgYHR5cGVgLlxuICpcbiAqIEV4YW1wbGVzOlxuICpcbiAqICAgICAgLy8gV2l0aCBDb250ZW50LVR5cGU6IHRleHQvaHRtbDsgY2hhcnNldD11dGYtOFxuICogICAgICByZXEuaXMoJ2h0bWwnKTtcbiAqICAgICAgcmVxLmlzKCd0ZXh0L2h0bWwnKTtcbiAqICAgICAgcmVxLmlzKCd0ZXh0LyonKTtcbiAqICAgICAgLy8gPT4gdHJ1ZVxuICpcbiAqICAgICAgLy8gV2hlbiBDb250ZW50LVR5cGUgaXMgYXBwbGljYXRpb24vanNvblxuICogICAgICByZXEuaXMoJ2pzb24nKTtcbiAqICAgICAgcmVxLmlzKCdhcHBsaWNhdGlvbi9qc29uJyk7XG4gKiAgICAgIHJlcS5pcygnYXBwbGljYXRpb24vKicpO1xuICogICAgICAvLyA9PiB0cnVlXG4gKlxuICogICAgICByZXEuaXMoJ2h0bWwnKTtcbiAqICAgICAgLy8gPT4gZmFsc2VcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xBcnJheX0gdHlwZXMuLi5cbiAqIEByZXR1cm4ge1N0cmluZ3xmYWxzZXxudWxsfVxuICogQHB1YmxpY1xuICovXG5yZXF1ZXN0LmlzID0gZnVuY3Rpb24gaXModGhpczogUmVxdWVzdCwgdHlwZXM6IHN0cmluZyB8IHN0cmluZ1tdKSB7XG4gIGxldCBhcnIgPSB0eXBlcztcblxuICAvLyBzdXBwb3J0IGZsYXR0ZW5lZCBhcmd1bWVudHNcbiAgaWYgKCFBcnJheS5pc0FycmF5KHR5cGVzKSkge1xuICAgIGFyciA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgYXJyW2ldID0gYXJndW1lbnRzW2ldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0eXBlb2ZyZXF1ZXN0KHRoaXMuaGVhZGVycywgYXJyIGFzIHN0cmluZ1tdKTtcbn07XG5cbi8qKlxuICogUmV0dXJuIHRoZSBwcm90b2NvbCBzdHJpbmcgXCJodHRwXCIgb3IgXCJodHRwc1wiXG4gKiB3aGVuIHJlcXVlc3RlZCB3aXRoIFRMUy4gV2hlbiB0aGUgXCJ0cnVzdCBwcm94eVwiXG4gKiBzZXR0aW5nIHRydXN0cyB0aGUgc29ja2V0IGFkZHJlc3MsIHRoZVxuICogXCJYLUZvcndhcmRlZC1Qcm90b1wiIGhlYWRlciBmaWVsZCB3aWxsIGJlIHRydXN0ZWRcbiAqIGFuZCB1c2VkIGlmIHByZXNlbnQuXG4gKlxuICogSWYgeW91J3JlIHJ1bm5pbmcgYmVoaW5kIGEgcmV2ZXJzZSBwcm94eSB0aGF0XG4gKiBzdXBwbGllcyBodHRwcyBmb3IgeW91IHRoaXMgbWF5IGJlIGVuYWJsZWQuXG4gKlxuICogQHJldHVybiB7c3RyaW5nfVxuICogQHB1YmxpY1xuICovXG5kZWZpbmVHZXR0ZXIocmVxdWVzdCwgXCJwcm90b2NvbFwiLCBmdW5jdGlvbiBwcm90b2NvbCh0aGlzOiBSZXF1ZXN0KSB7XG4gIGNvbnN0IHByb3RvID0gdGhpcy5wcm90by5pbmNsdWRlcyhcImh0dHBzXCIpID8gXCJodHRwc1wiIDogXCJodHRwXCI7XG4gIGNvbnN0IHRydXN0ID0gdGhpcy5hcHAuZ2V0KFwidHJ1c3QgcHJveHkgZm5cIik7XG4gIGNvbnN0IHsgaG9zdG5hbWU6IHJlbW90ZUFkZHJlc3MgfSA9IHRoaXMuY29ubi5yZW1vdGVBZGRyIGFzIERlbm8uTmV0QWRkcjtcblxuICBpZiAoIXRydXN0KHJlbW90ZUFkZHJlc3MsIDApKSB7XG4gICAgcmV0dXJuIHByb3RvO1xuICB9XG5cbiAgLy8gTm90ZTogWC1Gb3J3YXJkZWQtUHJvdG8gaXMgbm9ybWFsbHkgb25seSBldmVyIGFcbiAgLy8gc2luZ2xlIHZhbHVlLCBidXQgdGhpcyBpcyB0byBiZSBzYWZlLlxuICBjb25zdCBoZWFkZXIgPSB0aGlzLmdldChcIlgtRm9yd2FyZGVkLVByb3RvXCIpID8/IHByb3RvO1xuICBjb25zdCBpbmRleCA9IGhlYWRlci5pbmRleE9mKFwiLFwiKTtcblxuICByZXR1cm4gaW5kZXggIT09IC0xID8gaGVhZGVyLnN1YnN0cmluZygwLCBpbmRleCkudHJpbSgpIDogaGVhZGVyLnRyaW0oKTtcbn0pO1xuXG4vKipcbiAqIFNob3J0LWhhbmQgZm9yOlxuICpcbiAqICAgIHJlcS5wcm90b2NvbCA9PT0gJ2h0dHBzJ1xuICpcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAcHVibGljXG4gKi9cbmRlZmluZUdldHRlcihyZXF1ZXN0LCBcInNlY3VyZVwiLCBmdW5jdGlvbiBzZWN1cmUodGhpczogUmVxdWVzdCkge1xuICByZXR1cm4gdGhpcy5wcm90b2NvbCA9PT0gXCJodHRwc1wiO1xufSk7XG5cbi8qKlxuICogUmV0dXJuIHRoZSByZW1vdGUgYWRkcmVzcyBmcm9tIHRoZSB0cnVzdGVkIHByb3h5LlxuICpcbiAqIFRoZSBpcyB0aGUgcmVtb3RlIGFkZHJlc3Mgb24gdGhlIHNvY2tldCB1bmxlc3NcbiAqIFwidHJ1c3QgcHJveHlcIiBpcyBzZXQuXG4gKlxuICogQHJldHVybiB7U3RyaW5nfVxuICogQHB1YmxpY1xuICovXG5cbmRlZmluZUdldHRlcihyZXF1ZXN0LCBcImlwXCIsIGZ1bmN0aW9uIGlwKHRoaXM6IFJlcXVlc3QpIHtcbiAgY29uc3QgdHJ1c3QgPSB0aGlzLmFwcC5nZXQoXCJ0cnVzdCBwcm94eSBmblwiKTtcblxuICByZXR1cm4gcHJveHlhZGRyKHRoaXMsIHRydXN0KTtcbn0pO1xuXG4vKipcbiAqIFdoZW4gXCJ0cnVzdCBwcm94eVwiIGlzIHNldCwgdHJ1c3RlZCBwcm94eSBhZGRyZXNzZXMgKyBjbGllbnQuXG4gKlxuICogRm9yIGV4YW1wbGUgaWYgdGhlIHZhbHVlIHdlcmUgXCJjbGllbnQsIHByb3h5MSwgcHJveHkyXCJcbiAqIHlvdSB3b3VsZCByZWNlaXZlIHRoZSBhcnJheSBgW1wiY2xpZW50XCIsIFwicHJveHkxXCIsIFwicHJveHkyXCJdYFxuICogd2hlcmUgXCJwcm94eTJcIiBpcyB0aGUgZnVydGhlc3QgZG93bi1zdHJlYW0gYW5kIFwicHJveHkxXCIgYW5kXG4gKiBcInByb3h5MlwiIHdlcmUgdHJ1c3RlZC5cbiAqXG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqIEBwdWJsaWNcbiAqL1xuZGVmaW5lR2V0dGVyKHJlcXVlc3QsIFwiaXBzXCIsIGZ1bmN0aW9uIGlwcyh0aGlzOiBSZXF1ZXN0KSB7XG4gIGNvbnN0IHRydXN0ID0gdGhpcy5hcHAuZ2V0KFwidHJ1c3QgcHJveHkgZm5cIik7XG4gIGNvbnN0IGFkZHJzID0gYWxsKHRoaXMsIHRydXN0KTtcblxuICAvLyBSZXZlcnNlIHRoZSBvcmRlciAodG8gZmFydGhlc3QgLT4gY2xvc2VzdClcbiAgLy8gYW5kIHJlbW92ZSBzb2NrZXQgYWRkcmVzc1xuICBhZGRycy5yZXZlcnNlKCkucG9wKCk7XG5cbiAgcmV0dXJuIGFkZHJzO1xufSk7XG5cbi8qKlxuICogUmV0dXJuIHN1YmRvbWFpbnMgYXMgYW4gYXJyYXkuXG4gKlxuICogU3ViZG9tYWlucyBhcmUgdGhlIGRvdC1zZXBhcmF0ZWQgcGFydHMgb2YgdGhlIGhvc3QgYmVmb3JlIHRoZSBtYWluIGRvbWFpbiBvZlxuICogdGhlIGFwcC4gQnkgZGVmYXVsdCwgdGhlIGRvbWFpbiBvZiB0aGUgYXBwIGlzIGFzc3VtZWQgdG8gYmUgdGhlIGxhc3QgdHdvXG4gKiBwYXJ0cyBvZiB0aGUgaG9zdC4gVGhpcyBjYW4gYmUgY2hhbmdlZCBieSBzZXR0aW5nIFwic3ViZG9tYWluIG9mZnNldFwiLlxuICpcbiAqIEZvciBleGFtcGxlLCBpZiB0aGUgZG9tYWluIGlzIFwiZGVuby5kaW5vc2F1cnMuZXhhbXBsZS5jb21cIjpcbiAqIElmIFwic3ViZG9tYWluIG9mZnNldFwiIGlzIG5vdCBzZXQsIHJlcS5zdWJkb21haW5zIGlzIGBbXCJkaW5vc2F1cnNcIiwgXCJkZW5vXCJdYC5cbiAqIElmIFwic3ViZG9tYWluIG9mZnNldFwiIGlzIDMsIHJlcS5zdWJkb21haW5zIGlzIGBbXCJkZW5vXCJdYC5cbiAqXG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqIEBwdWJsaWNcbiAqL1xuZGVmaW5lR2V0dGVyKHJlcXVlc3QsIFwic3ViZG9tYWluc1wiLCBmdW5jdGlvbiBzdWJkb21haW5zKHRoaXM6IFJlcXVlc3QpIHtcbiAgY29uc3QgaG9zdG5hbWUgPSB0aGlzLmhvc3RuYW1lO1xuXG4gIGlmICghaG9zdG5hbWUpIHJldHVybiBbXTtcblxuICBjb25zdCBvZmZzZXQgPSB0aGlzLmFwcC5nZXQoXCJzdWJkb21haW4gb2Zmc2V0XCIpO1xuICBjb25zdCBzdWJkb21haW5zID0gIWlzSVAoaG9zdG5hbWUpXG4gICAgPyBob3N0bmFtZS5zcGxpdChcIi5cIikucmV2ZXJzZSgpXG4gICAgOiBbaG9zdG5hbWVdO1xuXG4gIHJldHVybiBzdWJkb21haW5zLnNsaWNlKG9mZnNldCk7XG59KTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBwYXRobmFtZSBvZiB0aGUgVVJMLlxuICpcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBwdWJsaWNcbiAqL1xuZGVmaW5lR2V0dGVyKHJlcXVlc3QsIFwicGF0aFwiLCBmdW5jdGlvbiBwYXRoKHRoaXM6IFJlcXVlc3QpIHtcbiAgcmV0dXJuIChwYXJzZVVybCh0aGlzKSB8fCB7fSkucGF0aG5hbWU7XG59KTtcblxuLyoqXG4gKiBQYXJzZSB0aGUgXCJIb3N0XCIgaGVhZGVyIGZpZWxkIHRvIGEgaG9zdG5hbWUuXG4gKlxuICogV2hlbiB0aGUgXCJ0cnVzdCBwcm94eVwiIHNldHRpbmcgdHJ1c3RzIHRoZSBzb2NrZXRcbiAqIGFkZHJlc3MsIHRoZSBcIlgtRm9yd2FyZGVkLUhvc3RcIiBoZWFkZXIgZmllbGQgd2lsbFxuICogYmUgdHJ1c3RlZC5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAcHVibGljXG4gKi9cbmRlZmluZUdldHRlcihyZXF1ZXN0LCBcImhvc3RuYW1lXCIsIGZ1bmN0aW9uIGhvc3RuYW1lKHRoaXM6IFJlcXVlc3QpIHtcbiAgY29uc3QgdHJ1c3QgPSB0aGlzLmFwcC5nZXQoXCJ0cnVzdCBwcm94eSBmblwiKTtcbiAgbGV0IGhvc3QgPSB0aGlzLmdldChcIlgtRm9yd2FyZGVkLUhvc3RcIik7XG4gIGNvbnN0IHsgaG9zdG5hbWU6IHJlbW90ZUFkZHJlc3MgfSA9IHRoaXMuY29ubi5yZW1vdGVBZGRyIGFzIERlbm8uTmV0QWRkcjtcblxuICBpZiAoIWhvc3QgfHwgIXRydXN0KHJlbW90ZUFkZHJlc3MsIDApKSB7XG4gICAgaG9zdCA9IHRoaXMuZ2V0KFwiSG9zdFwiKTtcbiAgfSBlbHNlIGlmIChob3N0LmluZGV4T2YoXCIsXCIpICE9PSAtMSkge1xuICAgIC8vIE5vdGU6IFgtRm9yd2FyZGVkLUhvc3QgaXMgbm9ybWFsbHkgb25seSBldmVyIGFcbiAgICAvLyBzaW5nbGUgdmFsdWUsIGJ1dCB0aGlzIGlzIHRvIGJlIHNhZmUuXG4gICAgaG9zdCA9IGhvc3Quc3Vic3RyaW5nKDAsIGhvc3QuaW5kZXhPZihcIixcIikpLnRyaW1SaWdodCgpO1xuICB9XG5cbiAgaWYgKCFob3N0KSByZXR1cm47XG5cbiAgLy8gSVB2NiBsaXRlcmFsIHN1cHBvcnRcbiAgY29uc3Qgb2Zmc2V0ID0gaG9zdFswXSA9PT0gXCJbXCIgPyBob3N0LmluZGV4T2YoXCJdXCIpICsgMSA6IDA7XG4gIGNvbnN0IGluZGV4ID0gaG9zdC5pbmRleE9mKFwiOlwiLCBvZmZzZXQpO1xuXG4gIHJldHVybiBpbmRleCAhPT0gLTEgPyBob3N0LnN1YnN0cmluZygwLCBpbmRleCkgOiBob3N0O1xufSk7XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIHJlcXVlc3QgaXMgZnJlc2gsIGFrYVxuICogTGFzdC1Nb2RpZmllZCBhbmQvb3IgdGhlIEVUYWdcbiAqIHN0aWxsIG1hdGNoLlxuICpcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKiBAcHVibGljXG4gKi9cbmRlZmluZUdldHRlcihyZXF1ZXN0LCBcImZyZXNoXCIsIGZ1bmN0aW9uICh0aGlzOiBSZXF1ZXN0KTogYm9vbGVhbiB7XG4gIGNvbnN0IG1ldGhvZCA9IHRoaXMubWV0aG9kO1xuICBjb25zdCByZXMgPSB0aGlzLnJlcyBhcyBSZXNwb25zZTtcbiAgY29uc3Qgc3RhdHVzID0gcmVzLnN0YXR1cyBhcyBudW1iZXI7XG5cbiAgLy8gR0VUIG9yIEhFQUQgZm9yIHdlYWsgZnJlc2huZXNzIHZhbGlkYXRpb24gb25seVxuICBpZiAoXCJHRVRcIiAhPT0gbWV0aG9kICYmIFwiSEVBRFwiICE9PSBtZXRob2QpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyAyeHggb3IgMzA0IGFzIHBlciByZmMyNjE2IDE0LjI2XG4gIGlmICgoc3RhdHVzID49IDIwMCAmJiBzdGF0dXMgPCAzMDApIHx8IDMwNCA9PT0gc3RhdHVzKSB7XG4gICAgcmV0dXJuIGZyZXNoKE9iamVjdC5mcm9tRW50cmllcyh0aGlzLmhlYWRlcnMgYXMgYW55KSwge1xuICAgICAgXCJldGFnXCI6IHJlcy5nZXQoXCJFVGFnXCIpLFxuICAgICAgXCJsYXN0LW1vZGlmaWVkXCI6IHJlcy5nZXQoXCJMYXN0LU1vZGlmaWVkXCIpLFxuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufSk7XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIHJlcXVlc3QgaXMgc3RhbGUsIGFrYVxuICogXCJMYXN0LU1vZGlmaWVkXCIgYW5kIC8gb3IgdGhlIFwiRVRhZ1wiIGZvciB0aGVcbiAqIHJlc291cmNlIGhhcyBjaGFuZ2VkLlxuICpcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAcHVibGljXG4gKi9cbmRlZmluZUdldHRlcihyZXF1ZXN0LCBcInN0YWxlXCIsIGZ1bmN0aW9uIHN0YWxlKHRoaXM6IFJlcXVlc3QpOiBib29sZWFuIHtcbiAgcmV0dXJuICF0aGlzLmZyZXNoO1xufSk7XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIHJlcXVlc3Qgd2FzIGFuIF9YTUxIdHRwUmVxdWVzdF8uXG4gKlxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBwdWJsaWNcbiAqL1xuZGVmaW5lR2V0dGVyKHJlcXVlc3QsIFwieGhyXCIsIGZ1bmN0aW9uIHhocih0aGlzOiBSZXF1ZXN0KSB7XG4gIGNvbnN0IHZhbCA9IHRoaXMuZ2V0KFwiWC1SZXF1ZXN0ZWQtV2l0aFwiKSB8fCBcIlwiO1xuXG4gIHJldHVybiB2YWwudG9Mb3dlckNhc2UoKSA9PT0gXCJ4bWxodHRwcmVxdWVzdFwiO1xufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQ0UsT0FBTyxFQUNQLElBQUksRUFDSixVQUFVLEVBQ1YsYUFBYSxFQUNiLGFBQWEsU0FDUixVQUFZO1NBQ1YsWUFBWSxTQUFRLHVCQUF5QjtTQUM3QyxLQUFLLFNBQVEsZ0JBQWtCO1NBQy9CLFFBQVEsU0FBUSxtQkFBcUI7U0FDckMsR0FBRyxFQUFFLFNBQVMsU0FBUSxvQkFBc0I7QUFTckQsRUFJRyxBQUpIOzs7O0NBSUcsQUFKSCxFQUlHLGNBQ1UsT0FBTyxHQUFZLE1BQU0sQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLFNBQVM7QUFFckUsRUEwQ0csQUExQ0g7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQTBDRyxBQTFDSCxFQTBDRyxDQUNILE9BQU8sQ0FBQyxPQUFPLGVBQStCLElBQUk7VUFDMUMsTUFBTSxPQUFPLE9BQU8sTUFBTSxPQUFPO1dBRWhDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRzlDLEVBT0csQUFQSDs7Ozs7OztDQU9HLEFBUEgsRUFPRyxDQUNILE9BQU8sQ0FBQyxl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
