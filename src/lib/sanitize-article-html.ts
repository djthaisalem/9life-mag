import sanitizeHtml from 'sanitize-html'

// The same allowlist protects stored articles, CMS previews and the editor.
export function sanitizeArticleHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'iframe', 'section', 'aside', 'figure', 'figcaption'],
    allowedAttributes: {
      '*': ['class', 'style'],
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      iframe: ['src', 'title', 'width', 'height', 'loading', 'allow', 'allowfullscreen', 'referrerpolicy'],
      div: ['class', 'style', 'data-cms-html-block'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { iframe: ['https'], img: ['http', 'https', 'blob'] },
    allowProtocolRelative: false,
    allowedIframeHostnames: [
      'www.youtube.com', 'www.youtube-nocookie.com', 'www.facebook.com',
      'www.instagram.com', 'w.soundcloud.com', 'www.mixcloud.com', 'open.spotify.com',
    ],
    allowedStyles: {
      '*': {
        'text-align': [/^(left|right|center|justify)$/],
        color: [/^#[0-9a-f]{3,8}$/i, /^rgb\([\d\s,]+\)$/i],
        'background-color': [/^#[0-9a-f]{3,8}$/i, /^rgb\([\d\s,]+\)$/i],
        'font-size': [/^\d+(?:\.\d+)?(?:px|em|rem|%)$/],
        'font-weight': [/^(normal|bold|[1-9]00)$/],
        'font-style': [/^(normal|italic)$/],
        'text-decoration': [/^(none|underline|line-through)$/],
      },
    },
    transformTags: {
      a: (tagName, attributes) => ({
        tagName,
        attribs: { ...attributes, ...(attributes.target === '_blank' ? { rel: 'noopener noreferrer' } : {}) },
      }),
    },
  })
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
