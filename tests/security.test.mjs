import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync, execFile } from 'node:child_process'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { sanitizeArticleHtml, serializeJsonLd } from '../src/lib/sanitize-article-html.ts'
import { isTrustedRequestOrigin } from '../src/lib/request-origin.ts'
import { isCredentialError, summarizeAuthError } from '../src/lib/auth-errors.ts'

test('authentication distinguishes credential failures from infrastructure errors without logging secrets', () => {
  for (const name of ['AuthenticationError', 'LockedAuth', 'UnverifiedEmail']) {
    const error = new Error('private account details')
    error.name = name
    assert.equal(isCredentialError(error), true)
  }
  const cause = Object.assign(new Error('SQL password=do-not-print'), { code: '42703' })
  const error = new Error('Query parameters: do-not-print', { cause })
  assert.equal(isCredentialError(error), false)
  assert.deepEqual(summarizeAuthError(error), [{name:'Error'}, {name:'Error', code:'42703'}])
  assert.doesNotMatch(JSON.stringify(summarizeAuthError(error)), /do-not-print|password|Query/)
  assert.equal(isCredentialError({name:'AuthenticationError'}), false)
})

test('article HTML removes executable markup and unsafe URLs', () => {
  const html = sanitizeArticleHtml('<script>alert(1)</script><img src="/cover.png" onerror="alert(1)"><a href="javascript:alert(1)">link</a><svg onload="alert(1)"></svg><iframe srcdoc="<script>alert(1)</script>" src="https://evil.example"></iframe>')
  assert.doesNotMatch(html, /<script|onerror|onload|javascript:|<svg|srcdoc|evil\.example/i)
  assert.match(html, /src="\/cover.png"/)
})

test('articles keep formatting, galleries, SEO notes and approved embeds', () => {
  const html = sanitizeArticleHtml('<h2>Title</h2><section class="cms-article-gallery"><img src="/api/public/media/1" alt="Cover"></section><aside class="cms-article-seo-note">SEO title: Test</aside><p style="text-align:center;background-image:url(https://evil.example)">Text</p><iframe src="https://www.youtube-nocookie.com/embed/abc" allowfullscreen></iframe><a href="https://example.com" target="_blank">Read</a>')
  assert.match(html, /cms-article-gallery/)
  assert.match(html, /cms-article-seo-note/)
  assert.match(html, /text-align:center/)
  assert.match(html, /src="https:\/\/www.youtube-nocookie.com\/embed\/abc"/)
  assert.match(html, /rel="noopener noreferrer"/)
  assert.doesNotMatch(html, /background-image|evil\.example/)
  assert.equal(sanitizeArticleHtml(html), html)
})

test('iframe host restrictions reject deceptive domains and non-HTTPS sources', () => {
  for (const src of ['https://www.youtube.com.evil.example/embed/x', 'http://www.youtube.com/embed/x', '//www.youtube.com/embed/x', '/untrusted-embed']) {
    assert.doesNotMatch(sanitizeArticleHtml(`<iframe src="${src}"></iframe>`), /\bsrc=/)
  }
})

test('JSON-LD cannot escape its script element', () => {
  const value = { headline: '</script><script>alert(1)</script>' }
  const encoded = serializeJsonLd(value)
  assert.doesNotMatch(encoded, /</)
  assert.deepEqual(JSON.parse(encoded), value)
})

test('production origin checks reject foreign, missing and spoofed origins', () => {
  const previousNodeEnv = process.env.NODE_ENV
  const previousTrust = process.env.TRUST_PROXY_HEADERS
  process.env.NODE_ENV = 'production'
  process.env.TRUST_PROXY_HEADERS = 'false'
  try {
    const headers = new Headers({ host: '9lifemag.com', origin: 'https://9lifemag.com' })
    assert.equal(isTrustedRequestOrigin(headers, 'https'), true)
    headers.set('origin', 'https://evil.example')
    assert.equal(isTrustedRequestOrigin(headers, 'https'), false)
    headers.delete('origin')
    assert.equal(isTrustedRequestOrigin(headers, 'https'), false)
    headers.set('origin', 'https://9lifemag.com')
    headers.set('x-forwarded-proto', 'https')
    assert.equal(isTrustedRequestOrigin(headers, 'http'), false)
    process.env.TRUST_PROXY_HEADERS = 'true'
    assert.equal(isTrustedRequestOrigin(headers, 'http'), true)
    headers.set('origin', 'null')
    assert.equal(isTrustedRequestOrigin(headers, 'http'), false)
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = previousNodeEnv
    if (previousTrust === undefined) delete process.env.TRUST_PROXY_HEADERS
    else process.env.TRUST_PROXY_HEADERS = previousTrust
  }
})

