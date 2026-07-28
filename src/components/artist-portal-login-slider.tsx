'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { artistPortalLoginSlides } from '@/lib/artist-portal-slider'
import { repairVietnameseText } from '@/lib/repair-vietnamese-text'

type ArticleSlide = { id: string; eyebrow: string; title: string; image: string; href: string }

export function ArtistPortalLoginSlider() {
  const [active, setActive] = useState(0)
  const [slides, setSlides] = useState<ArticleSlide[]>([...artistPortalLoginSlides])
  useEffect(() => {
    fetch('/api/public/articles', { cache: 'no-store' })
      .then((response) => response.json())
      .then((result: { ok?: boolean; articles?: Array<{ slug: string; title: string; category?: string; image?: string; placement?: string }> }) => {
        const placed = (result.articles ?? [])
          .filter((article) => repairVietnameseText(article.placement || '') === 'Artist Portal Login Slider')
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
  useEffect(() => { const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 5000); return () => window.clearInterval(timer) }, [slides.length])
  const slide = slides[active % slides.length]
  return <div className="artist-login-slider"><Link href={slide.href} className="artist-login-slide-image-link" aria-label={`Mở bài viết: ${slide.title}`}><img src={slide.image} alt="" onError={(event) => { event.currentTarget.src = '/images/default-music-cover.png' }} /></Link><div className="artist-login-slider-overlay"><p className="section-eyebrow">{slide.eyebrow}</p><strong>{slide.title}</strong><Link href={slide.href}>Xem nội dung</Link></div><div className="artist-login-slider-dots">{slides.map((item, index) => <button key={item.id} type="button" aria-label={`Chuyển đến slide ${index + 1}`} className={index === active ? 'artist-login-slider-dot artist-login-slider-dot-active' : 'artist-login-slider-dot'} onClick={() => setActive(index)} />)}</div></div>
}
