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

export async function purgeBannerCache(slug: string): Promise < PurgeResult > {
  const urlToPurge = `${PUBLIC_API_BASE}/${slug}`;
  
  // If credentials missing, log and return non-fatal result.
  if (!env.CF_ZONE_ID || !env.CF_API_TOKEN) {
    console.warn(
      '[cloudflare] purgeBannerCache skipped: CF_ZONE_ID or CF_API_TOKEN not configured. ' +
      'Publish will proceed but CDN purge will not run.'
    );
    return { ok: false, error: 'missing-credentials' };
  }
  
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
    // Non-fatal: log and continue — the banner is published, CDN will refresh on next request
    console.error('[cloudflare] purgeBannerCache error:', message);
    return { ok: false, error: message };
  }
}