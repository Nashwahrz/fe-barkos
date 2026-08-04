'use client';

import { useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Icons } from '@/components/Icons';

export default function AdminLayout({ currentPath, children, maxWidth = 1200 }: { currentPath: string; children: React.ReactNode; maxWidth?: number }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex md-flex-col" style={{ minHeight: 'calc(100vh - 70px)', background: 'var(--background)', minWidth: 0 }}>
      <button
        className="admin-mobile-toggle"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Buka menu admin"
        style={{
          position: 'sticky', top: '70px', zIndex: 50, alignSelf: 'flex-start',
          margin: '1rem 0 -0.5rem 1rem', width: '42px', height: '42px', borderRadius: '10px',
          background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
        }}
      >
        <Icons.Menu size={20} />
      </button>

      <AdminSidebar currentPath={currentPath} mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <main className="page-padding" style={{ flex: '1 1 0%', minWidth: 0, maxWidth: `${maxWidth}px`, margin: '0 auto', width: '100%', overflowX: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
