import { app, dialog, ipcMain as ip } from "electron";
import GotApi, { BROWSER_PATH, PROFILE_PATH } from "./lib/gotapi";
import { logi, loge } from "./lib/util";
import { ProfileType } from "./type";
import _ from "lodash";
import {machineId, machineIdSync} from 'node-machine-id';
import Store from 'electron-store'
import axios from "axios";

const store = new Store();

async function getDeviceId() {
  return await machineId();
}


logi("USER_DATA=" + PROFILE_PATH);
logi("BROWSER_PATH=" + BROWSER_PATH);

const got = new GotApi();

var profileList: ProfileType[] = [];

ip.on("ready", (ev, req) => {
  ev.returnValue = req;
});

ip.handle("new-profile", async (ev, {}) => {
  try {
    let name = await got.genNewProfile();
    profileList = await got.loadAllProfile();

    return Promise.resolve(name)
  } catch (error) {
    loge(error);
  }
});

ip.handle("run-browser", async (ev, { id }) => {
  try {
    let idx = _.findIndex(profileList, { id });
    let profile = profileList[idx];

    if (!profile)
      return Promise.resolve({ status: false, error: "id not found" });
    console.log(profile);

    logi(`browser [${profile.name}] starting...`);
    let { lastRun } = await got.launchBrowser(profile.profilePath);
    logi(`browser [${profile.name}] started`);

    profileList.splice(idx, 1, { ...profile, lastRun });

    return Promise.resolve({ status: true, data: profile });
  } catch (error) {
    loge(error);
  }
});

ip.handle("del-profile", async (ev, { id }) => {
  try {
    let profile = profileList.find((e) => e.id == id);
    await got.delProfile(profile?.profilePath);
    profileList = await got.loadAllProfile();

    return Promise.resolve(profile?.name);
  } catch (error) {
    loge(error);
  }
});

ip.handle("load-profile", async (ev) => {
  try {
    if (profileList.length) return Promise.resolve(profileList);
    profileList = await got.loadAllProfile();
    return profileList;
  } catch (err) {
    loge(err);
  }
});

ip.handle("browser-proxy", async (ev, { id, proxy }) => {
  try {
    let profile = profileList.find((e) => e.id == id);

    await got.saveProxy(proxy, profile?.profilePath);

    profileList = await got.loadAllProfile();

    return Promise.resolve({ status: true });
  } catch (err) {
    loge(err);
  }
});

ip.handle("browser-name", async (ev, { id, name }) => {
  try {
    logi(`[Browser] ${id} set name = ${name}`);
    let profile = profileList.find((e) => e.id == id);
    if (!profile) return Promise.resolve({ status: false });

    await got.setName(profile.profilePath, name);
    profile.name = name;

    return Promise.resolve({ status: true });
  } catch (err) {
    loge(err);
  }
});


ip.handle('import-profile',async (ev, src) => {
  await got.copyProfile(src)
  profileList = await got.loadAllProfile();
})

ip.handle('open-file',async (ev) => {
  const { filePaths } = await dialog.showOpenDialog({
    title: 'Nạp profile',
    properties: ['openDirectory'],
  })
  let [folderDir] = filePaths

  let status = await got.isProfileDir(folderDir)
  return Promise.resolve(status ? folderDir: null)
})

ip.handle('auth-get',async (ev) => {
  let user: any = store.get('user')
  return Promise.resolve(user)
})

ip.handle('auth-change', async (ev) => {
  store.set('user', null)
  return Promise.resolve(null)
})

ip.handle('feedback',async (ev, params) => {
  let status = 0
  try{
    let device_id = await getDeviceId()
    params.device_id = device_id
    let res = await axios.post('https://dev.newlifeme.vn/api/mingot/feedback', params)
    status = res.data.status
  }catch(err) {
    loge(err)
  }

  return Promise.resolve(status)
})

ip.handle('version', async () => {
  return Promise.resolve(app.getVersion())
})

ip.handle('login', async (ev, username = undefined) => {
  let device_id = await getDeviceId()
  let user: any = store.get('user')
  logi('you=', user);

  if(user) {
    username = user.username
  }
  let res = await axios.post('https://dev.newlifeme.vn/api/mingot/login', {username, device_id})
  logi('login response', res.data);
  let active = res.data.status
  store.set('user', {username, active})

  return Promise.resolve(res.data.status)
})
