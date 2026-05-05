// Path:    src/features/banner-editor/components/LivePreview.tsx
// Purpose: WYSIWYG preview — v2 renders content blocks + multiple buttons.
// Used by: BannerEditor.tsx

'use client';

import { useState, useMemo } from 'react';
import type { EditorDraft } from '../hooks/useBannerEditor';

interface Props { draft: EditorDraft }
type Device = 'desktop' | 'mobile';

// ── Simple HTML sanitizer (preview-only, admin-facing) ─────────────────────
// Strips script tags and event handlers before showing in iframe srcdoc.
// Server-side service layer does the authoritative sanitization for prod.
function sanitizeHtml(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '');
}

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildPreviewHtml(draft: EditorDraft): string {
  const { bannerStyles, buttons, buttonConfig, imageAssets,
          jsTrigger, countdownConfig, sliderConfig, content } = draft;

  const safeCss = bannerStyles.replace(/<\/style>/gi, '');

  // Content blocks
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

  // Multiple buttons (v2) — fall back to legacy buttonConfig
  const btns = buttons.length > 0
    ? buttons
    : buttonConfig ? [buttonConfig] : [];

  const buttonsHtml = btns.length > 0
    ? `<div class="be-btn-row">${btns.map(b =>
        `<a href="${esc(b.href)}" class="${esc(b.className)}" target="${esc(b.target)}">${esc(b.label)}</a>`
      ).join('\n')}</div>`
    : '';

  const imageHtml = imageAssets?.url
    ? `<img src="${esc(imageAssets.url)}" alt="${esc(imageAssets.alt)}" width="${imageAssets.width || 'auto'}" height="${imageAssets.height || 'auto'}" style="max-width:100%;border-radius:8px;" />`
    : '';

  const countdownHtml = countdownConfig
    ? `<div class="be-countdown">${(['days', 'hours', 'mins', 'secs'] as const).map((k, i) =>
        `<span class="be-cd-cell">
          <span class="be-cd-num">${['07','23','59','42'][i]}</span>
          <span class="be-cd-lbl">${esc(countdownConfig.labels[k])}</span>
        </span>`).join('')}</div>`
    : '';

  const sliderHtml = sliderConfig?.images?.length
    ? `<div class="be-slider">${sliderConfig.images.slice(0,1).map(img =>
        img.url
          ? `<img src="${esc(img.url)}" alt="${esc(img.alt)}" style="width:100%;height:auto;border-radius:6px;" />`
          : `<div style="width:100%;height:120px;background:rgba(255,255,255,.15);border-radius:6px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.6);font-size:13px;">Image (empty URL)</div>`
      ).join('')}</div>`
    : '';

  const triggerBadge = jsTrigger
    ? `<div class="be-trigger-badge">⚡ ${esc(jsTrigger)} (active on site)</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; background: #f5f5f5; padding: 8px; }
.banner-wrapper { border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.12); }
.banner-custom {
  padding: 24px 20px; min-height: 80px;
  display: flex; flex-direction: column; align-items: flex-start; gap: 12px;
  background: linear-gradient(90deg, #13b47f, #0eb0d5);
  color: #fff; position: relative;
}
${safeCss}
.button { display:inline-flex;align-items:center;gap:6px;padding:10px 20px;border-radius:24px;font-weight:600;font-size:14px;text-decoration:none;transition:opacity .18s;cursor:pointer; }
.button-secondary { background:transparent;border:2px solid currentColor;color:inherit; }
.button-primary { background:#fff;color:#13b47f;border:2px solid #fff; }
.banner-btn-white { background:#fff;color:#1a1a2e;border:2px solid #fff; }
.banner-btn-dark  { background:#1a1a2e;color:#fff;border:2px solid #1a1a2e; }
.be-btn-row { display:flex;flex-wrap:wrap;gap:8px;align-items:center; }
.be-countdown { display:flex;gap:8px;align-items:center; }
.be-cd-cell { display:flex;flex-direction:column;align-items:center;background:rgba(0,0,0,.18);border-radius:6px;padding:6px 10px;min-width:42px; }
.be-cd-num { font-size:20px;font-weight:700;line-height:1; }
.be-cd-lbl { font-size:10px;opacity:.75;margin-top:2px; }
.be-trigger-badge { font-size:11px;opacity:.75;background:rgba(0,0,0,.15);padding:3px 8px;border-radius:20px; }
</style>
</head>
<body>
  <div class="banner-wrapper">
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