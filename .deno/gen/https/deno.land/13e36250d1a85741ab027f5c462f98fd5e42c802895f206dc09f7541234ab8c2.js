/*!
 * Based on https://github.com/jshttp/type-is/blob/master/index.js
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * Copyright(c) 2020 Henry Zhuang
 * MIT Licensed
 */
import { lookup, parse, test } from "./deps.ts";
/**
 * Compare a `value` content-type with `types`.
 * Each `type` can be an extension like `html`,
 * a special shortcut like `multipart` or `urlencoded`,
 * or a mime type.
 *
 * If no types match, `false` is returned.
 * Otherwise, the first `type` that matches is returned.
 *
 * @param {String} mediaType
 * @param {Array} types
 */ export function is(mediaType, types) {
  let i;
  // remove parameters and normalize
  const val = tryNormalizeType(mediaType);
  // no type or invalid
  if (!val) {
    return false;
  }
  // no types, return the content type
  if (!types || !types.length) {
    return val;
  }
  let type;
  for (i = 0; i < types.length; i++) {
    const normalized = normalize(type = types[i]);
    if (normalized && mimeMatch(normalized, val)) {
      return type[0] === "+" || type.indexOf("*") !== -1 ? val : type;
    }
  }
  // no matches
  return false;
}
/**
 * Check if a request's header has a request body.
 * A request with a body __must__ either have `transfer-encoding`
 * or `content-length` headers set.
 * http://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#sec4.3
 *
 * @param {Object} request
 * @return {Boolean}
 */ export function hasBody(header) {
  return header.get("transfer-encoding") !== null ||
    !isNaN(parseInt(header.get("content-length") || "", 10));
}
/**
 * Check if the incoming request's header contains the "Content-Type"
 * header field, and it contains any of the give mime `type`s.
 * If there is no request body, `null` is returned.
 * If there is no content type, `false` is returned.
 * Otherwise, it returns the first `type` that matches.
 *
 * Examples:
 *
 *     // With Content-Type: text/html; charset=utf-8
 *     typeofrequest(header, [ 'html' ]); // => 'html'
 *     typeofrequest(header, ['text/html' ]); // => 'text/html'
 *     typeofrequest(header, ['text/*', 'application/json' ]); // => 'text/html'
 *
 *     // When Content-Type is application/json
 *     typeofrequest(header, [ 'json', 'urlencoded' ]); // => 'json'
 *     typeofrequest(header, [ 'application/json' ]); // => 'application/json'
 *     typeofrequest(header, [ 'html', 'application/*' ]); // => 'application/json'
 *
 *     typeofrequest(header, [ 'html' ]); // => false
 *
 * @param {String|Array} types...
 * @return {String|false|null}
 */ export function typeofrequest(header, types_) {
  const types = types_;
  // no body
  if (!hasBody(header)) {
    return null;
  }
  // request content type
  const value = header.get("content-type");
  if (!value) {
    return false;
  }
  return is(value, types);
}
/**
 * Normalize a mime type.
 * If it's a shorthand, expand it to a valid mime type.
 *
 * In general, you probably want:
 *
 *   const type = is(req, ['urlencoded', 'json', 'multipart']);
 *
 * Then use the appropriate body parsers.
 * These three are the most common request body types
 * and are thus ensured to work.
 *
 * @param {String} type
 */ export const normalize = function normalize(type) {
  switch (type) {
    case "urlencoded":
      return "application/x-www-form-urlencoded";
    case "multipart":
      return "multipart/*";
  }
  if (type[0] === "+") {
    // "+json" -> "*/*+json" expando
    return "*/*" + type;
  }
  return type.indexOf("/") === -1 ? lookup(type) : type;
};
/**
 * Check if `expected` mime type
 * matches `actual` mime type with
 * wildcard and +suffix support.
 *
 * @param {String} expected
 * @param {String} actual
 * @return {Boolean}
 */ function mimeMatch(expected, actual) {
  // split types
  const actualParts = actual.split("/");
  const expectedParts = expected.split("/");
  // invalid format
  if (actualParts.length !== 2 || expectedParts.length !== 2) {
    return false;
  }
  // validate type
  if (expectedParts[0] !== "*" && expectedParts[0] !== actualParts[0]) {
    return false;
  }
  // validate suffix wildcard
  if (expectedParts[1].substr(0, 2) === "*+") {
    return expectedParts[1].length <= actualParts[1].length + 1 &&
      expectedParts[1].substr(1) ===
        actualParts[1].substr(1 - expectedParts[1].length);
  }
  // validate subtype
  if (expectedParts[1] !== "*" && expectedParts[1] !== actualParts[1]) {
    return false;
  }
  return true;
}
/**
 * Normalize a type
 *
 * @param {string} value
 * @return {string}
 */ function normalizeType(value) {
  // parse the type
  const type = parse(value).type;
  if (!test(type)) {
    return null;
  }
  return type;
}
/**
 * Try to normalize a type
 *
 * @param {string} value
 * @return {string}
 */ function tryNormalizeType(value) {
  try {
    return normalizeType(value);
  } catch (err) {
    return null;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L3R5cGVfaXNAMS4wLjEvbW9kLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIEJhc2VkIG9uIGh0dHBzOi8vZ2l0aHViLmNvbS9qc2h0dHAvdHlwZS1pcy9ibG9iL21hc3Rlci9pbmRleC5qc1xuICogQ29weXJpZ2h0KGMpIDIwMTQgSm9uYXRoYW4gT25nXG4gKiBDb3B5cmlnaHQoYykgMjAxNC0yMDE1IERvdWdsYXMgQ2hyaXN0b3BoZXIgV2lsc29uXG4gKiBDb3B5cmlnaHQoYykgMjAyMCBIZW5yeSBaaHVhbmdcbiAqIE1JVCBMaWNlbnNlZFxuICovXG5cbmltcG9ydCB7IGxvb2t1cCwgcGFyc2UsIHRlc3QgfSBmcm9tIFwiLi9kZXBzLnRzXCI7XG5cbi8qKlxuICogQ29tcGFyZSBhIGB2YWx1ZWAgY29udGVudC10eXBlIHdpdGggYHR5cGVzYC5cbiAqIEVhY2ggYHR5cGVgIGNhbiBiZSBhbiBleHRlbnNpb24gbGlrZSBgaHRtbGAsXG4gKiBhIHNwZWNpYWwgc2hvcnRjdXQgbGlrZSBgbXVsdGlwYXJ0YCBvciBgdXJsZW5jb2RlZGAsXG4gKiBvciBhIG1pbWUgdHlwZS5cbiAqXG4gKiBJZiBubyB0eXBlcyBtYXRjaCwgYGZhbHNlYCBpcyByZXR1cm5lZC5cbiAqIE90aGVyd2lzZSwgdGhlIGZpcnN0IGB0eXBlYCB0aGF0IG1hdGNoZXMgaXMgcmV0dXJuZWQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG1lZGlhVHlwZVxuICogQHBhcmFtIHtBcnJheX0gdHlwZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzKG1lZGlhVHlwZTogc3RyaW5nLCB0eXBlcz86IHN0cmluZ1tdKTogYm9vbGVhbiB8IHN0cmluZyB7XG4gIGxldCBpO1xuICAvLyByZW1vdmUgcGFyYW1ldGVycyBhbmQgbm9ybWFsaXplXG4gIGNvbnN0IHZhbCA9IHRyeU5vcm1hbGl6ZVR5cGUobWVkaWFUeXBlKTtcblxuICAvLyBubyB0eXBlIG9yIGludmFsaWRcbiAgaWYgKCF2YWwpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBubyB0eXBlcywgcmV0dXJuIHRoZSBjb250ZW50IHR5cGVcbiAgaWYgKCF0eXBlcyB8fCAhdHlwZXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHZhbDtcbiAgfVxuXG4gIGxldCB0eXBlO1xuICBmb3IgKGkgPSAwOyBpIDwgdHlwZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplKHR5cGUgPSB0eXBlc1tpXSk7XG4gICAgaWYgKG5vcm1hbGl6ZWQgJiYgbWltZU1hdGNoKG5vcm1hbGl6ZWQsIHZhbCkpIHtcbiAgICAgIHJldHVybiB0eXBlWzBdID09PSBcIitcIiB8fCB0eXBlLmluZGV4T2YoXCIqXCIpICE9PSAtMSA/IHZhbCA6IHR5cGU7XG4gICAgfVxuICB9XG5cbiAgLy8gbm8gbWF0Y2hlc1xuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgYSByZXF1ZXN0J3MgaGVhZGVyIGhhcyBhIHJlcXVlc3QgYm9keS5cbiAqIEEgcmVxdWVzdCB3aXRoIGEgYm9keSBfX211c3RfXyBlaXRoZXIgaGF2ZSBgdHJhbnNmZXItZW5jb2RpbmdgXG4gKiBvciBgY29udGVudC1sZW5ndGhgIGhlYWRlcnMgc2V0LlxuICogaHR0cDovL3d3dy53My5vcmcvUHJvdG9jb2xzL3JmYzI2MTYvcmZjMjYxNi1zZWM0Lmh0bWwjc2VjNC4zXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHJlcXVlc3RcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYXNCb2R5KGhlYWRlcjogSGVhZGVycyk6IGJvb2xlYW4ge1xuICByZXR1cm4gaGVhZGVyLmdldChcInRyYW5zZmVyLWVuY29kaW5nXCIpICE9PSBudWxsIHx8XG4gICAgIWlzTmFOKHBhcnNlSW50KGhlYWRlci5nZXQoXCJjb250ZW50LWxlbmd0aFwiKSB8fCBcIlwiLCAxMCkpO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIHRoZSBpbmNvbWluZyByZXF1ZXN0J3MgaGVhZGVyIGNvbnRhaW5zIHRoZSBcIkNvbnRlbnQtVHlwZVwiXG4gKiBoZWFkZXIgZmllbGQsIGFuZCBpdCBjb250YWlucyBhbnkgb2YgdGhlIGdpdmUgbWltZSBgdHlwZWBzLlxuICogSWYgdGhlcmUgaXMgbm8gcmVxdWVzdCBib2R5LCBgbnVsbGAgaXMgcmV0dXJuZWQuXG4gKiBJZiB0aGVyZSBpcyBubyBjb250ZW50IHR5cGUsIGBmYWxzZWAgaXMgcmV0dXJuZWQuXG4gKiBPdGhlcndpc2UsIGl0IHJldHVybnMgdGhlIGZpcnN0IGB0eXBlYCB0aGF0IG1hdGNoZXMuXG4gKlxuICogRXhhbXBsZXM6XG4gKlxuICogICAgIC8vIFdpdGggQ29udGVudC1UeXBlOiB0ZXh0L2h0bWw7IGNoYXJzZXQ9dXRmLThcbiAqICAgICB0eXBlb2ZyZXF1ZXN0KGhlYWRlciwgWyAnaHRtbCcgXSk7IC8vID0+ICdodG1sJ1xuICogICAgIHR5cGVvZnJlcXVlc3QoaGVhZGVyLCBbJ3RleHQvaHRtbCcgXSk7IC8vID0+ICd0ZXh0L2h0bWwnXG4gKiAgICAgdHlwZW9mcmVxdWVzdChoZWFkZXIsIFsndGV4dC8qJywgJ2FwcGxpY2F0aW9uL2pzb24nIF0pOyAvLyA9PiAndGV4dC9odG1sJ1xuICpcbiAqICAgICAvLyBXaGVuIENvbnRlbnQtVHlwZSBpcyBhcHBsaWNhdGlvbi9qc29uXG4gKiAgICAgdHlwZW9mcmVxdWVzdChoZWFkZXIsIFsgJ2pzb24nLCAndXJsZW5jb2RlZCcgXSk7IC8vID0+ICdqc29uJ1xuICogICAgIHR5cGVvZnJlcXVlc3QoaGVhZGVyLCBbICdhcHBsaWNhdGlvbi9qc29uJyBdKTsgLy8gPT4gJ2FwcGxpY2F0aW9uL2pzb24nXG4gKiAgICAgdHlwZW9mcmVxdWVzdChoZWFkZXIsIFsgJ2h0bWwnLCAnYXBwbGljYXRpb24vKicgXSk7IC8vID0+ICdhcHBsaWNhdGlvbi9qc29uJ1xuICpcbiAqICAgICB0eXBlb2ZyZXF1ZXN0KGhlYWRlciwgWyAnaHRtbCcgXSk7IC8vID0+IGZhbHNlXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8QXJyYXl9IHR5cGVzLi4uXG4gKiBAcmV0dXJuIHtTdHJpbmd8ZmFsc2V8bnVsbH1cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gdHlwZW9mcmVxdWVzdChcbiAgaGVhZGVyOiBIZWFkZXJzLFxuICB0eXBlc18/OiBzdHJpbmdbXSxcbik6IG51bGwgfCBib29sZWFuIHwgc3RyaW5nIHtcbiAgY29uc3QgdHlwZXMgPSB0eXBlc187XG5cbiAgLy8gbm8gYm9keVxuICBpZiAoIWhhc0JvZHkoaGVhZGVyKSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gcmVxdWVzdCBjb250ZW50IHR5cGVcbiAgY29uc3QgdmFsdWUgPSBoZWFkZXIuZ2V0KFwiY29udGVudC10eXBlXCIpO1xuXG4gIGlmICghdmFsdWUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gaXModmFsdWUsIHR5cGVzKTtcbn1cblxuLyoqXG4gKiBOb3JtYWxpemUgYSBtaW1lIHR5cGUuXG4gKiBJZiBpdCdzIGEgc2hvcnRoYW5kLCBleHBhbmQgaXQgdG8gYSB2YWxpZCBtaW1lIHR5cGUuXG4gKlxuICogSW4gZ2VuZXJhbCwgeW91IHByb2JhYmx5IHdhbnQ6XG4gKlxuICogICBjb25zdCB0eXBlID0gaXMocmVxLCBbJ3VybGVuY29kZWQnLCAnanNvbicsICdtdWx0aXBhcnQnXSk7XG4gKlxuICogVGhlbiB1c2UgdGhlIGFwcHJvcHJpYXRlIGJvZHkgcGFyc2Vycy5cbiAqIFRoZXNlIHRocmVlIGFyZSB0aGUgbW9zdCBjb21tb24gcmVxdWVzdCBib2R5IHR5cGVzXG4gKiBhbmQgYXJlIHRodXMgZW5zdXJlZCB0byB3b3JrLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlXG4gKi9cbmV4cG9ydCBjb25zdCBub3JtYWxpemUgPSBmdW5jdGlvbiBub3JtYWxpemUodHlwZTogc3RyaW5nKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSBcInVybGVuY29kZWRcIjpcbiAgICAgIHJldHVybiBcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZFwiO1xuICAgIGNhc2UgXCJtdWx0aXBhcnRcIjpcbiAgICAgIHJldHVybiBcIm11bHRpcGFydC8qXCI7XG4gIH1cblxuICBpZiAodHlwZVswXSA9PT0gXCIrXCIpIHtcbiAgICAvLyBcIitqc29uXCIgLT4gXCIqLyoranNvblwiIGV4cGFuZG9cbiAgICByZXR1cm4gXCIqLypcIiArIHR5cGU7XG4gIH1cblxuICByZXR1cm4gdHlwZS5pbmRleE9mKFwiL1wiKSA9PT0gLTEgPyBsb29rdXAodHlwZSkgOiB0eXBlO1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiBgZXhwZWN0ZWRgIG1pbWUgdHlwZVxuICogbWF0Y2hlcyBgYWN0dWFsYCBtaW1lIHR5cGUgd2l0aFxuICogd2lsZGNhcmQgYW5kICtzdWZmaXggc3VwcG9ydC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXhwZWN0ZWRcbiAqIEBwYXJhbSB7U3RyaW5nfSBhY3R1YWxcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIG1pbWVNYXRjaChleHBlY3RlZDogc3RyaW5nLCBhY3R1YWw6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAvLyBzcGxpdCB0eXBlc1xuICBjb25zdCBhY3R1YWxQYXJ0cyA9IGFjdHVhbC5zcGxpdChcIi9cIik7XG4gIGNvbnN0IGV4cGVjdGVkUGFydHMgPSBleHBlY3RlZC5zcGxpdChcIi9cIik7XG5cbiAgLy8gaW52YWxpZCBmb3JtYXRcbiAgaWYgKGFjdHVhbFBhcnRzLmxlbmd0aCAhPT0gMiB8fCBleHBlY3RlZFBhcnRzLmxlbmd0aCAhPT0gMikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIHZhbGlkYXRlIHR5cGVcbiAgaWYgKGV4cGVjdGVkUGFydHNbMF0gIT09IFwiKlwiICYmIGV4cGVjdGVkUGFydHNbMF0gIT09IGFjdHVhbFBhcnRzWzBdKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gdmFsaWRhdGUgc3VmZml4IHdpbGRjYXJkXG4gIGlmIChleHBlY3RlZFBhcnRzWzFdLnN1YnN0cigwLCAyKSA9PT0gXCIqK1wiKSB7XG4gICAgcmV0dXJuIGV4cGVjdGVkUGFydHNbMV0ubGVuZ3RoIDw9IGFjdHVhbFBhcnRzWzFdLmxlbmd0aCArIDEgJiZcbiAgICAgIGV4cGVjdGVkUGFydHNbMV0uc3Vic3RyKDEpID09PVxuICAgICAgICBhY3R1YWxQYXJ0c1sxXS5zdWJzdHIoMSAtIGV4cGVjdGVkUGFydHNbMV0ubGVuZ3RoKTtcbiAgfVxuXG4gIC8vIHZhbGlkYXRlIHN1YnR5cGVcbiAgaWYgKGV4cGVjdGVkUGFydHNbMV0gIT09IFwiKlwiICYmIGV4cGVjdGVkUGFydHNbMV0gIT09IGFjdHVhbFBhcnRzWzFdKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogTm9ybWFsaXplIGEgdHlwZVxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBub3JtYWxpemVUeXBlKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgLy8gcGFyc2UgdGhlIHR5cGVcbiAgY29uc3QgdHlwZSA9IHBhcnNlKHZhbHVlKS50eXBlO1xuXG4gIGlmICghdGVzdCh0eXBlKSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHR5cGU7XG59XG5cbi8qKlxuICogVHJ5IHRvIG5vcm1hbGl6ZSBhIHR5cGVcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gdHJ5Tm9ybWFsaXplVHlwZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIG5vcm1hbGl6ZVR5cGUodmFsdWUpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEVBTUcsQUFOSDs7Ozs7O0NBTUcsQUFOSCxFQU1HLFVBRU0sTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLFNBQVEsU0FBVztBQUUvQyxFQVdHLEFBWEg7Ozs7Ozs7Ozs7O0NBV0csQUFYSCxFQVdHLGlCQUNhLEVBQUUsQ0FBQyxTQUFpQixFQUFFLEtBQWdCO1FBQ2hELENBQUM7SUFDTCxFQUFrQyxBQUFsQyxnQ0FBa0M7VUFDNUIsR0FBRyxHQUFHLGdCQUFnQixDQUFDLFNBQVM7SUFFdEMsRUFBcUIsQUFBckIsbUJBQXFCO1NBQ2hCLEdBQUc7ZUFDQyxLQUFLOztJQUdkLEVBQW9DLEFBQXBDLGtDQUFvQztTQUMvQixLQUFLLEtBQUssS0FBSyxDQUFDLE1BQU07ZUFDbEIsR0FBRzs7UUFHUixJQUFJO1FBQ0gsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO2NBQ3ZCLFVBQVUsR0FBRyxTQUFTLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDO1lBQ3ZDLFVBQVUsSUFBSSxTQUFTLENBQUMsVUFBVSxFQUFFLEdBQUc7bUJBQ2xDLElBQUksQ0FBQyxDQUFDLE9BQU0sQ0FBRyxLQUFJLElBQUksQ0FBQyxPQUFPLEVBQUMsQ0FBRyxRQUFPLENBQUMsR0FBRyxHQUFHLEdBQUcsSUFBSTs7O0lBSW5FLEVBQWEsQUFBYixXQUFhO1dBQ04sS0FBSzs7QUFHZCxFQVFHLEFBUkg7Ozs7Ozs7O0NBUUcsQUFSSCxFQVFHLGlCQUNhLE9BQU8sQ0FBQyxNQUFlO1dBQzlCLE1BQU0sQ0FBQyxHQUFHLEVBQUMsaUJBQW1CLE9BQU0sSUFBSSxLQUM1QyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUMsY0FBZ0IsVUFBUyxFQUFFOztBQUcxRCxFQXVCRyxBQXZCSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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
