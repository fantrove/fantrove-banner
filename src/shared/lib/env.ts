// Path:    src/shared/lib/env.ts
// Purpose: Single entry point for all environment variables, validated at startup.
//          Server-only — never imported by client components.
// Used by: db.ts, cloudflare.ts, withAuth.ts, all API routes

// ── RATIONALE ────────────────────────────────────────────────────────────────
// We validate required environment variables at module initialization to fail
// fast in CI/CD if critical secrets are missing. However, some routes (public
// API endpoints) may import this module during Next's "collect page data" phase
// and should not cause the build to crash just because an optional admin
// secret isn't set. ADMIN_API_SECRET is therefore treated as optional for
// build-time safety; when absent it defaults to an empty string and any auth
// checks will fail (i.e., endpoints remain protected). Other truly required
// secrets still use requireEnv and will fail the build if missing.

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[env] Missing required environment variable: ${key}\n` +
      `Add it to .env.local (dev) or Vercel Environment Variables (prod).`
    );
  }
  return value;
}

function optionalEnv(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

// Validated once when the module is first imported (server startup).
export const env = {
  // Supabase — server-only, never exposed to client
  SUPABASE_URL:           requireEnv('SUPABASE_URL'),
  // Accept either name SUPABASE_SERVICE_ROLE or SUPABASE_SERVICE_ROLE_KEY for compatibility.
  SUPABASE_SERVICE_ROLE:  (process.env['SUPABASE_SERVICE_ROLE'] ?? process.env['SUPABASE_SERVICE_ROLE_KEY']) || requireEnv('SUPABASE_SERVICE_ROLE'),

  // Admin auth — Bearer token for Dashboard → API calls
  // Treated as optional for build-time safety. In production you MUST set this.
  ADMIN_API_SECRET:       optionalEnv('ADMIN_API_SECRET', ''),

  // Cloudflare — CDN purge on publish
  CF_ZONE_ID:             requireEnv('CF_ZONE_ID'),
  CF_API_TOKEN:           requireEnv('CF_API_TOKEN'),

  // App
  NEXT_PUBLIC_APP_URL:    optionalEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  NODE_ENV:               optionalEnv('NODE_ENV', 'development'),
} as const;

export type Env = typeof env;