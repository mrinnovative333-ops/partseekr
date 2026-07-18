@echo off
cd /d "C:\Users\bidbu\projects\partseekr"

set /p GITHUB_USER="GitHub username: "
set /p GITHUB_TOKEN="GitHub token (ghp_...): "
set /p RENDER_API_KEY="Render API key (rnd_...): "
set /p STRIPE_RESTRICTED_KEY="Stripe restricted key (rk_live_...): "

python deploy_render.py
pause
