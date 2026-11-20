[CmdletBinding()]
param([switch]$Install)

$ErrorActionPreference = 'Stop'

function Test-ServerSecurityUpdate($Update) {
    if ($Update.Title -notmatch '(Windows Server 2022|server operating system.*21H2)') { return $false }
    if ($Update.Title -match '(Preview|Insider|Feature update|Upgrade to)') { return $false }
    if ($Update.InstallationBehavior.CanRequestUserInput) { return $false }
    $classifications = @(
        '0fa1201d-4330-4fa8-8ae9-b877473b6441', # Security Updates
        'e6cf1350-c01b-414d-a61f-263d14d133b4', # Critical Updates
        '28bc880e-0592-4cbf-8f95-c79b17911d5f'  # Update Rollups
    )
    foreach ($category in $Update.Categories) {
        if ($category.CategoryID -in $classifications) { return $true }
    }
    return $false
}

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (!$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'Run PowerShell as Administrator.' }
$os = Get-CimInstance Win32_OperatingSystem
if ($os.Caption -notmatch 'Windows Server 2022' -or $os.BuildNumber -ne '20348') {
    throw 'This script is scoped to Windows Server 2022 build 20348.'
}
$reportDir = Join-Path $env:USERPROFILE "system-patch-$(Get-Date -Format yyyyMMdd-HHmmss)"
New-Item -ItemType Directory -Path $reportDir | Out-Null
Start-Transcript -Path (Join-Path $reportDir 'system-update.log') | Out-Null
try {
    Write-Host 'Windows/IIS inventory:'
    $os | Select-Object Caption, Version, LastBootUpTime | Format-List
    Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion' |
        Select-Object CurrentBuild, UBR | Format-List
    Get-HotFix | Sort-Object InstalledOn -Descending |
        Select-Object HotFixID, InstalledOn | Export-Csv (Join-Path $reportDir 'hotfixes-before.csv') -NoTypeInformation
    Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\InetStp' -ErrorAction SilentlyContinue |
        Select-Object VersionString | Format-List
    Get-Item "$env:windir\System32\inetsrv\w3wp.exe" -ErrorAction SilentlyContinue |
        Select-Object FullName, @{Name='FileVersion';Expression={$_.VersionInfo.FileVersion}} | Format-List

    Write-Host 'EDB / PEM installed packages:'
    Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
        'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*' -ErrorAction SilentlyContinue |
        Where-Object { $_.DisplayName -match '(EnterpriseDB|Postgres|PEM|EDB)' } |
        Select-Object DisplayName, DisplayVersion, Publisher, InstallLocation | Format-List
    $httpd = 'C:\Program Files\edb\pem\httpd\apache\bin\httpd.exe'
    if (Test-Path -LiteralPath $httpd) {
        Write-Host 'EDB Apache version:'
        & $httpd -v
        if ($LASTEXITCODE -ne 0) { throw 'Cannot read EDB Apache version.' }
    }
    Get-CimInstance Win32_Service |
        Where-Object { $_.Name -match '(pem|edb|postgres|pm2)' -or $_.PathName -match '(\\edb\\|pm2|nssm)' } |
        Select-Object Name, State, StartMode | Format-Table -AutoSize
    Get-ChildItem 'C:\Program Files\PostgreSQL\*\bin\stackbuilder.exe' -ErrorAction SilentlyContinue |
        Select-Object FullName | Format-Table
    Write-Host 'EDB Apache is inventoried only. Its update requires the compatible EDB installer or Stack Builder PEM-HTTPD package.'

    $systemInfo = New-Object -ComObject Microsoft.Update.SystemInfo
    Write-Host "Windows Update reboot pending: $($systemInfo.RebootRequired)"
    $session = New-Object -ComObject Microsoft.Update.Session
    $session.ClientApplicationID = '9life Windows Server security maintenance'
    $installer = $session.CreateUpdateInstaller()
    if ($installer.IsBusy) { throw 'Windows Update is already installing updates. Wait for it to finish.' }
    Write-Host 'Scanning the configured Windows Update/WSUS service. This can take several minutes...'
    $searcher = $session.CreateUpdateSearcher()
    $scan = $searcher.Search("IsInstalled=0 and IsHidden=0 and Type='Software'")
    if ($scan.ResultCode -ne 2) { throw "Windows Update scan did not fully succeed: $($scan.ResultCode)" }
    $selected = @()
    $inventory = @()
    foreach ($update in $scan.Updates) {
        $eligible = Test-ServerSecurityUpdate $update
        $inventory += [pscustomobject]@{ Title=$update.Title; Selected=$eligible }
        if ($eligible) { $selected += $update }
    }
    $inventory | Format-Table -AutoSize -Wrap
    $inventory | Export-Csv (Join-Path $reportDir 'available-updates.csv') -NoTypeInformation
    if (!$Install) {
        Write-Host 'Scan completed. No updates installed. Use -Install to install the selected Windows Server security updates.'
        return
    }
    if ($systemInfo.RebootRequired -or $installer.RebootRequiredBeforeInstallation) {
        throw 'A previous update requires a reboot before further installation. No reboot was requested by this script.'
    }
    if (!$selected.Count) {
        Write-Host 'No matching Windows Server security updates are available from the configured update service.'
        return
    }

    $appcmd = "$env:windir\System32\inetsrv\appcmd.exe"
    if (Test-Path -LiteralPath $appcmd) {
        & $appcmd add backup "before-system-patch-$(Get-Date -Format yyyyMMdd-HHmmss)"
        if ($LASTEXITCODE -ne 0) { throw 'IIS configuration backup failed.' }
    }
    $pm2 = Get-Command pm2.cmd -ErrorAction SilentlyContinue
    if ($pm2) {
        & $pm2.Source save
        if ($LASTEXITCODE -ne 0) { throw 'Cannot save the PM2 process list.' }
    }

    foreach ($update in $selected) {
        if (!$update.EulaAccepted) { $update.AcceptEula() }
        $collection = New-Object -ComObject Microsoft.Update.UpdateColl
        [void]$collection.Add($update)
        Write-Host "Downloading: $($update.Title)"
        $downloader = $session.CreateUpdateDownloader()
        $downloader.Updates = $collection
        [void]$downloader.Download()
        if (!$update.IsDownloaded) { throw "Download failed: $($update.Title)" }
        $installer = $session.CreateUpdateInstaller()
        if ($installer.IsBusy -or $installer.RebootRequiredBeforeInstallation) {
            throw 'Windows Update is busy or requires reboot. No reboot was requested by this script.'
        }
        $installer.AllowSourcePrompts = $false
        $installer.Updates = $collection
        Write-Host "Installing: $($update.Title)"
        $result = $installer.Install()
        $detail = $result.GetUpdateResult(0)
        Write-Host "ResultCode=$($detail.ResultCode); HRESULT=$($detail.HResult); RebootRequired=$($result.RebootRequired)"
        if ($result.ResultCode -ne 2 -or $detail.ResultCode -ne 2) {
            throw 'Update installation did not fully succeed. See the recorded result; do not assume the server is patched.'
        }
        if ($result.RebootRequired -or $systemInfo.RebootRequired) {
            Write-Host 'REBOOT REQUIRED: installation is not fully effective yet. The script will not reboot; stop here and arrange a maintenance restart.' -ForegroundColor Yellow
            break
        }
    }
    Write-Host 'Windows Update installation pass finished. Review reboot status and rerun the scan after any required reboot.'
    Get-Service W3SVC -ErrorAction SilentlyContinue | Select-Object Name, Status | Format-Table
    try {
        $health = Invoke-RestMethod 'http://127.0.0.1:4000/api/health' -TimeoutSec 15
        Write-Host "9life health: $($health.status); app version: $($health.version)"
    } catch { Write-Warning '9life health did not respond; inspect PM2 and IIS before further changes.' }
} finally {
    Write-Host "REPORT: $(Join-Path $reportDir 'system-update.log')"
    Stop-Transcript | Out-Null
}
