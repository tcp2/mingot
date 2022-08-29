const path = require('path');
const os = require('os');
const request = require('requestretry');
const { rmdirSync, createWriteStream } = require('fs');
const { access, readFile, writeFile, mkdir, readdir, copyFile, rename } = require('fs').promises;
const crypto = require('crypto');
import {fontsCollection} from "./fonts";

const FONTS_URL = 'https://fonts.gologin.com/';
const FONTS_DIR_NAME = 'fonts';

const HOMEDIR = os.homedir();
const BROWSER_PATH = path.join(HOMEDIR, '.mingot', 'browser');
const OS_PLATFORM = process.platform;
const DEFAULT_ORBITA_EXTENSIONS_NAMES = ['Google Hangouts', 'Chromium PDF Viewer', 'CryptoTokenExtension', 'Web Store'];
const osPlatform = process.platform;

export class BrowserUserDataManager {
  static async downloadFonts(fontsList = [], profilePath) {
    if (!fontsList.length) {
      return;
    }

    const browserFontsPath = path.join(BROWSER_PATH, FONTS_DIR_NAME);
    await mkdir(browserFontsPath, { recursive: true });

    const files = await readdir(browserFontsPath);
    const fontsToDownload = fontsList.filter(font => !files.includes(font));

    let promises = fontsToDownload.map(font => request.get(FONTS_URL + font, {
      maxAttempts: 5,
      retryDelay: 2000,
      timeout: 30 * 1000,
    })
      .pipe(createWriteStream(path.join(browserFontsPath, font)))
    );

    if (promises.length) {
      await Promise.all(promises);
    }

    promises = fontsList.map((font) =>
      copyFile(path.join(browserFontsPath, font), path.join(profilePath, FONTS_DIR_NAME, font)));

    await Promise.all(promises);
  }

  static async composeFonts(fontsList = [], profilePath, differentOs = false) {
    if (!(fontsList.length && profilePath)) {
      return;
    }

    const fontsToDownload = fontsCollection
      .filter(elem => fontsList.includes(elem.value))
      .reduce((res, elem) => res.concat(elem.fileNames || []), []);

    if (differentOs && !fontsToDownload.length) {
      throw new Error('No fonts to download found. Use getAvailableFonts() method and set some fonts from this list');
    }
    fontsToDownload.push('LICENSE.txt');
    fontsToDownload.push('OFL.txt');

    const pathToFontsDir = path.join(profilePath, FONTS_DIR_NAME);
    const fontsDirExists = await access(pathToFontsDir).then(() => true, () => false);
    if (fontsDirExists) {
      rmdirSync(pathToFontsDir, { recursive: true });
    }

    await mkdir(pathToFontsDir, { recursive: true });
    await this.downloadFonts(fontsToDownload, profilePath);
  }


  static async setOriginalExtPaths(settings = {}, originalExtensionsFolder = '') {
    if (!originalExtensionsFolder) {
      return null;
    }

    const extensionsSettings = settings.extensions?.settings || {};
    const extensionsEntries = Object.entries(extensionsSettings);

    const originalExtensionsList = await readdir(originalExtensionsFolder).catch(() => []);
    if (!originalExtensionsList.length) {
      return null;
    }

    const promises = originalExtensionsList.map(async (originalId) => {
      const extFolderPath = path.join(originalExtensionsFolder, originalId);
      const extFolderContent = await readdir(extFolderPath);
      if (!extFolderPath.length) {
        return {};
      }

      if (extFolderContent.includes('manifest.json')) {
        return {
          originalId,
          path: path.join(originalExtensionsFolder, originalId),
        };
      }

      const [version] = extFolderContent;
      return {
        originalId,
        path: path.join(originalExtensionsFolder, originalId, version),
      };
    });
    const originalExtPaths = await Promise.all(promises);

    extensionsEntries.forEach((extensionObj) => {
      const [extensionsId] = extensionObj;
      const extPath = extensionsSettings[extensionsId].path;
      if (!/chrome-extensions/.test(extPath)) {
        return;
      }

      const originalExtPath = originalExtPaths.find(el => el.originalId === extensionsId);
      if (!originalExtPath) {
        return;
      }

      extensionsSettings[extensionsId].path = originalExtPath.path || '';
    });

    return extensionsSettings;
  }

  static async recalculateId({ localExtObj, extensionId, extensionsSettings, currentExtSettings }) {
    if (currentExtSettings.manifest?.key) {
      return extensionId;
    }

    const manifestFilePath = path.join(localExtObj.path, 'manifest.json');
    const manifestString = await readFile(manifestFilePath, { encoding: 'utf8' }).catch(() => ({}));

    if (!manifestString) {
      return extensionId;
    }

    let manifestObject;
    try {
      manifestObject = JSON.parse(manifestString);
    } catch {
      return extensionId;
    }

    if (manifestObject.key) {
      return extensionId;
    }

    let encoding = 'utf8';
    if (osPlatform === 'win32') {
      encoding = 'utf16le';
    }

    const extPathToEncode = Buffer.from(localExtObj.path, encoding);

    const hexEncodedPath = crypto.createHash('sha256').update(extPathToEncode).digest('hex');
    const newId = hexEncodedPath.split('').slice(0, 32).map(symbol => extIdEncoding[symbol]).join('');
    if (extensionId !== newId) {
      delete extensionsSettings[extensionId];

      extensionsSettings[newId] = currentExtSettings;
      extensionId = newId;
    }

    return extensionId;
  }
}

const extIdEncoding = {
  0: 'a',
  1: 'b',
  2: 'c',
  3: 'd',
  4: 'e',
  5: 'f',
  6: 'g',
  7: 'h',
  8: 'i',
  9: 'j',
  a: 'k',
  b: 'l',
  c: 'm',
  d: 'n',
  e: 'o',
  f: 'p',
};


