// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// Copyright (c) 2019 Denolibs authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
import { validateIntegerRange } from "./_utils.ts";
import { assert } from "../_util/assert.ts";
// deno-lint-ignore no-explicit-any
function createIterResult(value, done) {
  return {
    value,
    done,
  };
}
export let defaultMaxListeners = 10;
/**
 * See also https://nodejs.org/api/events.html
 */ export class EventEmitter {
  static captureRejectionSymbol = Symbol.for("nodejs.rejection");
  static errorMonitor = Symbol("events.errorMonitor");
  static get defaultMaxListeners() {
    return defaultMaxListeners;
  }
  static set defaultMaxListeners(value) {
    defaultMaxListeners = value;
  }
  maxListeners;
  _events;
  constructor() {
    this._events = new Map();
  }
  _addListener(eventName, listener, prepend) {
    this.emit("newListener", eventName, listener);
    if (this._events.has(eventName)) {
      const listeners = this._events.get(eventName);
      if (prepend) {
        listeners.unshift(listener);
      } else {
        listeners.push(listener);
      }
    } else {
      this._events.set(eventName, [
        listener,
      ]);
    }
    const max = this.getMaxListeners();
    if (max > 0 && this.listenerCount(eventName) > max) {
      const warning = new Error(
        `Possible EventEmitter memory leak detected.\n         ${
          this.listenerCount(eventName)
        } ${eventName.toString()} listeners.\n         Use emitter.setMaxListeners() to increase limit`,
      );
      warning.name = "MaxListenersExceededWarning";
      console.warn(warning);
    }
    return this;
  }
  /** Alias for emitter.on(eventName, listener). */ addListener(
    eventName,
    listener,
  ) {
    return this._addListener(eventName, listener, false);
  }
  /**
   * Synchronously calls each of the listeners registered for the event named
   * eventName, in the order they were registered, passing the supplied
   * arguments to each.
   * @return true if the event had listeners, false otherwise
   */
  // deno-lint-ignore no-explicit-any
  emit(eventName, ...args) {
    if (this._events.has(eventName)) {
      if (
        eventName === "error" && this._events.get(EventEmitter.errorMonitor)
      ) {
        this.emit(EventEmitter.errorMonitor, ...args);
      }
      const listeners = this._events.get(eventName).slice(); // We copy with slice() so array is not mutated during emit
      for (const listener of listeners) {
        try {
          listener.apply(this, args);
        } catch (err) {
          this.emit("error", err);
        }
      }
      return true;
    } else if (eventName === "error") {
      if (this._events.get(EventEmitter.errorMonitor)) {
        this.emit(EventEmitter.errorMonitor, ...args);
      }
      const errMsg = args.length > 0 ? args[0] : Error("Unhandled error.");
      throw errMsg;
    }
    return false;
  }
  /**
   * Returns an array listing the events for which the emitter has
   * registered listeners.
   */ eventNames() {
    return Array.from(this._events.keys());
  }
  /**
   * Returns the current max listener value for the EventEmitter which is
   * either set by emitter.setMaxListeners(n) or defaults to
   * EventEmitter.defaultMaxListeners.
   */ getMaxListeners() {
    return this.maxListeners || EventEmitter.defaultMaxListeners;
  }
  /**
   * Returns the number of listeners listening to the event named
   * eventName.
   */ listenerCount(eventName) {
    if (this._events.has(eventName)) {
      return this._events.get(eventName).length;
    } else {
      return 0;
    }
  }
  static listenerCount(emitter, eventName) {
    return emitter.listenerCount(eventName);
  }
  _listeners(target, eventName, unwrap) {
    if (!target._events.has(eventName)) {
      return [];
    }
    const eventListeners = target._events.get(eventName);
    return unwrap
      ? this.unwrapListeners(eventListeners)
      : eventListeners.slice(0);
  }
  unwrapListeners(arr) {
    const unwrappedListeners = new Array(arr.length);
    for (let i = 0; i < arr.length; i++) {
      // deno-lint-ignore no-explicit-any
      unwrappedListeners[i] = arr[i]["listener"] || arr[i];
    }
    return unwrappedListeners;
  }
  /** Returns a copy of the array of listeners for the event named eventName.*/ listeners(
    eventName,
  ) {
    return this._listeners(this, eventName, true);
  }
  /**
   * Returns a copy of the array of listeners for the event named eventName,
   * including any wrappers (such as those created by .once()).
   */ rawListeners(eventName) {
    return this._listeners(this, eventName, false);
  }
  /** Alias for emitter.removeListener(). */ off(eventName, listener) {
    return this.removeListener(eventName, listener);
  }
  /**
   * Adds the listener function to the end of the listeners array for the event
   *  named eventName. No checks are made to see if the listener has already
   * been added. Multiple calls passing the same combination of eventName and
   * listener will result in the listener being added, and called, multiple
   * times.
   */ on(eventName, listener) {
    return this._addListener(eventName, listener, false);
  }
  /**
   * Adds a one-time listener function for the event named eventName. The next
   * time eventName is triggered, this listener is removed and then invoked.
   */ once(eventName, listener) {
    const wrapped = this.onceWrap(eventName, listener);
    this.on(eventName, wrapped);
    return this;
  }
  // Wrapped function that calls EventEmitter.removeListener(eventName, self) on execution.
  onceWrap(eventName, listener) {
    const wrapper = function ( // deno-lint-ignore no-explicit-any
      ...args
    ) {
      this.context.removeListener(this.eventName, this.rawListener);
      this.listener.apply(this.context, args);
    };
    const wrapperContext = {
      eventName: eventName,
      listener: listener,
      rawListener: wrapper,
      context: this,
    };
    const wrapped = wrapper.bind(wrapperContext);
    wrapperContext.rawListener = wrapped;
    wrapped.listener = listener;
    return wrapped;
  }
  /**
   * Adds the listener function to the beginning of the listeners array for the
   *  event named eventName. No checks are made to see if the listener has
   * already been added. Multiple calls passing the same combination of
   * eventName and listener will result in the listener being added, and
   * called, multiple times.
   */ prependListener(eventName, listener) {
    return this._addListener(eventName, listener, true);
  }
  /**
   * Adds a one-time listener function for the event named eventName to the
   * beginning of the listeners array. The next time eventName is triggered,
   * this listener is removed, and then invoked.
   */ prependOnceListener(eventName, listener) {
    const wrapped = this.onceWrap(eventName, listener);
    this.prependListener(eventName, wrapped);
    return this;
  }
  /** Removes all listeners, or those of the specified eventName. */ removeAllListeners(
    eventName,
  ) {
    if (this._events === undefined) {
      return this;
    }
    if (eventName) {
      if (this._events.has(eventName)) {
        const listeners = this._events.get(eventName).slice(); // Create a copy; We use it AFTER it's deleted.
        this._events.delete(eventName);
        for (const listener of listeners) {
          this.emit("removeListener", eventName, listener);
        }
      }
    } else {
      const eventList = this.eventNames();
      eventList.map((value) => {
        this.removeAllListeners(value);
      });
    }
    return this;
  }
  /**
   * Removes the specified listener from the listener array for the event
   * named eventName.
   */ removeListener(eventName, listener) {
    if (this._events.has(eventName)) {
      const arr = this._events.get(eventName);
      assert(arr);
      let listenerIndex = -1;
      for (let i = arr.length - 1; i >= 0; i--) {
        // arr[i]["listener"] is the reference to the listener inside a bound 'once' wrapper
        if (arr[i] == listener || arr[i] && arr[i]["listener"] == listener) {
          listenerIndex = i;
          break;
        }
      }
      if (listenerIndex >= 0) {
        arr.splice(listenerIndex, 1);
        this.emit("removeListener", eventName, listener);
        if (arr.length === 0) {
          this._events.delete(eventName);
        }
      }
    }
    return this;
  }
  /**
   * By default EventEmitters will print a warning if more than 10 listeners
   * are added for a particular event. This is a useful default that helps
   * finding memory leaks. Obviously, not all events should be limited to just
   * 10 listeners. The emitter.setMaxListeners() method allows the limit to be
   * modified for this specific EventEmitter instance. The value can be set to
   * Infinity (or 0) to indicate an unlimited number of listeners.
   */ setMaxListeners(n) {
    if (n !== Infinity) {
      if (n === 0) {
        n = Infinity;
      } else {
        validateIntegerRange(n, "maxListeners", 0);
      }
    }
    this.maxListeners = n;
    return this;
  }
  /**
   * Creates a Promise that is fulfilled when the EventEmitter emits the given
   * event or that is rejected when the EventEmitter emits 'error'. The Promise
   * will resolve with an array of all the arguments emitted to the given event.
   */ static once(emitter, name) {
    return new Promise((resolve, reject) => {
      if (emitter instanceof EventTarget) {
        // EventTarget does not have `error` event semantics like Node
        // EventEmitters, we do not listen to `error` events here.
        emitter.addEventListener(name, (...args) => {
          resolve(args);
        }, {
          once: true,
          passive: false,
          capture: false,
        });
        return;
      } else if (emitter instanceof EventEmitter) {
        // deno-lint-ignore no-explicit-any
        const eventListener = (...args) => {
          if (errorListener !== undefined) {
            emitter.removeListener("error", errorListener);
          }
          resolve(args);
        };
        let errorListener;
        // Adding an error listener is not optional because
        // if an error is thrown on an event emitter we cannot
        // guarantee that the actual event we are waiting will
        // be fired. The result could be a silent way to create
        // memory or file descriptor leaks, which is something
        // we should avoid.
        if (name !== "error") {
          // deno-lint-ignore no-explicit-any
          errorListener = (err) => {
            emitter.removeListener(name, eventListener);
            reject(err);
          };
          emitter.once("error", errorListener);
        }
        emitter.once(name, eventListener);
        return;
      }
    });
  }
  /**
   * Returns an AsyncIterator that iterates eventName events. It will throw if
   * the EventEmitter emits 'error'. It removes all listeners when exiting the
   * loop. The value returned by each iteration is an array composed of the
   * emitted event arguments.
   */ static on(emitter, event) {
    // deno-lint-ignore no-explicit-any
    const unconsumedEventValues = [];
    // deno-lint-ignore no-explicit-any
    const unconsumedPromises = [];
    let error = null;
    let finished = false;
    const iterator = {
      // deno-lint-ignore no-explicit-any
      next() {
        // First, we consume all unread events
        // deno-lint-ignore no-explicit-any
        const value = unconsumedEventValues.shift();
        if (value) {
          return Promise.resolve(createIterResult(value, false));
        }
        // Then we error, if an error happened
        // This happens one time if at all, because after 'error'
        // we stop listening
        if (error) {
          const p = Promise.reject(error);
          // Only the first element errors
          error = null;
          return p;
        }
        // If the iterator is finished, resolve to done
        if (finished) {
          return Promise.resolve(createIterResult(undefined, true));
        }
        // Wait until an event happens
        return new Promise(function (resolve, reject) {
          unconsumedPromises.push({
            resolve,
            reject,
          });
        });
      },
      // deno-lint-ignore no-explicit-any
      return() {
        emitter.removeListener(event, eventHandler);
        emitter.removeListener("error", errorHandler);
        finished = true;
        for (const promise of unconsumedPromises) {
          promise.resolve(createIterResult(undefined, true));
        }
        return Promise.resolve(createIterResult(undefined, true));
      },
      throw(err) {
        error = err;
        emitter.removeListener(event, eventHandler);
        emitter.removeListener("error", errorHandler);
      },
      // deno-lint-ignore no-explicit-any
      [Symbol.asyncIterator]() {
        return this;
      },
    };
    emitter.on(event, eventHandler);
    emitter.on("error", errorHandler);
    return iterator;
    // deno-lint-ignore no-explicit-any
    function eventHandler(...args) {
      const promise = unconsumedPromises.shift();
      if (promise) {
        promise.resolve(createIterResult(args, false));
      } else {
        unconsumedEventValues.push(args);
      }
    }
    // deno-lint-ignore no-explicit-any
    function errorHandler(err) {
      finished = true;
      const toError = unconsumedPromises.shift();
      if (toError) {
        toError.reject(err);
      } else {
        // The next time we call next()
        error = err;
      }
      iterator.return();
    }
  }
}
export default Object.assign(EventEmitter, {
  EventEmitter,
});
export const captureRejectionSymbol = EventEmitter.captureRejectionSymbol;
export const errorMonitor = EventEmitter.errorMonitor;
export const listenerCount = EventEmitter.listenerCount;
export const on = EventEmitter.on;
export const once = EventEmitter.once;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45NS4wL25vZGUvZXZlbnRzLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gQ29weXJpZ2h0IChjKSAyMDE5IERlbm9saWJzIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCB7IHZhbGlkYXRlSW50ZWdlclJhbmdlIH0gZnJvbSBcIi4vX3V0aWxzLnRzXCI7XG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiLi4vX3V0aWwvYXNzZXJ0LnRzXCI7XG5cbi8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG5leHBvcnQgdHlwZSBHZW5lcmljRnVuY3Rpb24gPSAoLi4uYXJnczogYW55W10pID0+IGFueTtcblxuZXhwb3J0IGludGVyZmFjZSBXcmFwcGVkRnVuY3Rpb24gZXh0ZW5kcyBGdW5jdGlvbiB7XG4gIGxpc3RlbmVyOiBHZW5lcmljRnVuY3Rpb247XG59XG5cbi8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG5mdW5jdGlvbiBjcmVhdGVJdGVyUmVzdWx0KHZhbHVlOiBhbnksIGRvbmU6IGJvb2xlYW4pOiBJdGVyYXRvclJlc3VsdDxhbnk+IHtcbiAgcmV0dXJuIHsgdmFsdWUsIGRvbmUgfTtcbn1cblxuaW50ZXJmYWNlIEFzeW5jSXRlcmFibGUge1xuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBuZXh0KCk6IFByb21pc2U8SXRlcmF0b3JSZXN1bHQ8YW55LCBhbnk+PjtcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgcmV0dXJuKCk6IFByb21pc2U8SXRlcmF0b3JSZXN1bHQ8YW55LCBhbnk+PjtcbiAgdGhyb3coZXJyOiBFcnJvcik6IHZvaWQ7XG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIFtTeW1ib2wuYXN5bmNJdGVyYXRvcl0oKTogYW55O1xufVxuXG5leHBvcnQgbGV0IGRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLyoqXG4gKiBTZWUgYWxzbyBodHRwczovL25vZGVqcy5vcmcvYXBpL2V2ZW50cy5odG1sXG4gKi9cbmV4cG9ydCBjbGFzcyBFdmVudEVtaXR0ZXIge1xuICBwdWJsaWMgc3RhdGljIGNhcHR1cmVSZWplY3Rpb25TeW1ib2wgPSBTeW1ib2wuZm9yKFwibm9kZWpzLnJlamVjdGlvblwiKTtcbiAgcHVibGljIHN0YXRpYyBlcnJvck1vbml0b3IgPSBTeW1ib2woXCJldmVudHMuZXJyb3JNb25pdG9yXCIpO1xuICBwdWJsaWMgc3RhdGljIGdldCBkZWZhdWx0TWF4TGlzdGVuZXJzKCkge1xuICAgIHJldHVybiBkZWZhdWx0TWF4TGlzdGVuZXJzO1xuICB9XG4gIHB1YmxpYyBzdGF0aWMgc2V0IGRlZmF1bHRNYXhMaXN0ZW5lcnModmFsdWU6IG51bWJlcikge1xuICAgIGRlZmF1bHRNYXhMaXN0ZW5lcnMgPSB2YWx1ZTtcbiAgfVxuXG4gIHByaXZhdGUgbWF4TGlzdGVuZXJzOiBudW1iZXIgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgX2V2ZW50czogTWFwPFxuICAgIHN0cmluZyB8IHN5bWJvbCxcbiAgICBBcnJheTxHZW5lcmljRnVuY3Rpb24gfCBXcmFwcGVkRnVuY3Rpb24+XG4gID47XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX2V2ZW50cyA9IG5ldyBNYXAoKTtcbiAgfVxuXG4gIHByaXZhdGUgX2FkZExpc3RlbmVyKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sLFxuICAgIGxpc3RlbmVyOiBHZW5lcmljRnVuY3Rpb24gfCBXcmFwcGVkRnVuY3Rpb24sXG4gICAgcHJlcGVuZDogYm9vbGVhbixcbiAgKTogdGhpcyB7XG4gICAgdGhpcy5lbWl0KFwibmV3TGlzdGVuZXJcIiwgZXZlbnROYW1lLCBsaXN0ZW5lcik7XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5oYXMoZXZlbnROYW1lKSkge1xuICAgICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzLmdldChldmVudE5hbWUpIGFzIEFycmF5PFxuICAgICAgICBHZW5lcmljRnVuY3Rpb24gfCBXcmFwcGVkRnVuY3Rpb25cbiAgICAgID47XG4gICAgICBpZiAocHJlcGVuZCkge1xuICAgICAgICBsaXN0ZW5lcnMudW5zaGlmdChsaXN0ZW5lcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsaXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2V2ZW50cy5zZXQoZXZlbnROYW1lLCBbbGlzdGVuZXJdKTtcbiAgICB9XG4gICAgY29uc3QgbWF4ID0gdGhpcy5nZXRNYXhMaXN0ZW5lcnMoKTtcbiAgICBpZiAobWF4ID4gMCAmJiB0aGlzLmxpc3RlbmVyQ291bnQoZXZlbnROYW1lKSA+IG1heCkge1xuICAgICAgY29uc3Qgd2FybmluZyA9IG5ldyBFcnJvcihcbiAgICAgICAgYFBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgbGVhayBkZXRlY3RlZC5cbiAgICAgICAgICR7dGhpcy5saXN0ZW5lckNvdW50KGV2ZW50TmFtZSl9ICR7ZXZlbnROYW1lLnRvU3RyaW5nKCl9IGxpc3RlbmVycy5cbiAgICAgICAgIFVzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0YCxcbiAgICAgICk7XG4gICAgICB3YXJuaW5nLm5hbWUgPSBcIk1heExpc3RlbmVyc0V4Y2VlZGVkV2FybmluZ1wiO1xuICAgICAgY29uc29sZS53YXJuKHdhcm5pbmcpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIEFsaWFzIGZvciBlbWl0dGVyLm9uKGV2ZW50TmFtZSwgbGlzdGVuZXIpLiAqL1xuICBwdWJsaWMgYWRkTGlzdGVuZXIoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXG4gICAgbGlzdGVuZXI6IEdlbmVyaWNGdW5jdGlvbiB8IFdyYXBwZWRGdW5jdGlvbixcbiAgKTogdGhpcyB7XG4gICAgcmV0dXJuIHRoaXMuX2FkZExpc3RlbmVyKGV2ZW50TmFtZSwgbGlzdGVuZXIsIGZhbHNlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTeW5jaHJvbm91c2x5IGNhbGxzIGVhY2ggb2YgdGhlIGxpc3RlbmVycyByZWdpc3RlcmVkIGZvciB0aGUgZXZlbnQgbmFtZWRcbiAgICogZXZlbnROYW1lLCBpbiB0aGUgb3JkZXIgdGhleSB3ZXJlIHJlZ2lzdGVyZWQsIHBhc3NpbmcgdGhlIHN1cHBsaWVkXG4gICAqIGFyZ3VtZW50cyB0byBlYWNoLlxuICAgKiBAcmV0dXJuIHRydWUgaWYgdGhlIGV2ZW50IGhhZCBsaXN0ZW5lcnMsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgcHVibGljIGVtaXQoZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsIC4uLmFyZ3M6IGFueVtdKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5oYXMoZXZlbnROYW1lKSkge1xuICAgICAgaWYgKFxuICAgICAgICBldmVudE5hbWUgPT09IFwiZXJyb3JcIiAmJlxuICAgICAgICB0aGlzLl9ldmVudHMuZ2V0KEV2ZW50RW1pdHRlci5lcnJvck1vbml0b3IpXG4gICAgICApIHtcbiAgICAgICAgdGhpcy5lbWl0KEV2ZW50RW1pdHRlci5lcnJvck1vbml0b3IsIC4uLmFyZ3MpO1xuICAgICAgfVxuICAgICAgY29uc3QgbGlzdGVuZXJzID0gKHRoaXMuX2V2ZW50cy5nZXQoXG4gICAgICAgIGV2ZW50TmFtZSxcbiAgICAgICkgYXMgR2VuZXJpY0Z1bmN0aW9uW10pLnNsaWNlKCk7IC8vIFdlIGNvcHkgd2l0aCBzbGljZSgpIHNvIGFycmF5IGlzIG5vdCBtdXRhdGVkIGR1cmluZyBlbWl0XG4gICAgICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIGxpc3RlbmVycykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICB0aGlzLmVtaXQoXCJlcnJvclwiLCBlcnIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKGV2ZW50TmFtZSA9PT0gXCJlcnJvclwiKSB7XG4gICAgICBpZiAodGhpcy5fZXZlbnRzLmdldChFdmVudEVtaXR0ZXIuZXJyb3JNb25pdG9yKSkge1xuICAgICAgICB0aGlzLmVtaXQoRXZlbnRFbWl0dGVyLmVycm9yTW9uaXRvciwgLi4uYXJncyk7XG4gICAgICB9XG4gICAgICBjb25zdCBlcnJNc2cgPSBhcmdzLmxlbmd0aCA+IDAgPyBhcmdzWzBdIDogRXJyb3IoXCJVbmhhbmRsZWQgZXJyb3IuXCIpO1xuICAgICAgdGhyb3cgZXJyTXNnO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBhcnJheSBsaXN0aW5nIHRoZSBldmVudHMgZm9yIHdoaWNoIHRoZSBlbWl0dGVyIGhhc1xuICAgKiByZWdpc3RlcmVkIGxpc3RlbmVycy5cbiAgICovXG4gIHB1YmxpYyBldmVudE5hbWVzKCk6IFtzdHJpbmcgfCBzeW1ib2xdIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLl9ldmVudHMua2V5cygpKSBhcyBbc3RyaW5nIHwgc3ltYm9sXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IG1heCBsaXN0ZW5lciB2YWx1ZSBmb3IgdGhlIEV2ZW50RW1pdHRlciB3aGljaCBpc1xuICAgKiBlaXRoZXIgc2V0IGJ5IGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKG4pIG9yIGRlZmF1bHRzIHRvXG4gICAqIEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzLlxuICAgKi9cbiAgcHVibGljIGdldE1heExpc3RlbmVycygpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLm1heExpc3RlbmVycyB8fCBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBudW1iZXIgb2YgbGlzdGVuZXJzIGxpc3RlbmluZyB0byB0aGUgZXZlbnQgbmFtZWRcbiAgICogZXZlbnROYW1lLlxuICAgKi9cbiAgcHVibGljIGxpc3RlbmVyQ291bnQoZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wpOiBudW1iZXIge1xuICAgIGlmICh0aGlzLl9ldmVudHMuaGFzKGV2ZW50TmFtZSkpIHtcbiAgICAgIHJldHVybiAodGhpcy5fZXZlbnRzLmdldChldmVudE5hbWUpIGFzIEdlbmVyaWNGdW5jdGlvbltdKS5sZW5ndGg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBsaXN0ZW5lckNvdW50KFxuICAgIGVtaXR0ZXI6IEV2ZW50RW1pdHRlcixcbiAgICBldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbCxcbiAgKTogbnVtYmVyIHtcbiAgICByZXR1cm4gZW1pdHRlci5saXN0ZW5lckNvdW50KGV2ZW50TmFtZSk7XG4gIH1cblxuICBwcml2YXRlIF9saXN0ZW5lcnMoXG4gICAgdGFyZ2V0OiBFdmVudEVtaXR0ZXIsXG4gICAgZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXG4gICAgdW53cmFwOiBib29sZWFuLFxuICApOiBHZW5lcmljRnVuY3Rpb25bXSB7XG4gICAgaWYgKCF0YXJnZXQuX2V2ZW50cy5oYXMoZXZlbnROYW1lKSkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBjb25zdCBldmVudExpc3RlbmVycyA9IHRhcmdldC5fZXZlbnRzLmdldChldmVudE5hbWUpIGFzIEdlbmVyaWNGdW5jdGlvbltdO1xuXG4gICAgcmV0dXJuIHVud3JhcFxuICAgICAgPyB0aGlzLnVud3JhcExpc3RlbmVycyhldmVudExpc3RlbmVycylcbiAgICAgIDogZXZlbnRMaXN0ZW5lcnMuc2xpY2UoMCk7XG4gIH1cblxuICBwcml2YXRlIHVud3JhcExpc3RlbmVycyhhcnI6IEdlbmVyaWNGdW5jdGlvbltdKTogR2VuZXJpY0Z1bmN0aW9uW10ge1xuICAgIGNvbnN0IHVud3JhcHBlZExpc3RlbmVycyA9IG5ldyBBcnJheShhcnIubGVuZ3RoKSBhcyBHZW5lcmljRnVuY3Rpb25bXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICAgIHVud3JhcHBlZExpc3RlbmVyc1tpXSA9IChhcnJbaV0gYXMgYW55KVtcImxpc3RlbmVyXCJdIHx8IGFycltpXTtcbiAgICB9XG4gICAgcmV0dXJuIHVud3JhcHBlZExpc3RlbmVycztcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIGEgY29weSBvZiB0aGUgYXJyYXkgb2YgbGlzdGVuZXJzIGZvciB0aGUgZXZlbnQgbmFtZWQgZXZlbnROYW1lLiovXG4gIHB1YmxpYyBsaXN0ZW5lcnMoZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wpOiBHZW5lcmljRnVuY3Rpb25bXSB7XG4gICAgcmV0dXJuIHRoaXMuX2xpc3RlbmVycyh0aGlzLCBldmVudE5hbWUsIHRydWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBjb3B5IG9mIHRoZSBhcnJheSBvZiBsaXN0ZW5lcnMgZm9yIHRoZSBldmVudCBuYW1lZCBldmVudE5hbWUsXG4gICAqIGluY2x1ZGluZyBhbnkgd3JhcHBlcnMgKHN1Y2ggYXMgdGhvc2UgY3JlYXRlZCBieSAub25jZSgpKS5cbiAgICovXG4gIHB1YmxpYyByYXdMaXN0ZW5lcnMoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXG4gICk6IEFycmF5PEdlbmVyaWNGdW5jdGlvbiB8IFdyYXBwZWRGdW5jdGlvbj4ge1xuICAgIHJldHVybiB0aGlzLl9saXN0ZW5lcnModGhpcywgZXZlbnROYW1lLCBmYWxzZSk7XG4gIH1cblxuICAvKiogQWxpYXMgZm9yIGVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoKS4gKi9cbiAgcHVibGljIG9mZihldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbCwgbGlzdGVuZXI6IEdlbmVyaWNGdW5jdGlvbik6IHRoaXMge1xuICAgIHJldHVybiB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50TmFtZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGhlIGxpc3RlbmVyIGZ1bmN0aW9uIHRvIHRoZSBlbmQgb2YgdGhlIGxpc3RlbmVycyBhcnJheSBmb3IgdGhlIGV2ZW50XG4gICAqICBuYW1lZCBldmVudE5hbWUuIE5vIGNoZWNrcyBhcmUgbWFkZSB0byBzZWUgaWYgdGhlIGxpc3RlbmVyIGhhcyBhbHJlYWR5XG4gICAqIGJlZW4gYWRkZWQuIE11bHRpcGxlIGNhbGxzIHBhc3NpbmcgdGhlIHNhbWUgY29tYmluYXRpb24gb2YgZXZlbnROYW1lIGFuZFxuICAgKiBsaXN0ZW5lciB3aWxsIHJlc3VsdCBpbiB0aGUgbGlzdGVuZXIgYmVpbmcgYWRkZWQsIGFuZCBjYWxsZWQsIG11bHRpcGxlXG4gICAqIHRpbWVzLlxuICAgKi9cbiAgcHVibGljIG9uKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sLFxuICAgIGxpc3RlbmVyOiBHZW5lcmljRnVuY3Rpb24gfCBXcmFwcGVkRnVuY3Rpb24sXG4gICk6IHRoaXMge1xuICAgIHJldHVybiB0aGlzLl9hZGRMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyLCBmYWxzZSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIG9uZS10aW1lIGxpc3RlbmVyIGZ1bmN0aW9uIGZvciB0aGUgZXZlbnQgbmFtZWQgZXZlbnROYW1lLiBUaGUgbmV4dFxuICAgKiB0aW1lIGV2ZW50TmFtZSBpcyB0cmlnZ2VyZWQsIHRoaXMgbGlzdGVuZXIgaXMgcmVtb3ZlZCBhbmQgdGhlbiBpbnZva2VkLlxuICAgKi9cbiAgcHVibGljIG9uY2UoZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsIGxpc3RlbmVyOiBHZW5lcmljRnVuY3Rpb24pOiB0aGlzIHtcbiAgICBjb25zdCB3cmFwcGVkOiBXcmFwcGVkRnVuY3Rpb24gPSB0aGlzLm9uY2VXcmFwKGV2ZW50TmFtZSwgbGlzdGVuZXIpO1xuICAgIHRoaXMub24oZXZlbnROYW1lLCB3cmFwcGVkKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIFdyYXBwZWQgZnVuY3Rpb24gdGhhdCBjYWxscyBFdmVudEVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoZXZlbnROYW1lLCBzZWxmKSBvbiBleGVjdXRpb24uXG4gIHByaXZhdGUgb25jZVdyYXAoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXG4gICAgbGlzdGVuZXI6IEdlbmVyaWNGdW5jdGlvbixcbiAgKTogV3JhcHBlZEZ1bmN0aW9uIHtcbiAgICBjb25zdCB3cmFwcGVyID0gZnVuY3Rpb24gKFxuICAgICAgdGhpczoge1xuICAgICAgICBldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbDtcbiAgICAgICAgbGlzdGVuZXI6IEdlbmVyaWNGdW5jdGlvbjtcbiAgICAgICAgcmF3TGlzdGVuZXI6IEdlbmVyaWNGdW5jdGlvbiB8IFdyYXBwZWRGdW5jdGlvbjtcbiAgICAgICAgY29udGV4dDogRXZlbnRFbWl0dGVyO1xuICAgICAgfSxcbiAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgICAuLi5hcmdzOiBhbnlbXVxuICAgICk6IHZvaWQge1xuICAgICAgdGhpcy5jb250ZXh0LnJlbW92ZUxpc3RlbmVyKFxuICAgICAgICB0aGlzLmV2ZW50TmFtZSxcbiAgICAgICAgdGhpcy5yYXdMaXN0ZW5lciBhcyBHZW5lcmljRnVuY3Rpb24sXG4gICAgICApO1xuICAgICAgdGhpcy5saXN0ZW5lci5hcHBseSh0aGlzLmNvbnRleHQsIGFyZ3MpO1xuICAgIH07XG4gICAgY29uc3Qgd3JhcHBlckNvbnRleHQgPSB7XG4gICAgICBldmVudE5hbWU6IGV2ZW50TmFtZSxcbiAgICAgIGxpc3RlbmVyOiBsaXN0ZW5lcixcbiAgICAgIHJhd0xpc3RlbmVyOiAod3JhcHBlciBhcyB1bmtub3duKSBhcyBXcmFwcGVkRnVuY3Rpb24sXG4gICAgICBjb250ZXh0OiB0aGlzLFxuICAgIH07XG4gICAgY29uc3Qgd3JhcHBlZCA9ICh3cmFwcGVyLmJpbmQoXG4gICAgICB3cmFwcGVyQ29udGV4dCxcbiAgICApIGFzIHVua25vd24pIGFzIFdyYXBwZWRGdW5jdGlvbjtcbiAgICB3cmFwcGVyQ29udGV4dC5yYXdMaXN0ZW5lciA9IHdyYXBwZWQ7XG4gICAgd3JhcHBlZC5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICAgIHJldHVybiB3cmFwcGVkIGFzIFdyYXBwZWRGdW5jdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoZSBsaXN0ZW5lciBmdW5jdGlvbiB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZSBsaXN0ZW5lcnMgYXJyYXkgZm9yIHRoZVxuICAgKiAgZXZlbnQgbmFtZWQgZXZlbnROYW1lLiBObyBjaGVja3MgYXJlIG1hZGUgdG8gc2VlIGlmIHRoZSBsaXN0ZW5lciBoYXNcbiAgICogYWxyZWFkeSBiZWVuIGFkZGVkLiBNdWx0aXBsZSBjYWxscyBwYXNzaW5nIHRoZSBzYW1lIGNvbWJpbmF0aW9uIG9mXG4gICAqIGV2ZW50TmFtZSBhbmQgbGlzdGVuZXIgd2lsbCByZXN1bHQgaW4gdGhlIGxpc3RlbmVyIGJlaW5nIGFkZGVkLCBhbmRcbiAgICogY2FsbGVkLCBtdWx0aXBsZSB0aW1lcy5cbiAgICovXG4gIHB1YmxpYyBwcmVwZW5kTGlzdGVuZXIoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXG4gICAgbGlzdGVuZXI6IEdlbmVyaWNGdW5jdGlvbiB8IFdyYXBwZWRGdW5jdGlvbixcbiAgKTogdGhpcyB7XG4gICAgcmV0dXJuIHRoaXMuX2FkZExpc3RlbmVyKGV2ZW50TmFtZSwgbGlzdGVuZXIsIHRydWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBvbmUtdGltZSBsaXN0ZW5lciBmdW5jdGlvbiBmb3IgdGhlIGV2ZW50IG5hbWVkIGV2ZW50TmFtZSB0byB0aGVcbiAgICogYmVnaW5uaW5nIG9mIHRoZSBsaXN0ZW5lcnMgYXJyYXkuIFRoZSBuZXh0IHRpbWUgZXZlbnROYW1lIGlzIHRyaWdnZXJlZCxcbiAgICogdGhpcyBsaXN0ZW5lciBpcyByZW1vdmVkLCBhbmQgdGhlbiBpbnZva2VkLlxuICAgKi9cbiAgcHVibGljIHByZXBlbmRPbmNlTGlzdGVuZXIoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXG4gICAgbGlzdGVuZXI6IEdlbmVyaWNGdW5jdGlvbixcbiAgKTogdGhpcyB7XG4gICAgY29uc3Qgd3JhcHBlZDogV3JhcHBlZEZ1bmN0aW9uID0gdGhpcy5vbmNlV3JhcChldmVudE5hbWUsIGxpc3RlbmVyKTtcbiAgICB0aGlzLnByZXBlbmRMaXN0ZW5lcihldmVudE5hbWUsIHdyYXBwZWQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFJlbW92ZXMgYWxsIGxpc3RlbmVycywgb3IgdGhvc2Ugb2YgdGhlIHNwZWNpZmllZCBldmVudE5hbWUuICovXG4gIHB1YmxpYyByZW1vdmVBbGxMaXN0ZW5lcnMoZXZlbnROYW1lPzogc3RyaW5nIHwgc3ltYm9sKTogdGhpcyB7XG4gICAgaWYgKHRoaXMuX2V2ZW50cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpZiAoZXZlbnROYW1lKSB7XG4gICAgICBpZiAodGhpcy5fZXZlbnRzLmhhcyhldmVudE5hbWUpKSB7XG4gICAgICAgIGNvbnN0IGxpc3RlbmVycyA9ICh0aGlzLl9ldmVudHMuZ2V0KGV2ZW50TmFtZSkgYXMgQXJyYXk8XG4gICAgICAgICAgR2VuZXJpY0Z1bmN0aW9uIHwgV3JhcHBlZEZ1bmN0aW9uXG4gICAgICAgID4pLnNsaWNlKCk7IC8vIENyZWF0ZSBhIGNvcHk7IFdlIHVzZSBpdCBBRlRFUiBpdCdzIGRlbGV0ZWQuXG4gICAgICAgIHRoaXMuX2V2ZW50cy5kZWxldGUoZXZlbnROYW1lKTtcbiAgICAgICAgZm9yIChjb25zdCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnMpIHtcbiAgICAgICAgICB0aGlzLmVtaXQoXCJyZW1vdmVMaXN0ZW5lclwiLCBldmVudE5hbWUsIGxpc3RlbmVyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBldmVudExpc3Q6IFtzdHJpbmcgfCBzeW1ib2xdID0gdGhpcy5ldmVudE5hbWVzKCk7XG4gICAgICBldmVudExpc3QubWFwKCh2YWx1ZTogc3RyaW5nIHwgc3ltYm9sKSA9PiB7XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKHZhbHVlKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgdGhlIHNwZWNpZmllZCBsaXN0ZW5lciBmcm9tIHRoZSBsaXN0ZW5lciBhcnJheSBmb3IgdGhlIGV2ZW50XG4gICAqIG5hbWVkIGV2ZW50TmFtZS5cbiAgICovXG4gIHB1YmxpYyByZW1vdmVMaXN0ZW5lcihcbiAgICBldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbCxcbiAgICBsaXN0ZW5lcjogR2VuZXJpY0Z1bmN0aW9uLFxuICApOiB0aGlzIHtcbiAgICBpZiAodGhpcy5fZXZlbnRzLmhhcyhldmVudE5hbWUpKSB7XG4gICAgICBjb25zdCBhcnI6XG4gICAgICAgIHwgQXJyYXk8R2VuZXJpY0Z1bmN0aW9uIHwgV3JhcHBlZEZ1bmN0aW9uPlxuICAgICAgICB8IHVuZGVmaW5lZCA9IHRoaXMuX2V2ZW50cy5nZXQoZXZlbnROYW1lKTtcblxuICAgICAgYXNzZXJ0KGFycik7XG5cbiAgICAgIGxldCBsaXN0ZW5lckluZGV4ID0gLTE7XG4gICAgICBmb3IgKGxldCBpID0gYXJyLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIC8vIGFycltpXVtcImxpc3RlbmVyXCJdIGlzIHRoZSByZWZlcmVuY2UgdG8gdGhlIGxpc3RlbmVyIGluc2lkZSBhIGJvdW5kICdvbmNlJyB3cmFwcGVyXG4gICAgICAgIGlmIChcbiAgICAgICAgICBhcnJbaV0gPT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAoYXJyW2ldICYmIChhcnJbaV0gYXMgV3JhcHBlZEZ1bmN0aW9uKVtcImxpc3RlbmVyXCJdID09IGxpc3RlbmVyKVxuICAgICAgICApIHtcbiAgICAgICAgICBsaXN0ZW5lckluZGV4ID0gaTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAobGlzdGVuZXJJbmRleCA+PSAwKSB7XG4gICAgICAgIGFyci5zcGxpY2UobGlzdGVuZXJJbmRleCwgMSk7XG4gICAgICAgIHRoaXMuZW1pdChcInJlbW92ZUxpc3RlbmVyXCIsIGV2ZW50TmFtZSwgbGlzdGVuZXIpO1xuICAgICAgICBpZiAoYXJyLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIHRoaXMuX2V2ZW50cy5kZWxldGUoZXZlbnROYW1lKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVyc1xuICAgKiBhcmUgYWRkZWQgZm9yIGEgcGFydGljdWxhciBldmVudC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHRoYXQgaGVscHNcbiAgICogZmluZGluZyBtZW1vcnkgbGVha3MuIE9idmlvdXNseSwgbm90IGFsbCBldmVudHMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8ganVzdFxuICAgKiAxMCBsaXN0ZW5lcnMuIFRoZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIG1ldGhvZCBhbGxvd3MgdGhlIGxpbWl0IHRvIGJlXG4gICAqIG1vZGlmaWVkIGZvciB0aGlzIHNwZWNpZmljIEV2ZW50RW1pdHRlciBpbnN0YW5jZS4gVGhlIHZhbHVlIGNhbiBiZSBzZXQgdG9cbiAgICogSW5maW5pdHkgKG9yIDApIHRvIGluZGljYXRlIGFuIHVubGltaXRlZCBudW1iZXIgb2YgbGlzdGVuZXJzLlxuICAgKi9cbiAgcHVibGljIHNldE1heExpc3RlbmVycyhuOiBudW1iZXIpOiB0aGlzIHtcbiAgICBpZiAobiAhPT0gSW5maW5pdHkpIHtcbiAgICAgIGlmIChuID09PSAwKSB7XG4gICAgICAgIG4gPSBJbmZpbml0eTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbGlkYXRlSW50ZWdlclJhbmdlKG4sIFwibWF4TGlzdGVuZXJzXCIsIDApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMubWF4TGlzdGVuZXJzID0gbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgUHJvbWlzZSB0aGF0IGlzIGZ1bGZpbGxlZCB3aGVuIHRoZSBFdmVudEVtaXR0ZXIgZW1pdHMgdGhlIGdpdmVuXG4gICAqIGV2ZW50IG9yIHRoYXQgaXMgcmVqZWN0ZWQgd2hlbiB0aGUgRXZlbnRFbWl0dGVyIGVtaXRzICdlcnJvcicuIFRoZSBQcm9taXNlXG4gICAqIHdpbGwgcmVzb2x2ZSB3aXRoIGFuIGFycmF5IG9mIGFsbCB0aGUgYXJndW1lbnRzIGVtaXR0ZWQgdG8gdGhlIGdpdmVuIGV2ZW50LlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBvbmNlKFxuICAgIGVtaXR0ZXI6IEV2ZW50RW1pdHRlciB8IEV2ZW50VGFyZ2V0LFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICApOiBQcm9taXNlPGFueVtdPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGlmIChlbWl0dGVyIGluc3RhbmNlb2YgRXZlbnRUYXJnZXQpIHtcbiAgICAgICAgLy8gRXZlbnRUYXJnZXQgZG9lcyBub3QgaGF2ZSBgZXJyb3JgIGV2ZW50IHNlbWFudGljcyBsaWtlIE5vZGVcbiAgICAgICAgLy8gRXZlbnRFbWl0dGVycywgd2UgZG8gbm90IGxpc3RlbiB0byBgZXJyb3JgIGV2ZW50cyBoZXJlLlxuICAgICAgICBlbWl0dGVyLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgbmFtZSxcbiAgICAgICAgICAoLi4uYXJncykgPT4ge1xuICAgICAgICAgICAgcmVzb2x2ZShhcmdzKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHsgb25jZTogdHJ1ZSwgcGFzc2l2ZTogZmFsc2UsIGNhcHR1cmU6IGZhbHNlIH0sXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0gZWxzZSBpZiAoZW1pdHRlciBpbnN0YW5jZW9mIEV2ZW50RW1pdHRlcikge1xuICAgICAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgICAgICBjb25zdCBldmVudExpc3RlbmVyID0gKC4uLmFyZ3M6IGFueVtdKTogdm9pZCA9PiB7XG4gICAgICAgICAgaWYgKGVycm9yTGlzdGVuZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZW1pdHRlci5yZW1vdmVMaXN0ZW5lcihcImVycm9yXCIsIGVycm9yTGlzdGVuZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXNvbHZlKGFyZ3MpO1xuICAgICAgICB9O1xuICAgICAgICBsZXQgZXJyb3JMaXN0ZW5lcjogR2VuZXJpY0Z1bmN0aW9uO1xuXG4gICAgICAgIC8vIEFkZGluZyBhbiBlcnJvciBsaXN0ZW5lciBpcyBub3Qgb3B0aW9uYWwgYmVjYXVzZVxuICAgICAgICAvLyBpZiBhbiBlcnJvciBpcyB0aHJvd24gb24gYW4gZXZlbnQgZW1pdHRlciB3ZSBjYW5ub3RcbiAgICAgICAgLy8gZ3VhcmFudGVlIHRoYXQgdGhlIGFjdHVhbCBldmVudCB3ZSBhcmUgd2FpdGluZyB3aWxsXG4gICAgICAgIC8vIGJlIGZpcmVkLiBUaGUgcmVzdWx0IGNvdWxkIGJlIGEgc2lsZW50IHdheSB0byBjcmVhdGVcbiAgICAgICAgLy8gbWVtb3J5IG9yIGZpbGUgZGVzY3JpcHRvciBsZWFrcywgd2hpY2ggaXMgc29tZXRoaW5nXG4gICAgICAgIC8vIHdlIHNob3VsZCBhdm9pZC5cbiAgICAgICAgaWYgKG5hbWUgIT09IFwiZXJyb3JcIikge1xuICAgICAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgICAgICAgZXJyb3JMaXN0ZW5lciA9IChlcnI6IGFueSk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgZW1pdHRlci5yZW1vdmVMaXN0ZW5lcihuYW1lLCBldmVudExpc3RlbmVyKTtcbiAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICBlbWl0dGVyLm9uY2UoXCJlcnJvclwiLCBlcnJvckxpc3RlbmVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVtaXR0ZXIub25jZShuYW1lLCBldmVudExpc3RlbmVyKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gQXN5bmNJdGVyYXRvciB0aGF0IGl0ZXJhdGVzIGV2ZW50TmFtZSBldmVudHMuIEl0IHdpbGwgdGhyb3cgaWZcbiAgICogdGhlIEV2ZW50RW1pdHRlciBlbWl0cyAnZXJyb3InLiBJdCByZW1vdmVzIGFsbCBsaXN0ZW5lcnMgd2hlbiBleGl0aW5nIHRoZVxuICAgKiBsb29wLiBUaGUgdmFsdWUgcmV0dXJuZWQgYnkgZWFjaCBpdGVyYXRpb24gaXMgYW4gYXJyYXkgY29tcG9zZWQgb2YgdGhlXG4gICAqIGVtaXR0ZWQgZXZlbnQgYXJndW1lbnRzLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBvbihcbiAgICBlbWl0dGVyOiBFdmVudEVtaXR0ZXIsXG4gICAgZXZlbnQ6IHN0cmluZyB8IHN5bWJvbCxcbiAgKTogQXN5bmNJdGVyYWJsZSB7XG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICBjb25zdCB1bmNvbnN1bWVkRXZlbnRWYWx1ZXM6IGFueVtdID0gW107XG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICBjb25zdCB1bmNvbnN1bWVkUHJvbWlzZXM6IGFueVtdID0gW107XG4gICAgbGV0IGVycm9yOiBFcnJvciB8IG51bGwgPSBudWxsO1xuICAgIGxldCBmaW5pc2hlZCA9IGZhbHNlO1xuXG4gICAgY29uc3QgaXRlcmF0b3IgPSB7XG4gICAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgICAgbmV4dCgpOiBQcm9taXNlPEl0ZXJhdG9yUmVzdWx0PGFueT4+IHtcbiAgICAgICAgLy8gRmlyc3QsIHdlIGNvbnN1bWUgYWxsIHVucmVhZCBldmVudHNcbiAgICAgICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICAgICAgY29uc3QgdmFsdWU6IGFueSA9IHVuY29uc3VtZWRFdmVudFZhbHVlcy5zaGlmdCgpO1xuICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNyZWF0ZUl0ZXJSZXN1bHQodmFsdWUsIGZhbHNlKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGVuIHdlIGVycm9yLCBpZiBhbiBlcnJvciBoYXBwZW5lZFxuICAgICAgICAvLyBUaGlzIGhhcHBlbnMgb25lIHRpbWUgaWYgYXQgYWxsLCBiZWNhdXNlIGFmdGVyICdlcnJvcidcbiAgICAgICAgLy8gd2Ugc3RvcCBsaXN0ZW5pbmdcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgY29uc3QgcDogUHJvbWlzZTxuZXZlcj4gPSBQcm9taXNlLnJlamVjdChlcnJvcik7XG4gICAgICAgICAgLy8gT25seSB0aGUgZmlyc3QgZWxlbWVudCBlcnJvcnNcbiAgICAgICAgICBlcnJvciA9IG51bGw7XG4gICAgICAgICAgcmV0dXJuIHA7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgaXRlcmF0b3IgaXMgZmluaXNoZWQsIHJlc29sdmUgdG8gZG9uZVxuICAgICAgICBpZiAoZmluaXNoZWQpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNyZWF0ZUl0ZXJSZXN1bHQodW5kZWZpbmVkLCB0cnVlKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXYWl0IHVudGlsIGFuIGV2ZW50IGhhcHBlbnNcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICB1bmNvbnN1bWVkUHJvbWlzZXMucHVzaCh7IHJlc29sdmUsIHJlamVjdCB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuXG4gICAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgICAgcmV0dXJuKCk6IFByb21pc2U8SXRlcmF0b3JSZXN1bHQ8YW55Pj4ge1xuICAgICAgICBlbWl0dGVyLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBldmVudEhhbmRsZXIpO1xuICAgICAgICBlbWl0dGVyLnJlbW92ZUxpc3RlbmVyKFwiZXJyb3JcIiwgZXJyb3JIYW5kbGVyKTtcbiAgICAgICAgZmluaXNoZWQgPSB0cnVlO1xuXG4gICAgICAgIGZvciAoY29uc3QgcHJvbWlzZSBvZiB1bmNvbnN1bWVkUHJvbWlzZXMpIHtcbiAgICAgICAgICBwcm9taXNlLnJlc29sdmUoY3JlYXRlSXRlclJlc3VsdCh1bmRlZmluZWQsIHRydWUpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY3JlYXRlSXRlclJlc3VsdCh1bmRlZmluZWQsIHRydWUpKTtcbiAgICAgIH0sXG5cbiAgICAgIHRocm93KGVycjogRXJyb3IpOiB2b2lkIHtcbiAgICAgICAgZXJyb3IgPSBlcnI7XG4gICAgICAgIGVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGV2ZW50SGFuZGxlcik7XG4gICAgICAgIGVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoXCJlcnJvclwiLCBlcnJvckhhbmRsZXIpO1xuICAgICAgfSxcblxuICAgICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICAgIFtTeW1ib2wuYXN5bmNJdGVyYXRvcl0oKTogYW55IHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9LFxuICAgIH07XG5cbiAgICBlbWl0dGVyLm9uKGV2ZW50LCBldmVudEhhbmRsZXIpO1xuICAgIGVtaXR0ZXIub24oXCJlcnJvclwiLCBlcnJvckhhbmRsZXIpO1xuXG4gICAgcmV0dXJuIGl0ZXJhdG9yO1xuXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICBmdW5jdGlvbiBldmVudEhhbmRsZXIoLi4uYXJnczogYW55W10pOiB2b2lkIHtcbiAgICAgIGNvbnN0IHByb21pc2UgPSB1bmNvbnN1bWVkUHJvbWlzZXMuc2hpZnQoKTtcbiAgICAgIGlmIChwcm9taXNlKSB7XG4gICAgICAgIHByb21pc2UucmVzb2x2ZShjcmVhdGVJdGVyUmVzdWx0KGFyZ3MsIGZhbHNlKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1bmNvbnN1bWVkRXZlbnRWYWx1ZXMucHVzaChhcmdzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIGZ1bmN0aW9uIGVycm9ySGFuZGxlcihlcnI6IGFueSk6IHZvaWQge1xuICAgICAgZmluaXNoZWQgPSB0cnVlO1xuXG4gICAgICBjb25zdCB0b0Vycm9yID0gdW5jb25zdW1lZFByb21pc2VzLnNoaWZ0KCk7XG4gICAgICBpZiAodG9FcnJvcikge1xuICAgICAgICB0b0Vycm9yLnJlamVjdChlcnIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGhlIG5leHQgdGltZSB3ZSBjYWxsIG5leHQoKVxuICAgICAgICBlcnJvciA9IGVycjtcbiAgICAgIH1cblxuICAgICAgaXRlcmF0b3IucmV0dXJuKCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE9iamVjdC5hc3NpZ24oRXZlbnRFbWl0dGVyLCB7IEV2ZW50RW1pdHRlciB9KTtcblxuZXhwb3J0IGNvbnN0IGNhcHR1cmVSZWplY3Rpb25TeW1ib2wgPSBFdmVudEVtaXR0ZXIuY2FwdHVyZVJlamVjdGlvblN5bWJvbDtcbmV4cG9ydCBjb25zdCBlcnJvck1vbml0b3IgPSBFdmVudEVtaXR0ZXIuZXJyb3JNb25pdG9yO1xuZXhwb3J0IGNvbnN0IGxpc3RlbmVyQ291bnQgPSBFdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudDtcbmV4cG9ydCBjb25zdCBvbiA9IEV2ZW50RW1pdHRlci5vbjtcbmV4cG9ydCBjb25zdCBvbmNlID0gRXZlbnRFbWl0dGVyLm9uY2U7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUFBMEUsQUFBMUUsd0VBQTBFO0FBQzFFLEVBQXlFLEFBQXpFLHVFQUF5RTtBQUN6RSxFQUFzRCxBQUF0RCxvREFBc0Q7QUFDdEQsRUFBRTtBQUNGLEVBQTBFLEFBQTFFLHdFQUEwRTtBQUMx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
