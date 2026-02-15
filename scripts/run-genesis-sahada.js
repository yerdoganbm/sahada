#!/usr/bin/env node
/**
 * Sahada uygulamasını Libero Quantum Genesis ile test et.
 * Varsayılan URL: http://localhost:3002 (Sahada dev server)
 * GENESIS_URL ve GENESIS_CHAOS env ile tam rapor alınır.
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const liberoQuantumPath = path.join(__dirname, '..', '..', '..', 'libero-quantum');
const url = process.env.SAHADA_URL || process.env.GENESIS_URL || 'http://localhost:3002';
const chaos = process.env.GENESIS_CHAOS || 'H';

const child = spawn('npx', ['ts-node', 'libero-universal.ts'], {
  cwd: liberoQuantumPath,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, GENESIS_URL: url, GENESIS_CHAOS: chaos },
});

child.on('exit', (code) => process.exit(code != null ? code : 0));
