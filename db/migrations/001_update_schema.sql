-- Migration to update existing schema without dropping data
-- This adds missing tables and columns to the existing D1 database

-- Create news table if it doesn't exist (migrating from articles if needed)
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
  approved_by TEXT,
  approved_at TEXT,
  published_at TEXT,
  date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Migrate data from articles to news if articles exists and news is empty
INSERT OR IGNORE INTO news (id, title, category, excerpt, content, image, author, date, featured, requires_subscription, created_at, updated_at)
SELECT id, title, category, excerpt, content, image, author, date, featured, requires_subscription, created_at, updated_at
FROM articles
WHERE NOT EXISTS (SELECT 1 FROM news WHERE news.id = articles.id);

-- Create new subscriptions table
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
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create ticker_items table
CREATE TABLE IF NOT EXISTS ticker_items (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  link TEXT,
  active INTEGER DEFAULT 1,
  source TEXT DEFAULT 'manual',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Create ticker_settings table
CREATE TABLE IF NOT EXISTS ticker_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  enabled INTEGER DEFAULT 1,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Create article_approvals table
CREATE TABLE IF NOT EXISTS article_approvals (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  submitted_at TEXT DEFAULT (datetime('now')),
  reviewed_by TEXT,
  reviewed_at TEXT,
  status TEXT DEFAULT 'PENDING',
  rejection_reason TEXT,
  FOREIGN KEY (article_id) REFERENCES news(id)
);
