/**
 * bannerService.ts
 *
 * Service layer สำหรับ Banner — ให้ named exports ที่โค้ดอื่นคาดหวัง
 * - ใช้ in-memory store เป็นค่าเริ่มต้น (สามารถเปลี่ยนเป็น DB client ได้)
 * - แปลง customCss / frameworkImports ให้ตรงชนิดของ BannerPublicPayload
 * - เพิ่มฟิลด์ `name` ใน Banner เพื่อรองรับโค้ด UI ที่เข้าถึง banner.name
 */

/* ================== Types ================== */

export type EditorMode = 'builder' | 'html' | 'full';

export interface SliderConfig {
  enabled: boolean;
  intervalMs?: number;
}

export interface BannerTranslations {
  [lang: string]: {
    title?: string;
    subtitle?: string;
  };
}

/**
 * Banner: โครงสร้างข้อมูลภายใน service/DB
 * - เพิ่ม `name` ที่ UI ใช้งาน
 * - customCss / frameworkImports ยังคงรองรับหลายรูปแบบ (string, map, array)
 */
export interface Banner {
  id?: string;
  slug: string;
  name?: string; // เพิ่มฟิลด์นี้ (UI เข้าถึง banner.name)
  bannerStyles: string;
  editorMode: EditorMode;
  customHtml: Record<string, string>;
  customCss?: string | Record<string, string> | undefined;
  frameworkImports?: string | string[] | Record<string, string> | undefined;
  translations: BannerTranslations;
  supportedLangs: string[];
  sliderConfig?: SliderConfig | null;
  defaultLang?: string;
  createdAt?: string;
  updatedAt?: string;
  published?: boolean;
}

export interface BannerPublicPayload {
  slug: string;
  bannerStyles: string;
  editorMode: EditorMode;
  customHtml: Record<string, string>;
  customCss: string;
  frameworkImports: string[];
  translations: BannerTranslations;
  supportedLangs: string[];
  sliderConfig: SliderConfig | null;
  createdAt?: string;
  updatedAt?: string;
}

/* ================== Helpers ================== */

function isRecordOfString(x: unknown): x is Record<string, string> {
  return (
    !!x &&
    typeof x === 'object' &&
    !Array.isArray(x) &&
    Object.values(x as Record<string, unknown>).every((v) => typeof v === 'string')
  );
}

function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every((v) => typeof v === 'string');
}

function nowIso(): string {
  return new Date().toISOString();
}

/* แปลง customCss ให้เป็น string เดียว */
export function recordToCssString(
  maybeRecord: string | Record<string, string> | undefined,
  preferredLang?: string
): string {
  if (!maybeRecord) return '';
  if (typeof maybeRecord === 'string') return maybeRecord;
  if (isRecordOfString(maybeRecord)) {
    if (preferredLang && maybeRecord[preferredLang]) return maybeRecord[preferredLang];
    const vals = Object.values(maybeRecord);
    return vals.length ? vals[0] : '';
  }
  return '';
}

