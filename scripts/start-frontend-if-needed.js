const net = require('net');
const { spawn } = require('child_process');

const PORT = Number(process.env.FRONTEND_PORT || 3000);
const HOST = process.env.FRONTEND_HOST || '127.0.0.1';

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
    console.log(`Frontend already running on http://${HOST}:${PORT}. Reusing existing instance.`);
    process.exit(0);
  }

  const child = spawn('npm', ['start'], {
    stdio: 'inherit',
    shell: true,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code || 0);
  });

  child.on('error', (err) => {
    console.error('Failed to start frontend process:', err.message);
    process.exit(1);
  });
})();
