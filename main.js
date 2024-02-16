const {app, BrowserWindow, dialog, ipcMain, ipcRenderer} = require('electron');
const path = require('path');
const EventEmitter = require('events');
const https = require('https');
const http = require('http');
const fsExtra = require('fs-extra');
const config = require('./const');
const {uniqId} = require('./helper');
const {download} = require("electron-dl");
const child = require('child_process').spawn;

//region enable flash
let pluginName = null; //put the right flash plugin in depending on the operating system.
switch (process.platform) {
  case 'win32':
      pluginName = 'pepflashplayer.dll';
    break
  case 'linux':
      pluginName = 'libpepflashplayer.so';
      app.commandLine.appendSwitch('no-sandbox');
    break;
  case 'darwin':
    pluginName = 'PepperFlashPlayer.plugin'
    break;
}
app.commandLine.appendSwitch("disable-renderer-backgrounding");
if (process.platform !== "darwin") {
  app.commandLine.appendSwitch('high-dpi-support', "1");
  //app.commandLine.appendSwitch('force-device-scale-factor', "1");
  app.commandLine.appendSwitch("--enable-npapi");
}
//
// app.commandLine.appendSwitch('ppapi-flash-path', path.join(__dirname, 'flashver/' + pluginName));
app.commandLine.appendSwitch('ppapi-flash-path', path.join(__dirname.includes(".asar") ? process.resourcesPath : __dirname, "flashver/" + pluginName));
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
app.commandLine.appendSwitch('allow-insecure-localhost', 'true');
app.commandLine.appendSwitch('incognito');
//endregion

//region updater
  let updateUrl = config.host + `/api/update/${process.platform}/${app.getVersion()}`;
  let checkForUpdate = function (url, msg = 0) {
    if (process.platform === 'darwin') {
      if (msg != 1) {
        dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
          buttons: ['Đồng ý'],
          title: 'Thông báo',
          message: 'Không có cập nhật mới!',
          type: 'info'
        });
      }
    }
    let rawData = '';
    let xhttp = http;
    if (typeof process.env.NODE_ENV != 'undefined' && process.env.NODE_ENV.trim() === 'development') {
      xhttp = http;
    }
    xhttp.get(url, function(response) {
      response.on('data', (c) => {
        rawData += c;
      });
      response.on('end', () => {
        try {
          var update = rawData;
          if (update == 'noup') {
            if (msg != 1) {
              var click = dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
                buttons: ['Không phải bây giờ', 'Đồng ý'],
                title: 'Thông báo',
                message: 'Đã có bản cập nhật mới ('+update+'), tải về và cập nhật ngay bây giờ?',
                type: 'question'
              });
              if (click == 1) {
                updater(msg);
              }
            } else {
              updater(msg);
            }
          } else {
            if (msg == 1) {
              dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
                buttons: ['Đồng ý'],
                title: 'Thông báo',
                message: `Không có cập nhật mới!!!! ${process.title}`,
                type: 'info'
              });
            }
          }
        } catch (e) {
          if (msg == 1) {
            dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
              buttons: ['Đồng ý'],
              title: 'Cảnh báo',
              message: 'Không thể kết nối máy chủ, vui lòng liên hệ quản trị viên để được hỗ trợ!',
              type: 'error'
            });
          }
        }
      });
    }).on('error', function(err) {
      if (msg == 1) {
        dialog.showMessageBoxSync({
          buttons: ['Đồng ý'],
          title: 'Cảnh báo',
          message: 'Không thể kết nối máy chủ, vui lòng liên hệ quản trị viên để được hỗ trợ!',
          type: 'error'
        });
      }
    });
  }
  let downloadUpdateUrl = config.host + `/api/downloadLatest/${process.platform}`;
  var updateWindow;
  var updater = function (msg = 0) {
    var baseWindow = BrowserWindow.getFocusedWindow();
    if (msg == 1) {
      const window = new BrowserWindow({
        width: 500,
        height: 300,
        autoHideMenuBar: true,
        // transparent: true,
        // frame: false,
        resizable: false,
        modal: true,
        parent: baseWindow,
        minimizable: false,
        maximizable: false,
        webPreferences: {
          preload: path.join(__dirname, 'preloads/update.js')
        }
      });
      window.loadFile('windows/update.html');
      // window.webContents.openDevTools()
      updateWindow = window;
    } else {
      download(baseWindow, downloadUpdateUrl);
    }
  }

