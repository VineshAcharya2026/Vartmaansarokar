import { Hono } from 'hono';
import { verify, sign } from 'hono/jwt';
import * as bcrypt from 'bcryptjs';
import { ok, fail } from './api-contract';
import { clientKey, rateLimitAllow } from './worker-rate-limit';

export interface Env {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  AI: any;
  JWT_SECRET: string;
  GOOGLE_CLIENT_ID?: string;
  STAFF_PASSWORD?: string;
  ALLOWED_ORIGINS: string;
  MAIL_API_KEY?: string;
  MAIL_FROM?: string;
}

const app = new Hono<{ Bindings: Env; Variables: { user: any } }>();

const ADMIN_EMAILS = [
  'vineshjm@gmail.com',
  'admin@vartmaansarokar.com',
  'superadmin@vartmaansarokar.com'
];

const isAdminEmail = (email: string) => ADMIN_EMAILS.includes(email.toLowerCase());

function splitOrigins(value: string | undefined): string[] {
  return (value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// CORS — strict allowlist from ALLOWED_ORIGINS only (configure dev origins in wrangler dev / .dev.vars)
app.use('*', async (c, next) => {
  const origin = c.req.header('Origin') || '';
  const allowed = new Set(splitOrigins(c.env.ALLOWED_ORIGINS));
  if (origin && !allowed.has(origin)) {
    return c.text('Forbidden', 403);
  }
  if (origin && allowed.has(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
  }
  c.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,X-Requested-With');
  c.header('Access-Control-Allow-Credentials', 'true');

  if (c.req.method === 'OPTIONS') {
    return c.text('', 204);
  }
  await next();
});

// AUTH MIDDLEWARE — JWT carries only { userId, exp }; user row loaded from D1
const auth = async (c: any, next: any) => {
  const header = c.req.header('Authorization') || '';
  if (!header.startsWith('Bearer ')) {
    return fail(c, 'Unauthorized', 401);
  }
  try {
    const token = header.slice(7);
    const secret = c.env.JWT_SECRET;
    if (!secret) {
      console.error('CRITICAL: JWT_SECRET is missing from environment.');
      return fail(c, 'JWT_SECRET missing', 500);
    }
    const payload = (await verify(token, secret, 'HS256')) as { userId?: string };
    if (!payload?.userId) {
      return fail(c, 'Invalid token', 401);
    }
    const { results } = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.userId).all();
    const row = results?.[0] as any;
    if (!row) {
      return fail(c, 'User not found', 401);
    }
    c.set('user', row);
    await next();
  } catch (e: any) {
    console.error('JWT Verification failed:', e.message);
    return fail(c, 'Invalid token', 401);
  }
};

const role = (...roles: string[]) => async (c: any, next: any) => {
  const u = c.get('user') as { role?: string } | undefined;
  if (!u || !roles.includes(String(u.role))) {
    return fail(c, 'Forbidden', 403);
  }
  await next();
};

const generateId = () => crypto.randomUUID();

app.onError((err, c) => {
  console.error(err);
  return fail(c, err instanceof Error ? err.message : 'Internal error', 500);
});

// --- HEALTH ---
app.get('/api/health', async (c) => {
  try {
    await c.env.DB.prepare('SELECT 1').first();
    return ok(c, { db: 'connected', time: new Date().toISOString() });
  } catch (e: any) {
    return fail(c, e?.message || 'Database unavailable', 503);
  }
});

// --- TRANSLATE ---
app.post('/api/translate', async (c) => {
  const body = await c.req.json();
  const result = await c.env.AI.run('@cf/meta/m2m100-1.2b', {
    text: body.text,
    source_lang: 'english',
    target_lang: body.targetLang
  });
  return ok(c, { translated: result.translated_text });
});

app.post('/api/translate/batch', async (c) => {
  const { texts, targetLang } = await c.req.json();
  if (!texts || !Array.isArray(texts)) return fail(c, 'Texts array required', 400);

  const translations: Record<string, string> = {};

  try {
    const results = await Promise.all(
      texts.map(async (text) => {
        try {
          const res = await c.env.AI.run('@cf/meta/m2m100-1.2b', {
            text,
            source_lang: 'english',
            target_lang: targetLang.toLowerCase()
          });
          return { original: text, translated: res.translated_text };
        } catch {
          return { original: text, translated: text };
        }
      })
    );

    results.forEach((r) => {
      translations[r.original] = r.translated;
    });

    return ok(c, { translations });
  } catch (err: any) {
    return fail(c, err.message || 'Batch translation failed', 500);
  }
});

// --- AUTH ---
const handleLogin = async (c: any) => {
  try {
    if (!rateLimitAllow(`login:${clientKey(c)}`, 30, 60_000)) {
      return fail(c, 'Too many login attempts', 429);
    }
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return fail(c, 'Email and password are required', 400);
    }

    const { results } = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).all();

    if (!results || results.length === 0) {
      return fail(c, 'Invalid email or password', 401);
    }

    const user = results[0] as any;
    const passwordHash = user.password_hash || '';

    const isMasterPassword = c.env.STAFF_PASSWORD && password === c.env.STAFF_PASSWORD;
    const isDbPassword = passwordHash ? await bcrypt.compare(password, passwordHash) : false;

    if (!isDbPassword && !isMasterPassword) {
      if (!passwordHash && !c.env.STAFF_PASSWORD) {
        return fail(c, 'System configuration error: no valid password source', 401);
      }
      return fail(c, 'Incorrect email or password', 401);
    }

    let userRole = user.role;
    if (isAdminEmail(user.email) && userRole === 'READER') {
      userRole = 'SUPER_ADMIN';
      await c.env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind(userRole, user.id).run();
    }

    if (userRole === 'READER' && user.is_verified === 0) {
      return fail(c, 'Account not verified. Please check your email.', 403);
    }

    if (!c.env.JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET is missing from environment.');
      return fail(c, 'Security token missing', 500);
    }

    const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
    const token = await sign({ userId: user.id, exp }, c.env.JWT_SECRET, 'HS256');

    return ok(c, {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: userRole,
        name: user.name,
        subscription_status: user.subscription_status,
        subscription_plan: user.subscription_plan,
        is_verified: user.is_verified ?? 1
      }
    });
  } catch (err: any) {
    console.error('Login error detail:', err.message);
    return fail(c, 'Login failed', 401);
  }
};

