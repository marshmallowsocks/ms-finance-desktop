// Basic init
const electron = require('electron')
const {app, BrowserWindow} = electron

//Let electron reload by itself when webpack watches changes in ./app/
require('electron-reload')(__dirname)

// To avoid being garbage collected
let mainWindow

app.on('ready', () => {

    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false,
        icon: `${__dirname}/icon.png`
    })

    mainWindow.loadURL(`file://${__dirname}/app/index.html`)

})
