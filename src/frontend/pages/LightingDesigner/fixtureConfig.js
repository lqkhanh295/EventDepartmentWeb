// Fixture type definitions for Lighting Designer
// All fixture types, colors, DMX channels, and MagicQ export mappings

export const FIXTURE_TYPES = {
    katana: {
        name: 'Katana',
        dmxChannels: 16,
        color: '#FF6B35',
        category: 'moving-head',
        manufacturer: 'Generic',
        magicqName: 'Moving Head Beam',
        mode: '16ch',
        gma3Type: 'Moving Light',
        gma3Mode: 'Mode1 16ch',
    },
    beam: {
        name: 'Beam',
        dmxChannels: 20,
        color: '#4ECDC4',
        category: 'moving-head',
        manufacturer: 'Generic',
        magicqName: 'Moving Head Beam',
        mode: '20ch',
        gma3Type: 'Moving Light',
        gma3Mode: 'Mode1 20ch',
    },
    parled: {
        name: 'Par LED',
        dmxChannels: 7,
        color: '#45B7D1',
        category: 'wash',
        manufacturer: 'Generic',
        magicqName: 'LED PAR',
        mode: '7ch',
        gma3Type: 'LED PAR',
        gma3Mode: '7ch',
    },
    parcob: {
        name: 'Par COB',
        dmxChannels: 6,
        color: '#96CEB4',
        category: 'wash',
        manufacturer: 'Generic',
        magicqName: 'LED PAR COB',
        mode: '6ch',
        gma3Type: 'LED PAR',
        gma3Mode: '6ch',
    },
    ledStrobe: {
        name: 'Chớp LED',
        dmxChannels: 5,
        color: '#FFEAA7',
        category: 'strobe',
        manufacturer: 'Generic',
        magicqName: 'LED Strobe',
        mode: '5ch',
        gma3Type: 'LED Strobe',
        gma3Mode: '5ch',
    },
    blinder: {
        name: 'Blinder',
        dmxChannels: 4,
        color: '#DDA0DD',
        category: 'blinder',
        manufacturer: 'Generic',
        magicqName: 'LED Blinder',
        mode: '4ch',
        gma3Type: 'LED Blinder',
        gma3Mode: '4ch',
    },
    hazer: {
        name: 'Khói',
        dmxChannels: 2,
        color: '#B0C4DE',
        category: 'atmosphere',
        manufacturer: 'Generic',
        magicqName: 'Hazer',
        mode: '2ch',
        gma3Type: 'Hazer',
        gma3Mode: '2ch',
    },
};

// Category labels for grouping
export const CATEGORIES = {
    'moving-head': 'Moving Head',
    wash: 'Wash',
    strobe: 'Strobe',
    blinder: 'Blinder',
    atmosphere: 'Atmosphere',
};

// Canvas defaults
export const CANVAS_DEFAULTS = {
    width: 800,
    height: 600,
    gridSize: 50,
    background: '#1a1a2e',
};

// Gemini system prompt for AI generation
export const GEMINI_SYSTEM_PROMPT = `
You are a professional lighting designer AI for live events.
Given a user request, generate a stage lighting layout.
Return ONLY valid JSON, no markdown, no explanation:
{
  "sceneName": "string",
  "description": "string (in Vietnamese)",
  "fixtures": [
    {
      "id": "unique_string",
      "type": "katana|beam|parled|parcob|ledStrobe|blinder|hazer",
      "x": number (50-750, canvas x position),
      "y": number (50-550, canvas y position),
      "rotation": number (0-360),
      "panAngle": number (-180 to 180),
      "tiltAngle": number (-90 to 90),
      "label": "string",
      "dmxAddress": number (1-512),
      "universe": number (1-4),
      "group": "string"
    }
  ]
}
Rules:
- Moving heads (katana, beam): place at top area (y: 50-150), spaced evenly
- Blinders: place at bottom facing audience (y: 480-540)
- Par LEDs: distribute as wash along sides and top
- Hazers: place at corners or back
- Assign DMX addresses sequentially with no overlaps
- Spread fixtures across the full width evenly
- Label fixtures with type + number (e.g. "Katana 1", "Beam 3")
- Ensure the output is a SINGLE, VALID JSON object. No trailing commas, no extra text.
`;

// Default fixture values when creating a new fixture
export const DEFAULT_FIXTURE = {
    rotation: 0,
    panAngle: 0,
    tiltAngle: 0,
    dmxAddress: 1,
    universe: 1,
    group: '',
};
