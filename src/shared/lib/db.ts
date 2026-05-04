// Path:    src/shared/lib/db.ts
// Purpose: Supabase client using service role key — server-side only.
//          Never imported by client components or edge runtime without care.
// Used by: bannerService.ts, all API routes

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';
import type { Database } from '../types/database';

// ── Why globalThis instead of module-level variable ───────────────────────────
// Next.js 15 dev mode uses hot module replacement (HMR). Each HMR cycle
// re-executes module-level code, creating a new Supabase client and leaking
// the old one. globalThis persists across HMR cycles in the same Node process,
// so we reuse the same client instance. In production builds (no HMR) this
// has zero behavioral difference — it's a dev-mode correctness fix.
// Pattern: https://www.prisma.io/docs/guides/nextjs — same technique for Prisma.

// WHY direct import instead of ReturnType<typeof createClient<Database>>:
// TypeScript parses `typeof createClient<Database>` ambiguously — the angle
// bracket can be read as a comparison operator, causing a syntax error in
// strict mode. Importing SupabaseClient<Database> directly is unambiguous.
type TypedSupabaseClient = SupabaseClient < Database > ;

// Augment globalThis with our typed key so TypeScript doesn't complain
const g = globalThis as typeof globalThis & {
  __supabaseServiceClient ? : TypedSupabaseClient;
};

export function getDb(): TypedSupabaseClient {
  if (!g.__supabaseServiceClient) {
    g.__supabaseServiceClient = createClient < Database > (
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE, // Service role bypasses RLS — only used server-side
      {
        auth: {
          autoRefreshToken: false, // No user session on server
          persistSession: false,
        },
      }
    );
  }
  return g.__supabaseServiceClient;
}