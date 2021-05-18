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
import { assert } from "../_util/assert.ts";
class EventEmitter {
    static defaultMaxListeners = 10;
    static errorMonitor = Symbol("events.errorMonitor");
    maxListeners;
    _events;
    constructor(){
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
                listener
            ]);
        }
        const max = this.getMaxListeners();
        if (max > 0 && this.listenerCount(eventName) > max) {
            const warning = new Error(`Possible EventEmitter memory leak detected.\n         ${this.listenerCount(eventName)} ${eventName.toString()} listeners.\n         Use emitter.setMaxListeners() to increase limit`);
            warning.name = "MaxListenersExceededWarning";
            console.warn(warning);
        }
        return this;
    }
    /** Alias for emitter.on(eventName, listener). */ addListener(eventName, listener) {
        return this._addListener(eventName, listener, false);
    }
    /**
   * Synchronously calls each of the listeners registered for the event named
   * eventName, in the order they were registered, passing the supplied
   * arguments to each.
   * @return true if the event had listeners, false otherwise
   */ // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emit(eventName, ...args) {
        if (this._events.has(eventName)) {
            if (eventName === "error" && this._events.get(EventEmitter.errorMonitor)) {
                this.emit(EventEmitter.errorMonitor, ...args);
            }
            const listeners = this._events.get(eventName).slice(); // We copy with slice() so array is not mutated during emit
            for (const listener of listeners){
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
        return unwrap ? this.unwrapListeners(eventListeners) : eventListeners.slice(0);
    }
    unwrapListeners(arr) {
        const unwrappedListeners = new Array(arr.length);
        for(let i = 0; i < arr.length; i++){
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            unwrappedListeners[i] = arr[i]["listener"] || arr[i];
        }
        return unwrappedListeners;
    }
    /** Returns a copy of the array of listeners for the event named eventName.*/ listeners(eventName) {
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
        const wrapper = function(// eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...args) {
            this.context.removeListener(this.eventName, this.rawListener);
            this.listener.apply(this.context, args);
        };
        const wrapperContext = {
            eventName: eventName,
            listener: listener,
            rawListener: wrapper,
            context: this
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
    /** Removes all listeners, or those of the specified eventName. */ removeAllListeners(eventName) {
        if (this._events === undefined) {
            return this;
        }
        if (eventName) {
            if (this._events.has(eventName)) {
                const listeners = this._events.get(eventName).slice(); // Create a copy; We use it AFTER it's deleted.
                this._events.delete(eventName);
                for (const listener of listeners){
                    this.emit("removeListener", eventName, listener);
                }
            }
        } else {
            const eventList = this.eventNames();
            eventList.map((value)=>{
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
            for(let i = arr.length - 1; i >= 0; i--){
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
    return new Promise((resolve, reject)=>{
        if (emitter instanceof EventTarget) {
            // EventTarget does not have `error` event semantics like Node
            // EventEmitters, we do not listen to `error` events here.
            emitter.addEventListener(name, (...args)=>{
                resolve(args);
            }, {
                once: true,
                passive: false,
                capture: false
            });
            return;
        } else if (emitter instanceof EventEmitter) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const eventListener = (...args)=>{
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
                errorListener = (err)=>{
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
        done
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
        next () {
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
            return new Promise(function(resolve, reject) {
                unconsumedPromises.push({
                    resolve,
                    reject
                });
            });
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return () {
            emitter.removeListener(event, eventHandler);
            emitter.removeListener("error", errorHandler);
            finished = true;
            for (const promise of unconsumedPromises){
                promise.resolve(createIterResult(undefined, true));
            }
            return Promise.resolve(createIterResult(undefined, true));
        },
        throw (err) {
            error = err;
            emitter.removeListener(event, eventHandler);
            emitter.removeListener("error", errorHandler);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [Symbol.asyncIterator] () {
            return this;
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxodHRwczovL2Rlbm8ubGFuZC9zdGRAMC42Ni4wL25vZGUvZXZlbnRzLnRzPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIwIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gQ29weXJpZ2h0IChjKSAyMDE5IERlbm9saWJzIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCB7IHZhbGlkYXRlSW50ZWdlclJhbmdlIH0gZnJvbSBcIi4vdXRpbC50c1wiO1xuaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcIi4uL191dGlsL2Fzc2VydC50c1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFdyYXBwZWRGdW5jdGlvbiBleHRlbmRzIEZ1bmN0aW9uIHtcbiAgbGlzdGVuZXI6IEZ1bmN0aW9uO1xufVxuXG4vKipcbiAqIFNlZSBhbHNvIGh0dHBzOi8vbm9kZWpzLm9yZy9hcGkvZXZlbnRzLmh0bWxcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRXZlbnRFbWl0dGVyIHtcbiAgcHVibGljIHN0YXRpYyBkZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG4gIHB1YmxpYyBzdGF0aWMgZXJyb3JNb25pdG9yID0gU3ltYm9sKFwiZXZlbnRzLmVycm9yTW9uaXRvclwiKTtcbiAgcHJpdmF0ZSBtYXhMaXN0ZW5lcnM6IG51bWJlciB8IHVuZGVmaW5lZDtcbiAgcHJpdmF0ZSBfZXZlbnRzOiBNYXA8c3RyaW5nIHwgc3ltYm9sLCBBcnJheTxGdW5jdGlvbiB8IFdyYXBwZWRGdW5jdGlvbj4+O1xuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9ldmVudHMgPSBuZXcgTWFwKCk7XG4gIH1cblxuICBwcml2YXRlIF9hZGRMaXN0ZW5lcihcbiAgICBldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbCxcbiAgICBsaXN0ZW5lcjogRnVuY3Rpb24gfCBXcmFwcGVkRnVuY3Rpb24sXG4gICAgcHJlcGVuZDogYm9vbGVhbixcbiAgKTogdGhpcyB7XG4gICAgdGhpcy5lbWl0KFwibmV3TGlzdGVuZXJcIiwgZXZlbnROYW1lLCBsaXN0ZW5lcik7XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5oYXMoZXZlbnROYW1lKSkge1xuICAgICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzLmdldChldmVudE5hbWUpIGFzIEFycmF5PFxuICAgICAgICBGdW5jdGlvbiB8IFdyYXBwZWRGdW5jdGlvblxuICAgICAgPjtcbiAgICAgIGlmIChwcmVwZW5kKSB7XG4gICAgICAgIGxpc3RlbmVycy51bnNoaWZ0KGxpc3RlbmVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fZXZlbnRzLnNldChldmVudE5hbWUsIFtsaXN0ZW5lcl0pO1xuICAgIH1cbiAgICBjb25zdCBtYXggPSB0aGlzLmdldE1heExpc3RlbmVycygpO1xuICAgIGlmIChtYXggPiAwICYmIHRoaXMubGlzdGVuZXJDb3VudChldmVudE5hbWUpID4gbWF4KSB7XG4gICAgICBjb25zdCB3YXJuaW5nID0gbmV3IEVycm9yKFxuICAgICAgICBgUG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSBsZWFrIGRldGVjdGVkLlxuICAgICAgICAgJHt0aGlzLmxpc3RlbmVyQ291bnQoZXZlbnROYW1lKX0gJHtldmVudE5hbWUudG9TdHJpbmcoKX0gbGlzdGVuZXJzLlxuICAgICAgICAgVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXRgLFxuICAgICAgKTtcbiAgICAgIHdhcm5pbmcubmFtZSA9IFwiTWF4TGlzdGVuZXJzRXhjZWVkZWRXYXJuaW5nXCI7XG4gICAgICBjb25zb2xlLndhcm4od2FybmluZyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogQWxpYXMgZm9yIGVtaXR0ZXIub24oZXZlbnROYW1lLCBsaXN0ZW5lcikuICovXG4gIHB1YmxpYyBhZGRMaXN0ZW5lcihcbiAgICBldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbCxcbiAgICBsaXN0ZW5lcjogRnVuY3Rpb24gfCBXcmFwcGVkRnVuY3Rpb24sXG4gICk6IHRoaXMge1xuICAgIHJldHVybiB0aGlzLl9hZGRMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyLCBmYWxzZSk7XG4gIH1cblxuICAvKipcbiAgICogU3luY2hyb25vdXNseSBjYWxscyBlYWNoIG9mIHRoZSBsaXN0ZW5lcnMgcmVnaXN0ZXJlZCBmb3IgdGhlIGV2ZW50IG5hbWVkXG4gICAqIGV2ZW50TmFtZSwgaW4gdGhlIG9yZGVyIHRoZXkgd2VyZSByZWdpc3RlcmVkLCBwYXNzaW5nIHRoZSBzdXBwbGllZFxuICAgKiBhcmd1bWVudHMgdG8gZWFjaC5cbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBldmVudCBoYWQgbGlzdGVuZXJzLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIHB1YmxpYyBlbWl0KGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sLCAuLi5hcmdzOiBhbnlbXSk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLl9ldmVudHMuaGFzKGV2ZW50TmFtZSkpIHtcbiAgICAgIGlmIChcbiAgICAgICAgZXZlbnROYW1lID09PSBcImVycm9yXCIgJiZcbiAgICAgICAgdGhpcy5fZXZlbnRzLmdldChFdmVudEVtaXR0ZXIuZXJyb3JNb25pdG9yKVxuICAgICAgKSB7XG4gICAgICAgIHRoaXMuZW1pdChFdmVudEVtaXR0ZXIuZXJyb3JNb25pdG9yLCAuLi5hcmdzKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGxpc3RlbmVycyA9ICh0aGlzLl9ldmVudHMuZ2V0KGV2ZW50TmFtZSkgYXMgRnVuY3Rpb25bXSkuc2xpY2UoKTsgLy8gV2UgY29weSB3aXRoIHNsaWNlKCkgc28gYXJyYXkgaXMgbm90IG11dGF0ZWQgZHVyaW5nIGVtaXRcbiAgICAgIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgbGlzdGVuZXJzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIHRoaXMuZW1pdChcImVycm9yXCIsIGVycik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSBpZiAoZXZlbnROYW1lID09PSBcImVycm9yXCIpIHtcbiAgICAgIGlmICh0aGlzLl9ldmVudHMuZ2V0KEV2ZW50RW1pdHRlci5lcnJvck1vbml0b3IpKSB7XG4gICAgICAgIHRoaXMuZW1pdChFdmVudEVtaXR0ZXIuZXJyb3JNb25pdG9yLCAuLi5hcmdzKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGVyck1zZyA9IGFyZ3MubGVuZ3RoID4gMCA/IGFyZ3NbMF0gOiBFcnJvcihcIlVuaGFuZGxlZCBlcnJvci5cIik7XG4gICAgICB0aHJvdyBlcnJNc2c7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGFycmF5IGxpc3RpbmcgdGhlIGV2ZW50cyBmb3Igd2hpY2ggdGhlIGVtaXR0ZXIgaGFzXG4gICAqIHJlZ2lzdGVyZWQgbGlzdGVuZXJzLlxuICAgKi9cbiAgcHVibGljIGV2ZW50TmFtZXMoKTogW3N0cmluZyB8IHN5bWJvbF0ge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuX2V2ZW50cy5rZXlzKCkpIGFzIFtzdHJpbmcgfCBzeW1ib2xdO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGN1cnJlbnQgbWF4IGxpc3RlbmVyIHZhbHVlIGZvciB0aGUgRXZlbnRFbWl0dGVyIHdoaWNoIGlzXG4gICAqIGVpdGhlciBzZXQgYnkgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMobikgb3IgZGVmYXVsdHMgdG9cbiAgICogRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMuXG4gICAqL1xuICBwdWJsaWMgZ2V0TWF4TGlzdGVuZXJzKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMubWF4TGlzdGVuZXJzIHx8IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG51bWJlciBvZiBsaXN0ZW5lcnMgbGlzdGVuaW5nIHRvIHRoZSBldmVudCBuYW1lZFxuICAgKiBldmVudE5hbWUuXG4gICAqL1xuICBwdWJsaWMgbGlzdGVuZXJDb3VudChldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbCk6IG51bWJlciB7XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5oYXMoZXZlbnROYW1lKSkge1xuICAgICAgcmV0dXJuICh0aGlzLl9ldmVudHMuZ2V0KGV2ZW50TmFtZSkgYXMgRnVuY3Rpb25bXSkubGVuZ3RoO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9saXN0ZW5lcnMoXG4gICAgdGFyZ2V0OiBFdmVudEVtaXR0ZXIsXG4gICAgZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXG4gICAgdW53cmFwOiBib29sZWFuLFxuICApOiBGdW5jdGlvbltdIHtcbiAgICBpZiAoIXRhcmdldC5fZXZlbnRzLmhhcyhldmVudE5hbWUpKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIGNvbnN0IGV2ZW50TGlzdGVuZXJzOiBGdW5jdGlvbltdID0gdGFyZ2V0Ll9ldmVudHMuZ2V0KFxuICAgICAgZXZlbnROYW1lLFxuICAgICkgYXMgRnVuY3Rpb25bXTtcblxuICAgIHJldHVybiB1bndyYXBcbiAgICAgID8gdGhpcy51bndyYXBMaXN0ZW5lcnMoZXZlbnRMaXN0ZW5lcnMpXG4gICAgICA6IGV2ZW50TGlzdGVuZXJzLnNsaWNlKDApO1xuICB9XG5cbiAgcHJpdmF0ZSB1bndyYXBMaXN0ZW5lcnMoYXJyOiBGdW5jdGlvbltdKTogRnVuY3Rpb25bXSB7XG4gICAgY29uc3QgdW53cmFwcGVkTGlzdGVuZXJzOiBGdW5jdGlvbltdID0gbmV3IEFycmF5KGFyci5sZW5ndGgpIGFzIEZ1bmN0aW9uW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgICB1bndyYXBwZWRMaXN0ZW5lcnNbaV0gPSAoYXJyW2ldIGFzIGFueSlbXCJsaXN0ZW5lclwiXSB8fCBhcnJbaV07XG4gICAgfVxuICAgIHJldHVybiB1bndyYXBwZWRMaXN0ZW5lcnM7XG4gIH1cblxuICAvKiogUmV0dXJucyBhIGNvcHkgb2YgdGhlIGFycmF5IG9mIGxpc3RlbmVycyBmb3IgdGhlIGV2ZW50IG5hbWVkIGV2ZW50TmFtZS4qL1xuICBwdWJsaWMgbGlzdGVuZXJzKGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sKTogRnVuY3Rpb25bXSB7XG4gICAgcmV0dXJuIHRoaXMuX2xpc3RlbmVycyh0aGlzLCBldmVudE5hbWUsIHRydWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBjb3B5IG9mIHRoZSBhcnJheSBvZiBsaXN0ZW5lcnMgZm9yIHRoZSBldmVudCBuYW1lZCBldmVudE5hbWUsXG4gICAqIGluY2x1ZGluZyBhbnkgd3JhcHBlcnMgKHN1Y2ggYXMgdGhvc2UgY3JlYXRlZCBieSAub25jZSgpKS5cbiAgICovXG4gIHB1YmxpYyByYXdMaXN0ZW5lcnMoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXG4gICk6IEFycmF5PEZ1bmN0aW9uIHwgV3JhcHBlZEZ1bmN0aW9uPiB7XG4gICAgcmV0dXJuIHRoaXMuX2xpc3RlbmVycyh0aGlzLCBldmVudE5hbWUsIGZhbHNlKTtcbiAgfVxuXG4gIC8qKiBBbGlhcyBmb3IgZW1pdHRlci5yZW1vdmVMaXN0ZW5lcigpLiAqL1xuICBwdWJsaWMgb2ZmKGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sLCBsaXN0ZW5lcjogRnVuY3Rpb24pOiB0aGlzIHtcbiAgICByZXR1cm4gdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoZSBsaXN0ZW5lciBmdW5jdGlvbiB0byB0aGUgZW5kIG9mIHRoZSBsaXN0ZW5lcnMgYXJyYXkgZm9yIHRoZSBldmVudFxuICAgKiAgbmFtZWQgZXZlbnROYW1lLiBObyBjaGVja3MgYXJlIG1hZGUgdG8gc2VlIGlmIHRoZSBsaXN0ZW5lciBoYXMgYWxyZWFkeVxuICAgKiBiZWVuIGFkZGVkLiBNdWx0aXBsZSBjYWxscyBwYXNzaW5nIHRoZSBzYW1lIGNvbWJpbmF0aW9uIG9mIGV2ZW50TmFtZSBhbmRcbiAgICogbGlzdGVuZXIgd2lsbCByZXN1bHQgaW4gdGhlIGxpc3RlbmVyIGJlaW5nIGFkZGVkLCBhbmQgY2FsbGVkLCBtdWx0aXBsZVxuICAgKiB0aW1lcy5cbiAgICovXG4gIHB1YmxpYyBvbihcbiAgICBldmVudE5hbWU6IHN0cmluZyB8IHN5bWJvbCxcbiAgICBsaXN0ZW5lcjogRnVuY3Rpb24gfCBXcmFwcGVkRnVuY3Rpb24sXG4gICk6IHRoaXMge1xuICAgIHJldHVybiB0aGlzLmFkZExpc3RlbmVyKGV2ZW50TmFtZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBvbmUtdGltZSBsaXN0ZW5lciBmdW5jdGlvbiBmb3IgdGhlIGV2ZW50IG5hbWVkIGV2ZW50TmFtZS4gVGhlIG5leHRcbiAgICogdGltZSBldmVudE5hbWUgaXMgdHJpZ2dlcmVkLCB0aGlzIGxpc3RlbmVyIGlzIHJlbW92ZWQgYW5kIHRoZW4gaW52b2tlZC5cbiAgICovXG4gIHB1YmxpYyBvbmNlKGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sLCBsaXN0ZW5lcjogRnVuY3Rpb24pOiB0aGlzIHtcbiAgICBjb25zdCB3cmFwcGVkOiBXcmFwcGVkRnVuY3Rpb24gPSB0aGlzLm9uY2VXcmFwKGV2ZW50TmFtZSwgbGlzdGVuZXIpO1xuICAgIHRoaXMub24oZXZlbnROYW1lLCB3cmFwcGVkKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIFdyYXBwZWQgZnVuY3Rpb24gdGhhdCBjYWxscyBFdmVudEVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoZXZlbnROYW1lLCBzZWxmKSBvbiBleGVjdXRpb24uXG4gIHByaXZhdGUgb25jZVdyYXAoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXG4gICAgbGlzdGVuZXI6IEZ1bmN0aW9uLFxuICApOiBXcmFwcGVkRnVuY3Rpb24ge1xuICAgIGNvbnN0IHdyYXBwZXIgPSBmdW5jdGlvbiAoXG4gICAgICB0aGlzOiB7XG4gICAgICAgIGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sO1xuICAgICAgICBsaXN0ZW5lcjogRnVuY3Rpb247XG4gICAgICAgIHJhd0xpc3RlbmVyOiBGdW5jdGlvbjtcbiAgICAgICAgY29udGV4dDogRXZlbnRFbWl0dGVyO1xuICAgICAgfSxcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgICAuLi5hcmdzOiBhbnlbXVxuICAgICk6IHZvaWQge1xuICAgICAgdGhpcy5jb250ZXh0LnJlbW92ZUxpc3RlbmVyKHRoaXMuZXZlbnROYW1lLCB0aGlzLnJhd0xpc3RlbmVyKTtcbiAgICAgIHRoaXMubGlzdGVuZXIuYXBwbHkodGhpcy5jb250ZXh0LCBhcmdzKTtcbiAgICB9O1xuICAgIGNvbnN0IHdyYXBwZXJDb250ZXh0ID0ge1xuICAgICAgZXZlbnROYW1lOiBldmVudE5hbWUsXG4gICAgICBsaXN0ZW5lcjogbGlzdGVuZXIsXG4gICAgICByYXdMaXN0ZW5lcjogKHdyYXBwZXIgYXMgdW5rbm93bikgYXMgV3JhcHBlZEZ1bmN0aW9uLFxuICAgICAgY29udGV4dDogdGhpcyxcbiAgICB9O1xuICAgIGNvbnN0IHdyYXBwZWQgPSAod3JhcHBlci5iaW5kKFxuICAgICAgd3JhcHBlckNvbnRleHQsXG4gICAgKSBhcyB1bmtub3duKSBhcyBXcmFwcGVkRnVuY3Rpb247XG4gICAgd3JhcHBlckNvbnRleHQucmF3TGlzdGVuZXIgPSB3cmFwcGVkO1xuICAgIHdyYXBwZWQubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgICByZXR1cm4gd3JhcHBlZCBhcyBXcmFwcGVkRnVuY3Rpb247XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0aGUgbGlzdGVuZXIgZnVuY3Rpb24gdG8gdGhlIGJlZ2lubmluZyBvZiB0aGUgbGlzdGVuZXJzIGFycmF5IGZvciB0aGVcbiAgICogIGV2ZW50IG5hbWVkIGV2ZW50TmFtZS4gTm8gY2hlY2tzIGFyZSBtYWRlIHRvIHNlZSBpZiB0aGUgbGlzdGVuZXIgaGFzXG4gICAqIGFscmVhZHkgYmVlbiBhZGRlZC4gTXVsdGlwbGUgY2FsbHMgcGFzc2luZyB0aGUgc2FtZSBjb21iaW5hdGlvbiBvZlxuICAgKiBldmVudE5hbWUgYW5kIGxpc3RlbmVyIHdpbGwgcmVzdWx0IGluIHRoZSBsaXN0ZW5lciBiZWluZyBhZGRlZCwgYW5kXG4gICAqIGNhbGxlZCwgbXVsdGlwbGUgdGltZXMuXG4gICAqL1xuICBwdWJsaWMgcHJlcGVuZExpc3RlbmVyKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nIHwgc3ltYm9sLFxuICAgIGxpc3RlbmVyOiBGdW5jdGlvbiB8IFdyYXBwZWRGdW5jdGlvbixcbiAgKTogdGhpcyB7XG4gICAgcmV0dXJuIHRoaXMuX2FkZExpc3RlbmVyKGV2ZW50TmFtZSwgbGlzdGVuZXIsIHRydWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBvbmUtdGltZSBsaXN0ZW5lciBmdW5jdGlvbiBmb3IgdGhlIGV2ZW50IG5hbWVkIGV2ZW50TmFtZSB0byB0aGVcbiAgICogYmVnaW5uaW5nIG9mIHRoZSBsaXN0ZW5lcnMgYXJyYXkuIFRoZSBuZXh0IHRpbWUgZXZlbnROYW1lIGlzIHRyaWdnZXJlZCxcbiAgICogdGhpcyBsaXN0ZW5lciBpcyByZW1vdmVkLCBhbmQgdGhlbiBpbnZva2VkLlxuICAgKi9cbiAgcHVibGljIHByZXBlbmRPbmNlTGlzdGVuZXIoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXG4gICAgbGlzdGVuZXI6IEZ1bmN0aW9uLFxuICApOiB0aGlzIHtcbiAgICBjb25zdCB3cmFwcGVkOiBXcmFwcGVkRnVuY3Rpb24gPSB0aGlzLm9uY2VXcmFwKGV2ZW50TmFtZSwgbGlzdGVuZXIpO1xuICAgIHRoaXMucHJlcGVuZExpc3RlbmVyKGV2ZW50TmFtZSwgd3JhcHBlZCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzLCBvciB0aG9zZSBvZiB0aGUgc3BlY2lmaWVkIGV2ZW50TmFtZS4gKi9cbiAgcHVibGljIHJlbW92ZUFsbExpc3RlbmVycyhldmVudE5hbWU/OiBzdHJpbmcgfCBzeW1ib2wpOiB0aGlzIHtcbiAgICBpZiAodGhpcy5fZXZlbnRzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGlmIChldmVudE5hbWUpIHtcbiAgICAgIGlmICh0aGlzLl9ldmVudHMuaGFzKGV2ZW50TmFtZSkpIHtcbiAgICAgICAgY29uc3QgbGlzdGVuZXJzID0gKHRoaXMuX2V2ZW50cy5nZXQoZXZlbnROYW1lKSBhcyBBcnJheTxcbiAgICAgICAgICBGdW5jdGlvbiB8IFdyYXBwZWRGdW5jdGlvblxuICAgICAgICA+KS5zbGljZSgpOyAvLyBDcmVhdGUgYSBjb3B5OyBXZSB1c2UgaXQgQUZURVIgaXQncyBkZWxldGVkLlxuICAgICAgICB0aGlzLl9ldmVudHMuZGVsZXRlKGV2ZW50TmFtZSk7XG4gICAgICAgIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgbGlzdGVuZXJzKSB7XG4gICAgICAgICAgdGhpcy5lbWl0KFwicmVtb3ZlTGlzdGVuZXJcIiwgZXZlbnROYW1lLCBsaXN0ZW5lcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZXZlbnRMaXN0OiBbc3RyaW5nIHwgc3ltYm9sXSA9IHRoaXMuZXZlbnROYW1lcygpO1xuICAgICAgZXZlbnRMaXN0Lm1hcCgodmFsdWU6IHN0cmluZyB8IHN5bWJvbCkgPT4ge1xuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyh2YWx1ZSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIHRoZSBzcGVjaWZpZWQgbGlzdGVuZXIgZnJvbSB0aGUgbGlzdGVuZXIgYXJyYXkgZm9yIHRoZSBldmVudFxuICAgKiBuYW1lZCBldmVudE5hbWUuXG4gICAqL1xuICBwdWJsaWMgcmVtb3ZlTGlzdGVuZXIoZXZlbnROYW1lOiBzdHJpbmcgfCBzeW1ib2wsIGxpc3RlbmVyOiBGdW5jdGlvbik6IHRoaXMge1xuICAgIGlmICh0aGlzLl9ldmVudHMuaGFzKGV2ZW50TmFtZSkpIHtcbiAgICAgIGNvbnN0IGFycjpcbiAgICAgICAgfCBBcnJheTxGdW5jdGlvbiB8IFdyYXBwZWRGdW5jdGlvbj5cbiAgICAgICAgfCB1bmRlZmluZWQgPSB0aGlzLl9ldmVudHMuZ2V0KGV2ZW50TmFtZSk7XG5cbiAgICAgIGFzc2VydChhcnIpO1xuXG4gICAgICBsZXQgbGlzdGVuZXJJbmRleCA9IC0xO1xuICAgICAgZm9yIChsZXQgaSA9IGFyci5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAvLyBhcnJbaV1bXCJsaXN0ZW5lclwiXSBpcyB0aGUgcmVmZXJlbmNlIHRvIHRoZSBsaXN0ZW5lciBpbnNpZGUgYSBib3VuZCAnb25jZScgd3JhcHBlclxuICAgICAgICBpZiAoXG4gICAgICAgICAgYXJyW2ldID09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGFycltpXSAmJiAoYXJyW2ldIGFzIFdyYXBwZWRGdW5jdGlvbilbXCJsaXN0ZW5lclwiXSA9PSBsaXN0ZW5lcilcbiAgICAgICAgKSB7XG4gICAgICAgICAgbGlzdGVuZXJJbmRleCA9IGk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGxpc3RlbmVySW5kZXggPj0gMCkge1xuICAgICAgICBhcnIuc3BsaWNlKGxpc3RlbmVySW5kZXgsIDEpO1xuICAgICAgICB0aGlzLmVtaXQoXCJyZW1vdmVMaXN0ZW5lclwiLCBldmVudE5hbWUsIGxpc3RlbmVyKTtcbiAgICAgICAgaWYgKGFyci5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICB0aGlzLl9ldmVudHMuZGVsZXRlKGV2ZW50TmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnNcbiAgICogYXJlIGFkZGVkIGZvciBhIHBhcnRpY3VsYXIgZXZlbnQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB0aGF0IGhlbHBzXG4gICAqIGZpbmRpbmcgbWVtb3J5IGxlYWtzLiBPYnZpb3VzbHksIG5vdCBhbGwgZXZlbnRzIHNob3VsZCBiZSBsaW1pdGVkIHRvIGp1c3RcbiAgICogMTAgbGlzdGVuZXJzLiBUaGUgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSBtZXRob2QgYWxsb3dzIHRoZSBsaW1pdCB0byBiZVxuICAgKiBtb2RpZmllZCBmb3IgdGhpcyBzcGVjaWZpYyBFdmVudEVtaXR0ZXIgaW5zdGFuY2UuIFRoZSB2YWx1ZSBjYW4gYmUgc2V0IHRvXG4gICAqIEluZmluaXR5IChvciAwKSB0byBpbmRpY2F0ZSBhbiB1bmxpbWl0ZWQgbnVtYmVyIG9mIGxpc3RlbmVycy5cbiAgICovXG4gIHB1YmxpYyBzZXRNYXhMaXN0ZW5lcnMobjogbnVtYmVyKTogdGhpcyB7XG4gICAgdmFsaWRhdGVJbnRlZ2VyUmFuZ2UobiwgXCJtYXhMaXN0ZW5lcnNcIiwgMCk7XG4gICAgdGhpcy5tYXhMaXN0ZW5lcnMgPSBuO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cbmV4cG9ydCB7IEV2ZW50RW1pdHRlciB9O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBQcm9taXNlIHRoYXQgaXMgZnVsZmlsbGVkIHdoZW4gdGhlIEV2ZW50RW1pdHRlciBlbWl0cyB0aGUgZ2l2ZW5cbiAqIGV2ZW50IG9yIHRoYXQgaXMgcmVqZWN0ZWQgd2hlbiB0aGUgRXZlbnRFbWl0dGVyIGVtaXRzICdlcnJvcicuIFRoZSBQcm9taXNlXG4gKiB3aWxsIHJlc29sdmUgd2l0aCBhbiBhcnJheSBvZiBhbGwgdGhlIGFyZ3VtZW50cyBlbWl0dGVkIHRvIHRoZSBnaXZlbiBldmVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9uY2UoXG4gIGVtaXR0ZXI6IEV2ZW50RW1pdHRlciB8IEV2ZW50VGFyZ2V0LFxuICBuYW1lOiBzdHJpbmcsXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4pOiBQcm9taXNlPGFueVtdPiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgaWYgKGVtaXR0ZXIgaW5zdGFuY2VvZiBFdmVudFRhcmdldCkge1xuICAgICAgLy8gRXZlbnRUYXJnZXQgZG9lcyBub3QgaGF2ZSBgZXJyb3JgIGV2ZW50IHNlbWFudGljcyBsaWtlIE5vZGVcbiAgICAgIC8vIEV2ZW50RW1pdHRlcnMsIHdlIGRvIG5vdCBsaXN0ZW4gdG8gYGVycm9yYCBldmVudHMgaGVyZS5cbiAgICAgIGVtaXR0ZXIuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgbmFtZSxcbiAgICAgICAgKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgICByZXNvbHZlKGFyZ3MpO1xuICAgICAgICB9LFxuICAgICAgICB7IG9uY2U6IHRydWUsIHBhc3NpdmU6IGZhbHNlLCBjYXB0dXJlOiBmYWxzZSB9LFxuICAgICAgKTtcbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2UgaWYgKGVtaXR0ZXIgaW5zdGFuY2VvZiBFdmVudEVtaXR0ZXIpIHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgICBjb25zdCBldmVudExpc3RlbmVyID0gKC4uLmFyZ3M6IGFueVtdKTogdm9pZCA9PiB7XG4gICAgICAgIGlmIChlcnJvckxpc3RlbmVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBlbWl0dGVyLnJlbW92ZUxpc3RlbmVyKFwiZXJyb3JcIiwgZXJyb3JMaXN0ZW5lcik7XG4gICAgICAgIH1cbiAgICAgICAgcmVzb2x2ZShhcmdzKTtcbiAgICAgIH07XG4gICAgICBsZXQgZXJyb3JMaXN0ZW5lcjogRnVuY3Rpb247XG5cbiAgICAgIC8vIEFkZGluZyBhbiBlcnJvciBsaXN0ZW5lciBpcyBub3Qgb3B0aW9uYWwgYmVjYXVzZVxuICAgICAgLy8gaWYgYW4gZXJyb3IgaXMgdGhyb3duIG9uIGFuIGV2ZW50IGVtaXR0ZXIgd2UgY2Fubm90XG4gICAgICAvLyBndWFyYW50ZWUgdGhhdCB0aGUgYWN0dWFsIGV2ZW50IHdlIGFyZSB3YWl0aW5nIHdpbGxcbiAgICAgIC8vIGJlIGZpcmVkLiBUaGUgcmVzdWx0IGNvdWxkIGJlIGEgc2lsZW50IHdheSB0byBjcmVhdGVcbiAgICAgIC8vIG1lbW9yeSBvciBmaWxlIGRlc2NyaXB0b3IgbGVha3MsIHdoaWNoIGlzIHNvbWV0aGluZ1xuICAgICAgLy8gd2Ugc2hvdWxkIGF2b2lkLlxuICAgICAgaWYgKG5hbWUgIT09IFwiZXJyb3JcIikge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgICAgICBlcnJvckxpc3RlbmVyID0gKGVycjogYW55KTogdm9pZCA9PiB7XG4gICAgICAgICAgZW1pdHRlci5yZW1vdmVMaXN0ZW5lcihuYW1lLCBldmVudExpc3RlbmVyKTtcbiAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgfTtcblxuICAgICAgICBlbWl0dGVyLm9uY2UoXCJlcnJvclwiLCBlcnJvckxpc3RlbmVyKTtcbiAgICAgIH1cblxuICAgICAgZW1pdHRlci5vbmNlKG5hbWUsIGV2ZW50TGlzdGVuZXIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfSk7XG59XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG5mdW5jdGlvbiBjcmVhdGVJdGVyUmVzdWx0KHZhbHVlOiBhbnksIGRvbmU6IGJvb2xlYW4pOiBJdGVyYXRvclJlc3VsdDxhbnk+IHtcbiAgcmV0dXJuIHsgdmFsdWUsIGRvbmUgfTtcbn1cblxuaW50ZXJmYWNlIEFzeW5jSW50ZXJhYmxlIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgbmV4dCgpOiBQcm9taXNlPEl0ZXJhdG9yUmVzdWx0PGFueSwgYW55Pj47XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIHJldHVybigpOiBQcm9taXNlPEl0ZXJhdG9yUmVzdWx0PGFueSwgYW55Pj47XG4gIHRocm93KGVycjogRXJyb3IpOiB2b2lkO1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICBbU3ltYm9sLmFzeW5jSXRlcmF0b3JdKCk6IGFueTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFuIEFzeW5jSXRlcmF0b3IgdGhhdCBpdGVyYXRlcyBldmVudE5hbWUgZXZlbnRzLiBJdCB3aWxsIHRocm93IGlmXG4gKiB0aGUgRXZlbnRFbWl0dGVyIGVtaXRzICdlcnJvcicuIEl0IHJlbW92ZXMgYWxsIGxpc3RlbmVycyB3aGVuIGV4aXRpbmcgdGhlXG4gKiBsb29wLiBUaGUgdmFsdWUgcmV0dXJuZWQgYnkgZWFjaCBpdGVyYXRpb24gaXMgYW4gYXJyYXkgY29tcG9zZWQgb2YgdGhlXG4gKiBlbWl0dGVkIGV2ZW50IGFyZ3VtZW50cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9uKFxuICBlbWl0dGVyOiBFdmVudEVtaXR0ZXIsXG4gIGV2ZW50OiBzdHJpbmcgfCBzeW1ib2wsXG4pOiBBc3luY0ludGVyYWJsZSB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIGNvbnN0IHVuY29uc3VtZWRFdmVudFZhbHVlczogYW55W10gPSBbXTtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgY29uc3QgdW5jb25zdW1lZFByb21pc2VzOiBhbnlbXSA9IFtdO1xuICBsZXQgZXJyb3I6IEVycm9yIHwgbnVsbCA9IG51bGw7XG4gIGxldCBmaW5pc2hlZCA9IGZhbHNlO1xuXG4gIGNvbnN0IGl0ZXJhdG9yID0ge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgbmV4dCgpOiBQcm9taXNlPEl0ZXJhdG9yUmVzdWx0PGFueT4+IHtcbiAgICAgIC8vIEZpcnN0LCB3ZSBjb25zdW1lIGFsbCB1bnJlYWQgZXZlbnRzXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgICAgY29uc3QgdmFsdWU6IGFueSA9IHVuY29uc3VtZWRFdmVudFZhbHVlcy5zaGlmdCgpO1xuICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY3JlYXRlSXRlclJlc3VsdCh2YWx1ZSwgZmFsc2UpKTtcbiAgICAgIH1cblxuICAgICAgLy8gVGhlbiB3ZSBlcnJvciwgaWYgYW4gZXJyb3IgaGFwcGVuZWRcbiAgICAgIC8vIFRoaXMgaGFwcGVucyBvbmUgdGltZSBpZiBhdCBhbGwsIGJlY2F1c2UgYWZ0ZXIgJ2Vycm9yJ1xuICAgICAgLy8gd2Ugc3RvcCBsaXN0ZW5pbmdcbiAgICAgIGlmIChlcnJvcikge1xuICAgICAgICBjb25zdCBwOiBQcm9taXNlPG5ldmVyPiA9IFByb21pc2UucmVqZWN0KGVycm9yKTtcbiAgICAgICAgLy8gT25seSB0aGUgZmlyc3QgZWxlbWVudCBlcnJvcnNcbiAgICAgICAgZXJyb3IgPSBudWxsO1xuICAgICAgICByZXR1cm4gcDtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhlIGl0ZXJhdG9yIGlzIGZpbmlzaGVkLCByZXNvbHZlIHRvIGRvbmVcbiAgICAgIGlmIChmaW5pc2hlZCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNyZWF0ZUl0ZXJSZXN1bHQodW5kZWZpbmVkLCB0cnVlKSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFdhaXQgdW50aWwgYW4gZXZlbnQgaGFwcGVuc1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgdW5jb25zdW1lZFByb21pc2VzLnB1c2goeyByZXNvbHZlLCByZWplY3QgfSk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICByZXR1cm4oKTogUHJvbWlzZTxJdGVyYXRvclJlc3VsdDxhbnk+PiB7XG4gICAgICBlbWl0dGVyLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBldmVudEhhbmRsZXIpO1xuICAgICAgZW1pdHRlci5yZW1vdmVMaXN0ZW5lcihcImVycm9yXCIsIGVycm9ySGFuZGxlcik7XG4gICAgICBmaW5pc2hlZCA9IHRydWU7XG5cbiAgICAgIGZvciAoY29uc3QgcHJvbWlzZSBvZiB1bmNvbnN1bWVkUHJvbWlzZXMpIHtcbiAgICAgICAgcHJvbWlzZS5yZXNvbHZlKGNyZWF0ZUl0ZXJSZXN1bHQodW5kZWZpbmVkLCB0cnVlKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY3JlYXRlSXRlclJlc3VsdCh1bmRlZmluZWQsIHRydWUpKTtcbiAgICB9LFxuXG4gICAgdGhyb3coZXJyOiBFcnJvcik6IHZvaWQge1xuICAgICAgZXJyb3IgPSBlcnI7XG4gICAgICBlbWl0dGVyLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBldmVudEhhbmRsZXIpO1xuICAgICAgZW1pdHRlci5yZW1vdmVMaXN0ZW5lcihcImVycm9yXCIsIGVycm9ySGFuZGxlcik7XG4gICAgfSxcblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSgpOiBhbnkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgfTtcblxuICBlbWl0dGVyLm9uKGV2ZW50LCBldmVudEhhbmRsZXIpO1xuICBlbWl0dGVyLm9uKFwiZXJyb3JcIiwgZXJyb3JIYW5kbGVyKTtcblxuICByZXR1cm4gaXRlcmF0b3I7XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgZnVuY3Rpb24gZXZlbnRIYW5kbGVyKC4uLmFyZ3M6IGFueVtdKTogdm9pZCB7XG4gICAgY29uc3QgcHJvbWlzZSA9IHVuY29uc3VtZWRQcm9taXNlcy5zaGlmdCgpO1xuICAgIGlmIChwcm9taXNlKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoY3JlYXRlSXRlclJlc3VsdChhcmdzLCBmYWxzZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB1bmNvbnN1bWVkRXZlbnRWYWx1ZXMucHVzaChhcmdzKTtcbiAgICB9XG4gIH1cblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICBmdW5jdGlvbiBlcnJvckhhbmRsZXIoZXJyOiBhbnkpOiB2b2lkIHtcbiAgICBmaW5pc2hlZCA9IHRydWU7XG5cbiAgICBjb25zdCB0b0Vycm9yID0gdW5jb25zdW1lZFByb21pc2VzLnNoaWZ0KCk7XG4gICAgaWYgKHRvRXJyb3IpIHtcbiAgICAgIHRvRXJyb3IucmVqZWN0KGVycik7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRoZSBuZXh0IHRpbWUgd2UgY2FsbCBuZXh0KClcbiAgICAgIGVycm9yID0gZXJyO1xuICAgIH1cblxuICAgIGl0ZXJhdG9yLnJldHVybigpO1xuICB9XG59XG5leHBvcnQgY29uc3QgY2FwdHVyZVJlamVjdGlvblN5bWJvbCA9IFN5bWJvbC5mb3IoXCJub2RlanMucmVqZWN0aW9uXCIpO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEVBQTBFLEFBQTFFLHdFQUEwRTtBQUMxRSxFQUF5RSxBQUF6RSx1RUFBeUU7QUFDekUsRUFBc0QsQUFBdEQsb0RBQXNEO0FBQ3RELEVBQUU7QUFDRixFQUEwRSxBQUExRSx3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