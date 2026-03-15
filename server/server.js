/**
 * server.js — MagicQ Push Backend Server
 *
 * Chạy riêng biệt với React dev server:
 *   cd server && npm install && npm start
 *
 * Mặc định lắng nghe port 3001.
 * React app proxy /api/* sang http://localhost:3001 (xem package.json "proxy").
 */

const express = require('express');
const cors = require('cors');
const os = require('os');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { spawn, execSync } = require('child_process');

// ─── Resolve yt-dlp path ────────────────────────────────────────────────────
function resolveYtDlp() {
    // 1. Already in PATH
    try { execSync('yt-dlp --version', { stdio: 'ignore' }); return 'yt-dlp'; } catch {}
    // 2. WinGet install location (per-user)
    const wingetBase = path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'WinGet', 'Packages');
    if (fs.existsSync(wingetBase)) {
        const dirs = fs.readdirSync(wingetBase).filter(d => d.startsWith('yt-dlp'));
        for (const dir of dirs) {
            const exe = path.join(wingetBase, dir, 'yt-dlp.exe');
            if (fs.existsSync(exe)) return exe;
        }
    }
    // 3. Common manual install paths (Windows + Linux/Railway)
    const candidates = [
        path.join(os.homedir(), 'scoop', 'shims', 'yt-dlp.exe'),
        'C:\\ProgramData\\chocolatey\\bin\\yt-dlp.exe',
        'C:\\yt-dlp\\yt-dlp.exe',
        '/usr/local/bin/yt-dlp',
        '/usr/bin/yt-dlp',
        '/nix/var/nix/profiles/default/bin/yt-dlp',
    ];
    for (const c of candidates) { if (fs.existsSync(c)) return c; }
    return null; // not found
}
const YT_DLP = resolveYtDlp();
console.log(YT_DLP ? `✅  yt-dlp found: ${YT_DLP}` : '⚠️  yt-dlp not found — video download will be unavailable');

function resolveFfmpeg() {
    // When ffmpeg is already in PATH, return null — no --ffmpeg-location injection needed.
    try { execSync('ffmpeg -version', { stdio: 'ignore' }); return null; } catch {}
    const wingetBase = path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'WinGet', 'Packages');
    if (!fs.existsSync(wingetBase)) return null;
    // Search all subdirectories for ffmpeg.exe
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
        } catch { /* skip unreadable dirs */ }
    }
    return null;
}
const FFMPEG_DIR = resolveFfmpeg();
// Check whether ffmpeg is usable (either in PATH or found at a custom dir)
const ffmpegAvailable = FFMPEG_DIR !== null
    ? true
    : (() => { try { execSync('ffmpeg -version', { stdio: 'ignore' }); return true; } catch { return false; } })();
console.log(
    FFMPEG_DIR        ? `✅  ffmpeg found: ${FFMPEG_DIR}` :
    ffmpegAvailable   ? '✅  ffmpeg in system PATH' :
    '⚠️  ffmpeg not found — audio merge may fail'
);
const { pushToMagicQ, pingMagicQ } = require('./magicq');

const app = express();
const PORT = process.env.PORT || 3003;

