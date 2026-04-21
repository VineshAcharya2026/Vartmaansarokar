# Deployment Checklist & Progress Tracker

## Pre-Deployment Verification

### ✅ Git Repository Status
- [ ] Local changes committed
- [ ] All branches synced
- [ ] Main branch is production-ready
- [ ] No merge conflicts

### ✅ Code Quality
- [ ] `npm run typecheck` passes (no TS errors)
- [ ] `npm run build` succeeds (no build errors)
- [ ] `npm run build:workers` succeeds
- [ ] No console errors in dev server
- [ ] No API warnings in server logs

### ✅ Environment Setup
- [ ] Node.js v18+ installed
- [ ] npm packages installed (`npm install`)
- [ ] Wrangler CLI installed globally (`npm install -g wrangler`)
- [ ] Git configured locally

---

## New Cloudflare Account Setup

### Step 1: Account Creation & Authentication
- [ ] Create Cloudflare account (https://dash.cloudflare.com)
- [ ] Verify email address
- [ ] Wrangler installed: `npm install -g wrangler`
- [ ] Authenticate: `wrangler login`
- [ ] Verify auth: `wrangler whoami` shows your email

**Status:** ⚠️ PENDING
**Last Verified:** _________

---

### Step 2: Create Infrastructure (D1 & R2)
- [ ] Create D1 Database
  ```bash
  wrangler d1 create vartmaan-sarokar-db
  ```
  **Database ID:** ___________________________
  
- [ ] Copy Database ID
- [ ] Create R2 Bucket
  ```bash
  wrangler r2 bucket create vartmaan-media
  ```
  **Confirmation:** ✓ Bucket created

**Status:** ⚠️ PENDING
**Database ID Saved:** Yes / No

---

### Step 3: Initialize Database
- [ ] Schema applied
  ```bash
  wrangler d1 execute vartmaan-sarokar-db --file=schema.sql
  ```
- [ ] Seed data loaded (optional)
  ```bash
  wrangler d1 execute vartmaan-sarokar-db --file=scripts/seed.sql
  ```

**Status:** ⚠️ PENDING
**Schema Tables Count:** _____ tables

---

### Step 4: Set Production Secrets (⚠️ CRITICAL)
Must set all 4 secrets:

1. **JWT_SECRET**
   - [ ] Generated (32+ random characters)
   - [ ] Set: `wrangler secret put JWT_SECRET`
   - **Value Length:** _____ characters
   - **Value Sample:** ____________...

2. **STAFF_PASSWORD**
   - [ ] Created (secure password)
   - [ ] Set: `wrangler secret put STAFF_PASSWORD`
   - **Stored Securely:** Yes / No

3. **OPENAI_API_KEY**
   - [ ] From OpenAI account
   - [ ] Set: `wrangler secret put OPENAI_API_KEY`
   - **Valid:** Yes / No

4. **GOOGLE_CLIENT_ID**
   - [ ] From Google Cloud Console
   - [ ] Set: `wrangler secret put GOOGLE_CLIENT_ID`
   - **Format:** ________.apps.googleusercontent.com

**Status:** ⚠️ PENDING
**Secrets Set:** 0/4

---

### Step 5: Update Configuration Files

#### File: `wrangler.toml`
```toml
[[d1_databases]]
binding = "DB"
database_name = "vartmaan-sarokar-db"
database_id = "YOUR_ID_HERE"  # ← Replace with copied ID
```

- [ ] Updated database_id field
- [ ] Updated ALLOWED_ORIGINS with new domain
- [ ] File saved

**Current Value:** database_id = ________________

#### File: `utils/app.ts`
```typescript
const PRODUCTION_API_URL = 'https://vartmaan-sarokar-api.YOUR_SUBDOMAIN.workers.dev';
```

- [ ] Located PRODUCTION_API_URL constant
- [ ] Updated with new Workers domain
- [ ] File saved

**Current Value:** https://________________________

#### File: `.env` (Local Development - optional)
```bash
VITE_API_URL=https://vartmaan-sarokar-api.YOUR_SUBDOMAIN.workers.dev
```

- [ ] Updated (if using .env)
- [ ] Or left default for local dev

**Status:** ⚠️ PENDING
**Files Modified:** 0/2

---

## Deployment Execution

### Pre-Deployment Final Check
```bash
npm run typecheck        # Type safety ✓
npm run build            # Frontend build ✓
npm run build:workers    # Backend build ✓
```

- [ ] All commands pass without errors
- [ ] No TypeScript errors
- [ ] No build warnings
- [ ] dist/ folder created (size: _____ KB)

### Execute Deployment

#### Option A: Automated Script
```bash
./deploy.sh              # macOS/Linux
# OR
deploy.bat               # Windows
```

- [ ] Deploy script executed
- [ ] Script completed without errors
- [ ] Watched all output messages

#### Option B: Manual Steps
```bash
npm run build                    # Build frontend
npm run build:workers            # Build backend
wrangler deploy                  # Deploy Workers
wrangler pages deploy dist       # Deploy Pages
```

- [ ] Frontend built ✓
- [ ] Backend built ✓
- [ ] Workers deployed ✓
- [ ] Pages deployed ✓

**Deployment Time:** _____ minutes
**Deployment Status:** ✅ COMPLETE / ⚠️ ERRORS

---

## Post-Deployment Verification

### Workers API Health Check
```bash
curl https://vartmaan-sarokar-api.[SUBDOMAIN].workers.dev/api/health
```

- [ ] Returns HTTP 200
- [ ] Response valid JSON
- [ ] Database connection confirmed

**Status:** ✅ OK / ❌ FAILED
**Response Time:** _____ ms

### Pages Frontend Access
- [ ] URL loads: `https://vartmaan-sarokar.pages.dev`
- [ ] React app initializes
- [ ] Homepage renders correctly
- [ ] No 404 errors
- [ ] Assets load (CSS, JS, fonts)

**Status:** ✅ OK / ❌ FAILED
**Load Time:** _____ seconds

### Feature Testing (Critical Paths)

#### Articles
- [ ] Article list loads from database
- [ ] Article detail page works
- [ ] Can view article content
- [ ] Media/images display

#### Authentication
- [ ] Login form accessible
- [ ] Staff login works (use STAFF_PASSWORD)
- [ ] JWT token generated
- [ ] Session persists

#### Database
- [ ] Queries execute correctly
- [ ] Data displays accurately
- [ ] No SQL errors in logs
- [ ] Pagination works (if applicable)

#### Media/Uploads
- [ ] Media uploads to R2
- [ ] Images display from R2
- [ ] Upload validation works
- [ ] File size limits enforced

#### API Endpoints (Sample)
- [ ] GET /api/articles → 200 OK
- [ ] GET /api/articles/:id → 200 OK
- [ ] POST /api/auth/login → 200 OK (valid creds)
- [ ] POST /api/auth/login → 401 UNAUTHORIZED (invalid creds)

### Internationalization (i18n)
- [ ] Language switcher works
- [ ] English content displays
- [ ] Hindi content displays
- [ ] Other language samples work (at least 2)

**All Features Tested:** Yes / No
**Issues Found:** 0 / _____

---

## Monitoring & Logs

### Cloudflare Dashboard Access
- [ ] Workers Analytics available
- [ ] Pages Analytics available
- [ ] Error logs accessible
- [ ] Performance metrics visible

### Error Monitoring
- [ ] No 5xx errors in logs
- [ ] CORS errors resolved (if any)
- [ ] Database connection stable
- [ ] No memory issues

---

## Documentation Updates

- [ ] Update team with new API URL
- [ ] Share Database ID (securely)
- [ ] Document secrets location
- [ ] Update README.md if needed
- [ ] Share this checklist with team

---

## Rollback Plan (If Issues)

In case of deployment issues:

```bash
# Revert to previous deployment
wrangler rollback

# Or redeploy from main
git checkout main
git pull origin main
./deploy.sh
```

- [ ] Understand rollback process
- [ ] Have git history backup
- [ ] Team notified of backup plan

---

## Sign-Off

**Deployment Date:** ___________________
**Deployed By:** ___________________
**Verified By:** ___________________

**Final Status:**
- [ ] ✅ SUCCESSFULLY DEPLOYED
- [ ] ⚠️ DEPLOYED WITH WARNINGS (Document issues below)
- [ ] ❌ DEPLOYMENT FAILED (See error log below)

**Issues/Notes:**
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

**Next Steps:**
```
_________________________________________________________________
_________________________________________________________________
```

---

## Quick Reference: Important Values

| Item | Value | Status |
|------|-------|--------|
| Database ID | | ⚠️ PENDING |
| R2 Bucket | vartmaan-media | ✅ SET |
| Workers URL | https://...workers.dev | ⚠️ PENDING |
| Pages URL | https://...pages.dev | ⚠️ PENDING |
| JWT_SECRET | [SECURED] | ⚠️ PENDING |
| STAFF_PASSWORD | [SECURED] | ⚠️ PENDING |
| OPENAI_API_KEY | [SECURED] | ⚠️ PENDING |
| GOOGLE_CLIENT_ID | [SECURED] | ⚠️ PENDING |

---

**Checklist Version:** 1.0
**Last Updated:** April 20, 2026
**Print & Use:** Yes ✓
