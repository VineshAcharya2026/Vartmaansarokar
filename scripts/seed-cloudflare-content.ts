/**
 * Seeds D1 via the live Worker API: 3 published articles per NEWS_CATEGORIES category,
 * plus 3 magazine issues. Uploads a tiny JPEG + minimal PDF to R2 through POST /api/uploads.
 *
 * Usage (PowerShell):
 *   $env:API_URL="https://api.vartmaansarokaar.com"
 *   $env:SEED_EMAIL="superadmin@vartmaansarokar.com"
 *   $env:SEED_PASSWORD="<your STAFF_PASSWORD secret>"
 *   npx tsx ./scripts/seed-cloudflare-content.ts
 *
 * Optional: SEED_SKIP_IF_EXISTS=0 to force creating even when counts look complete.
 */

import { NEWS_CATEGORIES } from '../constants.js';

const API_URL = (process.env.API_URL || 'https://api.vartmaansarokaar.com').replace(/\/$/, '');
const SEED_EMAIL = process.env.SEED_EMAIL || 'superadmin@vartmaansarokar.com';
const SEED_PASSWORD = process.env.SEED_PASSWORD || '';
const SKIP_IF_EXISTS = process.env.SEED_SKIP_IF_EXISTS !== '0';

/** 1×1 JPEG */
const MIN_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=',
  'base64'
);

/** Minimal valid PDF (tiny blank page). */
const MIN_PDF = Buffer.from(
  `%PDF-1.1
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 200 200]>>endobj
xref
0 4
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000102 00000 n 
trailer<</Size 4/Root 1 0 R>>
startxref
149
%%EOF`,
  'utf8'
);

const VARIANTS = [
  {
    titleSuffix: 'Policy Shift Signals New Momentum',
    excerpt: 'A major update is reshaping the conversation with clear public impact.',
    content:
      'A detailed development is gaining momentum. Analysts say the decision reflects a shift in priorities and could influence governance and public sentiment over the next few quarters.'
  },
  {
    titleSuffix: 'Stakeholders Push for Faster Action',
    excerpt: 'Industry leaders and civic voices are calling for transparent, measurable implementation.',
    content:
      'The latest discussions have brought sharper focus to timelines and accountability. Strong outcomes will come from coordination between agencies, operators, and citizens.'
  },
  {
    titleSuffix: 'Ground Reports Reveal Changing Priorities',
    excerpt: 'Field-level updates show how the issue is affecting communities and institutions.',
    content:
      'On-the-ground reporting highlights how developments are felt beyond official statements. Local responses suggest both optimism and caution as implementation begins.'
  }
] as const;

type Envelope<T> = { success: boolean; data: T | null; error: string | null };

async function unwrap<T>(res: Response): Promise<T> {
  const body = (await res.json()) as Envelope<T>;
  if (!res.ok || !body.success || body.data === null) {
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return body.data;
}

async function login(): Promise<string> {
  if (!SEED_PASSWORD) {
    throw new Error('Set SEED_PASSWORD to your Worker STAFF_PASSWORD (same password used for staff quick login).');
  }
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: SEED_EMAIL.trim().toLowerCase(), password: SEED_PASSWORD })
  });
  const data = await unwrap<{ token: string; user: unknown }>(res);
  return data.token;
}

async function uploadAsset(token: string, bytes: Buffer, filename: string, mime: string): Promise<string> {
  const blob = new Blob([bytes], { type: mime });
  const form = new FormData();
  form.append('file', blob, filename);
  const res = await fetch(`${API_URL}/api/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  const data = await unwrap<{ url: string }>(res);
  return data.url;
}

async function countArticles(token: string): Promise<number> {
  const res = await fetch(`${API_URL}/api/articles/all`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await unwrap<{ news: unknown[] }>(res);
  return data.news?.length ?? 0;
}

async function countMagazines(token: string): Promise<number> {
  const res = await fetch(`${API_URL}/api/magazines/all`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await unwrap<{ magazines: unknown[] }>(res);
  return data.magazines?.length ?? 0;
}

async function createArticle(
  token: string,
  payload: {
    title: string;
    category: string;
    excerpt: string;
    content: string;
    image: string;
    author: string;
    featured: boolean;
    requires_subscription: boolean;
  }
): Promise<void> {
  const res = await fetch(`${API_URL}/api/articles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  await unwrap<{ id: string }>(res);
}

async function createMagazine(
  token: string,
  payload: {
    title: string;
    issueNumber: string;
    date: string;
    coverImage: string;
    pdfUrl: string;
    gatedPage: number;
    price: number;
    blurPaywall: boolean;
  }
): Promise<void> {
  const res = await fetch(`${API_URL}/api/magazines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  await unwrap<{ id: string }>(res);
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`API_URL=${API_URL}`);
  const token = await login();
  console.log('Logged in as', SEED_EMAIL);

  const expectedArticles = NEWS_CATEGORIES.length * VARIANTS.length;
  const [articleCount, magCount] = await Promise.all([countArticles(token), countMagazines(token)]);

  if (SKIP_IF_EXISTS && articleCount >= expectedArticles && magCount >= 3) {
    console.log(`Skip: already have ${articleCount} articles and ${magCount} magazines. Set SEED_SKIP_IF_EXISTS=0 to force.`);
    return;
  }

  console.log('Uploading seed assets to R2…');
  const imageUrl = await uploadAsset(token, MIN_JPEG, 'seed-article-cover.jpg', 'image/jpeg');
  const pdfUrl = await uploadAsset(token, MIN_PDF, 'seed-magazine.pdf', 'application/pdf');
  console.log('Image URL:', imageUrl);
  console.log('PDF URL:', pdfUrl);

  if (!SKIP_IF_EXISTS || articleCount < expectedArticles) {
    let created = 0;
    for (let ci = 0; ci < NEWS_CATEGORIES.length; ci++) {
      const category = NEWS_CATEGORIES[ci];
      for (let vi = 0; vi < VARIANTS.length; vi++) {
        const v = VARIANTS[vi];
        const featured = ci < 2 && vi === 0;
        const requires_subscription = vi === 2;
        await createArticle(token, {
          title: `${category}: ${v.titleSuffix}`,
          category,
          excerpt: v.excerpt,
          content: `${v.content}\n\n— Seed content for ${category}.`,
          image: imageUrl,
          author: 'Editorial Desk',
          featured,
          requires_subscription
        });
        created++;
        if (created % 5 === 0) console.log(`Articles: ${created}/${expectedArticles}`);
        await sleep(80);
      }
    }
    console.log(`Created ${created} articles.`);
  } else {
    console.log(`Skipping articles (${articleCount} >= ${expectedArticles}).`);
  }

  if (!SKIP_IF_EXISTS || magCount < 3) {
    const baseDate = new Date();
    for (let i = 0; i < 3; i++) {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() - i);
      const iso = d.toISOString().split('T')[0];
      await createMagazine(token, {
        title: `Vartmaan Sarokaar — Seed Issue ${i + 1}`,
        issueNumber: `SEED-${iso}`,
        date: iso,
        coverImage: imageUrl,
        pdfUrl,
        gatedPage: 2,
        price: 499,
        blurPaywall: true
      });
      await sleep(100);
    }
    console.log('Created 3 magazines.');
  } else {
    console.log(`Skipping magazines (${magCount} >= 3).`);
  }

  console.log('Done. Public site should list PUBLISHED articles and magazines after cache/CDN refresh.');
}

main().catch((e) => {
  console.error('Seed failed:', e instanceof Error ? e.message : e);
  process.exit(1);
});
