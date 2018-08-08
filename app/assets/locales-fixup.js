const fs = require("fs");

let template = require("./locales/locale-en.json");

let locales = require("./locales.js");
let localeObjects = {};

function checkAndAssignKeys(object, template) {
    let templateKeys = Object.keys(template);
    let objectKeys = Object.keys(object);

    /* Check if the object is missing keys from the template */
    templateKeys.forEach(key => {
        if (typeof object[key] === "object") {
            object[key] = checkAndAssignKeys(object[key], template[key]);
        } else if (!(key in object)) {
            object[key] = template[key];
        }
    });

    /* Check if the object has keys that are not in the template, if so remove them*/
    objectKeys.forEach(key => {
        if (!(key in template)) {
            delete object[key];
        } else if (typeof object[key] === "object") {
            object[key] = checkAndAssignKeys(object[key], template[key]);
        }
    });

    return object;
}

function recursiveSort(object) {
    let sortedObject = {};

    let sortedKeys = Object.keys(object).sort((a, b) => {
        if (a > b) return 1;
        if (a < b) return -1;
        return 0;
    });

    sortedKeys.forEach(key => {
        if (typeof object[key] === "object") {
            sortedObject[key] = recursiveSort(object[key]);
        } else {
            sortedObject[key] = object[key];
        }
    });

    return sortedObject;
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
    localeObjects[locale] = checkAndAssignKeys(
        localeObjects[locale],
        template,
        locale
    );
    localeObjects[locale] = recursiveSort(localeObjects[locale]);

    writeLocaleFile(locale, localeObjects[locale]);
});

template = recursiveSort(template);
writeLocaleFile("en", template);
