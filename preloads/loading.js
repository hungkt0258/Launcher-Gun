// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const fs = require('fs');
const path = require('path');
const {ipcRenderer} = require('electron');
const logo2_cropped = require('../assets/images/logo2_cropped');
var img;
var canvas;
var context;
var isIgnored = false;
window.addEventListener('DOMContentLoaded', () => {
    //ipcRenderer.send('IgnoreMouseEvent');
    img = document.getElementById("image_logo");
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');
    img.onload = function() {
        context.drawImage(img, 0, 0, 828, 250);
    };
    img.src = logo2_cropped;
});

window.addEventListener("mousemove", event => {
    var pos = findPos(canvas);
    if (pos != undefined) {
        var x = event.pageX - pos.x;
        var y = event.pageY - pos.y;
        // var coord = "x=" + x + ", y=" + y;
        var p = context.getImageData(x, y, 1, 1).data;
        //var hex = "#" + ("00000000" + rgbToHex(p[0], p[1], p[2], p[3])).slice(-8);
        // document.getElementById('3cham').textContent = coord + " - " + hex;
        // console.log(p);
        if (parseInt(p[3]) === 0) {
            if (isIgnored) {
                return;
            }
            ipcRenderer.send('IgnoreMouseEvent', {windowIndex: 'loading'});
            isIgnored = true;
        } else {
            if (!isIgnored) {
                return;
            }
            ipcRenderer.send('DontIgnoreMouseEvent', {windowIndex: 'loading'});
            isIgnored = false;
        }
    }
});

function findPos(obj) {
    var curleft = 0, curtop = 0;
    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
        return { x: curleft, y: curtop };
    }
    return undefined;
}

function rgbToHex(r, g, b, a) {
    if (r > 255 || g > 255 || b > 255 || a > 255)
        throw "Invalid color component";
    return ((r << 16) | (g << 8) | b | a).toString(16);
}

function randomInt(max) {
    return Math.floor(Math.random() * max);
}

function randomColor() {
    return `rgb(${randomInt(256)}, ${randomInt(256)}, ${randomInt(256)})`
}
