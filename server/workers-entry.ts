import { Router } from './workers-router.js';
import { d1Store, D1Database } from './d1-store.js';
import type { Article, MagazineIssue, SubscriptionRequest, Ad } from './types.js';

// Cloudflare Workers environment bindings
export interface Env {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  JWT_SECRET: string;
  OPENAI_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  STAFF_PASSWORD: string;
  NODE_ENV: string;
  MAX_UPLOAD_SIZE_BYTES: string;
  OPENAI_MODEL: string;
  ALLOWED_ORIGINS: string;
}

// R2 Bucket interface
export interface R2Bucket {
  get(key: string): Promise<R2Object | null>;
  put(key: string, value: ReadableStream | ArrayBuffer | string, options?: R2PutOptions): Promise<R2Object>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<R2ObjectsList>;
}

export interface R2Object {
  key: string;
  size: number;
  etag: string;
  httpEtag: string;
  checksums: Record<string, string>;
  httpMetadata: Record<string, string>;
  customMetadata: Record<string, string>;
  range?: { offset: number; length: number };
  writeHttpMetadata(headers: Headers): void;
  body?: ReadableStream;
  bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  blob(): Promise<Blob>;
  json(): Promise<any>;
}

export interface R2PutOptions {
  httpMetadata?: { contentType?: string; contentDisposition?: string };
  customMetadata?: Record<string, string>;
  md5?: string;
  sha1?: string;
  sha256?: string;
  sha384?: string;
  sha512?: string;
}

export interface R2ObjectsList {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
  delimitedPrefixes: string[];
}

// CORS headers
function getCorsHeaders(origin: string, allowedOrigins: string): Record<string, string> {
  const origins = allowedOrigins.split(',').map(o => o.trim());
  const allowOrigin = origins.includes(origin) ? origin : origins[0] || '*';
  
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  };
}

// Security headers
function addSecurityHeaders(headers: Headers): void {
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: http:; script-src 'self' https://accounts.google.com https://apis.google.com; connect-src 'self' https://api.openai.com https://accounts.google.com https://oauth2.googleapis.com; frame-src 'self' https://accounts.google.com;");
}

