// Path:    src/features/banner-editor/components/SliderEditor.tsx
// Purpose: No-code UI for the Dynamic Slider component.
//          Image URLs come from Supabase Storage (S3) — no arbitrary uploads.
// Used by: BannerEditor.tsx

'use client';

import type { SliderConfig } from '@/shared/types/banner';

interface Props {
  value: SliderConfig | null;
  onChange: (v: SliderConfig | null) => void;
}

const DEFAULT_SLIDER: SliderConfig = {
  images: [{ url: '', alt: '' }],
  interval: 3000,
  animation: 'fade',
};

export function SliderEditor({ value, onChange }: Props) {
  const cfg = value ?? DEFAULT_SLIDER;
  
  function handleEnable(enabled: boolean) {
    onChange(enabled ? DEFAULT_SLIDER : null);
  }
  
  function updateImage(idx: number, key: 'url' | 'alt', v: string) {
    const images = cfg.images.map((img, i) => i === idx ? { ...img, [key]: v } : img);
    onChange({ ...cfg, images });
  }
  
  function addImage() {
    onChange({ ...cfg, images: [...cfg.images, { url: '', alt: '' }] });
  }
  
  function removeImage(idx: number) {
    const images = cfg.images.filter((_, i) => i !== idx);
    onChange({ ...cfg, images: images.length ? images : [{ url: '', alt: '' }] });
  }
  
  return (
    <div className="component-section">
      <div className="section-header">
        <label className="section-label">
          <span className="section-icon">🖼</span>
          Dynamic Slider
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
            <label className="field-label">Animation</label>
            <div className="radio-group">
              {(['fade', 'slide'] as const).map(a => (
                <label key={a} className="radio-label">
                  <input
                    type="radio"
                    name="animation"
                    value={a}
                    checked={cfg.animation === a}
                    onChange={() => onChange({ ...cfg, animation: a })}
                  />
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div className="field-row">
            <label className="field-label">
              Interval: <strong>{cfg.interval / 1000}s</strong>
            </label>
            <input
              type="range"
              min={1000} max={8000} step={500}
              value={cfg.interval}
              onChange={e => onChange({ ...cfg, interval: Number(e.target.value) })}
              className="field-range"
            />
          </div>

          <div className="field-row">
            <label className="field-label">Images</label>
            <div className="image-list">
              {cfg.images.map((img, idx) => (
                <div key={idx} className="image-item">
                  <span className="image-idx">#{idx + 1}</span>
                  <input
                    className="field-input"
                    type="url"
                    placeholder="https://… (Supabase Storage URL)"
                    value={img.url}
                    onChange={e => updateImage(idx, 'url', e.target.value)}
                  />
                  <input
                    className="field-input field-input--sm"
                    type="text"
                    placeholder="Alt text"
                    value={img.alt}
                    onChange={e => updateImage(idx, 'alt', e.target.value)}
                    maxLength={100}
                  />
                  {cfg.images.length > 1 && (
                    <button
                      type="button"
                      className="btn-icon-remove"
                      onClick={() => removeImage(idx)}
                      aria-label="Remove image"
                    >✕</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" className="btn-add-row" onClick={addImage}>
              + Add Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}