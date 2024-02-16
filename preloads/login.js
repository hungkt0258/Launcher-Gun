const { app, ipcRenderer, remote, dialog } = require('electron');
const config = require('../const');
const { post, showLoading, hideLoading, validateEmail, empty, requestValidationErrorMessage } = require('../helper');
const loginBackgroundElements = require('../assets/images/loginBackgroundElements');
const loginNhanVat = require('../assets/images/loginNhanVat');

const backgroundLogo = require('../assets/images/backgroundLogo');
const loginFormCloseBtn = require('../assets/images/loginFormCloseBtn');
const loginFormMinimizeBtn = require('../assets/images/loginFormMinimizeBtn');
const loginFormBackground = require('../assets/images/loginFormBackground');
const buttonBackgroundActive = require('../assets/images/buttonBackgroundActive');
const formButtonBackground = require('../assets/images/formButtonBackground');
let fs = require('fs');
let path = require('path');
const userDataPath = remote.app.getPath(
    'userData'
);
let recentAccountFile = path.join(userDataPath, '../accounts.txt');

var canvas1, context1;
var canvas2, context2;
var canvas3, context3;
var canvas4, context4;
var canvas5, context5;
var canvas6, context6;

window.addEventListener('DOMContentLoaded', () => {
    //if (localStorage.getItem('token')) {
    // localStorage.clear();
    // ipcRenderer.send('switchToPlay');
    //return;
    //}
    /**
     * Draw images
     */
    var nhanvatImage = new Image(667, 556);
    canvas2 = document.getElementById('nhanvatCanvas');
    context2 = canvas2.getContext('2d');
    nhanvatImage.onload = function () {
        context2.drawImage(nhanvatImage, 0, 0, 667, 556);
    };
    nhanvatImage.src = loginNhanVat;

    var backgroundImage = new Image(886, 555);
    canvas1 = document.getElementById('backgroundCanvas');
    context1 = canvas1.getContext('2d');
    backgroundImage.onload = function () {
        context1.drawImage(backgroundImage, 0, 0, 886, 555);
    };
    backgroundImage.src = loginBackgroundElements;

    var logoBackgroundImage = new Image(510, 101);
    canvas3 = document.getElementById('logoBackgroundCanvas');
    context3 = canvas3.getContext('2d');
    logoBackgroundImage.onload = function () {
        context3.drawImage(logoBackgroundImage, 0, 0, 510, 101);
    };

    var logoImage = new Image(299, 98);
    canvas4 = document.getElementById('logoCanvas');
    context4 = canvas4.getContext('2d');
    logoImage.onload = function () {
        context4.drawImage(logoImage, 0, 0, 299, 98);
    };
    logoImage.src = backgroundLogo;

    var closeBtnImage = new Image(19, 21);
    canvas5 = document.getElementById('closeBtnCanvas');
    context5 = canvas5.getContext('2d');
    closeBtnImage.onload = function () {
        context5.drawImage(closeBtnImage, 0, 0, 19, 21);
    };
    closeBtnImage.src = loginFormCloseBtn;

    var minimizeBtnImage = new Image(23, 7);
    canvas6 = document.getElementById('minimizeBtnCanvas');
    context6 = canvas6.getContext('2d');
    minimizeBtnImage.onload = function () {
        context6.drawImage(minimizeBtnImage, 0, 0, 23, 7);
    };
    minimizeBtnImage.src = loginFormMinimizeBtn;

    var formWrapper = document.getElementById('formWrapper');
    formWrapper.style.backgroundImage = 'url(' + loginFormBackground + ')';

    var version = document.getElementById("version");
    version.innerText = require("electron").remote.app.getVersion();

    /**
     * Element Events
     */
    var frmButtons = document.getElementsByClassName('frmButton');
    for (var i = 0; i < frmButtons.length; i++) {
        var frmButton = frmButtons.item(i);
        frmButton.style.backgroundImage = 'url(' + formButtonBackground + ')';
        frmButton.addEventListener('mousedown', function (e) {
            e.target.classList.add('mousedown');
        });
        frmButton.addEventListener('mouseup', function (e) {
            e.target.classList.remove('mousedown');
        });
    }

    var closeBtnElement = document.getElementById("closeBtnWrapper");
    function closeApp(e) {
        e.preventDefault();
        ipcRenderer.send('quit', { windowIndex: 'login' });
    }
    closeBtnElement.addEventListener("click", closeApp);
    var minimizeBtnElement = document.getElementById("minimizeBtnWrapper");
    function minimizeApp(e) {
        e.preventDefault();
        ipcRenderer.send('minimize-me', { windowIndex: 'login' });
    }
    minimizeBtnElement.addEventListener("click", minimizeApp);

    var loginButtonTab = document.getElementById("loginButtonTab");
    var registerButtonTab = document.getElementById("registerButtonTab");
    var buttonTabs = [loginButtonTab, registerButtonTab];
    var tabs = document.getElementsByClassName('tab');
    function toggleButtonTab(e) {
        buttonTabs.forEach(function (b) {
            b.classList.remove('active');
            b.style.backgroundImage = 'none';
        });
        var source = e.target;
        source.classList.add('active');
        source.style.backgroundImage = 'url(' + buttonBackgroundActive + ')';
        var target = source.dataset.target;
        var tab = document.getElementById(target);
        for (var i = 0; i < tabs.length; i++) {
            var t = tabs[i];
            t.style.display = 'none';
        }
        tab.style.display = 'block';
    }
    buttonTabs.forEach(function (b) {
        b.addEventListener("click", toggleButtonTab);
    });
    toggleButtonTab({ target: loginButtonTab });

    var btnLogin = document.getElementById('btnLogin');
    btnLogin.addEventListener('click', login);
    var btnRegister = document.getElementById('btnRegister');
    btnRegister.addEventListener('click', register);

    drawRecentListAccount();

    var contextmenuItems = document.getElementsByClassName("recentAccountContextMenuItem");
    for (var i = 0; i < contextmenuItems.length; i++) {
        var contextmenuItem = contextmenuItems[i];
        contextmenuItem.addEventListener('click', function (e) {
            e.stopPropagation();
            var target = e.target.dataset.target;
            contextMenuFunctions[target]();
        });
    }

    var updateNowBtn = document.getElementById("updateNow");
    updateNowBtn.addEventListener('click', function () {
        ipcRenderer.send('update', 1);
    });
    ipcRenderer.send('update', 0);
    var deleteCacheButton = document.getElementById("deleteCache");
    deleteCacheButton.addEventListener('click', function () {
        ipcRenderer.send('deletecache', 1);
    });

    var forgotPassButton = document.getElementById("forgotPass");
    forgotPassButton.addEventListener('click', function () {
        ipcRenderer.send('forgotpass-open');
    });

    var passwordInput = document.getElementById('lgpassword');
    passwordInput.addEventListener("keypress", function (event) {
        // If the user presses the "Enter" key on the keyboard
        if (event.key === "Enter") {
            // Cancel the default action, if needed
            event.preventDefault();
            // Trigger the button element with a click
            login();
        }
    });
})

