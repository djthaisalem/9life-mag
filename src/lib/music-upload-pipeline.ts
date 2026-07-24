import 'server-only'

import { CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { spawn } from 'child_process'
import { createReadStream, createWriteStream, promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'crypto'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import { loadPayloadClient } from '@/lib/payload-runtime'

const ALLOWED_AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.flac', '.m4a', '.aac'])
const DEFAULT_MAX_UPLOAD_MB = 1024
const MUSIC_METADATA_URL = 'https://9lifemag.com/music'
const DEFAULT_COVER_KEY = 'music/covers/default-music-cover.png'

function toSafeObjectMetadata(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7e]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 512)
}

type MusicUploadInput = {
  title: string
  type: 'track' | 'nonstop' | 'remix'
  genre: string
  artistSlug: string
  access: 'public' | 'stars' | 'premium' | 'internal'
  displayMap: string
  albumLabel: string
  visibility: 'draft' | 'pending' | 'public' | 'hidden'
  audio: File
}

type DirectMusicUploadInput = Omit<MusicUploadInput, 'audio'> & {
  fileName: string
  fileSize: number
  contentType: string
  uploadedBy: string
}

type DirectMusicUploadTicket = DirectMusicUploadInput & {
  musicCode: string
  uploadId: string
  sourceKey: string
  masterKey: string
  expiresAt: number
}

function getR2Client() {
  const endpoint = process.env.R2_ENDPOINT?.trim()
  const bucket = process.env.R2_BUCKET?.trim()
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error('r2_music_pipeline_not_configured')
  }

  return {
    bucket,
    client: new S3Client({
      endpoint,
      region: 'auto',
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    }),
  }
}

function getMaxUploadBytes() {
  const configured = Number(process.env.MUSIC_MAX_UPLOAD_MB ?? DEFAULT_MAX_UPLOAD_MB)
  const megabytes = Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_MAX_UPLOAD_MB
  return megabytes * 1024 * 1024
}

function validateUploadFile(fileName: string, fileSize: number, contentType: string) {
  const extension = path.extname(fileName).toLowerCase()
  if (!ALLOWED_AUDIO_EXTENSIONS.has(extension) || (contentType && !contentType.startsWith('audio/'))) {
    throw new Error('unsupported_audio_format')
  }
  if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > getMaxUploadBytes()) {
    throw new Error('audio_file_size_invalid')
  }
  return extension
}

function ticketSecret() {
  const secret = process.env.CMS_SESSION_SECRET?.trim() || process.env.PAYLOAD_SECRET?.trim()
  if (!secret) throw new Error('cms_upload_ticket_secret_missing')
  return secret
}

function signDirectUploadTicket(ticket: DirectMusicUploadTicket) {
  const payload = Buffer.from(JSON.stringify(ticket)).toString('base64url')
  const signature = createHmac('sha256', ticketSecret()).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

function readDirectUploadTicket(token: string) {
  const [payload, signature] = token.split('.')
  if (!payload || !signature) throw new Error('direct_upload_ticket_invalid')
  const expected = createHmac('sha256', ticketSecret()).update(payload).digest('base64url')
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    throw new Error('direct_upload_ticket_invalid')
  }
  const ticket = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as DirectMusicUploadTicket
  if (!ticket.expiresAt || ticket.expiresAt < Date.now()) throw new Error('direct_upload_ticket_expired')
  return ticket
}

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

function toSlug(value: string) {
  const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, (character) => character === 'đ' ? 'd' : 'D')
  return normalized.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 72) || 'untitled-track'
}

function fileStem(title: string, musicCode: string) {
  return `${toSlug(title)}-${musicCode}`
}

function runProcess(command: string, args: string[]) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => { stdout += chunk.toString() })
    child.stderr.on('data', (chunk) => { stderr += chunk.toString() })
    child.on('error', (error) => reject(new Error(`${command}_unavailable:${error.message}`)))
    child.on('close', (code) => {
      if (code === 0) return resolve(stdout)
      reject(new Error(`${command}_failed:${stderr.slice(-1200)}`))
    })
  })
}

async function readDurationSeconds(filePath: string) {
  const output = await runProcess(process.env.FFPROBE_PATH?.trim() || 'ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', filePath,
  ])
  const duration = Number.parseFloat(output.trim())
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('audio_duration_not_found')
  return duration
}

async function createPreview(sourcePath: string, previewPath: string, title: string, musicCode: string) {
  await runProcess(process.env.FFMPEG_PATH?.trim() || 'ffmpeg', [
    '-y', '-i', sourcePath, '-vn', '-map', 'a:0', '-map_metadata', '-1', '-c:a', 'libmp3lame', '-b:a', '256k', '-ar', '44100', '-ac', '2',
    '-metadata', `title=${title}`, '-metadata', `comment=${MUSIC_METADATA_URL}`, '-metadata', `website=${MUSIC_METADATA_URL}`,
    '-metadata', `description=9LIFE MAG music code ${musicCode}`, previewPath,
  ])
}

