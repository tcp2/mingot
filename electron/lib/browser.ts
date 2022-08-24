import puppeteer from "puppeteer-core";
import { getBrowserExec, loge } from './util';


export async function closeBrowser(browserWSEndpoint: string) {
  try {
    let br = await puppeteer.connect({ browserWSEndpoint });
    await br.close();
    return Promise.resolve({status: true});
  } catch (ex) {
    loge(ex);
    return Promise.resolve({status: false, error: ex});
  }
}

export async function openBrowser(userDataDir: string, proxy: any = null) {
  try {
    const opt = {
      userDataDir,
      devtools: false,
      headless: false,
      ignoreDefaultArgs: ["--enable-automation"],
      args: [
        "--disable-features=site-per-process",
        "--no-sandbox",
        "--disable-infobars",
        '--disable-encryption',
        '--flag-switches-begin',
        '--flag-switches-end',
        "--ignore-certifcate-errors",
      ],
      executablePath: getBrowserExec(),
    }

    if(proxy) {
      //--proxy-server=socks5://103.53.228.217:7497

      let proxy_uri = `${proxy.ip}`
      if(['socks5', 'socks4'].includes(proxy.type)) {
        proxy_uri = `${proxy.type}://${proxy.ip}`
      }
      opt.args.push(`--proxy-server=${proxy_uri}`)
    }

    const uc = await puppeteer.launch(opt);

    const ws = uc.wsEndpoint();
    return Promise.resolve(ws);
  } catch (err) {
    loge(err);
    return Promise.resolve(undefined)
  }
}
