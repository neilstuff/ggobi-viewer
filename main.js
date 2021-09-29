'use strict';

const config = require('./config.json');

const electron = require('electron');

const mime = require('mime');
const url = require('url');
const path = require('path');
const fs = require('fs');
const pug = require('pug');

const app = electron.app;
const ipcMain = electron.ipcMain;
const dialog = electron.dialog;
const protocol = electron.protocol ;

const nativeImage = electron.nativeImage;
const BrowserWindow = electron.BrowserWindow;

var mainWindow = null

function createWindow () {

  mainWindow = new BrowserWindow({width: config.mode == 'debug' ? 1600 : 1400, height: 850, 
      resizable: true, autoHideMenuBar: true,  
      webPreferences: {
      }
  });

  if (config.mode == "debug") {
      mainWindow.webContents.openDevTools();
  }

  mainWindow.setMenu(null);
  mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'index.pug'),
      protocol: 'pug:',
      slashes: true
  }))

  mainWindow.on('closed', () => {
      mainWindow = null
  })

}

app.on('ready', function () {

  protocol.registerBufferProtocol('pug', function (request, callback) {
      let parsedUrl = new (require('url').URL)(request.url);
      let url = path.normalize(parsedUrl.pathname.replace('/', ''));
      let ext = path.extname(url);

      switch (ext) {
          case '.pug':
              var content = pug.renderFile(url);

              callback({
                  mimeType: 'text/html',
                  data: Buffer.from(content)
  
              });
              break;

          default:
              let output = fs.readFileSync(url);

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