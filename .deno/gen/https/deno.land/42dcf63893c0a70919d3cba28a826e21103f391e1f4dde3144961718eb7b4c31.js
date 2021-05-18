import { Layer } from "./layer.ts";
import { methods } from "../methods.ts";
/**
 * Initialize `Route` with the given `path`.
 *
 * @param {string} path
 * @public
 */ export const Route = function Route(path) {
  this.path = path;
  this.stack = [];
  // route handlers for various http methods
  this.methods = {};
};
/**
 * Determine if the route handles a given method.
 * @private
 */ Route.prototype._handles_method = function _handles_method(method) {
  if (this.methods._all) {
    return true;
  }
  let name = method.toLowerCase();
  if (name === "head" && !this.methods["head"]) {
    name = "get";
  }
  return Boolean(this.methods[name]);
};
/**
 * @return {Array} supported HTTP methods
 * @private
 */ Route.prototype._options = function _options() {
  let methods = Object.keys(this.methods);
  // append automatic head
  if (this.methods.get && !this.methods.head) {
    methods.push("head");
  }
  for (let i = 0; i < methods.length; i++) {
    // make upper case
    methods[i] = methods[i].toUpperCase();
  }
  return methods;
};
/**
 * dispatch req, res into this route
 * @private
 */ Route.prototype.dispatch = function dispatch(req, res, done) {
  let idx = 0;
  let stack = this.stack;
  if (stack.length === 0) {
    return done();
  }
  let method = req.method.toLowerCase();
  if (method === "head" && !this.methods["head"]) {
    method = "get";
  }
  req.route = this;
  next();
  function next(err) {
    // signal to exit route
    if (err && err === "route") {
      return done();
    }
    // signal to exit router
    if (err && err === "router") {
      return done(err);
    }
    let layer = stack[idx++];
    if (!layer) {
      return done(err);
    }
    if (layer.method && layer.method !== method) {
      return next(err);
    }
    if (err) {
      layer.handle_error(err, req, res, next);
    } else {
      layer.handle_request(req, res, next);
    }
  }
};
/**
 * Add a handler for all HTTP verbs to this route.
 *
 * Behaves just like middleware and can respond or call `next`
 * to continue processing.
 *
 * You can use multiple `.all` call to add multiple handlers.
 *
 *   function check_something(req, res, next){
 *     next();
 *   };
 *
 *   function validate_user(req, res, next){
 *     next();
 *   };
 *
 *   route
 *   .all(validate_user)
 *   .all(check_something)
 *   .get(function(req, res, next){
 *     res.send('hello world');
 *   });
 *
 * @param {function} handler
 * @return {Route} for chaining
 * @public
 */ Route.prototype.all = function all() {
  let handles = Array.prototype.slice.call(arguments).flat(1);
  for (let i = 0; i < handles.length; i++) {
    let handle = handles[i];
    if (typeof handle !== "function") {
      let type = Object.prototype.toString.call(handle);
      let msg = "Route.all() requires a callback function but got a " + type;
      throw new TypeError(msg);
    }
    let layer = Layer("/", {}, handle);
    layer.method = undefined;
    this.methods._all = true;
    this.stack.push(layer);
  }
  return this;
};
methods.forEach(function (method) {
  Route.prototype[method] = function () {
    let handles = Array.prototype.slice.call(arguments).flat(1);
    for (let i = 0; i < handles.length; i++) {
      let handle = handles[i];
      if (typeof handle !== "function") {
        let type = Object.prototype.toString.call(handle);
        let msg = "Route." + method +
          "() requires a callback function but got a " + type;
        throw new Error(msg);
      }
      let layer = Layer("/", {}, handle);
      layer.method = method;
      this.methods[method] = true;
      this.stack.push(layer);
    }
    return this;
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy9yb3V0ZXIvcm91dGUudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IExheWVyIH0gZnJvbSBcIi4vbGF5ZXIudHNcIjtcbmltcG9ydCB7IG1ldGhvZHMgfSBmcm9tIFwiLi4vbWV0aG9kcy50c1wiO1xuaW1wb3J0IHR5cGUgeyBOZXh0RnVuY3Rpb24sIFJlcXVlc3QsIFJlc3BvbnNlIH0gZnJvbSBcIi4uL3R5cGVzLnRzXCI7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBgUm91dGVgIHdpdGggdGhlIGdpdmVuIGBwYXRoYC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aFxuICogQHB1YmxpY1xuICovXG5leHBvcnQgY29uc3QgUm91dGU6IGFueSA9IGZ1bmN0aW9uIFJvdXRlKHRoaXM6IGFueSwgcGF0aDogc3RyaW5nKTogdm9pZCB7XG4gIHRoaXMucGF0aCA9IHBhdGg7XG4gIHRoaXMuc3RhY2sgPSBbXTtcblxuICAvLyByb3V0ZSBoYW5kbGVycyBmb3IgdmFyaW91cyBodHRwIG1ldGhvZHNcbiAgdGhpcy5tZXRob2RzID0ge307XG59O1xuXG4vKipcbiAqIERldGVybWluZSBpZiB0aGUgcm91dGUgaGFuZGxlcyBhIGdpdmVuIG1ldGhvZC5cbiAqIEBwcml2YXRlXG4gKi9cblJvdXRlLnByb3RvdHlwZS5faGFuZGxlc19tZXRob2QgPSBmdW5jdGlvbiBfaGFuZGxlc19tZXRob2QobWV0aG9kOiBhbnkpIHtcbiAgaWYgKHRoaXMubWV0aG9kcy5fYWxsKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBsZXQgbmFtZSA9IG1ldGhvZC50b0xvd2VyQ2FzZSgpO1xuXG4gIGlmIChuYW1lID09PSBcImhlYWRcIiAmJiAhdGhpcy5tZXRob2RzW1wiaGVhZFwiXSkge1xuICAgIG5hbWUgPSBcImdldFwiO1xuICB9XG5cbiAgcmV0dXJuIEJvb2xlYW4odGhpcy5tZXRob2RzW25hbWVdKTtcbn07XG5cbi8qKlxuICogQHJldHVybiB7QXJyYXl9IHN1cHBvcnRlZCBIVFRQIG1ldGhvZHNcbiAqIEBwcml2YXRlXG4gKi9cblJvdXRlLnByb3RvdHlwZS5fb3B0aW9ucyA9IGZ1bmN0aW9uIF9vcHRpb25zKCkge1xuICBsZXQgbWV0aG9kcyA9IE9iamVjdC5rZXlzKHRoaXMubWV0aG9kcyk7XG5cbiAgLy8gYXBwZW5kIGF1dG9tYXRpYyBoZWFkXG4gIGlmICh0aGlzLm1ldGhvZHMuZ2V0ICYmICF0aGlzLm1ldGhvZHMuaGVhZCkge1xuICAgIG1ldGhvZHMucHVzaChcImhlYWRcIik7XG4gIH1cblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG1ldGhvZHMubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBtYWtlIHVwcGVyIGNhc2VcbiAgICBtZXRob2RzW2ldID0gbWV0aG9kc1tpXS50b1VwcGVyQ2FzZSgpO1xuICB9XG5cbiAgcmV0dXJuIG1ldGhvZHM7XG59O1xuXG4vKipcbiAqIGRpc3BhdGNoIHJlcSwgcmVzIGludG8gdGhpcyByb3V0ZVxuICogQHByaXZhdGVcbiAqL1xuUm91dGUucHJvdG90eXBlLmRpc3BhdGNoID0gZnVuY3Rpb24gZGlzcGF0Y2goXG4gIHJlcTogUmVxdWVzdCxcbiAgcmVzOiBSZXNwb25zZSxcbiAgZG9uZTogTmV4dEZ1bmN0aW9uLFxuKSB7XG4gIGxldCBpZHggPSAwO1xuICBsZXQgc3RhY2sgPSB0aGlzLnN0YWNrO1xuICBpZiAoc3RhY2subGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIGRvbmUoKTtcbiAgfVxuXG4gIGxldCBtZXRob2QgPSByZXEubWV0aG9kLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChtZXRob2QgPT09IFwiaGVhZFwiICYmICF0aGlzLm1ldGhvZHNbXCJoZWFkXCJdKSB7XG4gICAgbWV0aG9kID0gXCJnZXRcIjtcbiAgfVxuXG4gIHJlcS5yb3V0ZSA9IHRoaXM7XG5cbiAgbmV4dCgpO1xuXG4gIGZ1bmN0aW9uIG5leHQoZXJyPzogRXJyb3IgfCBzdHJpbmcpOiBhbnkge1xuICAgIC8vIHNpZ25hbCB0byBleGl0IHJvdXRlXG4gICAgaWYgKGVyciAmJiBlcnIgPT09IFwicm91dGVcIikge1xuICAgICAgcmV0dXJuIGRvbmUoKTtcbiAgICB9XG5cbiAgICAvLyBzaWduYWwgdG8gZXhpdCByb3V0ZXJcbiAgICBpZiAoZXJyICYmIGVyciA9PT0gXCJyb3V0ZXJcIikge1xuICAgICAgcmV0dXJuIGRvbmUoZXJyKTtcbiAgICB9XG5cbiAgICBsZXQgbGF5ZXIgPSBzdGFja1tpZHgrK107XG4gICAgaWYgKCFsYXllcikge1xuICAgICAgcmV0dXJuIGRvbmUoZXJyKTtcbiAgICB9XG5cbiAgICBpZiAobGF5ZXIubWV0aG9kICYmIGxheWVyLm1ldGhvZCAhPT0gbWV0aG9kKSB7XG4gICAgICByZXR1cm4gbmV4dChlcnIpO1xuICAgIH1cblxuICAgIGlmIChlcnIpIHtcbiAgICAgIGxheWVyLmhhbmRsZV9lcnJvcihlcnIsIHJlcSwgcmVzLCBuZXh0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGF5ZXIuaGFuZGxlX3JlcXVlc3QocmVxLCByZXMsIG5leHQpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBBZGQgYSBoYW5kbGVyIGZvciBhbGwgSFRUUCB2ZXJicyB0byB0aGlzIHJvdXRlLlxuICpcbiAqIEJlaGF2ZXMganVzdCBsaWtlIG1pZGRsZXdhcmUgYW5kIGNhbiByZXNwb25kIG9yIGNhbGwgYG5leHRgXG4gKiB0byBjb250aW51ZSBwcm9jZXNzaW5nLlxuICpcbiAqIFlvdSBjYW4gdXNlIG11bHRpcGxlIGAuYWxsYCBjYWxsIHRvIGFkZCBtdWx0aXBsZSBoYW5kbGVycy5cbiAqXG4gKiAgIGZ1bmN0aW9uIGNoZWNrX3NvbWV0aGluZyhyZXEsIHJlcywgbmV4dCl7XG4gKiAgICAgbmV4dCgpO1xuICogICB9O1xuICpcbiAqICAgZnVuY3Rpb24gdmFsaWRhdGVfdXNlcihyZXEsIHJlcywgbmV4dCl7XG4gKiAgICAgbmV4dCgpO1xuICogICB9O1xuICpcbiAqICAgcm91dGVcbiAqICAgLmFsbCh2YWxpZGF0ZV91c2VyKVxuICogICAuYWxsKGNoZWNrX3NvbWV0aGluZylcbiAqICAgLmdldChmdW5jdGlvbihyZXEsIHJlcywgbmV4dCl7XG4gKiAgICAgcmVzLnNlbmQoJ2hlbGxvIHdvcmxkJyk7XG4gKiAgIH0pO1xuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGhhbmRsZXJcbiAqIEByZXR1cm4ge1JvdXRlfSBmb3IgY2hhaW5pbmdcbiAqIEBwdWJsaWNcbiAqL1xuUm91dGUucHJvdG90eXBlLmFsbCA9IGZ1bmN0aW9uIGFsbCgpIHtcbiAgbGV0IGhhbmRsZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLmZsYXQoMSk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBoYW5kbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGhhbmRsZSA9IGhhbmRsZXNbaV07XG5cbiAgICBpZiAodHlwZW9mIGhhbmRsZSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBsZXQgdHlwZSA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChoYW5kbGUpO1xuICAgICAgbGV0IG1zZyA9IFwiUm91dGUuYWxsKCkgcmVxdWlyZXMgYSBjYWxsYmFjayBmdW5jdGlvbiBidXQgZ290IGEgXCIgKyB0eXBlO1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihtc2cpO1xuICAgIH1cblxuICAgIGxldCBsYXllciA9IExheWVyKFwiL1wiLCB7fSwgaGFuZGxlKTtcbiAgICBsYXllci5tZXRob2QgPSB1bmRlZmluZWQ7XG5cbiAgICB0aGlzLm1ldGhvZHMuX2FsbCA9IHRydWU7XG4gICAgdGhpcy5zdGFjay5wdXNoKGxheWVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxubWV0aG9kcy5mb3JFYWNoKGZ1bmN0aW9uIChtZXRob2QpIHtcbiAgUm91dGUucHJvdG90eXBlW21ldGhvZF0gPSBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IGhhbmRsZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLmZsYXQoMSk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhhbmRsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBoYW5kbGUgPSBoYW5kbGVzW2ldO1xuXG4gICAgICBpZiAodHlwZW9mIGhhbmRsZSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGxldCB0eXBlID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGhhbmRsZSk7XG4gICAgICAgIGxldCBtc2cgPSBcIlJvdXRlLlwiICsgbWV0aG9kICtcbiAgICAgICAgICBcIigpIHJlcXVpcmVzIGEgY2FsbGJhY2sgZnVuY3Rpb24gYnV0IGdvdCBhIFwiICsgdHlwZTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9XG5cbiAgICAgIGxldCBsYXllciA9IExheWVyKFwiL1wiLCB7fSwgaGFuZGxlKTtcbiAgICAgIGxheWVyLm1ldGhvZCA9IG1ldGhvZDtcblxuICAgICAgdGhpcy5tZXRob2RzW21ldGhvZF0gPSB0cnVlO1xuICAgICAgdGhpcy5zdGFjay5wdXNoKGxheWVyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJTQUFTLEtBQUssU0FBUSxVQUFZO1NBQ3pCLE9BQU8sU0FBUSxhQUFlO0FBR3ZDLEVBS0csQUFMSDs7Ozs7Q0FLRyxBQUxILEVBS0csY0FDVSxLQUFLLFlBQWlCLEtBQUssQ0FBWSxJQUFZO1NBQ3pELElBQUksR0FBRyxJQUFJO1NBQ1gsS0FBSztJQUVWLEVBQTBDLEFBQTFDLHdDQUEwQztTQUNyQyxPQUFPOzs7QUFHZCxFQUdHLEFBSEg7OztDQUdHLEFBSEgsRUFHRyxDQUNILEtBQUssQ0FBQyxTQUFTLENBQUMsZUFBZSxZQUFZLGVBQWUsQ0FBQyxNQUFXO2FBQzNELE9BQU8sQ0FBQyxJQUFJO2VBQ1osSUFBSTs7UUFHVCxJQUFJLEdBQUcs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
