require("./stylesheets/app.scss");
require("file?name=index.html!./index.html");

var fonts = ["Roboto-Bold", "Roboto-Light", "Roboto-Regular", "RobotoCondensed-Regular"];
var fonts_ext = ["eot", "svg", "ttf", "woff"];
for (let font of fonts) {
    for (let ext of fonts_ext) {
        require(`./fonts/${font}.${ext}`);
    }
}
