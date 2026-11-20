# Windows / IIS and EDB PEM maintenance

Target: the observed VPS running Windows Server 2022, build 20348. This is separate from the 9life Node/Payload deployment.

Run PowerShell as Administrator:

```powershell
Set-Location -LiteralPath 'C:\Users\Administrator\app'
git pull --ff-only origin develop
if ($LASTEXITCODE -ne 0) { throw 'Git pull failed' }
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\update-windows-system.ps1 -Install
```

Omit `-Install` to only inventory and scan. The script uses the built-in Windows Update Agent COM API, with the machine's configured update source (including WSUS when configured). It does not register another update service, disable policy, upgrade the OS or install a PowerShell Gallery module.

Only applicable, visible software updates classified as Security Updates, Critical Updates or Update Rollups and titled for Windows Server 2022 / Microsoft server operating system 21H2 are selected. Preview releases, drivers, feature upgrades and interactive installers are excluded. All discovered titles are recorded, including skipped updates, so unexpected/localized titles can be reviewed. A clean result means no matching updates were offered by the configured source, not proof that every Microsoft or third-party product is fully patched.

Before installing, it records the current build, installed hotfixes, IIS worker file version, installed EDB/PEM packages and Apache version. It saves an IIS configuration backup and the current PM2 process list. These are not a full-system image or a PostgreSQL backup. It installs one update at a time and stops on errors or a required reboot.

The script does not call a reboot command. Existing Windows Update/GPO restart policies remain in force. Windows servicing can affect services on the entire VPS, and updates requiring a restart are not fully effective until that restart. Arrange a maintenance window and confirm PM2/IIS/PostgreSQL recovery before rebooting. After any required reboot, run the inventory/scan again and verify the websites; do not equate installation with complete remediation.

The report is saved to `%USERPROFILE%\system-patch-<timestamp>\system-update.log`. The same directory contains the previous hotfix list and available-update titles. Share the log to select the supported PEM-HTTPD update and review the Windows result.

## EDB Apache

The observed executable is `C:\Program Files\edb\pem\httpd\apache\bin\httpd.exe`. This belongs to EDB PEM-HTTPD, not the 9life Node server, and is distinct from Apache Axis.

EDB supports updating this Windows web server through an EDB installer, either as part of a compatible PEM upgrade or through Stack Builder's **Web Development → PEM-HTTPD** package. Do not replace its httpd.exe, OpenSSL libraries or modules with an unrelated Apache build. The system script only inventories EDB; it does not claim to have upgraded it. The installed PEM/PEM-HTTPD versions from the VPS are needed to choose the compatible installer and backup its configuration before upgrading.

## Validation and sources

Windows PowerShell 5 syntax and nine selection cases were tested locally without invoking Windows Update. They cover the intended OS update and .NET titles, exclusion of Preview/other Windows Server versions/SQL Server/drivers/feature updates, and installers that require user input. Actual WUA scan, install and EDB upgrade require execution on the VPS.

- [Microsoft Windows Update Agent sample and API](https://learn.microsoft.com/en-us/windows/win32/wua_sdk/searching--downloading--and-installing-updates)
- [Microsoft update classification identifiers](https://learn.microsoft.com/en-us/powershell/module/updateservices/get-wsusclassification)
- [Microsoft restart management](https://learn.microsoft.com/en-us/windows/deployment/update/waas-restart)
- [EDB: Upgrading the PEM web server on Windows](https://www.enterprisedb.com/docs/pem/latest/upgrading/upgrading_httpd/)
