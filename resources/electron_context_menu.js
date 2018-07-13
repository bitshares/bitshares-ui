// The MIT License (MIT)
//
// Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)
// Modifications by Phil Schalm <pnomolos@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

"use strict";
const electron = require("electron");
const webContents = win => win.webContents || win.getWebContents();

function create(win, opts) {
    webContents(win).on("context-menu", (e, props) => {
        if (
            typeof opts.shouldShowMenu === "function" &&
            opts.shouldShowMenu(e, props) === false
        ) {
            return;
        }

        const editFlags = props.editFlags;
        const hasText = props.selectionText.trim().length > 0;
        const can = type => editFlags[`can${type}`] && hasText;

        let menuTpl = [
            {
                type: "separator"
            },
            {
                id: "cut",
                label: "Cut",
                // Needed because of macOS limitation:
                // https://github.com/electron/electron/issues/5860
                role: can("Cut") ? "cut" : "",
                enabled: can("Cut"),
                accelerator: "CmdOrCtrl+X",
                visible: props.isEditable
            },
            {
                id: "copy",
                label: "Copy",
                role: can("Copy") ? "copy" : "",
                enabled: can("Copy"),
                accelerator: "CmdOrCtrl+C",
                visible: props.isEditable || hasText
            },
            {
                id: "paste",
                label: "Paste",
                role: editFlags.canPaste ? "paste" : "",
                enabled: editFlags.canPaste,
                accelerator: "CmdOrCtrl+V",
                visible: props.isEditable
            },
            {
                type: "separator"
            }
        ];

        if (props.linkURL && props.mediaType === "none") {
            menuTpl = [
                {
                    type: "separator"
                },
                {
                    id: "copyLink",
                    label: "Copy Link",
                    click() {
                        if (process.platform === "darwin") {
                            electron.clipboard.writeBookmark(
                                props.linkText,
                                props.linkURL
                            );
                        } else {
                            electron.clipboard.writeText(props.linkURL);
                        }
                    }
                },
                {
                    type: "separator"
                }
            ];
        }

        if (opts.prepend) {
            const result = opts.prepend(props, win);

            if (Array.isArray(result)) {
                menuTpl.unshift(...result);
            }
        }

        if (opts.append) {
            const result = opts.append(props, win);

            if (Array.isArray(result)) {
                menuTpl.push(...result);
            }
        }

        // Apply custom labels for default menu items
        if (opts.labels) {
            for (const menuItem of menuTpl) {
                if (opts.labels[menuItem.id]) {
                    menuItem.label = opts.labels[menuItem.id];
                }
            }
        }

        // Filter out leading/trailing separators
        // TODO: https://github.com/electron/electron/issues/5869
        menuTpl = delUnusedElements(menuTpl);

        if (menuTpl.length > 0) {
            const menu = (electron.remote
                ? electron.remote.Menu
                : electron.Menu
            ).buildFromTemplate(menuTpl);

            /*
			 * When electron.remote is not available this runs in the browser process.
			 * We can safely use win in this case as it refers to the window the
			 * context-menu should open in.
			 * When this is being called from a webView, we can't use win as this
			 * would refere to the webView which is not allowed to render a popup menu.
			 */
            menu.popup(
                electron.remote ? electron.remote.getCurrentWindow() : win
            );
        }
    });
}

function delUnusedElements(menuTpl) {
    let notDeletedPrevEl;
    return menuTpl.filter(el => el.visible !== false).filter((el, i, arr) => {
        const toDelete =
            el.type === "separator" &&
            (!notDeletedPrevEl ||
                i === arr.length - 1 ||
                arr[i + 1].type === "separator");
        notDeletedPrevEl = toDelete ? notDeletedPrevEl : el;
        return !toDelete;
    });
}

module.exports = (opts = {}) => {
    if (opts.window) {
        const win = opts.window;
        const wc = webContents(win);

        // When window is a webview that has not yet finished loading webContents is not available
        if (wc === undefined) {
            win.addEventListener(
                "dom-ready",
                () => {
                    create(win, opts);
                },
                {once: true}
            );
            return;
        }

        return create(win, opts);
    }

    (electron.BrowserWindow || electron.remote.BrowserWindow)
        .getAllWindows()
        .forEach(win => {
            create(win, opts);
        });

    (electron.app || electron.remote.app).on(
        "browser-window-created",
        (e, win) => {
            create(win, opts);
        }
    );
};
