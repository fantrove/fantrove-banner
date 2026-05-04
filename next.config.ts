// Path:    next.config.ts
// Purpose: Next.js configuration for the Banner Engine dashboard on Vercel.

import type { NextConfig } from 'next';

// ── Why webpack alias was removed ─────────────────────────────────────────────
// Next.js 13+ automatically reads `paths` from tsconfig.json and configures
// webpack aliases accordingly. Manually duplicating it caused a subtle issue
// in Next.js 15: the manual alias ran before the auto-generated one and could
// shadow it in certain module resolution edge cases. Removed — tsconfig handles
// it reliably and is the single source of truth.

const nextConfig: NextConfig = {
  // ── TypeScript & ESLint ──────────────────────────────────────────────────
  typescript:  { ignoreBuildErrors: false },
  eslint:      { ignoreDuringBuilds: false },

  // ── Security Headers ─────────────────────────────────────────────────────
  // Applied to all routes. Public API has additional CORS headers in route.ts.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',  value: 'nosniff'         },
          { key: 'X-Frame-Options',          value: 'DENY'            },
          { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // Public banner API — allow cross-origin reads (Fantrove fetches from here)
        source: '/api/public/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin',  value: '*'           },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS'},
        ],
      },
    ];
  },

  // ── Image domains (Supabase Storage) ─────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/**',
      },
    ],
  },
};

export default nextConfig;