// Path:    src/shared/middleware/withAuth.ts
// Purpose: Verifies ADMIN_API_SECRET Bearer token on protected API routes.
// Used by: All admin API route handlers

import { NextRequest, NextResponse } from 'next/server';
import { env } from '../lib/env';

// ── Why these types changed ───────────────────────────────────────────────────
// Next.js 15 tightened route segment params: they are now always
// `Promise<Record<string, string>>` (or a more specific shape). The old
// `Record<string, string>` constraint on the generic P was fine in 14 but
// caused "Type X is not assignable to type Y" errors in strict mode when the
// route file passed a concrete `{ id: string }` promise type.
//
// Fix: widen the constraint to `Record<string, string | string[]>` — the union
// that Next.js itself uses for catch-all routes — so all concrete param shapes
// are assignable. Route files remain unchanged.

type RouteContext<P extends Record<string, string | string[]>> = {
  params: Promise<P>;
};

type RouteHandler<P extends Record<string, string | string[]>> = (
  req: NextRequest,
  ctx: RouteContext<P>
) => Promise<NextResponse>;

export function withAuth<
  P extends Record<string, string | string[]> = Record<string, string>
>(handler: RouteHandler<P>): RouteHandler<P> {
  return async (req, ctx) => {
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : '';

    if (!token || token !== env.ADMIN_API_SECRET) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return handler(req, ctx);
  };
}