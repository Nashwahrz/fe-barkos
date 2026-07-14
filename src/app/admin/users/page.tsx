'use client';

import { useState, useEffect } from 'react';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';
import AdminSidebar from '@/components/AdminSidebar';
import { Icons } from '@/components/Icons';
import { Button } from '@/components/ui/Button';
import { useTablePagination } from '@/hooks/useTablePagination';
import { Pagination } from '@/components/Pagination';

export default function AdminUsers() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const {
    searchQuery, setSearchQuery,
    currentPage, setCurrentPage,
    totalPages, paginatedData, totalItems
  } = useTablePagination(users, ['name', 'email', 'role', 'phone'], 10);

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

  if (loading || authLoading) return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 70px)', gap: '12px', color: 'var(--foreground)', opacity: 0.5 }}>
      <Icons.Loader size={32} />
      <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Memuat data...</div>
    </div>
  );

  return (
    <div className="flex md-flex-col" style={{ minHeight: 'calc(100vh - 70px)', background: 'var(--background)' }}>
      <AdminSidebar currentPath="/admin/users" />

      <main className="page-padding" style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <header className="admin-header-flex" style={{ marginBottom: '3rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Manajemen User</h1>
            <p style={{ color: 'var(--foreground)', opacity: 0.6, fontSize: '1.05rem' }}>Lihat dan kelola basis pengguna platform Lapak Kos.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Icons.Search size={16} color="var(--foreground)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
              <input 
                type="text" 
                placeholder="Cari user..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', outline: 'none', width: '250px', fontSize: '0.9rem' }}
              />
            </div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '0.6rem 1rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-sm)' }}>
              Total: {totalItems} User
            </div>
          </div>
        </header>

        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', borderRadius: '20px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--card)' }}>
              <thead style={{ background: 'var(--input)', textAlign: 'left', fontSize: '0.8rem', color: 'var(--foreground)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <tr>
                  <th style={{ padding: '1.25rem 2rem', fontWeight: 700 }}>USER</th>
                  <th style={{ padding: '1.25rem', fontWeight: 700 }}>ROLE</th>
                  <th style={{ padding: '1.25rem', fontWeight: 700 }}>STATUS</th>
                  <th style={{ padding: '1.25rem 2rem', fontWeight: 700, textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.95rem' }}>
                {paginatedData.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="hover-bg-input">
                    <td style={{ padding: '1.25rem 2rem' }}>
                      <div className="flex items-center gap-4">
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, overflow: 'hidden', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
                          {u.foto ? (
                            <img src={getStorageUrl(u.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            u.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-col">
                          <div style={{ fontWeight: 700, color: 'var(--foreground)' }}>{u.name}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--foreground)', opacity: 0.6 }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <span style={{ 
                        padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                        background: u.role === 'super_admin' ? 'rgba(139, 92, 246, 0.1)' : 'var(--input)',
                        color: u.role === 'super_admin' ? 'var(--accent)' : 'var(--foreground)',
                        border: `1px solid ${u.role === 'super_admin' ? 'rgba(139, 92, 246, 0.2)' : 'var(--border)'}`,
                        letterSpacing: '0.05em'
                      }}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      {u.is_active ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></span> Aktif
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', fontWeight: 600, fontSize: '0.9rem' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)' }}></span> Dinonaktifkan
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                      {u.role !== 'super_admin' && (
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleToggleStatus(u.id)}
                            disabled={actionLoading === u.id}
                            style={{ 
                              padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', cursor: 'pointer',
                              color: u.is_active ? 'var(--warning)' : 'var(--success)', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                          >
                            {actionLoading === u.id ? <Icons.Loader size={14} /> : (u.is_active ? <><Icons.Power size={14} /> Nonaktifkan</> : <><Icons.Power size={14} /> Aktifkan</>)}
                          </button>
                          <button 
                            onClick={() => handleDelete(u.id)}
                            disabled={actionLoading === u.id}
                            style={{ 
                              padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(220, 38, 38, 0.2)', background: 'rgba(220, 38, 38, 0.05)', cursor: 'pointer',
                              color: 'var(--danger)', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                          >
                            {actionLoading === u.id ? <Icons.Loader size={14} /> : <><Icons.Trash2 size={14} /> Hapus</>}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: 'var(--foreground)', opacity: 0.5 }}>
                      <Icons.Inbox size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                      <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>User tidak ditemukan.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </main>
    </div>
  );
}
