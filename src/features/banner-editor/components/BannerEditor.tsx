// Path: src/features/banner-editor/components/BannerEditor.tsx
// Purpose: Main editor v5 — 2 modes (Builder | HTML), mobile-first.
//   Switching Builder→HTML generates HTML from current builder state.
//   Switching HTML→Builder restores builder controls (state preserved separately).

'use client';

import { useState }                     from 'react';
import type { Banner, EditorMode }       from '@/shared/types/banner';
import { useBannerEditor }               from '../hooks/useBannerEditor';
import { ContentBlockEditor }            from './ContentBlockEditor';
import { MultiButtonEditor }             from './MultiButtonEditor';
import { CountdownEditor }               from './CountdownEditor';
import { SliderEditor }                  from './SliderEditor';
import { StylePicker, JsTriggerPicker }  from './StylePicker';
import { LivePreview }                   from './LivePreview';
import { FullHtmlEditor }                from './FullHtmlEditor';

interface Props { initial?: Banner; onSaved?: (b: Banner) => void }

export function BannerEditor({ initial, onSaved }: Props) {
  const {
    saved, draft, activeLang, setActiveLang,
    saving, publishing, error, isDirty,
    updateField, setBannerStyles, setEditorMode,
    setContent, setButtons, setJsTrigger,
    setCountdownConfig, setSliderConfig,
    setCustomHtml, setCustomCss, setTranslations,
    save, publish, unpublish,
  } = useBannerEditor(initial);

  const [mobilePanel, setMobilePanel] = useState<'edit' | 'preview'>('edit');

  async function handleSave() {
    const ok = await save();
    if (ok && saved && onSaved) onSaved(saved);
  }

  const langs      = draft.supportedLangs?.length ? draft.supportedLangs : ['en', 'th'];
  const isBuilder  = draft.editorMode === 'builder';
  const isHtml     = draft.editorMode === 'html';

  const MODE_INFO: Record<EditorMode, { label: string; hint: string }> = {
    builder: { label: '🧱 Builder', hint: 'ออกแบบผ่าน UI' },
    html:    { label: '</> HTML',   hint: 'เขียน HTML+CSS จาก root' },
  };

  return (
    <div className="editor-root">

      {/* ── Topbar ──────────────────────────────────────────────── */}
      <div className="editor-topbar">
        <div className="editor-topbar-left">
          <h1 className="editor-title truncate">
            {saved ? saved.name : 'New Banner'}
          </h1>
          {saved && (
            <span className={`status-badge ${saved.isPublished ? 'status-badge--live' : 'status-badge--draft'}`}>
              {saved.isPublished ? '● Live' : '○ Draft'}
            </span>
          )}
          {isDirty && <span className="unsaved-dot" title="Unsaved">●</span>}

          {/* Mode toggle */}
          <div className="mode-toggle mode-toggle-inline">
            {(['builder','html'] as EditorMode[]).map(m => (
              <button key={m} type="button"
                className={`mode-btn ${draft.editorMode === m ? 'mode-btn--active' : ''}`}
                onClick={() => setEditorMode(m)}
                title={MODE_INFO[m].hint}>
                {MODE_INFO[m].label}
              </button>
            ))}
          </div>

          {/* Conversion hint */}
          {isHtml && Object.keys(draft.customHtml).length > 0 && (
            <span className="mode-chip mode-chip--html">HTML</span>
          )}
        </div>

        <div className="editor-topbar-right">
          {error && <span className="topbar-error" role="alert">{error}</span>}
          <button type="button" className="btn btn--secondary btn--sm"
            onClick={handleSave} disabled={saving || !isDirty}>
            {saving ? '…' : 'Save'}
          </button>
          {saved && (
            saved.isPublished ? (
              <button type="button" className="btn btn--ghost btn--sm"
                onClick={unpublish} disabled={publishing}>
                {publishing ? '…' : 'Unpublish'}
              </button>
            ) : (
              <button type="button" className="btn btn--primary btn--sm"
                onClick={publish} disabled={publishing || isDirty}
                title={isDirty ? 'Save first' : 'Publish to CDN'}>
                {publishing ? '…' : 'Publish →'}
              </button>
            )
          )}
        </div>
      </div>

      {/* ── Mobile panel tabs ────────────────────────────────────── */}
      <div className="mobile-panel-tabs" role="tablist">
        <button type="button" role="tab"
          aria-selected={mobilePanel === 'edit'}
          className={`mobile-panel-tab ${mobilePanel === 'edit' ? 'mobile-panel-tab--active' : ''}`}
          onClick={() => setMobilePanel('edit')}>
          ✏️ Edit
        </button>
        <button type="button" role="tab"
          aria-selected={mobilePanel === 'preview'}
          className={`mobile-panel-tab ${mobilePanel === 'preview' ? 'mobile-panel-tab--active' : ''}`}
          onClick={() => setMobilePanel('preview')}>
          👁 Preview
        </button>
      </div>

      {/* ── Main layout ─────────────────────────────────────────── */}
      <div className="editor-layout">

        {/* ── Controls panel ──────────────────────────────────── */}
        <div className="editor-controls"
          style={{ display: mobilePanel === 'preview' ? 'none' : undefined }}>

          {/* Language tabs */}
          <div style={{ display:'flex', gap:4, padding:'10px 16px 0', borderBottom:'1px solid var(--border)', flexWrap:'wrap' }}>
            {langs.map(l => (
              <button key={l} type="button"
                className={`mode-btn ${activeLang === l ? 'mode-btn--active' : ''}`}
                onClick={() => setActiveLang(l)}
                style={{ fontSize:11, padding:'5px 12px', minHeight:32 }}>
                {l.toUpperCase()}
              </button>
            ))}
            <button type="button" className="btn-text-sm" style={{ marginLeft:'auto' }}
              onClick={() => {
                const l = prompt('Language code (e.g. jp):')?.trim().toLowerCase();
                if (l && !langs.includes(l)) updateField('supportedLangs', [...langs, l]);
              }}>
              + Lang
            </button>
          </div>

          {/* Banner meta */}
          <div className="component-section">
            <div className="section-header">
              <label className="section-label"><span className="section-icon">📋</span>Banner Info</label>
            </div>
            <div className="section-fields">
              <div className="field-row">
                <label className="field-label">Name</label>
                <input className="field-input" type="text" value={draft.name}
                  placeholder="Welcome Banner" maxLength={80} autoComplete="off"
                  onChange={e => updateField('name', e.target.value)} />
              </div>
              <div className="field-row">
                <label className="field-label">Slug</label>
                <input className="field-input" type="text" value={draft.slug}
                  placeholder="welcome-banner" maxLength={60} disabled={!!saved}
                  inputMode="url" autoComplete="off"
                  onChange={e => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'-'))} />
                {saved && (
                  <span className="field-hint">Public: <code>/api/public/banners/{draft.slug}</code></span>
                )}
              </div>
              <div className="field-row">
                <label className="field-label">Allowed Domains</label>
                <input className="field-input" type="text" inputMode="url"
                  value={draft.allowedDomains.join(', ')}
                  placeholder="fantrove.com, *.fantrove.com"
                  onChange={e => updateField('allowedDomains',
                    e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} />
              </div>
            </div>
          </div>

          {/* ── HTML MODE ────────────────────────────────────── */}
          {isHtml && (
            <FullHtmlEditor
              html={draft.customHtml}
              css={draft.customCss}
              translations={draft.translations}
              langs={langs}
              activeLang={activeLang}
              onHtmlChange={setCustomHtml}
              onCssChange={setCustomCss}
              onTranslationsChange={setTranslations}
            />
          )}

          {/* ── BUILDER MODE ──────────────────────────────────── */}
          {isBuilder && (
            <>
              <StylePicker value={draft.bannerStyles} onChange={setBannerStyles} />
              <JsTriggerPicker value={draft.jsTrigger} onChange={setJsTrigger} />
              <ContentBlockEditor value={draft.content} onChange={setContent} activeLang={activeLang} />
              <MultiButtonEditor  value={draft.buttons} onChange={setButtons} activeLang={activeLang} />
              <CountdownEditor    value={draft.countdownConfig} onChange={setCountdownConfig} activeLang={activeLang} />
              <SliderEditor       value={draft.sliderConfig} onChange={setSliderConfig} />
            </>
          )}

          {saved && (
            <div className="audit-link">
              <a href={`/banners/${saved.id}/audit`} className="link-muted">View audit log →</a>
            </div>
          )}
        </div>

        {/* ── Preview panel ────────────────────────────────── */}
        <div className="editor-preview"
          style={{ display: mobilePanel === 'edit' ? 'none' : undefined }}>
          <LivePreview draft={draft} activeLang={activeLang} />
        </div>

      </div>
    </div>
  );
}