import {ipcMain as ip} from 'electron'
import { closeBrowser, openBrowser } from './lib/browser'
import {Profile} from './lib/profile'
import { logi, assetPath, assetUserdata } from './lib/util';

const api = Profile()

logi('assetPath=' + assetPath())
logi('userData=' + assetUserdata())



ip.on('ready', (ev, req) => {
  ev.returnValue = req
})


ip.handle('run-browser', async (ev, {id, run_flg}) => {
  let profile = api.profileData.find(e => e.id == id)

  if(!profile) return Promise.resolve({status: false, error: 'id not found', data: profile})
  if(run_flg) {

    logi(`browser [${profile.name}] opening...`);
    let ws = await openBrowser(profile.userDataDir, profile.proxy)
    profile.ws = ws
    profile.isRun = true
    logi(`browser [${profile.name}] opened`);
    return Promise.resolve({status: (ws != undefined), data: profile})

  }
  if(!profile.ws) return Promise.resolve({status: false, data: profile})
  logi(`browser [${profile.name}] closing...`);
  let rs = await closeBrowser(profile.ws)
  logi(`browser [${profile.name}] closed`);
  profile.ws = undefined
  profile.isRun = false

  return Promise.resolve({status: rs.status, data: profile})
})

ip.handle('load-profile', async (ev) => {
  if(api.profileData.length) return Promise.resolve(api.profileData)

  let data = await api.load()
  api.profileData = data.map(e => ({...e, isRun: false}))
  return Promise.resolve(api.profileData)
})

ip.handle('browser-proxy', async (ev, {id, proxy}) => {
  let profile = api.profileData.find(e => e.id == id)

  if(!profile) return Promise.resolve({status: false, error: 'id not found'})

  profile.proxy = proxy

  return Promise.resolve({status: 1, profile})
})


ip.handle('browser-name',async (ev, {id, name}) => {
  logi(`[Browser] ${id} set name = ${name}`)

  let profile = api.profileData.find(e => e.id == id)
  if(!profile) return Promise.resolve({status: false})
  await api.setName(id, name)
  profile.name = name

  return Promise.resolve({status: true})
})
