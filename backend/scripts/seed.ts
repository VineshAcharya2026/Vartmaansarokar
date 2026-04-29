import bcrypt from 'bcryptjs';
import { sharedStore as store } from '../server/store.js';
import { MagazineIssue, UserRole } from '../../vartmaan-shared-types.js';

const DEFAULT_ACCOUNTS = [
  { email: 'editor@cms.com', name: 'Editor', role: UserRole.EDITOR, password: 'Editor@1234' },
  { email: 'admin@cms.com', name: 'Admin', role: UserRole.ADMIN, password: 'Admin@1234' },
  { email: 'superadmin@cms.com', name: 'Super Admin', role: UserRole.SUPER_ADMIN, password: 'SuperAdmin@1234' }
] as const;

const SEEDED_MAGAZINES: MagazineIssue[] = [
  {
    id: 'seed-magazine-1',
    title: 'City Futures Annual',
    issueNumber: 'Volume 2 • Issue 1',
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=600&fit=crop',
    pages: [
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1462899006636-339e08d1844e?w=800&h=1200&fit=crop'
    ],
    date: '2026-05-01',
    priceDigital: 99,
    pricePhysical: 499,
    isFree: false,
    gatedPage: 2,
    blurPaywall: true,
    status: 'APPROVED'
  },
  {
    id: 'seed-magazine-2',
    title: 'Democracy & Society Review',
    issueNumber: 'Volume 2 • Issue 2',
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=600&fit=crop',
    pages: [
      'https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?w=800&h=1200&fit=crop'
    ],
    date: '2026-04-01',
    priceDigital: 79,
    pricePhysical: 449,
    isFree: false,
    gatedPage: 2,
    blurPaywall: true,
    status: 'APPROVED'
  },
  {
    id: 'seed-magazine-3',
    title: 'India Innovation Dispatch',
    issueNumber: 'Volume 2 • Issue 3',
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=600&fit=crop',
    pages: [
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=1200&fit=crop'
    ],
    date: '2026-03-01',
    priceDigital: 0,
    pricePhysical: 399,
    isFree: true,
    gatedPage: 5,
    blurPaywall: false,
    status: 'APPROVED'
  },
  {
    id: 'seed-magazine-4',
    title: 'Ground Report Special',
    issueNumber: 'Volume 2 • Issue 4',
    coverImage: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&h=600&fit=crop',
    pages: [
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&h=1200&fit=crop'
    ],
    date: '2026-02-01',
    priceDigital: 119,
    pricePhysical: 519,
    isFree: false,
    gatedPage: 2,
    blurPaywall: true,
    status: 'APPROVED'
  },
  {
    id: 'seed-magazine-5',
    title: 'People, Culture, Nation',
    issueNumber: 'Volume 2 • Issue 5',
    coverImage: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=600&fit=crop',
    pages: [
      'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=1200&fit=crop'
    ],
    date: '2026-01-01',
    priceDigital: 89,
    pricePhysical: 429,
    isFree: false,
    gatedPage: 2,
    blurPaywall: true,
    status: 'APPROVED'
  }
];

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

  const existingMagazines = store.listMagazines();
  for (const magazine of existingMagazines) {
    if (magazine.id.startsWith('seed-magazine-')) {
      await store.deleteMagazine(magazine.id);
    }
  }

  for (const magazine of SEEDED_MAGAZINES) {
    await store.createMagazine(magazine);
  }

  console.log('Seeded accounts:');
  for (const account of DEFAULT_ACCOUNTS) {
    console.log(`- ${account.email} (${account.role})`);
  }
  console.log(`Seeded magazines: ${SEEDED_MAGAZINES.length}`);
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
