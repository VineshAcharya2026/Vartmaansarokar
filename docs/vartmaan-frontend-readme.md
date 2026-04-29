# Vartmaan Sarokaar

Local-first news and magazine platform built with React + Vite (frontend) and Express + TypeScript (backend).

## Local setup

```bash
npm install
cp .env.example .env
```

Start in two terminals:

```bash
# Terminal 1: backend API + local file database
npm run server:dev

# Terminal 2: frontend
npm run dev
```

## Local architecture

- Frontend: Vite app on `http://localhost:3000`
- Backend/API: Express server on `http://localhost:5174`
- Data store: file-backed local JSON database at `backend/server/data/db.json`
- Uploads: local filesystem under `uploads/`

## Environment variables

Use `.env.example` as the template. Key local values:

```bash
PORT=5174
VITE_API_BASE_URL=http://localhost:5174
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## Useful scripts

```bash
npm run dev         # frontend
npm run server:dev  # backend (nodemon)
npm run typecheck
npm run build
```

