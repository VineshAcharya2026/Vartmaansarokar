-- Reset schema - drop and recreate tables
DROP TABLE IF EXISTS article_approvals;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS ticker_items;
DROP TABLE IF EXISTS ticker_settings;
DROP TABLE IF EXISTS media;
DROP TABLE IF EXISTS ads;
DROP TABLE IF EXISTS magazines;
DROP TABLE IF EXISTS news;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT,
  role TEXT DEFAULT 'READER',
  phone TEXT,
  address TEXT,
  subscription_plan TEXT DEFAULT 'FREE',
  subscription_status TEXT DEFAULT 'INACTIVE',
  payment_screenshot_url TEXT,
  payment_verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE news (
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
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE magazines (
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
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE media (
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

CREATE TABLE ads (
  id TEXT PRIMARY KEY,
  title TEXT,
  image_url TEXT,
  link TEXT,
  position TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE subscriptions (
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

CREATE TABLE ticker_items (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  link TEXT,
  active INTEGER DEFAULT 1,
  source TEXT DEFAULT 'manual',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE ticker_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  enabled INTEGER DEFAULT 1,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE article_approvals (
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

-- Seed users with bcrypt hash of 'PassworD@2026'
INSERT INTO users (id, email, password_hash, name, role) VALUES
('user-superadmin-001', 'superadmin@vartmaansarokar.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Super Admin', 'SUPER_ADMIN'),
('user-admin-001', 'admin@vartmaansarokar.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User', 'ADMIN'),
('user-editor-001', 'editor@vartmaansarokar.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Editor User', 'EDITOR');
