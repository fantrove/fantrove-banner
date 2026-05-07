// Path: src/features/banner-editor/components/HtmlModeEditor.tsx
// Purpose: HTML mode editor — write raw HTML + visual element panel for
//          quick editing without touching code. Supports i18n via data-i18n.

'use client';

import { useState, useCallback, useMemo } from 'react';
import type { BannerTranslations } from '@/shared/types/banner';

// ── HTML Validator ────────────────────────────────────────────────────────────
const ALLOWED_TAGS = new Set([
  'div','span','p','a','img','h1','h2','h3','h4',
  'strong','em','b','i','br','ul','ol','li',
  'section','figure','figcaption','hr','small',
]);
const BLOCKED_TAGS = new Set([
  'script','iframe','object','embed','form','input',
  'textarea','button','select','style','link','meta','base',
]);

interface ValidationIssue {
  type: 'error' | 'warn';
  message: string;
}

function validateHtml(html: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const tagMatches = html.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g);
  const found = new Set<string>();
  for (const m of tagMatches) {
    const tag = m[1].toLowerCase();
    if (!found.has(tag)) {
      found.add(tag);
      if (BLOCKED_TAGS.has(tag)) issues.push({ type: 'error', message: `<${tag}> ไม่อนุญาต — จะถูกลบออกก่อนบันทึก` });
      else if (!ALLOWED_TAGS.has(tag)) issues.push({ type: 'warn', message: `<${tag}> ไม่รู้จัก — อาจแสดงผลไม่ถูกต้อง` });
    }
  }
  if (/on\w+\s*=/i.test(html)) issues.push({ type: 'error', message: 'Event handlers (onclick ฯลฯ) ไม่อนุญาต — จะถูกลบออก' });
  if (/javascript\s*:/i.test(html)) issues.push({ type: 'error', message: 'javascript: URLs ไม่อนุญาต' });
  return issues;
}

// ── Element Inspector (parse HTML → editable controls) ────────────────────────
type EKind = 'heading'|'text'|'link'|'image';
interface EditableEl {
  beId:  string;
  kind:  EKind;
  tag?:  string;
  text?: string;
  href?: string;
  cls?:  string;
  src?:  string;
  alt?:  string;
}

function parseElements(html: string): EditableEl[] {
  try {
    const doc = new DOMParser().parseFromString(`<div id="_root">${html}</div>`, 'text/html');
    const root = doc.getElementById('_root')!;
    const els: EditableEl[] = [];
    let id = 0;
    root.querySelectorAll('h1,h2,h3,h4').forEach(el => {
      els.push({ beId: String(id++), kind: 'heading', tag: el.tagName.toLowerCase(), text: el.textContent ?? '' });
    });
    root.querySelectorAll('p').forEach(el => {
      els.push({ beId: String(id++), kind: 'text', text: el.textContent ?? '' });
    });
    root.querySelectorAll('a').forEach(el => {
      els.push({ beId: String(id++), kind: 'link', text: el.textContent ?? '', href: el.getAttribute('href') ?? '', cls: el.className });
    });
    root.querySelectorAll('img').forEach(el => {
      els.push({ beId: String(id++), kind: 'image', src: el.getAttribute('src') ?? '', alt: el.getAttribute('alt') ?? '' });
    });
    return els;
  } catch { return []; }
}

// Update an element inside HTML string by its parsed index
function updateElement(html: string, el: EditableEl): string {
  try {
    const doc = new DOMParser().parseFromString(`<div id="_root">${html}</div>`, 'text/html');
    const root = doc.getElementById('_root')!;
    let idx = 0;
    const selector = el.kind === 'heading' ? 'h1,h2,h3,h4'
                   : el.kind === 'text'    ? 'p'
                   : el.kind === 'link'    ? 'a'
                   : 'img';
    root.querySelectorAll(selector).forEach(node => {
      if (String(idx++) !== el.beId) return;
      if (el.kind === 'heading' || el.kind === 'text') {
        node.textContent = el.text ?? '';
      } else if (el.kind === 'link') {
        node.textContent = el.text ?? '';
        if (el.href !== undefined) node.setAttribute('href', el.href);
        if (el.cls  !== undefined) node.className = el.cls;
      } else if (el.kind === 'image') {
        if (el.src !== undefined) node.setAttribute('src', el.src);
        if (el.alt !== undefined) node.setAttribute('alt', el.alt);
      }
    });
    return root.innerHTML;
  } catch { return html; }
}

// ── Translations editor ───────────────────────────────────────────────────────
interface TranslationsEditorProps {
  translations: BannerTranslations;
  langs: string[];
  onChange: (v: BannerTranslations) => void;
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

