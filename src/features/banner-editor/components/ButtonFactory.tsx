import React from 'react';
import { useRouter } from 'next/router';

type LangValue = Record < string, string > | string;

interface ButtonItem {
  id ? : string;
  // label may be legacy string or map of locale->string
  label: LangValue;
  url ? : string;
  target ? : '_self' | '_blank';
  style ? : string;
  color ? : string;
  size ? : string;
  order ? : number;
  disabled ? : boolean;
  // any other arbitrary fields that the rest of the app may use
  [key: string]: any;
}

interface Props {
  btn: ButtonItem;
  // update(fieldName, value) is used by parent to persist changes
  update: (field: string, value: any) => void;
  // optional override for language (keeps UI identical when provided)
  currentLang ? : string;
}

const ButtonFactory: React.FC < Props > = ({ btn, update, currentLang }) => {
  const router = useRouter();
  const lang = currentLang ?? (router && (router.locale as string | undefined)) ?? 'en';
  
  // Helper to safely read label for the input control
  const getLabelForInput = (): string => {
    if (typeof btn.label === 'string') return btn.label;
    if (!btn.label || typeof btn.label !== 'object') return '';
    return btn.label[lang] ?? '';
  };
  
  // Handler for label input changes — preserves other locale keys
  const handleLabelChange = (e: React.ChangeEvent < HTMLInputElement > ) => {
    const newVal = e.target.value;
    
    if (typeof btn.label === 'string') {
      // legacy: label was a string — update as string
      update('label', newVal);
      return;
    }
    
    // ensure we start from an object
    const base: Record < string, string > = (btn.label && typeof btn.label === 'object') ? { ...btn.label } : {};
    const updated: Record < string, string > = {
      ...base,
      [lang]: newVal,
    };
    update('label', updated);
  };
  
  // Generic field updater for simple string/number/boolean fields
  const updateField = (field: string) => (
    e: React.ChangeEvent < HTMLInputElement | HTMLSelectElement >
  ) => {
    const target = e.target as HTMLInputElement;
    // handle checkbox separately
    if (target.type === 'checkbox') {
      update(field, (target as HTMLInputElement).checked);
      return;
    }
    
    // numeric fields (like order) — keep numeric if possible
    if (field === 'order') {
      const n = parseInt(target.value, 10);
      update(field, Number.isNaN(n) ? 0 : n);
      return;
    }
    
    update(field, target.value);
  };
  
  // Keep UI classes and placeholders the same as original expectations
  return (
    <div className="button-factory">
      {/* Label field (fixed so input.value is always a string) */}
      <div className="field-row">
        <label className="field-label">Label</label>
        <input
          className="field-input"
          type="text"
          value={getLabelForInput()}
          placeholder="Click Here"
          onChange={handleLabelChange}
          maxLength={80}
        />
      </div>

      {/* URL field */}
      <div className="field-row">
        <label className="field-label">URL</label>
        <input
          className="field-input"
          type="text"
          value={btn.url ?? ''}
          placeholder="https://example.com"
          onChange={updateField('url')}
        />
      </div>

      {/* Target (same window or new tab) */}
      <div className="field-row">
        <label className="field-label">Open in</label>
        <select
          className="field-input"
          value={btn.target ?? '_self'}
          onChange={updateField('target')}
        >
          <option value="_self">Same window</option>
          <option value="_blank">New tab</option>
        </select>
      </div>

      {/* Style / Color / Size — kept simple inputs to preserve UI */}
      <div className="field-row">
        <label className="field-label">Style</label>
        <input
          className="field-input"
          type="text"
          value={btn.style ?? ''}
          placeholder="primary / outline / ghost"
          onChange={updateField('style')}
        />
      </div>

      <div className="field-row">
        <label className="field-label">Color</label>
        <input
          className="field-input"
          type="text"
          value={btn.color ?? ''}
          placeholder="e.g. #0070f3 or blue"
          onChange={updateField('color')}
        />
      </div>

      <div className="field-row">
        <label className="field-label">Size</label>
        <select
          className="field-input"
          value={btn.size ?? 'md'}
          onChange={updateField('size')}
        >
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
        </select>
      </div>

      {/* Order */}
      <div className="field-row">
        <label className="field-label">Order</label>
        <input
          className="field-input"
          type="number"
          value={typeof btn.order === 'number' ? String(btn.order) : (btn.order ?? '')}
          onChange={updateField('order')}
          min={0}
        />
      </div>

      {/* Disabled checkbox */}
      <div className="field-row">
        <label className="field-label">Disabled</label>
        <input
          className="field-checkbox"
          type="checkbox"
          checked={!!btn.disabled}
          onChange={(e) => update('disabled', e.target.checked)}
        />
      </div>

      {/* Keep any other UI/controls intact by preserving a generic place for extra controls */}
      <div className="field-row">
        <label className="field-label">Extra</label>
        <input
          className="field-input"
          type="text"
          value={btn.extra ?? ''}
          placeholder="extra data (not mandatory)"
          onChange={updateField('extra')}
        />
      </div>
    </div>
  );
};

export default ButtonFactory;