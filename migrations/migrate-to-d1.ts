#!/usr/bin/env node

/**
 * Migration script to convert from file-based JSON storage to Cloudflare D1
 * Run with: npx tsx migrations/migrate-to-d1.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'server', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface PersistedDatabase {
  users: any[];
  articles: any[];
  magazines: any[];
  ads: any[];
  media: any[];
  subscriptionRequests: any[];
}

function loadJsonData(): PersistedDatabase {
  try {
    const content = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(content) as PersistedDatabase;
  } catch (error) {
    console.error('Failed to load JSON data:', error);
    process.exit(1);
  }
}

function generateSqlInserts(data: PersistedDatabase): string {
  const inserts: string[] = [];

  // Users
  data.users.forEach(user => {
    const values = [
      `'${user.id}'`,
      `'${user.email}'`,
      `'${user.name.replace(/'/g, "''")}'`,
      `'${user.role}'`,
      `'${user.authProvider || 'PASSWORD'}'`,
      user.googleId ? `'${user.googleId}'` : 'NULL',
      user.avatarUrl ? `'${user.avatarUrl}'` : 'NULL',
      user.passwordHash ? `'${user.passwordHash}'` : 'NULL',
      user.subscription?.type ? `'${user.subscription.type}'` : 'NULL',
      user.subscription?.status ? `'${user.subscription.status}'` : 'NULL',
      user.subscription?.expiryDate ? `'${user.subscription.expiryDate}'` : 'NULL',
      `'${user.createdAt || new Date().toISOString()}'`,
      `'${user.updatedAt || new Date().toISOString()}'`
    ];
    inserts.push(`INSERT INTO users (id, email, name, role, auth_provider, google_id, avatar_url, password_hash, subscription_type, subscription_status, subscription_expiry_date, created_at, updated_at) VALUES (${values.join(', ')});`);
  });

  // Articles
  data.articles.forEach(article => {
    const values = [
      `'${article.id}'`,
      `'${article.title.replace(/'/g, "''")}'`,
      `'${article.category}'`,
      `'${article.excerpt.replace(/'/g, "''")}'`,
      `'${article.content.replace(/'/g, "''")}'`,
      `'${article.image}'`,
      `'${article.author.replace(/'/g, "''")}'`,
      `'${article.date}'`,
      article.featured ? 1 : 0,
      article.requiresSubscription ? 1 : 0,
      `'${article.createdAt || new Date().toISOString()}'`,
      `'${article.updatedAt || new Date().toISOString()}'`
    ];
    inserts.push(`INSERT INTO articles (id, title, category, excerpt, content, image, author, date, featured, requires_subscription, created_at, updated_at) VALUES (${values.join(', ')});`);
  });

  // Magazines
  data.magazines.forEach(magazine => {
    const values = [
      `'${magazine.id}'`,
      `'${magazine.title.replace(/'/g, "''")}'`,
      `'${magazine.issueNumber}'`,
      `'${magazine.coverImage}'`,
      magazine.pdfUrl ? `'${magazine.pdfUrl}'` : 'NULL',
      `'${JSON.stringify(magazine.pages)}'`,
      `'${magazine.date}'`,
      magazine.priceDigital || 0,
      magazine.pricePhysical || 499,
      magazine.isFree ? 1 : 0,
      magazine.gatedPage || 2,
      magazine.blurPaywall !== false ? 1 : 0,
      `'${magazine.createdAt || new Date().toISOString()}'`,
      `'${magazine.updatedAt || new Date().toISOString()}'`
    ];
    inserts.push(`INSERT INTO magazines (id, title, issue_number, cover_image, pdf_url, pages, date, price_digital, price_physical, is_free, gated_page, blur_paywall, created_at, updated_at) VALUES (${values.join(', ')});`);
  });

  // Ads
  data.ads.forEach(ad => {
    const values = [
      `'${ad.id}'`,
      `'${ad.title.replace(/'/g, "''")}'`,
      `'${ad.imageUrl}'`,
      `'${ad.link}'`,
      `'${ad.position}'`,
      ad.description ? `'${ad.description.replace(/'/g, "''")}'` : 'NULL',
      ad.ctaText ? `'${ad.ctaText.replace(/'/g, "''")}'` : 'NULL',
      `'${ad.createdAt || new Date().toISOString()}'`,
      `'${ad.updatedAt || new Date().toISOString()}'`
    ];
    inserts.push(`INSERT INTO ads (id, title, image_url, link, position, description, cta_text, created_at, updated_at) VALUES (${values.join(', ')});`);
  });

  // Media
  data.media.forEach(media => {
    const values = [
      `'${media.id}'`,
      `'${media.originalName.replace(/'/g, "''")}'`,
      `'${media.storedName}'`,
      `'${media.url}'`,
      `'${media.kind}'`,
      `'${media.mimeType}'`,
      media.size,
      `'${media.createdAt || new Date().toISOString()}'`
    ];
    inserts.push(`INSERT INTO media (id, original_name, stored_name, url, kind, mime_type, size, created_at) VALUES (${values.join(', ')});`);
  });

  // Subscription Requests
  data.subscriptionRequests.forEach(request => {
    const values = [
      `'${request.id}'`,
      `'${request.name.replace(/'/g, "''")}'`,
      `'${request.email}'`,
      `'${request.phone}'`,
      `'${request.accessType}'`,
      `'${request.resourceType}'`,
      `'${request.resourceId}'`,
      `'${request.resourceTitle.replace(/'/g, "''")}'`,
      request.message ? `'${request.message.replace(/'/g, "''")}'` : 'NULL',
      `'${request.status}'`,
      request.screenshotName ? `'${request.screenshotName}'` : 'NULL',
      request.screenshotData ? `'${request.screenshotData}'` : 'NULL',
      `'${request.createdAt || new Date().toISOString()}'`,
      `'${request.updatedAt || new Date().toISOString()}'`
    ];
    inserts.push(`INSERT INTO subscription_requests (id, name, email, phone, access_type, resource_type, resource_id, resource_title, message, status, screenshot_name, screenshot_data, created_at, updated_at) VALUES (${values.join(', ')});`);
  });

  return inserts.join('\n');
}

function main() {
  console.log('Loading JSON data...');
  const data = loadJsonData();

  console.log('Generating SQL migration script...');
  const sql = generateSqlInserts(data);

  const migrationFile = path.join(__dirname, '..', 'migrate-data.sql');
  fs.writeFileSync(migrationFile, sql);

  console.log(`Migration SQL generated: ${migrationFile}`);
  console.log(`Found ${data.users.length} users, ${data.articles.length} articles, ${data.magazines.length} magazines, ${data.ads.length} ads, ${data.media.length} media files, ${data.subscriptionRequests.length} subscription requests`);

  console.log('\nTo apply this migration to D1:');
  console.log('1. Create your D1 database: wrangler d1 create vartmaansarokar-db');
  console.log('2. Apply schema: wrangler d1 execute vartmaansarokar-db --file=schema.sql');
  console.log('3. Apply data: wrangler d1 execute vartmaansarokar-db --file=migrate-data.sql');
}

main();