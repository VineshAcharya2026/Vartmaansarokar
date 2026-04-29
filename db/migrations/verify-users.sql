-- Add verification fields to users table
ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN verification_token TEXT;
ALTER TABLE users ADD COLUMN verification_expires TEXT;

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
