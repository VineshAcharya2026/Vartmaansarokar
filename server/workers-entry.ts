import { Hono } from 'hono';
import { verify, sign } from 'hono/jwt';
import * as bcrypt from 'bcryptjs';

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

// CORS — MUST BE FIRST
app.use('*', async (c, next) => {
  const origin = c.req.header('Origin') || '';
  const allowed = [
    'https://main.vartmaan-sarokar-pages.pages.dev',
    'https://vartmaan-sarokaar-api.vineshjm.workers.dev',
    'http://localhost:5173',
    'http://localhost:4173',
    'http://localhost:3000'
  ];
  const isPagesDev = origin.endsWith('.pages.dev');
  if (allowed.includes(origin) || isPagesDev) {
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

// AUTH MIDDLEWARE
const auth = async (c: any, next: any) => {
  const header = c.req.header('Authorization') || '';
  if (!header.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized', details: 'No Bearer token found in Authorization header' }, 401);
  }
  try {
    const token = header.slice(7);
    const secret = c.env.JWT_SECRET;
    if (!secret) {
      console.error('CRITICAL: JWT_SECRET is missing from environment.');
      return c.json({ error: 'System Configuration Error', details: 'JWT_SECRET missing' }, 500);
    }
    const payload = await verify(token, secret, 'HS256');
    c.set('user', payload);
    await next();
  } catch (e: any) {
    console.error('JWT Verification failed:', e.message);
    return c.json({ error: 'Invalid token', details: e.message }, 401);
  }
};

const role = (...roles: string[]) => async (c: any, next: any) => {
  const u = c.get('user');
  if (!u || !roles.includes(u.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  await next();
};

const generateId = () => crypto.randomUUID();

// --- HEALTH ---
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', time: new Date().toISOString() });
});

// --- TRANSLATE ---
app.post('/api/translate', async (c) => {
  const body = await c.req.json();
  const result = await c.env.AI.run('@cf/meta/m2m100-1.2b', {
    text: body.text,
    source_lang: 'english',
    target_lang: body.targetLang
  });
  return c.json({ translated: result.translated_text });
});

app.post('/api/translate/batch', async (c) => {
  const { texts, targetLang } = await c.req.json();
  if (!texts || !Array.isArray(texts)) return c.json({ error: 'Texts array required' }, 400);
  
  const translations: Record<string, string> = {};
  
  // To avoid hitting Cloudflare AI limits/timeouts for very large batches, 
  // we process them in parallel with a small concurrency or just Promise.all if batch is small.
  // M2M100 is relatively fast for fragments.
  try {
    const results = await Promise.all(texts.map(async (text) => {
      try {
        const res = await c.env.AI.run('@cf/meta/m2m100-1.2b', {
          text,
          source_lang: 'english',
          target_lang: targetLang.toLowerCase()
        });
        return { original: text, translated: res.translated_text };
      } catch (e) {
        return { original: text, translated: text }; // Fallback to original
      }
    }));
    
    results.forEach(r => {
      translations[r.original] = r.translated;
    });
    
    return c.json({ translations });
  } catch (err: any) {
    return c.json({ error: 'Batch translation failed', details: err.message }, 500);
  }
});

// --- AUTH ---
const handleLogin = async (c: any) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return c.json({ success: false, error: 'Email and password are required' }, 400);
    }

    const { results } = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).all();
    
    if (!results || results.length === 0) {
      return c.json({ success: false, error: 'Invalid email or password' }, 401);
    }

    const user = results[0] as any;
    const passwordHash = user.password_hash || '';

    // Check if it matches DB password OR the master staff password (if configured)
    const isMasterPassword = c.env.STAFF_PASSWORD && password === c.env.STAFF_PASSWORD;
    const isDbPassword = passwordHash ? await bcrypt.compare(password, passwordHash) : false;
    
    if (!isDbPassword && !isMasterPassword) {
      if (!passwordHash && !c.env.STAFF_PASSWORD) {
        return c.json({ success: false, error: 'System Configuration Error: No valid password source found.' }, 401);
      }
      return c.json({ success: false, error: 'Incorrect email or password.' }, 401);
    }

    // Role safety check: If user's email is in ADMIN_EMAILS but they are READER, upgrade them
    let userRole = user.role;
    if (isAdminEmail(user.email) && userRole === 'READER') {
      userRole = 'SUPER_ADMIN';
      await c.env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind(userRole, user.id).run();
    }

    if (userRole === 'READER' && user.is_verified === 0) {
      return c.json({ success: false, error: 'Account not verified. Please check your email.', details: 'USER_NOT_VERIFIED' }, 403);
    }

    if (!c.env.JWT_SECRET) {
       console.error('CRITICAL: JWT_SECRET is missing from environment.');
       return c.json({ success: false, error: 'System Configuration Error: Security token missing.' }, 500);
    }
    
    const payload = {
      id: user.id,
      email: user.email,
      role: userRole,
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
    };

    const token = await sign(payload, c.env.JWT_SECRET, 'HS256');

    return c.json({
      success: true,
      message: 'Login successful.',
      data: {
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
      }
    });
  } catch (err: any) {
    console.error('Login error detail:', err.message);
    return c.json({ success: false, error: 'Login failed', details: err.message }, 401);
  }
};

