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

export default function PromotionPackages() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({ name: '', price: '', duration_days: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== USER_ROLES.SUPER_ADMIN) {
        router.push('/');
      } else {
        loadPackages();
      }
    }
  }, [user, authLoading, router]);

  async function loadPackages() {
    try {
      const data = await fetchApi('/promotions/packages');
      setPackages(data.data || data || []);
    } catch (err) {
      console.error('Failed to load packages:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (pkg: any = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        name: pkg.name,
        price: pkg.price.toString(),
        duration_days: pkg.duration_days.toString()
      });
    } else {
      setEditingPackage(null);
      setFormData({ name: '', price: '', duration_days: '' });
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    try {
      if (editingPackage) {
        await fetchApi(`/admin/promotions/packages/${editingPackage.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        await fetchApi('/admin/promotions/packages', {
          method: 'POST',
          body: JSON.stringify(formData),
          headers: { 'Content-Type': 'application/json' }
        });
      }
      setIsModalOpen(false);
      loadPackages();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan paket. Mungkin API ini belum tersedia di backend.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus paket ini?')) return;
    try {
      await fetchApi(`/admin/promotions/packages/${id}`, { method: 'DELETE' });
      loadPackages();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus paket. Mungkin API ini belum tersedia di backend.');
    }
  };

  if (loading || authLoading) return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 70px)', gap: '12px', color: 'var(--foreground)', opacity: 0.5 }}>
      <Icons.Loader size={32} />
      <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Memuat paket promosi...</div>
    </div>
  );

  return (
    <div className="flex md-flex-col" style={{ minHeight: 'calc(100vh - 70px)', background: 'var(--background)' }}>
      <AdminSidebar currentPath="/admin/promotions" />

      <main className="page-padding" style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <header className="admin-header-flex" style={{ marginBottom: '3rem' }}>
          <div>
            <button onClick={() => router.push('/admin/promotions')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Icons.ArrowLeft size={16} /> Kembali ke Promosi
            </button>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Kelola Paket Promosi</h1>
            <p style={{ color: 'var(--foreground)', opacity: 0.6, fontSize: '1.05rem' }}>Atur opsi paket promosi yang dapat dibeli oleh penjual.</p>
          </div>
          <div>
            <Button onClick={() => handleOpenModal()} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.Plus size={18} /> Tambah Paket Baru
            </Button>
          </div>
        </header>

        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', borderRadius: '20px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--card)' }}>
              <thead style={{ background: 'var(--input)', textAlign: 'left', fontSize: '0.8rem', color: 'var(--foreground)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <tr>
                  <th style={{ padding: '1.25rem 2rem', fontWeight: 700 }}>NAMA PAKET</th>
                  <th style={{ padding: '1.25rem', fontWeight: 700 }}>HARGA</th>
                  <th style={{ padding: '1.25rem', fontWeight: 700 }}>DURASI AKTIF</th>
                  <th style={{ padding: '1.25rem 2rem', fontWeight: 700, textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.95rem' }}>
                {packages.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: 'var(--foreground)', opacity: 0.5 }}>
                      <Icons.Folder size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                      <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Belum ada paket promosi.</div>
                    </td>
                  </tr>
                ) : packages.map(pkg => (
                  <tr key={pkg.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="hover-bg-input">
                    <td style={{ padding: '1.25rem 2rem', fontWeight: 800, color: 'var(--foreground)' }}>
                      {pkg.name}
                    </td>
                    <td style={{ padding: '1.25rem', color: 'var(--primary)', fontWeight: 800 }}>
                      Rp {Number(pkg.price).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '1.25rem', color: 'var(--foreground)' }}>
                      {pkg.duration_days} Hari
                    </td>
                    <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleOpenModal(pkg)} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit">
                          <Icons.Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(pkg.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Hapus">
                          <Icons.Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div style={{ background: 'var(--card)', width: '100%', maxWidth: '500px', borderRadius: '24px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{editingPackage ? 'Edit Paket' : 'Tambah Paket Baru'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'var(--input)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--foreground)' }}>
                <Icons.X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {error && (
                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                  {error}
                </div>
              )}
              <Input
                label="Nama Paket"
                placeholder="Mis. Paket Premium, Promo Weekend"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Harga (Rp)"
                type="number"
                placeholder="Mis. 50000"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                required
              />
              <Input
                label="Durasi (Hari)"
                type="number"
                placeholder="Mis. 7"
                value={formData.duration_days}
                onChange={e => setFormData({ ...formData, duration_days: e.target.value })}
                required
              />
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit" variant="primary" disabled={formLoading}>
                  {formLoading ? 'Menyimpan...' : 'Simpan Paket'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
