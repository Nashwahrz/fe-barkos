'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';
import AdminSidebar from '@/components/AdminSidebar';
import { Icons } from '@/components/Icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTablePagination } from '@/hooks/useTablePagination';
import { Pagination } from '@/components/Pagination';

export default function AdminCategories() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const {
    searchQuery, setSearchQuery,
    currentPage, setCurrentPage,
    totalPages, paginatedData, totalItems
  } = useTablePagination(categories, ['name', 'description'], 10);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== USER_ROLES.SUPER_ADMIN) {
        router.push('/');
      } else {
        loadCategories();
      }
    }
  }, [user, authLoading, router]);

  async function loadCategories() {
    try {
      const data = await fetchApi('/categories'); // Public index is fine, or create admin index
      setCategories(data.data || data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingId) {
        await fetchApi(`/admin/categories/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({ name, description })
        });
      } else {
        await fetchApi('/admin/categories', {
          method: 'POST',
          body: JSON.stringify({ name, description })
        });
      }
      setName('');
      setDescription('');
      setEditingId(null);
      await loadCategories();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan kategori');
    } finally {
      setActionLoading(false);
    }
  }

  function handleEdit(cat: any) {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
  }

  function handleCancelEdit() {
    setEditingId(null);
    setName('');
    setDescription('');
  }

  async function handleDelete(id: number) {
    if (!confirm('Hapus kategori ini? Pastikan tidak ada produk yang menggunakannya.')) return;
    try {
      await fetchApi(`/admin/categories/${id}`, { method: 'DELETE' });
      await loadCategories();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus kategori.');
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
      <AdminSidebar currentPath="/admin/categories" />

      <main className="page-padding" style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <header className="admin-header-flex" style={{ marginBottom: '3rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Manajemen Kategori</h1>
            <p style={{ color: 'var(--foreground)', opacity: 0.6, fontSize: '1.05rem' }}>Kelola kategori produk untuk memudahkan pencarian pengguna.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Icons.Search size={16} color="var(--foreground)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
              <input 
                type="text" 
                placeholder="Cari kategori..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', outline: 'none', width: '250px', fontSize: '0.9rem' }}
              />
            </div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '0.6rem 1rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-sm)' }}>
              Total: {totalItems} Kategori
            </div>
          </div>
        </header>

        <div className="flex gap-8 items-start flex-wrap">
          
          {/* Table */}
          <div className="card" style={{ flex: '1 1 600px', padding: 0, overflow: 'hidden', border: '1px solid var(--border)', borderRadius: '20px' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--card)' }}>
                <thead style={{ background: 'var(--input)', textAlign: 'left', fontSize: '0.8rem', color: 'var(--foreground)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <tr>
                    <th style={{ padding: '1.25rem 2rem', fontWeight: 700 }}>KATEGORI</th>
                    <th style={{ padding: '1.25rem', fontWeight: 700 }}>DESKRIPSI</th>
                    <th style={{ padding: '1.25rem 2rem', fontWeight: 700, textAlign: 'right' }}>AKSI</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.95rem' }}>
                  {paginatedData.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="hover-bg-input">
                      <td style={{ padding: '1.25rem 2rem', fontWeight: 700, color: 'var(--foreground)' }}>{c.name}</td>
                      <td style={{ padding: '1.25rem', color: 'var(--foreground)', opacity: 0.7 }}>{c.description || '-'}</td>
                      <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button onClick={() => handleEdit(c)} style={{ 
                            padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', cursor: 'pointer',
                            color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
                          }}>
                            <Icons.Edit size={14} /> Edit
                          </button>
                          <button onClick={() => handleDelete(c.id)} style={{ 
                            padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(220, 38, 38, 0.2)', background: 'rgba(220, 38, 38, 0.05)', cursor: 'pointer',
                            color: 'var(--danger)', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
                          }}>
                            <Icons.Trash2 size={14} /> Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedData.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ padding: '4rem', textAlign: 'center', color: 'var(--foreground)', opacity: 0.5 }}>
                        <Icons.Inbox size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Kategori tidak ditemukan.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>

          {/* Form */}
          <div className="card" style={{ flex: '1 1 300px', padding: '2.5rem', position: 'sticky', top: '2rem', border: '1px solid var(--border)', borderRadius: '20px', background: 'var(--card)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem', color: 'var(--foreground)' }}>
              {editingId ? 'Edit Kategori' : 'Tambah Kategori'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Input 
                label="Nama Kategori"
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)' }}>Deskripsi (Opsional)</label>
                <textarea 
                  className="input-field" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  rows={4} 
                  style={{ height: 'auto', resize: 'vertical' }}
                />
              </div>
              <div className="flex gap-3" style={{ marginTop: '0.5rem' }}>
                <Button type="submit" variant="primary" style={{ flex: 1 }} disabled={actionLoading}>
                  {actionLoading ? 'Menyimpan...' : 'Simpan'}
                </Button>
                {editingId && (
                  <Button type="button" onClick={handleCancelEdit} variant="secondary">
                    Batal
                  </Button>
                )}
              </div>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
}
