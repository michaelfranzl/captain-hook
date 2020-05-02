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
* @property {AddEventHandler} on - Associates an event handler function
* with an event name.
* @property {AddOneTimeEventHandler} once - Same as {@link AddEventHandler}, but sets `options.once`
* to `true`.
* @property {RemoveEventHandler} off - Remove an event handler.
* @property {EmitEvent} _emit - Call all registered event
* handlers.
*/


/**
 * Factory function which returns a plain object which implements event emission behavior.
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
function CaptainHook({
  on_prop = 'on',
  once_prop = 'once',
  off_prop = 'off',
  emit_prop = '_emit',
  handlers_prop = '_handlers',
} = {}) {
  let privatehandlers;

  const handlersPropName = handlers_prop;

  // Use a truly private storage for event handlers instead of a publicly accessible one.
  if (handlersPropName == null) privatehandlers = {};

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
    [on_prop](eventname, callable, options = {}) {
      const handler = {
        callable,
        tag: options.tag,
        priority: options.priority || 10,
        context: options.context || this,
        once: options.once || false,
      };

      // Choose and initialize the handlers storage
      let handlers;
      if (handlersPropName) {
        if (!this[handlersPropName]) this[handlersPropName] = {};
        handlers = this[handlersPropName];
      } else {
        handlers = privatehandlers;
      }

      if (!handlers[eventname]) {
        handlers[eventname] = [handler];
      } else {
        handlers[eventname].push(handler);
      }
      handlers[eventname].sort((a, b) => (b.priority - a.priority));
    },


    /**
    * Same as {@link AddEventHandler}, but sets `options.once` to `true`.
    *
    * @function AddOneTimeEventHandler
    * @alias AddEventHandler
    */
    [once_prop](eventname, callable, options = {}) {
      const opts = options;
      opts.once = true;
      this[on_prop](eventname, callable, opts);
    },


    /**
     * Removes an event handler tagged with `tag` from `eventname`. If `tag` or
     * `eventname` are not registered, this method does nothing.
     *
     * @function RemoveEventHandler
     * @param {String} eventname
     * @param {String} tag
     */
    [off_prop](eventname, tag) {
      // Choose the handlers storage.
      let handlers;
      if (handlersPropName) {
        handlers = this[handlersPropName];
      } else {
        handlers = privatehandlers;
      }

      if (!tag || !handlers || !handlers[eventname]) return;

      const eventhandlers = handlers[eventname];

      // Find the event handler with matching tag in the array.
      let i;
      let found = false;
      for (i = 0; i < eventhandlers.length; i += 1) {
        const eventhandler = eventhandlers[i];
        if (eventhandler.tag === tag) {
          found = true;
          break;
        }
      }
      if (found) eventhandlers.splice(i, 1); // Remove this handler
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
    [emit_prop](eventname, ...args) {
      // Choose the handlers storage.
      let handlers;
      if (handlersPropName) {
        handlers = this[handlersPropName];
      } else {
        handlers = privatehandlers;
      }

      const retvals = [];
      if (!handlers || !handlers[eventname]) return retvals;

      handlers[eventname].forEach((eventhandler) => {
        retvals.push(eventhandler.callable.call(eventhandler.context, ...args));
      });

      // remove one-time event handlers
      for (let i = handlers[eventname].length - 1; i >= 0; i -= 1) {
        const handler = handlers[eventname][i];
        if (handler.once) handlers[eventname].splice(i, 1);
      }

      return retvals;
    },
  };
}

export default CaptainHook;
