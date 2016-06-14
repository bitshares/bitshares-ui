require("./stylesheets/app.scss");
require("file?name=index.html!./index-dev.html");
require("file?name=favicon.ico!./favicon.ico");
require("babel/polyfill");
require("whatwg-fetch");
require("indexeddbshim");
require("./asset-symbols/symbols.js");
require("./locales/locales.js");
