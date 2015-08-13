var webpack = require('webpack');
var ProgressPlugin = require('webpack/lib/ProgressPlugin');
var WebpackDevServer = require('webpack-dev-server');
var config = require('./conf/webpack-dev');
var compiler = webpack(config);

compiler.apply(new ProgressPlugin(function (percentage, msg) {
    process.stdout.write((percentage * 100).toFixed(2) + '% ' + msg + '                 \033[0G');
}));
new WebpackDevServer(compiler, {
    publicPath: config.output.publicPath,
    hot: true,
    historyApiFallback: true,
    quiet: false,
    stats: {colors: true},
    port: 8080
}).listen(8080, 'localhost', function (err, result) {
    if (err) {
        console.log(err);
    }
    console.log('Listening at localhost:8080');
});
