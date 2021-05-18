/**
 * Heavily inspired by send (https://github.com/pillarjs/send/tree/0.17.1)
 *
 * send is licensed as follows:
 *
 * (The MIT License)
 *
 * Copyright (c) 2012 TJ Holowaychuk
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
 */
import {
  createError,
  extname,
  join,
  ms,
  normalize,
  resolve,
  sep,
} from "../../deps.ts";
import { parseHttpDate, parseTokenList } from "./fresh.ts";
/**
 * Regular expression for identifying a bytes Range header.
 * @private
 */ const BYTES_RANGE_REGEXP = /^ *bytes=/;
/**
 * Maximum value allowed for the max age.
 * @private
 */ const MAX_MAXAGE = 60 * 60 * 24 * 365 * 1000; // 1 year
/**
 * Regular expression to match a path with a directory up component.
 * @private
 */ const UP_PATH_REGEXP = /(?:^|[\\/])\.\.(?:[\\/]|$)/;
const ENOENT_REGEXP = /\(os error 2\)$/;
const ENAMETOOLONG_REGEXP = /\(os error 63\)$/;
/**
 * Normalize the index option into an array.
 *
 * @param {boolean|string|array} value
 * @param {string} name
 * @private
 */ function normalizeList(value, name) {
  const list = value === false ? [] : Array.isArray(value) ? value : [
    value,
  ];
  for (let i = 0; i < list.length; i++) {
    if (typeof list[i] !== "string") {
      throw new TypeError(name + " must be array of strings or false");
    }
  }
  return list;
}
/**
 * Determine if path parts contain a dotfile.
 *
 * @private
 */ function containsDotFile(parts) {
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.length > 1 && part[0] === ".") {
      return true;
    }
  }
  return false;
}
/**
 * Check if the pathname ends with "/".
 *
 * @param {string} path
 * @return {boolean}
 * @private
 */ export function hasTrailingSlash(path) {
  return path[path.length - 1] === "/";
}
/**
 * Check if this is a conditional GET request.
 *
 * @return {boolean}
 * @private
 */ function isConditionalGET(req) {
  return Boolean(
    req.headers.get("if-match") || req.headers.get("if-unmodified-since") ||
      req.headers.get("if-none-match") || req.headers.get("if-modified-since"),
  );
}
/**
 * Check if the request preconditions failed.
 *
 * @return {boolean}
 * @private
 */ function isPreconditionFailure(req, res) {
  // if-match
  const match = req.headers.get("if-match");
  if (match) {
    const etag = res.get("ETag");
    return !etag ||
      match !== "*" && parseTokenList(match).every(function (match) {
          return match !== etag && match !== "W/" + etag &&
            "W/" + match !== etag;
        });
  }
  // if-unmodified-since
  const unmodifiedSince = parseHttpDate(req.get("if-unmodified-since"));
  if (!isNaN(unmodifiedSince)) {
    const lastModified = parseHttpDate(res.get("Last-Modified"));
    return isNaN(lastModified) || lastModified > unmodifiedSince;
  }
  return false;
}
/**
 * Create a Content-Range header.
 *
 * @param {string} type
 * @param {number} size
 * @param {array} [range]
 * @private
 */ function contentRange(type, size, range) {
  return type + " " + (range ? range.start + "-" + range.end : "*") + "/" +
    size;
}
/**
 * Strip content-* header fields.
 *
 * @private
 */ function removeContentHeaderFields(res) {
  const headers = Array.from(res.headers?.keys() ?? []);
  for (const header of headers) {
    if (header.substr(0, 8) === "content-" && header !== "content-location") {
      res.unset(header);
    }
  }
}
/**
 * Check if the request is cacheable, aka
 * responded with 2xx or 304 (see RFC 2616 section 14.2{5,6}).
 *
 * @return {boolean}
 * @private
 */ function isCachable(statusCode) {
  return statusCode >= 200 && statusCode < 300 || statusCode === 304;
}
/**
 * Check if the range is fresh.
 *
 * @return {boolean}
 * @private
 */ function isRangeFresh(req, res) {
  const ifRange = req.get("if-range");
  if (!ifRange) {
    return true;
  }
  // if-range as etag
  if (ifRange.indexOf('"') !== -1) {
    const etag = res.get("ETag");
    return Boolean(etag && ifRange.indexOf(etag) !== -1);
  }
  // if-range as modified date
  const lastModified = res.get("Last-Modified");
  return parseHttpDate(lastModified) <= parseHttpDate(ifRange);
}
/**
 * Collapse all leading slashes into a single slash
 *
 * @param {string} str
 * @private
 */ function collapseLeadingSlashes(str) {
  for (var i = 0; i < str.length; i++) {
    if (str[i] !== "/") {
      break;
    }
  }
  return i > 1 ? "/" + str.substr(i) : str;
}
/**
 * Clear all headers from a response.
 *
 * @param {object} res
 * @private
 */ function clearHeaders(res) {
  const headers = Array.from(res.headers?.keys() ?? []);
  for (const header of headers) {
    res.unset(header);
  }
}
/**
 * Create a 404 error.
 *
 * @param {string} message
 * @returns {Error}
 * @private
 */ function create404Error() {
  const error = new Deno.errors.NotFound();
  error.status = 404;
  error.statusCode = 404;
  return error;
}
/**
 * Emit errors.
 *
 * @param {object} res
 * @param {Error} [error]
 * @private
 */ export function sendError(res, error) {
  clearHeaders(res);
  if (error?.headers) {
    res.set(error.headers);
  }
  if (!error) {
    throw createError(create404Error(), {
      code: "ENOENT",
    });
  } else if (ENOENT_REGEXP.test(error.message)) {
    throw createError(create404Error(), {
      code: "ENOENT",
    });
  } else if (ENAMETOOLONG_REGEXP.test(error.message)) {
    throw createError(create404Error(), {
      code: "ENAMETOOLONG",
    });
  } else if (error.status === 404 || error.statusCode === 404) {
    throw createError(create404Error(), {
      code: error.code,
    });
  }
  throw createError((error.status ?? error.statusCode) ?? 500, error.message, {
    code: error.code,
  });
}
/**
 * Sets the read offset of the provided file and returns a
 * Deno.Reader to read the file from the offset until the
 * provided contentLength;
 *
 * @param {Deno.File} file
 * @param {number} offset
 * @param {number} contentLength
 * @returns {Deno.Reader} reader
 * @private
 */ async function offsetFileReader(file, offset, contentLength) {
  let totalRead = 0;
  let finished = false;
  await file.seek(offset, Deno.SeekMode.Start);
  async function read(buf) {
    if (finished) return null;
    let result;
    const remaining = contentLength - totalRead;
    if (remaining >= buf.byteLength) {
      result = await file.read(buf);
    } else {
      const readBuf = buf.subarray(0, remaining);
      result = await file.read(readBuf);
    }
    if (result !== null) {
      totalRead += result;
    }
    finished = totalRead === contentLength;
    return result;
  }
  return {
    read,
  };
}
/**
 * Transfer the file at `path`.
 *
 * @param {object} res
 * @param {string} path
 * @param {object} options
 * @param {object} stat
 */ async function _send(req, res, path, options, stat) {
  if (res.written) {
    return sendError(res, createError(500, "Response already written"));
  }
  if (options.before) {
    options.before(res, path, stat);
  }
  const cacheControl = Boolean(options.cacheControl ?? true);
  if (cacheControl && !res.get("Cache-Control")) {
    let maxage = options.maxAge ?? options.maxage;
    maxage = typeof maxage === "string" ? ms(maxage) : Number(maxage);
    maxage = !isNaN(maxage) ? Math.min(Math.max(0, maxage), MAX_MAXAGE) : 0;
    let cacheControlHeader = "public, max-age=" + Math.floor(maxage / 1000);
    const immutable = Boolean(options.immutable ?? false);
    if (immutable) {
      cacheControlHeader += ", immutable";
    }
    res.set("Cache-Control", cacheControlHeader);
  }
  const lastModified = Boolean(options.lastModified ?? true);
  if (lastModified && !res.get("Last-Modified") && stat.mtime) {
    res.set("Last-Modified", stat.mtime.toUTCString());
  }
  const etag = Boolean(options.etag ?? true);
  if (etag && !res.get("ETag")) {
    res.etag(stat);
  }
  if (!res.get("Content-Type")) {
    res.type(extname(path));
  }
  const acceptRanges = Boolean(options.acceptRanges ?? true);
  if (acceptRanges && !res.get("Accept-Ranges")) {
    res.set("Accept-Ranges", "bytes");
  }
  // Conditional GET support
  if (isConditionalGET(req)) {
    if (isPreconditionFailure(req, res)) {
      return sendError(res, createError(412));
    }
    if (isCachable(res.status) && req.fresh) {
      removeContentHeaderFields(res);
      res.status = 304;
      return await res.end();
    }
  }
  // Adjust len to start/end options
  let offset = options.start ?? 0;
  let len = stat.size;
  len = Math.max(0, len - offset);
  if (options.end !== undefined) {
    const bytes = options.end - offset + 1;
    if (len > bytes) {
      len = bytes;
    }
  }
  const rangeHeader = req.headers.get("range");
  // Range support
  if (acceptRanges && BYTES_RANGE_REGEXP.test(rangeHeader)) {
    // parse
    let range = req.range(len, {
      combine: true,
    });
    // If-Range support
    if (!isRangeFresh(req, res)) {
      range = -2;
    }
    // unsatisfiable
    if (range === -1) {
      // Content-Range
      res.set("Content-Range", contentRange("bytes", len));
      // 416 Requested Range Not Satisfiable
      return sendError(
        res,
        createError(416, undefined, {
          headers: {
            "Content-Range": res.get("Content-Range"),
          },
        }),
      );
    }
    // Valid (syntactically invalid / multiple ranges are treated as a regular response)
    if (range !== -2 && range?.length === 1) {
      // Content-Range
      res.setStatus(206);
      res.set("Content-Range", contentRange("bytes", len, range[0]));
      // adjust for requested range
      offset += range[0].start;
      len = range[0].end - range[0].start + 1;
    }
  }
  // Set read options
  const file = await Deno.open(path, {
    read: true,
  });
  res.addResource(file.rid);
  // content-length
  res.set("Content-Length", len + "");
  return await res.send(await offsetFileReader(file, offset, len));
}
async function sendIndex(req, res, path, options, index) {
  let error;
  for (const i of index) {
    const pathUsingIndex = join(path, i);
    try {
      const stat = await Deno.stat(pathUsingIndex);
      if (!stat.isDirectory) {
        return await _send(req, res, pathUsingIndex, options, stat);
      } else if (options.onDirectory) {
        return options.onDirectory();
      }
    } catch (err) {
      error = err;
    }
  }
  return sendError(res, error);
}
async function sendExtension(req, res, path, options) {
  let error;
  const extensions = options.extensions !== undefined
    ? normalizeList(options.extensions, "extensions option")
    : [];
  for (const extension of extensions) {
    const pathUsingExtension = `${path}.${extension}`;
    try {
      const stat = await Deno.stat(pathUsingExtension);
      if (!stat.isDirectory) {
        return await _send(req, res, pathUsingExtension, options, stat);
      } else if (options.onDirectory) {
        return options.onDirectory();
      }
    } catch (err) {
      error = err;
    }
  }
  return sendError(res, error);
}
async function sendFile(req, res, path, options) {
  try {
    const stat = await Deno.stat(path);
    if (!stat.isDirectory) {
      return await _send(req, res, path, options, stat);
    } else if (options.onDirectory) {
      return options.onDirectory();
    }
    if (hasTrailingSlash(path)) {
      return sendError(res, createError(403));
    }
    res.set("Content-Type", "text/html; charset=UTF-8");
    res.set("Content-Security-Policy", "default-src 'none'");
    res.set("X-Content-Type-Options", "nosniff");
    return res.redirect(301, collapseLeadingSlashes(path + "/"));
  } catch (err) {
    if (
      ENOENT_REGEXP.test(err.message) && !extname(path) &&
      path[path.length - 1] !== sep
    ) {
      return await sendExtension(req, res, path, options);
    }
    return sendError(res, err);
  }
}
/**
 * decodeURIComponent.
 *
 * Allows V8 to only de-optimize this fn instead of all
 * of send().
 *
 * @param {string} path
 * @private
 */ function decode(path) {
  try {
    return decodeURIComponent(path);
  } catch (err) {
    return -1;
  }
}
export async function send(req, res, path, options) {
  // Decode the path
  const decodedPath = decode(path);
  if (decodedPath === -1) {
    return sendError(res, createError(400));
  }
  path = decodedPath;
  // null byte(s)
  if (~path.indexOf("\0")) {
    return sendError(res, createError(400));
  }
  const root = options.root ? resolve(options.root) : null;
  let parts;
  if (root !== null) {
    // normalize
    if (path) {
      path = normalize("." + sep + path);
    }
    // malicious path
    if (UP_PATH_REGEXP.test(path)) {
      return sendError(res, createError(403));
    }
    // explode path parts
    parts = path.split(sep);
    // join / normalize from optional root dir
    path = normalize(join(root, path));
  } else {
    // ".." is malicious without "root"
    if (UP_PATH_REGEXP.test(path)) {
      return sendError(res, createError(403));
    }
    // explode path parts
    parts = normalize(path).split(sep);
    // resolve the path
    path = normalize(path);
  }
  // dotfile handling
  if (containsDotFile(parts)) {
    const dotfiles = options.dotfiles ?? "ignore";
    if (dotfiles !== "ignore" && dotfiles !== "allow" && dotfiles !== "deny") {
      return sendError(
        res,
        new TypeError('dotfiles option must be "allow", "deny", or "ignore"'),
      );
    }
    switch (dotfiles) {
      case "allow":
        break;
      case "deny":
        return sendError(res, createError(403));
      case "ignore":
      default:
        return sendError(res, createError(404));
    }
  }
  const index = options.index !== undefined
    ? normalizeList(options.index, "index option")
    : [
      "index.html",
    ];
  if (index.length && hasTrailingSlash(path)) {
    return await sendIndex(req, res, path, options, index);
  }
  return await sendFile(req, res, path, options);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy91dGlscy9zZW5kLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEhlYXZpbHkgaW5zcGlyZWQgYnkgc2VuZCAoaHR0cHM6Ly9naXRodWIuY29tL3BpbGxhcmpzL3NlbmQvdHJlZS8wLjE3LjEpXG4gKiBcbiAqIHNlbmQgaXMgbGljZW5zZWQgYXMgZm9sbG93czpcbiAqIFxuICogKFRoZSBNSVQgTGljZW5zZSlcbiAqIFxuICogQ29weXJpZ2h0IChjKSAyMDEyIFRKIEhvbG93YXljaHVrXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtMjAxNiBEb3VnbGFzIENocmlzdG9waGVyIFdpbHNvblxuICogXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmdcbiAqIGEgY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuICogJ1NvZnR3YXJlJyksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuICogd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuICogZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvXG4gKiBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG9cbiAqIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqIFxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmVcbiAqIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICogXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCxcbiAqIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuICogTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULlxuICogSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTllcbiAqIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsXG4gKiBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRVxuICogU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG4gKiBcbiAqL1xuXG5pbXBvcnQge1xuICBjcmVhdGVFcnJvcixcbiAgZXh0bmFtZSxcbiAgam9pbixcbiAgbXMsXG4gIG5vcm1hbGl6ZSxcbiAgcmVzb2x2ZSxcbiAgc2VwLFxufSBmcm9tIFwiLi4vLi4vZGVwcy50c1wiO1xuaW1wb3J0IHR5cGUgeyBSZXF1ZXN0LCBSZXNwb25zZSB9IGZyb20gXCIuLi90eXBlcy50c1wiO1xuaW1wb3J0IHsgcGFyc2VIdHRwRGF0ZSwgcGFyc2VUb2tlbkxpc3QgfSBmcm9tIFwiLi9mcmVzaC50c1wiO1xuXG4vKipcbiAqIFJlZ3VsYXIgZXhwcmVzc2lvbiBmb3IgaWRlbnRpZnlpbmcgYSBieXRlcyBSYW5nZSBoZWFkZXIuXG4gKiBAcHJpdmF0ZVxuICovXG5jb25zdCBCWVRFU19SQU5HRV9SRUdFWFAgPSAvXiAqYnl0ZXM9LztcblxuLyoqXG4gKiBNYXhpbXVtIHZhbHVlIGFsbG93ZWQgZm9yIHRoZSBtYXggYWdlLlxuICogQHByaXZhdGVcbiAqL1xuY29uc3QgTUFYX01BWEFHRSA9IDYwICogNjAgKiAyNCAqIDM2NSAqIDEwMDA7IC8vIDEgeWVhclxuXG4vKipcbiAqIFJlZ3VsYXIgZXhwcmVzc2lvbiB0byBtYXRjaCBhIHBhdGggd2l0aCBhIGRpcmVjdG9yeSB1cCBjb21wb25lbnQuXG4gKiBAcHJpdmF0ZVxuICovXG5jb25zdCBVUF9QQVRIX1JFR0VYUCA9IC8oPzpefFtcXFxcL10pXFwuXFwuKD86W1xcXFwvXXwkKS87XG5cbmNvbnN0IEVOT0VOVF9SRUdFWFAgPSAvXFwob3MgZXJyb3IgMlxcKSQvO1xuY29uc3QgRU5BTUVUT09MT05HX1JFR0VYUCA9IC9cXChvcyBlcnJvciA2M1xcKSQvO1xuXG4vKipcbiAqIE5vcm1hbGl6ZSB0aGUgaW5kZXggb3B0aW9uIGludG8gYW4gYXJyYXkuXG4gKlxuICogQHBhcmFtIHtib29sZWFufHN0cmluZ3xhcnJheX0gdmFsdWVcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBub3JtYWxpemVMaXN0KFxuICB2YWx1ZTogZmFsc2UgfCBzdHJpbmcgfCBzdHJpbmdbXSxcbiAgbmFtZTogc3RyaW5nLFxuKTogc3RyaW5nW10ge1xuICBjb25zdCBsaXN0ID0gdmFsdWUgPT09IGZhbHNlID8gW10gOiBBcnJheS5pc0FycmF5KHZhbHVlKSA/IHZhbHVlIDogW3ZhbHVlXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAodHlwZW9mIGxpc3RbaV0gIT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IobmFtZSArIFwiIG11c3QgYmUgYXJyYXkgb2Ygc3RyaW5ncyBvciBmYWxzZVwiKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbGlzdDtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmUgaWYgcGF0aCBwYXJ0cyBjb250YWluIGEgZG90ZmlsZS5cbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBjb250YWluc0RvdEZpbGUocGFydHM6IHN0cmluZ1tdKTogYm9vbGVhbiB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBwYXJ0ID0gcGFydHNbaV07XG5cbiAgICBpZiAocGFydC5sZW5ndGggPiAxICYmIHBhcnRbMF0gPT09IFwiLlwiKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIHBhdGhuYW1lIGVuZHMgd2l0aCBcIi9cIi5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aFxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYXNUcmFpbGluZ1NsYXNoKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gcGF0aFtwYXRoLmxlbmd0aCAtIDFdID09PSBcIi9cIjtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiB0aGlzIGlzIGEgY29uZGl0aW9uYWwgR0VUIHJlcXVlc3QuXG4gKlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGlzQ29uZGl0aW9uYWxHRVQocmVxOiBSZXF1ZXN0KTogYm9vbGVhbiB7XG4gIHJldHVybiBCb29sZWFuKFxuICAgIHJlcS5oZWFkZXJzLmdldChcImlmLW1hdGNoXCIpIHx8XG4gICAgICByZXEuaGVhZGVycy5nZXQoXCJpZi11bm1vZGlmaWVkLXNpbmNlXCIpIHx8XG4gICAgICByZXEuaGVhZGVycy5nZXQoXCJpZi1ub25lLW1hdGNoXCIpIHx8XG4gICAgICByZXEuaGVhZGVycy5nZXQoXCJpZi1tb2RpZmllZC1zaW5jZVwiKSxcbiAgKTtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiB0aGUgcmVxdWVzdCBwcmVjb25kaXRpb25zIGZhaWxlZC5cbiAqXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gaXNQcmVjb25kaXRpb25GYWlsdXJlKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSk6IGJvb2xlYW4ge1xuICAvLyBpZi1tYXRjaFxuICBjb25zdCBtYXRjaCA9IHJlcS5oZWFkZXJzLmdldChcImlmLW1hdGNoXCIpO1xuXG4gIGlmIChtYXRjaCkge1xuICAgIGNvbnN0IGV0YWcgPSByZXMuZ2V0KFwiRVRhZ1wiKTtcblxuICAgIHJldHVybiAhZXRhZyB8fFxuICAgICAgKG1hdGNoICE9PSBcIipcIiAmJiBwYXJzZVRva2VuTGlzdChtYXRjaCkuZXZlcnkoZnVuY3Rpb24gKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiBtYXRjaCAhPT0gZXRhZyAmJiBtYXRjaCAhPT0gXCJXL1wiICsgZXRhZyAmJiBcIlcvXCIgKyBtYXRjaCAhPT0gZXRhZztcbiAgICAgIH0pKTtcbiAgfVxuXG4gIC8vIGlmLXVubW9kaWZpZWQtc2luY2VcbiAgY29uc3QgdW5tb2RpZmllZFNpbmNlID0gcGFyc2VIdHRwRGF0ZShyZXEuZ2V0KFwiaWYtdW5tb2RpZmllZC1zaW5jZVwiKSk7XG5cbiAgaWYgKCFpc05hTih1bm1vZGlmaWVkU2luY2UpKSB7XG4gICAgY29uc3QgbGFzdE1vZGlmaWVkID0gcGFyc2VIdHRwRGF0ZShyZXMuZ2V0KFwiTGFzdC1Nb2RpZmllZFwiKSk7XG5cbiAgICByZXR1cm4gaXNOYU4obGFzdE1vZGlmaWVkKSB8fCBsYXN0TW9kaWZpZWQgPiB1bm1vZGlmaWVkU2luY2U7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgQ29udGVudC1SYW5nZSBoZWFkZXIuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGVcbiAqIEBwYXJhbSB7bnVtYmVyfSBzaXplXG4gKiBAcGFyYW0ge2FycmF5fSBbcmFuZ2VdXG4gKiBAcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGNvbnRlbnRSYW5nZSh0eXBlOiBzdHJpbmcsIHNpemU6IG51bWJlciwgcmFuZ2U/OiBhbnkpOiBzdHJpbmcge1xuICByZXR1cm4gdHlwZSArIFwiIFwiICsgKHJhbmdlID8gcmFuZ2Uuc3RhcnQgKyBcIi1cIiArIHJhbmdlLmVuZCA6IFwiKlwiKSArIFwiL1wiICtcbiAgICBzaXplO1xufVxuXG4vKipcbiAqIFN0cmlwIGNvbnRlbnQtKiBoZWFkZXIgZmllbGRzLlxuICpcbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIHJlbW92ZUNvbnRlbnRIZWFkZXJGaWVsZHMocmVzOiBSZXNwb25zZSk6IHZvaWQge1xuICBjb25zdCBoZWFkZXJzOiBzdHJpbmdbXSA9IEFycmF5LmZyb20ocmVzLmhlYWRlcnM/LmtleXMoKSA/PyBbXSk7XG5cbiAgZm9yIChjb25zdCBoZWFkZXIgb2YgaGVhZGVycykge1xuICAgIGlmIChoZWFkZXIuc3Vic3RyKDAsIDgpID09PSBcImNvbnRlbnQtXCIgJiYgaGVhZGVyICE9PSBcImNvbnRlbnQtbG9jYXRpb25cIikge1xuICAgICAgcmVzLnVuc2V0KGhlYWRlcik7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIHJlcXVlc3QgaXMgY2FjaGVhYmxlLCBha2FcbiAqIHJlc3BvbmRlZCB3aXRoIDJ4eCBvciAzMDQgKHNlZSBSRkMgMjYxNiBzZWN0aW9uIDE0LjJ7NSw2fSkuXG4gKlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGlzQ2FjaGFibGUoc3RhdHVzQ29kZTogbnVtYmVyKTogYm9vbGVhbiB7XG4gIHJldHVybiAoc3RhdHVzQ29kZSA+PSAyMDAgJiYgc3RhdHVzQ29kZSA8IDMwMCkgfHxcbiAgICBzdGF0dXNDb2RlID09PSAzMDQ7XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIHJhbmdlIGlzIGZyZXNoLlxuICpcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBpc1JhbmdlRnJlc2gocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKTogYm9vbGVhbiB7XG4gIGNvbnN0IGlmUmFuZ2UgPSByZXEuZ2V0KFwiaWYtcmFuZ2VcIik7XG5cbiAgaWYgKCFpZlJhbmdlKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBpZi1yYW5nZSBhcyBldGFnXG4gIGlmIChpZlJhbmdlLmluZGV4T2YoJ1wiJykgIT09IC0xKSB7XG4gICAgY29uc3QgZXRhZyA9IHJlcy5nZXQoXCJFVGFnXCIpO1xuXG4gICAgcmV0dXJuIEJvb2xlYW4oZXRhZyAmJiBpZlJhbmdlLmluZGV4T2YoZXRhZykgIT09IC0xKTtcbiAgfVxuXG4gIC8vIGlmLXJhbmdlIGFzIG1vZGlmaWVkIGRhdGVcbiAgY29uc3QgbGFzdE1vZGlmaWVkID0gcmVzLmdldChcIkxhc3QtTW9kaWZpZWRcIik7XG5cbiAgcmV0dXJuIHBhcnNlSHR0cERhdGUobGFzdE1vZGlmaWVkKSA8PSBwYXJzZUh0dHBEYXRlKGlmUmFuZ2UpO1xufVxuXG4vKipcbiAqIENvbGxhcHNlIGFsbCBsZWFkaW5nIHNsYXNoZXMgaW50byBhIHNpbmdsZSBzbGFzaFxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJcbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGNvbGxhcHNlTGVhZGluZ1NsYXNoZXMoc3RyOiBzdHJpbmcpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoc3RyW2ldICE9PSBcIi9cIikge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGkgPiAxID8gXCIvXCIgKyBzdHIuc3Vic3RyKGkpIDogc3RyO1xufVxuXG4vKipcbiAqIENsZWFyIGFsbCBoZWFkZXJzIGZyb20gYSByZXNwb25zZS5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gcmVzXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBjbGVhckhlYWRlcnMocmVzOiBSZXNwb25zZSkge1xuICBjb25zdCBoZWFkZXJzID0gQXJyYXkuZnJvbShyZXMuaGVhZGVycz8ua2V5cygpID8/IFtdKTtcblxuICBmb3IgKGNvbnN0IGhlYWRlciBvZiBoZWFkZXJzKSB7XG4gICAgcmVzLnVuc2V0KGhlYWRlcik7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGUgYSA0MDQgZXJyb3IuXG4gKiBcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXG4gKiBAcmV0dXJucyB7RXJyb3J9XG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBjcmVhdGU0MDRFcnJvcigpOiBFcnJvciB7XG4gIGNvbnN0IGVycm9yOiBhbnkgPSBuZXcgRGVuby5lcnJvcnMuTm90Rm91bmQoKTtcbiAgZXJyb3Iuc3RhdHVzID0gNDA0O1xuICBlcnJvci5zdGF0dXNDb2RlID0gNDA0O1xuXG4gIHJldHVybiBlcnJvcjtcbn1cblxuLyoqXG4gKiBFbWl0IGVycm9ycy5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gcmVzXG4gKiBAcGFyYW0ge0Vycm9yfSBbZXJyb3JdXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2VuZEVycm9yKHJlczogUmVzcG9uc2UsIGVycm9yPzogYW55KTogdm9pZCB7XG4gIGNsZWFySGVhZGVycyhyZXMpO1xuXG4gIGlmIChlcnJvcj8uaGVhZGVycykge1xuICAgIHJlcy5zZXQoZXJyb3IuaGVhZGVycyk7XG4gIH1cblxuICBpZiAoIWVycm9yKSB7XG4gICAgdGhyb3cgY3JlYXRlRXJyb3IoXG4gICAgICBjcmVhdGU0MDRFcnJvcigpLFxuICAgICAgeyBjb2RlOiBcIkVOT0VOVFwiIH0sXG4gICAgKTtcbiAgfSBlbHNlIGlmIChFTk9FTlRfUkVHRVhQLnRlc3QoZXJyb3IubWVzc2FnZSkpIHtcbiAgICB0aHJvdyBjcmVhdGVFcnJvcihjcmVhdGU0MDRFcnJvcigpLCB7IGNvZGU6IFwiRU5PRU5UXCIgfSk7XG4gIH0gZWxzZSBpZiAoRU5BTUVUT09MT05HX1JFR0VYUC50ZXN0KGVycm9yLm1lc3NhZ2UpKSB7XG4gICAgdGhyb3cgY3JlYXRlRXJyb3IoY3JlYXRlNDA0RXJyb3IoKSwgeyBjb2RlOiBcIkVOQU1FVE9PTE9OR1wiIH0pO1xuICB9IGVsc2UgaWYgKGVycm9yLnN0YXR1cyA9PT0gNDA0IHx8IGVycm9yLnN0YXR1c0NvZGUgPT09IDQwNCkge1xuICAgIHRocm93IGNyZWF0ZUVycm9yKGNyZWF0ZTQwNEVycm9yKCksIHsgY29kZTogZXJyb3IuY29kZSB9KTtcbiAgfVxuXG4gIHRocm93IGNyZWF0ZUVycm9yKFxuICAgIGVycm9yLnN0YXR1cyA/PyBlcnJvci5zdGF0dXNDb2RlID8/IDUwMCxcbiAgICBlcnJvci5tZXNzYWdlLFxuICAgIHsgY29kZTogZXJyb3IuY29kZSB9LFxuICApO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIHJlYWQgb2Zmc2V0IG9mIHRoZSBwcm92aWRlZCBmaWxlIGFuZCByZXR1cm5zIGFcbiAqIERlbm8uUmVhZGVyIHRvIHJlYWQgdGhlIGZpbGUgZnJvbSB0aGUgb2Zmc2V0IHVudGlsIHRoZVxuICogcHJvdmlkZWQgY29udGVudExlbmd0aDtcbiAqIFxuICogQHBhcmFtIHtEZW5vLkZpbGV9IGZpbGVcbiAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXRcbiAqIEBwYXJhbSB7bnVtYmVyfSBjb250ZW50TGVuZ3RoXG4gKiBAcmV0dXJucyB7RGVuby5SZWFkZXJ9IHJlYWRlclxuICogQHByaXZhdGVcbiAqL1xuYXN5bmMgZnVuY3Rpb24gb2Zmc2V0RmlsZVJlYWRlcihcbiAgZmlsZTogRGVuby5GaWxlLFxuICBvZmZzZXQ6IG51bWJlcixcbiAgY29udGVudExlbmd0aDogbnVtYmVyLFxuKTogUHJvbWlzZTxEZW5vLlJlYWRlcj4ge1xuICBsZXQgdG90YWxSZWFkID0gMDtcbiAgbGV0IGZpbmlzaGVkID0gZmFsc2U7XG5cbiAgYXdhaXQgZmlsZS5zZWVrKG9mZnNldCwgRGVuby5TZWVrTW9kZS5TdGFydCk7XG5cbiAgYXN5bmMgZnVuY3Rpb24gcmVhZChidWY6IFVpbnQ4QXJyYXkpOiBQcm9taXNlPG51bWJlciB8IG51bGw+IHtcbiAgICBpZiAoZmluaXNoZWQpIHJldHVybiBudWxsO1xuXG4gICAgbGV0IHJlc3VsdDogbnVtYmVyIHwgbnVsbDtcbiAgICBjb25zdCByZW1haW5pbmcgPSBjb250ZW50TGVuZ3RoIC0gdG90YWxSZWFkO1xuXG4gICAgaWYgKHJlbWFpbmluZyA+PSBidWYuYnl0ZUxlbmd0aCkge1xuICAgICAgcmVzdWx0ID0gYXdhaXQgZmlsZS5yZWFkKGJ1Zik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHJlYWRCdWYgPSBidWYuc3ViYXJyYXkoMCwgcmVtYWluaW5nKTtcbiAgICAgIHJlc3VsdCA9IGF3YWl0IGZpbGUucmVhZChyZWFkQnVmKTtcbiAgICB9XG5cbiAgICBpZiAocmVzdWx0ICE9PSBudWxsKSB7XG4gICAgICB0b3RhbFJlYWQgKz0gcmVzdWx0O1xuICAgIH1cblxuICAgIGZpbmlzaGVkID0gdG90YWxSZWFkID09PSBjb250ZW50TGVuZ3RoO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHJldHVybiB7IHJlYWQgfTtcbn1cblxuLyoqXG4gKiBUcmFuc2ZlciB0aGUgZmlsZSBhdCBgcGF0aGAuXG4gKiBcbiAqIEBwYXJhbSB7b2JqZWN0fSByZXMgXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFxuICogQHBhcmFtIHtvYmplY3R9IHN0YXQgXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIF9zZW5kKFxuICByZXE6IFJlcXVlc3QsXG4gIHJlczogUmVzcG9uc2UsXG4gIHBhdGg6IHN0cmluZyxcbiAgb3B0aW9uczogYW55LFxuICBzdGF0OiBEZW5vLkZpbGVJbmZvLFxuKSB7XG4gIGlmIChyZXMud3JpdHRlbikge1xuICAgIHJldHVybiBzZW5kRXJyb3IocmVzLCBjcmVhdGVFcnJvcig1MDAsIFwiUmVzcG9uc2UgYWxyZWFkeSB3cml0dGVuXCIpKTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLmJlZm9yZSkge1xuICAgIG9wdGlvbnMuYmVmb3JlKHJlcywgcGF0aCwgc3RhdCk7XG4gIH1cblxuICBjb25zdCBjYWNoZUNvbnRyb2wgPSBCb29sZWFuKG9wdGlvbnMuY2FjaGVDb250cm9sID8/IHRydWUpO1xuXG4gIGlmIChjYWNoZUNvbnRyb2wgJiYgIXJlcy5nZXQoXCJDYWNoZS1Db250cm9sXCIpKSB7XG4gICAgbGV0IG1heGFnZSA9IG9wdGlvbnMubWF4QWdlID8/IG9wdGlvbnMubWF4YWdlO1xuICAgIG1heGFnZSA9IHR5cGVvZiBtYXhhZ2UgPT09IFwic3RyaW5nXCIgPyBtcyhtYXhhZ2UpIDogTnVtYmVyKG1heGFnZSk7XG4gICAgbWF4YWdlID0gIWlzTmFOKG1heGFnZSkgPyBNYXRoLm1pbihNYXRoLm1heCgwLCBtYXhhZ2UpLCBNQVhfTUFYQUdFKSA6IDA7XG5cbiAgICBsZXQgY2FjaGVDb250cm9sSGVhZGVyID0gXCJwdWJsaWMsIG1heC1hZ2U9XCIgKyBNYXRoLmZsb29yKG1heGFnZSAvIDEwMDApO1xuXG4gICAgY29uc3QgaW1tdXRhYmxlID0gQm9vbGVhbihvcHRpb25zLmltbXV0YWJsZSA/PyBmYWxzZSk7XG5cbiAgICBpZiAoaW1tdXRhYmxlKSB7XG4gICAgICBjYWNoZUNvbnRyb2xIZWFkZXIgKz0gXCIsIGltbXV0YWJsZVwiO1xuICAgIH1cblxuICAgIHJlcy5zZXQoXCJDYWNoZS1Db250cm9sXCIsIGNhY2hlQ29udHJvbEhlYWRlcik7XG4gIH1cblxuICBjb25zdCBsYXN0TW9kaWZpZWQgPSBCb29sZWFuKG9wdGlvbnMubGFzdE1vZGlmaWVkID8/IHRydWUpO1xuXG4gIGlmIChsYXN0TW9kaWZpZWQgJiYgIXJlcy5nZXQoXCJMYXN0LU1vZGlmaWVkXCIpICYmIHN0YXQubXRpbWUpIHtcbiAgICByZXMuc2V0KFwiTGFzdC1Nb2RpZmllZFwiLCBzdGF0Lm10aW1lLnRvVVRDU3RyaW5nKCkpO1xuICB9XG5cbiAgY29uc3QgZXRhZyA9IEJvb2xlYW4ob3B0aW9ucy5ldGFnID8/IHRydWUpO1xuXG4gIGlmIChldGFnICYmICFyZXMuZ2V0KFwiRVRhZ1wiKSkge1xuICAgIHJlcy5ldGFnKHN0YXQpO1xuICB9XG5cbiAgaWYgKCFyZXMuZ2V0KFwiQ29udGVudC1UeXBlXCIpKSB7XG4gICAgcmVzLnR5cGUoZXh0bmFtZShwYXRoKSk7XG4gIH1cblxuICBjb25zdCBhY2NlcHRSYW5nZXMgPSBCb29sZWFuKG9wdGlvbnMuYWNjZXB0UmFuZ2VzID8/IHRydWUpO1xuXG4gIGlmIChhY2NlcHRSYW5nZXMgJiYgIXJlcy5nZXQoXCJBY2NlcHQtUmFuZ2VzXCIpKSB7XG4gICAgcmVzLnNldChcIkFjY2VwdC1SYW5nZXNcIiwgXCJieXRlc1wiKTtcbiAgfVxuXG4gIC8vIENvbmRpdGlvbmFsIEdFVCBzdXBwb3J0XG4gIGlmIChpc0NvbmRpdGlvbmFsR0VUKHJlcSkpIHtcbiAgICBpZiAoaXNQcmVjb25kaXRpb25GYWlsdXJlKHJlcSwgcmVzKSkge1xuICAgICAgcmV0dXJuIHNlbmRFcnJvcihyZXMsIGNyZWF0ZUVycm9yKDQxMikpO1xuICAgIH1cblxuICAgIGlmIChpc0NhY2hhYmxlKHJlcy5zdGF0dXMgYXMgbnVtYmVyKSAmJiByZXEuZnJlc2gpIHtcbiAgICAgIHJlbW92ZUNvbnRlbnRIZWFkZXJGaWVsZHMocmVzKTtcbiAgICAgIHJlcy5zdGF0dXMgPSAzMDQ7XG5cbiAgICAgIHJldHVybiBhd2FpdCByZXMuZW5kKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gQWRqdXN0IGxlbiB0byBzdGFydC9lbmQgb3B0aW9uc1xuICBsZXQgb2Zmc2V0OiBudW1iZXIgPSBvcHRpb25zLnN0YXJ0ID8/IDA7XG4gIGxldCBsZW46IG51bWJlciA9IHN0YXQuc2l6ZTtcbiAgbGVuID0gTWF0aC5tYXgoMCwgbGVuIC0gb2Zmc2V0KTtcblxuICBpZiAob3B0aW9ucy5lbmQgIT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IGJ5dGVzID0gb3B0aW9ucy5lbmQgLSBvZmZzZXQgKyAxO1xuXG4gICAgaWYgKGxlbiA+IGJ5dGVzKSB7XG4gICAgICBsZW4gPSBieXRlcztcbiAgICB9XG4gIH1cblxuICBjb25zdCByYW5nZUhlYWRlciA9IHJlcS5oZWFkZXJzLmdldChcInJhbmdlXCIpIGFzIHN0cmluZztcblxuICAvLyBSYW5nZSBzdXBwb3J0XG4gIGlmIChhY2NlcHRSYW5nZXMgJiYgQllURVNfUkFOR0VfUkVHRVhQLnRlc3QocmFuZ2VIZWFkZXIpKSB7XG4gICAgLy8gcGFyc2VcbiAgICBsZXQgcmFuZ2UgPSByZXEucmFuZ2UobGVuLCB7XG4gICAgICBjb21iaW5lOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgLy8gSWYtUmFuZ2Ugc3VwcG9ydFxuICAgIGlmICghaXNSYW5nZUZyZXNoKHJlcSwgcmVzKSkge1xuICAgICAgcmFuZ2UgPSAtMjtcbiAgICB9XG5cbiAgICAvLyB1bnNhdGlzZmlhYmxlXG4gICAgaWYgKHJhbmdlID09PSAtMSkge1xuICAgICAgLy8gQ29udGVudC1SYW5nZVxuICAgICAgcmVzLnNldChcIkNvbnRlbnQtUmFuZ2VcIiwgY29udGVudFJhbmdlKFwiYnl0ZXNcIiwgbGVuKSk7XG5cbiAgICAgIC8vIDQxNiBSZXF1ZXN0ZWQgUmFuZ2UgTm90IFNhdGlzZmlhYmxlXG4gICAgICByZXR1cm4gc2VuZEVycm9yKFxuICAgICAgICByZXMsXG4gICAgICAgIGNyZWF0ZUVycm9yKDQxNiwgdW5kZWZpbmVkLCB7XG4gICAgICAgICAgaGVhZGVyczogeyBcIkNvbnRlbnQtUmFuZ2VcIjogcmVzLmdldChcIkNvbnRlbnQtUmFuZ2VcIikgfSxcbiAgICAgICAgfSksXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIFZhbGlkIChzeW50YWN0aWNhbGx5IGludmFsaWQgLyBtdWx0aXBsZSByYW5nZXMgYXJlIHRyZWF0ZWQgYXMgYSByZWd1bGFyIHJlc3BvbnNlKVxuICAgIGlmIChyYW5nZSAhPT0gLTIgJiYgcmFuZ2U/Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgLy8gQ29udGVudC1SYW5nZVxuICAgICAgcmVzLnNldFN0YXR1cygyMDYpO1xuICAgICAgcmVzLnNldChcIkNvbnRlbnQtUmFuZ2VcIiwgY29udGVudFJhbmdlKFwiYnl0ZXNcIiwgbGVuLCByYW5nZVswXSkpO1xuXG4gICAgICAvLyBhZGp1c3QgZm9yIHJlcXVlc3RlZCByYW5nZVxuICAgICAgb2Zmc2V0ICs9IHJhbmdlWzBdLnN0YXJ0O1xuICAgICAgbGVuID0gcmFuZ2VbMF0uZW5kIC0gcmFuZ2VbMF0uc3RhcnQgKyAxO1xuICAgIH1cbiAgfVxuXG4gIC8vIFNldCByZWFkIG9wdGlvbnNcbiAgY29uc3QgZmlsZSA9IGF3YWl0IERlbm8ub3BlbihwYXRoLCB7IHJlYWQ6IHRydWUgfSk7XG4gIHJlcy5hZGRSZXNvdXJjZShmaWxlLnJpZCk7XG5cbiAgLy8gY29udGVudC1sZW5ndGhcbiAgcmVzLnNldChcIkNvbnRlbnQtTGVuZ3RoXCIsIGxlbiArIFwiXCIpO1xuXG4gIHJldHVybiBhd2FpdCByZXMuc2VuZChhd2FpdCBvZmZzZXRGaWxlUmVhZGVyKGZpbGUsIG9mZnNldCwgbGVuKSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHNlbmRJbmRleChcbiAgcmVxOiBSZXF1ZXN0LFxuICByZXM6IFJlc3BvbnNlLFxuICBwYXRoOiBzdHJpbmcsXG4gIG9wdGlvbnM6IGFueSxcbiAgaW5kZXg6IHN0cmluZ1tdLFxuKSB7XG4gIGxldCBlcnJvcjogRXJyb3IgfCB1bmRlZmluZWQ7XG5cbiAgZm9yIChjb25zdCBpIG9mIGluZGV4KSB7XG4gICAgY29uc3QgcGF0aFVzaW5nSW5kZXggPSBqb2luKHBhdGgsIGkpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHN0YXQgPSBhd2FpdCBEZW5vLnN0YXQocGF0aFVzaW5nSW5kZXgpO1xuXG4gICAgICBpZiAoIXN0YXQuaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IF9zZW5kKHJlcSwgcmVzLCBwYXRoVXNpbmdJbmRleCwgb3B0aW9ucywgc3RhdCk7XG4gICAgICB9IGVsc2UgaWYgKG9wdGlvbnMub25EaXJlY3RvcnkpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMub25EaXJlY3RvcnkoKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGVycm9yID0gZXJyO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzZW5kRXJyb3IocmVzLCBlcnJvcik7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHNlbmRFeHRlbnNpb24oXG4gIHJlcTogUmVxdWVzdCxcbiAgcmVzOiBSZXNwb25zZSxcbiAgcGF0aDogc3RyaW5nLFxuICBvcHRpb25zOiBhbnksXG4pIHtcbiAgbGV0IGVycm9yOiBFcnJvciB8IHVuZGVmaW5lZDtcblxuICBjb25zdCBleHRlbnNpb25zID0gb3B0aW9ucy5leHRlbnNpb25zICE9PSB1bmRlZmluZWRcbiAgICA/IG5vcm1hbGl6ZUxpc3Qob3B0aW9ucy5leHRlbnNpb25zLCBcImV4dGVuc2lvbnMgb3B0aW9uXCIpXG4gICAgOiBbXTtcblxuICBmb3IgKGNvbnN0IGV4dGVuc2lvbiBvZiBleHRlbnNpb25zKSB7XG4gICAgY29uc3QgcGF0aFVzaW5nRXh0ZW5zaW9uID0gYCR7cGF0aH0uJHtleHRlbnNpb259YDtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBzdGF0ID0gYXdhaXQgRGVuby5zdGF0KHBhdGhVc2luZ0V4dGVuc2lvbik7XG5cbiAgICAgIGlmICghc3RhdC5pc0RpcmVjdG9yeSkge1xuICAgICAgICByZXR1cm4gYXdhaXQgX3NlbmQocmVxLCByZXMsIHBhdGhVc2luZ0V4dGVuc2lvbiwgb3B0aW9ucywgc3RhdCk7XG4gICAgICB9IGVsc2UgaWYgKG9wdGlvbnMub25EaXJlY3RvcnkpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMub25EaXJlY3RvcnkoKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGVycm9yID0gZXJyO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzZW5kRXJyb3IocmVzLCBlcnJvcik7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHNlbmRGaWxlKFxuICByZXE6IFJlcXVlc3QsXG4gIHJlczogUmVzcG9uc2UsXG4gIHBhdGg6IHN0cmluZyxcbiAgb3B0aW9uczogYW55LFxuKSB7XG4gIHRyeSB7XG4gICAgY29uc3Qgc3RhdCA9IGF3YWl0IERlbm8uc3RhdChwYXRoKTtcblxuICAgIGlmICghc3RhdC5pc0RpcmVjdG9yeSkge1xuICAgICAgcmV0dXJuIGF3YWl0IF9zZW5kKHJlcSwgcmVzLCBwYXRoLCBvcHRpb25zLCBzdGF0KTtcbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMub25EaXJlY3RvcnkpIHtcbiAgICAgIHJldHVybiBvcHRpb25zLm9uRGlyZWN0b3J5KCk7XG4gICAgfVxuXG4gICAgaWYgKGhhc1RyYWlsaW5nU2xhc2gocGF0aCkpIHtcbiAgICAgIHJldHVybiBzZW5kRXJyb3IocmVzLCBjcmVhdGVFcnJvcig0MDMpKTtcbiAgICB9XG5cbiAgICByZXMuc2V0KFwiQ29udGVudC1UeXBlXCIsIFwidGV4dC9odG1sOyBjaGFyc2V0PVVURi04XCIpO1xuICAgIHJlcy5zZXQoXCJDb250ZW50LVNlY3VyaXR5LVBvbGljeVwiLCBcImRlZmF1bHQtc3JjICdub25lJ1wiKTtcbiAgICByZXMuc2V0KFwiWC1Db250ZW50LVR5cGUtT3B0aW9uc1wiLCBcIm5vc25pZmZcIik7XG5cbiAgICByZXR1cm4gcmVzLnJlZGlyZWN0KDMwMSwgY29sbGFwc2VMZWFkaW5nU2xhc2hlcyhwYXRoICsgXCIvXCIpKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKFxuICAgICAgRU5PRU5UX1JFR0VYUC50ZXN0KGVyci5tZXNzYWdlKSAmJiAhZXh0bmFtZShwYXRoKSAmJlxuICAgICAgcGF0aFtwYXRoLmxlbmd0aCAtIDFdICE9PSBzZXBcbiAgICApIHtcbiAgICAgIHJldHVybiBhd2FpdCBzZW5kRXh0ZW5zaW9uKHJlcSwgcmVzLCBwYXRoLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2VuZEVycm9yKHJlcywgZXJyKTtcbiAgfVxufVxuXG4vKipcbiAqIGRlY29kZVVSSUNvbXBvbmVudC5cbiAqXG4gKiBBbGxvd3MgVjggdG8gb25seSBkZS1vcHRpbWl6ZSB0aGlzIGZuIGluc3RlYWQgb2YgYWxsXG4gKiBvZiBzZW5kKCkuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHBhdGhcbiAqIEBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gZGVjb2RlKHBhdGg6IHN0cmluZykge1xuICB0cnkge1xuICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQocGF0aCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiAtMTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2VuZDxUID0gUmVzcG9uc2U8YW55Pj4oXG4gIHJlcTogUmVxdWVzdCxcbiAgcmVzOiBULFxuICBwYXRoOiBzdHJpbmcsXG4gIG9wdGlvbnM6IGFueSxcbik6IFByb21pc2U8VCB8IHZvaWQ+O1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlbmQoXG4gIHJlcTogUmVxdWVzdCxcbiAgcmVzOiBSZXNwb25zZSxcbiAgcGF0aDogc3RyaW5nLFxuICBvcHRpb25zOiBhbnksXG4pIHtcbiAgLy8gRGVjb2RlIHRoZSBwYXRoXG4gIGNvbnN0IGRlY29kZWRQYXRoID0gZGVjb2RlKHBhdGgpO1xuXG4gIGlmIChkZWNvZGVkUGF0aCA9PT0gLTEpIHtcbiAgICByZXR1cm4gc2VuZEVycm9yKHJlcywgY3JlYXRlRXJyb3IoNDAwKSk7XG4gIH1cblxuICBwYXRoID0gZGVjb2RlZFBhdGg7XG5cbiAgLy8gbnVsbCBieXRlKHMpXG4gIGlmICh+cGF0aC5pbmRleE9mKFwiXFwwXCIpKSB7XG4gICAgcmV0dXJuIHNlbmRFcnJvcihyZXMsIGNyZWF0ZUVycm9yKDQwMCkpO1xuICB9XG5cbiAgY29uc3Qgcm9vdCA9IG9wdGlvbnMucm9vdCA/IHJlc29sdmUob3B0aW9ucy5yb290KSA6IG51bGw7XG5cbiAgbGV0IHBhcnRzO1xuICBpZiAocm9vdCAhPT0gbnVsbCkge1xuICAgIC8vIG5vcm1hbGl6ZVxuICAgIGlmIChwYXRoKSB7XG4gICAgICBwYXRoID0gbm9ybWFsaXplKFwiLlwiICsgc2VwICsgcGF0aCk7XG4gICAgfVxuXG4gICAgLy8gbWFsaWNpb3VzIHBhdGhcbiAgICBpZiAoVVBfUEFUSF9SRUdFWFAudGVzdChwYXRoKSkge1xuICAgICAgcmV0dXJuIHNlbmRFcnJvcihyZXMsIGNyZWF0ZUVycm9yKDQwMykpO1xuICAgIH1cblxuICAgIC8vIGV4cGxvZGUgcGF0aCBwYXJ0c1xuICAgIHBhcnRzID0gcGF0aC5zcGxpdChzZXApO1xuXG4gICAgLy8gam9pbiAvIG5vcm1hbGl6ZSBmcm9tIG9wdGlvbmFsIHJvb3QgZGlyXG4gICAgcGF0aCA9IG5vcm1hbGl6ZShqb2luKHJvb3QsIHBhdGgpKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBcIi4uXCIgaXMgbWFsaWNpb3VzIHdpdGhvdXQgXCJyb290XCJcbiAgICBpZiAoVVBfUEFUSF9SRUdFWFAudGVzdChwYXRoKSkge1xuICAgICAgcmV0dXJuIHNlbmRFcnJvcihyZXMsIGNyZWF0ZUVycm9yKDQwMykpO1xuICAgIH1cblxuICAgIC8vIGV4cGxvZGUgcGF0aCBwYXJ0c1xuICAgIHBhcnRzID0gbm9ybWFsaXplKHBhdGgpLnNwbGl0KHNlcCk7XG5cbiAgICAvLyByZXNvbHZlIHRoZSBwYXRoXG4gICAgcGF0aCA9IG5vcm1hbGl6ZShwYXRoKTtcbiAgfVxuXG4gIC8vIGRvdGZpbGUgaGFuZGxpbmdcbiAgaWYgKGNvbnRhaW5zRG90RmlsZShwYXJ0cykpIHtcbiAgICBjb25zdCBkb3RmaWxlcyA9IG9wdGlvbnMuZG90ZmlsZXMgPz8gXCJpZ25vcmVcIjtcblxuICAgIGlmIChkb3RmaWxlcyAhPT0gXCJpZ25vcmVcIiAmJiBkb3RmaWxlcyAhPT0gXCJhbGxvd1wiICYmIGRvdGZpbGVzICE9PSBcImRlbnlcIikge1xuICAgICAgcmV0dXJuIHNlbmRFcnJvcihcbiAgICAgICAgcmVzLFxuICAgICAgICBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICdkb3RmaWxlcyBvcHRpb24gbXVzdCBiZSBcImFsbG93XCIsIFwiZGVueVwiLCBvciBcImlnbm9yZVwiJyxcbiAgICAgICAgKSxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgc3dpdGNoIChkb3RmaWxlcykge1xuICAgICAgY2FzZSBcImFsbG93XCI6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImRlbnlcIjpcbiAgICAgICAgcmV0dXJuIHNlbmRFcnJvcihyZXMsIGNyZWF0ZUVycm9yKDQwMykpO1xuICAgICAgY2FzZSBcImlnbm9yZVwiOlxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHNlbmRFcnJvcihyZXMsIGNyZWF0ZUVycm9yKDQwNCkpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGluZGV4ID0gb3B0aW9ucy5pbmRleCAhPT0gdW5kZWZpbmVkXG4gICAgPyBub3JtYWxpemVMaXN0KG9wdGlvbnMuaW5kZXgsIFwiaW5kZXggb3B0aW9uXCIpXG4gICAgOiBbXCJpbmRleC5odG1sXCJdO1xuXG4gIGlmIChpbmRleC5sZW5ndGggJiYgaGFzVHJhaWxpbmdTbGFzaChwYXRoKSkge1xuICAgIHJldHVybiBhd2FpdCBzZW5kSW5kZXgocmVxLCByZXMsIHBhdGgsIG9wdGlvbnMsIGluZGV4KTtcbiAgfVxuXG4gIHJldHVybiBhd2FpdCBzZW5kRmlsZShyZXEsIHJlcywgcGF0aCwgb3B0aW9ucyk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUE2QkcsQUE3Qkg7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBNkJHLEFBN0JILEVBNkJHLFVBR0QsV0FBVyxFQUNYLE9BQU8sRUFDUCxJQUFJLEVBQ0osRUFBRSxFQUNGLFNBQVMsRUFDVCxPQUFPLEVBQ1AsR0FBRyxTQUNFLGFBQWU7U0FFYixhQUFhLEVBQUUsY0FBYyxTQUFRLFVBQVk7QUFFMUQsRUFHRyxBQUhIOzs7Q0FHRyxBQUhILEVBR0cs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
