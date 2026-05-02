'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';
import AdminSidebar from '@/components/AdminSidebar';

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

  if (loading || authLoading) return <div className="p-8 text-center">Memuat data...</div>;

  return (
    <div className="flex" style={{ minHeight: 'calc(100vh - 70px)' }}>
      <AdminSidebar currentPath="/admin/categories" />

      <main style={{ flex: 1, padding: '2rem', background: 'rgba(0,0,0,0.02)' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <header style={{ marginBottom: '2.5rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Manajemen Kategori</h1>
            <p style={{ opacity: 0.6 }}>Kelola kategori produk untuk memudahkan pencarian pengguna.</p>
          </header>

          <div className="flex gap-8 items-start flex-wrap">
            
            {/* Table */}
            <div className="card" style={{ flex: '1 1 600px', padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'rgba(0,0,0,0.03)', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(0,0,0,0.4)' }}>
                  <tr>
                    <th style={{ padding: '1rem 1.5rem' }}>KATEGORI</th>
                    <th style={{ padding: '1rem' }}>DESKRIPSI</th>
                    <th style={{ padding: '1rem' }}>AKSI</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.9rem' }}>
                  {categories.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 700 }}>{c.name}</td>
                      <td style={{ padding: '1rem', opacity: 0.7 }}>{c.description || '-'}</td>
                      <td style={{ padding: '1rem' }}>
                        <div className="flex gap-3">
                          <button onClick={() => handleEdit(c)} style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem' }}>Edit</button>
                          <button onClick={() => handleDelete(c.id)} style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.85rem' }}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr><td colSpan={3} style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Belum ada kategori.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Form */}
            <div className="card" style={{ flex: '1 1 300px', padding: '2rem', position: 'sticky', top: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>
                {editingId ? 'Edit Kategori' : 'Tambah Kategori'}
              </h2>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Nama Kategori</label>
                  <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Deskripsi (Opsional)</label>
                  <textarea className="input-field" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
                </div>
                <div className="flex gap-2 mt-2">
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={actionLoading}>
                    {actionLoading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                  {editingId && (
                    <button type="button" onClick={handleCancelEdit} className="btn" style={{ background: 'var(--input)' }}>
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
