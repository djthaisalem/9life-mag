'use client'

import { useEffect } from 'react'
import { repairVietnameseText } from '@/lib/repair-vietnamese-text'

function normalizeTextNodes(root: Element) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  let node = walker.nextNode()
  while (node) { nodes.push(node as Text); node = walker.nextNode() }
  nodes.forEach((textNode) => { const repaired = repairVietnameseText(textNode.nodeValue ?? ''); if (repaired !== textNode.nodeValue) textNode.nodeValue = repaired })
}

function normalizeFormContent(root: Element) {
  root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea').forEach((element) => {
    const value = repairVietnameseText(element.value)
    if (value !== element.value) element.value = value
    const placeholder = repairVietnameseText(element.placeholder)
    if (placeholder !== element.placeholder) element.placeholder = placeholder
  })

  root.querySelectorAll<HTMLElement>('[title], [aria-label]').forEach((element) => {
    const title = element.getAttribute('title')
    const ariaLabel = element.getAttribute('aria-label')
    if (title) element.setAttribute('title', repairVietnameseText(title))
    if (ariaLabel) element.setAttribute('aria-label', repairVietnameseText(ariaLabel))
  })
}

export function CmsTextRepair() {
  useEffect(() => {
    const root = document.querySelector('.cms-shell')
    if (!root) return
    const normalize = () => { normalizeTextNodes(root); normalizeFormContent(root) }
    normalize()
    const observer = new MutationObserver(normalize)
    observer.observe(root, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [])
  return null
}