ipcMain.on("download-update", (event, info) => {
  download(BrowserWindow.getFocusedWindow(), downloadUpdateUrl, {
    onProgress: function (obj) {
      updateWindow.webContents.send("download-progress", obj.percent);
    },
    onCompleted: function (obj) {
      var clicked = dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(),{
        buttons: ['Không thoát', 'Thoát ngay'],
        title: 'Thông báo',
        message: 'Bản cập nhật đã tải xong, thoát game và cập nhật ngay bây giờ?',
        type: 'question'
      });
      if (clicked === 1) {
        const subprocess = child(obj.path, {
          detached: true,  //Continue running after the parent exits.
          stdio: 'ignore'
        });
        subprocess.unref();
        app.quit();
      } else {
        updateWindow.close();
      }
    }
  }).then(dl => updateWindow.webContents.send("download-complete", dl.getSavePath()));
});
ipcMain.on("quit-and-install-update", (event, file) => {

});
//endregion

//region delete cache
let cpath = app.getPath('userData');
let dirs = fsExtra.readdirSync(cpath);
//endregion
//region setting user data path for separate local storage
const userDataPath = app.getPath ('userData');
let cacheFolder = uniqId();
app.setPath ('userData', path.join(userDataPath, cacheFolder));
//endregion
//region delete cache
// dirs.forEach(dir => {
//   if (dir == cacheFolder) {
//     return;
//   }
//   fsExtra.removeSync(path.join(cpath, dir));
// })
//endregion

//region message boxes
var displayMessage = (type, evt, args) => {
  var window = windowIndexes[args[0]];
  if (window !== null) {
    dialog.showMessageBoxSync(window, {
      buttons: ['Đồng ý'],
      title: args[1],
      message: args[2],
      type: type
    });
  } else {
    dialog.showMessageBoxSync({
      buttons: ['Đồng ý'],
      title: args[1],
      message: args[2],
      type: type
    });
  }
}
//region messagebox event
ipcMain.on('messagebox', (evt, args) => {
  displayMessage('none', evt, args);
});
//endregion
//region infobox event
ipcMain.on('infobox', (evt, args) => {
  displayMessage('info', evt, args);
});
//endregion
//region errorbox event
ipcMain.on('errorbox', (evt, args) => {
  displayMessage('error', evt, args);
});
//endregion
//region warningbox event
ipcMain.on('warningbox', (evt, args) => {
  displayMessage('warning', evt, args);
});
//endregion
//endregion

var windowIndexes = {};
var chargeWindow = null;
var exchangeWindow = null;
var changePasswordWindow = null;
var changeEmailWindow = null;
var playWindow = null;
var loginWindow = null;
var TFAExchangeValidationWindow = null;
var chargeHistoryWindow = null;
var forgotPassWindow = null;
//region declare event for windows
  //region quit event
  ipcMain.on('quit', (evt, arg) => {
    var window = windowIndexes[arg.windowIndex];
    if (window !== null) {
      var clicked = dialog.showMessageBoxSync(window,{
        buttons: ['Không thoát', 'Thoát ngay'],
        title: 'Cảnh báo',
        message: 'Bạn có chắc chắn muốn thoát game?'
      });
      if (clicked === 1) {
        app.quit();
      }
    }
  });
  //endregion
