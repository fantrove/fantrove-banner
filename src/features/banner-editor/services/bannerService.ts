// Path:    src/features/banner-editor/services/bannerService.ts
// Purpose: All banner CRUD, publish, and audit logic.
//          The only layer that touches Supabase directly — transforms DB rows
//          to domain types at this boundary (never leaks raw rows outward).
// Used by: app/api/banners/route.ts, app/api/banners/[id]/route.ts,
//          app/api/publish/[id]/route.ts

import { getDb }              from '@/shared/lib/db';
import { purgeBannerCache }   from '@/shared/lib/cloudflare';
import type {
  Banner, BannerPublicPayload,
  CreateBannerInput, UpdateBannerInput,
  AuditLog,
} from '@/shared/types/banner';
import type { Database } from '@/shared/types/database';

type BannerRow = Database['public']['Tables']['banners']['Row'];

// ── toJsonb ───────────────────────────────────────────────────────────────────
// Safely converts a typed interface to the JSONB-compatible type Supabase
// expects. TypeScript 5.5+ strict mode forbids direct `as Record<string,unknown>`
// on interfaces without index signatures — double assertion is the correct fix.
// WHY not JSON.parse(JSON.stringify(…)): avoids runtime overhead; we trust the
// types are JSON-serializable by construction (no Date, Map, Set, etc.).
function toJsonb(val: unknown): Record<string, unknown> | null {
  if (val == null) return null;
  return val as unknown as Record<string, unknown>;
}

// ── Row → Domain type ─────────────────────────────────────────────────────────
// Raw DB rows never leave this file. All callers receive Banner domain objects.
function rowToBanner(row: BannerRow): Banner {
  return {
    id:              row.id,
    slug:            row.slug,
    name:            row.name,
    bannerStyles:    row.banner_styles ?? '',
    buttonConfig:    (row.button_config as Banner['buttonConfig']) ?? null,
    imageAssets:     (row.image_assets as Banner['imageAssets']) ?? null,
    jsTrigger:       (row.js_trigger as Banner['jsTrigger']) ?? null,
    countdownConfig: (row.countdown_config as Banner['countdownConfig']) ?? null,
    sliderConfig:    (row.slider_config as Banner['sliderConfig']) ?? null,
    isPublished:     row.is_published,
    allowedDomains:  row.allowed_domains,
    createdAt:       row.created_at,
    updatedAt:       row.updated_at,
    publishedAt:     row.published_at ?? null,
  };
}

// ── writeAuditLog ─────────────────────────────────────────────────────────────
// Written BEFORE the mutation it describes — required by Security Standards.
// If the audit write fails, we throw and abort the mutation.
async function writeAuditLog(
  bannerId: string,
  action: AuditLog['action'],
  changes: Record<string, [unknown, unknown]>
): Promise<void> {
  const db = getDb();
  const { error } = await db
    .from('banner_audit_logs')
    .insert({
      banner_id: bannerId,
      action,
      // [unknown, unknown] is assignable to unknown — single cast is sufficient here
      changes: changes as Record<string, unknown>,
    });

  if (error) {
    throw new Error(`[bannerService] Audit log write failed: ${error.message}`);
  }
}

// ── listBanners ───────────────────────────────────────────────────────────────
export async function listBanners(): Promise<Banner[]> {
  const db = getDb();
  const { data, error } = await db
    .from('banners')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`[bannerService] listBanners: ${error.message}`);
  return (data ?? []).map(rowToBanner);
}

// ── getBannerById ─────────────────────────────────────────────────────────────
export async function getBannerById(id: string): Promise<Banner | null> {
  const db = getDb();
  const { data, error } = await db
    .from('banners')
    .select('*')
    .eq('id', id)
    .single();

  if (error?.code === 'PGRST116') return null; // Not found
  if (error) throw new Error(`[bannerService] getBannerById: ${error.message}`);
  return data ? rowToBanner(data) : null;
}

// ── getBannerBySlug ───────────────────────────────────────────────────────────
// Used by the public API — returns only published banners
export async function getBannerBySlug(slug: string): Promise<BannerPublicPayload | null> {
  const db = getDb();
  const { data, error } = await db
    .from('banners')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error(`[bannerService] getBannerBySlug: ${error.message}`);
  if (!data) return null;

  const banner = rowToBanner(data);

  // Return only the public subset — no id, name, allowedDomains exposed
  return {
    slug:            banner.slug,
    bannerStyles:    banner.bannerStyles,
    buttonConfig:    banner.buttonConfig,
    imageAssets:     banner.imageAssets,
    jsTrigger:       banner.jsTrigger,
    countdownConfig: banner.countdownConfig,
    sliderConfig:    banner.sliderConfig,
  };
}

// ── createBanner ──────────────────────────────────────────────────────────────
export async function createBanner(input: CreateBannerInput): Promise<Banner> {
  const db = getDb();

  // Slug must be URL-safe
  const slug = input.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  const { data, error } = await db
    .from('banners')
    .insert({
      slug,
      name:             input.name,
      banner_styles:    input.bannerStyles ?? '',
      // toJsonb() resolves TS5.5+ strict-mode: interfaces lack index signatures,
      // so direct `as Record<string,unknown>` is rejected. Double assertion via
      // toJsonb is the correct pattern — Supabase stores these as JSONB anyway.
      button_config:    toJsonb(input.buttonConfig),
      image_assets:     toJsonb(input.imageAssets),
      js_trigger:       input.jsTrigger ?? null,
      countdown_config: toJsonb(input.countdownConfig),
      slider_config:    toJsonb(input.sliderConfig),
      allowed_domains:  input.allowedDomains ?? [],
    })
    .select()
    .single();

  if (error) throw new Error(`[bannerService] createBanner: ${error.message}`);
  if (!data) throw new Error('[bannerService] createBanner: no data returned');

  // Audit: written after insert (create is low-risk — no data loss possible)
  await writeAuditLog(data.id, 'created', {});

  return rowToBanner(data);
}

