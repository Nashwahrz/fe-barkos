'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminUsers() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

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

  async function handleToggleStatus(id: number) {
    if (!confirm('Ubah status pengguna ini?')) return;
    
    setActionLoading(id);
    try {
      await fetchApi(`/users/${id}/status`, { method: 'PATCH' });
      await loadUsers();
    } catch (err) {
      alert('Gagal mengubah status.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini? Semua data terkait akan dihapus permanen.')) return;
    
    setActionLoading(id);
    try {
      await fetchApi(`/users/${id}`, { method: 'DELETE' });
      await loadUsers();
    } catch (err) {
      alert('Gagal menghapus user.');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading || authLoading) return <div className="p-8 text-center">Memuat data...</div>;

  return (
    <div className="flex" style={{ minHeight: 'calc(100vh - 70px)' }}>
      <AdminSidebar currentPath="/admin/users" />

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
                  <th style={{ padding: '1rem' }}>STATUS</th>
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
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                        background: u.role === 'super_admin' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(0,0,0,0.05)',
                        color: u.role === 'super_admin' ? 'var(--accent)' : 'inherit'
                      }}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {u.is_active ? (
                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>Aktif</span>
                      ) : (
                        <span style={{ color: '#ef4444', fontWeight: 600 }}>Dinonaktifkan</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {u.role !== 'super_admin' && (
                        <div className="flex gap-4">
                          <button 
                            onClick={() => handleToggleStatus(u.id)}
                            disabled={actionLoading === u.id}
                            style={{ color: u.is_active ? '#f59e0b' : 'var(--success)', fontWeight: 600, fontSize: '0.85rem' }}
                          >
                            {actionLoading === u.id ? '...' : (u.is_active ? 'Nonaktifkan' : 'Aktifkan')}
                          </button>
                          <button 
                            onClick={() => handleDelete(u.id)}
                            disabled={actionLoading === u.id}
                            style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.85rem' }}
                          >
                            Hapus
                          </button>
                        </div>
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
