const net = require('net');
const { spawn } = require('child_process');

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

(async () => {
  const inUse = await isPortOpen(PORT, HOST);

  if (inUse) {
    console.log(`Backend already running on http://${HOST}:${PORT}. Reusing existing instance.`);
    process.exit(0);
  }

  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npmCmd, ['--prefix', 'server', 'start'], {
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