ipcMain.on('close-me', (evt, arg) => {
  var window = windowIndexes[arg.windowIndex];
  if (window !== null && !window.isDestroyed()) {
    window.close();
  }
});
  //region minimize event
  ipcMain.on('minimize-me', (evt, arg) => {
    var window = windowIndexes[arg.windowIndex];
    if (window !== null) {
      evt.preventDefault();
      window.minimize();
    }
  });
  //endregion
  //region IgnoreMouseEvent
  ipcMain.on('IgnoreMouseEvent', (evt, args) => {
    var window = windowIndexes[args.windowIndex];
    if (window !== null) {
      window.setIgnoreMouseEvents(true, {forward: true});
    }
  });
  //endregion
  //region DontIgnoreMouseEvent
  ipcMain.on('DontIgnoreMouseEvent', (evt, args) => {
    var window = windowIndexes[args.windowIndex];
    if (window !== null) {
      window.setIgnoreMouseEvents(false, {forward: false});
    }
  });
  //endregion
  //region switchToPlay event
  ipcMain.on('switchToPlay', (evt, args) => {
    var window = windowIndexes[args.windowIndex];
    if (window != null && !window.isDestroyed()) {
      playWindow = createPlayWindow();
      window.close();
    }
    // if (loginWindow != null && !loginWindow.isDestroyed()) {
    //   loginWindow.close();
    // }
  });
  //endregion
//region login-switchToPlay event
ipcMain.on('login-switchToPlay', (evt, args) => {
  loginWindow.webContents.send('switchToPlay');
});
//endregion
  //region resize-me event
  ipcMain.on('play-window-resize', (evt, arg) => {
    if (playWindow !== null && !playWindow.isDestroyed()) {
      if (arg.length >= 4) {
        playWindow.setMinimumSize(arg[2], arg[3]);
      }
      playWindow.setSize(arg[0], arg[1], true);
    }
  });
  //endregion
//region resize-me event
ipcMain.on('mute-play-window-toggle', (evt, arg) => {
  if (playWindow !== null && !playWindow.isDestroyed()) {
    playWindow.webContents.setAudioMuted(arg);
  }
});
//endregion
  //region charge-open event
  ipcMain.on('charge-open', (evt, arg) => {
    if (chargeWindow !== null && !chargeWindow.isDestroyed()) {
      chargeWindow.show();
      return;
    }
    chargeWindow = createChargeWindow();
  });
  //endregion
  //region exchange-open event
  ipcMain.on('exchange-open', (evt, arg) => {
    if (exchangeWindow !== null && !exchangeWindow.isDestroyed()) {
      exchangeWindow.show();
      return;
    }
    exchangeWindow = createExchangeWindow();
  });
  //endregion
  //region change-password-open event
  ipcMain.on('change-password-open', (evt, arg) => {
    if (changePasswordWindow !== null && !changePasswordWindow.isDestroyed()) {
      changePasswordWindow.show();
      return;
    }
    changePasswordWindow = createChangePasswordWindow();
  });
  //endregion
  //region switch-to-login event
  ipcMain.on('switch-to-login', (evt, arg) => {
    var window = windowIndexes[arg.windowIndex];
    if (window !== null) {
      createLoginWindow();
      window.close();
    }
  });
  //endregion
  //region update event
  ipcMain.on('update', (evt, arg) => {
    checkForUpdate(updateUrl, arg);
  });
  //endregion
