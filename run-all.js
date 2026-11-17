import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('========================================================');
console.log('🚀 AI CivicFix — Autonomous Full-Stack Platform');
console.log('========================================================');

const backendDir = path.join(__dirname, 'backend');
const frontendDir = path.join(__dirname, 'frontend');
const viteBin = path.join(frontendDir, 'node_modules', 'vite', 'bin', 'vite.js');

// 1. Launch Backend API Server
const backend = spawn(process.execPath, ['src/server.js'], {
  cwd: backendDir,
  stdio: 'inherit'
});

backend.on('error', (err) => {
  console.error('[Backend Error]:', err);
});

// 2. Launch Frontend Vite Dev Server
const frontend = spawn(process.execPath, [viteBin, '--host', '0.0.0.0', '--port', '3000'], {
  cwd: frontendDir,
  stdio: 'inherit'
});

frontend.on('error', (err) => {
  console.error('[Frontend Error]:', err);
});

const cleanup = () => {
  console.log('\nShutting down AI CivicFix services...');
  try { backend.kill(); } catch (e) {}
  try { frontend.kill(); } catch (e) {}
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
