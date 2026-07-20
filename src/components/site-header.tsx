'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { MessageCircle, Search } from 'lucide-react'
import { navItems } from '@/lib/site-data'
import { repairVietnameseText } from '@/lib/repair-vietnamese-text'

export function SiteHeader() {
  const pathname = usePathname()
  const displayNavItems = navItems.map((item) =>
    item.href === '/music-store' ? { ...item, href: '/music' } : item,
  )

  return (
    <header className="site-header">
      <div className="container header-row">
        <Link href="/" className="brand" aria-label="9LIFE MAG">
          <img src="/logo-9life-transparent.png" alt="9LIFE MAG" className="brand-logo" />
        </Link>

        <nav className="nav-row" aria-label="Điều hướng chính">
          {displayNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx('nav-link', pathname === item.href && 'active')}
            >
              {repairVietnameseText(item.label)}
            </Link>
          ))}
        </nav>

        <Link href="/tim-kiem" className="header-search-button" aria-label="Tìm kiếm">
          <Search size={18} />
        </Link>
        <Link href="/lien-he" className="button-secondary header-contact-button" aria-label="Liên hệ">
          <MessageCircle size={16} />
        </Link>
      </div>
    </header>
  )
}
