const CaptainHook = require('../dist/captain-hook.umd.min.js').default;

// test custom attribute names
var inst = CaptainHook({
  on_prop: 'my_on',
  off_prop: 'my_off',
  once_prop: 'my_once',
  emit_prop: '_my_emit',
  handlers_prop: '_my_handlers',
});

// object for testing a different handler context
var obj = { number: 100 };

// for testing the default handler context
inst.number = 1;

// for testing handler return vales
inst.add = function(num) {
  return num + this.number + this._my_emit('add').reduce((i, j) => i + j, 0);
}

// for testing the default handler context
inst.my_on('add', function() {
  return this.number;
});

// for testing a custom handler context
inst.my_on('add', function() {
  return this.number
}, {context: obj});

// for testing a one-time event handler
inst.my_once('add', () => 7)

// test everything above
console.assert(inst.add(3) == 112);
console.assert(inst.add(3) == 105);


// for testing options.priority
inst.append = function() {
  return this._my_emit('append').join(',');
}
inst.my_on('append', () => 'two', {priority: 20});
inst.my_on('append', () => 'three');
inst.my_on('append', () => 'one', {priority: 100, tag: 'myhandler'});
console.assert(inst.append() == "one,two,three")

// test off()
inst.my_off('append', 'myhandler');
console.assert(inst.append() == "two,three")


// Test if handlers_prop is private
inst = CaptainHook({
  handlers_prop: null,
});
inst.on('add', () => 5);
console.assert(typeof inst._handlers == 'undefined');

console.log("All tests succeeded!");
