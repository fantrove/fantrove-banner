// Path: src/shared/types/banner.ts
// Purpose: Canonical domain types. v4: adds 'full' editor mode + frameworkImports.
//
// editorMode:
//   'builder' — component-based no-code editor
//   'html'    — write inner HTML; engine wraps in .be-banner automatically
//   'full'    — write complete HTML+CSS from root; engine mounts as-is, no wrapper forced

export const JS_TRIGGER_PRESETS = [
  'confetti','shake','pulse','scroll_reveal','bounce','glow',
] as const;
export type JsTriggerPreset = typeof JS_TRIGGER_PRESETS[number];

// ── Editor Modes ──────────────────────────────────────────────────────────────
export const EDITOR_MODES = ['builder', 'html', 'full'] as const;
export type EditorMode = typeof EDITOR_MODES[number];

// ── i18n ─────────────────────────────────────────────────────────────────────
export type LangValue = string | Record<string, string>;

export function resolveLang(val: LangValue | undefined | null, lang: string): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val[lang] ?? val['en'] ?? Object.values(val)[0] ?? '';
}

// Translations for HTML/full mode data-i18n substitution.
// { en: { key: 'value' }, th: { key: 'ค่า' } }
export type BannerTranslations = Record<string, Record<string, string>>;

// ── Framework imports ─────────────────────────────────────────────────────────
// CDN <link> / <script> tags injected before the banner HTML in full mode.
// WHY: lets users use Tailwind CDN, Bootstrap, Animate.css, etc.
// Security: only href/src are stored; the engine injects read-only link/script tags.
export interface FrameworkImport {
  type: 'css' | 'js';
  url:  string;
}

// ── ContentBlock ──────────────────────────────────────────────────────────────
export interface ContentBlock {
  id:     string;
  type:   'heading' | 'text' | 'html';
  value:  LangValue;
  align?: 'left' | 'center' | 'right';
  level?: 1 | 2 | 3;
}

// ── ButtonConfig ──────────────────────────────────────────────────────────────
export interface ButtonConfig {
  label:     LangValue;
  href:      string;
  className: string;
  target:    '_self' | '_blank';
}

// ── ImageAssets ───────────────────────────────────────────────────────────────
export interface ImageAssets {
  url: string; alt: string; width: number; height: number;
}

// ── CountdownConfig ───────────────────────────────────────────────────────────
export interface CountdownConfig {
  endIso: string;
  labels: { days: LangValue; hours: LangValue; mins: LangValue; secs: LangValue };
}

// ── SliderConfig ──────────────────────────────────────────────────────────────
export interface SliderConfig {
  images:    Array<{ url: string; alt: LangValue }>;
  interval:  number;
  animation: 'fade' | 'slide';
}

// ── Banner ────────────────────────────────────────────────────────────────────
export interface Banner {
  id:              string;
  slug:            string;
  name:            string;
  bannerStyles:    string;
  editorMode:      EditorMode;
  // full + html mode: lang → raw HTML
  customHtml:      Record<string, string>;
  // full mode only: per-lang CSS override (supplements bannerStyles)
  customCss:       Record<string, string>;
  // full mode only: CDN framework imports
  frameworkImports: FrameworkImport[];
  translations:    BannerTranslations;
  supportedLangs:  string[];
  // builder mode
  content:         ContentBlock[];
  buttons:         ButtonConfig[];
  // legacy
  buttonConfig:    ButtonConfig | null;
  imageAssets:     ImageAssets | null;
  jsTrigger:       JsTriggerPreset | null;
  countdownConfig: CountdownConfig | null;
  sliderConfig:    SliderConfig | null;
  isPublished:     boolean;
  allowedDomains:  string[];
  createdAt:       string;
  updatedAt:       string;
  publishedAt:     string | null;
}

// ── BannerPublicPayload ───────────────────────────────────────────────────────
export interface BannerPublicPayload {
  slug: string;
  bannerStyles: string;
  editorMode: 'builder' | 'html' | 'full';
  customHtml: Record<string, string>;
  translations: BannerTranslations;
  supportedLangs: string[];
  sliderConfig: SliderConfig | null;
  customCss: string;
  frameworkImports: string[];
  // เพิ่มสองฟิลด์นี้เป็น optional/required ตามต้องการ
  createdAt?: string;   // หรือ Date | number ขึ้นกับที่ใช้ในโปรเจค
  updatedAt?: string;
}

// ── Create / Update ───────────────────────────────────────────────────────────
export interface CreateBannerInput {
  slug:              string;
  name:              string;
  bannerStyles?:     string;
  editorMode?:       EditorMode;
  customHtml?:       Record<string, string>;
  customCss?:        Record<string, string>;
  frameworkImports?: FrameworkImport[];
  translations?:     BannerTranslations;
  supportedLangs?:   string[];
  content?:          ContentBlock[];
  buttons?:          ButtonConfig[];
  buttonConfig?:     ButtonConfig | null;
  imageAssets?:      ImageAssets | null;
  jsTrigger?:        JsTriggerPreset | null;
  countdownConfig?:  CountdownConfig | null;
  sliderConfig?:     SliderConfig | null;
  allowedDomains?:   string[];
}
export type UpdateBannerInput = Partial<CreateBannerInput>;

// ── AuditLog ──────────────────────────────────────────────────────────────────
export interface AuditLog {
  id: string; bannerId: string;
  action: 'created'|'updated'|'published'|'unpublished'|'deleted';
  changes: Record<string, [unknown, unknown]>;
  createdAt: string;
}

export interface ApiOk<T> { ok: true; data: T }
export interface ApiErr   { ok: false; error: string }
export type ApiResponse<T> = ApiOk<T> | ApiErr;