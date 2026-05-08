// Path: src/shared/types/banner.ts
// Purpose: Canonical domain types. v5: 2 modes only (builder | html).
//
// editorMode:
//   'builder' — UI-based visual editor; no raw HTML exposed
//   'html'    — full HTML + CSS from root; engine mounts inside Shadow DOM

export const JS_TRIGGER_PRESETS = [
  'confetti','shake','pulse','scroll_reveal','bounce','glow',
] as const;
export type JsTriggerPreset = typeof JS_TRIGGER_PRESETS[number];

export const EDITOR_MODES = ['builder', 'html'] as const;
export type EditorMode = typeof EDITOR_MODES[number];

// ── i18n ─────────────────────────────────────────────────────────────────────
export type LangValue = string | Record<string, string>;

export function resolveLang(val: LangValue | undefined | null, lang: string): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val[lang] ?? val['en'] ?? Object.values(val)[0] ?? '';
}

export type BannerTranslations = Record<string, Record<string, string>>;

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
  // html mode — lang → full HTML from root element
  customHtml:      Record<string, string>;
  // html mode — lang → full CSS injected into Shadow DOM (not scoped to host page)
  customCss:       Record<string, string>;
  translations:    BannerTranslations;
  supportedLangs:  string[];
  // builder mode
  content:         ContentBlock[];
  buttons:         ButtonConfig[];
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
  slug:            string;
  bannerStyles:    string;
  editorMode:      EditorMode;
  customHtml:      Record<string, string>;
  customCss:       Record<string, string>;
  translations:    BannerTranslations;
  supportedLangs:  string[];
  content:         ContentBlock[];
  buttons:         ButtonConfig[];
  buttonConfig:    ButtonConfig | null;
  imageAssets:     ImageAssets | null;
  jsTrigger:       JsTriggerPreset | null;
  countdownConfig: CountdownConfig | null;
  sliderConfig:    SliderConfig | null;
}

// ── Create / Update ───────────────────────────────────────────────────────────
export interface CreateBannerInput {
  slug:             string;
  name:             string;
  bannerStyles?:    string;
  editorMode?:      EditorMode;
  customHtml?:      Record<string, string>;
  customCss?:       Record<string, string>;
  translations?:    BannerTranslations;
  supportedLangs?:  string[];
  content?:         ContentBlock[];
  buttons?:         ButtonConfig[];
  buttonConfig?:    ButtonConfig | null;
  imageAssets?:     ImageAssets | null;
  jsTrigger?:       JsTriggerPreset | null;
  countdownConfig?: CountdownConfig | null;
  sliderConfig?:    SliderConfig | null;
  allowedDomains?:  string[];
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