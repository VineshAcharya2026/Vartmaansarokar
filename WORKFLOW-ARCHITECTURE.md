# Vartmaan Sarokaar: Workflow & Deployment Architecture

## Complete Workflow: Development → Production

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LOCAL DEVELOPMENT                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  npm run dev                  npm run server:dev                            │
│  (port 3000)                 (port 5174)                                    │
│  ↓                           ↓                                              │
│  React Components            Express Server                                 │
│  TypeScript Code             TypeScript Code                                │
│  Assets & Styles             Database Queries                               │
│                                                                              │
│  ← → ← → ← → ← → ← → ← → ← → ← → ← → ← → ← → ← → ← → ← → ← → ← → ← →     │
│                                                                              │
│  http://localhost:3000/api/* proxied to http://localhost:5174/api/*        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                        ↓
                              npm run typecheck
                              (Validate TypeScript)
                                        ↓
                                    ✅ OK? → Continue
                                    ❌ Error? → Fix & Retry
                                        ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VERSION CONTROL                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  git add .                                                                  │
│  git commit -m "feat: add feature"                                          │
│  git push origin main                                                       │
│                                                                              │
│  GitHub Repository: VineshAcharya2026/Vartmaansarokar                       │
│  Branch: main (production)                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                        ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                       BUILD & COMPILATION                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  npm run build                                                              │
│  ├─ npm run typecheck  (TS validation)                                     │
│  ├─ vite build         (React bundling)                                    │
│  └─ Output → dist/                                                          │
│                                                                              │
│  npm run build:workers                                                      │
│  ├─ wrangler types     (Generate D1 types)                                 │
│  ├─ tsc compilation    (Server TS → JS)                                    │
│  └─ Output → dist-server/                                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                        ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DEPLOY TO CLOUDFLARE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  wrangler deploy                                                            │
│  └─ Workers API → Cloudflare Edge Network                                  │
│      └─ Endpoint: https://...workers.dev/api/*                             │
│                                                                              │
│  wrangler pages deploy dist                                                 │
│  └─ Frontend → Cloudflare Pages CDN                                        │
│      └─ URL: https://...pages.dev                                          │
│                                                                              │
│  ✨ Production live!                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture: Edge Network Stack

```
                         ┌─────────────────────┐
                         │   VARTMAAN USERS    │
                         │   (Browser)         │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
         ┌──────────▼─────────────┐    ┌───────────▼──────────┐
         │ CLOUDFLARE PAGES       │    │ CLOUDFLARE WORKERS   │
         │ (Frontend CDN)         │    │ (Backend API)        │
         ├────────────────────────┤    ├──────────────────────┤
         │ - React Bundle         │    │ - Hono Framework     │
         │ - Static Assets        │    │ - Request Handler    │
         │ - CSS/Fonts            │    │ - Business Logic     │
         │ - JavaScript           │    │ - Validation         │
         │ Global Edge Cache      │    │ Global Edge Compute  │
         └──────────┬─────────────┘    └──────────┬───────────┘
                    │                             │
                    │         ┌───────────────────┘
                    │         │
                    │    ┌────▼────────────┐
                    │    │                 │
                    │    │  API Requests   │
                    │    │                 │
                    │    └────┬────────────┘
                    │         │
         ┌──────────┴─────────┴──────────────┐
         │                                   │
    ┌────▼─────────┐                ┌───────▼──────┐
    │  CLOUDFLARE  │                │  CLOUDFLARE  │
    │  D1 DATABASE │                │  R2 STORAGE  │
    │              │                │              │
    │ - User Data  │                │ - Media      │
    │ - Articles   │                │ - Uploads    │
    │ - Comments   │                │ - Images     │
    │ - Settings   │                │ - Documents  │
    └──────────────┘                └──────────────┘

    All on Cloudflare's Global Edge Network = Instant, Everywhere!
```

---

## Request Flow: From Browser to Database

