# captain-hook

## A configurable mix-in providing flexible event emission ("hooking") for JavaScript objects




### Overview

An event-emitter API enables clearly defined interaction between separate pieces of code (e.g. main application vs. plugins). Event emitting allows you to keep the functionality of your application general (make it more suitable to be published Open Source), while specializing its behavior by having external (perhaps proprietary) code hook into those events.

Methods on your objects will be able to signal "events" to external "event handlers". External code can add event handlers via `.on()` and remove them via `.off()`, while your own object can call them via `._emit()`. The names of these three methods can be explicitly configured via the factory function.


### Why inventing yet another event emitter?

I found dozens of event emitter libraries on Github. Most of them were too large, too 'smart', or too restrictive.

Features of my library:

* No dependencies.
* Only ~100 lines of code.
* Only ~1800 bytes minified.
* Works in browsers and in Node.js.
* ES6 source.
* Minified ES5 distribution file with source map.
* Includes tests.
* Attribute/method names are explicitly configurable.
* Returns to the emitter optional return values from event handlers as an array
* When adding event handlers, a supplied option object allows
   * sorting the handler according to given priority,
   * setting the `this` context of the handler,
   * setting of a tag/label of the handler.
* Event handlers can only be removed when their tag is known. Prevents interaction between external plugin code.
* The storage object for event handlers and their options can be privately scoped if needed. This is to ensure that external plugins cannot remove or inspect each other's event handlers.
* Flexible use: add the mix-in to prototypes or to instances (see below).


### Development and building

Install development dependencies (only needed to build the ES5/UMD versions):

    npm install

To generate an UMD module that works in browsers and Node.js:

    npm run prepare

Run tests on the UMD module:

    npm test


    
### How to apply the mix-in

If your environment can import ES6 modules directly, load `captain-hook.js`, otherwise load the Universal Module Definition (UMD) variant `dist/captain-hook.umd.min.js`.

The default export of the module is a factory function (see `CaptainHook()` in the API section).

The following 5 methods are equivalent in their effects.

#### 1\. Mix into prototypes

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
    // -> Cleaning up poop
    
    elvis = new Dog('Elvis');
    elvis.on('poop', function() { console.log("Oh no, another dog pooped!"); })
    elvis.poop();
    // -> I am pooping
    // -> Oh no, another dog pooped!
```

If you prefer 'old-style' prototypes:

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
    // -> Cleaning up poop
    
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
    
#### 2\. Mix into instances

Each instance will have a full copy of the attributes/methods.

In the example below, note that we pass the configuration `handlers_prop: null`. This makes the storage of the event handler functions private, preventing information leaks to external code.

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
    // -> Cleaning up poop
    
    elvis = new Dog('Elvis');
    elvis.on('poop', function() { console.log("Oh no, another dog pooped!"); })
    elvis.poop();
    // -> I am pooping
    // -> Oh no, another dog pooped!
    
    // Note that there is no way to read or modify the added event handlers via the instances.
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




### API


#### CaptainHook(options)

This is a factory function returning a plain object. The default method/property names for adding and removing handlers are `on()`, `off()`, and `_emit()`. The attached handlers are stored in a property named `_handlers` by default. All property names can be explicitly configured via the factory function to prevent naming conflicts, e.g.:

    var captain_hook = CaptainHook({
      on_prop:       'on',       // public
      off_prop:      'off',      // public
      emit_prop:     '_emit',    // pseudo-private
      handlers_prop: '_handlers' // pseudo-private
    });

Options:

* `on_prop` \<string> - Method property name for setting event handlers. Defaults to 'on'.
* `off_prop` \<string> - Method property name for removing event handlers. Defaults to 'off'.
* `emit_prop` \<string> - Method property name for calling event handlers. Defaults to '_emit'.
* `handlers_prop` \<string> - Property name for storing event handlers. Defaults to '_handlers'. If `null`, a privately scoped storage will be used, in which case you need to mix in CaptainHook into every instance, otherwise event handlers would be shared across instances.
 


#### on(eventname,handler[,opts])

Add an event handler to an event name.

* `eventname` \<string>
* `handler` \<Function>
* `opts` \<Object>
   * `tag` \<string> Optional. Name tag of handler for optional removal with `.off()`
   * `priority` \<number> Defaults to `10`. Higher numbers will be executed first.
   * `context` \<Object> Value to use for the first argument of `Function.call()` when calling `handler`, changing the meaning of `this` inside `handler`. By default `this` in the `handler` is the object which emitted the event.
   * `once` \<boolean> - Set to `true` if `handler` should only be ran once. Defaults to `false`.



#### off(eventname,tag)

Remove an event handler named `tag` from `eventname`. If `tag` or `eventname` are not registered, this method does nothing.

* `eventname` \<string>
* `tag` \<string>



#### _emit(eventname[,...args])

Run all registered event handlers for `eventname` with the argument list `...args`.

* `eventname` \<string>
* `args` Arbitrary number of arguments
* Returns: \<Array> Array of values returned from the executed event handlers.




### Use cases for event emission

There are three distinct use cases for event handlers:

1. Simple callbacks (simple data type arguments, no return value)
2. Content filtering (arguments modified by reference, no return value)
3. Queries (with return value)

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

    var felix = new Cat();
    
Generic behavior:
    
    
    felix.makeSound();
    // -> I make sound: "meow"
    
    felix.scratch();
    // -> Scratch!
    
Use event handlers in three possible ways:

**1\. Simple observer** (no return value, no content filtering):

    felix.on('makeSound', function() {
      console.log("Felix is about to make a sound.")
    });
    
    felix.makeSound();
    
    // -> Felix is about to make a sound.
    // -> I make sound: "meow"

**2\. Filter content passed by reference** (no return value):

    felix.on('makeSound', function(opts) {
      opts.sound += ' hiss';
    });
    
    felix.makeSound();
    // -> I make sound: "meow hiss"

**3\. Query responses.** Note that event handlers do not have access to the return values of any other event handler. Here, we define two event handlers who vote for different outcomes:

    felix.on('scratch', function() {
      return false; // I do not allow scratching.
    });
    
    felix.on('scratch', function() {
      return true; // I allow scratching.
    });
    
    felix.scratch();
    // -> I am not allowed to scratch, so I won't do it!
    
This is also useful for Promises:
    
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
