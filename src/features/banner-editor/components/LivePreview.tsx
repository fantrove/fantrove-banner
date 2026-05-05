// Path:    src/features/banner-editor/components/LivePreview.tsx
// Purpose: WYSIWYG preview — renders HTML identical to what banner-engine.js
//          injects on Fantrove. BANNER_BASE_CSS must stay in sync with
//          assets/js/banner-engine.js BANNER_BASE_CSS constant.
// Used by: BannerEditor.tsx

'use client';

import { useState, useMemo } from 'react';
import type { EditorDraft } from '../hooks/useBannerEditor';

interface Props { draft: EditorDraft }
type Device = 'desktop' | 'mobile';

// ── BANNER_BASE_CSS ───────────────────────────────────────────────────────────
// ⚠️  SYNC REQUIRED: This CSS MUST match BANNER_BASE_CSS in banner-engine.js.
//     Any change here → change there, and vice versa.
//     This is the single visual contract between preview and live output.
const BANNER_BASE_CSS = `
.be-wrapper { border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.12); }
.banner-custom {
  padding: 24px 20px;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  background: linear-gradient(90deg, #13b47f, #0eb0d5);
  color: #fff;
  position: relative;
}
.banner-custom .button {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 20px; border-radius: 24px;
  font-weight: 600; font-size: 14px;
  text-decoration: none; cursor: pointer;
  transition: opacity .18s; border: none;
}
.banner-custom .button-secondary { background: transparent; border: 2px solid currentColor; color: inherit; }
.banner-custom .button-primary   { background: #fff; color: #13b47f; border: 2px solid #fff; }
.banner-custom .banner-btn-white { background: #fff; color: #1a1a2e; border: 2px solid #fff; }
.banner-custom .banner-btn-dark  { background: #1a1a2e; color: #fff; border: 2px solid #1a1a2e; }
.banner-custom .be-btn-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.banner-custom .be-countdown { display: flex; gap: 8px; align-items: center; }
.banner-custom .be-cd-cell {
  display: flex; flex-direction: column; align-items: center;
  background: rgba(0,0,0,.18); border-radius: 6px; padding: 6px 10px; min-width: 42px;
}
.banner-custom .be-cd-num { font-size: 20px; font-weight: 700; line-height: 1; }
.banner-custom .be-cd-lbl { font-size: 10px; opacity: .75; margin-top: 2px; }
.banner-custom .be-slider { width: 100%; position: relative; overflow: hidden; border-radius: 6px; }
.banner-custom .be-slide { width: 100%; display: none; }
.banner-custom .be-slide.active { display: block; }
.banner-custom .be-slide img { width: 100%; height: auto; border-radius: 6px; display: block; }
.banner-custom h1, .banner-custom h2, .banner-custom h3 { margin: 0 0 4px; }
.banner-custom p { margin: 0 0 4px; }
@media (max-width: 600px) {
  .banner-custom { padding: 16px; }
  .banner-custom .button { padding: 12px 18px; font-size: 15px; min-height: 44px; }
  .banner-custom .be-btn-row { flex-direction: column; align-items: stretch; }
}
`;

