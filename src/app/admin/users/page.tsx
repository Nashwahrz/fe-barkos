'use client';

import { useState, useEffect, ReactNode, CSSProperties } from 'react';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';
import AdminLayout from '@/components/AdminLayout';
import { Icons } from '@/components/Icons';
import { Button } from '@/components/ui/Button';
import { useTablePagination } from '@/hooks/useTablePagination';
import { Pagination } from '@/components/Pagination';
import { Badge } from '@/components/ui/Badge';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { userApi } from '@/services/api/user.api';
import { UserDetail } from '@/types/user';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  avatar?: string | null;
}

function formatDateTime(value: string | null): string {
  if (!value) return 'Belum pernah';
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

function StatTile({ icon, label, value, small, href }: { icon: ReactNode; label: string; value: string | number; small?: boolean; href?: string }) {
  const content = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
        {href && <Icons.ArrowRight size={14} color="var(--muted-foreground)" />}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '2px', lineHeight: 1.3 }}>{label}</div>
        <div style={{ fontWeight: 800, fontSize: small ? '0.85rem' : '1.05rem', color: 'var(--foreground)', lineHeight: 1.3 }}>{value}</div>
      </div>
    </>
  );

  const style: CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: '0.6rem', height: '100%',
    padding: '0.85rem', borderRadius: '12px', background: 'var(--muted, rgba(0,0,0,0.03))', border: '1px solid var(--border)',
  };

  if (href) {
    // Plain <a> (full browser navigation) instead of next/link: Next's client-side
    // soft navigation was observed dropping the ?user_id= query string on this route
    // (the RSC fetch included it, but the committed URL/search params did not), so a
    // real page load is used to guarantee the target page reads the correct filter.
    return (
      <a href={href} className="stat-tile-link" style={{ ...style, textDecoration: 'none', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}>
        {content}
      </a>
    );
  }

  return <div style={style}>{content}</div>;
}

const ROLE_LABELS: Record<string, string> = {
  [USER_ROLES.PEMBELI]: 'Pembeli',
  [USER_ROLES.PENJUAL]: 'Penjual',
  [USER_ROLES.SUPER_ADMIN]: 'Super Admin',
};

