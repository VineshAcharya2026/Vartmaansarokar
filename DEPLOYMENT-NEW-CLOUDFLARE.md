# Deployment Ready: New Cloudflare Account Setup

## 📋 Project Workflow Overview

### Architecture Layers
```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE NETWORK                   │
├─────────────────────────────────────────────────────────────┤
│  Frontend: Cloudflare Pages (dist/) → Static Assets         │
│  Backend: Cloudflare Workers → API Endpoints                │
│  Database: Cloudflare D1 → SQLite (Edge Database)           │
│  Storage: Cloudflare R2 → Media Files & Assets              │
└─────────────────────────────────────────────────────────────┘
       ↑               ↑              ↑
    GitHub       npm scripts       wrangler CLI
```

---

## 🔄 Development Workflow: Commit → Push → Deploy

### Phase 1: Local Development
```bash
# 1. Start development servers
npm run dev              # Frontend (http://localhost:3000)
npm run server:dev       # Backend API (http://localhost:5174)

# 2. Make changes in React components, TypeScript, SQL files
# - Components in ./components/
# - Pages in ./pages/
# - Services in ./services/
# - Backend routes in ./server/

# 3. Run type checking
npm run typecheck       # Validates TypeScript for frontend + backend
```

### Phase 2: Testing & Verification
```bash
# Type safety checks
npm run typecheck

# Optional: Run linting/validation
npm run build:workers   # Builds backend TypeScript
npm run build           # Builds entire frontend
```

### Phase 3: Commit & Push
```bash
# Stage changes
git add .

# Commit with meaningful message
git commit -m "feat: add new article feature"
# or
git commit -m "fix: update article preview"
# or
git commit -m "docs: update deployment guide"

# Push to main branch
git push origin main
```

### Phase 4: Deploy (Automated/Manual)

#### Option A: Manual Deployment
```bash
# Windows
deploy.bat

# macOS/Linux
./deploy.sh
```

#### Option B: What the Deploy Script Does
1. ✅ Checks wrangler CLI is installed
2. ✅ Verifies Cloudflare authentication (`wrangler whoami`)
3. ✅ Runs type checking
4. ✅ Builds frontend (`npm run build`)
5. ✅ Builds workers (`npm run build:workers`)
6. ✅ Deploys API (`wrangler deploy`)
7. ✅ Deploys frontend (`wrangler pages deploy dist`)

---

## 🆕 Preparing New Cloudflare Account: Step-by-Step

### Prerequisites
```bash
# 1. Install Wrangler globally
npm install -g wrangler

# 2. Authenticate with new Cloudflare account
wrangler login
# Browser opens → Sign in with new Cloudflare account
# Authorize Wrangler access
```

### Step 1: Create D1 Database
```bash
wrangler d1 create vartmaan-sarokar-db
```
**Output will show:**
```
✅ Successfully created DB 'vartmaan-sarokar-db' with ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Action Required:**
- Copy the database ID
- Update `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "vartmaan-sarokar-db"
database_id = "YOUR_NEW_DATABASE_ID_HERE"
```

### Step 2: Create R2 Bucket
```bash
wrangler r2 bucket create vartmaan-media
```
✅ Confirms bucket created for media storage

### Step 3: Initialize Database Schema
```bash
# Apply all table definitions
wrangler d1 execute vartmaan-sarokar-db --file=schema.sql

# Seed initial data (optional)
wrangler d1 execute vartmaan-sarokar-db --file=scripts/seed.sql
```

### Step 4: Set Production Secrets
```bash
# Generate secure JWT_SECRET (at least 32 characters)
wrangler secret put JWT_SECRET
# Paste: your-super-secure-random-string-minimum-32-chars

# Set staff login password
wrangler secret put STAFF_PASSWORD
# Paste: your-secure-admin-password

