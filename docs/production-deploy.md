# 9LIFE MAG Production Deploy Guide

## 1. Mục tiêu của bộ setup này

Tài liệu này dùng cho giai đoạn đưa `9life-mag` lên VPS theo mô hình:

- Ubuntu VPS
- Node.js 20 LTS
- PostgreSQL 15+
- PM2
- Nginx reverse proxy
- Cloudflare R2 cho media

Phù hợp nhất cho:

- staging nội bộ
- closed beta
- production sớm với lưu lượng vừa phải

## 2. Trạng thái thực tế hiện tại

Project đã có:

- frontend public site bằng Next.js
- CMS dashboard riêng
- Payload collections
- PostgreSQL adapter
- cấu hình R2
- auth user / artist / CMS ở mức app logic
- social login và reset password ở mức code integration

Project chưa nên xem là production hoàn chỉnh nếu chưa xử lý nốt:

- chuyển toàn bộ luồng file-based sang Payload/Postgres
- hoàn tất payment live thật
- hoàn tất email provider thật
- hoàn tất monitoring, backup, alerting

## 3. Chuẩn bị VPS

Khuyến nghị tối thiểu:

- 4 vCPU
- 8 GB RAM
- 80 GB SSD
- Ubuntu 22.04 LTS hoặc 24.04 LTS

Tên thư mục deploy đề xuất:

- app root: `/var/www/9life-mag/current`
- shared env: `/var/www/9life-mag/shared/.env.local`

## 4. Cài package hệ thống

```bash
sudo apt update
sudo apt install -y nginx postgresql postgresql-contrib unzip curl git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

Kiểm tra:

```bash
node -v
npm -v
pm2 -v
psql --version
nginx -v
```

## 5. Tạo PostgreSQL

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE nine_life_mag;
CREATE USER nine_life_user WITH ENCRYPTED PASSWORD 'replace-with-strong-password';
GRANT ALL PRIVILEGES ON DATABASE nine_life_mag TO nine_life_user;
```

Connection string mẫu:

```env
DATABASE_URI=postgres://nine_life_user:replace-with-strong-password@127.0.0.1:5432/nine_life_mag
```

## 6. Clone source và cài dependency

```bash
sudo mkdir -p /var/www/9life-mag
sudo chown -R $USER:$USER /var/www/9life-mag
cd /var/www/9life-mag
git clone <your-repo-url> current
cd current
npm install
```

## 7. Tạo `.env.local`

Copy từ `.env.example` rồi điền giá trị thật:

```bash
cp .env.example .env.local
```

Những biến bắt buộc trước khi chạy production:

```env
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://9lifemag.com
DATABASE_URI=postgres://nine_life_user:replace-with-strong-password@127.0.0.1:5432/nine_life_mag
PAYLOAD_SECRET=replace-with-long-random-secret
CMS_SESSION_SECRET=replace-with-long-random-secret
SITE_SESSION_SECRET=replace-with-long-random-secret
SITE_USER_STORAGE_DRIVER=payload
CMS_ADMIN_EMAIL=admin@9lifemag.com
CMS_ADMIN_PASSWORD=replace-with-strong-password
CMS_ADMIN_OTP_CODE=replace-with-otp-seed
CMS_ADMIN_ROLE=super_admin
```

Biến nên cấu hình ngay nếu dùng thật:

- `R2_*`
- `RESEND_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_PAYMENT_CHANNEL`

## 8. Build và chạy app

```bash
npm run build
```

Project đang bật `output: "standalone"` nên sau khi build có thể chạy trực tiếp bằng:

```bash
node .next/standalone/server.js
```

Hoặc dùng PM2:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Kiểm tra health:

```bash
curl http://127.0.0.1:3000/api/health
```

## 9. Cấu hình Nginx

File mẫu đã có sẵn:

- `deploy/nginx/9life-mag.conf.example`

Copy vào Nginx:

```bash
sudo cp deploy/nginx/9life-mag.conf.example /etc/nginx/sites-available/9life-mag
sudo ln -s /etc/nginx/sites-available/9life-mag /etc/nginx/sites-enabled/9life-mag
sudo nginx -t
sudo systemctl reload nginx
```

## 10. Gắn SSL

Khuyến nghị dùng Let's Encrypt:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 9lifemag.com -d www.9lifemag.com
```

## 11. Cấu hình job nhắc booking

Nếu dùng Telegram reminders, có thể tạo cron gọi endpoint dispatch định kỳ.

Ví dụ:

```bash
*/5 * * * * curl -fsS https://9lifemag.com/api/cms/booking-reminders/dispatch >/dev/null 2>&1
```

Lưu ý:

- endpoint này cần session/quyền phù hợp nếu bạn siết tiếp lớp auth
- production thật nên chuyển job này sang worker riêng hoặc internal cron token

## 12. Backup tối thiểu

Nên backup:

- PostgreSQL hàng ngày
- `.env.local`
- file cấu hình Nginx
- bucket media trên R2

Ví dụ backup DB:

```bash
pg_dump "postgres://nine_life_user:replace-with-strong-password@127.0.0.1:5432/nine_life_mag" > /var/backups/9life-mag-$(date +%F).sql
```

## 13. Điều bắt buộc trước khi public thật

1. Đổi `SITE_USER_STORAGE_DRIVER=file` sang `payload`.
2. Chuyển các luồng booking/topup đang lưu file JSON sang Payload/Postgres hoàn toàn.
3. Gắn payment live thật hoặc tắt hoàn toàn các gateway chưa sẵn sàng.
4. Gắn email thật cho reset password và notification.
5. Chốt domain, SSL, backup, log rotation và monitoring.

## 14. Quy trình deploy mỗi lần update

```bash
cd /var/www/9life-mag/current
git pull
npm install
npm run build
pm2 restart 9life-mag
```

Kiểm tra sau deploy:

```bash
curl https://9lifemag.com/api/health
pm2 status
sudo nginx -t
```
