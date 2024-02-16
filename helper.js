const loadingGif = require('./assets/images/loadingGif');

const empty = function (mixed_var) {
    var undef, key, i, len;
    var emptyValues = [undef, null, false, 0, '', '0'];

    for (i = 0, len = emptyValues.length; i < len; i++) {
        if (mixed_var === emptyValues[i]) {
            return true;
        }
    }

    if (typeof mixed_var === 'object') {
        for (key in mixed_var) {
            // TODO: should we check for own properties only?
            //if (mixed_var.hasOwnProperty(key)) {
            return false;
            //}
        }
        return true;
    }

    return false;
}

const post = function(url, data, callback) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            callback(this.response, this);
        }
    }
    xhttp.open('POST', url, true);
    xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhttp.setRequestHeader('Accept', 'application/json');
    xhttp.responseType = "json";
    var token = localStorage.getItem('token');
    if (token) {
        xhttp.setRequestHeader('Authorization', 'Bearer '+token);
    }
    if (!empty(data)) {
        const params = new URLSearchParams(data).toString();
        xhttp.send(params);
    } else {
        xhttp.send();
    }
}
const showLoading = function (element) {
    if (typeof element == 'undefined') {
        element = document.body;
    }
    var loadingElement = document.createElement('div');
    loadingElement.classList.add('loading');
    var imageLoading = new Image(289, 268);
    imageLoading.src = loadingGif;
    loadingElement.appendChild(imageLoading);
    element.appendChild(loadingElement);
}
const hideLoading = function (element) {
    if (typeof element == 'undefined') {
        element = document.body;
    }
    var loading = element.querySelector(".loading");
    if (loading != null) {
        loading.remove();
    }
}
const uniqId = function (prefix) {
    var n = new Date().getTime();
    var base = Math.floor(n/1000);
    var ext = Math.floor(n%1000*1000);
    var now = ("00000000"+base.toString(16)).slice(-8)+("000000"+ext.toString(16)).slice(-5);
    return (prefix?prefix:'')+now;
}
const validateEmail = (email) => {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
};
const requestValidationErrorMessage = (response, request) => {
    var errorsHtml = response.message;
    if (!empty(request) && !empty(request.status)) {
        if (parseInt(request.status) === 422) {
            var errors = response.errors;
            errorsHtml = 'Dữ liệu đã nhập không chính xác, vui lòng kiểm tra lại!' + "\n";
            var errorKeys = Object.keys(errors);
            errorKeys.forEach(key => {
                var values = errors[key];
                values.forEach(val => {
                    if (typeof val == 'object') {
                        Object.keys(val).forEach(k => {
                            var v = val[k];
                            errorsHtml += ' - ' + v + "\n";
                        })
                    } else if (typeof val == 'string') {
                        errorsHtml += ' - ' + val + "\n";
                    }
                });
            });
        } else if (parseInt(request.status) === 302) {
            errorsHtml = 'Kết nối máy chủ thất bại, vui lòng liên hệ quản trị viên để được trợ giúp!';
        }
    }
    return errorsHtml;
}
module.exports = {post, showLoading, hideLoading, empty, uniqId, validateEmail, requestValidationErrorMessage};
