# Vartmaan Sarokaar - Production Deployment Guide

This guide walks you through deploying the Vartmaan Sarokaar application to Cloudflare's edge infrastructure.

## Architecture Overview

- **Frontend:** Static site hosted on Cloudflare Pages (or GitHub Pages)
- **Backend API:** Cloudflare Workers with D1 Database and R2 Storage
- **Database:** Cloudflare D1 (SQLite-based edge database)
- **File Storage:** Cloudflare R2 (S3-compatible object storage)

## Prerequisites

1. Cloudflare account (free tier works)
2. Wrangler CLI installed: `npm install -g wrangler`
3. Authenticated with Cloudflare: `wrangler login`

## Step 1: Create D1 Database

```bash
# Create the D1 database
wrangler d1 create vartmaan-sarokar-db

# This will output a database ID like:
# ✅ Successfully created DB 'vartmaan-sarokar-db' with ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Copy the database ID and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "vartmaan-sarokar-db"
database_id = "your-actual-database-id-here"
```

## Step 2: Create R2 Bucket

```bash
# Create the R2 bucket for media storage
wrangler r2 bucket create vartmaan-media
```

## Step 3: Initialize Database Schema

```bash
# Apply the schema to D1
wrangler d1 execute vartmaan-sarokar-db --file=schema.sql
```

## Step 4: Set Production Secrets

```bash
# Set JWT secret (generate a secure random string)
wrangler secret put JWT_SECRET
# Enter: your-super-secure-random-string-here

# Set OpenAI API key (for chat functionality)
wrangler secret put OPENAI_API_KEY
# Enter: sk-xxxxxxxxxxxxxxxxxxxxxxxx

# Set Google Client ID (for OAuth)
wrangler secret put GOOGLE_CLIENT_ID
# Enter: your-google-client-id.apps.googleusercontent.com

# Set staff password (for admin/editor logins)
wrangler secret put STAFF_PASSWORD
# Enter: your-secure-staff-password
```

## Step 5: Deploy Workers API

```bash
# Deploy the Workers API
wrangler deploy

# This will output your Workers URL:
# ✨ Successfully deployed to https://vartmaan-sarokaar-api.your-subdomain.workers.dev
```

## Step 6: Update Frontend API URL

Edit `utils/app.ts` and update the production API URL:

```typescript
const PRODUCTION_API_URL = 'https://vartmaan-sarokaar-api.your-subdomain.workers.dev';
```

## Step 7: Build and Deploy Frontend

### Option A: Cloudflare Pages (Recommended)

```bash
# Build the frontend
npm run build

# Deploy to Pages
wrangler pages deploy dist --project-name=vartmaan-sarokaar
```

### Option B: GitHub Pages

```bash
# Build with GitHub Pages base URL
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Step 8: Migrate Data (Optional)

If you have existing data in local development:

```bash
# Generate migration SQL
npm run migrate:d1

# Apply to production D1
wrangler d1 execute vartmaan-sarokar-db --file=migrate-data.sql
```

## Environment Variables Reference

### Frontend (.env.local or build-time)

```bash
VITE_API_BASE_URL=https://vartmaan-sarokaar-api.your-subdomain.workers.dev
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### Backend (wrangler secrets)

| Secret | Purpose |
|--------|---------|
| `JWT_SECRET` | Signing JWT tokens for authentication |
| `OPENAI_API_KEY` | OpenAI API for chat functionality |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `STAFF_PASSWORD` | Password for admin/editor staff logins |

### Public Variables (wrangler.toml [vars])

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_UPLOAD_SIZE_BYTES` | 15728640 | Max file upload size (15MB) |
| `OPENAI_MODEL` | gpt-4o-mini | OpenAI model for chat |
| `ALLOWED_ORIGINS` | - | Comma-separated allowed CORS origins |

## Post-Deployment Checklist

- [ ] D1 database created and schema applied
- [ ] R2 bucket created
- [ ] Workers deployed and running
- [ ] Frontend deployed and accessible
- [ ] API health check passes: `GET /api/health`
- [ ] App state loads: `GET /api/app-state`
- [ ] Authentication works (test login)
- [ ] File uploads work (test media upload)
- [ ] Chat feature works (if OpenAI key configured)

## Updating After Deployment

### Update Workers API

```bash
# Make changes to server code
# Then redeploy:
wrangler deploy
```

### Update Frontend

```bash
# Make changes to frontend code
npm run build

# Deploy updated frontend:
# For Pages: wrangler pages deploy dist
# For GitHub Pages: npm run deploy
```

### Database Migrations

```bash
# Create migration file
wrangler d1 migrations create vartmaan-sarokar-db "description"

# Apply migrations
wrangler d1 migrations apply vartmaan-sarokar-db
```

## Troubleshooting

### CORS Errors
Update `ALLOWED_ORIGINS` in `wrangler.toml` to include your frontend domain.

### Database Errors
Check D1 database ID is correct in `wrangler.toml`:
```bash
wrangler d1 list  # List your databases
```

### File Upload Errors
Check R2 bucket exists and `MEDIA_BUCKET` binding is correct.

### Authentication Errors
Verify `JWT_SECRET` is set:
```bash
wrangler secret list
```

## Security Considerations

1. **JWT_SECRET**: Use a cryptographically secure random string (32+ characters)
2. **STAFF_PASSWORD**: Use a strong unique password, not the default
3. **CORS**: Only allow your actual frontend domain in production
4. **R2**: Files are public by default - implement access control if needed
5. **API Keys**: Never commit API keys to git, always use wrangler secrets

## Monitoring

- Cloudflare Dashboard: https://dash.cloudflare.com
- Workers Analytics: View in dashboard under Workers & Pages
- D1 Analytics: Database queries and performance
- R2 Analytics: Storage usage and egress

## Support

For issues:
1. Check `wrangler tail` for real-time logs
2. Review Cloudflare Workers documentation
3. Check D1 documentation for database issues
