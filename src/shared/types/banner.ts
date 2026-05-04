// Path:    src/shared/types/banner.ts
// Purpose: Canonical domain types for the Banner Engine.
//          Raw DB rows are transformed to these types at the data boundary.
// Used by: bannerService.ts, all API routes, all components, banner-engine.js (as reference)

// ── JS trigger presets ────────────────────────────────────────────────────────
// These are the ONLY allowed values for js_trigger.
// They map to hardcoded functions in banner-engine.js — never eval'd.
// WHY: Zero Injected Scripts security model (PDF p.11).
export const JS_TRIGGER_PRESETS = [
  'confetti',
  'shake',
  'pulse',
  'scroll_reveal',
  'bounce',
  'glow',
] as const;

export type JsTriggerPreset = typeof JS_TRIGGER_PRESETS[number];

// ── ButtonConfig ──────────────────────────────────────────────────────────────
export interface ButtonConfig {
  label:     string;
  href:      string;
  className: string;   // CSS class only — no inline style injection
  target:    '_self' | '_blank';
}

// ── ImageAssets ───────────────────────────────────────────────────────────────
export interface ImageAssets {
  url:    string;   // Supabase S3 public URL
  alt:    string;
  width:  number;
  height: number;
}

// ── CountdownConfig ───────────────────────────────────────────────────────────
export interface CountdownConfig {
  endIso: string;   // ISO 8601 UTC — fetched from Server API on client
  labels: {
    days:  string;
    hours: string;
    mins:  string;
    secs:  string;
  };
}

// ── SliderConfig ──────────────────────────────────────────────────────────────
export interface SliderConfig {
  images:    Array<{ url: string; alt: string }>;
  interval:  number;   // ms between slides
  animation: 'fade' | 'slide';
}

// ── Banner (domain type — not raw DB row) ─────────────────────────────────────
export interface Banner {
  id:              string;
  slug:            string;
  name:            string;
  bannerStyles:    string;
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
// Subset returned by the public API — no internal metadata exposed
export interface BannerPublicPayload {
  slug:            string;
  bannerStyles:    string;
  buttonConfig:    ButtonConfig | null;
  imageAssets:     ImageAssets | null;
  jsTrigger:       JsTriggerPreset | null;
  countdownConfig: CountdownConfig | null;
  sliderConfig:    SliderConfig | null;
}

// ── CreateBannerInput / UpdateBannerInput ─────────────────────────────────────
export interface CreateBannerInput {
  slug:            string;
  name:            string;
  bannerStyles?:   string;
  buttonConfig?:   ButtonConfig | null;
  imageAssets?:    ImageAssets | null;
  jsTrigger?:      JsTriggerPreset | null;
  countdownConfig?: CountdownConfig | null;
  sliderConfig?:   SliderConfig | null;
  allowedDomains?: string[];
}

export type UpdateBannerInput = Partial<CreateBannerInput>;

// ── AuditLog ─────────────────────────────────────────────────────────────────
export interface AuditLog {
  id:        string;
  bannerId:  string;
  action:    'created' | 'updated' | 'published' | 'unpublished' | 'deleted';
  changes:   Record<string, [unknown, unknown]>;   // { field: [old, new] }
  createdAt: string;
}

// ── API response envelope ─────────────────────────────────────────────────────
export interface ApiOk<T> { ok: true; data: T }
export interface ApiErr   { ok: false; error: string }
export type ApiResponse<T> = ApiOk<T> | ApiErr;