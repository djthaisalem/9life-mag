[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
function Test-KetquaStartupAction($Action, [string]$Directory, [string]$Executable) {
    $workingDirectory = [Environment]::ExpandEnvironmentVariables([string]$Action.WorkingDirectory).Trim('"').TrimEnd('\')
    $program = [Environment]::ExpandEnvironmentVariables([string]$Action.Execute).Trim('"')
    return ($workingDirectory -ieq $Directory -and $program -ieq $Executable -and
        $Action.Arguments -match '(?i)^\s*"?index\.mjs"?\s*$')
}
$appRoot = 'C:\sites\ketquaxsmb\lottery-crawl-master'
$expectedNode = 'C:\sites\ketquaxsmb\.runtime\node-v24.22.3-win-x64\node.exe'
$pm2 = (Get-Command pm2.cmd -ErrorAction Stop).Source
$listeners = @(Get-NetTCPConnection -LocalPort 3101 -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique)
if ($listeners.Count -ne 1) { throw 'Expected exactly one listener on port 3101. No task or process was changed.' }
$server = Get-CimInstance Win32_Process -Filter "ProcessId = $($listeners[0])"
$parent = Get-CimInstance Win32_Process -Filter "ProcessId = $($server.ParentProcessId)"
if ($server.Name -ne 'node.exe' -or $server.CommandLine -notmatch '(?i)(?:^|[\s"])index\.mjs(?:[\s"]|$)' -or $parent.CommandLine -notmatch '(?i)-s\s+Schedule(?:\s|$)') {
    throw 'The listener no longer matches the observed Scheduler-launched index.mjs process. No changes made.'
}
if (!(Test-Path -LiteralPath $expectedNode)) { throw 'The patched ketquaxsmb Node runtime is missing.' }

$candidates = @()
foreach ($task in Get-ScheduledTask) {
    foreach ($action in $task.Actions) {
        if (Test-KetquaStartupAction $action $appRoot $server.ExecutablePath) {
            $candidates += $task
            break
        }
    }
}
if ($candidates.Count -ne 1) {
    Write-Host 'Could not uniquely identify the app-specific task. No changes made. Candidate Node actions:'
    foreach ($task in Get-ScheduledTask) {
        foreach ($action in $task.Actions) {
            if ($action.Execute -match '(?i)node(?:\.exe)?"?$' -and $action.Arguments -match 'index\.mjs') {
                [pscustomobject]@{TaskName=$task.TaskName;TaskPath=$task.TaskPath;Execute=$action.Execute;WorkingDirectory=$action.WorkingDirectory} | Format-List
            }
        }
    }
    throw 'Send the candidate task details before attempting recovery.'
}
$task = $candidates[0]
if (@($task.Actions).Count -ne 1) {
    throw 'The matching task has additional actions. No changes made; inspect it before recovery.'
}
Write-Host "Duplicate startup task: $($task.TaskPath)$($task.TaskName)"
Write-Host "Current listener: PID $($server.ProcessId), $($server.ExecutablePath)"

# Verify PM2's saved app configuration before stopping the working instance.
$previousEncoding = [Console]::OutputEncoding
$OutputEncoding = New-Object System.Text.UTF8Encoding($false)
try {
    [Console]::OutputEncoding = $OutputEncoding
    $metadata = (& $pm2 jlist) -join "`n"
    if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect PM2.' }
    $metadata | & $expectedNode (Join-Path $PSScriptRoot 'check-ketquaxsmb-pm2.cjs')
    if ($LASTEXITCODE -ne 0) { throw 'PM2 configuration differs from the expected app. No changes made.' }
} finally { [Console]::OutputEncoding = $previousEncoding }

$backup = Join-Path $env:USERPROFILE "ketquaxsmb-recovery-$(Get-Date -Format yyyyMMdd-HHmmss)"
New-Item -ItemType Directory -Path $backup | Out-Null
Export-ScheduledTask -TaskName $task.TaskName -TaskPath $task.TaskPath |
    Set-Content -LiteralPath (Join-Path $backup 'startup-task.xml') -Encoding Unicode
if (Test-Path -LiteralPath "$env:USERPROFILE\.pm2\dump.pm2") {
    Copy-Item -LiteralPath "$env:USERPROFILE\.pm2\dump.pm2" -Destination $backup
}
$wasEnabled = $task.State -ne 'Disabled'
Disable-ScheduledTask -TaskName $task.TaskName -TaskPath $task.TaskPath | Out-Null
try {
    Stop-ScheduledTask -TaskName $task.TaskName -TaskPath $task.TaskPath
    for ($attempt = 0; $attempt -lt 15; $attempt++) {
        if (!(Get-NetTCPConnection -LocalPort 3101 -State Listen -ErrorAction SilentlyContinue)) { break }
        Start-Sleep -Seconds 1
    }
    if (Get-NetTCPConnection -LocalPort 3101 -State Listen -ErrorAction SilentlyContinue) {
        throw 'The startup task did not release port 3101.'
    }
    & $pm2 restart ketquaxsmb
    if ($LASTEXITCODE -ne 0) { throw 'PM2 restart failed.' }
    $healthy = $false
    for ($attempt = 0; $attempt -lt 15; $attempt++) {
        Start-Sleep -Seconds 2
        $managedPid = [string](& $pm2 pid ketquaxsmb)
        if ($LASTEXITCODE -ne 0 -or $managedPid.Trim() -notmatch '^\d+$' -or [int]$managedPid.Trim() -eq 0) { continue }
        $listener = Get-NetTCPConnection -LocalPort 3101 -State Listen -ErrorAction SilentlyContinue
        if (!$listener -or $listener.OwningProcess -notcontains [int]$managedPid.Trim()) { continue }
        $worker = Get-CimInstance Win32_Process -Filter "ProcessId = $($managedPid.Trim())"
        if ($worker.ExecutablePath -ine $expectedNode) { throw 'The active worker is using an unexpected Node runtime.' }
        try {
            $response = Invoke-WebRequest 'http://127.0.0.1:3101/' -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -eq 200) { $healthy = $true; break }
        } catch { }
    }
    if (!$healthy) { throw 'The PM2 worker did not pass port, runtime and HTTP checks.' }
    Start-Sleep -Seconds 5
    $confirmedPid = [string](& $pm2 pid ketquaxsmb)
    if ($confirmedPid.Trim() -ne $managedPid.Trim()) { throw 'The worker did not remain stable.' }
    & $pm2 save
    if ($LASTEXITCODE -ne 0) { throw 'PM2 save failed.' }
    Write-Host 'SUCCESS: ketquaxsmb is managed by PM2, Node 24.22.3, port 3101, HTTP 200. Duplicate task disabled.' -ForegroundColor Green
    Write-Host "Task backup: $backup\startup-task.xml"
    & $pm2 status
} catch {
    $failure = $_
    & $pm2 stop ketquaxsmb
    if ($wasEnabled) { Enable-ScheduledTask -TaskName $task.TaskName -TaskPath $task.TaskPath | Out-Null }
    Start-ScheduledTask -TaskName $task.TaskName -TaskPath $task.TaskPath -ErrorAction Continue
    Write-Warning 'PM2 recovery failed; attempted to restore the original startup task. Verify port 3101 and send the error.'
    throw $failure
}
