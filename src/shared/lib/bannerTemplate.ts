// Path: src/shared/lib/bannerTemplate.ts
// Purpose: Single source of truth for banner rendering.
//          v4: full mode (customHtml + customCss from root, no wrapper forced,
//              framework imports injected as link/script tags).

import type { BannerPublicPayload, FrameworkImport } from '../types/banner';
import { resolveLang } from '../types/banner';

export { resolveLang };

// ── Escape helpers ────────────────────────────────────────────────────────────
export function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
export function safeAttr(s: unknown): string {
  return String(s ?? '').replace(/[^a-zA-Z0-9\-_/.?=&#:%]/g,'');
}
export function sanitizeHtml(raw: string): string {
  return String(raw ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi,'')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi,'')
    .replace(/javascript\s*:/gi,'javascript-blocked:');
}

// ── Framework imports → safe <link>/<script> tags ────────────────────────────
// WHY: only HTTPS CDN URLs allowed; src/href validated before injection.
function buildFrameworkTags(imports: FrameworkImport[]): string {
  return (imports ?? [])
    .filter(imp => {
      try { return new URL(imp.url).protocol === 'https:'; } catch { return false; }
    })
    .map(imp =>
      imp.type === 'css'
        ? `<link rel="stylesheet" href="${esc(imp.url)}" crossorigin="anonymous" />`
        : `<script src="${esc(imp.url)}" crossorigin="anonymous"></script>`
    )
    .join('\n');
}

// ── Apply data-i18n substitution ──────────────────────────────────────────────
export function applyTranslations(
  html: string,
  translations: Record<string, Record<string, string>>,
  lang: string
): string {
  const langMap = translations[lang] ?? translations['en'] ?? {};
  return html.replace(
    /<([a-z][a-z0-9]*)[^>]*\sdata-i18n="([^"]+)"[^>]*>([^<]*)<\/\1>/gi,
    (match, tag, key, _inner) => {
      const val = langMap[key] ?? key;
      return match.replace(_inner, esc(val));
    }
  );
}

