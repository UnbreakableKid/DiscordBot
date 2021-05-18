// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
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
class EventEmitter {
  static defaultMaxListeners = 10;
  static errorMonitor = Symbol("events.errorMonitor");
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    return this.addListener(eventName, listener);
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
    const wrapper = function ( // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
}
/**
 * See also https://nodejs.org/api/events.html
 */ export { EventEmitter as default };
export { EventEmitter };
/**
 * Creates a Promise that is fulfilled when the EventEmitter emits the given
 * event or that is rejected when the EventEmitter emits 'error'. The Promise
 * will resolve with an array of all the arguments emitted to the given event.
 */ export function once(emitter, name) {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createIterResult(value, done) {
  return {
    value,
    done,
  };
}
/**
 * Returns an AsyncIterator that iterates eventName events. It will throw if
 * the EventEmitter emits 'error'. It removes all listeners when exiting the
 * loop. The value returned by each iteration is an array composed of the
 * emitted event arguments.
 */ export function on(emitter, event) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unconsumedEventValues = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unconsumedPromises = [];
  let error = null;
  let finished = false;
  const iterator = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    next() {
      // First, we consume all unread events
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [Symbol.asyncIterator]() {
      return this;
    },
  };
  emitter.on(event, eventHandler);
  emitter.on("error", errorHandler);
  return iterator;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function eventHandler(...args) {
    const promise = unconsumedPromises.shift();
    if (promise) {
      promise.resolve(createIterResult(args, false));
    } else {
      unconsumedEventValues.push(args);
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
export const captureRejectionSymbol = Symbol.for("nodejs.rejection");
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC43MS4wL25vZGUvZXZlbnRzLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIwIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gQ29weXJpZ2h0IChjKSAyMDE5IERlbm9saWJzIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCB7IHZhbGlkYXRlSW50ZWdlclJhbmdlIH0gZnJvbSBcIi4vX3V0aWxzLnRzXCI7XG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiLi4vX3V0aWwvYXNzZXJ0LnRzXCI7XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG5leHBvcnQgdHlwZSBHZW5lcmljRnVuY3Rpb24gPSAoLi4uYXJnczogYW55W10pID0+IGFueTtcblxuZXhwb3J0IGludGVyZmFjZSBXcmFwcGVkRnVuY3Rpb24gZXh0ZW5kcyBGdW5jdGlvbiB7XG4gIGxpc3RlbmVyOiBHZW5lcmljRnVuY3Rpb247XG59XG5cbi8qKlxuICogU2VlIGFsc28gaHR0cHM6Ly9ub2RlanMub3JnL2FwaS9ldmVudHMuaHRtbFxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFdmVudEVtaXR0ZXIge1xuICBwdWJsaWMgc3RhdGljIGRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcbiAgcHVibGljIHN0YXRpYyBlcnJvck1vbml0b3IgPSBTeW1ib2woXCJldmVudHMuZXJyb3JNb25pdG9yXCIpO1xuICBwcml2YXRlIG1heExpc3RlbmVyczogbnVtYmVyIHwgdW5kZWZpbmVkO1xuICBwcml2YXRlIF9ldmVudHM6IE1hcDxcbiAgICBzdHJpbmcgfCBzeW1ib2wsXG4gICAgQXJyYXk8R2VuZXJpY0Z1bmN0aW9uIHwgV3JhcHBlZEZ1bmN0aW9uPlxuICA+O1xuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9ldmVudHMgPSBuZXcgTWFwKCk7XG4gIH1cblxuICBwcml2YXRlIF9hZGRMaXN0ZW5lcihcbiAgICBldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbCxcbiAgICBsaXN0ZW5lcjogR2VuZXJpY0Z1bmN0aW9uIHwgV3JhcHBlZEZ1bmN0aW9uLFxuICAgIHByZXBlbmQ6IGJvb2xlYW4sXG4gICk6IHRoaXMge1xuICAgIHRoaXMuZW1pdChcIm5ld0xpc3RlbmVyXCIsIGV2ZW50TmFtZSwgbGlzdGVuZXIpO1xuICAgIGlmICh0aGlzLl9ldmVudHMuaGFzKGV2ZW50TmFtZSkpIHtcbiAgICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50cy5nZXQoZXZlbnROYW1lKSBhcyBBcnJheTxcbiAgICAgICAgR2VuZXJpY0Z1bmN0aW9uIHwgV3JhcHBlZEZ1bmN0aW9uXG4gICAgICA+O1xuICAgICAgaWYgKHByZXBlbmQpIHtcbiAgICAgICAgbGlzdGVuZXJzLnVuc2hpZnQobGlzdGVuZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9ldmVudHMuc2V0KGV2ZW50TmFtZSwgW2xpc3RlbmVyXSk7XG4gICAgfVxuICAgIGNvbnN0IG1heCA9IHRoaXMuZ2V0TWF4TGlzdGVuZXJzKCk7XG4gICAgaWYgKG1heCA+IDAgJiYgdGhpcy5saXN0ZW5lckNvdW50KGV2ZW50TmFtZSkgPiBtYXgpIHtcbiAgICAgIGNvbnN0IHdhcm5pbmcgPSBuZXcgRXJyb3IoXG4gICAgICAgIGBQb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5IGxlYWsgZGV0ZWN0ZWQuXG4gICAgICAgICAke3RoaXMubGlzdGVuZXJDb3VudChldmVudE5hbWUpfSAke2V2ZW50TmFtZS50b1N0cmluZygpfSBsaXN0ZW5lcnMuXG4gICAgICAgICBVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdGAsXG4gICAgICApO1xuICAgICAgd2FybmluZy5uYW1lID0gXCJNYXhMaXN0ZW5lcnNFeGNlZWRlZFdhcm5pbmdcIjtcbiAgICAgIGNvbnNvbGUud2Fybih3YXJuaW5nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBBbGlhcyBmb3IgZW1pdHRlci5vbihldmVudE5hbWUsIGxpc3RlbmVyKS4gKi9cbiAgcHVibGljIGFkZExpc3RlbmVyKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sLFxuICAgIGxpc3RlbmVyOiBHZW5lcmljRnVuY3Rpb24gfCBXcmFwcGVkRnVuY3Rpb24sXG4gICk6IHRoaXMge1xuICAgIHJldHVybiB0aGlzLl9hZGRMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyLCBmYWxzZSk7XG4gIH1cblxuICAvKipcbiAgICogU3luY2hyb25vdXNseSBjYWxscyBlYWNoIG9mIHRoZSBsaXN0ZW5lcnMgcmVnaXN0ZXJlZCBmb3IgdGhlIGV2ZW50IG5hbWVkXG4gICAqIGV2ZW50TmFtZSwgaW4gdGhlIG9yZGVyIHRoZXkgd2VyZSByZWdpc3RlcmVkLCBwYXNzaW5nIHRoZSBzdXBwbGllZFxuICAgKiBhcmd1bWVudHMgdG8gZWFjaC5cbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBldmVudCBoYWQgbGlzdGVuZXJzLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIHB1YmxpYyBlbWl0KGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sLCAuLi5hcmdzOiBhbnlbXSk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLl9ldmVudHMuaGFzKGV2ZW50TmFtZSkpIHtcbiAgICAgIGlmIChcbiAgICAgICAgZXZlbnROYW1lID09PSBcImVycm9yXCIgJiZcbiAgICAgICAgdGhpcy5fZXZlbnRzLmdldChFdmVudEVtaXR0ZXIuZXJyb3JNb25pdG9yKVxuICAgICAgKSB7XG4gICAgICAgIHRoaXMuZW1pdChFdmVudEVtaXR0ZXIuZXJyb3JNb25pdG9yLCAuLi5hcmdzKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGxpc3RlbmVycyA9ICh0aGlzLl9ldmVudHMuZ2V0KFxuICAgICAgICBldmVudE5hbWUsXG4gICAgICApIGFzIEdlbmVyaWNGdW5jdGlvbltdKS5zbGljZSgpOyAvLyBXZSBjb3B5IHdpdGggc2xpY2UoKSBzbyBhcnJheSBpcyBub3QgbXV0YXRlZCBkdXJpbmcgZW1pdFxuICAgICAgZm9yIChjb25zdCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgdGhpcy5lbWl0KFwiZXJyb3JcIiwgZXJyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIGlmIChldmVudE5hbWUgPT09IFwiZXJyb3JcIikge1xuICAgICAgaWYgKHRoaXMuX2V2ZW50cy5nZXQoRXZlbnRFbWl0dGVyLmVycm9yTW9uaXRvcikpIHtcbiAgICAgICAgdGhpcy5lbWl0KEV2ZW50RW1pdHRlci5lcnJvck1vbml0b3IsIC4uLmFyZ3MpO1xuICAgICAgfVxuICAgICAgY29uc3QgZXJyTXNnID0gYXJncy5sZW5ndGggPiAwID8gYXJnc1swXSA6IEVycm9yKFwiVW5oYW5kbGVkIGVycm9yLlwiKTtcbiAgICAgIHRocm93IGVyck1zZztcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gYXJyYXkgbGlzdGluZyB0aGUgZXZlbnRzIGZvciB3aGljaCB0aGUgZW1pdHRlciBoYXNcbiAgICogcmVnaXN0ZXJlZCBsaXN0ZW5lcnMuXG4gICAqL1xuICBwdWJsaWMgZXZlbnROYW1lcygpOiBbc3RyaW5nIHwgc3ltYm9sXSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5fZXZlbnRzLmtleXMoKSkgYXMgW3N0cmluZyB8IHN5bWJvbF07XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY3VycmVudCBtYXggbGlzdGVuZXIgdmFsdWUgZm9yIHRoZSBFdmVudEVtaXR0ZXIgd2hpY2ggaXNcbiAgICogZWl0aGVyIHNldCBieSBlbWl0dGVyLnNldE1heExpc3RlbmVycyhuKSBvciBkZWZhdWx0cyB0b1xuICAgKiBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycy5cbiAgICovXG4gIHB1YmxpYyBnZXRNYXhMaXN0ZW5lcnMoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5tYXhMaXN0ZW5lcnMgfHwgRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbnVtYmVyIG9mIGxpc3RlbmVycyBsaXN0ZW5pbmcgdG8gdGhlIGV2ZW50IG5hbWVkXG4gICAqIGV2ZW50TmFtZS5cbiAgICovXG4gIHB1YmxpYyBsaXN0ZW5lckNvdW50KGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sKTogbnVtYmVyIHtcbiAgICBpZiAodGhpcy5fZXZlbnRzLmhhcyhldmVudE5hbWUpKSB7XG4gICAgICByZXR1cm4gKHRoaXMuX2V2ZW50cy5nZXQoZXZlbnROYW1lKSBhcyBHZW5lcmljRnVuY3Rpb25bXSkubGVuZ3RoO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9saXN0ZW5lcnMoXG4gICAgdGFyZ2V0OiBFdmVudEVtaXR0ZXIsXG4gICAgZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXG4gICAgdW53cmFwOiBib29sZWFuLFxuICApOiBHZW5lcmljRnVuY3Rpb25bXSB7XG4gICAgaWYgKCF0YXJnZXQuX2V2ZW50cy5oYXMoZXZlbnROYW1lKSkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBjb25zdCBldmVudExpc3RlbmVycyA9IHRhcmdldC5fZXZlbnRzLmdldChldmVudE5hbWUpIGFzIEdlbmVyaWNGdW5jdGlvbltdO1xuXG4gICAgcmV0dXJuIHVud3JhcFxuICAgICAgPyB0aGlzLnVud3JhcExpc3RlbmVycyhldmVudExpc3RlbmVycylcbiAgICAgIDogZXZlbnRMaXN0ZW5lcnMuc2xpY2UoMCk7XG4gIH1cblxuICBwcml2YXRlIHVud3JhcExpc3RlbmVycyhhcnI6IEdlbmVyaWNGdW5jdGlvbltdKTogR2VuZXJpY0Z1bmN0aW9uW10ge1xuICAgIGNvbnN0IHVud3JhcHBlZExpc3RlbmVycyA9IG5ldyBBcnJheShhcnIubGVuZ3RoKSBhcyBHZW5lcmljRnVuY3Rpb25bXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICAgIHVud3JhcHBlZExpc3RlbmVyc1tpXSA9IChhcnJbaV0gYXMgYW55KVtcImxpc3RlbmVyXCJdIHx8IGFycltpXTtcbiAgICB9XG4gICAgcmV0dXJuIHVud3JhcHBlZExpc3RlbmVycztcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIGEgY29weSBvZiB0aGUgYXJyYXkgb2YgbGlzdGVuZXJzIGZvciB0aGUgZXZlbnQgbmFtZWQgZXZlbnROYW1lLiovXG4gIHB1YmxpYyBsaXN0ZW5lcnMoZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wpOiBHZW5lcmljRnVuY3Rpb25bXSB7XG4gICAgcmV0dXJuIHRoaXMuX2xpc3RlbmVycyh0aGlzLCBldmVudE5hbWUsIHRydWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBjb3B5IG9mIHRoZSBhcnJheSBvZiBsaXN0ZW5lcnMgZm9yIHRoZSBldmVudCBuYW1lZCBldmVudE5hbWUsXG4gICAqIGluY2x1ZGluZyBhbnkgd3JhcHBlcnMgKHN1Y2ggYXMgdGhvc2UgY3JlYXRlZCBieSAub25jZSgpKS5cbiAgICovXG4gIHB1YmxpYyByYXdMaXN0ZW5lcnMoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXG4gICk6IEFycmF5PEdlbmVyaWNGdW5jdGlvbiB8IFdyYXBwZWRGdW5jdGlvbj4ge1xuICAgIHJldHVybiB0aGlzLl9saXN0ZW5lcnModGhpcywgZXZlbnROYW1lLCBmYWxzZSk7XG4gIH1cblxuICAvKiogQWxpYXMgZm9yIGVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoKS4gKi9cbiAgcHVibGljIG9mZihldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbCwgbGlzdGVuZXI6IEdlbmVyaWNGdW5jdGlvbik6IHRoaXMge1xuICAgIHJldHVybiB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50TmFtZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGhlIGxpc3RlbmVyIGZ1bmN0aW9uIHRvIHRoZSBlbmQgb2YgdGhlIGxpc3RlbmVycyBhcnJheSBmb3IgdGhlIGV2ZW50XG4gICAqICBuYW1lZCBldmVudE5hbWUuIE5vIGNoZWNrcyBhcmUgbWFkZSB0byBzZWUgaWYgdGhlIGxpc3RlbmVyIGhhcyBhbHJlYWR5XG4gICAqIGJlZW4gYWRkZWQuIE11bHRpcGxlIGNhbGxzIHBhc3NpbmcgdGhlIHNhbWUgY29tYmluYXRpb24gb2YgZXZlbnROYW1lIGFuZFxuICAgKiBsaXN0ZW5lciB3aWxsIHJlc3VsdCBpbiB0aGUgbGlzdGVuZXIgYmVpbmcgYWRkZWQsIGFuZCBjYWxsZWQsIG11bHRpcGxlXG4gICAqIHRpbWVzLlxuICAgKi9cbiAgcHVibGljIG9uKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sLFxuICAgIGxpc3RlbmVyOiBHZW5lcmljRnVuY3Rpb24gfCBXcmFwcGVkRnVuY3Rpb24sXG4gICk6IHRoaXMge1xuICAgIHJldHVybiB0aGlzLmFkZExpc3RlbmVyKGV2ZW50TmFtZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBvbmUtdGltZSBsaXN0ZW5lciBmdW5jdGlvbiBmb3IgdGhlIGV2ZW50IG5hbWVkIGV2ZW50TmFtZS4gVGhlIG5leHRcbiAgICogdGltZSBldmVudE5hbWUgaXMgdHJpZ2dlcmVkLCB0aGlzIGxpc3RlbmVyIGlzIHJlbW92ZWQgYW5kIHRoZW4gaW52b2tlZC5cbiAgICovXG4gIHB1YmxpYyBvbmNlKGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sLCBsaXN0ZW5lcjogR2VuZXJpY0Z1bmN0aW9uKTogdGhpcyB7XG4gICAgY29uc3Qgd3JhcHBlZDogV3JhcHBlZEZ1bmN0aW9uID0gdGhpcy5vbmNlV3JhcChldmVudE5hbWUsIGxpc3RlbmVyKTtcbiAgICB0aGlzLm9uKGV2ZW50TmFtZSwgd3JhcHBlZCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBXcmFwcGVkIGZ1bmN0aW9uIHRoYXQgY2FsbHMgRXZlbnRFbWl0dGVyLnJlbW92ZUxpc3RlbmVyKGV2ZW50TmFtZSwgc2VsZikgb24gZXhlY3V0aW9uLlxuICBwcml2YXRlIG9uY2VXcmFwKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sLFxuICAgIGxpc3RlbmVyOiBHZW5lcmljRnVuY3Rpb24sXG4gICk6IFdyYXBwZWRGdW5jdGlvbiB7XG4gICAgY29uc3Qgd3JhcHBlciA9IGZ1bmN0aW9uIChcbiAgICAgIHRoaXM6IHtcbiAgICAgICAgZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2w7XG4gICAgICAgIGxpc3RlbmVyOiBHZW5lcmljRnVuY3Rpb247XG4gICAgICAgIHJhd0xpc3RlbmVyOiBHZW5lcmljRnVuY3Rpb24gfCBXcmFwcGVkRnVuY3Rpb247XG4gICAgICAgIGNvbnRleHQ6IEV2ZW50RW1pdHRlcjtcbiAgICAgIH0sXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgICAgLi4uYXJnczogYW55W11cbiAgICApOiB2b2lkIHtcbiAgICAgIHRoaXMuY29udGV4dC5yZW1vdmVMaXN0ZW5lcihcbiAgICAgICAgdGhpcy5ldmVudE5hbWUsXG4gICAgICAgIHRoaXMucmF3TGlzdGVuZXIgYXMgR2VuZXJpY0Z1bmN0aW9uLFxuICAgICAgKTtcbiAgICAgIHRoaXMubGlzdGVuZXIuYXBwbHkodGhpcy5jb250ZXh0LCBhcmdzKTtcbiAgICB9O1xuICAgIGNvbnN0IHdyYXBwZXJDb250ZXh0ID0ge1xuICAgICAgZXZlbnROYW1lOiBldmVudE5hbWUsXG4gICAgICBsaXN0ZW5lcjogbGlzdGVuZXIsXG4gICAgICByYXdMaXN0ZW5lcjogKHdyYXBwZXIgYXMgdW5rbm93bikgYXMgV3JhcHBlZEZ1bmN0aW9uLFxuICAgICAgY29udGV4dDogdGhpcyxcbiAgICB9O1xuICAgIGNvbnN0IHdyYXBwZWQgPSAod3JhcHBlci5iaW5kKFxuICAgICAgd3JhcHBlckNvbnRleHQsXG4gICAgKSBhcyB1bmtub3duKSBhcyBXcmFwcGVkRnVuY3Rpb247XG4gICAgd3JhcHBlckNvbnRleHQucmF3TGlzdGVuZXIgPSB3cmFwcGVkO1xuICAgIHdyYXBwZWQubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgICByZXR1cm4gd3JhcHBlZCBhcyBXcmFwcGVkRnVuY3Rpb247XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0aGUgbGlzdGVuZXIgZnVuY3Rpb24gdG8gdGhlIGJlZ2lubmluZyBvZiB0aGUgbGlzdGVuZXJzIGFycmF5IGZvciB0aGVcbiAgICogIGV2ZW50IG5hbWVkIGV2ZW50TmFtZS4gTm8gY2hlY2tzIGFyZSBtYWRlIHRvIHNlZSBpZiB0aGUgbGlzdGVuZXIgaGFzXG4gICAqIGFscmVhZHkgYmVlbiBhZGRlZC4gTXVsdGlwbGUgY2FsbHMgcGFzc2luZyB0aGUgc2FtZSBjb21iaW5hdGlvbiBvZlxuICAgKiBldmVudE5hbWUgYW5kIGxpc3RlbmVyIHdpbGwgcmVzdWx0IGluIHRoZSBsaXN0ZW5lciBiZWluZyBhZGRlZCwgYW5kXG4gICAqIGNhbGxlZCwgbXVsdGlwbGUgdGltZXMuXG4gICAqL1xuICBwdWJsaWMgcHJlcGVuZExpc3RlbmVyKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sLFxuICAgIGxpc3RlbmVyOiBHZW5lcmljRnVuY3Rpb24gfCBXcmFwcGVkRnVuY3Rpb24sXG4gICk6IHRoaXMge1xuICAgIHJldHVybiB0aGlzLl9hZGRMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyLCB0cnVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgb25lLXRpbWUgbGlzdGVuZXIgZnVuY3Rpb24gZm9yIHRoZSBldmVudCBuYW1lZCBldmVudE5hbWUgdG8gdGhlXG4gICAqIGJlZ2lubmluZyBvZiB0aGUgbGlzdGVuZXJzIGFycmF5LiBUaGUgbmV4dCB0aW1lIGV2ZW50TmFtZSBpcyB0cmlnZ2VyZWQsXG4gICAqIHRoaXMgbGlzdGVuZXIgaXMgcmVtb3ZlZCwgYW5kIHRoZW4gaW52b2tlZC5cbiAgICovXG4gIHB1YmxpYyBwcmVwZW5kT25jZUxpc3RlbmVyKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sLFxuICAgIGxpc3RlbmVyOiBHZW5lcmljRnVuY3Rpb24sXG4gICk6IHRoaXMge1xuICAgIGNvbnN0IHdyYXBwZWQ6IFdyYXBwZWRGdW5jdGlvbiA9IHRoaXMub25jZVdyYXAoZXZlbnROYW1lLCBsaXN0ZW5lcik7XG4gICAgdGhpcy5wcmVwZW5kTGlzdGVuZXIoZXZlbnROYW1lLCB3cmFwcGVkKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMsIG9yIHRob3NlIG9mIHRoZSBzcGVjaWZpZWQgZXZlbnROYW1lLiAqL1xuICBwdWJsaWMgcmVtb3ZlQWxsTGlzdGVuZXJzKGV2ZW50TmFtZT86IHN0cmluZyB8IHN5bWJvbCk6IHRoaXMge1xuICAgIGlmICh0aGlzLl9ldmVudHMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgaWYgKGV2ZW50TmFtZSkge1xuICAgICAgaWYgKHRoaXMuX2V2ZW50cy5oYXMoZXZlbnROYW1lKSkge1xuICAgICAgICBjb25zdCBsaXN0ZW5lcnMgPSAodGhpcy5fZXZlbnRzLmdldChldmVudE5hbWUpIGFzIEFycmF5PFxuICAgICAgICAgIEdlbmVyaWNGdW5jdGlvbiB8IFdyYXBwZWRGdW5jdGlvblxuICAgICAgICA+KS5zbGljZSgpOyAvLyBDcmVhdGUgYSBjb3B5OyBXZSB1c2UgaXQgQUZURVIgaXQncyBkZWxldGVkLlxuICAgICAgICB0aGlzLl9ldmVudHMuZGVsZXRlKGV2ZW50TmFtZSk7XG4gICAgICAgIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgbGlzdGVuZXJzKSB7XG4gICAgICAgICAgdGhpcy5lbWl0KFwicmVtb3ZlTGlzdGVuZXJcIiwgZXZlbnROYW1lLCBsaXN0ZW5lcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZXZlbnRMaXN0OiBbc3RyaW5nIHwgc3ltYm9sXSA9IHRoaXMuZXZlbnROYW1lcygpO1xuICAgICAgZXZlbnRMaXN0Lm1hcCgodmFsdWU6IHN0cmluZyB8IHN5bWJvbCkgPT4ge1xuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyh2YWx1ZSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIHRoZSBzcGVjaWZpZWQgbGlzdGVuZXIgZnJvbSB0aGUgbGlzdGVuZXIgYXJyYXkgZm9yIHRoZSBldmVudFxuICAgKiBuYW1lZCBldmVudE5hbWUuXG4gICAqL1xuICBwdWJsaWMgcmVtb3ZlTGlzdGVuZXIoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXG4gICAgbGlzdGVuZXI6IEdlbmVyaWNGdW5jdGlvbixcbiAgKTogdGhpcyB7XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5oYXMoZXZlbnROYW1lKSkge1xuICAgICAgY29uc3QgYXJyOlxuICAgICAgICB8IEFycmF5PEdlbmVyaWNGdW5jdGlvbiB8IFdyYXBwZWRGdW5jdGlvbj5cbiAgICAgICAgfCB1bmRlZmluZWQgPSB0aGlzLl9ldmVudHMuZ2V0KGV2ZW50TmFtZSk7XG5cbiAgICAgIGFzc2VydChhcnIpO1xuXG4gICAgICBsZXQgbGlzdGVuZXJJbmRleCA9IC0xO1xuICAgICAgZm9yIChsZXQgaSA9IGFyci5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAvLyBhcnJbaV1bXCJsaXN0ZW5lclwiXSBpcyB0aGUgcmVmZXJlbmNlIHRvIHRoZSBsaXN0ZW5lciBpbnNpZGUgYSBib3VuZCAnb25jZScgd3JhcHBlclxuICAgICAgICBpZiAoXG4gICAgICAgICAgYXJyW2ldID09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGFycltpXSAmJiAoYXJyW2ldIGFzIFdyYXBwZWRGdW5jdGlvbilbXCJsaXN0ZW5lclwiXSA9PSBsaXN0ZW5lcilcbiAgICAgICAgKSB7XG4gICAgICAgICAgbGlzdGVuZXJJbmRleCA9IGk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGxpc3RlbmVySW5kZXggPj0gMCkge1xuICAgICAgICBhcnIuc3BsaWNlKGxpc3RlbmVySW5kZXgsIDEpO1xuICAgICAgICB0aGlzLmVtaXQoXCJyZW1vdmVMaXN0ZW5lclwiLCBldmVudE5hbWUsIGxpc3RlbmVyKTtcbiAgICAgICAgaWYgKGFyci5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICB0aGlzLl9ldmVudHMuZGVsZXRlKGV2ZW50TmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnNcbiAgICogYXJlIGFkZGVkIGZvciBhIHBhcnRpY3VsYXIgZXZlbnQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB0aGF0IGhlbHBzXG4gICAqIGZpbmRpbmcgbWVtb3J5IGxlYWtzLiBPYnZpb3VzbHksIG5vdCBhbGwgZXZlbnRzIHNob3VsZCBiZSBsaW1pdGVkIHRvIGp1c3RcbiAgICogMTAgbGlzdGVuZXJzLiBUaGUgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSBtZXRob2QgYWxsb3dzIHRoZSBsaW1pdCB0byBiZVxuICAgKiBtb2RpZmllZCBmb3IgdGhpcyBzcGVjaWZpYyBFdmVudEVtaXR0ZXIgaW5zdGFuY2UuIFRoZSB2YWx1ZSBjYW4gYmUgc2V0IHRvXG4gICAqIEluZmluaXR5IChvciAwKSB0byBpbmRpY2F0ZSBhbiB1bmxpbWl0ZWQgbnVtYmVyIG9mIGxpc3RlbmVycy5cbiAgICovXG4gIHB1YmxpYyBzZXRNYXhMaXN0ZW5lcnMobjogbnVtYmVyKTogdGhpcyB7XG4gICAgaWYgKG4gIT09IEluZmluaXR5KSB7XG4gICAgICBpZiAobiA9PT0gMCkge1xuICAgICAgICBuID0gSW5maW5pdHk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWxpZGF0ZUludGVnZXJSYW5nZShuLCBcIm1heExpc3RlbmVyc1wiLCAwKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLm1heExpc3RlbmVycyA9IG47XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cblxuZXhwb3J0IHsgRXZlbnRFbWl0dGVyIH07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFByb21pc2UgdGhhdCBpcyBmdWxmaWxsZWQgd2hlbiB0aGUgRXZlbnRFbWl0dGVyIGVtaXRzIHRoZSBnaXZlblxuICogZXZlbnQgb3IgdGhhdCBpcyByZWplY3RlZCB3aGVuIHRoZSBFdmVudEVtaXR0ZXIgZW1pdHMgJ2Vycm9yJy4gVGhlIFByb21pc2VcbiAqIHdpbGwgcmVzb2x2ZSB3aXRoIGFuIGFycmF5IG9mIGFsbCB0aGUgYXJndW1lbnRzIGVtaXR0ZWQgdG8gdGhlIGdpdmVuIGV2ZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gb25jZShcbiAgZW1pdHRlcjogRXZlbnRFbWl0dGVyIHwgRXZlbnRUYXJnZXQsXG4gIG5hbWU6IHN0cmluZyxcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbik6IFByb21pc2U8YW55W10+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBpZiAoZW1pdHRlciBpbnN0YW5jZW9mIEV2ZW50VGFyZ2V0KSB7XG4gICAgICAvLyBFdmVudFRhcmdldCBkb2VzIG5vdCBoYXZlIGBlcnJvcmAgZXZlbnQgc2VtYW50aWNzIGxpa2UgTm9kZVxuICAgICAgLy8gRXZlbnRFbWl0dGVycywgd2UgZG8gbm90IGxpc3RlbiB0byBgZXJyb3JgIGV2ZW50cyBoZXJlLlxuICAgICAgZW1pdHRlci5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICBuYW1lLFxuICAgICAgICAoLi4uYXJncykgPT4ge1xuICAgICAgICAgIHJlc29sdmUoYXJncyk7XG4gICAgICAgIH0sXG4gICAgICAgIHsgb25jZTogdHJ1ZSwgcGFzc2l2ZTogZmFsc2UsIGNhcHR1cmU6IGZhbHNlIH0sXG4gICAgICApO1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZiAoZW1pdHRlciBpbnN0YW5jZW9mIEV2ZW50RW1pdHRlcikge1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICAgIGNvbnN0IGV2ZW50TGlzdGVuZXIgPSAoLi4uYXJnczogYW55W10pOiB2b2lkID0+IHtcbiAgICAgICAgaWYgKGVycm9yTGlzdGVuZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoXCJlcnJvclwiLCBlcnJvckxpc3RlbmVyKTtcbiAgICAgICAgfVxuICAgICAgICByZXNvbHZlKGFyZ3MpO1xuICAgICAgfTtcbiAgICAgIGxldCBlcnJvckxpc3RlbmVyOiBHZW5lcmljRnVuY3Rpb247XG5cbiAgICAgIC8vIEFkZGluZyBhbiBlcnJvciBsaXN0ZW5lciBpcyBub3Qgb3B0aW9uYWwgYmVjYXVzZVxuICAgICAgLy8gaWYgYW4gZXJyb3IgaXMgdGhyb3duIG9uIGFuIGV2ZW50IGVtaXR0ZXIgd2UgY2Fubm90XG4gICAgICAvLyBndWFyYW50ZWUgdGhhdCB0aGUgYWN0dWFsIGV2ZW50IHdlIGFyZSB3YWl0aW5nIHdpbGxcbiAgICAgIC8vIGJlIGZpcmVkLiBUaGUgcmVzdWx0IGNvdWxkIGJlIGEgc2lsZW50IHdheSB0byBjcmVhdGVcbiAgICAgIC8vIG1lbW9yeSBvciBmaWxlIGRlc2NyaXB0b3IgbGVha3MsIHdoaWNoIGlzIHNvbWV0aGluZ1xuICAgICAgLy8gd2Ugc2hvdWxkIGF2b2lkLlxuICAgICAgaWYgKG5hbWUgIT09IFwiZXJyb3JcIikge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgICAgICBlcnJvckxpc3RlbmVyID0gKGVycjogYW55KTogdm9pZCA9PiB7XG4gICAgICAgICAgZW1pdHRlci5yZW1vdmVMaXN0ZW5lcihuYW1lLCBldmVudExpc3RlbmVyKTtcbiAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgfTtcblxuICAgICAgICBlbWl0dGVyLm9uY2UoXCJlcnJvclwiLCBlcnJvckxpc3RlbmVyKTtcbiAgICAgIH1cblxuICAgICAgZW1pdHRlci5vbmNlKG5hbWUsIGV2ZW50TGlzdGVuZXIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfSk7XG59XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG5mdW5jdGlvbiBjcmVhdGVJdGVyUmVzdWx0KHZhbHVlOiBhbnksIGRvbmU6IGJvb2xlYW4pOiBJdGVyYXRvclJlc3VsdDxhbnk+IHtcbiAgcmV0dXJuIHsgdmFsdWUsIGRvbmUgfTtcbn1cblxuaW50ZXJmYWNlIEFzeW5jSW50ZXJhYmxlIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgbmV4dCgpOiBQcm9taXNlPEl0ZXJhdG9yUmVzdWx0PGFueSwgYW55Pj47XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIHJldHVybigpOiBQcm9taXNlPEl0ZXJhdG9yUmVzdWx0PGFueSwgYW55Pj47XG4gIHRocm93KGVycjogRXJyb3IpOiB2b2lkO1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICBbU3ltYm9sLmFzeW5jSXRlcmF0b3JdKCk6IGFueTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFuIEFzeW5jSXRlcmF0b3IgdGhhdCBpdGVyYXRlcyBldmVudE5hbWUgZXZlbnRzLiBJdCB3aWxsIHRocm93IGlmXG4gKiB0aGUgRXZlbnRFbWl0dGVyIGVtaXRzICdlcnJvcicuIEl0IHJlbW92ZXMgYWxsIGxpc3RlbmVycyB3aGVuIGV4aXRpbmcgdGhlXG4gKiBsb29wLiBUaGUgdmFsdWUgcmV0dXJuZWQgYnkgZWFjaCBpdGVyYXRpb24gaXMgYW4gYXJyYXkgY29tcG9zZWQgb2YgdGhlXG4gKiBlbWl0dGVkIGV2ZW50IGFyZ3VtZW50cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9uKFxuICBlbWl0dGVyOiBFdmVudEVtaXR0ZXIsXG4gIGV2ZW50OiBzdHJpbmcgfCBzeW1ib2wsXG4pOiBBc3luY0ludGVyYWJsZSB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIGNvbnN0IHVuY29uc3VtZWRFdmVudFZhbHVlczogYW55W10gPSBbXTtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgY29uc3QgdW5jb25zdW1lZFByb21pc2VzOiBhbnlbXSA9IFtdO1xuICBsZXQgZXJyb3I6IEVycm9yIHwgbnVsbCA9IG51bGw7XG4gIGxldCBmaW5pc2hlZCA9IGZhbHNlO1xuXG4gIGNvbnN0IGl0ZXJhdG9yID0ge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgbmV4dCgpOiBQcm9taXNlPEl0ZXJhdG9yUmVzdWx0PGFueT4+IHtcbiAgICAgIC8vIEZpcnN0LCB3ZSBjb25zdW1lIGFsbCB1bnJlYWQgZXZlbnRzXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgICAgY29uc3QgdmFsdWU6IGFueSA9IHVuY29uc3VtZWRFdmVudFZhbHVlcy5zaGlmdCgpO1xuICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY3JlYXRlSXRlclJlc3VsdCh2YWx1ZSwgZmFsc2UpKTtcbiAgICAgIH1cblxuICAgICAgLy8gVGhlbiB3ZSBlcnJvciwgaWYgYW4gZXJyb3IgaGFwcGVuZWRcbiAgICAgIC8vIFRoaXMgaGFwcGVucyBvbmUgdGltZSBpZiBhdCBhbGwsIGJlY2F1c2UgYWZ0ZXIgJ2Vycm9yJ1xuICAgICAgLy8gd2Ugc3RvcCBsaXN0ZW5pbmdcbiAgICAgIGlmIChlcnJvcikge1xuICAgICAgICBjb25zdCBwOiBQcm9taXNlPG5ldmVyPiA9IFByb21pc2UucmVqZWN0KGVycm9yKTtcbiAgICAgICAgLy8gT25seSB0aGUgZmlyc3QgZWxlbWVudCBlcnJvcnNcbiAgICAgICAgZXJyb3IgPSBudWxsO1xuICAgICAgICByZXR1cm4gcDtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhlIGl0ZXJhdG9yIGlzIGZpbmlzaGVkLCByZXNvbHZlIHRvIGRvbmVcbiAgICAgIGlmIChmaW5pc2hlZCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNyZWF0ZUl0ZXJSZXN1bHQodW5kZWZpbmVkLCB0cnVlKSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFdhaXQgdW50aWwgYW4gZXZlbnQgaGFwcGVuc1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgdW5jb25zdW1lZFByb21pc2VzLnB1c2goeyByZXNvbHZlLCByZWplY3QgfSk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICByZXR1cm4oKTogUHJvbWlzZTxJdGVyYXRvclJlc3VsdDxhbnk+PiB7XG4gICAgICBlbWl0dGVyLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBldmVudEhhbmRsZXIpO1xuICAgICAgZW1pdHRlci5yZW1vdmVMaXN0ZW5lcihcImVycm9yXCIsIGVycm9ySGFuZGxlcik7XG4gICAgICBmaW5pc2hlZCA9IHRydWU7XG5cbiAgICAgIGZvciAoY29uc3QgcHJvbWlzZSBvZiB1bmNvbnN1bWVkUHJvbWlzZXMpIHtcbiAgICAgICAgcHJvbWlzZS5yZXNvbHZlKGNyZWF0ZUl0ZXJSZXN1bHQodW5kZWZpbmVkLCB0cnVlKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY3JlYXRlSXRlclJlc3VsdCh1bmRlZmluZWQsIHRydWUpKTtcbiAgICB9LFxuXG4gICAgdGhyb3coZXJyOiBFcnJvcik6IHZvaWQge1xuICAgICAgZXJyb3IgPSBlcnI7XG4gICAgICBlbWl0dGVyLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBldmVudEhhbmRsZXIpO1xuICAgICAgZW1pdHRlci5yZW1vdmVMaXN0ZW5lcihcImVycm9yXCIsIGVycm9ySGFuZGxlcik7XG4gICAgfSxcblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSgpOiBhbnkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgfTtcblxuICBlbWl0dGVyLm9uKGV2ZW50LCBldmVudEhhbmRsZXIpO1xuICBlbWl0dGVyLm9uKFwiZXJyb3JcIiwgZXJyb3JIYW5kbGVyKTtcblxuICByZXR1cm4gaXRlcmF0b3I7XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgZnVuY3Rpb24gZXZlbnRIYW5kbGVyKC4uLmFyZ3M6IGFueVtdKTogdm9pZCB7XG4gICAgY29uc3QgcHJvbWlzZSA9IHVuY29uc3VtZWRQcm9taXNlcy5zaGlmdCgpO1xuICAgIGlmIChwcm9taXNlKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoY3JlYXRlSXRlclJlc3VsdChhcmdzLCBmYWxzZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB1bmNvbnN1bWVkRXZlbnRWYWx1ZXMucHVzaChhcmdzKTtcbiAgICB9XG4gIH1cblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICBmdW5jdGlvbiBlcnJvckhhbmRsZXIoZXJyOiBhbnkpOiB2b2lkIHtcbiAgICBmaW5pc2hlZCA9IHRydWU7XG5cbiAgICBjb25zdCB0b0Vycm9yID0gdW5jb25zdW1lZFByb21pc2VzLnNoaWZ0KCk7XG4gICAgaWYgKHRvRXJyb3IpIHtcbiAgICAgIHRvRXJyb3IucmVqZWN0KGVycik7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRoZSBuZXh0IHRpbWUgd2UgY2FsbCBuZXh0KClcbiAgICAgIGVycm9yID0gZXJyO1xuICAgIH1cblxuICAgIGl0ZXJhdG9yLnJldHVybigpO1xuICB9XG59XG5leHBvcnQgY29uc3QgY2FwdHVyZVJlamVjdGlvblN5bWJvbCA9IFN5bWJvbC5mb3IoXCJub2RlanMucmVqZWN0aW9uXCIpO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEVBQTBFLEFBQTFFLHdFQUEwRTtBQUMxRSxFQUF5RSxBQUF6RSx1RUFBeUU7QUFDekUsRUFBc0QsQUFBdEQsb0RBQXNEO0FBQ3RELEVBQUU7QUFDRixFQUEwRSxBQUExRSx3RUFBMEU7QUFDMUUsRUFBZ0UsQUFBaEUsOERBQWdFO0FBQ2hFLEVBQXNFLEFBQXRFLG9FQUFzRTtBQUN0RSxFQUFzRSxBQUF0RSxvRUFBc0U7QUFDdEUsRUFBNEUsQUFBNUUsMEVBQTRFO0FBQzVFLEVBQXFFLEFBQXJFLG1FQUFxRTtBQUNyRSxFQUF3QixBQUF4QixzQkFBd0I7QUFDeEIsRUFBRTtBQUNGLEVBQTBFLEFBQTFFLHdFQUEwRTtBQUMxRSxFQUF5RCxBQUF6RCx1REFBeUQ7QUFDekQsRUFBRTtBQUNGLEVBQTBFLEFBQTFFLHdFQUEwRTtBQUMxRSxFQUE2RCxBQUE3RCwyREFBNkQ7QUFDN0QsRUFBNEUsQUFBNUUsMEVBQTRFO0FBQzVFLEVBQTJFLEFBQTNFLHlFQUEyRTtBQUMzRSxFQUF3RSxBQUF4RSxzRUFBd0U7QUFDeEUsRUFBNEUsQUFBNUUsMEVBQTRFO0FBQzVFLEVBQXlDLEFBQXpDLHVDQUF5QztTQUVoQyxv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
