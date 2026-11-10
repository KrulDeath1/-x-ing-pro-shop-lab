@echo off
title X-ING Pro Shop Lab - Update ball list
cd /d "%~dp0"
echo X-ING Pro Shop Lab - ball list update
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed on this computer.
  echo Install the LTS version from https://nodejs.org and run this again.
  echo.
  pause
  exit /b 1
)
if not exist "x-ing-pro-shop-lab.html" (
  echo Can't find x-ing-pro-shop-lab.html next to this file.
  echo Keep "Update ball list.bat", update-balls.js and the app in the same folder.
  echo.
  pause
  exit /b 1
)
node update-balls.js "x-ing-pro-shop-lab.html"
set RC=%errorlevel%
echo.
if not "%RC%"=="0" (
  echo The update did not finish. The app was not changed.
) else (
  echo Done. Reopen x-ing-pro-shop-lab.html ^(or refresh it^) to see the new balls.
)
echo.
pause
