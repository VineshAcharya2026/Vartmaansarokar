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
**File: `wrangler.worker.toml`**
```toml
[[d1_databases]]
database_id = "YOUR_NEW_ID_HERE"    # Replace with copied ID

[vars]
ALLOWED_ORIGINS = "https://vartmaansarokaar.com,https://www.vartmaansarokaar.com,https://main.vartmaan-sarokar-pages.pages.dev"

routes = [
  { pattern = "api.vartmaansarokaar.com/*", zone_name = "vartmaansarokaar.com" }
]
```

**Cloudflare Pages env var**
```bash
VITE_API_BASE_URL=https://api.vartmaansarokaar.com
```

### 6. Deploy
```bash
npx wrangler deploy --config wrangler.worker.toml
npm run build
npx wrangler pages deploy dist --project-name vartmaan-sarokar-pages

# OR use helper script
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
| Database ID | `9cc9608f-c17b-43f4-aa8c-4fc3306f02a4` | ✅ CURRENT (verify account) |
| R2 Bucket | `vartmaan-media` | ⚠️ Keep name, new bucket |
| Workers Domain | `api.vartmaansarokaar.com` | ✅ TARGET |
| Pages Domain | `main.vartmaan-sarokar-pages.pages.dev` | ✅ CURRENT |

---

## Secrets to Generate

| Secret | Example |
|--------|---------|
| JWT_SECRET | `base64(head -c 32 /dev/urandom)` |
| STAFF_PASSWORD | `MySecurePass123!` |
| GOOGLE_CLIENT_ID | From Google Cloud Console |

---

## Files to Modify

1. ✅ `wrangler.worker.toml` - Update database_id & ALLOWED_ORIGINS
2. ✅ Cloudflare Pages env vars - set `VITE_API_BASE_URL`
3. ✅ `.env` or `.env.local` - Update local dev API if needed

---

See **DEPLOYMENT-NEW-CLOUDFLARE.md** for detailed walkthrough.
