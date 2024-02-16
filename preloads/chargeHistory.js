const {ipcRenderer} = require('electron');
const config = require('../const');
const {post, showLoading, hideLoading, empty, requestValidationErrorMessage} = require('../helper');

window.addEventListener('DOMContentLoaded', () => {
    let userInfo = getUserInfo();
    showLoading();
    post(config.host + '/api/chargeHistory', {}, getListCallback);
});

var getListCallback = function (response, request, msgbox = true) {
    hideLoading();
    if (!empty(response.success) && response.success === true) {
        var tbody = document.getElementById("tbody");
        var html = '';
        if (response.data.length > 0) {
            for (var i = 0; i < response.data.length; i++) {
                var d = response.data[i];
                html += '<tr>' +
                    '<td>'+ ( i + 1) +'</td>' +
                    '<td>'+ d.TimeCreate +'</td>' +
                    '<td>'+ d.Value +'</td>' +
                    '<td>'+ d.Content +'</td>' +
                    '</tr>';
            }
            tbody.innerHTML = html;
        }
        return;
    }
    let message = requestValidationErrorMessage(response, request);
    ipcRenderer.send('errorbox', [
        'chargehistory',
        'Cảnh báo',
        message
    ]);
}

var getUserInfo = function () {
    var userInfoStr = localStorage.getItem('userInfo');
    return JSON.parse(userInfoStr);
}
