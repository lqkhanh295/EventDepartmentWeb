/**
 * magicq.js — MagicQ LAN Push Utility
 *
 * Handles two tasks:
 *  1. Write the patch CSV to the MagicQ show folder
 *  2. Send a ChamSys Remote Ethernet Protocol (CREP) UDP packet telling MagicQ
 *     to execute command "92,<slot>H" = "load importXXXX.csv"
 *
 * Protocol reference:
 * https://docs.chamsys.co.uk/magicq/manual/remote_control_network.html
 * https://docs.chamsys.co.uk/magicq/manual/remote_control_commands.html
 *
 * CREP packet structure (little-endian):
 *   [0..3]  char[4]  magic = "CREP"
 *   [4..5]  uint16   version = 0
 *   [6]     uint8    seq_fwd (incrementing)
 *   [7]     uint8    seq_bkwd (last received, 0 for tx-only)
 *   [8..9]  uint16   data length
 *   [10+]   bytes    ASCII command
 *
 * MagicQ must have Setup → View Settings → Network → Ethernet Remote Protocol
 * set to "ChamSys Rem rx" or "ChamSys Rem (tx + rx no header)".
 * MagicQ PC/Mac requires a Wing/Interface to enable CREP.
 */

const dgram = require('dgram');
const fs = require('fs');
const path = require('path');

// CREP constants
const MAGICQ_UDP_PORT = 6553;
const CREP_MAGIC = Buffer.from('CREP', 'ascii');
let seqFwd = 0;

/**
 * Build a CREP UDP packet wrapping an ASCII command string.
 * @param {string} command  e.g. "92,1H"
 * @returns {Buffer}
 */
function buildCREPPacket(command) {
    const data = Buffer.from(command, 'ascii');
    const packet = Buffer.alloc(10 + data.length);

    // Magic "CREP" at bytes 0-3
    CREP_MAGIC.copy(packet, 0);
    // Version (uint16 LE) at bytes 4-5
    packet.writeUInt16LE(0, 4);
    // seq_fwd at byte 6
    packet.writeUInt8(seqFwd & 0xff, 6);
    seqFwd = (seqFwd + 1) & 0xff;
    // seq_bkwd at byte 7 (we don't listen, so 0)
    packet.writeUInt8(0, 7);
    // data length (uint16 LE) at bytes 8-9
    packet.writeUInt16LE(data.length, 8);
    // data payload
    data.copy(packet, 10);

    return packet;
}

/**
 * Build a "no-header" raw ASCII packet (for MagicQ set to "rx no header" mode).
 * Some setups skip the CREP header — this is the fallback.
 * @param {string} command
 * @returns {Buffer}
 */
function buildRawPacket(command) {
    return Buffer.from(command, 'ascii');
}

/**
 * Send a UDP packet to MagicQ
 * @param {Buffer} packet
 * @param {string} ip
 * @param {number} port
 * @returns {Promise<void>}
 */
function sendUDP(packet, ip, port = MAGICQ_UDP_PORT) {
    return new Promise((resolve, reject) => {
        const client = dgram.createSocket('udp4');
        client.send(packet, 0, packet.length, port, ip, (err) => {
            client.close();
            if (err) reject(err);
            else resolve();
        });
    });
}

/**
 * Generate MagicQ patch CSV content from fixture array
 * @param {Array} fixtures
 * @returns {string}  CSV content
 */
function generatePatchCSV(fixtures) {
    const FIXTURE_META = {
        katana:   { manufacturer: 'Generic', magicqName: 'Moving Head Beam', mode: '16ch', dmxChannels: 16 },
        beam:     { manufacturer: 'Generic', magicqName: 'Moving Head Beam', mode: '20ch', dmxChannels: 20 },
        parled:   { manufacturer: 'Generic', magicqName: 'LED PAR',          mode: '7ch',  dmxChannels: 7  },
        parcob:   { manufacturer: 'Generic', magicqName: 'LED PAR COB',      mode: '6ch',  dmxChannels: 6  },
        ledStrobe:{ manufacturer: 'Generic', magicqName: 'LED Strobe',       mode: '5ch',  dmxChannels: 5  },
        blinder:  { manufacturer: 'Generic', magicqName: 'LED Blinder',      mode: '4ch',  dmxChannels: 4  },
        hazer:    { manufacturer: 'Generic', magicqName: 'Hazer',            mode: '2ch',  dmxChannels: 2  },
    };

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

/**
 * Write patch CSV to the target file path
 * @param {string} filePath   Full path, e.g. C:\...\MagicQ\show\import0001.csv
 * @param {string} csvContent
 */
function writePatchFile(filePath, csvContent) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, csvContent, { encoding: 'utf8' });
}

/**
 * Main export: push fixtures to MagicQ
 *
 * @param {object} options
 * @param {Array}   options.fixtures      Array of fixture objects
 * @param {string}  options.magicqIp      IP of MagicQ machine (e.g. "192.168.1.100")
 * @param {string}  options.showFolder    Path to MagicQ show folder (e.g. "C:\...\MagicQ\show")
 * @param {number}  options.fileSlot      Slot 1-9999 → import0001.csv ... import9999.csv
 * @param {boolean} options.noHeader      If true, send raw ASCII instead of CREP (for "rx no header" mode)
 * @returns {Promise<{ csvPath: string, command: string }>}
 */
async function pushToMagicQ({ fixtures, magicqIp, showFolder, fileSlot = 1, noHeader = false }) {
    if (!fixtures || fixtures.length === 0) throw new Error('Không có fixture nào để push');
    if (!magicqIp) throw new Error('Thiếu IP của MagicQ');
    if (!showFolder) throw new Error('Thiếu đường dẫn show folder của MagicQ');

    const slot = Math.max(1, Math.min(9999, parseInt(fileSlot, 10) || 1));
    const slotStr = String(slot).padStart(4, '0');
    const fileName = `import${slotStr}.csv`;
    const csvPath = path.join(showFolder, fileName);

    // Step 1: Generate and write CSV
    const csvContent = generatePatchCSV(fixtures);
    writePatchFile(csvPath, csvContent);

    // Step 2: Send CREP UDP command "92,<slot>H" = load importXXXX.csv
    const command = `92,${slot}H`;
    const packet = noHeader ? buildRawPacket(command) : buildCREPPacket(command);
    await sendUDP(packet, magicqIp);

    return { csvPath, command, fixtureCount: fixtures.length };
}

/**
 * Simple ping — sends a no-op to test UDP reachability
 * MagicQ won't respond (UDP fire-and-forget) but we can at least
 * verify the socket opens and sends without error.
 * @param {string} ip
 * @param {boolean} noHeader
 */
async function pingMagicQ(ip, noHeader = false) {
    // Send a benign "get version" style empty packet — MagicQ ignores unknown commands
    const command = '0A'; // Activate playback 0 — harmless, MagicQ ignores invalid PB numbers
    const packet = noHeader ? buildRawPacket(command) : buildCREPPacket(command);
    await sendUDP(packet, ip);
    return true;
}

module.exports = { pushToMagicQ, pingMagicQ, generatePatchCSV };
