// Path:    src/shared/lib/env.ts
// Purpose: Single entry point for all environment variables, validated at startup.
//          Server-only — never imported by client components.
// Used by: db.ts, cloudflare.ts, withAuth.ts, all API routes

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
  // Accept either SUPABASE_SERVICE_ROLE or SUPABASE_SERVICE_ROLE_KEY for compatibility.
  SUPABASE_SERVICE_ROLE:  (process.env['SUPABASE_SERVICE_ROLE'] ?? process.env['SUPABASE_SERVICE_ROLE_KEY']) || requireEnv('SUPABASE_SERVICE_ROLE'),

  // Admin auth — Bearer token for Dashboard → API calls
  // Treated as optional for build-time safety. In production you SHOULD set this.
  ADMIN_API_SECRET:       optionalEnv('ADMIN_API_SECRET', ''),

  // Cloudflare — CDN purge on publish
  // Treated as optional: if absent, purge becomes a no-op (non-fatal).
  CF_ZONE_ID:             optionalEnv('CF_ZONE_ID', ''),
  CF_API_TOKEN:           optionalEnv('CF_API_TOKEN', ''),

  // App
  NEXT_PUBLIC_APP_URL:    optionalEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  NODE_ENV:               optionalEnv('NODE_ENV', 'development'),
} as const;

export type Env = typeof env;