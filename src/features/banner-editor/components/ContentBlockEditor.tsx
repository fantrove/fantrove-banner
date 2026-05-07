// Path: src/features/banner-editor/components/ContentBlockEditor.tsx
// Purpose: Content blocks editor. v3: activeLang lets you edit per-language values.

'use client';

import { useCallback } from 'react';
import type { ContentBlock, LangValue } from '@/shared/types/banner';

interface Props {
  value: ContentBlock[];
  onChange: (v: ContentBlock[]) => void;
  activeLang: string;
}

const BLOCK_TYPES: { value: ContentBlock['type'];label: string;icon: string } [] = [
  { value: 'heading', label: 'Heading', icon: 'H' },
  { value: 'text', label: 'Text', icon: '¶' },
  { value: 'html', label: 'HTML', icon: '</>' },
];

function makeId() { return Math.random().toString(36).slice(2, 9); }

function defaultBlock(type: ContentBlock['type']): ContentBlock {
  return { id: makeId(), type, value: '', align: 'left', level: type === 'heading' ? 2 : undefined };
}

// ── Resolve and update LangValue ──────────────────────────────────────────────
// Gets the value for the active language.
function getLangVal(val: LangValue, lang: string): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val[lang] ?? val['en'] ?? '';
}

// Sets only the active language's value, preserving other languages.
function setLangVal(val: LangValue, lang: string, next: string): LangValue {
  if (typeof val === 'string') {
    // Promote to Record if lang != 'en' or existing string was base
    if (lang === 'en') return next;
    return { en: val, [lang]: next };
  }
  return { ...val, [lang]: next };
}

export function ContentBlockEditor({ value, onChange, activeLang }: Props) {
  const blocks = value;
  
  const addBlock = useCallback((type: ContentBlock['type']) => {
    onChange([...blocks, defaultBlock(type)]);
  }, [blocks, onChange]);
  
  const updateBlock = useCallback(<K extends keyof ContentBlock>(id: string, key: K, v: ContentBlock[K]) => {
    onChange(blocks.map(b => b.id === id ? { ...b, [key]: v } : b));
  }, [blocks, onChange]);

  const updateBlockText = useCallback((id: string, next: string) => {
    onChange(blocks.map(b => {
      if (b.id !== id) return b;
      return { ...b, value: setLangVal(b.value, activeLang, next) };
    }));
  }, [blocks, activeLang, onChange]);

  const removeBlock = useCallback((id: string) => {
    onChange(blocks.filter(b => b.id !== id));
  }, [blocks, onChange]);

  const moveBlock = useCallback((id: string, dir: -1 | 1) => {
    const idx  = blocks.findIndex(b => b.id === id);
    const next = idx + dir;
    if (next < 0 || next >= blocks.length) return;
    const arr = [...blocks];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    onChange(arr);
  }, [blocks, onChange]);

  return (
    <div className="component-section">
      <div className="section-header">
        <label className="section-label">
          <span className="section-icon">✏️</span>
          Content Blocks
          <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--tx-3)', marginLeft: 6 }}>
            [{activeLang.toUpperCase()}]
          </span>
        </label>
      </div>

      <div className="section-fields">
        {blocks.length === 0 && (
          <p className="field-hint" style={{ textAlign: 'center', padding: '8px 0' }}>
            No blocks yet — add one below
          </p>
        )}

        {blocks.map((block, idx) => {
          const textVal = getLangVal(block.value, activeLang);
          const typeInfo = BLOCK_TYPES.find(t => t.value === block.type);

          return (
            <div key={block.id} className="cb-block">
              <div className="cb-block-header">
                <span className="cb-type-badge">
                  {typeInfo?.icon} {block.type}
                  {block.type === 'heading' && ` H${block.level ?? 2}`}
                </span>

                <select className="field-select cb-select-sm"
                  value={block.align ?? 'left'}
                  onChange={e => updateBlock(block.id, 'align', e.target.value as ContentBlock['align'])}>
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>

                {block.type === 'heading' && (
                  <select className="field-select cb-select-sm"
                    value={block.level ?? 2}
                    onChange={e => updateBlock(block.id, 'level', Number(e.target.value) as 1|2|3)}>
                    <option value={1}>H1</option>
                    <option value={2}>H2</option>
                    <option value={3}>H3</option>
                  </select>
                )}

                <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                  <button type="button" className="cb-move-btn"
                    onClick={() => moveBlock(block.id, -1)} disabled={idx === 0}>↑</button>
                  <button type="button" className="cb-move-btn"
                    onClick={() => moveBlock(block.id, 1)} disabled={idx === blocks.length - 1}>↓</button>
                  <button type="button" className="btn-icon-remove"
                    onClick={() => removeBlock(block.id)}>✕</button>
                </div>
              </div>

              {block.type === 'html' ? (
                <>
                  <textarea className="field-textarea" rows={5}
                    value={textVal}
                    placeholder="<p>Raw HTML for this language</p>"
                    onChange={e => updateBlockText(block.id, e.target.value)}
                    spellCheck={false} />
                  <span className="field-hint">
                    ⚠️ &lt;script&gt;, event handlers ถูกลบอัตโนมัติ
                  </span>
                </>
              ) : (
                <textarea className="field-textarea"
                  rows={block.type === 'heading' ? 2 : 3}
                  value={textVal}
                  placeholder={block.type === 'heading' ? 'Headline…' : 'Body text…'}
                  onChange={e => updateBlockText(block.id, e.target.value)} />
              )}

              {/* Show if other lang has value */}
              {activeLang !== 'en' && typeof block.value === 'object' && block.value['en'] && (
                <span className="field-hint">EN: {String(block.value['en']).slice(0, 60)}</span>
              )}
            </div>
          );
        })}

        <div className="cb-add-row">
          {BLOCK_TYPES.map(t => (
            <button key={t.value} type="button" className="btn-add-row cb-add-btn"
              onClick={() => addBlock(t.value)}>
              + {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}