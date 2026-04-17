const { execSync } = require('child_process');

const tools = [
  { name: 'Node.js', cmd: 'node -v' },
  { name: 'npm', cmd: 'npm -v' },
  { name: 'yt-dlp', cmd: 'yt-dlp --version' },
  { name: 'ffmpeg', cmd: 'ffmpeg -version' },
  { name: 'aria2c', cmd: 'aria2c --version' }
];

console.log('🔍 Checking environment for Downloader Pro...\n');

let allFound = true;

tools.forEach(tool => {
  try {
    execSync(tool.cmd, { stdio: 'ignore' });
    console.log(`✅ ${tool.name}: Found`);
  } catch (e) {
    console.log(`❌ ${tool.name}: NOT FOUND`);
    allFound = false;
  }
});

if (allFound) {
  console.log('\n✨ Everything is ready! Run "npm start" to begin.');
} else {
  console.log('\n⚠️  Some tools are missing. Please check the README.md for installation instructions.');
  process.exit(1);
}
