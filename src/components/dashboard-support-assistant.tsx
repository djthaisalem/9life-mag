'use client'

import Link from 'next/link'
import { Bot, ChevronRight, Send, X } from 'lucide-react'
import { FormEvent, useEffect, useRef, useState } from 'react'

type PortalRole = 'artist' | 'manager' | 'booking'
type AssistantReply = { text: string; action?: { label: string; href: string } }
type ChatMessage = AssistantReply & { sender: 'assistant' | 'user' }
type HelpTopic = AssistantReply & { role: PortalRole; keywords: string[] }

const roleContent: Record<PortalRole, { label: string; greeting: string; suggestions: string[] }> = {
  artist: { label: 'Trợ lý Nghệ sĩ', greeting: 'Xin chào. Tôi có thể hướng dẫn bạn hoàn thiện hồ sơ, đăng nhạc và theo dõi booking.', suggestions: ['Cập nhật hồ sơ', 'Upload nhạc', 'Kiểm tra booking'] },
  manager: { label: 'Trợ lý Manager', greeting: 'Xin chào. Tôi sẵn sàng hỗ trợ bạn quản lý roster, hồ sơ Agent, phát hành và ticket.', suggestions: ['Kiểm tra roster', 'Cập nhật Agent', 'Xem ticket'] },
  booking: { label: 'Trợ lý Booking', greeting: 'Xin chào. Tôi có thể hỗ trợ kiểm tra yêu cầu mới, lịch vận hành và các booking cần theo dõi.', suggestions: ['Xem booking mới', 'Kiểm tra lịch', 'Booking cần theo dõi'] },
}

