require("./assets/loader");
if (!window.Intl) {
    require(['Intl'], function(Intl) {
        window.Intl = Intl;
        require("App.jsx");
    });
} else {
    require("App.jsx");
}
