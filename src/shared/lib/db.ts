// Path:    src/shared/lib/db.ts
// Purpose: Supabase client using service role key — server-side only.
//          Never imported by client components or edge runtime without care.
// Used by: bannerService.ts, all API routes

import { createClient } from '@supabase/supabase-js';
import { env } from './env';
import type { Database } from '../types/database';

// Singleton pattern — one client for the process lifetime.
// createClient is lightweight but we avoid repeated instantiation.
let _client: ReturnType < typeof createClient < Database >> | null = null;

export function getDb() {
  if (!_client) {
    _client = createClient < Database > (
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
  return _client;
}