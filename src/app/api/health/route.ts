// Path:    src/app/api/health/route.ts
// Purpose: Public health check — open /api/health to see system status.
//          No Authorization header needed.

import { NextResponse } from 'next/server';
import { getDb } from '@/shared/lib/db';

export const dynamic = 'force-dynamic';

interface CheckResult { ok: boolean;message: string;detail ? : string }

function checkEnvVar(key: string): CheckResult {
  const val = process.env[key];
  if (!val) return { ok: false, message: `❌ ${key} — NOT SET`, detail: `Add to Vercel Environment Variables` };
  const preview = val.length > 8 ? val.slice(0, 4) + '…' + val.slice(-4) : '(set)';
  return { ok: true, message: `✅ ${key} — set (${preview})` };
}

async function checkDatabase(): Promise < CheckResult > {
  try {
    const { error } = await getDb().from('banners').select('id').limit(1);
    if (error) throw error;
    return { ok: true, message: '✅ Database — connected (Supabase read OK)' };
  } catch (err) {
    return { ok: false, message: '❌ Database — connection failed', detail: err instanceof Error ? err.message : String(err) };
  }
}

function checkAdminAuth(): CheckResult[] {
  const server = process.env['ADMIN_API_SECRET'] ?? '';
  const client = process.env['NEXT_PUBLIC_ADMIN_API_SECRET'] ?? '';
  const results: CheckResult[] = [checkEnvVar('ADMIN_API_SECRET'), checkEnvVar('NEXT_PUBLIC_ADMIN_API_SECRET')];
  
  if (!server) {
    results.push({ ok: false, message: '❌ Auth — ADMIN_API_SECRET not set → Unauthorized on all admin API calls' });
  } else if (!client) {
    results.push({ ok: false, message: '❌ Auth — NEXT_PUBLIC_ADMIN_API_SECRET not set → Dashboard cannot send Bearer token', detail: 'Add NEXT_PUBLIC_ADMIN_API_SECRET = (same value as ADMIN_API_SECRET) to Vercel → Redeploy' });
  } else if (server !== client) {
    results.push({ ok: false, message: '❌ Auth — ADMIN_API_SECRET ≠ NEXT_PUBLIC_ADMIN_API_SECRET → mismatch causes Unauthorized', detail: 'Both variables must have exactly the same value' });
  } else {
    results.push({ ok: true, message: '✅ Auth — server secret matches client secret → Save/Publish should work' });
  }
  return results;
}

export async function GET() {
  const [dbRead] = await Promise.all([checkDatabase()]);
  
  // WHY SUPABASE_SERVICE_ROLE_KEY: Supabase Vercel integration injects this exact name.
  const envChecks: CheckResult[] = [
    checkEnvVar('SUPABASE_URL'),
    checkEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
    checkEnvVar('CF_ZONE_ID'),
    checkEnvVar('CF_API_TOKEN'),
    checkEnvVar('NEXT_PUBLIC_APP_URL'),
  ];
  const authChecks = checkAdminAuth();
  const allChecks = [...envChecks, ...authChecks, dbRead];
  const allOk = allChecks.every(c => c.ok);
  
  const diagnosis: string[] = [];
  if (!process.env['NEXT_PUBLIC_ADMIN_API_SECRET'])
    diagnosis.push('🔴 Unauthorized fix: Go to Vercel → Settings → Environment Variables → Add NEXT_PUBLIC_ADMIN_API_SECRET = (same as ADMIN_API_SECRET) → Redeploy.');
  if (!process.env['SUPABASE_URL'] || !process.env['SUPABASE_SERVICE_ROLE_KEY'])
    diagnosis.push('🔴 Supabase not configured: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.');
  if (!process.env['CF_ZONE_ID'] || !process.env['CF_API_TOKEN'])
    diagnosis.push('🟡 Cloudflare CDN purge disabled. Publish works — CDN refreshes within 60s via max-age header.');
  
  return NextResponse.json({
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    diagnosis: diagnosis.length ? diagnosis : ['No critical issues detected'],
    checks: { environment: envChecks, auth: authChecks, database: [dbRead] },
    summary: { total: allChecks.length, passed: allChecks.filter(c => c.ok).length, failed: allChecks.filter(c => !c.ok).length },
    fantrove_integration: {
      note: 'Fantrove (Cloudflare Pages static) — banner-engine.js fetches JSON from this Vercel API.',
      banner_engine_url: process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://your-app.vercel.app',
    },
  }, {
    status: allOk ? 200 : 207,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}