// --- GOOGLE AUTH ---
const handleGoogleLogin = async (c: any) => {
  try {
    const { credential } = await c.req.json();
    if (!credential) return c.json({ success: false, error: 'Missing credential' }, 400);

    // Verify with Google API
    const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    const payload = await resp.json() as any;

    if (!payload.email) {
      return c.json({ success: false, error: 'Invalid Google token' }, 401);
    }

    // Find or Create User
    const { results } = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(payload.email).all();
    let user = results?.[0] as any;

    if (!user) {
      const id = generateId();
      const role = isAdminEmail(payload.email) ? 'SUPER_ADMIN' : 'READER';
      await c.env.DB.prepare('INSERT INTO users (id, email, name, role, google_id, is_verified) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id, payload.email, payload.name || '', role, payload.sub, 1) // Google users are auto-verified
        .run();
      const fresh = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).all();
      user = fresh.results?.[0];
    } else if (isAdminEmail(user.email) && user.role === 'READER') {
      // Upgrade existing reader to admin if they are in the list
      await c.env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind('SUPER_ADMIN', user.id).run();
      user.role = 'SUPER_ADMIN';
    }

    const jwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
    };

    const token = await sign(jwtPayload, c.env.JWT_SECRET, 'HS256');

    return c.json({
      success: true,
      message: 'Google login successful.',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          subscription_status: user.subscription_status,
          subscription_plan: user.subscription_plan
        }
      }
    });
  } catch (err: any) {
    return c.json({ success: false, error: 'Google authentication failed', details: err.message }, 401);
  }
};

// --- READER REGISTRATION & VERIFICATION ---
const handleRegisterReader = async (c: any) => {
  try {
    const { email, password, name } = await c.req.json();
    if (!email || !password) return c.json({ success: false, error: 'Email and password required' }, 400);

    const { results } = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).all();
    if (results && results.length > 0) return c.json({ success: false, error: 'Email already registered' }, 409);

    const id = generateId();
    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = generateId().replace(/-/g, '').slice(0, 32);

    await c.env.DB.prepare('INSERT INTO users (id, email, password_hash, name, role, is_verified, verification_token) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id, email, passwordHash, name || '', 'READER', 0, verificationToken)
      .run();

    // Verification Link
    const verifyLink = `https://main.vartmaan-sarokar-pages.pages.dev/#/verify?token=${verificationToken}`;
    console.log(`Verification link for ${email}: ${verifyLink}`);

    // TODO: Integrate actual email service here using c.env.MAIL_API_KEY
    // For now, we simulate success. In production, we'd fetch(MAIL_API_URL, ...)

    return c.json({ success: true, message: 'Registration successful. Please verify your email.' });
  } catch (err: any) {
    return c.json({ success: false, error: 'Registration failed', details: err.message }, 500);
  }
};

const handleVerifyEmail = async (c: any) => {
  try {
    const { token } = await c.req.json();
    if (!token) return c.json({ success: false, error: 'Token is required' }, 400);

    const { results } = await c.env.DB.prepare('SELECT id FROM users WHERE verification_token = ?').bind(token).all();
    if (!results || results.length === 0) return c.json({ success: false, error: 'Invalid or expired token' }, 400);

    const user = results[0] as any;
    await c.env.DB.prepare("UPDATE users SET is_verified = 1, verification_token = NULL, subscription_status = 'ACTIVE' WHERE id = ?")
      .bind(user.id)
      .run();

    return c.json({ success: true, message: 'Email verified and digital access granted.' });
  } catch (err: any) {
    return c.json({ success: false, error: 'Verification failed', details: err.message }, 500);
  }
};