// --- GOOGLE AUTH ---
const handleGoogleLogin = async (c: any) => {
  try {
    const { credential } = await c.req.json();
    if (!credential) return fail(c, 'Missing credential', 400);

    const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    const payload = await resp.json() as any;

    if (!payload.email) {
      return fail(c, 'Invalid Google token', 401);
    }

    const { results } = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(payload.email).all();
    let user = results?.[0] as any;

    if (!user) {
      const id = generateId();
      const role = isAdminEmail(payload.email) ? 'SUPER_ADMIN' : 'READER';
      await c.env.DB.prepare('INSERT INTO users (id, email, name, role, google_id, is_verified) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id, payload.email, payload.name || '', role, payload.sub, 1)
        .run();
      const fresh = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).all();
      user = fresh.results?.[0];
    } else if (isAdminEmail(user.email) && user.role === 'READER') {
      await c.env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind('SUPER_ADMIN', user.id).run();
      user.role = 'SUPER_ADMIN';
    }

    const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
    const token = await sign({ userId: user.id, exp }, c.env.JWT_SECRET, 'HS256');

    return ok(c, {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        subscription_status: user.subscription_status,
        subscription_plan: user.subscription_plan
      }
    });
  } catch (err: any) {
    return fail(c, 'Google authentication failed', 401);
  }
};

// --- READER REGISTRATION & VERIFICATION ---
const handleRegisterReader = async (c: any) => {
  try {
    const { email, password, name } = await c.req.json();
    if (!email || !password) return fail(c, 'Email and password required', 400);

    const { results } = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).all();
    if (results && results.length > 0) return fail(c, 'Email already registered', 409);

    const id = generateId();
    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = generateId().replace(/-/g, '').slice(0, 32);

    await c.env.DB.prepare('INSERT INTO users (id, email, password_hash, name, role, is_verified, verification_token) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id, email, passwordHash, name || '', 'READER', 0, verificationToken)
      .run();

    const verifyLink = `https://vartmaansarokaar.com/#/verify?token=${verificationToken}`;
    console.log(`Verification link for ${email}: ${verifyLink}`);

    return ok(c, { message: 'Registration successful. Please verify your email.' });
  } catch (err: any) {
    return fail(c, 'Registration failed', 500);
  }
};

