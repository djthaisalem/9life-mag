'use client'

import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useState } from 'react'

type GalleryItem = { image: string; caption: string }

export function ArtistGalleryLightbox({ items }: { items: GalleryItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [orientations, setOrientations] = useState<Record<number, 'landscape' | 'portrait'>>({})
  const active = activeIndex === null ? null : items[activeIndex]
  const move = (direction: -1 | 1) => setActiveIndex((current) => current === null ? null : (current + direction + items.length) % items.length)

  return <>
    <div className="artist-gallery-grid">
      {items.map((item, index) => <button type="button" key={item.image} className={`artist-gallery-card artist-gallery-card-button ${orientations[index] ?? ''}`} onClick={() => setActiveIndex(index)}>
        <img src={item.image} alt={item.caption} onLoad={(event) => {
          // Read dimensions before scheduling state; React clears event.currentTarget afterwards.
          const { naturalHeight, naturalWidth } = event.currentTarget
          setOrientations((current) => ({ ...current, [index]: naturalWidth >= naturalHeight ? 'landscape' : 'portrait' }))
        }} />
        <span>{item.caption}</span>
      </button>)}
    </div>
    {active ? <div className="artist-gallery-lightbox" role="dialog" aria-modal="true" aria-label="Xem ảnh gallery">
      <button type="button" className="artist-gallery-lightbox-close" onClick={() => setActiveIndex(null)} aria-label="Đóng"><X /></button>
      <button type="button" className="artist-gallery-lightbox-nav artist-gallery-lightbox-prev" onClick={() => move(-1)} aria-label="Ảnh trước"><ChevronLeft /></button>
      <img src={active.image} alt={active.caption} />
      <button type="button" className="artist-gallery-lightbox-nav artist-gallery-lightbox-next" onClick={() => move(1)} aria-label="Ảnh tiếp"><ChevronRight /></button>
      <p>{active.caption}</p>
    </div> : null}
  </>
}
