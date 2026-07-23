'use client'

import Link from 'next/link'
import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { findSearchItems, type SearchCategory } from '@/lib/search-index'
import { fetchPublicMusicCatalog } from '@/lib/public-music-catalog'
import type { SearchItem } from '@/lib/search-index'

const tabs: { label: string; value: SearchCategory | 'all' }[] = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Tin tức', value: 'news' },
  { label: 'Nghệ sĩ', value: 'artists' },
  { label: 'Outlet', value: 'outlets' },
  { label: 'Nhạc', value: 'music' },
]

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get('q')?.trim() ?? ''
  const requestedTab = searchParams.get('tab')
  const activeTab = tabs.some((tab) => tab.value === requestedTab) ? requestedTab as SearchCategory | 'all' : 'all'
  const [input, setInput] = useState(query)
  const [databaseMusicItems, setDatabaseMusicItems] = useState<SearchItem[]>([])
  const results = useMemo(() => findSearchItems(query, activeTab, databaseMusicItems), [query, activeTab, databaseMusicItems])

  useEffect(() => {
    void fetchPublicMusicCatalog().then((tracks) => {
      setDatabaseMusicItems(tracks.map((track) => ({
        id: `music:${track.id}`,
        category: 'music',
        title: track.title,
        description: `${track.artist} · ${track.genre} · ${track.duration}${track.musicCode ? ` · Mã ${track.musicCode}` : ''}`,
        image: '/images/default-music-cover.png',
        href: `/music?track=${encodeURIComponent(track.id)}#listen-now`,
        label: `Music · ${track.type === 'track' ? 'Track' : track.type}`,
      })))
    }).catch(() => setDatabaseMusicItems([]))
  }, [])

  const updateSearch = (nextQuery: string, nextTab = activeTab) => {
    const params = new URLSearchParams()
    if (nextQuery.trim()) params.set('q', nextQuery.trim())
    if (nextTab !== 'all') params.set('tab', nextTab)
    router.push(`/tim-kiem${params.size ? `?${params.toString()}` : ''}`)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    updateSearch(input)
  }

  return (
    <main className="search-page">
      <section className="search-hero">
        <div className="container">
          <p className="section-eyebrow">Search 9Life</p>
          <h1>Tìm đúng <span>nội dung bạn cần</span></h1>
          <p>Tìm bài viết, nghệ sĩ, outlet và music trong cùng một nơi.</p>
          <form className="search-form" onSubmit={handleSubmit}>
            <Search size={20} />
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Nhập tên nghệ sĩ, club, bài viết hoặc track..." autoFocus />
            <button type="submit">Tìm kiếm</button>
          </form>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="search-tabs" role="tablist" aria-label="Lọc kết quả tìm kiếm">
            {tabs.map((tab) => (
              <button key={tab.value} type="button" className={activeTab === tab.value ? 'search-tab search-tab-active' : 'search-tab'} onClick={() => updateSearch(query, tab.value)}>
                {tab.label}
              </button>
            ))}
          </div>

          {query ? <p className="search-result-summary">{results.length} kết quả liên quan đến <strong>“{query}”</strong></p> : <p className="search-result-summary">Nhập từ khóa để bắt đầu tìm kiếm trên 9LIFE MAG.</p>}

          {results.length > 0 ? <div className="search-result-grid">
            {results.map((item) => <Link key={item.id} href={item.href} className="search-result-card">
              <img src={item.image} alt="" />
              <div><span className="pill">{item.label}</span><h2>{item.title}</h2><p>{item.description}</p><span className="search-open-link">Mở nội dung</span></div>
            </Link>)}
          </div> : query ? <div className="search-empty"><h2>Chưa tìm thấy nội dung phù hợp</h2><p>Hãy thử từ khóa ngắn hơn, tên nghệ sĩ, địa điểm hoặc thể loại nhạc.</p></div> : null}
        </div>
      </section>
    </main>
  )
}

export default function SearchPage() {
  return <Suspense fallback={<main className="search-page" />}><SearchPageContent /></Suspense>
}
