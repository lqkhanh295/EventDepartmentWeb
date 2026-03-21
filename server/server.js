/**
 * server.js — MagicQ Push Backend Server
 *
 * Chạy riêng biệt với React dev server:
 *   cd server && npm install && npm start
 *
 * Mặc định lắng nghe port 3002.
 * React app proxy /api/* sang http://localhost:3002 (xem package.json "proxy").
 */

const express = require('express');
const cors = require('cors');
const os = require('os');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { spawn, execSync } = require('child_process');
const https = require('https');
const http = require('http');

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
        // pip install --user puts yt-dlp here on Linux
        path.join(os.homedir(), '.local', 'bin', 'yt-dlp'),
        '/root/.local/bin/yt-dlp',
        '/usr/local/bin/yt-dlp',
        '/usr/bin/yt-dlp',
        '/nix/var/nix/profiles/default/bin/yt-dlp',
    ];
    for (const c of candidates) { if (fs.existsSync(c)) return c; }
    return null; // not found
}
const YT_DLP = resolveYtDlp();
console.log(YT_DLP ? `✅  yt-dlp found: ${YT_DLP}` : '⚠️  yt-dlp not found — video download will be unavailable');
const YT_DLP_COOKIES_PATH = process.env.YTDLP_COOKIES_PATH || process.env.YT_DLP_COOKIES_PATH || '';
const YT_DLP_COOKIES_B64 = process.env.YTDLP_COOKIES_B64 || process.env.YT_DLP_COOKIES_B64 || '';
const YT_DLP_COOKIES_CONTENT = process.env.YTDLP_COOKIES_CONTENT || process.env.YT_DLP_COOKIES_CONTENT || '';
const YT_DLP_COOKIES_FROM_BROWSER = process.env.YTDLP_COOKIES_FROM_BROWSER || process.env.YT_DLP_COOKIES_FROM_BROWSER || '';

let CACHED_COOKIES_FILE = null;
function resolveCookiesFile() {
    if (CACHED_COOKIES_FILE) return CACHED_COOKIES_FILE;

    if (YT_DLP_COOKIES_PATH && fs.existsSync(YT_DLP_COOKIES_PATH)) {
        CACHED_COOKIES_FILE = YT_DLP_COOKIES_PATH;
        return CACHED_COOKIES_FILE;
    }

    const cookieText = YT_DLP_COOKIES_CONTENT
        ? YT_DLP_COOKIES_CONTENT
        : (YT_DLP_COOKIES_B64 ? Buffer.from(YT_DLP_COOKIES_B64, 'base64').toString('utf8') : '');
    if (!cookieText.trim()) return null;

    const filePath = path.join(os.tmpdir(), 'yt-dlp-cookies.txt');
    fs.writeFileSync(filePath, cookieText, { encoding: 'utf8' });
    CACHED_COOKIES_FILE = filePath;
    return CACHED_COOKIES_FILE;
}

const RESOLVED_COOKIES_FILE = resolveCookiesFile();
if (RESOLVED_COOKIES_FILE) {
    console.log(`✅  yt-dlp cookies loaded: ${RESOLVED_COOKIES_FILE}`);
} else if (YT_DLP_COOKIES_PATH) {
    console.warn(`⚠️  yt-dlp cookies path not found: ${YT_DLP_COOKIES_PATH}`);
}

function appendYtDlpAuthArgs(args, isYouTube = false) {
    if (isYouTube) {
        // Essential for bypassing YouTube bot checks without cookies
        // 1. Impersonate Chrome to pass TLS/HTTP fingerprint checks
        args.push('--impersonate', 'chrome');
        // 2. Force IPv4 to avoid datacenter IPv6 blanket bans
        args.push('-4');
    }

    const cookiesFile = resolveCookiesFile();
    if (cookiesFile) {
        args.push('--cookies', cookiesFile);
    }
    return args;
}

function hasExplicitCookiesConfig() {
    return Boolean(YT_DLP_COOKIES_PATH || YT_DLP_COOKIES_B64 || YT_DLP_COOKIES_CONTENT);
}

function getCookieBrowserCandidates() {
    if (hasExplicitCookiesConfig()) return [];

    const configured = String(YT_DLP_COOKIES_FROM_BROWSER || '').trim();
    if (configured) {
        return configured
            .split(',')
            .map(v => v.trim())
            .filter(Boolean);
    }

    if (process.platform === 'win32' || process.platform === 'darwin') {
        return ['chrome', 'edge', 'firefox'];
    }
    return [];
}

