// Path:    src/shared/types/banner.ts
// Purpose: Canonical domain types for the Banner Engine.
//          Raw DB rows are transformed to these types at the data boundary.
// Used by: bannerService.ts, all API routes, all components, banner-engine.js (as reference)

// ── JS trigger presets ────────────────────────────────────────────────────────
export const JS_TRIGGER_PRESETS = [
  'confetti',
  'shake',
  'pulse',
  'scroll_reveal',
  'bounce',
  'glow',
] as const;

export type JsTriggerPreset = typeof JS_TRIGGER_PRESETS[number];

// ── ContentBlock ──────────────────────────────────────────────────────────────
// A single content block inside the banner.
// type = 'heading' → rendered as <h1>-<h3>
// type = 'text'    → rendered as <p>
// type = 'html'    → rendered as sanitized innerHTML (admin-only, stripped server-side)
export interface ContentBlock {
  id:     string;                          // random id for React key / ordering
  type:   'heading' | 'text' | 'html';
  value:  string;
  align?: 'left' | 'center' | 'right';
  level?: 1 | 2 | 3;                      // heading only
}

// ── ButtonConfig ──────────────────────────────────────────────────────────────
export interface ButtonConfig {
  label:     string;
  href:      string;
  className: string;   // CSS class only — no inline style injection
  target:    '_self' | '_blank';
}

// ── ImageAssets ───────────────────────────────────────────────────────────────
export interface ImageAssets {
  url:    string;
  alt:    string;
  width:  number;
  height: number;
}

// ── CountdownConfig ───────────────────────────────────────────────────────────
export interface CountdownConfig {
  endIso: string;
  labels: { days: string; hours: string; mins: string; secs: string };
}

// ── SliderConfig ──────────────────────────────────────────────────────────────
export interface SliderConfig {
  images:    Array<{ url: string; alt: string }>;
  interval:  number;
  animation: 'fade' | 'slide';
}

// ── Banner (domain type) ──────────────────────────────────────────────────────
export interface Banner {
  id:              string;
  slug:            string;
  name:            string;
  bannerStyles:    string;
  // v2 fields
  content:         ContentBlock[];    // ordered content blocks (heading/text/html)
  buttons:         ButtonConfig[];    // multiple buttons — supersedes buttonConfig
  // legacy (kept for backward compat — use buttons[] instead)
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
  content:         ContentBlock[];
  buttons:         ButtonConfig[];
  buttonConfig:    ButtonConfig | null;  // legacy — client SDK falls back to this
  imageAssets:     ImageAssets | null;
  jsTrigger:       JsTriggerPreset | null;
  countdownConfig: CountdownConfig | null;
  sliderConfig:    SliderConfig | null;
}

// ── CreateBannerInput / UpdateBannerInput ─────────────────────────────────────
export interface CreateBannerInput {
  slug:             string;
  name:             string;
  bannerStyles?:    string;
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
  id:        string;
  bannerId:  string;
  action:    'created' | 'updated' | 'published' | 'unpublished' | 'deleted';
  changes:   Record<string, [unknown, unknown]>;
  createdAt: string;
}

// ── API response envelope ─────────────────────────────────────────────────────
export interface ApiOk<T> { ok: true; data: T }
export interface ApiErr   { ok: false; error: string }
export type ApiResponse<T> = ApiOk<T> | ApiErr;