const {ipcRenderer,shell, webContents} = require('electron');
const config = require('../const');
const PlayPageTopbar = require('../assets/images/PlayPageTopbar');
const PlayPageBody = require("../assets/images/PlayPageBody");
const PlayPageCloseBtn = require('../assets/images/PlayPageCloseBtn');
const PlayPageMinimizeBtn = require('../assets/images/PlayPageMinimizeBtn');
const PlayPageBarIcon = require('../assets/images/PlayPageBarIcon');
const {speakerOnIcon, speakerOffIcon} = require('../assets/images/SpeakerIcons');
const path = require("path");
const {post, showLoading, hideLoading, empty, requestValidationErrorMessage} = require("../helper");

const BaseWidth = 1006;
const BaseHeight = 676;
const topbarBaseHeight = 46;
const rulerbarBaseHeight = 30;
const border = 3;

var muted = true;

var canvas3, context3;
var canvas4, context4;
var canvas5, context5;
var canvas6, context6;
var topbar, rulerbar;
var speakerBtnImage = new Image(30, 26);
window.addEventListener('DOMContentLoaded', () => {
    var userInfoStr = localStorage.getItem('userInfo');
    var userInfo = JSON.parse(userInfoStr);
    document.title = "Phiên bản 3.0";
    var textTitle = document.getElementById('textTitle');
    textTitle.innerText = "Phiên bản 3.0";
    /**
     * Draw images
     */
    document.body.style.backgroundImage = 'url(' + PlayPageBody + ')';
    topbar = document.getElementById("topbarWrapper");
    rulerbar = document.getElementById("rulerbar");

    var closeBtnImage = new Image(22, 23);
    canvas5 = document.getElementById('closeBtnCanvas');
    context5 = canvas5.getContext('2d');
    closeBtnImage.onload = function() {
        context5.drawImage(closeBtnImage, 0, 0, 22, 23);
    };
    closeBtnImage.src = PlayPageCloseBtn;

    var minimizeBtnImage = new Image(23, 7);
    canvas6 = document.getElementById('minimizeBtnCanvas');
    context6 = canvas6.getContext('2d');
    minimizeBtnImage.onload = function() {
        context6.drawImage(minimizeBtnImage, 0, 0, 26, 7);
    };
    minimizeBtnImage.src = PlayPageMinimizeBtn;

    var barBtnImage = new Image(30, 26);
    canvas3 = document.getElementById('barIconCanvas');
    context3 = canvas3.getContext('2d');
    barBtnImage.onload = function() {
        context3.drawImage(barBtnImage, 0, 0, 30, 26);
    };
    barBtnImage.src = PlayPageBarIcon;

    canvas4 = document.getElementById('speakerIconCanvas');
    context4 = canvas4.getContext('2d');
    speakerBtnImage.onload = function() {
        context4.drawImage(speakerBtnImage, 0, 0, 30, 26);
    };
    speakerBtnImage.src = speakerOffIcon;

    /**
     * Play Ajax call
     */
    var webview = document.getElementById("gameContent");
    let url = `/play2/${localStorage.getItem('token')}/${localStorage.getItem('svid')}`;
    webview.src = config.host + url;
    webview.addEventListener('dom-ready', () => {
        webview.setAudioMuted(muted);
        // if (config.debug) {
        //     webview.openDevTools()
        // }
    })

    var closeBtnElement = document.getElementById("closeBtnWrapper");
    function closeApp(e) {
        e.preventDefault();
        ipcRenderer.send('quit', {windowIndex: 'play'});
    }
    closeBtnElement.addEventListener("click", closeApp);
    var minimizeBtnElement = document.getElementById("minimizeBtnWrapper");
    function minimizeApp(e) {
        e.preventDefault();
        ipcRenderer.send('minimize-me', {windowIndex: 'play'});
    }
    minimizeBtnElement.addEventListener("click", minimizeApp);
    canvas3.addEventListener('mouseup', function () {
        toggleContextMenu();
    });
    var menutext = document.getElementById("menuText");
    menutext.addEventListener('mouseup', function () {
        toggleContextMenu();
    });
    canvas4.addEventListener('mouseup', function () {
        toggleMuted();
    });

    var contextmenuItems = document.getElementsByClassName("contextMenuItem");
    for (var i = 0; i < contextmenuItems.length; i++) {
        var contextmenuItem = contextmenuItems[i];
        contextmenuItem.addEventListener('click', function (e) {
            e.stopPropagation();
            var target = e.target.dataset.target;
            functions[target]();
            hideContextMenu();
        });
    }
    document.addEventListener('mouseup', function (e) {
        if (e.target.id != 'contextmenu' && e.target.id != 'barIconCanvas' && e.target.id != 'menuText') {
            hideContextMenu();
        }
    });
    tfaMenuToggle();
});

