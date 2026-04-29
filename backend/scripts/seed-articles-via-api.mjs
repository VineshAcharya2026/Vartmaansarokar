/**
 * Seed 15 articles via the local API.
 * Skips any row whose title already exists in /api/articles/all.
 *
 * Env (e.g. in .env, never commit secrets):
 *   API_URL=http://localhost:5174
 *   SEED_EMAIL=superadmin@vartmaansarokar.com
 *   SEED_PASSWORD=<staff password>
 *
 *   node --env-file=.env ./scripts/seed-articles-via-api.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
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

const API_URL = (process.env.API_URL || 'http://localhost:5174').replace(/\/$/, '');
const SEED_EMAIL = (process.env.SEED_EMAIL || 'superadmin@vartmaansarokar.com').trim().toLowerCase();
const SEED_PASSWORD = process.env.SEED_PASSWORD || '';

function excerpt(s) {
  const t = String(s).replace(/\s+/g, ' ').trim();
  return t.length > 220 ? t.slice(0, 217) + '...' : t;
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
    throw new Error('Set SEED_PASSWORD for API mode.');
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
  throw new Error('Set SEED_PASSWORD in .env to seed through the local API.');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
