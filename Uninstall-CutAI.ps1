$ErrorActionPreference = 'SilentlyContinue'
$AppName = 'CutAI CAD'
$InstallDir = Join-Path $env:LOCALAPPDATA $AppName
$Desktop = [Environment]::GetFolderPath('Desktop')
Remove-Item (Join-Path $Desktop "$AppName.lnk") -Force
$StartMenuDir = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\$AppName"
Remove-Item $StartMenuDir -Recurse -Force
Write-Host 'CutAI CAD wird entfernt ...'
$cmd = "timeout /t 2 /nobreak >nul & rmdir /s /q `"$InstallDir`""
Start-Process -FilePath "$env:SystemRoot\System32\cmd.exe" -ArgumentList '/c', $cmd -WindowStyle Hidden
Write-Host 'Deinstallation gestartet.'
