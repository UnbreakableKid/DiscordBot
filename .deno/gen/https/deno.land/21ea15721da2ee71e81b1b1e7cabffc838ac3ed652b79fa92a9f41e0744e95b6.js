/**
 * Helper function for creating a getter on an object.
 *
 * @param {object} obj
 * @param {string} name
 * @param {Function} getter
 * @private
 */ export function defineGetter(obj, name, getter) {
    Object.defineProperty(obj, name, {
        configurable: true,
        enumerable: true,
        get: getter
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy91dGlscy9kZWZpbmVHZXR0ZXIudHM+Il0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIGZvciBjcmVhdGluZyBhIGdldHRlciBvbiBhbiBvYmplY3QuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG9ialxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGdldHRlclxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlZmluZUdldHRlcihvYmo6IG9iamVjdCwgbmFtZTogc3RyaW5nLCBnZXR0ZXI6ICgpID0+IGFueSkge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBuYW1lLCB7XG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0OiBnZXR0ZXIsXG4gIH0pO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEVBT0csQUFQSDs7Ozs7OztDQU9HLEFBUEgsRUFPRyxpQkFDYSxZQUFZLENBQUMsR0FBVyxFQUFFLElBQVksRUFBRSxNQUFpQjtJQUN2RSxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxJQUFJO1FBQzdCLFlBQVksRUFBRSxJQUFJO1FBQ2xCLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLEdBQUcsRUFBRSxNQUFNIn0=