app.post('/auth/login', handleLogin);
app.post('/api/auth/login', handleLogin);
app.post('/auth/staff/login', handleLogin);
app.post('/api/auth/staff/login', handleLogin);
app.post('/auth/google', handleGoogleLogin);
app.post('/api/auth/google', handleGoogleLogin);
app.post('/auth/register', handleRegisterReader);
app.post('/api/auth/register', handleRegisterReader);
app.post('/auth/verify-email', handleVerifyEmail);
app.post('/api/auth/verify-email', handleVerifyEmail);

// --- QUICK LOGIN (for subscribers/readers - passwordless) ---
app.post('/auth/users/login', async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) {
      return c.json({ success: false, error: 'Email is required.' }, 400);
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const { results } = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(normalizedEmail).all();
    
    let user = results?.[0] as any;
    
    // Auto-create user if not exists (for quick login)
    if (!user) {
      const id = generateId();
      await c.env.DB.prepare('INSERT INTO users (id, email, name, role, password_hash, is_verified) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id, normalizedEmail, normalizedEmail.split('@')[0], 'READER', await bcrypt.hash(crypto.randomUUID(), 10), 1)
        .run();
      const fresh = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).all();
      user = fresh.results?.[0];
    }

    if (!user) {
      return c.json({ success: false, error: 'Unable to create user.' }, 500);
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
    };

    const token = await sign(payload, c.env.JWT_SECRET, 'HS256');

    return c.json({
      success: true,
      message: 'Quick login successful.',
      data: {
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
      }
    });
  } catch (err: any) {
    return c.json({ success: false, error: 'Quick login failed', details: err.message }, 500);
  }
});
app.post('/api/auth/users/login', async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) {
      return c.json({ success: false, error: 'Email is required.' }, 400);
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const { results } = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(normalizedEmail).all();
    
    let user = results?.[0] as any;
    
    // Auto-create user if not exists (for quick login)
    if (!user) {
      const id = generateId();
      await c.env.DB.prepare('INSERT INTO users (id, email, name, role, password_hash, is_verified) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id, normalizedEmail, normalizedEmail.split('@')[0], 'READER', await bcrypt.hash(crypto.randomUUID(), 10), 1)
        .run();
      const fresh = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).all();
      user = fresh.results?.[0];
    }

    if (!user) {
      return c.json({ success: false, error: 'Unable to create user.' }, 500);
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
    };

    const token = await sign(payload, c.env.JWT_SECRET, 'HS256');

    return c.json({
      success: true,
      message: 'Quick login successful.',
      data: {
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
      }
    });
  } catch (err: any) {
    return c.json({ success: false, error: 'Quick login failed', details: err.message }, 500);
  }
});

app.get('/auth/me', auth, async (c) => {
  const u = c.get('user');
  const { results } = await c.env.DB.prepare('SELECT id, email, name, role, phone, address, subscription_plan, subscription_status, payment_verified, created_at FROM users WHERE id = ?').bind(u.id).all();
  const user = results[0] as any;
  if (!user) return c.json({ success: false, error: 'User not found' }, 404);
  return c.json({ success: true, message: 'Authenticated user loaded.', data: { user } });
});
app.get('/api/auth/me', auth, async (c) => {
  const u = c.get('user');
  const { results } = await c.env.DB.prepare('SELECT id, email, name, role, phone, address, subscription_plan, subscription_status, payment_verified, created_at FROM users WHERE id = ?').bind(u.id).all();
  const user = results[0] as any;
  if (!user) return c.json({ success: false, error: 'User not found' }, 404);
  return c.json({ success: true, message: 'Authenticated user loaded.', data: { user } });
});

// --- NEWS ---
app.get('/api/news', async (c) => {
  try {
    const { results } = await c.env.DB.prepare("SELECT * FROM news WHERE status='PUBLISHED' ORDER BY published_at DESC LIMIT 50").all();
    return c.json({ news: results || [] });
  } catch (e: any) {
    return c.json({ news: [], error: e.message }, 500);
  }
});