const handleVerifyEmail = async (c: any) => {
  try {
    const { token } = await c.req.json();
    if (!token) return fail(c, 'Token is required', 400);

    const { results } = await c.env.DB.prepare('SELECT id FROM users WHERE verification_token = ?').bind(token).all();
    if (!results || results.length === 0) return fail(c, 'Invalid or expired token', 400);

    const user = results[0] as any;
    await c.env.DB.prepare("UPDATE users SET is_verified = 1, verification_token = NULL, subscription_status = 'ACTIVE' WHERE id = ?")
      .bind(user.id)
      .run();

    return ok(c, { message: 'Email verified and digital access granted.' });
  } catch (err: any) {
    return fail(c, 'Verification failed', 500);
  }
};

app.post('/api/auth/login', handleLogin);
app.post('/api/auth/staff/login', handleLogin);
app.post('/api/auth/google', handleGoogleLogin);
app.post('/api/auth/register', handleRegisterReader);
app.post('/api/auth/verify-email', handleVerifyEmail);

// --- QUICK LOGIN (for subscribers/readers - passwordless) ---
app.post('/api/auth/users/login', async (c) => {
  try {
    if (!rateLimitAllow(`quicklogin:${clientKey(c)}`, 20, 60_000)) {
      return fail(c, 'Too many requests', 429);
    }
    const { email } = await c.req.json();
    if (!email) {
      return fail(c, 'Email is required', 400);
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const { results } = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(normalizedEmail).all();

    let user = results?.[0] as any;

    if (!user) {
      const id = generateId();
      await c.env.DB.prepare('INSERT INTO users (id, email, name, role, password_hash, is_verified) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id, normalizedEmail, normalizedEmail.split('@')[0], 'READER', await bcrypt.hash(crypto.randomUUID(), 10), 1)
        .run();
      const fresh = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).all();
      user = fresh.results?.[0];
    }

    if (!user) {
      return fail(c, 'Unable to create user', 500);
    }

    const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
    const token = await sign({ userId: user.id, exp }, c.env.JWT_SECRET, 'HS256');

    return ok(c, {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        subscription_status: user.subscription_status,
        subscription_plan: user.subscription_plan,
        is_verified: user.is_verified ?? 1
      }
    });
  } catch (err: any) {
    return fail(c, 'Quick login failed', 500);
  }
});

app.get('/api/auth/me', auth, async (c) => {
  const u = c.get('user') as { id: string };
  const { results } = await c.env.DB.prepare('SELECT id, email, name, role, phone, address, subscription_plan, subscription_status, payment_verified, created_at FROM users WHERE id = ?').bind(u.id).all();
  const user = results[0] as any;
  if (!user) return fail(c, 'User not found', 404);
  return ok(c, { user });
});

app.post('/api/auth/logout', async (c) => ok(c, {}));

// --- NEWS ---
app.get('/api/news', async (c) => {
  try {
    const { results } = await c.env.DB.prepare("SELECT * FROM news WHERE status='PUBLISHED' ORDER BY published_at DESC LIMIT 50").all();
    return ok(c, { news: results || [] });
  } catch (e: any) {
    return fail(c, e.message, 500);
  }
});

app.get('/api/news/all', auth, async (c) => {
  const user = c.get('user');
  let q = '';
  if (user.role === 'EDITOR') q = 'SELECT * FROM news WHERE author_id = ? ORDER BY created_at DESC';
  else if (user.role === 'ADMIN') q = "SELECT * FROM news WHERE status IN ('PENDING_REVIEW','PUBLISHED','REJECTED','DRAFT','REWORK') ORDER BY created_at DESC";
  else if (user.role === 'SUPER_ADMIN') q = 'SELECT * FROM news ORDER BY created_at DESC';
  else return fail(c, 'Forbidden', 403);
  
  const { results } = user.role === 'EDITOR' 
    ? await c.env.DB.prepare(q).bind(user.id).all()
    : await c.env.DB.prepare(q).all();
    
  return ok(c, { news: results || [] });
});

app.get('/api/news/pending', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  // Check for both PENDING and PENDING_REVIEW for robustness
  const { results } = await c.env.DB.prepare("SELECT * FROM news WHERE status IN ('PENDING_REVIEW', 'PENDING') ORDER BY created_at DESC").all();
  return ok(c, { news: results || [] });
});

