const { spawn, execSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

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
        args.push('--extractor-args', 'youtube:player_client=tv_embedded,ios,mweb,web');
    }
    appendYtDlpAuthArgs(args);
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
const INVIDIOUS_INSTANCES = [
    'https://inv.nadeko.net',
    'https://invidious.privacyredirect.com',
    'https://yewtu.be',
    'https://iv.ggtyler.dev',
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
};
