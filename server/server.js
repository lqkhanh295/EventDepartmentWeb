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
const { pushToMagicQ, pingMagicQ } = require('./magicq');

const app = express();
const PORT = process.env.PORT || 3002;

// Allow requests from React dev server (port 3000) and production
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        /^http:\/\/192\.168\.\d+\.\d+/,
        /^http:\/\/10\.\d+\.\d+\.\d+/,
    ],
    credentials: true,
}));

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
app.listen(PORT, () => {
    console.log(`✅  MagicQ Push Server running on http://localhost:${PORT}`);
    console.log(`   POST /api/magicq/push-patch — push patch CSV + UDP command`);
    console.log(`   POST /api/magicq/ping        — test UDP connectivity`);
    console.log(`   GET  /api/health             — server health check`);
});
