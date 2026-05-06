// Path:    src/features/banner-editor/components/LivePreview.tsx
// Purpose: WYSIWYG preview — uses buildPreviewDocument from bannerTemplate.ts
//          which is the same template banner-engine.js mirrors on Fantrove.
//          Preview = Live, pixel-perfect.

'use client';

import { useState, useMemo } from 'react';
import { buildPreviewDocument } from '@/shared/lib/bannerTemplate';
import type { EditorDraft } from '../hooks/useBannerEditor';
import type { BannerPublicPayload } from '@/shared/types/banner';

interface Props { draft: EditorDraft }
type Device = 'desktop' | 'mobile';

function draftToPayload(draft: EditorDraft): BannerPublicPayload {
  return {
    slug: draft.slug,
    bannerStyles: draft.bannerStyles,
    content: draft.content,
    buttons: draft.buttons,
    buttonConfig: draft.buttonConfig,
    imageAssets: draft.imageAssets,
    jsTrigger: draft.jsTrigger,
    countdownConfig: draft.countdownConfig,
    sliderConfig: draft.sliderConfig,
  };
}

export function LivePreview({ draft }: Props) {
  const [device, setDevice] = useState < Device > ('desktop');
  
  const html = useMemo(
    () => buildPreviewDocument(draftToPayload(draft)),
    [draft]
  );
  
  const iframeStyle: React.CSSProperties = device === 'mobile' ?
    { width: '375px', height: '420px', margin: '0 auto', display: 'block', border: 'none', borderRadius: '16px' } :
    { width: '100%', height: '340px', border: 'none', borderRadius: '16px' };
  
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
          ✅ Preview = Live — same template as banner-engine.js
        </span>
        {draft.slug && (
          <span className="preview-info-item">
            <a href={`/api/public/banners/${draft.slug}`} target="_blank"
              rel="noopener noreferrer" className="preview-link">
              View public API ↗
            </a>
          </span>
        )}
        {draft.jsTrigger && (
          <span className="preview-info-item preview-info-item--warn">
            ⚡ JS effect ({draft.jsTrigger}) active on Fantrove only
          </span>
        )}
      </div>
    </div>
  );
}