app.get('/api/news/all', auth, async (c) => {
  const user = c.get('user');
  let q = '';
  if (user.role === 'EDITOR') q = 'SELECT * FROM news WHERE author_id = ? ORDER BY created_at DESC';
  else if (user.role === 'ADMIN') q = "SELECT * FROM news WHERE status IN ('PENDING_REVIEW','PUBLISHED','REJECTED','DRAFT','REWORK') ORDER BY created_at DESC";
  else if (user.role === 'SUPER_ADMIN') q = 'SELECT * FROM news ORDER BY created_at DESC';
  else return c.json({ error: 'Forbidden' }, 403);
  
  const { results } = user.role === 'EDITOR' 
    ? await c.env.DB.prepare(q).bind(user.id).all()
    : await c.env.DB.prepare(q).all();
    
  return c.json({ news: results || [] });
});

app.get('/api/news/pending', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  // Check for both PENDING and PENDING_REVIEW for robustness
  const { results } = await c.env.DB.prepare("SELECT * FROM news WHERE status IN ('PENDING_REVIEW', 'PENDING') ORDER BY created_at DESC").all();
  return c.json({ news: results || [] });
});

app.post('/api/news/:id/translate', auth, async (c) => {
  try {
    const { id } = c.req.param();
    const { targetLang } = await c.req.json();
    if (!targetLang) return c.json({ error: 'Target language required' }, 400);

    const { results } = await c.env.DB.prepare('SELECT * FROM news WHERE id = ?').bind(id).all();
    if (!results || !results[0]) return c.json({ error: 'Article not found' }, 404);
    
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

    return c.json({ translated });
  } catch (err: any) {
    return c.json({ error: 'Translation failed', details: err.message }, 500);
  }
});

app.get('/api/news/:id', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM news WHERE id = ?').bind(c.req.param('id')).all();
  if (!results || !results[0]) return c.json({ error: 'Article not found' }, 404);
  const article = results[0] as any;
  
  if (article.status !== 'PUBLISHED') {
    // If not published, we need to verify if the requester is staff
    const authHeader = c.req.header('Authorization');
    if (!authHeader) return c.json({ error: 'Forbidden', message: 'Article not published' }, 403);
    
    try {
      const token = authHeader.replace('Bearer ', '');
      const payload = await verify(token, c.env.JWT_SECRET, 'HS256') as any;
      if (!['EDITOR', 'ADMIN', 'SUPER_ADMIN'].includes(payload.role)) {
        return c.json({ error: 'Forbidden', message: 'Article not published' }, 403);
      }
    } catch (e) {
      return c.json({ error: 'Forbidden', message: 'Article not published' }, 403);
    }
  }
  
  return c.json({ article });
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

  return c.json({ article: { id, status } });
});

app.put('/api/news/:id', auth, role('EDITOR', 'ADMIN', 'SUPER_ADMIN'), async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    const body = await c.req.json();
    
    // Explicitly ignore any status provided in the body
    delete body.status;
    
    const { results } = await c.env.DB.prepare('SELECT * FROM news WHERE id = ?').bind(id).all();
    if (!results || !results[0]) return c.json({ error: "Article not found" }, 404);
    
    const article = results[0] as any;
    
    // Auth Guard
    if (user.role === 'EDITOR' && article.author_id !== user.id) {
       return c.json({ error: "Forbidden", message: 'You can only edit your own articles.' }, 403);
    }

    // FORCE status logic
    let newStatus = article.status;
    if (user.role === 'EDITOR') {
      newStatus = 'PENDING_REVIEW'; // Force back to pending on any edit by editor
    } else if (['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      newStatus = 'PUBLISHED'; // Admins published directly
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
    
    return c.json({ message: 'Updated successfully', status: newStatus });
  } catch (err: any) {
    return c.json({ error: "Server Error", message: err.message }, 500);
  }
});

// --- NEWS / ARTICLES ---
app.get('/articles', async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM news WHERE status='PUBLISHED' ORDER BY created_at DESC").all();
  return c.json({ news: results || [] });
});

app.get('/articles/all', auth, role('ADMIN', 'SUPER_ADMIN', 'EDITOR'), async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM news ORDER BY created_at DESC").all();
  return c.json({ news: results || [] });
});

app.get('/articles/pending', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM news WHERE status='PENDING_REVIEW' ORDER BY created_at DESC").all();
  return c.json({ news: results || [] });
});

