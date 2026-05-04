// Path:    src/app/api/banners/[id]/route.ts
// Purpose: Admin API — get, update, delete a single banner by ID.
//          Protected by withAuth middleware.
// Used by: Dashboard frontend (BannerEditor)

import { NextRequest, NextResponse }                     from 'next/server';
import { withAuth }                                       from '@/shared/middleware/withAuth';
import { getBannerById, updateBanner, deleteBanner }     from '@/features/banner-editor/services/bannerService';
import type { UpdateBannerInput, ApiResponse }            from '@/shared/types/banner';

type Ctx = { params: { id: string } };

// GET /api/banners/[id]
export const GET = withAuth(async (_req: NextRequest, { params }: Ctx) => {
  try {
    const banner = await getBannerById(params.id);
    if (!banner) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: 'Banner not found' },
        { status: 404 }
      );
    }
    return NextResponse.json<ApiResponse<typeof banner>>({ ok: true, data: banner });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: message }, { status: 500 });
  }
});

// PATCH /api/banners/[id]
export const PATCH = withAuth(async (req: NextRequest, { params }: Ctx) => {
  try {
    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const updated = await updateBanner(params.id, body as UpdateBannerInput);
    return NextResponse.json<ApiResponse<typeof updated>>({ ok: true, data: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: message }, { status: 500 });
  }
});

// DELETE /api/banners/[id]
// ⚠️ DESTRUCTIVE ZONE: permanent delete — UI must confirm before calling
export const DELETE = withAuth(async (req: NextRequest, { params }: Ctx) => {
  try {
    // API-level confirmation check — independent of UI (security requirement)
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    if (body.confirmedDeletion !== true) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: 'confirmedDeletion: true is required' },
        { status: 400 }
      );
    }

    await deleteBanner(params.id);
    return NextResponse.json<ApiResponse<null>>({ ok: true, data: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: message }, { status: 500 });
  }
});