/**
 * POST /api/magicq/push-patch
 *
 * Lưu ý: Tính năng này yêu cầu:
 * 1. Quyền ghi file vào showFolder trên máy chạy MagicQ (đường dẫn Windows)
 * 2. Kết nối UDP LAN đến thiết bị MagicQ
 *
 * Trên Vercel, hãy set REACT_APP_MAGICQ_SERVER trỏ tới server cục bộ.
 */
const dgram = require('dgram');
const fs = require('fs');
const path = require('path');

const MAGICQ_UDP_PORT = 6553;
const CREP_MAGIC = Buffer.from('CREP', 'ascii');
let seqFwd = 0;

const FIXTURE_META = {
    katana:   { manufacturer: 'Generic', magicqName: 'Moving Head Beam', mode: '16ch', dmxChannels: 16 },
    beam:     { manufacturer: 'Generic', magicqName: 'Moving Head Beam', mode: '20ch', dmxChannels: 20 },
    parled:   { manufacturer: 'Generic', magicqName: 'LED PAR',          mode: '7ch',  dmxChannels: 7  },
    parcob:   { manufacturer: 'Generic', magicqName: 'LED PAR COB',      mode: '6ch',  dmxChannels: 6  },
    ledStrobe:{ manufacturer: 'Generic', magicqName: 'LED Strobe',       mode: '5ch',  dmxChannels: 5  },
    blinder:  { manufacturer: 'Generic', magicqName: 'LED Blinder',      mode: '4ch',  dmxChannels: 4  },
    hazer:    { manufacturer: 'Generic', magicqName: 'Hazer',            mode: '2ch',  dmxChannels: 2  },
};

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

function generatePatchCSV(fixtures) {
    const headers = ['"No"', '"Name"', '"DMX"', '"Heads"', '"Manufacturer"', '"Name"', '"Mode"'];
    const rows = fixtures.map((fixture, index) => {
        const meta = FIXTURE_META[fixture.type] || {
            manufacturer: 'Generic', magicqName: fixture.type, mode: '1ch', dmxChannels: 1
        };
        const universe = fixture.universe || 1;
        const address = fixture.dmxAddress || 1;
        const dmx = `${universe}-${String(address).padStart(3, '0')}`;
        return [
            index + 1,
            `"${fixture.label || `${meta.magicqName} ${index + 1}`}"`,
            `"${dmx}"`,
            1,
            `"${meta.manufacturer}"`,
            `"${meta.magicqName}"`,
            `"${meta.mode}"`,
        ].join(',');
    });
    return [headers.join(','), ...rows].join('\r\n');
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { fixtures, magicqIp, showFolder, fileSlot = 1, noHeader = false } = req.body || {};

    if (!Array.isArray(fixtures) || fixtures.length === 0) {
        return res.status(400).json({ error: 'Fixtures array rỗng hoặc không hợp lệ' });
    }
    if (!magicqIp || typeof magicqIp !== 'string') {
        return res.status(400).json({ error: 'Thiếu hoặc sai định dạng magicqIp' });
    }
    if (!showFolder || typeof showFolder !== 'string') {
        return res.status(400).json({ error: 'Thiếu showFolder (đường dẫn thư mục show MagicQ)' });
    }

    // Basic IP validation to prevent SSRF
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(magicqIp)) {
        return res.status(400).json({ error: 'magicqIp không hợp lệ' });
    }

    // showFolder must be an absolute Windows/Linux path — block traversal attempts
    const normalizedFolder = path.normalize(showFolder);
    if (normalizedFolder.includes('..')) {
        return res.status(400).json({ error: 'showFolder không hợp lệ' });
    }

    try {
        const slot = Math.max(1, Math.min(9999, parseInt(fileSlot, 10) || 1));
        const slotStr = String(slot).padStart(4, '0');
        const csvPath = path.join(normalizedFolder, `import${slotStr}.csv`);

        const csvContent = generatePatchCSV(fixtures);

        // Write the CSV file — only possible when this server has access to showFolder
        if (!fs.existsSync(normalizedFolder)) {
            fs.mkdirSync(normalizedFolder, { recursive: true });
        }
        fs.writeFileSync(csvPath, csvContent, { encoding: 'utf8' });

        const command = `92,${slot}H`;
        const packet = noHeader ? buildRawPacket(command) : buildCREPPacket(command);
        await sendUDP(packet, magicqIp);

        res.json({
            ok: true,
            message: `Đã push ${fixtures.length} fixtures → MagicQ ${magicqIp}`,
            csvPath,
            command,
            fixtureCount: fixtures.length,
        });
    } catch (err) {
        console.error('[push-patch] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};