function toggleContextMenu() {
    var contextmenu = document.getElementById("contextmenu");
    contextmenu.classList.toggle('show');
}

function toggleMuted() {
    muted = !muted;
    var webview = document.getElementById("gameContent");
    webview.setAudioMuted(muted);
    var icon = speakerOnIcon;
    if (muted) {
        icon = speakerOffIcon;
    }
    context4.clearRect(0, 0, 30, 26);
    speakerBtnImage.src = icon;
    context4.drawImage(speakerBtnImage, 0, 0, 30, 26);
    // ipcRenderer.send('mute-play-window-toggle', muted);
}

function hideContextMenu() {
    var contextmenu = document.getElementById("contextmenu");
    contextmenu.classList.remove('show');
}

const functions = {
    reload: function () {
        ipcRenderer.send('clearcache', {windowIndex: 'play'});
        var webview = document.getElementById("gameContent");
        webview.src = config.host + '/play2/' + localStorage.getItem('token') + '/' + localStorage.getItem('svid');
        webview.addEventListener('dom-ready', () => {
            webview.setAudioMuted(muted);
        })
    },
    multiple: 1,
    size: function () {
        var multiple = this.multiple;
        ipcRenderer.send('play-window-resize', [
            Math.round(BaseWidth*multiple), //destination width
            Math.round(BaseHeight*multiple), //destination height
            Math.round(BaseWidth*multiple), //minimum width
            Math.round(BaseHeight*multiple) //minimum height
        ]);
        topbar.style.height = (topbarBaseHeight*multiple) + 'px';
        rulerbar.style.height = (rulerbarBaseHeight*multiple) + 'px';
        let body = document.getElementById("bodyWrapper");
        body.style.padding = '0 ' + (border * multiple) + 'px';
    },
    size75: function () {
        this.multiple = 0.75;
        this.size();
    },
    size100: function () {
        this.multiple = 1;
        this.size();
    },
    size125: function () {
        this.multiple = 1.25;
        this.size();
    },
    size150: function () {
        this.multiple = 1.5;
        this.size();
    },
    size175: function () {
        this.multiple = 1.75;
        this.size();
    },
    size200: function () {
        this.multiple = 2;
        this.size();
    },
    size225: function () {
        this.multiple = 2.25;
        this.size();
    },
    size250: function () {
        this.multiple = 2.5;
        this.size();
    },
    openCharge: function () {
        // ipcRenderer.send('charge-open');
        shell.openExternal("http://gunny01.com");
    },
    openExchange: function () {
        shell.openExternal("http://gunny01.com");
    },
    openChangePassword: function () {
        shell.openExternal("http://gunny01.com");
    },
    openChangeEmail: function () {
        ipcRenderer.send('change-email-open');
    },
    resetStashPassword: function () {
        var userInfoStr = localStorage.getItem('userInfo');
        var userInfo = JSON.parse(userInfoStr);
        if (empty(userInfo['VerifiedEmail'])) {
            ipcRenderer.send('warningbox', [
                'play',
                'Thông báo',
                'Email chưa được xác thực, vui lòng xác thực email trước khi thực hiện chức năng này!'
            ]);
            return;
        }
    },
    chargeHistory: function () {
        ipcRenderer.send('charge-history-open');
    },
    logout: function () {
        localStorage.clear();
        ipcRenderer.send('switch-to-login', {windowIndex: 'play'});
    },
    update: function () {
        ipcRenderer.send('update', 1);
    },
    verifyEmail: function () {
        var userInfoStr = localStorage.getItem('userInfo');
        var userInfo = JSON.parse(userInfoStr);
        if (empty(userInfo.Email)) {
            ipcRenderer.send('warningbox', [
                'play',
                'Thông báo',
                'Bạn chưa đăng ký email, vui lòng cập nhật email để tiếp tục!'
            ]);
            return;
        }
        showLoading();
        post(config.host + '/api/verifyEmail', {}, verifyEmailCallback);
    },
    activeTFA: function () {
        var userInfoStr = localStorage.getItem('userInfo');
        var userInfo = JSON.parse(userInfoStr);
        if (empty(userInfo.Email)) {
            ipcRenderer.send('warningbox', [
                'play',
                'Thông báo',
                'Bạn chưa đăng ký email, vui lòng cập nhật email để tiếp tục!'
            ]);
            return;
        }
        showLoading();
        post(config.host + '/api/active2fa', {}, activeTFACallback);
    },
    deactiveTFA: function () {
        var userInfoStr = localStorage.getItem('userInfo');
        var userInfo = JSON.parse(userInfoStr);
        if (empty(userInfo.Email) || empty(userInfo['2fa'])) {
            ipcRenderer.send('warningbox', [
                'play',
                'Thông báo',
                'Bạn chưa kích hoạt xác thực 2 lớp!'
            ]);
            return;
        }
        showLoading();
        post(config.host + '/api/deactive2fa', {}, deactiveTFACallback);
    },
    clearBagPassword: function () {
        var userInfoStr = localStorage.getItem('userInfo');
        var userInfo = JSON.parse(userInfoStr);
        if (empty(userInfo['VerifiedEmail'])) {
            ipcRenderer.send('warningbox', [
                'play',
                'Thông báo',
                'Email chưa được xác thực, vui lòng xác thực email trước khi thực hiện chức năng này!'
            ]);
            return;
        }
        ipcRenderer.send('tfa-clear-bag-password', {windowIndex: 'play'});
    }
}

