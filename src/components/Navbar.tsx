'use client';

import Link from 'next/link';
import { APP_NAME, USER_ROLES } from '@/lib/constants';
import { useAuth } from '@/components/AuthProvider';

export default function Navbar() {
  const { user, logout, loading, unreadCount } = useAuth();

  return (
    <nav className="glass" style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--border)' }}>
      <div className="container flex items-center justify-between" style={{ height: '70px' }}>
        <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.025em' }}>
          {APP_NAME.toUpperCase()}
        </Link>
        
        <div className="flex items-center gap-4">
          <Link href="/products" className="btn" style={{ fontWeight: 500 }}>Cari Barang</Link>
          
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-4">
                  {user.role === USER_ROLES.SUPER_ADMIN && (
                    <Link href="/admin/dashboard" className="btn" style={{ fontWeight: 600, color: 'var(--accent)' }}>
                      🛡️ Admin
                    </Link>
                  )}
                  {user.role === USER_ROLES.PENJUAL && (
                    <Link href="/seller/products" className="btn" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      🏪 Lapak Saya
                    </Link>
                  )}
                  
                  <Link href="/chat" className="btn" style={{ position: 'relative', padding: '10px' }}>
                    💬 Pesan
                    {unreadCount > 0 && (
                      <span style={{ 
                        position: 'absolute', 
                        top: '-5px', 
                        right: '-5px', 
                        background: '#ef4444', 
                        color: 'white', 
                        fontSize: '0.65rem', 
                        padding: '2px 6px', 
                        borderRadius: '10px', 
                        fontWeight: 800,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}>
                        {unreadCount}
                      </span>
                    )}
                  </Link>

                  <div className="flex items-center gap-2">
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.name}</span>
                  </div>
                  <button onClick={logout} className="btn" style={{ color: '#ef4444', fontWeight: 600 }}>Keluar</button>
                </div>
              ) : (
                <>
                  <Link href="/auth/login" className="btn" style={{ border: '1px solid var(--border)' }}>Masuk</Link>
                  <Link href="/auth/register" className="btn btn-primary">Daftar</Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
