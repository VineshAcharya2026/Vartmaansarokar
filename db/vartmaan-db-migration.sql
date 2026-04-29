-- Migration: Add missing columns to existing users table
-- SQLite ALTER TABLE ADD COLUMN requires constant defaults only
ALTER TABLE users ADD COLUMN subscription_start TEXT;
ALTER TABLE users ADD COLUMN subscription_end TEXT;
ALTER TABLE users ADD COLUMN google_id TEXT;
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN updated_at TEXT;

-- Articles/News table with complete approval flow columns
CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  excerpt TEXT,
  content TEXT,
  image TEXT,
  author TEXT,
  author_id TEXT,
  featured INTEGER DEFAULT 0,
  requires_subscription INTEGER DEFAULT 0,
  status TEXT DEFAULT 'DRAFT',
  approved_by_admin TEXT,
  admin_approved_at TEXT,
  approved_by_super TEXT,
  super_approved_at TEXT,
  rejection_reason TEXT,
  rejected_by TEXT,
  rejected_at TEXT,
  published_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Magazines table
CREATE TABLE IF NOT EXISTS magazines (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  issue_number TEXT,
  cover_image TEXT,
  pdf_url TEXT,
  pages TEXT DEFAULT '[]',
  price_digital REAL DEFAULT 0,
  price_physical REAL DEFAULT 499,
  gated_page INTEGER DEFAULT 2,
  is_free INTEGER DEFAULT 0,
  blur_paywall INTEGER DEFAULT 0,
  status TEXT DEFAULT 'DRAFT',
  date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Ads table
CREATE TABLE IF NOT EXISTS ads (
  id TEXT PRIMARY KEY,
  title TEXT,
  image_url TEXT,
  link TEXT,
  position TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Media files table
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT,
  url TEXT NOT NULL,
  kind TEXT DEFAULT 'image',
  size INTEGER,
  mime_type TEXT,
  uploaded_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan TEXT NOT NULL,
  amount REAL,
  payment_method TEXT,
  payment_screenshot_url TEXT,
  payment_verified INTEGER DEFAULT 0,
  verified_by TEXT,
  verified_at TEXT,
  status TEXT DEFAULT 'PENDING',
  start_date TEXT,
  end_date TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Ticker items table
CREATE TABLE IF NOT EXISTS ticker_items (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  link TEXT,
  active INTEGER DEFAULT 1,
  source TEXT DEFAULT 'manual',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Ticker settings table
CREATE TABLE IF NOT EXISTS ticker_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  enabled INTEGER DEFAULT 1,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Article approvals tracking table
CREATE TABLE IF NOT EXISTS article_approvals (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  submitted_at TEXT DEFAULT (datetime('now')),
  admin_reviewed_by TEXT,
  admin_reviewed_at TEXT,
  admin_status TEXT DEFAULT 'PENDING',
  super_reviewed_by TEXT,
  super_reviewed_at TEXT,
  super_status TEXT DEFAULT 'PENDING',
  rejection_reason TEXT,
  final_status TEXT DEFAULT 'PENDING'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
CREATE INDEX IF NOT EXISTS idx_news_featured ON news(featured);
CREATE INDEX IF NOT EXISTS idx_news_status ON news(status);
CREATE INDEX IF NOT EXISTS idx_news_author_id ON news(author_id);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_magazines_date ON magazines(date DESC);
CREATE INDEX IF NOT EXISTS idx_magazines_status ON magazines(status);
CREATE INDEX IF NOT EXISTS idx_ads_position ON ads(position);
CREATE INDEX IF NOT EXISTS idx_media_kind ON media(kind);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_ticker_items_active ON ticker_items(active);
CREATE INDEX IF NOT EXISTS idx_article_approvals_article_id ON article_approvals(article_id);
CREATE INDEX IF NOT EXISTS idx_article_approvals_status ON article_approvals(final_status);

-- Seed users (password: PassworD@2026)
INSERT OR IGNORE INTO users (id, email, password_hash, name, role, subscription_plan, subscription_status) VALUES
('user-superadmin-001', 'superadmin@vartmaansarokar.com', '$2a$10$YourHashHere', 'Super Admin', 'SUPER_ADMIN', 'DIGITAL', 'ACTIVE'),
('user-admin-001', 'admin@vartmaansarokar.com', '$2a$10$YourHashHere', 'Admin User', 'ADMIN', 'DIGITAL', 'ACTIVE'),
('user-editor-001', 'editor@vartmaansarokar.com', '$2a$10$YourHashHere', 'Editor User', 'EDITOR', 'DIGITAL', 'ACTIVE');
