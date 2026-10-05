const fs = require('fs');
const path = require('path');

const distEntry = path.join(__dirname, 'dist', 'server.js');

if (!fs.existsSync(distEntry)) {
  console.log('[Aequitas Backend] dist/server.js not found. Running compilation step...');
  try {
    require('child_process').execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
  } catch (err) {
    console.error('[Aequitas Backend] Build failed:', err);
    process.exit(1);
  }
}

require(distEntry);
