const {ipcRenderer, remote} = require('electron');
const config = require('../const');
const {post, showLoading, hideLoading, empty, requestValidationErrorMessage} = require('../helper');
const fs = require("fs");
const path = require("path");

window.addEventListener('DOMContentLoaded', () => {
    var submitter = document.getElementById("submitter");
    submitter.addEventListener('click', function () {
        var oldPassword = document.getElementById("oldPassword");
        var newPassword = document.getElementById("newPassword");
        var renewPassword = document.getElementById("renewPassword");
        if (empty(oldPassword.value) || empty(newPassword.value) || empty(renewPassword.value)) {
            ipcRenderer.send('warningbox', [
                'changepassword',
                'Cảnh báo',
                'Vui lòng nhập đầy đủ thông tin!'
            ]);
            return;
        }
        showLoading();
        post(config.host + '/api/changePassword', {
            current_password: oldPassword.value,
            new_password: newPassword.value,
            re_new_password: renewPassword.value,
        }, changePasswordCallback);
    });
});

var changePasswordCallback = function (response, request, msgbox = true) {
    hideLoading();
    if (!empty(response.success) && response.success === true) {
        var oldPassword = document.getElementById("oldPassword");
        var newPassword = document.getElementById("newPassword");
        var renewPassword = document.getElementById("renewPassword");
        updatePasswordToFile(newPassword.value);
        oldPassword.value = '';
        newPassword.value = '';
        renewPassword.value = '';
        if (msgbox) {
            ipcRenderer.send('infobox', [
                'changepassword',
                'Thông báo',
                response.message
            ]);
        }
        return;
    } else if (!empty(response.success) && parseInt(response.success) === 2) {
        ipcRenderer.send('tfa-change-password-validation', {windowIndex: 'changepassword'});
        return;
    }
    let message = requestValidationErrorMessage(response, request);
    ipcRenderer.send('errorbox', [
        'changepassword',
        'Cảnh báo',
        message
    ]);
}

var updatePasswordToFile = function (password) {
    const userDataPath = remote.app.getPath(
        'userData'
    );
    let recentAccountFile = path.join(userDataPath, '../accounts.txt');
    var userInfoStr = localStorage.getItem('userInfo');
    var userInfo = JSON.parse(userInfoStr);
    var username = userInfo['UserName'];
    let data = fs.readFileSync(recentAccountFile, 'utf8').split('\n');
    let newData = [];
    data.forEach((account, index) => {
        let [fusername, fpassword, ftime] = account.split(',');
        if (fusername && fpassword && ftime) {
            if (fusername != username) {
                newData.push(account);
            } else {
                var naccount = username + ',' + password + ',' + ftime;
                newData.push(naccount);
            }
        }
    });
    fs.writeFile(recentAccountFile, '', function () {});
    if (newData.length > 0) {
        newData.forEach((account, index) => {
            fs.appendFile(recentAccountFile, account + "\n", function () {});
        });
    }
}

ipcRenderer.on('password-updated', (evt, response) => {
    changePasswordCallback(response, null, false);
});
