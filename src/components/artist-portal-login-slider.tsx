'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { artistPortalLoginSlides } from '@/lib/artist-portal-slider'

export function ArtistPortalLoginSlider() {
  const [active, setActive] = useState(0)
  useEffect(() => { const timer = window.setInterval(() => setActive((current) => (current + 1) % artistPortalLoginSlides.length), 5000); return () => window.clearInterval(timer) }, [])
  const slide = artistPortalLoginSlides[active]
  return <div className="artist-login-slider"><img src={slide.image} alt="" /><div className="artist-login-slider-overlay"><p className="section-eyebrow">{slide.eyebrow}</p><strong>{slide.title}</strong><Link href={slide.href}>Xem nội dung</Link></div><div className="artist-login-slider-dots">{artistPortalLoginSlides.map((item, index) => <button key={item.id} type="button" aria-label={`Chuyển đến slide ${index + 1}`} className={index === active ? 'artist-login-slider-dot artist-login-slider-dot-active' : 'artist-login-slider-dot'} onClick={() => setActive(index)} />)}</div></div>
}
