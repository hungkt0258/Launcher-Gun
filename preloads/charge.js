const { ipcRenderer } = require('electron');
const config = require('../const');
const { post, showLoading, hideLoading, empty, requestValidationErrorMessage } = require('../helper');

var cardType, cardAmount, cardPass, cardSeri;

//initialize
cardType = 'viettel';
window.addEventListener('DOMContentLoaded', () => {
    var navLinks = document.getElementsByClassName('nav-link');
    for (var i = 0; i < navLinks.length; i++) {
        var navLink = navLinks[i];
        navLink.addEventListener('click', function (e) {
            e.preventDefault();
            for (var j = 0; j < navLinks.length; j++) {
                navLinks[j].classList.remove('active');
            }
            this.classList.add('active');
            var type = this.dataset.target;
            var cardBodys = document.getElementsByClassName('card-body');
            for (var j = 0; j < cardBodys.length; j++) {
                var cardBody = cardBodys[j];
                cardBody.classList.add('d-none');
            }
            var thisCardBody = document.getElementById(type);
            if (thisCardBody != null) {
                thisCardBody.classList.remove('d-none');
            }
        });
    }
    var cardImages = document.getElementsByClassName('cardImage');
    for (var i = 0; i < cardImages.length; i++) {
        var cardImage = cardImages[i];
        cardImage.addEventListener('click', function (e) {
            for (var j = 0; j < cardImages.length; j++) {
                cardImages[j].classList.remove('active');
            }
            this.classList.add('active');
            cardType = this.dataset.target;
        });
    }
    var amountSelect = document.getElementById("amount");
    amountSelect.addEventListener('change', function (e) {
        var value = this.value;
        var resultCoin = document.getElementById("resultCoin");
        resultCoin.innerText = (value * parseInt(getChargeRateInfo('rateCard')) / 10000).toString();
        cardAmount = value;
    });
    var passcardEl = document.getElementById("passcard");
    passcardEl.addEventListener('change', function (e) {
        cardPass = this.value;
    });
    var seriEl = document.getElementById("seri");
    seriEl.addEventListener('change', function (e) {
        cardSeri = this.value;
    });
    var userInfo = getUserInfo();

    var submitter1 = document.getElementById("chargeCardSubmitter");
    submitter1.addEventListener('click', function () {
        cardChargeSubmitter(cardType, cardAmount, cardPass, cardSeri);
    });

    updateRate();
    showLoading();
    post(config.host + '/api/getMomoChargeQr', {}, (response, request) => {
        if (!empty(response.success) && response.success === true) {
            var momo_comment = document.getElementById("momo_comment");
            momo_comment.innerText = response.data.comment;
            var momo_img = document.getElementById("momoaccountimg");
            momo_img.src = response.data.src;
            var momo_accountname = document.getElementById("momo_accountname");
            momo_accountname.innerText = response.data.accinfo.name;
            var momo_accountnumber = document.getElementById("momo_accountnumber");
            momo_accountnumber.innerText = response.data.accinfo.acc_num;
        }
    });
    // post(config.host + '/api/getBankQrCode', {}, (response, request) => {
    //     if (!empty(response.success) && response.success === true) {
    //         var bank_comment = document.getElementById("bank_comment");
    //         bank_comment.innerText = response.data.comment;
    //         var bank_img = document.getElementById("bankimg");
    //         bank_img.src = response.data.src;
    //         var bank_accountname = document.getElementById("bank_accountname");
    //         bank_accountname.innerText = response.data.accinfo.name;
    //         var bank_accountnumber = document.getElementById("bank_accountnumber");
    //         bank_accountnumber.innerText = response.data.accinfo.acc_num;
    //     }
    // });
     var bank_img = document.getElementById("bankimg");
    bank_img.src = `https://img.vietqr.io/image/ACB-7741477-qr_only.png?addInfo=${userInfo.Name}`;

    // post(config.host + '/api/chargerateinfo', {}, (response, request) => {
    //     hideLoading();
    //     if (!empty(response.success) && response.success === true) {
    //         updateRate(response.data.rateCard, response.data.rateMomo, response.data.rateATM);
    //     }
    // });
});

var cardChargeSubmitter = function (cardType, cardAmount, cardPass, cardSeri) {
    if (!cardType || !cardAmount || !cardPass || !cardSeri) {
        ipcRenderer.send('warningbox', [
            'charge',
            'Cảnh báo',
            'Vui lòng nhập đầy đủ thông tin!'
        ]);
        return;
    }
    post(config.host + '/api/cardCharge', {
        serial: cardSeri,
        pin: cardPass,
        card_type: cardType,
        card_amount: cardAmount
    }, cardChargeCallback)
}

var cardChargeCallback = function (response, request) {
    if (!empty(response.success) && response.success === true) {
        ipcRenderer.send('infobox', [
            'charge',
            'Thông báo',
            response.message
        ]);
    } else {
        let message = requestValidationErrorMessage(response, request);
        ipcRenderer.send('errorbox', [
            'charge',
            'Cảnh báo',
            message
        ]);
    }
}

var getUserInfo = function () {
    var userInfoStr = localStorage.getItem('userInfo');
    return JSON.parse(userInfoStr);
}

var getChargeRateInfo = function (key = '') {
    var rateInfo = localStorage.getItem('chargeRateInfo');
    if (typeof rateInfo != 'undefined' && rateInfo) {
        var rateInfo2 = JSON.parse(rateInfo);
    } else {
        var rateInfo2 = {
            rateCard: 0,
            rateMomo: 0,
            rateATM: 0,
        };
    }
    if (!key) {
        return rateInfo2;
    }
    return rateInfo2[key];
}

var updateRate = function (rateCard = 0, rateMomo = 0, rateATM = 0) {
    var rateInfo = getChargeRateInfo();
    if (rateCard && rateMomo && rateATM) {
        rateInfo['rateCard'] = rateCard;
        rateInfo['rateMomo'] = rateMomo;
        rateInfo['rateATM'] = rateATM;
        localStorage.setItem('chargeRateInfo', JSON.stringify(rateInfo));
    }
    if (typeof rateInfo.rateCard != 'undefined') {
        var rateCardElement = document.getElementById('rateCard');
        rateCardElement.innerText = rateInfo.rateCard;
    }
    if (typeof rateInfo.rateMomo != 'undefined') {
        var rateMomoElement = document.getElementById('rateMomo');
        rateMomoElement.innerText = rateInfo.rateMomo;
    }
    if (typeof rateInfo.rateATM != 'undefined') {
        var rateATMElement = document.getElementById('rateATM');
        rateATMElement.innerText = rateInfo.rateATM;
    }
    var amountSelect = document.getElementById("amount");
    const event = new Event('change');
    amountSelect.dispatchEvent(event);
}
