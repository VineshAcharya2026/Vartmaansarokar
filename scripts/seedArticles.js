/**
 * Seed 15 published articles (5 categories × 3) into D1 `news` table.
 * No hardcoded API keys — uses your Wrangler/Cloudflare auth (see wrangler whoami).
 *
 * Usage (from project root, after npm install):
 *   node ./scripts/seedArticles.js
 *
 * Remote (default): writes to the bound D1 on Cloudflare.
 * Local:    D1_LOCAL=1 node ./scripts/seedArticles.js
 *
 * Prereq: `wrangler login` and access to the database in wrangler.worker.toml
 */

import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');
const WRANGLER_CONFIG = path.join(PROJECT_ROOT, 'wrangler.worker.toml');
const DATA_PATH = path.join(__dirname, 'seed-data', 'articles-15.json');
const DB_NAME = 'vartmaansarokar-db';

/**
 * @typedef {{ title: string; content: string; author: string; category: string; excerpt?: string }} ArticleRow
 */

function escSql(s) {
  return String(s ?? '').replace(/'/g, "''");
}

/**
 * @param {ArticleRow} a
 */
function excerptFor(a) {
  if (a.excerpt) return a.excerpt;
  const t = a.content.replace(/\s+/g, ' ').trim();
  return t.length > 200 ? t.slice(0, 197) + '...' : t;
}

/**
 * @param {ArticleRow[]} articles
 */
function buildSql(articles) {
  const lines = [
    'BEGIN TRANSACTION;',
    ...articles.map((a) => {
      const id = randomUUID();
      const title = escSql(a.title);
      const content = escSql(a.content);
      const author = escSql(a.author);
      const category = escSql(a.category);
      const excerpt = escSql(excerptFor(a));
      return `INSERT INTO news (id, title, category, excerpt, content, image, author, author_id, featured, requires_subscription, status, published_at, date, created_at, updated_at)
SELECT '${id}', '${title}', '${category}', '${excerpt}', '${content}', '', '${author}', '', 0, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM news WHERE title = '${title}');`;
    }),
    'COMMIT;'
  ];
  return lines.join('\n');
}

async function main() {
  const raw = readFileSync(DATA_PATH, 'utf8');
  /** @type {ArticleRow[]} */
  const articles = JSON.parse(raw);
  if (!Array.isArray(articles) || articles.length !== 15) {
    throw new Error('Expected 15 articles in articles-15.json');
  }
  const sql = buildSql(articles);
  const tmp = path.join(__dirname, '.seed-articles-temp.sql');
  writeFileSync(tmp, sql, 'utf8');

  const isLocal = process.env.D1_LOCAL === '1' || process.env.D1_LOCAL === 'true';
  const args = [
    'd1',
    'execute',
    DB_NAME,
    ...(isLocal ? ['--local'] : ['--remote']),
    '--file',
    tmp,
    '-c',
    WRANGLER_CONFIG
  ];

  const wranglerBin = path.join(PROJECT_ROOT, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
  try {
    await execFileAsync(process.execPath, [wranglerBin, ...args], {
      cwd: PROJECT_ROOT,
      env: { ...process.env }
    });
  } finally {
    try {
      unlinkSync(tmp);
    } catch {
      /* ignore */
    }
  }
  // eslint-disable-next-line no-console
  console.log(
    isLocal
      ? 'Seed complete (local D1).'
      : 'Seed complete (remote D1). Re-fetch GET /api/articles to see published items.'
  );
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