const compareDates = (d1, d2) => {
    let date1 = new Date(d1).getTime();
    let date2 = new Date(d2).getTime();

    if (date1 < date2) {
        return -1;
    } else if (date1 > date2) {
        return 1;
    } else {
        return 0;
    }
};
var drawRecentListAccount = function () {
    var list = document.getElementById('recentAccountList');
    list.innerHTML = '';
    if (fs.existsSync(recentAccountFile)) {
        let data = fs.readFileSync(recentAccountFile, 'utf8').split('\n');
        let newData = [];
        data.forEach((account, index) => {
            let [username, password, time] = account.split(',');
            if (username && password && time) {
                newData.push({
                    'username': username,
                    'password': password,
                    'time': time,
                });
            }
        });
        newData.sort(function (a, b) {
            return -compareDates(a.time, b.time);
        });
        newData.forEach((account, index) => {
            addToListRecentAccount(account.username, account.password, account.time);
        });
    } else {
        if (!fs.existsSync(path.dirname(recentAccountFile))) {
            fs.mkdir(path.dirname(recentAccountFile), '0777', function () { });
        }
        fs.writeFile(recentAccountFile, '', (err) => {
            if (err) {
                ipcRenderer.send('errorbox', [
                    'login',
                    'Cảnh báo',
                    err.message
                ]);
            }
        })
    }
}

