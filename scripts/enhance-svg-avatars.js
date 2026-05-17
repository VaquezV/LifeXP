const fs = require('fs');
const path = require('path');

const avatarDir = path.join(__dirname, '../assets/avatars');

// Function to add stroke and white background to SVG
function enhanceSVG(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Check if already enhanced
  if (content.includes('white-background')) {
    console.log(`${path.basename(filePath)} already enhanced, skipping...`);
    return;
  }

  // Add white background rectangle right after <svg> tag
  const bgRect = '<rect id="white-background" width="1024" height="1024" fill="#ffffff"/>';
  content = content.replace(/<svg[^>]*>/, `$&${bgRect}`);

  // Add stroke to all path elements
  // Match: <path ... fill="..." ... >
  content = content.replace(/<path\s+([^>]*?)>/g, (match, attrs) => {
    // Skip if it already has a stroke or if fill is very faint
    if (attrs.includes('stroke') || attrs.includes('fill-opacity="0.0')) {
      return match;
    }

    // Add stroke to the path
    return `<path ${attrs} stroke="#1a1a1a" stroke-width="8" stroke-linejoin="round" stroke-linecap="round">`;
  });

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✓ Enhanced: ${path.basename(filePath)}`);
}

// Process all SVG files
const files = fs.readdirSync(avatarDir).filter(f => f.endsWith('.svg'));
console.log(`Found ${files.length} SVG files to enhance...\n`);

files.forEach(file => {
  const filePath = path.join(avatarDir, file);
  enhanceSVG(filePath);
});

console.log('\n✅ All avatars enhanced!');