# Set OpenAI API key (for chat features)
wrangler secret put OPENAI_API_KEY
# Paste: sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Set Google OAuth Client ID
wrangler secret put GOOGLE_CLIENT_ID
# Paste: your-google-app-client-id.apps.googleusercontent.com
```

### Step 5: Update Configuration Files

#### Update `wrangler.toml` with new account domain:
```toml
[vars]
# Update ALLOWED_ORIGINS with your new deployment URLs
ALLOWED_ORIGINS = "https://vartmaan-sarokar.pages.dev,https://vartmaan-sarokar-api.NEW_SUBDOMAIN.workers.dev"
```

#### Update `utils/app.ts` API endpoints:
```typescript
// Update production API URL after first deployment
const PRODUCTION_API_URL = 'https://vartmaan-sarokar-api.NEW_SUBDOMAIN.workers.dev';
```

### Step 6: First Deployment
```bash
# Option A: Use deploy script
./deploy.sh         # macOS/Linux
deploy.bat          # Windows

# Option B: Manual step-by-step
npm run build                           # Build frontend
npm run build:workers                   # Build backend
wrangler deploy                         # Deploy Workers API
wrangler pages deploy dist --project-name=vartmaan-sarokar  # Deploy frontend
```

### Step 7: Verify Deployment
```bash
# Check Workers deployment
wrangler deployments list

# Get your Workers URL and Pages URL
wrangler pages project list

# Test API endpoint
curl https://vartmaan-sarokar-api.NEW_SUBDOMAIN.workers.dev/api/health

# Test frontend
open https://vartmaan-sarokar.pages.dev
```

---

## 📦 Build & Deployment Architecture

### Frontend Build Process
```
Source Files (React/TypeScript)
    ↓
Vite Bundler
    ├─ vendor chunk (react, react-dom, react-router-dom)
    ├─ ui chunk (gsap, lucide-react, styled-components)
    ├─ i18n chunk (i18next, react-i18next)
    └─ app chunk (custom code)
    ↓
dist/ folder
    ↓