async function createDownloadMaster(sourcePath: string, outputPath: string, title: string, musicCode: string) {
  await runProcess(process.env.FFMPEG_PATH?.trim() || 'ffmpeg', [
    '-y', '-i', sourcePath, '-vn', '-map', 'a:0', '-map_metadata', '-1', '-c:a', 'copy',
    '-metadata', `title=${title}`, '-metadata', `comment=${MUSIC_METADATA_URL}`, '-metadata', `website=${MUSIC_METADATA_URL}`,
    '-metadata', `description=9LIFE MAG music code ${musicCode}`, outputPath,
  ])
}

async function uploadR2Object(client: S3Client, bucket: string, key: string, filePath: string, contentType: string) {
  const fileSize = (await fs.stat(filePath)).size
  if (fileSize < 5 * 1024 * 1024) {
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: createReadStream(filePath), ContentType: contentType }))
    return
  }

  await new Upload({ client, params: { Bucket: bucket, Key: key, Body: createReadStream(filePath), ContentType: contentType } }).done()
}

function trackTypeFromUploadType(type: MusicUploadInput['type']) {
  if (type === 'nonstop') return 'nonstop'
  if (type === 'remix') return 'remix'
  return 'single'
}

async function createUniqueMusicCode() {
  const payload = await loadPayloadClient()

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = String(randomInt(100000, 1_000_000))
    const existing = await payload.find({
      collection: 'tracks',
      where: { musicCode: { equals: code } },
      limit: 1,
      depth: 0,
      pagination: false,
    })

    if (existing.docs.length === 0) return code
  }

  throw new Error('music_code_generation_failed')
}

async function uploadDefaultCover(client: S3Client, bucket: string) {
  const coverPath = path.join(process.cwd(), 'public', 'images', 'default-music-cover.png')
  await fs.access(coverPath)
  await uploadR2Object(client, bucket, DEFAULT_COVER_KEY, coverPath, 'image/png')
  return DEFAULT_COVER_KEY
}

function toTrackRecord(input: Pick<MusicUploadInput, 'title' | 'type' | 'genre' | 'artistSlug' | 'access' | 'displayMap' | 'albumLabel' | 'visibility'>, values: {
  uploadId: string
  musicCode: string
  durationSeconds: number
  coverR2Key: string
  playbackKey: string
  masterKey: string
  sourceFormat: string
}) {
  return {
    title: input.title.trim(),
    slug: `${toSlug(input.title)}-${values.uploadId.slice(0, 8)}`,
    musicCode: values.musicCode,
    coverR2Key: values.coverR2Key,
    trackType: trackTypeFromUploadType(input.type),
    durationLabel: formatDuration(values.durationSeconds),
    durationSeconds: Math.round(values.durationSeconds),
    previewR2Key: values.playbackKey,
    masterR2Key: values.masterKey,
    sourceFormat: values.sourceFormat,
    submittedArtistSlug: input.artistSlug.trim(),
    genreLabel: input.genre.trim(),
    albumLabel: input.albumLabel.trim(),
    accessLevel: input.access,
    displayMap: input.displayMap.trim(),
    visibility: input.visibility,
    isPublic: input.visibility === 'public',
    requiresLoginToDownload: true,
    status: input.visibility === 'public' ? 'published' : 'draft',
  }
}

export async function prepareDirectMp3Upload(input: DirectMusicUploadInput) {
  const extension = validateUploadFile(input.fileName, input.fileSize, input.contentType)
  if (extension !== '.mp3') throw new Error('direct_upload_requires_mp3')

  const musicCode = await createUniqueMusicCode()
  const uploadId = randomUUID()
  const namedFile = fileStem(input.title, musicCode)
  const keyBase = `${new Date().getUTCFullYear()}/${namedFile}-${uploadId}`
  const ticket: DirectMusicUploadTicket = {
    ...input,
    musicCode,
    uploadId,
    sourceKey: `music/incoming/${keyBase}.mp3`,
    masterKey: `music/master/${keyBase}.mp3`,
    expiresAt: Date.now() + 60 * 60 * 1000,
  }
  const { client, bucket } = getR2Client()
  const uploadUrl = await getSignedUrl(client, new PutObjectCommand({
    Bucket: bucket,
    Key: ticket.sourceKey,
    ContentType: input.contentType || 'audio/mpeg',
  }), { expiresIn: 60 * 60 })

  return { uploadUrl, ticket: signDirectUploadTicket(ticket), musicCode }
}

