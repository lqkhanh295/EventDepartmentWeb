const { spawn, execSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

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

function resolveFfmpeg() {
    try { execSync('ffmpeg -version', { stdio: 'ignore' }); return null; } catch {}
    const wingetBase = path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'WinGet', 'Packages');
    if (!fs.existsSync(wingetBase)) return null;
    for (const dir of fs.readdirSync(wingetBase)) {
        const base = path.join(wingetBase, dir);
        try {
            const entries = fs.readdirSync(base, { recursive: true });
            for (const entry of entries) {
                if (path.basename(entry).toLowerCase() === 'ffmpeg.exe') {
                    const full = path.join(base, entry);
                    if (fs.statSync(full).isFile()) return path.dirname(full);
                }
            }
        } catch { /* skip */ }
    }
    return null;
}

const sanitizeFilename = (s) =>
    s.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 120);

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { url, type, quality } = req.query || {};
    if (!url || typeof url !== 'string') return res.status(400).json({ error: 'Thiếu URL' });
    if (!isAllowedVideoUrl(url)) return res.status(400).json({ error: 'Chỉ hỗ trợ YouTube và Facebook' });
    if (!['mp3', 'mp4'].includes(type)) return res.status(400).json({ error: 'type phải là mp3 hoặc mp4' });

    const YT_DLP = resolveYtDlp();
    if (!YT_DLP) {
        return res.status(503).json({
            error: 'yt-dlp không khả dụng trên môi trường cloud. Hãy chạy server cục bộ để tải video.',
        });
    }

    const FFMPEG_DIR = resolveFfmpeg();
    const tmpDir = path.join(os.tmpdir(), `ytdl-${crypto.randomBytes(8).toString('hex')}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    const resolveTitle = () => new Promise((resolve) => {
        const child = spawn(YT_DLP, ['--no-playlist', '--print', 'title', '--no-warnings', url.trim()], {
            env: { ...process.env, ...(FFMPEG_DIR ? { PATH: FFMPEG_DIR + path.delimiter + process.env.PATH } : {}) },
        });
        let out = '';
        child.stdout.on('data', d => { out += d.toString(); });
        child.on('close', () => resolve(sanitizeFilename(out.split('\n')[0]) || 'video'));
        child.on('error', () => resolve('video'));
    });

    const videoTitle = await resolveTitle();
    const tmpBase = path.join(tmpDir, videoTitle);

    const args = ['--no-playlist', '--no-warnings', '-o', `${tmpBase}.%(ext)s`];
    if (FFMPEG_DIR) args.push('--ffmpeg-location', FFMPEG_DIR);
    if (type === 'mp3') {
        args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
    } else {
        const h = quality && quality !== 'best' ? quality : null;
        if (h) {
            args.push('-f',
                `bestvideo[height<=${h}]+bestaudio/` +
                `bestvideo[height<=${h}]+bestaudio[ext=m4a]/` +
                `bestvideo[height<=${h}]+bestaudio[ext=webm]/` +
                `best[height<=${h}]/best`);
        } else {
            args.push('-f', 'bestvideo+bestaudio/bestvideo+bestaudio[ext=m4a]/best');
        }
        args.push('--merge-output-format', 'mp4');
        args.push('--postprocessor-args', 'ffmpeg:-c:a aac -b:a 192k');
    }
    args.push(url.trim());

    const spawnEnv = { ...process.env };
    if (FFMPEG_DIR) spawnEnv.PATH = FFMPEG_DIR + path.delimiter + (spawnEnv.PATH || '');

    const cleanup = () => fs.rmSync(tmpDir, { recursive: true, force: true });
    const stderrBuf = [];
    let responded = false;
    const sendError = (msg) => {
        if (responded) return;
        responded = true;
        cleanup();
        res.status(500).json({ error: msg });
    };

    const child = spawn(YT_DLP, args, { env: spawnEnv });
    child.stderr.on('data', d => { stderrBuf.push(d.toString()); });
    child.on('error', err => sendError(err.message));
    child.on('close', code => {
        if (responded) return;
        if (code !== 0) {
            const errLine = stderrBuf.join('').split('\n').find(l => l.includes('ERROR')) || 'Tải thất bại';
            return sendError(errLine);
        }
        let files;
        try { files = fs.readdirSync(tmpDir); } catch { return sendError('Không tìm thấy file đã tải'); }
        if (!files.length) return sendError('Không tìm thấy file đã tải');

        const ext = type === 'mp3' ? '.mp3' : null;
        const candidates = files
            .map(f => ({ name: f, full: path.join(tmpDir, f), size: fs.statSync(path.join(tmpDir, f)).size }))
            .filter(f => ext ? f.name.endsWith(ext) : (f.name.endsWith('.mp4') || f.name.endsWith('.mkv') || f.name.endsWith('.webm')))
            .sort((a, b) => b.size - a.size);

        const chosen = candidates[0] || { full: path.join(tmpDir, files[0]), name: files[0], size: fs.statSync(path.join(tmpDir, files[0])).size };
        responded = true;
        const contentType = type === 'mp3' ? 'audio/mpeg' : 'video/mp4';
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(chosen.name)}`);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', chosen.size);
        const stream = fs.createReadStream(chosen.full);
        stream.pipe(res);
        stream.on('close', cleanup);
        stream.on('error', () => { cleanup(); res.destroy(); });
    });
};