app.post('/api/news/:id/translate', auth, async (c) => {
  try {
    const { id } = c.req.param();
    const { targetLang } = await c.req.json();
    if (!targetLang) return fail(c, 'Target language required', 400);

    const { results } = await c.env.DB.prepare('SELECT * FROM news WHERE id = ?').bind(id).all();
    if (!results || !results[0]) return fail(c, 'Article not found', 404);
    
    const article = results[0] as any;
    const fieldsToTranslate = ['title', 'excerpt', 'content', 'author', 'category'];
    const translated: any = { ...article };

    for (const field of fieldsToTranslate) {
      if (article[field] && typeof article[field] === 'string') {
        try {
          const result = await c.env.AI.run('@cf/meta/m2m100-1.2b', {
            text: article[field],
            source_lang: 'english',
            target_lang: targetLang.toLowerCase()
          });
          if (result && result.translated_text) {
            translated[field] = result.translated_text;
          }
        } catch (e) {
          console.error(`Field ${field} translation failed`, e);
        }
      }
    }

    return ok(c, { translated });
  } catch (err: any) {
    return fail(c, err.message || 'Translation failed', 500);
  }
});

app.get('/api/news/:id', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM news WHERE id = ?').bind(c.req.param('id')).all();
  if (!results || !results[0]) return fail(c, 'Article not found', 404);
  const article = results[0] as any;

  if (article.status !== 'PUBLISHED') {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) return fail(c, 'Article not published', 403);
    try {
      const token = authHeader.replace('Bearer ', '');
      const payload = (await verify(token, c.env.JWT_SECRET, 'HS256')) as { userId?: string };
      if (!payload?.userId) return fail(c, 'Article not published', 403);
      const row = await c.env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(payload.userId).first<{ role: string }>();
      if (!row || !['EDITOR', 'ADMIN', 'SUPER_ADMIN'].includes(row.role)) {
        return fail(c, 'Article not published', 403);
      }
    } catch {
      return fail(c, 'Article not published', 403);
    }
  }

  return ok(c, { article });
});

app.post('/api/news', auth, role('EDITOR', 'ADMIN', 'SUPER_ADMIN'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const id = generateId();
  
  // FORCE status based on role, ignore body.status from request
  let status = 'PENDING_REVIEW';
  let published_at = '';
  
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    status = 'PUBLISHED';
    published_at = new Date().toISOString();
  }

  await c.env.DB.prepare(`INSERT INTO news (id, title, category, excerpt, content, image, author, author_id, featured, requires_subscription, status, published_at, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'))`).bind(
    id, body.title, body.category || 'General', body.excerpt || '', body.content || '', body.image || '', body.author || user.name, user.id, body.featured ? 1 : 0, body.requires_subscription ? 1 : 0, status, published_at
  ).run();

  return ok(c, { article: { id, status } });
});

app.put('/api/news/:id', auth, role('EDITOR', 'ADMIN', 'SUPER_ADMIN'), async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    const body = await c.req.json();

    delete body.status;

    const { results } = await c.env.DB.prepare('SELECT * FROM news WHERE id = ?').bind(id).all();
    if (!results || !results[0]) return fail(c, 'Article not found', 404);

    const article = results[0] as any;

    if (user.role === 'EDITOR' && article.author_id !== user.id) {
      return fail(c, 'You can only edit your own articles', 403);
    }

    let newStatus = article.status;
    if (user.role === 'EDITOR') {
      newStatus = 'PENDING_REVIEW';
    } else if (['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      newStatus = 'PUBLISHED';
    }

    await c.env.DB.prepare(`
      UPDATE news SET 
      title=?, category=?, excerpt=?, content=?, image=?, 
      featured=?, requires_subscription=?, status=?, updated_at=datetime('now') 
      WHERE id=?
    `).bind(
      body.title || article.title || '',
      body.category || article.category || 'General',
      body.excerpt || article.excerpt || '',
      body.content || article.content || '',
      body.image || article.image || '',
      body.featured !== undefined ? (body.featured ? 1 : 0) : (article.featured || 0),
      body.requires_subscription !== undefined ? (body.requires_subscription ? 1 : 0) : (article.requires_subscription || 0),
      newStatus,
      id
    ).run();

    return ok(c, { message: 'Updated successfully', status: newStatus });
  } catch (err: any) {
    return fail(c, err.message || 'Server error', 500);
  }
});

