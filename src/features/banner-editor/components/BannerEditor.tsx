// Path: src/features/banner-editor/components/BannerEditor.tsx
// Purpose: Main editor — v4 with 3 modes: Builder | HTML | Full.

'use client';

import type { Banner }                  from '@/shared/types/banner';
import { useBannerEditor }              from '../hooks/useBannerEditor';
import { ContentBlockEditor }           from './ContentBlockEditor';
import { MultiButtonEditor }            from './MultiButtonEditor';
import { CountdownEditor }              from './CountdownEditor';
import { SliderEditor }                 from './SliderEditor';
import { StylePicker, JsTriggerPicker } from './StylePicker';
import { LivePreview }                  from './LivePreview';
import { HtmlModeEditor }               from './HtmlModeEditor';
import { FullHtmlEditor }               from './FullHtmlEditor';

interface Props { initial?: Banner; onSaved?: (b: Banner) => void }

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

  async function handleSave() {
    const ok = await save();
    if (ok && saved && onSaved) onSaved(saved);
  }

  const langs    = draft.supportedLangs?.length ? draft.supportedLangs : ['en', 'th'];
  const mode     = draft.editorMode;
  const isBuilder = mode === 'builder';
  const isHtml    = mode === 'html';
  const isFull    = mode === 'full';

  return (
    <div className="editor-root">

      {/* ── Header bar ──────────────────────────────────────────────────── */}
      <div className="editor-topbar">
        <div className="editor-topbar-left">
          <h1 className="editor-title">{saved ? `Edit: ${saved.name}` : 'New Banner'}</h1>
          {saved && (
            <span className={`status-badge ${saved.isPublished ? 'status-badge--live' : 'status-badge--draft'}`}>
              {saved.isPublished ? '● Live' : '○ Draft'}
            </span>
          )}
          {isDirty && <span className="unsaved-dot" title="Unsaved changes">●</span>}

          {/* Mode toggle — 3 modes */}
          <div className="mode-toggle">
            <button type="button"
              className={`mode-btn ${isBuilder ? 'mode-btn--active' : ''}`}
              onClick={() => setEditorMode('builder')}
              title="Component-based no-code editor">
              🧱 Builder
            </button>
            <button type="button"
              className={`mode-btn ${isHtml ? 'mode-btn--active' : ''}`}
              onClick={() => setEditorMode('html')}
              title="Write inner HTML; engine provides the banner wrapper">
              &lt;/&gt; HTML
            </button>
            <button type="button"
              className={`mode-btn ${isFull ? 'mode-btn--active' : ''}`}
              onClick={() => setEditorMode('full')}
              title="Full control — write everything from root, no wrapper forced">
              🔓 Full
            </button>
          </div>
        </div>

        <div className="editor-topbar-right">
          {error && <span className="topbar-error">{error}</span>}
          <button type="button" className="btn btn--secondary"
            onClick={handleSave} disabled={saving || !isDirty}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          {saved && (
            saved.isPublished ? (
              <button type="button" className="btn btn--ghost"
                onClick={unpublish} disabled={publishing}>
                {publishing ? '…' : 'Unpublish'}
              </button>
            ) : (
              <button type="button" className="btn btn--primary"
                onClick={publish} disabled={publishing || isDirty}
                title={isDirty ? 'Save first' : 'Publish to CDN'}>
                {publishing ? 'Publishing…' : 'Publish →'}
              </button>
            )
          )}
        </div>
      </div>

      {/* ── Main layout ─────────────────────────────────────────────────── */}
      <div className="editor-layout">
        <div className="editor-controls">

          {/* Language tabs — shown in all modes */}
          <div style={{ display:'flex', gap:4, padding:'10px 16px 0', borderBottom:'1px solid var(--border)' }}>
            {langs.map(l => (
              <button key={l} type="button"
                className={`mode-btn ${activeLang === l ? 'mode-btn--active' : ''}`}
                onClick={() => setActiveLang(l)}
                style={{ fontSize:11, padding:'4px 10px' }}>
                {l.toUpperCase()}
              </button>
            ))}
            <button type="button" className="btn-text-sm" style={{ marginLeft:'auto' }}
              onClick={() => {
                const l = prompt('Language code (e.g. jp):')?.trim().toLowerCase();
                if (l && !langs.includes(l))
                  updateField('supportedLangs', [...langs, l]);
              }}>
              + Lang
            </button>
          </div>

          {/* Meta — shown in all modes */}
          <div className="component-section">
            <div className="section-header">
              <label className="section-label"><span className="section-icon">📋</span>Banner Info</label>
            </div>
            <div className="section-fields">
              <div className="field-row">
                <label className="field-label">Name</label>
                <input className="field-input" type="text" value={draft.name}
                  placeholder="Welcome Banner"
                  onChange={e => updateField('name', e.target.value)} maxLength={80} />
              </div>
              <div className="field-row">
                <label className="field-label">Slug</label>
                <input className="field-input" type="text" value={draft.slug}
                  placeholder="welcome-banner"
                  onChange={e => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'-'))}
                  disabled={!!saved} maxLength={60} />
                {saved && (
                  <span className="field-hint">
                    Public URL: <code>/api/public/banners/{draft.slug}</code>
                  </span>
                )}
              </div>
              <div className="field-row">
                <label className="field-label">Allowed Domains</label>
                <input className="field-input" type="text"
                  value={draft.allowedDomains.join(', ')}
                  placeholder="fantrove.com, *.fantrove.com"
                  onChange={e => updateField('allowedDomains',
                    e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} />
              </div>
            </div>
          </div>

          {/* ── FULL MODE ───────────────────────────────────────────────── */}
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

          {/* ── HTML MODE ───────────────────────────────────────────────── */}
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

          {/* ── BUILDER MODE ────────────────────────────────────────────── */}
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

        {/* Right panel — preview */}
        <div className="editor-preview">
          <LivePreview draft={draft} activeLang={activeLang} />
        </div>
      </div>
    </div>
  );
}