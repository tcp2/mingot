const _ = require("lodash");
const os = require("os");
const util = require("util");
const requests = require("requestretry").defaults({ timeout: 60000 });
const { writeFile, readdir, readFile, rm } = require("fs").promises;
const exec = util.promisify(require("child_process").exec);
const { spawn } = require("child_process");
const decompress = require("decompress");
const ProxyAgent = require("simple-proxy-agent");
const decompressUnzip = require("decompress-unzip");
const path = require("path");
const axios = require("axios");
const https = require("https");
import { copy } from "fs-extra";
const OS_PLATFORM = process.platform;
const HOMEDIR = os.homedir();
import { existsSync } from "fs";
import { BrowserUserDataManager } from "./browser-user-data-manager";
import { access, cp } from "fs/promises";
import { loge } from "./util";

const Store = require("electron-store");
const crypto = require("crypto");
const dayjs = require("dayjs");

export const APP_NAME = "mingot";
export const APP_DIR = path.join(HOMEDIR, `.${APP_NAME}`);

export const BROWSER_PATH = path.join(APP_DIR, "browser");
export const PROFILE_PATH = path.join(APP_DIR, "userdata");
export const EXTRA_PATH = path.join(APP_DIR, "extra");

const store = new Store();

console.log("BROWSER_PATH", BROWSER_PATH);
console.log("PROFILE_PATH", PROFILE_PATH);

function uuid() {
  return crypto.randomBytes(16).toString("hex");
}

export function pack(val) {
  if (typeof val === "string" || val instanceof String) {
    return Buffer.from(val).toString("base64");
  }

  return Buffer.from(JSON.stringify(val)).toString("base64");
}

export function unpack(s) {
  return Buffer.from(s, "base64").toString(); // T
}

const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RpZCI6IjYzNmY2ODQ0N2NmZTFiMmM0MTlmMmJiMSIsInR5cGUiOiJ1c2VyIiwic3ViIjoiNjJmZTU1NTc0MDk5MWI4ZTQzMjQyYjA5In0.Cwp6SlqGeaOkQ--HrLOA4Mfu-T4q1VciWFRJfQlclsk";

const GOL_API = "https://api.gologin.com";

axios.defaults.baseURL = "https://api.gologin.com";
axios.defaults.headers.common = { Authorization: `bearer ${token}` };

const ProfileIdOs = {
  win: "6307a891321f5e8eb54709da",
  mac: "6307a83adbde710ca9dfadf6",
};

const dd = console.debug;

class GotApi {
  constructor(options = {}) {}

  detectBrowserExecute() {
    if (OS_PLATFORM === "darwin") {
      return path.join(
        BROWSER_PATH,
        "Orbita-Browser.app",
        "Contents",
        "MacOS",
        "Orbita"
      );
    } else if (OS_PLATFORM === "win32") {
      return path.join(BROWSER_PATH, "orbita-browser", "chrome.exe");
    }

    return null;
  }

  async emptyProfileFolder() {
    dd("get emptyProfileFolder");
    const profile = await readFile(path.join(EXTRA_PATH, "zero_profile.zip"));
    dd("emptyProfileFolder LENGTH::", profile.length);
    return profile;
  }

  async fetchProfile(os = "win") {
    var uid = ProfileIdOs[os];
    await axios.patch(`${GOL_API}/browser/fingerprints`, {
      browsersIds: [uid],
    });
    let res = await axios.get(`${GOL_API}/browser/${uid}`);

    // await writeFile("gologin_tmp.json", JSON.stringify(res.data));

    return Promise.resolve(res?.data || {});
  }

  parseProxy(profile) {
    let { proxy } = profile;
    if (proxy.mode === "geolocation") {
      proxy.mode = "http";
    }

    if (proxy.mode === "none") {
      proxy = null;
    }

    profile.proxy = proxy;
    return profile;
  }

