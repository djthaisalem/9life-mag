[CmdletBinding()]
param(
    [ValidateSet('Audit', 'Deploy')][string]$Mode = 'Audit',
    [string]$AppRoot = 'C:\Users\Administrator\app'
)

$ErrorActionPreference = 'Stop'
$AppRoot = (Resolve-Path -LiteralPath $AppRoot).Path
if (!(Test-Path -LiteralPath (Join-Path $AppRoot 'package.json'))) { throw 'App root must contain package.json.' }

Write-Host 'Windows and runtime inventory (no service changes):'
Get-CimInstance Win32_OperatingSystem | Select-Object Caption, Version, LastBootUpTime | Format-Table
Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 5 HotFixID, InstalledOn | Format-Table
Get-CimInstance Win32_Process |
    Where-Object { $_.Name -match '^(node|nginx|java|javaw|php|php-cgi|httpd|w3wp)\.exe$' } |
    Select-Object Name, ExecutablePath | Format-Table -AutoSize
Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 80, 443, 3000, 4000 } |
    Select-Object LocalAddress, LocalPort, OwningProcess | Format-Table
Get-ChildItem -LiteralPath $AppRoot -Filter 'axis*.jar' -Recurse -File -ErrorAction SilentlyContinue |
    Select-Object FullName | Format-Table
foreach ($program in @('node', 'nginx', 'java', 'php')) {
    $command = Get-Command $program -ErrorAction SilentlyContinue
    if ($command) {
        Write-Host "Detected $program at $($command.Source)"
        $savedPreference = $ErrorActionPreference
        try {
            $ErrorActionPreference = 'Continue'
            if ($program -eq 'node') { & $command.Source --version }
            elseif ($program -eq 'java') { & $command.Source -version 2>&1 | Out-Host }
            else { & $command.Source -v 2>&1 | Out-Host }
        } finally { $ErrorActionPreference = $savedPreference }
    }
}
if ($Mode -eq 'Audit') {
    Write-Host 'Audit complete. Absence from PATH/app root does not prove a component is absent elsewhere on the VPS.'
    return
}

function Invoke-Checked([string]$File, [string[]]$Arguments) {
    & $File @Arguments
    if ($LASTEXITCODE -ne 0) { throw "Command failed: $File (exit $LASTEXITCODE)" }
}
function Copy-Tree([string]$Source, [string]$Destination) {
    & robocopy $Source $Destination /E /R:2 /W:1 /NFL /NDL /NJH /NJS
    if ($LASTEXITCODE -ge 8) { throw "Copy failed: $Source" }
}
function Wait-ForApp([string]$BaseUrl) {
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        try {
            $health = Invoke-RestMethod "$BaseUrl/api/health" -TimeoutSec 5
            if ($health.status -eq 'ok' -and $health.version -eq '0.1.1') {
                $html = (Invoke-WebRequest "$BaseUrl/" -UseBasicParsing -TimeoutSec 20).Content
                if ($html -match 'href="https://hitclub26\.net/?"') { return }
            }
        } catch { }
        Start-Sleep -Seconds 2
    }
    throw "New app did not pass version, health and footer checks at $BaseUrl"
}

$pm2 = (Get-Command pm2.cmd -ErrorAction Stop).Source
$bootstrapNode = (Get-Command node.exe -ErrorAction Stop).Source
function Read-Pm2Process {
    $previousEncoding = [Console]::OutputEncoding
    $OutputEncoding = New-Object System.Text.UTF8Encoding($false)
    try {
        [Console]::OutputEncoding = $OutputEncoding
        $pm2Output = & $pm2 jlist
        if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect PM2.' }
        $safeJson = ($pm2Output -join "`n") | & $bootstrapNode "$PSScriptRoot\read-pm2-process.cjs"
        if ($LASTEXITCODE -ne 0) { throw 'Cannot parse PM2 process metadata.' }
    } finally { [Console]::OutputEncoding = $previousEncoding }
    return (($safeJson -join "`n") | ConvertFrom-Json)
}
$current = @(Read-Pm2Process)
if ($current.Count -ne 1) { throw 'Expected exactly one PM2 process named 9life-mag.' }
$oldInterpreter = $current[0].pm2_env.exec_interpreter
$runningNode = Get-CimInstance Win32_Process -Filter "ProcessId = $($current[0].pid)"
if ($runningNode.ExecutablePath) { $oldInterpreter = $runningNode.ExecutablePath }
$expectedScript = Join-Path $AppRoot '.next\standalone\server.js'
if ([IO.Path]::GetFullPath($current[0].pm2_env.pm_exec_path) -ne $expectedScript) {
    throw 'Unexpected PM2 script path. Stop and review before deploying.'
}
if ($current[0].pm2_env.status -ne 'online') { throw 'Existing app must be online before deployment.' }
if (Get-NetTCPConnection -LocalPort 4001 -State Listen -ErrorAction SilentlyContinue) { throw 'Test port 4001 is occupied.' }

