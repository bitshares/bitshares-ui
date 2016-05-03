require("./assets/loader-dev");
if (!window.Intl) { // Safari polyfill
    require.ensure(['intl'], require => {
    	window.Intl = require('intl');
        Intl.__addLocaleData(require("./assets/intl-data/en.json"));        
        require("App.jsx");
    });
} else {
    require("App.jsx");
}
