import { AudioShowcasePlayer } from '@/components/audio-showcase-player'
import {
  headerNotifications,
  legacyAlbums,
  legacyPlaylists,
  musicCategories,
  nonstopTracks,
  profileOptions,
  remixTracks,
  studioMenus,
  studioMembers,
  studioStats
} from '@/lib/music-store-data'
import { Bell, Mail, Search } from 'lucide-react'

export default function MusicStorePage() {
  return (
    <main className="music5s-shell">
      <div className="music5s-layout">
        <aside className="music5s-sidebar">
          <div className="music5s-sidebar-logo">
            <img src="/music-legacy/brand/logo.png" alt="Music5s" />
          </div>

          <nav className="music5s-nav">
            <a href="#dashboard" className="music5s-nav-item music5s-nav-item-active">
              Dashboards
            </a>
            {studioMenus.map((item) => (
              <a key={item} href="#music-content" className="music5s-nav-item">
                {item}
              </a>
            ))}
            <a href="/music" className="music5s-nav-item">
              Frontend Music
            </a>
          </nav>
        </aside>

        <section className="music5s-main">
          <header className="music5s-topbar">
            <label className="music5s-search">
              <Search size={18} />
              <input type="text" value="Search..." readOnly aria-label="Search" />
            </label>

            <div className="music5s-top-actions">
              <div className="music5s-icon-chip">
                <Bell size={18} />
                <span>{headerNotifications[0]}</span>
              </div>
              <div className="music5s-icon-chip">
                <Mail size={18} />
                <span>{headerNotifications[1]}</span>
              </div>
              <div className="music5s-user">
                <img src="/music-legacy/avatars/1.png" alt="Cindy Deitch" />
                <span>Cindy Deitch</span>
              </div>
            </div>
          </header>

          <div className="music5s-content" id="dashboard">
            <div className="music5s-breadcrumb">
              <span>Home</span>
              <span>/</span>
              <span>Music</span>
              <span>/</span>
              <span>Backend</span>
            </div>

            <div className="music5s-title-row">
              <div>
                <h1>Backend Music: danh sách playlist và album</h1>
                <p>Trang này dành cho quản trị music. Frontend public đã tách sang route Music riêng.</p>
              </div>
              <div className="music5s-button-row">
                <a href="/music" className="music5s-btn music5s-btn-outline">
                  Xem frontend Music
                </a>
                <button type="button" className="music5s-btn music5s-btn-outline">
                  Danh sách album
                </button>
                <button type="button" className="music5s-btn">
                  Tạo mới
                </button>
              </div>
            </div>

            <section className="music5s-stat-grid">
              {studioStats.map((item) => (
                <article key={item.title} className={`music5s-stat-card music5s-stat-${item.tone}`}>
                  <strong>{item.value}</strong>
                  <span>{item.title}</span>
                </article>
              ))}
            </section>

            <section className="music5s-card-section" id="music-content">
              <div className="music5s-section-head">
                <h2>Danh sách playlist</h2>
                <span className="music5s-muted">Kiểu card cover giống trang playlist cũ</span>
              </div>

              <div className="music5s-card-grid">
                {legacyPlaylists.map((item) => (
                  <article key={item.title} className="music5s-library-card">
                    <a href="#playlist-detail" className="music5s-library-image">
                      <img src={item.cover} alt={item.title} />
                    </a>
                    <div className="music5s-library-body">
                      <p className="music5s-library-title">
                        <strong>{item.title}</strong>
                      </p>
                      <p className="music5s-library-copy">{item.description}</p>
                      <div className="music5s-library-actions">
                        <a href="#playlist-detail" className="music5s-btn music5s-btn-small">
                          Chi tiết
                        </a>
                        <span className="music5s-meta">{item.meta}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="music5s-card-section">
              <div className="music5s-section-head">
                <h2>Danh sách album</h2>
                <span className="music5s-muted">Kiểu card giống trang album cũ</span>
              </div>

              <div className="music5s-card-grid">
                {legacyAlbums.map((item) => (
                  <article key={item.title} className="music5s-library-card">
                    <a href="#album-detail" className="music5s-library-image">
                      <img src={item.cover} alt={item.title} />
                    </a>
                    <div className="music5s-library-body">
                      <p className="music5s-library-title">
                        <strong>{item.title}</strong>
                      </p>
                      <p className="music5s-library-copy">{item.artist}</p>
                      <div className="music5s-library-actions">
                        <a href="#album-detail" className="music5s-btn music5s-btn-small">
                          Chi tiết
                        </a>
                        <span className="music5s-meta">{item.status}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="music5s-form-shell">
              <article className="music5s-form-card">
                <div className="music5s-section-head">
                  <h2>Thêm playlist</h2>
                  <span className="music5s-muted">Form create bám sát source cũ</span>
                </div>

                <div className="music5s-form-grid">
                  <div className="music5s-upload-box">
                    <img src="/music-legacy/bg/14.jpg" alt="Playlist cover" />
                    <button type="button" className="music5s-btn music5s-btn-outline">
                      Upload ảnh
                    </button>
                  </div>

                  <div className="music5s-fields">
                    <label>
                      <span>Tiêu đề</span>
                      <input type="text" defaultValue="Saigon After Dark" />
                    </label>
                    <label>
                      <span>Từ khóa</span>
                      <input type="text" defaultValue="nightlife, edm, dj" />
                    </label>
                    <label>
                      <span>Url</span>
                      <input type="text" defaultValue="saigon-after-dark" />
                    </label>
                    <label>
                      <span>Loại nhạc</span>
                      <div className="music5s-tag-list">
                        {musicCategories.map((item) => (
                          <span key={item} className="music5s-tag">
                            {item}
                          </span>
                        ))}
                      </div>
                    </label>
                    <label>
                      <span>Ca sĩ</span>
                      <div className="music5s-tag-list">
                        {profileOptions.slice(0, 2).map((item) => (
                          <span key={item} className="music5s-tag">
                            {item}
                          </span>
                        ))}
                      </div>
                    </label>
                    <label>
                      <span>Nhạc sĩ</span>
                      <div className="music5s-tag-list">
                        {profileOptions.slice(2).map((item) => (
                          <span key={item} className="music5s-tag">
                            {item}
                          </span>
                        ))}
                      </div>
                    </label>
                    <label className="music5s-checkbox">
                      <input type="checkbox" defaultChecked />
                      <span>Nổi bật</span>
                    </label>
                    <label className="music5s-textarea">
                      <span>Mô tả</span>
                      <textarea
                        defaultValue="Playlist dùng cho club set, rooftop session và những đêm diễn cộng đồng."
                      />
                    </label>
                    <div className="music5s-button-row">
                      <button type="button" className="music5s-btn">
                        Thêm mới
                      </button>
                    </div>
                  </div>
                </div>
              </article>

              <article className="music5s-team-card">
                <div className="music5s-section-head">
                  <h2>Nhóm vận hành</h2>
                  <span className="music5s-muted">User card gần với header admin cũ</span>
                </div>

                <div className="music5s-team-list">
                  {studioMembers.map((item) => (
                    <article key={item.name} className="music5s-member">
                      <img src={item.avatar} alt={item.name} />
                      <div>
                        <strong>{item.name}</strong>
                        <span>{item.role}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            </section>

            <section className="music5s-player-section" id="music-player">
              <div className="music5s-section-head">
                <h2>Preview nội dung</h2>
                <span className="music5s-muted">Khu xem thử audio để kiểm nội dung trước khi đẩy ra frontend</span>
              </div>

              <div className="music5s-player-card">
                <AudioShowcasePlayer
                  title="Nonstop Playlist"
                  subtitle="Audio demo hiện lấy lại từ source cũ để team nội dung kiểm trước."
                  tracks={nonstopTracks}
                />
              </div>

              <div className="music5s-player-card">
                <AudioShowcasePlayer
                  title="Top Remix"
                  subtitle="Remix vẫn giữ đăng nhập trước khi tải, nhưng phần này chỉ là preview cho backend."
                  tracks={remixTracks}
                  variant="remix"
                />
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}
