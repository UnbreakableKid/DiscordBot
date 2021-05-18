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
import { validateIntegerRange } from "./util.ts";
import { assert } from "../testing/asserts.ts";
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
    const wrapper = function (...args // eslint-disable-line @typescript-eslint/no-explicit-any
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
    if (eventName && this._events.has(eventName)) {
      const listeners = this._events.get(eventName).slice(); // Create a copy; We use it AFTER it's deleted.
      this._events.delete(eventName);
      for (const listener of listeners) {
        this.emit("removeListener", eventName, listener);
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
    validateIntegerRange(n, "maxListeners", 0);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC41MS4wL25vZGUvZXZlbnRzLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIwIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gQ29weXJpZ2h0IChjKSAyMDE5IERlbm9saWJzIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCB7IHZhbGlkYXRlSW50ZWdlclJhbmdlIH0gZnJvbSBcIi4vdXRpbC50c1wiO1xuaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcIi4uL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFdyYXBwZWRGdW5jdGlvbiBleHRlbmRzIEZ1bmN0aW9uIHtcbiAgbGlzdGVuZXI6IEZ1bmN0aW9uO1xufVxuXG4vKipcbiAqIFNlZSBhbHNvIGh0dHBzOi8vbm9kZWpzLm9yZy9hcGkvZXZlbnRzLmh0bWxcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRXZlbnRFbWl0dGVyIHtcbiAgcHVibGljIHN0YXRpYyBkZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG4gIHB1YmxpYyBzdGF0aWMgZXJyb3JNb25pdG9yID0gU3ltYm9sKFwiZXZlbnRzLmVycm9yTW9uaXRvclwiKTtcbiAgcHJpdmF0ZSBtYXhMaXN0ZW5lcnM6IG51bWJlciB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBfZXZlbnRzOiBNYXA8c3RyaW5nIHwgc3ltYm9sLCBBcnJheTxGdW5jdGlvbiB8IFdyYXBwZWRGdW5jdGlvbj4+O1xuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9ldmVudHMgPSBuZXcgTWFwKCk7XG4gIH1cblxuICBwcml2YXRlIF9hZGRMaXN0ZW5lcihcbiAgICBldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbCxcbiAgICBsaXN0ZW5lcjogRnVuY3Rpb24gfCBXcmFwcGVkRnVuY3Rpb24sXG4gICAgcHJlcGVuZDogYm9vbGVhblxuICApOiB0aGlzIHtcbiAgICB0aGlzLmVtaXQoXCJuZXdMaXN0ZW5lclwiLCBldmVudE5hbWUsIGxpc3RlbmVyKTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLmhhcyhldmVudE5hbWUpKSB7XG4gICAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHMuZ2V0KGV2ZW50TmFtZSkgYXMgQXJyYXk8XG4gICAgICAgIEZ1bmN0aW9uIHwgV3JhcHBlZEZ1bmN0aW9uXG4gICAgICA+O1xuICAgICAgaWYgKHByZXBlbmQpIHtcbiAgICAgICAgbGlzdGVuZXJzLnVuc2hpZnQobGlzdGVuZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9ldmVudHMuc2V0KGV2ZW50TmFtZSwgW2xpc3RlbmVyXSk7XG4gICAgfVxuICAgIGNvbnN0IG1heCA9IHRoaXMuZ2V0TWF4TGlzdGVuZXJzKCk7XG4gICAgaWYgKG1heCA+IDAgJiYgdGhpcy5saXN0ZW5lckNvdW50KGV2ZW50TmFtZSkgPiBtYXgpIHtcbiAgICAgIGNvbnN0IHdhcm5pbmcgPSBuZXcgRXJyb3IoXG4gICAgICAgIGBQb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5IGxlYWsgZGV0ZWN0ZWQuXG4gICAgICAgICAke3RoaXMubGlzdGVuZXJDb3VudChldmVudE5hbWUpfSAke2V2ZW50TmFtZS50b1N0cmluZygpfSBsaXN0ZW5lcnMuXG4gICAgICAgICBVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdGBcbiAgICAgICk7XG4gICAgICB3YXJuaW5nLm5hbWUgPSBcIk1heExpc3RlbmVyc0V4Y2VlZGVkV2FybmluZ1wiO1xuICAgICAgY29uc29sZS53YXJuKHdhcm5pbmcpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIEFsaWFzIGZvciBlbWl0dGVyLm9uKGV2ZW50TmFtZSwgbGlzdGVuZXIpLiAqL1xuICBwdWJsaWMgYWRkTGlzdGVuZXIoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXG4gICAgbGlzdGVuZXI6IEZ1bmN0aW9uIHwgV3JhcHBlZEZ1bmN0aW9uXG4gICk6IHRoaXMge1xuICAgIHJldHVybiB0aGlzLl9hZGRMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyLCBmYWxzZSk7XG4gIH1cblxuICAvKipcbiAgICogU3luY2hyb25vdXNseSBjYWxscyBlYWNoIG9mIHRoZSBsaXN0ZW5lcnMgcmVnaXN0ZXJlZCBmb3IgdGhlIGV2ZW50IG5hbWVkXG4gICAqIGV2ZW50TmFtZSwgaW4gdGhlIG9yZGVyIHRoZXkgd2VyZSByZWdpc3RlcmVkLCBwYXNzaW5nIHRoZSBzdXBwbGllZFxuICAgKiBhcmd1bWVudHMgdG8gZWFjaC5cbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBldmVudCBoYWQgbGlzdGVuZXJzLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIHB1YmxpYyBlbWl0KGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sLCAuLi5hcmdzOiBhbnlbXSk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLl9ldmVudHMuaGFzKGV2ZW50TmFtZSkpIHtcbiAgICAgIGlmIChcbiAgICAgICAgZXZlbnROYW1lID09PSBcImVycm9yXCIgJiZcbiAgICAgICAgdGhpcy5fZXZlbnRzLmdldChFdmVudEVtaXR0ZXIuZXJyb3JNb25pdG9yKVxuICAgICAgKSB7XG4gICAgICAgIHRoaXMuZW1pdChFdmVudEVtaXR0ZXIuZXJyb3JNb25pdG9yLCAuLi5hcmdzKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGxpc3RlbmVycyA9ICh0aGlzLl9ldmVudHMuZ2V0KGV2ZW50TmFtZSkgYXMgRnVuY3Rpb25bXSkuc2xpY2UoKTsgLy8gV2UgY29weSB3aXRoIHNsaWNlKCkgc28gYXJyYXkgaXMgbm90IG11dGF0ZWQgZHVyaW5nIGVtaXRcbiAgICAgIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgbGlzdGVuZXJzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIHRoaXMuZW1pdChcImVycm9yXCIsIGVycik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSBpZiAoZXZlbnROYW1lID09PSBcImVycm9yXCIpIHtcbiAgICAgIGlmICh0aGlzLl9ldmVudHMuZ2V0KEV2ZW50RW1pdHRlci5lcnJvck1vbml0b3IpKSB7XG4gICAgICAgIHRoaXMuZW1pdChFdmVudEVtaXR0ZXIuZXJyb3JNb25pdG9yLCAuLi5hcmdzKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGVyck1zZyA9IGFyZ3MubGVuZ3RoID4gMCA/IGFyZ3NbMF0gOiBFcnJvcihcIlVuaGFuZGxlZCBlcnJvci5cIik7XG4gICAgICB0aHJvdyBlcnJNc2c7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGFycmF5IGxpc3RpbmcgdGhlIGV2ZW50cyBmb3Igd2hpY2ggdGhlIGVtaXR0ZXIgaGFzXG4gICAqIHJlZ2lzdGVyZWQgbGlzdGVuZXJzLlxuICAgKi9cbiAgcHVibGljIGV2ZW50TmFtZXMoKTogW3N0cmluZyB8IHN5bWJvbF0ge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuX2V2ZW50cy5rZXlzKCkpIGFzIFtzdHJpbmcgfCBzeW1ib2xdO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGN1cnJlbnQgbWF4IGxpc3RlbmVyIHZhbHVlIGZvciB0aGUgRXZlbnRFbWl0dGVyIHdoaWNoIGlzXG4gICAqIGVpdGhlciBzZXQgYnkgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMobikgb3IgZGVmYXVsdHMgdG9cbiAgICogRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMuXG4gICAqL1xuICBwdWJsaWMgZ2V0TWF4TGlzdGVuZXJzKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMubWF4TGlzdGVuZXJzIHx8IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG51bWJlciBvZiBsaXN0ZW5lcnMgbGlzdGVuaW5nIHRvIHRoZSBldmVudCBuYW1lZFxuICAgKiBldmVudE5hbWUuXG4gICAqL1xuICBwdWJsaWMgbGlzdGVuZXJDb3VudChldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbCk6IG51bWJlciB7XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5oYXMoZXZlbnROYW1lKSkge1xuICAgICAgcmV0dXJuICh0aGlzLl9ldmVudHMuZ2V0KGV2ZW50TmFtZSkgYXMgRnVuY3Rpb25bXSkubGVuZ3RoO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9saXN0ZW5lcnMoXG4gICAgdGFyZ2V0OiBFdmVudEVtaXR0ZXIsXG4gICAgZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXG4gICAgdW53cmFwOiBib29sZWFuXG4gICk6IEZ1bmN0aW9uW10ge1xuICAgIGlmICghdGFyZ2V0Ll9ldmVudHMuaGFzKGV2ZW50TmFtZSkpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgY29uc3QgZXZlbnRMaXN0ZW5lcnM6IEZ1bmN0aW9uW10gPSB0YXJnZXQuX2V2ZW50cy5nZXQoXG4gICAgICBldmVudE5hbWVcbiAgICApIGFzIEZ1bmN0aW9uW107XG5cbiAgICByZXR1cm4gdW53cmFwXG4gICAgICA/IHRoaXMudW53cmFwTGlzdGVuZXJzKGV2ZW50TGlzdGVuZXJzKVxuICAgICAgOiBldmVudExpc3RlbmVycy5zbGljZSgwKTtcbiAgfVxuXG4gIHByaXZhdGUgdW53cmFwTGlzdGVuZXJzKGFycjogRnVuY3Rpb25bXSk6IEZ1bmN0aW9uW10ge1xuICAgIGNvbnN0IHVud3JhcHBlZExpc3RlbmVyczogRnVuY3Rpb25bXSA9IG5ldyBBcnJheShhcnIubGVuZ3RoKSBhcyBGdW5jdGlvbltdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgICAgdW53cmFwcGVkTGlzdGVuZXJzW2ldID0gKGFycltpXSBhcyBhbnkpW1wibGlzdGVuZXJcIl0gfHwgYXJyW2ldO1xuICAgIH1cbiAgICByZXR1cm4gdW53cmFwcGVkTGlzdGVuZXJzO1xuICB9XG5cbiAgLyoqIFJldHVybnMgYSBjb3B5IG9mIHRoZSBhcnJheSBvZiBsaXN0ZW5lcnMgZm9yIHRoZSBldmVudCBuYW1lZCBldmVudE5hbWUuKi9cbiAgcHVibGljIGxpc3RlbmVycyhldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbCk6IEZ1bmN0aW9uW10ge1xuICAgIHJldHVybiB0aGlzLl9saXN0ZW5lcnModGhpcywgZXZlbnROYW1lLCB0cnVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgY29weSBvZiB0aGUgYXJyYXkgb2YgbGlzdGVuZXJzIGZvciB0aGUgZXZlbnQgbmFtZWQgZXZlbnROYW1lLFxuICAgKiBpbmNsdWRpbmcgYW55IHdyYXBwZXJzIChzdWNoIGFzIHRob3NlIGNyZWF0ZWQgYnkgLm9uY2UoKSkuXG4gICAqL1xuICBwdWJsaWMgcmF3TGlzdGVuZXJzKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sXG4gICk6IEFycmF5PEZ1bmN0aW9uIHwgV3JhcHBlZEZ1bmN0aW9uPiB7XG4gICAgcmV0dXJuIHRoaXMuX2xpc3RlbmVycyh0aGlzLCBldmVudE5hbWUsIGZhbHNlKTtcbiAgfVxuXG4gIC8qKiBBbGlhcyBmb3IgZW1pdHRlci5yZW1vdmVMaXN0ZW5lcigpLiAqL1xuICBwdWJsaWMgb2ZmKGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sLCBsaXN0ZW5lcjogRnVuY3Rpb24pOiB0aGlzIHtcbiAgICByZXR1cm4gdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoZSBsaXN0ZW5lciBmdW5jdGlvbiB0byB0aGUgZW5kIG9mIHRoZSBsaXN0ZW5lcnMgYXJyYXkgZm9yIHRoZSBldmVudFxuICAgKiAgbmFtZWQgZXZlbnROYW1lLiBObyBjaGVja3MgYXJlIG1hZGUgdG8gc2VlIGlmIHRoZSBsaXN0ZW5lciBoYXMgYWxyZWFkeVxuICAgKiBiZWVuIGFkZGVkLiBNdWx0aXBsZSBjYWxscyBwYXNzaW5nIHRoZSBzYW1lIGNvbWJpbmF0aW9uIG9mIGV2ZW50TmFtZSBhbmRcbiAgICogbGlzdGVuZXIgd2lsbCByZXN1bHQgaW4gdGhlIGxpc3RlbmVyIGJlaW5nIGFkZGVkLCBhbmQgY2FsbGVkLCBtdWx0aXBsZVxuICAgKiB0aW1lcy5cbiAgICovXG4gIHB1YmxpYyBvbihcbiAgICBldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbCxcbiAgICBsaXN0ZW5lcjogRnVuY3Rpb24gfCBXcmFwcGVkRnVuY3Rpb25cbiAgKTogdGhpcyB7XG4gICAgcmV0dXJuIHRoaXMuYWRkTGlzdGVuZXIoZXZlbnROYW1lLCBsaXN0ZW5lcik7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIG9uZS10aW1lIGxpc3RlbmVyIGZ1bmN0aW9uIGZvciB0aGUgZXZlbnQgbmFtZWQgZXZlbnROYW1lLiBUaGUgbmV4dFxuICAgKiB0aW1lIGV2ZW50TmFtZSBpcyB0cmlnZ2VyZWQsIHRoaXMgbGlzdGVuZXIgaXMgcmVtb3ZlZCBhbmQgdGhlbiBpbnZva2VkLlxuICAgKi9cbiAgcHVibGljIG9uY2UoZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsIGxpc3RlbmVyOiBGdW5jdGlvbik6IHRoaXMge1xuICAgIGNvbnN0IHdyYXBwZWQ6IFdyYXBwZWRGdW5jdGlvbiA9IHRoaXMub25jZVdyYXAoZXZlbnROYW1lLCBsaXN0ZW5lcik7XG4gICAgdGhpcy5vbihldmVudE5hbWUsIHdyYXBwZWQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gV3JhcHBlZCBmdW5jdGlvbiB0aGF0IGNhbGxzIEV2ZW50RW1pdHRlci5yZW1vdmVMaXN0ZW5lcihldmVudE5hbWUsIHNlbGYpIG9uIGV4ZWN1dGlvbi5cbiAgcHJpdmF0ZSBvbmNlV3JhcChcbiAgICBldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbCxcbiAgICBsaXN0ZW5lcjogRnVuY3Rpb25cbiAgKTogV3JhcHBlZEZ1bmN0aW9uIHtcbiAgICBjb25zdCB3cmFwcGVyID0gZnVuY3Rpb24gKFxuICAgICAgdGhpczoge1xuICAgICAgICBldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbDtcbiAgICAgICAgbGlzdGVuZXI6IEZ1bmN0aW9uO1xuICAgICAgICByYXdMaXN0ZW5lcjogRnVuY3Rpb247XG4gICAgICAgIGNvbnRleHQ6IEV2ZW50RW1pdHRlcjtcbiAgICAgIH0sXG4gICAgICAuLi5hcmdzOiBhbnlbXSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICApOiB2b2lkIHtcbiAgICAgIHRoaXMuY29udGV4dC5yZW1vdmVMaXN0ZW5lcih0aGlzLmV2ZW50TmFtZSwgdGhpcy5yYXdMaXN0ZW5lcik7XG4gICAgICB0aGlzLmxpc3RlbmVyLmFwcGx5KHRoaXMuY29udGV4dCwgYXJncyk7XG4gICAgfTtcbiAgICBjb25zdCB3cmFwcGVyQ29udGV4dCA9IHtcbiAgICAgIGV2ZW50TmFtZTogZXZlbnROYW1lLFxuICAgICAgbGlzdGVuZXI6IGxpc3RlbmVyLFxuICAgICAgcmF3TGlzdGVuZXI6ICh3cmFwcGVyIGFzIHVua25vd24pIGFzIFdyYXBwZWRGdW5jdGlvbixcbiAgICAgIGNvbnRleHQ6IHRoaXMsXG4gICAgfTtcbiAgICBjb25zdCB3cmFwcGVkID0gKHdyYXBwZXIuYmluZChcbiAgICAgIHdyYXBwZXJDb250ZXh0XG4gICAgKSBhcyB1bmtub3duKSBhcyBXcmFwcGVkRnVuY3Rpb247XG4gICAgd3JhcHBlckNvbnRleHQucmF3TGlzdGVuZXIgPSB3cmFwcGVkO1xuICAgIHdyYXBwZWQubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgICByZXR1cm4gd3JhcHBlZCBhcyBXcmFwcGVkRnVuY3Rpb247XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0aGUgbGlzdGVuZXIgZnVuY3Rpb24gdG8gdGhlIGJlZ2lubmluZyBvZiB0aGUgbGlzdGVuZXJzIGFycmF5IGZvciB0aGVcbiAgICogIGV2ZW50IG5hbWVkIGV2ZW50TmFtZS4gTm8gY2hlY2tzIGFyZSBtYWRlIHRvIHNlZSBpZiB0aGUgbGlzdGVuZXIgaGFzXG4gICAqIGFscmVhZHkgYmVlbiBhZGRlZC4gTXVsdGlwbGUgY2FsbHMgcGFzc2luZyB0aGUgc2FtZSBjb21iaW5hdGlvbiBvZlxuICAgKiBldmVudE5hbWUgYW5kIGxpc3RlbmVyIHdpbGwgcmVzdWx0IGluIHRoZSBsaXN0ZW5lciBiZWluZyBhZGRlZCwgYW5kXG4gICAqIGNhbGxlZCwgbXVsdGlwbGUgdGltZXMuXG4gICAqL1xuICBwdWJsaWMgcHJlcGVuZExpc3RlbmVyKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sLFxuICAgIGxpc3RlbmVyOiBGdW5jdGlvbiB8IFdyYXBwZWRGdW5jdGlvblxuICApOiB0aGlzIHtcbiAgICByZXR1cm4gdGhpcy5fYWRkTGlzdGVuZXIoZXZlbnROYW1lLCBsaXN0ZW5lciwgdHJ1ZSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIG9uZS10aW1lIGxpc3RlbmVyIGZ1bmN0aW9uIGZvciB0aGUgZXZlbnQgbmFtZWQgZXZlbnROYW1lIHRvIHRoZVxuICAgKiBiZWdpbm5pbmcgb2YgdGhlIGxpc3RlbmVycyBhcnJheS4gVGhlIG5leHQgdGltZSBldmVudE5hbWUgaXMgdHJpZ2dlcmVkLFxuICAgKiB0aGlzIGxpc3RlbmVyIGlzIHJlbW92ZWQsIGFuZCB0aGVuIGludm9rZWQuXG4gICAqL1xuICBwdWJsaWMgcHJlcGVuZE9uY2VMaXN0ZW5lcihcbiAgICBldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbCxcbiAgICBsaXN0ZW5lcjogRnVuY3Rpb25cbiAgKTogdGhpcyB7XG4gICAgY29uc3Qgd3JhcHBlZDogV3JhcHBlZEZ1bmN0aW9uID0gdGhpcy5vbmNlV3JhcChldmVudE5hbWUsIGxpc3RlbmVyKTtcbiAgICB0aGlzLnByZXBlbmRMaXN0ZW5lcihldmVudE5hbWUsIHdyYXBwZWQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFJlbW92ZXMgYWxsIGxpc3RlbmVycywgb3IgdGhvc2Ugb2YgdGhlIHNwZWNpZmllZCBldmVudE5hbWUuICovXG4gIHB1YmxpYyByZW1vdmVBbGxMaXN0ZW5lcnMoZXZlbnROYW1lPzogc3RyaW5nIHwgc3ltYm9sKTogdGhpcyB7XG4gICAgaWYgKHRoaXMuX2V2ZW50cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpZiAoZXZlbnROYW1lICYmIHRoaXMuX2V2ZW50cy5oYXMoZXZlbnROYW1lKSkge1xuICAgICAgY29uc3QgbGlzdGVuZXJzID0gKHRoaXMuX2V2ZW50cy5nZXQoZXZlbnROYW1lKSBhcyBBcnJheTxcbiAgICAgICAgRnVuY3Rpb24gfCBXcmFwcGVkRnVuY3Rpb25cbiAgICAgID4pLnNsaWNlKCk7IC8vIENyZWF0ZSBhIGNvcHk7IFdlIHVzZSBpdCBBRlRFUiBpdCdzIGRlbGV0ZWQuXG4gICAgICB0aGlzLl9ldmVudHMuZGVsZXRlKGV2ZW50TmFtZSk7XG4gICAgICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIGxpc3RlbmVycykge1xuICAgICAgICB0aGlzLmVtaXQoXCJyZW1vdmVMaXN0ZW5lclwiLCBldmVudE5hbWUsIGxpc3RlbmVyKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZXZlbnRMaXN0OiBbc3RyaW5nIHwgc3ltYm9sXSA9IHRoaXMuZXZlbnROYW1lcygpO1xuICAgICAgZXZlbnRMaXN0Lm1hcCgodmFsdWU6IHN0cmluZyB8IHN5bWJvbCkgPT4ge1xuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyh2YWx1ZSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIHRoZSBzcGVjaWZpZWQgbGlzdGVuZXIgZnJvbSB0aGUgbGlzdGVuZXIgYXJyYXkgZm9yIHRoZSBldmVudFxuICAgKiBuYW1lZCBldmVudE5hbWUuXG4gICAqL1xuICBwdWJsaWMgcmVtb3ZlTGlzdGVuZXIoZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsIGxpc3RlbmVyOiBGdW5jdGlvbik6IHRoaXMge1xuICAgIGlmICh0aGlzLl9ldmVudHMuaGFzKGV2ZW50TmFtZSkpIHtcbiAgICAgIGNvbnN0IGFycjpcbiAgICAgICAgfCBBcnJheTxGdW5jdGlvbiB8IFdyYXBwZWRGdW5jdGlvbj5cbiAgICAgICAgfCB1bmRlZmluZWQgPSB0aGlzLl9ldmVudHMuZ2V0KGV2ZW50TmFtZSk7XG5cbiAgICAgIGFzc2VydChhcnIpO1xuXG4gICAgICBsZXQgbGlzdGVuZXJJbmRleCA9IC0xO1xuICAgICAgZm9yIChsZXQgaSA9IGFyci5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAvLyBhcnJbaV1bXCJsaXN0ZW5lclwiXSBpcyB0aGUgcmVmZXJlbmNlIHRvIHRoZSBsaXN0ZW5lciBpbnNpZGUgYSBib3VuZCAnb25jZScgd3JhcHBlclxuICAgICAgICBpZiAoXG4gICAgICAgICAgYXJyW2ldID09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGFycltpXSAmJiAoYXJyW2ldIGFzIFdyYXBwZWRGdW5jdGlvbilbXCJsaXN0ZW5lclwiXSA9PSBsaXN0ZW5lcilcbiAgICAgICAgKSB7XG4gICAgICAgICAgbGlzdGVuZXJJbmRleCA9IGk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGxpc3RlbmVySW5kZXggPj0gMCkge1xuICAgICAgICBhcnIuc3BsaWNlKGxpc3RlbmVySW5kZXgsIDEpO1xuICAgICAgICB0aGlzLmVtaXQoXCJyZW1vdmVMaXN0ZW5lclwiLCBldmVudE5hbWUsIGxpc3RlbmVyKTtcbiAgICAgICAgaWYgKGFyci5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICB0aGlzLl9ldmVudHMuZGVsZXRlKGV2ZW50TmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnNcbiAgICogYXJlIGFkZGVkIGZvciBhIHBhcnRpY3VsYXIgZXZlbnQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB0aGF0IGhlbHBzXG4gICAqIGZpbmRpbmcgbWVtb3J5IGxlYWtzLiBPYnZpb3VzbHksIG5vdCBhbGwgZXZlbnRzIHNob3VsZCBiZSBsaW1pdGVkIHRvIGp1c3RcbiAgICogMTAgbGlzdGVuZXJzLiBUaGUgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSBtZXRob2QgYWxsb3dzIHRoZSBsaW1pdCB0byBiZVxuICAgKiBtb2RpZmllZCBmb3IgdGhpcyBzcGVjaWZpYyBFdmVudEVtaXR0ZXIgaW5zdGFuY2UuIFRoZSB2YWx1ZSBjYW4gYmUgc2V0IHRvXG4gICAqIEluZmluaXR5IChvciAwKSB0byBpbmRpY2F0ZSBhbiB1bmxpbWl0ZWQgbnVtYmVyIG9mIGxpc3RlbmVycy5cbiAgICovXG4gIHB1YmxpYyBzZXRNYXhMaXN0ZW5lcnMobjogbnVtYmVyKTogdGhpcyB7XG4gICAgdmFsaWRhdGVJbnRlZ2VyUmFuZ2UobiwgXCJtYXhMaXN0ZW5lcnNcIiwgMCk7XG4gICAgdGhpcy5tYXhMaXN0ZW5lcnMgPSBuO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cbmV4cG9ydCB7IEV2ZW50RW1pdHRlciB9O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBQcm9taXNlIHRoYXQgaXMgZnVsZmlsbGVkIHdoZW4gdGhlIEV2ZW50RW1pdHRlciBlbWl0cyB0aGUgZ2l2ZW5cbiAqIGV2ZW50IG9yIHRoYXQgaXMgcmVqZWN0ZWQgd2hlbiB0aGUgRXZlbnRFbWl0dGVyIGVtaXRzICdlcnJvcicuIFRoZSBQcm9taXNlXG4gKiB3aWxsIHJlc29sdmUgd2l0aCBhbiBhcnJheSBvZiBhbGwgdGhlIGFyZ3VtZW50cyBlbWl0dGVkIHRvIHRoZSBnaXZlbiBldmVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9uY2UoXG4gIGVtaXR0ZXI6IEV2ZW50RW1pdHRlciB8IEV2ZW50VGFyZ2V0LFxuICBuYW1lOiBzdHJpbmdcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbik6IFByb21pc2U8YW55W10+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBpZiAoZW1pdHRlciBpbnN0YW5jZW9mIEV2ZW50VGFyZ2V0KSB7XG4gICAgICAvLyBFdmVudFRhcmdldCBkb2VzIG5vdCBoYXZlIGBlcnJvcmAgZXZlbnQgc2VtYW50aWNzIGxpa2UgTm9kZVxuICAgICAgLy8gRXZlbnRFbWl0dGVycywgd2UgZG8gbm90IGxpc3RlbiB0byBgZXJyb3JgIGV2ZW50cyBoZXJlLlxuICAgICAgZW1pdHRlci5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICBuYW1lLFxuICAgICAgICAoLi4uYXJncykgPT4ge1xuICAgICAgICAgIHJlc29sdmUoYXJncyk7XG4gICAgICAgIH0sXG4gICAgICAgIHsgb25jZTogdHJ1ZSwgcGFzc2l2ZTogZmFsc2UsIGNhcHR1cmU6IGZhbHNlIH1cbiAgICAgICk7XG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmIChlbWl0dGVyIGluc3RhbmNlb2YgRXZlbnRFbWl0dGVyKSB7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgICAgY29uc3QgZXZlbnRMaXN0ZW5lciA9ICguLi5hcmdzOiBhbnlbXSk6IHZvaWQgPT4ge1xuICAgICAgICBpZiAoZXJyb3JMaXN0ZW5lciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgZW1pdHRlci5yZW1vdmVMaXN0ZW5lcihcImVycm9yXCIsIGVycm9yTGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICAgIHJlc29sdmUoYXJncyk7XG4gICAgICB9O1xuICAgICAgbGV0IGVycm9yTGlzdGVuZXI6IEZ1bmN0aW9uO1xuXG4gICAgICAvLyBBZGRpbmcgYW4gZXJyb3IgbGlzdGVuZXIgaXMgbm90IG9wdGlvbmFsIGJlY2F1c2VcbiAgICAgIC8vIGlmIGFuIGVycm9yIGlzIHRocm93biBvbiBhbiBldmVudCBlbWl0dGVyIHdlIGNhbm5vdFxuICAgICAgLy8gZ3VhcmFudGVlIHRoYXQgdGhlIGFjdHVhbCBldmVudCB3ZSBhcmUgd2FpdGluZyB3aWxsXG4gICAgICAvLyBiZSBmaXJlZC4gVGhlIHJlc3VsdCBjb3VsZCBiZSBhIHNpbGVudCB3YXkgdG8gY3JlYXRlXG4gICAgICAvLyBtZW1vcnkgb3IgZmlsZSBkZXNjcmlwdG9yIGxlYWtzLCB3aGljaCBpcyBzb21ldGhpbmdcbiAgICAgIC8vIHdlIHNob3VsZCBhdm9pZC5cbiAgICAgIGlmIChuYW1lICE9PSBcImVycm9yXCIpIHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICAgICAgZXJyb3JMaXN0ZW5lciA9IChlcnI6IGFueSk6IHZvaWQgPT4ge1xuICAgICAgICAgIGVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIobmFtZSwgZXZlbnRMaXN0ZW5lcik7XG4gICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgIH07XG5cbiAgICAgICAgZW1pdHRlci5vbmNlKFwiZXJyb3JcIiwgZXJyb3JMaXN0ZW5lcik7XG4gICAgICB9XG5cbiAgICAgIGVtaXR0ZXIub25jZShuYW1lLCBldmVudExpc3RlbmVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH0pO1xufVxuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuZnVuY3Rpb24gY3JlYXRlSXRlclJlc3VsdCh2YWx1ZTogYW55LCBkb25lOiBib29sZWFuKTogSXRlcmF0b3JSZXN1bHQ8YW55PiB7XG4gIHJldHVybiB7IHZhbHVlLCBkb25lIH07XG59XG5cbmludGVyZmFjZSBBc3luY0ludGVyYWJsZSB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIG5leHQoKTogUHJvbWlzZTxJdGVyYXRvclJlc3VsdDxhbnksIGFueT4+O1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICByZXR1cm4oKTogUHJvbWlzZTxJdGVyYXRvclJlc3VsdDxhbnksIGFueT4+O1xuICB0aHJvdyhlcnI6IEVycm9yKTogdm9pZDtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSgpOiBhbnk7XG59XG5cbi8qKlxuICogUmV0dXJucyBhbiBBc3luY0l0ZXJhdG9yIHRoYXQgaXRlcmF0ZXMgZXZlbnROYW1lIGV2ZW50cy4gSXQgd2lsbCB0aHJvdyBpZlxuICogdGhlIEV2ZW50RW1pdHRlciBlbWl0cyAnZXJyb3InLiBJdCByZW1vdmVzIGFsbCBsaXN0ZW5lcnMgd2hlbiBleGl0aW5nIHRoZVxuICogbG9vcC4gVGhlIHZhbHVlIHJldHVybmVkIGJ5IGVhY2ggaXRlcmF0aW9uIGlzIGFuIGFycmF5IGNvbXBvc2VkIG9mIHRoZVxuICogZW1pdHRlZCBldmVudCBhcmd1bWVudHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvbihcbiAgZW1pdHRlcjogRXZlbnRFbWl0dGVyLFxuICBldmVudDogc3RyaW5nIHwgc3ltYm9sXG4pOiBBc3luY0ludGVyYWJsZSB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIGNvbnN0IHVuY29uc3VtZWRFdmVudFZhbHVlczogYW55W10gPSBbXTtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgY29uc3QgdW5jb25zdW1lZFByb21pc2VzOiBhbnlbXSA9IFtdO1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICBsZXQgZXJyb3I6IEVycm9yIHwgbnVsbCA9IG51bGw7XG4gIGxldCBmaW5pc2hlZCA9IGZhbHNlO1xuXG4gIGNvbnN0IGl0ZXJhdG9yID0ge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgbmV4dCgpOiBQcm9taXNlPEl0ZXJhdG9yUmVzdWx0PGFueT4+IHtcbiAgICAgIC8vIEZpcnN0LCB3ZSBjb25zdW1lIGFsbCB1bnJlYWQgZXZlbnRzXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgICAgY29uc3QgdmFsdWU6IGFueSA9IHVuY29uc3VtZWRFdmVudFZhbHVlcy5zaGlmdCgpO1xuICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY3JlYXRlSXRlclJlc3VsdCh2YWx1ZSwgZmFsc2UpKTtcbiAgICAgIH1cblxuICAgICAgLy8gVGhlbiB3ZSBlcnJvciwgaWYgYW4gZXJyb3IgaGFwcGVuZWRcbiAgICAgIC8vIFRoaXMgaGFwcGVucyBvbmUgdGltZSBpZiBhdCBhbGwsIGJlY2F1c2UgYWZ0ZXIgJ2Vycm9yJ1xuICAgICAgLy8gd2Ugc3RvcCBsaXN0ZW5pbmdcbiAgICAgIGlmIChlcnJvcikge1xuICAgICAgICBjb25zdCBwOiBQcm9taXNlPG5ldmVyPiA9IFByb21pc2UucmVqZWN0KGVycm9yKTtcbiAgICAgICAgLy8gT25seSB0aGUgZmlyc3QgZWxlbWVudCBlcnJvcnNcbiAgICAgICAgZXJyb3IgPSBudWxsO1xuICAgICAgICByZXR1cm4gcDtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhlIGl0ZXJhdG9yIGlzIGZpbmlzaGVkLCByZXNvbHZlIHRvIGRvbmVcbiAgICAgIGlmIChmaW5pc2hlZCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNyZWF0ZUl0ZXJSZXN1bHQodW5kZWZpbmVkLCB0cnVlKSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFdhaXQgdW50aWwgYW4gZXZlbnQgaGFwcGVuc1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgdW5jb25zdW1lZFByb21pc2VzLnB1c2goeyByZXNvbHZlLCByZWplY3QgfSk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICByZXR1cm4oKTogUHJvbWlzZTxJdGVyYXRvclJlc3VsdDxhbnk+PiB7XG4gICAgICBlbWl0dGVyLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBldmVudEhhbmRsZXIpO1xuICAgICAgZW1pdHRlci5yZW1vdmVMaXN0ZW5lcihcImVycm9yXCIsIGVycm9ySGFuZGxlcik7XG4gICAgICBmaW5pc2hlZCA9IHRydWU7XG5cbiAgICAgIGZvciAoY29uc3QgcHJvbWlzZSBvZiB1bmNvbnN1bWVkUHJvbWlzZXMpIHtcbiAgICAgICAgcHJvbWlzZS5yZXNvbHZlKGNyZWF0ZUl0ZXJSZXN1bHQodW5kZWZpbmVkLCB0cnVlKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY3JlYXRlSXRlclJlc3VsdCh1bmRlZmluZWQsIHRydWUpKTtcbiAgICB9LFxuXG4gICAgdGhyb3coZXJyOiBFcnJvcik6IHZvaWQge1xuICAgICAgZXJyb3IgPSBlcnI7XG4gICAgICBlbWl0dGVyLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBldmVudEhhbmRsZXIpO1xuICAgICAgZW1pdHRlci5yZW1vdmVMaXN0ZW5lcihcImVycm9yXCIsIGVycm9ySGFuZGxlcik7XG4gICAgfSxcblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSgpOiBhbnkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgfTtcblxuICBlbWl0dGVyLm9uKGV2ZW50LCBldmVudEhhbmRsZXIpO1xuICBlbWl0dGVyLm9uKFwiZXJyb3JcIiwgZXJyb3JIYW5kbGVyKTtcblxuICByZXR1cm4gaXRlcmF0b3I7XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgZnVuY3Rpb24gZXZlbnRIYW5kbGVyKC4uLmFyZ3M6IGFueVtdKTogdm9pZCB7XG4gICAgY29uc3QgcHJvbWlzZSA9IHVuY29uc3VtZWRQcm9taXNlcy5zaGlmdCgpO1xuICAgIGlmIChwcm9taXNlKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoY3JlYXRlSXRlclJlc3VsdChhcmdzLCBmYWxzZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB1bmNvbnN1bWVkRXZlbnRWYWx1ZXMucHVzaChhcmdzKTtcbiAgICB9XG4gIH1cblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICBmdW5jdGlvbiBlcnJvckhhbmRsZXIoZXJyOiBhbnkpOiB2b2lkIHtcbiAgICBmaW5pc2hlZCA9IHRydWU7XG5cbiAgICBjb25zdCB0b0Vycm9yID0gdW5jb25zdW1lZFByb21pc2VzLnNoaWZ0KCk7XG4gICAgaWYgKHRvRXJyb3IpIHtcbiAgICAgIHRvRXJyb3IucmVqZWN0KGVycik7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRoZSBuZXh0IHRpbWUgd2UgY2FsbCBuZXh0KClcbiAgICAgIGVycm9yID0gZXJyO1xuICAgIH1cblxuICAgIGl0ZXJhdG9yLnJldHVybigpO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUFBMEUsQUFBMUUsd0VBQTBFO0FBQzFFLEVBQXlFLEFBQXpFLHVFQUF5RTtBQUN6RSxFQUFzRCxBQUF0RCxvREFBc0Q7QUFDdEQsRUFBRTtBQUNGLEVBQTBFLEFBQTFFLHdFQUEwRTtBQUMxRSxFQUFnRSxBQUFoRSw4REFBZ0U7QUFDaEUsRUFBc0UsQUFBdEUsb0VBQXNFO0FBQ3RFLEVB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
