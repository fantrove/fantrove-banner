// Path:    src/app/(dashboard)/layout.tsx
// Purpose: Dashboard shell layout — sidebar nav, global styles.

import type { Metadata } from 'next';
import Link from 'next/link';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Banner Engine — Dashboard',
  description: 'Headless Low-Code Banner Management System',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="dashboard-body">
        <div className="dashboard-shell">

          {/* Sidebar */}
          <nav className="sidebar">
            <div className="sidebar-brand">
              <span className="sidebar-logo">🚩</span>
              <span className="sidebar-name">Banner Engine</span>
            </div>

            <ul className="sidebar-nav">
              <li>
                <Link href="/banners" className="sidebar-link">
                  <span>📋</span> All Banners
                </Link>
              </li>
              <li>
                <Link href="/banners/new" className="sidebar-link">
                  <span>＋</span> New Banner
                </Link>
              </li>
            </ul>

            <div className="sidebar-footer">
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="sidebar-link sidebar-link--ext"
              >
                <span>🗄</span> Supabase ↗
              </a>
              <a
                href="https://dash.cloudflare.com"
                target="_blank"
                rel="noopener noreferrer"
                className="sidebar-link sidebar-link--ext"
              >
                <span>☁</span> Cloudflare ↗
              </a>
            </div>
          </nav>

          {/* Main content */}
          <div className="dashboard-main">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}