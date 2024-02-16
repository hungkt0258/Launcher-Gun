const {ipcRenderer} = require('electron');
const config = require('../const');
const {post, showLoading, hideLoading, empty, requestValidationErrorMessage} = require('../helper');
const fs = require("fs");
const path = require("path");

window.addEventListener('DOMContentLoaded', () => {
    var submitter = document.getElementById("submitter");
    submitter.addEventListener('click', function () {
        var account = document.getElementById("account");
        if (empty(account.value)) {
            ipcRenderer.send('warningbox', [
                'forgotpass',
                'Cảnh báo',
                'Vui lòng nhập đầy đủ thông tin!'
            ]);
            return;
        }
        showLoading();
        post(config.host + '/api/forgotPassword', {
            account: account.value,
        }, forgotPasswordCallback);
    });
});

var forgotPasswordCallback = function (response, request, msgbox = true) {
    hideLoading();
    if (!empty(response.success) && response.success === true) {
        var account = document.getElementById("account");
        account.value = '';
        if (msgbox) {
            ipcRenderer.send('infobox', [
                'forgotpass',
                'Thông báo',
                response.message
            ]);
        }
        return;
    } else if (!empty(response.success) && parseInt(response.success) === 2) {
        ipcRenderer.send('forgot-password-validation', {windowIndex: 'forgotpass'});
        return;
    }
    let message = requestValidationErrorMessage(response, request);
    ipcRenderer.send('errorbox', [
        'forgotpass',
        'Cảnh báo',
        message
    ]);
}
