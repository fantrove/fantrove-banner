// Path:    src/app/api/public/banners/[slug]/route.ts
// Purpose: Public endpoint — Fantrove's banner-engine.js fetches from here.
//          Security: Domain whitelist checked before serving data.
//          Performance: CDN caches for 60s, stale-while-revalidate 300s.
//          Security: Returns JSON config only — ZERO raw JS in response.
// Used by: assets/js/banner-engine.js on Fantrove

import { NextRequest, NextResponse }  from 'next/server';
import { getDb }                       from '@/shared/lib/db';
import type { ApiResponse }            from '@/shared/types/banner';
import type {
  BannerPublicPayload,
  ButtonConfig,
  ImageAssets,
  JsTriggerPreset,
  CountdownConfig,
  SliderConfig,
}                                      from '@/shared/types/banner';

// ── extractOriginHost ─────────────────────────────────────────────────────────
// Extracts the hostname from the Origin (or Referer) header.
// Returns null if the header is absent or unparseable (server-side SSR calls).
function extractOriginHost(req: NextRequest): string | null {
  const origin = req.headers.get('origin') ?? req.headers.get('referer');
  if (!origin) return null;
  try {
    return new URL(origin).hostname;
  } catch {
    return null;
  }
}

// ── isDomainAllowed ────────────────────────────────────────────────────────────
// Supports exact matches and wildcard subdomains (*.example.com).
// A null host means a server-side / curl request — allowed by default.
// An empty allowedDomains list means unrestricted (open banner).
function isDomainAllowed(host: string | null, allowedDomains: string[]): boolean {
  if (!host)                       return true;  // server-side SSR calls
  if (allowedDomains.length === 0) return true;  // no restriction configured

  return allowedDomains.some(pattern => {
    if (pattern === host) return true;
    if (pattern.startsWith('*.')) {
      const base = pattern.slice(2);
      return host === base || host.endsWith(`.${base}`);
    }
    return false;
  });
}

// ── CORS headers ──────────────────────────────────────────────────────────────
function corsHeaders(allowedOrigin: string | null): HeadersInit {
  return {
    'Access-Control-Allow-Origin':  allowedOrigin ?? '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// OPTIONS — preflight for cross-origin requests from Fantrove
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

// GET /api/public/banners/[slug]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug }   = await params;
  const originHost = extractOriginHost(req);
  const origin     = req.headers.get('origin');

  try {
    // Single query — fetches the full row so we can run the domain check
    // server-side before returning the public-safe payload.
    // WHY not use getBannerBySlug: that returns BannerPublicPayload which
    // intentionally omits allowedDomains. We need it here for the whitelist
    // check, but must never expose it in the response.
    const db = getDb();
    const { data, error } = await db
      .from('banners')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error?.code === 'PGRST116' || !data) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: 'Banner not found' },
        {
          status:  404,
          headers: { ...corsHeaders(origin), 'Cache-Control': 'no-store' },
        }
      );
    }

    if (error) throw new Error(error.message);

    // ── Domain whitelist check ────────────────────────────────────────────
    if (!isDomainAllowed(originHost, data.allowed_domains ?? [])) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: 'Domain not allowed' },
        {
          status:  403,
          headers: { ...corsHeaders(origin), 'Cache-Control': 'no-store' },
        }
      );
    }

    // ── Build public payload — no id, name, allowedDomains exposed ────────
    const payload: BannerPublicPayload = {
      slug:            data.slug,
      bannerStyles:    data.banner_styles ?? '',
      buttonConfig:    (data.button_config    as ButtonConfig)    ?? null,
      imageAssets:     (data.image_assets     as ImageAssets)     ?? null,
      jsTrigger:       (data.js_trigger       as JsTriggerPreset) ?? null,
      countdownConfig: (data.countdown_config as CountdownConfig) ?? null,
      sliderConfig:    (data.slider_config    as SliderConfig)    ?? null,
    };

    return NextResponse.json<ApiResponse<BannerPublicPayload>>(
      { ok: true, data: payload },
      {
        status:  200,
        headers: {
          ...corsHeaders(origin),
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
          'Vary':          'Origin',
        },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[api/public/banners GET]', message);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: 'Internal error' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}