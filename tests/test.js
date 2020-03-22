/* eslint-disable prefer-arrow-callback, func-names */

import assert from 'assert';

import CaptainHook from '../src/captain-hook.js'

it('sets default method name `on` in prototype', function () {
  const inst = Object.create(CaptainHook());
  assert.equal(inst.hasOwnProperty('on'), false);
  assert.equal(Object.getPrototypeOf(inst).hasOwnProperty('on'), true);
});

it('sets default method name `once` in prototype', function () {
  const inst = Object.create(CaptainHook());
  assert.equal(inst.hasOwnProperty('once'), false);
  assert.equal(Object.getPrototypeOf(inst).hasOwnProperty('once'), true);
});

it('sets default method name `off` in prototype', function () {
  const inst = Object.create(CaptainHook());
  assert.equal(inst.hasOwnProperty('off'), false);
  assert.equal(Object.getPrototypeOf(inst).hasOwnProperty('off'), true);
});

it('sets default method name `_emit` in prototype', function () {
  const inst = Object.create(CaptainHook());
  assert.equal(inst.hasOwnProperty('_emit'), false);
  assert.equal(Object.getPrototypeOf(inst).hasOwnProperty('_emit'), true);
});

it('sets default property name `_handlers` on instance', function () {
  const inst = Object.create(CaptainHook());
  inst.on('event', function () {});
  assert.equal(inst.hasOwnProperty('_handlers'), true);
  assert.equal(Object.getPrototypeOf(inst).hasOwnProperty('_handlers'), false);
});

it('cannot access truly private handler storage', function () {
  const inst = Object.create(CaptainHook({
    handlers_prop: null,
  }));
  inst.on('event', function () {}); // this creates _handlers on instance
  assert.equal(inst.hasOwnProperty('_handlers'), false);
  assert.equal(Object.getPrototypeOf(inst).hasOwnProperty('_handlers'), false);
});


it('sets custom method name for `on`', function () {
  const inst = Object.create(CaptainHook({
    on_prop: 'myon'
  }));
  assert.equal(inst.hasOwnProperty('myon'), false);
  assert.equal(Object.getPrototypeOf(inst).hasOwnProperty('myon'), true);
});

it('sets custom method name for `once`', function () {
  const inst = Object.create(CaptainHook({
    once_prop: 'myonce'
  }));
  assert.equal(inst.hasOwnProperty('myonce'), false);
  assert.equal(Object.getPrototypeOf(inst).hasOwnProperty('myonce'), true);
});

it('sets custom method name for `off`', function () {
  const inst = Object.create(CaptainHook({
    off_prop: 'myoff'
  }));
  assert.equal(inst.hasOwnProperty('myoff'), false);
  assert.equal(Object.getPrototypeOf(inst).hasOwnProperty('myoff'), true);
});

it('sets custom method name for `_emit`', function () {
  const inst = Object.create(CaptainHook({
    emit_prop: 'myemit'
  }));
  assert.equal(inst.hasOwnProperty('myemit'), false);
  assert.equal(Object.getPrototypeOf(inst).hasOwnProperty('myemit'), true);
});

it('sets custom method name for `_handlers`', function () {
  const inst = Object.create(CaptainHook({
    handlers_prop: '_myhandlers'
  }));
  inst.on('event', function () {}); // this creates _handlers on instance
  assert.equal(inst.hasOwnProperty('_myhandlers'), true);
  assert.equal(Object.getPrototypeOf(inst).hasOwnProperty('_myhandlers'), false);
});


it('repeatedly calls registered handlers, concatenates the return values, and sorts callbacks by priority', function () {
  const App = function () {
    this.do = function () {
      const results = this._emit('some_event');
      assert.equal(results[0], 'b');
      assert.equal(results[1], 'a');
    };
  };
  Object.assign(App.prototype, CaptainHook());
  const inst = new App();
  inst.on('some_event', function () { return 'a'; }, {
    priority: 2,
  });
  inst.on('some_event', function () { return 'b'; }, {
    priority: 9,
  });
  inst.do();
  inst.do(); // second time must succeed too
});


it('uses truly private callback storage', function () {
  const App = function () {
    this.do = function () {
      const results = this._emit('some_event');
      assert.equal(results[0], 'b');
      assert.equal(results[1], 'a');
    };
  };
  Object.assign(App.prototype, CaptainHook({
    handlers_prop: null,
  }));
  const inst = new App();
  inst.on('some_event', function () { return 'a'; }, {
    priority: 2,
  });
  inst.on('some_event', function () { return 'b'; }, {
    priority: 9,
  });
  inst.do();
});


it('calls registered handlers only once', function () {
  const App = function () {
    this.do = function () {
      return this._emit('some_event');
    };
  };
  Object.assign(App.prototype, CaptainHook());
  const inst = new App();
  inst.once('some_event', function () { return 'a'; });
  let result = inst.do();
  assert.equal(result[0], 'a');

  result = inst.do(); // second time should not call event handler
  assert.equal(result.length, 0);
});


