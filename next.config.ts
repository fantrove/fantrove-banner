// Path:    next.config.ts
// Purpose: Next.js configuration for the Banner Engine dashboard on Vercel.

import path   from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ── TypeScript & ESLint ──────────────────────────────────────────────────
  typescript:  { ignoreBuildErrors: false },
  eslint:      { ignoreDuringBuilds: false },

  // ── Webpack alias — explicit @/ → src/ mapping ───────────────────────────
  // Next.js 15 should auto-read tsconfig paths but we add this as a
  // guaranteed fallback so the build never fails on alias resolution.
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },

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