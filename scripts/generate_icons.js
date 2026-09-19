const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" rx="128" fill="#4f46e5"/>
  <text 
    x="256" 
    y="266" 
    text-anchor="middle" 
    dominant-baseline="central" 
    fill="#ffffff" 
    font-family="'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" 
    font-weight="800" 
    font-size="252" 
    letter-spacing="-8"
  >TJ</text>
</svg>`.trim();

function createIco(pngBuffer, size = 32) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(1, 4); // 1 image

  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(size >= 256 ? 0 : size, 0); // width
  dirEntry.writeUInt8(size >= 256 ? 0 : size, 1); // height
  dirEntry.writeUInt8(0, 2); // colors
  dirEntry.writeUInt8(0, 3); // reserved
  dirEntry.writeUInt16LE(1, 4); // planes
  dirEntry.writeUInt16LE(32, 6); // bpp
  dirEntry.writeUInt32LE(pngBuffer.length, 8); // size of image data
  dirEntry.writeUInt32LE(6 + 16, 12); // offset to image data

  return Buffer.concat([header, dirEntry, pngBuffer]);
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const srcAppDir = path.join(rootDir, 'src', 'app');
  const publicDir = path.join(rootDir, 'public');

  console.log('Writing SVG icons...');
  fs.writeFileSync(path.join(srcAppDir, 'icon.svg'), svgContent, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf8');

  console.log('Rendering raster PNG & ICO favicons...');
  const svgBuffer = Buffer.from(svgContent);

  // 512x512
  const png512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'icon.png'), png512);

  // 180x180 (Apple touch icon)
  const png180 = await sharp(svgBuffer).resize(180, 180).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'apple-icon.png'), png180);

  // 32x32 & 48x48
  const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'icon-32.png'), png32);

  // favicon.ico (32x32)
  const ico32 = createIco(png32, 32);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico32);
  fs.writeFileSync(path.join(srcAppDir, 'favicon.ico'), ico32);

  // Clean test files
  const testRendered = path.join(__dirname, 'test_rendered.svg');
  const test512 = path.join(__dirname, 'test_512.png');
  const test32 = path.join(__dirname, 'test_32.png');
  if (fs.existsSync(testRendered)) fs.unlinkSync(testRendered);
  if (fs.existsSync(test512)) fs.unlinkSync(test512);
  if (fs.existsSync(test32)) fs.unlinkSync(test32);

  console.log('All icons generated successfully!');
}

main().catch(console.error);
