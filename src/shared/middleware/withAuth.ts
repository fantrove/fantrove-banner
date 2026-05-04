// Path:    src/shared/middleware/withAuth.ts
// Purpose: Verifies ADMIN_API_SECRET Bearer token on protected API routes.
// Used by: All admin API route handlers

import { NextRequest, NextResponse } from 'next/server';
import { env } from '../lib/env';

// Next.js 15 route params shape: Promise<Record<string, string | string[]>>
// Provide two explicit overloads so callers keep exact handler shapes:
//  - handler(req) => exported function (req)
//  - handler(req, ctx) => exported function (req, ctx)
type RouteContext < P extends Record < string, string | string[] >> = {
  params: Promise < P > ;
};

type HandlerNoCtx = (req: NextRequest) => Promise < NextResponse > ;
type HandlerWithCtx < P extends Record < string, string | string[] >> = (
  req: NextRequest,
  ctx: RouteContext < P >
) => Promise < NextResponse > ;

export function withAuth(handler: HandlerNoCtx): HandlerNoCtx;
export function withAuth < P extends Record < string, string | string[] >> (
  handler: HandlerWithCtx < P >
): HandlerWithCtx < P > ;

export function withAuth(handler: HandlerNoCtx | HandlerWithCtx < any > ) {
  // No-ctx wrapper: exported function accepts only (req)
  const wrapperNoCtx: HandlerNoCtx = async (req) => {
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ?
      authHeader.slice(7).trim() :
      '';
    
    if (!token || token !== env.ADMIN_API_SECRET) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // handler is declared with arity 1 here
    return (handler as HandlerNoCtx)(req);
  };
  
  // With-ctx wrapper: exported function accepts (req, ctx)
  const wrapperWithCtx: HandlerWithCtx < any > = async (req, ctx) => {
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ?
      authHeader.slice(7).trim() :
      '';
    
    if (!token || token !== env.ADMIN_API_SECRET) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // At runtime, Next provides ctx for route handlers that require it.
    // Cast here because overloads guarantee the handler expects ctx.
    return (handler as HandlerWithCtx < any > )(req, ctx as RouteContext < any > );
  };
  
  // Choose which typed wrapper to return based on handler arity.
  // This preserves exact exported function shapes for Next's type checker.
  if ((handler as any).length >= 2) {
    return wrapperWithCtx as HandlerWithCtx < any > ;
  } else {
    return wrapperNoCtx as HandlerNoCtx;
  }
}