  async fetchTimezoneWithSocks(params) {
    const { mode = "http", host, port, username = "", password = "" } = params;
    let body;

    let proxy = mode + "://";
    if (username) {
      const resultPassword = password ? ":" + password + "@" : "@";
      proxy += username + resultPassword;
    }
    proxy += host + ":" + port;

    const agent = new ProxyAgent(proxy, { tunnel: true, timeout: 10000 });

    const checkData = await new Promise((resolve, reject) => {
      https
        .get("https://time.gologin.com/timezone", { agent }, (res) => {
          let resultResponse = "";
          res.on("data", (data) => (resultResponse += data));

          res.on("end", () => {
            let parsedData;
            try {
              parsedData = JSON.parse(resultResponse);
            } catch (e) {
              reject(e);
            }

            resolve({
              ...res,
              body: parsedData,
            });
          });
        })
        .on("error", (err) => reject(err));
    });

    body = checkData.body || {};
    if (!body.ip && checkData.statusCode.toString().startsWith("4")) {
      throw checkData;
    }
    dd("getTimeZone finish");
    this._tz = body;

    return this._tz.timezone;
  }

  async fetchTimeZone(proxy = null) {
    dd("getting timeZone proxy=", proxy);
    if (this.timezone) {
      dd("getTimeZone from options", this.timezone);
      this._tz = this.timezone;
      return this._tz.timezone;
    }

    let res = null;
    let data;
    if (proxy !== null && proxy.mode !== "none" && proxy?.host) {
      if (proxy.mode.includes("socks")) {
        for (let i = 0; i < 5; i++) {
          try {
            dd("getting timeZone socks try", i + 1);

            return this.fetchTimezoneWithSocks(proxy);
          } catch (e) {
            console.error(e.message);
          }
        }
        throw new Error(`Socks proxy connection timed out`);
      }
      const proxyUrl = `${proxy.mode}://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
      dd("getTimeZone start http://lumtest.com/myip.json", proxyUrl);
      data = await requests.get("http://lumtest.com/myip.json", {
        proxy: proxyUrl,
        timeout: 20 * 1000,
        maxAttempts: 5,
      });
    } else {
      data = await requests.get("http://lumtest.com/myip.json", {
        timeout: 20 * 1000,
        maxAttempts: 5,
      });
    }
    let rs = JSON.parse(data.body);
    dd("getTimeZone finish", rs);


    return rs;
  }

  getGeolocationParams(profileGeolocationParams, tzGeolocationParams) {
    if (profileGeolocationParams.fillBasedOnIp) {
      return {
        mode: profileGeolocationParams.mode,
        latitude: Number(tzGeolocationParams.latitude),
        longitude: Number(tzGeolocationParams.longitude),
        accuracy: Number(tzGeolocationParams.accuracy),
      };
    }
    return {
      mode: profileGeolocationParams.mode,
      latitude: profileGeolocationParams.latitude,
      longitude: profileGeolocationParams.longitude,
      accuracy: profileGeolocationParams.accuracy,
    };
  }

  convertPreferences(preferences) {
    if (_.get(preferences, "navigator.userAgent")) {
      preferences.userAgent = _.get(preferences, "navigator.userAgent");
    }

    if (_.get(preferences, "navigator.doNotTrack")) {
      preferences.doNotTrack = _.get(preferences, "navigator.doNotTrack");
    }

    if (_.get(preferences, "navigator.hardwareConcurrency")) {
      preferences.hardwareConcurrency = _.get(
        preferences,
        "navigator.hardwareConcurrency"
      );
    }

    if (_.get(preferences, "navigator.language")) {
      preferences.language = _.get(preferences, "navigator.language");
    }
    if (_.get(preferences, "navigator.maxTouchPoints")) {
      preferences.navigator.max_touch_points = _.get(
        preferences,
        "navigator.maxTouchPoints"
      );
    }

    if (_.get(preferences, "isM1")) {
      preferences.is_m1 = _.get(preferences, "isM1");
    }

    let pref_os = _.get(preferences, "os");
    dd("os=", pref_os);

    if (pref_os == "android") {
      const devicePixelRatio = _.get(preferences, "devicePixelRatio");
      const deviceScaleFactorCeil = Math.ceil(devicePixelRatio || 3.5);
      let deviceScaleFactor = devicePixelRatio;
      if (deviceScaleFactorCeil === devicePixelRatio) {
        deviceScaleFactor += 0.00000001;
      }

      preferences.mobile = {
        enable: true,
        width: parseInt(this.resolution.width, 10),
        height: parseInt(this.resolution.height, 10),
        device_scale_factor: deviceScaleFactor,
      };
    }

    preferences.mediaDevices = {
      enable: preferences.mediaDevices.enableMasking,
      videoInputs: preferences.mediaDevices.videoInputs,
      audioInputs: preferences.mediaDevices.audioInputs,
      audioOutputs: preferences.mediaDevices.audioOutputs,
    };

    return preferences;
  }

  async parseLocation(profile, proxy) {
    let loc = await this.fetchTimeZone(proxy)

    const {latitude, longitude} = loc.geo;
    const accuracy = 100;

    const profileGeolocation = profile.geolocation;
    const tzGeoLocation = {
      latitude,
      longitude,
      accuracy,
    };
    profile.geoLocation = this.getGeolocationParams(
      profileGeolocation,
      tzGeoLocation
    );

    profile.timezone = { id: loc.geo.tz };
    profile.webRtc = {
      mode:
        _.get(profile, "webRTC.mode") === "alerted"
          ? "public"
          : _.get(profile, "webRTC.mode"),
      publicIP: _.get(profile, "webRTC.fillBasedOnIp")
        ? loc.ip
        : _.get(profile, "webRTC.publicIp"),
      localIps: _.get(profile, "webRTC.localIps", []),
    };

    dd("profile.webRtc=", profile.webRtc);
    dd("profile.timezone=", profile.timezone);
    dd("profile.mediaDevices=", profile.mediaDevices);

    return Promise.resolve(profile);
  }

  async parseHardware(profile) {
    const audioContext = profile.audioContext || {};
    const { mode: audioCtxMode = "off", noise: audioCtxNoise } = audioContext;

    profile.webgl_noise_value = profile.webGL.noise;
    profile.get_client_rects_noise = profile.webGL.getClientRectsNoise;
    profile.canvasMode = profile.canvas.mode;
    profile.canvasNoise = profile.canvas.noise;
    profile.audioContext = {
      enable: audioCtxMode !== "off",
      noiseValue: audioCtxNoise,
    };
    profile.webgl = {
      metadata: {
        vendor: _.get(profile, "webGLMetadata.vendor"),
        renderer: _.get(profile, "webGLMetadata.renderer"),
        mode: _.get(profile, "webGLMetadata.mode") === "mask",
      },
    };

    return profile;
  }

  async pullFont(fonts, profilePath, differentOs) {
    if (this.fontsMasking) {
      const families = fonts?.families || [];
      if (!families.length) {
        throw new Error("No fonts list provided");
      }

      try {
        await BrowserUserDataManager.composeFonts(
          families,
          profilePath,
          differentOs
        );
      } catch (err) {
        loge(err);
      }
    }

    return Promise.resolve();
  }

  getProfileOs() {
    if (OS_PLATFORM == "darwin") return "mac";

    return "win";
  }

  async genNewName() {
    let last_id =
      store.get("profile.auto_id") || (await readdir(PROFILE_PATH)).length;
    last_id = Number(last_id);
    store.set("profile.auto_id", ++last_id);

    dayjs().format("YYMMDD");
    let name = _.padStart(`${last_id}`, 6, "0");
    name = `${this.getOsName()}_${name}`;

    return name;
  }

  getOsName() {
    if (OS_PLATFORM === "win32") return "win";
    if (OS_PLATFORM === "darwin") return "mac";
    if (OS_PLATFORM === "linux") return "lin";

    return "unknow";
  }

  async createBookmark(profilePath) {
    let src = path.join(EXTRA_PATH, "Bookmarks");
    if(!existsSync(src)) return

    let dst = path.join(profilePath, "Default", "Bookmarks");
    await cp(src, dst);
    return Promise.resolve();
  }

  async genNewProfile(profileName = null) {
    let profile_zip_path = await this.emptyProfileFolder();

    let profile_name = await this.genNewName();
    let profile_id = profile_name + "_" + dayjs().format("YYMMDDHHmmssSSS");
    var profilePath = path.join(PROFILE_PATH, profile_id);
    this.profilePath = profilePath;

    let profile = await this.fetchProfile(this.getOsName());

    const { navigator = {}, fonts, os: profileOs } = profile;
    this.fontsMasking = fonts?.enableMasking;
    this.profileOs = profileOs;
    this.differentOs =
      profileOs !== "android" &&
      ((OS_PLATFORM === "win32" && profileOs !== "win") ||
        (OS_PLATFORM === "darwin" && profileOs !== "mac") ||
        (OS_PLATFORM === "linux" && profileOs !== "lin"));

    const { resolution = "1920x1080", language = "en-US,en;q=0.9" } = navigator;
    this.language = language;
    const [screenWidth, screenHeight] = resolution.split("x");
    this.resolution = {
      width: parseInt(screenWidth, 10),
      height: parseInt(screenHeight, 10),
    };

    dd("unzip template profile...");
    await this.unzip(profile_zip_path, profilePath);
    dd("unzip done");

    const pref_file_name = this.getPrefFile(profilePath);

    dd("reading", pref_file_name);

    const pref_raw = await readFile(pref_file_name);

    let preferences = JSON.parse(pref_raw);

    profile.name = profileName || profile_name;
    profile.profile_id = profile_id;

    profile = this.parseProxy(profile);

    profile = await this.parseLocation(profile, profile.proxy);

    profile = await this.parseHardware(profile, profilePath);

    const gologin = this.convertPreferences(profile);

    dd(`Writing profile for screenWidth ${profilePath}`);
    gologin.screenWidth = this.resolution.width;
    gologin.screenHeight = this.resolution.height;
    gologin.createdAt = dayjs().format();

    dd("pull font");
    profile.custom_fonts = {
      enable: !!fonts?.enableMasking,
    };
    await this.pullFont(fonts, profilePath, this.differentOs);
    dd("pull font done");

    const [languages] = this.language.split(";");

    if (preferences.gologin == null) {
      preferences.gologin = {};
    }

    preferences.gologin.langHeader = gologin.language;
    preferences.gologin.languages = languages;

    preferences = _.merge(preferences, { gologin });
    let pref_content = JSON.stringify(preferences);
    let dst = path.join(profilePath, "Default", "Preferences");
    await writeFile(dst, pref_content);

    let proxy_use = JSON.stringify(_.get(preferences, "gologin.proxy"));
    dd(
      `Profile [${gologin.name}] created. Path: `,
      profilePath,
      "PROXY",
      proxy_use
    );

    await this.createBookmark(profilePath);

    return Promise.resolve(gologin.name);
  }

  unzip(zipfile, dst) {
    dd("extactProfile", dst);
    return decompress(zipfile, dst, {
      plugins: [decompressUnzip()],
      filter: (file) => !file.path.endsWith("/"),
    });
  }

  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async checkPortAvailable(port) {
    dd("CHECKING PORT AVAILABLE", port);

    try {
      const { stdout, stderr } = await exec(`lsof -i:${port}`);
      if (stdout && stdout.match(/LISTEN/gim)) {
        dd(`PORT ${port} IS BUSY`);
        return false;
      }
    } catch (e) {}
    dd(`PORT ${port} IS OPEN`);

    return true;
  }

  async getRandomPort() {
    let port = this.getRandomInt(20000, 40000);
    let port_available = this.checkPortAvailable(port);
    while (!port_available) {
      port = this.getRandomInt(20000, 40000);
      port_available = await this.checkPortAvailable(port);
    }
    return port;
  }

  async saveProxy(proxy, profilePath) {
    let dst = this.getPrefFile(profilePath);
    let content = await readFile(dst);
    let pref_json = JSON.parse(content.toString());
    let gologin = _.get(pref_json, "gologin");

    gologin.proxy = proxy;
    let new_ct = _.merge(pref_json, { gologin });
    let pref_file = this.getPrefFile(profilePath);
    await writeFile(pref_file, JSON.stringify(new_ct));
  }

  async launchBrowser(profilePath) {
    let dst = this.getPrefFile(profilePath);
    let content = await readFile(dst);
    let pref_json = JSON.parse(content.toString());
    let gologin = _.get(pref_json, "gologin");

    let remote_debugging_port = this.remote_debugging_port;
    if (!remote_debugging_port) {
      remote_debugging_port = await this.getRandomPort();
    }

    let proxy = _.get(gologin, "proxy");
    let proxy_host = "";
    let proxy_raw = null
    if (proxy && proxy?.host) {
      proxy_host = proxy.host;
      proxy_raw = `${proxy.mode}://${proxy.host}:${proxy.port}`;
    }

    this.port = remote_debugging_port;

    const ORBITA_BROWSER = this.executablePath || this.detectBrowserExecute();

    dd(`ORBITA_BROWSER=${ORBITA_BROWSER}`);
    const env = {};

    Object.keys(process.env).forEach((key) => {
      env[key] = process.env[key];
    });
    const loc = await this.fetchTimeZone(proxy).catch((e) => {
      console.error("Proxy Error. Check it and try again.");
      throw e;
    });
    env["TZ"] = loc.geo.tz;

    let language = gologin?.navigator?.language || "en-US,en;q=0.9";
    const [splittedLangs] = language.split(";");
    let [browserLang] = splittedLangs.split(",");
    if (process.platform === "darwin") {
      browserLang = "en-US";
    }

    let params = [
      `--remote-debugging-port=${remote_debugging_port}`,
      `--user-data-dir=${profilePath}`,
      `--password-store=basic`,
      `--lang=${browserLang}`,
    ];

    if (this.fontsMasking) {
      let arg = "--font-masking-mode=2";
      if (this.differentOs) {
        arg = "--font-masking-mode=3";
      }
      if (this.profileOs === "android") {
        arg = "--font-masking-mode=1";
      }

      params.push(arg);
    }

    if (proxy_raw) {
      const hr_rules = `"MAP * 0.0.0.0 , EXCLUDE ${proxy_host}"`;
      params.push(`--proxy-server=${proxy_raw}`);
      params.push(`--host-resolver-rules=${hr_rules}`);
    }

    if (Array.isArray(this.extra_params) && this.extra_params.length) {
      params = params.concat(this.extra_params);
    }
    params.push("--disable-encryption");

    dd(params);

    const child = await spawn(ORBITA_BROWSER, params, {
      env,
      detached: process.platform !== "win32",
      stdio: "ignore",
    });
    child.unref();

    // dd("SPAWN CMD", ORBITA_BROWSER, params.join(" "));
    gologin.lastRun = dayjs().format();
    gologin.timezone.id = loc.geo.tz
    gologin.remote_debugging_port = remote_debugging_port

    let new_ct = _.merge(pref_json, { gologin });
    let pref_file = this.getPrefFile(profilePath);

    await writeFile(pref_file, JSON.stringify(new_ct));

    return Promise.resolve({ lastRun: gologin.lastRun, port: this.port });
  }

