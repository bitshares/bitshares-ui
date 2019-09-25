const scamAccounts = "./app/lib/common/scamAccounts.js";
const fs = require("fs");
const path = require("path");
const util = require("util");
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const {ChainStore} = require("tuscjs");

readFile(path.resolve(scamAccounts), "utf8")
    .then(str => {
        let matches = [].concat
            .apply(
                [],
                str.split('"').map((v, i) => {
                    return i % 2 ? '"' + v + '"' : v.split(" ");
                })
            )
            .filter(Boolean);
        let result = matches.map((o, i) => {
            if (o.includes('"')) {
                let obj = o.substring(1, o.length - 1);
                let db = ChainStore.getAccount(obj);
                if (db) {
                    let id = db.get("id");
                    let nextElement = matches[i + 3];
                    if (nextElement && id !== +nextElement.replace(/\"/g, "")) {
                        return ["   ", o, ', \n    "', id, '"'].join("");
                    } else {
                        matches[i + 3] = id;
                    }
                }
            }
            return o;
        });
        return result.join(" ");
    })
    .then(result => {
        writeFile(path.resolve(scamAccounts) + "x", result);
    });
