var coffee = require('coffee-script');
var babel_jest = require('babel-jest');

module.exports = {
  process: function(src, path) {
    src = babel_jest.process(src, path)
    // CoffeeScript files can be .coffee, .litcoffee, or .coffee.md
    if (coffee.helpers.isCoffee(path)) {
      return coffee.compile(src, {'bare': true});
    }
    return src;
  }
}
