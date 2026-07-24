import { vietnamLocationNames } from '@/lib/vietnam-locations'

export type ArtistPortalSectionKey = 'profile' | 'music' | 'media' | 'content' | 'booking'

export type ArtistPortalField = {
  label: string
  name: string
  type: 'text' | 'textarea' | 'select' | 'trackpicker' | 'file'
  placeholder?: string
  options?: string[]
  accept?: string
  helper?: string
  maxSizeMb?: number
  multiple?: boolean
  optional?: boolean
}

export type ArtistPortalTemplate = {
  title: string
  description: string
  fields: ArtistPortalField[]
}

export type ArtistPortalSection = {
  key: ArtistPortalSectionKey
  tabLabel: string
  eyebrow: string
  title: string
  intro: string
  publicHref: string
  publicLabel: string
  heroMetrics: { label: string; value: string }[]
  workflow: { title: string; status: string; detail: string }[]
  starterChecklist: string[]
  templates: ArtistPortalTemplate[]
}

export const artistPortalSections: ArtistPortalSection[] = [
  {
    key: 'profile',
    tabLabel: 'Profile artist',
    eyebrow: 'Artist Identity',
    title: 'Chỉnh hồ sơ nghệ sĩ theo chuẩn booking và truyền thông',
    intro:
      'Khu này dành cho bio, tag nghề nghiệp, thành phố hoạt động, điểm nổi bật, headline và toàn bộ phần giới thiệu xuất hiện trên profile public.',
    publicHref: '/nghe-si/neon-viper',
    publicLabel: 'Xem profile public',
    heroMetrics: [
      { label: 'Trạng thái hồ sơ', value: 'Draft 82%' },
      { label: 'Block cần bổ sung', value: '04' },
      { label: 'CTA đang hiển thị', value: '03' },
    ],
    workflow: [
      { title: 'Hero headline', status: 'Cần duyệt', detail: 'Kiểm tra lại câu mô tả nổi bật và booking positioning.' },
      { title: 'Social proof', status: 'Đã đủ', detail: 'Có thể dùng ngay cho profile public và trang booking.' },
      { title: 'Performance cities', status: 'Cần cập nhật', detail: 'Bổ sung thêm city nhận show để lọc trong CMS sau này.' },
    ],
    starterChecklist: [
      'Điền headline ngắn 1 câu để người xem hiểu nghệ sĩ chơi dòng gì.',
      'Thêm bio 2 phiên bản: ngắn cho card và dài cho profile chi tiết.',
      'Khai báo nghề nghiệp, giới tính, thành phố để sau này CMS lọc top như Nữ DJ, Nam Rapper.',
      'Chuẩn bị 1 ảnh đứng, 1 ảnh ngang và 1 cover để tránh vỡ layout.',
    ],
    templates: [
      {
        title: 'Mẫu bio cơ bản',
        description: 'Dùng cho nghệ sĩ mới đăng ký lần đầu, chỉ cần điền rồi thay bằng nội dung thật sau.',
        fields: [
          { label: 'Tên nghệ sĩ', name: 'artistName', type: 'text', placeholder: 'Ví dụ: Neon Viper' },
          { label: 'Headline', name: 'headline', type: 'text', placeholder: 'DJ / Producer theo phong cách house, melodic, peak-time' },
          {
            label: 'Mức giá booking',
            name: 'bookingRate',
            type: 'text',
            placeholder: 'Ví dụ: 18.000.000 VND / set',
            optional: true,
            helper: 'Có thể để trống, khi đó profile sẽ hiển thị kiểu liên hệ để biết thêm chi tiết.',
          },
          { label: 'Tình trạng nhận show', name: 'availability', type: 'text', placeholder: 'Open booking / Limited slots / Theo lịch' },
          {
            label: 'Bio ngắn',
            name: 'shortBio',
            type: 'textarea',
            placeholder: 'Viết 2-3 câu ngắn mô tả cá tính biểu diễn, thị trường hoạt động và năng lượng sân khấu.',
          },
          {
            label: 'Vai trò chính',
            name: 'primaryRole',
            type: 'select',
            options: ['DJ Producer', 'MC Hype', 'Rapper', 'Dancer', 'Photographer', 'Singer'],
          },
          {
            label: 'Ảnh portrait',
            name: 'portraitUpload',
            type: 'file',
            accept: 'image/png,image/jpeg,image/webp',
            maxSizeMb: 10,
            helper: 'Kích thước khuyên dùng: 1200 x 1600px, ảnh dọc tỷ lệ 3:4.',
          },
          {
            label: 'Ảnh cover ngang',
            name: 'coverUpload',
            type: 'file',
            accept: 'image/png,image/jpeg,image/webp',
            maxSizeMb: 10,
            helper: 'Kích thước khuyên dùng: 1920 x 1080px, ảnh ngang tỷ lệ 16:9.',
          },
        ],
      },
      {
        title: 'Mẫu profile chi tiết',
        description: 'Khung điền sâu hơn để khớp với những block đang có trên trang profile public.',
        fields: [
          { label: 'Giới tính', name: 'gender', type: 'select', options: ['Nữ', 'Nam', 'Khác'] },
          { label: 'Khu vực hoạt động', name: 'region', type: 'select', options: ['Miền Nam', 'Miền Trung', 'Miền Bắc'] },
          { label: 'Tỉnh / thành phố chính', name: 'city', type: 'select', options: vietnamLocationNames },
          { label: 'Tag dòng nhạc', name: 'genres', type: 'text', placeholder: 'House, Open format, Vinahouse, Afro, Remix' },
          { label: 'Giới thiệu dài', name: 'longBio', type: 'textarea', placeholder: 'Viết câu chuyện nghệ sĩ, màu sắc biểu diễn, định hướng hình ảnh, kinh nghiệm sân khấu...' },
          { label: 'Kinh nghiệm làm việc', name: 'workExperience', type: 'textarea', placeholder: 'Mỗi dòng một kinh nghiệm: festival, venue, brand campaign, tour hoặc vai trò chuyên môn.' },
          { label: 'Điểm mạnh sân khấu', name: 'signatureMoments', type: 'textarea', placeholder: 'Liệt kê các thế mạnh như peak-time control, crowd interaction, open-format flexibility...' },
          { label: 'Khu vực nhận booking', name: 'bookingCities', type: 'textarea', placeholder: 'TP.HCM, Hà Nội, Đà Nẵng, Phú Quốc...' },
          { label: 'Ghi chú booking', name: 'bookingNotes', type: 'textarea', placeholder: 'Các lưu ý quan trọng cho đối tác khi liên hệ booking.' },
          { label: 'Rider cơ bản', name: 'basicRider', type: 'textarea', placeholder: 'CDJ / Mixer / Monitor / Hospitality / Booth setup...' },
        ],
      },
    ],
  },
  {
    key: 'music',
    tabLabel: 'Music links',
    eyebrow: 'Music Control',
    title: 'Quản lý link nhạc, track nổi bật và danh mục nghe thử',
    intro:
      'Tập trung cho SoundCloud, YouTube, playlist, remix pack, premium link và các track dùng cho player trung tâm trên site.',
    publicHref: '/music',
    publicLabel: 'Xem trang music public',
    heroMetrics: [
      { label: 'Track active', value: '24' },
      { label: 'Playlist đang live', value: '07' },
      { label: 'Link lỗi cần kiểm tra', value: '02' },
    ],
    workflow: [
      { title: 'Featured nonstop', status: 'Live', detail: 'Đang hiển thị ở music page và home section.' },
      { title: 'Top remix', status: 'Cần thêm', detail: 'Thêm thumbnail chuẩn dọc và nút download gating.' },
      { title: 'Premium release', status: 'Chuẩn bị', detail: 'Sẽ nối với star unlock và download control.' },
    ],
    starterChecklist: [
      'Tạo tối thiểu 1 playlist nonstop, 1 top remix và 3 single để page không bị trống.',
      'Mỗi track cần thumbnail, thời lượng, credit artist và link nguồn phát.',
      'Đánh dấu track nào cho download, track nào chỉ preview.',
      'Chuẩn bị mô tả ngắn để user biết vibe của từng playlist.',
    ],
    templates: [
      {
        title: 'Mẫu track đầu tiên',
        description: 'Form mẫu cho nghệ sĩ mới thêm bài nhạc đầu tiên vào hệ thống.',
        fields: [
          { label: 'Tên track', name: 'trackTitle', type: 'text', placeholder: 'After Hours Rework' },
          { label: 'Loại phát hành', name: 'releaseType', type: 'select', options: ['Track', 'Remix', 'Nonstop'] },
          { label: 'Nguồn phát', name: 'sourceType', type: 'select', options: ['SoundCloud', 'Mixcloud', 'YouTube', 'MP3 nội bộ', 'Spotify'] },
          { label: 'Link phát', name: 'sourceUrl', type: 'text', placeholder: 'Dán link SoundCloud, Mixcloud hoặc YouTube từ trình duyệt / nút Share.' },
          {
            label: 'Upload file nhạc',
            name: 'audioUpload',
            type: 'file',
            accept: 'audio/mpeg,audio/wav,audio/mp4,.mp3,.wav,.m4a',
          },
          { label: 'Ảnh bìa track', name: 'trackCover', type: 'file', accept: 'image/png,image/jpeg,image/webp', maxSizeMb: 10, helper: 'Ảnh sẽ tự crop về khung vuông 1:1. Nếu bỏ trống, hệ thống dùng cover mặc định.' },
          { label: 'Mô tả ngắn', name: 'trackNote', type: 'textarea', placeholder: 'Bản edit dùng cho club set, năng lượng tăng dần sau drop 2.' },
        ],
      },
      {
        title: 'Mẫu playlist / nonstop',
        description: 'Dùng để khởi tạo nonstop hoặc mixset đầu tiên.',
        fields: [
          { label: 'Tên nonstop / mixset', name: 'playlistName', type: 'text', placeholder: 'Nonstop Peak Hour 01' },
          { label: 'Loại nội dung', name: 'playlistType', type: 'select', options: ['Nonstop', 'Mixset', 'Top Remix', 'Premium Drop'] },
          { label: 'Mood / vibe', name: 'playlistMood', type: 'text', placeholder: 'Peak-time, sexy house, after-hours' },
          { label: 'File nonstop / mix', name: 'nonstopAudioUpload', type: 'file', accept: 'audio/mpeg,audio/wav,audio/mp4,.mp3,.wav,.m4a', helper: 'Dùng khi nội dung là Nonstop hoặc DJ mix. File sẽ được xử lý trước khi phát hành.' },
          {
            label: 'Upload cover playlist',
            name: 'playlistCover',
            type: 'file',
            accept: 'image/png,image/jpeg,image/webp',
            maxSizeMb: 10,
            helper: 'Ảnh sẽ tự crop về khung vuông 1:1. Nếu bỏ trống, hệ thống dùng cover mặc định.',
          },
          { label: 'Ghi chú hiển thị', name: 'playlistDescription', type: 'textarea', placeholder: 'Giới thiệu ngắn để hiển thị ở page music và player.' },
        ],
      },
      {
        title: 'Mẫu album / EP',
        description: 'Tạo album, EP hoặc mixtape để sau này Admin có thể gắn các track đã duyệt vào cùng một phát hành.',
        fields: [
          { label: 'Tên album / EP', name: 'albumTitle', type: 'text', placeholder: 'Electric Bloom' },
          { label: 'Định dạng', name: 'albumFormat', type: 'select', options: ['Album', 'EP', 'Mixtape', 'DJ Set'] },
          { label: 'Ngày phát hành dự kiến', name: 'albumReleaseDate', type: 'text', placeholder: 'Ví dụ: 18.07.2026' },
          { label: 'Upload file nhạc cho album', name: 'albumAudioUploads', type: 'file', accept: 'audio/mpeg,audio/wav,audio/mp4,.mp3,.wav,.m4a', multiple: true, helper: 'Có thể chọn nhiều file cùng lúc để lưu vào bản nháp album. File chỉ được xử lý vào kho phát hành sau khi gửi duyệt.' },
          { label: 'Track trong album', name: 'albumExistingTracks', type: 'trackpicker', options: ['Water Lily Club Remix', 'Rooftop Pulse', 'After Hours Rework', 'Saigon Neon Edit'], helper: 'Thêm hoặc gỡ từng track bằng nút bên phải. Danh sách này sẽ tự lấy từ kho nhạc của nghệ sĩ khi kết nối dữ liệu thật.' },
          { label: 'Ảnh bìa album', name: 'albumCover', type: 'file', accept: 'image/png,image/jpeg,image/webp', maxSizeMb: 10, helper: 'Ảnh sẽ tự crop về khung vuông 1:1. Nếu bỏ trống, hệ thống dùng cover mặc định.' },
          { label: 'Mô tả album', name: 'albumDescription', type: 'textarea', placeholder: 'Giới thiệu ngắn về concept, dòng nhạc và các track sẽ được gắn vào album.' },
        ],
      },
    ],
  },
  {
    key: 'media',
    tabLabel: 'Video & media',
    eyebrow: 'Media Pack',
    title: 'Quản lý video embed, gallery, visual pack và media kit',
    intro:
      'Nơi gom toàn bộ YouTube, Facebook video, ảnh gallery, poster, logo pack và visual phục vụ booking hoặc editorial.',
    publicHref: '/nghe-si/neon-viper',
    publicLabel: 'Xem profile media public',
    heroMetrics: [
      { label: 'Gallery assets', value: '132' },
      { label: 'Video embed', value: '09' },
      { label: 'Media kit ready', value: '01' },
    ],
    workflow: [
      { title: 'Hero gallery', status: 'Live', detail: 'Đang dùng cho profile public và press mentions.' },
      { title: 'Video recap', status: 'Cần thay', detail: 'Nên đổi clip dọc thành landscape cho embed đẹp hơn.' },
      { title: 'Logo pack', status: 'Đủ dùng', detail: 'Có bản nền tối, nền sáng và file dùng cho poster outlet.' },
    ],
    starterChecklist: [
      'Tải lên tối thiểu 6 ảnh để gallery nhìn đầy đặn.',
      'Chuẩn bị 1 video set dài và 1 teaser ngắn cho social embed.',
      'Tách logo, photo portrait và cover thành 3 nhóm khác nhau.',
      'Nếu chưa có media kit hoàn chỉnh, dùng mẫu note sẵn bên dưới để điền trước.',
    ],
    templates: [
      {
        title: 'Mẫu video embed',
        description: 'Dán link YouTube, Facebook hoặc Instagram trực tiếp từ trình duyệt hay nút Share. Hệ thống sẽ tự tạo player phù hợp.',
        fields: [
          { label: 'Tiêu đề video', name: 'videoTitle', type: 'text', placeholder: 'Live at District 9 Pulse' },
          { label: 'Nền tảng', name: 'videoPlatform', type: 'select', options: ['YouTube', 'Facebook Video', 'Facebook Reel', 'Instagram Video / Reel'] },
          { label: 'Link video', name: 'videoUrl', type: 'text', placeholder: 'Dán link video hoặc link Share, không cần mã iframe.' },
          { label: 'Caption', name: 'videoCaption', type: 'textarea', placeholder: 'Mô tả ngắn cho bối cảnh set, crowd và concept visual.' },
        ],
      },
      {
        title: 'Mẫu media kit',
        description: 'Bộ thông tin thay thế tạm thời khi nghệ sĩ chưa có press kit hoàn chỉnh.',
        fields: [
          { label: 'Điểm mạnh sân khấu', name: 'stageStrength', type: 'text', placeholder: 'Peak-time control, crowd interaction, flexible open-format' },
          {
            label: 'Upload ảnh media kit',
            name: 'mediaKitImages',
            type: 'file',
            accept: 'image/png,image/jpeg,image/webp',
            maxSizeMb: 10,
          },
          { label: 'Yêu cầu kỹ thuật', name: 'techRider', type: 'textarea', placeholder: 'Mixer, monitoring, visual cue, microphone...' },
          { label: 'Tài sản có sẵn', name: 'assetInventory', type: 'textarea', placeholder: 'Logo PNG, profile photo, 6 gallery shots, 2 recap video...' },
        ],
      },
    ],
  },
  {
    key: 'content',
    tabLabel: 'Editorial',
    eyebrow: 'Content Control',
    title: 'Quản lý bài viết, spotlight, press release và CTA liên quan',
    intro:
      'Dùng để liên kết các bài viết về nghệ sĩ, gắn CTA đúng, lưu press note và theo dõi nội dung editorial đang hiển thị ngoài frontend.',
    publicHref: '/tin-tuc',
    publicLabel: 'Xem trang tin tức public',
    heroMetrics: [
      { label: 'Bài đang live', value: '09' },
      { label: 'Bài draft', value: '03' },
      { label: 'CTA cần rà soát', value: '02' },
    ],
    workflow: [
      { title: 'Feature article', status: 'Live', detail: 'Đã gắn link về profile và booking.' },
      { title: 'Press release', status: 'Draft', detail: 'Đang chờ quote chính thức từ manager.' },
      { title: 'Campaign CTA', status: 'Cần sửa', detail: 'Nên chuyển sang link music frontend thay vì route cũ.' },
    ],
    starterChecklist: [
      'Tạo 1 bài giới thiệu nghệ sĩ, 1 bài recap show và 1 bài announcement.',
      'Mỗi bài nên có 1 CTA chính: nghe nhạc, booking hoặc xem profile.',
      'Chuẩn bị headline, excerpt và ảnh cover chuẩn ngang.',
      'Thêm keyword ngắn để sau này CMS dễ lọc và tìm kiếm.',
    ],
    templates: [
      {
        title: 'Mẫu bài spotlight',
        description: 'Dùng khi chưa có team content riêng nhưng vẫn muốn hiển thị bài mở đầu chuyên nghiệp.',
        fields: [
          { label: 'Headline', name: 'articleTitle', type: 'text', placeholder: 'Neon Viper mang peak-time energy trở lại Sài Gòn' },
          { label: 'Excerpt', name: 'articleExcerpt', type: 'textarea', placeholder: 'Viết 2-3 câu tóm tắt để dùng cho card và SEO intro.' },
          { label: 'CTA chính', name: 'articleCta', type: 'select', options: ['Nghe nhạc', 'Booking', 'Xem profile', 'Xem video'] },
          { label: 'Note biên tập', name: 'editorialNote', type: 'textarea', placeholder: 'Tone bài, từ khóa, thông tin cần nhấn mạnh.' },
        ],
      },
    ],
  },
  {
    key: 'booking',
    tabLabel: 'Booking',
    eyebrow: 'Booking Operation',
    title: 'Điều phối booking, rider, quote và follow-up theo từng lead',
    intro:
      'Khu quản lý các yêu cầu booking riêng của nghệ sĩ để team nội bộ hoặc manager có thể xử lý chuyên nghiệp theo trạng thái.',
    publicHref: '/booking',
    publicLabel: 'Xem form booking public',
    heroMetrics: [
      { label: 'Lead mới', value: '18' },
      { label: 'Deal đang bàn', value: '06' },
      { label: 'Show đã chốt', value: '12' },
    ],
    workflow: [
      { title: 'Lead intake', status: 'Live', detail: 'Thu lead từ website, fanpage và agent partner.' },
      { title: 'Quote sheet', status: 'Cần chuẩn hóa', detail: 'Nên có cấu trúc giá theo city, slot và set length.' },
      { title: 'Hospitality rider', status: 'Draft', detail: 'Tạo mẫu ngắn cho nghệ sĩ mới để gửi nhanh.' },
    ],
    starterChecklist: [
      'Điền mức giá tham khảo, khu vực nhận show và đầu mối liên hệ.',
      'Chuẩn bị rider ngắn để team booking trả lời nhanh cho lead mới.',
      'Thiết lập mẫu phản hồi xác nhận nhận lead và mẫu từ chối lịch.',
      'Xác định rõ timeline cần báo chốt để tránh mất show.',
    ],
    templates: [
      {
        title: 'Mẫu lead booking đầu tiên',
        description: 'Dùng để tạo một case mẫu khi nghệ sĩ vừa đăng ký portal.',
        fields: [
          { label: 'Tên venue / outlet', name: 'venueName', type: 'text', placeholder: 'Velvet Room' },
          { label: 'Thành phố', name: 'venueCity', type: 'text', placeholder: 'TP.HCM' },
          { label: 'Mức giá booking', name: 'bookingRate', type: 'text', placeholder: 'Có thể để trống nếu muốn liên hệ để biết thêm chi tiết', optional: true },
          { label: 'Loại show', name: 'showType', type: 'select', options: ['Headline set', 'Support set', 'Guest appearance', 'Private event'] },
          { label: 'Ghi chú deal', name: 'bookingNotes', type: 'textarea', placeholder: 'Khung giờ, ngân sách, số người đi cùng, yêu cầu visual...' },
        ],
      },
      {
        title: 'Mẫu rider rút gọn',
        description: 'Khởi tạo nhanh cho nghệ sĩ mới, có thể dùng tạm trước khi hoàn thiện rider chính thức.',
        fields: [
          { label: 'Set length', name: 'setLength', type: 'text', placeholder: '60 / 90 / 120 phút' },
          { label: 'Thiết bị cần có', name: 'gearNeeds', type: 'textarea', placeholder: 'CDJ / Mixer / Mic / Booth monitor...' },
          { label: 'Hospitality note', name: 'hospitality', type: 'textarea', placeholder: 'Nước, khăn, phòng chờ, guest list...' },
        ],
      },
    ],
  },
]

export function getArtistPortalSection(section: string) {
  return artistPortalSections.find((item) => item.key === section)
}