// --- NEWS / ARTICLES ---
app.get('/api/articles', async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM news WHERE status='PUBLISHED' ORDER BY created_at DESC").all();
  return ok(c, { news: results || [] });
});

app.get('/api/articles/all', auth, role('ADMIN', 'SUPER_ADMIN', 'EDITOR'), async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM news ORDER BY created_at DESC").all();
  return ok(c, { news: results || [] });
});

app.get('/api/articles/pending', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM news WHERE status='PENDING_REVIEW' ORDER BY created_at DESC").all();
  return ok(c, { news: results || [] });
});

app.get('/api/articles/:id', async (c) => {
  const id = c.req.param('id');
  const { results } = await c.env.DB.prepare("SELECT * FROM news WHERE id = ?").bind(id).all();
  if (!results || !results[0]) return fail(c, 'Article not found', 404);
  return ok(c, { article: results[0] });
});

app.post('/api/articles', auth, async (c) => {
  const user = c.get('user');
  const data = await c.req.json();
  const id = generateId();
  const createdAt = new Date().toISOString();
  
  // Status logic: Admin/Editor creates published? No, let's keep it safe.
  // USER_REQUEST Task: EDITOR → PENDING, ADMIN → PUBLISH
  const status = (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') ? 'PUBLISHED' : 'PENDING_REVIEW';

  await c.env.DB.prepare(`
    INSERT INTO news (id, title, content, excerpt, category, author, status, image, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, data.title, data.content, data.excerpt || '', data.category, data.author || user.name, status, data.image || '', createdAt, createdAt).run();

  return ok(c, { id });
});

app.put('/api/articles/:id', auth, async (c) => {
  const id = c.req.param('id');
  const data = await c.req.json();
  const updatedAt = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE news 
    SET title = ?, content = ?, excerpt = ?, category = ?, author = ?, image = ?, updated_at = ?
    WHERE id = ?
  `).bind(data.title, data.content, data.excerpt, data.category, data.author, data.image, updatedAt, id).run();

  return ok(c, {});
});

app.delete('/api/articles/:id', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare("DELETE FROM news WHERE id = ?").bind(id).run();
  return ok(c, {});
});

const handleApprove = async (c: any) => {
  try {
    const id = c.req.param('id');
    const result = await c.env.DB.prepare("UPDATE news SET status='PUBLISHED' WHERE id=?").bind(id).run();
    const changes = result.meta?.changes ?? (result as any).changes ?? 0;
    if (changes === 0 && !result.success) return fail(c, 'Approve failed', 400);
    return ok(c, { message: 'Approved' });
  } catch (err: any) {
    return fail(c, err.message, 500);
  }
};

const handleReject = async (c: any) => {
  try {
    const { reason } = await c.req.json().catch(() => ({ reason: '' }));
    const id = c.req.param('id');
    const result = await c.env.DB.prepare("UPDATE news SET status='REJECTED', rejection_reason=? WHERE id=?").bind(reason || 'No reason provided', id).run();
    const changes = result.meta?.changes ?? (result as any).changes ?? 0;
    if (changes === 0 && !result.success) return fail(c, 'Reject failed', 400);
    return ok(c, { message: 'Rejected' });
  } catch (err: any) {
    return fail(c, err.message, 500);
  }
};

const handleRework = async (c: any) => {
  try {
    const { reason } = await c.req.json().catch(() => ({ reason: '' }));
    const id = c.req.param('id');
    const result = await c.env.DB.prepare("UPDATE news SET status='DRAFT', rejection_reason=? WHERE id=?").bind(reason || 'Rework requested', id).run();
    const changes = result.meta?.changes ?? (result as any).changes ?? 0;
    if (changes === 0 && !result.success) return fail(c, 'Rework failed', 400);
    return ok(c, { message: 'Sent for rework' });
  } catch (err: any) {
    return fail(c, err.message, 500);
  }
};

app.post('/api/articles/:id/approve', auth, role('ADMIN', 'SUPER_ADMIN'), handleApprove);
app.post('/api/articles/:id/reject', auth, role('ADMIN', 'SUPER_ADMIN'), handleReject);
app.post('/api/articles/:id/rework', auth, role('ADMIN', 'SUPER_ADMIN'), handleRework);

