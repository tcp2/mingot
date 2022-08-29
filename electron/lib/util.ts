const  log = require('electron-log')
import {app} from 'electron'
import {resolve} from 'path'
import path from 'path'


export const logi = log.info

export const loge = log.error

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



