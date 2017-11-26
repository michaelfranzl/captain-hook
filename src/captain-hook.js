/*jshint esversion: 6 */

/*
captain-hook

A configurable mix-in providing flexible event emission for JavaScript objects.

Copyright 2017 Michael Karl Franzl

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/


/** 
 * Callback function consuming an event.
 * 
 * @callback {Function} EventHandler
 * @param {...*} args - Arguments provided by the emitter of the event ({@link EmitEvent}).
 * @returns {*} Optionally returned values of attached EventHandlers
 * are concatenated into an Array and passed back to the {@link EmitEvent}.
 */



/**
* Object implementing event emitter behavior which can be mixed into other
* objects, classes, or prototypes. See README for illustrations.
* 
* @typedef {Object} EventEmitter
* @property {AddEventHandler} on Associates an event handler function
* with an event name.
* @property {AddOneTimeEventHandler} once Same as {@link AddEventHandler}, but sets `options.once` to `true`.
* @property {RemoveEventHandler} off Remove an event handler.
* @property {EmitEvent} _emit Call all registered event
* handlers.
*/


/**
 * Factory returning a plain object implementing event emission behavior.
 * 
 * The default method/property names for adding and removing handlers are
 * `on()`, `off()`, and `_emit()`. The attached event handler functions are
 * stored in a property named `_handlers`.
 * 
 * All property/method names can be explicitly configured via `config` to
 * prevent naming conflicts with existing propety names of the target object.
 * 
 * @example
 * let event_emitter = CaptainHook({
 *   on_prop:       'on',       // public
 *   off_prop:      'off',      // public
 *   emit_prop:     '_emit',    // pseudo-private
 *   handlers_prop: '_handlers' // pseudo-private
 * });
 * 
 * @param {Object} [config={}] Property names of the returned object.
 * @param {String} [config.on_prop=on] Method property name for setting event
 * handlers.
 * @param {String} [config.off_prop=off] Method property name for removing event
 * handlers.
 * @param {String} [config.emit_prop=_emit] Method property name for calling
 * event handlers.
 * @param {(String|null)} [config.handlers_prop=_handlers] Property name for
 * storage of event handlers. If `null`, a truly private storage will
 * be used, in which case you need to mix the EventEmitter into every instance,
 * otherwise event handlers would be shared across instances.
 * @returns {EventEmitter}
 */
var CaptainHook = function ({
  on_prop        = 'on',
  once_prop      = 'once',
  off_prop       = 'off',
  emit_prop      = '_emit',
  handlers_prop  = '_handlers',
} = {}) {
  
  let privatehandlers;
  if (handlers_prop == null) {
    // Use a truly private storage for event handlers instead of a
    // publicly accessible one.
    privatehandlers = {};
  }
  
  return {
    /**
    * Associates an event handler function with an event name.
    *
    * @function AddEventHandler
    * @param {String} eventname
    * @param {EventHandler} callable
    * @param {Object} [options={}]
    * @param {String} [options.tag] - Name tag of handler
    * @param {Number} [options.priority=10] - Execution order of handlers is sorted
    * by this number. Higher priority will be sorted first.
    * @param {Object} [options.context] - Value to use for the first argument of
    * `Function.call()` when calling `handler`, changing the meaning of `this`
    * inside `handler`. By default `this` in the `handler` is the object which
    * emitted the event.
    * @param {Boolean} [options.once=false] - When `true` then `handler` runs only
    * once, then is removed.
    */
    [on_prop] (eventname, callable, options={}) {
      let handler = {
        callable: callable,
        tag: options.tag,
        priority: options.priority || 10,
        context: options.context || this,
        once: options.once || false,
      };

      // Choose and initialize the handlers storage
      let handlers;
      if (handlers_prop) {
        if (!this[handlers_prop]) {
          // Only ran once.
          // `this` will be the instance, not the prototype.
          this[handlers_prop] = {};
        }
        handlers = this[handlers_prop];
      } else {
        // Use the privately scoped storage instead.
        handlers = privatehandlers;
      }
      
      if (!handlers[eventname]) {
        handlers[eventname] = [handler];
      } else {
        handlers[eventname].push(handler);
      }
      handlers[eventname].sort(function(a, b) {
        return b.priority - a.priority;
      });
    },
    
    
    /**
    * Same as {@link AddEventHandler}, but sets `options.once` to `true`.
    *
    * @function AddOneTimeEventHandler
    * @alias AddEventHandler
    */
    [once_prop] (eventname, callable, options={}) {
      options.once = true;
      this[on_prop](eventname, callable, options);
    },
    
    
    /** 
     * Removes an event handler tagged with `tag` from `eventname`. If `tag` or
     * `eventname` are not registered, this method does nothing.
     * 
     * @function RemoveEventHandler
     * @param {String} eventname
     * @param {String} tag
     */
    [off_prop] (eventname, tag) {
      // Choose the handlers storage.
      let handlers;
      if (handlers_prop) {
        handlers = this[handlers_prop];
      } else {
        handlers = privatehandlers;
      }
      
      if (!tag || !handlers || !handlers[eventname]) {
        // Nothing to do.
        return;
      }
      
      let eventhandlers = handlers[eventname];
      
      // Find the event handler with matching tag in the array.
      let i = 0;
      let found = false;
      for (let eventhandler of eventhandlers) {
        if (eventhandler.tag == tag) {
          found = true;
          break;
        }
        i++;
      }
      if (found) {
        // Remove this handler
        eventhandlers.splice(i, 1);
      }
    },
    
    
    /**
    * Calls all registered event handler callbacks with the provided arguments.
    * 
    * Note that return values of event handlers are not visible to
    * any other event handler, which provides isolation between
    * event handlers as well as privacy.
    * 
    * To implement content filtering, you need to pass the content
    * by reference (i.e. to filter strings, you need to wrap the
    * string into an object or array).
    * 
    * @function EmitEvent
    * @param {String} eventname
    * @param {...*} args - Arguments to call the handler with.
    * @returns {Array} - Each return value of handlers concatenated.
    */
    [emit_prop] (eventname, ...args) {
      // Choose the handlers storage.
      let handlers;
      if (handlers_prop) {
        handlers = this[handlers_prop];
      } else {
        handlers = privatehandlers;
      }
      
      let retvals = [];
      if (!handlers || !handlers[eventname]) {
        // Nothing to do
        return retvals;
      }
      
      for (let eventhandler of handlers[eventname]) {
        retvals.push(eventhandler.callable.call(eventhandler.context, ...args));
      }
      
      // remove one-time event handlers
      for (let i = handlers[eventname].length - 1; i >= 0; i--) {
        let handler = handlers[eventname][i];
        if (handler.once) {
          handlers[eventname].splice(i, 1);
        }
      }
      
      return retvals;
    },
  }; // return
};

export default CaptainHook;
