@echo off
setlocal
cd /d "%~dp0.."
where node >nul 2>&1
if errorlevel 1 (
  echo Install Node.js 24 first: https://nodejs.org/
  pause
  exit /b 1
)
node -e "if(process.versions.node.split('.')[0]!=='24'){console.error('Node.js 24 is required.');process.exit(1)}"
if errorlevel 1 (
  pause
  exit /b 1
)
echo Keep this window open while using the storefront. Stop with Ctrl+C.
call npm run storefront -- --no-watch %*
if errorlevel 1 pause
