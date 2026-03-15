const { spawn, execSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');
const http = require('http');

const ALLOWED_VIDEO_HOSTS = new Set([
    'youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'music.youtube.com',
    'facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.watch', 'web.facebook.com',
]);

const YT_DLP_COOKIES_PATH = process.env.YTDLP_COOKIES_PATH || process.env.YT_DLP_COOKIES_PATH || '';
const YT_DLP_COOKIES_B64 = process.env.YTDLP_COOKIES_B64 || process.env.YT_DLP_COOKIES_B64 || '';
const YT_DLP_COOKIES_CONTENT = process.env.YTDLP_COOKIES_CONTENT || process.env.YT_DLP_COOKIES_CONTENT || '';

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

function appendYtDlpAuthArgs(args) {
    const cookiesFile = resolveCookiesFile();
    if (cookiesFile) {
        args.push('--cookies', cookiesFile);
    }
    return args;
}

function isBotCheckError(text) {
    const raw = String(text || '').toLowerCase();
    return raw.includes('sign in to confirm you\'re not a bot') || raw.includes('--cookies-from-browser') || raw.includes('--cookies');
}

function isYouTubeUrl(url) {
    try {
        const { hostname } = new URL(url);
        return ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'music.youtube.com'].includes(hostname);
    } catch {
        return false;
    }
}

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

// ─── Invidious fallback (no auth needed) ─────────────────────────────────────
function extractYouTubeVideoId(url) {
    try {
        const parsed = new URL(url);
        if (parsed.hostname === 'youtu.be') return parsed.pathname.replace('/', '').trim() || null;
        return parsed.searchParams.get('v');
    } catch { return null; }
}

const INVIDIOUS_INSTANCES = [
    'https://inv.nadeko.net',
    'https://invidious.privacyredirect.com',
    'https://yewtu.be',
    'https://iv.ggtyler.dev',
];

const PIPED_INSTANCES = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.adminforge.de',
    'https://piped-api.garudalinux.org',
    'https://pipedapi.in.projectsegfau.lt',
];

async function getInvidiousStreamUrl(videoId, type, quality) {
    // Try Piped API first (more reliable)
    for (const instance of PIPED_INSTANCES) {
        try {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 10000);
            const resp = await fetch(
                `${instance}/streams/${encodeURIComponent(videoId)}`,
                { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0' } }
            );
            clearTimeout(timer);
            if (!resp.ok) continue;
            const data = await resp.json();
            if (!data?.title) continue;
            const title = data.title || '';
            if (type === 'mp3') {
                const audioStreams = (data.audioStreams || [])
                    .filter(f => f.url)
                    .sort((a, b) => (parseInt(b.bitrate) || 0) - (parseInt(a.bitrate) || 0));
                if (audioStreams[0]?.url) return { url: audioStreams[0].url, title, ext: 'm4a', contentType: 'audio/mp4' };
            } else {
                const h = quality && quality !== 'best' ? parseInt(quality) : 9999;
                const videoStreams = (data.videoStreams || [])
                    .filter(f => f.url && !f.videoOnly)
                    .map(f => ({ ...f, _h: parseInt(f.quality) || 0 }))
                    .filter(f => f._h > 0)
                    .sort((a, b) => b._h - a._h);
                const best = videoStreams.find(f => f._h <= h) || videoStreams[videoStreams.length - 1];
                if (best?.url) return { url: best.url, title, ext: 'mp4', contentType: 'video/mp4' };
            }
        } catch (e) {
            console.warn(`[piped] ${instance}: ${e.message}`);
        }
    }
    // Fall back to Invidious
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
    const safeName = sanitizeFilename(title || titleHint || 'video') + '.' + ext;
    try {
        await pipeHttpStream(url, res, contentType, safeName);
        return true;
    } catch (e) {
        console.warn(`[invidious-dl] stream failed: ${e.message}`);
        return false;
    }
}

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
        const titleArgs = ['--no-playlist', '--print', 'title', '--no-warnings'];
        if (isYouTubeUrl(url)) {
            titleArgs.push('--extractor-args', 'youtube:player_client=tv_embedded,ios,mweb,web');
        }
        appendYtDlpAuthArgs(titleArgs);
        titleArgs.push(url.trim());
        const child = spawn(YT_DLP, titleArgs, {
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
    if (isYouTubeUrl(url)) {
        args.push('--extractor-args', 'youtube:player_client=tv_embedded,ios,mweb,web');
    }
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
    appendYtDlpAuthArgs(args);
    args.push(url.trim());

    const spawnEnv = { ...process.env };
    if (FFMPEG_DIR) spawnEnv.PATH = FFMPEG_DIR + path.delimiter + (spawnEnv.PATH || '');

    const cleanup = () => fs.rmSync(tmpDir, { recursive: true, force: true });
    const stderrBuf = [];
    let responded = false;
    const sendError = (msg, status = 500) => {
        if (responded) return;
        responded = true;
        cleanup();
        res.status(status).json({ error: msg });
    };

    const child = spawn(YT_DLP, args, { env: spawnEnv });
    child.stderr.on('data', d => { stderrBuf.push(d.toString()); });
    child.on('error', err => sendError(err.message));
    child.on('close', async (code) => {
        if (responded) return;
        if (code !== 0) {
            const stderrText = stderrBuf.join('');
            if (isBotCheckError(stderrText) && isYouTubeUrl(url)) {
                const videoId = extractYouTubeVideoId(url);
                if (videoId) {
                    responded = true;
                    cleanup();
                    const ok = await pipeFromInvidious(videoId, type, quality, videoTitle, res);
                    if (!ok && !res.headersSent) res.status(503).json({ error: 'Không thể tải video. Thử lại sau.' });
                    return;
                }
            }
            const errLine = stderrText.split('\n').find(l => l.includes('ERROR')) || 'Tải thất bại';
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
