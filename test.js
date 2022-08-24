const glob = require('glob-promise');
const AdmZip = require("adm-zip");
const path = require("path")
const fs = require("fs")
const util = require('util')

const rename = util.promisify(fs.rename);


const archiver = require('archiver');
const { dirname } = require('path');

// function dirname(s) {
//   return path.basename(s).replace(/\.[^/.]+$/, "");
// }

function isdir(s) {
  return fs.lstatSync(s).isDirectory()
}

function isfile(s) {
  return fs.lstatSync(s).isFile()
}

async function mv(src, dst) {
  let name = path.basename(src)
  dst = path.join(dst, name)

  return await rename(filezip, dst)
}


async function zip(src, dst = undefined) {
  console.log(`zip folder ${src}`);

  const archive = archiver('zip', { zlib: { level: 9 }});

  dst = dst || src + '.zip'

  const stream = fs.createWriteStream(dst);

  console.log(`zip to ${dst}`);

  return new Promise((resolve, reject) => {
    archive
      .directory(src, false)
      .on('error', err => reject(err))
      .pipe(stream)
    ;

    stream.on('close', () => resolve(dst));
    archive.finalize();
  });
}


(async() => {
  let src = '/tmp/gologin_*/profiles/*'
  let files = await glob(src);
  let filezip = await zip(files[0])
  console.log(filezip);
  await mv(filezip, './extra/userdata')
})()



