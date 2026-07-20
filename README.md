# 9LIFE MAG

Skeleton dự án cho nền tảng tin tức âm nhạc, hồ sơ nghệ sĩ, booking show và phân phối nhạc số.

## Stack định hướng

- Next.js App Router
- Payload CMS
- PostgreSQL
- Cloudflare R2

## MVP đã được chuẩn bị trong code

- Public routes: `/`, `/tin-tuc`, `/nghe-si`, `/music-store`, `/booking`, `/tai-khoan`
- Payload collections:
  - `users`
  - `media`
  - `categories`
  - `posts`
  - `artists`
  - `booking-requests`
  - `products`
  - `orders`
  - `entitlements`
- Health check route: `/api/health`
- Environment template: `.env.example`
- Seed sample: `src/lib/seed-data.ts`

## Cách bắt đầu

1. Copy `.env.example` thành `.env.local`
2. Cài dependency
3. Kết nối PostgreSQL
4. Bổ sung tích hợp Payload runtime vào Next app
5. Nối R2, payment adapter và email provider

## Ghi chú kiến trúc

- Dự án này ưu tiên modular monolith, đúng theo tài liệu định hướng.
- Phần commerce mới ở mức schema và UI skeleton, chưa có webhook/payment logic thực.
- Phần Payload config đã sẵn sàng cho collection modeling, nhưng vẫn cần hoàn tất bootstrap runtime theo môi trường triển khai thực tế.

## Gợi ý bước tiếp theo

1. Hoàn tất bootstrapping Payload vào app và mở `/admin`
2. Viết seed data cho categories, artists, products, posts
3. Thêm dynamic routes theo slug cho post/artist/product
4. Tích hợp auth và customer library theo entitlement
5. Tạo payment adapters riêng cho cổng nội địa và quốc tế
