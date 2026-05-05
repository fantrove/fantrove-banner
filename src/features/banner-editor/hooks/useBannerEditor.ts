// Path:    src/features/banner-editor/hooks/useBannerEditor.ts
// Purpose: Manages all editor state — draft changes, save/publish actions.
//          v2: content blocks + multiple buttons.

'use client';

import { useState, useCallback } from 'react';
import type {
  Banner, CreateBannerInput, UpdateBannerInput,
  ButtonConfig, ContentBlock, ImageAssets,
  CountdownConfig, SliderConfig, JsTriggerPreset,
} from '@/shared/types/banner';

async function adminFetch(path: string, opts?: RequestInit) {
  const secret = process.env.NEXT_PUBLIC_ADMIN_API_SECRET ?? '';
  const res = await fetch(path, {
    ...opts,
    headers: {
      'Content-Type':  'application/json',
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
  content:         ContentBlock[];
  buttons:         ButtonConfig[];
  // legacy — kept for backward compat
  buttonConfig:    ButtonConfig | null;
  imageAssets:     ImageAssets | null;
  jsTrigger:       JsTriggerPreset | null;
  countdownConfig: CountdownConfig | null;
  sliderConfig:    SliderConfig | null;
  allowedDomains:  string[];
}

function bannerToDraft(banner: Banner): EditorDraft {
  return {
    slug:            banner.slug,
    name:            banner.name,
    bannerStyles:    banner.bannerStyles,
    content:         banner.content ?? [],
    buttons:         banner.buttons ?? [],
    buttonConfig:    banner.buttonConfig,
    imageAssets:     banner.imageAssets,
    jsTrigger:       banner.jsTrigger,
    countdownConfig: banner.countdownConfig,
    sliderConfig:    banner.sliderConfig,
    allowedDomains:  banner.allowedDomains,
  };
}

const emptyDraft = (): EditorDraft => ({
  slug:            '',
  name:            '',
  bannerStyles:    '',
  content:         [],
  buttons:         [],
  buttonConfig:    null,
  imageAssets:     null,
  jsTrigger:       null,
  countdownConfig: null,
  sliderConfig:    null,
  allowedDomains:  [],
});

export function useBannerEditor(initial?: Banner) {
  const [saved,      setSaved]      = useState<Banner | null>(initial ?? null);
  const [draft,      setDraft]      = useState<EditorDraft>(
    initial ? bannerToDraft(initial) : emptyDraft()
  );
  const [saving,     setSaving]     = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const updateField = useCallback(<K extends keyof EditorDraft>(key: K, value: EditorDraft[K]) => {
    setDraft(d => ({ ...d, [key]: value }));
    setError(null);
  }, []);

  const setContent         = useCallback((v: ContentBlock[])       => updateField('content', v), [updateField]);
  const setButtons         = useCallback((v: ButtonConfig[])       => updateField('buttons', v), [updateField]);
  const setButtonConfig    = useCallback((v: ButtonConfig | null)  => updateField('buttonConfig', v), [updateField]);
  const setImageAssets     = useCallback((v: ImageAssets | null)   => updateField('imageAssets', v), [updateField]);
  const setJsTrigger       = useCallback((v: JsTriggerPreset|null) => updateField('jsTrigger', v), [updateField]);
  const setCountdownConfig = useCallback((v: CountdownConfig|null) => updateField('countdownConfig', v), [updateField]);
  const setSliderConfig    = useCallback((v: SliderConfig | null)  => updateField('sliderConfig', v), [updateField]);
  const setBannerStyles    = useCallback((v: string)               => updateField('bannerStyles', v), [updateField]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const save = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      if (!draft.slug || !draft.name) {
        setError('Slug and name are required.');
        return false;
      }

      let result;
      if (saved) {
        const body: UpdateBannerInput = {
          name:            draft.name,
          bannerStyles:    draft.bannerStyles,
          content:         draft.content,
          buttons:         draft.buttons,
          buttonConfig:    draft.buttonConfig,
          imageAssets:     draft.imageAssets,
          jsTrigger:       draft.jsTrigger,
          countdownConfig: draft.countdownConfig,
          sliderConfig:    draft.sliderConfig,
          allowedDomains:  draft.allowedDomains,
        };
        result = await adminFetch(`/api/banners/${saved.id}`, {
          method: 'PATCH', body: JSON.stringify(body),
        });
      } else {
        const body: CreateBannerInput = {
          slug:            draft.slug,
          name:            draft.name,
          bannerStyles:    draft.bannerStyles,
          content:         draft.content,
          buttons:         draft.buttons,
          buttonConfig:    draft.buttonConfig,
          imageAssets:     draft.imageAssets,
          jsTrigger:       draft.jsTrigger,
          countdownConfig: draft.countdownConfig,
          sliderConfig:    draft.sliderConfig,
          allowedDomains:  draft.allowedDomains,
        };
        result = await adminFetch('/api/banners', {
          method: 'POST', body: JSON.stringify(body),
        });
      }

      if (!result.ok) { setError(result.error ?? 'Save failed'); return false; }
      setSaved(result.data);
      setDraft(bannerToDraft(result.data));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      return false;
    } finally {
      setSaving(false);
    }
  }, [draft, saved]);

  // ── Publish ───────────────────────────────────────────────────────────────
  const publish = useCallback(async (): Promise<boolean> => {
    if (!saved) { setError('Save the banner before publishing.'); return false; }
    setPublishing(true);
    setError(null);
    try {
      const result = await adminFetch(`/api/publish/${saved.id}`, { method: 'POST' });
      if (!result.ok) { setError(result.error ?? 'Publish failed'); return false; }
      setSaved(result.data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed');
      return false;
    } finally {
      setPublishing(false);
    }
  }, [saved]);

  // ── Unpublish ─────────────────────────────────────────────────────────────
  const unpublish = useCallback(async (): Promise<boolean> => {
    if (!saved) return false;
    setPublishing(true);
    setError(null);
    try {
      const result = await adminFetch(`/api/publish/${saved.id}`, { method: 'DELETE' });
      if (!result.ok) { setError(result.error ?? 'Unpublish failed'); return false; }
      setSaved(result.data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unpublish failed');
      return false;
    } finally {
      setPublishing(false);
    }
  }, [saved]);

  const isDirty = saved
    ? JSON.stringify(bannerToDraft(saved)) !== JSON.stringify(draft)
    : true;

  return {
    saved, draft, saving, publishing, error, isDirty,
    updateField, setBannerStyles,
    setContent, setButtons,
    setButtonConfig, setImageAssets, setJsTrigger,
    setCountdownConfig, setSliderConfig,
    save, publish, unpublish,
  };
}