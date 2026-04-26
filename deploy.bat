@echo off
REM Deploy script for Vartmaan Sarokaar to Cloudflare (Windows)

echo 🚀 Vartmaan Sarokaar Production Deployment
echo ===============================================
echo.

REM Check prerequisites
where npx >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: npx is not available. Install Node.js LTS first.
    exit /b 1
)

REM Check if logged in
echo 🔑 Checking Cloudflare authentication...
npx wrangler whoami >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Not authenticated. Run: npx wrangler login
    exit /b 1
)

echo ✅ Authenticated

REM Step 1: Check D1 database
echo.
echo Step 1: Checking D1 Database...
npx wrangler d1 list --config wrangler.worker.toml | findstr "vartmaansarokar-db" >nul
if %errorlevel% neq 0 (
    echo Creating D1 database...
    npx wrangler d1 create vartmaansarokar-db --config wrangler.worker.toml
    echo If this DB is new: copy the printed database_id into wrangler.worker.toml, then re-run deploy.
    echo ✅ D1 database created
) else (
    echo ✅ D1 database already exists
)

REM Step 2: Check R2 bucket
echo.
echo Step 2: Checking R2 Bucket...
npx wrangler r2 bucket list --config wrangler.worker.toml | findstr "vartmaan-media" >nul
if %errorlevel% neq 0 (
    echo Creating R2 bucket...
    npx wrangler r2 bucket create vartmaan-media --config wrangler.worker.toml
    echo ✅ R2 bucket created
) else (
    echo ✅ R2 bucket already exists
)

REM Step 3: Apply database schema
echo.
echo Step 3: Applying Database Schema...
npx wrangler d1 execute vartmaansarokar-db --file=schema.sql --config wrangler.worker.toml
echo ✅ Database schema applied

REM Step 4: Deploy Workers
echo.
echo Step 4: Deploying Workers API...
npx wrangler deploy --config wrangler.worker.toml
echo ✅ Workers API deployed

REM Step 5: Build frontend
echo.
echo Step 5: Building Frontend...
npm run build
echo ✅ Frontend built

echo.
echo Step 6: Deploying Pages...
npx wrangler pages deploy dist --project-name vartmaan-sarokar-pages
echo ✅ Pages deployed

echo.
echo 🎉 Deployment Complete!
echo ======================
echo.
echo Next steps:
echo 1. Ensure Pages env var VITE_API_BASE_URL is set to https://api.vartmaansarokaar.com
echo 2. Verify Worker route api.vartmaansarokaar.com is active
echo 3. Test logs with: npx wrangler tail --config wrangler.worker.toml
echo.
echo For detailed documentation, see DEPLOYMENT.md
echo.
echo ⚠️  Important: Set your secrets!
echo    npx wrangler secret put JWT_SECRET --config wrangler.worker.toml
echo    npx wrangler secret put STAFF_PASSWORD --config wrangler.worker.toml
echo    npx wrangler secret put GOOGLE_CLIENT_ID --config wrangler.worker.toml