// --- MAGAZINES ---
app.get('/api/magazines', async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM magazines WHERE status='PUBLISHED' ORDER BY created_at DESC").all();
  return ok(c, { magazines: results || [] });
});

app.get('/api/magazines/all', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM magazines ORDER BY created_at DESC").all();
  return ok(c, { magazines: results || [] });
});

app.post('/api/magazines', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const data = await c.req.json();
  const id = generateId();
  // Accept both camelCase (frontend) and snake_case field names
  const title = data.title;
  const issueNumber = data.issueNumber || data.issue_number || '';
  const date = data.date || '';
  const coverImage = data.coverImage || data.cover_image || '';
  const pdfUrl = data.pdfUrl || data.pdf_url || '';
  const gatedPage = data.gatedPage ?? data.gated_page ?? 0;
  const price = data.price ?? 0;
  const blurPaywall = data.blurPaywall ?? data.blur_paywall ?? false;

  await c.env.DB.prepare(`
    INSERT INTO magazines (id, title, issue_number, date, cover_image, pdf_url, gated_page, price_physical, blur_paywall, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED')
  `).bind(id, title, issueNumber, date, coverImage, pdfUrl, gatedPage, price, blurPaywall ? 1 : 0).run();
  return ok(c, { id });
});

app.delete('/api/magazines/:id', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  await c.env.DB.prepare("DELETE FROM magazines WHERE id = ?").bind(c.req.param('id')).run();
  return ok(c, {});
});

// --- MEDIA ---
app.get('/api/media', auth, async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM media_files ORDER BY created_at DESC").all();
  return ok(c, { media: results || [] });
});

const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
const UPLOAD_MIMES = new Set(['image/jpeg', 'image/png', 'application/pdf']);

function extForMime(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'application/pdf') return 'pdf';
  return 'bin';
}

const handleMediaUpload = async (c: any) => {
  if (!rateLimitAllow(`upload:${clientKey(c)}`, 40, 60_000)) {
    return fail(c, 'Too many uploads', 429);
  }
  const user = c.get('user') as { id: string };
  const form = await c.req.formData();
  const file = form.get('file') as File | null;
  if (!file || typeof (file as any).stream !== 'function') return fail(c, 'No file', 400);
  const mimeType = (file as File).type || '';
  if (!UPLOAD_MIMES.has(mimeType)) {
    return fail(c, 'Invalid file type. Allowed: JPEG, PNG, PDF', 400);
  }
  const size = (file as File).size || 0;
  if (size <= 0 || size > UPLOAD_MAX_BYTES) {
    return fail(c, 'File must be between 1 byte and 5MB', 400);
  }
  const id = generateId();
  const r2Key = `${user.id}/${Date.now()}-${id}.${extForMime(mimeType)}`;
  await c.env.MEDIA_BUCKET.put(r2Key, (file as File).stream());
  const url = `/api/media/raw?k=${encodeURIComponent(r2Key)}`;
  const createdAt = new Date().toISOString();
  await c.env.DB.prepare("INSERT INTO media_files (id, original_name, stored_name, url, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(id, (file as File).name || 'upload', r2Key, url, createdAt).run();
  return ok(c, {
    url,
    key: r2Key,
    media: {
      id,
      originalName: (file as File).name,
      storedName: r2Key,
      url,
      kind: mimeType === 'application/pdf' ? 'pdf' : 'image',
      mimeType,
      size,
      createdAt
    }
  });
};

app.post('/api/uploads', auth, handleMediaUpload);

app.get('/api/media/raw', async (c) => {
  const key = c.req.query('k');
  if (!key) return fail(c, 'Missing key', 400);
  const obj = await c.env.MEDIA_BUCKET.get(key);
  if (!obj) return fail(c, 'Not found', 404);
  return new Response(obj.body, { headers: { 'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream' } });
});

app.delete('/api/media/:id', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const id = c.req.param('id');
  const { results } = await c.env.DB.prepare('SELECT * FROM media_files WHERE id = ?').bind(id).all();
  const row = results?.[0] as { stored_name?: string } | undefined;
  if (!row) return fail(c, 'Not found', 404);
  const key = row.stored_name;
  if (key) {
    try {
      await c.env.MEDIA_BUCKET.delete(key);
    } catch {
      /* ignore missing object */
    }
  }
  await c.env.DB.prepare('DELETE FROM media_files WHERE id = ?').bind(id).run();
  return ok(c, { deletedId: id });
});