/* แปลง frameworkImports เป็น string[] */
export function frameworkImportsToArray(
  maybe: string | string[] | Record<string, string> | undefined
): string[] {
  if (!maybe) return [];
  if (isStringArray(maybe)) return maybe;
  if (typeof maybe === 'string') {
    return maybe
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  if (isRecordOfString(maybe)) {
    return Object.values(maybe).map((s) => s.trim()).filter((s) => s.length > 0);
  }
  return [];
}

/* แปลง Banner -> BannerPublicPayload */
export function bannerToPublicPayload(b: Banner): BannerPublicPayload {
  return {
    slug: b.slug,
    bannerStyles: b.bannerStyles,
    editorMode: b.editorMode,
    customHtml: b.customHtml ?? {},
    customCss: recordToCssString(b.customCss, b.defaultLang),
    frameworkImports: frameworkImportsToArray(b.frameworkImports),
    translations: b.translations ?? {},
    supportedLangs: b.supportedLangs ?? [],
    sliderConfig: b.sliderConfig ?? null,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

export function draftToPayload(draft: Banner): BannerPublicPayload {
  return bannerToPublicPayload(draft);
}

/* ================== In-memory store (placeholder) ================== */

const bannersStore = new Map<string, Banner>();

function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/* ================== CRUD & publish functions ================== */

/** คืนรายการ banner ทั้งหมด (ไม่กรอง) */
export async function listBanners(): Promise<Banner[]> {
  return Array.from(bannersStore.values());
}

/** คืน banner โดย id (หรือ null) */
export async function getBannerById(id: string): Promise<Banner | null> {
  return bannersStore.get(id) ?? null;
}

/** คืน banner โดย slug (หรือ null) */
export async function getBannerBySlug(slug: string): Promise<Banner | null> {
  for (const b of bannersStore.values()) {
    if (b.slug === slug) return b;
  }
  return null;
}

/**
 * สร้าง banner ใหม่
 * - ตั้งค่า `name` เป็น payload.name หากมี, ถ้าไม่มีก็ใช้ slug เป็นค่าเริ่มต้น
 */
export async function createBanner(payload: Partial<Banner>): Promise<Banner> {
  const id = payload.id ?? makeId();
  const now = nowIso();
  const banner: Banner = {
    id,
    slug: payload.slug ?? `untitled-${id}`,
    name: payload.name ?? payload.slug ?? `untitled-${id}`, // ตั้งชื่อเริ่มต้น
    bannerStyles: payload.bannerStyles ?? '',
    editorMode: payload.editorMode ?? 'builder',
    customHtml: payload.customHtml ?? {},
    customCss: payload.customCss,
    frameworkImports: payload.frameworkImports,
    translations: payload.translations ?? {},
    supportedLangs: payload.supportedLangs ?? [],
    sliderConfig: payload.sliderConfig ?? null,
    defaultLang: payload.defaultLang,
    createdAt: payload.createdAt ?? now,
    updatedAt: payload.updatedAt ?? now,
    published: payload.published ?? false,
  };
  bannersStore.set(id, banner);
  return banner;
}

/** อัปเดต banner (partial) */
export async function updateBanner(id: string, patch: Partial<Banner>): Promise<Banner | null> {
  const existing = bannersStore.get(id);
  if (!existing) return null;
  const updated: Banner = {
    ...existing,
    ...patch,
    id: existing.id,
    // ถ้า patch ส่ง name มา ให้ใช้ patch.name; ถ้าไม่มีก็เก็บ existing.name ไว้
    name: patch.name ?? existing.name,
    updatedAt: nowIso(),
  };
  bannersStore.set(id, updated);
  return updated;
}

/** ลบ banner ตาม id */
export async function deleteBanner(id: string): Promise<boolean> {
  return bannersStore.delete(id);
}

/** ดึง audit logs — placeholder คืน array ว่าง (ปรับเชื่อมกับระบบจริงได้) */
export async function getAuditLogs(id: string): Promise<Array<{ when: string; by?: string; action: string; meta?: any }>> {
  return [];
}

/* ================== Publishing ================== */

export async function publishBanner(id: string): Promise<BannerPublicPayload | null> {
  const b = bannersStore.get(id);
  if (!b) return null;
  const updated = { ...b, published: true, updatedAt: nowIso() };
  bannersStore.set(id, updated);
  return bannerToPublicPayload(updated);
}

export async function unpublishBanner(id: string): Promise<boolean> {
  const b = bannersStore.get(id);
  if (!b) return false;
  const updated = { ...b, published: false, updatedAt: nowIso() };
  bannersStore.set(id, updated);
  return true;
}

/* ================== Default export (for convenience) ================== */

export default {
  listBanners,
  getBannerById,
  getBannerBySlug,
  createBanner,
  updateBanner,
  deleteBanner,
  getAuditLogs,
  publishBanner,
  unpublishBanner,
  bannerToPublicPayload,
  draftToPayload,
  recordToCssString,
  frameworkImportsToArray,
};