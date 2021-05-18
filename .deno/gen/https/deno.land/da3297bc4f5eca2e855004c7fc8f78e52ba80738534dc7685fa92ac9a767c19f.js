class ContentTypeImpl {
    constructor(type){
        this.type = type;
        this.parameters = Object.create(null);
    }
    type;
    parameters;
}
/**
 * RegExp to match *( ";" parameter ) in RFC 7231 sec 3.1.1.1
 *
 * parameter     = token "=" ( token / quoted-string )
 * token         = 1*tchar
 * tchar         = "!" / "#" / "$" / "%" / "&" / "'" / "*"
 *               / "+" / "-" / "." / "^" / "_" / "`" / "|" / "~"
 *               / DIGIT / ALPHA
 *               ; any VCHAR, except delimiters
 * quoted-string = DQUOTE *( qdtext / quoted-pair ) DQUOTE
 * qdtext        = HTAB / SP / %x21 / %x23-5B / %x5D-7E / obs-text
 * obs-text      = %x80-FF
 * quoted-pair   = "\" ( HTAB / SP / VCHAR / obs-text )
 */ const PARAM_REGEXP = /; *([!#$%&'*+.^_`|~0-9A-Za-z-]+) *= *("(?:[\u000b\u0020\u0021\u0023-\u005b\u005d-\u007e\u0080-\u00ff]|\\[\u000b\u0020-\u00ff])*"|[!#$%&'*+.^_`|~0-9A-Za-z-]+) */g;
const TEXT_REGEXP = /^[\u000b\u0020-\u007e\u0080-\u00ff]+$/;
const TOKEN_REGEXP = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
/**
 * RegExp to match quoted-pair in RFC 7230 sec 3.2.6
 *
 * quoted-pair = "\" ( HTAB / SP / VCHAR / obs-text )
 * obs-text    = %x80-FF
 */ const QESC_REGEXP = /\\([\u000b\u0020-\u00ff])/g;
/**
 * RegExp to match chars that must be quoted-pair in RFC 7230 sec 3.2.6
 */ const QUOTE_REGEXP = /([\\"])/g;
/**
 * RegExp to match type in RFC 7231 sec 3.1.1.1
 *
 * media-type = type "/" subtype
 * type       = token
 * subtype    = token
 */ const TYPE_REGEXP = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+\/[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
/**
 * Format ContentType object to media type.
 */ export function format(obj) {
    const parameters = obj.parameters;
    const type = obj.type;
    if (!type || !TYPE_REGEXP.test(type)) {
        throw new TypeError("invalid type");
    }
    let string = type;
    // append parameters
    if (parameters && typeof parameters === "object") {
        let param;
        const params = Object.keys(parameters).sort();
        for(let i = 0; i < params.length; i++){
            param = params[i];
            if (!TOKEN_REGEXP.test(param)) {
                throw new TypeError("invalid parameter name");
            }
            string += "; " + param + "=" + qstring(parameters[param]);
        }
    }
    return string;
}
/**
 * Parse media type to object.
 */ export function parse(str) {
    let index = str.indexOf(";");
    const type = index !== -1 ? str.substr(0, index).trim() : str.trim();
    if (!TYPE_REGEXP.test(type)) {
        throw new TypeError("invalid media type");
    }
    const obj = new ContentTypeImpl(type.toLowerCase());
    // parse parameters
    if (index !== -1) {
        let key;
        let match;
        let value;
        PARAM_REGEXP.lastIndex = index;
        while(match = PARAM_REGEXP.exec(str)){
            if (match.index !== index) {
                throw new TypeError("invalid parameter format");
            }
            index += match[0].length;
            key = match[1].toLowerCase();
            value = match[2];
            if (value[0] === '"') {
                // remove quotes and escapes
                value = value.substr(1, value.length - 2).replace(QESC_REGEXP, "$1");
            }
            obj.parameters[key] = value;
        }
        if (index !== str.length) {
            throw new TypeError("invalid parameter format");
        }
    }
    return obj;
}
/**
 * Quote a string if necessary.
 */ function qstring(val) {
    const str = String(val);
    // no need to quote tokens
    if (TOKEN_REGEXP.test(str)) {
        return str;
    }
    if (str.length > 0 && !TEXT_REGEXP.test(str)) {
        throw new TypeError("invalid parameter value");
    }
    return '"' + str.replace(QUOTE_REGEXP, "\\$1") + '"';
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L2NvbnRlbnRfdHlwZUAxLjAuMS9tb2QudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8qIVxuICogQmFzZWQgb24gaHR0cHM6Ly9naXRodWIuY29tL2pzaHR0cC9jb250ZW50LXR5cGUvYmxvYi9tYXN0ZXIvaW5kZXguanNcbiAqIENvcHlyaWdodChjKSAyMDE1IERvdWdsYXMgQ2hyaXN0b3BoZXIgV2lsc29uXG4gKiBDb3B5cmlnaHQoYykgMjAyMCBIZW5yeSBaaHVhbmdcbiAqIE1JVCBMaWNlbnNlZFxuICovXG5cbmV4cG9ydCB0eXBlIFBhcmFtZXRlcnMgPSB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9O1xuXG5leHBvcnQgaW50ZXJmYWNlIENvbnRlbnRUeXBlIHtcbiAgdHlwZTogc3RyaW5nO1xuICBwYXJhbWV0ZXJzPzogUGFyYW1ldGVycztcbn1cblxuY2xhc3MgQ29udGVudFR5cGVJbXBsIGltcGxlbWVudHMgQ29udGVudFR5cGUge1xuICBjb25zdHJ1Y3Rvcih0eXBlOiBzdHJpbmcpIHtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMucGFyYW1ldGVycyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIH1cbiAgdHlwZTogc3RyaW5nO1xuICBwYXJhbWV0ZXJzOiBQYXJhbWV0ZXJzO1xufVxuXG4vKipcbiAqIFJlZ0V4cCB0byBtYXRjaCAqKCBcIjtcIiBwYXJhbWV0ZXIgKSBpbiBSRkMgNzIzMSBzZWMgMy4xLjEuMVxuICpcbiAqIHBhcmFtZXRlciAgICAgPSB0b2tlbiBcIj1cIiAoIHRva2VuIC8gcXVvdGVkLXN0cmluZyApXG4gKiB0b2tlbiAgICAgICAgID0gMSp0Y2hhclxuICogdGNoYXIgICAgICAgICA9IFwiIVwiIC8gXCIjXCIgLyBcIiRcIiAvIFwiJVwiIC8gXCImXCIgLyBcIidcIiAvIFwiKlwiXG4gKiAgICAgICAgICAgICAgIC8gXCIrXCIgLyBcIi1cIiAvIFwiLlwiIC8gXCJeXCIgLyBcIl9cIiAvIFwiYFwiIC8gXCJ8XCIgLyBcIn5cIlxuICogICAgICAgICAgICAgICAvIERJR0lUIC8gQUxQSEFcbiAqICAgICAgICAgICAgICAgOyBhbnkgVkNIQVIsIGV4Y2VwdCBkZWxpbWl0ZXJzXG4gKiBxdW90ZWQtc3RyaW5nID0gRFFVT1RFICooIHFkdGV4dCAvIHF1b3RlZC1wYWlyICkgRFFVT1RFXG4gKiBxZHRleHQgICAgICAgID0gSFRBQiAvIFNQIC8gJXgyMSAvICV4MjMtNUIgLyAleDVELTdFIC8gb2JzLXRleHRcbiAqIG9icy10ZXh0ICAgICAgPSAleDgwLUZGXG4gKiBxdW90ZWQtcGFpciAgID0gXCJcXFwiICggSFRBQiAvIFNQIC8gVkNIQVIgLyBvYnMtdGV4dCApXG4gKi9cbmNvbnN0IFBBUkFNX1JFR0VYUCA9XG4gIC87ICooWyEjJCUmJyorLl5fYHx+MC05QS1aYS16LV0rKSAqPSAqKFwiKD86W1xcdTAwMGJcXHUwMDIwXFx1MDAyMVxcdTAwMjMtXFx1MDA1YlxcdTAwNWQtXFx1MDA3ZVxcdTAwODAtXFx1MDBmZl18XFxcXFtcXHUwMDBiXFx1MDAyMC1cXHUwMGZmXSkqXCJ8WyEjJCUmJyorLl5fYHx+MC05QS1aYS16LV0rKSAqL2c7XG5jb25zdCBURVhUX1JFR0VYUCA9IC9eW1xcdTAwMGJcXHUwMDIwLVxcdTAwN2VcXHUwMDgwLVxcdTAwZmZdKyQvO1xuY29uc3QgVE9LRU5fUkVHRVhQID0gL15bISMkJSYnKisuXl9gfH4wLTlBLVphLXotXSskLztcblxuLyoqXG4gKiBSZWdFeHAgdG8gbWF0Y2ggcXVvdGVkLXBhaXIgaW4gUkZDIDcyMzAgc2VjIDMuMi42XG4gKlxuICogcXVvdGVkLXBhaXIgPSBcIlxcXCIgKCBIVEFCIC8gU1AgLyBWQ0hBUiAvIG9icy10ZXh0IClcbiAqIG9icy10ZXh0ICAgID0gJXg4MC1GRlxuICovXG5jb25zdCBRRVNDX1JFR0VYUCA9IC9cXFxcKFtcXHUwMDBiXFx1MDAyMC1cXHUwMGZmXSkvZztcblxuLyoqXG4gKiBSZWdFeHAgdG8gbWF0Y2ggY2hhcnMgdGhhdCBtdXN0IGJlIHF1b3RlZC1wYWlyIGluIFJGQyA3MjMwIHNlYyAzLjIuNlxuICovXG5jb25zdCBRVU9URV9SRUdFWFAgPSAvKFtcXFxcXCJdKS9nO1xuXG4vKipcbiAqIFJlZ0V4cCB0byBtYXRjaCB0eXBlIGluIFJGQyA3MjMxIHNlYyAzLjEuMS4xXG4gKlxuICogbWVkaWEtdHlwZSA9IHR5cGUgXCIvXCIgc3VidHlwZVxuICogdHlwZSAgICAgICA9IHRva2VuXG4gKiBzdWJ0eXBlICAgID0gdG9rZW5cbiAqL1xuY29uc3QgVFlQRV9SRUdFWFAgPVxuICAvXlshIyQlJicqKy5eX2B8fjAtOUEtWmEtei1dK1xcL1shIyQlJicqKy5eX2B8fjAtOUEtWmEtei1dKyQvO1xuXG4vKipcbiAqIEZvcm1hdCBDb250ZW50VHlwZSBvYmplY3QgdG8gbWVkaWEgdHlwZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdChvYmo6IENvbnRlbnRUeXBlKTogc3RyaW5nIHtcbiAgY29uc3QgcGFyYW1ldGVycyA9IG9iai5wYXJhbWV0ZXJzO1xuICBjb25zdCB0eXBlID0gb2JqLnR5cGU7XG5cbiAgaWYgKCF0eXBlIHx8ICFUWVBFX1JFR0VYUC50ZXN0KHR5cGUpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImludmFsaWQgdHlwZVwiKTtcbiAgfVxuXG4gIGxldCBzdHJpbmcgPSB0eXBlO1xuXG4gIC8vIGFwcGVuZCBwYXJhbWV0ZXJzXG4gIGlmIChwYXJhbWV0ZXJzICYmIHR5cGVvZiBwYXJhbWV0ZXJzID09PSBcIm9iamVjdFwiKSB7XG4gICAgbGV0IHBhcmFtO1xuICAgIGNvbnN0IHBhcmFtcyA9IE9iamVjdC5rZXlzKHBhcmFtZXRlcnMpLnNvcnQoKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFyYW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBwYXJhbSA9IHBhcmFtc1tpXTtcblxuICAgICAgaWYgKCFUT0tFTl9SRUdFWFAudGVzdChwYXJhbSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImludmFsaWQgcGFyYW1ldGVyIG5hbWVcIik7XG4gICAgICB9XG5cbiAgICAgIHN0cmluZyArPSBcIjsgXCIgKyBwYXJhbSArIFwiPVwiICsgcXN0cmluZyhwYXJhbWV0ZXJzW3BhcmFtXSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHN0cmluZztcbn1cblxuLyoqXG4gKiBQYXJzZSBtZWRpYSB0eXBlIHRvIG9iamVjdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlKHN0cjogc3RyaW5nKTogQ29udGVudFR5cGUge1xuICBsZXQgaW5kZXggPSBzdHIuaW5kZXhPZihcIjtcIik7XG4gIGNvbnN0IHR5cGUgPSBpbmRleCAhPT0gLTEgPyBzdHIuc3Vic3RyKDAsIGluZGV4KS50cmltKCkgOiBzdHIudHJpbSgpO1xuXG4gIGlmICghVFlQRV9SRUdFWFAudGVzdCh0eXBlKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJpbnZhbGlkIG1lZGlhIHR5cGVcIik7XG4gIH1cblxuICBjb25zdCBvYmogPSBuZXcgQ29udGVudFR5cGVJbXBsKHR5cGUudG9Mb3dlckNhc2UoKSk7XG5cbiAgLy8gcGFyc2UgcGFyYW1ldGVyc1xuICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgbGV0IGtleTtcbiAgICBsZXQgbWF0Y2g7XG4gICAgbGV0IHZhbHVlO1xuXG4gICAgUEFSQU1fUkVHRVhQLmxhc3RJbmRleCA9IGluZGV4O1xuXG4gICAgd2hpbGUgKChtYXRjaCA9IFBBUkFNX1JFR0VYUC5leGVjKHN0cikpKSB7XG4gICAgICBpZiAobWF0Y2guaW5kZXggIT09IGluZGV4KSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJpbnZhbGlkIHBhcmFtZXRlciBmb3JtYXRcIik7XG4gICAgICB9XG5cbiAgICAgIGluZGV4ICs9IG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgIGtleSA9IG1hdGNoWzFdLnRvTG93ZXJDYXNlKCk7XG4gICAgICB2YWx1ZSA9IG1hdGNoWzJdO1xuXG4gICAgICBpZiAodmFsdWVbMF0gPT09ICdcIicpIHtcbiAgICAgICAgLy8gcmVtb3ZlIHF1b3RlcyBhbmQgZXNjYXBlc1xuICAgICAgICB2YWx1ZSA9IHZhbHVlXG4gICAgICAgICAgLnN1YnN0cigxLCB2YWx1ZS5sZW5ndGggLSAyKVxuICAgICAgICAgIC5yZXBsYWNlKFFFU0NfUkVHRVhQLCBcIiQxXCIpO1xuICAgICAgfVxuXG4gICAgICBvYmoucGFyYW1ldGVyc1trZXldID0gdmFsdWU7XG4gICAgfVxuXG4gICAgaWYgKGluZGV4ICE9PSBzdHIubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiaW52YWxpZCBwYXJhbWV0ZXIgZm9ybWF0XCIpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvYmo7XG59XG5cbi8qKlxuICogUXVvdGUgYSBzdHJpbmcgaWYgbmVjZXNzYXJ5LlxuICovXG5mdW5jdGlvbiBxc3RyaW5nKHZhbDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgc3RyID0gU3RyaW5nKHZhbCk7XG5cbiAgLy8gbm8gbmVlZCB0byBxdW90ZSB0b2tlbnNcbiAgaWYgKFRPS0VOX1JFR0VYUC50ZXN0KHN0cikpIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG5cbiAgaWYgKHN0ci5sZW5ndGggPiAwICYmICFURVhUX1JFR0VYUC50ZXN0KHN0cikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiaW52YWxpZCBwYXJhbWV0ZXIgdmFsdWVcIik7XG4gIH1cblxuICByZXR1cm4gJ1wiJyArIHN0ci5yZXBsYWNlKFFVT1RFX1JFR0VYUCwgXCJcXFxcJDFcIikgKyAnXCInO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJNQWNNLGVBQWU7Z0JBQ1AsSUFBWTthQUNqQixJQUFJLEdBQUcsSUFBSTthQUNYLFVBQVUsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUk7O0lBRXRDLElBQUk7SUFDSixVQUFVOztBQUdaLEVBYUcsQUFiSDs7Ozs7Ozs7Ozs7OztDQWFH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