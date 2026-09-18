$ErrorActionPreference = 'Stop'
$AppName = 'CutAI CAD'
$SourceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$InstallDir = Join-Path $env:LOCALAPPDATA $AppName

Write-Host "Installiere $AppName nach $InstallDir ..." -ForegroundColor Cyan
if (Test-Path $InstallDir) {
    Remove-Item $InstallDir -Recurse -Force
}
New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null

Get-ChildItem -LiteralPath $SourceDir -Force | Where-Object {
    $_.Name -notlike '*.zip'
} | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $InstallDir -Recurse -Force
}

$browserCandidates = @(
    "$env:ProgramFiles(x86)\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "$env:ProgramFiles(x86)\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)
$Browser = $browserCandidates | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if (-not $Browser) {
    throw 'Microsoft Edge oder Google Chrome wurde nicht gefunden. Windows 11 enthaelt normalerweise Microsoft Edge.'
}

$IndexPath = Join-Path $InstallDir 'index.html'
$FileUrl = 'file:///' + (($IndexPath -replace '\\','/') -replace ' ','%20')
$IconPath = Join-Path $InstallDir 'CutAI.ico'
$Args = "--app=`"$FileUrl`" --start-maximized"

$WshShell = New-Object -ComObject WScript.Shell
$Desktop = [Environment]::GetFolderPath('Desktop')
$DesktopLink = Join-Path $Desktop "$AppName.lnk"
$Shortcut = $WshShell.CreateShortcut($DesktopLink)
$Shortcut.TargetPath = $Browser
$Shortcut.Arguments = $Args
$Shortcut.WorkingDirectory = $InstallDir
if (Test-Path $IconPath) { $Shortcut.IconLocation = "$IconPath,0" }
$Shortcut.Description = 'CutAI CAD/CAM Desktop'
$Shortcut.Save()

$StartMenuRoot = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'
$StartMenuDir = Join-Path $StartMenuRoot $AppName
New-Item -ItemType Directory -Path $StartMenuDir -Force | Out-Null
$StartLink = Join-Path $StartMenuDir "$AppName.lnk"
$Shortcut2 = $WshShell.CreateShortcut($StartLink)
$Shortcut2.TargetPath = $Browser
$Shortcut2.Arguments = $Args
$Shortcut2.WorkingDirectory = $InstallDir
if (Test-Path $IconPath) { $Shortcut2.IconLocation = "$IconPath,0" }
$Shortcut2.Description = 'CutAI CAD/CAM Desktop'
$Shortcut2.Save()

$UninstallLink = Join-Path $StartMenuDir 'CutAI CAD deinstallieren.lnk'
$Un = $WshShell.CreateShortcut($UninstallLink)
$Un.TargetPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
$Un.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$InstallDir\Uninstall-CutAI.ps1`""
$Un.WorkingDirectory = $InstallDir
$Un.Description = 'CutAI CAD deinstallieren'
$Un.Save()

Write-Host 'Installation abgeschlossen.' -ForegroundColor Green
Write-Host 'CutAI CAD wurde auf dem Desktop und im Startmenue angelegt.'
Start-Process -FilePath $Browser -ArgumentList $Args -WorkingDirectory $InstallDir