// ── updateBanner ──────────────────────────────────────────────────────────────
export async function updateBanner(id: string, input: UpdateBannerInput): Promise<Banner> {
  const db = getDb();

  // Read current state before mutating — needed for audit diff
  const current = await getBannerById(id);
  if (!current) throw new Error(`[bannerService] updateBanner: banner ${id} not found`);

  // Build change map for audit log
  const changes: Record<string, [unknown, unknown]> = {};
  if (input.bannerStyles !== undefined && input.bannerStyles !== current.bannerStyles) {
    changes['bannerStyles'] = [current.bannerStyles, input.bannerStyles];
  }
  if (input.buttonConfig    !== undefined) changes['buttonConfig']    = [current.buttonConfig,    input.buttonConfig];
  if (input.imageAssets     !== undefined) changes['imageAssets']     = [current.imageAssets,     input.imageAssets];
  if (input.jsTrigger       !== undefined) changes['jsTrigger']       = [current.jsTrigger,       input.jsTrigger];
  if (input.countdownConfig !== undefined) changes['countdownConfig'] = [current.countdownConfig, input.countdownConfig];
  if (input.sliderConfig    !== undefined) changes['sliderConfig']    = [current.sliderConfig,    input.sliderConfig];

  // ⚠️ AUDIT BEFORE MUTATION — required by security model
  await writeAuditLog(id, 'updated', changes);

  const slug = input.slug
    ? input.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    : undefined;

  const { data, error } = await db
    .from('banners')
    .update({
      ...(slug                      && { slug }),
      ...(input.name                && { name: input.name }),
      ...(input.bannerStyles    !== undefined && { banner_styles:    input.bannerStyles }),
      // toJsonb() handles null (to clear a field) and typed interfaces alike
      ...(input.buttonConfig    !== undefined && { button_config:    toJsonb(input.buttonConfig) }),
      ...(input.imageAssets     !== undefined && { image_assets:     toJsonb(input.imageAssets) }),
      ...(input.jsTrigger       !== undefined && { js_trigger:       input.jsTrigger }),
      ...(input.countdownConfig !== undefined && { countdown_config: toJsonb(input.countdownConfig) }),
      ...(input.sliderConfig    !== undefined && { slider_config:    toJsonb(input.sliderConfig) }),
      ...(input.allowedDomains  !== undefined && { allowed_domains:  input.allowedDomains }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`[bannerService] updateBanner: ${error.message}`);
  if (!data) throw new Error('[bannerService] updateBanner: no data returned');

  return rowToBanner(data);
}

// ── publishBanner ─────────────────────────────────────────────────────────────
// 1. Audit log written FIRST
// 2. Mark published in DB
// 3. Purge CDN cache (non-fatal if fails)
export async function publishBanner(id: string): Promise<Banner> {
  const db = getDb();

  const current = await getBannerById(id);
  if (!current) throw new Error(`[bannerService] publishBanner: banner ${id} not found`);

  // ⚠️ AUDIT BEFORE MUTATION
  await writeAuditLog(id, 'published', {
    isPublished: [false, true],
    publishedAt: [current.publishedAt, new Date().toISOString()],
  });

  const { data, error } = await db
    .from('banners')
    .update({ is_published: true, published_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`[bannerService] publishBanner: ${error.message}`);
  if (!data) throw new Error('[bannerService] publishBanner: no data returned');

  // CDN purge — non-fatal: banner is live, CDN will refresh on next request
  await purgeBannerCache(current.slug);

  return rowToBanner(data);
}

// ── unpublishBanner ───────────────────────────────────────────────────────────
export async function unpublishBanner(id: string): Promise<Banner> {
  const db = getDb();

  // ⚠️ AUDIT BEFORE MUTATION
  await writeAuditLog(id, 'unpublished', { isPublished: [true, false] });

  const { data, error } = await db
    .from('banners')
    .update({ is_published: false })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`[bannerService] unpublishBanner: ${error.message}`);
  if (!data) throw new Error('[bannerService] unpublishBanner: no data returned');

  const banner = rowToBanner(data);
  await purgeBannerCache(banner.slug);

  return banner;
}

// ── deleteBanner ──────────────────────────────────────────────────────────────
// ⚠️ DESTRUCTIVE ZONE: permanent delete — audit log cascades with the row.
// Caller must verify user intent before calling (e.g., type-to-confirm in UI).
export async function deleteBanner(id: string): Promise<void> {
  const db = getDb();

  const current = await getBannerById(id);
  if (!current) throw new Error(`[bannerService] deleteBanner: banner ${id} not found`);

  // ⚠️ AUDIT BEFORE DELETION — once deleted, the banner row is gone
  await writeAuditLog(id, 'deleted', { slug: [current.slug, null], name: [current.name, null] });

  const { error } = await db.from('banners').delete().eq('id', id);
  if (error) throw new Error(`[bannerService] deleteBanner: ${error.message}`);

  await purgeBannerCache(current.slug);
}

// ── getAuditLogs ──────────────────────────────────────────────────────────────
export async function getAuditLogs(bannerId: string): Promise<AuditLog[]> {
  const db = getDb();
  const { data, error } = await db
    .from('banner_audit_logs')
    .select('*')
    .eq('banner_id', bannerId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(`[bannerService] getAuditLogs: ${error.message}`);

  return (data ?? []).map(row => ({
    id:        row.id,
    bannerId:  row.banner_id ?? '',
    action:    row.action as AuditLog['action'],
    changes:   (row.changes as AuditLog['changes']) ?? {},
    createdAt: row.created_at,
  }));
}