const {ipcRenderer} = require('electron');
const config = require('../const');
const {post, showLoading, hideLoading, empty, requestValidationErrorMessage} = require('../helper');

window.addEventListener('DOMContentLoaded', () => {
    getServerList();
    var button = document.getElementById("submitter");
    button.addEventListener('click', function (e) {
        var serverSelectElement = document.getElementById("serverSelect");
        var playerSelectElement = document.getElementById("playerSelect");
        if (empty(serverSelectElement.value) || empty(playerSelectElement.value)) {
            ipcRenderer.send('warningbox', [
                'clearBagPassword',
                'Cảnh báo',
                'Vui lòng chọn máy chủ và nhân vật muốn xóa mật khẩu rương!'
            ]);
            return;
        }
        submit(serverSelectElement.value, playerSelectElement.value);
    });
});
var getServerList = function () {
    showLoading();
    post(config.host + '/api/serverlist', {}, getServerListCallback);
}
var getServerListCallback = function (response, request) {
    hideLoading();
    if (!empty(response.success) && response.success === true) {
        var list = response.data;
        var serverSelectElement = document.getElementById("serverSelect");
        for (var i = 0; i < list.length; i++) {
            var option = document.createElement('option');
            option.value = list[i].ServerID;
            option.innerText = list[i].ServerName;
            if (i == 0) {
                option.selected = true;
            }
            serverSelectElement.appendChild(option);
        }
        getPlayerList();
        return;
    }
    let message = requestValidationErrorMessage(response, request);
    ipcRenderer.send('errorbox', [
        'clearBagPassword',
        'Cảnh báo',
        message
    ]);
}
var getPlayerList = function () {
    showLoading();
    post(config.host + '/api/playerlist', {}, getPlayerListCallback);
}
var getPlayerListCallback = function (response, request) {
    hideLoading();
    if (!empty(response.success) && response.success === true) {
        var list = response.data;
        var playerSelectElement = document.getElementById("playerSelect");
        if (typeof list != "undefined") {
            for (var i = 0; i < list.length; i++) {
                var option = document.createElement('option');
                option.value = list[i].UserID;
                option.innerText = list[i].NickName;
                if (i == 0) {
                    option.selected = true;
                }
                playerSelectElement.appendChild(option);
            }
        } else {
            var option = document.createElement('option');
            option.value = 0;
            option.innerText = 'Bạn chưa tạo nhân vật!';
            option.selected = true;
            playerSelectElement.appendChild(option);
        }
        return;
    }
    let message = requestValidationErrorMessage(response, request);
    ipcRenderer.send('errorbox', [
        'clearBagPassword',
        'Cảnh báo',
        message
    ]);
}
var submit = function (server_id, player_id, isShowLoading = true) {
    if (isShowLoading) showLoading();
    post(config.host + '/api/clearBagPassword', {server_id: server_id, player_id: player_id}, submitCallback);
}
var submitCallback = function (response, request) {
    hideLoading();
    if (!empty(response.success) && response.success === true) {
        ipcRenderer.send('infobox', [
            'clearBagPassword',
            'Thông báo',
            response.message
        ]);
        return;
    } else if (parseInt(response.success) == 2) {
        ipcRenderer.send('tfa-clear-bag-password-validation', {windowIndex: 'clearBagPassword'});
        return;
    }
    let message = requestValidationErrorMessage(response, request);
    ipcRenderer.send('errorbox', [
        'clearBagPassword',
        'Cảnh báo',
        message
    ]);
}
