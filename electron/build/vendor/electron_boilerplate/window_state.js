// Simple module to help you remember the size and position of windows.
// Can be used for more than one window, just construct many
// instances of it and give each different name.

'use strict';

var app = require('app');
var fs = require('fs');

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16).substring(1);
    }
    return s4() + s4() + s4() + s4();
}

module.exports = function (name, defaults) {
    var stateStoreFile = 'window-state-' + name + '.json';
    var state_file_name = app.getPath('userData') + "/" + stateStoreFile;
    var state_file_data = null;
    try { state_file_data = fs.readFileSync(state_file_name); }
    catch(error) {}

    var state = {width: defaults.width, height: defaults.height};
    if (state_file_data) {
        try { state = JSON.parse(state_file_data); }
        catch(error) {}
    }
    if (!state.guid) state.guid = guid();
    if (!state.width || !state.height) state.width = defaults.width; state.height = defaults.height;

    var saveState = function (win) {
        if (!win.isMaximized() && !win.isMinimized()) {
            var position = win.getPosition();
            var size = win.getSize();
            state.x = position[0];
            state.y = position[1];
            state.width = size[0];
            state.height = size[1];
        }
        state.isMaximized = win.isMaximized();
        fs.writeFileSync(state_file_name, JSON.stringify(state));
    };

    return {
        get x() { return state.x; },
        get y() { return state.y; },
        get width() { return state.width; },
        get height() { return state.height; },
        get isMaximized() { return state.isMaximized; },
        get guid() { return state.guid; },
        saveState: saveState
    };
};
