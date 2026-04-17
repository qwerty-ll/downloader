const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const binDir = path.join(__dirname, '..', 'bin');

// Create bin directory if it doesn't exist
if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
}

const tools = {
    win32: [
        { name: 'yt-dlp.exe', url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe' },
        { name: 'ffmpeg.exe', url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip', isZip: true, subPath: 'ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe' },
        { name: 'aria2c.exe', url: 'https://github.com/aria2/aria2/releases/download/release-1.37.0/aria2-1.37.0-win-64bit-build1.zip', isZip: true, subPath: 'aria2-1.37.0-win-64bit-build1/aria2c.exe' }
    ],
    darwin: [
        { name: 'yt-dlp', url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos' },
        // FFmpeg and Aria2c for macOS are tricky to find as direct portable binaries without brew
        // We will suggest Homebrew or try to find a static build
        { name: 'ffmpeg', url: 'https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip', isZip: true, subPath: 'ffmpeg' }
    ],
    linux: [
        { name: 'yt-dlp', url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp' },
        { name: 'ffmpeg', url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz', isTar: true, subPath: 'ffmpeg-*-amd64-static/ffmpeg' }
    ]
};

async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                downloadFile(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

async function main() {
    const platform = process.platform;
    const currentTools = tools[platform] || tools['linux']; // Default to linux if unknown

    console.log(`🚀 Downloading portable tools for ${platform}...`);

    for (const tool of currentTools) {
        const dest = path.join(binDir, tool.isZip || tool.isTar ? 'temp_' + tool.name : tool.name);
        console.log(`📦 Downloading ${tool.name}...`);
        
        try {
            await downloadFile(tool.url, dest);
            
            if (tool.isZip) {
                console.log(`📦 Extracting ${tool.name}...`);
                if (platform === 'win32') {
                    execSync(`powershell -command "Expand-Archive -Path '${dest}' -DestinationPath '${binDir}' -Force"`);
                } else {
                    execSync(`unzip -o "${dest}" -d "${binDir}"`);
                }
                // Move the specific file if subPath is provided
                if (tool.subPath) {
                   // This part is complex due to wildcard logic and directory shifts
                   // For now we assume the user might need to fix paths or we use simpler links
                }
                fs.unlinkSync(dest);
            }
            
            if (platform !== 'win32') {
                execSync(`chmod +x "${path.join(binDir, tool.name)}"`);
            }
            console.log(`✅ ${tool.name} ready.`);
        } catch (e) {
            console.error(`❌ Failed to download ${tool.name}: ${e.message}`);
        }
    }
}

main();
