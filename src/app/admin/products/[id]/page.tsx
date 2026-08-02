'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { USER_ROLES } from '@/lib/constants';
import AdminLayout from '@/components/AdminLayout';
import { Icons } from '@/components/Icons';
import { Badge } from '@/components/ui/Badge';

const infoTiles = [
  { key: 'user', label: 'Penjual', icon: Icons.User, get: (p: any) => p.user?.name || '-' },
  { key: 'category', label: 'Kategori', icon: Icons.Tag, get: (p: any) => p.category?.name || 'Umum' },
  { key: 'kondisi', label: 'Kondisi', icon: Icons.Sparkles, get: (p: any) => p.kondisi || '-' },
  { key: 'durasi', label: 'Durasi Pemakaian', icon: Icons.Clock, get: (p: any) => p.durasi_pemakaian || '-' },
  {
    key: 'created', label: 'Ditambahkan', icon: Icons.Package,
    get: (p: any) => p.created_at ? new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-',
  },
];

export default function AdminProductDetail() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== USER_ROLES.SUPER_ADMIN) {
        router.push('/');
      } else {
        loadProduct();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router, productId]);

  async function loadProduct() {
    setLoading(true);
    try {
      const data = await fetchApi(`/admin/products/${productId}`);
      setProduct(data.data || data);
    } catch (err) {
      console.error('Failed to load product:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!product) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus produk "${product.nama_barang}"? Transaksi terkait mungkin terpengaruh. Tindakan ini tidak bisa dibatalkan.`)) return;

    setDeleting(true);
    try {
      await fetchApi(`/admin/products/${product.id}`, { method: 'DELETE' });
      router.push('/admin/products');
    } catch (err) {
      alert('Gagal menghapus produk.');
      setDeleting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <AdminLayout currentPath="/admin/products">
        <div className="flex flex-col items-center justify-center" style={{ minHeight: '50vh', gap: '12px', color: 'var(--foreground)', opacity: 0.5 }}>
          <Icons.Loader size={32} />
          <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Memuat data...</div>
        </div>
      </AdminLayout>
    );
  }

  if (notFound || !product) {
    return (
      <AdminLayout currentPath="/admin/products">
        <div className="card" style={{ padding: '6rem 2rem', textAlign: 'center', color: 'var(--foreground)', opacity: 0.7, border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <Icons.Package size={40} style={{ margin: '0 auto 1.5rem', opacity: 0.5 }} />
          <div style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--foreground)' }}>Produk tidak ditemukan</div>
          <div style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>Produk ini mungkin sudah dihapus sebelumnya.</div>
          <Link href="/admin/products" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
            &larr; Kembali ke Manajemen Produk
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const images: any[] = product.images && product.images.length > 0
    ? product.images
    : (product.foto ? [{ id: 0, image_path: product.foto, is_primary: true }] : []);

  return (
    <AdminLayout currentPath="/admin/products">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <Link href="/admin/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--foreground)', opacity: 0.6, fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
          <Icons.ArrowLeft size={16} /> Kembali ke Manajemen Produk
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            color: 'white', fontWeight: 700, fontSize: '0.9rem',
            padding: '10px 18px', borderRadius: '10px', border: 'none',
            background: 'var(--danger)', cursor: deleting ? 'not-allowed' : 'pointer',
            opacity: deleting ? 0.7 : 1, boxShadow: '0 8px 20px rgba(220, 38, 38, 0.2)', transition: 'all 0.2s'
          }}
        >
          {deleting ? <Icons.Loader size={16} /> : <Icons.Trash2 size={16} />}
          {deleting ? 'Menghapus...' : 'Hapus Produk'}
        </button>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        <div className="flex md-flex-col" style={{ gap: 0 }}>
          {/* Gallery */}
          <div style={{ flex: '0 0 42%', minWidth: 0, padding: '2rem', background: 'var(--background)' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '16px', overflow: 'hidden', background: 'var(--input)', marginBottom: '0.75rem' }}>
              {images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={getStorageUrl(images[activeImage]?.image_path) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.Image size={48} color="var(--border)" />
                </div>
              )}
              <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                {product.status_terjual ? <Badge tone="danger">Terjual</Badge> : <Badge tone="success">Tersedia</Badge>}
              </div>
            </div>
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {images.map((img, idx) => (
                  <button
                    key={img.id ?? idx}
                    onClick={() => setActiveImage(idx)}
                    style={{
                      width: '60px', height: '60px', borderRadius: '10px', overflow: 'hidden', padding: 0, cursor: 'pointer',
                      border: activeImage === idx ? '2px solid var(--primary)' : '1px solid var(--border)',
                      opacity: activeImage === idx ? 1 : 0.6, background: 'var(--input)', transition: 'all 0.15s'
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getStorageUrl(img.image_path) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div style={{ flex: 1, minWidth: 0, padding: '2rem' }}>
            <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
              {product.nama_barang}
            </h1>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1.5rem' }}>
              Rp {Number(product.harga).toLocaleString('id-ID')}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
              {infoTiles.map(tile => {
                const Icon = tile.icon;
                return (
                  <div key={tile.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{tile.label}</div>
                      <div style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: '0.95rem' }}>{tile.get(product)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--foreground)', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                <Icons.MessageSquare size={14} /> Deskripsi
              </div>
              <div style={{ color: 'var(--foreground)', opacity: 0.9, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {product.deskripsi || <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Tidak ada deskripsi.</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
