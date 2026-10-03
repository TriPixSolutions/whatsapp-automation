const { spawn } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const nextCli = require.resolve('next/dist/bin/next');
let stopping = false;
let desiredExitCode = 0;
let web;
let worker;

function finishWhenStopped() {
  if (!stopping) return;
  const stopped = [worker, web].every(child => !child || child.exitCode !== null);
  if (stopped) process.exit(desiredExitCode);
}

function start(name, command, args) {
  const child = spawn(command, args, {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
  });

  child.on('error', (error) => {
    console.error(`[Production] ${name} failed to start:`, error.message);
    shutdown('SIGTERM', 1);
  });

  child.on('exit', (code, signal) => {
    if (stopping) {
      finishWhenStopped();
      return;
    }
    console.error(`[Production] ${name} stopped unexpectedly (${signal || code || 0}).`);
    shutdown('SIGTERM', code || 1);
  });

  return child;
}

web = start('web process', process.execPath, [nextCli, 'start']);
worker = start('background worker', process.execPath, [path.join(root, 'worker', 'worker.js')]);

function shutdown(signal, exitCode = 0) {
  if (stopping) return;
  stopping = true;
  desiredExitCode = exitCode;

  for (const child of [worker, web]) {
    if (child && child.exitCode === null && !child.killed) child.kill(signal);
  }

  setTimeout(() => {
    for (const child of [worker, web]) {
      if (child && child.exitCode === null) child.kill('SIGKILL');
    }
    process.exit(exitCode);
  }, 10_000);
  finishWhenStopped();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
