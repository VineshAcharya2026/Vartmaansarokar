/**
 * Seed 15 articles via the live Worker API (no Wrangler / workerd).
 * Skips any row whose title already exists in /api/articles/all.
 *
 * Env (e.g. in .env, never commit secrets):
 *   API_URL=https://api.vartmaansarokaar.com
 *   SEED_EMAIL=superadmin@vartmaansarokar.com
 *   SEED_PASSWORD=<same as Worker STAFF_PASSWORD>
 *
 *   node --env-file=.env ./scripts/seed-articles-via-api.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, 'seed-data', 'articles-15.json');
const DOTENV = path.join(__dirname, '..', '.env');

/** Load KEY=VAL from .env into process.env if not already set (no dependency on --env-file). */
function loadDotenv() {
  if (!existsSync(DOTENV)) return;
  const text = readFileSync(DOTENV, 'utf8');
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

loadDotenv();

const API_URL = (process.env.API_URL || 'https://api.vartmaansarokaar.com').replace(/\/$/, '');
const SEED_EMAIL = (process.env.SEED_EMAIL || 'superadmin@vartmaansarokar.com').trim().toLowerCase();
const SEED_PASSWORD = process.env.SEED_PASSWORD || '';

function excerpt(s) {
  const t = String(s).replace(/\s+/g, ' ').trim();
  return t.length > 220 ? t.slice(0, 217) + '...' : t;
}

function escSql(s) {
  return String(s ?? '').replace(/'/g, "''");
}

function excerptFor(row) {
  if (row.excerpt) return row.excerpt;
  return excerpt(row.content);
}

function readD1IdFromWrangler() {
  const p = path.join(__dirname, '..', 'wrangler.worker.toml');
  if (!existsSync(p)) return null;
  const w = readFileSync(p, 'utf8');
  const m = w.match(/database_id\s*=\s*"([^"]+)"/);
  return m ? m[1] : null;
}

/**
 * @param {string} accountId
 * @param {string} databaseId
 * @param {string} token
 * @param {string} sql
 */
async function d1Query(accountId, databaseId, token, sql) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql })
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.success === false) {
    const err = j.errors?.map((e) => e.message).join('; ') || j.error || res.statusText;
    const msg = typeof err === 'string' ? err : JSON.stringify(j);
    const hint =
      /not valid|not authorized|forbidden|10001/i.test(msg)
        ? ' Check CLOUDFLARE_ACCOUNT_ID and use an API token with D1 (Edit). Or set SEED_PASSWORD in .env to use the Worker API instead.'
        : '';
    throw new Error(msg + hint);
  }
  return j;
}

async function unwrapJson(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = body?.error || body?.message || `HTTP ${res.status}`;
    throw new Error(typeof err === 'string' ? err : JSON.stringify(err));
  }
  if (body && body.success === false) {
    throw new Error(body.error || 'Request failed');
  }
  if (body && 'success' in body && body.success === true) {
    return body.data;
  }
  return body;
}

async function login() {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: SEED_EMAIL, password: SEED_PASSWORD })
  });
  const data = await unwrapJson(res);
  if (!data?.token) {
    throw new Error('Login did not return a token');
  }
  return data.token;
}

async function existingTitles(token) {
  const res = await fetch(`${API_URL}/api/articles/all`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await unwrapJson(res);
  const list = data?.news || data?.articles || [];
  return new Set(list.map((r) => String(r.title || '')));
}

async function postArticle(token, row) {
  const payload = {
    title: row.title,
    category: row.category,
    excerpt: row.excerpt || excerpt(row.content),
    content: row.content,
    image: row.image || '',
    author: row.author,
    featured: false,
    requires_subscription: false
  };
  const res = await fetch(`${API_URL}/api/articles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  await unwrapJson(res);
}

async function seedViaApi(articles) {
  if (!SEED_PASSWORD) {
    throw new Error('Set SEED_PASSWORD (Worker STAFF_PASSWORD) for API mode.');
  }
  console.log(`API_URL=${API_URL}`);
  const token = await login();
  console.log('Logged in as', SEED_EMAIL);

  const have = await existingTitles(token);
  let created = 0;
  let skipped = 0;

  for (const row of articles) {
    if (have.has(row.title)) {
      console.log('Skip (exists):', row.title);
      skipped++;
      continue;
    }
    await postArticle(token, row);
    have.add(row.title);
    console.log('Created:', row.title);
    created++;
  }
  console.log(`Done. Created ${created}, skipped ${skipped}.`);
}

async function seedViaD1Rest(articles) {
  const accountId = (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
  const token = (process.env.CLOUDFLARE_API_TOKEN || '').trim();
  const databaseId = (process.env.D1_DATABASE_ID || '').trim() || readD1IdFromWrangler() || '';

  if (!accountId || !token) {
    throw new Error('Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN for D1 HTTP mode.');
  }
  if (!databaseId) {
    throw new Error('Set D1_DATABASE_ID or keep database_id in wrangler.worker.toml.');
  }

  console.log(`D1 direct (account ${accountId.slice(0, 4)}…, db ${databaseId})`);
  let created = 0;
  let skipped = 0;

  for (const a of articles) {
    const t = escSql(a.title);
    const check = await d1Query(
      accountId,
      databaseId,
      token,
      `SELECT id FROM news WHERE title = '${t}' LIMIT 1`
    );
    const r0 = check.result?.[0];
    const rows = r0?.results ?? r0?.result;
    const found = Array.isArray(rows) && rows.length > 0;
    if (found) {
      console.log('Skip (exists):', a.title);
      skipped++;
      continue;
    }
    const id = randomUUID();
    const content = escSql(a.content);
    const author = escSql(a.author);
    const category = escSql(a.category);
    const ex = escSql(excerptFor(a));
    const sql = `INSERT INTO news (id, title, category, excerpt, content, image, author, author_id, featured, requires_subscription, status, published_at, date, created_at, updated_at) VALUES ('${id}', '${t}', '${category}', '${ex}', '${content}', '', '${author}', '', 0, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now'), datetime('now'))`;
    await d1Query(accountId, databaseId, token, sql);
    console.log('Created:', a.title);
    created++;
  }
  console.log(`Done. Created ${created}, skipped ${skipped}.`);
}

async function main() {
  const raw = readFileSync(DATA, 'utf8');
  const articles = JSON.parse(raw);
  if (!Array.isArray(articles) || articles.length !== 15) {
    throw new Error('Expected 15 items in articles-15.json');
  }

  if (SEED_PASSWORD) {
    await seedViaApi(articles);
    return;
  }
  if (process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID) {
    await seedViaD1Rest(articles);
    return;
  }
  throw new Error(
    'No credentials: set SEED_PASSWORD for API mode, or CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN (+ optional D1_DATABASE_ID) for D1 HTTP mode. See .env.example.'
  );
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
