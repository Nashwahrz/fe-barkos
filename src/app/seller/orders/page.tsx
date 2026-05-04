'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { USER_ROLES } from '@/lib/constants';
import { Icons } from '@/components/Icons';

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: 'Menunggu', bg: '#FEF3C7', color: '#92400E' },
  confirmed: { label: 'Konfirmasi', bg: '#DBEAFE', color: '#1D4ED8' },
  completed: { label: 'Selesai',   bg: '#D8F3DC', color: '#2D6A4F' },
  cancelled: { label: 'Batal',     bg: '#FEE2E2', color: '#991B1B' },
};

export default function SellerOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (user === null) return;
    if (!user || user.role !== USER_ROLES.PENJUAL) { router.push('/auth/login'); return; }
    loadOrders();
  }, [user, router]);

  async function loadOrders() {
    try {
      const data = await fetchApi('/transactions');
      setOrders(data.data || data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const showToast = (text: string, ok: boolean) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const handleConfirm = async (orderId: number, action: 'confirm' | 'reject') => {
    setConfirming(orderId);
    try {
      await fetchApi(`/transactions/${orderId}/confirm`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      showToast(action === 'confirm' ? 'Pesanan dikonfirmasi!' : 'Pesanan ditolak.', action === 'confirm');
      loadOrders();
    } catch (err: any) {
      showToast(err.message || 'Gagal memproses.', false);
    } finally {
      setConfirming(null);
    }
  };

  const handleComplete = async (orderId: number) => {
    if (!confirm('Tandai transaksi ini sebagai selesai?')) return;
    setConfirming(orderId);
    try {
      await fetchApi(`/transactions/${orderId}/complete`, { method: 'PATCH' });
      showToast('Transaksi ditandai selesai! Barang otomatis terjual.', true);
      loadOrders();
    } catch (err: any) {
      showToast(err.message || 'Gagal.', false);
    } finally {
      setConfirming(null);
    }
  };

  const tabs = [
    { key: 'all', label: 'Semua' },
    { key: 'pending', label: 'Menunggu' },
    { key: 'confirmed', label: 'Dikonfirmasi' },
    { key: 'completed', label: 'Selesai' },
    { key: 'cancelled', label: 'Dibatalkan' },
  ];

  const filtered = activeTab === 'all' ? orders : orders.filter(o => o.status === activeTab);
  const pendingCount = orders.filter(o => o.status === 'pending').length;

  if (loading) return <div className="container" style={{ paddingTop: '80px', textAlign: 'center', opacity: 0.5 }}>Memuat pesanan...</div>;

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem', maxWidth: '900px' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '80px', right: '24px', zIndex: 3000, padding: '14px 20px', borderRadius: '12px', background: toast.ok ? '#D8F3DC' : '#FEE2E2', color: toast.ok ? '#2D6A4F' : '#991B1B', fontWeight: 700, fontSize: '0.9rem', boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {toast.ok ? <Icons.CheckCircle size={18} color="#2D6A4F" /> : <Icons.X size={18} color="#991B1B" />}{toast.text}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '4px' }}>Pesanan Masuk</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            {pendingCount > 0
              ? <><span style={{ color: '#f59e0b', fontWeight: 700 }}>{pendingCount} pesanan</span> menunggu konfirmasi Anda</>
              : 'Tidak ada pesanan yang menunggu konfirmasi'}
          </p>
        </div>
        <Link href="/seller/products" style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
          ← Lapak Saya
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '6px 16px', borderRadius: '9999px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.15s',
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

      {/* Order list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 0', opacity: 0.6 }}>
          <div style={{ width: '64px', height: '64px', background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}><Icons.ShoppingBag size={32} color="#9ca3af" /></div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Tidak ada pesanan</h2>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(order => {
            const s = STATUS_MAP[order.status] || STATUS_MAP.pending;
            const isBusy = confirming === order.id;
            return (
              <div key={order.id} className="card" style={{ padding: '1.5rem' }}>
                {/* Top Row */}
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                  {/* Image */}
                  <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: 'var(--card)', overflow: 'hidden', flexShrink: 0 }}>
                    {order.product?.foto
                      ? <img src={getStorageUrl(order.product.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Package size={32} color="#d1d5db" /></div>}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', gap: '12px' }}>
                      <h3 style={{ fontWeight: 700, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {order.product?.nama_barang}
                      </h3>
                      <span style={{ padding: '3px 10px', borderRadius: '9999px', background: s.bg, color: s.color, fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                        {s.label}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '8px' }}>
                      Pembeli: <strong>{order.buyer?.name}</strong> &bull; {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                      <div style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.1rem' }}>
                        Rp {Number(order.agreed_price).toLocaleString('id-ID')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>
                        {order.payment_method === 'cod' ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Icons.Handshake size={14} color="#6b7280" /> COD</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Icons.CreditCard size={14} color="#6b7280" /> Transfer Bank</span>}
                      </div>
                      {order.has_payment_proof && (
                        <span style={{ fontSize: '0.75rem', background: '#D8F3DC', color: '#2D6A4F', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Icons.CheckCircle size={12} color="#2D6A4F" /> Bukti bayar
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {order.notes && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--card)', borderRadius: '8px', fontSize: '0.8rem', color: '#6b7280', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <div style={{ marginTop: '2px', flexShrink: 0 }}><Icons.MessageCircle size={14} color="#6b7280" /></div> 
                    <span>&quot;{order.notes}&quot;</span>
                  </div>
                )}

                {/* Actions */}
                <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                  {order.status === 'pending' && (
                    <>
                      <button onClick={() => handleConfirm(order.id, 'confirm')} disabled={isBusy} className="btn btn-primary" style={{ height: '40px', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {isBusy ? <Icons.Loader size={16} color="white" /> : <Icons.Check size={16} color="white" />} Konfirmasi
                      </button>
                      <button onClick={() => handleConfirm(order.id, 'reject')} disabled={isBusy} className="btn" style={{ height: '40px', fontSize: '0.875rem', background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {isBusy ? <Icons.Loader size={16} color="#991B1B" /> : <Icons.X size={16} color="#991B1B" />} Tolak
                      </button>
                    </>
                  )}

                  {order.status === 'confirmed' && (
                    <>
                      {order.payment_method === 'bank_transfer' && order.has_payment_proof && (
                        <button onClick={() => handleComplete(order.id)} disabled={isBusy} className="btn btn-primary" style={{ height: '40px', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {isBusy ? <Icons.Loader size={16} color="white" /> : <Icons.CheckCircle size={16} color="white" />} Konfirmasi Selesai
                        </button>
                      )}
                      {order.payment_method === 'cod' && (
                        <button onClick={() => handleComplete(order.id)} disabled={isBusy} className="btn btn-primary" style={{ height: '40px', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {isBusy ? <Icons.Loader size={16} color="white" /> : <Icons.Handshake size={16} color="white" />} COD Selesai
                        </button>
                      )}
                      {order.payment_method === 'bank_transfer' && !order.has_payment_proof && (
                        <span style={{ fontSize: '0.8rem', color: '#6b7280', alignSelf: 'center', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Icons.Loader size={14} color="#6b7280" /> Menunggu pembeli upload bukti bayar
                        </span>
                      )}
                    </>
                  )}

                  <Link href={`/seller/orders/${order.id}`} style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#6b7280', fontWeight: 600, textDecoration: 'none', alignSelf: 'center' }}>
                    Detail →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
