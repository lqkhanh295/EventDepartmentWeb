/**
 * POST /api/magicq/ping
 * Gửi UDP CREP packet tới MagicQ.
 *
 * Lưu ý: Tính năng này yêu cầu kết nối LAN trực tiếp đến thiết bị MagicQ.
 * Trên môi trường cloud (Vercel), hãy set biến REACT_APP_MAGICQ_SERVER
 * trỏ tới địa chỉ server cục bộ có thể gửi UDP.
 */
const dgram = require('dgram');

const MAGICQ_UDP_PORT = 6553;
const CREP_MAGIC = Buffer.from('CREP', 'ascii');
let seqFwd = 0;

function buildCREPPacket(command) {
    const data = Buffer.from(command, 'ascii');
    const packet = Buffer.alloc(10 + data.length);
    CREP_MAGIC.copy(packet, 0);
    packet.writeUInt16LE(0, 4);
    packet.writeUInt8(seqFwd & 0xff, 6);
    seqFwd = (seqFwd + 1) & 0xff;
    packet.writeUInt8(0, 7);
    packet.writeUInt16LE(data.length, 8);
    data.copy(packet, 10);
    return packet;
}

function buildRawPacket(command) {
    return Buffer.from(command, 'ascii');
}

function sendUDP(packet, ip) {
    return new Promise((resolve, reject) => {
        const client = dgram.createSocket('udp4');
        client.send(packet, 0, packet.length, MAGICQ_UDP_PORT, ip, (err) => {
            client.close();
            if (err) reject(err);
            else resolve();
        });
    });
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { magicqIp, noHeader = false } = req.body || {};
    if (!magicqIp) return res.status(400).json({ error: 'Thiếu magicqIp' });

    // Basic IP validation to prevent SSRF
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(magicqIp)) {
        return res.status(400).json({ error: 'magicqIp không hợp lệ' });
    }

    try {
        const packet = noHeader ? buildRawPacket('') : buildCREPPacket('');
        await sendUDP(packet, magicqIp);
        res.json({
            ok: true,
            message: `UDP packet đã gửi tới ${magicqIp}:${MAGICQ_UDP_PORT} (fire-and-forget)`,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
