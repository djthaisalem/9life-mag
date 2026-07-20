import Link from 'next/link'
import { CmsDashboardShell } from '@/components/cms-dashboard-shell'
import { cmsMusicGenreRows } from '@/lib/cms-dashboard-data'
import { repairVietnameseText } from '@/lib/repair-vietnamese-text'

export default function CmsMusicCategoriesPage() {
  return (
    <CmsDashboardShell
      activeKey="music"
      title="Thể loại nhạc"
      description="Tạo và quản lý các thể loại dùng cho trang Music và biểu mẫu tải nhạc trong CMS."
    >
      <div className="cms-split-grid">
        <article className="panel">
          <div className="cms-panel-head-inline cms-panel-head-inline-stretch">
            <div>
              <p className="section-eyebrow">Genre Builder</p>
              <h2>Tạo thể loại mới</h2>
            </div>
            <Link href="/cms/dashboard/music" className="button-secondary">
              Quay lại Music
            </Link>
          </div>

          <form className="form-shell cms-embedded-form">
            <div className="field">
              <label htmlFor="genreName">Tên thể loại</label>
              <input id="genreName" placeholder="Afro House" />
            </div>
            <div className="cms-form-two">
              <div className="field">
                <label htmlFor="genreSlug">Slug</label>
                <input id="genreSlug" placeholder="afro-house" />
              </div>
              <div className="field">
                <label htmlFor="genreDisplay">Hiển thị trên trang Music</label>
                <select id="genreDisplay" defaultValue="yes">
                  <option value="yes">Có</option>
                  <option value="no">Không</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="genreDescription">Mô tả ngắn</label>
              <textarea
                id="genreDescription"
                placeholder="Mô tả ngắn về phong cách, mood hoặc ngữ cảnh phù hợp của thể loại này."
              />
            </div>
            <div className="cms-inline-actions">
              <button type="button" className="button">
                Lưu thể loại
              </button>
            </div>
          </form>
        </article>

        <article className="panel">
          <p className="section-eyebrow">Current Genres</p>
          <h2>Thể loại hiện có</h2>
          <div className="cms-rule-list">
            {cmsMusicGenreRows.map((genre) => (
              <div key={genre.id} className="cms-rule-item">
                <span className="account-benefit-dot" />
                <p>
                  <strong>{genre.name}</strong>
                  <br />
                  {repairVietnameseText(genre.description)}
                  <br />
                  {genre.showOnMusicPage ? 'Hiển thị trên trang Music' : 'Chỉ dùng trong CMS'} • {genre.musicCount} nội dung
                </p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </CmsDashboardShell>
  )
}