export default function AdminUsers() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');

  const roleFilteredUsers = roleFilter ? users.filter(u => u.role === roleFilter) : users;

  const {
    searchQuery, setSearchQuery,
    currentPage, setCurrentPage,
    totalPages, paginatedData, totalItems
  } = useTablePagination(roleFilteredUsers, ['name', 'email', 'role', 'phone'], 10);

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

  async function handleViewDetail(id: number) {
    setDetailLoading(true);
    try {
      const res = await userApi.getDetail(id);
      setSelectedUser(res.data);
    } catch (err) {
      alert('Gagal memuat aktivitas user.');
    } finally {
      setDetailLoading(false);
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

  if (authLoading) return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 70px)', gap: '12px', color: 'var(--foreground)', opacity: 0.5 }}>
      <Icons.Loader size={32} />
      <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Memuat data...</div>
    </div>
  );

  const columns: DataTableColumn<AdminUser>[] = [
    {
      key: 'user', header: 'User', render: u => (
        <div
          className="flex items-center gap-4"
          onClick={() => handleViewDetail(u.id)}
          style={{ cursor: 'pointer' }}
          title="Lihat aktivitas user"
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, overflow: 'hidden', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
            {u.avatar ? (
              <img src={getStorageUrl(u.avatar) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              u.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-col">
            <div style={{ fontWeight: 700, color: 'var(--foreground)' }}>{u.name}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--foreground)', opacity: 0.6 }}>{u.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Role', render: u => <Badge tone={u.role === 'super_admin' ? 'primary' : 'neutral'}>{u.role.replace('_', ' ')}</Badge> },
    {
      key: 'status', header: 'Status', render: u => (
        u.is_active ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></span> Aktif
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', fontWeight: 600, fontSize: '0.9rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)' }}></span> Dinonaktifkan
          </span>
        )
      ),
    },
    {
      key: 'aksi', header: 'Aksi', align: 'right', render: u => (
        u.role !== 'super_admin' ? (
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
        ) : null
      ),
    },
  ];

  return (
    <AdminLayout currentPath="/admin/users">
        <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ flex: '1 1 auto', minWidth: '300px' }}>
            <h1 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Manajemen User</h1>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '1rem', margin: 0 }}>Lihat dan kelola basis pengguna platform Lapak Kos.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', flex: '0 0 auto' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', left: '12px', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <Icons.Search size={16} color="var(--foreground)" style={{ opacity: 0.5 }} />
              </div>
              <input
                type="text"
                placeholder="Cari user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', outline: 'none', width: '250px', fontSize: '0.9rem', margin: 0 }}
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0.6rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', outline: 'none', fontSize: '0.9rem', margin: 0, cursor: 'pointer' }}
            >
              <option value="">Semua Role</option>
              {Object.values(USER_ROLES).map(role => (
                <option key={role} value={role}>{ROLE_LABELS[role] || role}</option>
              ))}
            </select>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '0.6rem 1rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-sm)' }}>
              Total: {totalItems} User
            </div>
          </div>
        </header>

        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', borderRadius: '20px' }}>
          <DataTable<AdminUser>
            columns={columns}
            data={paginatedData}
            keyExtractor={u => u.id}
            loading={loading}
            emptyMessage="User tidak ditemukan."
          />
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>

        <Modal open={!!selectedUser || detailLoading} onClose={() => setSelectedUser(null)} title="Aktivitas User" width={520}>
          {detailLoading && !selectedUser ? (
            <div className="flex items-center justify-center" style={{ padding: '3rem' }}>
              <Icons.Loader size={24} />
            </div>
          ) : selectedUser ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Profile header */}
              <div className="flex items-center gap-4">
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                    {selectedUser.avatar ? (
                      <img src={getStorageUrl(selectedUser.avatar) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      selectedUser.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span
                    title={selectedUser.is_online ? 'Online' : 'Offline'}
                    style={{
                      position: 'absolute', bottom: '2px', right: '2px', width: '13px', height: '13px', borderRadius: '50%',
                      background: selectedUser.is_online ? 'var(--success)' : 'var(--muted-foreground)',
                      border: '2.5px solid var(--card)',
                    }}
                  />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--foreground)' }}>{selectedUser.name}</div>
                    <Badge tone={selectedUser.role === 'super_admin' ? 'primary' : 'neutral'}>{selectedUser.role.replace('_', ' ')}</Badge>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedUser.email}</div>
                </div>
              </div>

              {/* Status / last-seen banner */}
              <div
                className="flex items-center gap-3"
                style={{
                  padding: '0.9rem 1.1rem', borderRadius: '14px',
                  background: selectedUser.is_online ? 'rgba(22, 163, 74, 0.08)' : 'var(--muted, rgba(0,0,0,0.03))',
                  border: `1px solid ${selectedUser.is_online ? 'rgba(22, 163, 74, 0.25)' : 'var(--border)'}`,
                }}
              >
                <div style={{
                  width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
                  background: selectedUser.is_online ? 'rgba(22, 163, 74, 0.15)' : 'var(--card)',
                  border: selectedUser.is_online ? 'none' : '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icons.Clock size={17} color={selectedUser.is_online ? 'var(--success)' : 'var(--muted-foreground)'} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: selectedUser.is_online ? 'var(--success)' : 'var(--foreground)' }}>
                    {selectedUser.is_online ? 'Online sekarang' : 'Sedang offline'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                    {selectedUser.is_online ? 'Aktif di web saat ini' : `Terakhir aktif ${formatDateTime(selectedUser.last_active_at)}`}
                  </div>
                </div>
              </div>

              {/* Activity stats */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.6rem' }}>
                  Ringkasan Aktivitas
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridAutoRows: '1fr', gap: '0.75rem' }}>
                  <StatTile icon={<Icons.UserPlus size={16} color="var(--primary)" />} label="Bergabung" value={formatDateTime(selectedUser.created_at)} small />
                  <StatTile
                    icon={<Icons.Package size={16} color="var(--primary)" />}
                    label="Produk Diunggah"
                    value={selectedUser.activity.products_count}
                    href={`/admin/products?user_id=${selectedUser.id}`}
                  />
                  <StatTile icon={<Icons.CheckCircle size={16} color="var(--success)" />} label="Produk Terjual" value={selectedUser.activity.products_sold_count} />
                  <StatTile icon={<Icons.Handshake size={16} color="var(--success)" />} label="Transaksi Selesai" value={selectedUser.activity.transactions_completed_count} />
                  <StatTile icon={<Icons.TrendingUp size={16} color="var(--primary)" />} label="Total Sbg Penjual" value={selectedUser.activity.transactions_as_seller_count} />
                  <StatTile icon={<Icons.ShoppingBag size={16} color="var(--primary)" />} label="Total Sbg Pembeli" value={selectedUser.activity.transactions_as_buyer_count} />
                </div>
              </div>
            </div>
          ) : null}
        </Modal>
    </AdminLayout>
  );
}
