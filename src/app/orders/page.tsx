'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getStorageUrl, swrFetcher } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/Icons';
import useSWR from 'swr';
import { OrderItemSkeleton } from '@/components/Skeleton';
import { Button } from '@/components/ui/Button';

const STATUS_MAP: Record<string, { label: string; bg: string; color: string; borderColor: string }> = {
  pending:   { label: 'Menunggu Konfirmasi', bg: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', borderColor: 'rgba(245, 158, 11, 0.2)' },
  confirmed: { label: 'Dikonfirmasi',        bg: 'var(--primary-light)', color: 'var(--primary)', borderColor: 'rgba(13, 148, 136, 0.2)' },
  completed: { label: 'Selesai',             bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderColor: 'rgba(16, 185, 129, 0.2)' },
  cancelled: { label: 'Dibatalkan',          bg: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)', borderColor: 'rgba(220, 38, 38, 0.2)' },
};

export default function BuyerOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');

  const { data, isLoading } = useSWR(user ? '/transactions?as=buyer' : null, swrFetcher);
  const orders: any[] = data?.data || data || [];

  const tabs = [
    { key: 'all',       label: 'Semua' },
    { key: 'pending',   label: 'Menunggu' },
    { key: 'confirmed', label: 'Dikonfirmasi' },
    { key: 'completed', label: 'Selesai' },
    { key: 'cancelled', label: 'Dibatalkan' },
  ];

  const filtered = activeTab === 'all' ? orders : orders.filter(o => o.status === activeTab);

  if (authLoading) return null;
  if (user === null) {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem', maxWidth: '860px' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Pesanan Saya</h1>
        <p style={{ color: 'var(--foreground)', opacity: 0.6, fontSize: '1rem' }}>Pantau status semua pesanan Anda</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '2.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '8px 20px', borderRadius: '12px', border: '1px solid', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s',
            background: activeTab === tab.key ? 'var(--primary)' : 'var(--card)',
            color: activeTab === tab.key ? 'white' : 'var(--foreground)',
            borderColor: activeTab === tab.key ? 'var(--primary)' : 'var(--border)',
          }}>
            {tab.label}
            {tab.key !== 'all' && orders.filter(o => o.status === tab.key).length > 0 && (
              <span style={{ marginLeft: '8px', background: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : 'var(--input)', color: activeTab === tab.key ? 'white' : 'var(--foreground)', borderRadius: '20px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700 }}>
                {orders.filter(o => o.status === tab.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Order List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Array.from({ length: 3 }).map((_, i) => <OrderItemSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'var(--card)', borderRadius: '24px', border: '1px dashed var(--border)' }}>
          <div style={{ width: '80px', height: '80px', background: 'var(--input)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--foreground)', opacity: 0.5 }}>
            <Icons.ShoppingBag size={32} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', color: 'var(--foreground)' }}>Tidak ada pesanan</h2>
          <p style={{ color: 'var(--foreground)', opacity: 0.6, fontSize: '0.95rem', marginBottom: '2.5rem' }}>
            {activeTab === 'all' ? 'Kamu belum pernah membeli barang apapun.' : `Tidak ada pesanan dengan status "${tabs.find(t => t.key === activeTab)?.label}".`}
          </p>
          {activeTab === 'all' && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Button href="/products" variant="primary" size="lg">Mulai Belanja</Button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(order => {
            const s = STATUS_MAP[order.status] || STATUS_MAP.pending;
            return (
              <Link href={`/orders/${order.id}`} key={order.id} className="card" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', textDecoration: 'none', color: 'inherit', padding: '1.25rem', border: '1px solid var(--border)', background: 'var(--card)' }}>
                {/* Product Image */}
                <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: 'var(--input)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                  {order.product?.foto
                    ? <img src={getStorageUrl(order.product.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Icons.Package size={32} color="var(--border)" />}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', gap: '12px' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1.05rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, color: 'var(--foreground)' }}>
                      {order.product?.nama_barang}
                    </h3>
                    <span style={{ padding: '4px 12px', borderRadius: '8px', background: s.bg, color: s.color, border: `1px solid ${s.borderColor}`, fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                      {s.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--foreground)', opacity: 0.6, marginBottom: '8px' }}>
                    Penjual: <strong style={{ color: 'var(--foreground)' }}>{order.seller?.name}</strong> &bull; {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: '1.1rem' }}>
                      Rp {Number(order.agreed_price).toLocaleString('id-ID')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--foreground)', opacity: 0.6, fontWeight: 600 }}>
                      {order.payment_method === 'cod'
                        ? <><Icons.Handshake size={14} /> COD</>
                        : <><Icons.CreditCard size={14} /> Transfer</>}
                    </div>
                  </div>
                </div>
                <Icons.ChevronRight size={20} color="var(--border)" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
