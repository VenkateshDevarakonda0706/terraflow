const path = require('path');
const fs = require('fs');

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  let entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    let srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const source = path.resolve(__dirname, 'node_modules/cesium/Build/Cesium');
const destination = path.resolve(__dirname, 'public/cesium');

try {
  if (fs.existsSync(source)) {
    console.log(`Copying Cesium assets from ${source} to ${destination}...`);
    copyDirSync(source, destination);
    console.log('Cesium assets successfully copied.');
  } else {
    console.warn(`Cesium build directory not found at: ${source}`);
  }
} catch (error) {
  console.error('Error copying Cesium assets:', error);
}
