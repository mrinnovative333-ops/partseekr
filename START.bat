@echo off
cd /d "C:\Users\bidbu\projects\partseekr"
if exist .env (
  echo Loading environment from .env
) else (
  echo No .env file found. Create one from .env.example
)
node server.js
pause
