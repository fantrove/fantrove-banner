// Path:    src/features/banner-editor/components/MultiButtonEditor.tsx
// Purpose: Multiple CTA buttons — up to 5 buttons per banner.
//          Supersedes ButtonFactory (single button). Backward-compat kept via
//          buttonConfig in service layer.
// Used by: BannerEditor.tsx

'use client';

import type { ButtonConfig } from '@/shared/types/banner';

interface Props {
  value:    ButtonConfig[];
  onChange: (v: ButtonConfig[]) => void;
}

const MAX_BUTTONS = 5;

const ALLOWED_CLASSES = [
  { value: 'button button-secondary',     label: 'Secondary (Green outline)' },
  { value: 'button button-primary',        label: 'Primary (Solid green)' },
  { value: 'button button-secondary oc',   label: 'Secondary + Wave effect' },
  { value: 'banner-btn-white',             label: 'White (for dark banners)' },
  { value: 'banner-btn-dark',              label: 'Dark' },
] as const;

function defaultButton(): ButtonConfig {
  return { label: 'Click Here', href: '/', className: 'button button-secondary', target: '_self' };
}

export function MultiButtonEditor({ value, onChange }: Props) {
  function addButton() {
    if (value.length >= MAX_BUTTONS) return;
    onChange([...value, defaultButton()]);
  }

  function removeButton(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function updateButton<K extends keyof ButtonConfig>(idx: number, key: K, v: ButtonConfig[K]) {
    onChange(value.map((b, i) => i === idx ? { ...b, [key]: v } : b));
  }

  return (
    <div className="component-section">
      <div className="section-header">
        <label className="section-label">
          <span className="section-icon">🖱</span>
          Buttons
          <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--tx-3)', marginLeft: 6 }}>
            ({value.length}/{MAX_BUTTONS})
          </span>
        </label>
        <button
          type="button"
          className="btn btn--xs btn--secondary"
          onClick={addButton}
          disabled={value.length >= MAX_BUTTONS}
        >
          + Add
        </button>
      </div>

      {value.length === 0 && (
        <div className="section-fields">
          <p className="field-hint" style={{ textAlign: 'center', padding: '8px 0' }}>
            No buttons — click + Add to create one
          </p>
        </div>
      )}

      {value.map((btn, idx) => (
        <div key={idx} className="section-fields" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span className="field-label" style={{ marginBottom: 0 }}>Button {idx + 1}</span>
            <button type="button" className="btn-icon-remove" onClick={() => removeButton(idx)} aria-label="Remove">✕</button>
          </div>

          <div className="field-row">
            <label className="field-label">Label</label>
            <input
              className="field-input"
              type="text"
              value={btn.label}
              placeholder="Click Here"
              onChange={e => updateButton(idx, 'label', e.target.value)}
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
              onChange={e => updateButton(idx, 'href', e.target.value)}
            />
          </div>

          <div className="field-row">
            <label className="field-label">Style</label>
            <select
              className="field-select"
              value={btn.className}
              onChange={e => updateButton(idx, 'className', e.target.value)}
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
                    name={`target-${idx}`}
                    value={t}
                    checked={btn.target === t}
                    onChange={() => updateButton(idx, 'target', t)}
                  />
                  {t === '_self' ? 'Same tab' : 'New tab'}
                </label>
              ))}
            </div>
          </div>

          {/* Preview */}
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
      ))}
    </div>
  );
}