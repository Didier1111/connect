@echo off
REM deploy-website.bat
REM Deployment script for Project Connect website (Windows version)

echo 🚀 Starting Project Connect website deployment...

REM Check if we're in the right directory
if not exist "index.html" (
    echo ❌ Error: index.html not found. Please run this script from the project root directory.
    exit /b 1
)

echo ✅ Found project files

REM Build any necessary components (if needed)
echo 🔨 Building project components...
REM Add build commands here if needed
REM npm run build
REM webpack build
REM etc.

REM Deploy to GitHub Pages
echo 🌐 Deploying to GitHub Pages...

REM Add all files
git add .

REM Commit changes
git commit -m "Deploy website update - %date% %time%"

REM Push to main branch
git push origin main

echo ✅ Deployment complete!

REM Display deployment information
echo.
echo 📊 Deployment Summary:
echo    - Website deployed to: https://didier1111.github.io/connect/
echo    - Documentation: https://didier1111.github.io/connect/docs.html
echo    - Contribution page: https://didier1111.github.io/connect/contribute.html
echo    - Blog: https://didier1111.github.io/connect/blog.html
echo    - Contact: https://didier1111.github.io/connect/contact.html

echo.
echo ⏰ Deployment usually takes 1-2 minutes to be live.
echo    Please check https://github.com/Didier1111/connect/settings/pages for deployment status.

echo.
echo 🎉 Thank you for contributing to Project Connect!

pause