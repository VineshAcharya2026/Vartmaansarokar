# Quick Start: New Cloudflare Account Deployment

## 5-Minute Setup Checklist

### 1. Install & Authenticate
```bash
npm install -g wrangler
wrangler login
```

### 2. Create Infrastructure
```bash
wrangler d1 create vartmaan-sarokar-db
wrangler r2 bucket create vartmaan-media
```
📝 **Copy the Database ID from output!**

### 3. Initialize Database
```bash
wrangler d1 execute vartmaan-sarokar-db --file=schema.sql
```

### 4. Set Secrets (4 commands)
```bash
wrangler secret put JWT_SECRET
# Enter: [32+ char random string]

wrangler secret put STAFF_PASSWORD
# Enter: [secure password]

wrangler secret put OPENAI_API_KEY
# Enter: sk-...

wrangler secret put GOOGLE_CLIENT_ID
# Enter: ...apps.googleusercontent.com
```

### 5. Update Config Files
**File: `wrangler.toml`**
```toml
[[d1_databases]]
database_id = "YOUR_NEW_ID_HERE"    # Replace with copied ID

[vars]
ALLOWED_ORIGINS = "https://vartmaansarokaar.com,https://www.vartmaansarokaar.com,https://main.vartmaan-sarokar-pages.pages.dev"

routes = [
  { pattern = "api.vartmaansarokaar.com/*", zone_name = "vartmaansarokaar.com" }
]
```

**File: `utils/app.ts`**
```typescript
const PRODUCTION_API_URL = 'https://vartmaan-sarokar-api.YOUR_SUBDOMAIN.workers.dev';
```

### 6. Deploy
```bash
./deploy.sh          # macOS/Linux
# OR
deploy.bat           # Windows
```

### 7. Verify
- Workers: `curl https://api.vartmaansarokaar.com/api/health`
- Pages: `https://vartmaansarokaar.com`

---

## Daily Workflow: Commit → Push → Deploy

```bash
# Make changes
git add .
git commit -m "your message"
git push origin main

# Deploy (automatically or manually)
./deploy.sh
```

---

## Current Values to Replace

| Item | Current | Status |
|------|---------|--------|
| Database ID | `22be003e-a1b0-40d1-a356-c0d88155c36b` | ❌ OLD |
| R2 Bucket | `vartmaan-media` | ⚠️ Keep name, new bucket |
| Workers Domain | `vartmaan-sarokaar-api.vineshjm.workers.dev` | ❌ OLD |
| Pages Domain | `vartmaan-sarokar-pages.pages.dev` | ❌ OLD |

---

## Secrets to Generate

| Secret | Example |
|--------|---------|
| JWT_SECRET | `base64(head -c 32 /dev/urandom)` |
| STAFF_PASSWORD | `MySecurePass123!` |
| OPENAI_API_KEY | `sk-proj-...` |
| GOOGLE_CLIENT_ID | From Google Cloud Console |

---

## Files to Modify

1. ✅ `wrangler.toml` - Update database_id & ALLOWED_ORIGINS
2. ✅ `utils/app.ts` - Update PRODUCTION_API_URL
3. ✅ `.env` or `.env.local` - Update local dev API if needed

---

See **DEPLOYMENT-NEW-CLOUDFLARE.md** for detailed walkthrough.
