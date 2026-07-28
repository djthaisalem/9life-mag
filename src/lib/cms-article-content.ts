export function getCmsArticleHtml(content: unknown): string {
  if (!content || typeof content !== 'object') return ''
  const root = (content as { root?: unknown }).root
  if (!root || typeof root !== 'object') return ''
  const children = (root as { children?: unknown }).children
  if (!Array.isArray(children)) return ''

  const textNodes: string[] = []
  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    const value = node as { text?: unknown; children?: unknown }
    if (typeof value.text === 'string') textNodes.push(value.text)
    if (Array.isArray(value.children)) value.children.forEach(visit)
  }
  children.forEach(visit)
  return textNodes.join('\n')
}

export function getCmsMediaReference(value: unknown) {
  if (typeof value === 'number' || typeof value === 'string') {
    return { id: String(value), url: `/api/public/media/${value}`, alt: '' }
  }
  if (!value || typeof value !== 'object') return null

  const media = value as { id?: string | number; alt?: string; updatedAt?: string; createdAt?: string }
  if (media.id === undefined || media.id === null) return null
  const version = media.updatedAt ?? media.createdAt
  return {
    id: String(media.id),
    // A cover can be replaced while the article slug stays unchanged. Version
    // the public URL so hero cards never retain a stale failed image response.
    url: `/api/public/media/${media.id}${version ? `?v=${encodeURIComponent(version)}` : ''}`,
    alt: media.alt ?? '',
  }
}
