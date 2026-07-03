const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'frontend/src/pages');

function fixTablesInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Only target JSX tables, skip string literals
    if (line.match(/<table className=".*?"/)) {
      const prevLine = i > 0 ? lines[i-1] : '';
      if (!prevLine.includes('overflow-x-auto') && !prevLine.includes('overflow-auto')) {
        const match = line.match(/^(\s*)</);
        const indent = match ? match[1] : '';
        
        let closeIdx = -1;
        for (let j = i; j < lines.length; j++) {
          if (lines[j].includes('</table>')) {
            closeIdx = j;
            break;
          }
        }
        
        if (closeIdx !== -1) {
          lines.splice(closeIdx + 1, 0, `${indent}</div>`);
          lines.splice(i, 0, `${indent}<div className="overflow-x-auto w-full">`);
          i++; // Skip the newly added div line
          changed = true;
        }
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    console.log(`Fixed tables in ${path.basename(filePath)}`);
  }
}

const files = fs.readdirSync(pagesDir);
for (const file of files) {
  if (file.endsWith('.jsx')) {
    fixTablesInFile(path.join(pagesDir, file));
  }
}
