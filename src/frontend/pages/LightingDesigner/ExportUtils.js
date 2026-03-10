// MagicQ & grandMA3 Export/Import Utilities
import { FIXTURE_TYPES, DEFAULT_FIXTURE } from './fixtureConfig';

/**
 * Format DMX address as "universe-address" with zero-padded address
 * e.g. universe=1, address=17 → "1-017"
 */
const formatDmxAddress = (universe, address) => {
    return `${universe}-${String(address).padStart(3, '0')}`;
};

// ─── MagicQ CSV Export ───────────────────────────────────────────────

/**
 * Export fixtures as MagicQ-compatible patch CSV
 * Downloads a file named magicq_patch.csv
 */
export const exportMagicQCSV = (fixtures) => {
    if (!fixtures || fixtures.length === 0) return false;

    const headers = ['"No"', '"Name"', '"DMX"', '"Heads"', '"Manufacturer"', '"Name"', '"Mode"'];
    const rows = fixtures.map((fixture, index) => {
        const config = FIXTURE_TYPES[fixture.type];
        if (!config) return null;

        const dmx = formatDmxAddress(fixture.universe || 1, fixture.dmxAddress || 1);

        return [
            index + 1,
            `"${fixture.label || `${config.name} ${index + 1}`}"`,
            `"${dmx}"`,
            1,
            `"${config.manufacturer}"`,
            `"${config.magicqName}"`,
            `"${config.mode}"`,
        ].join(',');
    }).filter(Boolean);

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadFile(csvContent, 'magicq_patch.csv', 'text/csv;charset=utf-8;');
    return true;
};

// ─── grandMA3 CSV Export ─────────────────────────────────────────────

/**
 * Export fixtures as grandMA3-compatible CSV for import via "Import" dialog.
 * Columns match the gMA3 patch import format:
 *   FixtureID, Name, FixtureType, Mode, DMX Universe, DMX Address, Channels
 */
export const exportGrandMA3CSV = (fixtures) => {
    if (!fixtures || fixtures.length === 0) return false;

    const headers = [
        '"FixtureID"',
        '"Name"',
        '"FixtureType"',
        '"Mode"',
        '"DMX Universe"',
        '"DMX Address"',
        '"Channels"',
    ];

    const rows = fixtures.map((fixture, index) => {
        const config = FIXTURE_TYPES[fixture.type];
        if (!config) return null;

        return [
            index + 1,
            `"${fixture.label || `${config.name} ${index + 1}`}"`,
            `"${config.gma3Type || config.name}"`,
            `"${config.gma3Mode || config.mode}"`,
            fixture.universe || 1,
            fixture.dmxAddress || 1,
            config.dmxChannels,
        ].join(',');
    }).filter(Boolean);

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadFile(csvContent, 'grandma3_patch.csv', 'text/csv;charset=utf-8;');
    return true;
};

// ─── JSON Project Export ─────────────────────────────────────────────

/**
 * Export the entire project state as a JSON file that can be re-imported.
 * This is the "universal" project format for this web tool.
 */
export const exportProjectJSON = (sceneName, fixtures, venueSettings) => {
    const project = {
        version: 1,
        exportedAt: new Date().toISOString(),
        sceneName: sceneName || 'Untitled',
        venueSettings: {
            venueName: venueSettings?.venueName || '',
            venueWidth: venueSettings?.venueWidth || 20,
            venueHeight: venueSettings?.venueHeight || 15,
        },
        fixtures: fixtures.map((f) => ({
            type: f.type,
            label: f.label,
            x: f.x,
            y: f.y,
            rotation: f.rotation,
            panAngle: f.panAngle,
            tiltAngle: f.tiltAngle,
            dmxAddress: f.dmxAddress,
            universe: f.universe,
            group: f.group,
            posZ: f.posZ,
            rot3dX: f.rot3dX,
            rot3dY: f.rot3dY,
            rot3dZ: f.rot3dZ,
        })),
    };

    const json = JSON.stringify(project, null, 2);
    downloadFile(json, `${(sceneName || 'lighting_project').replace(/\s+/g, '_')}.json`, 'application/json');
    return true;
};

// ─── CSV Import ──────────────────────────────────────────────────────

/**
 * Parse a CSV string (MagicQ or gMA3 style) and return an array of fixture objects.
 * Attempts to auto-detect format by checking header names.
 */
