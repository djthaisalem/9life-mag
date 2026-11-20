$ErrorActionPreference = 'Stop'
$scriptPath = Join-Path $PSScriptRoot '..\scripts\update-windows-system.ps1'
$tokens = $null
$errors = $null
$ast = [System.Management.Automation.Language.Parser]::ParseFile($scriptPath, [ref]$tokens, [ref]$errors)
if ($errors.Count) { throw $errors[0] }
$definition = $ast.Find({ param($node) $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq 'Test-ServerSecurityUpdate' }, $true)
. ([scriptblock]::Create($definition.Extent.Text))
function Assert-Selection([string]$Title, [string]$Classification, [bool]$Expected, [bool]$RequiresInput = $false) {
    $update = [pscustomobject]@{
        Title = $Title
        InstallationBehavior = [pscustomobject]@{ CanRequestUserInput=$RequiresInput }
        Categories = @([pscustomobject]@{ CategoryID=$Classification })
    }
    if ((Test-ServerSecurityUpdate $update) -ne $Expected) { throw "Unexpected selection: $Title" }
}
$security = '0fa1201d-4330-4fa8-8ae9-b877473b6441'
Assert-Selection '2026-11 Cumulative Update for Microsoft server operating system version 21H2 for x64-based Systems' $security $true
Assert-Selection 'Security Update for Windows Server 2022' $security $true
Assert-Selection '.NET Framework Security Update for Windows Server 2022' $security $true
Assert-Selection 'Cumulative Update Preview for Windows Server 2022' $security $false
Assert-Selection 'Security Update for Windows Server 2025' $security $false
Assert-Selection 'Security Update for SQL Server 2022' $security $false
Assert-Selection 'Windows Server 2022 driver' 'ebfc1fc5-71a4-4f7b-9aca-3b9a503104a0' $false
Assert-Selection 'Windows Server 2022 Feature update' $security $false
Assert-Selection 'Security Update for Windows Server 2022' $security $false $true
Write-Output 'Windows PowerShell update-selection checks passed (9 cases). No system updates were installed.'
