# Security update — 20 November 2026

Scope: the Git-tracked 9life-mag Next.js application. Production target confirmed in the previous deployment: Windows, IIS/ARR, PM2 process `9life-mag`, `C:\Users\Administrator\app`, upstream `127.0.0.1:4000`.

## Findings and changes

| Component | Previous | Updated |
| --- | --- | --- |
| Application | 0.1.0 | 0.1.1 |
| Next.js / eslint-config-next | 16.2.10 | 16.4.6 |
| Payload and its three direct adapters | 3.85.2 | 3.94.0 |
| React / React DOM | 19.2.7 | 19.3.1 |
| DOMPurify | 3.4.12 | 3.4.18 |
| Zod | 4.4.3 | 4.6.7 |
| Sharp | 0.34.5 | 0.35.5 |
| Node on the VPS | Previously reported 24.18.0 | Portable 24.22.3 LTS, only for this PM2 application |

Regenerated package-lock.json resolves patched transitive packages. Two overrides are necessary because upstream dependency ranges still select vulnerable versions: happy-dom 21.0.4 (Lexical HTML processing) and esbuild 0.28.2 under @esbuild-kit/core-utils (Drizzle's legacy loader). These cross upstream version ranges; recheck them when upgrading Payload/Drizzle. No `--force` or `--legacy-peer-deps` resolution was used.

The initial npm audit reported 59 affected packages (2 critical, 42 high). The updated lockfile reports zero known vulnerabilities, including development dependencies, as queried on 20 November 2026. An npm audit result is an advisory-database snapshot, not proof that the application is free from vulnerabilities.

Code fixes:

- Sanitize article HTML on write, on database reads and in CMS editor/preview rendering. The allowlist preserves basic article formatting, image galleries, SEO notes and approved HTTPS embeds; scripts, event handlers, SVG, srcdoc and unsafe URL schemes are removed. Unsupported custom HTML/styles will be removed intentionally.
- Escape `<` in article JSON-LD so article metadata cannot terminate its script element.
- Cover every `/api/cms/*` route, the legacy `/cms/api/*` aliases and `/api/content-votes` with the existing origin policy. Cookie-backed POST/PUT/DELETE requests without Origin are rejected in production. The Telegram webhook remains authenticated by its own secret rather than a browser-origin check.
- Exclude temporary tools, nested project copies and auxiliary untracked projects from standalone file tracing.
- Return the application version in `/api/health` to distinguish old and new builds.

## Applicability of the linked article

The project does not contain Java, Axis JARs or PHP application files in its tracked app source. Its Nginx file is a deployment example, not evidence that production runs Nginx. Previous VPS output showed IIS and an Apache httpd shipped with EDB PEM. Apache HTTP Server is not Apache Axis.

The inventory script reports visible executable paths, versions on PATH, listening ports, installed Windows hotfixes and Axis JARs under the app root. It does not establish whether unrelated apps, embedded JREs, containers or services elsewhere on the VPS use vulnerable components. Assess those from the inventory; do not install Linux Nginx/Java/PHP patches blindly on this Windows server.

Primary sources:

- [NGINX advisories](https://nginx.org/en/security_advisories.html): CVE-2026-123007 is fixed in 1.30.7 / 1.31.9; relevant only if Nginx is actually deployed.
- [Oracle November 2026 advisory](https://www.oracle.com/security-alerts/cspunov2026.html).
- [Apache Axis security](https://axis.apache.org/axis/java/security.html).
- [PHP changelog](https://www.php.net/ChangeLog-8.php): branch-specific 19 November security releases.
- [Next.js Windows RCE advisory](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36): the previous 16.2.10 version is affected.
- [Payload SQL injection advisory](https://github.com/payloadcms/payload/security/advisories/GHSA-v49j-62m6-pgrr).
- [Node 24.22.3 security release](https://nodejs.org/en/blog/release/v24.22.3).

## Windows deployment

Run in PowerShell as Administrator:

```powershell
Set-Location -LiteralPath 'C:\Users\Administrator\app'
git pull --ff-only origin develop
if ($LASTEXITCODE -ne 0) { throw 'Git pull failed' }
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\update-windows-vps.ps1 -Mode Audit
```

Then deploy:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\Users\Administrator\app\scripts\update-windows-vps.ps1 -Mode Deploy
```

The deploy script downloads the official Node 24.22.3 Windows x64 ZIP and checks its SHA-256 against the official manifest. It does not replace system Node, restart IIS, restart another PM2 application or reboot Windows. Existing portable runtime installations are version checked; retain that directory under administrator control.

It exports `origin/develop` into a fresh sibling release directory, copies existing environment files without displaying secrets, backs up PostgreSQL when `SITE_USER_STORAGE_DRIVER=payload`, installs dependencies, audits, tests and builds while the old app keeps serving. PostgreSQL deployments require a compatible pg_dump executable on PATH or under `C:\Program Files\PostgreSQL\*\bin`. If backup fails, deployment stops before switching. Do not enable `PAYLOAD_DROP_DATABASE`.

A loopback-only worker on 4001 must pass version, HTML and origin-guard checks before the brief switch on 4000. PM2 adopts the new portable Node interpreter. The old `.next` directory is retained; runtime `standalone/data` and `standalone/media` are refreshed after stopping the old process. Root-level data and environment files remain in place. No automatic schema migration is executed. Build-time/database queries still require production configuration and a working database.

Rollback restores the old `.next` and previous Node interpreter if post-switch checks fail. It is an application rollback, not a database restore. The database dump is retained in the release directory. Restrict access to release directories because they contain environment files and backups.

After success, verify the public domain, existing CMS login/permissions, article rendering and embeds, music playback/download, and booking. Install outstanding Windows security updates through Windows Update in a separate maintenance window; the script lists hotfixes but does not claim that Windows/IIS is fully patched.

## Verification limits

Six regression tests cover malicious article markup, allowed content, iframe restrictions, JSON-LD escaping, origin validation and backup preconditions. TypeScript and production build run with Node 24.22.3. HTTP smoke checks passed against the local standalone server, including the version endpoint, footer and foreign-origin rejection on four API routes. Local build uses fallback content because production database credentials are not available locally; authenticated/database/payment flows require VPS verification. The deployment script parses successfully under Windows PowerShell 5; it has not yet been executed against the VPS.

The untracked `mobile` app has two high npm audit findings (Vite and source-map-js). It is excluded from the deployed web application and this Git patch; do not publish its development server. The nested `9life-mag` copy and `codegraph-main` are also untracked auxiliary directories, not part of this deployment.
