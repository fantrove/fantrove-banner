// Path:    src/features/banner-editor/components/ContentBlockEditor.tsx
// Purpose: Drag-free ordered content blocks — heading, text, raw HTML.
//          HTML blocks are admin-only and sanitized server-side via the JSON pipeline.
// Used by: BannerEditor.tsx

'use client';

import { useCallback } from 'react';
import type { ContentBlock } from '@/shared/types/banner';

interface Props {
  value: ContentBlock[];
  onChange: (v: ContentBlock[]) => void;
}

const BLOCK_TYPES: { value: ContentBlock['type'];label: string;icon: string } [] = [
  { value: 'heading', label: 'Heading', icon: 'H' },
  { value: 'text', label: 'Text', icon: '¶' },
  { value: 'html', label: 'HTML', icon: '</>' },
];

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

function defaultBlock(type: ContentBlock['type']): ContentBlock {
  return {
    id: makeId(),
    type,
    value: '',
    align: 'left',
    level: type === 'heading' ? 2 : undefined,
  };
}

export function ContentBlockEditor({ value, onChange }: Props) {
  const blocks = value;
  
  const addBlock = useCallback((type: ContentBlock['type']) => {
    onChange([...blocks, defaultBlock(type)]);
  }, [blocks, onChange]);
  
  const updateBlock = useCallback(<K extends keyof ContentBlock>(
    id: string, key: K, v: ContentBlock[K]
  ) => {
    onChange(blocks.map(b => b.id === id ? { ...b, [key]: v } : b));
  }, [blocks, onChange]);

  const removeBlock = useCallback((id: string) => {
    onChange(blocks.filter(b => b.id !== id));
  }, [blocks, onChange]);

  const moveBlock = useCallback((id: string, dir: -1 | 1) => {
    const idx = blocks.findIndex(b => b.id === id);
    if (idx < 0) return;
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
        </label>
      </div>

      <div className="section-fields">
        {blocks.length === 0 && (
          <p className="field-hint" style={{ textAlign: 'center', padding: '8px 0' }}>
            No blocks yet — add one below
          </p>
        )}

        {blocks.map((block, idx) => (
          <div key={block.id} className="cb-block">
            {/* Block header */}
            <div className="cb-block-header">
              <span className="cb-type-badge cb-type-badge--{block.type}">
                {BLOCK_TYPES.find(t => t.value === block.type)?.icon ?? '?'}
                {' '}{block.type}
              </span>

              {/* Align */}
              <select
                className="field-select cb-select-sm"
                value={block.align ?? 'left'}
                onChange={e => updateBlock(block.id, 'align', e.target.value as ContentBlock['align'])}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>

              {/* Heading level */}
              {block.type === 'heading' && (
                <select
                  className="field-select cb-select-sm"
                  value={block.level ?? 2}
                  onChange={e => updateBlock(block.id, 'level', Number(e.target.value) as 1 | 2 | 3)}
                >
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
                  onClick={() => removeBlock(block.id)} aria-label="Remove block">✕</button>
              </div>
            </div>

            {/* Content input */}
            {block.type === 'html' ? (
              <>
                <textarea
                  className="field-textarea"
                  rows={5}
                  value={block.value}
                  placeholder={'<p>Raw HTML — sanitized before render</p>'}
                  onChange={e => updateBlock(block.id, 'value', e.target.value)}
                  spellCheck={false}
                />
                <span className="field-hint">
                  ⚠️ HTML stripped of &lt;script&gt;, event handlers, and dangerous attributes automatically
                </span>
              </>
            ) : (
              <textarea
                className="field-textarea"
                rows={block.type === 'heading' ? 2 : 3}
                value={block.value}
                placeholder={block.type === 'heading' ? 'Banner headline…' : 'Banner body text…'}
                onChange={e => updateBlock(block.id, 'value', e.target.value)}
              />
            )}
          </div>
        ))}

        {/* Add buttons */}
        <div className="cb-add-row">
          {BLOCK_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              className="btn-add-row cb-add-btn"
              onClick={() => addBlock(t.value)}
            >
              + {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}