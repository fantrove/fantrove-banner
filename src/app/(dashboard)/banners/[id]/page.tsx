// Path:    src/app/(dashboard)/banners/[id]/page.tsx
// Purpose: Edit existing banner — Server Component fetches initial data,
//          passes to client BannerEditor for hydration.
// Used by: Dashboard /banners/[id]

import { notFound } from 'next/navigation';
import { getBannerById } from '@/features/banner-editor/services/bannerService';
import { BannerEditorClient } from './BannerEditorClient';

interface Props {
  params: Promise < { id: string } > ;
}

export default async function EditBannerPage({ params }: Props) {
  const { id } = await params;
  let banner;
  try {
    banner = await getBannerById(id);
  } catch {
    banner = null;
  }
  
  if (!banner) notFound();
  
  return <BannerEditorClient initial={banner} />;
}