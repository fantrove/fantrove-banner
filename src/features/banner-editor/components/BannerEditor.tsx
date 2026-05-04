// Path:    src/features/banner-editor/components/BannerEditor.tsx
// Purpose: Main editor layout — wires up all sub-components and the editor hook.
//          Two-column: left = controls, right = live preview.
// Used by: app/(dashboard)/banners/new/page.tsx, app/(dashboard)/banners/[id]/page.tsx

'use client';

import type { Banner }              from '@/shared/types/banner';
import { useBannerEditor }          from '../hooks/useBannerEditor';
import { ButtonFactory }            from './ButtonFactory';
import { CountdownEditor }          from './CountdownEditor';
import { SliderEditor }             from './SliderEditor';
import { StylePicker, JsTriggerPicker } from './StylePicker';
import { LivePreview }              from './LivePreview';

interface Props {
  initial?:   Banner;           // Existing banner for edit mode
  onSaved?:   (b: Banner) => void;
}

export function BannerEditor({ initial, onSaved }: Props) {
  const {
    saved, draft, saving, publishing, error, isDirty,
    updateField, setBannerStyles, setButtonConfig,
    setJsTrigger, setCountdownConfig, setSliderConfig,
    save, publish, unpublish,
  } = useBannerEditor(initial);

  async function handleSave() {
    const ok = await save();
    if (ok && saved && onSaved) onSaved(saved);
  }

  return (
    <div className="editor-root">

      {/* ── Header bar ─────────────────────────────────────────────────── */}
      <div className="editor-topbar">
        <div className="editor-topbar-left">
          <h1 className="editor-title">
            {saved ? `Edit: ${saved.name}` : 'New Banner'}
          </h1>
          {saved && (
            <span className={`status-badge ${saved.isPublished ? 'status-badge--live' : 'status-badge--draft'}`}>
              {saved.isPublished ? '● Live' : '○ Draft'}
            </span>
          )}
          {isDirty && <span className="unsaved-dot" title="Unsaved changes">●</span>}
        </div>

        <div className="editor-topbar-right">
          {error && <span className="topbar-error">{error}</span>}

          <button
            type="button"
            className="btn btn--secondary"
            onClick={handleSave}
            disabled={saving || !isDirty}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>

          {saved && (
            saved.isPublished ? (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={unpublish}
                disabled={publishing}
              >
                {publishing ? '…' : 'Unpublish'}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--primary"
                onClick={publish}
                disabled={publishing || isDirty}
                title={isDirty ? 'Save first, then publish' : 'Publish to CDN'}
              >
                {publishing ? 'Publishing…' : 'Publish →'}
              </button>
            )
          )}
        </div>
      </div>

      {/* ── Main layout ─────────────────────────────────────────────────── */}
      <div className="editor-layout">

        {/* Left panel: controls */}
        <div className="editor-controls">

          {/* Meta */}
          <div className="component-section">
            <div className="section-header">
              <label className="section-label">
                <span className="section-icon">📋</span>
                Banner Info
              </label>
            </div>
            <div className="section-fields">
              <div className="field-row">
                <label className="field-label">Name</label>
                <input
                  className="field-input"
                  type="text"
                  value={draft.name}
                  placeholder="Welcome Banner"
                  onChange={e => updateField('name', e.target.value)}
                  maxLength={80}
                />
              </div>

              <div className="field-row">
                <label className="field-label">Slug</label>
                <input
                  className="field-input"
                  type="text"
                  value={draft.slug}
                  placeholder="welcome-banner"
                  onChange={e => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  disabled={!!saved}         // Slug is immutable after creation
                  maxLength={60}
                />
                {saved && (
                  <span className="field-hint">
                    Public URL: <code>/api/public/banners/{draft.slug}</code>
                  </span>
                )}
              </div>

              <div className="field-row">
                <label className="field-label">Allowed Domains</label>
                <input
                  className="field-input"
                  type="text"
                  value={draft.allowedDomains.join(', ')}
                  placeholder="fantrove.com, *.fantrove.com"
                  onChange={e => updateField(
                    'allowedDomains',
                    e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  )}
                />
                <span className="field-hint">Comma-separated. Wildcards: *.example.com</span>
              </div>
            </div>
          </div>

          {/* Style Picker */}
          <StylePicker
            value={draft.bannerStyles}
            onChange={setBannerStyles}
          />

          {/* JS Trigger */}
          <JsTriggerPicker
            value={draft.jsTrigger}
            onChange={setJsTrigger}
          />

          {/* Button Factory */}
          <ButtonFactory
            value={draft.buttonConfig}
            onChange={setButtonConfig}
          />

          {/* Countdown */}
          <CountdownEditor
            value={draft.countdownConfig}
            onChange={setCountdownConfig}
          />

          {/* Slider */}
          <SliderEditor
            value={draft.sliderConfig}
            onChange={setSliderConfig}
          />

          {/* Audit log link */}
          {saved && (
            <div className="audit-link">
              <a
                href={`/banners/${saved.id}/audit`}
                className="link-muted"
              >
                View audit log →
              </a>
            </div>
          )}
        </div>

        {/* Right panel: live preview */}
        <div className="editor-preview">
          <LivePreview draft={draft} />
        </div>
      </div>
    </div>
  );
}