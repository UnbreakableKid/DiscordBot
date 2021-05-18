import { compile } from "./proxyAddr.ts";
/**
 * Compile "proxy trust" value to function.
 *
 * @param  {Boolean|String|Number|Array|Function} value
 * @return {Function}
 * @private
 */ export function compileTrust(value) {
    if (typeof value === "function") return value;
    if (value === true) {
        // Support plain true / false
        return function() {
            return true;
        };
    }
    if (typeof value === "number") {
        // Support trusting hop count
        return function(_, i) {
            return i < value;
        };
    }
    if (typeof value === "string") {
        // Support comma-separated values
        value = value.split(/ *, */);
    }
    return compile(value || []);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy91dGlscy9jb21waWxlVHJ1c3QudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNvbXBpbGUgfSBmcm9tIFwiLi9wcm94eUFkZHIudHNcIjtcblxudHlwZSBUcnVzdFZhbHVlID0gRnVuY3Rpb24gfCBib29sZWFuIHwgc3RyaW5nIHwgbnVtYmVyIHwgc3RyaW5nW107XG5cbi8qKlxuICogQ29tcGlsZSBcInByb3h5IHRydXN0XCIgdmFsdWUgdG8gZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtICB7Qm9vbGVhbnxTdHJpbmd8TnVtYmVyfEFycmF5fEZ1bmN0aW9ufSB2YWx1ZVxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZVRydXN0KHZhbHVlOiBUcnVzdFZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHZhbHVlO1xuXG4gIGlmICh2YWx1ZSA9PT0gdHJ1ZSkge1xuICAgIC8vIFN1cHBvcnQgcGxhaW4gdHJ1ZSAvIGZhbHNlXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gIH1cblxuICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiKSB7XG4gICAgLy8gU3VwcG9ydCB0cnVzdGluZyBob3AgY291bnRcbiAgICByZXR1cm4gZnVuY3Rpb24gKF86IHVua25vd24sIGk6IG51bWJlcikge1xuICAgICAgcmV0dXJuIGkgPCB2YWx1ZTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgIC8vIFN1cHBvcnQgY29tbWEtc2VwYXJhdGVkIHZhbHVlc1xuICAgIHZhbHVlID0gdmFsdWUuc3BsaXQoLyAqLCAqLyk7XG4gIH1cblxuICByZXR1cm4gY29tcGlsZSh2YWx1ZSB8fCBbXSk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IlNBQVMsT0FBTyxTQUFRLGNBQWdCO0FBSXhDLEVBTUcsQUFOSDs7Ozs7O0NBTUcsQUFOSCxFQU1HLGlCQUNhLFlBQVksQ0FBQyxLQUFpQjtlQUNqQyxLQUFLLE1BQUssUUFBVSxVQUFTLEtBQUs7UUFFekMsS0FBSyxLQUFLLElBQUk7UUFDaEIsRUFBNkIsQUFBN0IsMkJBQTZCOzttQkFFcEIsSUFBSTs7O2VBSUosS0FBSyxNQUFLLE1BQVE7UUFDM0IsRUFBNkIsQUFBN0IsMkJBQTZCO3dCQUNaLENBQVUsRUFBRSxDQUFTO21CQUM3QixDQUFDLEdBQUcsS0FBSzs7O2VBSVQsS0FBSyxNQUFLLE1BQVE7UUFDM0IsRUFBaUMsQUFBakMsK0JBQWlDO1FBQ2pDLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSzs7V0FHZCxPQUFPLENBQUMsS0FBSyJ9