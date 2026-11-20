const fs = require('node:fs')
const path = require('node:path').win32

const entries = JSON.parse(fs.readFileSync(0, 'utf8').replace(/^\uFEFF/, '')).filter((item) => item.name === 'ketquaxsmb')
if (entries.length !== 1) throw new Error('Expected exactly one ketquaxsmb PM2 entry.')
const config = entries[0].pm2_env
const matches = (value, expected) => typeof value === 'string' && path.resolve(value).toLowerCase() === expected.toLowerCase()
if (!matches(config.pm_exec_path, 'C:\\sites\\ketquaxsmb\\lottery-crawl-master\\index.mjs') ||
    !matches(config.pm_cwd, 'C:\\sites\\ketquaxsmb\\lottery-crawl-master') ||
    !matches(config.exec_interpreter, 'C:\\sites\\ketquaxsmb\\.runtime\\node-v24.22.3-win-x64\\node.exe')) {
  throw new Error('PM2 paths do not match the expected ketquaxsmb configuration.')
}
console.log('PM2 app paths and patched interpreter verified.')
