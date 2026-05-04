'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { USER_ROLES } from '@/lib/constants';
import { Icons } from '@/components/Icons';

export default function SellerProductsDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== USER_ROLES.PENJUAL) {
        router.replace('/auth/login');
      } else {
        loadAll();
      }
    }
  }, [user, authLoading, router]);

  async function loadAll() {
    setLoading(true);
    try {
      const [prodData, ordData] = await Promise.all([
        fetchApi('/my-products'),
        fetchApi('/transactions'),
      ]);
      setProducts(prodData.data || prodData);
      setOrders(ordData.data || ordData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Hapus barang ini secara permanen?')) return;
    try {
      await fetchApi(`/products/${id}`, { method: 'DELETE' });
      setProducts(p => p.filter(x => x.id !== id));
    } catch {
      alert('Gagal menghapus barang.');
    }
  }

  if (authLoading || loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
      Memuat lapak Anda...
    </div>
  );

  const activeCount = products.filter(p => !p.status_terjual).length;
  const soldCount = products.filter(p => p.status_terjual).length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const revenue = orders.filter(o => o.status === 'completed').reduce((s, o) => s + Number(o.agreed_price), 0);

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '4px' }}>Lapak Saya</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Kelola barang jualan dan pantau pesanan Anda</p>
        </div>
        <Link href="/seller/products/create" className="btn btn-primary" style={{ height: '44px' }}>
          + Jual Barang Baru
        </Link>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'Barang Aktif', value: activeCount, Icon: Icons.Package, color: 'var(--primary)', bg: 'var(--primary-light)' },
          { label: 'Terjual', value: soldCount, Icon: Icons.CheckCircle, color: '#2D6A4F', bg: '#D8F3DC' },
          { label: 'Pesanan Baru', value: pendingOrders, Icon: Icons.Clock, color: '#92400E', bg: '#FEF3C7' },
          { label: 'Total Pendapatan', value: `Rp ${revenue.toLocaleString('id-ID')}`, Icon: Icons.DollarSign, color: '#1D4ED8', bg: '#DBEAFE' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: '12px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><s.Icon size={28} color={s.color} /></div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: s.color, opacity: 0.8 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <Link href="/seller/orders" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '10px 20px', borderRadius: '9999px',
          background: pendingOrders > 0 ? '#f59e0b' : 'var(--card)',
          border: pendingOrders > 0 ? '1px solid #f59e0b' : '1px solid var(--border)',
          color: pendingOrders > 0 ? 'white' : '#6b7280',
          fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none', transition: 'all 0.15s'
        }}>
          <Icons.ShoppingBag size={15} color={pendingOrders > 0 ? "white" : "#6b7280"} />
          Pesanan Masuk {pendingOrders > 0 && `(${pendingOrders})`}
        </Link>
        <Link href="/seller/promotions" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '10px 20px', borderRadius: '9999px',
          background: 'var(--card)', color: '#6b7280', border: '1px solid var(--border)',
          fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none'
        }}>
          <Icons.Zap size={15} color="#6b7280" /> Promosikan Barang
        </Link>
      </div>

      {/* Section title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Daftar Barang ({products.length})</h2>
      </div>

      {/* Empty state */}
      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', border: '2px dashed var(--border)', borderRadius: '16px' }}>
          <div style={{ width: '64px', height: '64px', background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}><Icons.Package size={32} color="#9ca3af" /></div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Lapak Anda masih kosong</h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '2rem' }}>Mulai jual barang bekas Anda dan dapatkan uang tambahan!</p>
          <Link href="/seller/products/create" className="btn btn-primary">Jual Barang Pertama</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {products.map(p => (
            <div key={p.id} className="card" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', padding: '1.25rem' }}>
              {/* Image */}
              <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: 'var(--card)', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                {p.foto
                  ? <img src={getStorageUrl(p.foto) || ''} alt={p.nama_barang} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Package size={32} color="#d1d5db" /></div>}
                {p.is_promoted && (
                  <div style={{ position: 'absolute', top: '4px', left: '4px', background: '#f59e0b', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 800, color: 'white' }}>PROMO</div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nama_barang}</h3>
                  <span style={{
                    padding: '2px 10px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                    background: p.status_terjual ? '#FEE2E2' : '#D8F3DC',
                    color: p.status_terjual ? '#991B1B' : '#2D6A4F',
                  }}>{p.status_terjual ? 'TERJUAL' : 'AKTIF'}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '6px' }}>
                  {p.category?.name || 'Umum'} &bull; {p.kondisi || 'bekas'}
                </div>
                <div style={{ fontWeight: 800, color: 'var(--primary)' }}>
                  Rp {Number(p.harga).toLocaleString('id-ID')}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                {!p.status_terjual && (
                  <Link href="/seller/promotions" title="Promosikan" style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                    <Icons.Zap size={16} color="#d97706" />
                  </Link>
                )}
                <Link href={`/seller/products/${p.id}/edit`} style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                  <Icons.Edit size={16} color="#6b7280" />
                </Link>
                <button onClick={() => handleDelete(p.id)} style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#FEE2E2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.Trash2 size={16} color="#ef4444" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
