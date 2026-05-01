'use client';

import Link from 'next/link';
import { APP_NAME, USER_ROLES } from '@/lib/constants';
import { useAuth } from '@/components/AuthProvider';

export default function Navbar() {
  const { user, logout, loading } = useAuth();

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
                  
                  {/* Chat Icon with Unread Badge */}
                  <Link href="/chat" style={{ position: 'relative', fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: 'var(--input)' }}>
                    💬
                    {/* Unread count will be handled inside Chat page or globally if we use context. Let's just keep the icon simple for now since unread count fetching requires state inside Navbar. */}
                  </Link>

                  <Link href="/profile" className="flex items-center gap-2" style={{ padding: '4px 8px', borderRadius: 'var(--radius)', transition: 'background 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--input)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.name}</span>
                  </Link>
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
