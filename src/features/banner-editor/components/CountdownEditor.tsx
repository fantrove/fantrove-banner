// Path: src/features/banner-editor/components/CountdownEditor.tsx
// Purpose: Countdown editor. v3: activeLang for per-language unit labels.

'use client';

import type { CountdownConfig, LangValue } from '@/shared/types/banner';

interface Props {
  value:      CountdownConfig | null;
  onChange:   (v: CountdownConfig | null) => void;
  activeLang: string;
}

const DEFAULT_COUNTDOWN: CountdownConfig = {
  endIso: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
  labels: { days: 'Days', hours: 'Hrs', mins: 'Min', secs: 'Sec' },
};

// ── LangValue helpers ─────────────────────────────────────────────────────────
function getLang(val: LangValue, lang: string): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val[lang] ?? val['en'] ?? '';
}

function setLang(val: LangValue, lang: string, next: string): LangValue {
  if (typeof val === 'string') {
    if (lang === 'en') return next;
    return { en: val, [lang]: next };
  }
  return { ...val, [lang]: next };
}

export function CountdownEditor({ value, onChange, activeLang }: Props) {
  const cfg = value ?? DEFAULT_COUNTDOWN;

  function handleEnable(enabled: boolean) {
    onChange(enabled ? DEFAULT_COUNTDOWN : null);
  }

  function updateLabel(key: keyof CountdownConfig['labels'], next: string) {
    onChange({ ...cfg, labels: { ...cfg.labels, [key]: setLang(cfg.labels[key], activeLang, next) } });
  }

  const localValue = cfg.endIso
    ? new Date(cfg.endIso).toISOString().slice(0, 16)
    : '';

  function handleDateChange(v: string) {
    if (!v) return;
    onChange({ ...cfg, endIso: new Date(v).toISOString() });
  }

  const units = ['days', 'hours', 'mins', 'secs'] as const;

  return (
    <div className="component-section">
      <div className="section-header">
        <label className="section-label">
          <span className="section-icon">⏱</span>
          Countdown Timer
        </label>
        <label className="toggle-switch">
          <input type="checkbox" checked={value !== null}
            onChange={e => handleEnable(e.target.checked)} />
          <span className="toggle-track" />
        </label>
      </div>

      {value !== null && (
        <div className="section-fields">
          <div className="field-row">
            <label className="field-label">End Date &amp; Time (UTC)</label>
            <input className="field-input" type="datetime-local"
              value={localValue}
              onChange={e => handleDateChange(e.target.value)} />
            <span className="field-hint">
              Stored as UTC — shown in visitor&apos;s local timezone
            </span>
          </div>

          <div className="field-row">
            <label className="field-label">
              Unit Labels [{activeLang.toUpperCase()}]
            </label>
            <div className="label-grid">
              {units.map(k => {
                const labelVal = getLang(cfg.labels[k], activeLang);
                const enVal    = activeLang !== 'en' && typeof cfg.labels[k] === 'object'
                  ? String((cfg.labels[k] as Record<string, string>)['en'] ?? '')
                  : null;
                return (
                  <div key={k} className="label-item">
                    <span className="label-key">{k}</span>
                    <input className="field-input field-input--sm" type="text"
                      value={labelVal}
                      placeholder={enVal ?? k}
                      onChange={e => updateLabel(k, e.target.value)}
                      maxLength={10} />
                    {enVal && (
                      <span style={{ fontSize: 10, color: 'var(--tx-muted)' }}>{enVal}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Static preview */}
          <div className="field-preview">
            <span className="field-preview-label">Preview (static):</span>
            <div className="countdown-preview">
              {units.map((k, i) => (
                <span key={k} className="countdown-cell">
                  <span className="countdown-num">{['07','23','59','42'][i]}</span>
                  <span className="countdown-lbl">{getLang(cfg.labels[k], activeLang)}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}