function appendYtDlpBrowserCookiesArgs(args, browser) {
    if (browser && typeof browser === 'string') {
        args.push('--cookies-from-browser', browser);
    }
    return args;
}

function isBotCheckError(text) {
    const raw = String(text || '').toLowerCase();
    return raw.includes('sign in to confirm you\'re not a bot') || raw.includes('--cookies-from-browser') || raw.includes('--cookies');
}

function buildYouTubeAuthErrorMessage() {
    return [
        'YouTube đang yêu cầu xác thực cookie cho video này.',
        'Hãy cấu hình một trong các biến môi trường: YTDLP_COOKIES_PATH, YTDLP_COOKIES_CONTENT, YTDLP_COOKIES_B64 hoặc YTDLP_COOKIES_FROM_BROWSER.',
        'Sau đó khởi động lại backend và thử tải lại.',
    ].join(' ');
}

function isRetriableYouTubeError(text) {
    const raw = String(text || '').toLowerCase();
    return isBotCheckError(raw)
        || raw.includes('no longer supported in this application or device')
        || raw.includes('unsupported in this application or device')
        || raw.includes('requested format is not available');
}

function getDefaultYouTubePlayerClients() {
    return 'youtube:player_client=ios,mweb,web';
}

function getRetryYouTubePlayerClients() {
    return [
        'youtube:player_client=mweb,web',
        'youtube:player_client=ios,web',
        'youtube:player_client=web',
    ];
}

function extractYouTubeVideoId(url) {
    try {
        const parsed = new URL(url);
        if (parsed.hostname === 'youtu.be') return parsed.pathname.replace('/', '').trim() || null;
        return parsed.searchParams.get('v');
    } catch {
        return null;
    }
}

function buildBasicYouTubeFallback(url) {
    const id = extractYouTubeVideoId(url);
    if (!id) return null;
    return {
        title: `YouTube video (${id})`,
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        duration: 0,
        uploader: '',
        availableQualities: [],
    };
}

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
const PORT = process.env.PORT || 3002;

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
    appendYtDlpAuthArgs(args, isYouTubeUrl(url));
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

// ─── Invidious fallback (no auth needed) ─────────────────────────────────────
// Updated 2026-03-20 — verified against https://api.invidious.io/instances.json
const INVIDIOUS_INSTANCES = [
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://yewtu.be',
];

async function fetchInfoFromInvidious(videoId) {
    for (const instance of INVIDIOUS_INSTANCES) {
        try {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 8000);
            const resp = await fetch(
                `${instance}/api/v1/videos/${encodeURIComponent(videoId)}?fields=title,author,lengthSeconds,videoThumbnails,adaptiveFormats,formatStreams`,
                { signal: ctrl.signal }
            );
            clearTimeout(timer);
            if (!resp.ok) continue;
            const data = await resp.json();
            if (!data?.title) continue;
            const qualitySet = new Set();
            for (const f of (data.formatStreams || [])) {
                const q = parseInt(f.qualityLabel); if (!isNaN(q) && q > 0) qualitySet.add(q);
            }
            for (const f of (data.adaptiveFormats || [])) {
                if (!f.type?.startsWith('video/')) continue;
                const q = parseInt(f.qualityLabel); if (!isNaN(q) && q > 0) qualitySet.add(q);
            }
            const availableQualities = [...qualitySet].sort((a, b) => b - a).slice(0, 6);
            const thumbs = data.videoThumbnails || [];
            const thumb = thumbs.find(t => t.quality === 'high') || thumbs.find(t => t.quality === 'medium') || thumbs[0];
            const thumbnail = thumb ? (thumb.url.startsWith('http') ? thumb.url : `https://i.ytimg.com${thumb.url}`) : '';
            return { title: data.title, thumbnail, duration: data.lengthSeconds || 0, uploader: data.author || '', availableQualities };
        } catch { /* try next */ }
    }
    return null;
}

