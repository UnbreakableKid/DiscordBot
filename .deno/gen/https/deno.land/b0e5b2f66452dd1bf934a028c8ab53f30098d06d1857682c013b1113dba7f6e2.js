export { promisify } from "./_util/_util_promisify.ts";
export { callbackify } from "./_util/_util_callbackify.ts";
import * as types from "./_util/_util_types.ts";
export { types };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function inspect(object, ...opts) {
    return Deno.inspect(object, {
        depth: opts.depth ?? 4,
        iterableLimit: opts.iterableLimit ?? 100,
        compact: !!(opts.compact ?? true),
        sorted: !!(opts.sorted ?? false)
    });
}
export function isArray(value) {
    return Array.isArray(value);
}
export function isBoolean(value) {
    return typeof value === "boolean" || value instanceof Boolean;
}
export function isNull(value) {
    return value === null;
}
export function isNullOrUndefined(value) {
    return value === null || value === undefined;
}
export function isNumber(value) {
    return typeof value === "number" || value instanceof Number;
}
export function isString(value) {
    return typeof value === "string" || value instanceof String;
}
export function isSymbol(value) {
    return typeof value === "symbol";
}
export function isUndefined(value) {
    return value === undefined;
}
export function isObject(value) {
    return value !== null && typeof value === "object";
}
export function isError(e) {
    return e instanceof Error;
}
export function isFunction(value) {
    return typeof value === "function";
}
export function isRegExp(value) {
    return value instanceof RegExp;
}
export function isPrimitive(value) {
    return value === null || typeof value !== "object" && typeof value !== "function";
}
export function validateIntegerRange(value, name, min = -2147483648, max = 2147483647) {
    // The defaults for min and max correspond to the limits of 32-bit integers.
    if (!Number.isInteger(value)) {
        throw new Error(`${name} must be 'an integer' but was ${value}`);
    }
    if (value < min || value > max) {
        throw new Error(`${name} must be >= ${min} && <= ${max}.  Value was ${value}`);
    }
}
import { _TextDecoder, _TextEncoder } from "./_utils.ts";
const TextDecoder1 = _TextDecoder;
export { TextDecoder1 as TextDecoder };
const TextEncoder1 = _TextEncoder;
export { TextEncoder1 as TextEncoder };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC42Ni4wL25vZGUvdXRpbC50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IHsgcHJvbWlzaWZ5IH0gZnJvbSBcIi4vX3V0aWwvX3V0aWxfcHJvbWlzaWZ5LnRzXCI7XG5leHBvcnQgeyBjYWxsYmFja2lmeSB9IGZyb20gXCIuL191dGlsL191dGlsX2NhbGxiYWNraWZ5LnRzXCI7XG5pbXBvcnQgKiBhcyB0eXBlcyBmcm9tIFwiLi9fdXRpbC9fdXRpbF90eXBlcy50c1wiO1xuXG5leHBvcnQgeyB0eXBlcyB9O1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuZXhwb3J0IGZ1bmN0aW9uIGluc3BlY3Qob2JqZWN0OiB1bmtub3duLCAuLi5vcHRzOiBhbnkpOiBzdHJpbmcge1xuICByZXR1cm4gRGVuby5pbnNwZWN0KG9iamVjdCwge1xuICAgIGRlcHRoOiBvcHRzLmRlcHRoID8/IDQsXG4gICAgaXRlcmFibGVMaW1pdDogb3B0cy5pdGVyYWJsZUxpbWl0ID8/IDEwMCxcbiAgICBjb21wYWN0OiAhIShvcHRzLmNvbXBhY3QgPz8gdHJ1ZSksXG4gICAgc29ydGVkOiAhIShvcHRzLnNvcnRlZCA/PyBmYWxzZSksXG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNBcnJheSh2YWx1ZTogdW5rbm93bik6IGJvb2xlYW4ge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0Jvb2xlYW4odmFsdWU6IHVua25vd24pOiBib29sZWFuIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJib29sZWFuXCIgfHwgdmFsdWUgaW5zdGFuY2VvZiBCb29sZWFuO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNOdWxsKHZhbHVlOiB1bmtub3duKTogYm9vbGVhbiB7XG4gIHJldHVybiB2YWx1ZSA9PT0gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKHZhbHVlOiB1bmtub3duKTogYm9vbGVhbiB7XG4gIHJldHVybiB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNOdW1iZXIodmFsdWU6IHVua25vd24pOiBib29sZWFuIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIiB8fCB2YWx1ZSBpbnN0YW5jZW9mIE51bWJlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU3RyaW5nKHZhbHVlOiB1bmtub3duKTogYm9vbGVhbiB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgfHwgdmFsdWUgaW5zdGFuY2VvZiBTdHJpbmc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1N5bWJvbCh2YWx1ZTogdW5rbm93bik6IGJvb2xlYW4ge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcInN5bWJvbFwiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNVbmRlZmluZWQodmFsdWU6IHVua25vd24pOiBib29sZWFuIHtcbiAgcmV0dXJuIHZhbHVlID09PSB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc09iamVjdCh2YWx1ZTogdW5rbm93bik6IGJvb2xlYW4ge1xuICByZXR1cm4gdmFsdWUgIT09IG51bGwgJiYgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNFcnJvcihlOiB1bmtub3duKTogYm9vbGVhbiB7XG4gIHJldHVybiBlIGluc3RhbmNlb2YgRXJyb3I7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0Z1bmN0aW9uKHZhbHVlOiB1bmtub3duKTogYm9vbGVhbiB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUmVnRXhwKHZhbHVlOiB1bmtub3duKTogYm9vbGVhbiB7XG4gIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFJlZ0V4cDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUHJpbWl0aXZlKHZhbHVlOiB1bmtub3duKTogYm9vbGVhbiB7XG4gIHJldHVybiAoXG4gICAgdmFsdWUgPT09IG51bGwgfHwgKHR5cGVvZiB2YWx1ZSAhPT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgdmFsdWUgIT09IFwiZnVuY3Rpb25cIilcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlSW50ZWdlclJhbmdlKFxuICB2YWx1ZTogbnVtYmVyLFxuICBuYW1lOiBzdHJpbmcsXG4gIG1pbiA9IC0yMTQ3NDgzNjQ4LFxuICBtYXggPSAyMTQ3NDgzNjQ3LFxuKTogdm9pZCB7XG4gIC8vIFRoZSBkZWZhdWx0cyBmb3IgbWluIGFuZCBtYXggY29ycmVzcG9uZCB0byB0aGUgbGltaXRzIG9mIDMyLWJpdCBpbnRlZ2Vycy5cbiAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKHZhbHVlKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHtuYW1lfSBtdXN0IGJlICdhbiBpbnRlZ2VyJyBidXQgd2FzICR7dmFsdWV9YCk7XG4gIH1cbiAgaWYgKHZhbHVlIDwgbWluIHx8IHZhbHVlID4gbWF4KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYCR7bmFtZX0gbXVzdCBiZSA+PSAke21pbn0gJiYgPD0gJHttYXh9LiAgVmFsdWUgd2FzICR7dmFsdWV9YCxcbiAgICApO1xuICB9XG59XG5cbmltcG9ydCB7IF9UZXh0RGVjb2RlciwgX1RleHRFbmNvZGVyIH0gZnJvbSBcIi4vX3V0aWxzLnRzXCI7XG5cbi8qKiBUaGUgZ2xvYmFsIFRleHREZWNvZGVyICovXG5leHBvcnQgdHlwZSBUZXh0RGVjb2RlciA9IGltcG9ydChcIi4vX3V0aWxzLnRzXCIpLl9UZXh0RGVjb2RlcjtcbmV4cG9ydCBjb25zdCBUZXh0RGVjb2RlciA9IF9UZXh0RGVjb2RlcjtcblxuLyoqIFRoZSBnbG9iYWwgVGV4dEVuY29kZXIgKi9cbmV4cG9ydCB0eXBlIFRleHRFbmNvZGVyID0gaW1wb3J0KFwiLi9fdXRpbHMudHNcIikuX1RleHRFbmNvZGVyO1xuZXhwb3J0IGNvbnN0IFRleHRFbmNvZGVyID0gX1RleHRFbmNvZGVyO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLFNBQVMsU0FBUSwwQkFBNEI7U0FDN0MsV0FBVyxTQUFRLDRCQUE4QjtZQUM5QyxLQUFLLE9BQU0sc0JBQXdCO1NBRXRDLEtBQUs7QUFFZCxFQUE4RCxBQUE5RCw0REFBOEQ7Z0JBQzlDLE9BQU8sQ0FBQyxNQUFlLEtBQUssSUFBSTtXQUN2QyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU07UUFDeEIsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQztRQUN0QixhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWEsSUFBSSxHQUFHO1FBQ3hDLE9BQU8sS0FBSyxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUk7UUFDaEMsTUFBTSxLQUFLLElBQUksQ0FBQyxNQUFNLElBQUksS0FBSzs7O2dCQUluQixPQUFPLENBQUMsS0FBYztXQUM3QixLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUs7O2dCQUdaLFNBQVMsQ0FBQyxLQUFjO2tCQUN4QixLQUFLLE1BQUssT0FBUyxLQUFJLEtBQUssWUFBWSxPQUFPOztnQkFHL0MsTUFBTSxDQUFDLEtBQWM7V0FDNUIsS0FBSyxLQUFLLElBQUk7O2dCQUdQLGlCQUFpQixDQUFDLEtBQWM7V0FDdkMsS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssU0FBUzs7Z0JBRzlCLFFBQVEsQ0FBQyxLQUFjO2tCQUN2QixLQUFLLE1BQUssTUFBUSxLQUFJLEtBQUssWUFBWSxNQUFNOztnQkFHN0MsUUFBUSxDQUFDLEtBQWM7a0JBQ3ZCLEtBQUssTUFBSyxNQUFRLEtBQUksS0FBSyxZQUFZLE1BQU07O2dCQUc3QyxRQUFRLENBQUMsS0FBYztrQkFDdkIsS0FBSyxNQUFLLE1BQVE7O2dCQUdsQixXQUFXLENBQUMsS0FBYztXQUNqQyxLQUFLLEtBQUssU0FBUzs7Z0JBR1osUUFBUSxDQUFDLEtBQWM7V0FDOUIsS0FBSyxLQUFLLElBQUksV0FBVyxLQUFLLE1BQUssTUFBUTs7Z0JBR3BDLE9BQU8sQ0FBQyxDQUFVO1dBQ3pCLENBQUMsWUFBWSxLQUFLOztnQkFHWCxVQUFVLENBQUMsS0FBYztrQkFDekIsS0FBSyxNQUFLLFFBQVU7O2dCQUdwQixRQUFRLENBQUMsS0FBYztXQUM5QixLQUFLLFlBQVksTUFBTTs7Z0JBR2hCLFdBQVcsQ0FBQyxLQUFjO1dBRXRDLEtBQUssS0FBSyxJQUFJLFdBQVksS0FBSyxNQUFLLE1BQVEsWUFBVyxLQUFLLE1BQUssUUFBVTs7Z0JBSS9ELG9CQUFvQixDQUNsQyxLQUFhLEVBQ2IsSUFBWSxFQUNaLEdBQUcsSUFBSSxVQUFVLEVBQ2pCLEdBQUcsR0FBRyxVQUFVO0lBRWhCLEVBQTRFLEFBQTVFLDBFQUE0RTtTQUN2RSxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUs7a0JBQ2YsS0FBSyxJQUFJLElBQUksQ0FBQyw4QkFBOEIsRUFBRSxLQUFLOztRQUUzRCxLQUFLLEdBQUcsR0FBRyxJQUFJLEtBQUssR0FBRyxHQUFHO2tCQUNsQixLQUFLLElBQ1YsSUFBSSxDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxhQUFhLEVBQUUsS0FBSzs7O1NBS3hELFlBQVksRUFBRSxZQUFZLFNBQVEsV0FBYTtNQUkzQyxZQUFXLEdBQUcsWUFBWTtTQUExQixZQUFXLElBQVgsV0FBVztNQUlYLFlBQVcsR0FBRyxZQUFZO1NBQTFCLFlBQVcsSUFBWCxXQUFXIn0=