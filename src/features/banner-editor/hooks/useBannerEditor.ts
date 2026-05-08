// Path: src/features/banner-editor/hooks/useBannerEditor.ts
// Purpose: Editor state. v5: 2 modes, builder→html conversion on mode switch.

'use client';

import { useState, useCallback } from 'react';
import { convertBuilderToHtml }  from '@/shared/lib/bannerTemplate';
import type {
  Banner, CreateBannerInput, UpdateBannerInput,
  ButtonConfig, ContentBlock, ImageAssets,
  CountdownConfig, SliderConfig, JsTriggerPreset,
  BannerTranslations, EditorMode, BannerPublicPayload,
} from '@/shared/types/banner';

async function adminFetch(path: string, opts?: RequestInit) {
  const secret = process.env.NEXT_PUBLIC_ADMIN_API_SECRET ?? '';
  const res = await fetch(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${secret}`,
      ...(opts?.headers ?? {}),
    },
  });
  return res.json();
}

export interface EditorDraft {
  slug:            string;
  name:            string;
  bannerStyles:    string;
  editorMode:      EditorMode;
  customHtml:      Record<string, string>;
  customCss:       Record<string, string>;
  translations:    BannerTranslations;
  supportedLangs:  string[];
  content:         ContentBlock[];
  buttons:         ButtonConfig[];
  buttonConfig:    ButtonConfig | null;
  imageAssets:     ImageAssets | null;
  jsTrigger:       JsTriggerPreset | null;
  countdownConfig: CountdownConfig | null;
  sliderConfig:    SliderConfig | null;
  allowedDomains:  string[];
}

function bannerToDraft(b: Banner): EditorDraft {
  return {
    slug:            b.slug,
    name:            b.name,
    bannerStyles:    b.bannerStyles,
    editorMode:      b.editorMode ?? 'builder',
    customHtml:      b.customHtml ?? {},
    customCss:       b.customCss  ?? {},
    translations:    b.translations ?? {},
    supportedLangs:  b.supportedLangs?.length ? b.supportedLangs : ['en', 'th'],
    content:         b.content ?? [],
    buttons:         b.buttons ?? [],
    buttonConfig:    b.buttonConfig,
    imageAssets:     b.imageAssets,
    jsTrigger:       b.jsTrigger,
    countdownConfig: b.countdownConfig,
    sliderConfig:    b.sliderConfig,
    allowedDomains:  b.allowedDomains,
  };
}

function draftToPayload(d: EditorDraft): BannerPublicPayload {
  return {
    slug:            d.slug,
    bannerStyles:    d.bannerStyles,
    editorMode:      d.editorMode,
    customHtml:      d.customHtml,
    customCss:       d.customCss,
    translations:    d.translations,
    supportedLangs:  d.supportedLangs,
    content:         d.content,
    buttons:         d.buttons,
    buttonConfig:    d.buttonConfig,
    imageAssets:     d.imageAssets,
    jsTrigger:       d.jsTrigger,
    countdownConfig: d.countdownConfig,
    sliderConfig:    d.sliderConfig,
  };
}

const emptyDraft = (): EditorDraft => ({
  slug:'', name:'', bannerStyles:'',
  editorMode:'builder', customHtml:{}, customCss:{},
  translations:{}, supportedLangs:['en','th'],
  content:[], buttons:[], buttonConfig:null, imageAssets:null,
  jsTrigger:null, countdownConfig:null, sliderConfig:null, allowedDomains:[],
});

export function useBannerEditor(initial?: Banner) {
  const [saved,      setSaved]      = useState<Banner|null>(initial ?? null);
  const [draft,      setDraft]      = useState<EditorDraft>(initial ? bannerToDraft(initial) : emptyDraft());
  const [activeLang, setActiveLang] = useState('en');
  const [saving,     setSaving]     = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error,      setError]      = useState<string|null>(null);

  const updateField = useCallback(<K extends keyof EditorDraft>(key: K, value: EditorDraft[K]) => {
    setDraft(d => ({ ...d, [key]: value }));
    setError(null);
  }, []);

  // ── Mode switch with builder→html conversion ──────────────────────────────
  const setEditorMode = useCallback((nextMode: EditorMode) => {
    setDraft(current => {
      // Builder → HTML: generate HTML from current builder state for all langs
      if (current.editorMode === 'builder' && nextMode === 'html') {
        const langs = current.supportedLangs?.length ? current.supportedLangs : ['en','th'];
        const payload = draftToPayload(current);
        const { html, css } = convertBuilderToHtml(payload, langs);
        return { ...current, editorMode: nextMode, customHtml: html, customCss: css };
      }
      // HTML → Builder: just switch mode; builder state (content/buttons etc.) is preserved
      return { ...current, editorMode: nextMode };
    });
    setError(null);
  }, []);

  const setContent         = useCallback((v: ContentBlock[])       => updateField('content', v),         [updateField]);
  const setButtons         = useCallback((v: ButtonConfig[])       => updateField('buttons', v),         [updateField]);
  const setButtonConfig    = useCallback((v: ButtonConfig|null)    => updateField('buttonConfig', v),    [updateField]);
  const setImageAssets     = useCallback((v: ImageAssets|null)     => updateField('imageAssets', v),     [updateField]);
  const setJsTrigger       = useCallback((v: JsTriggerPreset|null) => updateField('jsTrigger', v),       [updateField]);
  const setCountdownConfig = useCallback((v: CountdownConfig|null) => updateField('countdownConfig', v), [updateField]);
  const setSliderConfig    = useCallback((v: SliderConfig|null)    => updateField('sliderConfig', v),    [updateField]);
  const setBannerStyles    = useCallback((v: string)               => updateField('bannerStyles', v),    [updateField]);
  const setCustomHtml      = useCallback((v: Record<string,string>) => updateField('customHtml', v),     [updateField]);
  const setCustomCss       = useCallback((v: Record<string,string>) => updateField('customCss', v),      [updateField]);
  const setTranslations    = useCallback((v: BannerTranslations)   => updateField('translations', v),    [updateField]);

  const save = useCallback(async (): Promise<boolean> => {
    setSaving(true); setError(null);
    try {
      if (!draft.slug || !draft.name) { setError('Slug and name are required.'); return false; }
      const body: CreateBannerInput | UpdateBannerInput = {
        ...(saved ? {} : { slug: draft.slug }),
        name:            draft.name,
        bannerStyles:    draft.bannerStyles,
        editorMode:      draft.editorMode,
        customHtml:      draft.customHtml,
        customCss:       draft.customCss,
        translations:    draft.translations,
        supportedLangs:  draft.supportedLangs,
        content:         draft.content,
        buttons:         draft.buttons,
        buttonConfig:    draft.buttonConfig,
        imageAssets:     draft.imageAssets,
        jsTrigger:       draft.jsTrigger,
        countdownConfig: draft.countdownConfig,
        sliderConfig:    draft.sliderConfig,
        allowedDomains:  draft.allowedDomains,
      };
      const result = await adminFetch(
        saved ? `/api/banners/${saved.id}` : '/api/banners',
        { method: saved ? 'PATCH' : 'POST', body: JSON.stringify(body) }
      );
      if (!result.ok) { setError(result.error ?? 'Save failed'); return false; }
      setSaved(result.data);
      setDraft(bannerToDraft(result.data));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      return false;
    } finally { setSaving(false); }
  }, [draft, saved]);

  const publish = useCallback(async (): Promise<boolean> => {
    if (!saved) { setError('Save first.'); return false; }
    setPublishing(true); setError(null);
    try {
      const result = await adminFetch(`/api/publish/${saved.id}`, { method: 'POST' });
      if (!result.ok) { setError(result.error ?? 'Publish failed'); return false; }
      setSaved(result.data); return true;
    } catch (err) { setError(err instanceof Error ? err.message : 'Publish failed'); return false; }
    finally { setPublishing(false); }
  }, [saved]);

  const unpublish = useCallback(async (): Promise<boolean> => {
    if (!saved) return false;
    setPublishing(true); setError(null);
    try {
      const result = await adminFetch(`/api/publish/${saved.id}`, { method: 'DELETE' });
      if (!result.ok) { setError(result.error ?? 'Unpublish failed'); return false; }
      setSaved(result.data); return true;
    } catch (err) { setError(err instanceof Error ? err.message : 'Unpublish failed'); return false; }
    finally { setPublishing(false); }
  }, [saved]);

  const isDirty = saved
    ? JSON.stringify(bannerToDraft(saved)) !== JSON.stringify(draft)
    : true;

  return {
    saved, draft, activeLang, setActiveLang,
    saving, publishing, error, isDirty,
    updateField, setBannerStyles, setEditorMode,
    setContent, setButtons, setButtonConfig, setImageAssets,
    setJsTrigger, setCountdownConfig, setSliderConfig,
    setCustomHtml, setCustomCss, setTranslations,
    save, publish, unpublish,
  };
}