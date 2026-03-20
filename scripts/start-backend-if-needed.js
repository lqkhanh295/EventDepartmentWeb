const net = require('net');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.BACKEND_PORT || 3002);
const HOST = process.env.BACKEND_HOST || '127.0.0.1';

function isPortOpen(port, host, timeoutMs = 700) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;

    const done = (result) => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
    socket.connect(port, host);
  });
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const out = {};
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (!key) continue;

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    out[key] = value;
  }

  return out;
}

function loadBackendEnv() {
  const envLocalPath = path.join(process.cwd(), 'server', '.env.local');
  const envPath = path.join(process.cwd(), 'server', '.env');
  const localVars = parseEnvFile(envLocalPath);
  const defaultVars = parseEnvFile(envPath);
  return { ...defaultVars, ...localVars };
}

(async () => {
  const inUse = await isPortOpen(PORT, HOST);

  if (inUse) {
    console.log(`Backend already running on http://${HOST}:${PORT}. Reusing existing instance.`);
    process.exit(0);
  }

  const backendEnv = loadBackendEnv();
  for (const [key, value] of Object.entries(backendEnv)) {
    process.env[key] = String(value);
  }
  const child = process.platform === 'win32'
    ? spawn('cmd.exe', ['/d', '/s', '/c', 'npm --prefix server start'], {
        stdio: 'inherit',
        shell: false,
        windowsHide: false,
      })
    : spawn('npm', ['--prefix', 'server', 'start'], {
        stdio: 'inherit',
        shell: false,
        windowsHide: false,
      });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code || 0);
  });

  child.on('error', (err) => {
    console.error('Failed to start backend process:', err.message);
    process.exit(1);
  });
})();
