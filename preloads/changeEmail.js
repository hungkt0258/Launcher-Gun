const {ipcRenderer} = require('electron');
const config = require('../const');
const {post, showLoading, hideLoading, empty, requestValidationErrorMessage} = require('../helper');

window.addEventListener('DOMContentLoaded', () => {
    let userInfo = getUserInfo();
    let emailText = document.getElementById("currentEmailText");
    emailText.innerText = userInfo['Email'];
    var submitter = document.getElementById("submitter");
    submitter.addEventListener('click', function () {
        let newEmail = document.getElementById("new_email");
        if (empty(newEmail.value)) {
            ipcRenderer.send('warningbox', [
                'changeemail',
                'Cảnh báo',
                'Vui lòng nhập đầy đủ thông tin!'
            ]);
            return;
        }
        showLoading();
        post(config.host + '/api/changeEmail', {
            email: newEmail.value
        }, changeEmailCallback);
    });
});

var changeEmailCallback = function (response, request, msgbox = true) {
    hideLoading();
    if (!empty(response.success) && response.success === true) {
        var newEmail = document.getElementById("new_email");
        updateEmail(newEmail.value);
        newEmail.value = '';
        if (msgbox) {
            ipcRenderer.send('infobox', [
                'changeemail',
                'Thông báo',
                response.message
            ]);
        }
        return;
    } else if (!empty(response.success) && parseInt(response.success) === 2) {
        ipcRenderer.send('tfa-change-email-validation', {windowIndex: 'changeemail'});
        return;
    }
    let message = requestValidationErrorMessage(response, request);
    ipcRenderer.send('errorbox', [
        'changeemail',
        'Cảnh báo',
        message
    ]);
}

var getUserInfo = function () {
    var userInfoStr = localStorage.getItem('userInfo');
    return JSON.parse(userInfoStr);
}

var updateEmail = function (email) {
    let userInfo = getUserInfo();
    userInfo['Email'] = email;
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
}

ipcRenderer.on('email-updated', (evt, response) => {
    changeEmailCallback(response, null, false);
});
