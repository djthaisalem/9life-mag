import assert from 'node:assert/strict'

const baseUrl = process.argv[2] || 'http://127.0.0.1:4000'
const healthResponse = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(10000) })
assert.equal(healthResponse.status, 200)
const health = await healthResponse.json()
assert.equal(health.status, 'ok')
assert.equal(health.version, '0.1.1')
const page = await fetch(baseUrl, { signal: AbortSignal.timeout(20000) })
assert.equal(page.status, 200)
const html = await page.text()
assert.match(html, /href="https:\/\/hitclub26\.net\/?"/)
assert.doesNotMatch(html, /href="https:\/\/hiitclub\.org\/?"/)

for (const route of ['/api/content-votes', '/api/cms/articles', '/api/cms/articles/upload', '/cms/api/music/upload']) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: 'POST',
    headers: { origin: 'https://untrusted.example', 'content-type': 'application/json' },
    body: '{}',
    signal: AbortSignal.timeout(10000),
  })
  assert.equal(response.status, 403, `${route} must reject a foreign origin`)
  await response.text()
}
console.log('Release checks passed: version, homepage, footer, CMS aliases and vote origin guards.')
