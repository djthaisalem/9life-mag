'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { artistDirectorySlides } from '@/lib/artist-directory-slider'
import { repairVietnameseText } from '@/lib/repair-vietnamese-text'

type ArticleSlide = { id: string; eyebrow: string; title: string; image: string; href: string }

export function ArtistDirectoryArticleSlider() {
  const [active, setActive] = useState(0)
  const [slides, setSlides] = useState<ArticleSlide[]>([...artistDirectorySlides])
  useEffect(() => {
    fetch('/api/public/articles', { cache: 'no-store' })
      .then((response) => response.json())
      .then((result: { ok?: boolean; articles?: Array<{ slug: string; title: string; category?: string; image?: string; placement?: string }> }) => {
        const placed = (result.articles ?? [])
          .filter((article) => repairVietnameseText(article.placement || '') === 'Artist Directory Header Slider')
          .slice(0, 3)
          .map((article) => ({
            id: article.slug,
            eyebrow: repairVietnameseText(article.category || 'Tin nghệ sĩ'),
            title: repairVietnameseText(article.title),
            image: article.image || '/images/default-music-cover.png',
            href: `/tin-tuc/${article.slug}`,
          }))
        if (placed.length) setSlides(placed)
      })
      .catch(() => undefined)
  }, [])
  useEffect(() => { const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 5500); return () => window.clearInterval(timer) }, [slides.length])
  const slide = slides[active % slides.length]
  return <article className="artist-spotlight-card"><Link href={slide.href} className="artist-spotlight-image-link" aria-label={`Mở bài viết: ${slide.title}`}><img src={slide.image} alt="" onError={(event) => { event.currentTarget.src = '/images/default-music-cover.png' }} /></Link><div className="artist-spotlight-overlay"><span className="pill">{slide.eyebrow}</span><strong>{slide.title}</strong><Link href={slide.href}>Đọc bài viết</Link><div className="artist-directory-slider-dots">{slides.map((item, index) => <button key={item.id} type="button" aria-label={`Chuyển đến bài viết ${index + 1}`} className={index === active ? 'artist-directory-slider-dot artist-directory-slider-dot-active' : 'artist-directory-slider-dot'} onClick={() => setActive(index)} />)}</div></div></article>
}
