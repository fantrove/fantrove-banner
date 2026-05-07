// Path: src/features/banner-editor/components/LivePreview.tsx
// Purpose: WYSIWYG preview — v3 with activeLang for i18n preview.

'use client';

import { useState, useMemo } from 'react';
import { buildPreviewDocument } from '@/shared/lib/bannerTemplate';
import type { EditorDraft } from '../hooks/useBannerEditor';
import type { BannerPublicPayload } from '@/shared/types/banner';

interface Props { draft: EditorDraft;activeLang ? : string }
type Device = 'desktop' | 'mobile';

function draftToPayload(draft: EditorDraft): BannerPublicPayload {
  return {
    slug: draft.slug,
    bannerStyles: draft.bannerStyles,
    editorMode: draft.editorMode,
    customHtml: draft.customHtml,
    translations: draft.translations,
    supportedLangs: draft.supportedLangs,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    sliderConfig: draft.sliderConfig ?? null,
    
    // เพิ่มสองฟิลด์ที่ขาดไป (ปรับค่าเริ่มต้นให้ตรงกับชนิดในโปรเจค)
    customCss: (draft as any).customCss ?? '', // ถ้า type เป็น string -> ใช้ ''
    frameworkImports: (draft as any).frameworkImports ?? [], // ถ้า type เป็น string[] -> ใช้ []
  };
}

export function LivePreview({ draft, activeLang = 'en' }: Props) {
  const [device, setDevice] = useState < Device > ('desktop');
  
  const html = useMemo(
    () => buildPreviewDocument(draftToPayload(draft), activeLang),
    [draft, activeLang]
  );
  
  const iframeStyle: React.CSSProperties = device === 'mobile' ?
    { width: '375px', height: '420px', margin: '0 auto', display: 'block', border: 'none', borderRadius: '16px' } :
    { width: '100%', height: '340px', border: 'none', borderRadius: '16px' };
  
  return (
    <div className="preview-panel">
      <div className="preview-header">
        <span className="preview-title">
          Live Preview
          <span style={{ fontSize:11, fontWeight:400, color:'var(--tx-3)', marginLeft:6 }}>
            [{activeLang.toUpperCase()}] {draft.editorMode === 'html' ? '— HTML mode' : '— Builder mode'}
          </span>
        </span>
        <div className="device-toggle">
          <button type="button" className={`device-btn ${device==='desktop'?'device-btn--active':''}`}
            onClick={() => setDevice('desktop')}>🖥 Desktop</button>
          <button type="button" className={`device-btn ${device==='mobile'?'device-btn--active':''}`}
            onClick={() => setDevice('mobile')}>📱 Mobile</button>
        </div>
      </div>

      <div className={`preview-viewport ${device==='mobile'?'preview-viewport--mobile':''}`}>
        <iframe key={`${device}-${activeLang}`} srcDoc={html}
          sandbox="allow-same-origin" style={iframeStyle} title="Banner preview" />
      </div>

      <div className="preview-info">
        <span className="preview-info-item">✅ Preview = Live</span>
        {draft.slug && (
          <span className="preview-info-item">
            <a href={`/api/public/banners/${draft.slug}`} target="_blank" rel="noopener noreferrer" className="preview-link">
              Public API ↗
            </a>
          </span>
        )}
        {draft.jsTrigger && (
          <span className="preview-info-item preview-info-item--warn">
            ⚡ {draft.jsTrigger} active on Fantrove only
          </span>
        )}
      </div>
    </div>
  );
}