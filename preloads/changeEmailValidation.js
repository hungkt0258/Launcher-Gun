const {post, showLoading, hideLoading, empty, requestValidationErrorMessage} = require("../helper");
const config = require("../const");
const {ipcRenderer} = require("electron");

let interval;
let timeout = 120; //seconds
window.addEventListener('DOMContentLoaded', () => {
    // var resendBtn = document.getElementById('resend');
    // resendBtn.addEventListener('click', function () {
    //     showLoading();
    //     post(config.host + '/api/active2fa', {}, resendTFACallback);
    // });

    var timeoutEl = document.getElementById('timeout');
    timeoutEl.innerText = '02:00';
    interval = setInterval(function () {
        timeout--;
        let m = Math.floor(timeout / 60).toString().padStart(2, '0');
        let s = (timeout % 60).toString().padStart(2, '0');
        timeoutEl.innerText = m+':'+s;
        if (timeout == 0) {
            ipcRenderer.send('errorbox', [
                'changeemailvalidation',
                'Cảnh báo',
                'Quá thời gian xác thực!'
            ]);
            ipcRenderer.send('close-me', {windowIndex: 'changeemailvalidation'});
            clearInterval(interval);
        }
    }, 1000);

    var submitterBtn = document.getElementById('submitter');
    submitterBtn.addEventListener('click', function () {
        var input = document.getElementById('code');
        if (empty(input.value)) {
            ipcRenderer.send('warningbox', [
                'changeemailvalidation',
                'Cảnh báo',
                'Vui lòng nhập mã xác thực!'
            ]);
            return;
        }
        showLoading();
        post(config.host + '/api/changeEmail/confirmvalidatetfa', {code: input.value}, validTFACallback);
    });
});

var resendTFACallback = function (response, request) {
    hideLoading();
    if (!empty(response.success) && response.success === true) {
        ipcRenderer.send('infobox', [
            'changeemailvalidation',
            'Thông báo',
            response.message
        ]);
        timeout = 120;
    } else {
        let message = requestValidationErrorMessage(response, request);
        ipcRenderer.send('errorbox', [
            'changeemailvalidation',
            'Cảnh báo',
            message
        ]);
    }
}

var validTFACallback = function (response, request) {
    hideLoading();
    if (!empty(response.success) && response.success === true) {
        clearInterval(interval);
        ipcRenderer.send('infobox', [
            'changeemailvalidation',
            'Thông báo',
            response.message
        ]);
        var userInfoStr = localStorage.getItem('userInfo');
        var userInfo = JSON.parse(userInfoStr);
        userInfo['Email'] = response.data.Email;
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        ipcRenderer.send('close-me', {windowIndex: 'changeemailvalidation'});
    } else {
        let message = requestValidationErrorMessage(response, request);
        ipcRenderer.send('errorbox', [
            'changeemailvalidation',
            'Cảnh báo',
            message
        ]);
    }
}
