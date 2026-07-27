export type ArticleSeoMetadata = {
  title?: string
  description?: string
  primaryKeywords?: string
  secondaryKeywords?: string
  canonicalUrl?: string
}

const fieldLabels = {
  title: ['Tiêu đề SEO', 'Tiêu đề SEO (Title Tag)', 'Title Tag', 'Meta title', 'SEO title'],
  description: ['Thẻ Meta Description', 'Meta Description', 'Meta description', 'SEO description'],
  primaryKeywords: ['Từ khóa chính', 'Primary Keywords', 'Focus keyword'],
  secondaryKeywords: ['Từ khóa phụ', 'Secondary Keywords'],
  canonicalUrl: ['Đường dẫn đề xuất', 'Đường dẫn đề xuất (URL Slug)', 'URL Slug', 'Canonical', 'Canonical URL'],
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

function htmlToLines(html: string) {
  return decodeHtml(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|section|aside|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.replace(/\*\*/g, '').replace(/^[\s#*\-\u{1F300}-\u{1FAFF}]+/u, '').trim())
    .filter(Boolean)
}

function valueFor(lines: string[], labels: readonly string[]) {
  const escapedLabels = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const matcher = new RegExp(`^(?:${escapedLabels})\\s*:\\s*(.+)$`, 'i')
  let value = ''

  for (const line of lines) {
    const match = line.match(matcher)
    if (match?.[1]?.trim()) value = match[1].trim()
  }

  return value || undefined
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
  const labelPattern = Object.values(fieldLabels)
    .flat()
    .map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')

  return html
    .replace(/<aside\b(?=[^>]*\bcms-article-seo-note\b)[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(new RegExp(`<p\\b[^>]*>\\s*(?:<[^>]+>\\s*)*(?:${labelPattern})\\s*:[\\s\\S]*?<\\/p>`, 'gi'), '')
    .trim()
}

export function buildArticleSeoMarkup(metadata: ArticleSeoMetadata) {
  const fields: Array<[string, string | undefined]> = [
    ['Tiêu đề SEO', metadata.title],
    ['Thẻ Meta Description', metadata.description],
    ['Từ khóa chính', metadata.primaryKeywords],
    ['Từ khóa phụ', metadata.secondaryKeywords],
    ['Đường dẫn đề xuất', metadata.canonicalUrl],
  ]
  const rows = fields.filter((row): row is [string, string] => Boolean(row[1]?.trim()))

  if (!rows.length) return ''
  return `<aside class="cms-article-seo-note">${rows.map(([label, value]) => `<p><b>${label}:</b> ${escapeHtml(value)}</p>`).join('')}</aside>`
}
