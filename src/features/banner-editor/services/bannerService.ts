// Path: src/features/banner-editor/services/bannerService.ts — v4
// Purpose: All DB operations for banners. v4: customCss + frameworkImports.

import { getDb }            from '@/shared/lib/db';
import { purgeBannerCache } from '@/shared/lib/cloudflare';
import type {
  Banner, BannerPublicPayload,
  CreateBannerInput, UpdateBannerInput, AuditLog,
} from '@/shared/types/banner';
import type { Database } from '@/shared/types/database';

type BannerRow = Database['public']['Tables']['banners']['Row'];

function toJsonb(val: unknown): Record<string,unknown>|null {
  if (val == null) return null;
  return val as unknown as Record<string,unknown>;
}
function toJsonbArray(val: unknown): Record<string,unknown>[]|null {
  if (val == null) return null;
  return val as unknown as Record<string,unknown>[];
}

function rowToBanner(row: BannerRow): Banner {
  return {
    id:               row.id,
    slug:             row.slug,
    name:             row.name,
    bannerStyles:     row.banner_styles ?? '',
    editorMode:       (row.editor_mode as Banner['editorMode']) ?? 'builder',
    customHtml:       (row.custom_html as unknown as Record<string,string>) ?? {},
    customCss:        (row.custom_css  as unknown as Record<string,string>) ?? {},
    frameworkImports: (row.framework_imports as unknown as Banner['frameworkImports']) ?? [],
    translations:     (row.translations as unknown as Banner['translations']) ?? {},
    supportedLangs:   row.supported_langs ?? ['en','th'],
    content:          (row.content as unknown as Banner['content']) ?? [],
    buttons:          (row.buttons as unknown as Banner['buttons']) ?? [],
    buttonConfig:     (row.button_config as unknown as Banner['buttonConfig']) ?? null,
    imageAssets:      (row.image_assets as unknown as Banner['imageAssets']) ?? null,
    jsTrigger:        (row.js_trigger as Banner['jsTrigger']) ?? null,
    countdownConfig:  (row.countdown_config as unknown as Banner['countdownConfig']) ?? null,
    sliderConfig:     (row.slider_config as unknown as Banner['sliderConfig']) ?? null,
    isPublished:      row.is_published,
    allowedDomains:   row.allowed_domains,
    createdAt:        row.created_at,
    updatedAt:        row.updated_at,
    publishedAt:      row.published_at ?? null,
  };
}

async function writeAuditLog(
  bannerId: string,
  action: AuditLog['action'],
  changes: Record<string,[unknown,unknown]>
): Promise<void> {
  const db = getDb();
  const { error } = await db.from('banner_audit_logs').insert({
    banner_id: bannerId, action, changes: changes as Record<string,unknown>,
  });
  if (error) throw new Error(`[bannerService] Audit log failed: ${error.message}`);
}

export async function listBanners(): Promise<Banner[]> {
  const db = getDb();
  const { data, error } = await db.from('banners').select('*').order('created_at',{ascending:false});
  if (error) throw new Error(`[bannerService] listBanners: ${error.message}`);
  return (data ?? []).map(rowToBanner);
}

export async function getBannerById(id: string): Promise<Banner|null> {
  const db = getDb();
  const { data, error } = await db.from('banners').select('*').eq('id',id).single();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error(`[bannerService] getBannerById: ${error.message}`);
  return data ? rowToBanner(data) : null;
}

export async function getBannerBySlug(slug: string): Promise<BannerPublicPayload|null> {
  const db = getDb();
  const { data, error } = await db.from('banners')
    .select('*').eq('slug',slug).eq('is_published',true).single();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error(`[bannerService] getBannerBySlug: ${error.message}`);
  if (!data) return null;
  const b = rowToBanner(data);
  return {
    slug:             b.slug,
    bannerStyles:     b.bannerStyles,
    editorMode:       b.editorMode,
    customHtml:       b.customHtml,
    customCss:        b.customCss,
    frameworkImports: b.frameworkImports,
    translations:     b.translations,
    supportedLangs:   b.supportedLangs,
    content:          b.content,
    buttons:          b.buttons,
    buttonConfig:     b.buttonConfig,
    imageAssets:      b.imageAssets,
    jsTrigger:        b.jsTrigger,
    countdownConfig:  b.countdownConfig,
    sliderConfig:     b.sliderConfig,
  };
}

export async function createBanner(input: CreateBannerInput): Promise<Banner> {
  const db = getDb();
  const slug = input.slug.toLowerCase().replace(/[^a-z0-9-]/g,'-');
  const { data, error } = await db.from('banners').insert({
    slug, name: input.name,
    banner_styles:     input.bannerStyles ?? '',
    editor_mode:       input.editorMode ?? 'builder',
    custom_html:       toJsonb(input.customHtml ?? {}),
    custom_css:        toJsonb(input.customCss ?? {}),
    framework_imports: toJsonbArray(input.frameworkImports ?? []),
    translations:      toJsonb(input.translations ?? {}),
    supported_langs:   input.supportedLangs ?? ['en','th'],
    content:           toJsonbArray(input.content ?? []),
    buttons:           toJsonbArray(input.buttons ?? []),
    button_config:     toJsonb(input.buttonConfig),
    image_assets:      toJsonb(input.imageAssets),
    js_trigger:        input.jsTrigger ?? null,
    countdown_config:  toJsonb(input.countdownConfig),
    slider_config:     toJsonb(input.sliderConfig),
    allowed_domains:   input.allowedDomains ?? [],
  }).select().single();
  if (error) throw new Error(`[bannerService] createBanner: ${error.message}`);
  if (!data)  throw new Error('[bannerService] createBanner: no data');
  await writeAuditLog(data.id, 'created', {});
  return rowToBanner(data);
}

