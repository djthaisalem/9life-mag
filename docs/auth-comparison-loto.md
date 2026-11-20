# 9life and loto login comparison

Compared local sources under `9life-mag` and `loto/lottery-crawl-master` on 20 November 2026. No loto source or production data was modified.

## Payload 3.94 schema repair

The VPS users-column report lacks `users.reset_password_requested_at`, while the installed Payload 3.94 generated schema includes it. Both login paths reported SQLSTATE `42703`. A PostgreSQL-compatible regression reproduced this error by selecting Payload's generated users columns against the original migration schema; adding the nullable `timestamp(3) with time zone` column resolved it.

Migration `20261120_000002_auth_reset_requested_at` adds the column without changing hashes, salts, roles, lockouts or OTP configuration. The Windows deployment's schema helper applies the same idempotent change after the database backup, before building or stopping the running worker. Run `scripts/update-windows-vps.ps1 -Mode Deploy` after pulling develop. The log must include `Auth schema verified: users.reset_password_requested_at exists`. Then verify a real user and CMS login; schema checks alone do not verify credentials or OTP.

| Layer | 9life | loto |
| --- | --- | --- |
| HTTP server | Next.js App Router behind IIS | Express behind a loopback-trusted proxy |
| Database access | Payload/PostgreSQL adapter | Direct pg queries |
| User password | Payload local authentication (PBKDF2, including legacy format) | Custom scrypt |
| Admin authentication | Payload users, active flag and role map when storage driver is payload | Configured admin username/password |
| Admin code | Static `CMS_ADMIN_OTP_CODE`, when configured | No corresponding OTP in the compared admin login |
| Session | Signed HttpOnly cookies and database-backed account checks | Admin bearer tokens stored in an in-memory map |
| Login rate limiting | Persistent Payload request-guard records plus Payload lockout | Express failure counters in memory |

Both run on Node/PostgreSQL, but a successful loto login does not validate 9life's users schema, Payload sessions, secrets or cookies. Replacing 9life auth with loto's implementation is not a targeted repair.

Public 9life schema-validation probes returned HTTP 400 from the user and CMS login endpoints, with matching apex Origin and empty JSON. This confirms those requests passed the origin check and reached validation; it does not prove correct-password login or database auth works. The reported user-facing error is a generic login failure. Several 9life catch blocks hide the underlying Payload/database failure, so live configuration and schema evidence are required before changing credentials or access controls.

On the VPS, run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\Users\Administrator\app\scripts\diagnose-auth-vps.ps1 -ShowCmsOtp
```

The helper reads PM2 metadata and environment files from the actual standalone runtime. It prints a report with configuration-presence flags, database schema, aggregate account/lockout counts, and HTTP validation results. Database queries are read-only. It neither changes passwords/OTP nor clears locks or attempts to log in.

The OTP is printed separately at the end only when `-ShowCmsOtp` is requested. View that value locally; share only the report between `AUTH DIAGNOSTICS` and `END AUTH DIAGNOSTICS`. Do not paste raw `pm2 jlist`, environment files, passwords or hashes into the chat. No production OTP is present in the local repository available to this agent.

The configuration snapshot is based on recorded PM2 environment values and runtime environment files. If those files changed after process startup, their current contents may differ from the environment already loaded by Node; review that possibility if login still disagrees with the reported configuration.
