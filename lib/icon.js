const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const Promise = require('bluebird');
const _ = require('lodash');
const config = require('../config');

const { iconSizes } = config;
const icons = [];
iconSizes.forEach((size) => {
  size.xArr.forEach((x) => {
    const one = {
      pt: size.pt,
      x,
    };
    icons.push(one);
  });
});

function genIcon(origin = null, out = null) {
  const srcDir = origin || path.resolve(__dirname, '../originFiles');
  const outDir = out || path.resolve(__dirname, '../outFiles');

  try {
    let files = fs.readdirSync(srcDir);
    files = _.filter(files, (file) => {
      return /\.(JPEG|JPG|PNG|WebP|TIFF|GIF|SVG)$/i.test(file);
    });

    const items = [];
    files.forEach((file) => {
      const fileName = file.split('.')[0];
      icons.forEach((icon) => {
        const one = _.cloneDeep(icon);
        const target = `${fileName}_${icon.pt}pt_${icon.x}x.png`;
        one.target = path.resolve(outDir, target);
        one.src = path.resolve(srcDir, file);
        items.push(one);
      });
    });

    return Promise.map(items, (item) => {
      return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(item.src);
        const writeStream = fs.createWriteStream(item.target);
        const transformer = sharp().resize(item.pt * item.x, item.pt * item.x)
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
    }, { concurrency: 5 });
  } catch (error) {
    throw error;
  }
}

module.exports = {
  genIcon,
};
