'use strict'

var path = require('path')

var electron = require('electron')
var Positioner = require('electron-positioner')
var _ = require('lodash')

var appSettings = require('../../db/appSettings')
var appLogger = require('../../utils/appLogger')

var ipcMain = electron.ipcMain
var BrowserWindow = electron.BrowserWindow
var electronShell = electron.shell
var notificationWindow = null
var platform = process.platform
var notificationWindowIcon = path.join(__dirname, '..', 'icons', 'blue', 'MS-iconTemplate.png')
var noticationWindowWidth = 420
var noticationWindowHeight = 140

if(platform === 'linux'){
  noticationWindowWidth = 415
  noticationWindowHeight = 120
}
else if(platform === 'win32'){
 noticationWindowWidth = 435
 noticationWindowHeight = 160
}

function showUpdateNotification(latestUpdateVersion) {

  /****
   * http://electron.atom.io/docs/v0.37.5/api/browser-window/#new-browserwindowoptions
   */
  notificationWindow = new BrowserWindow(
    {
      width: noticationWindowWidth,
      height: noticationWindowHeight,
      // frame: false,
      resizable: false,
      alwaysOnTop: true,
      maximizable: false,
      fullscreenable: false,
      acceptFirstMouse: true,
      titleBarStyle: 'hidden',
      autoHideMenuBar: true,
      icon: notificationWindowIcon,
      title: 'An Update Is Available For MarkSearch'
    }
  )

  notificationWindow.setMenu(null)

  var positioner = new Positioner(notificationWindow)
  positioner.move('bottomRight')

  notificationWindow.loadURL(`file://${ path.join(__dirname, 'updateNotification.html') }`)

  notificationWindow.webContents.on('did-finish-load', function() {
    if(global.devMode){
      notificationWindow.webContents.openDevTools({detach: true})
    }
    notificationWindow.send('latestUpdateVersion', latestUpdateVersion)
  })

  notificationWindow.on('closed', function() {
    notificationWindow = null
  })

  ipcMain.on('openUpdatePage', function() {
    notificationWindow.close()
    electronShell.openExternal('https://darkle.github.io/MarkSearch/#downloads')
  })

  ipcMain.on('skipThisVersion', function(event, versionToSkip) {
    notificationWindow.close()
    if(!_.isString(versionToSkip) || !versionToSkip.length){
      /****
       * Fall back if there was an issue passing it back.
       * Passing data back and forth in the off chance that more than
       * one notification is shown.
       */
      versionToSkip = latestUpdateVersion
    }
    appSettings
      .update({skipUpdateVersion: versionToSkip})
      .catch(err => {
        global.devMode && console.error(err)
        appLogger.log.error({err})
      })

  })

}

module.exports = showUpdateNotification