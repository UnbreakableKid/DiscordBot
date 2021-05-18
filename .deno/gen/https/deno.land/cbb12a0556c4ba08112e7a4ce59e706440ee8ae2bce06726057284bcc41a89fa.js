import { fromFileUrl, resolve, serve, serveTLS } from "../deps.ts";
import { methods } from "./methods.ts";
import { Router } from "./router/index.ts";
import { init } from "./middleware/init.ts";
import { query } from "./middleware/query.ts";
import { requestProxy } from "./utils/requestProxy.ts";
import { finalHandler } from "./utils/finalHandler.ts";
import { compileETag } from "./utils/compileETag.ts";
import { compileQueryParser } from "./utils/compileQueryParser.ts";
import { compileTrust } from "./utils/compileTrust.ts";
import { merge } from "./utils/merge.ts";
import { View } from "./view.ts";
const create = Object.create;
const setPrototypeOf = Object.setPrototypeOf;
const slice = Array.prototype.slice;
/**
 * Variable for trust proxy inheritance
 * @private
 */ const trustProxyDefaultSymbol = "@@symbol:trust_proxy_default";
/**
 * Application prototype.
 *
 * @public
 */ export const app = {};
/**
 * Initialize the server.
 *
 *   - setup default configuration
 *   - setup default middleware
 *   - setup route reflection methods
 *
 * @private
 */ app.init = function init() {
  this.cache = {};
  this.engines = {};
  this.settings = {};
  this.defaultConfiguration();
};
/**
 * Initialize application configuration.
 * @private
 */ app.defaultConfiguration = function defaultConfiguration() {
  this.enable("x-powered-by");
  this.set("etag", "weak");
  this.set("query parser", "extended");
  this.set("subdomain offset", 2);
  this.set("trust proxy", false);
  // trust proxy inherit
  Object.defineProperty(this.settings, trustProxyDefaultSymbol, {
    configurable: true,
    value: true,
  });
  const self = this;
  this.on("mount", function onmount(parent) {
    // inherit trust proxy
    if (
      self.settings[trustProxyDefaultSymbol] === true &&
      typeof parent.settings["trust proxy fn"] === "function"
    ) {
      delete self.settings["trust proxy"];
      delete self.settings["trust proxy fn"];
    }
    // inherit prototypes
    setPrototypeOf(self.request, parent.request);
    setPrototypeOf(self.response, parent.response);
    setPrototypeOf(self.engines, parent.engines);
    setPrototypeOf(self.settings, parent.settings);
  });
  // setup locals
  this.locals = create(null);
  // top-most app is mounted at /
  this.mountpath = "/";
  // default locals
  this.locals.settings = this.settings;
  // default configuration
  this.set("view", View);
  this.set("views", resolve("views"));
  this.set("jsonp callback name", "callback");
  this.enable("view cache");
};
/**
 * Lazily adds the base router if it has not yet been added.
 *
 * We cannot add the base router in the defaultConfiguration because
 * it reads app settings which might be set after that has run.
 *
 * @private
 */ app.lazyrouter = function lazyrouter() {
  if (!this._router) {
    this._router = new Router({
      caseSensitive: this.enabled("case sensitive routing"),
      strict: this.enabled("strict routing"),
    });
    this._router.use(query(this.get("query parser fn")));
    this._router.use(init(this));
  }
};
/**
 * Dispatch a req, res pair into the application. Starts pipeline processing.
 *
 * If no callback is provided, then default error handlers will respond
 * in the event of an error bubbling through the stack.
 *
 * @private
 */ app.handle = function handle(req, res, next) {
  const router = this._router;
  req = requestProxy(req);
  next = next || finalHandler(req, res);
  if (!router) {
    return next();
  }
  router.handle(req, res, next);
};
const isPath = (thing) => typeof thing === "string" || thing instanceof RegExp;
/**
 * Proxy `Router#use()` to add middleware to the app router.
 * See Router#use() documentation for details.
 *
 * If the _fn_ parameter is an opine app, then it will be
 * mounted at the _route_ specified.
 *
 * @returns {Application} for chaining
 * @public
 */ app.use = function use(...args) {
  const firstArg = args[0];
  const [path, ...nonPathArgs] =
    (Array.isArray(firstArg) ? isPath(firstArg[0]) : isPath(firstArg))
      ? args
      : [
        "/",
        ...args,
      ];
  const fns = nonPathArgs.flat(Infinity);
  if (fns.length === 0) {
    throw new TypeError("app.use() requires a middleware function");
  }
  // setup router
  this.lazyrouter();
  const router = this._router;
  fns.forEach(function (fn) {
    // non-opine app
    if (!fn || !fn.handle || !fn.set) {
      return router.use(path, fn);
    }
    fn.mountpath = path;
    fn.parent = this;
    router.use(path, function mounted_app(req, res, next) {
      const orig = req.app;
      fn.handle(req, res, (err) => {
        setPrototypeOf(req, orig.request);
        setPrototypeOf(res, orig.response);
        next(err);
      });
    });
    // mounted an app
    fn.emit("mount", this);
  }, this);
  return this;
};
/**
 * Proxy to the app `Router#route()`
 * Returns a new `Route` instance for the _path_.
 *
 * Routes are isolated middleware stacks for specific paths.
 * See the Route api docs for details.
 *
 * @param {PathParams} prefix
 * @returns {Route}
 * @public
 */ app.route = function route(prefix) {
  this.lazyrouter();
  return this._router.route(prefix);
};
/**
 * Register the given template engine callback `fn` for the
 * provided extension `ext`.
 *
 * @param {string} ext
 * @param {Function} fn
 * @return {Application} for chaining
 * @public
 */ app.engine = function engine(ext, fn) {
  const extension = ext[0] !== "." ? `.${ext}` : ext;
  this.engines[extension] = fn;
  return this;
};
/**
 * Proxy to `Router#param()` with one added api feature. The _name_ parameter
 * can be an array of names.
 *
 * See the Router#param() docs for more details.
 *
 * @param {String|Array} name
 * @param {Function} fn
 * @return {app} for chaining
 * @public
 */ app.param = function param(name, fn) {
  this.lazyrouter();
  if (Array.isArray(name)) {
    for (var i = 0; i < name.length; i++) {
      this.param(name[i], fn);
    }
    return this;
  }
  this._router.param(name, fn);
  return this;
};
/**
 * Assign `setting` to `val`, or return `setting`'s value.
 *
 *    app.set('foo', 'bar');
 *    app.set('foo');
 *    // => "bar"
 *
 * Mounted servers inherit their parent server's settings.
 *
 * @param {string} setting
 * @param {any} value
 * @return {Application} for chaining
 * @public
 */ app.set = function set(setting, value) {
  if (arguments.length === 1) {
    // app.get(setting)
    return this.settings[setting];
  }
  this.settings[setting] = value;
  // trigger matched settings
  switch (setting) {
    case "etag":
      this.set("etag fn", compileETag(value));
      break;
    case "query parser":
      this.set("query parser fn", compileQueryParser(value));
      break;
    case "trust proxy":
      this.set("trust proxy fn", compileTrust(value));
      // trust proxy inherit
      Object.defineProperty(this.settings, trustProxyDefaultSymbol, {
        configurable: true,
        value: false,
      });
      break;
  }
  return this;
};
/**
 * Return the app's absolute pathname
 * based on the parent(s) that have
 * mounted it.
 *
 * For example if the application was
 * mounted as "/admin", which itself
 * was mounted as "/blog" then the
 * return value would be "/blog/admin".
 *
 * @return {string}
 * @private
 */ app.path = function path() {
  return this.parent ? this.parent.path() + this.mountpath : "";
};
/**
 * Check if `setting` is enabled (truthy).
 *
 *    app.enabled('foo')
 *    // => false
 *
 *    app.enable('foo')
 *    app.enabled('foo')
 *    // => true
 *
 * @param {string} setting
 * @return {boolean}
 * @public
 */ app.enabled = function enabled(setting) {
  return Boolean(this.set(setting));
};
/**
 * Check if `setting` is disabled.
 *
 *    app.disabled('foo')
 *    // => true
 *
 *    app.enable('foo')
 *    app.disabled('foo')
 *    // => false
 *
 * @param {string} setting
 * @return {boolean}
 * @public
 */ app.disabled = function disabled(setting) {
  return !this.set(setting);
};
/**
 * Enable `setting`.
 *
 * @param {string} setting
 * @return {Application} for chaining
 * @public
 */ app.enable = function enable(setting) {
  return this.set(setting, true);
};
/**
 * Disable `setting`.
 *
 * @param {string} setting
 * @return {Application} for chaining
 * @public
 */ app.disable = function disable(setting) {
  return this.set(setting, false);
};
/**
 * Delegate `.VERB(...)` calls to `router.VERB(...)`.
 */ methods.forEach((method) => {
  app[method] = function (path) {
    if (method === "get" && arguments.length === 1) {
      // app.get(setting)
      return this.set(path);
    }
    this.lazyrouter();
    const route = this._router.route(path);
    route[method].apply(route, slice.call(arguments, 1));
    return this;
  };
});
/**
 * Special-cased "all" method, applying the given route `path`,
 * middleware, and callback to _every_ HTTP method.
 *
 * @return {Application} for chaining
 * @public
 */ app.all = function all(path) {
  this.lazyrouter();
  const route = this._router.route(path);
  const args = slice.call(arguments, 1);
  for (let i = 0; i < methods.length; i++) {
    route[methods[i]].apply(route, args);
  }
  return this;
};
/**
 * Try rendering a view.
 * @private
 */ async function tryRender(view, options, callback) {
  try {
    await view.render(options, callback);
  } catch (err) {
    callback(err);
  }
}
/**
 * Render the given view `name` name with `options`
 * and a callback accepting an error and the
 * rendered template string.
 *
 * Example:
 *
 *    app.render('email', { name: 'Deno' }, function(err, html) {
 *      // ...
 *    })
 *
 * @param {string} name
 * @param {Object|Function} options or callback
 * @param {Function} callback
 * @public
 */ app.render = function render(name, options, callback = () => {
}) {
  const cache = this.cache;
  const engines = this.engines;
  const renderOptions = {};
  let done = callback;
  let view;
  name = name.startsWith("file:") ? fromFileUrl(name) : name;
  // support callback function as second arg
  if (typeof options === "function") {
    done = options;
    options = {};
  }
  // merge app.locals
  merge(renderOptions, this.locals);
  // merge options._locals
  if (options._locals) {
    merge(renderOptions, options._locals);
  }
  // merge options
  merge(renderOptions, options);
  // set .cache unless explicitly provided
  if (renderOptions.cache == null) {
    renderOptions.cache = this.enabled("view cache");
  }
  // primed cache
  if (renderOptions.cache) {
    view = cache[name];
  }
  // view
  if (!view) {
    const View = this.get("view");
    view = new View(name, {
      defaultEngine: this.get("view engine"),
      engines,
      root: this.get("views"),
    });
    if (!view.path) {
      const dirs = Array.isArray(view.root) && view.root.length > 1
        ? `directories "${view.root.slice(0, -1).join('", "')}" or "${
          view.root[view.root.length - 1]
        }"`
        : `directory "${view.root}"`;
      const err = new Error(`Failed to lookup view "${name}" in views ${dirs}`);
      err.view = view;
      return done(err);
    }
    // prime the cache
    if (renderOptions.cache) {
      cache[name] = view;
    }
  }
  // render
  tryRender(view, renderOptions, done);
};
/**
 * Listen for connections.
 *
 * @param {number|string|HTTPOptions|HTTPSOptions} options
 * @returns {Server} Configured Deno server
 * @public
 */ app.listen = function listen(options, callback) {
  if (typeof options === "undefined") {
    options = {
      port: 0,
    };
  } else if (typeof options === "number") {
    options = `:${options}`;
  }
  const isTlsOptions = typeof options !== "string" &&
    typeof options.certFile !== "undefined";
  const server = isTlsOptions ? serveTLS(options) : serve(options);
  const start = async () => {
    try {
      for await (const request of server) {
        this(request);
      }
    } catch (serverError) {
      if (server) {
        try {
          server.close();
        } catch (err) {
          // Server might have been already closed
          if (!(err instanceof Deno.errors.BadResource)) {
            throw err;
          }
        }
      }
      throw serverError;
    }
  };
  start();
  if (callback && typeof callback === "function") callback();
  return server;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC94L29waW5lQDEuMy40L3NyYy9hcHBsaWNhdGlvbi50cz4iXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgZnJvbUZpbGVVcmwsXG4gIEhUVFBPcHRpb25zLFxuICBIVFRQU09wdGlvbnMsXG4gIHJlc29sdmUsXG4gIHNlcnZlLFxuICBTZXJ2ZXIsXG4gIHNlcnZlVExTLFxufSBmcm9tIFwiLi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgbWV0aG9kcyB9IGZyb20gXCIuL21ldGhvZHMudHNcIjtcbmltcG9ydCB7IFJvdXRlciB9IGZyb20gXCIuL3JvdXRlci9pbmRleC50c1wiO1xuaW1wb3J0IHsgaW5pdCB9IGZyb20gXCIuL21pZGRsZXdhcmUvaW5pdC50c1wiO1xuaW1wb3J0IHsgcXVlcnkgfSBmcm9tIFwiLi9taWRkbGV3YXJlL3F1ZXJ5LnRzXCI7XG5pbXBvcnQgeyByZXF1ZXN0UHJveHkgfSBmcm9tIFwiLi91dGlscy9yZXF1ZXN0UHJveHkudHNcIjtcbmltcG9ydCB7IGZpbmFsSGFuZGxlciB9IGZyb20gXCIuL3V0aWxzL2ZpbmFsSGFuZGxlci50c1wiO1xuaW1wb3J0IHsgY29tcGlsZUVUYWcgfSBmcm9tIFwiLi91dGlscy9jb21waWxlRVRhZy50c1wiO1xuaW1wb3J0IHsgY29tcGlsZVF1ZXJ5UGFyc2VyIH0gZnJvbSBcIi4vdXRpbHMvY29tcGlsZVF1ZXJ5UGFyc2VyLnRzXCI7XG5pbXBvcnQgeyBjb21waWxlVHJ1c3QgfSBmcm9tIFwiLi91dGlscy9jb21waWxlVHJ1c3QudHNcIjtcbmltcG9ydCB7IG1lcmdlIH0gZnJvbSBcIi4vdXRpbHMvbWVyZ2UudHNcIjtcbmltcG9ydCB7IFZpZXcgfSBmcm9tIFwiLi92aWV3LnRzXCI7XG5pbXBvcnQgdHlwZSB7XG4gIEFwcGxpY2F0aW9uLFxuICBJUm91dGUsXG4gIE5leHRGdW5jdGlvbixcbiAgT3BpbmUsXG4gIFBhdGhQYXJhbXMsXG4gIFJlcXVlc3QsXG4gIFJlc3BvbnNlLFxufSBmcm9tIFwiLi4vc3JjL3R5cGVzLnRzXCI7XG5cbmNvbnN0IGNyZWF0ZSA9IE9iamVjdC5jcmVhdGU7XG5jb25zdCBzZXRQcm90b3R5cGVPZiA9IE9iamVjdC5zZXRQcm90b3R5cGVPZjtcbmNvbnN0IHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xuXG4vKipcbiAqIFZhcmlhYmxlIGZvciB0cnVzdCBwcm94eSBpbmhlcml0YW5jZVxuICogQHByaXZhdGVcbiAqL1xuY29uc3QgdHJ1c3RQcm94eURlZmF1bHRTeW1ib2wgPSBcIkBAc3ltYm9sOnRydXN0X3Byb3h5X2RlZmF1bHRcIjtcblxuLyoqXG4gKiBBcHBsaWNhdGlvbiBwcm90b3R5cGUuXG4gKiBcbiAqIEBwdWJsaWNcbiAqL1xuZXhwb3J0IGNvbnN0IGFwcDogQXBwbGljYXRpb24gPSB7fSBhcyBBcHBsaWNhdGlvbjtcblxuLyoqXG4gKiBJbml0aWFsaXplIHRoZSBzZXJ2ZXIuXG4gKlxuICogICAtIHNldHVwIGRlZmF1bHQgY29uZmlndXJhdGlvblxuICogICAtIHNldHVwIGRlZmF1bHQgbWlkZGxld2FyZVxuICogICAtIHNldHVwIHJvdXRlIHJlZmxlY3Rpb24gbWV0aG9kc1xuICpcbiAqIEBwcml2YXRlXG4gKi9cbmFwcC5pbml0ID0gZnVuY3Rpb24gaW5pdCgpOiB2b2lkIHtcbiAgdGhpcy5jYWNoZSA9IHt9O1xuICB0aGlzLmVuZ2luZXMgPSB7fTtcbiAgdGhpcy5zZXR0aW5ncyA9IHt9O1xuXG4gIHRoaXMuZGVmYXVsdENvbmZpZ3VyYXRpb24oKTtcbn07XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBhcHBsaWNhdGlvbiBjb25maWd1cmF0aW9uLlxuICogQHByaXZhdGVcbiAqL1xuYXBwLmRlZmF1bHRDb25maWd1cmF0aW9uID0gZnVuY3Rpb24gZGVmYXVsdENvbmZpZ3VyYXRpb24oKTogdm9pZCB7XG4gIHRoaXMuZW5hYmxlKFwieC1wb3dlcmVkLWJ5XCIpO1xuICB0aGlzLnNldChcImV0YWdcIiwgXCJ3ZWFrXCIpO1xuICB0aGlzLnNldChcInF1ZXJ5IHBhcnNlclwiLCBcImV4dGVuZGVkXCIpO1xuICB0aGlzLnNldChcInN1YmRvbWFpbiBvZmZzZXRcIiwgMik7XG4gIHRoaXMuc2V0KFwidHJ1c3QgcHJveHlcIiwgZmFsc2UpO1xuXG4gIC8vIHRydXN0IHByb3h5IGluaGVyaXRcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMuc2V0dGluZ3MsIHRydXN0UHJveHlEZWZhdWx0U3ltYm9sLCB7XG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiB0cnVlLFxuICB9KTtcblxuICBjb25zdCBzZWxmOiBPcGluZSA9IHRoaXMgYXMgT3BpbmU7XG4gIHRoaXMub24oXCJtb3VudFwiLCBmdW5jdGlvbiBvbm1vdW50KHBhcmVudDogT3BpbmUpIHtcbiAgICAvLyBpbmhlcml0IHRydXN0IHByb3h5XG4gICAgaWYgKFxuICAgICAgc2VsZi5zZXR0aW5nc1t0cnVzdFByb3h5RGVmYXVsdFN5bWJvbF0gPT09IHRydWUgJiZcbiAgICAgIHR5cGVvZiBwYXJlbnQuc2V0dGluZ3NbXCJ0cnVzdCBwcm94eSBmblwiXSA9PT0gXCJmdW5jdGlvblwiXG4gICAgKSB7XG4gICAgICBkZWxldGUgc2VsZi5zZXR0aW5nc1tcInRydXN0IHByb3h5XCJdO1xuICAgICAgZGVsZXRlIHNlbGYuc2V0dGluZ3NbXCJ0cnVzdCBwcm94eSBmblwiXTtcbiAgICB9XG5cbiAgICAvLyBpbmhlcml0IHByb3RvdHlwZXNcbiAgICBzZXRQcm90b3R5cGVPZihzZWxmLnJlcXVlc3QsIHBhcmVudC5yZXF1ZXN0KTtcbiAgICBzZXRQcm90b3R5cGVPZihzZWxmLnJlc3BvbnNlLCBwYXJlbnQucmVzcG9uc2UpO1xuICAgIHNldFByb3RvdHlwZU9mKHNlbGYuZW5naW5lcywgcGFyZW50LmVuZ2luZXMpO1xuICAgIHNldFByb3RvdHlwZU9mKHNlbGYuc2V0dGluZ3MsIHBhcmVudC5zZXR0aW5ncyk7XG4gIH0pO1xuXG4gIC8vIHNldHVwIGxvY2Fsc1xuICB0aGlzLmxvY2FscyA9IGNyZWF0ZShudWxsKTtcblxuICAvLyB0b3AtbW9zdCBhcHAgaXMgbW91bnRlZCBhdCAvXG4gIHRoaXMubW91bnRwYXRoID0gXCIvXCI7XG5cbiAgLy8gZGVmYXVsdCBsb2NhbHNcbiAgdGhpcy5sb2NhbHMuc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzO1xuXG4gIC8vIGRlZmF1bHQgY29uZmlndXJhdGlvblxuICB0aGlzLnNldChcInZpZXdcIiwgVmlldyk7XG4gIHRoaXMuc2V0KFwidmlld3NcIiwgcmVzb2x2ZShcInZpZXdzXCIpKTtcbiAgdGhpcy5zZXQoXCJqc29ucCBjYWxsYmFjayBuYW1lXCIsIFwiY2FsbGJhY2tcIik7XG4gIHRoaXMuZW5hYmxlKFwidmlldyBjYWNoZVwiKTtcbn07XG5cbi8qKlxuICogTGF6aWx5IGFkZHMgdGhlIGJhc2Ugcm91dGVyIGlmIGl0IGhhcyBub3QgeWV0IGJlZW4gYWRkZWQuXG4gKlxuICogV2UgY2Fubm90IGFkZCB0aGUgYmFzZSByb3V0ZXIgaW4gdGhlIGRlZmF1bHRDb25maWd1cmF0aW9uIGJlY2F1c2VcbiAqIGl0IHJlYWRzIGFwcCBzZXR0aW5ncyB3aGljaCBtaWdodCBiZSBzZXQgYWZ0ZXIgdGhhdCBoYXMgcnVuLlxuICpcbiAqIEBwcml2YXRlXG4gKi9cbmFwcC5sYXp5cm91dGVyID0gZnVuY3Rpb24gbGF6eXJvdXRlcigpOiB2b2lkIHtcbiAgaWYgKCF0aGlzLl9yb3V0ZXIpIHtcbiAgICB0aGlzLl9yb3V0ZXIgPSBuZXcgUm91dGVyKHtcbiAgICAgIGNhc2VTZW5zaXRpdmU6IHRoaXMuZW5hYmxlZChcImNhc2Ugc2Vuc2l0aXZlIHJvdXRpbmdcIiksXG4gICAgICBzdHJpY3Q6IHRoaXMuZW5hYmxlZChcInN0cmljdCByb3V0aW5nXCIpLFxuICAgIH0pO1xuXG4gICAgdGhpcy5fcm91dGVyLnVzZShxdWVyeSh0aGlzLmdldChcInF1ZXJ5IHBhcnNlciBmblwiKSkpO1xuICAgIHRoaXMuX3JvdXRlci51c2UoaW5pdCh0aGlzIGFzIE9waW5lKSk7XG4gIH1cbn07XG5cbi8qKlxuICogRGlzcGF0Y2ggYSByZXEsIHJlcyBwYWlyIGludG8gdGhlIGFwcGxpY2F0aW9uLiBTdGFydHMgcGlwZWxpbmUgcHJvY2Vzc2luZy5cbiAqXG4gKiBJZiBubyBjYWxsYmFjayBpcyBwcm92aWRlZCwgdGhlbiBkZWZhdWx0IGVycm9yIGhhbmRsZXJzIHdpbGwgcmVzcG9uZFxuICogaW4gdGhlIGV2ZW50IG9mIGFuIGVycm9yIGJ1YmJsaW5nIHRocm91Z2ggdGhlIHN0YWNrLlxuICpcbiAqIEBwcml2YXRlXG4gKi9cbmFwcC5oYW5kbGUgPSBmdW5jdGlvbiBoYW5kbGUoXG4gIHJlcTogUmVxdWVzdCxcbiAgcmVzOiBSZXNwb25zZSxcbiAgbmV4dDogTmV4dEZ1bmN0aW9uLFxuKTogdm9pZCB7XG4gIGNvbnN0IHJvdXRlciA9IHRoaXMuX3JvdXRlcjtcblxuICByZXEgPSByZXF1ZXN0UHJveHkocmVxKTtcblxuICBuZXh0ID0gbmV4dCB8fCBmaW5hbEhhbmRsZXIocmVxLCByZXMpO1xuXG4gIGlmICghcm91dGVyKSB7XG4gICAgcmV0dXJuIG5leHQoKTtcbiAgfVxuXG4gIHJvdXRlci5oYW5kbGUocmVxLCByZXMsIG5leHQpO1xufTtcblxuY29uc3QgaXNQYXRoID0gKHRoaW5nOiBhbnkpID0+XG4gIHR5cGVvZiB0aGluZyA9PT0gXCJzdHJpbmdcIiB8fCB0aGluZyBpbnN0YW5jZW9mIFJlZ0V4cDtcblxuLyoqXG4gKiBQcm94eSBgUm91dGVyI3VzZSgpYCB0byBhZGQgbWlkZGxld2FyZSB0byB0aGUgYXBwIHJvdXRlci5cbiAqIFNlZSBSb3V0ZXIjdXNlKCkgZG9jdW1lbnRhdGlvbiBmb3IgZGV0YWlscy5cbiAqXG4gKiBJZiB0aGUgX2ZuXyBwYXJhbWV0ZXIgaXMgYW4gb3BpbmUgYXBwLCB0aGVuIGl0IHdpbGwgYmVcbiAqIG1vdW50ZWQgYXQgdGhlIF9yb3V0ZV8gc3BlY2lmaWVkLlxuICpcbiAqIEByZXR1cm5zIHtBcHBsaWNhdGlvbn0gZm9yIGNoYWluaW5nXG4gKiBAcHVibGljXG4gKi9cbmFwcC51c2UgPSBmdW5jdGlvbiB1c2UoLi4uYXJnczogYW55W10pOiBBcHBsaWNhdGlvbiB7XG4gIGNvbnN0IGZpcnN0QXJnID0gYXJnc1swXTtcbiAgY29uc3QgW3BhdGgsIC4uLm5vblBhdGhBcmdzXSA9XG4gICAgKEFycmF5LmlzQXJyYXkoZmlyc3RBcmcpID8gaXNQYXRoKGZpcnN0QXJnWzBdKSA6IGlzUGF0aChmaXJzdEFyZykpXG4gICAgICA/IGFyZ3NcbiAgICAgIDogW1wiL1wiLCAuLi5hcmdzXTtcbiAgY29uc3QgZm5zID0gbm9uUGF0aEFyZ3MuZmxhdChJbmZpbml0eSk7XG5cbiAgaWYgKGZucy5sZW5ndGggPT09IDApIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYXBwLnVzZSgpIHJlcXVpcmVzIGEgbWlkZGxld2FyZSBmdW5jdGlvblwiKTtcbiAgfVxuXG4gIC8vIHNldHVwIHJvdXRlclxuICB0aGlzLmxhenlyb3V0ZXIoKTtcbiAgY29uc3Qgcm91dGVyID0gdGhpcy5fcm91dGVyO1xuXG4gIGZucy5mb3JFYWNoKGZ1bmN0aW9uICh0aGlzOiBBcHBsaWNhdGlvbiwgZm46IGFueSkge1xuICAgIC8vIG5vbi1vcGluZSBhcHBcbiAgICBpZiAoIWZuIHx8ICFmbi5oYW5kbGUgfHwgIWZuLnNldCkge1xuICAgICAgcmV0dXJuIHJvdXRlci51c2UocGF0aCwgZm4pO1xuICAgIH1cblxuICAgIGZuLm1vdW50cGF0aCA9IHBhdGg7XG4gICAgZm4ucGFyZW50ID0gdGhpcztcblxuICAgIHJvdXRlci51c2UoXG4gICAgICBwYXRoLFxuICAgICAgZnVuY3Rpb24gbW91bnRlZF9hcHAoXG4gICAgICAgIHJlcTogUmVxdWVzdCxcbiAgICAgICAgcmVzOiBSZXNwb25zZSxcbiAgICAgICAgbmV4dDogTmV4dEZ1bmN0aW9uLFxuICAgICAgKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IG9yaWcgPSByZXEuYXBwIGFzIE9waW5lO1xuXG4gICAgICAgIGZuLmhhbmRsZShyZXEsIHJlcywgKGVycj86IEVycm9yKSA9PiB7XG4gICAgICAgICAgc2V0UHJvdG90eXBlT2YocmVxLCBvcmlnLnJlcXVlc3QpO1xuICAgICAgICAgIHNldFByb3RvdHlwZU9mKHJlcywgb3JpZy5yZXNwb25zZSk7XG4gICAgICAgICAgbmV4dChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIC8vIG1vdW50ZWQgYW4gYXBwXG4gICAgZm4uZW1pdChcIm1vdW50XCIsIHRoaXMpO1xuICB9LCB0aGlzKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUHJveHkgdG8gdGhlIGFwcCBgUm91dGVyI3JvdXRlKClgXG4gKiBSZXR1cm5zIGEgbmV3IGBSb3V0ZWAgaW5zdGFuY2UgZm9yIHRoZSBfcGF0aF8uXG4gKlxuICogUm91dGVzIGFyZSBpc29sYXRlZCBtaWRkbGV3YXJlIHN0YWNrcyBmb3Igc3BlY2lmaWMgcGF0aHMuXG4gKiBTZWUgdGhlIFJvdXRlIGFwaSBkb2NzIGZvciBkZXRhaWxzLlxuICpcbiAqIEBwYXJhbSB7UGF0aFBhcmFtc30gcHJlZml4XG4gKiBAcmV0dXJucyB7Um91dGV9XG4gKiBAcHVibGljXG4gKi9cbmFwcC5yb3V0ZSA9IGZ1bmN0aW9uIHJvdXRlKHByZWZpeDogUGF0aFBhcmFtcyk6IElSb3V0ZSB7XG4gIHRoaXMubGF6eXJvdXRlcigpO1xuICByZXR1cm4gdGhpcy5fcm91dGVyLnJvdXRlKHByZWZpeCk7XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVyIHRoZSBnaXZlbiB0ZW1wbGF0ZSBlbmdpbmUgY2FsbGJhY2sgYGZuYCBmb3IgdGhlXG4gKiBwcm92aWRlZCBleHRlbnNpb24gYGV4dGAuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGV4dFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0FwcGxpY2F0aW9ufSBmb3IgY2hhaW5pbmdcbiAqIEBwdWJsaWNcbiAqL1xuYXBwLmVuZ2luZSA9IGZ1bmN0aW9uIGVuZ2luZShleHQ6IHN0cmluZywgZm46IEZ1bmN0aW9uKSB7XG4gIGNvbnN0IGV4dGVuc2lvbiA9IGV4dFswXSAhPT0gXCIuXCIgPyBgLiR7ZXh0fWAgOiBleHQ7XG4gIHRoaXMuZW5naW5lc1tleHRlbnNpb25dID0gZm47XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFByb3h5IHRvIGBSb3V0ZXIjcGFyYW0oKWAgd2l0aCBvbmUgYWRkZWQgYXBpIGZlYXR1cmUuIFRoZSBfbmFtZV8gcGFyYW1ldGVyXG4gKiBjYW4gYmUgYW4gYXJyYXkgb2YgbmFtZXMuXG4gKlxuICogU2VlIHRoZSBSb3V0ZXIjcGFyYW0oKSBkb2NzIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8QXJyYXl9IG5hbWVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHthcHB9IGZvciBjaGFpbmluZ1xuICogQHB1YmxpY1xuICovXG5cbmFwcC5wYXJhbSA9IGZ1bmN0aW9uIHBhcmFtKG5hbWUsIGZuKSB7XG4gIHRoaXMubGF6eXJvdXRlcigpO1xuICBpZiAoQXJyYXkuaXNBcnJheShuYW1lKSkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbmFtZS5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5wYXJhbShuYW1lW2ldLCBmbik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIHRoaXMuX3JvdXRlci5wYXJhbShuYW1lLCBmbik7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBc3NpZ24gYHNldHRpbmdgIHRvIGB2YWxgLCBvciByZXR1cm4gYHNldHRpbmdgJ3MgdmFsdWUuXG4gKlxuICogICAgYXBwLnNldCgnZm9vJywgJ2JhcicpO1xuICogICAgYXBwLnNldCgnZm9vJyk7XG4gKiAgICAvLyA9PiBcImJhclwiXG4gKlxuICogTW91bnRlZCBzZXJ2ZXJzIGluaGVyaXQgdGhlaXIgcGFyZW50IHNlcnZlcidzIHNldHRpbmdzLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzZXR0aW5nXG4gKiBAcGFyYW0ge2FueX0gdmFsdWVcbiAqIEByZXR1cm4ge0FwcGxpY2F0aW9ufSBmb3IgY2hhaW5pbmdcbiAqIEBwdWJsaWNcbiAqL1xuYXBwLnNldCA9IGZ1bmN0aW9uIHNldChzZXR0aW5nOiBzdHJpbmcsIHZhbHVlPzogYW55KTogQXBwbGljYXRpb24ge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgIC8vIGFwcC5nZXQoc2V0dGluZylcbiAgICByZXR1cm4gdGhpcy5zZXR0aW5nc1tzZXR0aW5nXTtcbiAgfVxuXG4gIHRoaXMuc2V0dGluZ3Nbc2V0dGluZ10gPSB2YWx1ZTtcblxuICAvLyB0cmlnZ2VyIG1hdGNoZWQgc2V0dGluZ3NcbiAgc3dpdGNoIChzZXR0aW5nKSB7XG4gICAgY2FzZSBcImV0YWdcIjpcbiAgICAgIHRoaXMuc2V0KFwiZXRhZyBmblwiLCBjb21waWxlRVRhZyh2YWx1ZSkpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBcInF1ZXJ5IHBhcnNlclwiOlxuICAgICAgdGhpcy5zZXQoXCJxdWVyeSBwYXJzZXIgZm5cIiwgY29tcGlsZVF1ZXJ5UGFyc2VyKHZhbHVlKSk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFwidHJ1c3QgcHJveHlcIjpcbiAgICAgIHRoaXMuc2V0KFwidHJ1c3QgcHJveHkgZm5cIiwgY29tcGlsZVRydXN0KHZhbHVlKSk7XG5cbiAgICAgIC8vIHRydXN0IHByb3h5IGluaGVyaXRcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLnNldHRpbmdzLCB0cnVzdFByb3h5RGVmYXVsdFN5bWJvbCwge1xuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiBmYWxzZSxcbiAgICAgIH0pO1xuXG4gICAgICBicmVhaztcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGFwcCdzIGFic29sdXRlIHBhdGhuYW1lXG4gKiBiYXNlZCBvbiB0aGUgcGFyZW50KHMpIHRoYXQgaGF2ZVxuICogbW91bnRlZCBpdC5cbiAqXG4gKiBGb3IgZXhhbXBsZSBpZiB0aGUgYXBwbGljYXRpb24gd2FzXG4gKiBtb3VudGVkIGFzIFwiL2FkbWluXCIsIHdoaWNoIGl0c2VsZlxuICogd2FzIG1vdW50ZWQgYXMgXCIvYmxvZ1wiIHRoZW4gdGhlXG4gKiByZXR1cm4gdmFsdWUgd291bGQgYmUgXCIvYmxvZy9hZG1pblwiLlxuICpcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqIEBwcml2YXRlXG4gKi9cbmFwcC5wYXRoID0gZnVuY3Rpb24gcGF0aCgpOiBzdHJpbmcge1xuICByZXR1cm4gdGhpcy5wYXJlbnQgPyB0aGlzLnBhcmVudC5wYXRoKCkgKyB0aGlzLm1vdW50cGF0aCA6IFwiXCI7XG59O1xuXG4vKipcbiAqIENoZWNrIGlmIGBzZXR0aW5nYCBpcyBlbmFibGVkICh0cnV0aHkpLlxuICpcbiAqICAgIGFwcC5lbmFibGVkKCdmb28nKVxuICogICAgLy8gPT4gZmFsc2VcbiAqXG4gKiAgICBhcHAuZW5hYmxlKCdmb28nKVxuICogICAgYXBwLmVuYWJsZWQoJ2ZvbycpXG4gKiAgICAvLyA9PiB0cnVlXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHNldHRpbmdcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKiBAcHVibGljXG4gKi9cbmFwcC5lbmFibGVkID0gZnVuY3Rpb24gZW5hYmxlZChzZXR0aW5nOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIEJvb2xlYW4odGhpcy5zZXQoc2V0dGluZykpO1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiBgc2V0dGluZ2AgaXMgZGlzYWJsZWQuXG4gKlxuICogICAgYXBwLmRpc2FibGVkKCdmb28nKVxuICogICAgLy8gPT4gdHJ1ZVxuICpcbiAqICAgIGFwcC5lbmFibGUoJ2ZvbycpXG4gKiAgICBhcHAuZGlzYWJsZWQoJ2ZvbycpXG4gKiAgICAvLyA9PiBmYWxzZVxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzZXR0aW5nXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICogQHB1YmxpY1xuICovXG5hcHAuZGlzYWJsZWQgPSBmdW5jdGlvbiBkaXNhYmxlZChzZXR0aW5nOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuICF0aGlzLnNldChzZXR0aW5nKTtcbn07XG5cbi8qKlxuICogRW5hYmxlIGBzZXR0aW5nYC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc2V0dGluZ1xuICogQHJldHVybiB7QXBwbGljYXRpb259IGZvciBjaGFpbmluZ1xuICogQHB1YmxpY1xuICovXG5hcHAuZW5hYmxlID0gZnVuY3Rpb24gZW5hYmxlKHNldHRpbmc6IHN0cmluZyk6IEFwcGxpY2F0aW9uIHtcbiAgcmV0dXJuIHRoaXMuc2V0KHNldHRpbmcsIHRydWUpO1xufTtcblxuLyoqXG4gKiBEaXNhYmxlIGBzZXR0aW5nYC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc2V0dGluZ1xuICogQHJldHVybiB7QXBwbGljYXRpb259IGZvciBjaGFpbmluZ1xuICogQHB1YmxpY1xuICovXG5hcHAuZGlzYWJsZSA9IGZ1bmN0aW9uIGRpc2FibGUoc2V0dGluZzogc3RyaW5nKTogQXBwbGljYXRpb24ge1xuICByZXR1cm4gdGhpcy5zZXQoc2V0dGluZywgZmFsc2UpO1xufTtcblxuLyoqXG4gKiBEZWxlZ2F0ZSBgLlZFUkIoLi4uKWAgY2FsbHMgdG8gYHJvdXRlci5WRVJCKC4uLilgLlxuICovXG5tZXRob2RzLmZvckVhY2goKG1ldGhvZDogc3RyaW5nKTogdm9pZCA9PiB7XG4gIChhcHAgYXMgYW55KVttZXRob2RdID0gZnVuY3Rpb24gKHBhdGg6IHN0cmluZyk6IEFwcGxpY2F0aW9uIHtcbiAgICBpZiAobWV0aG9kID09PSBcImdldFwiICYmIGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICAgIC8vIGFwcC5nZXQoc2V0dGluZylcbiAgICAgIHJldHVybiB0aGlzLnNldChwYXRoKTtcbiAgICB9XG5cbiAgICB0aGlzLmxhenlyb3V0ZXIoKTtcblxuICAgIGNvbnN0IHJvdXRlID0gdGhpcy5fcm91dGVyLnJvdXRlKHBhdGgpO1xuICAgIHJvdXRlW21ldGhvZF0uYXBwbHkocm91dGUsIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcbn0pO1xuXG4vKipcbiAqIFNwZWNpYWwtY2FzZWQgXCJhbGxcIiBtZXRob2QsIGFwcGx5aW5nIHRoZSBnaXZlbiByb3V0ZSBgcGF0aGAsXG4gKiBtaWRkbGV3YXJlLCBhbmQgY2FsbGJhY2sgdG8gX2V2ZXJ5XyBIVFRQIG1ldGhvZC5cbiAqXG4gKiBAcmV0dXJuIHtBcHBsaWNhdGlvbn0gZm9yIGNoYWluaW5nXG4gKiBAcHVibGljXG4gKi9cbmFwcC5hbGwgPSBmdW5jdGlvbiBhbGwocGF0aDogUGF0aFBhcmFtcyk6IEFwcGxpY2F0aW9uIHtcbiAgdGhpcy5sYXp5cm91dGVyKCk7XG5cbiAgY29uc3Qgcm91dGUgPSB0aGlzLl9yb3V0ZXIucm91dGUocGF0aCk7XG4gIGNvbnN0IGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBtZXRob2RzLmxlbmd0aDsgaSsrKSB7XG4gICAgKHJvdXRlIGFzIGFueSlbbWV0aG9kc1tpXV0uYXBwbHkocm91dGUsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFRyeSByZW5kZXJpbmcgYSB2aWV3LlxuICogQHByaXZhdGVcbiAqL1xuYXN5bmMgZnVuY3Rpb24gdHJ5UmVuZGVyKHZpZXc6IGFueSwgb3B0aW9uczogYW55LCBjYWxsYmFjazogRnVuY3Rpb24pIHtcbiAgdHJ5IHtcbiAgICBhd2FpdCB2aWV3LnJlbmRlcihvcHRpb25zLCBjYWxsYmFjayk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNhbGxiYWNrKGVycik7XG4gIH1cbn1cblxuLyoqXG4gKiBSZW5kZXIgdGhlIGdpdmVuIHZpZXcgYG5hbWVgIG5hbWUgd2l0aCBgb3B0aW9uc2BcbiAqIGFuZCBhIGNhbGxiYWNrIGFjY2VwdGluZyBhbiBlcnJvciBhbmQgdGhlXG4gKiByZW5kZXJlZCB0ZW1wbGF0ZSBzdHJpbmcuXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiAgICBhcHAucmVuZGVyKCdlbWFpbCcsIHsgbmFtZTogJ0Rlbm8nIH0sIGZ1bmN0aW9uKGVyciwgaHRtbCkge1xuICogICAgICAvLyAuLi5cbiAqICAgIH0pXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7T2JqZWN0fEZ1bmN0aW9ufSBvcHRpb25zIG9yIGNhbGxiYWNrXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHB1YmxpY1xuICovXG5hcHAucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKFxuICBuYW1lOiBzdHJpbmcsXG4gIG9wdGlvbnM6IGFueSxcbiAgY2FsbGJhY2s6IEZ1bmN0aW9uID0gKCkgPT4ge30sXG4pIHtcbiAgY29uc3QgY2FjaGUgPSB0aGlzLmNhY2hlO1xuICBjb25zdCBlbmdpbmVzID0gdGhpcy5lbmdpbmVzO1xuICBjb25zdCByZW5kZXJPcHRpb25zOiBhbnkgPSB7fTtcbiAgbGV0IGRvbmUgPSBjYWxsYmFjaztcbiAgbGV0IHZpZXc7XG5cbiAgbmFtZSA9IG5hbWUuc3RhcnRzV2l0aChcImZpbGU6XCIpID8gZnJvbUZpbGVVcmwobmFtZSkgOiBuYW1lO1xuXG4gIC8vIHN1cHBvcnQgY2FsbGJhY2sgZnVuY3Rpb24gYXMgc2Vjb25kIGFyZ1xuICBpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIGRvbmUgPSBvcHRpb25zO1xuICAgIG9wdGlvbnMgPSB7fTtcbiAgfVxuXG4gIC8vIG1lcmdlIGFwcC5sb2NhbHNcbiAgbWVyZ2UocmVuZGVyT3B0aW9ucywgdGhpcy5sb2NhbHMpO1xuXG4gIC8vIG1lcmdlIG9wdGlvbnMuX2xvY2Fsc1xuICBpZiAob3B0aW9ucy5fbG9jYWxzKSB7XG4gICAgbWVyZ2UocmVuZGVyT3B0aW9ucywgb3B0aW9ucy5fbG9jYWxzKTtcbiAgfVxuXG4gIC8vIG1lcmdlIG9wdGlvbnNcbiAgbWVyZ2UocmVuZGVyT3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgLy8gc2V0IC5jYWNoZSB1bmxlc3MgZXhwbGljaXRseSBwcm92aWRlZFxuICBpZiAocmVuZGVyT3B0aW9ucy5jYWNoZSA9PSBudWxsKSB7XG4gICAgcmVuZGVyT3B0aW9ucy5jYWNoZSA9IHRoaXMuZW5hYmxlZChcInZpZXcgY2FjaGVcIik7XG4gIH1cblxuICAvLyBwcmltZWQgY2FjaGVcbiAgaWYgKHJlbmRlck9wdGlvbnMuY2FjaGUpIHtcbiAgICB2aWV3ID0gY2FjaGVbbmFtZV07XG4gIH1cblxuICAvLyB2aWV3XG4gIGlmICghdmlldykge1xuICAgIGNvbnN0IFZpZXcgPSB0aGlzLmdldChcInZpZXdcIik7XG5cbiAgICB2aWV3ID0gbmV3IFZpZXcobmFtZSwge1xuICAgICAgZGVmYXVsdEVuZ2luZTogdGhpcy5nZXQoXCJ2aWV3IGVuZ2luZVwiKSxcbiAgICAgIGVuZ2luZXMsXG4gICAgICByb290OiB0aGlzLmdldChcInZpZXdzXCIpLFxuICAgIH0pO1xuXG4gICAgaWYgKCF2aWV3LnBhdGgpIHtcbiAgICAgIGNvbnN0IGRpcnMgPSBBcnJheS5pc0FycmF5KHZpZXcucm9vdCkgJiYgdmlldy5yb290Lmxlbmd0aCA+IDFcbiAgICAgICAgPyBgZGlyZWN0b3JpZXMgXCIke3ZpZXcucm9vdC5zbGljZSgwLCAtMSkuam9pbignXCIsIFwiJyl9XCIgb3IgXCIke1xuICAgICAgICAgIHZpZXcucm9vdFt2aWV3LnJvb3QubGVuZ3RoIC0gMV1cbiAgICAgICAgfVwiYFxuICAgICAgICA6IGBkaXJlY3RvcnkgXCIke3ZpZXcucm9vdH1cImA7XG5cbiAgICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcihcbiAgICAgICAgYEZhaWxlZCB0byBsb29rdXAgdmlldyBcIiR7bmFtZX1cIiBpbiB2aWV3cyAke2RpcnN9YCxcbiAgICAgICk7XG5cbiAgICAgIChlcnIgYXMgYW55KS52aWV3ID0gdmlldztcblxuICAgICAgcmV0dXJuIGRvbmUoZXJyKTtcbiAgICB9XG5cbiAgICAvLyBwcmltZSB0aGUgY2FjaGVcbiAgICBpZiAocmVuZGVyT3B0aW9ucy5jYWNoZSkge1xuICAgICAgY2FjaGVbbmFtZV0gPSB2aWV3O1xuICAgIH1cbiAgfVxuXG4gIC8vIHJlbmRlclxuICB0cnlSZW5kZXIodmlldywgcmVuZGVyT3B0aW9ucywgZG9uZSk7XG59O1xuXG4vKipcbiAqIExpc3RlbiBmb3IgY29ubmVjdGlvbnMuXG4gKlxuICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfEhUVFBPcHRpb25zfEhUVFBTT3B0aW9uc30gb3B0aW9uc1xuICogQHJldHVybnMge1NlcnZlcn0gQ29uZmlndXJlZCBEZW5vIHNlcnZlclxuICogQHB1YmxpY1xuICovXG5hcHAubGlzdGVuID0gZnVuY3Rpb24gbGlzdGVuKFxuICBvcHRpb25zPzogbnVtYmVyIHwgc3RyaW5nIHwgSFRUUE9wdGlvbnMgfCBIVFRQU09wdGlvbnMsXG4gIGNhbGxiYWNrPzogRnVuY3Rpb24sXG4pOiBTZXJ2ZXIge1xuICBpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBvcHRpb25zID0geyBwb3J0OiAwIH07XG4gIH0gZWxzZSBpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwibnVtYmVyXCIpIHtcbiAgICBvcHRpb25zID0gYDoke29wdGlvbnN9YDtcbiAgfVxuXG4gIGNvbnN0IGlzVGxzT3B0aW9ucyA9IHR5cGVvZiBvcHRpb25zICE9PSBcInN0cmluZ1wiICYmXG4gICAgdHlwZW9mIChvcHRpb25zIGFzIEhUVFBTT3B0aW9ucykuY2VydEZpbGUgIT09IFwidW5kZWZpbmVkXCI7XG5cbiAgY29uc3Qgc2VydmVyID0gaXNUbHNPcHRpb25zXG4gICAgPyBzZXJ2ZVRMUyhvcHRpb25zIGFzIEhUVFBTT3B0aW9ucylcbiAgICA6IHNlcnZlKG9wdGlvbnMpO1xuXG4gIGNvbnN0IHN0YXJ0ID0gYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBmb3IgYXdhaXQgKGNvbnN0IHJlcXVlc3Qgb2Ygc2VydmVyKSB7XG4gICAgICAgIHRoaXMocmVxdWVzdCBhcyBSZXF1ZXN0KTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChzZXJ2ZXJFcnJvcikge1xuICAgICAgaWYgKHNlcnZlcikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHNlcnZlci5jbG9zZSgpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAvLyBTZXJ2ZXIgbWlnaHQgaGF2ZSBiZWVuIGFscmVhZHkgY2xvc2VkXG4gICAgICAgICAgaWYgKCEoZXJyIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuQmFkUmVzb3VyY2UpKSB7XG4gICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRocm93IHNlcnZlckVycm9yO1xuICAgIH1cbiAgfTtcblxuICBzdGFydCgpO1xuXG4gIGlmIChjYWxsYmFjayAmJiB0eXBlb2YgY2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIikgY2FsbGJhY2soKTtcblxuICByZXR1cm4gc2VydmVyO1xufTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiU0FDRSxXQUFXLEVBR1gsT0FBTyxFQUNQLEtBQUssRUFFTCxRQUFRLFNBQ0gsVUFBWTtTQUNWLE9BQU8sU0FBUSxZQUFjO1NBQzdCLE1BQU0sU0FBUSxpQkFBbUI7U0FDakMsSUFBSSxTQUFRLG9CQUFzQjtTQUNsQyxLQUFLLFNBQVEscUJBQXVCO1NBQ3BDLFlBQVksU0FBUSx1QkFBeUI7U0FDN0MsWUFBWSxTQUFRLHVCQUF5QjtTQUM3QyxXQUFXLFNBQVEsc0JBQXdCO1NBQzNDLGtCQUFrQixTQUFRLDZCQUErQjtTQUN6RCxZQUFZLFNBQVEsdUJBQXlCO1NBQzdDLEtBQUssU0FBUSxnQkFBa0I7U0FDL0IsSUFBSSxTQUFRLFNBQVc7TUFXMUIsTUFBTSxHQUFH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
