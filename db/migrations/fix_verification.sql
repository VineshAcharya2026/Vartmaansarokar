-- Fix Verification for all staff
UPDATE users SET is_verified = 1 WHERE role != 'READER';

-- Verify the specific requested staff IDs are correct
UPDATE users SET is_verified = 1, role = 'SUPER_ADMIN' WHERE email = 'superadmin@vartmaansarokar.com';
UPDATE users SET is_verified = 1, role = 'ADMIN' WHERE email = 'admin@vartmaansarokar.com';
UPDATE users SET is_verified = 1, role = 'EDITOR' WHERE email = 'editor@vartmaansarokar.com';

-- Final check of current user table status
SELECT email, role, is_verified FROM users WHERE role != 'READER';
