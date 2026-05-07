// Path:    src/shared/lib/env.ts
// Purpose: Single entry point for all environment variables.
//          Server-only — never imported by client components.

function getEnv(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

export const env = {
  // Supabase Vercel integration injects SUPABASE_SERVICE_ROLE_KEY (with _KEY suffix)
  SUPABASE_URL:          getEnv('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE: getEnv('SUPABASE_SERVICE_ROLE_KEY'),

  // ⚠️ MOST COMMON BUG: Unauthorized on Save/Publish
  //    Both ADMIN_API_SECRET and NEXT_PUBLIC_ADMIN_API_SECRET must exist
  //    with the same value. See /api/health for diagnosis.
  ADMIN_API_SECRET: getEnv('ADMIN_API_SECRET'),

  // Cloudflare CDN purge — optional for Cloudflare Pages static sites.
  // Leave blank → purge is no-op, publish still works (CDN refreshes via max-age=60).
  CF_ZONE_ID:   getEnv('CF_ZONE_ID'),
  CF_API_TOKEN: getEnv('CF_API_TOKEN'),

  NEXT_PUBLIC_APP_URL: getEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  NODE_ENV:            getEnv('NODE_ENV', 'development'),
} as const;

export type Env = typeof env;