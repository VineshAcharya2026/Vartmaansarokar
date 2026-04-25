import type { AdItem, MagazineItem, NewsItem, SubscriptionTableRow, User } from '../types';

function num01(v: unknown): boolean {
  return v === 1 || v === true || v === '1';
}

function parsePages(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string') {
    try {
      const p = JSON.parse(val) as unknown;
      return Array.isArray(p) ? p.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Unwrap public/staff article list responses from Worker, Express, or odd proxies.
 * Handles: raw array, { news }, { articles }, or one nested { data: { news } }.
 */
export function extractNewsListPayload(resp: unknown): Record<string, unknown>[] {
  if (Array.isArray(resp)) return resp as Record<string, unknown>[];
  if (!resp || typeof resp !== 'object') return [];
  const o = resp as Record<string, unknown>;
  if (Array.isArray(o.news)) return o.news as Record<string, unknown>[];
  if (Array.isArray(o.articles)) return o.articles as Record<string, unknown>[];
  if (Array.isArray(o.items)) return o.items as Record<string, unknown>[];
  if (Array.isArray(o.data)) return o.data as Record<string, unknown>[];
  const inner = o.data;
  if (inner && typeof inner === 'object') {
    if (Array.isArray(inner)) return inner as Record<string, unknown>[];
    const d = inner as Record<string, unknown>;
    if (Array.isArray(d.news)) return d.news as Record<string, unknown>[];
    if (Array.isArray(d.articles)) return d.articles as Record<string, unknown>[];
    if (Array.isArray(d.items)) return d.items as Record<string, unknown>[];
    if (Array.isArray(d.data)) return d.data as Record<string, unknown>[];
  }
  return [];
}

/** Normalize D1 `news` row for React (camelCase + booleans). */
export function mapNewsRow(row: Record<string, unknown>): NewsItem {
  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    category: String(row.category ?? ''),
    excerpt: String(row.excerpt ?? ''),
    content: String(row.content ?? ''),
    image: String(row.image ?? ''),
    author: String(row.author ?? ''),
    author_id: row.author_id != null ? String(row.author_id) : undefined,
    date: String(row.date ?? row.created_at ?? ''),
    featured: num01(row.featured),
    requiresSubscription: num01(row.requires_subscription ?? row.requiresSubscription),
    status: row.status as NewsItem['status'],
    published_at: row.published_at != null ? String(row.published_at) : undefined,
    rejectionReason:
      row.rejection_reason != null
        ? String(row.rejection_reason)
        : row.rejectionReason != null
          ? String(row.rejectionReason)
          : undefined,
    createdAt: row.created_at != null ? String(row.created_at) : undefined,
    updatedAt: row.updated_at != null ? String(row.updated_at) : undefined
  };
}

/** Normalize D1 `magazines` row for React. */
export function mapMagazineRow(row: Record<string, unknown>): MagazineItem {
  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    issueNumber: String(row.issue_number ?? row.issueNumber ?? ''),
    coverImage: String(row.cover_image ?? row.coverImage ?? ''),
    pdfUrl:
      row.pdf_url != null
        ? String(row.pdf_url)
        : row.pdfUrl != null
          ? String(row.pdfUrl)
          : undefined,
    pages: parsePages(row.pages),
    date: String(row.date ?? ''),
    priceDigital: Number(row.price_digital ?? row.priceDigital ?? 0) || 0,
    pricePhysical: Number(row.price_physical ?? row.pricePhysical ?? 0) || 0,
    isFree: num01(row.is_free),
    gatedPage: row.gated_page != null ? Number(row.gated_page) : undefined,
    blurPaywall: num01(row.blur_paywall ?? row.blurPaywall),
    status: row.status as MagazineItem['status'],
    createdAt: row.created_at != null ? String(row.created_at) : undefined,
    updatedAt: row.updated_at != null ? String(row.updated_at) : undefined
  };
}

/** Normalize D1 `users` row; maps `payment_screenshot_url` to `payment_proof` for UI. */
export function mapUserRow(row: Record<string, unknown>): User {
  const proof = String(row.payment_screenshot_url ?? row.payment_proof ?? '');
  return {
    id: String(row.id ?? ''),
    email: String(row.email ?? ''),
    name: String(row.name ?? ''),
    role: String(row.role ?? 'READER')
      .trim()
      .toUpperCase() as User['role'],
    phone: row.phone != null ? String(row.phone) : undefined,
    address: row.address != null ? String(row.address) : undefined,
    subscription_plan: row.subscription_plan != null ? String(row.subscription_plan) : undefined,
    subscription_status: row.subscription_status != null ? String(row.subscription_status) : undefined,
    payment_proof: proof || undefined,
    createdAt: row.created_at != null ? String(row.created_at) : undefined,
    updatedAt: row.updated_at != null ? String(row.updated_at) : undefined
  };
}

export function mapAdRow(row: Record<string, unknown>): AdItem {
  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    description: row.description != null ? String(row.description) : undefined,
    image: row.image != null ? String(row.image) : row.image_url != null ? String(row.image_url) : undefined,
    imageUrl: row.image_url != null ? String(row.image_url) : undefined,
    redirect_url: row.redirect_url != null ? String(row.redirect_url) : undefined,
    link: row.link != null ? String(row.link) : undefined,
    position: row.position != null ? String(row.position) : undefined,
    status: row.status != null ? String(row.status) : undefined,
    created_at: row.created_at != null ? String(row.created_at) : undefined
  };
}

export function mapSubscriptionRow(row: Record<string, unknown>): SubscriptionTableRow {
  return {
    id: String(row.id ?? ''),
    user_id: String(row.user_id ?? ''),
    user_name: String(row.user_name ?? ''),
    user_email: String(row.user_email ?? ''),
    user_phone: String(row.user_phone ?? ''),
    plan: String(row.plan ?? ''),
    sub_type: String(row.sub_type ?? ''),
    amount: row.amount != null ? Number(row.amount) : undefined,
    payment_method: row.payment_method != null ? String(row.payment_method) : undefined,
    payment_screenshot_url:
      row.payment_screenshot_url != null ? String(row.payment_screenshot_url) : undefined,
    status: String(row.status ?? ''),
    rejection_reason: row.rejection_reason != null ? String(row.rejection_reason) : undefined,
    shipping_address: row.shipping_address != null ? String(row.shipping_address) : undefined,
    notes: row.notes != null ? String(row.notes) : undefined,
    created_at: row.created_at != null ? String(row.created_at) : undefined
  };
}
