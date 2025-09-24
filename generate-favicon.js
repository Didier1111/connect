// generate-favicon.js
// Simple script to generate a favicon.ico file for Project Connect

const fs = require('fs');
const path = require('path');

// Create a simple SVG favicon
const svgFavicon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="45" fill="url(#gradient)" />
  <path d="M30,30 L70,50 L30,70 Z" fill="white" />
  <circle cx="50" cy="50" r="15" fill="white" />
  <circle cx="50" cy="50" r="8" fill="url(#gradient)" />
</svg>
`;

// Write SVG favicon
fs.writeFileSync(path.join(__dirname, 'favicon.svg'), svgFavicon);

console.log('SVG favicon generated successfully!');
console.log('To convert to ICO format:');
console.log('1. Visit https://convertio.co/svg-ico/');
console.log('2. Upload favicon.svg');
console.log('3. Convert to ICO format');
console.log('4. Download and save as favicon.ico');
console.log('5. Place in the root directory of the website');

// Also create a simple text favicon for immediate use
const textFavicon = `
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMWNKOkxxkOKNWMMMMMMMMMMMMMM
MMMMMMMMMMWXOdl:,''''''',:ldOXWMMMMMMMMM
MMMMMMMMWKxl;..',;;;;;;;,'..'lONMMMMMMMM
MMMMMMMNkc'.';lxO000000Okx:...:0WMMMMMMM
MMMMMMNd,.;lk0NWMMMMMMMMWN0xc..dNMMMMMMM
MMMMMM0:.,kWMMMMMMMMMMMMMMMMWk':KWMMMMMM
MMMMMMO;.:KMMMMMMMMMMMMMMMMMMK:.oNMMMMMM
MMMMMMO;.:KMMMMMMMMMMMMMMMMMMK:.oNMMMMMM
MMMMMM0:.,kWMMMMMMMMMMMMMMMMWk':KWMMMMMM
MMMMMMNd,.;lk0NWMMMMMMMMWN0xc..dNMMMMMMM
MMMMMMMNkc'.';lxO000000Okx:...:0WMMMMMMM
MMMMMMMMWKxl;..',;;;;;;;,'..'lONMMMMMMMM
MMMMMMMMMMWXOdl:,''''''',:ldOXWMMMMMMMMM
MMMMMMMMMMMMMMWNKOkxxkOKNWMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
`;

fs.writeFileSync(path.join(__dirname, 'favicon.txt'), textFavicon);

console.log('Text favicon generated successfully!');
console.log('Place favicon.txt in the root directory as favicon.ico for immediate use.');