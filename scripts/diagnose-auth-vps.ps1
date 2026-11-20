[CmdletBinding()]
param([switch]$ShowCmsOtp)

$ErrorActionPreference = 'Stop'
$node = Join-Path $env:USERPROFILE '9life-runtime\node-v24.22.3-win-x64\node.exe'
if (!(Test-Path -LiteralPath $node)) { throw 'The 9life portable Node runtime was not found.' }
$pm2 = (Get-Command pm2.cmd -ErrorAction Stop).Source
$previousEncoding = [Console]::OutputEncoding
$OutputEncoding = New-Object System.Text.UTF8Encoding($false)
try {
    [Console]::OutputEncoding = $OutputEncoding
    $metadata = & $pm2 jlist
    if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect PM2.' }
    $options = @()
    if ($ShowCmsOtp) { $options += '--show-cms-otp' }
    ($metadata -join "`n") | & $node (Join-Path $PSScriptRoot 'diagnose-auth-vps.cjs') @options
    if ($LASTEXITCODE -ne 0) { throw 'Auth diagnostics failed.' }
} finally { [Console]::OutputEncoding = $previousEncoding }
