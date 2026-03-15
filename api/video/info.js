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

function isYouTubeUrl(url) {
    try {
        const { hostname } = new URL(url);
        return ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'music.youtube.com'].includes(hostname);
    } catch {
        return false;
    }
}

function normalizeVideoUrl(url) {
    const input = String(url || '').trim();
    try {
        const parsed = new URL(input);
        const ytHosts = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com']);
        if (ytHosts.has(parsed.hostname)) {
            const v = parsed.searchParams.get('v');
            if (v) return `https://www.youtube.com/watch?v=${v}`;
        }
        return parsed.toString();
    } catch {
        return input;
    }
}

function buildInfoArgs(url) {
    const args = ['--no-playlist', '--dump-single-json', '--no-download', '--no-warnings'];
    if (isYouTubeUrl(url)) {
        args.push('--extractor-args', 'youtube:player_client=android,web');
    }
    args.push(url);
    return args;
}

async function fetchYouTubeOEmbed(url) {
    try {
        const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const resp = await fetch(endpoint, {
            headers: { 'User-Agent': 'EventDepartmentWeb/1.0 (+video-info-fallback)' },
        });
        if (!resp.ok) return null;
        const data = await resp.json();
        if (!data || !data.title) return null;
        return {
            title: data.title,
            thumbnail: data.thumbnail_url || '',
            duration: 0,
            uploader: data.author_name || '',
            availableQualities: [],
        };
    } catch {
        return null;
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

    const targetUrl = normalizeVideoUrl(url);
    const YT_DLP = resolveYtDlp();
    if (!YT_DLP) {
        return res.status(503).json({
            error: 'yt-dlp không khả dụng trên môi trường cloud. Hãy chạy server cục bộ để dùng tính năng này.',
        });
    }

    const stdoutChunks = [];
    const stderrChunks = [];
    let responded = false;
    const send = (statusOrJson, body) => {
        if (responded) return;
        responded = true;
        if (body) res.status(statusOrJson).json(body);
        else res.json(statusOrJson);
    };

    const child = spawn(YT_DLP, buildInfoArgs(targetUrl));
    child.stdout.on('data', d => stdoutChunks.push(d));
    child.stderr.on('data', d => stderrChunks.push(d));
    child.on('error', err => send(500, { error: err.message }));
    child.on('close', async (code) => {
        if (responded) return;

        if (code !== 0) {
            if (isYouTubeUrl(targetUrl)) {
                const fallback = await fetchYouTubeOEmbed(targetUrl);
                if (fallback) return send(fallback);
            }

            const stderrText = stderrChunks.join('').trim();
            const shortErr = stderrText.split('\n').find(l => l.includes('ERROR')) || stderrText.split('\n').slice(-1)[0] || '';
            return send(500, {
                error: shortErr
                    ? `Không thể lấy thông tin video: ${shortErr}`
                    : 'Không thể lấy thông tin video. Kiểm tra lại URL hoặc thử lại sau.',
            });
        }

        try {
            const raw = Buffer.concat(stdoutChunks).toString('utf8').trim();
            if (!raw) throw new Error('yt-dlp không trả dữ liệu');
            const info = JSON.parse(raw.split('\n')[0]);
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
