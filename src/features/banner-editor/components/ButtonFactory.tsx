// Path:    src/features/banner-editor/components/ButtonFactory.tsx
// Purpose: No-code UI for configuring the banner CTA button.
//          Renders a form that produces a ButtonConfig JSON object.
//          No raw JS or HTML injection — only structured data.
// Used by: BannerEditor.tsx

'use client';

import type { ButtonConfig } from '@/shared/types/banner';

interface Props {
  value:    ButtonConfig | null;
  onChange: (v: ButtonConfig | null) => void;
}

const DEFAULT_BUTTON: ButtonConfig = {
  label:     'Click Here',
  href:      '/',
  className: 'button button-secondary',
  target:    '_self',
};

// Allowed CSS classes — whitelist prevents arbitrary class injection
const ALLOWED_CLASSES = [
  { value: 'button button-secondary',     label: 'Secondary (Green outline)' },
  { value: 'button button-primary',        label: 'Primary (Solid green)' },
  { value: 'button button-secondary oc',   label: 'Secondary + Wave effect' },
  { value: 'banner-btn-white',             label: 'White (for dark banners)' },
  { value: 'banner-btn-dark',              label: 'Dark' },
] as const;

export function ButtonFactory({ value, onChange }: Props) {
  const btn = value ?? DEFAULT_BUTTON;

  function update<K extends keyof ButtonConfig>(key: K, v: ButtonConfig[K]) {
    onChange({ ...btn, [key]: v });
  }

  function handleEnable(enabled: boolean) {
    onChange(enabled ? DEFAULT_BUTTON : null);
  }

  return (
    <div className="component-section">
      <div className="section-header">
        <label className="section-label">
          <span className="section-icon">🖱</span>
          Button Factory
        </label>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={value !== null}
            onChange={e => handleEnable(e.target.checked)}
          />
          <span className="toggle-track" />
        </label>
      </div>

      {value !== null && (
        <div className="section-fields">
          <div className="field-row">
            <label className="field-label">Label</label>
            <input
              className="field-input"
              type="text"
              value={btn.label}
              placeholder="Click Here"
              onChange={e => update('label', e.target.value)}
              maxLength={80}
            />
          </div>

          <div className="field-row">
            <label className="field-label">Link (href)</label>
            <input
              className="field-input"
              type="text"
              value={btn.href}
              placeholder="/data/verse/discover/"
              onChange={e => update('href', e.target.value)}
            />
            <span className="field-hint">Internal paths or absolute URLs</span>
          </div>

          <div className="field-row">
            <label className="field-label">Style</label>
            <select
              className="field-select"
              value={btn.className}
              onChange={e => update('className', e.target.value)}
            >
              {ALLOWED_CLASSES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="field-row">
            <label className="field-label">Open in</label>
            <div className="radio-group">
              {(['_self', '_blank'] as const).map(t => (
                <label key={t} className="radio-label">
                  <input
                    type="radio"
                    name="target"
                    value={t}
                    checked={btn.target === t}
                    onChange={() => update('target', t)}
                  />
                  {t === '_self' ? 'Same tab' : 'New tab'}
                </label>
              ))}
            </div>
          </div>

          <div className="field-preview">
            <span className="field-preview-label">Preview:</span>
            <a
              href="#"
              className={btn.className}
              onClick={e => e.preventDefault()}
              style={{ pointerEvents: 'none', opacity: 0.9 }}
            >
              {btn.label || 'Button'}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}