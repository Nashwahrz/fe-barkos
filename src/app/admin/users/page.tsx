'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';

export default function AdminUsers() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== USER_ROLES.SUPER_ADMIN) {
        router.push('/');
      } else {
        loadUsers();
      }
    }
  }, [user, authLoading, router]);

  async function loadUsers() {
    try {
      const data = await fetchApi('/users');
      setUsers(data.data || data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini? Semua data terkait (produk, laporan) akan ikut terhapus.')) return;
    
    setDeleting(id);
    try {
      await fetchApi(`/users/${id}`, { method: 'DELETE' });
      await loadUsers();
    } catch (err) {
      alert('Gagal menghapus user.');
    } finally {
      setDeleting(null);
    }
  }

  if (loading || authLoading) return (
    <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 70px)' }}>
      <div style={{ fontSize: '1.2rem', fontWeight: 600, opacity: 0.5 }}>Memuat data pengguna...</div>
    </div>
  );

  return (
    <div className="flex" style={{ minHeight: 'calc(100vh - 70px)' }}>
      {/* Sidebar */}
      <aside style={{ width: '280px', borderRight: '1px solid var(--border)', padding: '2rem' }}>
        <div className="flex-col gap-6">
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Menu Utama</div>
          <Link href="/admin/dashboard" style={{ fontWeight: 500, opacity: 0.7, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            📊 Dashboard
          </Link>
          <Link href="/admin/reports" style={{ fontWeight: 500, opacity: 0.7, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            🚩 Laporan Pengguna
          </Link>
          <Link href="/admin/users" style={{ fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            👥 Manajemen User
          </Link>
          <Link href="/admin/settings" style={{ fontWeight: 500, opacity: 0.7, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            ⚙️ Pengaturan
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', background: 'rgba(0,0,0,0.02)' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Manajemen User</h1>
              <p style={{ opacity: 0.6 }}>Lihat dan kelola basis pengguna platform Lapak Kos.</p>
            </div>
            <div className="card" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 700 }}>
              Total: {users.length} User
            </div>
          </header>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'rgba(0,0,0,0.03)', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(0,0,0,0.4)' }}>
                <tr>
                  <th style={{ padding: '1rem 1.5rem' }}>USER</th>
                  <th style={{ padding: '1rem' }}>ROLE</th>
                  <th style={{ padding: '1rem' }}>KAMPUS</th>
                  <th style={{ padding: '1rem' }}>TANGGAL DAFTAR</th>
                  <th style={{ padding: '1rem' }}>AKSI</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.9rem' }}>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div className="flex items-center gap-3">
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-col">
                          <div style={{ fontWeight: 700 }}>{u.name}</div>
                          <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem', 
                        fontWeight: 700,
                        background: u.role === 'super_admin' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(0,0,0,0.05)',
                        color: u.role === 'super_admin' ? 'var(--accent)' : 'inherit'
                      }}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', opacity: 0.7 }}>{u.asal_kampus}</td>
                    <td style={{ padding: '1rem', opacity: 0.6 }}>{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                    <td style={{ padding: '1rem' }}>
                      {u.role !== 'super_admin' && (
                        <button 
                          onClick={() => handleDelete(u.id)}
                          disabled={deleting === u.id}
                          style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.85rem' }}
                        >
                          {deleting === u.id ? '...' : 'Hapus'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
