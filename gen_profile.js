const _ = require('lodash');
const fs = require('fs');
const os = require('os');
const util = require('util');
const { access, unlink, writeFile, readFile } = require('fs').promises;
const exec = util.promisify(require('child_process').exec);
const { spawn, execFile } = require('child_process');
const decompress = require('decompress');
const decompressUnzip = require('decompress-unzip');
const path = require('path');
const zipdir = require('zip-dir');
const axios = require('axios')




var p1 = 'browser/fingerprints'
var p2 = 'browser'

function pack(val) {
  if (typeof val === 'string' || val instanceof String) {
    return Buffer.from(val).toString("base64")
  }

  return Buffer.from(JSON.stringify(val)).toString("base64")
}

function unpack(s) {
  return Buffer.from(s, 'base64').toString() // T
}

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MmZlNTU1NzQwOTkxYjhlNDMyNDJiMDkiLCJ0eXBlIjoiZGV2Iiwiand0aWQiOiI2MzA1NmUxMjRkMTczOTJlZGEyYjVlMDMifQ.BPh0QdZ1_h96zleV_-kpZP7XCJCiC3AjSQUQy-XhQSE'

const GOL_API = 'https://api.gologin.com'
// const headers = {
//   'Authorization': `Bearer ${access_token}`,
//   'User-Agent': 'gologin-api',
// }

axios.defaults.baseURL = 'https://api.gologin.com'
axios.defaults.headers.common = {'Authorization': `bearer ${token}`}

const ProfileIdOs = {
  'win': '63056dbf3d4ffa34e347ea91',
  'mac': '',
}

class GotApi {
  constructor(options = {}) {
  }

  dd(...s) {
    console.log(s);
  }

  async emptyProfileFolder() {
    this.dd('get emptyProfileFolder');
    const profile = await readFile(path.resolve(__dirname, 'zero_profile.zip'));
    this.dd('emptyProfileFolder LENGTH ::', profile.length);
    return profile;
  }

  async fetchProfile(os = 'win') {
    var uid = ProfileIdOs[os]
    await axios.patch(`${GOL_API}/browser/fingerprints`, {browsersIds: [uid]})
    let res = await axios.get(`${GOL_API}/browser/${uid}`)

    await writeFile('gologin_tmp.json', JSON.stringify(res.data))
    return res?.data || {}
  }

  async loadProfile() {
    return await readFile('gologin_tmp.json')
  }

  parseProxy(profile) {
    const autoProxyServer = _.get(profile, 'autoProxyServer');
    const splittedAutoProxyServer = autoProxyServer.split('://');
    const splittedProxyAddress = splittedAutoProxyServer[1].split(':');
    const port = splittedProxyAddress[1];

    proxy = {
      'mode': splittedAutoProxyServer[0],
      'host': splittedProxyAddress[0],
      port,
      'username': _.get(profile, 'autoProxyUsername'),
      'password': _.get(profile, 'autoProxyPassword'),
    }

    if (proxy.mode === 'geolocation') {
      proxy.mode = 'http';
    }

    if (proxy.mode === 'none') {
      proxy = null;
    }

    return proxy
  }

  parseWebrtc(profile) {
    let webRtc = {
      mode: _.get(profile, 'webRTC.mode') === 'alerted' ? 'public' : _.get(profile, 'webRTC.mode'),
      publicIP: _.get(profile, 'webRTC.fillBasedOnIp') ? this._tz.ip : _.get(profile, 'webRTC.publicIp'),
      localIps: _.get(profile, 'webRTC.localIps', []),
    };
  }

  async genNewProfile() {
    let profile_zip_path = await this.emptyProfileFolder();
    var profilePath = './temp/';

    let profile = await this.loadProfile()

    this.dd('unzip template profile...')
    await this.unzip(profile_zip_path, profilePath);
    this.dd('unzip done')


    const pref_file_name = path.join(profilePath, 'Default', 'Preferences');

    this.dd('reading', pref_file_name)

    const pref_raw = await readFile(pref_file_name);
    const pref_json = JSON.parse(pref_raw)

    let proxy = _.get(profile, 'proxy');
    let name = _.get(profile, 'name');

    profile.proxy = this.parseProxy(profile)

    profile.webRtc = {
      mode: _.get(profile, 'webRTC.mode') === 'alerted' ? 'public' : _.get(profile, 'webRTC.mode'),
      publicIP: _.get(profile, 'webRTC.fillBasedOnIp') ? this._tz.ip : _.get(profile, 'webRTC.publicIp'),
      localIps: _.get(profile, 'webRTC.localIps', []),
    };

    debug('profile.webRtc=', profile.webRtc);
    debug('profile.timezone=', profile.timezone);
    debug('profile.mediaDevices=', profile.mediaDevices);


    // proxy: mode, host, username, password

  }


  unzip(zipfile, dst) {
    this.dd(`extactProfile ${zipfile}, ${dst}`);
    return decompress(zipfile, dst,
      {
        plugins: [decompressUnzip()],
        filter: file => !file.path.endsWith('/'),
      }
    );
  }
}




async function main() {
  // var uid = '63056dbf3d4ffa34e347ea91'
  // await axios.patch(p1,{"browsersIds": [uid]})
  // var res = await axios.get(`${p2}/${uid}`)

  // var encode = pack(res.data)

  // var decode = unpack(encode)

  // console.log(decode);

  var api = new GotApi
  var res = await api.genNewProfile()
  // await api.fetchProfile()
  // console.log(res);
}

main()
