-- Cloudflare D1 Schema for Vartmaan Sarokaar
-- This schema replaces the file-based JSON storage

-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'GENERAL',
  auth_provider TEXT NOT NULL DEFAULT 'PASSWORD',
  google_id TEXT,
  avatar_url TEXT,
  password_hash TEXT,
  subscription_type TEXT,
  subscription_status TEXT,
  subscription_expiry_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Articles/News table
CREATE TABLE articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  image TEXT NOT NULL,
  author TEXT NOT NULL,
  date TEXT NOT NULL,
  featured INTEGER DEFAULT 0,
  requires_subscription INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Magazines table
CREATE TABLE magazines (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  issue_number TEXT NOT NULL,
  cover_image TEXT NOT NULL,
  pdf_url TEXT,
  pages TEXT NOT NULL, -- JSON array as text
  date TEXT NOT NULL,
  price_digital REAL DEFAULT 0,
  price_physical REAL DEFAULT 499,
  is_free INTEGER DEFAULT 0,
  gated_page INTEGER DEFAULT 2,
  blur_paywall INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Ads table
CREATE TABLE ads (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link TEXT NOT NULL,
  position TEXT NOT NULL,
  description TEXT,
  cta_text TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Media files table
CREATE TABLE media (
  id TEXT PRIMARY KEY,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  url TEXT NOT NULL,
  kind TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Subscription requests table
CREATE TABLE subscription_requests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  access_type TEXT NOT NULL, -- 'DIGITAL' or 'PHYSICAL'
  resource_type TEXT NOT NULL, -- 'MAGAZINE' or 'NEWS'
  resource_id TEXT NOT NULL,
  resource_title TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  screenshot_name TEXT,
  screenshot_data TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_featured ON articles(featured);
CREATE INDEX idx_articles_date ON articles(date DESC);
CREATE INDEX idx_magazines_date ON magazines(date DESC);
CREATE INDEX idx_ads_position ON ads(position);
CREATE INDEX idx_media_kind ON media(kind);
CREATE INDEX idx_subscription_requests_status ON subscription_requests(status);
CREATE INDEX idx_subscription_requests_email ON subscription_requests(email);

-- Insert default system users (passwords should be hashed)
-- Note: In production, use proper password hashing
INSERT INTO users (id, email, name, role, auth_provider, password_hash) VALUES
('user_super_admin', 'superadmin@vartmaansarokar.com', 'Super Admin', 'SUPER_ADMIN', 'PASSWORD', '$2a$10$hashed_password_here'),
('user_admin', 'admin@vartmaansarokar.com', 'Admin', 'ADMIN', 'PASSWORD', '$2a$10$hashed_password_here'),
('user_editor', 'editor@vartmaansarokar.com', 'Editor', 'MAGAZINE', 'PASSWORD', '$2a$10$hashed_password_here');