const artistLinks = {
  dashboard: { label: 'Mở tổng quan', href: '/tai-khoan/nghe-si/dashboard' },
  profile: { label: 'Mở Profile', href: '/tai-khoan/nghe-si/dashboard/profile' },
  music: { label: 'Mở Music', href: '/tai-khoan/nghe-si/dashboard/music' },
  media: { label: 'Mở Video & media', href: '/tai-khoan/nghe-si/dashboard/media' },
  booking: { label: 'Mở Booking', href: '/tai-khoan/nghe-si/dashboard/booking' },
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function includesAny(input: string, values: string[]) {
  return values.some((value) => input.includes(value))
}

function greetingReply(): AssistantReply {
  return { text: 'Xin chào, tôi có thể giúp gì bạn? Bạn có thể hỏi về hồ sơ, ảnh cover, upload track, nonstop, album hoặc booking.' }
}

const helpTopics: HelpTopic[] = [
  { role: 'artist', keywords: ['video', 'youtube', 'facebook video', 'facebook reel', 'instagram', 'reel', 'embed'], text: 'Bạn mở Video & media, chọn mẫu Video embed, chọn đúng nền tảng rồi dán link video hoặc link Share. Không cần mã iframe. YouTube, Facebook Video/Reel và Instagram Video/Reel được tự nhận diện; riêng Facebook và Instagram cần nội dung công khai, cho phép nhúng.', action: artistLinks.media },
  { role: 'artist', keywords: ['media kit', 'press kit', 'logo', 'poster', 'visual'], text: 'Mở Video & media để thêm media kit, poster, logo và visual. Ưu tiên ảnh rõ nét, mô tả ngắn và các tư liệu có thể dùng ngay cho booking hoặc editorial.', action: artistLinks.media },
  { role: 'artist', keywords: ['gallery', 'thu vien anh', 'album anh', 'anh san khau'], text: 'Mở Video & media để cập nhật gallery. Profile nên có từ 4 đến 10 ảnh; hệ thống sẽ sắp xếp ảnh ngang và dọc theo khung phù hợp.', action: artistLinks.media },
  { role: 'artist', keywords: ['upload nhac', 'up nhac', 'dang nhac', 'file nhac', 'track'], text: 'Mở Music, chọn Track, điền tên bài và thông tin hiển thị rồi chọn file nhạc. Thêm cover nếu có, kiểm tra tên bài và quyền hiển thị trước khi lưu.', action: artistLinks.music },
  { role: 'artist', keywords: ['soundcloud', 'mixcloud', 'link phat', 'nhung nhac', 'embed nhac'], text: 'Trong Music, chọn loại nguồn phát phù hợp rồi dán link SoundCloud, Mixcloud hoặc YouTube từ thanh địa chỉ hay nút Share. Hệ thống sẽ tự tạo bản xem trước khi nhận diện được link công khai.', action: artistLinks.music },
  { role: 'artist', keywords: ['nonstop', 'dj set', 'playlist'], text: 'Mở Music và chọn Nonstop / Playlist. Điền tên, mô tả ngắn, ảnh cover và file audio cho nonstop; playlist nên đặt tên theo dòng nhạc hoặc bối cảnh nghe.', action: artistLinks.music },
  { role: 'artist', keywords: ['album', 'ep', 'chon track', 'them track vao album'], text: 'Mở Music và chọn Album / EP. Điền thông tin phát hành, ảnh cover, sau đó thêm track từ kho nhạc bằng dấu cộng. Track đã chọn sẽ có dấu trừ để gỡ; hãy sắp thứ tự trước khi lưu.', action: artistLinks.music },
  { role: 'artist', keywords: ['portrait', 'anh dai dien', 'profile', 'ho so', 'gioi thieu', 'kinh nghiem'], text: 'Mở Profile để cập nhật giới thiệu, vai trò, portrait, cover, kinh nghiệm làm việc và thông tin nhận show. Mục nào chưa điền sẽ không hiển thị công khai.', action: artistLinks.profile },
  { role: 'artist', keywords: ['booking', 'dat show', 'soundcheck', 'check in', 'yeu cau show'], text: 'Mở Booking để kiểm tra yêu cầu theo trạng thái. Trước khi làm việc với bên đặt show, hãy rà lại thời gian, địa điểm, soundcheck và kênh liên hệ.', action: artistLinks.booking },
  { role: 'artist', keywords: ['agent', 'quan ly', 'doi agent', 'ticket'], text: 'Tên Agent hiện ở tổng quan dashboard. Nếu cần đổi Agent, nhấn Gửi ticket, chọn Agent mới và thêm lý do nếu cần; yêu cầu sẽ đi theo quy trình phê duyệt.', action: artistLinks.dashboard },
  { role: 'artist', keywords: ['sao', 'thuong', 'duyet ho so', 'phan thuong'], text: 'Bạn xem sao thưởng và các mục cần hoàn thiện tại tổng quan dashboard. Hồ sơ được duyệt và các phần thông tin hoàn thiện có thể tạo thêm sao theo quy định.', action: artistLinks.dashboard },
  { role: 'manager', keywords: ['roster', 'nghe si', 'artist', 'map artist'], text: 'Mở Manager Workspace để xem roster nghệ sĩ đã được CMS map về Agent, rồi chọn từng nghệ sĩ để rà soát hồ sơ, phát hành và booking.', action: { label: 'Mở Manager Workspace', href: '/tai-khoan/nghe-si/manager/dashboard' } },
  { role: 'manager', keywords: ['profile agent', 'ho so agent', 'agent profile'], text: 'Trong Manager Workspace, vào Profile Agent để cập nhật định vị, khu vực, cover, giới thiệu, thế mạnh và dịch vụ hiển thị trên trang Agent công khai.', action: { label: 'Mở Manager Workspace', href: '/tai-khoan/nghe-si/manager/dashboard' } },
  { role: 'manager', keywords: ['ticket', 'doi agent', 'yeu cau'], text: 'Mở Manager Workspace để kiểm tra ticket, đọc lý do thay đổi Agent và phản hồi theo đúng trạng thái xử lý.', action: { label: 'Xem ticket', href: '/tai-khoan/nghe-si/manager/dashboard' } },
  { role: 'booking', keywords: ['booking moi', 'yeu cau moi', 'tiep nhan', 'inbox'], text: 'Mở Booking Workspace và kiểm tra yêu cầu mới. Rà lại ngày giờ, số khách, khu vực bàn, ghi chú và kênh liên hệ trước khi tiếp nhận.', action: { label: 'Mở Booking Workspace', href: '/tai-khoan/nghe-si/booking/dashboard' } },
  { role: 'booking', keywords: ['lich', 'soundcheck', 'check in', 'follow up', 'theo doi'], text: 'Trong Booking Workspace, kiểm tra lịch và các booking đã tiếp nhận. Xác nhận thời gian, người phụ trách và ghi chú vận hành trước ngày diễn ra.', action: { label: 'Mở Booking Workspace', href: '/tai-khoan/nghe-si/booking/dashboard' } },
  { role: 'booking', keywords: ['huy', 'cancel'], text: 'Nếu không thể tiếp nhận yêu cầu, hãy rà lại thông tin rồi chuyển trạng thái hủy để đội vận hành không nhầm lẫn trong danh sách booking.', action: { label: 'Mở Booking Workspace', href: '/tai-khoan/nghe-si/booking/dashboard' } },
]

function findTopic(role: PortalRole, input: string) {
  const tokens = new Set(input.split(/[^a-z0-9]+/).filter((token) => token.length > 1))
  const matches = helpTopics
    .filter((topic) => topic.role === role)
    .map((topic) => ({
      topic,
      score: topic.keywords.reduce((score, keyword) => {
        const normalizedKeyword = normalize(keyword)
        if (input.includes(normalizedKeyword)) return score + (normalizedKeyword.includes(' ') ? 8 : 4)
        return score + (tokens.has(normalizedKeyword) ? 2 : 0)
      }, 0),
    }))
    .sort((first, second) => second.score - first.score)

  return matches[0]?.score ? matches[0].topic : null
}

function artistReply(input: string): AssistantReply {
  if (includesAny(input, ['hello', 'xin chao', 'chao ban', 'hi bot', 'alo'])) return greetingReply()
  const topic = findTopic('artist', input)
  if (topic) return topic
  if (includesAny(input, ['video', 'youtube', 'facebook video', 'facebook reel', 'instagram', 'reel', 'embed'])) return { text: 'Bạn mở Video & media, chọn mẫu Video embed, sau đó chọn đúng nền tảng và dán link video hoặc link Share. Không cần dán mã iframe. Hệ thống sẽ tự nhận diện YouTube, Facebook Video/Reel và Instagram Video/Reel; riêng video Facebook hoặc Instagram cần được đặt công khai và cho phép nhúng.', action: artistLinks.media }
  if (includesAny(input, ['media kit', 'press kit', 'logo', 'poster', 'visual'])) return { text: 'Bạn mở Video & media để thêm ảnh media kit, poster, logo pack và visual. Hãy ưu tiên ảnh rõ nét, mô tả ngắn về concept và dùng gallery để trình bày các tư liệu quan trọng cho booking hoặc editorial.', action: artistLinks.media }
  if (includesAny(input, ['gallery', 'thu vien anh', 'album anh'])) return { text: 'Bạn mở Video & media để cập nhật gallery. Profile nên có tối thiểu 4 và tối đa 10 ảnh; hệ thống sắp xếp ảnh ngang, dọc vào khung phù hợp. Chọn những ảnh thể hiện rõ sân khấu, chân dung và không khí biểu diễn.', action: artistLinks.media }
  if (includesAny(input, ['up nhac', 'upload nhac', 'dang nhac', 'them nhac', 'track'])) return { text: 'Bạn mở Music, chọn tab Track, rồi điền tên bài, thông tin hiển thị và chọn file nhạc. Hãy thêm ảnh cover để bài có nhận diện tốt hơn; nếu chưa có ảnh riêng, hệ thống sẽ dùng cover mặc định. Kiểm tra lại tên bài và quyền hiển thị trước khi lưu.', action: artistLinks.music }
  if (includesAny(input, ['anh cover', 'cover', 'anh bia', 'hinh anh', 'up anh'])) return { text: 'Trong từng biểu mẫu nhạc có ô Chọn ảnh bìa. Bạn chỉ cần chọn ảnh, hệ thống sẽ tự crop về khung vuông 1:1 để hiển thị đồng đều. Ưu tiên ảnh rõ chủ thể, không quá nhiều chữ và giữ dung lượng hợp lý để tải nhanh.', action: artistLinks.music }
  if (includesAny(input, ['nonstop', 'playlist'])) return { text: 'Mở Music và chọn tab Nonstop / Playlist. Điền tên bộ nhạc, mô tả ngắn, ảnh cover và chọn file audio của bộ nonstop. Nếu tạo playlist, hãy đặt tên rõ phong cách hoặc bối cảnh nghe để người dùng dễ tìm.', action: artistLinks.music }
  if (includesAny(input, ['album', 'ep', 'chon track'])) return { text: 'Mở Music và chọn Album / EP. Điền tên album, ảnh cover và thông tin phát hành; bên dưới là kho nhạc của bạn. Nhấn dấu cộng để thêm track vào album, track đã chọn sẽ hiện dấu trừ để gỡ ra. Hãy sắp xếp thứ tự bài trước khi lưu.', action: artistLinks.music }
  if (includesAny(input, ['profile', 'ho so', 'gioi thieu', 'portrait', 'gallery', 'media kit', 'kinh nghiem'])) return { text: 'Mở Profile để cập nhật giới thiệu, vai trò, ảnh portrait, ảnh cover, kinh nghiệm làm việc, gallery, media và thông tin nhận show. Những mục chưa điền sẽ không xuất hiện công khai; hoàn thiện từng mục cũng giúp hồ sơ chuyên nghiệp hơn.', action: artistLinks.profile }
  if (includesAny(input, ['booking', 'dat show', 'yeu cau', 'lich', 'soundcheck', 'check in', 'lien he'])) return { text: 'Mở Booking để xem yêu cầu theo ba trạng thái: đang tiếp nhận, đã tiếp nhận và hủy. Hãy kiểm tra thời gian, địa điểm, yêu cầu soundcheck và thông tin liên hệ trước khi xác nhận với bên đặt show.', action: artistLinks.booking }
  if (includesAny(input, ['agent', 'quan ly', 'doi agent', 'ticket'])) return { text: 'Tên Agent hiện ở trang tổng quan dashboard. Nếu cần thay đổi Agent, dùng nút Gửi ticket để chọn Agent mới và thêm lý do nếu cần. Yêu cầu sẽ được chuyển đến các bên liên quan để xử lý theo quy trình phê duyệt.', action: artistLinks.dashboard }
  if (includesAny(input, ['sao', 'thuong', 'duyet ho so'])) return { text: 'Sau khi hồ sơ được duyệt, nghệ sĩ nhận thưởng khởi tạo. Các phần hồ sơ còn thiếu có thể nhận thêm sao khi hoàn thiện. Bạn xem thống kê và các mục cần cập nhật trong phần tổng quan dashboard.', action: artistLinks.dashboard }
  return { text: 'Tôi có thể hướng dẫn từng bước về Profile, Track, Nonstop / Playlist, Album / EP hoặc Booking. Bạn có thể hỏi ngắn như “up nhạc ở đâu?”, “thêm cover thế nào?” hoặc “xem booking mới”.' }
}

function managerReply(input: string): AssistantReply {
  const workspace = { label: 'Mở Manager Workspace', href: '/tai-khoan/nghe-si/manager/dashboard' }
  if (includesAny(input, ['hello', 'xin chao', 'chao ban', 'hi bot', 'alo'])) return greetingReply()
  const topic = findTopic('manager', input)
  if (topic) return topic
  if (includesAny(input, ['roster', 'nghe si', 'artist', 'map artist'])) return { text: 'Mở Manager Workspace để xem roster nghệ sĩ đã được CMS map về Agent. Từ đây bạn có thể kiểm tra tình trạng hồ sơ, phát hành và booking của từng nghệ sĩ thuộc quyền quản lý.', action: workspace }
  if (includesAny(input, ['profile agent', 'agent', 'ho so'])) return { text: 'Trong Manager Workspace, vào Profile Agent để cập nhật định vị, khu vực hoạt động, ảnh cover, giới thiệu, thế mạnh và dịch vụ. Nội dung đã lưu sẽ hiển thị trên trang Agent công khai.', action: workspace }
  if (includesAny(input, ['ticket', 'doi agent', 'yeu cau'])) return { text: 'Các ticket thay đổi Agent và yêu cầu liên quan được hiển thị trong Manager Workspace. Hãy đọc lý do, kiểm tra nghệ sĩ liên quan và phản hồi theo đúng trạng thái của ticket.', action: workspace }
  if (includesAny(input, ['nhac', 'release', 'album', 'booking'])) return { text: 'Trong roster, chọn đúng nghệ sĩ để rà soát hồ sơ, phát hành và booking. Chỉ dữ liệu đã được CMS phân quyền cho Agent mới xuất hiện tại đây.', action: workspace }
  return { text: 'Tôi có thể hỗ trợ về roster, Profile Agent, phát hành, booking và ticket. Hãy cho tôi biết công việc bạn cần xử lý.', action: workspace }
}

function bookingReply(input: string): AssistantReply {
  const workspace = { label: 'Mở Booking Workspace', href: '/tai-khoan/nghe-si/booking/dashboard' }
  if (includesAny(input, ['hello', 'xin chao', 'chao ban', 'hi bot', 'alo'])) return greetingReply()
  const topic = findTopic('booking', input)
  if (topic) return topic
  if (includesAny(input, ['booking moi', 'yeu cau moi', 'tiep nhan'])) return { text: 'Mở Booking Workspace và kiểm tra mục yêu cầu mới. Đọc kỹ ngày giờ, số khách, khu vực bàn, ghi chú đặc biệt và kênh liên hệ trước khi chuyển trạng thái tiếp nhận.', action: workspace }
  if (includesAny(input, ['lich', 'soundcheck', 'check in', 'follow up', 'theo doi'])) return { text: 'Trong Booking Workspace, dùng khu vực lịch để rà soát các booking đã tiếp nhận và việc cần theo dõi. Ưu tiên xác nhận thời gian, người phụ trách và các ghi chú vận hành trước ngày diễn ra.', action: workspace }
  if (includesAny(input, ['huy', 'cancel'])) return { text: 'Khi một yêu cầu không thể tiếp nhận, hãy kiểm tra lại thông tin và chuyển sang trạng thái hủy. Trạng thái rõ ràng giúp đội vận hành tránh nhầm lẫn khi theo dõi danh sách booking.', action: workspace }
  if (includesAny(input, ['outlet', 'club', 'thong tin'])) return { text: 'Booking Coordinator chỉ quản lý các outlet đã được CMS map cho tài khoản. Hãy kiểm tra đúng outlet trước khi xử lý yêu cầu hoặc cập nhật vận hành.', action: workspace }
  return { text: 'Tôi có thể hỗ trợ kiểm tra yêu cầu mới, lịch vận hành, booking đã tiếp nhận hoặc các việc cần theo dõi. Bạn muốn xử lý phần nào?', action: workspace }
}

function getReply(role: PortalRole, question: string): AssistantReply {
  const input = normalize(question)
  if (role === 'artist') return artistReply(input)
  if (role === 'manager') return managerReply(input)
  return bookingReply(input)
}

export function DashboardSupportAssistant({ role }: { role: PortalRole }) {
  const content = roleContent[role]
  const [isOpen, setIsOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([{ sender: 'assistant', text: content.greeting }])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [isOpen, messages.length])

  function ask(value: string) {
    const trimmed = value.trim()
    if (!trimmed) return
    setMessages((current) => [...current, { sender: 'user', text: trimmed }, { sender: 'assistant', ...getReply(role, trimmed) }])
    setQuestion('')
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    ask(question)
  }

  return <aside className={`dashboard-support-assistant${isOpen ? ' dashboard-support-assistant-open' : ''}`} aria-label={content.label}>
    {isOpen ? <div className="dashboard-support-assistant-panel">
      <div className="dashboard-support-assistant-head"><div><Bot size={18} /><strong>{content.label}</strong></div><button type="button" onClick={() => setIsOpen(false)} aria-label="Thu gọn trợ lý"><X size={17} /></button></div>
      <div className="dashboard-support-assistant-messages">
        {messages.map((message, index) => <div key={`${message.sender}-${message.text}-${index}`} className={`dashboard-support-assistant-message dashboard-support-assistant-message-${message.sender}`}><p>{message.text}</p>{message.action ? <Link href={message.action.href}>{message.action.label}<ChevronRight size={15} /></Link> : null}</div>)}
        <div ref={messagesEndRef} />
      </div>
      <div className="dashboard-support-assistant-suggestions">{content.suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => ask(suggestion)}>{suggestion}</button>)}</div>
      <form onSubmit={submit}><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ví dụ: Tôi cần upload nhạc" aria-label="Nội dung cần hỗ trợ" /><button type="submit" aria-label="Gửi câu hỏi"><Send size={16} /></button></form>
    </div> : null}
    <button type="button" className="dashboard-support-assistant-toggle" onClick={() => setIsOpen((current) => !current)} aria-expanded={isOpen}><Bot size={19} /><span>Trợ lý Dashboard</span></button>
  </aside>
}
