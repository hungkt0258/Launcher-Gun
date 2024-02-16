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
                'forgotpassvalidation',
                'Cảnh báo',
                'Quá thời gian xác thực!'
            ]);
            ipcRenderer.send('close-me', {windowIndex: 'forgotpassvalidation'});
            clearInterval(interval);
        }
    }, 1000);

    var submitterBtn = document.getElementById('submitter');
    submitterBtn.addEventListener('click', function () {
        var input = document.getElementById('code');
        if (empty(input.value)) {
            ipcRenderer.send('warningbox', [
                'forgotpassvalidation',
                'Cảnh báo',
                'Vui lòng nhập mã xác thực!'
            ]);
            return;
        }
        showLoading();
        post(config.host + '/api/forgotPassword/validate', {code: input.value}, validTFACallback);
    });
});

var validTFACallback = function (response, request) {
    hideLoading();
    if (!empty(response.success) && response.success === true) {
        clearInterval(interval);
        ipcRenderer.send('infobox', [
            'forgotpassvalidation',
            'Thông báo',
            response.message
        ]);
        ipcRenderer.send('close-me', {windowIndex: 'forgotpassvalidation'});
    } else {
        let message = requestValidationErrorMessage(response, request);
        ipcRenderer.send('errorbox', [
            'forgotpassvalidation',
            'Cảnh báo',
            message
        ]);
    }
}
