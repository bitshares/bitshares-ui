import browser from "./browser";
/*
* Using feature detectino techniques described here:
* https://stackoverflow.com/questions/2860879/detecting-if-a-browser-is-using-private-browsing-mode
*/
export default function(cb) {
    let ua = navigator.userAgent.toLowerCase();
    let name = browser();
    if (name === "firefox") {
        var db = indexedDB.open("test");
        db.onerror = function() {
            cb(true);
        };
        db.onsuccess = function() {
            cb(false);
        };
    } else if (name === "safari") {
        var storage = window.sessionStorage;
        try {
            storage.setItem("someKeyHere", "test");
            storage.removeItem("someKeyHere");
            cb(false);
        } catch (e) {
            if (
                e.code === DOMException.QUOTA_EXCEEDED_ERR &&
                storage.length === 0
            ) {
                //Private here
                cb(true);
            } else {
                cb(false);
            }
        }
    } else if (name === "chrome" || name === "opera") {
        var fs = window.RequestFileSystem || window.webkitRequestFileSystem;
        if (!fs) {
            cb(false);
            return;
        }

        fs(
            window.TEMPORARY,
            100,
            function(fs) {
                //Not incognito mode
                cb(false);
            },
            function(err) {
                //Incognito mode
                cb(true);
            }
        );
    } else if (name === "ie") {
        if (
            !window.indexedDB &&
            (window.PointerEvent || window.MSPointerEvent)
        ) {
            //Privacy Mode
            cb(true);
        } else {
            cb(false);
        }
    }
}