```
USER REQUEST
    │
    ├─ GET https://vartmaan-sarokar.pages.dev
    │
    ▼
CLOUDFLARE PAGES (Edge Location Nearest to User)
    ├─ Check Cache
    ├─ Serve React App (dist/)
    ├─ Bundle loads
    │
    └─ React App Initializes
        │
        ▼
        FETCH /api/articles (from browser)
        │
        ▼
CLOUDFLARE WORKERS (Same Edge Location)
    ├─ Receive request
    ├─ Route to handler
    ├─ Validate auth (JWT)
    │
    ├─ Query D1 Database
    │   │
    │   ▼
    │ CLOUDFLARE D1
    │ SELECT * FROM articles...
    │ Response ← Articles data
    │
    ├─ Check R2 for media
    │   │
    │   ▼
    │ CLOUDFLARE R2
    │ GET /images/...
    │ Response ← Image URL
    │
    └─ Return JSON Response
        │
        ▼
BROWSER (React)
    ├─ Parse Response
    ├─ Update State
    ├─ Re-render UI
    │
    ▼
USER SEES UPDATED CONTENT
    ↑
    └─ All processed at Edge (milliseconds!)
```

---

## Database Schema Overview

```
VARTMAAN SAROKAAR DATABASE (D1 SQLite)

┌─────────────────┐
│  Users          │
├─────────────────┤
│ id (PK)         │
│ email (UNIQUE)  │
│ password        │
│ role            │
│ created_at      │
│ verified_at     │
└─────────────────┘
        │
        ├──┐
        │  │
        ▼  ▼
┌─────────────────┐     ┌──────────────────┐
│ Articles        │     │ Comments         │
├─────────────────┤     ├──────────────────┤
│ id (PK)         │     │ id (PK)          │
│ user_id (FK)    │────→│ user_id (FK)     │
│ title           │     │ article_id (FK)  │
│ content         │────→│ content          │
│ category        │     │ created_at       │
│ media_id (FK)   │     └──────────────────┘
│ created_at      │
└─────────────────┘
        │
        │
        ▼
┌──────────────────┐     ┌──────────────────┐
│ Media            │     │ Magazines        │
├──────────────────┤     ├──────────────────┤
│ id (PK)          │     │ id (PK)          │
│ filename         │     │ title            │
│ r2_url           │────→│ articles (JSON)  │
│ type             │     │ cover_media_id   │
│ uploaded_by      │     │ published_at     │
│ created_at       │     └──────────────────┘
└──────────────────┘
```

---

## Environment & Secrets Management

```
LOCAL DEVELOPMENT (.env, .env.local)
├─ LOCAL_API_URL=http://localhost:5174
├─ NODE_ENV=development
└─ Optional dev secrets

                    ↓

PRODUCTION (wrangler.toml + Cloudflare Dashboard)
├─ [vars] Section
│  ├─ NODE_ENV=production
│  ├─ MAX_UPLOAD_SIZE_BYTES=15728640
│  ├─ OPENAI_MODEL=gpt-4o-mini
│  └─ ALLOWED_ORIGINS=...
│
├─ [[d1_databases]]
│  ├─ binding=DB
│  └─ database_id=xxxxx
│
├─ [[r2_buckets]]
│  ├─ binding=MEDIA_BUCKET
│  └─ bucket_name=vartmaan-media
│
└─ [Cloudflare Dashboard Secrets]
   ├─ JWT_SECRET ⚠️ NEVER in repo
   ├─ STAFF_PASSWORD ⚠️ NEVER in repo
   ├─ OPENAI_API_KEY ⚠️ NEVER in repo
   └─ GOOGLE_CLIENT_ID ⚠️ NEVER in repo
```

---

## Build Output Structure

```
PROJECT ROOT
├─ src files (React, TypeScript)
├─ server files (Backend, TypeScript)
│
├─ npm run build
│  └─ dist/ (Frontend - 200KB-500KB)
│     ├─ index.html (Entry point)
│     ├─ assets/
│     │  ├─ vendor-xxxxx.js (React, ReactDOM, Router)
│     │  ├─ ui-xxxxx.js (GSAP, Lucide, styled-components)
│     │  ├─ i18n-xxxxx.js (i18next, translations)
│     │  ├─ main-xxxxx.js (App code)
│     │  └─ *.css (Tailwind compiled)
│     └─ public assets
│
├─ npm run build:workers
│  └─ dist-server/ (Backend - compiled JS)
│     ├─ server/
│     │  ├─ index.js (Entry point)
│     │  ├─ controllers/
│     │  ├─ routes/
│     │  └─ services/
│     └─ types.js
│
└─ Cloudflare reads:
   - dist/ → Deployed to Pages
   - server/workers-entry.ts → Compiled & deployed to Workers
```

---

## Deployment Comparison: Old vs New Account

