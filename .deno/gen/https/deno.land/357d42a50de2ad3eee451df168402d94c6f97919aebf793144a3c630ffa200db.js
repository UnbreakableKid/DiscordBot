import { parse, qs } from "../../deps.ts";
/**
 * Return new empty object.
 *
 * @return {Object}
 * @api private
 */ function newObject() {
  return {};
}
/**
 * Parse an extended query string with qs.
 *
 * @return {Object}
 * @private
 */ function parseExtendedQueryString(str) {
  return qs.parse(str, {
    allowPrototypes: true,
  });
}
/**
 * Compile "query parser" value to function.
 *
 * @param  {String|Boolean|Function} val
 * @return {Function}
 * @api private
 */ export function compileQueryParser(value) {
  if (typeof value === "function") {
    return value;
  }
  switch (value) {
    case true:
      return parse;
    case false:
      return newObject;
    case "extended":
      return parseExtendedQueryString;
    case "simple":
      return parse;
    default:
      throw new TypeError(`unknown value for query parser function: ${value}`);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy91dGlscy9jb21waWxlUXVlcnlQYXJzZXIudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHBhcnNlLCBxcyB9IGZyb20gXCIuLi8uLi9kZXBzLnRzXCI7XG5cbi8qKlxuICogUmV0dXJuIG5ldyBlbXB0eSBvYmplY3QuXG4gKlxuICogQHJldHVybiB7T2JqZWN0fVxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIG5ld09iamVjdCgpIHtcbiAgcmV0dXJuIHt9O1xufVxuXG4vKipcbiAqIFBhcnNlIGFuIGV4dGVuZGVkIHF1ZXJ5IHN0cmluZyB3aXRoIHFzLlxuICpcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIHBhcnNlRXh0ZW5kZWRRdWVyeVN0cmluZyhzdHI6IHN0cmluZykge1xuICByZXR1cm4gcXMucGFyc2Uoc3RyLCB7XG4gICAgYWxsb3dQcm90b3R5cGVzOiB0cnVlLFxuICB9KTtcbn1cblxudHlwZSBRdWVyeVBhcnNlclZhbHVlID0gRnVuY3Rpb24gfCBCb29sZWFuIHwgXCJleHRlbmRlZFwiIHwgXCJzaW1wbGVcIjtcblxuLyoqXG4gKiBDb21waWxlIFwicXVlcnkgcGFyc2VyXCIgdmFsdWUgdG8gZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfEJvb2xlYW58RnVuY3Rpb259IHZhbFxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVRdWVyeVBhcnNlcih2YWx1ZTogUXVlcnlQYXJzZXJWYWx1ZSk6IEZ1bmN0aW9uIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgc3dpdGNoICh2YWx1ZSkge1xuICAgIGNhc2UgdHJ1ZTpcbiAgICAgIHJldHVybiBwYXJzZTtcbiAgICBjYXNlIGZhbHNlOlxuICAgICAgcmV0dXJuIG5ld09iamVjdDtcbiAgICBjYXNlIFwiZXh0ZW5kZWRcIjpcbiAgICAgIHJldHVybiBwYXJzZUV4dGVuZGVkUXVlcnlTdHJpbmc7XG4gICAgY2FzZSBcInNpbXBsZVwiOlxuICAgICAgcmV0dXJuIHBhcnNlO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGB1bmtub3duIHZhbHVlIGZvciBxdWVyeSBwYXJzZXIgZnVuY3Rpb246ICR7dmFsdWV9YCk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxLQUFLLEVBQUUsRUFBRSxTQUFRLGFBQWU7QUFFekMsRUFLRyxBQUxIOzs7OztDQUtHLEFBTEgsRUFLRyxVQUNNLFNBQVM7Ozs7QUFJbEIsRUFLRyxBQUxIOzs7OztDQUtHLEFBTEgsRUFLRyxVQUNNLHdCQUF3QixDQUFDLEdBQVc7V0FDcEMsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHO1FBQ2pCLGVBQWUsRUFBRSxJQUFJOzs7QUFNekIsRUFNRyxBQU5IOzs7Ozs7Q0FNRyxBQU5ILEVBTUcsaUJBQ2Esa0JBQWtCLENBQUMsS0FBdUI7ZUFDN0MsS0FBSyxNQUFLLFFBQVU7ZUFDdEIsS0FBSzs7V0FHTixLQUFLO2FBQ04sSUFBSTttQkFDQSxLQUFLO2FBQ1QsS0FBSzttQkFDRCxTQUFTO2NBQ2IsUUFBVTttQkFDTix3QkFBd0I7Y0FDNUIsTUFBUTttQkFDSixLQUFLOztzQkFFRixTQUFTLEVBQUUseUNBQXlDLEVBQUUsS0FBSyJ9