export const importFromCSV = (csvContent) => {
    const lines = csvContent.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return { error: 'File CSV trống hoặc không đủ dữ liệu', fixtures: [] };

    // Parse header
    const rawHeaders = parseCSVLine(lines[0]);
    const headers = rawHeaders.map((h) => h.replace(/"/g, '').trim().toLowerCase());

    // Auto-detect format
    const isGMA3 = headers.includes('fixtureid') || headers.includes('fixturetype');
    const isMagicQ = headers.includes('dmx') || headers.includes('heads');

    const fixtures = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]).map((v) => v.replace(/"/g, '').trim());
        if (values.length < 3) continue;

        let fixture;
        if (isGMA3) {
            fixture = parseGMA3Row(headers, values, i);
        } else if (isMagicQ) {
            fixture = parseMagicQRow(headers, values, i);
        } else {
            // Fallback: try generic parse
            fixture = parseGenericRow(headers, values, i);
        }

        if (fixture) fixtures.push(fixture);
    }

    return {
        format: isGMA3 ? 'grandMA3' : isMagicQ ? 'MagicQ' : 'Generic',
        fixtures,
        error: fixtures.length === 0 ? 'Không tìm thấy fixture hợp lệ trong file' : null,
    };
};

/**
 * Import a JSON project file.
 */
export const importProjectJSON = (jsonContent) => {
    try {
        const project = JSON.parse(jsonContent);
        if (!project.fixtures || !Array.isArray(project.fixtures)) {
            return { error: 'File JSON không hợp lệ — thiếu danh sách fixtures', fixtures: [] };
        }

        const uid = () => `f_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const fixtures = project.fixtures.map((f) => ({
            ...DEFAULT_FIXTURE,
            ...f,
            id: uid(),
        }));

        return {
            format: 'JSON Project',
            sceneName: project.sceneName || 'Imported',
            venueSettings: project.venueSettings || null,
            fixtures,
            error: null,
        };
    } catch (err) {
        return { error: `Lỗi parse JSON: ${err.message}`, fixtures: [] };
    }
};

// ─── Internal helpers ────────────────────────────────────────────────

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}

/**
 * Map a fixture name (from CSV) back to a known type key in FIXTURE_TYPES.
 */
function resolveFixtureType(name) {
    const lower = (name || '').toLowerCase();
    for (const [key, config] of Object.entries(FIXTURE_TYPES)) {
        if (
            lower.includes(key) ||
            lower.includes(config.name.toLowerCase()) ||
            lower.includes(config.magicqName.toLowerCase()) ||
            lower.includes((config.gma3Type || '').toLowerCase())
        ) {
            return key;
        }
    }
    // Keyword heuristics
    if (lower.includes('beam') || lower.includes('spot')) return 'beam';
    if (lower.includes('par') && lower.includes('cob')) return 'parcob';
    if (lower.includes('par')) return 'parled';
    if (lower.includes('strobe') || lower.includes('chớp')) return 'ledStrobe';
    if (lower.includes('blind')) return 'blinder';
    if (lower.includes('haz') || lower.includes('fog') || lower.includes('khói')) return 'hazer';
    if (lower.includes('moving') || lower.includes('katana')) return 'katana';
    return 'parled'; // safe default
}

function parseGMA3Row(headers, values, rowIndex) {
    const get = (key) => values[headers.indexOf(key)] || '';
    const uid = () => `f_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const typeName = get('fixturetype') || get('type') || '';
    const type = resolveFixtureType(typeName);

    return {
        id: uid(),
        type,
        label: get('name') || `Import ${rowIndex}`,
        dmxAddress: parseInt(get('dmx address') || get('address') || '1', 10) || 1,
        universe: parseInt(get('dmx universe') || get('universe') || '1', 10) || 1,
        x: 100 + (rowIndex - 1) * 60,
        y: 100,
        ...DEFAULT_FIXTURE,
    };
}

function parseMagicQRow(headers, values, rowIndex) {
    const get = (key) => values[headers.indexOf(key)] || '';
    const uid = () => `f_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const name = get('name') || `Import ${rowIndex}`;
    const dmxRaw = get('dmx') || '1-001';

    let universe = 1;
    let address = 1;
    if (dmxRaw.includes('-')) {
        const parts = dmxRaw.split('-');
        universe = parseInt(parts[0], 10) || 1;
        address = parseInt(parts[1], 10) || 1;
    } else {
        address = parseInt(dmxRaw, 10) || 1;
    }

    // Attempt to resolve type from the second "Name" column (manufacturer fixture name)
    const mfgName = values[5] || values[4] || name;
    const type = resolveFixtureType(mfgName);

    return {
        id: uid(),
        type,
        label: name,
        dmxAddress: address,
        universe,
        x: 100 + (rowIndex - 1) * 60,
        y: 100,
        ...DEFAULT_FIXTURE,
    };
}

function parseGenericRow(headers, values, rowIndex) {
    const uid = () => `f_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return {
        id: uid(),
        type: resolveFixtureType(values[1] || values[0] || ''),
        label: values[1] || values[0] || `Import ${rowIndex}`,
        dmxAddress: parseInt(values[2], 10) || 1,
        universe: 1,
        x: 100 + (rowIndex - 1) * 60,
        y: 100,
        ...DEFAULT_FIXTURE,
    };
}

// ─── File download helper ────────────────────────────────────────────

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
