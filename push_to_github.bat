@echo off
cd /d "C:\Users\bidbu\projects\partseekr"

echo Make sure you create a GitHub repo first at https://github.com/new
echo Then paste the repo URL below and press Enter.
set /p REPO_URL="GitHub repo URL (e.g. https://github.com/yourname/partseekr.git): "

if "%REPO_URL%"=="" (
  echo No URL provided. Exiting.
  exit /b 1
)

git init
git add .
git commit -m "Initial PartSeekr MVP"
git branch -M main
git remote add origin %REPO_URL%
git push -u origin main

echo Done. Now go to Render and create a new Web Service from this repo.
pause