// Error response helper
function errorResponse(message: string, status: number = 500, details?: string): Response {
  return new Response(
    JSON.stringify({
      success: false,
      message,
      error: details
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

// Success response helper
function successResponse(data: any, message?: string, status: number = 200): Response {
  return new Response(
    JSON.stringify({
      success: true,
      message,
      data
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

// Parse JWT token
function parseJwt(token: string, secret: string): { userId?: string; role?: string } | null {
  try {
    const [header, payload, signature] = token.split('.');
    if (!payload) return null;
    
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch {
    return null;
  }
}

// Verify JWT (simplified for Workers - in production use proper crypto)
function verifyJwt(token: string, secret: string): { userId?: string; role?: string } | null {
  // In production, implement proper JWT verification with Web Crypto API
  // This is a simplified version
  return parseJwt(token, secret);
}

// Initialize router
let router: Router | null = null;

async function initRouter(env: Env): Promise<Router> {
  if (!router) {
    // Initialize D1 store
    await d1Store.init(env.DB);
    
    // Create router with all routes
    router = new Router(env, d1Store);
    
    // Setup all routes
    setupAuthRoutes(router, env);
    setupContentRoutes(router, env);
    setupMediaRoutes(router, env);
    setupSubscriptionRoutes(router, env);
    setupUserRoutes(router, env);
    setupChatRoutes(router, env);
  }
  return router;
}

// Auth routes
function setupAuthRoutes(router: Router, env: Env): void {
  // POST /api/auth/signup
  router.post('/api/auth/signup', async (req, ctx) => {
    const { email, name, password } = await req.json();
    
    // Check if user exists
    const existing = await ctx.store.findUserByEmail(email);
    if (existing) {
      return errorResponse('Account already exists.', 409);
    }
    
    // Create user
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await ctx.store.createUser({
      email,
      name,
      role: 'GENERAL',
      passwordHash: hashedPassword,
      authProvider: 'PASSWORD'
    });
    
    // Generate JWT
    const token = btoa(JSON.stringify({ userId: user.id, role: user.role }));
    
    return successResponse({ token, user }, 'Account created successfully.', 201);
  });
  
  // POST /api/auth/login
  router.post('/api/auth/login', async (req, ctx) => {
    const { email, password } = await req.json();
    
    const user = await ctx.store.findUserByEmail(email);
    if (!user) {
      return errorResponse('Invalid credentials.', 401);
    }
    
    const bcrypt = await import('bcryptjs');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return errorResponse('Invalid credentials.', 401);
    }
    
    const token = btoa(JSON.stringify({ userId: user.id, role: user.role }));
    return successResponse({ token, user }, 'Login successful.');
  });
  
  // POST /api/auth/google
  router.post('/api/auth/google', async (req, ctx) => {
    const { credential } = await req.json();
    
    if (!credential || !env.GOOGLE_CLIENT_ID) {
      return errorResponse('Google sign-in is not configured.', 503);
    }
    
    // In production, verify the Google token
    // For now, parse the JWT payload
    const payload = parseJwt(credential, '');
    if (!payload) {
      return errorResponse('Invalid Google token.', 401);
    }
    
    // Mock implementation - in production use Google OAuth2Client
    return errorResponse('Google sign-in not fully implemented in Workers environment.', 501);
  });
  
  // POST /api/auth/users/login (quick login)
  router.post('/api/auth/users/login', async (req, ctx) => {
    const { email } = await req.json();
    
    let user = await ctx.store.findUserByEmail(email);
    if (!user) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(crypto.randomUUID(), 10);
      user = await ctx.store.createUser({
        email,
        name: email.split('@')[0],
        role: 'GENERAL',
        passwordHash: hashedPassword
      });
    }
    
    const token = btoa(JSON.stringify({ userId: user.id, role: user.role }));
    return successResponse({ token, user }, 'Quick login successful.');
  });
  
  // POST /api/auth/subscriptions/digital
  router.post('/api/auth/subscriptions/digital', async (req, ctx) => {
    const { name, email, phone } = await req.json();
    
    const user = await ctx.store.activateDigitalSubscription({ email, name });
    const token = btoa(JSON.stringify({ userId: user.id, role: user.role }));
    
    return successResponse({ token, user }, 'Digital subscription activated.', 201);
  });
  
  // GET /api/auth/me
  router.get('/api/auth/me', async (req, ctx) => {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return errorResponse('Authentication required.', 401);
    }
    
    const token = auth.slice(7);
    const payload = verifyJwt(token, env.JWT_SECRET);
    if (!payload?.userId) {
      return errorResponse('Invalid token.', 401);
    }
    
    const user = await ctx.store.getUserById(payload.userId);
    if (!user) {
      return errorResponse('User not found.', 404);
    }
    
    return successResponse({ user });
  });
}

// Content routes
function setupContentRoutes(router: Router, env: Env): void {
  // GET /api/articles
  router.get('/api/articles', async (req, ctx) => {
    const articles = await ctx.store.listArticles();
    return successResponse({ articles });
  });
  
  // GET /api/articles/:id
  router.get('/api/articles/:id', async (req, ctx) => {
    const { id } = req.params;
    const article = await ctx.store.getArticleById(id);
    if (!article) {
      return errorResponse('Article not found.', 404);
    }
    return successResponse({ article });
  });
  
  // POST /api/articles (protected)
  router.post('/api/articles', async (req, ctx) => {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return errorResponse('Authentication required.', 401);
    }
    
    const article = await req.json();
    const created = await ctx.store.createArticle(article);
    const articles = await ctx.store.listArticles();
    
    return successResponse({ article: created, articles }, 'Article created.', 201);
  });
  
  // PATCH /api/articles/:id (protected)
  router.patch('/api/articles/:id', async (req, ctx) => {
    const { id } = req.params;
    const updates: Partial<Article> = await req.json();
    
    const updated = await ctx.store.updateArticle(id, updates);
    const articles = await ctx.store.listArticles();
    
    return successResponse({ article: updated, articles }, 'Article updated.');
  });
  
  // DELETE /api/articles/:id (protected)
  router.delete('/api/articles/:id', async (req, ctx) => {
    const { id } = req.params;
    
    await ctx.store.deleteArticle(id);
    const articles = await ctx.store.listArticles();
    
    return successResponse({ articles }, 'Article deleted.');
  });
  
  // GET /api/magazines
  router.get('/api/magazines', async (req, ctx) => {
    const magazines = await ctx.store.listMagazines();
    return successResponse({ magazines });
  });
  
  // POST /api/magazines (protected)
  router.post('/api/magazines', async (req, ctx) => {
    const magazine: MagazineIssue = await req.json();
    const created = await ctx.store.createMagazine(magazine);
    const magazines = await ctx.store.listMagazines();
    
    return successResponse({ magazine: created, magazines }, 'Magazine created.', 201);
  });
  
  // PATCH /api/magazines/:id (protected)
  router.patch('/api/magazines/:id', async (req, ctx) => {
    const { id } = req.params;
    const updates = await req.json();
    
    const updated = await ctx.store.updateMagazine(id, updates);
    const magazines = await ctx.store.listMagazines();
    
    return successResponse({ magazine: updated, magazines }, 'Magazine updated.');
  });
  
  // DELETE /api/magazines/:id (protected)
  router.delete('/api/magazines/:id', async (req, ctx) => {
    const { id } = req.params;
    
    await ctx.store.deleteMagazine(id);
    const magazines = await ctx.store.listMagazines();
    
    return successResponse({ magazines }, 'Magazine deleted.');
  });
  
  // GET /api/ads
  router.get('/api/ads', async (req, ctx) => {
    const ads = await ctx.store.listAds();
    return successResponse({ ads });
  });
  
  // PUT /api/ads (protected)
  router.put('/api/ads', async (req, ctx) => {
    const { ads }: { ads: Ad[] } = await req.json();
    const updated = await ctx.store.replaceAds(ads);
    
    return successResponse({ ads: updated }, 'Ads updated.');
  });
  
  // GET /api/app-state
  router.get('/api/app-state', async (req, ctx) => {
    const state = await ctx.store.getPublicAppStateAsync();
    return successResponse(state, 'App state loaded.');
  });
  
  // GET /api/health
  router.get('/api/health', async (req, ctx) => {
    return successResponse({
      ok: true,
      storage: 'd1',
      openAiConfigured: Boolean(env.OPENAI_API_KEY)
    }, 'Health check passed.');
  });
}

// Media routes
function setupMediaRoutes(router: Router, env: Env): void {
  // GET /api/media
  router.get('/api/media', async (req, ctx) => {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || undefined;
    const kind = url.searchParams.get('kind') as any;
    
    const media = await ctx.store.listMedia({ search, kind });
    return successResponse({ media });
  });
  
  // POST /api/media (protected)
  router.post('/api/media', async (req, ctx) => {
    // Handle multipart form data upload
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return errorResponse('No file provided.', 400);
    }
    
    const maxSize = parseInt(env.MAX_UPLOAD_SIZE_BYTES) || 15 * 1024 * 1024;
    if (file.size > maxSize) {
      return errorResponse(`File too large. Max size: ${maxSize} bytes`, 413);
    }
    
    // Upload to R2
    const key = `media/${Date.now()}_${file.name}`;
    await env.MEDIA_BUCKET.put(key, file.stream(), {
      httpMetadata: { contentType: file.type }
    });
    
    // Store metadata in D1
    const media = await ctx.store.createMedia({
      originalName: file.name,
      storedName: key,
      url: `/media/${key}`,
      kind: file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : file.type === 'application/pdf' ? 'pdf' : 'other',
      mimeType: file.type,
      size: file.size
    });
    
    return successResponse({ media }, 'Media uploaded.', 201);
  });
  
  // GET /media/:key (R2 proxy)
  router.get('/media/:key', async (req, ctx) => {
    const { key } = req.params;
    const object = await env.MEDIA_BUCKET.get(key);
    
    if (!object) {
      return new Response('Not found', { status: 404 });
    }
    
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    
    return new Response(object.body, { headers });
  });
}

// Subscription routes
function setupSubscriptionRoutes(router: Router, env: Env): void {
  // GET /api/subscriptions/requests
  router.get('/api/subscriptions/requests', async (req, ctx) => {
    const requests = await ctx.store.listSubscriptionRequests();
    return successResponse({ requests });
  });
  
  // POST /api/subscriptions/requests
  router.post('/api/subscriptions/requests', async (req, ctx) => {
    const data: Omit<SubscriptionRequest, 'status' | 'id' | 'createdAt' | 'updatedAt'> = await req.json();
    const request: SubscriptionRequest = await ctx.store.createSubscriptionRequest({ ...data, status: 'pending' });
    return successResponse({ request, requestId: request.id }, 'Request created.', 201);
  });
  
  // PATCH /api/subscriptions/requests/:id/status (protected)
  router.patch('/api/subscriptions/requests/:id/status', async (req, ctx) => {
    const { id } = req.params;
    const { status } = await req.json();
    
    const request = await ctx.store.updateSubscriptionRequest(id, status);
    const requests = await ctx.store.listSubscriptionRequests();
    
    return successResponse({ request, requests }, 'Request updated.');
  });
}

// User routes
function setupUserRoutes(router: Router, env: Env): void {
  // GET /api/users
  router.get('/api/users', async (req, ctx) => {
    const users = await ctx.store.listUsers();
    return successResponse({ users });
  });
  
  // PATCH /api/users/:id/role (protected)
  router.patch('/api/users/:id/role', async (req, ctx) => {
    const { id } = req.params;
    const { role } = await req.json();
    
    const user = await ctx.store.updateUser(id, { role });
    const users = await ctx.store.listUsers();
    
    return successResponse({ user, users }, 'User role updated.');
  });
}

// Chat routes
function setupChatRoutes(router: Router, env: Env): void {
  // POST /api/chat
  router.post('/api/chat', async (req, ctx) => {
    const { url, message }: { url?: string; message: string } = await req.json();
    
    if (!message) {
      return errorResponse('A message is required.', 400);
    }
    
    if (!env.OPENAI_API_KEY) {
      return errorResponse('OPENAI_API_KEY is not configured.', 500);
    }
    
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You answer questions about the provided website content when it is available. If the answer is not in the provided content, say so clearly.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 800,
        temperature: 0.2
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      return errorResponse('OpenAI request failed.', 502, error);
    }
    
    const data = await response.json() as any;
    const answer = data?.choices?.[0]?.message?.content ?? '';
    
    return successResponse({ answer }, 'Chat response generated.');
  });
  
  // GET /api/scrape
  router.get('/api/scrape', async (req, ctx) => {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get('url');
    
    if (!targetUrl) {
      return errorResponse('A url query parameter is required.', 400);
    }
    
    const response = await fetch(targetUrl, {
      headers: { 'User-Agent': 'vartmaan-sarokaar-bot/1.0' },
      redirect: 'follow'
    });
    
    const html = await response.text();
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200000);
    const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '';
    
    return successResponse({ title, text }, 'Website content scraped.');
  });
}

// Main export for Cloudflare Workers
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(origin, env.ALLOWED_ORIGINS)
      });
    }
    
    // Initialize router
    const router = await initRouter(env);
    
    // Route the request
    const response = await router.handle(request, url);
    
    // Add CORS and security headers
    const corsHeaders = getCorsHeaders(origin, env.ALLOWED_ORIGINS);
    for (const [key, value] of Object.entries(corsHeaders)) {
      response.headers.set(key, value);
    }
    addSecurityHeaders(response.headers);
    
    return response;
  }
};

// ExecutionContext interface
interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}