```
┌─────────────────────┬──────────────────────┬──────────────────────┐
│ Component           │ OLD (Current)        │ NEW (Setup Required) │
├─────────────────────┼──────────────────────┼──────────────────────┤
│ Cloudflare Account  │ vineshjm's account   │ Your new account     │
│                     │                      │                      │
│ D1 Database ID      │ 22be003e-a1b0...     │ [Will Generate]      │
│ Database Name       │ vartmaan-sarokar-db  │ vartmaan-sarokar-db  │
│                     │                      │                      │
│ R2 Bucket          │ vartmaan-media       │ vartmaan-media       │
│                     │ (old account)        │ (new account)        │
│                     │                      │                      │
│ Workers URL        │ vartmaan-sarokaar-api│ vartmaan-sarokar-api │
│                    │ .vineshjm.workers.dev│ .[YOUR].workers.dev  │
│                     │                      │                      │
│ Pages URL          │ vartmaan-sarokar-    │ vartmaan-sarokar     │
│                    │ pages.pages.dev      │ .pages.dev           │
│                     │                      │                      │
│ Secrets            │ ✅ Set               │ ❌ Need to set       │
│ (4 total)          │ in old account       │ - JWT_SECRET         │
│                    │                      │ - STAFF_PASSWORD     │
│                    │                      │ - OPENAI_API_KEY     │
│                    │                      │ - GOOGLE_CLIENT_ID   │
│                     │                      │                      │
│ Config Files       │ wrangler.toml        │ Update database_id   │
│ Changes            │ utils/app.ts         │ Update API URL       │
│                     │                      │                      │
│ Deployment Script  │ ./deploy.sh or       │ Same scripts,        │
│                    │ deploy.bat           │ authenticates to new │
│                     │                      │ account              │
└─────────────────────┴──────────────────────┴──────────────────────┘
```

---

## Key Files Location & Purpose

```
Vartmaansarokar/
│
├─ 📦 Configuration
│  ├─ wrangler.toml ⭐ Cloudflare config (UPDATE: database_id)
│  ├─ vite.config.ts → Build configuration
│  ├─ tsconfig.*.json → TypeScript settings
│  ├─ package.json → Dependencies & scripts
│  └─ vercel.json → Previous deployment (reference)
│
├─ 🚀 Deployment & Scripts
│  ├─ DEPLOYMENT.md → Original deployment guide
│  ├─ DEPLOYMENT-NEW-CLOUDFLARE.md ⭐ NEW: Detailed setup
│  ├─ DEPLOYMENT-QUICK-START.md ⭐ NEW: Quick reference
│  ├─ deploy.sh → Unix deployment script
│  └─ deploy.bat → Windows deployment script
│
├─ 💻 Frontend Code
│  ├─ index.tsx → React entry point
│  ├─ App.tsx → Main component
│  ├─ AppContext.tsx → Global state
│  ├─ components/ → React components
│  ├─ pages/ → Page components
│  ├─ services/ → API services
│  └─ utils/
│     └─ app.ts ⭐ UPDATE: PRODUCTION_API_URL
│
├─ 🔌 Backend Code
│  ├─ server/
│  │  ├─ index.new.ts → Express server
│  │  ├─ workers-entry.ts → Cloudflare entry
│  │  ├─ controllers/ → Request handlers
│  │  ├─ routes/ → API endpoints
│  │  ├─ services/ → Business logic
│  │  └─ utils/ → Helpers
│  └─ migrations/ → Database migrations
│
├─ 📊 Database
│  ├─ schema.sql → Database structure
│  ├─ scripts/seed.sql → Sample data
│  └─ migrations/*.sql → Schema updates
│
└─ 🌍 i18n & Assets
   ├─ locales/ → 13 language translations
   ├─ public/ → Static assets
   └─ styles.css → Global styles
```

---

## Git Workflow Example

```bash
# DAY 1: Feature Development
git checkout -b feature/new-article-type
nano components/Article.tsx
npm run typecheck          # ✅ Verify
git add components/Article.tsx
git commit -m "feat: add video article support"
git push origin feature/new-article-type

# Create PR on GitHub → Review → Merge to main

# DAY 2: Main branch updated
git checkout main
git pull origin main

# Deploy to production
npm run typecheck          # Final check
./deploy.sh                # Cloudflare deployment

# Verify
curl https://vartmaan-sarokar-api.[SUBDOMAIN].workers.dev/api/health

# ✨ Feature live!
```

---

**Ready for deployment on your new Cloudflare account!** 🚀