//region tfa-validation event
ipcMain.on('tfa-validation', (evt, arg) => {
  var window = windowIndexes[arg.windowIndex];
  if (window !== null) {
    createTFAValidationWindow(true, window);
  }
});
//endregion
//region toggle-tfa-menu event
ipcMain.on('toggle-tfa-menu', (evt, arg) => {
  playWindow.webContents.send('toggle-tfa-menu');
});
//endregion
//region tfa-deactive-validation event
ipcMain.on('tfa-deactive-validation', (evt, arg) => {
  var window = windowIndexes[arg.windowIndex];
  if (window !== null) {
    createTFADeactiveValidationWindow(true, window);
  }
});
//endregion
//region tfa-login-validation event
ipcMain.on('tfa-login-validation', (evt, arg) => {
  var window = windowIndexes[arg[2]];
  if (window !== null) {
    var w = createTFALoginValidationWindow(true, window);
  }
});
//endregion
//region tfa-login-response event
ipcMain.on('tfa-login-response', (evt, response) => {
  if (loginWindow != null && !loginWindow.isDestroyed()) {
    loginWindow.webContents.send('login-by-child', response);
  }
});
//endregion
//region tfa-exchange-validation event
ipcMain.on('tfa-exchange-validation', (evt, arg) => {
  var window = windowIndexes[arg.windowIndex];
  if (window !== null) {
    TFAExchangeValidationWindow = createTFAExchangeValidationWindow(true, window);
  }
});
//endregion
//region tfa-change-password-validation event
ipcMain.on('tfa-change-password-validation', (evt, arg) => {
  var window = windowIndexes[arg.windowIndex];
  if (window !== null) {
    createTFAChangePassValidationWindow(true, window);
  }
});
//endregion
// region password-updated event
ipcMain.on('password-updated', (evt, response) => {
  if (changePasswordWindow != null && !changePasswordWindow.isDestroyed()) {
    changePasswordWindow.webContents.send('password-updated', response);
  }
});
//endregion
//region update-coin event
ipcMain.on('update-coin', (evt, arg) => {
  if (exchangeWindow != null && !exchangeWindow.isDestroyed()) {
    exchangeWindow.webContents.send('update-coin', arg);
  }
});
//endregion
//region change-email-open event
ipcMain.on('change-email-open', (evt, arg) => {
  if (changeEmailWindow !== null && !changeEmailWindow.isDestroyed()) {
    changeEmailWindow.show();
    return;
  }
  changeEmailWindow = createChangeEmailWindow();
});
//endregion
// region email-updated event
ipcMain.on('email-updated', (evt, response) => {
  if (changeEmailWindow != null && !changeEmailWindow.isDestroyed()) {
    changeEmailWindow.webContents.send('email-updated', response);
  }
});
//endregion
// region clear cache event
ipcMain.on('clearcache', (evt, response) => {
  playWindow.webContents.session.clearCache();
});
//endregion
//region verifyEmail event
ipcMain.on('verify-email', (evt, arg) => {
  var window = windowIndexes[arg.windowIndex];
  if (window !== null) {
    createVerifyEmailWindow(true, window);
  }
});
//endregion
//region change email validation event
ipcMain.on('tfa-change-email-validation', (evt, arg) => {
  var window = windowIndexes[arg.windowIndex];
  if (window !== null) {
    createChangeEmailValidationWindow(true, window);
  }
});
//endregion

ipcMain.on('tfa-clear-bag-password', (evt, arg) => {
  var window = windowIndexes[arg.windowIndex];
  if (window !== null) {
    createClearBagPasswordWindow(true, window);
  }
});

ipcMain.on('tfa-clear-bag-password-validation', (evt, arg) => {
  var window = windowIndexes[arg.windowIndex];
  if (window !== null) {
    createTFAClearBagPasswordValidationWindow(true, window);
  }
});

// region clearcache event
ipcMain.on('deletecache', (evt, arg) => {
  var clicked = dialog.showMessageBoxSync(loginWindow,{
    buttons: ['Không xóa', 'Xóa cache'],
    title: 'Cảnh báo',
    message: 'Launcher sẽ khởi động lại sau khi xóa Cache!',
    type: 'warning'
  });
  if (clicked === 1) {
    dirs.forEach(dir => {
      let _path = path.join(cpath, dir);
      if (dir == cacheFolder || dir == 'accounts.txt') {
        return;
      }
      try {
        fsExtra.removeSync(_path);
      } catch (e) {
        return;
      }
    });
    displayMessage('info', evt, ['Thông báo', 'Xóa cache thành công!']);
    app.relaunch();
    app.exit();
  }
});
//endregion
//region charge history
ipcMain.on('charge-history-open', (evt, arg) => {
  if (chargeHistoryWindow !== null && !chargeHistoryWindow.isDestroyed()) {
    chargeHistoryWindow.show();
    return;
  }
  chargeHistoryWindow = createChargeHistoryWindow();
});
//endregion
//region forgot pass
ipcMain.on('forgotpass-open', (evt, arg) => {
  if (forgotPassWindow !== null && !forgotPassWindow.isDestroyed()) {
    forgotPassWindow.show();
    return;
  }
  forgotPassWindow = createForgotPassWindow();
});
//endregion
//region forgot password validation event
ipcMain.on('forgot-password-validation', (evt, arg) => {
  var window = windowIndexes[arg.windowIndex];
  if (window !== null) {
    createForgotPasswordValidationWindow(true, window);
  }
});
//endregion

