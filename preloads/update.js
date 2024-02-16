const {ipcRenderer} = require('electron');
const loadingGif = require('../assets/images/loadingGif');

window.addEventListener('DOMContentLoaded', () => {
    let loadingImgEl = document.getElementById('loadingImg');
    let loadingImg = new Image(100, 92);
    loadingImg.src = loadingGif;
    loadingImgEl.appendChild(loadingImg);

    let progress = 0;
    let progressBar = document.getElementById('progressbar');

    ipcRenderer.on("download-progress", (event, p) => {
        progress = Math.floor(p * 100);
        progressBar.style.width = progress + '%';
        progressBar.innerText = progress + '%';
        progressBar.setAttribute('aria-valuenow', progress);
    });

    ipcRenderer.send('download-update');

    // ipcRenderer.on("download-complete", (event, file) => {
    //     ipcRenderer.send('quit-and-install-update');
    // });
});
