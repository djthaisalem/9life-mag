import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const roots = [
  path.join(process.cwd(), 'src', 'app', '(site)'),
  path.join(process.cwd(), 'src', 'components'),
]

const files = []
for (const root of roots) {
  if (!fs.existsSync(root)) continue
  const pending = [root]
  while (pending.length) {
    const current = pending.pop()
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name)
      if (entry.isDirectory()) pending.push(target)
      else if (
        entry.isFile() &&
        /\.tsx?$/.test(entry.name) &&
        !entry.name.startsWith('cms-')
      ) {
        files.push(target)
      }
    }
  }
}

const findings = []
const appRoot = path.join(process.cwd(), 'src', 'app')
const routePatterns = []
const routeQueue = [appRoot]
while (routeQueue.length) {
  const current = routeQueue.pop()
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const target = path.join(current, entry.name)
    if (entry.isDirectory()) routeQueue.push(target)
    else if (entry.isFile() && entry.name === 'page.tsx') {
      const relative = path.relative(appRoot, current)
      const segments = relative
        .split(path.sep)
        .filter(Boolean)
        .filter((segment) => !segment.startsWith('('))
        .map((segment) => {
          if (segment.startsWith('[[...')) return '(?:/.*)?'
          if (segment.startsWith('[...')) return '/.*'
          if (segment.startsWith('[')) return '/[^/]+'
          return `/${segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
        })
      routePatterns.push(new RegExp(`^${segments.join('') || '/'}$`))
    }
  }
}

function getAttribute(node, name) {
  return node.attributes.properties.find(
    (attribute) => ts.isJsxAttribute(attribute) && attribute.name.text === name
  )
}

function literalAttributeValue(attribute) {
  if (!attribute?.initializer) return ''
  if (ts.isStringLiteral(attribute.initializer)) return attribute.initializer.text
  if (
    ts.isJsxExpression(attribute.initializer) &&
    attribute.initializer.expression &&
    ts.isStringLiteral(attribute.initializer.expression)
  ) {
    return attribute.initializer.expression.text
  }
  return null
}

function hasLinkedAncestor(node) {
  let current = node.parent
  while (current) {
    if (ts.isJsxElement(current)) {
      const opening = current.openingElement
      const tag = opening.tagName.getText()
      if ((tag === 'Link' || tag === 'a') && getAttribute(opening, 'href')) return true
    }
    current = current.parent
  }
  return false
}

for (const file of files) {
  const sourceText = fs.readFileSync(file, 'utf8')
  const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

  function report(node, issue) {
    const position = source.getLineAndCharacterOfPosition(node.getStart(source))
    findings.push(`${path.relative(process.cwd(), file)}:${position.line + 1} ${issue}`)
  }

  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText()
      if (tag === 'button') {
        const type = literalAttributeValue(getAttribute(node, 'type'))
        const hasAction =
          Boolean(getAttribute(node, 'onClick')) ||
          Boolean(getAttribute(node, 'formAction')) ||
          type === 'submit' ||
          hasLinkedAncestor(node)
        if (!hasAction) report(node, 'button không có hành vi')
      }

      if (tag === 'Link' || tag === 'a') {
        const href = literalAttributeValue(getAttribute(node, 'href'))
        if (href === '' || href === '#' || href?.startsWith('javascript:')) {
          report(node, `link không có đích hợp lệ (${JSON.stringify(href)})`)
        } else if (href?.startsWith('/') && !href.startsWith('//')) {
          const pathname = href.split(/[?#]/)[0] || '/'
          if (!routePatterns.some((pattern) => pattern.test(pathname))) {
            report(node, `link nội bộ không khớp route (${href})`)
          }
        }
      }

      if (tag === 'form') {
        const hasSubmitAction =
          Boolean(getAttribute(node, 'onSubmit')) ||
          Boolean(getAttribute(node, 'action'))
        if (!hasSubmitAction) report(node, 'form không có nơi tiếp nhận dữ liệu')
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(source)
}

if (findings.length) {
  console.log(findings.join('\n'))
  process.exitCode = 1
} else {
  console.log('Không phát hiện button/link tĩnh thiếu hành vi.')
}
