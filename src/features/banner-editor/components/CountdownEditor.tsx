// Path:    src/features/banner-editor/components/CountdownEditor.tsx
// Purpose: No-code UI for configuring the Countdown component.
//          End time is fetched from Server API — never hardcoded in client JS.
// Used by: BannerEditor.tsx

'use client';

import type { CountdownConfig } from '@/shared/types/banner';

interface Props {
  value: CountdownConfig | null;
  onChange: (v: CountdownConfig | null) => void;
}

const DEFAULT_COUNTDOWN: CountdownConfig = {
  endIso: new Date(Date.now() + 7 * 86400 * 1000).toISOString(), // 7 days from now
  labels: { days: 'Days', hours: 'Hrs', mins: 'Min', secs: 'Sec' },
};

export function CountdownEditor({ value, onChange }: Props) {
  const cfg = value ?? DEFAULT_COUNTDOWN;
  
  function handleEnable(enabled: boolean) {
    onChange(enabled ? DEFAULT_COUNTDOWN : null);
  }
  
  function updateLabel(key: keyof CountdownConfig['labels'], v: string) {
    onChange({ ...cfg, labels: { ...cfg.labels, [key]: v } });
  }
  
  // Display local datetime for the input, store as ISO UTC
  const localValue = cfg.endIso ?
    new Date(cfg.endIso).toISOString().slice(0, 16) :
    '';
  
  function handleDateChange(v: string) {
    if (!v) return;
    onChange({ ...cfg, endIso: new Date(v).toISOString() });
  }
  
  return (
    <div className="component-section">
      <div className="section-header">
        <label className="section-label">
          <span className="section-icon">⏱</span>
          Countdown Timer
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
            <label className="field-label">End Date &amp; Time (UTC)</label>
            <input
              className="field-input"
              type="datetime-local"
              value={localValue}
              onChange={e => handleDateChange(e.target.value)}
            />
            <span className="field-hint">
              Stored as UTC — shown in visitor&apos;s local timezone on site
            </span>
          </div>

          <div className="field-row">
            <label className="field-label">Labels</label>
            <div className="label-grid">
              {(['days', 'hours', 'mins', 'secs'] as const).map(k => (
                <div key={k} className="label-item">
                  <span className="label-key">{k}</span>
                  <input
                    className="field-input field-input--sm"
                    type="text"
                    value={cfg.labels[k]}
                    onChange={e => updateLabel(k, e.target.value)}
                    maxLength={10}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="field-preview">
            <span className="field-preview-label">Preview (static):</span>
            <div className="countdown-preview">
              {(['days', 'hours', 'mins', 'secs'] as const).map((k, i) => (
                <span key={k} className="countdown-cell">
                  <span className="countdown-num">{['07', '23', '59', '42'][i]}</span>
                  <span className="countdown-lbl">{cfg.labels[k]}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}