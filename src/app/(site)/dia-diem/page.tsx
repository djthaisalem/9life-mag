import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { getPublicArtistProfiles } from '@/lib/artist-directory-data'
import { clubOutlets } from '@/lib/club-booking-data'
import { matchesVietnamLocation } from '@/lib/vietnam-locations'

export default async function LocationPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string }>
}) {
  const { location = '' } = await searchParams
  const selectedLocation = location.trim()
  const artistProfiles = getPublicArtistProfiles()
  const artists = selectedLocation
    ? artistProfiles.filter((artist) =>
        matchesVietnamLocation(artist.location, selectedLocation) ||
        artist.cities.some((city) => matchesVietnamLocation(city, selectedLocation))
      )
    : []
  const outlets = selectedLocation
    ? clubOutlets.filter((outlet) => matchesVietnamLocation(outlet.city, selectedLocation))
    : []

  return (
    <main className="search-page">
      <section className="search-hero">
        <div className="container">
          <p className="section-eyebrow">Location Directory</p>
          <h1>{selectedLocation ? <>Khám phá <span>{selectedLocation}</span></> : 'Chọn một tỉnh hoặc thành phố'}</h1>
          <p>{selectedLocation ? 'Tổng hợp nghệ sĩ nhận show và outlet đang hoạt động tại khu vực này.' : 'Mở từ profile nghệ sĩ hoặc outlet để xem các nội dung liên quan.'}</p>
        </div>
      </section>

      {selectedLocation ? <section className="section">
        <div className="container">
          <div className="home-section-head">
            <div><p className="section-eyebrow">Artists</p><h2 className="home-title">Nghệ sĩ liên quan</h2></div>
            <span className="pill"><MapPin size={14} /> {artists.length} hồ sơ</span>
          </div>
          {artists.length ? <div className="search-result-grid">
            {artists.map((artist) => <Link key={artist.slug} href={`/nghe-si/${artist.slug}`} className="search-result-card"><img src={artist.image} alt={artist.name} /><div><span className="pill">{artist.role}</span><h2>{artist.name}</h2><p>{artist.genres} · {artist.location}</p><span className="search-open-link">Xem profile</span></div></Link>)}
          </div> : <p className="search-result-summary">Chưa có nghệ sĩ phù hợp tại khu vực này.</p>}

          <div className="home-section-head" style={{ marginTop: '3rem' }}>
            <div><p className="section-eyebrow">Outlets</p><h2 className="home-title">Outlet liên quan</h2></div>
            <span className="pill"><MapPin size={14} /> {outlets.length} địa điểm</span>
          </div>
          {outlets.length ? <div className="search-result-grid">
            {outlets.map((outlet) => <Link key={outlet.slug} href={`/dat-ban/${outlet.slug}`} className="search-result-card"><img src={outlet.image} alt={outlet.name} /><div><span className="pill">{outlet.type}</span><h2>{outlet.name}</h2><p>{outlet.city} · {outlet.summary}</p><span className="search-open-link">Xem outlet</span></div></Link>)}
          </div> : <p className="search-result-summary">Chưa có outlet phù hợp tại khu vực này.</p>}
        </div>
      </section> : null}
    </main>
  )
}