async function getInvidiousStreamUrl(videoId, type, quality) {
    for (const instance of INVIDIOUS_INSTANCES) {
        try {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 10000);
            const resp = await fetch(
                `${instance}/api/v1/videos/${encodeURIComponent(videoId)}`,
                { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0' } }
            );
            clearTimeout(timer);
            if (!resp.ok) continue;
            const data = await resp.json();
            if (!data?.title) continue;
            const title = data.title || '';
            if (type === 'mp3') {
                const audioStreams = (data.adaptiveFormats || [])
                    .filter(f => f.type?.startsWith('audio/') && f.url)
                    .sort((a, b) => (parseInt(b.bitrate) || 0) - (parseInt(a.bitrate) || 0));
                if (audioStreams[0]?.url) return { url: audioStreams[0].url, title, ext: 'm4a', contentType: 'audio/mp4' };
            } else {
                const h = quality && quality !== 'best' ? parseInt(quality) : 9999;
                const muxed = (data.formatStreams || [])
                    .filter(f => f.url)
                    .map(f => ({ ...f, _h: parseInt(f.qualityLabel) || 0 }))
                    .filter(f => f._h > 0)
                    .sort((a, b) => b._h - a._h);
                const best = muxed.find(f => f._h <= h) || muxed[muxed.length - 1];
                if (best?.url) return { url: best.url, title, ext: 'mp4', contentType: 'video/mp4' };
            }
        } catch (e) {
            console.warn(`[invidious] ${instance}: ${e.message}`);
        }
    }
    return null;
}

function pipeHttpStream(streamUrl, res, contentType, filename) {
    return new Promise((resolve, reject) => {
        const followRedirects = (url, depth) => {
            if (depth > 5) { reject(new Error('Too many redirects')); return; }
            let u;
            try { u = new URL(url); } catch (e) { reject(e); return; }
            const lib = u.protocol === 'https:' ? https : http;
            lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (r) => {
                if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
                    r.resume(); followRedirects(r.headers.location, depth + 1); return;
                }
                if (r.statusCode !== 200) { r.resume(); reject(new Error(`HTTP ${r.statusCode}`)); return; }
                if (!res.headersSent) {
                    res.setHeader('Content-Type', contentType);
                    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
                    if (r.headers['content-length']) res.setHeader('Content-Length', r.headers['content-length']);
                }
                r.pipe(res);
                r.on('end', resolve);
                r.on('error', reject);
            }).on('error', reject);
        };
        followRedirects(streamUrl, 0);
    });
}

