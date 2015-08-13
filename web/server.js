var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var config = require('./conf/webpack-dev');
new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  hot: true,
  historyApiFallback: true,
  quiet: false,
  stats: { colors: true},
  port: 8080
}).listen(8080, 'localhost', function (err, result) {
  if (err) {
    console.log(err);
  }
  console.log('Listening at localhost:8080');
});