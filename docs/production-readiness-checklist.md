# 9LIFE MAG Production Readiness Checklist

## A. Hạ tầng

- [ ] VPS Ubuntu 22.04/24.04 đã dựng xong
- [ ] Node.js 20 LTS
- [ ] PostgreSQL 15+
- [ ] Nginx reverse proxy
- [ ] SSL hoạt động
- [ ] PM2 hoặc systemd hoạt động
- [ ] backup database hàng ngày

## B. Secrets và môi trường

- [ ] `PAYLOAD_SECRET` là secret mạnh
- [ ] `CMS_SESSION_SECRET` là secret mạnh
- [ ] `SITE_SESSION_SECRET` là secret mạnh
- [ ] `NEXT_PUBLIC_SITE_URL` là domain thật
- [ ] `DATABASE_URI` trỏ DB production
- [ ] `SITE_USER_STORAGE_DRIVER=payload`

## C. Dữ liệu

- [ ] user account chạy trên Payload/Postgres
- [ ] booking request chạy trên Payload/Postgres
- [ ] topup / stars chạy trên Payload/Postgres
- [ ] wallet ledger chạy trên Payload/Postgres
- [ ] CMS list không còn phụ thuộc dữ liệu mock trong code

## D. Media và file

- [ ] Cloudflare R2 đã map thật
- [ ] upload ảnh hoạt động
- [ ] upload audio hoạt động
- [ ] đường dẫn public/private media được kiểm soát

## E. Auth và bảo mật

- [ ] social login Google hoạt động
- [ ] social login Facebook hoạt động
- [ ] reset password email hoạt động
- [ ] admin credentials mặc định đã thay
- [ ] cookie/session secrets đã thay
- [ ] origin guard và CMS access đã test
- [ ] F12 không phải là lớp bảo mật chính; server-side access mới là lớp bắt buộc

## F. Payment

- [ ] Bank QR tạo mã đúng
- [ ] Telegram notify khi tạo yêu cầu nạp sao
- [ ] đối soát chấp nhận/từ chối hoạt động
- [ ] ít nhất 1 gateway live đã test end-to-end
- [ ] gateway chưa hoàn tất đã tắt khỏi production UI

## G. Booking và vận hành

- [ ] booking artist nhận dữ liệu đúng
- [ ] booking outlet nhận dữ liệu đúng
- [ ] Telegram tổng nhận thông báo
- [ ] channel riêng cho artist/outlet hoạt động
- [ ] nhắc việc Telegram có cron/worker chạy định kỳ

## H. Quan sát hệ thống

- [ ] có health check
- [ ] có log PM2/Nginx
- [ ] có quy trình restart an toàn
- [ ] có quy trình rollback đơn giản

## I. Trạng thái đánh giá hiện tại

Theo code hiện tại:

- frontend public: khá hoàn chỉnh cho staging
- CMS UI: khá sâu, nhưng vẫn còn nhiều vùng dùng dữ liệu dựng sẵn
- auth/session: có nền tảng tốt
- Payload/Postgres: đã có kiến trúc đúng
- deploy production: cần hoàn tất theo checklist này trước khi public thật
