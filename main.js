'use strict';

const config = require('./config.json');

const { app, protocol, BrowserWindow } = require('electron');

const mime = require('mime');
const url = require('url');
const path = require('path');
const fs = require('fs');
const pug = require('pug');

var mainWindow = null

function createWindow() {

    mainWindow = new BrowserWindow({
        width: config.mode == 'debug' ? 1600 : 1400,
        height: 850,
        resizable: true,
        autoHideMenuBar: true
    });

    if (config.mode == "debug") {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.setMenu(null);
    mainWindow.loadURL(`pug:///${path.join(__dirname, 'index.pug')}`);

    mainWindow.on('closed', () => {
        mainWindow = null
    })

}

app.on('ready', function () {

  protocol.registerBufferProtocol('pug', function (request, callback) {
        let parsedUrl = new URL(request.url);
        let pathname = path.normalize(path.toNamespacedPath(parsedUrl.pathname).startsWith("\\\\?\\") ?
                            parsedUrl.pathname.replace(/^\/*/, '') :  parsedUrl.pathname);
        let ext = path.extname(pathname);

        switch (ext) {
            case '.pug':
                var content = pug.renderFile(pathname);

                callback({
                    mimeType: 'text/html',
                    data: new Buffer.from(content)
                });
                break;

            default:
                let output = fs.readFileSync(pathname);

                return callback({ data: output, mimeType: mime.getType(ext) });
        }

    });

    createWindow();

});

app.on('window-all-closed', () => {

    app.quit();

})

app.on('activate', () => {

    if (mainWindow === null) {
        createWindow();
    }

});