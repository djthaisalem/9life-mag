[CmdletBinding()]
param([switch]$Install)

$ErrorActionPreference = 'Stop'
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (!$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'Run PowerShell as Administrator.' }
$os = Get-CimInstance Win32_OperatingSystem
if ($os.Caption -notmatch 'Windows Server 2022' -or $os.BuildNumber -ne '20348') { throw 'This package is for Windows Server 2022 build 20348 only.' }
$node = Join-Path $env:USERPROFILE '9life-runtime\node-v24.22.3-win-x64\node.exe'
if (!(Test-Path -LiteralPath $node)) { throw 'The previously installed 9life Node runtime was not found.' }
$workDir = Join-Path $env:USERPROFILE 'windows-language-repair-20348-en-us'
New-Item -ItemType Directory -Force -Path $workDir | Out-Null
$report = Join-Path $workDir "repair-$(Get-Date -Format yyyyMMdd-HHmmss).log"
Start-Transcript -Path $report | Out-Null
try {
    $pending = New-Object -ComObject Microsoft.Update.SystemInfo
    if ($pending.RebootRequired) { throw 'An earlier update requires reboot. No reboot was requested by this script.' }
    $session = New-Object -ComObject Microsoft.Update.Session
    if ($session.CreateUpdateInstaller().IsBusy) { throw 'Windows Update is busy. Wait before applying the language package.' }
    $cab = Join-Path $workDir 'Microsoft-Windows-Server-Language-Pack_x64_en-us.cab'
    Write-Host 'Downloading/verifying only the 40 MB English language CAB from Microsoft; no ISO file is downloaded or mounted.'
    & $node (Join-Path $PSScriptRoot 'download-server-languagepack.cjs') $cab
    if ($LASTEXITCODE -ne 0) { throw 'Language package download or integrity check failed.' }
    $signature = Get-AuthenticodeSignature -LiteralPath $cab
    if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'CN=Microsoft Corporation,') {
        throw "The CAB did not pass Microsoft signature verification: $($signature.Status)"
    }
    Write-Host "Microsoft signature: $($signature.Status); $($signature.SignerCertificate.Subject)"

    $sourceDir = Join-Path $workDir 'verified-package-metadata'
    New-Item -ItemType Directory -Force -Path $sourceDir | Out-Null
    $packageName = 'Microsoft-Windows-Kernel-Feature-merged-Package~31bf3856ad364e35~amd64~en-US~10.0.20348.1'
    $manifestName = 'amd64_microsoft-windows-k..oyment-languagepack_31bf3856ad364e35_10.0.20348.1_en-us_e22d772bbb7ebde4.manifest'
    foreach ($filename in @("$packageName.mum", "$packageName.cat", $manifestName)) {
        & "$env:windir\System32\expand.exe" "-F:$filename" $cab $sourceDir
        if ($LASTEXITCODE -ne 0 -or !(Test-Path -LiteralPath (Join-Path $sourceDir $filename))) {
            throw 'The signed CAB is missing the expected Kernel Feature language component.'
        }
    }
    [xml]$manifest = Get-Content -LiteralPath (Join-Path $sourceDir $manifestName) -Raw
    $identity = $manifest.SelectSingleNode("/*[local-name()='assembly']/*[local-name()='assemblyIdentity']")
    if ($identity.name -ne 'Microsoft-Windows-Kernel-Feature-merged-Deployment-LanguagePack' -or $identity.version -ne '10.0.20348.1' -or $identity.language -ne 'en-US') {
        throw 'Assembly identity does not match the missing component in CBS.log.'
    }
    Write-Host "Verified matching assembly: $($identity.name); $($identity.version); $($identity.language)"
    & DISM.exe /English /Online /Get-PackageInfo "/PackagePath:$cab"
    if ($LASTEXITCODE -ne 0) { throw 'DISM could not inspect the package.' }
    if (!$Install) { Write-Host 'Preparation completed. Use -Install to apply the verified CAB with DISM.'; return }

    $backup = Join-Path $workDir "metadata-before-$(Get-Date -Format yyyyMMdd-HHmmss)"
    New-Item -ItemType Directory -Path $backup | Out-Null
    foreach ($file in @(
        "$env:windir\servicing\Packages\$packageName.mum",
        "$env:windir\servicing\Packages\$packageName.cat",
        "$env:windir\WinSxS\Manifests\$manifestName"
    )) {
        if (Test-Path -LiteralPath $file) { Copy-Item -LiteralPath $file -Destination $backup }
    }
    Write-Host 'Applying the Microsoft CAB with DISM. No registry edits, file replacement or reboot commands are used.'
    & DISM.exe /English /Online /Add-Package "/PackagePath:$cab" /NoRestart
    $result = $LASTEXITCODE
    Write-Host "DISM result: $result"
    if ($result -notin 0, 3010) { throw 'Language package installation failed. Send this report before trying another repair.' }
    $manifestExists = Test-Path -LiteralPath "$env:windir\WinSxS\Manifests\$manifestName"
    Write-Host "Expected assembly manifest present: $manifestExists"
    if ($result -eq 3010 -or $pending.RebootRequired) {
        Write-Host 'REBOOT REQUIRED. The script will not reboot. Share the report before the maintenance restart.' -ForegroundColor Yellow
    } else {
        Write-Host 'DISM package operation completed. This does not prove Windows Update is fixed; verify by retrying the failed update once.'
    }
} finally {
    Write-Host "REPORT: $report"
    Stop-Transcript | Out-Null
}
