const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')

// Official Server 2022 Languages and Optional Features media, linked by
// https://www.microsoft.com/en-us/evalcenter/evaluate-windows-server-2022
// Read only the en-US CAB extent, verified against the UDF directory and a
// Microsoft-signed copy. If Microsoft changes the media, fail closed.
const source = 'https://software-static.download.prss.microsoft.com/pr/download/20348.1.210507-1500.fe_release_amd64fre_SERVER_LOF_PACKAGES_OEM.iso'
const start = 3884476416
const size = 40382505
const sha256 = 'b02f56b1cf22867d66aa2ea02c347820c9ef6232e25c17938f041bb8df1d872b'

function verify(buffer) {
  if (buffer.length !== size || buffer.toString('ascii', 0, 4) !== 'MSCF' || createHash('sha256').update(buffer).digest('hex') !== sha256) {
    throw new Error('Server 2022 en-US CAB integrity verification failed.')
  }
}

async function main() {
  const destination = process.argv[2]
  if (!destination) throw new Error('Pass a destination CAB filename.')
  if (fs.existsSync(destination)) {
    verify(fs.readFileSync(destination))
    console.log(`Existing Microsoft CAB verified: ${destination}`)
    return
  }
  const expectedRange = `bytes ${start}-${start + size - 1}/6085509120`
  const response = await fetch(source, {
    headers: { Range: `bytes=${start}-${start + size - 1}`, 'Accept-Encoding': 'identity' },
    signal: AbortSignal.timeout(300000),
  })
  if (response.status !== 206 || response.headers.get('content-range') !== expectedRange || new URL(response.url).hostname !== new URL(source).hostname) {
    await response.body?.cancel()
    throw new Error('The Microsoft server did not return the expected CAB range. Full ISO download was refused.')
  }
  const chunks = []
  let received = 0
  for await (const chunk of response.body) {
    received += chunk.length
    if (received > size) throw new Error('Oversized response refused.')
    chunks.push(chunk)
  }
  const buffer = Buffer.concat(chunks)
  verify(buffer)
  fs.mkdirSync(path.dirname(path.resolve(destination)), { recursive: true })
  fs.writeFileSync(destination, buffer, { flag: 'wx' })
  console.log(`Microsoft Server 2022 en-US CAB verified: ${size} bytes; ${destination}`)
}

main().catch((error) => { console.error(error.message); process.exitCode = 1 })
