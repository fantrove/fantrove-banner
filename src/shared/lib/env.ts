// Path:    src/shared/lib/env.ts
// Purpose: Single entry point for all environment variables.
//          Server-only — never imported by client components.
//
// ── Design: optional-by-default, health check reports missing vars ────────────
// Throwing on startup crashes the Vercel build even before the first request.
// Instead: all vars are optional here, the health check at /api/health
// reports exactly which ones are missing and why that causes specific failures
// (e.g. missing NEXT_PUBLIC_ADMIN_API_SECRET → Unauthorized on Save/Publish).

function getEnv(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

export const env = {
  // ── Supabase (server-only) ─────────────────────────────────────────────────
  // WHY SUPABASE_SERVICE_ROLE_KEY: Supabase's official Vercel integration injects
  // this exact variable name automatically. Using the correct name avoids silent
  // fallback chains and makes the config intent explicit.
  SUPABASE_URL:          getEnv('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE: getEnv('SUPABASE_SERVICE_ROLE_KEY'),

  // ── Admin auth ─────────────────────────────────────────────────────────────
  // ⚠️  MOST COMMON BUG: Unauthorized on Save/Publish
  //     = NEXT_PUBLIC_ADMIN_API_SECRET not set in Vercel.
  //     Both ADMIN_API_SECRET and NEXT_PUBLIC_ADMIN_API_SECRET must exist
  //     with the same value. See /api/health for diagnosis.
  ADMIN_API_SECRET:      getEnv('ADMIN_API_SECRET'),

  // ── Cloudflare CDN purge ───────────────────────────────────────────────────
  // Optional for Cloudflare Pages (static Fantrove):
  //   Leave blank → purge becomes no-op, publish still works.
  //   CDN will self-refresh within 60s via max-age=60 header.
  CF_ZONE_ID:   getEnv('CF_ZONE_ID'),
  CF_API_TOKEN: getEnv('CF_API_TOKEN'),

  // ── App ────────────────────────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: getEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  NODE_ENV:            getEnv('NODE_ENV', 'development'),
} as const;

export type Env = typeof env;