//region declare windows
var _loadingWindow;
const loadingEvents = new EventEmitter()
var serverList = []
function createMainWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preloads/preload.js')
    }
  });
  mainWindow.loadFile('windows/index.html')
  windowIndexes['main'] = mainWindow;
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

function createLoginWindow () {
  // Create the browser window.
  const window = new BrowserWindow({
    width: 1085,
    height: 686,
    autoHideMenuBar: true,
    transparent: true,
    frame: false,
    resizable: false,
    webPreferences: {
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preloads/login.js')
    }
  });
  window.loadFile('windows/login.html')

  // Open the DevTools.
  // window.webContents.openDevTools()
  loginWindow = window;
  windowIndexes['login'] = loginWindow;
  return window;
}

function loadingWindow() {
  const window = new BrowserWindow({
    width: 840,
    height: 270,
    autoHideMenuBar: true,
    transparent: true,
    frame: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preloads/loading.js')
    }
  });
  window.loadFile('windows/loading.html')
  // window.webContents.openDevTools()
  windowIndexes['loading'] = window;
  return window;
}

function createPlayWindow () {
  // Create the browser window.
  const window = new BrowserWindow({
    width: 1006,
    height: 676,
    autoHideMenuBar: true,
    transparent: true,
    frame: false,
    resizable: false,
    maximizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preloads/play.js'),
      nodeIntegration: true,
      webviewTag: true,
      plugins: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });
  window.loadFile('windows/play.html')

  // Open the DevTools.
  // if (config.debug) {
  //   window.webContents.openDevTools()
  // }
  // window.webContents.setAudioMuted(true)
  windowIndexes['play'] = window;
  return window;
}

function createChargeWindow () {
  // Create the browser window.
  const window = new BrowserWindow({
    width: 1200,
    height: 726,
    autoHideMenuBar: true,
    transparent: false,
    frame: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preloads/charge.js'),
    }
  });
  window.loadFile('windows/charge.html')

  // Open the DevTools.
  // if (config.debug) {
  //    window.webContents.openDevTools()
  // }
  windowIndexes['charge'] = window;
  return window;
}

function createExchangeWindow () {
  // Create the browser window.
  const window = new BrowserWindow({
    width: 800,
    height: 526,
    autoHideMenuBar: true,
    transparent: false,
    frame: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preloads/exchange.js'),
    }
  });
  window.loadFile('windows/exchange.html')

  // Open the DevTools.
  // if (config.debug) {
  //   window.webContents.openDevTools()
  // }
  windowIndexes['exchange'] = window;
  return window;
}

function createChangePasswordWindow () {
  // Create the browser window.
  const window = new BrowserWindow({
    width: 450,
    height: 406,
    autoHideMenuBar: true,
    transparent: false,
    frame: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preloads/changePassword.js'),
    }
  });
  window.loadFile('windows/changePassword.html')

  // Open the DevTools.
  // window.webContents.openDevTools()
  windowIndexes['changepassword'] = window;
  return window;
}

function createTFAValidationWindow (modal, parent) {
  // Create the browser window.
  const window = new BrowserWindow({
    width: 500,
    height: 300,
    autoHideMenuBar: true,
    transparent: false,
    frame: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    modal: modal,
    parent: parent,
    webPreferences: {
      preload: path.join(__dirname, 'preloads/twofaValidation.js'),
    }
  });
  window.loadFile('windows/twofaValidation.html')

  // Open the DevTools.
  // window.webContents.openDevTools()
  windowIndexes['tfavalidation'] = window;
  return window;
}

