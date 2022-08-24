const  log = require('electron-log')
import {app} from 'electron'
import {resolve} from 'path'
import path from 'path'

export const assetUserdata = (s = '') => {
  return path.join(app.getPath('userData'), s)
}

export const logi = (s: any) => {
  log.info(s)
}

export const loge = (s: any) => {
  log.error(s)
}

export const assetPath = (s: string = '') => {
  let asset_path: string

  if(app.isPackaged) {
    asset_path = app.getAppPath() + '/extra/' + s
  }else{
    asset_path = app.getAppPath() + '/../extra/' + s
  }

  asset_path = resolve(asset_path)


  return asset_path
}

export const getBrowserExec = () => {
  if(process.platform == 'darwin') {
    return assetPath('browser/mac/Orbita-Browser.app/Contents/MacOS/Orbita')
  }

  return assetPath('browser/win/orbita-browser/chrome.exe')
}