// ── BASE CSS for builder + html modes (not used in full mode) ─────────────────
export const BASE_CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
.be-banner{position:relative;overflow:hidden;border-radius:16px;padding:28px 24px;display:flex;flex-direction:column;gap:14px;background:linear-gradient(135deg,#13b47f 0%,#0eb0d5 100%);color:#fff;font-family:system-ui,-apple-system,sans-serif;box-shadow:0 4px 24px rgba(0,0,0,.12);}
.be-banner h1,.be-banner h2,.be-banner h3{margin:0;line-height:1.2;font-weight:700;}
.be-banner h1{font-size:clamp(22px,4vw,36px);}
.be-banner h2{font-size:clamp(18px,3vw,28px);}
.be-banner h3{font-size:clamp(15px,2.5vw,22px);}
.be-banner p{margin:0;font-size:14px;line-height:1.6;opacity:.9;}
.be-btn-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;}
.button{display:inline-flex;align-items:center;gap:6px;padding:10px 22px;border-radius:999px;font-weight:600;font-size:14px;text-decoration:none;border:2px solid transparent;cursor:pointer;transition:opacity .18s,transform .15s;white-space:nowrap;}
.button:hover{opacity:.85;transform:translateY(-1px);}
.button-secondary{background:transparent;border-color:currentColor;color:inherit;}
.button-primary{background:#fff;color:#13b47f;border-color:#fff;}
.banner-btn-white{background:#fff;color:#1a1a2e;border-color:#fff;}
.banner-btn-dark{background:#1a1a2e;color:#fff;border-color:#1a1a2e;}
.be-countdown{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
.be-cd-cell{display:flex;flex-direction:column;align-items:center;background:rgba(0,0,0,.18);border-radius:8px;padding:8px 12px;min-width:48px;}
.be-cd-num{font-size:24px;font-weight:700;line-height:1;}
.be-cd-lbl{font-size:10px;opacity:.75;margin-top:3px;letter-spacing:.05em;}
.be-image{max-width:100%;border-radius:8px;display:block;}
.be-slider{position:relative;overflow:hidden;border-radius:10px;width:100%;}
.be-slider img{width:100%;height:auto;display:block;}
@media(max-width:480px){.be-banner{padding:20px 16px;border-radius:12px;}.button{padding:12px 20px;font-size:15px;width:100%;justify-content:center;}.be-btn-row{flex-direction:column;}.be-cd-num{font-size:20px;}}
`.trim();

// ── buildBannerInnerHtml (builder + html modes) ───────────────────────────────
export function buildBannerInnerHtml(
  data: BannerPublicPayload,
  opts?: { lang?: string; staticCountdown?: boolean }
): string {
  const lang = opts?.lang ?? 'en';

  if (data.editorMode === 'html') {
    const html = data.customHtml?.[lang] ?? data.customHtml?.['en'] ?? '';
    return applyTranslations(sanitizeHtml(html), data.translations ?? {}, lang);
  }

  // builder mode
  const parts: string[] = [];

  if (data.sliderConfig?.images?.length) {
    const imgs = data.sliderConfig.images.filter(i => i.url).map((img, idx) =>
      `<img src="${safeAttr(img.url)}" alt="${esc(resolveLang(img.alt, lang))}" class="be-slide-img" loading="${idx===0?'eager':'lazy'}" style="display:${idx===0?'block':'none'};" />`
    ).join('\n');
    parts.push(`<div class="be-slider" data-interval="${esc(data.sliderConfig.interval)}" data-animation="${esc(data.sliderConfig.animation)}">${imgs}</div>`);
  }

  if (!data.sliderConfig && data.imageAssets?.url) {
    const img = data.imageAssets;
    parts.push(`<img src="${safeAttr(img.url)}" alt="${esc(img.alt)}" class="be-image"${img.width?` width="${img.width}"`:''}${img.height?` height="${img.height}"`:''} />`);
  }

  if (data.content?.length) {
    for (const block of data.content) {
      const text  = resolveLang(block.value, lang);
      const align = `text-align:${block.align ?? 'left'};`;
      if (block.type === 'heading') {
        const tag = `h${block.level ?? 2}`;
        parts.push(`<${tag} style="${align}">${esc(text)}</${tag}>`);
      } else if (block.type === 'text') {
        parts.push(`<p style="${align}">${esc(text)}</p>`);
      } else if (block.type === 'html') {
        parts.push(`<div style="${align}">${sanitizeHtml(text)}</div>`);
      }
    }
  }

  if (data.countdownConfig) {
    const { labels, endIso } = data.countdownConfig;
    const units = ['days','hours','mins','secs'] as const;
    const cells = units.map((u, i) => {
      const num = opts?.staticCountdown ? ['07','23','59','42'][i] : '--';
      return `<span class="be-cd-cell"><span class="be-cd-num" data-cd-unit="${u}">${num}</span><span class="be-cd-lbl">${esc(resolveLang(labels[u], lang))}</span></span>`;
    }).join('');
    parts.push(`<div class="be-countdown" data-end-iso="${esc(endIso)}">${cells}</div>`);
  }

  const btns = data.buttons?.length ? data.buttons : data.buttonConfig ? [data.buttonConfig] : [];
  if (btns.length) {
    const btnHtml = btns.map(b => {
      const label  = resolveLang(b.label, lang);
      const target = b.target === '_blank' ? '_blank' : '_self';
      const rel    = target === '_blank' ? ' rel="noopener noreferrer"' : '';
      return `<a href="${safeAttr(b.href)}" class="${esc(b.className)}" target="${target}"${rel}>${esc(label)}</a>`;
    }).join('\n');
    parts.push(`<div class="be-btn-row">${btnHtml}</div>`);
  }

  return parts.join('\n');
}

// ── buildPreviewDocument ──────────────────────────────────────────────────────
// Handles all three modes. 'full' mode gets no .be-banner wrapper + uses
// customCss[lang] + frameworkImports.
export function buildPreviewDocument(data: BannerPublicPayload, lang = 'en'): string {

  // ── FULL MODE ───────────────────────────────────────────────────────────────
  if (data.editorMode === 'full') {
    const rawHtml = data.customHtml?.[lang] ?? data.customHtml?.['en'] ?? '';
    const rawCss  = data.customCss?.[lang]  ?? data.customCss?.['en']  ?? data.bannerStyles ?? '';

    const sanitizedHtml = sanitizeHtml(rawHtml);
    const translatedHtml = applyTranslations(sanitizedHtml, data.translations ?? {}, lang);
    const frameworkTags  = buildFrameworkTags(data.frameworkImports ?? []);

    return `<!DOCTYPE html>
<html lang="${esc(lang)}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
${frameworkTags}
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{padding:12px;background:#f0f2f5;}
${rawCss}
</style>
</head>
<body>
${translatedHtml}
</body>
</html>`;
  }

  // ── BUILDER + HTML MODES ────────────────────────────────────────────────────
  const userCss = String(data.bannerStyles ?? '').replace(/<\/style>/gi,'');
  const inner   = buildBannerInnerHtml(data, { lang, staticCountdown: true });

  return `<!DOCTYPE html>
<html lang="${esc(lang)}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
body{background:#f0f2f5;padding:12px;}
${BASE_CSS}
${userCss}
</style>
</head>
<body>
  <div class="be-banner banner-custom">
${inner}
  </div>
</body>
</html>`;
}