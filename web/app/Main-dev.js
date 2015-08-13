require("./assets/loader-dev");
if (!window.Intl) {
    require(['intl'], Intl => {
        Intl.__addLocaleData(require("./assets/intl-data/en.json"));
        window.Intl = Intl;
        require("App.jsx");
    });
} else {
    require("App.jsx");
}
