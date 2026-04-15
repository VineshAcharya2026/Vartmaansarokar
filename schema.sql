-- USERS
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'READER',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  google_id TEXT DEFAULT '',
  subscription_plan TEXT DEFAULT 'FREE',
  subscription_status TEXT DEFAULT 'INACTIVE',
  subscription_start TEXT DEFAULT '',
  subscription_end TEXT DEFAULT '',
  payment_verified INTEGER DEFAULT 0,
  payment_screenshot_url TEXT DEFAULT '',
  is_verified INTEGER DEFAULT 0,
  verification_token TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- NEWS/ARTICLES
CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  excerpt TEXT DEFAULT '',
  content TEXT DEFAULT '',
  image TEXT DEFAULT '',
  author TEXT DEFAULT '',
  author_id TEXT DEFAULT '',
  featured INTEGER DEFAULT 0,
  requires_subscription INTEGER DEFAULT 0,
  status TEXT DEFAULT 'DRAFT',
  rejection_reason TEXT DEFAULT '',
  approved_by_admin TEXT DEFAULT '',
  approved_by_super TEXT DEFAULT '',
  admin_approved_at TEXT DEFAULT '',
  super_approved_at TEXT DEFAULT '',
  published_at TEXT DEFAULT '',
  date TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- MAGAZINES
CREATE TABLE IF NOT EXISTS magazines (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  issue_number TEXT DEFAULT '',
  cover_image TEXT DEFAULT '',
  pdf_url TEXT DEFAULT '',
  pdf_r2_key TEXT DEFAULT '',
  pages TEXT DEFAULT '[]',
  page_images TEXT DEFAULT '[]',
  price_digital REAL DEFAULT 0,
  price_physical REAL DEFAULT 499,
  gated_page INTEGER DEFAULT 2,
  is_free INTEGER DEFAULT 0,
  blur_paywall INTEGER DEFAULT 0,
  status TEXT DEFAULT 'DRAFT',
  date TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- MEDIA FILES
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT DEFAULT '',
  url TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  kind TEXT DEFAULT 'image',
  size INTEGER DEFAULT 0,
  mime_type TEXT DEFAULT '',
  uploaded_by TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

-- ADS
CREATE TABLE IF NOT EXISTS ads (
  id TEXT PRIMARY KEY,
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  redirect_url TEXT DEFAULT '',
  link TEXT DEFAULT '',
  position TEXT DEFAULT 'SIDEBAR_TOP',
  status TEXT DEFAULT 'ACTIVE',
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT DEFAULT '',
  user_email TEXT DEFAULT '',
  user_phone TEXT DEFAULT '',
  plan TEXT NOT NULL,
  sub_type TEXT DEFAULT 'DIGITAL',
  amount REAL DEFAULT 0,
  payment_method TEXT DEFAULT 'UPI',
  payment_screenshot_url TEXT DEFAULT '',
  payment_r2_key TEXT DEFAULT '',
  payment_verified INTEGER DEFAULT 0,
  verified_by TEXT DEFAULT '',
  verified_at TEXT DEFAULT '',
  rejection_reason TEXT DEFAULT '',
  status TEXT DEFAULT 'PENDING',
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  shipping_address TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

-- ARTICLE APPROVALS
CREATE TABLE IF NOT EXISTS article_approvals (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  submitted_at TEXT DEFAULT (datetime('now')),
  admin_status TEXT DEFAULT 'PENDING',
  admin_reviewed_by TEXT DEFAULT '',
  admin_reviewed_at TEXT DEFAULT '',
  super_status TEXT DEFAULT 'PENDING',
  super_reviewed_by TEXT DEFAULT '',
  super_reviewed_at TEXT DEFAULT '',
  rejection_reason TEXT DEFAULT '',
  final_status TEXT DEFAULT 'PENDING'
);

-- TICKER
CREATE TABLE IF NOT EXISTS ticker_items (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  link TEXT DEFAULT '',
  active INTEGER DEFAULT 1,
  source TEXT DEFAULT 'manual',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ticker_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  enabled INTEGER DEFAULT 1,
  updated_at TEXT DEFAULT (datetime('now'))
);


-- MEDIA LIBRARY
CREATE TABLE IF NOT EXISTS media_files (
  id TEXT PRIMARY KEY,
  original_name TEXT,
  stored_name TEXT,
  url TEXT,
  kind TEXT,
  mime_type TEXT,
  size INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);
-- SITE SETTINGS
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  site_name TEXT DEFAULT 'Vartmaan Sarokaar',
  org_name TEXT DEFAULT 'Vinesh Acharya Foundation',
  twitter_link TEXT DEFAULT '',
  instagram_link TEXT DEFAULT '',
  facebook_link TEXT DEFAULT '',
  updated_at TEXT DEFAULT (datetime('now'))
);

-- HERO SECTION
CREATE TABLE IF NOT EXISTS hero_section (
  id TEXT PRIMARY KEY DEFAULT 'global',
  headline TEXT DEFAULT 'Investigating The Truth.',
  subtitle TEXT DEFAULT 'Premium independent journalism from the heart of India.',
  bg_image TEXT DEFAULT '',
  updated_at TEXT DEFAULT (datetime('now'))
);
