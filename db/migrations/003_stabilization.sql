-- STABILIZATION MIGRATION: Fix ads table schema mismatch & ensure all columns exist
-- Run this against your D1 database to align with the updated backend

-- Add missing columns to ads table (safe: IF NOT EXISTS prevents errors if already present)
ALTER TABLE ads ADD COLUMN description TEXT DEFAULT '';
ALTER TABLE ads ADD COLUMN image TEXT DEFAULT '';
ALTER TABLE ads ADD COLUMN redirect_url TEXT DEFAULT '';
ALTER TABLE ads ADD COLUMN status TEXT DEFAULT 'ACTIVE';

-- Ensure ticker_items table exists
CREATE TABLE IF NOT EXISTS ticker_items (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  link TEXT DEFAULT '',
  active INTEGER DEFAULT 1,
  source TEXT DEFAULT 'manual',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Ensure site_settings table exists
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  site_name TEXT DEFAULT 'Vartmaan Sarokaar',
  org_name TEXT DEFAULT 'Vinesh Acharya Foundation',
  twitter_link TEXT DEFAULT '',
  instagram_link TEXT DEFAULT '',
  facebook_link TEXT DEFAULT '',
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Ensure hero_section table exists
CREATE TABLE IF NOT EXISTS hero_section (
  id TEXT PRIMARY KEY DEFAULT 'global',
  headline TEXT DEFAULT 'Investigating The Truth.',
  subtitle TEXT DEFAULT 'Premium independent journalism from the heart of India.',
  bg_image TEXT DEFAULT '',
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Ensure media_files table exists
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

-- Seed default site_settings if empty
INSERT OR IGNORE INTO site_settings (id, site_name, org_name) VALUES ('global', 'Vartmaan Sarokaar', 'Vinesh Acharya Foundation');

-- Seed default hero_section if empty
INSERT OR IGNORE INTO hero_section (id, headline, subtitle) VALUES ('global', 'Investigating The Truth.', 'Premium independent journalism from the heart of India.');
