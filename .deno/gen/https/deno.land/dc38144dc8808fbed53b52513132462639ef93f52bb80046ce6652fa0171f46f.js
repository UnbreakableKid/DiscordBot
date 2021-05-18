/*!
 * Based on https://github.com/jshttp/vary/blob/master/index.js
 * Copyright(c) 2014-2017 Douglas Christopher Wilson
 * Copyright(c) 2020 Henry Zhuang
 * MIT Licensed
 */ /**
 * RegExp to match field-name in RFC 7230 sec 3.2
 *
 * field-name    = token
 * token         = 1*tchar
 * tchar         = "!" / "#" / "$" / "%" / "&" / "'" / "*"
 *               / "+" / "-" / "." / "^" / "_" / "`" / "|" / "~"
 *               / DIGIT / ALPHA
 *               ; any VCHAR, except delimiters
 */ const FIELD_NAME_REGEXP = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
/**
 * Append a field to a vary header.
 *
 * @param {String} header
 * @param {String|Array} field
 * @return {String}
 * @public
 */ export function append(header, field) {
    // if (typeof header !== 'string') {
    //   throw new TypeError('header argument is required')
    // }
    // if (!field) {
    //   throw new TypeError('field argument is required')
    // }
    // existing, unspecified vary
    if (header === "*") {
        return header;
    }
    // get fields array
    const fields = !Array.isArray(field) ? parse(String(field)) : field;
    // assert on invalid field names
    for(let j = 0; j < fields.length; j++){
        if (!FIELD_NAME_REGEXP.test(fields[j])) {
            throw new TypeError(`field argument contains an invalid header name \`${fields[j]}\``);
        }
    }
    // enumerate current values
    let val = header;
    const vals = parse(header.toLowerCase());
    // unspecified vary
    if (fields.indexOf("*") !== -1 || vals.indexOf("*") !== -1) {
        return "*";
    }
    for(let i = 0; i < fields.length; i++){
        const fld = fields[i].toLowerCase();
        // append value (case-preserving)
        if (vals.indexOf(fld) === -1) {
            vals.push(fld);
            val = val ? val + ", " + fields[i] : fields[i];
        }
    }
    return val;
}
/**
 * Parse a vary header into an array.
 *
 * @param {String} header
 * @return {Array}
 * @private
 */ function parse(header) {
    let end = 0;
    const list = [];
    let start = 0;
    // gather tokens
    for(let i = 0, len = header.length; i < len; i++){
        switch(header.charCodeAt(i)){
            case 32:
                /*   */ if (start === end) {
                    start = end = i + 1;
                }
                break;
            case 44:
                /* , */ list.push(header.substring(start, end));
                start = end = i + 1;
                break;
            default:
                end = i + 1;
                break;
        }
    }
    // final token
    list.push(header.substring(start, end));
    return list;
}
/**
 * Mark that a request is varied on a header field.
 *
 * @param {Headers} header
 * @param {String|Array} field
 * @public
 */ export function vary(header, field) {
    // get existing header
    let val = header.get("vary") || "";
    // set new header
    if (val = append(val, field)) {
        header.set("vary", val);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L3ZhcnlAMS4wLjAvbW9kLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIEJhc2VkIG9uIGh0dHBzOi8vZ2l0aHViLmNvbS9qc2h0dHAvdmFyeS9ibG9iL21hc3Rlci9pbmRleC5qc1xuICogQ29weXJpZ2h0KGMpIDIwMTQtMjAxNyBEb3VnbGFzIENocmlzdG9waGVyIFdpbHNvblxuICogQ29weXJpZ2h0KGMpIDIwMjAgSGVucnkgWmh1YW5nXG4gKiBNSVQgTGljZW5zZWRcbiAqL1xuXG4vKipcbiAqIFJlZ0V4cCB0byBtYXRjaCBmaWVsZC1uYW1lIGluIFJGQyA3MjMwIHNlYyAzLjJcbiAqXG4gKiBmaWVsZC1uYW1lICAgID0gdG9rZW5cbiAqIHRva2VuICAgICAgICAgPSAxKnRjaGFyXG4gKiB0Y2hhciAgICAgICAgID0gXCIhXCIgLyBcIiNcIiAvIFwiJFwiIC8gXCIlXCIgLyBcIiZcIiAvIFwiJ1wiIC8gXCIqXCJcbiAqICAgICAgICAgICAgICAgLyBcIitcIiAvIFwiLVwiIC8gXCIuXCIgLyBcIl5cIiAvIFwiX1wiIC8gXCJgXCIgLyBcInxcIiAvIFwiflwiXG4gKiAgICAgICAgICAgICAgIC8gRElHSVQgLyBBTFBIQVxuICogICAgICAgICAgICAgICA7IGFueSBWQ0hBUiwgZXhjZXB0IGRlbGltaXRlcnNcbiAqL1xuXG5jb25zdCBGSUVMRF9OQU1FX1JFR0VYUCA9IC9eWyEjJCUmJyorXFwtLl5fYHx+MC05QS1aYS16XSskLztcblxuLyoqXG4gKiBBcHBlbmQgYSBmaWVsZCB0byBhIHZhcnkgaGVhZGVyLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBoZWFkZXJcbiAqIEBwYXJhbSB7U3RyaW5nfEFycmF5fSBmaWVsZFxuICogQHJldHVybiB7U3RyaW5nfVxuICogQHB1YmxpY1xuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmQoaGVhZGVyOiBzdHJpbmcsIGZpZWxkOiBzdHJpbmcgfCBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIC8vIGlmICh0eXBlb2YgaGVhZGVyICE9PSAnc3RyaW5nJykge1xuICAvLyAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2hlYWRlciBhcmd1bWVudCBpcyByZXF1aXJlZCcpXG4gIC8vIH1cblxuICAvLyBpZiAoIWZpZWxkKSB7XG4gIC8vICAgdGhyb3cgbmV3IFR5cGVFcnJvcignZmllbGQgYXJndW1lbnQgaXMgcmVxdWlyZWQnKVxuICAvLyB9XG5cbiAgLy8gZXhpc3RpbmcsIHVuc3BlY2lmaWVkIHZhcnlcbiAgaWYgKGhlYWRlciA9PT0gXCIqXCIpIHtcbiAgICByZXR1cm4gaGVhZGVyO1xuICB9XG5cbiAgLy8gZ2V0IGZpZWxkcyBhcnJheVxuICBjb25zdCBmaWVsZHMgPSAhQXJyYXkuaXNBcnJheShmaWVsZCkgPyBwYXJzZShTdHJpbmcoZmllbGQpKSA6IGZpZWxkO1xuXG4gIC8vIGFzc2VydCBvbiBpbnZhbGlkIGZpZWxkIG5hbWVzXG4gIGZvciAobGV0IGogPSAwOyBqIDwgZmllbGRzLmxlbmd0aDsgaisrKSB7XG4gICAgaWYgKCFGSUVMRF9OQU1FX1JFR0VYUC50ZXN0KGZpZWxkc1tqXSkpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgIGBmaWVsZCBhcmd1bWVudCBjb250YWlucyBhbiBpbnZhbGlkIGhlYWRlciBuYW1lIFxcYCR7ZmllbGRzW2pdfVxcYGAsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8vIGVudW1lcmF0ZSBjdXJyZW50IHZhbHVlc1xuICBsZXQgdmFsID0gaGVhZGVyO1xuICBjb25zdCB2YWxzID0gcGFyc2UoaGVhZGVyLnRvTG93ZXJDYXNlKCkpO1xuXG4gIC8vIHVuc3BlY2lmaWVkIHZhcnlcbiAgaWYgKGZpZWxkcy5pbmRleE9mKFwiKlwiKSAhPT0gLTEgfHwgdmFscy5pbmRleE9mKFwiKlwiKSAhPT0gLTEpIHtcbiAgICByZXR1cm4gXCIqXCI7XG4gIH1cblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGZpZWxkcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGZsZCA9IGZpZWxkc1tpXS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgLy8gYXBwZW5kIHZhbHVlIChjYXNlLXByZXNlcnZpbmcpXG4gICAgaWYgKHZhbHMuaW5kZXhPZihmbGQpID09PSAtMSkge1xuICAgICAgdmFscy5wdXNoKGZsZCk7XG4gICAgICB2YWwgPSB2YWwgPyB2YWwgKyBcIiwgXCIgKyBmaWVsZHNbaV0gOiBmaWVsZHNbaV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHZhbDtcbn1cblxuLyoqXG4gKiBQYXJzZSBhIHZhcnkgaGVhZGVyIGludG8gYW4gYXJyYXkuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGhlYWRlclxuICogQHJldHVybiB7QXJyYXl9XG4gKiBAcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHBhcnNlKGhlYWRlcjogc3RyaW5nKTogc3RyaW5nW10ge1xuICBsZXQgZW5kID0gMDtcbiAgY29uc3QgbGlzdCA9IFtdO1xuICBsZXQgc3RhcnQgPSAwO1xuXG4gIC8vIGdhdGhlciB0b2tlbnNcbiAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IGhlYWRlci5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIHN3aXRjaCAoaGVhZGVyLmNoYXJDb2RlQXQoaSkpIHtcbiAgICAgIGNhc2UgMHgyMDovKiAgICovXG4gICAgICAgIGlmIChzdGFydCA9PT0gZW5kKSB7XG4gICAgICAgICAgc3RhcnQgPSBlbmQgPSBpICsgMTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMHgyYzovKiAsICovXG4gICAgICAgIGxpc3QucHVzaChoZWFkZXIuc3Vic3RyaW5nKHN0YXJ0LCBlbmQpKTtcbiAgICAgICAgc3RhcnQgPSBlbmQgPSBpICsgMTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBlbmQgPSBpICsgMTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgLy8gZmluYWwgdG9rZW5cbiAgbGlzdC5wdXNoKGhlYWRlci5zdWJzdHJpbmcoc3RhcnQsIGVuZCkpO1xuXG4gIHJldHVybiBsaXN0O1xufVxuXG4vKipcbiAqIE1hcmsgdGhhdCBhIHJlcXVlc3QgaXMgdmFyaWVkIG9uIGEgaGVhZGVyIGZpZWxkLlxuICpcbiAqIEBwYXJhbSB7SGVhZGVyc30gaGVhZGVyXG4gKiBAcGFyYW0ge1N0cmluZ3xBcnJheX0gZmllbGRcbiAqIEBwdWJsaWNcbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gdmFyeShoZWFkZXI6IEhlYWRlcnMsIGZpZWxkOiBzdHJpbmcgfCBzdHJpbmdbXSk6IHZvaWQge1xuICAvLyBnZXQgZXhpc3RpbmcgaGVhZGVyXG4gIGxldCB2YWwgPSBoZWFkZXIuZ2V0KFwidmFyeVwiKSB8fCBcIlwiO1xuXG4gIC8vIHNldCBuZXcgaGVhZGVyXG4gIGlmICgodmFsID0gYXBwZW5kKHZhbCwgZmllbGQpKSkge1xuICAgIGhlYWRlci5zZXQoXCJ2YXJ5XCIsIHZhbCk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUtHLEFBTEg7Ozs7O0NBS0csQUFMSCxFQUtHLENBRUgsRUFTRyxBQVRIOzs7Ozs7Ozs7Q0FTRyxBQVRILEVBU0csT0FFRyxpQkFBaUI7QUFFdkIsRUFPRyxBQVBIOzs7Ozs7O0NBT0csQUFQSCxFQU9HLGlCQUVhLE1BQU0sQ0FBQyxNQUFjLEVBQUUsS0FBd0I7SUFDN0QsRUFBb0MsQUFBcEMsa0NBQW9DO0lBQ3BDLEVBQXVELEFBQXZELHFEQUF1RDtJQUN2RCxFQUFJLEFBQUosRUFBSTtJQUVKLEVBQWdCLEFBQWhCLGNBQWdCO0lBQ2hCLEVBQXNELEFBQXRELG9EQUFzRDtJQUN0RCxFQUFJLEFBQUosRUFBSTtJQUVKLEVBQTZCLEFBQTdCLDJCQUE2QjtRQUN6QixNQUFNLE1BQUssQ0FBRztlQUNULE1BQU07O0lBR2YsRUFBbUIsQUFBbkIsaUJBQW1CO1VBQ2IsTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FB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