// --- SUBSCRIPTIONS (public + multipart / JSON) ---
app.post('/api/subscriptions', async (c) => {
  try {
    const ct = c.req.header('content-type') || '';
    let name = '';
    let email = '';
    let phone = '';
    let plan = 'DIGITAL';
    let address = '';
    let screenshotUrl = '';

    if (ct.includes('multipart/form-data')) {
      const form = await c.req.formData();
      name = String(form.get('name') ?? '');
      email = String(form.get('email') ?? '');
      phone = String(form.get('phone') ?? '');
      plan = String(form.get('plan') ?? 'DIGITAL').toUpperCase();
      address = String(form.get('address') ?? '');
      const file = form.get('file');
      if (file && typeof (file as any).stream === 'function') {
        const f = file as File;
        const mime = f.type || '';
        if (!UPLOAD_MIMES.has(mime) || (f.size || 0) > UPLOAD_MAX_BYTES) {
          return fail(c, 'Invalid payment screenshot (JPEG, PNG, or PDF, max 5MB)', 400);
        }
        const guestKey = `guest/${Date.now()}-${generateId()}.${extForMime(mime)}`;
        await c.env.MEDIA_BUCKET.put(guestKey, f.stream());
        screenshotUrl = `/api/media/raw?k=${encodeURIComponent(guestKey)}`;
      }
    } else {
      const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
      name = String(body.name ?? '');
      email = String(body.email ?? '');
      phone = String(body.phone ?? '');
      plan = String(body.plan ?? 'DIGITAL').toUpperCase();
      address = String(body.address ?? '');
      screenshotUrl = String(body.paymentScreenshotUrl ?? body.payment_screenshot_url ?? '');
    }

    if (!name || !email || !phone) {
      return fail(c, 'Name, email, and phone are required', 400);
    }
    const physical = plan === 'PRINT' || plan === 'PHYSICAL';
    if (physical && !screenshotUrl) {
      return fail(c, 'Payment screenshot is required for print plans', 400);
    }

    const subId = generateId();
    const userId = 'guest';
    await c.env.DB.prepare(
      `INSERT INTO subscriptions (id, user_id, user_name, user_email, user_phone, plan, sub_type, amount, payment_method, payment_screenshot_url, status, shipping_address, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, datetime('now'))`
    )
      .bind(
        subId,
        userId,
        name,
        email,
        phone,
        `${plan} subscription`,
        physical ? 'PHYSICAL' : 'DIGITAL',
        0,
        'UPI',
        screenshotUrl,
        address,
        physical ? `Print request — ${plan}` : 'Digital request'
      )
      .run();

    return ok(c, { message: 'Subscription request submitted' }, 201);
  } catch (err: any) {
    return fail(c, err.message || 'Subscription failed', 500);
  }
});

// --- ADS ---
app.get('/api/ads', async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM ads WHERE status='ACTIVE' ORDER BY created_at DESC").all();
  return ok(c, { ads: results || [] });
});

app.get('/api/ads/admin', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM ads ORDER BY created_at DESC").all();
  return ok(c, { ads: results || [] });
});

app.post('/api/ads', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const data = await c.req.json();
  const id = generateId();
  await c.env.DB.prepare("INSERT INTO ads (id, title, description, image, redirect_url, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(id, data.title, data.description, data.image, data.redirect_url, data.status || 'ACTIVE', new Date().toISOString()).run();
  return ok(c, { id });
});

