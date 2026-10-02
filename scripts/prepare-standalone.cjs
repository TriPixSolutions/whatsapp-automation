// Next standalone output does not include browser assets automatically.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const target = path.join(root, '.next', 'standalone');
if (fs.existsSync(target)) {
  for (const name of ['public', '.next/static']) {
    const source = path.join(root, name);
    if (fs.existsSync(source)) fs.cpSync(source, path.join(target, name), { recursive: true, force: true });
  }
}
