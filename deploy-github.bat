@echo off
echo ============================================
echo  Deploying to GitHub: onboarding_reviewer
echo ============================================
echo.

cd /d "%~dp0"

git init
git branch -M main

git remote remove origin 2>nul
git remote add origin https://github.com/Prafullahire/onboarding_reviewer.git

git add .
git status

echo.
echo Committing all files...
git commit -m "feat: multi-agent onboarding case reviewer - full stack application"

echo.
echo Pushing to GitHub...
git push -u origin main --force

echo.
echo Done! Visit: https://github.com/Prafullahire/onboarding_reviewer
pause
