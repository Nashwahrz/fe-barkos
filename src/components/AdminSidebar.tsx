import Link from 'next/link';

export default function AdminSidebar({ currentPath }: { currentPath: string }) {
  const menus = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
    { name: 'Produk', path: '/admin/products', icon: '📦' },
    { name: 'Kategori', path: '/admin/categories', icon: '📂' },
    { name: 'Transaksi', path: '/admin/transactions', icon: '💸' },
    { name: 'Manajemen User', path: '/admin/users', icon: '👥' },
    { name: 'Laporan', path: '/admin/reports', icon: '🚩' },
  ];

  return (
    <aside style={{ width: '280px', borderRight: '1px solid var(--border)', padding: '2rem' }}>
      <div className="flex-col gap-6">
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Menu Admin</div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {menus.map(menu => {
            const isActive = currentPath.startsWith(menu.path);
            return (
              <Link key={menu.path} href={menu.path} style={{ 
                fontWeight: isActive ? 700 : 500, 
                color: isActive ? 'var(--primary)' : 'inherit',
                opacity: isActive ? 1 : 0.7, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                padding: '0.5rem',
                borderRadius: 'var(--radius)',
                background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
              }}>
                <span>{menu.icon}</span>
                {menu.name}
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
