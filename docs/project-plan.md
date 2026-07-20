# 9LIFE MAG Project Plan

## Tài liệu nguồn đã đọc

- `9life landing.txt`
- `Website_Music_News_Platform_Project_Structure.docx`

## Phạm vi MVP được chốt

- News / Editorial
- Artist profile
- Booking request workflow
- Music catalog và product package
- Order, payment reconciliation, entitlement
- Customer account và download library
- Payload admin cho team vận hành

## Quyết định kỹ thuật cốt lõi

- Kiến trúc: modular monolith
- Frontend: Next.js App Router
- CMS / backend: Payload CMS
- Database: PostgreSQL
- Object storage: Cloudflare R2 private bucket

## Những phần đã có skeleton

- Route công khai
- Collection schema chính
- Environment template
- Health endpoint
- UI mẫu cho home, listing và booking

## Những phần chưa làm trong vòng này

- Tích hợp Payload runtime hoàn chỉnh vào Next app
- Auth flow thực tế
- Thanh toán và webhook idempotency
- Signed download URL thật
- Email provider
- Migration từ WordPress

## Thứ tự nên làm tiếp

1. Boot Payload admin và seed dữ liệu
2. Tạo dynamic pages theo slug
3. Kết nối auth và account area
4. Viết payment adapters
5. Thêm audit log, entitlement service và download guard
