import bcrypt from 'bcryptjs';
import { sharedStore as store } from '../server/store.js';
import { UserRole } from '../types.js';

const DEFAULT_ACCOUNTS = [
  { email: 'editor@cms.com', name: 'Editor', role: UserRole.EDITOR, password: 'Editor@1234' },
  { email: 'admin@cms.com', name: 'Admin', role: UserRole.ADMIN, password: 'Admin@1234' },
  { email: 'superadmin@cms.com', name: 'Super Admin', role: UserRole.SUPER_ADMIN, password: 'SuperAdmin@1234' }
] as const;

async function main() {
  await store.init();

  for (const account of DEFAULT_ACCOUNTS) {
    const existing = store.findUserByEmail(account.email);
    const passwordHash = await bcrypt.hash(account.password, 10);

    if (existing) {
      await store.updateUser(existing.id, {
        name: account.name,
        role: account.role,
        isActive: true,
        authProvider: 'PASSWORD',
        passwordHash
      });
    } else {
      await store.createUser({
        email: account.email,
        name: account.name,
        role: account.role,
        authProvider: 'PASSWORD',
        passwordHash
      });
    }
  }

  console.log('Seeded accounts:');
  for (const account of DEFAULT_ACCOUNTS) {
    console.log(`- ${account.email} (${account.role})`);
  }
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
