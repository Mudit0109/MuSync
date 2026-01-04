const sharp = require('sharp');
const fs = require('fs');

// Create a simple blue gradient icon
const createIcon = async () => {
  const svg = `
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1E90FF;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0066CC;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" fill="url(#grad)" />
      <text x="512" y="570" font-size="400" font-weight="bold" text-anchor="middle" fill="white" font-family="Arial">M</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .resize(1024, 1024)
    .png()
    .toFile('assets/icon.png');

  await sharp(Buffer.from(svg))
    .resize(1024, 1024)
    .png()
    .toFile('assets/adaptive-icon.png');

  await sharp(Buffer.from(svg))
    .resize(48, 48)
    .png()
    .toFile('assets/favicon.png');

  const splashSvg = `
    <svg width="1284" height="2778" xmlns="http://www.w3.org/2000/svg">
      <rect width="1284" height="2778" fill="#000000" />
      <text x="642" y="1450" font-size="200" font-weight="bold" text-anchor="middle" fill="#1E90FF" font-family="Arial">MuSync</text>
    </svg>
  `;

  await sharp(Buffer.from(splashSvg))
    .resize(1284, 2778)
    .png()
    .toFile('assets/splash.png');

  console.log('✓ All assets generated successfully!');
};

createIcon().catch(console.error);
