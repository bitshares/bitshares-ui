import React from "react";
import ReactDOM from "react-dom";
import AppInit from "./AppInit";
if (__PERFORMANCE_DEVTOOL__) {
    const {registerObserver} = require("react-perf-devtool");
    registerObserver();
}

const rootEl = document.getElementById("content");
const render = () => {
    console.log("render");
    // window.onerror = function (message) {
    //     console.log('we have error');
    //     alert('An error has occurred! ', message)
    //     return true
    // }
    var errordialog = function(msg, url, linenumber) {
        var dialog = document.createElement("div");
        dialog.className = "errordialog";
        dialog.innerHTML =
            '&nbsp;<b style="color:red">JavaScript Error: </b>' +
            msg +
            " at line number " +
            linenumber +
            ". Please inform webmaster.";
        document.body.appendChild(dialog);
        return true;
    };

    window.onerror = function(msg, url, linenumber) {
        alert("error ", msg);
        return errordialog(msg, url, linenumber);
    };

    ReactDOM.render(<AppInit />, rootEl);
};
render();
