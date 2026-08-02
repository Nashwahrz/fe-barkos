'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';
import AdminLayout from '@/components/AdminLayout';
import { Icons } from '@/components/Icons';
import { useTablePagination } from '@/hooks/useTablePagination';
import { Pagination } from '@/components/Pagination';
import { Badge } from '@/components/ui/Badge';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';

interface AdminProduct {
  id: number;
  nama_barang: string;
  harga: number | string;
  foto?: string | null;
  status_terjual: boolean;
  user?: { name: string };
  category?: { name: string };
}

export default function AdminProducts() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const {
    searchQuery, setSearchQuery,
    currentPage, setCurrentPage,
    totalPages, paginatedData, totalItems
  } = useTablePagination(products, ['nama_barang', 'user.name', 'category.name', 'deskripsi'], 10);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== USER_ROLES.SUPER_ADMIN) {
        router.push('/');
      } else {
        loadProducts();
      }
    }
  }, [user, authLoading, router]);

  async function loadProducts() {
    try {
      const data = await fetchApi('/admin/products');
      setProducts(data.data || data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini? Transaksi terkait mungkin terpengaruh.')) return;
    
    setActionLoading(id);
    try {
      await fetchApi(`/admin/products/${id}`, { method: 'DELETE' });
      await loadProducts();
    } catch (err) {
      alert('Gagal menghapus produk.');
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

  const columns: DataTableColumn<AdminProduct>[] = [
    {
      key: 'produk', header: 'Produk', render: p => (
        <div className="flex items-center gap-4">
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'var(--input)', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' }}>
            {p.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getStorageUrl(p.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Package size={24} color="var(--border)" /></div>}
          </div>
          <div className="flex-col">
            <div style={{ fontWeight: 700, color: 'var(--foreground)' }}>{p.nama_barang}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--foreground)', opacity: 0.7, fontWeight: 600 }}>Rp {Number(p.harga).toLocaleString('id-ID')}</div>
          </div>
        </div>
      ),
    },
    { key: 'penjual', header: 'Penjual', render: p => <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>{p.user?.name}</span> },
    {
      key: 'kategori', header: 'Kategori', render: p => (
        <span style={{ background: 'var(--input)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground)', opacity: 0.8, border: '1px solid var(--border)' }}>
          {p.category?.name || 'Umum'}
        </span>
      ),
    },
    {
      key: 'status', header: 'Status', render: p => (
        p.status_terjual ? <Badge tone="danger">Terjual</Badge> : <Badge tone="primary">Tersedia</Badge>
      ),
    },
    {
      key: 'aksi', header: 'Aksi', align: 'right', render: p => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/admin/products/${p.id}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              color: 'var(--foreground)', fontWeight: 600, fontSize: '0.85rem',
              padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', textDecoration: 'none'
            }}
          >
            <Icons.Eye size={14} /> Detail
          </Link>
          <button
            onClick={() => handleDelete(p.id)}
            disabled={actionLoading === p.id}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              color: 'var(--danger)', fontWeight: 600, fontSize: '0.85rem',
              padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(220, 38, 38, 0.2)', background: 'rgba(220, 38, 38, 0.05)', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {actionLoading === p.id ? <Icons.Loader size={14} /> : <Icons.Trash2 size={14} />}
            {actionLoading === p.id ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout currentPath="/admin/products">
        <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ flex: '1 1 auto', minWidth: '300px' }}>
            <h1 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Manajemen Produk</h1>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '1rem', margin: 0 }}>Lihat dan hapus produk yang melanggar aturan.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', flex: '0 0 auto' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', left: '12px', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <Icons.Search size={16} color="var(--foreground)" style={{ opacity: 0.5 }} />
              </div>
              <input 
                type="text" 
                placeholder="Cari produk..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', outline: 'none', width: '250px', fontSize: '0.9rem', margin: 0 }}
              />
            </div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '0.6rem 1rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-sm)' }}>
              Total: {totalItems} Produk
            </div>
          </div>
        </header>

        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', borderRadius: '20px' }}>
          <DataTable<AdminProduct>
            columns={columns}
            data={paginatedData}
            keyExtractor={p => p.id}
            loading={loading}
            emptyMessage="Tidak ada produk ditemukan."
          />
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
    </AdminLayout>
  );
}
