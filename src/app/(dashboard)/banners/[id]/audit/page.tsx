// Path:    src/app/(dashboard)/banners/[id]/audit/page.tsx
// Purpose: Shows full audit history for a banner — Security Standards requirement.
//          Server Component, no client JS needed.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBannerById, getAuditLogs } from '@/features/banner-editor/services/bannerService';

interface Props { params: { id: string } }

const ACTION_COLOURS: Record < string, string > = {
  created: 'audit-action--created',
  updated: 'audit-action--updated',
  published: 'audit-action--published',
  unpublished: 'audit-action--unpublished',
  deleted: 'audit-action--deleted',
};

export default async function AuditPage({ params }: Props) {
  const [banner, logs] = await Promise.all([
    getBannerById(params.id).catch(() => null),
    getAuditLogs(params.id).catch(() => []),
  ]);
  
  if (!banner) notFound();
  
  return (
    <main className="page-root">
      <div className="page-header">
        <div>
          <Link href={`/banners/${params.id}`} className="link-muted">← Back to editor</Link>
          <h1 className="page-title">Audit Log — {banner.name}</h1>
        </div>
      </div>

      {logs.length === 0 && (
        <div className="empty-state"><p>No audit entries yet.</p></div>
      )}

      <div className="audit-list">
        {logs.map(log => (
          <div key={log.id} className="audit-row">
            <div className="audit-row-header">
              <span className={`audit-action ${ACTION_COLOURS[log.action] ?? ''}`}>
                {log.action}
              </span>
              <span className="audit-time">
                {new Date(log.createdAt).toLocaleString('en-GB', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit', second: '2-digit',
                })}
              </span>
            </div>

            {Object.keys(log.changes).length > 0 && (
              <div className="audit-changes">
                {Object.entries(log.changes).map(([field, [oldVal, newVal]]) => (
                  <div key={field} className="audit-change-row">
                    <span className="audit-field">{field}</span>
                    <span className="audit-old">
                      {JSON.stringify(oldVal)?.slice(0, 80) ?? '—'}
                    </span>
                    <span className="audit-arrow">→</span>
                    <span className="audit-new">
                      {JSON.stringify(newVal)?.slice(0, 80) ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}