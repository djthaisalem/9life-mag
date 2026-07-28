'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { getFairRotation } from '@/lib/music-curation'

const DEFAULT_DISCOVERY_IMAGE = '/images/default-music-cover.png'

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

  const useFallbackImage = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget
    if (image.src.endsWith(DEFAULT_DISCOVERY_IMAGE)) return
    image.src = DEFAULT_DISCOVERY_IMAGE
  }

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
              <img
                src={item.image || DEFAULT_DISCOVERY_IMAGE}
                alt=""
                onError={useFallbackImage}
              />
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
