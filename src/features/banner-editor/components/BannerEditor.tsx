// Path: src/features/banner-editor/components/BannerEditor.tsx
// Purpose: Main editor — v4 mobile-first.
//          Mobile: tab-based panel switching (Edit ↔ Preview).
//          Desktop: side-by-side layout.
//          Modes: Builder | HTML | Full.

'use client';

import { useState } from 'react';
import type { Banner, EditorMode }       from '@/shared/types/banner';
import { useBannerEditor }               from '../hooks/useBannerEditor';
import { ContentBlockEditor }            from './ContentBlockEditor';
import { MultiButtonEditor }             from './MultiButtonEditor';
import { CountdownEditor }               from './CountdownEditor';
import { SliderEditor }                  from './SliderEditor';
import { StylePicker, JsTriggerPicker }  from './StylePicker';
import { LivePreview }                   from './LivePreview';
import { HtmlModeEditor }                from './HtmlModeEditor';
import { FullHtmlEditor }                from './FullHtmlEditor';

interface Props { initial?: Banner; onSaved?: (b: Banner) => void }

const MODE_LABELS: Record<EditorMode, string> = {
  builder: '🧱 Builder',
  html:    '</> HTML',
  full:    '🔓 Full',
};

export function BannerEditor({ initial, onSaved }: Props) {
  const {
    saved, draft, activeLang, setActiveLang,
    saving, publishing, error, isDirty,
    updateField, setBannerStyles,
    setContent, setButtons, setJsTrigger,
    setCountdownConfig, setSliderConfig,
    setCustomHtml, setCustomCss, setTranslations,
    setFrameworkImports, setEditorMode,
    save, publish, unpublish,
  } = useBannerEditor(initial);

  const [mobilePanel, setMobilePanel] = useState<'edit' | 'preview'>('edit');

  async function handleSave() {
    const ok = await save();
    if (ok && saved && onSaved) onSaved(saved);
  }

  const langs     = draft.supportedLangs?.length ? draft.supportedLangs : ['en', 'th'];
  const mode      = draft.editorMode;
  const isBuilder = mode === 'builder';
  const isHtml    = mode === 'html';
  const isFull    = mode === 'full';

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

          {/* Dropdown — shown on very small screens */}
          <select
            className="mode-select-mobile"
            value={mode}
            onChange={e => setEditorMode(e.target.value as EditorMode)}
            aria-label="Editor mode"
          >
            {(Object.keys(MODE_LABELS) as EditorMode[]).map(m => (
              <option key={m} value={m}>{MODE_LABELS[m]}</option>
            ))}
          </select>

          {/* Toggle tabs — hidden on very small screens via CSS */}
          <div className="mode-toggle mode-toggle-inline">
            {(Object.keys(MODE_LABELS) as EditorMode[]).map(m => (
              <button
                key={m}
                type="button"
                className={`mode-btn ${mode === m ? 'mode-btn--active' : ''}`}
                onClick={() => setEditorMode(m)}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
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

      {/* ── Mobile panel tabs (hidden on lg+ via CSS) ────────────── */}
      <div className="mobile-panel-tabs" role="tablist">
        <button
          type="button" role="tab"
          aria-selected={mobilePanel === 'edit'}
          className={`mobile-panel-tab ${mobilePanel === 'edit' ? 'mobile-panel-tab--active' : ''}`}
          onClick={() => setMobilePanel('edit')}
        >
          ✏️ Edit
        </button>
        <button
          type="button" role="tab"
          aria-selected={mobilePanel === 'preview'}
          className={`mobile-panel-tab ${mobilePanel === 'preview' ? 'mobile-panel-tab--active' : ''}`}
          onClick={() => setMobilePanel('preview')}
        >
          👁 Preview
        </button>
      </div>

      {/* ── Main layout ─────────────────────────────────────────── */}
      <div className="editor-layout">

        {/* Controls — hidden on mobile when preview tab is active */}
        <div
          className="editor-controls"
          style={{ display: mobilePanel === 'preview' ? 'none' : undefined }}
        >
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

          {/* Meta */}
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
                  placeholder="welcome-banner" maxLength={60} autoComplete="off"
                  inputMode="url" disabled={!!saved}
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

          {/* ── FULL MODE ─────────────────────────────────────── */}
          {isFull && (
            <FullHtmlEditor
              html={draft.customHtml}
              css={draft.customCss}
              translations={draft.translations}
              frameworkImports={draft.frameworkImports}
              langs={langs}
              activeLang={activeLang}
              onHtmlChange={setCustomHtml}
              onCssChange={setCustomCss}
              onTranslationsChange={setTranslations}
              onFrameworkImportsChange={setFrameworkImports}
            />
          )}

          {/* ── HTML MODE ─────────────────────────────────────── */}
          {isHtml && (
            <>
              <StylePicker value={draft.bannerStyles} onChange={setBannerStyles} />
              <JsTriggerPicker value={draft.jsTrigger} onChange={setJsTrigger} />
              <HtmlModeEditor
                html={draft.customHtml}
                translations={draft.translations}
                langs={langs}
                activeLang={activeLang}
                onChange={setCustomHtml}
                onTranslationsChange={setTranslations}
              />
            </>
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

        {/* Preview — hidden on mobile when edit tab is active */}
        <div
          className="editor-preview"
          style={{ display: mobilePanel === 'edit' ? 'none' : undefined }}
        >
          <LivePreview draft={draft} activeLang={activeLang} />
        </div>
      </div>
    </div>
  );
}