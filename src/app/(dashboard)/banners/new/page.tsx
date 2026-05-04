// Path:    src/app/(dashboard)/banners/new/page.tsx
// Purpose: Create new banner page.

'use client';

import { useRouter } from 'next/navigation';
import { BannerEditor } from '@/features/banner-editor/components/BannerEditor';
import type { Banner } from '@/shared/types/banner';

export default function NewBannerPage() {
  const router = useRouter();
  
  function handleSaved(banner: Banner) {
    // Redirect to edit page after creation so the URL reflects the real ID
    router.replace(`/banners/${banner.id}`);
  }
  
  return <BannerEditor onSaved={handleSaved} />;
}