'use client';

import Link from 'next/link';
import { Icons } from '@/components/Icons';
import { useAuth } from '@/components/AuthProvider';
import { getStorageUrl } from '@/lib/api';

interface MenuItem {
  name: string;
  path: string;
  Icon: typeof Icons.BarChart2;
}

interface MenuGroup {
  label: string | null;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    label: null,
    items: [
      { name: 'Dashboard', path: '/admin/dashboard', Icon: Icons.BarChart2 },
    ],
  },
  {
    label: 'Katalog & Promosi',
    items: [
      { name: 'Manajemen Produk', path: '/admin/products', Icon: Icons.Package },
      { name: 'Kategori Produk', path: '/admin/categories', Icon: Icons.Folder },
      { name: 'Manajemen Promosi', path: '/admin/promotions', Icon: Icons.Tag },
    ],
  },
  {
    label: 'Pengguna & Transaksi',
    items: [
      { name: 'Akun Pengguna', path: '/admin/users', Icon: Icons.Users },
      { name: 'Pemantauan Transaksi', path: '/admin/transactions', Icon: Icons.DollarSign },
    ],
  },
  {
    label: 'Moderasi & Sistem',
    items: [
      { name: 'Laporan Pelanggaran', path: '/admin/reports', Icon: Icons.Flag },
      { name: 'Pengaturan Pembayaran', path: '/admin/settings/payments', Icon: Icons.CreditCard },
    ],
  },
];

export default function AdminSidebar({ currentPath }: { currentPath: string }) {
  const { user, logout } = useAuth();

  return (
    <aside className="admin-sidebar" style={{
      width: '264px',
      minWidth: '264px',
      borderRight: '1px solid var(--border)',
      padding: '1.5rem 1rem',
      background: 'var(--card)',
      display: 'flex',
      alignSelf: 'stretch',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: '70px',
        alignSelf: 'flex-start',
        maxHeight: 'calc(100vh - 70px)',
        width: '100%',
      }}>
        {/* ── Brand ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '0 0.5rem', marginBottom: '1.5rem', flexShrink: 0,
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '11px',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(13, 148, 136, 0.3)', flexShrink: 0,
          }}>
            <Icons.Shield size={18} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--foreground)', letterSpacing: '-0.01em' }}>Admin Panel</div>
            <div style={{ fontWeight: 600, fontSize: '0.68rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lapak Kos</div>
          </div>
        </div>

        {/* ── Grouped menu ── */}
        <nav className="admin-sidebar-nav" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.1rem', paddingBottom: '0.5rem' }}>
          {menuGroups.map((group, gi) => (
            <div key={group.label ?? `group-${gi}`} className="admin-sidebar-menu admin-sidebar-group" style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {group.label && (
                <div className="admin-sidebar-group-label" style={{
                  padding: '0 0.75rem', marginBottom: '4px',
                  fontSize: '0.68rem', fontWeight: 700, color: 'var(--muted-foreground)',
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                }}>
                  {group.label}
                </div>
              )}
              {group.items.map(menu => {
                const isActive = currentPath.startsWith(menu.path);
                return (
                  <Link key={menu.path} href={menu.path} className="admin-sidebar-link" style={{
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--primary)' : 'var(--foreground)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '11px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: isActive ? 'var(--primary-light)' : 'transparent',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    transition: 'all 0.15s ease',
                    opacity: isActive ? 1 : 0.75,
                    position: 'relative',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--input)';
                      e.currentTarget.style.opacity = '1';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.opacity = '0.75';
                    }
                  }}
                  >
                    {isActive && (
                      <span style={{
                        position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                        width: '3px', height: '60%', borderRadius: '0 4px 4px 0', background: 'var(--primary)',
                      }} />
                    )}
                    <menu.Icon size={16} color={isActive ? 'var(--primary)' : 'currentColor'} />
                    {menu.name}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── Footer: admin identity + quick actions ── */}
        <div className="admin-sidebar-footer" style={{ flexShrink: 0, paddingTop: '0.9rem', marginTop: '0.4rem', borderTop: '1px solid var(--border)' }}>
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '10px',
            color: 'var(--muted-foreground)', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600,
            transition: 'all 0.15s ease', marginBottom: '2px',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--input)'; e.currentTarget.style.color = 'var(--foreground)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)'; }}
          >
            <Icons.ArrowLeft size={15} /> Kembali ke Situs
          </Link>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', marginTop: '4px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                background: 'var(--primary-light)', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem',
              }}>
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getStorageUrl(user.avatar) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>Super Admin</div>
              </div>
              <button
                onClick={logout}
                title="Keluar"
                style={{
                  width: '30px', height: '30px', borderRadius: '9px', border: '1px solid var(--border)',
                  background: 'transparent', color: 'var(--muted-foreground)', cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220, 38, 38, 0.08)'; e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <Icons.LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
