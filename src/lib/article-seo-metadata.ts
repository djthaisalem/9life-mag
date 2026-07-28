export type ArticleSeoMetadata = {
  title?: string
  description?: string
  primaryKeywords?: string
  secondaryKeywords?: string
  canonicalUrl?: string
}

const fieldLabels = {
  title: ['Ti\u00eau \u0111\u1ec1 SEO', 'Ti\u00eau \u0111\u1ec1 SEO (Title Tag)', 'Title Tag', 'Meta title', 'SEO title'],
  description: ['Th\u1ebb Meta Description', 'Meta Description', 'Meta description', 'SEO description'],
  primaryKeywords: ['T\u1eeb kh\u00f3a ch\u00ednh', 'Primary Keywords', 'Focus keyword'],
  secondaryKeywords: ['T\u1eeb kh\u00f3a ph\u1ee5', 'Secondary Keywords'],
  canonicalUrl: ['\u0110\u01b0\u1eddng d\u1eabn \u0111\u1ec1 xu\u1ea5t', '\u0110\u01b0\u1eddng d\u1eabn \u0111\u1ec1 xu\u1ea5t (URL Slug)', 'URL Slug', 'Canonical', 'Canonical URL'],
} as const

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character)
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}

function normalizeLabel(value: string) {
  return decodeHtml(value)
    .replace(/<[^>]+>/g, '')
    .replace(/\*+/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function htmlToLines(html: string) {
  return decodeHtml(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|section|aside|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.replace(/\*+/g, '').replace(/^[\s#*\-\u{1F300}-\u{1FAFF}]+/u, '').trim())
    .filter(Boolean)
}

function valueFor(lines: string[], labels: readonly string[]) {
  const normalizedLabels = new Set(labels.map(normalizeLabel))
  let value = ''

  for (const line of lines) {
    const separator = line.indexOf(':')
    if (separator < 0) continue
    const label = normalizeLabel(line.slice(0, separator))
    const candidate = line.slice(separator + 1).replace(/^[:\s*]+/, '').trim()
    if (normalizedLabels.has(label) && candidate) value = candidate
  }

  return value || undefined
}

function isSeoMetadataLine(value: string) {
  const separator = decodeHtml(value).replace(/<[^>]+>/g, '').indexOf(':')
  if (separator < 0) return false
  const label = normalizeLabel(value.slice(0, separator))
  return Object.values(fieldLabels).flat().some((candidate) => normalizeLabel(candidate) === label)
}

function isSeoHeading(value: string) {
  const normalized = normalizeLabel(value)
  return normalized.includes('thong tin cau truc seo metadata') || normalized.includes('seo metadata chuan quoc te')
}

export function extractArticleSeoMetadata(html: string): ArticleSeoMetadata {
  const lines = htmlToLines(html)
  return {
    title: valueFor(lines, fieldLabels.title),
    description: valueFor(lines, fieldLabels.description),
    primaryKeywords: valueFor(lines, fieldLabels.primaryKeywords),
    secondaryKeywords: valueFor(lines, fieldLabels.secondaryKeywords),
    canonicalUrl: valueFor(lines, fieldLabels.canonicalUrl),
  }
}

export function getArticleSeoKeywords(metadata: ArticleSeoMetadata) {
  return [metadata.primaryKeywords, metadata.secondaryKeywords]
    .flatMap((value) => (value ?? '').split(','))
    .map((keyword) => keyword.trim())
    .filter(Boolean)
}

export function stripArticleSeoMetadata(html: string) {
  return html
    .replace(/<aside\b(?=[^>]*\bcms-article-seo-note\b)[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<(p|div|section|h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi, (block, _tag, inner) => {
      if (isSeoHeading(inner) || isSeoMetadataLine(inner)) return ''
      return block
    })
    .trim()
}

export function buildArticleSeoMarkup(metadata: ArticleSeoMetadata) {
  const fields: Array<[string, string | undefined]> = [
    [fieldLabels.title[0], metadata.title],
    [fieldLabels.description[0], metadata.description],
    [fieldLabels.primaryKeywords[0], metadata.primaryKeywords],
    [fieldLabels.secondaryKeywords[0], metadata.secondaryKeywords],
    [fieldLabels.canonicalUrl[0], metadata.canonicalUrl],
  ]
  const rows = fields.filter((row): row is [string, string] => Boolean(row[1]?.trim()))

  if (!rows.length) return ''
  return `<aside class="cms-article-seo-note">${rows.map(([label, value]) => `<p><b>${label}:</b> ${escapeHtml(value)}</p>`).join('')}</aside>`
}
