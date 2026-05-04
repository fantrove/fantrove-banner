// Path:    src/features/banner-editor/hooks/useBannerEditor.ts
// Purpose: Manages all editor state — draft changes, save/publish actions,
//          loading and error states. Decouples UI from API calls.
// Used by: BannerEditor component, new/page.tsx, [id]/page.tsx

'use client';

import { useState, useCallback } from 'react';
import type {
  Banner, CreateBannerInput, UpdateBannerInput,
  ButtonConfig, ImageAssets, CountdownConfig,
  SliderConfig, JsTriggerPreset,
} from '@/shared/types/banner';

// ── Admin API fetch helper ────────────────────────────────────────────────────
// All admin API calls include the ADMIN_API_SECRET from client env.
// WHY: NEXT_PUBLIC_ prefix exposes it to the browser — this is intentional
// for a single-tenant admin dashboard. Multi-tenant → use Supabase Auth instead.
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

// ── EditorDraft ───────────────────────────────────────────────────────────────
// Local working copy of the banner — only saved when user clicks Save.
export interface EditorDraft {
  slug:            string;
  name:            string;
  bannerStyles:    string;
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
  buttonConfig:    null,
  imageAssets:     null,
  jsTrigger:       null,
  countdownConfig: null,
  sliderConfig:    null,
  allowedDomains:  [],
});

// ── useBannerEditor ───────────────────────────────────────────────────────────
export function useBannerEditor(initial?: Banner) {
  const [saved,     setSaved]     = useState<Banner | null>(initial ?? null);
  const [draft,     setDraft]     = useState<EditorDraft>(
    initial ? bannerToDraft(initial) : emptyDraft()
  );
  const [saving,    setSaving]    = useState(false);
  const [publishing,setPublishing]= useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // ── Draft field updaters ──────────────────────────────────────────────────

  const updateField = useCallback(<K extends keyof EditorDraft>(key: K, value: EditorDraft[K]) => {
    setDraft(d => ({ ...d, [key]: value }));
    setError(null);
  }, []);

  const setButtonConfig    = useCallback((v: ButtonConfig | null) => updateField('buttonConfig', v), [updateField]);
  const setImageAssets     = useCallback((v: ImageAssets | null) => updateField('imageAssets', v), [updateField]);
  const setJsTrigger       = useCallback((v: JsTriggerPreset | null) => updateField('jsTrigger', v), [updateField]);
  const setCountdownConfig = useCallback((v: CountdownConfig | null) => updateField('countdownConfig', v), [updateField]);
  const setSliderConfig    = useCallback((v: SliderConfig | null) => updateField('sliderConfig', v), [updateField]);
  const setBannerStyles    = useCallback((v: string) => updateField('bannerStyles', v), [updateField]);

  // ── Save (create or update) ───────────────────────────────────────────────
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
        // Update existing
        const body: UpdateBannerInput = {
          name:            draft.name,
          bannerStyles:    draft.bannerStyles,
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
        // Create new
        const body: CreateBannerInput = {
          slug:            draft.slug,
          name:            draft.name,
          bannerStyles:    draft.bannerStyles,
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
    // State
    saved, draft, saving, publishing, error, isDirty,
    // Updaters
    updateField, setBannerStyles, setButtonConfig,
    setImageAssets, setJsTrigger, setCountdownConfig, setSliderConfig,
    // Actions
    save, publish, unpublish,
  };
}