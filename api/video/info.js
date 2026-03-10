const { spawn, execSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const ALLOWED_VIDEO_HOSTS = new Set([
    'youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'music.youtube.com',
    'facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.watch', 'web.facebook.com',
]);

function isAllowedVideoUrl(url) {
    try {
        const { hostname } = new URL(url);
        return ALLOWED_VIDEO_HOSTS.has(hostname);
    } catch {
        return false;
    }
}

function resolveYtDlp() {
    try { execSync('yt-dlp --version', { stdio: 'ignore' }); return 'yt-dlp'; } catch {}
    const wingetBase = path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'WinGet', 'Packages');
    if (fs.existsSync(wingetBase)) {
        const dirs = fs.readdirSync(wingetBase).filter(d => d.startsWith('yt-dlp'));
        for (const dir of dirs) {
            const exe = path.join(wingetBase, dir, 'yt-dlp.exe');
            if (fs.existsSync(exe)) return exe;
        }
    }
    const candidates = [
        path.join(os.homedir(), 'scoop', 'shims', 'yt-dlp.exe'),
        'C:\\ProgramData\\chocolatey\\bin\\yt-dlp.exe',
        'C:\\yt-dlp\\yt-dlp.exe',
        '/usr/local/bin/yt-dlp',
        '/usr/bin/yt-dlp',
    ];
    for (const c of candidates) { if (fs.existsSync(c)) return c; }
    return null;
}

module.exports = function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { url } = req.body || {};
    if (!url || typeof url !== 'string') return res.status(400).json({ error: 'Thiếu URL' });
    if (!isAllowedVideoUrl(url)) return res.status(400).json({ error: 'Chỉ hỗ trợ YouTube và Facebook' });

    const YT_DLP = resolveYtDlp();
    if (!YT_DLP) {
        return res.status(503).json({
            error: 'yt-dlp không khả dụng trên môi trường cloud. Hãy chạy server cục bộ để dùng tính năng này.',
        });
    }

    const chunks = [];
    let responded = false;
    const send = (statusOrJson, body) => {
        if (responded) return;
        responded = true;
        if (body) res.status(statusOrJson).json(body);
        else res.json(statusOrJson);
    };

    const child = spawn(YT_DLP, ['--no-playlist', '--dump-json', '--no-download', '--no-warnings', url.trim()]);
    child.stdout.on('data', d => chunks.push(d));
    child.on('error', err => send(500, { error: err.message }));
    child.on('close', code => {
        if (responded) return;
        if (code !== 0) return send(500, { error: 'Không thể lấy thông tin video. Kiểm tra lại URL.' });
        try {
            const info = JSON.parse(Buffer.concat(chunks).toString('utf8').trim().split('\n')[0]);
            const availableQualities = [...new Set(
                (info.formats || []).filter(f => f.height && f.vcodec !== 'none').map(f => f.height)
            )].sort((a, b) => b - a).slice(0, 6);
            send({
                title: info.title || '',
                thumbnail: info.thumbnail || '',
                duration: info.duration || 0,
                uploader: info.uploader || info.channel || '',
                availableQualities,
            });
        } catch (e) {
            send(500, { error: 'Lỗi phân tích dữ liệu: ' + e.message });
        }
    });
};
