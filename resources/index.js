(function () {
    'use strict';

    var app = require('electron').app;
    var BrowserWindow = require('electron').BrowserWindow;
    var Menu = require("electron").Menu;
    var env = require('./env_config');
    var devHelper = require('./dev_helper');
    var windowStateKeeper = require('./window_state');
    var fs = require('fs');
    // var git = require("git-rev-sync");

    var mainWindow;

    // Preserver of the window size and position between app launches.
    var mainWindowState = windowStateKeeper('main', {
        width: 1000,
        height: 800
    });
    global.guid = mainWindowState.guid;
    // global.version = JSON.stringify(git.tag());

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

        mainWindow.loadURL('file://' + __dirname + '/index.html');

        //if (env.name !== 'production') {
        //devHelper.setDevMenu();
        //mainWindow.openDevTools();
        //}

        mainWindow.on('close', function () {
            mainWindowState.saveState(mainWindow);
        });

        mainWindow.webContents.on('new-window', function(e, url) {
            e.preventDefault();
            require('electron').shell.openExternal(url);
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
                    BrowserWindow.getFocusedWindow().reload();
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
