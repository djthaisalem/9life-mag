'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { getFairRotation } from '@/lib/music-curation'

export type DiscoveryItem = {
  id: string
  label: string
  title: string
  meta: string
  image?: string
  href: string
}

export type DiscoveryGroup = {
  key: string
  items: DiscoveryItem[]
}

function selectInitialItems(groups: DiscoveryGroup[]) {
  return groups.map((group) => group.items[0]).filter(Boolean)
}

export function ContentDiscoveryClient({ groups }: { groups: DiscoveryGroup[] }) {
  const [items, setItems] = useState<DiscoveryItem[]>(() => selectInitialItems(groups))

  useEffect(() => {
    setItems(groups.flatMap((group) => {
      const [selectedId] = getFairRotation(
        `nine-life-content-discovery-${group.key}-v3`,
        group.items.map((item) => item.id),
        1,
      )
      const selected = group.items.find((item) => item.id === selectedId)
      return selected ? [selected] : []
    }))
  }, [groups])

  if (!items.length) return null

  return (
    <section className="content-discovery" aria-label="Khám phá nội dung liên quan">
      <div className="container">
        <div className="content-discovery-head">
          <div>
            <p className="section-eyebrow">Khám phá thêm</p>
            <h2>Nội dung dành cho bạn</h2>
          </div>
        </div>
        <div className="content-discovery-grid">
          {items.map((item) => (
            <Link key={`${item.label}-${item.id}`} href={item.href} className="content-discovery-card">
              {item.image ? <img src={item.image} alt="" /> : <span className="content-discovery-image-placeholder" aria-hidden="true" />}
              <div>
                <span>{item.label}</span>
                <strong>{item.title}</strong>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