// ── Simple HTML sanitizer (preview-only, admin-facing) ────────────────────────
// Strips script tags and dangerous event handlers before inserting into srcdoc.
// Server-side bannerService does the authoritative sanitization for production.
function sanitizeHtml(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
}

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── buildPreviewHtml ──────────────────────────────────────────────────────────
// Generates a self-contained HTML document for the preview iframe.
// Structure, CSS classes, and element hierarchy MUST match banner-engine.js
// mountBanner() output. When updating either, update both.
function buildPreviewHtml(draft: EditorDraft): string {
  const { bannerStyles, buttons, buttonConfig, imageAssets,
          jsTrigger, countdownConfig, sliderConfig, content } = draft;

  // Sanitize custom CSS — strip any attempt to inject </style>
  const safeCss = bannerStyles.replace(/<\/style>/gi, '');

  // ── Content blocks ────────────────────────────────────────────────────────
  const contentHtml = content.map(block => {
    const align = block.align ?? 'left';
    const style = `text-align:${align};`;
    switch (block.type) {
      case 'heading': {
        const tag = `h${block.level ?? 2}`;
        return `<${tag} style="${style}margin:0 0 4px;">${esc(block.value)}</${tag}>`;
      }
      case 'text':
        return `<p style="${style}margin:0 0 4px;">${esc(block.value)}</p>`;
      case 'html':
        return `<div style="${style}">${sanitizeHtml(block.value)}</div>`;
    }
  }).join('\n');

  // ── Buttons ───────────────────────────────────────────────────────────────
  const btns = buttons.length > 0 ? buttons : (buttonConfig ? [buttonConfig] : []);
  const buttonsHtml = btns.length > 0
    ? `<div class="be-btn-row">${btns.map(b =>
        `<a href="${esc(b.href)}" class="${esc(b.className)}" target="${esc(b.target)}">${esc(b.label)}</a>`
      ).join('\n')}</div>`
    : '';

  // ── Image ─────────────────────────────────────────────────────────────────
  const imageHtml = imageAssets?.url
    ? `<img src="${esc(imageAssets.url)}" alt="${esc(imageAssets.alt)}" ` +
      `width="${imageAssets.width || 'auto'}" height="${imageAssets.height || 'auto'}" ` +
      `style="max-width:100%;border-radius:8px;" />`
    : '';

  // ── Countdown (static preview — shows representative numbers) ─────────────
  // WHY static: iframe srcdoc can't run real timers cleanly during rapid edits.
  // The live site uses a real ticker via banner-engine.js.
  const countdownHtml = countdownConfig
    ? `<div class="be-countdown">${
        (['days', 'hours', 'mins', 'secs'] as const).map((k, i) =>
          `<span class="be-cd-cell">
            <span class="be-cd-num">${['07','23','59','42'][i]}</span>
            <span class="be-cd-lbl">${esc(countdownConfig.labels[k])}</span>
          </span>`
        ).join('')
      }</div>`
    : '';

  // ── Slider (shows first image only in preview) ────────────────────────────
  const sliderHtml = sliderConfig?.images?.length
    ? `<div class="be-slider">` +
        sliderConfig.images.slice(0, 1).map(img =>
          img.url
            ? `<div class="be-slide active"><img src="${esc(img.url)}" alt="${esc(img.alt)}" /></div>`
            : `<div class="be-slide active" style="height:120px;background:rgba(255,255,255,.15);border-radius:6px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.6);font-size:13px;">Image (empty URL)</div>`
        ).join('') +
      `</div>`
    : '';

  // ── JS trigger badge (preview-only indicator) ─────────────────────────────
  const triggerBadge = jsTrigger
    ? `<div style="font-size:11px;opacity:.75;background:rgba(0,0,0,.15);padding:3px 8px;border-radius:20px;">⚡ ${esc(jsTrigger)} (active on site)</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; background: #f5f5f5; padding: 8px; }
${BANNER_BASE_CSS}
${safeCss}
</style>
</head>
<body>
  <div class="be-wrapper">
    <div class="banner-custom">
      ${sliderHtml}
      ${imageHtml}
      ${contentHtml}
      ${countdownHtml}
      ${buttonsHtml}
      ${triggerBadge}
    </div>
  </div>
</body></html>`;
}

export function LivePreview({ draft }: Props) {
  const [device, setDevice] = useState<Device>('desktop');
  const html = useMemo(() => buildPreviewHtml(draft), [draft]);

  const iframeStyle: React.CSSProperties = device === 'mobile'
    ? { width: '375px', height: '360px', margin: '0 auto', display: 'block', border: 'none', borderRadius: '12px' }
    : { width: '100%', height: '300px', border: 'none', borderRadius: '12px' };

  return (
    <div className="preview-panel">
      <div className="preview-header">
        <span className="preview-title">Live Preview</span>
        <div className="device-toggle">
          <button type="button"
            className={`device-btn ${device === 'desktop' ? 'device-btn--active' : ''}`}
            onClick={() => setDevice('desktop')}>🖥 Desktop</button>
          <button type="button"
            className={`device-btn ${device === 'mobile' ? 'device-btn--active' : ''}`}
            onClick={() => setDevice('mobile')}>📱 Mobile</button>
        </div>
      </div>

      <div className={`preview-viewport ${device === 'mobile' ? 'preview-viewport--mobile' : ''}`}>
        <iframe
          key={device}
          srcDoc={html}
          sandbox="allow-same-origin"
          style={iframeStyle}
          title="Banner preview"
        />
      </div>

      <div className="preview-info">
        <span className="preview-info-item">
          WYSIWYG —{' '}
          <a href={`/api/public/banners/${draft.slug}`} target="_blank"
            rel="noopener noreferrer" className="preview-link">
            View public API ↗
          </a>
        </span>
        {draft.jsTrigger && (
          <span className="preview-info-item preview-info-item--warn">
            ⚡ JS effects render on Fantrove only
          </span>
        )}
      </div>
    </div>
  );
}