const fs = require('fs');
const path = require('path');

const avatarDir = path.join(__dirname, '../assets/avatars');

function enhanceSVG(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Add stroke ONLY to main body paths (with fill colors)
  // This adds the outline without changing the rest
  content = content.replace(
    /<path\s+fill="(#[0-9A-Fa-f]{6})"\s+d="/g,
    '<path stroke="#1a1a1a" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" fill="$1" d="'
  );

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✓ Added outline: ${path.basename(filePath)}`);
}

const files = fs.readdirSync(avatarDir).filter(f => f.endsWith('.svg'));
console.log(`Adding outlines to ${files.length} SVG files...\n`);

files.forEach(file => {
  enhanceSVG(path.join(avatarDir, file));
});

console.log('\n✅ Outlines added!');
