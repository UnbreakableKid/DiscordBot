import { setImmediate } from "../../deps.ts";
import { Route } from "./route.ts";
import { Layer } from "./layer.ts";
import { merge } from "../utils/merge.ts";
import { parseUrl } from "../utils/parseUrl.ts";
import { methods } from "../methods.ts";
const objectRegExp = /^\[object (\S+)\]$/;
const setPrototypeOf = Object.setPrototypeOf;
/**
 * Initialize a new `Router` with the given `options`.
 *
 * @param {object} options
 * @return {Router} which is an callable function
 * @public
 */ export const Router = function (options = {}) {
  function router(req, res, next) {
    router.handle(req, res, next);
  }
  setPrototypeOf(router, Router);
  router.params = {};
  router._params = [];
  router.caseSensitive = options.caseSensitive;
  router.mergeParams = options.mergeParams;
  router.strict = options.strict;
  router.stack = [];
  return router;
};
/**
 * Map the given param placeholder `name`(s) to the given callback.
 *
 * Parameter mapping is used to provide pre-conditions to routes
 * which use normalized placeholders. For example a _:user_id_ parameter
 * could automatically load a user's information from the database without
 * any additional code,
 *
 * The callback uses the same signature as middleware, the only difference
 * being that the value of the placeholder is passed, in this case the _id_
 * of the user. Once the `next()` function is invoked, just like middleware
 * it will continue on to execute the route, or subsequent parameter functions.
 *
 * Just like in middleware, you must either respond to the request or call next
 * to avoid stalling the request.
 *
 *  app.param('user_id', function(req, res, next, id){
 *    User.find(id, function(err, user){
 *      if (err) {
 *        return next(err);
 *      } else if (!user) {
 *        return next(new Error('failed to load user'));
 *      }
 *      req.user = user;
 *      next();
 *    });
 *  });
 *
 * @param {String} name
 * @param {Function} fn
 * @return {app} for chaining
 * @public
 */ Router.param = function param(name, fn) {
  // apply param functions
  var params = this._params;
  var len = params.length;
  var ret;
  // ensure param `name` is a string
  if (typeof name !== "string") {
    throw new Error(
      "invalid param() call for " + name + ", value must be a string",
    );
  }
  for (var i = 0; i < len; ++i) {
    if (ret = params[i](name, fn)) {
      fn = ret;
    }
  }
  // ensure we end up with a
  // middleware function
  if ("function" !== typeof fn) {
    throw new Error("invalid param() call for " + name + ", got " + fn);
  }
  (this.params[name] = this.params[name] || []).push(fn);
  return this;
};
/**
 * Dispatch a req, res into the router.
 * @private
 */ Router.handle = function handle(req, res, out = () => {
}) {
  const self = this;
  let idx = 0;
  let protohost = getProtohost(req.url) || "";
  let removed = "";
  let slashAdded = false;
  let paramcalled = {};
  // store options for OPTIONS request
  // only used if OPTIONS request
  let options = [];
  // middleware and routes
  let stack = self.stack;
  // manage inter-router variables
  let parentParams = req.params;
  let parentUrl = req.baseUrl || "";
  let done = restore(out, req, "baseUrl", "next", "params");
  // setup next layer
  req.next = next;
  // for options requests, respond with a default if nothing else responds
  if (req.method === "OPTIONS") {
    done = wrap(done, function (old, err) {
      if (err || options.length === 0) {
        return old(err);
      }
      sendOptionsResponse(res, options, old);
    });
  }
  // setup basic req values
  req.baseUrl = parentUrl;
  req.originalUrl = req.originalUrl || req.url;
  next();
  function next(err) {
    let layerError = err === "route" ? null : err;
    // remove added slash
    if (slashAdded) {
      req.url = req.url.substr(1);
      slashAdded = false;
    }
    // restore altered req.url
    if (removed.length !== 0) {
      req.baseUrl = parentUrl;
      req.url = protohost + removed + req.url.substr(protohost.length);
      removed = "";
    }
    // signal to exit router
    if (layerError === "router") {
      setImmediate(done, null);
      return;
    }
    // no more matching layers
    if (idx >= stack.length) {
      setImmediate(done, layerError);
      return;
    }
    // get pathname of request
    let path = (parseUrl(req) || {}).pathname;
    if (path == null) {
      return done(layerError);
    }
    // find next matching layer
    let layer;
    let match;
    let route;
    while (match !== true && idx < stack.length) {
      layer = stack[idx++];
      match = matchLayer(layer, path);
      route = layer.route;
      if (typeof match !== "boolean") {
        // hold on to layerError
        layerError = layerError || match;
      }
      if (match !== true) {
        continue;
      }
      if (!route) {
        continue;
      }
      if (layerError) {
        // routes do not match with a pending error
        match = false;
        continue;
      }
      let method = req.method;
      let has_method = route._handles_method(method);
      // build up automatic options response
      if (!has_method && method === "OPTIONS") {
        appendMethods(options, route._options());
      }
      // don't even bother matching route
      if (!has_method && method !== "HEAD") {
        match = false;
        continue;
      }
    }
    // no match
    if (match !== true) {
      return done(layerError);
    }
    // store route for dispatch on change
    if (route) {
      req.route = route;
    }
    // Capture one-time layer values
    req.params = self.mergeParams
      ? mergeParams(layer.params, parentParams)
      : layer.params;
    let layerPath = layer.path;
    // this should be done for the layer
    self.process_params(layer, paramcalled, req, res, function (err) {
      if (err) {
        return next(layerError || err);
      }
      if (route) {
        return layer.handle_request(req, res, next);
      }
      trim_prefix(layer, layerError, layerPath, path);
    });
  }
  function trim_prefix(layer, layerError, layerPath, path) {
    if (layerPath.length !== 0) {
      // Validate path breaks on a path separator
      let c = path[layerPath.length];
      if (c && c !== "/" && c !== ".") {
        return next(layerError);
      }
      // Trim off the part of the url that matches the route
      // middleware (.use stuff) needs to have the path stripped
      removed = layerPath;
      req.url = protohost + req.url.substr(protohost.length + removed.length);
      // Ensure leading slash
      if (!protohost && req.url[0] !== "/") {
        req.url = "/" + req.url;
        slashAdded = true;
      }
      // Setup base URL (no trailing slash)
      req.baseUrl = parentUrl +
        (removed[removed.length - 1] === "/"
          ? removed.substring(0, removed.length - 1)
          : removed);
    }
    if (layerError) {
      layer.handle_error(layerError, req, res, next);
    } else {
      layer.handle_request(req, res, next);
    }
  }
};
/**
 * Process any parameters for the layer.
 * @private
 */ Router.process_params = function process_params(
  layer,
  called,
  req,
  res,
  done,
) {
  let params = this.params;
  // captured parameters from the layer, keys and values
  let keys = layer.keys;
  // fast track
  if (!keys || keys.length === 0) {
    return done();
  }
  let i = 0;
  let name;
  let paramIndex = 0;
  let key;
  let paramVal;
  let paramCallbacks;
  let paramCalled;
  // process params in order
  // param callbacks can be async
  function param(err) {
    if (err) {
      return done(err);
    }
    if (i >= keys.length) {
      return done();
    }
    paramIndex = 0;
    key = keys[i++];
    name = key.name;
    paramVal = req.params[name];
    paramCallbacks = params[name];
    paramCalled = called[name];
    if (paramVal === undefined || !paramCallbacks) {
      return param();
    }
    // param previously called with same value or error occurred
    if (
      paramCalled &&
      (paramCalled.match === paramVal ||
        paramCalled.error && paramCalled.error !== "route")
    ) {
      // restore value
      req.params[name] = paramCalled.value;
      // next param
      return param(paramCalled.error);
    }
    called[name] = paramCalled = {
      error: null,
      match: paramVal,
      value: paramVal,
    };
    paramCallback();
  }
  // single param callbacks
  function paramCallback(err) {
    let fn = paramCallbacks[paramIndex++];
    // store updated value
    paramCalled.value = req.params[key.name];
    if (err) {
      // store error
      paramCalled.error = err;
      param(err);
      return;
    }
    if (!fn) return param();
    try {
      fn(req, res, paramCallback, paramVal, key.name);
    } catch (e) {
      paramCallback(e);
    }
  }
  param();
};
/**
 * Use the given middleware function, with optional path, defaulting to "/".
 *
 * Use (like `.all`) will run for any http METHOD, but it will not add
 * handlers for those methods so OPTIONS requests will not consider `.use`
 * functions even if they could respond.
 *
 * The other difference is that _route_ path is stripped and not visible
 * to the handler function. The main effect of this feature is that mounted
 * handlers can operate without any code changes regardless of the "prefix"
 * pathname.
 *
 * @public
 */ Router.use = function use(fn) {
  let offset = 0;
  let path = "/";
  // default path to '/'
  // disambiguate router.use([fn])
  if (typeof fn !== "function") {
    let arg = fn;
    while (Array.isArray(arg) && arg.length !== 0) {
      arg = arg[0];
    }
    // first arg is the path
    if (typeof arg !== "function") {
      offset = 1;
      path = fn;
    }
  }
  let callbacks = Array.prototype.slice.call(arguments, offset).flat(1);
  if (callbacks.length === 0) {
    throw new TypeError("Router.use() requires a middleware function");
  }
  for (let i = 0; i < callbacks.length; i++) {
    let fn = callbacks[i];
    if (typeof fn !== "function") {
      throw new TypeError(
        "Router.use() requires a middleware function but got a " + gettype(fn),
      );
    }
    let layer = new Layer(path, {
      sensitive: this.caseSensitive,
      strict: false,
      end: false,
    }, fn);
    layer.route = undefined;
    this.stack.push(layer);
  }
  return this;
};
/**
 * Create a new Route for the given path.
 *
 * Each route contains a separate middleware stack and VERB handlers.
 *
 * See the Route api documentation for details on adding handlers
 * and middleware to routes.
 *
 * @param {String} path
 * @return {Route}
 * @public
 */ Router.route = function route(path) {
  let route = new Route(path);
  let layer = new Layer(path, {
    sensitive: this.caseSensitive,
    strict: this.strict,
    end: true,
  }, route.dispatch.bind(route));
  layer.route = route;
  this.stack.push(layer);
  return route;
};
// create Router#VERB functions
methods.concat("all").forEach(function (method) {
  Router[method] = function (path) {
    let route = this.route(path);
    route[method].apply(route, Array.prototype.slice.call(arguments, 1));
    return this;
  };
});
// append methods to a list of methods
function appendMethods(list, addition) {
  for (let i = 0; i < addition.length; i++) {
    let method = addition[i];
    if (list.indexOf(method) === -1) {
      list.push(method);
    }
  }
}
// Get get protocol + host for a URL
function getProtohost(url) {
  if (typeof url !== "string" || url.length === 0 || url[0] === "/") {
    return undefined;
  }
  let searchIndex = url.indexOf("?");
  let pathLength = searchIndex !== -1 ? searchIndex : url.length;
  let fqdnIndex = url.substr(0, pathLength).indexOf("://");
  return fqdnIndex !== -1
    ? url.substr(0, url.indexOf("/", 3 + fqdnIndex))
    : undefined;
}
// get type for error message
function gettype(obj) {
  let type = typeof obj;
  if (type !== "object") {
    return type;
  }
  // inspect [[Class]] for objects
  return Object.prototype.toString.call(obj).replace(objectRegExp, "$1");
}
/**
 * Match path to a layer.
 *
 * @param {Layer} layer
 * @param {string} path
 * @private
 */ function matchLayer(layer, path) {
  try {
    return layer.match(path);
  } catch (err) {
    return err;
  }
}
// merge params with parent params
function mergeParams(params, parent) {
  if (typeof parent !== "object" || !parent) {
    return params;
  }
  // make copy of parent for base
  let obj = merge({}, parent);
  // simple non-numeric merging
  if (!(0 in params) || !(0 in parent)) {
    return merge(obj, params);
  }
  let i = 0;
  let o = 0;
  // determine numeric gaps
  while (i in params) {
    i++;
  }
  while (o in parent) {
    o++;
  }
  // offset numeric indices in params before merge
  for (i--; i >= 0; i--) {
    params[i + o] = params[i];
    // create holes for the merge when necessary
    if (i < o) {
      delete params[i];
    }
  }
  return merge(obj, params);
}
// restore obj props after function
function restore(fn, obj) {
  let props = new Array(arguments.length - 2);
  let vals = new Array(arguments.length - 2);
  for (let i = 0; i < props.length; i++) {
    props[i] = arguments[i + 2];
    vals[i] = obj[props[i]];
  }
  return function () {
    // restore vals
    for (let i = 0; i < props.length; i++) {
      obj[props[i]] = vals[i];
    }
    return fn.apply(this, arguments);
  };
}
// send an OPTIONS response
function sendOptionsResponse(res, options, next) {
  try {
    let body = options.join(",");
    res.set("Allow", body);
    res.send(body);
  } catch (err) {
    next(err);
  }
}
// wrap a function
function wrap(old, fn) {
  return function proxy() {
    let args = new Array(arguments.length + 1);
    args[0] = old;
    for (let i = 0, len = arguments.length; i < len; i++) {
      args[i + 1] = arguments[i];
    }
    fn.apply(this, args);
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy9yb3V0ZXIvaW5kZXgudHM+Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHNldEltbWVkaWF0ZSB9IGZyb20gXCIuLi8uLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyBSb3V0ZSB9IGZyb20gXCIuL3JvdXRlLnRzXCI7XG5pbXBvcnQgeyBMYXllciB9IGZyb20gXCIuL2xheWVyLnRzXCI7XG5pbXBvcnQgeyBtZXJnZSB9IGZyb20gXCIuLi91dGlscy9tZXJnZS50c1wiO1xuaW1wb3J0IHsgcGFyc2VVcmwgfSBmcm9tIFwiLi4vdXRpbHMvcGFyc2VVcmwudHNcIjtcbmltcG9ydCB7IG1ldGhvZHMgfSBmcm9tIFwiLi4vbWV0aG9kcy50c1wiO1xuaW1wb3J0IHR5cGUge1xuICBOZXh0RnVuY3Rpb24sXG4gIFJlcXVlc3QsXG4gIFJlc3BvbnNlLFxuICBSb3V0ZXIgYXMgSVJvdXRlcixcbiAgUm91dGVyQ29uc3RydWN0b3IsXG59IGZyb20gXCIuLi90eXBlcy50c1wiO1xuXG5jb25zdCBvYmplY3RSZWdFeHAgPSAvXlxcW29iamVjdCAoXFxTKylcXF0kLztcbmNvbnN0IHNldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mO1xuXG4vKipcbiAqIEluaXRpYWxpemUgYSBuZXcgYFJvdXRlcmAgd2l0aCB0aGUgZ2l2ZW4gYG9wdGlvbnNgLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtSb3V0ZXJ9IHdoaWNoIGlzIGFuIGNhbGxhYmxlIGZ1bmN0aW9uXG4gKiBAcHVibGljXG4gKi9cbmV4cG9ydCBjb25zdCBSb3V0ZXI6IFJvdXRlckNvbnN0cnVjdG9yID0gZnVuY3Rpb24gKG9wdGlvbnM6IGFueSA9IHt9KTogYW55IHtcbiAgZnVuY3Rpb24gcm91dGVyKFxuICAgIHJlcTogUmVxdWVzdCxcbiAgICByZXM6IFJlc3BvbnNlLFxuICAgIG5leHQ6IE5leHRGdW5jdGlvbixcbiAgKTogdm9pZCB7XG4gICAgKHJvdXRlciBhcyBhbnkpLmhhbmRsZShyZXEsIHJlcywgbmV4dCk7XG4gIH1cblxuICBzZXRQcm90b3R5cGVPZihyb3V0ZXIsIFJvdXRlcik7XG5cbiAgcm91dGVyLnBhcmFtcyA9IHt9O1xuICByb3V0ZXIuX3BhcmFtcyA9IFtdIGFzIGFueVtdO1xuICByb3V0ZXIuY2FzZVNlbnNpdGl2ZSA9IG9wdGlvbnMuY2FzZVNlbnNpdGl2ZTtcbiAgcm91dGVyLm1lcmdlUGFyYW1zID0gb3B0aW9ucy5tZXJnZVBhcmFtcztcbiAgcm91dGVyLnN0cmljdCA9IG9wdGlvbnMuc3RyaWN0O1xuICByb3V0ZXIuc3RhY2sgPSBbXSBhcyBhbnlbXTtcblxuICByZXR1cm4gcm91dGVyIGFzIElSb3V0ZXI7XG59IGFzIGFueTtcblxuLyoqXG4gKiBNYXAgdGhlIGdpdmVuIHBhcmFtIHBsYWNlaG9sZGVyIGBuYW1lYChzKSB0byB0aGUgZ2l2ZW4gY2FsbGJhY2suXG4gKlxuICogUGFyYW1ldGVyIG1hcHBpbmcgaXMgdXNlZCB0byBwcm92aWRlIHByZS1jb25kaXRpb25zIHRvIHJvdXRlc1xuICogd2hpY2ggdXNlIG5vcm1hbGl6ZWQgcGxhY2Vob2xkZXJzLiBGb3IgZXhhbXBsZSBhIF86dXNlcl9pZF8gcGFyYW1ldGVyXG4gKiBjb3VsZCBhdXRvbWF0aWNhbGx5IGxvYWQgYSB1c2VyJ3MgaW5mb3JtYXRpb24gZnJvbSB0aGUgZGF0YWJhc2Ugd2l0aG91dFxuICogYW55IGFkZGl0aW9uYWwgY29kZSxcbiAqXG4gKiBUaGUgY2FsbGJhY2sgdXNlcyB0aGUgc2FtZSBzaWduYXR1cmUgYXMgbWlkZGxld2FyZSwgdGhlIG9ubHkgZGlmZmVyZW5jZVxuICogYmVpbmcgdGhhdCB0aGUgdmFsdWUgb2YgdGhlIHBsYWNlaG9sZGVyIGlzIHBhc3NlZCwgaW4gdGhpcyBjYXNlIHRoZSBfaWRfXG4gKiBvZiB0aGUgdXNlci4gT25jZSB0aGUgYG5leHQoKWAgZnVuY3Rpb24gaXMgaW52b2tlZCwganVzdCBsaWtlIG1pZGRsZXdhcmVcbiAqIGl0IHdpbGwgY29udGludWUgb24gdG8gZXhlY3V0ZSB0aGUgcm91dGUsIG9yIHN1YnNlcXVlbnQgcGFyYW1ldGVyIGZ1bmN0aW9ucy5cbiAqXG4gKiBKdXN0IGxpa2UgaW4gbWlkZGxld2FyZSwgeW91IG11c3QgZWl0aGVyIHJlc3BvbmQgdG8gdGhlIHJlcXVlc3Qgb3IgY2FsbCBuZXh0XG4gKiB0byBhdm9pZCBzdGFsbGluZyB0aGUgcmVxdWVzdC5cbiAqXG4gKiAgYXBwLnBhcmFtKCd1c2VyX2lkJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQsIGlkKXtcbiAqICAgIFVzZXIuZmluZChpZCwgZnVuY3Rpb24oZXJyLCB1c2VyKXtcbiAqICAgICAgaWYgKGVycikge1xuICogICAgICAgIHJldHVybiBuZXh0KGVycik7XG4gKiAgICAgIH0gZWxzZSBpZiAoIXVzZXIpIHtcbiAqICAgICAgICByZXR1cm4gbmV4dChuZXcgRXJyb3IoJ2ZhaWxlZCB0byBsb2FkIHVzZXInKSk7XG4gKiAgICAgIH1cbiAqICAgICAgcmVxLnVzZXIgPSB1c2VyO1xuICogICAgICBuZXh0KCk7XG4gKiAgICB9KTtcbiAqICB9KTtcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge2FwcH0gZm9yIGNoYWluaW5nXG4gKiBAcHVibGljXG4gKi9cblxuUm91dGVyLnBhcmFtID0gZnVuY3Rpb24gcGFyYW0obmFtZSwgZm4pIHtcbiAgLy8gYXBwbHkgcGFyYW0gZnVuY3Rpb25zXG4gIHZhciBwYXJhbXMgPSB0aGlzLl9wYXJhbXM7XG4gIHZhciBsZW4gPSBwYXJhbXMubGVuZ3RoO1xuICB2YXIgcmV0O1xuXG4gIC8vIGVuc3VyZSBwYXJhbSBgbmFtZWAgaXMgYSBzdHJpbmdcbiAgaWYgKHR5cGVvZiBuYW1lICE9PSBcInN0cmluZ1wiKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgXCJpbnZhbGlkIHBhcmFtKCkgY2FsbCBmb3IgXCIgKyBuYW1lICsgXCIsIHZhbHVlIG11c3QgYmUgYSBzdHJpbmdcIixcbiAgICApO1xuICB9XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgIGlmIChyZXQgPSBwYXJhbXNbaV0obmFtZSwgZm4pKSB7XG4gICAgICBmbiA9IHJldDtcbiAgICB9XG4gIH1cblxuICAvLyBlbnN1cmUgd2UgZW5kIHVwIHdpdGggYVxuICAvLyBtaWRkbGV3YXJlIGZ1bmN0aW9uXG4gIGlmIChcImZ1bmN0aW9uXCIgIT09IHR5cGVvZiBmbikge1xuICAgIHRocm93IG5ldyBFcnJvcihcImludmFsaWQgcGFyYW0oKSBjYWxsIGZvciBcIiArIG5hbWUgKyBcIiwgZ290IFwiICsgZm4pO1xuICB9XG5cbiAgKHRoaXMucGFyYW1zW25hbWVdID0gdGhpcy5wYXJhbXNbbmFtZV0gfHwgW10pLnB1c2goZm4pO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogRGlzcGF0Y2ggYSByZXEsIHJlcyBpbnRvIHRoZSByb3V0ZXIuXG4gKiBAcHJpdmF0ZVxuICovXG5Sb3V0ZXIuaGFuZGxlID0gZnVuY3Rpb24gaGFuZGxlKFxuICByZXE6IFJlcXVlc3QsXG4gIHJlczogUmVzcG9uc2UsXG4gIG91dDogTmV4dEZ1bmN0aW9uID0gKCkgPT4ge30sXG4pIHtcbiAgY29uc3Qgc2VsZjogYW55ID0gdGhpcztcblxuICBsZXQgaWR4ID0gMDtcbiAgbGV0IHByb3RvaG9zdCA9IGdldFByb3RvaG9zdChyZXEudXJsKSB8fCBcIlwiO1xuICBsZXQgcmVtb3ZlZCA9IFwiXCI7XG4gIGxldCBzbGFzaEFkZGVkID0gZmFsc2U7XG4gIGxldCBwYXJhbWNhbGxlZCA9IHt9O1xuXG4gIC8vIHN0b3JlIG9wdGlvbnMgZm9yIE9QVElPTlMgcmVxdWVzdFxuICAvLyBvbmx5IHVzZWQgaWYgT1BUSU9OUyByZXF1ZXN0XG4gIGxldCBvcHRpb25zOiBhbnlbXSA9IFtdO1xuXG4gIC8vIG1pZGRsZXdhcmUgYW5kIHJvdXRlc1xuICBsZXQgc3RhY2sgPSBzZWxmLnN0YWNrO1xuXG4gIC8vIG1hbmFnZSBpbnRlci1yb3V0ZXIgdmFyaWFibGVzXG4gIGxldCBwYXJlbnRQYXJhbXMgPSByZXEucGFyYW1zO1xuICBsZXQgcGFyZW50VXJsID0gcmVxLmJhc2VVcmwgfHwgXCJcIjtcbiAgbGV0IGRvbmUgPSAocmVzdG9yZSBhcyBhbnkpKG91dCwgcmVxLCBcImJhc2VVcmxcIiwgXCJuZXh0XCIsIFwicGFyYW1zXCIpO1xuXG4gIC8vIHNldHVwIG5leHQgbGF5ZXJcbiAgcmVxLm5leHQgPSBuZXh0O1xuXG4gIC8vIGZvciBvcHRpb25zIHJlcXVlc3RzLCByZXNwb25kIHdpdGggYSBkZWZhdWx0IGlmIG5vdGhpbmcgZWxzZSByZXNwb25kc1xuICBpZiAocmVxLm1ldGhvZCA9PT0gXCJPUFRJT05TXCIpIHtcbiAgICBkb25lID0gd3JhcChkb25lLCBmdW5jdGlvbiAob2xkOiBhbnksIGVycj86IGFueSk6IHZvaWQge1xuICAgICAgaWYgKGVyciB8fCBvcHRpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gb2xkKGVycik7XG4gICAgICB9XG4gICAgICBzZW5kT3B0aW9uc1Jlc3BvbnNlKHJlcywgb3B0aW9ucywgb2xkKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIHNldHVwIGJhc2ljIHJlcSB2YWx1ZXNcbiAgcmVxLmJhc2VVcmwgPSBwYXJlbnRVcmw7XG4gIHJlcS5vcmlnaW5hbFVybCA9IHJlcS5vcmlnaW5hbFVybCB8fCByZXEudXJsO1xuXG4gIG5leHQoKTtcblxuICBmdW5jdGlvbiBuZXh0KGVycj86IGFueSkge1xuICAgIGxldCBsYXllckVycm9yID0gZXJyID09PSBcInJvdXRlXCIgPyBudWxsIDogZXJyO1xuXG4gICAgLy8gcmVtb3ZlIGFkZGVkIHNsYXNoXG4gICAgaWYgKHNsYXNoQWRkZWQpIHtcbiAgICAgIHJlcS51cmwgPSByZXEudXJsLnN1YnN0cigxKTtcbiAgICAgIHNsYXNoQWRkZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyByZXN0b3JlIGFsdGVyZWQgcmVxLnVybFxuICAgIGlmIChyZW1vdmVkLmxlbmd0aCAhPT0gMCkge1xuICAgICAgcmVxLmJhc2VVcmwgPSBwYXJlbnRVcmw7XG4gICAgICByZXEudXJsID0gcHJvdG9ob3N0ICsgcmVtb3ZlZCArXG4gICAgICAgIHJlcS51cmwuc3Vic3RyKHByb3RvaG9zdC5sZW5ndGgpO1xuICAgICAgcmVtb3ZlZCA9IFwiXCI7XG4gICAgfVxuXG4gICAgLy8gc2lnbmFsIHRvIGV4aXQgcm91dGVyXG4gICAgaWYgKGxheWVyRXJyb3IgPT09IFwicm91dGVyXCIpIHtcbiAgICAgIHNldEltbWVkaWF0ZShkb25lLCBudWxsKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBubyBtb3JlIG1hdGNoaW5nIGxheWVyc1xuICAgIGlmIChpZHggPj0gc3RhY2subGVuZ3RoKSB7XG4gICAgICBzZXRJbW1lZGlhdGUoZG9uZSwgbGF5ZXJFcnJvcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gZ2V0IHBhdGhuYW1lIG9mIHJlcXVlc3RcbiAgICBsZXQgcGF0aCA9IChwYXJzZVVybChyZXEpIHx8IHt9KS5wYXRobmFtZTtcblxuICAgIGlmIChwYXRoID09IG51bGwpIHtcbiAgICAgIHJldHVybiBkb25lKGxheWVyRXJyb3IpO1xuICAgIH1cblxuICAgIC8vIGZpbmQgbmV4dCBtYXRjaGluZyBsYXllclxuICAgIGxldCBsYXllcjogYW55O1xuICAgIGxldCBtYXRjaDogYW55O1xuICAgIGxldCByb3V0ZTogYW55O1xuXG4gICAgd2hpbGUgKG1hdGNoICE9PSB0cnVlICYmIGlkeCA8IHN0YWNrLmxlbmd0aCkge1xuICAgICAgbGF5ZXIgPSBzdGFja1tpZHgrK107XG4gICAgICBtYXRjaCA9IG1hdGNoTGF5ZXIobGF5ZXIsIHBhdGgpO1xuICAgICAgcm91dGUgPSBsYXllci5yb3V0ZTtcblxuICAgICAgaWYgKHR5cGVvZiBtYXRjaCAhPT0gXCJib29sZWFuXCIpIHtcbiAgICAgICAgLy8gaG9sZCBvbiB0byBsYXllckVycm9yXG4gICAgICAgIGxheWVyRXJyb3IgPSBsYXllckVycm9yIHx8IG1hdGNoO1xuICAgICAgfVxuXG4gICAgICBpZiAobWF0Y2ggIT09IHRydWUpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmICghcm91dGUpIHtcbiAgICAgICAgLy8gcHJvY2VzcyBub24tcm91dGUgaGFuZGxlcnMgbm9ybWFsbHlcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChsYXllckVycm9yKSB7XG4gICAgICAgIC8vIHJvdXRlcyBkbyBub3QgbWF0Y2ggd2l0aCBhIHBlbmRpbmcgZXJyb3JcbiAgICAgICAgbWF0Y2ggPSBmYWxzZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGxldCBtZXRob2QgPSByZXEubWV0aG9kO1xuICAgICAgbGV0IGhhc19tZXRob2QgPSByb3V0ZS5faGFuZGxlc19tZXRob2QobWV0aG9kKTtcblxuICAgICAgLy8gYnVpbGQgdXAgYXV0b21hdGljIG9wdGlvbnMgcmVzcG9uc2VcbiAgICAgIGlmICghaGFzX21ldGhvZCAmJiBtZXRob2QgPT09IFwiT1BUSU9OU1wiKSB7XG4gICAgICAgIGFwcGVuZE1ldGhvZHMob3B0aW9ucywgcm91dGUuX29wdGlvbnMoKSk7XG4gICAgICB9XG5cbiAgICAgIC8vIGRvbid0IGV2ZW4gYm90aGVyIG1hdGNoaW5nIHJvdXRlXG4gICAgICBpZiAoIWhhc19tZXRob2QgJiYgbWV0aG9kICE9PSBcIkhFQURcIikge1xuICAgICAgICBtYXRjaCA9IGZhbHNlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBubyBtYXRjaFxuICAgIGlmIChtYXRjaCAhPT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIGRvbmUobGF5ZXJFcnJvcik7XG4gICAgfVxuXG4gICAgLy8gc3RvcmUgcm91dGUgZm9yIGRpc3BhdGNoIG9uIGNoYW5nZVxuICAgIGlmIChyb3V0ZSkge1xuICAgICAgcmVxLnJvdXRlID0gcm91dGU7XG4gICAgfVxuXG4gICAgLy8gQ2FwdHVyZSBvbmUtdGltZSBsYXllciB2YWx1ZXNcbiAgICByZXEucGFyYW1zID0gc2VsZi5tZXJnZVBhcmFtc1xuICAgICAgPyBtZXJnZVBhcmFtcyhsYXllci5wYXJhbXMsIHBhcmVudFBhcmFtcylcbiAgICAgIDogbGF5ZXIucGFyYW1zO1xuXG4gICAgbGV0IGxheWVyUGF0aCA9IGxheWVyLnBhdGg7XG5cbiAgICAvLyB0aGlzIHNob3VsZCBiZSBkb25lIGZvciB0aGUgbGF5ZXJcbiAgICBzZWxmLnByb2Nlc3NfcGFyYW1zKFxuICAgICAgbGF5ZXIsXG4gICAgICBwYXJhbWNhbGxlZCxcbiAgICAgIHJlcSxcbiAgICAgIHJlcyxcbiAgICAgIGZ1bmN0aW9uIChlcnI/OiBhbnkpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJldHVybiBuZXh0KGxheWVyRXJyb3IgfHwgZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyb3V0ZSkge1xuICAgICAgICAgIHJldHVybiBsYXllci5oYW5kbGVfcmVxdWVzdChyZXEsIHJlcywgbmV4dCk7XG4gICAgICAgIH1cblxuICAgICAgICB0cmltX3ByZWZpeChsYXllciwgbGF5ZXJFcnJvciwgbGF5ZXJQYXRoLCBwYXRoKTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRyaW1fcHJlZml4KFxuICAgIGxheWVyOiBhbnksXG4gICAgbGF5ZXJFcnJvcjogYW55LFxuICAgIGxheWVyUGF0aDogYW55LFxuICAgIHBhdGg6IGFueSxcbiAgKSB7XG4gICAgaWYgKGxheWVyUGF0aC5sZW5ndGggIT09IDApIHtcbiAgICAgIC8vIFZhbGlkYXRlIHBhdGggYnJlYWtzIG9uIGEgcGF0aCBzZXBhcmF0b3JcbiAgICAgIGxldCBjID0gcGF0aFtsYXllclBhdGgubGVuZ3RoXTtcblxuICAgICAgaWYgKGMgJiYgYyAhPT0gXCIvXCIgJiYgYyAhPT0gXCIuXCIpIHtcbiAgICAgICAgcmV0dXJuIG5leHQobGF5ZXJFcnJvcik7XG4gICAgICB9XG5cbiAgICAgIC8vIFRyaW0gb2ZmIHRoZSBwYXJ0IG9mIHRoZSB1cmwgdGhhdCBtYXRjaGVzIHRoZSByb3V0ZVxuICAgICAgLy8gbWlkZGxld2FyZSAoLnVzZSBzdHVmZikgbmVlZHMgdG8gaGF2ZSB0aGUgcGF0aCBzdHJpcHBlZFxuICAgICAgcmVtb3ZlZCA9IGxheWVyUGF0aDtcbiAgICAgIHJlcS51cmwgPSBwcm90b2hvc3QgK1xuICAgICAgICByZXEudXJsLnN1YnN0cihwcm90b2hvc3QubGVuZ3RoICsgcmVtb3ZlZC5sZW5ndGgpO1xuXG4gICAgICAvLyBFbnN1cmUgbGVhZGluZyBzbGFzaFxuICAgICAgaWYgKCFwcm90b2hvc3QgJiYgcmVxLnVybFswXSAhPT0gXCIvXCIpIHtcbiAgICAgICAgcmVxLnVybCA9IFwiL1wiICsgcmVxLnVybDtcbiAgICAgICAgc2xhc2hBZGRlZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIC8vIFNldHVwIGJhc2UgVVJMIChubyB0cmFpbGluZyBzbGFzaClcbiAgICAgIHJlcS5iYXNlVXJsID0gcGFyZW50VXJsICtcbiAgICAgICAgKHJlbW92ZWRbcmVtb3ZlZC5sZW5ndGggLSAxXSA9PT0gXCIvXCJcbiAgICAgICAgICA/IHJlbW92ZWQuc3Vic3RyaW5nKDAsIHJlbW92ZWQubGVuZ3RoIC0gMSlcbiAgICAgICAgICA6IHJlbW92ZWQpO1xuICAgIH1cblxuICAgIGlmIChsYXllckVycm9yKSB7XG4gICAgICBsYXllci5oYW5kbGVfZXJyb3IobGF5ZXJFcnJvciwgcmVxLCByZXMsIG5leHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsYXllci5oYW5kbGVfcmVxdWVzdChyZXEsIHJlcywgbmV4dCk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIFByb2Nlc3MgYW55IHBhcmFtZXRlcnMgZm9yIHRoZSBsYXllci5cbiAqIEBwcml2YXRlXG4gKi9cblJvdXRlci5wcm9jZXNzX3BhcmFtcyA9IGZ1bmN0aW9uIHByb2Nlc3NfcGFyYW1zKFxuICBsYXllcjogYW55LFxuICBjYWxsZWQ6IGFueSxcbiAgcmVxOiBSZXF1ZXN0LFxuICByZXM6IFJlc3BvbnNlLFxuICBkb25lOiBOZXh0RnVuY3Rpb24sXG4pIHtcbiAgbGV0IHBhcmFtcyA9IHRoaXMucGFyYW1zO1xuXG4gIC8vIGNhcHR1cmVkIHBhcmFtZXRlcnMgZnJvbSB0aGUgbGF5ZXIsIGtleXMgYW5kIHZhbHVlc1xuICBsZXQga2V5cyA9IGxheWVyLmtleXM7XG5cbiAgLy8gZmFzdCB0cmFja1xuICBpZiAoIWtleXMgfHwga2V5cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gZG9uZSgpO1xuICB9XG5cbiAgbGV0IGkgPSAwO1xuICBsZXQgbmFtZTtcbiAgbGV0IHBhcmFtSW5kZXggPSAwO1xuICBsZXQga2V5OiBhbnk7XG4gIGxldCBwYXJhbVZhbDogYW55O1xuICBsZXQgcGFyYW1DYWxsYmFja3M6IGFueTtcbiAgbGV0IHBhcmFtQ2FsbGVkOiBhbnk7XG5cbiAgLy8gcHJvY2VzcyBwYXJhbXMgaW4gb3JkZXJcbiAgLy8gcGFyYW0gY2FsbGJhY2tzIGNhbiBiZSBhc3luY1xuICBmdW5jdGlvbiBwYXJhbShlcnI/OiBhbnkpOiBhbnkge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHJldHVybiBkb25lKGVycik7XG4gICAgfVxuXG4gICAgaWYgKGkgPj0ga2V5cy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBkb25lKCk7XG4gICAgfVxuXG4gICAgcGFyYW1JbmRleCA9IDA7XG4gICAga2V5ID0ga2V5c1tpKytdO1xuICAgIG5hbWUgPSBrZXkubmFtZTtcbiAgICBwYXJhbVZhbCA9IHJlcS5wYXJhbXNbbmFtZV07XG4gICAgcGFyYW1DYWxsYmFja3MgPSBwYXJhbXNbbmFtZV07XG4gICAgcGFyYW1DYWxsZWQgPSBjYWxsZWRbbmFtZV07XG5cbiAgICBpZiAocGFyYW1WYWwgPT09IHVuZGVmaW5lZCB8fCAhcGFyYW1DYWxsYmFja3MpIHtcbiAgICAgIHJldHVybiBwYXJhbSgpO1xuICAgIH1cblxuICAgIC8vIHBhcmFtIHByZXZpb3VzbHkgY2FsbGVkIHdpdGggc2FtZSB2YWx1ZSBvciBlcnJvciBvY2N1cnJlZFxuICAgIGlmIChcbiAgICAgIHBhcmFtQ2FsbGVkICYmIChwYXJhbUNhbGxlZC5tYXRjaCA9PT0gcGFyYW1WYWwgfHxcbiAgICAgICAgKHBhcmFtQ2FsbGVkLmVycm9yICYmIHBhcmFtQ2FsbGVkLmVycm9yICE9PSBcInJvdXRlXCIpKVxuICAgICkge1xuICAgICAgLy8gcmVzdG9yZSB2YWx1ZVxuICAgICAgcmVxLnBhcmFtc1tuYW1lXSA9IHBhcmFtQ2FsbGVkLnZhbHVlO1xuXG4gICAgICAvLyBuZXh0IHBhcmFtXG4gICAgICByZXR1cm4gcGFyYW0ocGFyYW1DYWxsZWQuZXJyb3IpO1xuICAgIH1cblxuICAgIGNhbGxlZFtuYW1lXSA9IHBhcmFtQ2FsbGVkID0ge1xuICAgICAgZXJyb3I6IG51bGwsXG4gICAgICBtYXRjaDogcGFyYW1WYWwsXG4gICAgICB2YWx1ZTogcGFyYW1WYWwsXG4gICAgfTtcblxuICAgIHBhcmFtQ2FsbGJhY2soKTtcbiAgfVxuXG4gIC8vIHNpbmdsZSBwYXJhbSBjYWxsYmFja3NcbiAgZnVuY3Rpb24gcGFyYW1DYWxsYmFjayhlcnI/OiBhbnkpIHtcbiAgICBsZXQgZm4gPSBwYXJhbUNhbGxiYWNrc1twYXJhbUluZGV4KytdO1xuXG4gICAgLy8gc3RvcmUgdXBkYXRlZCB2YWx1ZVxuICAgIHBhcmFtQ2FsbGVkLnZhbHVlID0gcmVxLnBhcmFtc1trZXkubmFtZV07XG5cbiAgICBpZiAoZXJyKSB7XG4gICAgICAvLyBzdG9yZSBlcnJvclxuICAgICAgcGFyYW1DYWxsZWQuZXJyb3IgPSBlcnI7XG4gICAgICBwYXJhbShlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghZm4pIHJldHVybiBwYXJhbSgpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGZuKHJlcSwgcmVzLCBwYXJhbUNhbGxiYWNrLCBwYXJhbVZhbCwga2V5Lm5hbWUpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHBhcmFtQ2FsbGJhY2soZSk7XG4gICAgfVxuICB9XG5cbiAgcGFyYW0oKTtcbn07XG5cbi8qKlxuICogVXNlIHRoZSBnaXZlbiBtaWRkbGV3YXJlIGZ1bmN0aW9uLCB3aXRoIG9wdGlvbmFsIHBhdGgsIGRlZmF1bHRpbmcgdG8gXCIvXCIuXG4gKlxuICogVXNlIChsaWtlIGAuYWxsYCkgd2lsbCBydW4gZm9yIGFueSBodHRwIE1FVEhPRCwgYnV0IGl0IHdpbGwgbm90IGFkZFxuICogaGFuZGxlcnMgZm9yIHRob3NlIG1ldGhvZHMgc28gT1BUSU9OUyByZXF1ZXN0cyB3aWxsIG5vdCBjb25zaWRlciBgLnVzZWBcbiAqIGZ1bmN0aW9ucyBldmVuIGlmIHRoZXkgY291bGQgcmVzcG9uZC5cbiAqXG4gKiBUaGUgb3RoZXIgZGlmZmVyZW5jZSBpcyB0aGF0IF9yb3V0ZV8gcGF0aCBpcyBzdHJpcHBlZCBhbmQgbm90IHZpc2libGVcbiAqIHRvIHRoZSBoYW5kbGVyIGZ1bmN0aW9uLiBUaGUgbWFpbiBlZmZlY3Qgb2YgdGhpcyBmZWF0dXJlIGlzIHRoYXQgbW91bnRlZFxuICogaGFuZGxlcnMgY2FuIG9wZXJhdGUgd2l0aG91dCBhbnkgY29kZSBjaGFuZ2VzIHJlZ2FyZGxlc3Mgb2YgdGhlIFwicHJlZml4XCJcbiAqIHBhdGhuYW1lLlxuICpcbiAqIEBwdWJsaWNcbiAqL1xuUm91dGVyLnVzZSA9IGZ1bmN0aW9uIHVzZShmbjogYW55KSB7XG4gIGxldCBvZmZzZXQgPSAwO1xuICBsZXQgcGF0aCA9IFwiL1wiO1xuXG4gIC8vIGRlZmF1bHQgcGF0aCB0byAnLydcbiAgLy8gZGlzYW1iaWd1YXRlIHJvdXRlci51c2UoW2ZuXSlcbiAgaWYgKHR5cGVvZiBmbiAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgbGV0IGFyZzogYW55ID0gZm47XG5cbiAgICB3aGlsZSAoQXJyYXkuaXNBcnJheShhcmcpICYmIGFyZy5sZW5ndGggIT09IDApIHtcbiAgICAgIGFyZyA9IGFyZ1swXTtcbiAgICB9XG5cbiAgICAvLyBmaXJzdCBhcmcgaXMgdGhlIHBhdGhcbiAgICBpZiAodHlwZW9mIGFyZyAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBvZmZzZXQgPSAxO1xuICAgICAgcGF0aCA9IGZuO1xuICAgIH1cbiAgfVxuXG4gIGxldCBjYWxsYmFja3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIG9mZnNldCkuZmxhdCgxKTtcblxuICBpZiAoY2FsbGJhY2tzLmxlbmd0aCA9PT0gMCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJSb3V0ZXIudXNlKCkgcmVxdWlyZXMgYSBtaWRkbGV3YXJlIGZ1bmN0aW9uXCIpO1xuICB9XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgZm4gPSBjYWxsYmFja3NbaV07XG5cbiAgICBpZiAodHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgIFwiUm91dGVyLnVzZSgpIHJlcXVpcmVzIGEgbWlkZGxld2FyZSBmdW5jdGlvbiBidXQgZ290IGEgXCIgKyBnZXR0eXBlKGZuKSxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgbGV0IGxheWVyID0gbmV3IChMYXllciBhcyBhbnkpKHBhdGgsIHtcbiAgICAgIHNlbnNpdGl2ZTogdGhpcy5jYXNlU2Vuc2l0aXZlLFxuICAgICAgc3RyaWN0OiBmYWxzZSxcbiAgICAgIGVuZDogZmFsc2UsXG4gICAgfSwgZm4pO1xuXG4gICAgbGF5ZXIucm91dGUgPSB1bmRlZmluZWQ7XG5cbiAgICB0aGlzLnN0YWNrLnB1c2gobGF5ZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIENyZWF0ZSBhIG5ldyBSb3V0ZSBmb3IgdGhlIGdpdmVuIHBhdGguXG4gKlxuICogRWFjaCByb3V0ZSBjb250YWlucyBhIHNlcGFyYXRlIG1pZGRsZXdhcmUgc3RhY2sgYW5kIFZFUkIgaGFuZGxlcnMuXG4gKlxuICogU2VlIHRoZSBSb3V0ZSBhcGkgZG9jdW1lbnRhdGlvbiBmb3IgZGV0YWlscyBvbiBhZGRpbmcgaGFuZGxlcnNcbiAqIGFuZCBtaWRkbGV3YXJlIHRvIHJvdXRlcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICogQHJldHVybiB7Um91dGV9XG4gKiBAcHVibGljXG4gKi9cblJvdXRlci5yb3V0ZSA9IGZ1bmN0aW9uIHJvdXRlKHBhdGg6IHN0cmluZykge1xuICBsZXQgcm91dGUgPSBuZXcgUm91dGUocGF0aCk7XG5cbiAgbGV0IGxheWVyID0gbmV3IExheWVyKHBhdGgsIHtcbiAgICBzZW5zaXRpdmU6IHRoaXMuY2FzZVNlbnNpdGl2ZSxcbiAgICBzdHJpY3Q6IHRoaXMuc3RyaWN0LFxuICAgIGVuZDogdHJ1ZSxcbiAgfSwgcm91dGUuZGlzcGF0Y2guYmluZChyb3V0ZSkpO1xuXG4gIGxheWVyLnJvdXRlID0gcm91dGU7XG5cbiAgdGhpcy5zdGFjay5wdXNoKGxheWVyKTtcbiAgcmV0dXJuIHJvdXRlO1xufTtcblxuLy8gY3JlYXRlIFJvdXRlciNWRVJCIGZ1bmN0aW9uc1xubWV0aG9kcy5jb25jYXQoXCJhbGxcIikuZm9yRWFjaChmdW5jdGlvbiAobWV0aG9kKSB7XG4gIChSb3V0ZXIgYXMgYW55KVttZXRob2RdID0gZnVuY3Rpb24gKHBhdGg6IHN0cmluZykge1xuICAgIGxldCByb3V0ZSA9IHRoaXMucm91dGUocGF0aCk7XG4gICAgcm91dGVbbWV0aG9kXS5hcHBseShyb3V0ZSwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG59KTtcblxuLy8gYXBwZW5kIG1ldGhvZHMgdG8gYSBsaXN0IG9mIG1ldGhvZHNcbmZ1bmN0aW9uIGFwcGVuZE1ldGhvZHMobGlzdDogYW55LCBhZGRpdGlvbjogYW55KSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYWRkaXRpb24ubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgbWV0aG9kID0gYWRkaXRpb25baV07XG4gICAgaWYgKGxpc3QuaW5kZXhPZihtZXRob2QpID09PSAtMSkge1xuICAgICAgbGlzdC5wdXNoKG1ldGhvZCk7XG4gICAgfVxuICB9XG59XG5cbi8vIEdldCBnZXQgcHJvdG9jb2wgKyBob3N0IGZvciBhIFVSTFxuZnVuY3Rpb24gZ2V0UHJvdG9ob3N0KHVybDogc3RyaW5nKSB7XG4gIGlmICh0eXBlb2YgdXJsICE9PSBcInN0cmluZ1wiIHx8IHVybC5sZW5ndGggPT09IDAgfHwgdXJsWzBdID09PSBcIi9cIikge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBsZXQgc2VhcmNoSW5kZXggPSB1cmwuaW5kZXhPZihcIj9cIik7XG4gIGxldCBwYXRoTGVuZ3RoID0gc2VhcmNoSW5kZXggIT09IC0xID8gc2VhcmNoSW5kZXggOiB1cmwubGVuZ3RoO1xuICBsZXQgZnFkbkluZGV4ID0gdXJsLnN1YnN0cigwLCBwYXRoTGVuZ3RoKS5pbmRleE9mKFwiOi8vXCIpO1xuXG4gIHJldHVybiBmcWRuSW5kZXggIT09IC0xXG4gICAgPyB1cmwuc3Vic3RyKDAsIHVybC5pbmRleE9mKFwiL1wiLCAzICsgZnFkbkluZGV4KSlcbiAgICA6IHVuZGVmaW5lZDtcbn1cblxuLy8gZ2V0IHR5cGUgZm9yIGVycm9yIG1lc3NhZ2VcbmZ1bmN0aW9uIGdldHR5cGUob2JqOiBhbnkpIHtcbiAgbGV0IHR5cGUgPSB0eXBlb2Ygb2JqO1xuXG4gIGlmICh0eXBlICE9PSBcIm9iamVjdFwiKSB7XG4gICAgcmV0dXJuIHR5cGU7XG4gIH1cblxuICAvLyBpbnNwZWN0IFtbQ2xhc3NdXSBmb3Igb2JqZWN0c1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iailcbiAgICAucmVwbGFjZShvYmplY3RSZWdFeHAsIFwiJDFcIik7XG59XG5cbi8qKlxuICogTWF0Y2ggcGF0aCB0byBhIGxheWVyLlxuICpcbiAqIEBwYXJhbSB7TGF5ZXJ9IGxheWVyXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aFxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gbWF0Y2hMYXllcihsYXllcjogYW55LCBwYXRoOiBzdHJpbmcpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gbGF5ZXIubWF0Y2gocGF0aCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBlcnI7XG4gIH1cbn1cblxuLy8gbWVyZ2UgcGFyYW1zIHdpdGggcGFyZW50IHBhcmFtc1xuZnVuY3Rpb24gbWVyZ2VQYXJhbXMocGFyYW1zOiBhbnksIHBhcmVudDogYW55KSB7XG4gIGlmICh0eXBlb2YgcGFyZW50ICE9PSBcIm9iamVjdFwiIHx8ICFwYXJlbnQpIHtcbiAgICByZXR1cm4gcGFyYW1zO1xuICB9XG5cbiAgLy8gbWFrZSBjb3B5IG9mIHBhcmVudCBmb3IgYmFzZVxuICBsZXQgb2JqID0gbWVyZ2Uoe30sIHBhcmVudCk7XG5cbiAgLy8gc2ltcGxlIG5vbi1udW1lcmljIG1lcmdpbmdcbiAgaWYgKCEoMCBpbiBwYXJhbXMpIHx8ICEoMCBpbiBwYXJlbnQpKSB7XG4gICAgcmV0dXJuIG1lcmdlKG9iaiwgcGFyYW1zKTtcbiAgfVxuXG4gIGxldCBpID0gMDtcbiAgbGV0IG8gPSAwO1xuXG4gIC8vIGRldGVybWluZSBudW1lcmljIGdhcHNcbiAgd2hpbGUgKGkgaW4gcGFyYW1zKSB7XG4gICAgaSsrO1xuICB9XG5cbiAgd2hpbGUgKG8gaW4gcGFyZW50KSB7XG4gICAgbysrO1xuICB9XG5cbiAgLy8gb2Zmc2V0IG51bWVyaWMgaW5kaWNlcyBpbiBwYXJhbXMgYmVmb3JlIG1lcmdlXG4gIGZvciAoaS0tOyBpID49IDA7IGktLSkge1xuICAgIHBhcmFtc1tpICsgb10gPSBwYXJhbXNbaV07XG5cbiAgICAvLyBjcmVhdGUgaG9sZXMgZm9yIHRoZSBtZXJnZSB3aGVuIG5lY2Vzc2FyeVxuICAgIGlmIChpIDwgbykge1xuICAgICAgZGVsZXRlIHBhcmFtc1tpXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbWVyZ2Uob2JqLCBwYXJhbXMpO1xufVxuXG4vLyByZXN0b3JlIG9iaiBwcm9wcyBhZnRlciBmdW5jdGlvblxuZnVuY3Rpb24gcmVzdG9yZShmbjogRnVuY3Rpb24sIG9iajogYW55KSB7XG4gIGxldCBwcm9wcyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMik7XG4gIGxldCB2YWxzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAyKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgcHJvcHNbaV0gPSBhcmd1bWVudHNbaSArIDJdO1xuICAgIHZhbHNbaV0gPSBvYmpbcHJvcHNbaV1dO1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uICh0aGlzOiBhbnkpIHtcbiAgICAvLyByZXN0b3JlIHZhbHNcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmpbcHJvcHNbaV1dID0gdmFsc1tpXTtcbiAgICB9XG5cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfTtcbn1cblxuLy8gc2VuZCBhbiBPUFRJT05TIHJlc3BvbnNlXG5mdW5jdGlvbiBzZW5kT3B0aW9uc1Jlc3BvbnNlKHJlczogUmVzcG9uc2UsIG9wdGlvbnM6IGFueSwgbmV4dDogTmV4dEZ1bmN0aW9uKSB7XG4gIHRyeSB7XG4gICAgbGV0IGJvZHkgPSBvcHRpb25zLmpvaW4oXCIsXCIpO1xuICAgIHJlcy5zZXQoXCJBbGxvd1wiLCBib2R5KTtcbiAgICByZXMuc2VuZChib2R5KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgbmV4dChlcnIpO1xuICB9XG59XG5cbi8vIHdyYXAgYSBmdW5jdGlvblxuZnVuY3Rpb24gd3JhcChvbGQ6IGFueSwgZm46IGFueSkge1xuICByZXR1cm4gZnVuY3Rpb24gcHJveHkodGhpczogYW55KSB7XG4gICAgbGV0IGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCArIDEpO1xuXG4gICAgYXJnc1swXSA9IG9sZDtcbiAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBhcmdzW2kgKyAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICB9XG5cbiAgICBmbi5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FBUyxZQUFZLFNBQVEsYUFBZTtTQUNuQyxLQUFLLFNBQVEsVUFBWTtTQUN6QixLQUFLLFNBQVEsVUFBWTtTQUN6QixLQUFLLFNBQVEsaUJBQW1CO1NBQ2hDLFFBQVEsU0FBUSxvQkFBc0I7U0FDdEMsT0FBTyxTQUFRLGFBQWU7TUFTakMsWUFBWTtNQUNaLGNBQWMsR0FBRyxNQUFNLENBQUMsY0FBYztBQUU1QyxFQU1HLEFBTkg7Ozs7OztDQU1HLEFBTkgsRUFNRyxjQUNVLE1BQU0sWUFBZ0MsT0FBWTs7YUFDcEQsTUFBTSxDQUNiLEdBQVksRUFDWixHQUFhLEVBQ2IsSUFBa0I7UUFFakIsTUFBTSxDQUFTLE1BQU0sQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUk7O0lBR3ZDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsTUFBTTtJQUU3QixNQUFNLENBQUMsTUFBTTs7SUFDYixNQUFNLENBQUMsT0FBTztJQUNkLE1BQU0sQ0FBQyxhQUFhLEdBQUcsT0FBTyxDQUFDLGFBQWE7SUFDNUMsTUFBTSxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUMsV0FBVztJQUN4QyxNQUFNLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNO0lBQzlCLE1BQU0sQ0FBQyxLQUFLO1dBRUwsTUFBTTs7QUFHZixFQWdDRyxBQWhDSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FnQ0cs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
