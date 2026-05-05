// Path:    src/features/banner-editor/services/bannerService.ts
// Purpose: All banner CRUD, publish, and audit logic.
//          v2: content blocks + multiple buttons support.

import { getDb }              from '@/shared/lib/db';
import { purgeBannerCache }   from '@/shared/lib/cloudflare';
import type {
  Banner, BannerPublicPayload,
  CreateBannerInput, UpdateBannerInput,
  AuditLog,
} from '@/shared/types/banner';
import type { Database } from '@/shared/types/database';

type BannerRow = Database['public']['Tables']['banners']['Row'];

function toJsonb(val: unknown): Record<string, unknown> | null {
  if (val == null) return null;
  return val as unknown as Record<string, unknown>;
}

function toJsonbArray(val: unknown): Record<string, unknown>[] | null {
  if (val == null) return null;
  return val as unknown as Record<string, unknown>[];
}

// ── Row → Domain type ─────────────────────────────────────────────────────────
function rowToBanner(row: BannerRow): Banner {
  return {
    id:              row.id,
    slug:            row.slug,
    name:            row.name,
    bannerStyles:    row.banner_styles ?? '',
    content:         (row.content as Banner['content']) ?? [],
    buttons:         (row.buttons as Banner['buttons']) ?? [],
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
      changes: changes as Record<string, unknown>,
    });
  if (error) throw new Error(`[bannerService] Audit log write failed: ${error.message}`);
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
    .from('banners').select('*').eq('id', id).single();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error(`[bannerService] getBannerById: ${error.message}`);
  return data ? rowToBanner(data) : null;
}

// ── getBannerBySlug ───────────────────────────────────────────────────────────
export async function getBannerBySlug(slug: string): Promise<BannerPublicPayload | null> {
  const db = getDb();
  const { data, error } = await db
    .from('banners').select('*').eq('slug', slug).eq('is_published', true).single();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error(`[bannerService] getBannerBySlug: ${error.message}`);
  if (!data) return null;

  const banner = rowToBanner(data);
  return {
    slug:            banner.slug,
    bannerStyles:    banner.bannerStyles,
    content:         banner.content,
    buttons:         banner.buttons,
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
  const slug = input.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  const { data, error } = await db
    .from('banners')
    .insert({
      slug,
      name:             input.name,
      banner_styles:    input.bannerStyles ?? '',
      content:          toJsonbArray(input.content ?? []),
      buttons:          toJsonbArray(input.buttons ?? []),
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

  await writeAuditLog(data.id, 'created', {});
  return rowToBanner(data);
}

// ── updateBanner ──────────────────────────────────────────────────────────────
export async function updateBanner(id: string, input: UpdateBannerInput): Promise<Banner> {
  const db = getDb();
  const current = await getBannerById(id);
  if (!current) throw new Error(`[bannerService] updateBanner: banner ${id} not found`);

  const changes: Record<string, [unknown, unknown]> = {};
  if (input.bannerStyles !== undefined && input.bannerStyles !== current.bannerStyles)
    changes['bannerStyles'] = [current.bannerStyles, input.bannerStyles];
  if (input.content    !== undefined) changes['content']    = [current.content,    input.content];
  if (input.buttons    !== undefined) changes['buttons']    = [current.buttons,    input.buttons];
  if (input.buttonConfig    !== undefined) changes['buttonConfig']    = [current.buttonConfig,    input.buttonConfig];
  if (input.imageAssets     !== undefined) changes['imageAssets']     = [current.imageAssets,     input.imageAssets];
  if (input.jsTrigger       !== undefined) changes['jsTrigger']       = [current.jsTrigger,       input.jsTrigger];
  if (input.countdownConfig !== undefined) changes['countdownConfig'] = [current.countdownConfig, input.countdownConfig];
  if (input.sliderConfig    !== undefined) changes['sliderConfig']    = [current.sliderConfig,    input.sliderConfig];

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
      ...(input.content         !== undefined && { content:          toJsonbArray(input.content) }),
      ...(input.buttons         !== undefined && { buttons:          toJsonbArray(input.buttons) }),
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
export async function publishBanner(id: string): Promise<Banner> {
  const db = getDb();
  const current = await getBannerById(id);
  if (!current) throw new Error(`[bannerService] publishBanner: banner ${id} not found`);

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

  await purgeBannerCache(current.slug);
  return rowToBanner(data);
}

// ── unpublishBanner ───────────────────────────────────────────────────────────
export async function unpublishBanner(id: string): Promise<Banner> {
  const db = getDb();
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
export async function deleteBanner(id: string): Promise<void> {
  const db = getDb();
  const current = await getBannerById(id);
  if (!current) throw new Error(`[bannerService] deleteBanner: banner ${id} not found`);

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