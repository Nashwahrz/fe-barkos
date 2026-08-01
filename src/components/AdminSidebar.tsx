'use client';

import Link from 'next/link';
import { Icons } from '@/components/Icons';

const menus = [
  { name: 'Dashboard',           path: '/admin/dashboard',   Icon: Icons.BarChart2  },
  { name: 'Manajemen Produk',    path: '/admin/products',    Icon: Icons.Package    },
  { name: 'Kategori Produk',     path: '/admin/categories',  Icon: Icons.Folder     },
  { name: 'Pemantauan Transaksi',path: '/admin/transactions',Icon: Icons.DollarSign },
  { name: 'Akun Pengguna',       path: '/admin/users',       Icon: Icons.Users      },
  { name: 'Manajemen Promosi',   path: '/admin/promotions',  Icon: Icons.Tag        },
  { name: 'Pengaturan Pembayaran', path: '/admin/settings/payments', Icon: Icons.CreditCard },
  { name: 'Laporan Pelanggaran', path: '/admin/reports',     Icon: Icons.Flag       },
];

export default function AdminSidebar({ currentPath }: { currentPath: string }) {
  return (
    <aside className="admin-sidebar" style={{
      width: '252px',
      minWidth: '252px',
      borderRight: '1px solid var(--border)',
      padding: '1.5rem 1rem',
      background: 'var(--card)',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      position: 'sticky',
      top: '70px',
      alignSelf: 'flex-start',
      maxHeight: 'calc(100vh - 70px)',
      overflowY: 'auto'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '0 0.5rem', marginBottom: '1.25rem'
      }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(13, 148, 136, 0.3)', flexShrink: 0,
        }}>
          <Icons.BarChart2 size={17} color="#FFFFFF" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--foreground)', letterSpacing: '-0.01em' }}>Admin Panel</div>
          <div style={{ fontWeight: 600, fontSize: '0.68rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lapak Kos</div>
        </div>
      </div>

      <div className="admin-sidebar-menu" style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {menus.map(menu => {
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
    </aside>
  );
}