export async function updateBanner(id: string, input: UpdateBannerInput): Promise<Banner> {
  const db      = getDb();
  const current = await getBannerById(id);
  if (!current) throw new Error(`[bannerService] updateBanner: not found ${id}`);

  const changes: Record<string,[unknown,unknown]> = {};
  if (input.bannerStyles    !== undefined) changes['bannerStyles']    = [current.bannerStyles,    input.bannerStyles];
  if (input.editorMode      !== undefined) changes['editorMode']      = [current.editorMode,      input.editorMode];
  if (input.customHtml      !== undefined) changes['customHtml']      = [current.customHtml,      input.customHtml];
  if (input.customCss       !== undefined) changes['customCss']       = [current.customCss,       input.customCss];
  if (input.frameworkImports!== undefined) changes['frameworkImports']= [current.frameworkImports,input.frameworkImports];
  if (input.translations    !== undefined) changes['translations']    = [current.translations,    input.translations];
  if (input.content         !== undefined) changes['content']         = [current.content,         input.content];
  if (input.buttons         !== undefined) changes['buttons']         = [current.buttons,         input.buttons];
  if (input.jsTrigger       !== undefined) changes['jsTrigger']       = [current.jsTrigger,       input.jsTrigger];
  if (input.countdownConfig !== undefined) changes['countdownConfig'] = [current.countdownConfig, input.countdownConfig];
  if (input.sliderConfig    !== undefined) changes['sliderConfig']    = [current.sliderConfig,    input.sliderConfig];

  await writeAuditLog(id, 'updated', changes);

  const { data, error } = await db.from('banners').update({
    ...(input.name               && { name:              input.name }),
    ...(input.bannerStyles    !== undefined && { banner_styles:     input.bannerStyles }),
    ...(input.editorMode      !== undefined && { editor_mode:       input.editorMode }),
    ...(input.customHtml      !== undefined && { custom_html:       toJsonb(input.customHtml) }),
    ...(input.customCss       !== undefined && { custom_css:        toJsonb(input.customCss) }),
    ...(input.frameworkImports!== undefined && { framework_imports: toJsonbArray(input.frameworkImports) }),
    ...(input.translations    !== undefined && { translations:      toJsonb(input.translations) }),
    ...(input.supportedLangs  !== undefined && { supported_langs:   input.supportedLangs }),
    ...(input.content         !== undefined && { content:           toJsonbArray(input.content) }),
    ...(input.buttons         !== undefined && { buttons:           toJsonbArray(input.buttons) }),
    ...(input.buttonConfig    !== undefined && { button_config:     toJsonb(input.buttonConfig) }),
    ...(input.imageAssets     !== undefined && { image_assets:      toJsonb(input.imageAssets) }),
    ...(input.jsTrigger       !== undefined && { js_trigger:        input.jsTrigger }),
    ...(input.countdownConfig !== undefined && { countdown_config:  toJsonb(input.countdownConfig) }),
    ...(input.sliderConfig    !== undefined && { slider_config:     toJsonb(input.sliderConfig) }),
    ...(input.allowedDomains  !== undefined && { allowed_domains:   input.allowedDomains }),
  }).eq('id',id).select().single();
  if (error) throw new Error(`[bannerService] updateBanner: ${error.message}`);
  if (!data)  throw new Error('[bannerService] updateBanner: no data');
  return rowToBanner(data);
}

export async function publishBanner(id: string): Promise<Banner> {
  const db = getDb();
  const current = await getBannerById(id);
  if (!current) throw new Error(`publishBanner: not found ${id}`);
  await writeAuditLog(id,'published',{isPublished:[false,true],publishedAt:[current.publishedAt,new Date().toISOString()]});
  const {data,error} = await db.from('banners')
    .update({is_published:true,published_at:new Date().toISOString()}).eq('id',id).select().single();
  if (error) throw new Error(`publishBanner: ${error.message}`);
  if (!data)  throw new Error('publishBanner: no data');
  await purgeBannerCache(current.slug);
  return rowToBanner(data);
}

export async function unpublishBanner(id: string): Promise<Banner> {
  const db = getDb();
  await writeAuditLog(id,'unpublished',{isPublished:[true,false]});
  const {data,error} = await db.from('banners')
    .update({is_published:false}).eq('id',id).select().single();
  if (error) throw new Error(`unpublishBanner: ${error.message}`);
  if (!data)  throw new Error('unpublishBanner: no data');
  const banner = rowToBanner(data);
  await purgeBannerCache(banner.slug);
  return banner;
}

export async function deleteBanner(id: string): Promise<void> {
  const db = getDb();
  const current = await getBannerById(id);
  if (!current) throw new Error(`deleteBanner: not found ${id}`);
  await writeAuditLog(id,'deleted',{slug:[current.slug,null],name:[current.name,null]});
  const {error} = await db.from('banners').delete().eq('id',id);
  if (error) throw new Error(`deleteBanner: ${error.message}`);
  await purgeBannerCache(current.slug);
}

export async function getAuditLogs(bannerId: string): Promise<AuditLog[]> {
  const db = getDb();
  const {data,error} = await db.from('banner_audit_logs').select('*')
    .eq('banner_id',bannerId).order('created_at',{ascending:false}).limit(50);
  if (error) throw new Error(`getAuditLogs: ${error.message}`);
  return (data??[]).map(row=>({
    id:        row.id,
    bannerId:  row.banner_id ?? '',
    action:    row.action as AuditLog['action'],
    changes:   (row.changes as AuditLog['changes']) ?? {},
    createdAt: row.created_at,
  }));
}