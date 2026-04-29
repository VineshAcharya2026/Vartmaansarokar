-- Production Synchronization Script for Vartmaan Sarokar
-- Use this to ensure your Cloudflare D1 database has all necessary columns

-- 1. Ensure User Verification columns exist
-- Note: D1 might error if columns exist, but this establishes the required state.
ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN verification_token TEXT DEFAULT '';

-- 2. Ensure News Rejection tracking exists
ALTER TABLE news ADD COLUMN rejection_reason TEXT DEFAULT '';

-- 3. Ensure Subscriptions tracking has notes
ALTER TABLE subscriptions ADD COLUMN notes TEXT DEFAULT '';

-- 4. Verify Admin Seed (Safe to ignore if already exists)
-- This ensures vineshjm@gmail.com is present to allow first login
INSERT OR IGNORE INTO users (id, email, name, role, is_verified) 
VALUES ('seed-admin-1', 'vineshjm@gmail.com', 'Vinesh Acharya', 'SUPER_ADMIN', 1);

INSERT OR IGNORE INTO users (id, email, name, role, is_verified) 
VALUES ('seed-admin-2', 'admin@vartmaansarokar.com', 'Admin VS', 'ADMIN', 1);

-- 5. Fix any legacy status issues
UPDATE news SET status = 'PUBLISHED' WHERE status IS NULL;
UPDATE users SET role = 'READER' WHERE role IS NULL;
