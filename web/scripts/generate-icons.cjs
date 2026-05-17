const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgPath = path.resolve(__dirname, '../public/logo.svg');
const publicDir = path.resolve(__dirname, '../public');

async function main() {
  if (!fs.existsSync(svgPath)) {
    throw new Error(`Logo SVG not found at: ${svgPath}`);
  }

  console.log('Generating PWA icons and favicons from logo.svg...');

  // 1. Generate favicon.ico (32x32)
  await sharp(svgPath)
    .resize(32, 32)
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('  - favicon.ico (32x32) generated.');

  // 2. Generate apple-touch-icon.png (180x180)
  await sharp(svgPath)
    .resize(180, 180)
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('  - apple-touch-icon.png (180x180) generated.');

  // 3. Generate logo-square.png (512x512)
  await sharp(svgPath)
    .resize(512, 512)
    .toFile(path.join(publicDir, 'logo-square.png'));
  console.log('  - logo-square.png (512x512) generated.');

  // 4. Generate pwa-192x192.png (192x192)
  await sharp(svgPath)
    .resize(192, 192)
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('  - pwa-192x192.png (192x192) generated.');

  // 5. Generate pwa-512x512.png (512x512)
  await sharp(svgPath)
    .resize(512, 512)
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('  - pwa-512x512.png (512x512) generated.');

  // 6. Generate og-image.png (1200x1200)
  await sharp(svgPath)
    .resize(1200, 1200)
    .toFile(path.join(publicDir, 'og-image.png'));
  console.log('  - og-image.png (1200x1200) generated.');

  const mobileAssetsDir = path.resolve(__dirname, '../../mobile/assets');
  if (fs.existsSync(mobileAssetsDir)) {
    console.log('\nGenerating Mobile assets...');

    // 1. Generate icon.png (1024x1024)
    await sharp(svgPath)
      .resize(1024, 1024)
      .toFile(path.join(mobileAssetsDir, 'icon.png'));
    console.log('  - mobile/icon.png generated.');

    // 2. Generate adaptive-icon.png (1024x1024)
    await sharp(svgPath)
      .resize(1024, 1024)
      .toFile(path.join(mobileAssetsDir, 'adaptive-icon.png'));
    console.log('  - mobile/adaptive-icon.png generated.');

    // 3. Generate splash.png (1242x2436 - centered logo on solid black background)
    const logoResized = await sharp(svgPath)
      .resize(600, 600)
      .toBuffer();

    await sharp({
      create: {
        width: 1242,
        height: 2436,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      }
    })
      .composite([{ input: logoResized, gravity: 'center' }])
      .png()
      .toFile(path.join(mobileAssetsDir, 'splash.png'));
    console.log('  - mobile/splash.png generated.');
  }

  console.log('\nAll assets generated successfully!');
}

main().catch((err) => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
