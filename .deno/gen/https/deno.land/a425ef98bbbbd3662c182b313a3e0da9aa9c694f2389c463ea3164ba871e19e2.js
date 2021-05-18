/*!
 * Partial port of content-disposition (https://github.com/jshttp/content-disposition)
 * for Deno.
 *
 * Licensed as follows:
 *
 * (The MIT License)
 *
 * Copyright (c) 2014-2017 Douglas Christopher Wilson
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
import { basename } from "../../deps.ts";
/**
 * RegExp to match non attr-char, *after* encodeURIComponent (i.e. not including "%")
 * @private
 */ const ENCODE_URL_ATTR_CHAR_REGEXP = /[\x00-\x20"'()*,/:;<=>?@[\\\]{}\x7f]/g; // eslint-disable-line no-control-regex
/**
 * RegExp to match percent encoding escape.
 * @private
 */ const HEX_ESCAPE_REGEXP = /%[0-9A-Fa-f]{2}/;
const HEX_ESCAPE_REPLACE_REGEXP = /%([0-9A-Fa-f]{2})/g;
/**
 * RegExp to match non-latin1 characters.
 * @private
 */ const NON_LATIN1_REGEXP = /[^\x20-\x7e\xa0-\xff]/g;
/**
 * RegExp to match quoted-pair in RFC 2616
 *
 * quoted-pair = "\" CHAR
 * CHAR        = <any US-ASCII character (octets 0 - 127)>
 * @private
 */ const QESC_REGEXP = /\\([\u0000-\u007f])/g; // eslint-disable-line no-control-regex
/**
 * RegExp to match chars that must be quoted-pair in RFC 2616
 * @private
 */ const QUOTE_REGEXP = /([\\"])/g;
/**
 * RegExp for constious RFC 2616 grammar
 *
 * parameter     = token "=" ( token | quoted-string )
 * token         = 1*<any CHAR except CTLs or separators>
 * separators    = "(" | ")" | "<" | ">" | "@"
 *               | "," | ";" | ":" | "\" | <">
 *               | "/" | "[" | "]" | "?" | "="
 *               | "{" | "}" | SP | HT
 * quoted-string = ( <"> *(qdtext | quoted-pair ) <"> )
 * qdtext        = <any TEXT except <">>
 * quoted-pair   = "\" CHAR
 * CHAR          = <any US-ASCII character (octets 0 - 127)>
 * TEXT          = <any OCTET except CTLs, but including LWS>
 * LWS           = [CRLF] 1*( SP | HT )
 * CRLF          = CR LF
 * CR            = <US-ASCII CR, carriage return (13)>
 * LF            = <US-ASCII LF, linefeed (10)>
 * SP            = <US-ASCII SP, space (32)>
 * HT            = <US-ASCII HT, horizontal-tab (9)>
 * CTL           = <any US-ASCII control character (octets 0 - 31) and DEL (127)>
 * OCTET         = <any 8-bit sequence of data>
 * @private
 */ const PARAM_REGEXP =
  /;[\x09\x20]*([!#$%&'*+.0-9A-Z^_`a-z|~-]+)[\x09\x20]*=[\x09\x20]*("(?:[\x20!\x23-\x5b\x5d-\x7e\x80-\xff]|\\[\x20-\x7e])*"|[!#$%&'*+.0-9A-Z^_`a-z|~-]+)[\x09\x20]*/g; // eslint-disable-line no-control-regex
const TEXT_REGEXP = /^[\x20-\x7e\x80-\xff]+$/;
const TOKEN_REGEXP = /^[!#$%&'*+.0-9A-Z^_`a-z|~-]+$/;
/**
 * RegExp for constious RFC 5987 grammar
 *
 * ext-value     = charset  "'" [ language ] "'" value-chars
 * charset       = "UTF-8" / "ISO-8859-1" / mime-charset
 * mime-charset  = 1*mime-charsetc
 * mime-charsetc = ALPHA / DIGIT
 *               / "!" / "#" / "$" / "%" / "&"
 *               / "+" / "-" / "^" / "_" / "`"
 *               / "{" / "}" / "~"
 * language      = ( 2*3ALPHA [ extlang ] )
 *               / 4ALPHA
 *               / 5*8ALPHA
 * extlang       = *3( "-" 3ALPHA )
 * value-chars   = *( pct-encoded / attr-char )
 * pct-encoded   = "%" HEXDIG HEXDIG
 * attr-char     = ALPHA / DIGIT
 *               / "!" / "#" / "$" / "&" / "+" / "-" / "."
 *               / "^" / "_" / "`" / "|" / "~"
 * @private
 */ const EXT_VALUE_REGEXP =
  /^([A-Za-z0-9!#$%&+\-^_`{}~]+)'(?:[A-Za-z]{2,3}(?:-[A-Za-z]{3}){0,3}|[A-Za-z]{4,8}|)'((?:%[0-9A-Fa-f]{2}|[A-Za-z0-9!#$&+.^_`|~-])+)$/;
/**
 * RegExp for constious RFC 6266 grammar
 *
 * disposition-type = "inline" | "attachment" | disp-ext-type
 * disp-ext-type    = token
 * disposition-parm = filename-parm | disp-ext-parm
 * filename-parm    = "filename" "=" value
 *                  | "filename*" "=" ext-value
 * disp-ext-parm    = token "=" value
 *                  | ext-token "=" ext-value
 * ext-token        = <the characters in token, followed by "*">
 * @private
 */ const DISPOSITION_TYPE_REGEXP =
  /^([!#$%&'*+.0-9A-Z^_`a-z|~-]+)[\x09\x20]*(?:$|;)/;
/**
 * Get ISO-8859-1 version of string.
 *
 * @param {string} val
 * @return {string}
 * @private
 */ function getLatin1(val) {
  // simple Unicode -> ISO-8859-1 transformation
  return String(val).replace(NON_LATIN1_REGEXP, "?");
}
/**
 * Create parameters object from filename and fallback.
 *
 * @param {string} [filename]
 * @return {object}
 * @private
 */ function createParams(filename) {
  if (filename === undefined) {
    return;
  }
  const params = {};
  if (typeof filename !== "string") {
    throw new TypeError("filename must be a string");
  }
  // restrict to file base name
  const name = basename(filename);
  // determine if name is suitable for quoted string
  const isQuotedString = TEXT_REGEXP.test(name);
  // generate fallback name
  const fallbackName = getLatin1(name);
  const hasFallback = typeof fallbackName === "string" && fallbackName !== name;
  // set extended filename parameter
  if (hasFallback || !isQuotedString || HEX_ESCAPE_REGEXP.test(name)) {
    params["filename*"] = name;
  }
  // set filename parameter
  if (isQuotedString || hasFallback) {
    params.filename = hasFallback ? fallbackName : name;
  }
  return params;
}
/**
 * Quote a string for HTTP.
 *
 * @param {string} val
 * @return {string}
 * @private
 */ function qString(val) {
  const str = String(val);
  return '"' + str.replace(QUOTE_REGEXP, "\\$1") + '"';
}
/**
 * Percent encode a single character.
 *
 * @param {string} char
 * @return {string}
 * @private
 */ function pencode(char) {
  return "%" + String(char).charCodeAt(0).toString(16).toUpperCase();
}
/**
 * Encode a Unicode string for HTTP (RFC 5987).
 *
 * @param {string} val
 * @return {string}
 * @private
 */ function uString(val) {
  const str = String(val);
  // percent encode as UTF-8
  const encoded = encodeURIComponent(str).replace(
    ENCODE_URL_ATTR_CHAR_REGEXP,
    pencode,
  );
  return "UTF-8''" + encoded;
}
/**
 * Format object to Content-Disposition header.
 *
 * @param {object} obj
 * @param {string} obj.type
 * @param {object} [obj.parameters]
 * @return {string}
 * @private
 */ function format({ type, parameters }) {
  if (!type || typeof type !== "string" || !TOKEN_REGEXP.test(type)) {
    throw new TypeError("invalid type");
  }
  // start with normalized type
  let string = String(type).toLowerCase();
  // append parameters
  if (parameters && typeof parameters === "object") {
    let param;
    const params = Object.keys(parameters).sort();
    for (let i = 0; i < params.length; i++) {
      param = params[i];
      const val = param.substr(-1) === "*"
        ? uString(parameters[param])
        : qString(parameters[param]);
      string += "; " + param + "=" + val;
    }
  }
  return string;
}
/**
 * Creates a Content-Disposition Header value from
 * a type and an optional filename.
 *
 * @param {string} type
 * @param {string} [filename]
 * @returns {string}
 * @public
 */ export const contentDisposition = (type, filename) => {
  const parameters = createParams(filename);
  return format({
    type,
    parameters,
  });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy91dGlscy9jb250ZW50RGlzcG9zaXRpb24udHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8qIVxuICogUGFydGlhbCBwb3J0IG9mIGNvbnRlbnQtZGlzcG9zaXRpb24gKGh0dHBzOi8vZ2l0aHViLmNvbS9qc2h0dHAvY29udGVudC1kaXNwb3NpdGlvbilcbiAqIGZvciBEZW5vLlxuICpcbiAqIExpY2Vuc2VkIGFzIGZvbGxvd3M6XG4gKlxuICogKFRoZSBNSVQgTGljZW5zZSlcbiAqIFxuICogQ29weXJpZ2h0IChjKSAyMDE0LTIwMTcgRG91Z2xhcyBDaHJpc3RvcGhlciBXaWxzb25cbiAqIFxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nXG4gKiBhIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbiAqICdTb2Z0d2FyZScpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbiAqIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbiAqIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0b1xuICogcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvXG4gKiB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKiBcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlXG4gKiBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqIFxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICdBUyBJUycsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsXG4gKiBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0ZcbiAqIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC5cbiAqIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZXG4gKiBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULFxuICogVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEVcbiAqIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuICogXG4gKi9cblxuaW1wb3J0IHsgYmFzZW5hbWUgfSBmcm9tIFwiLi4vLi4vZGVwcy50c1wiO1xuXG4vKipcbiAqIFJlZ0V4cCB0byBtYXRjaCBub24gYXR0ci1jaGFyLCAqYWZ0ZXIqIGVuY29kZVVSSUNvbXBvbmVudCAoaS5lLiBub3QgaW5jbHVkaW5nIFwiJVwiKVxuICogQHByaXZhdGVcbiAqL1xuY29uc3QgRU5DT0RFX1VSTF9BVFRSX0NIQVJfUkVHRVhQID0gL1tcXHgwMC1cXHgyMFwiJygpKiwvOjs8PT4/QFtcXFxcXFxde31cXHg3Zl0vZzsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb250cm9sLXJlZ2V4XG5cbi8qKlxuICogUmVnRXhwIHRvIG1hdGNoIHBlcmNlbnQgZW5jb2RpbmcgZXNjYXBlLlxuICogQHByaXZhdGVcbiAqL1xuY29uc3QgSEVYX0VTQ0FQRV9SRUdFWFAgPSAvJVswLTlBLUZhLWZdezJ9LztcbmNvbnN0IEhFWF9FU0NBUEVfUkVQTEFDRV9SRUdFWFAgPSAvJShbMC05QS1GYS1mXXsyfSkvZztcblxuLyoqXG4gKiBSZWdFeHAgdG8gbWF0Y2ggbm9uLWxhdGluMSBjaGFyYWN0ZXJzLlxuICogQHByaXZhdGVcbiAqL1xuY29uc3QgTk9OX0xBVElOMV9SRUdFWFAgPSAvW15cXHgyMC1cXHg3ZVxceGEwLVxceGZmXS9nO1xuXG4vKipcbiAqIFJlZ0V4cCB0byBtYXRjaCBxdW90ZWQtcGFpciBpbiBSRkMgMjYxNlxuICpcbiAqIHF1b3RlZC1wYWlyID0gXCJcXFwiIENIQVJcbiAqIENIQVIgICAgICAgID0gPGFueSBVUy1BU0NJSSBjaGFyYWN0ZXIgKG9jdGV0cyAwIC0gMTI3KT5cbiAqIEBwcml2YXRlXG4gKi9cbmNvbnN0IFFFU0NfUkVHRVhQID0gL1xcXFwoW1xcdTAwMDAtXFx1MDA3Zl0pL2c7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29udHJvbC1yZWdleFxuXG4vKipcbiAqIFJlZ0V4cCB0byBtYXRjaCBjaGFycyB0aGF0IG11c3QgYmUgcXVvdGVkLXBhaXIgaW4gUkZDIDI2MTZcbiAqIEBwcml2YXRlXG4gKi9cbmNvbnN0IFFVT1RFX1JFR0VYUCA9IC8oW1xcXFxcIl0pL2c7XG5cbi8qKlxuICogUmVnRXhwIGZvciBjb25zdGlvdXMgUkZDIDI2MTYgZ3JhbW1hclxuICpcbiAqIHBhcmFtZXRlciAgICAgPSB0b2tlbiBcIj1cIiAoIHRva2VuIHwgcXVvdGVkLXN0cmluZyApXG4gKiB0b2tlbiAgICAgICAgID0gMSo8YW55IENIQVIgZXhjZXB0IENUTHMgb3Igc2VwYXJhdG9ycz5cbiAqIHNlcGFyYXRvcnMgICAgPSBcIihcIiB8IFwiKVwiIHwgXCI8XCIgfCBcIj5cIiB8IFwiQFwiXG4gKiAgICAgICAgICAgICAgIHwgXCIsXCIgfCBcIjtcIiB8IFwiOlwiIHwgXCJcXFwiIHwgPFwiPlxuICogICAgICAgICAgICAgICB8IFwiL1wiIHwgXCJbXCIgfCBcIl1cIiB8IFwiP1wiIHwgXCI9XCJcbiAqICAgICAgICAgICAgICAgfCBcIntcIiB8IFwifVwiIHwgU1AgfCBIVFxuICogcXVvdGVkLXN0cmluZyA9ICggPFwiPiAqKHFkdGV4dCB8IHF1b3RlZC1wYWlyICkgPFwiPiApXG4gKiBxZHRleHQgICAgICAgID0gPGFueSBURVhUIGV4Y2VwdCA8XCI+PlxuICogcXVvdGVkLXBhaXIgICA9IFwiXFxcIiBDSEFSXG4gKiBDSEFSICAgICAgICAgID0gPGFueSBVUy1BU0NJSSBjaGFyYWN0ZXIgKG9jdGV0cyAwIC0gMTI3KT5cbiAqIFRFWFQgICAgICAgICAgPSA8YW55IE9DVEVUIGV4Y2VwdCBDVExzLCBidXQgaW5jbHVkaW5nIExXUz5cbiAqIExXUyAgICAgICAgICAgPSBbQ1JMRl0gMSooIFNQIHwgSFQgKVxuICogQ1JMRiAgICAgICAgICA9IENSIExGXG4gKiBDUiAgICAgICAgICAgID0gPFVTLUFTQ0lJIENSLCBjYXJyaWFnZSByZXR1cm4gKDEzKT5cbiAqIExGICAgICAgICAgICAgPSA8VVMtQVNDSUkgTEYsIGxpbmVmZWVkICgxMCk+XG4gKiBTUCAgICAgICAgICAgID0gPFVTLUFTQ0lJIFNQLCBzcGFjZSAoMzIpPlxuICogSFQgICAgICAgICAgICA9IDxVUy1BU0NJSSBIVCwgaG9yaXpvbnRhbC10YWIgKDkpPlxuICogQ1RMICAgICAgICAgICA9IDxhbnkgVVMtQVNDSUkgY29udHJvbCBjaGFyYWN0ZXIgKG9jdGV0cyAwIC0gMzEpIGFuZCBERUwgKDEyNyk+XG4gKiBPQ1RFVCAgICAgICAgID0gPGFueSA4LWJpdCBzZXF1ZW5jZSBvZiBkYXRhPlxuICogQHByaXZhdGVcbiAqL1xuY29uc3QgUEFSQU1fUkVHRVhQID1cbiAgLztbXFx4MDlcXHgyMF0qKFshIyQlJicqKy4wLTlBLVpeX2BhLXp8fi1dKylbXFx4MDlcXHgyMF0qPVtcXHgwOVxceDIwXSooXCIoPzpbXFx4MjAhXFx4MjMtXFx4NWJcXHg1ZC1cXHg3ZVxceDgwLVxceGZmXXxcXFxcW1xceDIwLVxceDdlXSkqXCJ8WyEjJCUmJyorLjAtOUEtWl5fYGEtenx+LV0rKVtcXHgwOVxceDIwXSovZzsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb250cm9sLXJlZ2V4XG5jb25zdCBURVhUX1JFR0VYUCA9IC9eW1xceDIwLVxceDdlXFx4ODAtXFx4ZmZdKyQvO1xuY29uc3QgVE9LRU5fUkVHRVhQID0gL15bISMkJSYnKisuMC05QS1aXl9gYS16fH4tXSskLztcblxuLyoqXG4gKiBSZWdFeHAgZm9yIGNvbnN0aW91cyBSRkMgNTk4NyBncmFtbWFyXG4gKlxuICogZXh0LXZhbHVlICAgICA9IGNoYXJzZXQgIFwiJ1wiIFsgbGFuZ3VhZ2UgXSBcIidcIiB2YWx1ZS1jaGFyc1xuICogY2hhcnNldCAgICAgICA9IFwiVVRGLThcIiAvIFwiSVNPLTg4NTktMVwiIC8gbWltZS1jaGFyc2V0XG4gKiBtaW1lLWNoYXJzZXQgID0gMSptaW1lLWNoYXJzZXRjXG4gKiBtaW1lLWNoYXJzZXRjID0gQUxQSEEgLyBESUdJVFxuICogICAgICAgICAgICAgICAvIFwiIVwiIC8gXCIjXCIgLyBcIiRcIiAvIFwiJVwiIC8gXCImXCJcbiAqICAgICAgICAgICAgICAgLyBcIitcIiAvIFwiLVwiIC8gXCJeXCIgLyBcIl9cIiAvIFwiYFwiXG4gKiAgICAgICAgICAgICAgIC8gXCJ7XCIgLyBcIn1cIiAvIFwiflwiXG4gKiBsYW5ndWFnZSAgICAgID0gKCAyKjNBTFBIQSBbIGV4dGxhbmcgXSApXG4gKiAgICAgICAgICAgICAgIC8gNEFMUEhBXG4gKiAgICAgICAgICAgICAgIC8gNSo4QUxQSEFcbiAqIGV4dGxhbmcgICAgICAgPSAqMyggXCItXCIgM0FMUEhBIClcbiAqIHZhbHVlLWNoYXJzICAgPSAqKCBwY3QtZW5jb2RlZCAvIGF0dHItY2hhciApXG4gKiBwY3QtZW5jb2RlZCAgID0gXCIlXCIgSEVYRElHIEhFWERJR1xuICogYXR0ci1jaGFyICAgICA9IEFMUEhBIC8gRElHSVRcbiAqICAgICAgICAgICAgICAgLyBcIiFcIiAvIFwiI1wiIC8gXCIkXCIgLyBcIiZcIiAvIFwiK1wiIC8gXCItXCIgLyBcIi5cIlxuICogICAgICAgICAgICAgICAvIFwiXlwiIC8gXCJfXCIgLyBcImBcIiAvIFwifFwiIC8gXCJ+XCJcbiAqIEBwcml2YXRlXG4gKi9cbmNvbnN0IEVYVF9WQUxVRV9SRUdFWFAgPVxuICAvXihbQS1aYS16MC05ISMkJSYrXFwtXl9ge31+XSspJyg/OltBLVphLXpdezIsM30oPzotW0EtWmEtel17M30pezAsM318W0EtWmEtel17NCw4fXwpJygoPzolWzAtOUEtRmEtZl17Mn18W0EtWmEtejAtOSEjJCYrLl5fYHx+LV0pKykkLztcblxuLyoqXG4gKiBSZWdFeHAgZm9yIGNvbnN0aW91cyBSRkMgNjI2NiBncmFtbWFyXG4gKlxuICogZGlzcG9zaXRpb24tdHlwZSA9IFwiaW5saW5lXCIgfCBcImF0dGFjaG1lbnRcIiB8IGRpc3AtZXh0LXR5cGVcbiAqIGRpc3AtZXh0LXR5cGUgICAgPSB0b2tlblxuICogZGlzcG9zaXRpb24tcGFybSA9IGZpbGVuYW1lLXBhcm0gfCBkaXNwLWV4dC1wYXJtXG4gKiBmaWxlbmFtZS1wYXJtICAgID0gXCJmaWxlbmFtZVwiIFwiPVwiIHZhbHVlXG4gKiAgICAgICAgICAgICAgICAgIHwgXCJmaWxlbmFtZSpcIiBcIj1cIiBleHQtdmFsdWVcbiAqIGRpc3AtZXh0LXBhcm0gICAgPSB0b2tlbiBcIj1cIiB2YWx1ZVxuICogICAgICAgICAgICAgICAgICB8IGV4dC10b2tlbiBcIj1cIiBleHQtdmFsdWVcbiAqIGV4dC10b2tlbiAgICAgICAgPSA8dGhlIGNoYXJhY3RlcnMgaW4gdG9rZW4sIGZvbGxvd2VkIGJ5IFwiKlwiPlxuICogQHByaXZhdGVcbiAqL1xuY29uc3QgRElTUE9TSVRJT05fVFlQRV9SRUdFWFAgPVxuICAvXihbISMkJSYnKisuMC05QS1aXl9gYS16fH4tXSspW1xceDA5XFx4MjBdKig/OiR8OykvO1xuXG4vKipcbiAqIEdldCBJU08tODg1OS0xIHZlcnNpb24gb2Ygc3RyaW5nLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWxcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGdldExhdGluMSh2YWw6IGFueSkge1xuICAvLyBzaW1wbGUgVW5pY29kZSAtPiBJU08tODg1OS0xIHRyYW5zZm9ybWF0aW9uXG4gIHJldHVybiBTdHJpbmcodmFsKS5yZXBsYWNlKE5PTl9MQVRJTjFfUkVHRVhQLCBcIj9cIik7XG59XG5cbi8qKlxuICogQ3JlYXRlIHBhcmFtZXRlcnMgb2JqZWN0IGZyb20gZmlsZW5hbWUgYW5kIGZhbGxiYWNrLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBbZmlsZW5hbWVdXG4gKiBAcmV0dXJuIHtvYmplY3R9XG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBjcmVhdGVQYXJhbXMoZmlsZW5hbWU/OiBzdHJpbmcpIHtcbiAgaWYgKGZpbGVuYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBwYXJhbXM6IGFueSA9IHt9O1xuXG4gIGlmICh0eXBlb2YgZmlsZW5hbWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiZmlsZW5hbWUgbXVzdCBiZSBhIHN0cmluZ1wiKTtcbiAgfVxuXG4gIC8vIHJlc3RyaWN0IHRvIGZpbGUgYmFzZSBuYW1lXG4gIGNvbnN0IG5hbWUgPSBiYXNlbmFtZShmaWxlbmFtZSk7XG5cbiAgLy8gZGV0ZXJtaW5lIGlmIG5hbWUgaXMgc3VpdGFibGUgZm9yIHF1b3RlZCBzdHJpbmdcbiAgY29uc3QgaXNRdW90ZWRTdHJpbmcgPSBURVhUX1JFR0VYUC50ZXN0KG5hbWUpO1xuXG4gIC8vIGdlbmVyYXRlIGZhbGxiYWNrIG5hbWVcbiAgY29uc3QgZmFsbGJhY2tOYW1lID0gZ2V0TGF0aW4xKG5hbWUpO1xuICBjb25zdCBoYXNGYWxsYmFjayA9IHR5cGVvZiBmYWxsYmFja05hbWUgPT09IFwic3RyaW5nXCIgJiYgZmFsbGJhY2tOYW1lICE9PSBuYW1lO1xuXG4gIC8vIHNldCBleHRlbmRlZCBmaWxlbmFtZSBwYXJhbWV0ZXJcbiAgaWYgKGhhc0ZhbGxiYWNrIHx8ICFpc1F1b3RlZFN0cmluZyB8fCBIRVhfRVNDQVBFX1JFR0VYUC50ZXN0KG5hbWUpKSB7XG4gICAgcGFyYW1zW1wiZmlsZW5hbWUqXCJdID0gbmFtZTtcbiAgfVxuXG4gIC8vIHNldCBmaWxlbmFtZSBwYXJhbWV0ZXJcbiAgaWYgKGlzUXVvdGVkU3RyaW5nIHx8IGhhc0ZhbGxiYWNrKSB7XG4gICAgcGFyYW1zLmZpbGVuYW1lID0gaGFzRmFsbGJhY2sgPyBmYWxsYmFja05hbWUgOiBuYW1lO1xuICB9XG5cbiAgcmV0dXJuIHBhcmFtcztcbn1cblxuLyoqXG4gKiBRdW90ZSBhIHN0cmluZyBmb3IgSFRUUC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBxU3RyaW5nKHZhbDogYW55KSB7XG4gIGNvbnN0IHN0ciA9IFN0cmluZyh2YWwpO1xuXG4gIHJldHVybiAnXCInICsgc3RyLnJlcGxhY2UoUVVPVEVfUkVHRVhQLCBcIlxcXFwkMVwiKSArICdcIic7XG59XG5cbi8qKlxuICogUGVyY2VudCBlbmNvZGUgYSBzaW5nbGUgY2hhcmFjdGVyLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBjaGFyXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBwZW5jb2RlKGNoYXI6IGFueSkge1xuICByZXR1cm4gXCIlXCIgKyBTdHJpbmcoY2hhcilcbiAgICAuY2hhckNvZGVBdCgwKVxuICAgIC50b1N0cmluZygxNilcbiAgICAudG9VcHBlckNhc2UoKTtcbn1cblxuLyoqXG4gKiBFbmNvZGUgYSBVbmljb2RlIHN0cmluZyBmb3IgSFRUUCAoUkZDIDU5ODcpLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWxcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIHVTdHJpbmcodmFsOiBhbnkpIHtcbiAgY29uc3Qgc3RyID0gU3RyaW5nKHZhbCk7XG5cbiAgLy8gcGVyY2VudCBlbmNvZGUgYXMgVVRGLThcbiAgY29uc3QgZW5jb2RlZCA9IGVuY29kZVVSSUNvbXBvbmVudChzdHIpXG4gICAgLnJlcGxhY2UoRU5DT0RFX1VSTF9BVFRSX0NIQVJfUkVHRVhQLCBwZW5jb2RlKTtcblxuICByZXR1cm4gXCJVVEYtOCcnXCIgKyBlbmNvZGVkO1xufVxuXG4vKipcbiAqIEZvcm1hdCBvYmplY3QgdG8gQ29udGVudC1EaXNwb3NpdGlvbiBoZWFkZXIuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG9ialxuICogQHBhcmFtIHtzdHJpbmd9IG9iai50eXBlXG4gKiBAcGFyYW0ge29iamVjdH0gW29iai5wYXJhbWV0ZXJzXVxuICogQHJldHVybiB7c3RyaW5nfVxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gZm9ybWF0KHsgdHlwZSwgcGFyYW1ldGVycyB9OiB7IHR5cGU6IHN0cmluZzsgcGFyYW1ldGVyczogYW55IH0pIHtcbiAgaWYgKCF0eXBlIHx8IHR5cGVvZiB0eXBlICE9PSBcInN0cmluZ1wiIHx8ICFUT0tFTl9SRUdFWFAudGVzdCh0eXBlKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJpbnZhbGlkIHR5cGVcIik7XG4gIH1cblxuICAvLyBzdGFydCB3aXRoIG5vcm1hbGl6ZWQgdHlwZVxuICBsZXQgc3RyaW5nID0gU3RyaW5nKHR5cGUpLnRvTG93ZXJDYXNlKCk7XG5cbiAgLy8gYXBwZW5kIHBhcmFtZXRlcnNcbiAgaWYgKHBhcmFtZXRlcnMgJiYgdHlwZW9mIHBhcmFtZXRlcnMgPT09IFwib2JqZWN0XCIpIHtcbiAgICBsZXQgcGFyYW07XG4gICAgY29uc3QgcGFyYW1zID0gT2JqZWN0LmtleXMocGFyYW1ldGVycykuc29ydCgpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJhbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHBhcmFtID0gcGFyYW1zW2ldO1xuXG4gICAgICBjb25zdCB2YWwgPSBwYXJhbS5zdWJzdHIoLTEpID09PSBcIipcIlxuICAgICAgICA/IHVTdHJpbmcocGFyYW1ldGVyc1twYXJhbV0pXG4gICAgICAgIDogcVN0cmluZyhwYXJhbWV0ZXJzW3BhcmFtXSk7XG5cbiAgICAgIHN0cmluZyArPSBcIjsgXCIgKyBwYXJhbSArIFwiPVwiICsgdmFsO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzdHJpbmc7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIENvbnRlbnQtRGlzcG9zaXRpb24gSGVhZGVyIHZhbHVlIGZyb21cbiAqIGEgdHlwZSBhbmQgYW4gb3B0aW9uYWwgZmlsZW5hbWUuXG4gKiBcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIFxuICogQHBhcmFtIHtzdHJpbmd9IFtmaWxlbmFtZV0gXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICogQHB1YmxpY1xuICovXG5leHBvcnQgY29uc3QgY29udGVudERpc3Bvc2l0aW9uID0gKHR5cGU6IHN0cmluZywgZmlsZW5hbWU/OiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICBjb25zdCBwYXJhbWV0ZXJzID0gY3JlYXRlUGFyYW1zKGZpbGVuYW1lKTtcblxuICByZXR1cm4gZm9ybWF0KHtcbiAgICB0eXBlLFxuICAgIHBhcmFtZXRlcnMsXG4gIH0pO1xufTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQTZCRyxBQTdCSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0E2QkcsQUE3QkgsRUE2QkcsVUFFTSxRQUFRLFNBQVEsYUFBZTtBQUV4QyxFQUdHLEFBSEg7OztDQUdHLEFBSEgsRUFHRyxPQUNHLDJCQUEyQiwyQ0FBNEMsQ0FBdUMsQUFBdkMsRUFBdUMsQUFBdkMscUNBQXVDO0FBRXBILEVBR0csQUFISDs7O0NBR0csQUFISCxFQUdHLE9BQ0csaUJBQWlCO01BQ2pCLHlC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
