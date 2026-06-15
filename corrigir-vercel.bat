@echo off
cd /d "%~dp0"
echo Corrigindo arquivos para deploy na Vercel...

git rm -r --cached frontend-vercel\node_modules 2>nul
git rm --cached frontend-vercel\package-lock.json 2>nul

del frontend-vercel\package-lock.json 2>nul
rmdir /s /q frontend-vercel\node_modules 2>nul

git add .
git commit -m "corrige instalacao da vercel"
git push

echo.
echo Pronto. Agora volte na Vercel e faca Redeploy.
pause
