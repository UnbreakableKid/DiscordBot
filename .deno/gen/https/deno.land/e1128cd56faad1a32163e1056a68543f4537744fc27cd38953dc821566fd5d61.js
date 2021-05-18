/*!
 * Based on https://github.com/jshttp/media-typer/blob/master/index.js
 * Copyright(c) 2014-2017 Douglas Christopher Wilson
 * Copyright(c) 2020 Henry Zhuang
 * MIT Licensed
 */
/**
 * RegExp to match type in RFC 6838
 *
 * type-name = restricted-name
 * subtype-name = restricted-name
 * restricted-name = restricted-name-first *126restricted-name-chars
 * restricted-name-first  = ALPHA / DIGIT
 * restricted-name-chars  = ALPHA / DIGIT / "!" / "#" /
 *                          "$" / "&" / "-" / "^" / "_"
 * restricted-name-chars =/ "." ; Characters before first dot always
 *                              ; specify a facet name
 * restricted-name-chars =/ "+" ; Characters after last plus always
 *                              ; specify a structured syntax suffix
 * ALPHA =  %x41-5A / %x61-7A   ; A-Z / a-z
 * DIGIT =  %x30-39             ; 0-9
 */ const SUBTYPE_NAME_REGEXP = /^[A-Za-z0-9][A-Za-z0-9!#$&^_.-]{0,126}$/;
const TYPE_NAME_REGEXP = /^[A-Za-z0-9][A-Za-z0-9!#$&^_-]{0,126}$/;
const TYPE_REGEXP =
  /^ *([A-Za-z0-9][A-Za-z0-9!#$&^_-]{0,126})\/([A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,126}) *$/;
/**
 * Format object to media type.
 *
 * @param {MediaType} obj
 * @return {string}
 */ export function format(obj) {
  const subtype = obj.subtype;
  const suffix = obj.suffix;
  const type = obj.type;
  if (!TYPE_NAME_REGEXP.test(type)) {
    throw new TypeError("invalid type");
  }
  if (!SUBTYPE_NAME_REGEXP.test(subtype)) {
    throw new TypeError("invalid subtype");
  }
  // format as type/subtype
  let string = type + "/" + subtype;
  // append +suffix
  if (suffix) {
    if (!TYPE_NAME_REGEXP.test(suffix)) {
      throw new TypeError("invalid suffix");
    }
    string += "+" + suffix;
  }
  return string;
}
/**
 * Test media type.
 *
 * @param {string} string
 * @return {boolean}
 */ export function test(string) {
  return TYPE_REGEXP.test(string.toLowerCase());
}
/**
 * Parse media type to object.
 *
 * @param {string} string
 * @return {MediaType}
 */ export function parse(string) {
  console.log("stringstring:", string);
  const match = TYPE_REGEXP.exec(string.toLowerCase());
  console.log("matchmatch:", match);
  if (!match) {
    throw new TypeError("invalid media type");
  }
  const type = match[1];
  let subtype = match[2];
  let suffix;
  // suffix after last +
  const index = subtype.lastIndexOf("+");
  if (index !== -1) {
    suffix = subtype.substr(index + 1);
    subtype = subtype.substr(0, index);
  }
  return new MediaTypeImpl(type, subtype, suffix);
}
class MediaTypeImpl {
  type;
  subtype;
  suffix;
  constructor(type, subtype, suffix) {
    this.type = type;
    this.subtype = subtype;
    this.suffix = suffix;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L21lZGlhX3R5cGVyQDEuMC4xL21vZC50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiLyohXG4gKiBCYXNlZCBvbiBodHRwczovL2dpdGh1Yi5jb20vanNodHRwL21lZGlhLXR5cGVyL2Jsb2IvbWFzdGVyL2luZGV4LmpzXG4gKiBDb3B5cmlnaHQoYykgMjAxNC0yMDE3IERvdWdsYXMgQ2hyaXN0b3BoZXIgV2lsc29uXG4gKiBDb3B5cmlnaHQoYykgMjAyMCBIZW5yeSBaaHVhbmdcbiAqIE1JVCBMaWNlbnNlZFxuICovXG5cbi8qKlxuICogUmVnRXhwIHRvIG1hdGNoIHR5cGUgaW4gUkZDIDY4MzhcbiAqXG4gKiB0eXBlLW5hbWUgPSByZXN0cmljdGVkLW5hbWVcbiAqIHN1YnR5cGUtbmFtZSA9IHJlc3RyaWN0ZWQtbmFtZVxuICogcmVzdHJpY3RlZC1uYW1lID0gcmVzdHJpY3RlZC1uYW1lLWZpcnN0ICoxMjZyZXN0cmljdGVkLW5hbWUtY2hhcnNcbiAqIHJlc3RyaWN0ZWQtbmFtZS1maXJzdCAgPSBBTFBIQSAvIERJR0lUXG4gKiByZXN0cmljdGVkLW5hbWUtY2hhcnMgID0gQUxQSEEgLyBESUdJVCAvIFwiIVwiIC8gXCIjXCIgL1xuICogICAgICAgICAgICAgICAgICAgICAgICAgIFwiJFwiIC8gXCImXCIgLyBcIi1cIiAvIFwiXlwiIC8gXCJfXCJcbiAqIHJlc3RyaWN0ZWQtbmFtZS1jaGFycyA9LyBcIi5cIiA7IENoYXJhY3RlcnMgYmVmb3JlIGZpcnN0IGRvdCBhbHdheXNcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOyBzcGVjaWZ5IGEgZmFjZXQgbmFtZVxuICogcmVzdHJpY3RlZC1uYW1lLWNoYXJzID0vIFwiK1wiIDsgQ2hhcmFjdGVycyBhZnRlciBsYXN0IHBsdXMgYWx3YXlzXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDsgc3BlY2lmeSBhIHN0cnVjdHVyZWQgc3ludGF4IHN1ZmZpeFxuICogQUxQSEEgPSAgJXg0MS01QSAvICV4NjEtN0EgICA7IEEtWiAvIGEtelxuICogRElHSVQgPSAgJXgzMC0zOSAgICAgICAgICAgICA7IDAtOVxuICovXG5jb25zdCBTVUJUWVBFX05BTUVfUkVHRVhQID0gL15bQS1aYS16MC05XVtBLVphLXowLTkhIyQmXl8uLV17MCwxMjZ9JC87XG5jb25zdCBUWVBFX05BTUVfUkVHRVhQID0gL15bQS1aYS16MC05XVtBLVphLXowLTkhIyQmXl8tXXswLDEyNn0kLztcbmNvbnN0IFRZUEVfUkVHRVhQID1cbiAgL14gKihbQS1aYS16MC05XVtBLVphLXowLTkhIyQmXl8tXXswLDEyNn0pXFwvKFtBLVphLXowLTldW0EtWmEtejAtOSEjJCZeXy4rLV17MCwxMjZ9KSAqJC87XG5cbi8qKlxuICogQ2xhc3MgZm9yIE1lZGlhVHlwZSBvYmplY3QuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWVkaWFUeXBlIHtcbiAgdHlwZTogc3RyaW5nO1xuICBzdWJ0eXBlOiBzdHJpbmc7XG4gIHN1ZmZpeD86IHN0cmluZztcbn1cblxuLyoqXG4gKiBGb3JtYXQgb2JqZWN0IHRvIG1lZGlhIHR5cGUuXG4gKlxuICogQHBhcmFtIHtNZWRpYVR5cGV9IG9ialxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0KG9iajogTWVkaWFUeXBlKTogc3RyaW5nIHtcbiAgY29uc3Qgc3VidHlwZSA9IG9iai5zdWJ0eXBlO1xuICBjb25zdCBzdWZmaXggPSBvYmouc3VmZml4O1xuICBjb25zdCB0eXBlID0gb2JqLnR5cGU7XG5cbiAgaWYgKCFUWVBFX05BTUVfUkVHRVhQLnRlc3QodHlwZSkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiaW52YWxpZCB0eXBlXCIpO1xuICB9XG5cbiAgaWYgKCFTVUJUWVBFX05BTUVfUkVHRVhQLnRlc3Qoc3VidHlwZSkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiaW52YWxpZCBzdWJ0eXBlXCIpO1xuICB9XG5cbiAgLy8gZm9ybWF0IGFzIHR5cGUvc3VidHlwZVxuICBsZXQgc3RyaW5nID0gdHlwZSArIFwiL1wiICsgc3VidHlwZTtcblxuICAvLyBhcHBlbmQgK3N1ZmZpeFxuICBpZiAoc3VmZml4KSB7XG4gICAgaWYgKCFUWVBFX05BTUVfUkVHRVhQLnRlc3Qoc3VmZml4KSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImludmFsaWQgc3VmZml4XCIpO1xuICAgIH1cblxuICAgIHN0cmluZyArPSBcIitcIiArIHN1ZmZpeDtcbiAgfVxuXG4gIHJldHVybiBzdHJpbmc7XG59XG5cbi8qKlxuICogVGVzdCBtZWRpYSB0eXBlLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmdcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZXN0KHN0cmluZzogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBUWVBFX1JFR0VYUC50ZXN0KHN0cmluZy50b0xvd2VyQ2FzZSgpKTtcbn1cblxuLyoqXG4gKiBQYXJzZSBtZWRpYSB0eXBlIHRvIG9iamVjdC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nXG4gKiBAcmV0dXJuIHtNZWRpYVR5cGV9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZShzdHJpbmc6IHN0cmluZyk6IE1lZGlhVHlwZSB7XG4gIGNvbnNvbGUubG9nKFwic3RyaW5nc3RyaW5nOlwiLCBzdHJpbmcpO1xuXG4gIGNvbnN0IG1hdGNoID0gVFlQRV9SRUdFWFAuZXhlYyhzdHJpbmcudG9Mb3dlckNhc2UoKSk7XG4gIGNvbnNvbGUubG9nKFwibWF0Y2htYXRjaDpcIiwgbWF0Y2gpO1xuICBpZiAoIW1hdGNoKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImludmFsaWQgbWVkaWEgdHlwZVwiKTtcbiAgfVxuXG4gIGNvbnN0IHR5cGUgPSBtYXRjaFsxXTtcbiAgbGV0IHN1YnR5cGUgPSBtYXRjaFsyXTtcbiAgbGV0IHN1ZmZpeDtcblxuICAvLyBzdWZmaXggYWZ0ZXIgbGFzdCArXG4gIGNvbnN0IGluZGV4ID0gc3VidHlwZS5sYXN0SW5kZXhPZihcIitcIik7XG4gIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICBzdWZmaXggPSBzdWJ0eXBlLnN1YnN0cihpbmRleCArIDEpO1xuICAgIHN1YnR5cGUgPSBzdWJ0eXBlLnN1YnN0cigwLCBpbmRleCk7XG4gIH1cblxuICByZXR1cm4gbmV3IE1lZGlhVHlwZUltcGwodHlwZSwgc3VidHlwZSwgc3VmZml4KTtcbn1cblxuY2xhc3MgTWVkaWFUeXBlSW1wbCBpbXBsZW1lbnRzIE1lZGlhVHlwZSB7XG4gIHR5cGU6IHN0cmluZztcbiAgc3VidHlwZTogc3RyaW5nO1xuICBzdWZmaXg/OiBzdHJpbmc7XG4gIGNvbnN0cnVjdG9yKHR5cGU6IHN0cmluZywgc3VidHlwZTogc3RyaW5nLCBzdWZmaXg/OiBzdHJpbmcpIHtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuc3VidHlwZSA9IHN1YnR5cGU7XG4gICAgdGhpcy5zdWZmaXggPSBzdWZmaXg7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUtHLEFBTEg7Ozs7O0NBS0csQUFMSCxFQUtHLENBRUgsRUFlRyxBQWZIOzs7Ozs7Ozs7Ozs7Ozs7Q0FlRyxBQWZILEVBZUcsT0FDRyxtQkFBbUI7TUFDbkIsZ0JBQWdCO01BQ2hCLFdBQVc7QUFZakIsRUFLRyxBQUxIOzs7OztDQUtHLEFBTEgsRUFLRyxpQkFDYSxNQUFNLENBQUMsR0FBYztVQUM3QixPQUFPLEdBQUcsR0FBRyxDQUFDLE9BQU87VUFDckIsTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNO1VBQ25CLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSTtTQUVoQixnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSTtrQkFDbkIsU0FBUyxFQUFDLFlBQWM7O1NBRy9CLG1CQUFtQixDQUFDLElBQUksQ0FBQyxPQUFPO2tCQUN6QixTQUFTLEVBQUMsZUFBaUI7O0lBR3ZDLEVBQXlCLEFBQXpCLHVCQUF5QjtRQUNyQixNQUFNLEdBQUcsSUFBSSxJQUFHLENBQUcsSUFBRyxPQUFPO0lBRWpDLEVBQWlCLEFBQWpCLGVBQWlCO1FBQ2IsTUFBTTthQUNILGdCQUFnQixDQUFDLElBQUksQ0FBQyxNQUFNO3NCQUNyQixTQUFTLEVBQUMsY0FBZ0I7O1FBR3RDLE1BQU0sS0FBSSxDQUFHLElBQUcsTUFBTTs7V0FHakIsTUFBTTs7QUFHZixFQUtHLEFBTEg7Ozs7O0NBS0csQUFMSCxFQUtHLGlCQUNhLElBQUksQ0FBQyxNQUFjO1dBQzFCLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVc7O0FBRzVDLEVBS0csQUFMSDs7Ozs7Q0FLRyxBQUxILEVBS0csaUJBQ2EsS0FBSyxDQUFDLE1BQWM7SUFDbEMsT0FBTyxDQUFDLEdBQUcsRUFBQyxhQUFlLEdBQUUsTUFBTTtVQUU3QixLQUFLLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVztJQUNqRCxPQUFPLENBQUMsR0FBRyxFQUFDLFdBQWEsR0FBRSxLQUFLO1NBQzNCLEtBQUs7a0JBQ0UsU0FBUyxFQUFDLGtCQUFvQjs7VUFHcEMsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDO1FBQ2hCLE9BQU8sR0FBRyxLQUFLLENBQUMsQ0FBQztRQUNqQixNQUFNO0lBRVYsRUFBc0IsQUFBdEIsb0JBQXNCO1VBQ2hCLEtBQUssR0FBRyxPQUFPLENBQUMsV0FBVyxFQUFDLENBQUc7UUFDakMsS0FBSyxNQUFNLENBQUM7UUFDZCxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsQ0FBQztRQUNqQyxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsS0FBSzs7ZUFHeEIsYUFBYSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsTUFBTTs7TUFHMUMsYUFBYTtJQUNqQixJQUFJO0lBQ0osT0FBTztJQUNQLE1BQU07Z0JBQ00sSUFBWSxFQUFFLE9BQWUsRUFBRSxNQUFlO2FBQ25ELElBQUksR0FBRyxJQUFJO2FBQ1gsT0FBTyxHQUFHLE9BQU87YUFDakIsTUFBTSxHQUFHLE1BQU0ifQ==
