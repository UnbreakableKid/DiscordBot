const create = Object.create;
const setPrototypeOf = Object.setPrototypeOf;
/**
 * Initialization middleware, exposing the
 * request and response to each other, setting
 * locals if not defined, as well as defaulting
 * the X-Powered-By header field.
 *
 * @param {Opine} app
 * @return {Function} init middleware
 * @private
 */ export const init = function(app) {
    return function opineInit(req, res, next) {
        if (app.enabled("x-powered-by")) res.set("X-Powered-By", "Opine");
        req.res = res;
        res.req = req;
        req.next = next;
        setPrototypeOf(req, app.request);
        setPrototypeOf(res, app.response);
        // Deno 1.9.0 introduced a change which restricted the interaction with
        // the prototype object requiring properties to be manually copied in
        // this fashion.
        res.app = app.response.app;
        res.locals = res.locals || create(null);
        next();
    };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy9taWRkbGV3YXJlL2luaXQudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHtcbiAgTmV4dEZ1bmN0aW9uLFxuICBPcGluZSxcbiAgUmVxdWVzdCxcbiAgUmVzcG9uc2UsXG59IGZyb20gXCIuLi8uLi9zcmMvdHlwZXMudHNcIjtcblxuY29uc3QgY3JlYXRlID0gT2JqZWN0LmNyZWF0ZTtcbmNvbnN0IHNldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mO1xuXG4vKipcbiAqIEluaXRpYWxpemF0aW9uIG1pZGRsZXdhcmUsIGV4cG9zaW5nIHRoZVxuICogcmVxdWVzdCBhbmQgcmVzcG9uc2UgdG8gZWFjaCBvdGhlciwgc2V0dGluZ1xuICogbG9jYWxzIGlmIG5vdCBkZWZpbmVkLCBhcyB3ZWxsIGFzIGRlZmF1bHRpbmdcbiAqIHRoZSBYLVBvd2VyZWQtQnkgaGVhZGVyIGZpZWxkLlxuICpcbiAqIEBwYXJhbSB7T3BpbmV9IGFwcFxuICogQHJldHVybiB7RnVuY3Rpb259IGluaXQgbWlkZGxld2FyZVxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0IGNvbnN0IGluaXQgPSBmdW5jdGlvbiAoYXBwOiBPcGluZSkge1xuICByZXR1cm4gZnVuY3Rpb24gb3BpbmVJbml0KHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKSB7XG4gICAgaWYgKGFwcC5lbmFibGVkKFwieC1wb3dlcmVkLWJ5XCIpKSByZXMuc2V0KFwiWC1Qb3dlcmVkLUJ5XCIsIFwiT3BpbmVcIik7XG5cbiAgICByZXEucmVzID0gcmVzO1xuICAgIHJlcy5yZXEgPSByZXE7XG4gICAgcmVxLm5leHQgPSBuZXh0O1xuXG4gICAgc2V0UHJvdG90eXBlT2YocmVxLCBhcHAucmVxdWVzdCk7XG4gICAgc2V0UHJvdG90eXBlT2YocmVzLCBhcHAucmVzcG9uc2UpO1xuXG4gICAgLy8gRGVubyAxLjkuMCBpbnRyb2R1Y2VkIGEgY2hhbmdlIHdoaWNoIHJlc3RyaWN0ZWQgdGhlIGludGVyYWN0aW9uIHdpdGhcbiAgICAvLyB0aGUgcHJvdG90eXBlIG9iamVjdCByZXF1aXJpbmcgcHJvcGVydGllcyB0byBiZSBtYW51YWxseSBjb3BpZWQgaW5cbiAgICAvLyB0aGlzIGZhc2hpb24uXG4gICAgcmVzLmFwcCA9IGFwcC5yZXNwb25zZS5hcHA7XG4gICAgcmVzLmxvY2FscyA9IHJlcy5sb2NhbHMgfHwgY3JlYXRlKG51bGwpO1xuXG4gICAgbmV4dCgpO1xuICB9O1xufTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiTUFPTSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU07TUFDdEIsY0FBYyxHQUFHLE1BQU0sQ0FBQyxjQUFjO0FBRTVDLEVBU0csQUFUSDs7Ozs7Ozs7O0NBU0csQUFUSCxFQVNHLGNBQ1UsSUFBSSxZQUFhLEdBQVU7b0JBQ3RCLFNBQVMsQ0FBQyxHQUFZLEVBQUUsR0FBYSxFQUFFLElBQWtCO1lBQ25FLEdBQUcsQ0FBQyxPQUFPLEVBQUMsWUFBYyxJQUFHLEdBQUcsQ0FBQyxHQUFHLEVBQUMsWUFBYyxJQUFFLEtBQU87UUFFaEUsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHO1FBQ2IsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHO1FBQ2IsR0FBRyxDQUFDLElBQUksR0FBRyxJQUFJO1FBRWYsY0FBYyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsT0FBTztRQUMvQixjQUFjLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxRQUFRO1FBRWhDLEVBQXVFLEFBQXZFLHFFQUF1RTtRQUN2RSxFQUFxRSxBQUFyRSxtRUFBcUU7UUFDckUsRUFBZ0IsQUFBaEIsY0FBZ0I7UUFDaEIsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUc7UUFDMUIsR0FBRyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxJQUFJO1FBRXRDLElBQUkifQ==