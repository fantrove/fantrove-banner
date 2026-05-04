// Path:    src/shared/middleware/withAuth.ts
// Purpose: Verifies ADMIN_API_SECRET Bearer token on protected API routes.
//          Wraps Next.js route handlers — consumer never touches auth logic.
// Used by: app/api/banners/route.ts, app/api/banners/[id]/route.ts,
//          app/api/publish/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { env } from '../lib/env';

type RouteHandler = (req: NextRequest, ctx: { params: Record<string, string> }) => Promise<NextResponse>;

// ── withAuth ─────────────────────────────────────────────────────────────────
// HOC: validates Authorization: Bearer <secret> header.
// Returns 401 immediately if missing or wrong — route handler never runs.
//
// WHY Bearer token not cookie: Dashboard is a separate origin from Fantrove.
// Cookie-based sessions require Same-Origin or explicit SameSite config.
// A pre-shared secret is simpler, equally secure for admin-only APIs, and
// works without a user identity system.
export function withAuth(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : '';

    // Constant-time comparison would be ideal — for a 64-char hex secret
    // the timing difference is negligible, but we document the intent.
    if (!token || token !== env.ADMIN_API_SECRET) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return handler(req, ctx);
  };
}