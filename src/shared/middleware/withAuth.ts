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
// Fix: provide two overloads of withAuth so we preserve the exact handler
// signature shape: handlers that only accept (req) produce exported functions
// that only accept (req), and handlers that accept (req, ctx) produce exported
// functions that require (req, ctx). This satisfies Next's strict type checks.

type RouteContext<P extends Record<string, string | string[]>> = {
  params: Promise<P>;
};

type HandlerNoCtx = (req: NextRequest) => Promise<NextResponse>;
type HandlerWithCtx<P extends Record<string, string | string[]>> = (
  req: NextRequest,
  ctx: RouteContext<P>
) => Promise<NextResponse>;

/* Overload signatures */
export function withAuth(handler: HandlerNoCtx): HandlerNoCtx;
export function withAuth<P extends Record<string, string | string[]>>(
  handler: HandlerWithCtx<P>
): HandlerWithCtx<P>;

/* Implementation */
export function withAuth(handler: HandlerNoCtx | HandlerWithCtx<any>) {
  return async (req: NextRequest, ctx?: RouteContext<Record<string, string | string[]>>) => {
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

    // Call the original handler with or without ctx depending on its arity.
    // Using handler.length is safe enough here to detect declared param count.
    // If handler expects two args, pass ctx (must be provided by Next runtime).
    try {
      if ((handler as any).length >= 2) {
        // cast to any to call with ctx — at runtime ctx should exist for route files that require it
        return (handler as HandlerWithCtx<any>)(req, ctx as RouteContext<any>);
      } else {
        return (handler as HandlerNoCtx)(req);
      }
    } catch (err) {
      // Bubble up runtime errors so calling route can handle and return proper response.
      throw err;
    }
  };
}