  return (
    <div className="component-section">
      <div className="section-header">
        <label className="section-label"><span className="section-icon">🌐</span>Translations (data-i18n)</label>
        <button type="button" className="btn btn--xs btn--secondary" onClick={addKey}>+ Key</button>
      </div>
      {keys.length === 0 && (
        <div className="section-fields">
          <p className="field-hint">ยังไม่มี key — ใช้ <code>data-i18n="key"</code> ใน HTML แล้วกด + Key เพื่อเพิ่มคำแปล</p>
        </div>
      )}
      {keys.map(key => (
        <div key={key} className="section-fields" style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

// ── HtmlModeEditor ────────────────────────────────────────────────────────────
interface Props {
  html:         Record<string, string>;  // lang → html
  translations: BannerTranslations;
  langs:        string[];
  activeLang:   string;
  onChange:     (html: Record<string, string>) => void;
  onTranslationsChange: (v: BannerTranslations) => void;
}

export function HtmlModeEditor({ html, translations, langs, activeLang, onChange, onTranslationsChange }: Props) {
  const [showInspector, setShowInspector] = useState(true);

  const currentHtml = html[activeLang] ?? html['en'] ?? '';

  const updateHtml = useCallback((val: string) => {
    onChange({ ...html, [activeLang]: val });
  }, [html, activeLang, onChange]);

  const elements = useMemo(() => parseElements(currentHtml), [currentHtml]);
  const issues   = useMemo(() => validateHtml(currentHtml), [currentHtml]);

  function handleElementChange(el: EditableEl) {
    const next = updateElement(currentHtml, el);
    updateHtml(next);
  }

  const KIND_ICON: Record<EKind, string> = { heading: 'H', text: '¶', link: '🔗', image: '🖼' };

  return (
    <>
      {/* Validation */}
      {issues.length > 0 && (
        <div className="section-fields" style={{ paddingTop: 8 }}>
          {issues.map((iss, i) => (
            <div key={i} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 4, marginBottom: 4,
              background: iss.type === 'error' ? '#fef2f2' : '#fefce8',
              color: iss.type === 'error' ? '#991b1b' : '#92400e',
              border: `1px solid ${iss.type === 'error' ? '#fecaca' : '#fde68a'}` }}>
              {iss.type === 'error' ? '⛔' : '⚠️'} {iss.message}
            </div>
          ))}
        </div>
      )}

      {/* HTML textarea */}
      <div className="component-section">
        <div className="section-header">
          <label className="section-label"><span className="section-icon">🧩</span>HTML Source ({activeLang.toUpperCase()})</label>
          <button type="button" className="btn-text-sm" onClick={() => setShowInspector(v => !v)}>
            {showInspector ? 'ซ่อน Inspector' : 'แสดง Inspector'}
          </button>
        </div>
        <div className="section-fields">
          <textarea
            className="field-textarea"
            rows={12}
            value={currentHtml}
            placeholder={`<h2>Banner Headline</h2>\n<p>Body text here</p>\n<a href="/" class="button button-secondary">Click Here</a>`}
            onChange={e => updateHtml(e.target.value)}
            spellCheck={false}
            style={{ fontFamily: 'monospace', fontSize: 12 }}
          />
          <span className="field-hint">
            Tags allowed: {Array.from(ALLOWED_TAGS).join(', ')}
            {' · '}ใช้ <code>data-i18n="key"</code> สำหรับข้อความที่ต้องแปลภาษา
          </span>
        </div>
      </div>

      {/* Element Inspector */}
      {showInspector && (
        <div className="component-section">
          <div className="section-header">
            <label className="section-label"><span className="section-icon">🔍</span>Element Inspector ({elements.length})</label>
          </div>
          {elements.length === 0 && (
            <div className="section-fields">
              <p className="field-hint">ยังไม่พบ elements ที่แก้ไขได้ — เพิ่ม heading, p, a, img ใน HTML</p>
            </div>
          )}
          {elements.map(el => (
            <div key={el.beId} className="section-fields" style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: 4 }}>
                  {KIND_ICON[el.kind]} {el.tag ?? el.kind}
                </span>
              </div>

              {(el.kind === 'heading' || el.kind === 'text') && (
                <div className="field-row">
                  <label className="field-label">Text</label>
                  <input className="field-input" type="text" value={el.text ?? ''}
                    onChange={e => handleElementChange({ ...el, text: e.target.value })} />
                </div>
              )}

              {el.kind === 'link' && (
                <>
                  <div className="field-row">
                    <label className="field-label">Label</label>
                    <input className="field-input" type="text" value={el.text ?? ''}
                      onChange={e => handleElementChange({ ...el, text: e.target.value })} />
                  </div>
                  <div className="field-row">
                    <label className="field-label">href</label>
                    <input className="field-input" type="text" value={el.href ?? ''}
                      onChange={e => handleElementChange({ ...el, href: e.target.value })} />
                  </div>
                  <div className="field-row">
                    <label className="field-label">Class</label>
                    <select className="field-select" value={el.cls ?? ''}
                      onChange={e => handleElementChange({ ...el, cls: e.target.value })}>
                      <option value="">— none —</option>
                      <option value="button button-secondary">Secondary (outline)</option>
                      <option value="button button-primary">Primary (solid)</option>
                      <option value="banner-btn-white">White</option>
                      <option value="banner-btn-dark">Dark</option>
                    </select>
                  </div>
                </>
              )}

              {el.kind === 'image' && (
                <>
                  <div className="field-row">
                    <label className="field-label">src</label>
                    <input className="field-input" type="url" value={el.src ?? ''}
                      onChange={e => handleElementChange({ ...el, src: e.target.value })} />
                  </div>
                  <div className="field-row">
                    <label className="field-label">alt</label>
                    <input className="field-input" type="text" value={el.alt ?? ''}
                      onChange={e => handleElementChange({ ...el, alt: e.target.value })} />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Translations */}
      <TranslationsEditor translations={translations} langs={langs} onChange={onTranslationsChange} />
    </>
  );
}