var verifyEmailCallback = function (response, request) {
    hideLoading();
    if (!empty(response.success) && response.success === true) {
        ipcRenderer.send('verify-email', {windowIndex: 'play'});
    } else {
        let message = requestValidationErrorMessage(response, request);
        ipcRenderer.send('errorbox', [
            'play',
            'Cảnh báo',
            message
        ]);
    }
}

var activeTFACallback = function (response, request) {
    hideLoading();
    if (!empty(response.success) && response.success === true) {
        ipcRenderer.send('tfa-validation', {windowIndex: 'play'});
    } else {
        let message = requestValidationErrorMessage(response, request);
        ipcRenderer.send('errorbox', [
            'play',
            'Cảnh báo',
            message
        ]);
    }
}

var deactiveTFACallback = function (response, request) {
    hideLoading();
    if (!empty(response.success) && response.success === true) {
        ipcRenderer.send('tfa-deactive-validation', {windowIndex: 'play'});
    } else {
        let message = requestValidationErrorMessage(response, request);
        ipcRenderer.send('errorbox', [
            'play',
            'Cảnh báo',
            message
        ]);
    }
}

var clearBagPasswordCallback = function (response, request) {
    hideLoading();
    if (!empty(response.success) && response.success === true) {
        ipcRenderer.send('tfa-clear-bag-password-validation', {windowIndex: 'play'});
    } else {
        let message = requestValidationErrorMessage(response, request);
        ipcRenderer.send('errorbox', [
            'play',
            'Cảnh báo',
            message
        ]);
    }
}

window.addEventListener('beforeunload', function(event) {
    localStorage.clear();
})

ipcRenderer.on('toggle-tfa-menu', function (e, args) {
    tfaMenuToggle();
})

var tfaMenuToggle = function () {
    var userInfoStr = localStorage.getItem('userInfo');
    var userInfo = JSON.parse(userInfoStr);
    var verifyEl = document.getElementById('verifyEmail');
    var activeEl = document.getElementById('activetfa');
    var deactiveEl = document.getElementById('deactivetfa');
    var resetStashPass = document.getElementById('resetBagPassword');
    var clearStashPass = document.getElementById('clearBagPassword');
    if (empty(userInfo['VerifiedEmail'])) {
        verifyEl.style.display = 'block';
        activeEl.style.display = 'none';
        deactiveEl.style.display = 'none';
    } else if (!empty(userInfo['2fa'])) {
        verifyEl.style.display = 'none';
        activeEl.style.display = 'none';
        deactiveEl.style.display = 'block';
    } else {
        verifyEl.style.display = 'none';
        activeEl.style.display = 'block';
        deactiveEl.style.display = 'none';
    }
    if (empty(userInfo['VerifiedEmail'])) {
        resetStashPass.style.display = 'none';
        clearStashPass.style.display = 'none';
    } else {
        resetStashPass.style.display = 'block';
        clearStashPass.style.display = 'block';
    }
}