app.put('/api/ads/:id', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const id = c.req.param('id');
  const data = await c.req.json();
  const sets: string[] = [];
  const vals: any[] = [];

  if (data.title !== undefined) { sets.push('title = ?'); vals.push(data.title); }
  if (data.description !== undefined) { sets.push('description = ?'); vals.push(data.description); }
  if (data.image !== undefined) { sets.push('image = ?'); vals.push(data.image); }
  if (data.redirect_url !== undefined) { sets.push('redirect_url = ?'); vals.push(data.redirect_url); }
  if (data.status !== undefined) { sets.push('status = ?'); vals.push(data.status); }

  if (sets.length === 0) return fail(c, 'No fields to update', 400);
  vals.push(id);

  await c.env.DB.prepare(`UPDATE ads SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
  return ok(c, {});
});

app.delete('/api/ads/:id', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  await c.env.DB.prepare('DELETE FROM ads WHERE id = ?').bind(c.req.param('id')).run();
  return ok(c, {});
});

// --- TICKER ---
app.get('/api/ticker', async (c) => {
  const items = await c.env.DB.prepare("SELECT * FROM ticker_items WHERE active=1 ORDER BY created_at DESC").all();
  return ok(c, { items: items.results || [] });
});

app.post('/api/ticker', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const data = await c.req.json();
  await c.env.DB.prepare("INSERT INTO ticker_items (id, text, active) VALUES (?, ?, 1)").bind(generateId(), data.text).run();
  return ok(c, {});
});

app.put('/api/ticker/:id', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const { active } = await c.req.json();
  await c.env.DB.prepare("UPDATE ticker_items SET active = ? WHERE id = ?").bind(active ? 1 : 0, c.req.param('id')).run();
  return ok(c, {});
});

app.delete('/api/ticker/:id', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  await c.env.DB.prepare("DELETE FROM ticker_items WHERE id = ?").bind(c.req.param('id')).run();
  return ok(c, {});
});

// --- USERS ---
app.get('/api/users', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
  return ok(c, { users: results || [] });
});

app.post('/api/users/:id/approve', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  await c.env.DB.prepare("UPDATE users SET subscription_status='ACTIVE' WHERE id=?").bind(c.req.param('id')).run();
  return ok(c, {});
});

app.post('/api/users/:id/reject', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  await c.env.DB.prepare("UPDATE users SET subscription_status='REJECTED' WHERE id=?").bind(c.req.param('id')).run();
  return ok(c, {});
});

app.delete('/api/users/:id', auth, role('SUPER_ADMIN'), async (c) => {
  await c.env.DB.prepare("DELETE FROM users WHERE id=?").bind(c.req.param('id')).run();
  return ok(c, {});
});

app.get('/api/proxy/rss', async (c) => {
  const url = c.req.query('url');
  if (!url) return ok(c, { items: [] });
  const response = await fetch(url);
  const text = await response.text();
  const items: any[] = [];
  const titles = text.match(/<title>(.*?)<\/title>/g);
  if (titles) titles.slice(1, 12).forEach((t) => items.push({ title: t.replace(/<\/?title>/g, '') }));
  return ok(c, { items });
});

// --- SETTINGS ---
app.get('/api/settings', async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM site_settings WHERE id='global'").all();
  return ok(c, {
    settings: results?.[0] || { site_name: 'Vartmaan Sarokaar', org_name: 'Vinesh Acharya Foundation' }
  });
});

app.put('/api/settings', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const data = await c.req.json();
  await c.env.DB.prepare(`
    INSERT INTO site_settings (id, site_name, org_name, twitter_link, instagram_link, facebook_link, updated_at)
    VALUES ('global', ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET 
      site_name=excluded.site_name, 
      org_name=excluded.org_name, 
      twitter_link=excluded.twitter_link, 
      instagram_link=excluded.instagram_link, 
      facebook_link=excluded.facebook_link, 
      updated_at=excluded.updated_at
  `).bind(data.site_name, data.org_name, data.twitter_link, data.instagram_link, data.facebook_link).run();
  return ok(c, {});
});

// --- HERO ---
app.get('/api/hero', async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM hero_section WHERE id='global'").all();
  return ok(c, {
    hero: results?.[0] || {
      headline: 'Investigating The Truth.',
      subtitle: 'Premium independent journalism from the heart of India.'
    }
  });
});

app.put('/api/hero', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const data = await c.req.json();
  await c.env.DB.prepare(`
    INSERT INTO hero_section (id, headline, subtitle, bg_image, updated_at)
    VALUES ('global', ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET 
      headline=excluded.headline, 
      subtitle=excluded.subtitle, 
      bg_image=excluded.bg_image, 
      updated_at=excluded.updated_at
  `).bind(data.headline, data.subtitle, data.bg_image).run();
  return ok(c, {});
});

export default app;
