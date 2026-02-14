#!/usr/bin/env node
/**
 * LIBERO GENESIS v2.0 – CLI runner
 * npm run genesis veya npx libero-genesis (Libero Quantum'da bin tanımlıysa)
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const script = path.join(root, 'libero-universal.ts');

const child = spawn(
  process.execPath,
  ['-r', 'ts-node/register', script],
  { stdio: 'inherit', cwd: root, shell: process.platform === 'win32' }
);

child.on('exit', (code) => process.exit(code != null ? code : 0));
