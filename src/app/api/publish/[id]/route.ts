// Path:    src/app/api/publish/[id]/route.ts
// Purpose: Publish or unpublish a banner (admin-only).
//          On publish: marks DB record, purges CDN cache.
//          POST = publish, DELETE = unpublish.
// Used by: Dashboard "Publish" button

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/withAuth';
import { publishBanner, unpublishBanner } from '@/features/banner-editor/services/bannerService';
import type { ApiResponse } from '@/shared/types/banner';

type Ctx = { params: Promise < { id: string } > };

// POST /api/publish/[id] → publish
export const POST = withAuth(async (_req: NextRequest, { params }: Ctx) => {
  try {
    const { id } = await params;
    const banner = await publishBanner(id);
    return NextResponse.json < ApiResponse < typeof banner >> ({ ok: true, data: banner });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[api/publish POST]', message);
    return NextResponse.json < ApiResponse < never >> ({ ok: false, error: message }, { status: 500 });
  }
});

// DELETE /api/publish/[id] → unpublish
export const DELETE = withAuth(async (_req: NextRequest, { params }: Ctx) => {
  try {
    const { id } = await params;
    const banner = await unpublishBanner(id);
    return NextResponse.json < ApiResponse < typeof banner >> ({ ok: true, data: banner });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[api/publish DELETE]', message);
    return NextResponse.json < ApiResponse < never >> ({ ok: false, error: message }, { status: 500 });
  }
});