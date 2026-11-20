[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$os = Get-CimInstance Win32_OperatingSystem
if ($os.Caption -notmatch 'Windows Server 2022' -or $os.BuildNumber -ne '20348') { throw 'Expected the Windows Server 2022 VPS.' }
$work = Join-Path $env:USERPROFILE "windows-servicing-evidence-$(Get-Date -Format yyyyMMdd-HHmmss)"
New-Item -ItemType Directory -Path $work | Out-Null
$report = Join-Path $work 'servicing-report.txt'
Start-Transcript -Path $report | Out-Null
try {
    Write-Host 'Read-only servicing diagnosis. No packages, services, registry values or Windows files are changed.'
    $os | Select-Object Caption, Version, LastBootUpTime | Format-List
    Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion' |
        Select-Object CurrentBuild, UBR | Format-List
    $pending = New-Object -ComObject Microsoft.Update.SystemInfo
    Write-Host "Windows Update reboot pending: $($pending.RebootRequired)"

    Write-Host 'Installed related top-level packages:'
    Get-WindowsPackage -Online | Where-Object { $_.PackageName -match 'Kernel-Feature|Server-LanguagePack|NetworkController|RollupFix' } |
        Select-Object PackageName, PackageState, InstallTime | Format-List

    Write-Host 'Exact Kernel Feature CBS package registration (raw values, read only):'
    foreach ($identity in @(
        'Microsoft-Windows-Kernel-Feature-merged-Package~31bf3856ad364e35~amd64~en-US~10.0.20348.1',
        'Microsoft-Windows-Kernel-Feature-merged-Package~31bf3856ad364e35~amd64~en-US~10.0.20348.2965',
        'Microsoft-Windows-Kernel-Feature-merged-Package~31bf3856ad364e35~amd64~~10.0.20348.2965'
    )) {
        $key = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\Packages\$identity"
        $exists = Test-Path -LiteralPath $key
        $state = if ($exists) { (Get-ItemProperty -LiteralPath $key).CurrentState } else { $null }
        [pscustomobject]@{ Package=$identity; Registered=$exists; CurrentState=$state } | Format-List
    }
    Write-Host 'Kernel deployment manifests currently on disk:'
    Get-ChildItem -LiteralPath "$env:windir\WinSxS\Manifests" -Filter 'amd64_microsoft-windows-k..oyment-languagepack_31bf3856ad364e35_*_en-us_*' |
        Select-Object Name, Length | Format-List

    $cbs = Join-Path $env:windir 'Logs\CBS'
    $logs = @(Get-ChildItem -LiteralPath $cbs -Filter '*.log' -File |
        Sort-Object LastWriteTime -Descending | Select-Object -First 3)
    $archives = @(Get-ChildItem -LiteralPath $cbs -Filter 'CbsPersist*.cab' -File |
        Sort-Object LastWriteTime -Descending | Select-Object -First 3)
    Write-Host 'Latest archived CBS logs:'
    $archives | Select-Object Name, LastWriteTime, Length | Format-Table
    foreach ($archive in $archives) {
        $destination = Join-Path $work $archive.BaseName
        New-Item -ItemType Directory -Path $destination | Out-Null
        & "$env:windir\System32\expand.exe" '-F:*.log' $archive.FullName $destination
        if ($LASTEXITCODE -ne 0) { throw "Cannot read archived CBS log: $($archive.Name)" }
        $logs += @(Get-ChildItem -LiteralPath $destination -Filter '*.log' -File)
    }
    foreach ($log in ($logs | Sort-Object LastWriteTime -Descending)) {
        Write-Host "=== CBS failure excerpts: $($log.Name) ==="
        $matches = @(Get-Content -LiteralPath $log.FullName -Tail 60000 |
            Select-String -Pattern 'ICSITransaction_PinDeployment|Failed to bulk stage deployment manifest' -Context 5,5 |
            Select-Object -Last 3)
        if ($matches.Count) { $matches | Out-String -Width 400 | Write-Host }
        else { Write-Host 'No matching failure in this log tail.' }
    }
    Write-Host 'Latest DISM package applicability/state decisions:'
    Get-Content -LiteralPath "$env:windir\Logs\DISM\dism.log" -Tail 15000 |
        Select-String -Pattern 'Server-LanguagePack|Kernel-Feature|not applicable|already installed|superseded' -Context 1,2 |
        Select-Object -Last 12 | Out-String -Width 400 | Write-Host
} finally {
    Write-Host "REPORT: $report"
    Stop-Transcript | Out-Null
}
