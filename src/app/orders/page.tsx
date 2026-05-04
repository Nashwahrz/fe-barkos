'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/Icons';

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: 'Menunggu Konfirmasi', bg: '#FEF3C7', color: '#92400E' },
  confirmed: { label: 'Dikonfirmasi',        bg: '#DBEAFE', color: '#1D4ED8' },
  completed: { label: 'Selesai',             bg: '#D8F3DC', color: '#2D6A4F' },
  cancelled: { label: 'Dibatalkan',          bg: '#FEE2E2', color: '#991B1B' },
};

export default function BuyerOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user === null) return;
    if (!user) { router.push('/auth/login'); return; }
    fetchApi('/transactions')
      .then(d => setOrders(d.data || d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, router]);

  const tabs = [
    { key: 'all',       label: 'Semua' },
    { key: 'pending',   label: 'Menunggu' },
    { key: 'confirmed', label: 'Dikonfirmasi' },
    { key: 'completed', label: 'Selesai' },
    { key: 'cancelled', label: 'Dibatalkan' },
  ];

  const filtered = activeTab === 'all' ? orders : orders.filter(o => o.status === activeTab);

  if (loading) return (
    <div className="container" style={{ paddingTop: 'var(--spacing-16)', textAlign: 'center', opacity: 0.5 }}>
      Memuat pesanan...
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem', maxWidth: '860px' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '4px' }}>Pesanan Saya</h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Pantau status semua pesanan Anda</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '6px 16px', borderRadius: '9999px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.15s',
            background: activeTab === tab.key ? 'var(--primary)' : 'var(--card)',
            color: activeTab === tab.key ? 'white' : '#6b7280',
          }}>
            {tab.label}
            {tab.key !== 'all' && orders.filter(o => o.status === tab.key).length > 0 && (
              <span style={{ marginLeft: '6px', background: activeTab === tab.key ? 'rgba(255,255,255,0.3)' : 'var(--border)', borderRadius: '20px', padding: '1px 7px', fontSize: '0.7rem' }}>
                {orders.filter(o => o.status === tab.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Order List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 0', opacity: 0.6 }}>
          <div style={{ width: '56px', height: '56px', background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Icons.ShoppingBag size={24} color="#9ca3af" />
          </div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>Tidak ada pesanan</h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '2rem' }}>
            {activeTab === 'all' ? 'Kamu belum pernah membeli barang apapun.' : `Tidak ada pesanan dengan status "${tabs.find(t => t.key === activeTab)?.label}".`}
          </p>
          {activeTab === 'all' && (
            <Link href="/products" className="btn btn-primary">Mulai Belanja</Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(order => {
            const s = STATUS_MAP[order.status] || STATUS_MAP.pending;
            return (
              <Link href={`/orders/${order.id}`} key={order.id} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', textDecoration: 'none', color: 'inherit', padding: '1rem' }}>
                {/* Product Image */}
                <div style={{ width: '72px', height: '72px', borderRadius: '12px', background: 'var(--card)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {order.product?.foto
                    ? <img src={getStorageUrl(order.product.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Icons.Package size={28} color="#d1d5db" />}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px', gap: '8px' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {order.product?.nama_barang}
                    </h3>
                    <span style={{ padding: '3px 10px', borderRadius: '9999px', background: s.bg, color: s.color, fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                      {s.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: '6px' }}>
                    Penjual: {order.seller?.name} &bull; {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>
                      Rp {Number(order.agreed_price).toLocaleString('id-ID')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#6b7280', fontWeight: 500 }}>
                      {order.payment_method === 'cod'
                        ? <><Icons.Handshake size={12} color="#6b7280" /> COD</>
                        : <><Icons.CreditCard size={12} color="#6b7280" /> Transfer</>}
                    </div>
                  </div>
                </div>
                <Icons.ChevronRight size={18} color="#9ca3af" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
