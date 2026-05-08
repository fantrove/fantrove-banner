// Path: src/features/banner-editor/components/FullHtmlEditor.tsx
// Purpose: HTML mode editor — full HTML + CSS from root, no wrapper forced.
//          Includes template picker and per-lang editing.
//          No CDN framework import picker (removed in v5).

'use client';

import { useState, useCallback, useMemo } from 'react';
import type { BannerTranslations } from '@/shared/types/banner';
import { TEMPLATE_LIBRARY, TEMPLATE_CATEGORIES, type BannerTemplate } from '../lib/templateLibrary';

// ── Template Picker ───────────────────────────────────────────────────────────
function TemplatePicker({ onSelect, onClose }: { onSelect:(t:BannerTemplate)=>void; onClose:()=>void }) {
  const [cat, setCat] = useState('all');
  const [hov, setHov] = useState<string|null>(null);

  const visible = useMemo(() =>
    cat === 'all' ? TEMPLATE_LIBRARY : TEMPLATE_LIBRARY.filter(t => t.category === cat),
    [cat]
  );

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:24 }}>
      <div style={{ background:'var(--bg-surface)',borderRadius:16,width:'100%',maxWidth:720,maxHeight:'80vh',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,.25)' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize:16,fontWeight:700 }}>เลือก Template</div>
            <div style={{ fontSize:12,color:'var(--tx-3)',marginTop:2 }}>แก้ไขได้ทุกอย่างหลังจากเลือก</div>
          </div>
          <button type="button" className="btn-icon-remove" onClick={onClose} style={{ fontSize:20 }}>✕</button>
        </div>
        <div style={{ display:'flex',gap:4,padding:'10px 20px',borderBottom:'1px solid var(--border)',flexWrap:'wrap' }}>
          {TEMPLATE_CATEGORIES.map(c => (
            <button key={c.id} type="button"
              className={`mode-btn ${cat===c.id?'mode-btn--active':''}`}
              onClick={() => setCat(c.id)}>{c.label}</button>
          ))}
        </div>
        <div style={{ overflowY:'auto',padding:20,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12 }}>
          {visible.map(tpl => (
            <button key={tpl.id} type="button"
              onMouseEnter={() => setHov(tpl.id)}
              onMouseLeave={() => setHov(null)}
              onClick={() => { onSelect(tpl); onClose(); }}
              style={{
                background: hov===tpl.id ? '#f0fdf4' : 'var(--bg-subtle)',
                border: `2px solid ${hov===tpl.id ? 'var(--brand-1)' : 'var(--border)'}`,
                borderRadius:12,padding:'16px 14px',cursor:'pointer',
                textAlign:'left',display:'flex',flexDirection:'column',gap:8,
                transition:'all .15s',
              }}>
              <span style={{ fontSize:28 }}>{tpl.icon}</span>
              <span style={{ fontSize:13,fontWeight:700,color:'var(--tx-1)' }}>{tpl.name}</span>
              <span style={{ fontSize:11,color:'var(--tx-3)',lineHeight:1.4 }}>{tpl.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Per-lang HTML + CSS editor ────────────────────────────────────────────────
function LangEditor({
  html, css, langs, activeLang, onHtmlChange, onCssChange,
}: {
  html: Record<string,string>; css: Record<string,string>;
  langs: string[]; activeLang: string;
  onHtmlChange:(v:Record<string,string>)=>void;
  onCssChange:(v:Record<string,string>)=>void;
}) {
  const [tab, setTab] = useState<'html'|'css'>('html');
  const currentHtml = html[activeLang] ?? html['en'] ?? '';
  const currentCss  = css[activeLang]  ?? css['en']  ?? '';
  const hasContent  = !!(html[activeLang] || css[activeLang]);

  function copyFromEn() {
    if (activeLang === 'en') return;
    onHtmlChange({ ...html, [activeLang]: html['en'] ?? '' });
    onCssChange({ ...css,   [activeLang]: css['en']  ?? '' });
  }

  return (
    <div className="component-section">
      <div className="section-header">
        <label className="section-label">
          <span className="section-icon">{tab==='html'?'🧩':'🎨'}</span>
          {tab==='html'?'HTML':'CSS'} — {activeLang.toUpperCase()}
        </label>
        <div className="mode-toggle" style={{ marginLeft:0 }}>
          <button type="button" className={`mode-btn ${tab==='html'?'mode-btn--active':''}`} onClick={() => setTab('html')}>HTML</button>
          <button type="button" className={`mode-btn ${tab==='css'?'mode-btn--active':''}`}  onClick={() => setTab('css')}>CSS</button>
        </div>
      </div>
      <div className="section-fields">
        {activeLang !== 'en' && !hasContent && (
          <div style={{ padding:'10px 12px',background:'#eff6ff',borderRadius:8,border:'1px solid #bfdbfe',display:'flex',alignItems:'center',justifyContent:'space-between',gap:8 }}>
            <span style={{ fontSize:12,color:'#1d4ed8' }}>ยังไม่มีเนื้อหาสำหรับ {activeLang.toUpperCase()}</span>
            <button type="button" className="btn btn--xs btn--secondary" onClick={copyFromEn}>Copy from EN</button>
          </div>
        )}
        {tab === 'html' && (
          <>
            <textarea className="field-textarea" rows={16}
              value={currentHtml} spellCheck={false}
              style={{ fontFamily:'monospace',fontSize:12 }}
              placeholder={`<div class="my-banner">\n  <h2>Banner Title</h2>\n  <p>Description</p>\n  <a href="#" class="my-btn">Click Here</a>\n</div>`}
              onChange={e => onHtmlChange({ ...html, [activeLang]: e.target.value })} />
            <span className="field-hint">&lt;script&gt; และ event handlers ถูกกรองออกอัตโนมัติ · ใช้ <code>data-i18n="key"</code> สำหรับข้อความหลายภาษา</span>
          </>
        )}
        {tab === 'css' && (
          <>
            <textarea className="field-textarea" rows={16}
              value={currentCss} spellCheck={false}
              style={{ fontFamily:'monospace',fontSize:12 }}
              placeholder={`.my-banner {\n  display: flex;\n  padding: 24px;\n  background: #fff;\n  border-radius: 16px;\n}\n.my-btn {\n  padding: 10px 22px;\n  background: #13b47f;\n  color: #fff;\n  border-radius: 999px;\n}`}
              onChange={e => onCssChange({ ...css, [activeLang]: e.target.value })} />
            <span className="field-hint">CSS นี้ทำงานใน Shadow DOM — ไม่รั่วออกไปยังหน้าเว็บเจ้าบ้าน และไม่โดน styles ภายนอกรบกวน</span>
          </>
        )}
        <div style={{ display:'flex',justifyContent:'flex-end',gap:12 }}>
          <span style={{ fontSize:11,color:'var(--tx-muted)' }}>HTML: {(html[activeLang]?.length??0).toLocaleString()} chars</span>
          <span style={{ fontSize:11,color:'var(--tx-muted)' }}>CSS: {(css[activeLang]?.length??0).toLocaleString()} chars</span>
        </div>
      </div>
    </div>
  );
}

// ── Translations editor ───────────────────────────────────────────────────────
function TranslationsEditor({ translations, langs, onChange }: {
  translations: BannerTranslations; langs: string[];
  onChange: (v:BannerTranslations)=>void;
}) {
  const keys = useMemo(() => {
    const all = new Set<string>();
    Object.values(translations).forEach(lv => Object.keys(lv).forEach(k => all.add(k)));
    return Array.from(all);
  }, [translations]);

  function addKey() {
    const key = prompt('Key name (e.g. headline):');
    if (!key?.trim()) return;
    const next = { ...translations };
    langs.forEach(l => { next[l] = { ...(next[l]??{}), [key.trim()]: '' }; });
    onChange(next);
  }
  function removeKey(key: string) {
    const next = { ...translations };
    langs.forEach(l => { const lv = { ...(next[l]??{}) }; delete lv[key]; next[l] = lv; });
    onChange(next);
  }
  function updateValue(lang: string, key: string, val: string) {
    onChange({ ...translations, [lang]: { ...(translations[lang]??{}), [key]: val } });
  }

  return (
    <div className="component-section">
      <div className="section-header">
        <label className="section-label"><span className="section-icon">🌐</span>Translations (data-i18n){keys.length>0?` — ${keys.length} keys`:''}</label>
        <button type="button" className="btn btn--xs btn--secondary" onClick={addKey}>+ Key</button>
      </div>
      {keys.length === 0 && (
        <div className="section-fields">
          <p className="field-hint">ใช้ <code>data-i18n="key"</code> ใน HTML แล้วกด + Key เพื่อเพิ่มคำแปล</p>
        </div>
      )}
      {keys.map(key => (
        <div key={key} className="section-fields" style={{ borderTop:'1px solid var(--border)',paddingTop:10 }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
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

// ── Main export ───────────────────────────────────────────────────────────────
interface Props {
  html:         Record<string,string>;
  css:          Record<string,string>;
  translations: BannerTranslations;
  langs:        string[];
  activeLang:   string;
  onHtmlChange:         (v:Record<string,string>)=>void;
  onCssChange:          (v:Record<string,string>)=>void;
  onTranslationsChange: (v:BannerTranslations)=>void;
}

export function FullHtmlEditor({ html, css, translations, langs, activeLang, onHtmlChange, onCssChange, onTranslationsChange }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  const handleTemplateSelect = useCallback((tpl: BannerTemplate) => {
    const newHtml = { ...html, en: tpl.html, [activeLang]: tpl.html };
    const newCss  = { ...css,  en: tpl.css,  [activeLang]: tpl.css  };
    onHtmlChange(newHtml);
    onCssChange(newCss);
  }, [html, css, activeLang, onHtmlChange, onCssChange]);

  return (
    <>
      {showPicker && <TemplatePicker onSelect={handleTemplateSelect} onClose={() => setShowPicker(false)} />}

      {/* Template trigger bar */}
      <div style={{ padding:'12px 16px',borderBottom:'1px solid var(--border)',background:'var(--bg-subtle)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:12,fontWeight:600,color:'var(--tx-2)' }}>HTML Mode — Full Control</div>
          <div style={{ fontSize:11,color:'var(--tx-3)',marginTop:2 }}>เขียน HTML+CSS ได้ตั้งแต่ root · รันใน Shadow DOM (ไม่โดนรบกวนจากหน้าเว็บ)</div>
        </div>
        <button type="button" className="btn btn--secondary" style={{ fontSize:12 }} onClick={() => setShowPicker(true)}>
          📐 Template
        </button>
      </div>

      <LangEditor html={html} css={css} langs={langs} activeLang={activeLang} onHtmlChange={onHtmlChange} onCssChange={onCssChange} />
      <TranslationsEditor translations={translations} langs={langs} onChange={onTranslationsChange} />
    </>
  );
}