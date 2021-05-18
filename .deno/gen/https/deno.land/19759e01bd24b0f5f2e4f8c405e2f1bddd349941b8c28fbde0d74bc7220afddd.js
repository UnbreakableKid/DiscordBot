/**
 * Returns `true` if the input has type `{ name: string }`. 
 * @param value
 * @see https://doc.deno.land/https/deno.land/std/http/mod.ts#Cookie
 */ export function hasCookieNameProperty(value) {
    return value && typeof value === "object" && typeof value.name === "string";
}
/**
 * Returns `true` if input has all required properties of `Cookie`.
 * @param value 
 * @see https://doc.deno.land/https/deno.land/std/http/mod.ts#Cookie
 */ export function hasCookieRequiredProperties(value) {
    return hasCookieNameProperty(value) && typeof value.value === "string";
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy91dGlscy9jb29raWVzLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IENvb2tpZSB9IGZyb20gXCIuLi8uLi9kZXBzLnRzXCI7XG5cbi8qKlxuICogUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGlucHV0IGhhcyB0eXBlIGB7IG5hbWU6IHN0cmluZyB9YC4gXG4gKiBAcGFyYW0gdmFsdWVcbiAqIEBzZWUgaHR0cHM6Ly9kb2MuZGVuby5sYW5kL2h0dHBzL2Rlbm8ubGFuZC9zdGQvaHR0cC9tb2QudHMjQ29va2llXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYXNDb29raWVOYW1lUHJvcGVydHkoXG4gIHZhbHVlOiBhbnksXG4pOiB2YWx1ZSBpcyBQaWNrPENvb2tpZSwgXCJuYW1lXCI+IHtcbiAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgdmFsdWUubmFtZSA9PT0gXCJzdHJpbmdcIjtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGB0cnVlYCBpZiBpbnB1dCBoYXMgYWxsIHJlcXVpcmVkIHByb3BlcnRpZXMgb2YgYENvb2tpZWAuXG4gKiBAcGFyYW0gdmFsdWUgXG4gKiBAc2VlIGh0dHBzOi8vZG9jLmRlbm8ubGFuZC9odHRwcy9kZW5vLmxhbmQvc3RkL2h0dHAvbW9kLnRzI0Nvb2tpZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzQ29va2llUmVxdWlyZWRQcm9wZXJ0aWVzKFxuICB2YWx1ZTogYW55LFxuKTogdmFsdWUgaXMgUGljazxDb29raWUsIFwibmFtZVwiIHwgXCJ2YWx1ZVwiPiB7XG4gIHJldHVybiBoYXNDb29raWVOYW1lUHJvcGVydHkodmFsdWUpICYmXG4gICAgdHlwZW9mICh2YWx1ZSBhcyBhbnkpLnZhbHVlID09PSBcInN0cmluZ1wiO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLEVBSUcsQUFKSDs7OztDQUlHLEFBSkgsRUFJRyxpQkFDYSxxQkFBcUIsQ0FDbkMsS0FBVTtXQUVILEtBQUssV0FBVyxLQUFLLE1BQUssTUFBUSxZQUFXLEtBQUssQ0FBQyxJQUFJLE1BQUssTUFBUTs7QUFHN0UsRUFJRyxBQUpIOzs7O0NBSUcsQUFKSCxFQUlHLGlCQUNhLDJCQUEyQixDQUN6QyxLQUFVO1dBRUgscUJBQXFCLENBQUMsS0FBSyxZQUN4QixLQUFLLENBQVMsS0FBSyxNQUFLLE1BQVEifQ==