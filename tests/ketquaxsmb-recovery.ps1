$ErrorActionPreference = 'Stop'
$tokens=$null
$errors=$null
$scriptPath=Join-Path $PSScriptRoot '..\scripts\recover-ketquaxsmb-pm2.ps1'
$ast=[System.Management.Automation.Language.Parser]::ParseFile($scriptPath,[ref]$tokens,[ref]$errors)
if ($errors.Count) { throw $errors[0] }
$definition=$ast.Find({ param($node) $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq 'Test-KetquaStartupAction' },$true)
. ([scriptblock]::Create($definition.Extent.Text))
$directory='C:\sites\ketquaxsmb\lottery-crawl-master'
$executable='C:\Program Files\nodejs\node.exe'
$action=[pscustomobject]@{WorkingDirectory=$directory;Execute=$executable;Arguments='index.mjs'}
if (!(Test-KetquaStartupAction $action $directory $executable)) { throw 'Expected exact app match' }
$action.WorkingDirectory='C:\sites\other-app'
if (Test-KetquaStartupAction $action $directory $executable) { throw 'Must reject another app directory' }
$action.WorkingDirectory=$directory
$action.Execute='C:\other-node\node.exe'
if (Test-KetquaStartupAction $action $directory $executable) { throw 'Must reject another interpreter' }
$action.Execute=$executable
$action.Arguments='other-index.mjs'
if (Test-KetquaStartupAction $action $directory $executable) { throw 'Must reject another entry point' }
$action.Arguments='index.mjs --another-mode'
if (Test-KetquaStartupAction $action $directory $executable) { throw 'Must reject unverified arguments' }
$action.Arguments='"index.mjs"'
$action.WorkingDirectory='C:\SITES\KETQUAXSMB\LOTTERY-CRAWL-MASTER\'
if (!(Test-KetquaStartupAction $action $directory $executable)) { throw 'Expected Windows case-insensitive path and quoted argument support' }
Write-Output 'Recovery task-selection checks passed (6 cases). No tasks or services were changed.'
