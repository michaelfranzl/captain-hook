const fs = require('fs');
const UglifyJS = require("uglify-js");
const babel_core = require("babel-core");

var es5umd = babel_core.transformFileSync('src/captain-hook.js', {
  presets: ["es2015"],
  plugins: ["transform-es2015-modules-umd"],
  //minified: true,
  //comments: false,
  sourceMaps: true,
});

/*
// babel doesn't seem to be able to attach a //# comment, so we append it manually.
fs.writeFileSync('dist/captain-hook.umd.js', es5umd.code + "\n//# sourceMappingURL=captain-hook.umd.js.map");

fs.writeFileSync('dist/captain-hook.umd.js.map', JSON.stringify(es5umd.map));
*/


var minified = UglifyJS.minify(es5umd.code, {
  mangle: true,
  sourceMap: {
    content: es5umd.map, // base the source map on the original file
    url: "captain-hook.umd.min.map" // value for the //# comment
  },
});
// output the minified and compressed distribution file, with source map
fs.writeFileSync('dist/captain-hook.umd.min.js', minified.code);
fs.writeFileSync('dist/captain-hook.umd.min.map', minified.map);