test('deployment backup skips file storage and fails closed for unbacked Payload databases', () => {
  const directory = mkdtempSync(path.join(tmpdir(), '9life-backup-test-'))
  const helper = fileURLToPath(new URL('../scripts/backup-postgres.cjs', import.meta.url))
  const env = { ...process.env, SITE_USER_STORAGE_DRIVER: 'file', PAYLOAD_DROP_DATABASE: 'false' }
  try {
    const run = () => spawnSync(process.execPath, [helper, directory, '-', path.join(directory, 'backup.dump')], { env, encoding: 'utf8', windowsHide: true })
    assert.equal(run().status, 0)
    env.SITE_USER_STORAGE_DRIVER = 'payload'
    env.DATABASE_URI = 'postgres://example:do-not-log-this@localhost/example'
    const missingBackup = run()
    assert.notEqual(missingBackup.status, 0)
    assert.doesNotMatch(missingBackup.stderr, /do-not-log-this/)
    env.SITE_USER_STORAGE_DRIVER = 'file'
    env.PAYLOAD_DROP_DATABASE = 'true'
    assert.notEqual(run().status, 0)
    env.PAYLOAD_DROP_DATABASE = 'false'
    writeFileSync(path.join(directory, '.env.local'), 'SITE_USER_STORAGE_DRIVER=payload\n')
    assert.equal(run().status, 0, 'the process environment must take precedence over dotenv')
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('PM2 metadata preserves case-colliding Windows environment keys as rows', () => {
  const helper = fileURLToPath(new URL('../scripts/read-pm2-process.cjs', import.meta.url))
  const input = JSON.stringify([
    { name: 'other-site', pm2_env: { env: { secret: 'unrelated-secret' } } },
    { name: '9life-mag', pid: 123, pm2_env: {
      exec_interpreter: 'node', pm_exec_path: 'C:\\app\\server.js', status: 'online',
      username: 'Administrator', USERNAME: 'Administrator',
      env: { username: 'Administrator', USERNAME: 'Administrator', Path: 'a', PATH: 'b' },
    } },
  ])
  const result = spawnSync(process.execPath, [helper], { input, encoding: 'utf8', windowsHide: true })
  assert.equal(result.status, 0)
  const [selectedProcess] = JSON.parse(result.stdout)
  assert.equal(selectedProcess.pid, 123)
  assert.deepEqual(selectedProcess.environment.map((entry) => entry.name), ['username', 'USERNAME', 'Path', 'PATH'])
  assert.doesNotMatch(result.stdout, /unrelated-secret/)
})

test('release checks reject a broken database even when the homepage returns 200', async () => {
  let articleStatus = 500
  const server = createServer((request, response) => {
    if (request.method === 'POST') { response.writeHead(403); response.end('{}'); return }
    if (request.url === '/') { response.end('<a href="https://hitclub26.net">hitclub</a>'); return }
    response.setHeader('Content-Type', 'application/json')
    if (request.url === '/api/health') { response.end(JSON.stringify({ status: 'ok', version: '0.1.1' })); return }
    response.writeHead(articleStatus)
    response.end(JSON.stringify({ ok: articleStatus === 200, articles: [] }))
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const checker = fileURLToPath(new URL('../scripts/check-release.mjs', import.meta.url))
  const run = () => promisify(execFile)(process.execPath, [checker, `http://127.0.0.1:${server.address().port}`], { windowsHide: true })
  try {
    await assert.rejects(run(), /Article database query must succeed/)
    articleStatus = 200
    const success = await run()
    assert.match(success.stdout, /Release checks passed/)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('VPS auth diagnostics reveal the CMS OTP only when explicitly requested', () => {
  const directory = mkdtempSync(path.join(tmpdir(), '9life-auth-diagnostic-'))
  const helper = fileURLToPath(new URL('../scripts/diagnose-auth-vps.cjs', import.meta.url))
  const preload = path.join(directory, 'offline-fetch.cjs')
  writeFileSync(preload, "global.fetch = async () => new Response(JSON.stringify({ok:false,message:'Invalid input'}), {status:400})")
  writeFileSync(path.join(directory, '.env.local'), 'CMS_ADMIN_OTP_CODE=001122\nSITE_SESSION_SECRET=do-not-print-session-secret\nCMS_ADMIN_PASSWORD=do-not-print-password\n')
  const errorLog = path.join(directory, 'error.log')
  writeFileSync(errorLog, 'SQL parameters: do-not-print-password\nerror: relation "users_sessions" does not exist\ncode: \'42P01\'\n')
  const input = JSON.stringify([{ name: '9life-mag', pm2_env: {
    pm_exec_path: path.join(directory, 'server.js'), status: 'online', exec_interpreter: 'node',
    pm_err_log_path: errorLog,
    env: { username: 'Administrator', USERNAME: 'Administrator' },
  } }])
  try {
    const run = (args) => spawnSync(process.execPath, ['--require', preload, helper, ...args], { input, encoding: 'utf8', windowsHide: true })
    const safe = run([])
    assert.equal(safe.status, 0)
    assert.match(safe.stdout, /"cmsOtpConfigured": true/)
    assert.match(safe.stdout, /42P01/)
    assert.match(safe.stdout, /users_sessions/)
    assert.doesNotMatch(safe.stdout, /001122|do-not-print/)
    const requested = run(['--show-cms-otp'])
    assert.equal(requested.status, 0)
    assert.match(requested.stdout, /CMS OTP.*001122/)
    assert.doesNotMatch(requested.stdout, /do-not-print/)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test('lottery recovery rejects unexpected PM2 paths before changing tasks', () => {
  const helper = fileURLToPath(new URL('../scripts/check-ketquaxsmb-pm2.cjs', import.meta.url))
  const config = {
    pm_exec_path: 'C:\\sites\\ketquaxsmb\\lottery-crawl-master\\index.mjs',
    pm_cwd: 'C:\\sites\\ketquaxsmb\\lottery-crawl-master',
    exec_interpreter: 'C:\\sites\\ketquaxsmb\\.runtime\\node-v24.22.3-win-x64\\node.exe',
    env: { username: 'Administrator', USERNAME: 'Administrator', secret: 'do-not-print' },
  }
  const run = () => spawnSync(process.execPath, [helper], { input: JSON.stringify([{name:'ketquaxsmb',pm2_env:config}]), encoding:'utf8', windowsHide:true })
  assert.equal(run().status, 0)
  config.pm_exec_path = 'C:\\sites\\other-app\\index.mjs'
  const rejected = run()
  assert.notEqual(rejected.status, 0)
  assert.doesNotMatch(rejected.stdout + rejected.stderr, /do-not-print/)
})