var checkRecentAccount = function (username) {
    let data = fs.readFileSync(recentAccountFile, 'utf8').split('\n');
    let isDuplicated = false;
    data.forEach((account, index) => {
        let [fusername, fpassword, time] = account.split(',');
        if (fusername && fpassword && time) {
            if (username == fusername) {
                isDuplicated = true;
                return;
            }
        }
    });
    return isDuplicated;
}
var addToRecentAccount = function (username, password) {
    var existed = checkRecentAccount(username);
    var date = new Date();
    var time = date.getFullYear()
        + '-'
        + (date.getMonth() + 1).toString().padStart(2, '0')
        + '-'
        + date.getDate().toString().padStart(2, '0')
        + ' '
        + date.getHours().toString().padStart(2, '0')
        + ':'
        + date.getMinutes().toString().padStart(2, '0')
        + ':'
        + date.getSeconds().toString().padStart(2, '0');
    if (!existed) {
        fs.appendFile(recentAccountFile, username + ',' + password + ',' + time + '\n', function () {
        });
        addToListRecentAccount(username, password, time);
    } else {
        let data = fs.readFileSync(recentAccountFile, 'utf8').split('\n');
        let newData = [];
        data.forEach((account, index) => {
            let [fusername, fpassword, ftime] = account.split(',');
            if (fusername && fpassword && ftime) {
                if (fusername != username) {
                    newData.push(account);
                } else {
                    var naccount = username + ',' + password + ',' + time;
                    newData.push(naccount);
                }
            }
        });
        fs.writeFile(recentAccountFile, '', function () { });
        if (newData.length > 0) {
            newData.forEach((account, index) => {
                fs.appendFile(recentAccountFile, account + "\n", function () { });
            });
        }
        drawRecentListAccount();
    }
}
var addToListRecentAccount = function (username, password, time) {
    var list = document.getElementById('recentAccountList');
    var row = document.createElement('tr');
    var col1 = document.createElement('td');
    col1.innerText = username;
    row.appendChild(col1);
    var col2 = document.createElement('td');
    col2.innerText = time;
    row.appendChild(col2);
    row.dataset['username'] = username;
    row.dataset['password'] = password;
    row.classList.add('recentAccount');
    list.appendChild(row);
}

var removeRecentAccount = function (username) {
    let data = fs.readFileSync(recentAccountFile, 'utf8').split('\n');
    let newData = [];
    data.forEach((account, index) => {
        let [fusername, fpassword, ftime] = account.split(',');
        if (fusername && fpassword && ftime) {
            if (fusername != username) {
                newData.push(account);
            }
        }
    });
    fs.writeFile(recentAccountFile, '', function () { });
    if (newData.length > 0) {
        newData.forEach((account, index) => {
            fs.appendFile(recentAccountFile, account + "\n", function () { });
        });
    }
    removeRecentAccountFromList(username);
}
var removeRecentAccountFromList = function (username) {
    var list = document.getElementById('recentAccountList');
    var childrenNodes = list.childNodes;
    childrenNodes.forEach(node => {
        if (node.localName == 'tr' && node.className == 'recentAccount') {
            if (node.dataset.username == username) {
                node.remove();
                return;
            }
        }
    })
}

