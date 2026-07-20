'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { artistDirectorySlides } from '@/lib/artist-directory-slider'

export function ArtistDirectoryArticleSlider() {
  const [active, setActive] = useState(0)
  useEffect(() => { const timer = window.setInterval(() => setActive((current) => (current + 1) % artistDirectorySlides.length), 5500); return () => window.clearInterval(timer) }, [])
  const slide = artistDirectorySlides[active]
  return <article className="artist-spotlight-card"><img src={slide.image} alt="" /><div className="artist-spotlight-overlay"><span className="pill">{slide.eyebrow}</span><strong>{slide.title}</strong><Link href={slide.href}>Đọc bài viết</Link><div className="artist-directory-slider-dots">{artistDirectorySlides.map((item, index) => <button key={item.id} type="button" aria-label={`Chuyển đến bài viết ${index + 1}`} className={index === active ? 'artist-directory-slider-dot artist-directory-slider-dot-active' : 'artist-directory-slider-dot'} onClick={() => setActive(index)} />)}</div></div></article>
}
