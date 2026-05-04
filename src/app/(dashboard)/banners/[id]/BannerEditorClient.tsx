// Path:    src/app/(dashboard)/banners/[id]/BannerEditorClient.tsx
// Purpose: Thin client wrapper — Server page passes serialisable props,
//          this component adds router-aware callbacks.
// Used by: app/(dashboard)/banners/[id]/page.tsx

'use client';

import { BannerEditor } from '@/features/banner-editor/components/BannerEditor';
import type { Banner } from '@/shared/types/banner';

interface Props {
  initial: Banner;
}

export function BannerEditorClient({ initial }: Props) {
  // No redirect needed on edit — stay on same URL
  return <BannerEditor initial={initial} />;
}