$parent = Split-Path -Parent $AppRoot
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$release = Join-Path $parent "9life-release-$stamp"
$runtimeRoot = Join-Path $parent '9life-runtime'
New-Item -ItemType Directory -Path $release -ErrorAction Stop | Out-Null
New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
$runtimeVersion = '24.22.3'
$runtimeName = "node-v$runtimeVersion-win-x64"
$node = Join-Path $runtimeRoot "$runtimeName\node.exe"
if (!(Test-Path -LiteralPath $node)) {
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    $zipName = "$runtimeName.zip"
    $download = "https://nodejs.org/dist/v$runtimeVersion"
    $zip = Join-Path $runtimeRoot $zipName
    Invoke-WebRequest "$download/$zipName" -OutFile $zip -UseBasicParsing
    $checksums = (Invoke-WebRequest "$download/SHASUMS256.txt" -UseBasicParsing).Content
    $line = @($checksums -split "`n" | Where-Object { $_.Trim().EndsWith(" $zipName") })
    if ($line.Count -ne 1) { throw 'Cannot identify official Node checksum.' }
    $expectedHash = ($line[0].Trim() -split '\s+')[0]
    if ((Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash -ne $expectedHash) { throw 'Node checksum mismatch.' }
    Expand-Archive -LiteralPath $zip -DestinationPath $runtimeRoot -Force
}
if ((& $node --version) -ne "v$runtimeVersion") { throw 'Unexpected portable Node version.' }
$npm = Join-Path (Split-Path $node) 'node_modules\npm\bin\npm-cli.js'
$env:PATH = "$(Split-Path $node);$env:PATH"

Push-Location $AppRoot
try {
    $remote = & git remote get-url origin
    if ($LASTEXITCODE -ne 0 -or $remote -notmatch '^https://github\.com/djthaisalem/9life-mag(?:\.git)?$') { throw 'Unexpected Git origin.' }
    Invoke-Checked 'git' @('fetch', 'origin', 'develop')
    Invoke-Checked 'git' @('archive', '--format=zip', "--output=$release\source.zip", 'origin/develop')
} finally { Pop-Location }
Expand-Archive -LiteralPath "$release\source.zip" -DestinationPath $release
foreach ($filename in @('.env', '.env.local', '.env.production', '.env.production.local')) {
    $envFile = Join-Path $AppRoot $filename
    if (Test-Path -LiteralPath $envFile) { Copy-Item -LiteralPath $envFile -Destination $release }
}
# Inherit the app's configured environment without printing secrets.
foreach ($property in $current[0].environment) {
    [Environment]::SetEnvironmentVariable($property.name, [string]$property.value, 'Process')
}
$env:PATH = "$(Split-Path $node);$env:PATH"
$env:NODE_ENV = 'production'
$env:HOSTNAME = '127.0.0.1'
$env:PORT = '4001'
$env:PAYLOAD_DROP_DATABASE = 'false'
$pgDumpCommand = Get-Command pg_dump.exe -ErrorAction SilentlyContinue
$pgDump = if ($pgDumpCommand) { $pgDumpCommand.Source } else {
    Get-ChildItem 'C:\Program Files\PostgreSQL\*\bin\pg_dump.exe' -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
}
if (!$pgDump) { $pgDump = '-' }
Invoke-Checked $node @("$release\scripts\backup-postgres.cjs", $AppRoot, [string]$pgDump, "$release\database-before.dump")

Push-Location $release
try {
    Invoke-Checked $node @($npm, 'ci', '--include=dev')
    Invoke-Checked $node @($npm, 'audit', '--audit-level=moderate')
    Invoke-Checked $node @($npm, 'run', 'test:security')
    Invoke-Checked $node @($npm, 'run', 'build')
} finally { Pop-Location }
Copy-Tree "$release\public" "$release\.next\standalone\public"
Copy-Tree "$release\.next\static" "$release\.next\standalone\.next\static"
$oldNext = Join-Path $AppRoot '.next'
$oldData = Join-Path $oldNext 'standalone\data'
$oldUploads = Join-Path $oldNext 'standalone\media'
if (Test-Path -LiteralPath $oldData) { Copy-Tree $oldData "$release\.next\standalone\data" }
if (Test-Path -LiteralPath $oldUploads) { Copy-Tree $oldUploads "$release\.next\standalone\media" }

# Test only on loopback; the current website keeps serving port 4000.
$testProcess = Start-Process -FilePath $node -ArgumentList @("`"$release\.next\standalone\server.js`"") `
    -WorkingDirectory $AppRoot -WindowStyle Hidden -PassThru `
    -RedirectStandardOutput "$release\test.stdout.log" -RedirectStandardError "$release\test.stderr.log"
try {
    Wait-ForApp 'http://127.0.0.1:4001'
    Invoke-Checked $node @("$release\scripts\check-release.mjs", 'http://127.0.0.1:4001')
}
finally {
    if (!$testProcess.HasExited) { Stop-Process -Id $testProcess.Id -ErrorAction Stop; $testProcess.WaitForExit() }
}

$stagedNext = Join-Path $AppRoot ".next-new-$stamp"
$backupNext = Join-Path $AppRoot ".next-backup-$stamp"
Copy-Tree "$release\.next" $stagedNext
$swapped = $false
Invoke-Checked $pm2 @('stop', '9life-mag')
try {
    Start-Sleep -Seconds 2
    # Refresh mutable runtime files after stopping the old worker.
    if (Test-Path -LiteralPath $oldData) { Copy-Tree $oldData "$stagedNext\standalone\data" }
    if (Test-Path -LiteralPath $oldUploads) { Copy-Tree $oldUploads "$stagedNext\standalone\media" }
    Move-Item -LiteralPath $oldNext -Destination $backupNext
    try { Move-Item -LiteralPath $stagedNext -Destination $oldNext }
    catch { Move-Item -LiteralPath $backupNext -Destination $oldNext; throw }
    $swapped = $true
    $env:PORT = '4000'
    Invoke-Checked $pm2 @('restart', '9life-mag', '--interpreter', $node, '--update-env')
    Wait-ForApp 'http://127.0.0.1:4000'
    Invoke-Checked $node @("$release\scripts\check-release.mjs", 'http://127.0.0.1:4000')
    $updated = Read-Pm2Process
    if ($updated.pm2_env.exec_interpreter -ne $node) { throw 'PM2 did not adopt the patched Node interpreter.' }
    Invoke-Checked $pm2 @('save')
    Write-Host "SUCCESS: 9life-mag 0.1.1 / Node $runtimeVersion / port 4000. Backup: $backupNext" -ForegroundColor Green
    Write-Host 'IIS configuration is unchanged. Verify the public domain, CMS login, music playback and booking.'
} catch {
    $failure = $_
    if ($swapped) {
        Invoke-Checked $pm2 @('stop', '9life-mag')
        Start-Sleep -Seconds 2
        Move-Item -LiteralPath $oldNext -Destination (Join-Path $AppRoot ".next-failed-$stamp")
        Move-Item -LiteralPath $backupNext -Destination $oldNext
    }
    $env:PORT = '4000'
    Invoke-Checked $pm2 @('restart', '9life-mag', '--interpreter', $oldInterpreter, '--update-env')
    Invoke-Checked $pm2 @('save')
    throw $failure
}
