@echo off
setlocal
cd /d "%~dp0"
echo CutAI CAD/CAM Windows v0.8 wird installiert...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install-CutAI.ps1"
if errorlevel 1 (
  echo.
  echo Installation fehlgeschlagen. Siehe Meldung oben.
  pause
  exit /b 1
)
echo.
echo Fertig. CutAI CAD befindet sich auf dem Desktop und im Startmenue.
pause
