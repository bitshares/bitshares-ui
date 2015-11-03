(function () {
    'use strict';

    var app = require('app');
    var BrowserWindow = require('browser-window');
    var Menu = require("menu");
    var env = require('./vendor/electron_boilerplate/env_config');
    var devHelper = require('./vendor/electron_boilerplate/dev_helper');
    var windowStateKeeper = require('./vendor/electron_boilerplate/window_state');
    var fs = require('fs');

    var mainWindow;

    // Preserver of the window size and position between app launches.
    var mainWindowState = windowStateKeeper('main', {
        width: 1000,
        height: 600
    });
    global.guid = mainWindowState.guid;
    global.version = JSON.parse(fs.readFileSync(__dirname + "/package.json")).version;

    app.on('ready', function () {

        mainWindow = new BrowserWindow({
            x: mainWindowState.x,
            y: mainWindowState.y,
            width: mainWindowState.width,
            height: mainWindowState.height
        });

        if (mainWindowState.isMaximized) {
            mainWindow.maximize();
        }

        mainWindow.loadUrl('file://' + __dirname + '/index.html');

        //if (env.name !== 'production') {
        //devHelper.setDevMenu();
        //mainWindow.openDevTools();
        //}

        mainWindow.on('close', function () {
            mainWindowState.saveState(mainWindow);
        });

        // Create the Application's main menu

        var app_menu = process.platform === 'darwin' ?
        {
            label: "Application",
            submenu: [
                {label: "About Application", selector: "orderFrontStandardAboutPanel:"},
                {type: "separator"},
                {label: "Quit", accelerator: "Command+Q", click: function () { app.quit(); }}
            ]
        }
            :
        {
            label: "File",
            submenu: [
                {label: "Quit", accelerator: "Command+Q", click: function () { app.quit(); }}
            ]
        }

        var template = [app_menu, {
            label: "Edit",
            submenu: [
                {label: "Undo", accelerator: "Command+Z", selector: "undo:"},
                {label: "Redo", accelerator: "Shift+Command+Z", selector: "redo:"},
                {type: "separator"},
                {label: "Cut", accelerator: "Command+X", selector: "cut:"},
                {label: "Copy", accelerator: "Command+C", selector: "copy:"},
                {label: "Paste", accelerator: "Command+V", selector: "paste:"},
                {label: "Select All", accelerator: "Command+A", selector: "selectAll:"}
            ]
        }, {
            label: 'View',
            submenu: [{
                label: 'Reload',
                accelerator: 'CmdOrCtrl+R',
                click: function () {
                    BrowserWindow.getFocusedWindow().reloadIgnoringCache();
                }
            }, {
                label: 'Toggle DevTools',
                accelerator: 'Alt+CmdOrCtrl+I',
                click: function () {
                    BrowserWindow.getFocusedWindow().toggleDevTools();
                }
            }]
        }
        ];

        Menu.setApplicationMenu(Menu.buildFromTemplate(template));

    });

    app.on('window-all-closed', function () {
        app.quit();
    });

})();
//# sourceMappingURL=background.js.map
