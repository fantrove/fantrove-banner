// Path:    src/features/banner-editor/components/StylePicker.tsx
// Purpose: No-code Style Picker + JS Trigger Preset selector.
//          Style: writes raw CSS to banner_styles (for banner-custom class).
//          Trigger: selects a preset key only — never raw JS injection.
// Used by: BannerEditor.tsx

'use client';

import { JS_TRIGGER_PRESETS, type JsTriggerPreset } from '@/shared/types/banner';

// ── StylePicker ───────────────────────────────────────────────────────────────
interface StylePickerProps {
  value: string;
  onChange: (v: string) => void;
}

const STYLE_PRESETS = [
{
  label: 'Gradient Teal→Cyan',
  css: '.banner-custom { background: linear-gradient(90deg, #13b47f, #0eb0d5); }',
},
{
  label: 'Gradient Pink→Yellow',
  css: '.banner-custom { background: linear-gradient(90deg, #ff9a9e, #fad0c4); }',
},
{
  label: 'Dark (Navy)',
  css: '.banner-custom { background: #1a1a2e; color: #e0e0e0; }',
},
{
  label: 'Pulse animation',
  css: '.banner-custom { background: linear-gradient(90deg, #ff9a9e, #fad0c4); animation: pulse 2s infinite; }',
},
{
  label: 'Custom CSS…',
  css: '',
}, ] as
const;

export function StylePicker({ value, onChange }: StylePickerProps) {
  const isPreset = STYLE_PRESETS.some(p => p.css === value && p.label !== 'Custom CSS…');
  const isCustom = !isPreset;
  
  function handlePresetSelect(css: string) {
    if (css === '' && isPreset) {
      // Switched to custom — keep existing value
      return;
    }
    onChange(css);
  }
  
  return (
    <div className="component-section">
      <div className="section-header">
        <label className="section-label">
          <span className="section-icon">🎨</span>
          Style Picker
        </label>
      </div>

      <div className="section-fields">
        <div className="field-row">
          <label className="field-label">Preset</label>
          <select
            className="field-select"
            value={isCustom ? '' : value}
            onChange={e => handlePresetSelect(e.target.value)}
          >
            {STYLE_PRESETS.map(p => (
              <option key={p.label} value={p.css}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="field-row">
          <label className="field-label">Custom CSS</label>
          <textarea
            className="field-textarea"
            rows={4}
            value={value}
            placeholder={`.banner-custom {\n  background: #13b47f;\n  color: #fff;\n}`}
            onChange={e => onChange(e.target.value)}
            spellCheck={false}
          />
          <span className="field-hint">
            Targets <code>.banner-custom</code> only — scoped to this banner
          </span>
        </div>
      </div>
    </div>
  );
}

// ── JsTriggerPicker ───────────────────────────────────────────────────────────
// Renders a grid of preset buttons — each maps to a hardcoded function
// in banner-engine.js. No raw JS is stored or executed from the DB.
interface JsTriggerPickerProps {
  value: JsTriggerPreset | null;
  onChange: (v: JsTriggerPreset | null) => void;
}

const TRIGGER_META: Record < JsTriggerPreset, { label: string;icon: string;desc: string } > = {
  confetti: { icon: '🎉', label: 'Confetti', desc: 'Confetti burst on load' },
  shake: { icon: '📳', label: 'Shake', desc: 'Shake banner on hover' },
  pulse: { icon: '💓', label: 'Pulse', desc: 'Pulsing glow animation' },
  scroll_reveal: { icon: '👁', label: 'Scroll Reveal', desc: 'Fade in when scrolled into view' },
  bounce: { icon: '⬆', label: 'Bounce', desc: 'Bounce on load' },
  glow: { icon: '✨', label: 'Glow', desc: 'Glowing border effect' },
};

export function JsTriggerPicker({ value, onChange }: JsTriggerPickerProps) {
  return (
    <div className="component-section">
      <div className="section-header">
        <label className="section-label">
          <span className="section-icon">⚡</span>
          JS Effect Preset
        </label>
        {value && (
          <button
            type="button"
            className="btn-text-sm"
            onClick={() => onChange(null)}
          >
            Clear
          </button>
        )}
      </div>

      <div className="section-fields">
        <div className="trigger-grid">
          {JS_TRIGGER_PRESETS.map(preset => {
            const meta = TRIGGER_META[preset];
            return (
              <button
                key={preset}
                type="button"
                className={`trigger-card ${value === preset ? 'trigger-card--active' : ''}`}
                onClick={() => onChange(value === preset ? null : preset)}
                title={meta.desc}
              >
                <span className="trigger-icon">{meta.icon}</span>
                <span className="trigger-label">{meta.label}</span>
              </button>
            );
          })}
        </div>
        {value && (
          <p className="field-hint">
            Selected: <strong>{TRIGGER_META[value].label}</strong> — {TRIGGER_META[value].desc}
          </p>
        )}
      </div>
    </div>
  );
}