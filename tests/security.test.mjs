import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { sanitizeArticleHtml, serializeJsonLd } from '../src/lib/sanitize-article-html.ts'
import { isTrustedRequestOrigin } from '../src/lib/request-origin.ts'

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
