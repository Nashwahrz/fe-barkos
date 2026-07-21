'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { USER_ROLES } from '@/lib/constants';
import { Icons } from '@/components/Icons';
import { Button } from '@/components/ui/Button';

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
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5, gap: '12px', color: 'var(--foreground)' }}>
      <Icons.Loader size={32} />
      <div style={{ fontWeight: 600 }}>Memuat lapak Anda...</div>
    </div>
  );

  const activeCount = products.filter(p => !p.status_terjual).length;
  const soldCount = products.filter(p => p.status_terjual).length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const revenue = orders.filter(o => o.status === 'completed').reduce((s, o) => s + Number(o.agreed_price), 0);

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Lapak Saya</h1>
          <p style={{ color: 'var(--foreground)', opacity: 0.6, fontSize: '1rem' }}>Kelola barang jualan dan pantau pesanan Anda</p>
        </div>
        <Button href="/seller/products/create" variant="primary" size="lg">
          + Jual Barang Baru
        </Button>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
        {[
          { label: 'Barang Aktif', value: activeCount, Icon: Icons.Package, color: 'var(--primary)', bg: 'var(--primary-light)', borderColor: 'var(--primary)' },
          { label: 'Terjual', value: soldCount, Icon: Icons.CheckCircle, color: 'var(--primary)', bg: 'var(--primary-light)', borderColor: 'var(--primary)' },
          { label: 'Pesanan Baru', value: pendingOrders, Icon: Icons.Clock, color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)', borderColor: 'var(--warning)' },
          { label: 'Total Pendapatan', value: `Rp ${revenue.toLocaleString('id-ID')}`, Icon: Icons.DollarSign, color: 'var(--primary)', bg: 'var(--primary-light)', borderColor: 'var(--primary)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--card)', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--border)', borderTop: `4px solid ${s.borderColor}` }}>
            <div style={{ width: '48px', height: '48px', background: s.bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.Icon size={24} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.2 }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground)', opacity: 0.6, letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '4px' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        <Link href="/seller/orders" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '12px 24px', borderRadius: '12px',
          background: pendingOrders > 0 ? 'var(--warning)' : 'var(--input)',
          border: '1px solid var(--border)',
          color: pendingOrders > 0 ? '#fff' : 'var(--foreground)',
          fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', transition: 'all 0.2s',
          opacity: pendingOrders > 0 ? 1 : 0.8
        }}>
          <Icons.ShoppingBag size={16} color={pendingOrders > 0 ? "#fff" : "var(--foreground)"} />
          Pesanan Masuk {pendingOrders > 0 && `(${pendingOrders})`}
        </Link>
        <Link href="/seller/promotions" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '12px 24px', borderRadius: '12px',
          background: 'var(--input)', color: 'var(--foreground)', border: '1px solid var(--border)',
          fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', opacity: 0.8
        }}>
          <Icons.Zap size={16} /> Promosikan Barang
        </Link>
      </div>

      {/* Section title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)' }}>Daftar Barang ({products.length})</h2>
      </div>

      {/* Empty state */}
      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem 2rem', border: '1px dashed var(--border)', borderRadius: '24px', background: 'var(--card)' }}>
          <div style={{ width: '80px', height: '80px', background: 'var(--input)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Icons.Package size={32} color="var(--foreground)" style={{ opacity: 0.5 }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px', color: 'var(--foreground)' }}>Lapak Anda masih kosong</h2>
          <p style={{ color: 'var(--foreground)', opacity: 0.6, fontSize: '1rem', marginBottom: '2.5rem' }}>Mulai jual barang bekas Anda dan dapatkan uang tambahan!</p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button href="/seller/products/create" variant="primary" size="lg">Jual Barang Pertama</Button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {products.map(p => (
            <div key={p.id} className="card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', padding: '1.5rem', border: '1px solid var(--border)', background: 'var(--card)' }}>
              {/* Image */}
              <div style={{ width: '88px', height: '88px', borderRadius: '16px', background: 'var(--input)', overflow: 'hidden', flexShrink: 0, position: 'relative', border: '1px solid var(--border)' }}>
                {p.foto
                  ? <img src={getStorageUrl(p.foto) || ''} alt={p.nama_barang} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Package size={32} color="var(--border)" /></div>}
                {p.is_promoted && (
                  <div style={{ position: 'absolute', top: '6px', left: '6px', background: 'var(--foreground)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6rem', fontWeight: 700, color: 'var(--background)' }}>PROMO</div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--foreground)' }}>{p.nama_barang}</h3>
                  <span style={{
                    padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                    background: p.status_terjual ? 'rgba(220, 38, 38, 0.1)' : 'var(--primary-light)',
                    color: p.status_terjual ? 'var(--danger)' : 'var(--primary)',
                  }}>{p.status_terjual ? 'TERJUAL' : 'AKTIF'}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--foreground)', opacity: 0.6, marginBottom: '8px' }}>
                  {p.category?.name || 'Umum'} &bull; {p.kondisi || 'bekas'}
                </div>
                <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: '1.05rem' }}>
                  Rp {Number(p.harga).toLocaleString('id-ID')}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                {!p.status_terjual && (
                  <Link href="/seller/promotions" title="Promosikan" style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <Icons.Zap size={16} color="var(--warning)" />
                  </Link>
                )}
                <Link href={`/seller/products/${p.id}/edit`} style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--input)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', border: '1px solid var(--border)' }}>
                  <Icons.Edit size={16} color="var(--foreground)" />
                </Link>
                <button onClick={() => handleDelete(p.id)} style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.Trash2 size={16} color="var(--danger)" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
