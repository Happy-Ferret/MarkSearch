'use strict';

var electron = require('electron')
var got = require('got')
var ms = require('ms')
var _ = require('lodash')

var appLogger = require('../../utils/appLogger')
var showUpdateNotification = require('./showUpdateNotification')
var appSettings = require('../../db/appSettings')

var devMode = process.env.NODE_ENV === 'development'
var checkInterval = ms('7 days')
var updateUrlToCheck= 'https://raw.githubusercontent.com/Darkle/MarkSearch-Updates/master/updateInfo.json'
/****
 * When running electron in dev, it reports its own package.json version,
 * so when in devMode, get the version number from the MarkSearch
 * package.json directly.
 */
var appVersion = devMode ? require('../../../package.json').version : electron.app.getVersion()
/****
 * Send some info in the user agent to make it easy to block/contact if needed.
 * This is the default user agent for Electron: http://bit.ly/1S5sOQ9
 * note: request doesn't send a user agent by default.
 */
var uAgent = `Mozilla/5.0 AppleWebKit (KHTML, like Gecko) Chrome/${process.versions['chrome']} Electron/${process.versions['electron']} Safari MarkSearch App https://github.com/Darkle/MarkSearch`

function initUpdatesCheck(){
  setTimeout(() => {
    got(
      updateUrlToCheck,
      {
        headers: {
          'user-agent': uAgent
        }
      }
    )
    .then(response => {
      var updateData = JSON.parse(response.body)
      if(_.get(updateData, 'latestUpdateVersion.length') &&
        appVersion !== updateData.latestUpdateVersion &&
        updateData.latestUpdateVersion !== appSettings.settings.skipUpdateVersion){
          showUpdateNotification(updateData.latestUpdateVersion)
      }
    })
    .catch(err => {
      console.error(err)
      appLogger({err})
    })
  }, checkInterval)
}

module.exports = initUpdatesCheck