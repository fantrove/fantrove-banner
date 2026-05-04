// Path:    src/shared/lib/env.ts
// Purpose: Single entry point for all environment variables, validated at startup.
//          Server-only — never imported by client components.
// Used by: db.ts, cloudflare.ts, withAuth.ts, all API routes

// ── Why validate at startup ────────────────────────────────────────────────
// Missing env vars cause cryptic 500s at runtime. Fail fast with a clear
// message so deploy pipelines catch config errors before users do.

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

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

// Validated once when the module is first imported (server startup).
export const env = {
  // Supabase — server-only, never exposed to client
  SUPABASE_URL:           requireEnv('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE:  requireEnv('SUPABASE_SERVICE_ROLE_KEY'),

  // Admin auth — Bearer token for Dashboard → API calls
  // Must be ≥ 32 random chars (use: openssl rand -hex 32)
  ADMIN_API_SECRET:       requireEnv('ADMIN_API_SECRET'),

  // Cloudflare — CDN purge on publish
  CF_ZONE_ID:             requireEnv('CF_ZONE_ID'),
  CF_API_TOKEN:           requireEnv('CF_API_TOKEN'),

  // App
  NEXT_PUBLIC_APP_URL:    optionalEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  NODE_ENV:               optionalEnv('NODE_ENV', 'development'),
} as const;

export type Env = typeof env;