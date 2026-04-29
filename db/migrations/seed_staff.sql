-- Seed Default Staff Accounts (Updated with user requested credentials)
-- PassworD@2026 : $2b$10$Q01jEY52gbmWUJDVoU5glO/zNTJsXFxIGlgLZHB9sOq8gNp69PXsC

INSERT OR IGNORE INTO users (id, email, password_hash, name, role, is_verified) 
VALUES ('staff-seed-sa-v2', 'superadmin@vartmaansarokar.com', '$2b$10$Q01jEY52gbmWUJDVoU5glO/zNTJsXFxIGlgLZHB9sOq8gNp69PXsC', 'Super Admin', 'SUPER_ADMIN', 1);

INSERT OR IGNORE INTO users (id, email, password_hash, name, role, is_verified) 
VALUES ('staff-seed-ad-v2', 'admin@vartmaansarokar.com', '$2b$10$Q01jEY52gbmWUJDVoU5glO/zNTJsXFxIGlgLZHB9sOq8gNp69PXsC', 'Admin User', 'ADMIN', 1);

INSERT OR IGNORE INTO users (id, email, password_hash, name, role, is_verified) 
VALUES ('staff-seed-ed-v2', 'editor@vartmaansarokar.com', '$2b$10$Q01jEY52gbmWUJDVoU5glO/zNTJsXFxIGlgLZHB9sOq8gNp69PXsC', 'Editor User', 'EDITOR', 1);

-- Ensure Vinesh's admin email is also seeded as Super Admin for Google Login bypass/backup
INSERT OR IGNORE INTO users (id, email, name, role, is_verified) 
VALUES ('staff-seed-vinesh', 'vineshjm@gmail.com', 'Vinesh Acharya', 'SUPER_ADMIN', 1);
