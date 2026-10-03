@echo off
rem Vidosodel launcher for Windows: finds (or installs) Python, then runs scripts\bootstrap.py
rem which installs everything else and starts the app in the browser.
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title Vidosodel

set "PY="
for %%V in (3.13 3.12 3.11) do (
  if not defined PY (
    py -%%V -c "import sys" >nul 2>&1 && set "PY=py -%%V"
  )
)
if not defined PY (
  python -c "import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)" >nul 2>&1 && set "PY=python"
)
if not defined PY (
  if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" set PY="%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
)

if not defined PY (
  echo Python 3.11+ не найден. Устанавливаю Python 3.12 для текущего пользователя...
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest 'https://www.python.org/ftp/python/3.12.10/python-3.12.10-amd64.exe' -OutFile \"$env:TEMP\python-installer.exe\""
  if errorlevel 1 (
    echo Не удалось скачать Python. Установите его вручную с https://www.python.org и запустите start.bat снова.
    pause
    exit /b 1
  )
  "%TEMP%\python-installer.exe" /quiet InstallAllUsers=0 PrependPath=1 Include_launcher=1 Include_test=0
  set PY="%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
)

%PY% "scripts\bootstrap.py" %*
if errorlevel 1 pause
endlocal