Cloudflare Pages (Static CDN)
```

### Backend Build Process
```
Server TypeScript (server/*.ts)
    ↓
TypeScript Compiler
    ↓
JavaScript (dist-server/)
    ↓
Wrangler
    ↓
Cloudflare Workers
```

### Database Schema
- **Location:** `schema.sql`
- **Tables:** users, articles, ads, magazines, media, etc.
- **Migrations:** Located in `migrations/` for schema updates

### Type Safety
```
Frontend: tsconfig.app.json (DOM + React types)
Backend: tsconfig.server.json (Node.js + Hono types)
Base Config: tsconfig.base.json (shared)

npm run typecheck validates BOTH in one command
```

---

## 🔐 Secrets & Environment Variables

### Secrets (Stored in Cloudflare Dashboard - NOT in repo)
| Secret | Purpose | Example |
|--------|---------|---------|
| `JWT_SECRET` | Sign authentication tokens | Random 32+ char string |
| `STAFF_PASSWORD` | Admin/editor login | Secure password |
| `OPENAI_API_KEY` | ChatBot feature | sk-... |
| `GOOGLE_CLIENT_ID` | OAuth login | ....apps.googleusercontent.com |

### Environment Variables (In wrangler.toml - CAN be in repo)
| Variable | Value | Purpose |
|----------|-------|---------|
| `NODE_ENV` | production | Runtime mode |
| `MAX_UPLOAD_SIZE_BYTES` | 15728640 | 15MB upload limit |
| `OPENAI_MODEL` | gpt-4o-mini | AI model selection |
| `ALLOWED_ORIGINS` | Your domains | CORS whitelist |

---

## 🚀 Daily Development & Deployment Workflow

### For Feature Development:
```bash
# 1. Start local dev servers
npm run dev & npm run server:dev

# 2. Make changes
# Edit components, add features, etc.

# 3. Type check before commit
npm run typecheck

# 4. Commit & push
git add .
git commit -m "feat: description"
git push origin main

# 5. Deploy to production
./deploy.sh  # or deploy.bat on Windows
```

### For Hotfixes:
```bash
# 1. Create feature branch (optional)
git checkout -b fix/critical-issue

# 2. Make fix
# Edit problematic files

# 3. Test locally
npm run typecheck

# 4. Deploy directly
git add .
git commit -m "fix: critical issue"
git push origin main
./deploy.sh
```

### For Database Schema Changes:
```bash
# 1. Create migration file
# Add to migrations/ folder

# 2. Test locally
wrangler d1 execute vartmaan-sarokar-db --local --file=migrations/your_migration.sql

# 3. Deploy
git push origin main
./deploy.sh

# 4. Apply migration in production
wrangler d1 execute vartmaan-sarokar-db --file=migrations/your_migration.sql
```

---

## 📊 Current Deployment Status

### Active Configuration
- **Database ID:** `22be003e-a1b0-40d1-a356-c0d88155c36b` (OLD - Update with new account)
- **R2 Bucket:** `vartmaan-media` (OLD - Create new in new account)
- **Pages Domain:** vartmaan-sarokar-pages.pages.dev (OLD - Will be new in new account)
- **Workers Domain:** vartmaan-sarokaar-api.vineshjm.workers.dev (OLD - Will be new)

### For New Account
- [ ] Create D1 database & get ID
- [ ] Create R2 bucket
- [ ] Set all 4 secrets
- [ ] Update wrangler.toml with new IDs
- [ ] Update utils/app.ts with new API URL
- [ ] First deployment
- [ ] Verify all endpoints working
- [ ] Test frontend functionality

---

## ✅ Deployment Checklist

- [ ] New Cloudflare account created & verified
- [ ] Wrangler CLI installed globally
- [ ] Logged in to new Cloudflare account (`wrangler login`)
- [ ] D1 database created & ID copied
- [ ] R2 bucket created
- [ ] Schema applied to D1
- [ ] All 4 secrets set (JWT_SECRET, STAFF_PASSWORD, OPENAI_API_KEY, GOOGLE_CLIENT_ID)
- [ ] wrangler.toml updated with new database ID & bucket name
- [ ] utils/app.ts updated with new API URL
- [ ] Local type checking passes (`npm run typecheck`)
- [ ] Local build succeeds (`npm run build`)
- [ ] First deployment executed (`./deploy.sh`)
- [ ] Workers API responding (`curl https://...workers.dev/api/health`)
- [ ] Frontend pages loading (`https://...pages.dev`)
- [ ] Database connectivity verified (articles load, auth works)
- [ ] R2 bucket accepting uploads (media features work)

---

## 🆘 Troubleshooting

### "wrangler: command not found"
```bash
npm install -g wrangler
```

### "Not authenticated"
```bash
wrangler login
```

### Database ID not updated
```bash
# Verify current config
cat wrangler.toml

# Update database_id field
```

### API returning CORS errors
- Update `ALLOWED_ORIGINS` in wrangler.toml
- Re-deploy with `wrangler deploy`

### Secrets not accessible
```bash
# Verify secrets are set
wrangler secret list

# Re-set if missing
wrangler secret put JWT_SECRET
```

---

## 📚 Quick Reference

### Npm Scripts
```bash
npm run dev                # Frontend dev server
npm run dev:workers        # Workers dev server
npm run build              # Build frontend
npm run build:workers      # Build backend
npm run typecheck          # Type validation
npm run deploy             # Windows deployment script
npm run deploy:workers     # Deploy API only
npm run deploy:pages       # Deploy frontend only
```

### Wrangler Commands
```bash
wrangler login             # Authenticate
wrangler whoami            # Check auth
wrangler d1 create         # Create database
wrangler r2 bucket create  # Create bucket
wrangler secret put        # Set secret
wrangler deploy            # Deploy Workers
wrangler pages deploy      # Deploy Pages
```

---

## 🎯 Next Steps for New Cloudflare Account

1. **Create Cloudflare Account** → https://dash.cloudflare.com
2. **Run Setup Steps 1-4** from "Preparing New Cloudflare Account" above
3. **Update Configuration Files** (wrangler.toml, utils/app.ts)
4. **Run First Deployment** (./deploy.sh or deploy.bat)
5. **Test All Features** (articles, chat, uploads, auth)
6. **Update DNS/Domain** if custom domain needed
7. **Monitor Logs** in Cloudflare Dashboard

---

**Document Version:** 1.0 | **Updated:** April 20, 2026
