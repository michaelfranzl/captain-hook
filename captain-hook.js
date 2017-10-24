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
 * @param {Object} config - Names to use for the property names of the
 * returned object.
 * @param {String} config.on_prop - Method property name for setting event
 * handlers. Defaults to '_on'.
 * @param {String} config.off_prop - Method property name for removing event
 * handlers. Defaults to '_off'.
 * @param {String} config.emit_prop - Method property name for calling event
 * handlers. Defaults to '_emit'.
 * @param {String|null} config.handlers_prop - Property name for storing event
 * handlers. Defaults to '_handlers'. If `null`, a privately scoped storage will
 * be used, in which case you need to mix in CaptainHook into every instance,
 * otherwise event handlers would be shared across instances.
 */
var CaptainHook = function ({
  on_prop        = 'on',
  once_prop      = 'once',
  off_prop       = 'off',
  emit_prop      = '_emit',
  handlers_prop  = '_handlers',
}) {
  
  let privatehandlers;
  if (handlers_prop == null) {
    // Use a private storage for event handlers instead of a
    // publicly accessible one.
    privatehandlers = {};
  }
  
  // This is the plain object that you will be able to mix-in to
  // your own instances or prototypes.
  let impl = {
    
    /**
     * Add an event handler to an event name.
     * 
     * The name of this method is configurable via the factory function.
     * 
     * @param {String} eventname
     * @param {Function} callable
     * @param {Object} options
     * @param {String} options.tag - Name tag of handler
     * @param {Number} options.priority - Execution order of handlers is sorted
     * by this number.
     * @param {Object} options.context - Value to use for the first argument of
     * `Function.call()` when calling `handler`, changing the meaning of `this`
     * inside `handler`. By default `this` in the `handler` is the object which
     * emitted the event.
     * @param {boolean} options.once - set to `true` if `handler` should only
     * be ran once. Defaults to `false`.
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
        return b.priority - a.priority
      });
    },
    
    
    /**
     * Add an one-time event handler to an event name.
     * 
     * The name of this method is configurable via the factory function.
     * 
     * Receives the same arguments as `on`, but sets `options.once` to `true`.
     */
    [once_prop] (eventname, callable, options={}) {
      options.once = true;
      this[on_prop](eventname, callable, options);
    },
    
    
    /**
     * Remove an event handler named `tag` from `eventname`.
     * 
     * The name of this method is configurable via the factory function.
     * 
     * @param {String} eventname
     * @param {String} tag
     * 
     * If `tag` or `eventname` are not registered, this method does nothing.
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
        return
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
     * Call event handlers with the provided arguments.
     * 
     * The name of this method is configurable via the factory function.
     * 
     * @param {String} eventname
     * @param {...} args - Arguments to call the handler with.
     * @return {Array} - Each return value of handlers concatenated.
     * 
     * Note that return values of event handlers are not visible to
     * any other event handler, which provides isolation between
     * event handlers as well as privacy.
     * 
     * To implement content filtering, you need to pass the content
     * by reference (i.e. to filter strings, you need to wrap the
     * string into an object or array).
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
        return retvals
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
    
  } // end impl
  
  return Object.assign(Object.create(CaptainHook.prototype), impl);
};

export default CaptainHook;
