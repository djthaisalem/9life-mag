export type NewsCatalogArticle = {
  slug: string
  category: 'Sự kiện' | 'Nightlife' | 'Nghệ sĩ' | 'Review' | 'Hậu trường' | 'Xu hướng'
  date: string
  title: string
  summary: string
  image: string
}

const images = [
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1400&h=860&fit=crop',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1400&h=860&fit=crop',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1400&h=860&fit=crop',
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1400&h=860&fit=crop',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1400&h=860&fit=crop',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1400&h=860&fit=crop',
]

export const newsCatalogSupplement: NewsCatalogArticle[] = [
  { slug: 'summer-club-calendar-da-nang-2026', category: 'Sự kiện', date: '24.06.2026', title: 'Lịch club mùa hè Đà Nẵng bắt đầu dày đặc với nhiều format mới', summary: 'Các đêm theo chủ đề, khách mời khu vực và chương trình rooftop đang tạo nhịp sôi động cho mùa du lịch.', image: images[0] },
  { slug: 'warehouse-show-viet-nam-production', category: 'Sự kiện', date: '23.06.2026', title: 'Warehouse show trở lại với tiêu chuẩn production chỉn chu hơn', summary: 'Không gian công nghiệp được làm mới bằng âm thanh, visual và luồng trải nghiệm được thiết kế kỹ hơn.', image: images[1] },
  { slug: 'beach-club-sunset-series', category: 'Sự kiện', date: '22.06.2026', title: 'Sunset series giúp beach club kéo dài trải nghiệm từ chiều đến khuya', summary: 'Format chuyển mood theo thời gian đang tạo sức hút với nhóm khách thích trải nghiệm trọn vẹn.', image: images[2] },
  { slug: 'campus-night-festival-format', category: 'Sự kiện', date: '21.06.2026', title: 'Campus night festival ưu tiên line-up có khả năng kết nối cộng đồng', summary: 'Sân chơi mới cho nghệ sĩ trẻ tập trung vào trải nghiệm khán giả và hoạt động tương tác tại chỗ.', image: images[3] },
  { slug: 'opening-weekend-venue-playbook', category: 'Sự kiện', date: '20.06.2026', title: 'Opening weekend: Cách venue xây nhịp truyền thông cho ba đêm đầu tiên', summary: 'Lịch công bố, kịch bản nội dung và trải nghiệm khách mời cần được thiết kế thành một chuỗi liền mạch.', image: images[4] },
  { slug: 'nightlife-charity-gala-concept', category: 'Sự kiện', date: '19.06.2026', title: 'Gala nightlife thử nghiệm concept kết nối âm nhạc và hoạt động cộng đồng', summary: 'Một format mới đặt trải nghiệm giải trí cạnh mục tiêu tạo giá trị xã hội rõ ràng.', image: images[5] },

  { slug: 'late-night-dining-club-culture', category: 'Nightlife', date: '18.06.2026', title: 'Late-night dining đang trở thành điểm bắt đầu mới của club culture', summary: 'Venue kết hợp ẩm thực, âm nhạc và bàn riêng để kéo dài hành trình của khách trong đêm.', image: images[0] },
  { slug: 'guest-list-experience-venue', category: 'Nightlife', date: '17.06.2026', title: 'Guest list được làm lại để tạo trải nghiệm đón khách chuyên nghiệp hơn', summary: 'Quy trình check-in rõ ràng giúp venue giữ được không khí cao cấp ngay từ điểm chạm đầu tiên.', image: images[1] },
  { slug: 'club-residency-thu-nam', category: 'Nightlife', date: '16.06.2026', title: 'Club residency thứ Năm mở ra nhịp đi chơi mới cho khách thành thị', summary: 'Một lịch cố định giữa tuần tạo thói quen quay lại và giúp venue xây cộng đồng trung thành.', image: images[2] },
  { slug: 'rooftop-service-flow-nightlife', category: 'Nightlife', date: '15.06.2026', title: 'Service flow quyết định cảm nhận premium của một rooftop night', summary: 'Từ đặt bàn đến thanh toán, vận hành mượt mà giúp trải nghiệm âm nhạc không bị gián đoạn.', image: images[3] },
  { slug: 'private-room-club-experience', category: 'Nightlife', date: '14.06.2026', title: 'Private room được nâng cấp thành một phần của trải nghiệm club', summary: 'Không gian riêng cần có âm thanh, ánh sáng và dịch vụ phù hợp với tổng thể chương trình.', image: images[4] },
  { slug: 'safe-night-out-community', category: 'Nightlife', date: '13.06.2026', title: 'Một đêm đi chơi an toàn đang trở thành tiêu chuẩn mới của cộng đồng', summary: 'Thông tin minh bạch, đội hỗ trợ và quy trình vận hành giúp khách tận hưởng nightlife tích cực hơn.', image: images[5] },

  { slug: 'dj-profile-storytelling-2026', category: 'Nghệ sĩ', date: '12.06.2026', title: 'DJ profile cần câu chuyện rõ ràng hơn là chỉ một bộ ảnh đẹp', summary: 'Thông tin phù hợp, video và playlist giúp venue hiểu nhanh định vị của nghệ sĩ.', image: images[0] },
  { slug: 'rapper-live-band-collaboration', category: 'Nghệ sĩ', date: '11.06.2026', title: 'Rapper và live band mở rộng không gian biểu diễn cho sân khấu đêm', summary: 'Các màn kết hợp đang tạo thêm lựa chọn cho chương trình cần cảm xúc và năng lượng trực tiếp.', image: images[1] },
  { slug: 'mc-hype-crowd-reading', category: 'Nghệ sĩ', date: '10.06.2026', title: 'MC Hype giỏi đọc crowd đang trở thành mắt xích quan trọng của show', summary: 'Khả năng dẫn nhịp đúng lúc giúp giữ năng lượng mà không làm lấn át âm nhạc.', image: images[2] },
  { slug: 'dancer-visual-performance-profile', category: 'Nghệ sĩ', date: '09.06.2026', title: 'Dancer xây profile theo hướng visual performance để nhận show tốt hơn', summary: 'Gallery, kinh nghiệm và video ngắn là các tài sản cần thiết cho hồ sơ biểu diễn.', image: images[3] },
  { slug: 'photographer-nightlife-portfolio', category: 'Nghệ sĩ', date: '08.06.2026', title: 'Photographer nightlife cần portfolio kể được nhịp của một đêm diễn', summary: 'Hình ảnh tốt không chỉ đẹp mà còn phải thể hiện đúng năng lượng của venue và crowd.', image: images[4] },
  { slug: 'designer-event-identity-collab', category: 'Nghệ sĩ', date: '07.06.2026', title: 'Designer trở thành đối tác quan trọng trong nhận diện của event', summary: 'Visual identity nhất quán giúp chương trình dễ được ghi nhớ trước và sau đêm diễn.', image: images[5] },

  { slug: 'review-afterhours-techno-room', category: 'Review', date: '06.06.2026', title: 'Review: Afterhours techno room và cách giữ năng lượng đến sáng', summary: 'Một format âm nhạc tập trung vào nhịp chuyển dài, âm thanh chắc và trải nghiệm không bị đứt mạch.', image: images[0] },
  { slug: 'review-female-dj-open-format', category: 'Review', date: '05.06.2026', title: 'Review: Open format set cân bằng hit quen thuộc và cá tính riêng', summary: 'Cách chọn nhạc linh hoạt giúp DJ vừa kết nối được crowd vừa giữ được bản sắc.', image: images[1] },
  { slug: 'review-premium-lounge-sound', category: 'Review', date: '04.06.2026', title: 'Review: Premium lounge cần âm thanh vừa đủ để khách trò chuyện', summary: 'Chất lượng hệ thống và cách xử lý volume quyết định sự thoải mái của không gian.', image: images[2] },
  { slug: 'review-rooftop-house-session', category: 'Review', date: '03.06.2026', title: 'Review: House session trên rooftop khi hoàng hôn chuyển sang đêm', summary: 'Một hành trình âm nhạc có cấu trúc tốt giúp mood của khán giả thay đổi tự nhiên.', image: images[3] },
  { slug: 'review-urban-showcase-night', category: 'Review', date: '02.06.2026', title: 'Review: Urban showcase night tạo không gian cho rap và performance', summary: 'Sân khấu gần crowd mang lại cảm giác kết nối mạnh hơn cho những phần trình diễn trực tiếp.', image: images[4] },
  { slug: 'review-dj-duo-peak-hour', category: 'Review', date: '01.06.2026', title: 'Review: DJ duo peak-hour và bài toán phối hợp trên sân khấu', summary: 'Khi hai nghệ sĩ chia sẻ booth đúng cách, set diễn có thể tạo được nhiều lớp năng lượng hơn.', image: images[5] },

  { slug: 'backstage-lighting-cue-sheet', category: 'Hậu trường', date: '31.05.2026', title: 'Cue sheet ánh sáng giúp đội show vận hành chính xác hơn', summary: 'Một bản kế hoạch rõ ràng giúp âm nhạc, visual và ánh sáng gặp nhau đúng khoảnh khắc.', image: images[0] },
  { slug: 'backstage-artist-soundcheck-flow', category: 'Hậu trường', date: '30.05.2026', title: 'Soundcheck cần được chuẩn hóa để nghệ sĩ vào show tự tin hơn', summary: 'Checklist đúng giúp giảm rủi ro kỹ thuật và dành nhiều thời gian hơn cho phần biểu diễn.', image: images[1] },
  { slug: 'backstage-content-crew-night', category: 'Hậu trường', date: '29.05.2026', title: 'Content crew cần brief gì trước một đêm diễn lớn', summary: 'Góc máy, khoảnh khắc ưu tiên và timeline giao file cần thống nhất trước khi cửa mở.', image: images[2] },
  { slug: 'backstage-venue-security-briefing', category: 'Hậu trường', date: '28.05.2026', title: 'Briefing an ninh là phần không thể thiếu của vận hành nightlife', summary: 'Quy trình rõ ràng giúp đội ngũ xử lý tình huống bình tĩnh và giữ trải nghiệm tích cực.', image: images[3] },
  { slug: 'backstage-rider-hospitality-checklist', category: 'Hậu trường', date: '27.05.2026', title: 'Rider và hospitality checklist giúp booking ngày show bớt áp lực', summary: 'Thông tin được chuẩn bị từ sớm giúp nghệ sĩ và venue cùng tập trung vào phần trình diễn.', image: images[4] },
  { slug: 'backstage-recap-delivery-workflow', category: 'Hậu trường', date: '26.05.2026', title: 'Workflow giao recap sau show quyết định tốc độ truyền thông', summary: 'Tài sản nội dung cần được phân loại và bàn giao nhanh để không bỏ lỡ thời điểm tốt nhất.', image: images[5] },

  { slug: 'trend-community-curated-playlist', category: 'Xu hướng', date: '25.05.2026', title: 'Playlist do cộng đồng curate đang tạo thêm cơ hội cho nhạc mới', summary: 'Danh sách nghe có chủ đề giúp người dùng khám phá track và hỗ trợ creator nhận diện tốt hơn.', image: images[0] },
  { slug: 'trend-vertical-video-club-recap', category: 'Xu hướng', date: '24.05.2026', title: 'Video dọc đang định hình cách venue kể lại một đêm diễn', summary: 'Nhịp dựng nhanh và khoảnh khắc thật giúp recap phù hợp hơn với hành vi xem hiện tại.', image: images[1] },
  { slug: 'trend-premium-drop-community-access', category: 'Xu hướng', date: '23.05.2026', title: 'Premium drop tạo thêm lớp trải nghiệm cho cộng đồng nghe nhạc', summary: 'Quyền truy cập có thời hạn giúp nội dung độc quyền được giới thiệu theo cách rõ ràng hơn.', image: images[2] },
  { slug: 'trend-artist-media-kit-automation', category: 'Xu hướng', date: '22.05.2026', title: 'Media kit số giúp nghệ sĩ cập nhật thông tin nhanh và chính xác hơn', summary: 'Profile sống giúp venue luôn nhìn thấy đúng dữ liệu mới nhất trước khi gửi booking.', image: images[3] },
  { slug: 'trend-nightlife-local-guides', category: 'Xu hướng', date: '21.05.2026', title: 'Local guide giúp khán giả khám phá nightlife theo từng thành phố', summary: 'Nội dung theo khu vực giúp người xem chọn venue, event và trải nghiệm phù hợp hơn.', image: images[4] },
]

export function getSupplementArticleDetail(article: NewsCatalogArticle) {
  return {
    ...article,
    body: [
      article.summary,
      'Bài viết mẫu này được xây dựng để biên tập viên có thể thay thế nội dung, hình ảnh và dữ liệu hiển thị trực tiếp từ CMS mà vẫn giữ nguyên cấu trúc đọc dễ theo dõi.',
      'Các bài liên quan, metadata chia sẻ và vị trí phân phối trên trang Tin tức sẽ được hệ thống xác định từ chuyên mục và slug của bài viết.',
    ],
  }
}