function createTFADeactiveValidationWindow (modal, parent) {
  // Create the browser window.
  const window = new BrowserWindow({
    width: 500,
    height: 300,
    autoHideMenuBar: true,
    transparent: false,
    frame: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    modal: modal,
    parent: parent,
    webPreferences: {
      preload: path.join(__dirname, 'preloads/twofaDeactiveValidation.js'),
    }
  });
  window.loadFile('windows/twofaValidation.html')

  // Open the DevTools.
  //  window.webContents.openDevTools()
  windowIndexes['tfadeactivevalidation'] = window;
  return window;
}
function createTFALoginValidationWindow (modal, parent) {
  // Create the browser window.
  const window = new BrowserWindow({
    width: 500,
    height: 300,
    autoHideMenuBar: true,
    transparent: false,
    frame: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    modal: modal,
    parent: parent,
    webPreferences: {
      preload: path.join(__dirname, 'preloads/twofaLoginValidation.js'),
      nodeIntegration: true
    }
  });
  window.loadFile('windows/twofaLoginValidation.html')

  // Open the DevTools.
  // window.webContents.openDevTools()
  windowIndexes['tfaloginvalidation'] = window;
  return window;
}
function createTFAExchangeValidationWindow (modal, parent) {
  // Create the browser window.
  const window = new BrowserWindow({
    width: 500,
    height: 300,
    autoHideMenuBar: true,
    transparent: false,
    frame: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    modal: modal,
    parent: parent,
    webPreferences: {
      preload: path.join(__dirname, 'preloads/twofaExchangeValidation.js'),
      nodeIntegration: true
    }
  });
  window.loadFile('windows/twofaValidation.html')

  // Open the DevTools.
  // window.webContents.openDevTools()
  windowIndexes['tfaexchangevalidation'] = window;
  return window;
}
function createTFAChangePassValidationWindow (modal, parent) {
  // Create the browser window.
  const window = new BrowserWindow({
    width: 500,
    height: 300,
    autoHideMenuBar: true,
    transparent: false,
    frame: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    modal: modal,
    parent: parent,
    webPreferences: {
      preload: path.join(__dirname, 'preloads/twofaChangePassValidation.js'),
      nodeIntegration: true
    }
  });
  window.loadFile('windows/twofaValidation.html')

  // Open the DevTools.
  // window.webContents.openDevTools()
  windowIndexes['tfachangepassvalidation'] = window;
  return window;
}
function createChangeEmailWindow () {
  // Create the browser window.
  const window = new BrowserWindow({
    width: 455,
    height: 280,
    autoHideMenuBar: true,
    transparent: false,
    frame: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preloads/changeEmail.js'),
    }
  });
  window.loadFile('windows/changeEmail.html')

  // Open the DevTools.
  // window.webContents.openDevTools()
  windowIndexes['changeemail'] = window;
  return window;
}

function createChargeHistoryWindow () {
  // Create the browser window.
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    transparent: false,
    frame: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preloads/chargeHistory.js'),
    }
  });
  window.loadFile('windows/chargeHistory.html')

  // Open the DevTools.
  //window.webContents.openDevTools()
  windowIndexes['chargehistory'] = window;
  return window;
}
//endregion

function createVerifyEmailWindow (modal, parent) {
  // Create the browser window.
  const window = new BrowserWindow({
    width: 500,
    height: 300,
    autoHideMenuBar: true,
    transparent: false,
    frame: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    modal: modal,
    parent: parent,
    webPreferences: {
      preload: path.join(__dirname, 'preloads/verifyemail.js'),
    }
  });
  window.loadFile('windows/verifyemail.html')

  // Open the DevTools.
  // window.webContents.openDevTools()
  windowIndexes['verifyemail'] = window;
  return window;
}

