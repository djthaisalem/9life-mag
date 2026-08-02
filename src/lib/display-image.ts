import 'server-only'

import sharp from 'sharp'

const DEFAULT_MAX_DIMENSION = 2560
const DEFAULT_WEBP_QUALITY = 82

type DisplayImageOptions = {
  maxDimension?: number
  quality?: number
}

export type PreparedUploadFile = {
  data: Buffer
  mimetype: string
  name: string
  size: number
}

function webpFileName(fileName: string) {
  const baseName = fileName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9._-]+/g, '-') || 'image'
  return `${baseName}.webp`
}

export async function optimizeDisplayImage(
  data: Buffer,
  fileName: string,
  options: DisplayImageOptions = {},
): Promise<PreparedUploadFile> {
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION
  const quality = options.quality ?? DEFAULT_WEBP_QUALITY
  const optimized = await sharp(data, { failOn: 'error' })
    .rotate()
    .resize({
      width: maxDimension,
      height: maxDimension,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality, effort: 4, smartSubsample: true })
    .toBuffer()

  return {
    data: optimized,
    mimetype: 'image/webp',
    name: webpFileName(fileName),
    size: optimized.length,
  }
}

export async function prepareMediaUpload(input: {
  data: Buffer
  mimetype: string
  name: string
  kind: 'image' | 'audio-preview' | 'source-audio' | 'press-kit'
}) {
  // Downloadable press kits and source files must retain their original bytes.
  if (input.kind !== 'image' || !input.mimetype.startsWith('image/')) {
    return { data: input.data, mimetype: input.mimetype, name: input.name, size: input.data.length }
  }

  return optimizeDisplayImage(input.data, input.name)
}