  async delProfile(dir) {
    dd("remove " + dir);
    await rm(dir, { recursive: true, force: true });
    dd("remove done");
  }

  getPrefFile(p) {
    return path.join(p, "Default", "Preferences");
  }

  async readProfilePath(profilePath) {
    let dst = this.getPrefFile(profilePath);
    let content = await readFile(dst);
    let pref_json = JSON.parse(content.toString());
    let profile = _.get(pref_json, "gologin");
    return Promise.resolve(profile);
  }

  async parseProfileData(file) {
    let gologin = await this.readProfilePath(file);
    let id = path.basename(file);
    let prefFile = this.getPrefFile(file);
    let profilePath = file;
    let name = _.get(gologin, "name");
    let createdAt = _.get(gologin, "createdAt");
    let lastRun = _.get(gologin, "lastRun");
    let proxy = _.get(gologin, "proxy");

    return Promise.resolve({
      lastRun,
      prefFile,
      id,
      profilePath,
      name,
      createdAt,
      proxy,
    });
  }

  async setName(profilePath, name) {
    let dst = this.getPrefFile(profilePath);
    let content = await readFile(dst);
    let pref = JSON.parse(content.toString());
    pref.gologin.name = name;

    return await writeFile(dst, JSON.stringify(pref));
  }

  async copyProfile(src) {
    let name = path.basename(src);
    let dst = path.join(PROFILE_PATH, name);
    await copy(src, dst);
  }

  async isProfileDir(dir) {
    let pref_file = this.getPrefFile(dir);

    try {
      await access(pref_file);
      return Promise.resolve(true);
    } catch (err) {
      loge(err);
    }

    return Promise.resolve(false);
  }

  async loadAllProfile() {
    let list = await readdir(PROFILE_PATH);
    list = list.map((e) => path.join(PROFILE_PATH, e));
    list = list.filter((e) => existsSync(this.getPrefFile(e)));

    let enque = list.map((e) => this.parseProfileData(e));
    let data = await Promise.all(enque);

    return data;
  }
}

export default GotApi;
