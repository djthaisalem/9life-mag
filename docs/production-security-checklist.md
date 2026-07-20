# Production Security Checklist

## Required environment

Set these values in the VPS or deployment secret manager. Do not create or edit them from the CMS in production.

```env
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://your-domain.example
SITE_USER_STORAGE_DRIVER=payload
DATABASE_URI=postgres://<user>:<password>@<host>:5432/<database>?sslmode=require
PAYLOAD_SECRET=<long-random-secret>
SITE_SESSION_SECRET=<long-random-secret>
CMS_SESSION_SECRET=<long-random-secret>
```

Use a different random value for every secret. The application blocks sensitive account flows in production if Payload storage, database connection, or Payload secret are missing.

## Data and CMS

- Run Payload with PostgreSQL before enabling public registration, booking, or star top-ups.
- Create separate CMS users in the `users` collection and assign only the required role: `editor`, `artist_ops`, `booking_ops`, `finance_ops`, `security_admin`, or `super_admin`.
- Keep at least one emergency `super_admin` account outside normal daily use.
- Back up PostgreSQL daily and test a restore before launch.

## Payments

- Bank QR is a manual reconciliation flow and requires human confirmation before stars are added.
- MoMo, Viettel Money, and PayPal are intentionally blocked until a merchant adapter verifies each provider webhook signature, amount, currency, order reference, and idempotency key.
- Never approve a top-up only from a client-side success message or a Telegram message.

## Runtime and network

- Terminate HTTPS at the reverse proxy and redirect all HTTP traffic to HTTPS.
- Keep `.env.local`, `data/`, logs, R2 keys, payment keys, and Telegram tokens out of Git.
- Restrict PostgreSQL network access to the application server only.
- Run scheduled reminder jobs with a protected server-side scheduler, not through a public browser action.
- Review dependency advisories before each release and run `npm audit --omit=dev` in CI.

## Music processing worker

- Install `ffmpeg` and `ffprobe` on the VPS, then make both binaries available in `PATH`. If they are installed elsewhere, set `FFMPEG_PATH` and `FFPROBE_PATH` to their absolute paths.
- Configure `MUSIC_TEMP_DIR` on a disk with enough temporary capacity and set `MUSIC_MAX_UPLOAD_MB` to the upload limit you want to allow. The default limit is 1024 MB.
- The upload pipeline stores a 256kb MP3 under `music/preview/` and the original source under `music/master/`. Keep the R2 bucket private; delivery of master files must later use a signed download endpoint after entitlement checks.
- The current worker runs inside the protected upload request and removes its temporary folder in all outcomes. For very long files or high volume, move the same `processMusicUpload` pipeline to a durable queue worker before scaling horizontally.
