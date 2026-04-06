@echo off
REM Deploy script for Vartmaan Sarokaar to Cloudflare (Windows)

echo 🚀 Vartmaan Sarokaar Production Deployment
echo ===============================================
echo.

REM Check prerequisites
where wrangler >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: wrangler is not installed. Run: npm install -g wrangler
    exit /b 1
)

REM Check if logged in
echo 🔑 Checking Cloudflare authentication...
wrangler whoami >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Not authenticated. Run: wrangler login
    exit /b 1
)

echo ✅ Authenticated

REM Step 1: Check D1 database
echo.
echo Step 1: Checking D1 Database...
wrangler d1 list | findstr "vartmaan-sarokar-db" >nul
if %errorlevel% neq 0 (
    echo Creating D1 database...
    wrangler d1 create vartmaan-sarokar-db
    echo ✅ D1 database created
) else (
    echo ✅ D1 database already exists
)

REM Step 2: Check R2 bucket
echo.
echo Step 2: Checking R2 Bucket...
wrangler r2 bucket list | findstr "vartmaan-media" >nul
if %errorlevel% neq 0 (
    echo Creating R2 bucket...
    wrangler r2 bucket create vartmaan-media
    echo ✅ R2 bucket created
) else (
    echo ✅ R2 bucket already exists
)

REM Step 3: Apply database schema
echo.
echo Step 3: Applying Database Schema...
wrangler d1 execute vartmaan-sarokar-db --file=schema.sql
echo ✅ Database schema applied

REM Step 4: Deploy Workers
echo.
echo Step 4: Deploying Workers API...
wrangler deploy
echo ✅ Workers API deployed

REM Step 5: Build frontend
echo.
echo Step 5: Building Frontend...
npm run build
echo ✅ Frontend built

echo.
echo 🎉 Deployment Complete!
echo ======================
echo.
echo Next steps:
echo 1. Update PRODUCTION_API_URL in utils/app.ts with your Workers URL
echo 2. Rebuild and deploy frontend to Pages/GitHub Pages
echo 3. Test the deployment with: wrangler tail
echo.
echo For detailed documentation, see DEPLOYMENT.md
echo.
echo ⚠️  Important: Set your secrets!
echo    wrangler secret put JWT_SECRET
echo    wrangler secret put STAFF_PASSWORD
echo    wrangler secret put OPENAI_API_KEY (optional)
echo    wrangler secret put GOOGLE_CLIENT_ID (optional)
