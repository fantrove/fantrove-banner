// Path:    src/shared/lib/cloudflare.ts
// Purpose: Purge cached banner responses from Cloudflare CDN after publish.
//          Ensures visitors always get the latest banner config within seconds.
// Used by: bannerService.ts (publish flow)

import { env } from './env';

// The public banner API route format — what Cloudflare caches
const PUBLIC_API_BASE = `${env.NEXT_PUBLIC_APP_URL}/api/public/banners`;

interface PurgeResult {
  ok: boolean;
  error ? : string;
}

// ── purgeBannerCache ─────────────────────────────────────────────────────────
// Sends a cache-purge request for the specific banner's public API URL.
// Called immediately after marking a banner as published in Supabase.
//
// WHY purge by URL (not tag): Cloudflare Pages plan may not support cache tags.
// URL purge is universally available and precise for our use case.
export async function purgeBannerCache(slug: string): Promise < PurgeResult > {
  const urlToPurge = `${PUBLIC_API_BASE}/${slug}`;
  
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${env.CF_ZONE_ID}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.CF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: [urlToPurge] }),
      }
    );
    
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Cloudflare purge failed: ${res.status} — ${body}`);
    }
    
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Non-fatal: log and continue — the banner is published, CDN lag is acceptable
    console.error('[cloudflare] purgeBannerCache error:', message);
    return { ok: false, error: message };
  }
}