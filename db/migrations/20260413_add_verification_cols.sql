-- Migration: Add verification columns to users table
ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN verification_token TEXT DEFAULT '';
