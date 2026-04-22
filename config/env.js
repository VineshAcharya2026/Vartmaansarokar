/**
 * Node-only Cloudflare env validation. Do not import from Vite / browser code.
 * Loads root `.env` when this module is first imported.
 */
import { config } from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

let loaded = false;

/**
 * Idempotent: loads `.env` from the project root (next to `package.json`).
 */
export function loadRootEnv() {
  if (loaded) return;
  const result = config({ path: join(projectRoot, '.env') });
  if (result.error) {
    throw new Error(`Failed to load .env: ${result.error.message}`);
  }
  loaded = true;
}

/**
 * @param {string} name
 * @returns {string}
 */
function requiredNonEmpty(name) {
  const v = process.env[name];
  if (v === undefined || String(v).trim() === '') {
    throw new Error(
      `Missing or empty required environment variable: ${name}. ` +
        'Set it in your local .env (see .env.example) or GitHub Actions secrets for CI.'
    );
  }
  return String(v).trim();
}

/**
 * Returns validated Cloudflare-related variables for scripts and tooling.
 * Call after `loadRootEnv()` (or import this module, which auto-loads once).
 * @returns {{
 *   cloudflareAccountId: string
 *   cloudflareApiToken: string
 *   d1DatabaseId: string
 * }}
 */
export function getCloudflareEnv() {
  loadRootEnv();
  return {
    cloudflareAccountId: requiredNonEmpty('CLOUDFLARE_ACCOUNT_ID'),
    cloudflareApiToken: requiredNonEmpty('CLOUDFLARE_API_TOKEN'),
    d1DatabaseId: requiredNonEmpty('D1_DATABASE_ID')
  };
}

loadRootEnv();
