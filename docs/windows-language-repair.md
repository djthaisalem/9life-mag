# Targeted Server 2022 language package repair without a local ISO

Observed CBS failure: `Microsoft-Windows-Kernel-Feature-merged-Deployment-LanguagePack`, amd64, en-US, `10.0.20348.1`; its package update identifier is `a29c74644364e74fb80795ae50c3d20c`. Repeated Windows Update attempts failed with `0x80073701` after DISM RestoreHealth and SFC completed successfully.

The official [Server 2022 Evaluation Center](https://www.microsoft.com/en-us/evalcenter/evaluate-windows-server-2022) links the Languages and Optional Features media through `https://go.microsoft.com/fwlink/?linkid=2195333`. This is language/feature content, not an operating-system reinstallation.

The downloader reads only the en-US CAB from that Microsoft-hosted media using an HTTP byte range. No full ISO is downloaded or mounted. The source's UDF directory was inspected to locate the CAB, and the following properties were verified locally:

- File: `LanguagesAndOptionalFeatures/Microsoft-Windows-Server-Language-Pack_x64_en-us.cab`
- Offset: 3,884,476,416; size: 40,382,505 bytes, within the 6,085,509,120-byte official media.
- SHA-256: `b02f56b1cf22867d66aa2ea02c347820c9ef6232e25c17938f041bb8df1d872b`
- Authenticode: Valid, Microsoft Corporation signer.
- The CAB contains the exact Kernel Feature package MUM/CAT and deployment-language manifest referenced by CBS. The MUM has the same update identifier as the failing VPS log.

The script rejects a full-file HTTP response, changed media range, truncated content, changed hash, invalid Microsoft signature or an unexpected assembly identity. If the source changes or the proxy does not support byte ranges, it stops rather than downloading the full media or installing another package.

Run on the VPS in an elevated Windows PowerShell console:

```powershell
Set-Location -LiteralPath 'C:\Users\Administrator\app'
git pull --ff-only origin develop
if ($LASTEXITCODE -ne 0) { throw 'Git pull failed' }
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\repair-windows-languagepack.ps1 -Install
```

Without `-Install`, it only downloads, validates and inspects the package. With `-Install`, it saves copies of matching existing package metadata, then calls the supported DISM `/Online /Add-Package /PackagePath:<cab> /NoRestart` operation. No direct writes to Windows component files or servicing registry entries are performed; it does not remove the base English language pack, change the display language or reboot.

This is a targeted repair attempt, not a guaranteed fix for component-store metadata. An already-installed package can produce a successful/no-op DISM operation. A successful exit and a present manifest do not prove the CBS deployment index is repaired. Review the report, any reboot requirement, and retry the failing update once to verify. If the assembly is still unresolved, use a compatible healthy repair source or Microsoft/provider support rather than repeatedly forcing package installation or deleting CBS registry entries.

The working directory and transcript are under `%USERPROFILE%\windows-language-repair-20348-en-us`. Backup copies are diagnostic metadata, not a full-system restore point. The 9life process and IIS are not explicitly restarted by this script.

## Validation and references

The downloader was executed locally and obtained the exact 40,382,505-byte CAB. Its SHA-256, Microsoft signature, MUM update identifier and deployment manifest were checked. PowerShell 5 syntax was validated; DISM installation has not been executed against the VPS by this agent.

- [Microsoft: missing language-component packages and CAB restoration](https://learn.microsoft.com/en-us/troubleshoot/microsoftteams/teams-rooms-and-devices/teams-rooms-device-windows-update-issues#fix-update-error-0x800f0831-or-0x80073701) — describes the language-component failure pattern; not a guarantee for this Windows Server instance.
- [Microsoft: DISM package-servicing options](https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/dism-operating-system-package-servicing-command-line-options)
- [Microsoft: repair-source requirements](https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/configure-a-windows-repair-source)