function createForgotPassWindow (modal, parent) {
  // Create the browser window.
  const window = new BrowserWindow({
    width: 500,
    height: 200,
    autoHideMenuBar: true,
    transparent: false,
    frame: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    modal: modal,
    parent: parent,
    webPreferences: {
      preload: path.join(__dirname, 'preloads/forgotpass.js'),
    }
  });
  window.loadFile('windows/forgotpass.html');

  // Open the DevTools.
  // window.webContents.openDevTools()
  windowIndexes['forgotpass'] = window;
  return window;
}

function createChangeEmailValidationWindow (modal, parent) {
  // Create the browser window.
  const window = new BrowserWindow({
    width: 500,
    height: 300,
    autoHideMenuBar: true,
    transparent: false,
    frame: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    modal: modal,
    parent: parent,
    webPreferences: {
      preload: path.join(__dirname, 'preloads/changeEmailValidation.js'),
    }
  });
  window.loadFile('windows/changeEmailValidation.html')

  // Open the DevTools.
  //window.webContents.openDevTools()
  windowIndexes['changeemailvalidation'] = window;
  return window;
}

function createForgotPasswordValidationWindow (modal, parent) {
  // Create the browser window.
  const window = new BrowserWindow({
    width: 500,
    height: 300,
    autoHideMenuBar: true,
    transparent: false,
    frame: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    modal: modal,
    parent: parent,
    webPreferences: {
      preload: path.join(__dirname, 'preloads/forgotpassValidation.js'),
    }
  });
  window.loadFile('windows/forgotpassValidation.html')

  // Open the DevTools.
  //window.webContents.openDevTools()
  windowIndexes['forgotpassvalidation'] = window;
  return window;
}
function createClearBagPasswordWindow () {
  // Create the browser window.
  const window = new BrowserWindow({
    width: 800,
    height: 426,
    autoHideMenuBar: true,
    transparent: false,
    frame: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preloads/clearBagPassword.js'),
    }
  });
  window.loadFile('windows/clearBagPassword.html')

  // Open the DevTools.
  // if (config.debug) {
  //   window.webContents.openDevTools()
  // }
  windowIndexes['clearBagPassword'] = window;
  return window;
}
function createTFAClearBagPasswordValidationWindow (modal, parent) {
  // Create the browser window.
  const window = new BrowserWindow({
    width: 500,
    height: 300,
    autoHideMenuBar: true,
    transparent: false,
    frame: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    modal: modal,
    parent: parent,
    webPreferences: {
      preload: path.join(__dirname, 'preloads/twofaClearBagPassValidation.js'),
      nodeIntegration: true
    }
  });
  window.loadFile('windows/twofaValidation.html')

  // Open the DevTools.
  // window.webContents.openDevTools()
  windowIndexes['tfaclearbagpassvalidation'] = window;
  return window;
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createLoginWindow();
  //  createPlayWindow();
  /*
  _loadingWindow = loadingWindow();
  _loadingWindow.webContents.once('dom-ready', () => {
    setTimeout(() => {
      let rawData = '';
      http.get(config.host + '/api/serverlist', function(response) {
        response.on('data', (c) => {
          rawData += c;
        });
        response.on('end', () => {
          try {
            var serverlist = JSON.parse(rawData);
            serverList = serverlist.data
            _loadingWindow.close()
            createLoginWindow()
          } catch (e) {
            var clicked = dialog.showMessageBoxSync(_loadingWindow,{
              buttons: ['Đồng ý'],
              title: 'Cảnh báo',
              message: 'Không thể kết nối máy chủ, vui lòng liên hệ quản trị viên để được hỗ trợ!'
            });
            if (clicked === 0) {
              _loadingWindow.hide();
              app.exit(0);
            }
          }
        });
      }).on('error', function(err) {
        var clicked = dialog.showMessageBoxSync({
          buttons: ['Đồng ý'],
          title: 'Cảnh báo',
          message: 'Không thể kết nối máy chủ, vui lòng liên hệ quản trị viên để được hỗ trợ!'
        });
        if (clicked === 0) {
          _loadingWindow.hide();
          app.exit(0);
        }
      });
    }, 3000);
  });
   */

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