app.get('/articles/:id', async (c) => {
  const id = c.req.param('id');
  const { results } = await c.env.DB.prepare("SELECT * FROM news WHERE id = ?").bind(id).all();
  if(!results || !results[0]) return c.json({ error: 'Article not found' }, 404);
  return c.json({ article: results[0] });
});

app.post('/articles', auth, async (c) => {
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

  return c.json({ success: true, id });
});

app.put('/articles/:id', auth, async (c) => {
  const id = c.req.param('id');
  const data = await c.req.json();
  const updatedAt = new Date().toISOString();
  
  await c.env.DB.prepare(`
    UPDATE news 
    SET title = ?, content = ?, excerpt = ?, category = ?, author = ?, image = ?, updated_at = ?
    WHERE id = ?
  `).bind(data.title, data.content, data.excerpt, data.category, data.author, data.image, updatedAt, id).run();

  return c.json({ success: true });
});

app.delete('/articles/:id', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare("DELETE FROM news WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

const handleApprove = async (c: any) => {
  try {
    const id = c.req.param('id');
    const result = await c.env.DB.prepare("UPDATE news SET status='PUBLISHED' WHERE id=?").bind(id).run();
    const changes = result.meta?.changes ?? (result as any).changes ?? 0;
    if (changes === 0 && !result.success) return c.json({ error: "Approve failed" }, 400);
    return c.json({ message: 'Approved' });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
};

const handleReject = async (c: any) => {
  try {
    const { reason } = await c.req.json().catch(() => ({ reason: '' }));
    const id = c.req.param('id');
    const result = await c.env.DB.prepare("UPDATE news SET status='REJECTED', rejection_reason=? WHERE id=?").bind(reason || 'No reason provided', id).run();
    const changes = result.meta?.changes ?? (result as any).changes ?? 0;
    if (changes === 0 && !result.success) return c.json({ error: "Reject failed" }, 400);
    return c.json({ message: 'Rejected' });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
};

const handleRework = async (c: any) => {
  try {
    const { reason } = await c.req.json().catch(() => ({ reason: '' }));
    const id = c.req.param('id');
    const result = await c.env.DB.prepare("UPDATE news SET status='DRAFT', rejection_reason=? WHERE id=?").bind(reason || 'Rework requested', id).run();
    const changes = result.meta?.changes ?? (result as any).changes ?? 0;
    if (changes === 0 && !result.success) return c.json({ error: "Rework failed" }, 400);
    return c.json({ message: 'Sent for rework' });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
};

app.post('/articles/:id/approve', auth, role('ADMIN', 'SUPER_ADMIN'), handleApprove);
app.post('/articles/:id/reject', auth, role('ADMIN', 'SUPER_ADMIN'), handleReject);
app.post('/articles/:id/rework', auth, role('ADMIN', 'SUPER_ADMIN'), handleRework);

// --- MAGAZINES ---
app.get('/magazines', async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM magazines WHERE status='PUBLISHED' ORDER BY created_at DESC").all();
  return c.json({ magazines: results || [] });
});

app.get('/magazines/all', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM magazines ORDER BY created_at DESC").all();
  return c.json({ magazines: results || [] });
});

app.post('/magazines', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
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
  return c.json({ success: true, id });
});

app.delete('/magazines/:id', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  await c.env.DB.prepare("DELETE FROM magazines WHERE id = ?").bind(c.req.param('id')).run();
  return c.json({ success: true });
});

// --- MEDIA ---
app.get('/media', auth, async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM media_files ORDER BY created_at DESC").all();
  return c.json({ media: results || [] });
});

app.post('/media', auth, async (c) => {
  const form = await c.req.formData();
  const file = form.get('file') as any;
  if (!file) return c.json({ error: 'No file' }, 400);
  const id = generateId();
  const name = `${id}-${file.name}`;
  await c.env.MEDIA_BUCKET.put(name, file.stream());
  const url = `/media/${name}`;
  await c.env.DB.prepare("INSERT INTO media_files (id, original_name, stored_name, url, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(id, file.name, name, url, new Date().toISOString()).run();
  return c.json({ success: true, url });
});

app.get('/media/:name', async (c) => {
  const name = c.req.param('name');
  const obj = await c.env.MEDIA_BUCKET.get(name);
  if (!obj) return c.json({ error: 'Not found' }, 404);
  return new Response(obj.body, { headers: { 'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream' } });
});

// --- ADS ---
app.get('/ads', async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM ads WHERE status='ACTIVE' ORDER BY created_at DESC").all();
  return c.json({ ads: results || [] });
});

