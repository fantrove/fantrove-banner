// Path:    src/app/(dashboard)/banners/page.tsx
// Purpose: Dashboard home — lists all banners with status, actions, CDN info.
//          Server Component: fetches directly via bannerService.
// Used by: Vercel dashboard URL /banners

import Link                   from 'next/link';
import { listBanners }        from '@/features/banner-editor/services/bannerService';

export const dynamic = 'force-dynamic'; // Never cache the list in production

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export default async function BannersPage() {
  let banners = [];
  let fetchError: string | null = null;

  try {
    banners = await listBanners();
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Failed to load banners';
  }

  return (
    <main className="page-root">
      <div className="page-header">
        <h1 className="page-title">Banners</h1>
        <Link href="/banners/new" className="btn btn--primary">
          + New Banner
        </Link>
      </div>

      {fetchError && (
        <div className="alert alert--error">{fetchError}</div>
      )}

      {!fetchError && banners.length === 0 && (
        <div className="empty-state">
          <p>No banners yet.</p>
          <Link href="/banners/new" className="btn btn--secondary">
            Create your first banner
          </Link>
        </div>
      )}

      {banners.length > 0 && (
        <div className="banner-list">
          <div className="list-header">
            <span>Name / Slug</span>
            <span>Status</span>
            <span>Updated</span>
            <span>Actions</span>
          </div>

          {banners.map(b => (
            <div key={b.id} className="list-row">
              <div className="list-cell list-cell--name">
                <span className="banner-name">{b.name}</span>
                <span className="banner-slug">/{b.slug}</span>
              </div>

              <div className="list-cell">
                <span className={`status-badge ${b.isPublished ? 'status-badge--live' : 'status-badge--draft'}`}>
                  {b.isPublished ? '● Live' : '○ Draft'}
                </span>
              </div>

              <div className="list-cell list-cell--date">
                {formatDate(b.updatedAt)}
              </div>

              <div className="list-cell list-cell--actions">
                <Link href={`/banners/${b.id}`} className="btn btn--xs btn--secondary">
                  Edit
                </Link>
                <Link href={`/banners/${b.id}/audit`} className="btn btn--xs btn--ghost">
                  Audit
                </Link>
                {b.isPublished && (
                  <a
                    href={`/api/public/banners/${b.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--xs btn--ghost"
                    title="View public API response"
                  >
                    API ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}