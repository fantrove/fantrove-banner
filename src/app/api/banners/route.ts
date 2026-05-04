// Path:    src/app/api/banners/route.ts
// Purpose: Admin API — list all banners (GET) and create new banner (POST).
//          Protected by withAuth middleware.
// Used by: Dashboard frontend (fetch with Authorization header)

import { NextRequest, NextResponse }         from 'next/server';
import { withAuth }                           from '@/shared/middleware/withAuth';
import { listBanners, createBanner }          from '@/features/banner-editor/services/bannerService';
import type { CreateBannerInput }             from '@/shared/types/banner';
import type { ApiResponse }                   from '@/shared/types/banner';

// GET /api/banners — list all banners
// NOTE: include the unused _ctx param so the handler shape matches RouteHandler<>
export const GET = withAuth(async (_req: NextRequest, _ctx?: { params: Promise<Record<string, string | string[]>> }) => {
  try {
    const banners = await listBanners();
    return NextResponse.json<ApiResponse<typeof banners>>({ ok: true, data: banners });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[api/banners GET]', message);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: message },
      { status: 500 }
    );
  }
});

// POST /api/banners — create a new banner
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const input = body as CreateBannerInput;

    if (!input.slug || !input.name) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: 'slug and name are required' },
        { status: 400 }
      );
    }

    const banner = await createBanner(input);
    return NextResponse.json<ApiResponse<typeof banner>>(
      { ok: true, data: banner },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[api/banners POST]', message);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: message },
      { status: 500 }
    );
  }
});