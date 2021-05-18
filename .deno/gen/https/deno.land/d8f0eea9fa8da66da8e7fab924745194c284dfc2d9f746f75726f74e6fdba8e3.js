import { etag as createETag } from "./etag.ts";
/**
 * Create an ETag generator function, generating ETags with
 * the given options.
 *
 * @param {object} options
 * @return {Function} generateETag function.
 * @private
 */ function createETagGenerator(options) {
  return function generateETag(body) {
    return createETag(body, options);
  };
}
/**
 * Return strong ETag for `body`.
 *
 * @param {any} body
 * @param {string} [encoding]
 * @return {string}
 * @private
 */ export const etag = createETagGenerator({
  weak: false,
});
/**
 * Return weak ETag for `body`.
 *
 * @param {any} body
 * @param {string} [encoding]
 * @return {string}
 * @private
 */ export const wetag = createETagGenerator({
  weak: true,
});
/**
 * Check if `path` looks absolute.
 *
 * @param {String} path
 * @return {Boolean}
 * @private
 */ export const compileETag = function (value) {
  let fn;
  if (typeof value === "function") {
    return value;
  }
  switch (value) {
    case true:
      fn = wetag;
      break;
    case false:
      break;
    case "strong":
      fn = etag;
      break;
    case "weak":
      fn = wetag;
      break;
    default:
      throw new TypeError(`unknown value for etag function: ${value}`);
  }
  return fn;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy91dGlscy9jb21waWxlRVRhZy50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXRhZyBhcyBjcmVhdGVFVGFnIH0gZnJvbSBcIi4vZXRhZy50c1wiO1xuXG4vKipcbiAqIENyZWF0ZSBhbiBFVGFnIGdlbmVyYXRvciBmdW5jdGlvbiwgZ2VuZXJhdGluZyBFVGFncyB3aXRoXG4gKiB0aGUgZ2l2ZW4gb3B0aW9ucy5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xuICogQHJldHVybiB7RnVuY3Rpb259IGdlbmVyYXRlRVRhZyBmdW5jdGlvbi5cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUVUYWdHZW5lcmF0b3Iob3B0aW9uczogYW55KTogRnVuY3Rpb24ge1xuICByZXR1cm4gZnVuY3Rpb24gZ2VuZXJhdGVFVGFnKGJvZHk6IHN0cmluZyB8IFVpbnQ4QXJyYXkgfCBEZW5vLkZpbGVJbmZvKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUVUYWcoYm9keSwgb3B0aW9ucyk7XG4gIH07XG59XG5cbi8qKlxuICogUmV0dXJuIHN0cm9uZyBFVGFnIGZvciBgYm9keWAuXG4gKlxuICogQHBhcmFtIHthbnl9IGJvZHlcbiAqIEBwYXJhbSB7c3RyaW5nfSBbZW5jb2RpbmddXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgY29uc3QgZXRhZyA9IGNyZWF0ZUVUYWdHZW5lcmF0b3IoeyB3ZWFrOiBmYWxzZSB9KTtcblxuLyoqXG4gKiBSZXR1cm4gd2VhayBFVGFnIGZvciBgYm9keWAuXG4gKlxuICogQHBhcmFtIHthbnl9IGJvZHlcbiAqIEBwYXJhbSB7c3RyaW5nfSBbZW5jb2RpbmddXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgY29uc3Qgd2V0YWcgPSBjcmVhdGVFVGFnR2VuZXJhdG9yKHsgd2VhazogdHJ1ZSB9KTtcblxuLyoqXG4gKiBDaGVjayBpZiBgcGF0aGAgbG9va3MgYWJzb2x1dGUuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgY29uc3QgY29tcGlsZUVUYWcgPSBmdW5jdGlvbiAodmFsdWU6IGFueSkge1xuICBsZXQgZm47XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgc3dpdGNoICh2YWx1ZSkge1xuICAgIGNhc2UgdHJ1ZTpcbiAgICAgIGZuID0gd2V0YWc7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGZhbHNlOlxuICAgICAgYnJlYWs7XG4gICAgY2FzZSBcInN0cm9uZ1wiOlxuICAgICAgZm4gPSBldGFnO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBcIndlYWtcIjpcbiAgICAgIGZuID0gd2V0YWc7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgdW5rbm93biB2YWx1ZSBmb3IgZXRhZyBmdW5jdGlvbjogJHt2YWx1ZX1gKTtcbiAgfVxuXG4gIHJldHVybiBmbjtcbn07XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsSUFBSSxJQUFJLFVBQVUsU0FBUSxTQUFXO0FBRTlDLEVBT0csQUFQSDs7Ozs7OztDQU9HLEFBUEgsRUFPRyxVQUNNLG1CQUFtQixDQUFDLE9BQVk7b0JBQ3ZCLFlBQVksQ0FBQyxJQUF5QztlQUM3RCxVQUFVLENBQUMsSUFBSSxFQUFFLE9BQU87OztBQUluQyxFQU9HLEFBUEg7Ozs7Ozs7Q0FPRyxBQVBILEVBT0csY0FDVSxJQUFJLEdBQUcsbUJBQW1CO0lBQUcsSUFBSSxFQUFFLEtBQUs7O0FBRXJELEVBT0csQUFQSDs7Ozs7OztDQU9HLEFBUEgsRUFPRyxjQUNVLEtBQUssR0FBRyxtQkFBbUI7SUFBRyxJQUFJLEVBQUUsSUFBSTs7QUFFckQsRUFNRyxBQU5IOzs7Ozs7Q0FNRyxBQU5ILEVBTUcsY0FDVSxXQUFXLFlBQWEsS0FBVTtRQUN6QyxFQUFFO2VBRUssS0FBSyxNQUFLLFFBQVU7ZUFDdEIsS0FBSzs7V0FHTixLQUFLO2FBQ04sSUFBSTtZQUNQLEVBQUUsR0FBRyxLQUFLOzthQUVQLEtBQUs7O2NBRUwsTUFBUTtZQUNYLEVBQUUsR0FBRyxJQUFJOztjQUVOLElBQU07WUFDVCxFQUFFLEdBQUcsS0FBSzs7O3NCQUdBLFNBQVMsRUFBRSxpQ0FBaUMsRUFBRSxLQUFLOztXQUcxRCxFQUFFIn0=