async function pipeFromInvidious(videoId, type, quality, titleHint, res) {
    const result = await getInvidiousStreamUrl(videoId, type, quality);
    if (!result) return false;
    const { url, title, ext, contentType } = result;
    const safeName = (title || titleHint || 'video').replace(/[\\/:*?"<>|]/g, '_').trim().slice(0, 120) + '.' + ext;
    try {
        await pipeHttpStream(url, res, contentType, safeName);
        return true;
    } catch (e) {
        console.warn(`[invidious-dl] stream failed: ${e.message}`);
        return false;
    }
}

function buildRetryDownloadArgs({ tmpBase, type, quality, url, ffmpegDir, extractorArgs, cookiesFromBrowser }) {
    const args = ['--no-playlist', '--no-warnings', '-o', `${tmpBase}.%(ext)s`];
    if (ffmpegDir) args.push('--ffmpeg-location', ffmpegDir);
    if (extractorArgs) args.push('--extractor-args', extractorArgs);
    appendYtDlpBrowserCookiesArgs(args, cookiesFromBrowser);

    if (type === 'mp3') {
        args.push('-f', '140/bestaudio[ext=m4a]/bestaudio/best');
        args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
    } else {
        const h = quality && quality !== 'best' ? quality : null;
        if (h) {
            args.push('-f', `bv*[height<=${h}]+ba/b[height<=${h}]/bv*+ba/b/best`);
        } else {
            args.push('-f', 'bv*+ba/b/best');
        }
        args.push('--merge-output-format', 'mp4');
        args.push('--postprocessor-args', 'ffmpeg:-c:a aac -b:a 192k');
    }

    appendYtDlpAuthArgs(args, isYouTubeUrl(url));
    args.push(url);
    return args;
}

function runYtDlpDownloadOnce(binary, args, env) {
    return new Promise((resolve) => {
        const stderrBuf = [];
        const child = spawn(binary, args, { env });
        child.stderr.on('data', d => { stderrBuf.push(d.toString()); process.stdout.write(d); });
        child.on('error', err => resolve({ code: -1, stderrText: err.message }));
        child.on('close', code => resolve({ code, stderrText: stderrBuf.join('') }));
    });
}

// POST /api/video/info — lấy tiêu đề, thumbnail, thời lượng
app.post('/api/video/info', (req, res) => {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') return res.status(400).json({ error: 'Thiếu URL' });
    if (!isAllowedVideoUrl(url)) return res.status(400).json({ error: 'Chỉ hỗ trợ YouTube và Facebook' });

    const targetUrl = normalizeVideoUrl(url);

    if (!YT_DLP) return res.status(500).json({ error: 'yt-dlp chưa được cài đặt. Tải tại: https://github.com/yt-dlp/yt-dlp/releases' });

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
            const stderrText = stderrChunks.join('').trim();
            if (isYouTubeUrl(targetUrl)) {
                const videoId = extractYouTubeVideoId(targetUrl);
                if (videoId) {
                    const inv = await fetchInfoFromInvidious(videoId);
                    if (inv) return send(inv);
                }
                const oEmbed = await fetchYouTubeOEmbed(targetUrl);
                if (oEmbed) return send(oEmbed);
                const basicFallback = buildBasicYouTubeFallback(targetUrl);
                if (basicFallback) return send(basicFallback);
            }
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
        const titleArgs = ['--no-playlist', '--print', 'title', '--no-warnings'];
        appendYtDlpAuthArgs(titleArgs, isYouTubeUrl(url));
        titleArgs.push(url.trim());
        const child = spawn(YT_DLP, titleArgs, {
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
        if (h) {
            args.push('-f', `bv*[height<=${h}]+ba/b[height<=${h}]/bv*+ba/b/best`);
        } else {
            args.push('-f', 'bv*+ba/b/best');
        }
        args.push('--merge-output-format', 'mp4');
        // Re-encode audio to AAC so Windows Media Player / browsers can play it
        // (YouTube often delivers Opus audio in WebM which is not supported by Windows)
        args.push('--postprocessor-args', 'ffmpeg:-c:a aac -b:a 192k');
    }
    appendYtDlpAuthArgs(args, isYouTubeUrl(url));
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
    } else if (!ffmpegAvailable) {
        console.warn('[download] ffmpeg not found — merge will likely fail');
    }
    console.log(`[download] args: ${args.join(' ')}`);

    const cleanup = () => fs.rmSync(tmpDir, { recursive: true, force: true });
    let responded = false;
    const sendError = (msg, status = 500) => {
        if (responded) return;
        responded = true;
        cleanup();
        res.status(status).json({ error: msg });
    };
    const firstAttempt = await runYtDlpDownloadOnce(YT_DLP, args, spawnEnv);
    if (firstAttempt.code !== 0) {
        let stderrText = firstAttempt.stderrText;
        const attemptedBrowserCookies = [];
        const shouldTryYoutubeFallback = isYouTubeUrl(url) && isRetriableYouTubeError(stderrText);

        if (shouldTryYoutubeFallback) {

            if (stderrText && isBotCheckError(stderrText)) {
                for (const browser of getCookieBrowserCandidates()) {
                    attemptedBrowserCookies.push(browser);
                    const retryWithBrowserCookies = buildRetryDownloadArgs({
                        tmpBase,
                        type,
                        quality,
                        url,
                        ffmpegDir: FFMPEG_DIR,
                        extractorArgs: getDefaultYouTubePlayerClients(),
                        cookiesFromBrowser: browser,
                    });
                    console.log(`[download] retry with browser cookies: ${browser}`);
                    const retry = await runYtDlpDownloadOnce(YT_DLP, retryWithBrowserCookies, spawnEnv);
                    if (retry.code === 0) {
                        stderrText = '';
                        break;
                    }
                    stderrText = retry.stderrText || stderrText;
                }
            }
        }

        if (stderrText) {
            if (shouldTryYoutubeFallback) {
                const videoId = extractYouTubeVideoId(url);
                if (videoId) {
                    responded = true;
                    cleanup();
                    const ok = await pipeFromInvidious(videoId, type, quality, videoTitle, res);
                    if (!ok && !res.headersSent) {
                        const msg = isBotCheckError(stderrText)
                            ? `${buildYouTubeAuthErrorMessage()}${attemptedBrowserCookies.length ? ` Da thu cookies tu browser: ${attemptedBrowserCookies.join(', ')}.` : ''}`
                            : 'Không thể tải video. Thử lại sau.';
                        res.status(503).json({ error: msg });
                    }
                    return;
                }
            }
            if (isBotCheckError(stderrText)) {
                const attemptedSuffix = attemptedBrowserCookies.length
                    ? ` Da thu cookies tu browser: ${attemptedBrowserCookies.join(', ')}.`
                    : '';
                return sendError(buildYouTubeAuthErrorMessage() + attemptedSuffix, 403);
            }
            const errLine = stderrText.split('\n').find(l => l.includes('ERROR')) || 'Tải thất bại';
            return sendError(errLine);
        }
    }

    if (!responded) {
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
    }
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