function login() {
    var usernameInput = document.getElementById('lgusername');
    var passwordInput = document.getElementById('lgpassword');
    if (!usernameInput.value || !passwordInput.value) {
        ipcRenderer.send('warningbox', [
            'login',
            'Cảnh báo',
            'Vui lòng nhập tài khoản và mật khẩu!'
        ]);
        return;
    }
    showLoading();
    // test process


    //force user to update launcher
    //define version of launcher here
    post(config.host + '/api/login131', { username: usernameInput.value, password: passwordInput.value }, loginCallback);
}
function loginCallback(response) {
    hideLoading();
    var usernameInput = document.getElementById('lgusername');
    var passwordInput = document.getElementById('lgpassword');
    if (response.success == true) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userInfo', JSON.stringify(response.data.userInfo));
        addToRecentAccount(usernameInput.value, passwordInput.value);
        ipcRenderer.send('switchToPlay', { windowIndex: 'login' });
    } else if (response.success == 2) {
        ipcRenderer.send('tfa-login-validation', [usernameInput.value, passwordInput.value, 'login']);
    } else {
        ipcRenderer.send('errorbox', [
            'login',
            'Cảnh báo',
            response.message
        ]);
    }
}
ipcRenderer.on('login-by-child', (evt, response) => {
    loginCallback(response);
});

function register() {
    var usernameInput = document.getElementById('rusername');
    var passwordInput = document.getElementById('rpassword');
    var passwordReInput = document.getElementById('rrpassword');
    var emailInput = document.getElementById('remail');
    if (!usernameInput.value || !passwordInput.value || !passwordReInput.value || !emailInput.value) {
        ipcRenderer.send('warningbox', [
            'login',
            'Cảnh báo',
            'Vui lòng nhập đủ thông tin!'
        ]);
        return;
    }
    if (!validateEmail(emailInput.value)) {
        ipcRenderer.send('messagebox', [
            'login',
            'Cảnh báo',
            'Địa chỉ email không đúng!'
        ]);
        return;
    }
    if (passwordInput.value != passwordReInput.value) {
        ipcRenderer.send('warningbox', [
            'login',
            'Cảnh báo',
            'Xác nhận mật khẩu không đúng!'
        ]);
        return;
    }
    showLoading();
    post(config.host + '/api/register', {
        username: usernameInput.value,
        password: passwordInput.value,
        repassword: passwordReInput.value,
        email: emailInput.value
    }, registerCallback);
}
function registerCallback(response, request) {
    hideLoading();
    if (!empty(response.success) && response.success === true) {
        ipcRenderer.send('infobox', [
            'login',
            'Thông báo',
            response.message
        ]);
        let usernameInput = document.getElementById('rusername');
        let passwordInput = document.getElementById('rpassword');
        let passwordReInput = document.getElementById('rrpassword');
        let emailInput = document.getElementById('remail');
        usernameInput.value = '';
        passwordInput.value = '';
        passwordReInput.value = '';
        emailInput.value = '';
    } else {
        let message = requestValidationErrorMessage(response, request);
        ipcRenderer.send('errorbox', [
            'login',
            'Cảnh báo',
            message
        ]);
    }
}

window.addEventListener('click', function (e) {
    var target = e.target;
    if (target.localName == 'td' && target.parentNode.className == 'recentAccount') {
        var usernameInput = document.getElementById('lgusername');
        var passwordInput = document.getElementById('lgpassword');
        usernameInput.value = target.parentNode.dataset.username;
        passwordInput.value = target.parentNode.dataset.password;
    }
})

window.addEventListener('mouseup', function (e) {
    var recentAccountContextMenu = document.getElementById('recentAccountContextMenu');
    if (e.button == 2) { //right click
        var target = e.target;
        if (target.localName == 'td' && target.parentNode.className == 'recentAccount') {
            recentAccountContextMenu.style.top = e.clientY + 'px';
            recentAccountContextMenu.style.left = e.clientX + 'px';
            recentAccountContextMenu.style.display = 'block';
            setCurrentAccountInContextMenu(target.parentNode.dataset.username);
            return;
        }
    }
    recentAccountContextMenu.style.display = 'none';
})
var currentAccountInContextMenu = '';
var setCurrentAccountInContextMenu = function (username) {
    currentAccountInContextMenu = username;
}
var contextMenuFunctions = {
    removeAccount: function () {
        removeRecentAccount(currentAccountInContextMenu);
    }
}

ipcRenderer.on('switchToPlay', () => {
    ipcRenderer.send('switchToPlay', { windowIndex: 'login' });
})
