'use client';

import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({ currentPath, children, maxWidth = 1200 }: { currentPath: string; children: React.ReactNode; maxWidth?: number }) {
  return (
    <div className="flex md-flex-col" style={{ minHeight: 'calc(100vh - 70px)', background: 'var(--background)' }}>
      <AdminSidebar currentPath={currentPath} />
      <main className="page-padding" style={{ flex: 1, maxWidth: `${maxWidth}px`, margin: '0 auto', width: '100%' }}>
        {children}
      </main>
    </div>
  );
}
