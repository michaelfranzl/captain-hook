# captain-hook

![Test](https://github.com/michaelfranzl/captain-hook/workflows/Test/badge.svg)

## Configurable event emitter behavior for mixing into JavaScript objects/prototypes/classes

An event emitter API clearly defines interaction between separate pieces of code (e.g. main application vs. plugins). Event emitting allows you to keep the functionality of your application general (make it more suitable to be published Open Source), while external (perhaps even proprietary) code makes the application's behavior more specific.

Methods of your objects will be able to emit "events" to external "event handlers". External code can add event handlers via `.on()` and remove them via `.off()`, while your own object can call them via `._emit()`. The names of these three methods can be explicitly configured via the factory function.

The name "Captain Hook" is a play on the term ["Software Hook"](https://en.wikipedia.org/wiki/Hooking).


# Why invent yet another event emitter?

* Attribute/method names are configurable
* Returns to the event emitter return values from event handlers as an array
* When adding event handlers, a supplied option object allows
  * sorting the handler according to given priority,
  * setting the `this` context of the handler,
  * setting of a tag/label of the handler.
* Event handlers can only be removed when their tag is known. Prevents interaction between subscribers.
* The storage object for event handlers and their options can be privately scoped if needed. This is to ensure that external plugins cannot remove or inspect each other's event handlers (privacy).
* Flexible use: add the mix-in to prototypes, plain objects, classes or to instances thereof (see below).
* No dependencies.
* Only ~100 lines of code.
* Only ~2.4 kilobytes minified.
* Works in browsers and in Node.js.
* Extensive tests.

The [test file](tests/test.js) describes usage and features.


# Development

Run tests:

```sh
npm test
```

Generate `README.md` with API documentation parsed from `jsdoc` sources:

```sh
node scripts/make_readme.cjs
```

# How to use

The default export of the module is a factory function (see `CaptainHook()` in the API section).

The following 5 methods are equivalent in their effects.

## 1\. Mix into prototypes

Methods will be shared across all instances.

If you prefer classes:

```javascript
captain_hook = CaptainHook(); // use defaults

class Dog {
  constructor(name) {
    this.name = name;
  }
  poop() {
    console.log(`I am pooping.`)
    this._emit('poop');
  }
}

Object.assign(Dog.prototype, captain_hook);

luna = new Dog('Luna');
luna.on('poop', function() { console.log(`Cleaning up poop of ${this.name}`); } )
luna.poop();
// -> I am pooping
// -> Cleaning up poop of Luna

elvis = new Dog('Elvis');
elvis.on('poop', function() { console.log("Oh no, another dog pooped!"); })
elvis.poop();
// -> I am pooping
// -> Oh no, another dog pooped!
```

If you prefer prototype functions:

```javascript
captain_hook = CaptainHook();

function Dog(name) {
  this.name = name;
}

Object.assign(Dog.prototype, captain_hook);

Dog.prototype.poop = function() {
  console.log(`I am pooping.`)
  this._emit('poop');
}

luna = new Dog('Luna');
luna.on('poop', function() { console.log(`Cleaning up poop of ${this.name}`); } )
luna.poop();
// -> I am pooping
// -> Cleaning up poop of Luna

elvis = new Dog('Elvis');
elvis.on('poop', function() { console.log("Oh no, another dog pooped!"); })
elvis.poop();
// -> I am pooping
// -> Oh no, another dog pooped!
```

If you prefer to work with plain objects:

```javascript
captain_hook = CaptainHook();

proto_dog = {};
proto_dog.poop = function() {
  console.log(`I am pooping.`);
  this._emit('poop', this.name);
}

proto_eventful_dog = Object.assign(proto_dog, captain_hook);

// create a new object from a prototype
luna = Object.create(proto_eventful_dog);
luna.name = 'Luna';
luna.on('poop', function() { console.log(`Cleaning up poop of ${this.name}`); });
luna.poop();
// -> I am pooping
// -> Cleaning up poop of Luna

// create a new object from a prototype
elvis = Object.create(proto_eventful_dog);
elvis.name = 'Elvis';
elvis.on('poop', function() { console.log("Oh no, another dog pooped!"); });
elvis.poop();
// -> I am pooping
// -> Oh no, another dog pooped!
```

## 2\. Mix into instances

Each instance will have a full copy of the attributes and methods.

In the example below, note that we pass the configuration `handlers_prop: null`. This makes the storage of the event handler functions truly private, preventing information leaks to external code.

```javascript
class Dog {
  constructor(name) {
    var captain_hook = CaptainHook({handlers_prop: null});
    Object.assign(this, captain_hook);
    this.name = name;
  }
  poop() {
    console.log(`I am pooping.`)
    this._emit('poop');
  }
}

luna = new Dog('Luna');
luna.on('poop', function() { console.log(`Cleaning up poop of ${this.name}`); })
luna.poop();
// -> I am pooping
// -> Cleaning up poop of Luna

elvis = new Dog('Elvis');
elvis.on('poop', function() { console.log("Oh no, another dog pooped!"); })
elvis.poop();
// -> I am pooping
// -> Oh no, another dog pooped!

// Note that there is no way to read or modify the added event handlers via the `luna` or `elvis` instances.
```

If you prefer to work with plain objects:

```javascript
dog = {};
dog.poop = function() {
  console.log(`I am pooping.`);
  this._emit('poop', this.name);
}

luna = Object.assign({}, CaptainHook({handlers_prop: null}), dog);
luna.name = 'Luna';
luna.on('poop', function() { console.log(`Cleaning up poop of ${this.name}`); });
luna.poop();
// -> I am pooping
// -> Cleaning up poop of Luna

elvis = Object.assign({}, CaptainHook({handlers_prop: null}), dog);
elvis.on('poop', function() { console.log("Oh no, another dog pooped!"); })
elvis.poop();
// -> I am pooping
// -> Oh no, another dog pooped!

// Note that there is no way to read or modify the added event handlers via the `luna` or `elvis` instances.
```


# API Reference

## Functions

<dl>
<dt><a href="#CaptainHook">CaptainHook([config])</a> ⇒ <code><a href="#EventEmitter">EventEmitter</a></code></dt>
<dd><p>Factory function which returns a plain object which implements event emission behavior.</p>
<p>The default method/property names for adding and removing handlers are
<code>on()</code>, <code>off()</code>, and <code>_emit()</code>. The attached event handler functions are
stored in a property named <code>_handlers</code>.</p>
<p>All property/method names can be explicitly configured via <code>config</code> to
prevent naming conflicts with existing propety names of the target object.</p>
</dd>
<dt><a href="#AddEventHandler">AddEventHandler(eventname, callable, [options])</a></dt>
<dd><p>Associates an event handler function with an event name.</p>
</dd>
<dt><a href="#AddOneTimeEventHandler">AddOneTimeEventHandler()</a></dt>
<dd><p>Same as <a href="#AddEventHandler">AddEventHandler</a>, but sets <code>options.once</code> to <code>true</code>.</p>
</dd>
<dt><a href="#RemoveEventHandler">RemoveEventHandler(eventname, tag)</a></dt>
<dd><p>Removes an event handler tagged with <code>tag</code> from <code>eventname</code>. If <code>tag</code> or
<code>eventname</code> are not registered, this method does nothing.</p>
</dd>
<dt><a href="#EmitEvent">EmitEvent(eventname, ...args)</a> ⇒ <code>Array</code></dt>
<dd><p>Calls all registered event handler callbacks with the provided arguments.</p>
<p>Note that return values of event handlers are not visible to
any other event handler, which provides isolation between
event handlers as well as privacy.</p>
<p>To implement content filtering, you need to pass the content
by reference (i.e. to filter strings, you need to wrap the
string into an object or array).</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#EventHandler">EventHandler</a> ⇒ <code>*</code></dt>
<dd><p>Callback function consuming an event.</p>
</dd>
<dt><a href="#EventEmitter">EventEmitter</a> : <code>Object</code></dt>
<dd><p>Object implementing event emitter behavior which can be mixed into other
objects, classes, or prototypes. See README for illustrations.</p>
</dd>
</dl>

<a name="CaptainHook"></a>

## CaptainHook([config]) ⇒ [<code>EventEmitter</code>](#EventEmitter)
Factory function which returns a plain object which implements event emission behavior.

The default method/property names for adding and removing handlers are
`on()`, `off()`, and `_emit()`. The attached event handler functions are
stored in a property named `_handlers`.

All property/method names can be explicitly configured via `config` to
prevent naming conflicts with existing propety names of the target object.

**Kind**: global function  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [config] | <code>Object</code> | <code>{}</code> | Property names of the returned object. |
| [config.on_prop] | <code>String</code> | <code>on</code> | Method property name for setting event handlers. |
| [config.off_prop] | <code>String</code> | <code>off</code> | Method property name for removing event handlers. |
| [config.emit_prop] | <code>String</code> | <code>_emit</code> | Method property name for calling event handlers. |
| [config.handlers_prop] | <code>String</code> \| <code>null</code> | <code>_handlers</code> | Property name for storage of event handlers. If `null`, a truly private storage will be used, in which case you need to mix the EventEmitter into every instance, otherwise event handlers would be shared across instances. |

**Example**  
```js
let event_emitter = CaptainHook({
  on_prop:       'on',       // public
  off_prop:      'off',      // public
  emit_prop:     '_emit',    // pseudo-private
  handlers_prop: '_handlers' // pseudo-private
});
```
<a name="AddEventHandler"></a>

## AddEventHandler(eventname, callable, [options])
Associates an event handler function with an event name.

**Kind**: global function  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| eventname | <code>String</code> |  |  |
| callable | [<code>EventHandler</code>](#EventHandler) |  |  |
| [options] | <code>Object</code> | <code>{}</code> |  |
| [options.tag] | <code>String</code> |  | Name tag of handler |
| [options.priority] | <code>Number</code> | <code>10</code> | Execution order of handlers is sorted by this number. Higher priority will be sorted first. |
| [options.context] | <code>Object</code> |  | Value to use for the first argument of `Function.call()` when calling `handler`, changing the meaning of `this` inside `handler`. By default `this` in the `handler` is the object which emitted the event. |
| [options.once] | <code>Boolean</code> | <code>false</code> | When `true` then `handler` runs only once, then is removed. |

<a name="AddOneTimeEventHandler"></a>

## AddOneTimeEventHandler()
Same as [AddEventHandler](#AddEventHandler), but sets `options.once` to `true`.

**Kind**: global function  
<a name="RemoveEventHandler"></a>

## RemoveEventHandler(eventname, tag)
Removes an event handler tagged with `tag` from `eventname`. If `tag` or
`eventname` are not registered, this method does nothing.

**Kind**: global function  

| Param | Type |
| --- | --- |
| eventname | <code>String</code> | 
| tag | <code>String</code> | 

<a name="EmitEvent"></a>

## EmitEvent(eventname, ...args) ⇒ <code>Array</code>
Calls all registered event handler callbacks with the provided arguments.

Note that return values of event handlers are not visible to
any other event handler, which provides isolation between
event handlers as well as privacy.

To implement content filtering, you need to pass the content
by reference (i.e. to filter strings, you need to wrap the
string into an object or array).

**Kind**: global function  
**Returns**: <code>Array</code> - - Each return value of handlers concatenated.  

| Param | Type | Description |
| --- | --- | --- |
| eventname | <code>String</code> |  |
| ...args | <code>\*</code> | Arguments to call the handler with. |

<a name="EventHandler"></a>

## EventHandler ⇒ <code>\*</code>
Callback function consuming an event.

**Kind**: global typedef  
**Returns**: <code>\*</code> - Optionally returned values of attached EventHandlers
are concatenated into an Array and passed back to the [EmitEvent](#EmitEvent).  

| Param | Type | Description |
| --- | --- | --- |
| ...args | <code>\*</code> | Arguments provided by the emitter of the event ([EmitEvent](#EmitEvent)). |

<a name="EventEmitter"></a>

## EventEmitter : <code>Object</code>
Object implementing event emitter behavior which can be mixed into other
objects, classes, or prototypes. See README for illustrations.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| on | [<code>AddEventHandler</code>](#AddEventHandler) | Associates an event handler function with an event name. |
| once | [<code>AddOneTimeEventHandler</code>](#AddOneTimeEventHandler) | Same as [AddEventHandler](#AddEventHandler), but sets `options.once` to `true`. |
| off | [<code>RemoveEventHandler</code>](#RemoveEventHandler) | Remove an event handler. |
| _emit | [<code>EmitEvent</code>](#EmitEvent) | Call all registered event handlers. |



# Use cases

There are three distinct use cases for event handlers:

1. Simple callbacks (simple data type arguments, no return value)
2. Content filtering (arguments modified by reference, no return value)
3. Queries (with return value)

All three cases can be covered with the `on()` method.

To illustrate, we are going to implement a simple Cat:

```javascript
var Cat = function() {
  var self = this; // be explicit

  // Generate the mix-in object with default property names
  var hook_mixin = CaptainHook();

  // Mix in the generated hook functionality.
  // This makes available to us self.on(), self.off(), self._emit()
  Object.assign(self, hook_mixin);

  self.makeSound = function() {
    var obj = {sound: 'meow'};
    self._emit('makeSound', obj);
    console.log(`I make sound: "${obj.sound}"`);
  };

  self.scratch = function() {
    var allowed = self._emit('scratch').reduce(function(acc, val) {
      return acc && val
    }, true);

    // All event handlers need to return true if this action is to be allowed.
    if (allowed) {
      console.log("Scratch!");
    } else {
      console.log("I am not allowed to scratch, so I won't do it!");
    }
  };

  self.beHungry = function() {
    Promise.all(self._emit('askForFood'))
    .then(function(given_foods) {
      console.log("I am eating", given_foods);
    })
  }
};
```

Instantiate the application:

```javascript
var felix = new Cat();
```

Generic behavior:

```javascript
felix.makeSound();
// -> I make sound: "meow"

felix.scratch();
// -> Scratch!
```

Use event handlers in three possible ways:

**1\. Simple observer** (no return value, no content filtering):

```javascript
felix.on('makeSound', function() {
  console.log("Felix is about to make a sound.")
});

felix.makeSound();

// -> Felix is about to make a sound.
// -> I make sound: "meow"
```

**2\. Filter content passed by reference** (no return value):

```javascript
felix.on('makeSound', function(opts) {
  opts.sound += ' hiss';
});

felix.makeSound();
// -> I make sound: "meow hiss"
```

**3\. Query responses.** Note that event handlers do not have access to the return values of any other event handler. Here, we define two event handlers who vote for different outcomes:

```javascript
felix.on('scratch', function() {
  return false; // I do not allow scratching.
});

felix.on('scratch', function() {
  return true; // I allow scratching.
});

felix.scratch();
// -> I am not allowed to scratch, so I won't do it!
```

This is also useful for Promises:

```javascript
felix.on('askForFood', function() {
  console.log('Felix is asking for food');
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      console.log('I am giving felix food');
      resolve('dryfood');
    }, 1000);
  })
});

felix.on('askForFood', function() {
  console.log('Felix is asking for food');
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      console.log('I am giving felix food');
      resolve('sardines');
    }, 2000);
  })
});

felix.beHungry()
// after 2 seconds -> I am eating ["dryfood", "sardines"]
```