it('removes registered handlers by tag', function () {
  const App = function () {
    this.do = function () {
      return this._emit('some_event');
    };
  };
  Object.assign(App.prototype, CaptainHook());
  const inst = new App();
  inst.on('some_event', function () { return 'a'; }, {
    tag: 'mysecret',
  });
  let result = inst.do();
  assert.equal(result[0], 'a');

  inst.off('some_event', 'mysecret');
  result = inst.do(); // second time should not call event handler
  assert.equal(result.length, 0);
});


it('does not remove registered handlers when supplying wrong tag', function () {
  const App = function () {
    this.do = function () {
      const results = this._emit('some_event');
      assert.equal(results[0], 'a');
    };
  };
  Object.assign(App.prototype, CaptainHook());
  const inst = new App();
  inst.on('some_event', function () { return 'a'; }, {
    tag: 'mysecret',
  });
  inst.do();

  inst.off('some_event', 'forgotsecret');
  inst.do(); // second time should succeed too
});


it('does not share handler storage between instances', function () {
  const App = function () {
    this.do = function () {
      return this._emit('some_event');
    };
  };
  Object.assign(App.prototype, CaptainHook());

  const inst1 = new App();
  inst1.on('some_event', function () { return 'a'; }, {
    priority: 999,
  });
  inst1.on('some_event', function () { return 'b'; }, {
    priority: 1001,
  });

  const inst2 = new App();
  inst2.on('some_event', function () { return 'c'; }, {
    priority: 2,
  });
  inst2.on('some_event', function () { return 'd'; }, {
    priority: 9,
  });
  const result = inst2.do();
  assert.equal(result[0], 'd');
  assert.equal(result[1], 'c');
});


it('does share handler storage between instances when using private storage, this is a feature and a \'gotcha\'', function () {
  const App = function () {
    this.do = function () {
      return this._emit('some_event');
    };
  };
  Object.assign(App.prototype, CaptainHook({
    handlers_prop: null,
  }));

  const inst1 = new App();
  inst1.on('some_event', function () { return 'a'; }, {
    priority: 4,
  });
  inst1.on('some_event', function () { return 'b'; }, {
    priority: 3,
  });

  const inst2 = new App();
  inst2.on('some_event', function () { return 'c'; }, {
    priority: 2,
  });
  inst2.on('some_event', function () { return 'd'; }, {
    priority: 1,
  });
  const result = inst2.do();

  assert.equal(result[0], 'a');
  assert.equal(result[1], 'b');
  assert.equal(result[2], 'c');
  assert.equal(result[3], 'd');
});


it('does not share handler storage between instances when mixed into instances and when using private handler storage ', function () {
  const App = function () {
    this.do = function () {
      return this._emit('some_event');
    };
  };

  const inst1 = new App();
  Object.assign(inst1, CaptainHook({
    handlers_prop: null,
  }));

  const inst2 = new App();
  Object.assign(inst2, CaptainHook({
    handlers_prop: null,
  }));

  inst1.on('some_event', function () { return 'a'; }, {
    priority: 999,
  });
  inst1.on('some_event', function () { return 'b'; }, {
    priority: 1001,
  });

  inst2.on('some_event', function () { return 'c'; }, {
    priority: 2,
  });
  inst2.on('some_event', function () { return 'd'; }, {
    priority: 9,
  });
  const result = inst2.do();
  assert.equal(result[0], 'd');
  assert.equal(result[1], 'c');
});


it('passes arguments to event handlers', function () {
  const App = function () {
    this.do = function () {
      const results = this._emit('some_event', 1, 'two', {three: 3});
    };
  };
  Object.assign(App.prototype, CaptainHook());

  const inst = new App();
  inst.on('some_event', function(num, str, obj) {
    assert.equal(num, 1);
    assert.equal(str, 'two');
    assert.equal(obj.three, 3);
  });
  inst.do();
});


it('sets `this` context of event handlers, by default to the instance', function () {
  const App = function () {
    this.string = 'hello';
    this.do = function () {
      return this._emit('some_event');
    };
  };
  Object.assign(App.prototype, CaptainHook());

  const inst = new App();
  inst.on('some_event', function () {
    return this.string;
  });
  assert.equal(inst.do(), 'hello');
});


it('sets `this` context of event handlers to some other object', function () {
  const App = function () {
    this.string = 'hello';
    this.do = function () {
      return this._emit('some_event');
    };
  };
  Object.assign(App.prototype, CaptainHook());

  const contextobj = {
    string: 'world',
  };

  const inst = new App();
  inst.on('some_event', function () {
    return this.string;
  }, {
    context: contextobj,
  });
  assert.equal(inst.do(), 'world');
});
