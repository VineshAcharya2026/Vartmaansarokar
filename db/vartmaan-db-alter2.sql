ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'PASSWORD';
ALTER TABLE users ADD COLUMN subscription_type TEXT;
ALTER TABLE users ADD COLUMN subscription_expiry_date TEXT;
ALTER TABLE news ADD COLUMN date TEXT;
ALTER TABLE media ADD COLUMN stored_name TEXT;
