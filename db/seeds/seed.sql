-- RESET STAFF USERS
DELETE FROM users WHERE email IN (
  'superadmin@vartmaansarokar.com',
  'admin@vartmaansarokar.com',
  'editor@vartmaansarokar.com'
);

INSERT INTO users 
(id, email, password_hash, name, role, created_at, updated_at)
VALUES 
(
  'user-super-001',
  'superadmin@vartmaansarokar.com',
  '$2b$10$.6QyepYWk2YJn7I9Zd/LG.CkLwhSJ5Rd.oH98qLcl6.hTLmcl9Lci',
  'Super Admin',
  'SUPER_ADMIN',
  datetime('now'),
  datetime('now')
),
(
  'user-admin-001', 
  'admin@vartmaansarokar.com',
  '$2b$10$.6QyepYWk2YJn7I9Zd/LG.CkLwhSJ5Rd.oH98qLcl6.hTLmcl9Lci',
  'Admin',
  'ADMIN',
  datetime('now'),
  datetime('now')
),
(
  'user-editor-001',
  'editor@vartmaansarokar.com',
  '$2b$10$.6QyepYWk2YJn7I9Zd/LG.CkLwhSJ5Rd.oH98qLcl6.hTLmcl9Lci',
  'Editor',
  'EDITOR',
  datetime('now'),
  datetime('now')
);
