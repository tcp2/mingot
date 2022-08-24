import { assetPath, assetUserdata, logi } from './util';
import fs from "fs";
import path from "path";
import StreamZip from "node-stream-zip";
import glob from "glob-promise";
import { ProfileType } from "../type";
const log = require("electron-log");
const readdir = fs.promises.readdir

function dirname(s) {
  return path.basename(s).replace(/\.[^/.]+$/, "");
}

const USER_DATA_DIR = path.resolve(assetUserdata('userdata'))

if (!fs.existsSync(USER_DATA_DIR)){
  fs.mkdirSync(USER_DATA_DIR);
}


export async function unzip(src: string, dst: string) {
  const zip = new StreamZip.async({ file: src });
  var dst = path.join(dst, dirname(src));
  console.log(`[unzip] ${dst}`);

  await zip.extract(null, dst);
  await zip.close();

  return Promise.resolve(dst);
}

export function isdir(s: string) {
  return fs.lstatSync(s).isDirectory();
}

export function Profile(profileDir = USER_DATA_DIR) {
  var profileData: Array<ProfileType> = [];
  var REF_PART = path.join('Default', 'Preferences');

  const get = (id: string) => {
    return profileData.find(e => e.id == id)
  }

  const readPref = async (file: string): Promise<ProfileType> => {
    let bytes = await fs.promises.readFile(file, 'binary');
    var json = JSON.parse(bytes);
    var o = json["gologin"];
    var id = file
      .replace(profileDir, "")
      .replace(REF_PART, "")
      .replace("/", "");

    return Promise.resolve({
      pref: file,
      id,
      prefJson: json,
      userDataDir: path.join(profileDir, id),
      name: o["name"],
    });
  };

  return {
    get,
    profileData,
    readPref,
    setName: async (id: string, s: string) => {
      var item = profileData.find((e) => (e.id == id));
      if (!item) return;
      let prefJson = item.prefJson;
      prefJson.gologin.name = s

      return await fs.promises.writeFile(item.pref, JSON.stringify(prefJson));
    },

    load: async (): Promise<Array<ProfileType>> => {
      logi(`load browser userdata ${profileDir}`)

      let files = await readdir(profileDir);

      let data = files.map((file) => {
        return readPref(path.join(file, REF_PART));
      });

      profileData = await Promise.all(data);

      return Promise.resolve(profileData);
    },

    importBy: async (src: string) => {
      let dst = profileDir;
      src = path.join(src, "**/*.zip");
      let files = await glob(src);
      let enque = files
        .filter((f) => {
          f = path.join(dst, dirname(f));
          return !fs.existsSync(f);
        })
        .map((f) => {
          return unzip(f, dst);
        });

      return await Promise.all(enque);
    },
  };
}
