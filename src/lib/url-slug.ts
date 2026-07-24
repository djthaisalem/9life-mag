export function toUrlSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (character) => character === 'đ' ? 'd' : 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

export function normalizeSharePath(path: string) {
  const url = new URL(path, 'https://9lifemag.com')
  url.pathname = url.pathname
    .split('/')
    .map((segment) => {
      if (!segment) return ''

      let decoded = segment
      try {
        decoded = decodeURIComponent(segment)
      } catch {
        return segment
      }

      return /[^\x00-\x7F\s]/.test(decoded) || /\s/.test(decoded)
        ? toUrlSlug(decoded)
        : segment
    })
    .join('/')

  return `${url.pathname}${url.search}${url.hash}`
}
