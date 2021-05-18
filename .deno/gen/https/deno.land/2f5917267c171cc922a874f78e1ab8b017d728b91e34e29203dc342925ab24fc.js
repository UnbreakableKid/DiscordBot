import { qs } from "../../deps.ts";
import { parseUrl } from "../utils/parseUrl.ts";
import { merge } from "../utils/merge.ts";
/**
 * Exposes a query object containing the querystring
 * parameters of the request url.
 * 
 * @return {Function} query middleware
 * @public
 */ export const query = function(options) {
    let opts = merge({
    }, options);
    let queryParse = qs.parse;
    if (typeof options === "function") {
        queryParse = options;
        opts = undefined;
    }
    if (opts !== undefined && opts.allowPrototypes === undefined) {
        // back-compat for qs module
        opts.allowPrototypes = true;
    }
    return function opineQuery(req, _res, next) {
        if (!req.query) {
            const value = parseUrl(req)?.query;
            req.query = queryParse(value, opts);
        }
        next();
    };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy9taWRkbGV3YXJlL3F1ZXJ5LnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBxcyB9IGZyb20gXCIuLi8uLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyBwYXJzZVVybCB9IGZyb20gXCIuLi91dGlscy9wYXJzZVVybC50c1wiO1xuaW1wb3J0IHsgbWVyZ2UgfSBmcm9tIFwiLi4vdXRpbHMvbWVyZ2UudHNcIjtcbmltcG9ydCB0eXBlIHsgTmV4dEZ1bmN0aW9uLCBSZXF1ZXN0LCBSZXNwb25zZSB9IGZyb20gXCIuLi90eXBlcy50c1wiO1xuXG4vKipcbiAqIEV4cG9zZXMgYSBxdWVyeSBvYmplY3QgY29udGFpbmluZyB0aGUgcXVlcnlzdHJpbmdcbiAqIHBhcmFtZXRlcnMgb2YgdGhlIHJlcXVlc3QgdXJsLlxuICogXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gcXVlcnkgbWlkZGxld2FyZVxuICogQHB1YmxpY1xuICovXG5leHBvcnQgY29uc3QgcXVlcnkgPSBmdW5jdGlvbiAob3B0aW9uczogYW55KSB7XG4gIGxldCBvcHRzID0gbWVyZ2Uoe30sIG9wdGlvbnMpO1xuICBsZXQgcXVlcnlQYXJzZSA9IHFzLnBhcnNlO1xuXG4gIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgcXVlcnlQYXJzZSA9IG9wdGlvbnM7XG4gICAgb3B0cyA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGlmIChvcHRzICE9PSB1bmRlZmluZWQgJiYgb3B0cy5hbGxvd1Byb3RvdHlwZXMgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIGJhY2stY29tcGF0IGZvciBxcyBtb2R1bGVcbiAgICBvcHRzLmFsbG93UHJvdG90eXBlcyA9IHRydWU7XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gb3BpbmVRdWVyeShyZXE6IFJlcXVlc3QsIF9yZXM6IFJlc3BvbnNlLCBuZXh0OiBOZXh0RnVuY3Rpb24pIHtcbiAgICBpZiAoIXJlcS5xdWVyeSkge1xuICAgICAgY29uc3QgdmFsdWUgPSBwYXJzZVVybChyZXEpPy5xdWVyeSBhcyBzdHJpbmc7XG4gICAgICByZXEucXVlcnkgPSBxdWVyeVBhcnNlKHZhbHVlLCBvcHRzKTtcbiAgICB9XG5cbiAgICBuZXh0KCk7XG4gIH07XG59O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLEVBQUUsU0FBUSxhQUFlO1NBQ3pCLFFBQVEsU0FBUSxvQkFBc0I7U0FDdEMsS0FBSyxTQUFRLGlCQUFtQjtBQUd6QyxFQU1HLEFBTkg7Ozs7OztDQU1HLEFBTkgsRUFNRyxjQUNVLEtBQUssWUFBYSxPQUFZO1FBQ3JDLElBQUksR0FBRyxLQUFLO09BQUssT0FBTztRQUN4QixVQUFVLEdBQUcsRUFBRSxDQUFDLEtBQUs7ZUFFZCxPQUFPLE1BQUssUUFBVTtRQUMvQixVQUFVLEdBQUcsT0FBTztRQUNwQixJQUFJLEdBQUcsU0FBUzs7UUFHZCxJQUFJLEtBQUssU0FBUyxJQUFJLElBQUksQ0FBQyxlQUFlLEtBQUssU0FBUztRQUMxRCxFQUE0QixBQUE1QiwwQkFBNEI7UUFDNUIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJOztvQkFHYixVQUFVLENBQUMsR0FBWSxFQUFFLElBQWMsRUFBRSxJQUFrQjthQUNwRSxHQUFHLENBQUMsS0FBSztrQkFDTixLQUFLLEdBQUcsUUFBUSxDQUFDLEdBQUcsR0FBRyxLQUFLO1lBQ2xDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFDLEtBQUssRUFBRSxJQUFJOztRQUdwQyxJQUFJIn0=