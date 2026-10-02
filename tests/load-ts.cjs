const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
module.exports = function load(file, imports = {}, env = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(js, {
    module, exports: module.exports, require(id) {
      if (Object.hasOwn(imports, id)) return imports[id];
      if (id === "crypto") return require("node:crypto");
      if (id === "@/lib/meta/config" || (id === "./config" && file.includes("/meta/"))) return { META_GRAPH_VERSION: require("../shared/meta-config.cjs").graphVersion(env) };
      throw new Error(`Unexpected dependency ${id} in ${file}`);
    },
    process: { env, cwd: () => '/isolated-test' },
    console: { log() {}, warn() {}, error() {} },
    setTimeout: () => 0, clearTimeout() {}, Buffer, URL, TextEncoder, TextDecoder, atob,
    crypto: require('node:crypto').webcrypto,
  }, { filename: file });
  return module.exports;
};