app.get('/ads/admin', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM ads ORDER BY created_at DESC").all();
  return c.json({ ads: results || [] });
});

app.post('/ads', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const data = await c.req.json();
  const id = generateId();
  await c.env.DB.prepare("INSERT INTO ads (id, title, description, image, redirect_url, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(id, data.title, data.description, data.image, data.redirect_url, data.status || 'ACTIVE', new Date().toISOString()).run();
  return c.json({ success: true, id });
});

app.put('/ads/:id', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const id = c.req.param('id');
  const data = await c.req.json();
  const sets: string[] = [];
  const vals: any[] = [];

  if (data.title !== undefined) { sets.push('title = ?'); vals.push(data.title); }
  if (data.description !== undefined) { sets.push('description = ?'); vals.push(data.description); }
  if (data.image !== undefined) { sets.push('image = ?'); vals.push(data.image); }
  if (data.redirect_url !== undefined) { sets.push('redirect_url = ?'); vals.push(data.redirect_url); }
  if (data.status !== undefined) { sets.push('status = ?'); vals.push(data.status); }

  if (sets.length === 0) return c.json({ error: 'No fields to update' }, 400);
  vals.push(id);

  await c.env.DB.prepare(`UPDATE ads SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
  return c.json({ success: true });
});

app.delete('/ads/:id', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  await c.env.DB.prepare('DELETE FROM ads WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

// --- TICKER ---
app.get('/ticker', async (c) => {
  const items = await c.env.DB.prepare("SELECT * FROM ticker_items WHERE active=1 ORDER BY created_at DESC").all();
  return c.json({ items: items.results || [] });
});

app.post('/ticker', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const data = await c.req.json();
  await c.env.DB.prepare("INSERT INTO ticker_items (id, text, active) VALUES (?, ?, 1)").bind(generateId(), data.text).run();
  return c.json({ success: true });
});

app.put('/ticker/:id', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const { active } = await c.req.json();
  await c.env.DB.prepare("UPDATE ticker_items SET active = ? WHERE id = ?").bind(active ? 1 : 0, c.req.param('id')).run();
  return c.json({ success: true });
});

app.delete('/ticker/:id', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  await c.env.DB.prepare("DELETE FROM ticker_items WHERE id = ?").bind(c.req.param('id')).run();
  return c.json({ success: true });
});

// --- USERS ---
app.get('/users', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
  return c.json({ users: results || [] });
});

app.post('/users/:id/approve', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  await c.env.DB.prepare("UPDATE users SET subscription_status='ACTIVE' WHERE id=?").bind(c.req.param('id')).run();
  return c.json({ success: true });
});

app.post('/users/:id/reject', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
  await c.env.DB.prepare("UPDATE users SET subscription_status='REJECTED' WHERE id=?").bind(c.req.param('id')).run();
  return c.json({ success: true });
});

app.delete('/users/:id', auth, role('SUPER_ADMIN'), async (c) => {
  await c.env.DB.prepare("DELETE FROM users WHERE id=?").bind(c.req.param('id')).run();
  return c.json({ success: true });
});

app.get('/proxy/rss', async (c) => {
  const url = c.req.query('url');
  if (!url) return c.json({ items: [] });
  const response = await fetch(url);
  const text = await response.text();
  const items: any[] = [];
  const titles = text.match(/<title>(.*?)<\/title>/g);
  if (titles) titles.slice(1, 12).forEach(t => items.push({ title: t.replace(/<\/?title>/g, '') }));
  return c.json({ items });
});

// --- SETTINGS ---
app.get('/settings', async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM site_settings WHERE id='global'").all();
  return c.json({ settings: results?.[0] || { site_name: 'Vartmaan Sarokaar', org_name: 'Vinesh Acharya Foundation' } });
});

app.put('/settings', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
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
  return c.json({ success: true });
});

// --- HERO ---
app.get('/hero', async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM hero_section WHERE id='global'").all();
  return c.json({ hero: results?.[0] || { headline: 'Investigating The Truth.', subtitle: 'Premium independent journalism from the heart of India.' } });
});

app.put('/hero', auth, role('ADMIN', 'SUPER_ADMIN'), async (c) => {
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
  return c.json({ success: true });
});

export default app;
