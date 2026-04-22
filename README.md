# Vartmaan Sarokaar

A modern Nepali digital news and magazine platform built with React, TypeScript, and Cloudflare.

## 🚀 Production Ready

This project is configured for deployment on Cloudflare's edge infrastructure:
- **Frontend:** Static site (GitHub Pages / Cloudflare Pages)
- **Backend:** Cloudflare Workers with D1 Database & R2 Storage
- **Database:** Cloudflare D1 (SQLite-based edge database)
- **Media Storage:** Cloudflare R2 (S3-compatible object storage)

## Quick Start (Development)

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development servers
npm run server:dev  # Backend API (port 5174)
npm run dev         # Frontend (port 3000)
```

## 📦 Production Deployment

### One-Command Deployment (Windows)

```bash
npm run deploy
```

### Manual Deployment Steps

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for detailed deployment instructions.

Quick overview:
1. `npm run db:create` - Create D1 database
2. `npm run r2:create` - Create R2 bucket  
3. `npm run db:schema` - Apply database schema
3. Set secrets: `JWT_SECRET`, `STAFF_PASSWORD`, `GOOGLE_CLIENT_ID`
5. `npm run deploy:workers` - Deploy Workers API
6. Update `PRODUCTION_API_URL` in `utils/app.ts`
7. `npm run deploy:pages` - Deploy frontend

## 🏗️ Architecture

### Frontend
- React 19 + TypeScript
- Vite 6 with HMR
- TailwindCSS + styled-components
- GSAP animations
- i18next (Nepali/English)
- react-router-dom v7

### Backend (Cloudflare Workers)
- Serverless edge functions
- D1 Database for persistence
- R2 Bucket for media storage
- JWT authentication
- Rate limiting & security headers

### Database Schema (D1)
- `users` - Authentication & roles
- `articles` - News posts
- `magazines` - Digital magazine issues
- `ads` - Advertisements
- `media` - File metadata
- `subscription_requests` - Purchase requests

## 📁 Project Structure

```
├── components/          # React components
├── pages/              # Route pages
├── server/             # Backend code
│   ├── workers-entry.ts # Cloudflare Workers entry
│   ├── d1-store.ts     # D1 database service
│   └── store.ts        # File-based store (dev)
├── migrations/         # Database migrations
├── locales/            # i18n translations
├── schema.sql          # D1 database schema
├── wrangler.toml       # Cloudflare Pages (Vite dist) only
├── wrangler.worker.toml # API Worker (D1, R2, routes to api.*)
└── DEPLOYMENT.md       # Deployment guide
```

## 🔐 Environment Variables

### Frontend
```bash
VITE_API_BASE_URL=https://your-workers-url.workers.dev
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### Backend Secrets (Cloudflare Worker)
```bash
wrangler secret put JWT_SECRET -c wrangler.worker.toml
wrangler secret put STAFF_PASSWORD -c wrangler.worker.toml
wrangler secret put GOOGLE_CLIENT_ID -c wrangler.worker.toml
```

## 📝 Available Scripts

```bash
# Development
npm run dev            # Start frontend dev server
npm run server:dev     # Start backend dev server

# Building
npm run build          # Build for production
npm run typecheck      # Run TypeScript checks

# Database
npm run db:create      # Create D1 database
npm run db:schema      # Apply schema
npm run migrate:d1     # Generate migration SQL

# Deployment
npm run deploy         # Deploy to production
npm run deploy:workers # Deploy Workers only
npm run deploy:pages   # Deploy to Pages
```

## 👥 User Roles

- **GENERAL** - Digital/Physical subscribers
- **MAGAZINE** - Magazine editors
- **ADMIN** - Administrators
- **SUPER_ADMIN** - Full system access

## 🛡️ Security Features

- JWT-based authentication (7-day expiry)
- bcrypt password hashing
- Helmet security headers
- Rate limiting per endpoint
- CORS configuration
- Google OAuth integration

