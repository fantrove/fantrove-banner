/**
 * bannerService.ts
 *
 * แปลงโมเดล Banner/EditorDraft เป็น BannerPublicPayload ที่ใช้ส่งให้ client/public API
 * - แปลง customCss (อาจเป็น Record<string,string> หรือ string) ให้เป็น string เดียว
 * - แปลง frameworkImports ให้เป็น string[]
 *
 * ปรับให้ปลอดภัยต่อรูปแบบข้อมูลจาก DB / editor: ถ้าเป็น map ตามภาษา -> เลือกภาษาดีฟอลต์ (ถ้ามี) หรือเอาค่าแรก
 */

/* ======= Type definitions (ปรับได้หากโปรเจคมีการประกาศไว้ที่อื่น) ======= */

export type EditorMode = 'builder' | 'html' | 'full';

export interface SliderConfig {
  // ตัวอย่างฟิลด์ (แทนที่ด้วยชนิดจริงของโครงการถ้ามี)
  enabled: boolean;
  intervalMs?: number;
}

export interface BannerTranslations {
  [lang: string]: {
    title?: string;
    subtitle?: string;
  };
}

/** โมเดลที่มาจาก DB หรือ editor */
export interface Banner {
  slug: string;
  bannerStyles: string;
  editorMode: EditorMode;
  customHtml: Record<string, string>;
  // customCss อาจถูกเก็บเป็น string เดียว หรือเป็น map per-lang: Record<string,string>
  customCss?: string | Record<string, string> | undefined;
  // frameworkImports อาจเป็น string (newline-separated), หรือ string[] หรือ Record<string,string>
  frameworkImports?: string | string[] | Record<string, string> | undefined;
  translations: BannerTranslations;
  supportedLangs: string[];
  sliderConfig?: SliderConfig | null;
  // ข้อมูลเสริม (optional)
  defaultLang?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** payload ที่จะส่งออกเป็น public */
export interface BannerPublicPayload {
  slug: string;
  bannerStyles: string;
  editorMode: EditorMode;
  customHtml: Record<string, string>;
  customCss: string;           // ต้องเป็น string เดียว (ตามคำร้องก่อน)
  frameworkImports: string[];  // ต้องเป็น array ขอ��� import statements / URLs
  translations: BannerTranslations;
  supportedLangs: string[];
  sliderConfig: SliderConfig | null;
  createdAt?: string;
  updatedAt?: string;
}

/** EditorDraft อาจมีโครงสร้างคล้าย Banner (ปรับตามจริง) */
export interface EditorDraft extends Banner {}

/* ======= Helpers ======= */

function isRecordOfString(x: unknown): x is Record<string, string> {
  return (
    !!x &&
    typeof x === 'object' &&
    !Array.isArray(x) &&
    Object.values(x).every((v) => typeof v === 'string')
  );
}

function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every((v) => typeof v === 'string');
}

/**
 * แปลงค่า customCss ที่อาจเป็น string หรือ Record<string,string> ให้เป็น string เดียว
 * - preferredLang ถ้ามี ��ะเลือกคีย์นั้นก่อน
 * - ถ้าเป็น Record และไม่มี preferredLang จะเอาค่าแรกใน object
 * - ถ้าค่าเป็น string จะคืนค่าตรง ๆ
 * - ถ้าไม่มีค่า -> คืน '' (empty string)
 */
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
  // fallback
  return '';
}

/**
 * แปลง frameworkImports เป็น string[]
 * - ถ้าเป็น string[] คืนตรง ๆ
 * - ถ้าเป็น string ให้ split ตาม newline และ trim
 * - ถ้าเป็น Record -> เอาค่า (values) ทั้งหมด
 * - ถ้าไม่มี -> คืน []
 */
export function frameworkImportsToArray(
  maybe: string | string[] | Record<string, string> | undefined
): string[] {
  if (!maybe) return [];
  if (isStringArray(maybe)) return maybe;
  if (typeof maybe === 'string') {
    // แยกแถว โดยละทิ้งบรรทัดว่าง
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

/* ======= Main conversion functions ======= */

/**
 * แปลง Banner -> BannerPublicPayload
 * รับผิดชอบแปลงชนิด customCss / frameworkImports ให้ตรงกับ BannerPublicPayload
 */
export function bannerToPublicPayload(b: Banner): BannerPublicPayload {
  return {
    slug: b.slug,
    bannerStyles: b.bannerStyles,
    editorMode: b.editorMode,
    customHtml: b.customHtml ?? {},
    // แปลง customCss ให้เป็น string เดียว (เลือก b.defaultLang ถ้ามี)
    customCss: recordToCssString(b.customCss, b.defaultLang),
    // แปลง frameworkImports ให้เป็น string[]
    frameworkImports: frameworkImportsToArray(b.frameworkImports),
    translations: b.translations ?? {},
    supportedLangs: b.supportedLangs ?? [],
    sliderConfig: b.sliderConfig ?? null,
    // timestamps เป็น optional — เก็บไว้ถ้าต้องการ
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

/**
 * ฟังก์ชันสำหรับแปลง EditorDraft (ใช้งานใน LivePreview ตัวอย่างก่อนหน้า)
 */
export function draftToPayload(draft: EditorDraft): BannerPublicPayload {
  // ใช้การแปลงเดียวกับ bannerToPublicPayload เพื่อให้ consistent
  return bannerToPublicPayload(draft);
}

/* ======= ตัวอย่าง Export อื่น ๆ (ถ้าต้องการใน service) ======= */

export default {
  bannerToPublicPayload,
  draftToPayload,
  recordToCssString,
  frameworkImportsToArray,
};