// Allow requests from React dev server and Railway production domain
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    /^http:\/\/192\.168\.\d+\.\d+/,
    /^http:\/\/10\.\d+\.\d+\.\d+/,
];
if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    allowedOrigins.push(`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
}
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(express.json({ limit: '1mb' }));

// ─── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
});

// ─── Push patch to MagicQ ──────────────────────────────────────────────────────
/**
 * POST /api/magicq/push-patch
 * Body: {
 *   fixtures:    Array,   // fixture objects from StageCanvas
 *   magicqIp:   string,  // e.g. "192.168.1.100"
 *   showFolder: string,  // e.g. "C:\\Users\\user\\Documents\\MagicQ\\show"
 *   fileSlot:   number,  // 1-9999, default 1
 *   noHeader:   boolean, // default false (use CREP header)
 * }
 */
app.post('/api/magicq/push-patch', async (req, res) => {
    const { fixtures, magicqIp, showFolder, fileSlot = 1, noHeader = false } = req.body;

    if (!Array.isArray(fixtures) || fixtures.length === 0) {
        return res.status(400).json({ error: 'Fixtures array rỗng hoặc không hợp lệ' });
    }
    if (!magicqIp || typeof magicqIp !== 'string') {
        return res.status(400).json({ error: 'Thiếu hoặc sai định dạng magicqIp' });
    }
    if (!showFolder || typeof showFolder !== 'string') {
        return res.status(400).json({ error: 'Thiếu showFolder (đường dẫn thư mục show MagicQ)' });
    }

    try {
        const result = await pushToMagicQ({ fixtures, magicqIp, showFolder, fileSlot, noHeader });
        res.json({
            ok: true,
            message: `Đã push ${result.fixtureCount} fixtures → MagicQ ${magicqIp}`,
            csvPath: result.csvPath,
            command: result.command,
            fixtureCount: result.fixtureCount,
        });
    } catch (err) {
        console.error('[push-patch] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ─── Ping MagicQ (test UDP connectivity) ───────────────────────────────────────
/**
 * POST /api/magicq/ping
 * Body: { magicqIp: string, noHeader?: boolean }
 */
app.post('/api/magicq/ping', async (req, res) => {
    const { magicqIp, noHeader = false } = req.body;
    if (!magicqIp) return res.status(400).json({ error: 'Thiếu magicqIp' });

    try {
        await pingMagicQ(magicqIp, noHeader);
        res.json({
            ok: true,
            message: `UDP packet đã gửi tới ${magicqIp}:6553 (UDP fire-and-forget, không có reply)`,
        });
    } catch (err) {
        console.error('[ping] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ─── Start ─────────────────────────────────────────────────────────────────────

// ─── Video Downloader ─────────────────────────────────────────────────────────
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

// POST /api/video/info — lấy tiêu đề, thumbnail, thời lượng
app.post('/api/video/info', (req, res) => {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') return res.status(400).json({ error: 'Thiếu URL' });
    if (!isAllowedVideoUrl(url)) return res.status(400).json({ error: 'Chỉ hỗ trợ YouTube và Facebook' });

    if (!YT_DLP) return res.status(500).json({ error: 'yt-dlp chưa được cài đặt. Tải tại: https://github.com/yt-dlp/yt-dlp/releases' });

    const chunks = [];
    let responded = false;
    const send = (statusOrJson, body) => {
        if (responded) return;
        responded = true;
        if (body) res.status(statusOrJson).json(body);
        else res.json(statusOrJson);
    };
    const child = spawn(YT_DLP, ['--no-playlist', '--dump-json', '--no-download', '--no-warnings', url]);
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
});

// GET /api/video/download — tải file và stream về client
app.get('/api/video/download', async (req, res) => {
    const { url, type, quality } = req.query;
    if (!url || typeof url !== 'string') return res.status(400).json({ error: 'Thiếu URL' });
    if (!isAllowedVideoUrl(url)) return res.status(400).json({ error: 'Chỉ hỗ trợ YouTube và Facebook' });
    if (!['mp3', 'mp4'].includes(type)) return res.status(400).json({ error: 'type phải là mp3 hoặc mp4' });

    const tmpDir = path.join(os.tmpdir(), `ytdl-${crypto.randomBytes(8).toString('hex')}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    // Sanitize a string for use as a filename
    const sanitizeFilename = (s) => s.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 120);

    // Resolve output filename: fetch title first, fallback to 'video'
    const resolveTitle = () => new Promise((resolve) => {
        const child = spawn(YT_DLP, ['--no-playlist', '--print', 'title', '--no-warnings', url.trim()], {
            env: { ...process.env, ...(FFMPEG_DIR ? { PATH: FFMPEG_DIR + path.delimiter + process.env.PATH } : {}) },
        });
        let out = '';
        child.stdout.on('data', d => { out += d.toString(); });
        child.on('close', () => resolve(sanitizeFilename(out.split('\n')[0]) || 'video'));
        child.on('error', () => resolve('video'));
    });

    const videoTitle = await new Promise((resolve) => resolveTitle().then(resolve));
    const tmpBase = path.join(tmpDir, videoTitle);

    const args = ['--no-playlist', '--no-warnings', '-o', `${tmpBase}.%(ext)s`];
    // Pass ffmpeg location so yt-dlp can merge video+audio even if not in PATH
    if (FFMPEG_DIR) args.push('--ffmpeg-location', FFMPEG_DIR);
    if (type === 'mp3') {
        args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
    } else {
        const h = quality && quality !== 'best' ? quality : null;
        // Format string: always merge best video + best audio → re-encode to mp4 via ffmpeg
        // Fallback chain covers YouTube (webm/m4a), Facebook (mp4), and any other source
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
        // Re-encode audio to AAC so Windows Media Player / browsers can play it
        // (YouTube often delivers Opus audio in WebM which is not supported by Windows)
        args.push('--postprocessor-args', 'ffmpeg:-c:a aac -b:a 192k');
    }
    args.push(url);

    if (!YT_DLP) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        return res.status(500).json({ error: 'yt-dlp chưa được cài đặt. Tải tại: https://github.com/yt-dlp/yt-dlp/releases' });
    }

    // Build environment: inject ffmpeg into PATH so yt-dlp can always find it
    const spawnEnv = { ...process.env };
    if (FFMPEG_DIR) {
        spawnEnv.PATH = FFMPEG_DIR + path.delimiter + (spawnEnv.PATH || '');
        console.log(`[download] ffmpeg dir: ${FFMPEG_DIR}`);
    } else {
        console.warn('[download] ffmpeg not found — merge will likely fail');
    }
    console.log(`[download] args: ${args.join(' ')}`);

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
    child.stderr.on('data', d => { stderrBuf.push(d.toString()); process.stdout.write(d); });
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

        // Pick the correct output file: for mp4 prefer the largest .mp4/.mkv file (merged),
        // for mp3 pick the .mp3 file
        const ext = type === 'mp3' ? '.mp3' : null;
        const candidates = files
            .map(f => ({ name: f, full: path.join(tmpDir, f), size: fs.statSync(path.join(tmpDir, f)).size }))
            .filter(f => ext ? f.name.endsWith(ext) : (f.name.endsWith('.mp4') || f.name.endsWith('.mkv') || f.name.endsWith('.webm')))
            .sort((a, b) => b.size - a.size); // largest first = merged file

        const chosen = candidates[0] || { full: path.join(tmpDir, files[0]), name: files[0], size: fs.statSync(path.join(tmpDir, files[0])).size };
        console.log(`[download] output files: ${files.join(', ')} → sending: ${chosen.name} (${(chosen.size/1024/1024).toFixed(1)} MB)`);
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
});

// ─── Serve React build in production (Railway) ───────────────────────────────
if (process.env.NODE_ENV === 'production') {
    const buildPath = path.join(__dirname, '..', 'build');
    app.use(express.static(buildPath));
    // Catch-all: return React app for any non-API route
    app.get('*', (_req, res) => {
        res.sendFile(path.join(buildPath, 'index.html'));
    });
}

const server = app.listen(PORT, () => {
    console.log(`✅  Server running on http://localhost:${PORT}`);
    console.log(`   POST /api/magicq/push-patch — push patch CSV + UDP command`);
    console.log(`   POST /api/magicq/ping        — test UDP connectivity`);
    console.log(`   GET  /api/health             — server health check`);
    if (process.env.NODE_ENV === 'production') {
        console.log('   Serving React build from /build/');
    }
});

server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. The server is likely already running.`);
        console.error('   Stop the existing process on this port, then run "npm start" again.');
        process.exit(1);
    }
    throw err;
});
