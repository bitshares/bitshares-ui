require("./assets/loader");
if (!window.Intl) {
    require(['Intl'], Intl => {
        Intl.__addLocaleData(require("./assets/intl-data/en.json"));
        window.Intl = Intl;
        require("App.jsx");
    });
} else {
    require("App.jsx");
}
