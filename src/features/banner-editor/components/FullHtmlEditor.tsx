// Path:    src/features/banner-editor/components/FullHtmlEditor.tsx
// Purpose: 'full' editor mode — user writes complete HTML + CSS from root.
//          No wrapper injected. No CSS scoping. Supports CDN framework imports.
//          Includes template picker from templateLibrary and per-lang editing.
// Used by: BannerEditor.tsx

'use client';

import { useState, useCallback, useMemo } from 'react';
import type { BannerTranslations, FrameworkImport } from '@/shared/types/banner';
import {
  TEMPLATE_LIBRARY,
  TEMPLATE_CATEGORIES,
  type BannerTemplate,
} from '../lib/templateLibrary';

// ── Security: same sanitizer as HtmlModeEditor ────────────────────────────────
// In 'full' mode we allow all structural HTML; still block scripts/events.
// WHY: flexibility is the point, but XSS is still not acceptable.
const BLOCKED_ATTRS = /\bon\w+\s*=/gi;
const BLOCKED_JS    = /javascript\s*:/gi;

function sanitizeFullHtml(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(BLOCKED_ATTRS, 'data-blocked-event=')
    .replace(BLOCKED_JS,    'javascript-blocked:');
}

function validateUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:';
  } catch { return false; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

// ── Template Picker ───────────────────────────────────────────────────────────
interface TemplatePickerProps {
  onSelect: (tpl: BannerTemplate) => void;
  onClose:  () => void;
}

function TemplatePicker({ onSelect, onClose }: TemplatePickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [hovered, setHovered] = useState<string | null>(null);

  const visible = useMemo(() =>
    activeCategory === 'all'
      ? TEMPLATE_LIBRARY
      : TEMPLATE_LIBRARY.filter(t => t.category === activeCategory),
    [activeCategory]
  );

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.45)',
      zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center',
      padding:24,
    }}>
      <div style={{
        background:'var(--bg-surface)', borderRadius:16,
        width:'100%', maxWidth:720, maxHeight:'80vh',
        display:'flex', flexDirection:'column', overflow:'hidden',
        boxShadow:'0 20px 60px rgba(0,0,0,.25)',
      }}>
        {/* Header */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'16px 20px', borderBottom:'1px solid var(--border)',
        }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700 }}>เลือก Template</div>
            <div style={{ fontSize:12, color:'var(--tx-3)', marginTop:2 }}>
              จาก Training Library — แก้ไขได้ทุกอย่างหลังจากเลือก
            </div>
          </div>
          <button type="button" className="btn-icon-remove" onClick={onClose} style={{ fontSize:20 }}>✕</button>
        </div>

        {/* Category tabs */}
        <div style={{ display:'flex', gap:4, padding:'10px 20px', borderBottom:'1px solid var(--border)' }}>
          {TEMPLATE_CATEGORIES.map(cat => (
            <button key={cat.id} type="button"
              className={`mode-btn ${activeCategory === cat.id ? 'mode-btn--active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div style={{ overflowY:'auto', padding:20, display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
          {visible.map(tpl => (
            <button key={tpl.id} type="button"
              onMouseEnter={() => setHovered(tpl.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => { onSelect(tpl); onClose(); }}
              style={{
                background: hovered === tpl.id ? '#f0fdf4' : 'var(--bg-subtle)',
                border: hovered === tpl.id ? '2px solid var(--brand-1)' : '2px solid var(--border)',
                borderRadius:12, padding:'16px 14px',
                cursor:'pointer', textAlign:'left',
                display:'flex', flexDirection:'column', gap:8,
                transition:'all .15s',
              }}>
              <span style={{ fontSize:28 }}>{tpl.icon}</span>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--tx-1)' }}>{tpl.name}</span>
              <span style={{ fontSize:11, color:'var(--tx-3)', lineHeight:1.4 }}>{tpl.description}</span>
              <span style={{
                display:'inline-block', fontSize:10, fontWeight:600,
                padding:'2px 8px', borderRadius:999,
                background: hovered === tpl.id ? '#d1fae5' : 'var(--bg-surface)',
                color: hovered === tpl.id ? '#065f46' : 'var(--tx-3)',
                alignSelf:'flex-start', transition:'all .15s',
              }}>
                {tpl.category}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Framework Imports Editor ──────────────────────────────────────────────────
interface FrameworkImportsEditorProps {
  value:    FrameworkImport[];
  onChange: (v: FrameworkImport[]) => void;
}

const FRAMEWORK_PRESETS: { label: string; imports: FrameworkImport[] }[] = [
  {
    label: 'Tailwind CSS (CDN)',
    imports: [{ type: 'js', url: 'https://cdn.tailwindcss.com' }],
  },
  {
    label: 'Bootstrap 5',
    imports: [
      { type: 'css', url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css' },
    ],
  },
  {
    label: 'Animate.css',
    imports: [{ type: 'css', url: 'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css' }],
  },
  {
    label: 'Font Awesome 6',
    imports: [{ type: 'css', url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css' }],
  },
];

function FrameworkImportsEditor({ value, onChange }: FrameworkImportsEditorProps) {
  const [showPresets, setShowPresets] = useState(false);

  function addManual() {
    onChange([...value, { type: 'css', url: '' }]);
  }

  function addPreset(preset: typeof FRAMEWORK_PRESETS[number]) {
    const existing = value.map(v => v.url);
    const toAdd = preset.imports.filter(i => !existing.includes(i.url));
    onChange([...value, ...toAdd]);
    setShowPresets(false);
  }

  function removeImport(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function updateImport(idx: number, key: keyof FrameworkImport, val: string) {
    onChange(value.map((imp, i) => i === idx ? { ...imp, [key]: val } : imp));
  }

  return (
    <div className="component-section">
      <div className="section-header">
        <label className="section-label">
          <span className="section-icon">📦</span>
          Framework / CDN Imports
        </label>
        <div style={{ display:'flex', gap:6 }}>
          <button type="button" className="btn btn--xs btn--ghost"
            onClick={() => setShowPresets(v => !v)}>
            Presets ▾
          </button>
          <button type="button" className="btn btn--xs btn--secondary" onClick={addManual}>
            + URL
          </button>
        </div>
      </div>

      {showPresets && (
        <div style={{ padding:'0 16px 12px', display:'flex', flexWrap:'wrap', gap:6 }}>
          {FRAMEWORK_PRESETS.map(p => (
            <button key={p.label} type="button"
              className="btn btn--xs btn--ghost"
              onClick={() => addPreset(p)}>
              {p.label}
            </button>
          ))}
        </div>
      )}

      {value.length > 0 && (
        <div className="section-fields">
          {value.map((imp, idx) => {
            const isValid = !imp.url || validateUrl(imp.url);
            return (
              <div key={idx} style={{ display:'flex', gap:6, alignItems:'center' }}>
                <select className="field-select" style={{ maxWidth:56 }}
                  value={imp.type}
                  onChange={e => updateImport(idx, 'type', e.target.value)}>
                  <option value="css">CSS</option>
                  <option value="js">JS</option>
                </select>
                <input className="field-input" type="url"
                  style={{ flex:1, borderColor: imp.url && !isValid ? '#ef4444' : undefined }}
                  placeholder="https://cdn.example.com/style.css"
                  value={imp.url}
                  onChange={e => updateImport(idx, 'url', e.target.value)} />
                <button type="button" className="btn-icon-remove" onClick={() => removeImport(idx)}>✕</button>
              </div>
            );
          })}
          <span className="field-hint">
            ⚠️ HTTPS only — HTTP URLs จะถูกบล็อก
          </span>
        </div>
      )}
    </div>
  );
}

// ── Language Tab HTML editor ──────────────────────────────────────────────────
interface LangHtmlEditorProps {
  html:       Record<string, string>;
  css:        Record<string, string>;
  langs:      string[];
  activeLang: string;
  onHtmlChange: (v: Record<string, string>) => void;
  onCssChange:  (v: Record<string, string>) => void;
}

function LangHtmlEditor({ html, css, langs, activeLang, onHtmlChange, onCssChange }: LangHtmlEditorProps) {
  const [activeTab, setActiveTab] = useState<'html' | 'css'>('html');

  const currentHtml = html[activeLang] ?? html['en'] ?? '';
  const currentCss  = css[activeLang]  ?? css['en']  ?? '';

  // Copy EN content to this lang if empty
  function copyFromEn() {
    if (activeLang === 'en') return;
    onHtmlChange({ ...html, [activeLang]: html['en'] ?? '' });
    onCssChange({ ...css,   [activeLang]: css['en']  ?? '' });
  }

  const hasLangContent = !!(html[activeLang] || css[activeLang]);

  return (
    <div className="component-section">
      <div className="section-header">
        <label className="section-label">
          <span className="section-icon">{activeTab === 'html' ? '🧩' : '🎨'}</span>
          {activeTab === 'html' ? 'Full HTML' : 'Full CSS'} — {activeLang.toUpperCase()}
        </label>
        <div style={{ display:'flex', gap:4 }}>
          <div className="mode-toggle" style={{ marginLeft:0 }}>
            <button type="button"
              className={`mode-btn ${activeTab === 'html' ? 'mode-btn--active' : ''}`}
              onClick={() => setActiveTab('html')}>
              HTML
            </button>
            <button type="button"
              className={`mode-btn ${activeTab === 'css' ? 'mode-btn--active' : ''}`}
              onClick={() => setActiveTab('css')}>
              CSS
            </button>
          </div>
        </div>
      </div>

      <div className="section-fields">
        {/* Copy from EN prompt */}
        {activeLang !== 'en' && !hasLangContent && (
          <div style={{
            padding:'10px 12px', background:'#eff6ff', borderRadius:8,
            border:'1px solid #bfdbfe', display:'flex', alignItems:'center',
            justifyContent:'space-between', gap:8,
          }}>
            <span style={{ fontSize:12, color:'#1d4ed8' }}>
              ยังไม่มีเนื้อหาสำหรับ {activeLang.toUpperCase()} — คัดลอกจาก EN แล้วแก้ไข?
            </span>
            <button type="button" className="btn btn--xs btn--secondary" onClick={copyFromEn}>
              Copy from EN
            </button>
          </div>
        )}

        {activeTab === 'html' && (
          <>
            <textarea className="field-textarea" rows={16}
              value={currentHtml}
              spellCheck={false}
              style={{ fontFamily:'monospace', fontSize:12 }}
              placeholder={`<div class="my-banner">\n  <h2>Banner Title</h2>\n  <p>Description here</p>\n  <a href="#" class="my-btn">Click Here</a>\n</div>`}
              onChange={e => onHtmlChange({ ...html, [activeLang]: e.target.value })} />
            <span className="field-hint">
              &lt;script&gt; และ event handlers ถูกกรองออกอัตโนมัติ
              {' · '}ใช้ <code>data-i18n="key"</code> สำหรับข้อความหลายภาษา
            </span>
          </>
        )}

        {activeTab === 'css' && (
          <>
            <textarea className="field-textarea" rows={16}
              value={currentCss}
              spellCheck={false}
              style={{ fontFamily:'monospace', fontSize:12 }}
              placeholder={`.my-banner {\n  display: flex;\n  padding: 24px;\n  background: #fff;\n  border-radius: 16px;\n}\n\n.my-btn {\n  padding: 10px 20px;\n  background: #13b47f;\n  color: #fff;\n  border-radius: 999px;\n}`}
              onChange={e => onCssChange({ ...css, [activeLang]: e.target.value })} />
            <span className="field-hint">
              CSS นี้ไม่ถูก scope — เขียนได้อิสระตั้งแต่ root element
              {langs.length > 1 && ' · ถ้าไม่ระบุ CSS ของภาษานี้จะ fallback ไป EN'}
            </span>
          </>
        )}

        {/* Char count indicator */}
        <div style={{ display:'flex', justifyContent:'flex-end', gap:12 }}>
          <span style={{ fontSize:11, color:'var(--tx-muted)' }}>
            HTML: {(html[activeLang]?.length ?? 0).toLocaleString()} chars
          </span>
          <span style={{ fontSize:11, color:'var(--tx-muted)' }}>
            CSS: {(css[activeLang]?.length ?? 0).toLocaleString()} chars
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Translations editor (reused from HtmlModeEditor pattern) ──────────────────
interface TranslationsEditorProps {
  translations: BannerTranslations;
  langs:        string[];
  onChange:     (v: BannerTranslations) => void;
}

function TranslationsEditor({ translations, langs, onChange }: TranslationsEditorProps) {
  const keys = useMemo(() => {
    const all = new Set<string>();
    for (const lv of Object.values(translations)) Object.keys(lv).forEach(k => all.add(k));
    return Array.from(all);
  }, [translations]);

  function addKey() {
    const key = prompt('Key name (e.g. headline):');
    if (!key?.trim()) return;
    const next = { ...translations };
    for (const l of langs) next[l] = { ...(next[l] ?? {}), [key.trim()]: '' };
    onChange(next);
  }

  function removeKey(key: string) {
    const next = { ...translations };
    for (const l of langs) {
      const lv = { ...(next[l] ?? {}) };
      delete lv[key];
      next[l] = lv;
    }
    onChange(next);
  }

  function updateValue(lang: string, key: string, val: string) {
    onChange({ ...translations, [lang]: { ...(translations[lang] ?? {}), [key]: val } });
  }

  if (keys.length === 0) return (
    <div className="component-section">
      <div className="section-header">
        <label className="section-label"><span className="section-icon">🌐</span>Translations (data-i18n)</label>
        <button type="button" className="btn btn--xs btn--secondary" onClick={addKey}>+ Key</button>
      </div>
      <div className="section-fields">
        <p className="field-hint">
          ใช้ <code>data-i18n="key"</code> ใน HTML แล้วกด + Key เพื่อเพิ่มคำแปลสำหรับแต่ละภาษา
        </p>
      </div>
    </div>
  );

  return (
    <div className="component-section">
      <div className="section-header">
        <label className="section-label"><span className="section-icon">🌐</span>Translations ({keys.length} keys)</label>
        <button type="button" className="btn btn--xs btn--secondary" onClick={addKey}>+ Key</button>
      </div>
      {keys.map(key => (
        <div key={key} className="section-fields" style={{ borderTop:'1px solid var(--border)', paddingTop:10 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <code className="field-label">{key}</code>
            <button type="button" className="btn-icon-remove" onClick={() => removeKey(key)}>✕</button>
          </div>
          {langs.map(l => (
            <div key={l} className="field-row">
              <label className="field-label">{l.toUpperCase()}</label>
              <input className="field-input" type="text"
                value={translations[l]?.[key] ?? ''}
                onChange={e => updateValue(l, key, e.target.value)} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  html:              Record<string, string>;
  css:               Record<string, string>;
  translations:      BannerTranslations;
  frameworkImports:  FrameworkImport[];
  langs:             string[];
  activeLang:        string;
  onHtmlChange:           (v: Record<string, string>) => void;
  onCssChange:            (v: Record<string, string>) => void;
  onTranslationsChange:   (v: BannerTranslations) => void;
  onFrameworkImportsChange: (v: FrameworkImport[]) => void;
}

export function FullHtmlEditor({
  html, css, translations, frameworkImports,
  langs, activeLang,
  onHtmlChange, onCssChange, onTranslationsChange, onFrameworkImportsChange,
}: Props) {
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const handleTemplateSelect = useCallback((tpl: BannerTemplate) => {
    // WHY: populate both 'en' slot and activeLang slot so preview works immediately.
    const newHtml = { ...html, en: tpl.html, [activeLang]: tpl.html };
    const newCss  = { ...css,  en: tpl.css,  [activeLang]: tpl.css  };
    onHtmlChange(newHtml);
    onCssChange(newCss);
  }, [html, css, activeLang, onHtmlChange, onCssChange]);

  return (
    <>
      {showTemplatePicker && (
        <TemplatePicker
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}

      {/* Template picker trigger */}
      <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg-subtle)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--tx-2)' }}>Full Control Mode</div>
            <div style={{ fontSize:11, color:'var(--tx-3)', marginTop:2 }}>
              เขียน HTML + CSS ได้ตั้งแต่ root — ไม่มี wrapper บังคับ
            </div>
          </div>
          <button type="button" className="btn btn--secondary"
            style={{ fontSize:12 }}
            onClick={() => setShowTemplatePicker(true)}>
            📐 เลือก Template
          </button>
        </div>
      </div>

      {/* Framework imports */}
      <FrameworkImportsEditor
        value={frameworkImports}
        onChange={onFrameworkImportsChange}
      />

      {/* Per-lang HTML + CSS editor */}
      <LangHtmlEditor
        html={html} css={css}
        langs={langs} activeLang={activeLang}
        onHtmlChange={onHtmlChange}
        onCssChange={onCssChange}
      />

      {/* Translations */}
      <TranslationsEditor
        translations={translations}
        langs={langs}
        onChange={onTranslationsChange}
      />
    </>
  );
}