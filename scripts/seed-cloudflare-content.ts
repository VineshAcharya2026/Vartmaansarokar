/**
 * Seeds D1 via the live Worker API: 3 published articles, 3 magazine issues,
 * and 10 image + 10 PDF files in the media library (R2 + media_files) via POST /api/uploads.
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

const EXPECTED_ARTICLES = 3;
const EXPECTED_MAGAZINES = 3;
const EXPECTED_IMAGES = 10;
const EXPECTED_PDFS = 10;

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

type MediaRow = {
  id?: string;
  original_name?: string;
  originalName?: string;
  stored_name?: string;
  storedName?: string;
  url?: string;
  kind?: string;
  mime_type?: string;
  mimeType?: string;
  created_at?: string;
  createdAt?: string;
};

async function unwrap<T>(res: Response): Promise<T> {
  const body = (await res.json()) as Envelope<T>;
  if (!res.ok || !body.success || body.data === null) {
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return body.data;
}

function originalName(m: MediaRow): string {
  return (m.originalName ?? m.original_name ?? '').toString();
}

async function login(): Promise<string> {
  if (!SEED_PASSWORD) {
    throw new Error('Set SEED_PASSWORD to your Worker STAFF_PASSWORD (same password used for staff login).');
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

async function fetchMedia(token: string): Promise<MediaRow[]> {
  const res = await fetch(`${API_URL}/api/media`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await unwrap<{ media: MediaRow[] }>(res);
  return data.media || [];
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

function pickIndexedUrls(
  media: MediaRow[],
  re: RegExp,
  n: string,
  count: number
): string[] {
  const byIdx: (string | undefined)[] = Array(count).fill(undefined);
  for (const m of media) {
    const name = originalName(m);
    const match = name.match(re);
    if (match && m.url) {
      const idx = parseInt(match[1], 10);
      if (idx >= 0 && idx < count) {
        if (byIdx[idx]) {
          throw new Error(`Duplicate ${n} index ${idx} in media library.`);
        }
        byIdx[idx] = m.url;
      }
    }
  }
  if (byIdx.some((u) => !u)) {
    const missing = byIdx
      .map((u, i) => (u ? null : i))
      .filter((x): x is number => x !== null);
    throw new Error(`Missing ${n} at slot(s): ${missing.join(', ')}.`);
  }
  return byIdx as string[];
}

async function main() {
  console.log(`API_URL=${API_URL}`);
  const token = await login();
  console.log('Logged in as', SEED_EMAIL);

  let [articleCount, magCount, media] = await Promise.all([
    countArticles(token),
    countMagazines(token),
    fetchMedia(token)
  ]);

  const seedImageNames = new Set(
    media.map((m) => originalName(m)).filter((n) => /^seed-image-\d{2}\.jpe?g$/i.test(n))
  );
  const seedPdfNames = new Set(
    media.map((m) => originalName(m)).filter((n) => /^seed-pdf-\d{2}\.pdf$/i.test(n))
  );

  if (
    SKIP_IF_EXISTS &&
    articleCount >= EXPECTED_ARTICLES &&
    magCount >= EXPECTED_MAGAZINES &&
    seedImageNames.size >= EXPECTED_IMAGES &&
    seedPdfNames.size >= EXPECTED_PDFS
  ) {
    console.log(
      `Skip: already have ≥${EXPECTED_ARTICLES} articles, ≥${EXPECTED_MAGAZINES} magazines, and seed-named images/PDFs. Set SEED_SKIP_IF_EXISTS=0 to force.`
    );
    return;
  }

  console.log('Uploading seed assets to R2 (missing seed-image-XX / seed-pdf-XX only)…');
  for (let i = 0; i < EXPECTED_IMAGES; i++) {
    const name = `seed-image-${i.toString().padStart(2, '0')}.jpg`;
    if (!seedImageNames.has(name)) {
      const url = await uploadAsset(token, MIN_JPEG, name, 'image/jpeg');
      console.log('Uploaded', name, '→', url);
      await sleep(80);
    }
  }
  for (let i = 0; i < EXPECTED_PDFS; i++) {
    const name = `seed-pdf-${i.toString().padStart(2, '0')}.pdf`;
    if (!seedPdfNames.has(name)) {
      const url = await uploadAsset(token, MIN_PDF, name, 'application/pdf');
      console.log('Uploaded', name, '→', url);
      await sleep(80);
    }
  }

  media = await fetchMedia(token);
  const allImageUrls = pickIndexedUrls(
    media,
    /^seed-image-(\d{2})\.jpe?g$/i,
    'image',
    EXPECTED_IMAGES
  );
  const allPdfUrls = pickIndexedUrls(
    media,
    /^seed-pdf-(\d{2})\.pdf$/i,
    'pdf',
    EXPECTED_PDFS
  );

  const toCreateArticles = Math.max(0, EXPECTED_ARTICLES - articleCount);
  if (toCreateArticles > 0) {
    for (let a = 0; a < toCreateArticles; a++) {
      const v = VARIANTS[a % VARIANTS.length];
      const category = NEWS_CATEGORIES[a % NEWS_CATEGORIES.length];
      const featured = a === 0;
      const requires_subscription = a === 2;
      await createArticle(token, {
        title: `${category}: ${v.titleSuffix}`,
        category,
        excerpt: v.excerpt,
        content: `${v.content}\n\n— Seed content for ${category}.`,
        image: allImageUrls[a % allImageUrls.length],
        author: 'Editorial Desk',
        featured,
        requires_subscription
      });
      console.log(`Article ${a + 1}/${toCreateArticles} created.`);
      await sleep(80);
    }
  } else {
    console.log(`Skipping articles (have ${articleCount}, need ${EXPECTED_ARTICLES} to create more).`);
  }

  const toCreateMags = Math.max(0, EXPECTED_MAGAZINES - magCount);
  if (toCreateMags > 0) {
    const baseDate = new Date();
    for (let i = 0; i < toCreateMags; i++) {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() - i);
      const iso = d.toISOString().split('T')[0];
      await createMagazine(token, {
        title: `Vartmaan Sarokaar — Seed Issue ${i + 1}`,
        issueNumber: `SEED-${iso}`,
        date: iso,
        coverImage: allImageUrls[i % allImageUrls.length],
        pdfUrl: allPdfUrls[i % allPdfUrls.length],
        gatedPage: 2,
        price: 499,
        blurPaywall: true
      });
      await sleep(100);
    }
    console.log(`Created ${toCreateMags} magazine(s).`);
  } else {
    console.log(`Skipping magazines (${magCount} already).`);
  }

  console.log('Done. Public site should list PUBLISHED articles and magazines after cache/CDN refresh.');
}

main().catch((e) => {
  console.error('Seed failed:', e instanceof Error ? e.message : e);
  process.exit(1);
});
