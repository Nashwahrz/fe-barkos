import Link from 'next/link';
import { Icons } from '@/components/Icons';

const menus = [
  { name: 'Dashboard',           path: '/admin/dashboard',   Icon: Icons.BarChart2  },
  { name: 'Manajemen Produk',    path: '/admin/products',    Icon: Icons.Package    },
  { name: 'Kategori Produk',     path: '/admin/categories',  Icon: Icons.Folder     },
  { name: 'Pemantauan Transaksi',path: '/admin/transactions',Icon: Icons.DollarSign },
  { name: 'Akun Pengguna',       path: '/admin/users',       Icon: Icons.Users      },
  { name: 'Manajemen Promosi',   path: '/admin/promotions',  Icon: Icons.Tag        },
  { name: 'Laporan Pelanggaran', path: '/admin/reports',     Icon: Icons.Flag       },
];

export default function AdminSidebar({ currentPath }: { currentPath: string }) {
  return (
    <aside className="admin-sidebar" style={{
      width: '240px',
      minWidth: '240px',
      borderRight: '1px solid #e5e7eb',
      padding: '1.5rem 1rem',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    }}>
      <div style={{
        fontWeight: 700, fontSize: '0.7rem', color: '#9ca3af',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        padding: '0 0.5rem', marginBottom: '0.75rem'
      }}>
        Menu Admin
      </div>

      <div className="admin-sidebar-menu" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {menus.map(menu => {
        const isActive = currentPath.startsWith(menu.path);
        return (
          <Link key={menu.path} href={menu.path} className="admin-sidebar-link" style={{
            fontWeight: isActive ? 700 : 500,
            color: isActive ? '#16a34a' : '#374151',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 12px',
            borderRadius: '8px',
            background: isActive ? 'rgba(22,163,74,0.08)' : 'transparent',
            textDecoration: 'none',
            fontSize: '0.875rem',
            transition: 'all 0.15s'
          }}>
            <menu.Icon size={16} color={isActive ? '#16a34a' : '#6b7280'} />
            {menu.name}
          </Link>
        );
      })}
      </div>
    </aside>
  );
}
