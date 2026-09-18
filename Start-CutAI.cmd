@echo off
setlocal
set "APPDIR=%LOCALAPPDATA%\CutAI CAD"
if not exist "%APPDIR%\index.html" (
  echo CutAI CAD ist nicht installiert. Bitte zuerst Install-CutAI.cmd ausfuehren.
  pause
  exit /b 1
)
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" (
  start "" "%APPDIR%\index.html"
  exit /b 0
)
set "URL=file:///%APPDIR:\=/%/index.html"
start "" "%EDGE%" --app="%URL%" --start-maximized
