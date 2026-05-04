// Path:    src/shared/middleware/withAuth.ts
// Purpose: Verifies ADMIN_API_SECRET Bearer token on protected API routes.

import { NextRequest, NextResponse } from 'next/server';
import { env } from '../lib/env';

type RouteHandler<P extends Record<string, string> = Record<string, string>> = (
  req: NextRequest,
  ctx: { params: Promise<P> }
) => Promise<NextResponse>;

export function withAuth<P extends Record<string, string> = Record<string, string>>(
  handler: RouteHandler<P>
): RouteHandler<P> {
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