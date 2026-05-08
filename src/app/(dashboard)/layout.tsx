// Path:    src/app/(dashboard)/layout.tsx
// Purpose: Dashboard shell — sidebar nav on desktop, bottom nav on mobile.

import type { Metadata } from 'next';
import Link from 'next/link';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Banner Engine — Dashboard',
  description: 'Headless Low-Code Banner Management System',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

const NAV_ITEMS = [
  { href: '/banners',     icon: '📋', label: 'Banners',    shortLabel: 'Banners' },
  { href: '/banners/new', icon: '＋', label: 'New Banner', shortLabel: 'New' },
] as const;

const EXT_ITEMS = [
  { href: 'https://supabase.com/dashboard', icon: '🗄', label: 'Supabase ↗' },
  { href: 'https://dash.cloudflare.com',    icon: '☁', label: 'Cloudflare ↗' },
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="dashboard-body">
        <div className="dashboard-shell">

          {/* ── Sidebar (desktop) / Bottom Nav (mobile) ──────────── */}
          <nav className="sidebar" aria-label="Main navigation">

            {/* Brand — desktop only */}
            <div className="sidebar-brand">
              <span className="sidebar-logo">🚩</span>
              <span className="sidebar-name">Banner Engine</span>
            </div>

            {/* Primary nav */}
            <ul className="sidebar-nav" role="list">
              {NAV_ITEMS.map(item => (
                <li key={item.href}>
                  <Link href={item.href} className="sidebar-link">
                    <span aria-hidden="true">{item.icon}</span>
                    <span className="sidebar-link-label">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* External links — desktop only */}
            <div className="sidebar-footer">
              {EXT_ITEMS.map(item => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sidebar-link sidebar-link--ext"
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          </nav>

          {/* ── Main content ────────────────────────────────────── */}
          <div className="dashboard-main">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}