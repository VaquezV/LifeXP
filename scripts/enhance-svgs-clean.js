const fs = require('fs');
const path = require('path');

const avatarDir = path.join(__dirname, '../assets/avatars');

function enhanceSVG(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Only process main body paths - those with main colors and good opacity
  // Match: <path fill="#0C0C0C" (or #030204) with NO or HIGH fill-opacity
  content = content.replace(
    /<path\s+fill="(#0C0C0C|#030204)"\s+(?!fill-opacity="0\.\d{1,2}[^0-9]")/g,
    (match) => {
      // Add stroke to main body parts only (skipping very transparent ones)
      if (match.includes('fill-opacity="0.9')) {
        return match.replace('fill="', 'stroke="#1a1a1a" stroke-width="6" fill="');
      }
      return match.replace('fill="', 'stroke="#1a1a1a" stroke-width="8" fill="');
    }
  );

  // Add white background rectangle at the beginning (inside <svg> tag)
  content = content.replace(
    /(<svg[^>]*>)/,
    '$1<rect width="1024" height="1024" fill="#ffffff"/>'
  );

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✓ Enhanced: ${path.basename(filePath)}`);
}

const files = fs.readdirSync(avatarDir).filter(f => f.endsWith('.svg'));
console.log(`Enhancing ${files.length} SVG files...\n`);

files.forEach(file => {
  enhanceSVG(path.join(avatarDir, file));
});

console.log('\n✅ All SVGs enhanced cleanly!');
