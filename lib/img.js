const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const Promise = require('bluebird');
const _ = require('lodash');
const config = require('../config');

const { imgSizes } = config;

function genImg(origin = null, out = null, format = 'portrait') {
  const srcDir = origin || path.resolve(__dirname, '../originFiles');
  const outDir = out || path.resolve(__dirname, '../outFiles');

  try {
    let files = fs.readdirSync(srcDir);
    files = _.filter(files, (file) => {
      const ok = /\.(JPEG|JPG|PNG|WebP|TIFF|GIF|SVG)$/i.test(file);
      return ok;
    });

    const items = [];
    files.forEach((file) => {
      const fileName = file.split('.')[0];
      imgSizes.forEach((img) => {
        const one = _.cloneDeep(img);
        const target = `${fileName}_${img.inch}_inch_${format}.png`;
        one.target = path.resolve(outDir, target);
        one.src = path.resolve(srcDir, file);
        items.push(one);
      });
    });

    return Promise.map(items, (item) => {
      const pm = new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(item.src);
        const writeStream = fs.createWriteStream(item.target);
        let w = item.width;
        let h = item.height;
        if (format === 'landscape') {
          w = item.height;
          h = item.width;
        }
        const transformer = sharp().resize(w, h)
          // .crop(sharp.strategy.entropy)
          .ignoreAspectRatio()
          .on('error', (err) => {
            reject(err);
          });
        writeStream.on('close', () => {
          resolve(item);
        });
        readStream.pipe(transformer).pipe(writeStream);
      });

      return pm;
    }, { concurrency: 5 });
  } catch (error) {
    throw error;
  }
}

module.exports = {
  genImg,
};
