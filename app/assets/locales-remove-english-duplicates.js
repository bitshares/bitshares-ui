const fs = require("fs");

let template = require("./locales/locale-en.json");

let locales = require("./locales.js");
let localeObjects = {};

function checkAndRemove(object, template) {
    let templateKeys = Object.keys(template);
    let objectKeys = Object.keys(object);

    objectKeys.forEach(key => {
        if (typeof object[key] === "object") {
            object[key] = checkAndRemove(object[key], template[key]);
        } else if (object[key] === template[key]) {
            object[key] = "";
        }
    });

    return object;
}

function writeLocaleFile(locale, localeObject) {
    fs.writeFile(
        `./app/assets/locales/locale-${locale}.json`,
        JSON.stringify(localeObject, null, 4),
        "utf8",
        err => {
            if (err) {
                console.error("Error writing file:", err);
            } else {
                console.log(
                    `*** Wrote updated sorted json with all keys to ./locales/locale-${locale}.json ***`
                );
            }
        }
    );
}

locales.forEach(locale => {
    localeObjects[locale] = require(`./locales/locale-${locale}.json`);
    localeObjects[locale] = checkAndRemove(localeObjects[locale], template);

    writeLocaleFile(locale, localeObjects[locale]);
});
