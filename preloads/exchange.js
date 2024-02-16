const {ipcRenderer} = require('electron');
const config = require('../const');
const {post, showLoading, hideLoading, empty, requestValidationErrorMessage} = require('../helper');

window.addEventListener('DOMContentLoaded', () => {
    updateCoin();
    getServerList();
    var cointAmountElement = document.getElementById("coinAmount");
    cointAmountElement.addEventListener('input', function () {
        var xu = this.value;
        var exchangeXuTextElement = document.getElementById("exchangeXuText");
        exchangeXuTextElement.innerText = xu.toString();
    });
    var button = document.getElementById("submitter");
    button.addEventListener('click', function (e) {
        var serverSelectElement = document.getElementById("serverSelect");
        var playerSelectElement = document.getElementById("playerSelect");
        if (empty(serverSelectElement.value) || empty(playerSelectElement.value)) {
            ipcRenderer.send('warningbox', [
                'exchange',
                'Cảnh báo',
                'Vui lòng chọn máy chủ và nhân vật muốn chuyển xu!'
            ]);
            return;
        }
        var coinAmount = cointAmountElement.value;
        if (!coinAmount) {
            ipcRenderer.send('warningbox', [
                'exchange',
                'Cảnh báo',
                'Vui lòng nhập số coin muốn chuyển'
            ]);
            return;
        }
        if (coinAmount < 600 || coinAmount > 1000000) {
            ipcRenderer.send('warningbox', [
                'exchange',
                'Cảnh báo',
                'Số coin chuyển phải nằm trong khoảng 600 -> 1.000.000 coin'
            ]);
            return;
        }
        coinAmount = parseInt(coinAmount);
        submit(serverSelectElement.value, playerSelectElement.value, coinAmount);
    });
    var refreshCoinButton = document.getElementById("reloadCoin");
    refreshCoinButton.addEventListener('click', function (e) {
        showLoading();
        post(config.host + '/api/coininfo', {}, (response, request) => {
            hideLoading();
            if (!empty(response.success) && response.success === true) {
                updateCoin(response.data.coin);
            }
        });
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
        'exchange',
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
        'exchange',
        'Cảnh báo',
        message
    ]);
}
var submit = function (server_id, player_id, coin_amount, isShowLoading = true) {
    if (isShowLoading) showLoading();
    post(config.host + '/api/convertCoin', {server_id: server_id, player_id: player_id, coin: coin_amount}, submitCallback);
}
var submitCallback = function (response, request) {
    hideLoading();
    if (!empty(response.success) && response.success === true) {
        ipcRenderer.send('infobox', [
            'exchange',
            'Thông báo',
            response.message
        ]);
        resetText();
        updateCoin(response.data.coin);
        return;
    } else if (parseInt(response.success) == 2) {
        ipcRenderer.send('tfa-exchange-validation', {windowIndex: 'exchange'});
        return;
    }
    let message = requestValidationErrorMessage(response, request);
    ipcRenderer.send('errorbox', [
        'exchange',
        'Cảnh báo',
        message
    ]);
}
var updateCoin = function (newCoin = 0) {
    var currentCoinTextElement = document.getElementById("currentCoinText");
    var userInfoStr = localStorage.getItem('userInfo');
    var userInfo = JSON.parse(userInfoStr);
    var coin = parseInt(userInfo['Money']);
    if (!empty(newCoin)) {
        coin = newCoin;
        userInfo['Money'] = coin;
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
    }
    currentCoinTextElement.innerText = coin;
}

var resetText = function () {
    var cointAmountElement = document.getElementById("coinAmount");
    cointAmountElement.value = '';
    var exchangeXuTextElement = document.getElementById("exchangeXuText");
    exchangeXuTextElement.innerText = 0;
}

ipcRenderer.on('update-coin', (evt, arg) => {
    updateCoin(arg[0]);
    if (!empty(arg[1])) {
        resetText();
    }
})