export async function completeDirectMp3Upload(ticketToken: string, uploadedBy: string, durationSeconds: number) {
  const ticket = readDirectUploadTicket(ticketToken)
  if (ticket.uploadedBy !== uploadedBy) throw new Error('direct_upload_ticket_invalid')
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 24 * 60 * 60) {
    throw new Error('audio_duration_not_found')
  }

  const { client, bucket } = getR2Client()
  const source = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: ticket.sourceKey }))
  if (!source.ContentLength || source.ContentLength !== ticket.fileSize) throw new Error('direct_upload_missing_file')

  const coverR2Key = await uploadDefaultCover(client, bucket)
  let copiedMaster = false
  try {
    await client.send(new CopyObjectCommand({
      Bucket: bucket,
      Key: ticket.masterKey,
      CopySource: `${bucket}/${ticket.sourceKey.split('/').map(encodeURIComponent).join('/')}`,
      ContentType: ticket.contentType || 'audio/mpeg',
      MetadataDirective: 'REPLACE',
      Metadata: {
        // S3 metadata becomes HTTP headers, which must stay ASCII-only.
        title: toSafeObjectMetadata(ticket.title) || '9LIFE MAG',
        website: MUSIC_METADATA_URL,
        musiccode: ticket.musicCode,
      },
    }))
    copiedMaster = true

    const payload = await loadPayloadClient()
    const track = await payload.create({
      collection: 'tracks',
      data: toTrackRecord(ticket, {
        uploadId: ticket.uploadId,
        musicCode: ticket.musicCode,
        durationSeconds,
        coverR2Key,
        playbackKey: ticket.masterKey,
        masterKey: ticket.masterKey,
        sourceFormat: 'MP3',
      }),
      depth: 0,
    }) as { id: string; slug?: string }

    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: ticket.sourceKey }))
    return {
      trackId: String(track.id),
      slug: track.slug ?? '',
      musicCode: ticket.musicCode,
      durationSeconds: Math.round(durationSeconds),
      durationLabel: formatDuration(durationSeconds),
      previewKey: ticket.masterKey,
      masterKey: ticket.masterKey,
      coverR2Key,
    }
  } catch (error) {
    if (copiedMaster) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: ticket.masterKey })).catch(() => undefined)
    }
    throw error
  }
}

export async function processMusicUpload(input: MusicUploadInput) {
  const extension = validateUploadFile(input.audio.name, input.audio.size, input.audio.type)
  const shouldCreatePreview = extension !== '.mp3'

  const tempBase = process.env.MUSIC_TEMP_DIR?.trim() || os.tmpdir()
  await fs.mkdir(tempBase, { recursive: true })
  const tempDir = await fs.mkdtemp(path.join(tempBase, '9life-music-'))
  const uploadId = randomUUID()
  let musicCode = ''
  try {
    musicCode = await createUniqueMusicCode()
  } catch (error) {
    await fs.rm(tempDir, { recursive: true, force: true })
    throw error
  }
  const sourcePath = path.join(tempDir, `source${extension}`)
  const namedFile = fileStem(input.title, musicCode)
  const masterPath = path.join(tempDir, `${namedFile}${extension}`)
  const previewPath = path.join(tempDir, 'preview.mp3')
  const keyBase = `${new Date().getUTCFullYear()}/${namedFile}-${uploadId}`
  const previewKey = `music/preview/${keyBase}.mp3`
  const masterKey = `music/master/${keyBase}${extension}`
  let uploadedPreview = false
  let uploadedMaster = false

  try {
    await pipeline(Readable.fromWeb(input.audio.stream() as never), createWriteStream(sourcePath, { flags: 'wx' }))
    const durationSeconds = await readDurationSeconds(sourcePath)
    if (shouldCreatePreview) {
      await createPreview(sourcePath, previewPath, input.title.trim(), musicCode)
    }
    await createDownloadMaster(sourcePath, masterPath, input.title.trim(), musicCode)

    const { client, bucket } = getR2Client()
    const coverR2Key = await uploadDefaultCover(client, bucket)
    if (shouldCreatePreview) {
      await uploadR2Object(client, bucket, previewKey, previewPath, 'audio/mpeg')
      uploadedPreview = true
    }
    await uploadR2Object(client, bucket, masterKey, masterPath, input.audio.type || 'application/octet-stream')
    uploadedMaster = true
    const playbackKey = shouldCreatePreview ? previewKey : masterKey

    const payload = await loadPayloadClient()
    const track = await payload.create({
      collection: 'tracks',
      data: toTrackRecord(input, {
        uploadId,
        musicCode,
        durationSeconds,
        coverR2Key,
        playbackKey,
        masterKey,
        sourceFormat: extension.slice(1).toUpperCase(),
      }),
      depth: 0,
    }) as { id: string; slug?: string }

    return {
      trackId: String(track.id),
      slug: track.slug ?? '',
      musicCode,
      durationSeconds: Math.round(durationSeconds),
      durationLabel: formatDuration(durationSeconds),
      previewKey: playbackKey,
      masterKey,
      coverR2Key: DEFAULT_COVER_KEY,
    }
  } catch (error) {
    if (uploadedPreview || uploadedMaster) {
      try {
        const { client, bucket } = getR2Client()
        await Promise.all([
          uploadedPreview ? client.send(new DeleteObjectCommand({ Bucket: bucket, Key: previewKey })) : Promise.resolve(),
          uploadedMaster ? client.send(new DeleteObjectCommand({ Bucket: bucket, Key: masterKey })) : Promise.resolve(),
        ])
      } catch {
        // A failed rollback is logged by the host; the original error remains the response cause.
      }
    }
    throw error
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true })
  }
}
