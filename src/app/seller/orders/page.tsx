'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { offerApi } from '@/services/api/offer.api';
import { useAuth } from '@/components/AuthProvider';
import { USER_ROLES } from '@/lib/constants';
import { Icons } from '@/components/Icons';
import { Button } from '@/components/ui/Button';

const STATUS_MAP: Record<string, { label: string; bg: string; color: string; borderColor: string }> = {
  pending:   { label: 'Menunggu', bg: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', borderColor: 'rgba(245, 158, 11, 0.2)' },
  confirmed: { label: 'Konfirmasi', bg: 'var(--primary-light)', color: 'var(--primary)', borderColor: 'rgba(13, 148, 136, 0.2)' },
  completed: { label: 'Selesai',   bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderColor: 'rgba(16, 185, 129, 0.2)' },
  cancelled: { label: 'Batal',     bg: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)', borderColor: 'rgba(220, 38, 38, 0.2)' },
};

export default function SellerOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [pendingOffersCount, setPendingOffersCount] = useState(0);
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
      const [ordersData, offersData] = await Promise.all([
        fetchApi('/transactions?as=seller'),
        offerApi.getSellerOffers().catch(() => ({ data: [] }))
      ]);
      const ordersRes = ordersData.data || ordersData;
      setOrders(ordersRes);
      
      const offersRes = offersData.data || offersData;
      setPendingOffersCount(offersRes.filter((o: any) => o.status === 'pending').length);
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
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px', color: 'var(--foreground)', opacity: 0.5 }}>
      <Icons.Loader size={32} />
      <div style={{ fontWeight: 600 }}>Memuat pesanan...</div>
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem', maxWidth: '900px' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '80px', right: '24px', zIndex: 3000, padding: '14px 20px', borderRadius: '12px', background: toast.ok ? 'rgba(5, 150, 105, 0.1)' : 'rgba(220, 38, 38, 0.1)', border: `1px solid ${toast.ok ? 'rgba(5, 150, 105, 0.2)' : 'rgba(220, 38, 38, 0.2)'}`, color: toast.ok ? 'var(--success)' : 'var(--danger)', fontWeight: 600, fontSize: '0.9rem', boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {toast.ok ? <Icons.CheckCircle size={18} color="var(--success)" /> : <Icons.X size={18} color="var(--danger)" />}{toast.text}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
            Kelola Transaksi
          </h1>
          <p style={{ color: 'var(--foreground)', opacity: 0.6, fontSize: '0.95rem' }}>
            {pendingOrdersCount > 0 || pendingOffersCount > 0 ? (
              <>
                Menunggu konfirmasi: 
                {pendingOrdersCount > 0 && <span style={{ color: 'var(--warning)', fontWeight: 700 }}> {pendingOrdersCount} Pesanan</span>}
                {pendingOrdersCount > 0 && pendingOffersCount > 0 && ' |'}
                {pendingOffersCount > 0 && <span style={{ color: '#ec4899', fontWeight: 700 }}> {pendingOffersCount} Tawaran</span>}
              </>
            ) : (
              'Pantau pesanan masuk dan tawaran harga dari pembeli'
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Button href="/seller/products" variant="secondary" size="md">
            <Icons.ArrowLeft size={16} /> Lapak Saya
          </Button>
        </div>
      </div>

      {/* Main Tabs (Orders vs Offers) */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '2rem', background: 'var(--input)', padding: '6px', borderRadius: '14px', width: 'fit-content' }}>
        <Link href="/seller/orders" style={{
          padding: '10px 24px', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem',
          background: 'var(--card)', color: 'var(--foreground)', boxShadow: 'var(--shadow-sm)', textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <Icons.ShoppingBag size={18} /> Pesanan Masuk
        </Link>
        <Link href="/seller/offers" style={{
          padding: '10px 24px', borderRadius: '10px', fontWeight: 600, fontSize: '0.95rem',
          background: 'transparent', color: 'var(--foreground)', opacity: 0.6, textDecoration: 'none', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', gap: '8px'
        }} onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; }} onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.background = 'transparent'; }}>
          <Icons.Zap size={18} /> Tawaran Masuk
        </Link>
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

      {/* Order list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem 2rem', opacity: 0.6, background: 'var(--card)', borderRadius: '24px', border: '1px dashed var(--border)' }}>
          <div style={{ width: '80px', height: '80px', background: 'var(--input)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}><Icons.ShoppingBag size={32} color="var(--foreground)" style={{ opacity: 0.5 }} /></div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)' }}>Tidak ada pesanan</h2>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filtered.map(order => {
            const s = STATUS_MAP[order.status] || STATUS_MAP.pending;
            const isBusy = confirming === order.id;
            return (
              <div key={order.id} className="card" style={{ padding: '1.75rem', border: '1px solid var(--border)', background: 'var(--card)' }}>
                {/* Top Row */}
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                  {/* Image */}
                  <div style={{ width: '88px', height: '88px', borderRadius: '16px', background: 'var(--input)', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' }}>
                    {order.product?.foto
                      ? <img src={getStorageUrl(order.product.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Package size={32} color="var(--border)" /></div>}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '12px' }}>
                      <h3 style={{ fontWeight: 700, fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--foreground)' }}>
                        {order.product?.nama_barang}
                      </h3>
                      <span style={{ padding: '4px 12px', borderRadius: '8px', background: s.bg, color: s.color, border: `1px solid ${s.borderColor}`, fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                        {s.label}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--foreground)', opacity: 0.6, marginBottom: '12px' }}>
                      Pembeli: <strong style={{ color: 'var(--foreground)' }}>{order.buyer?.name}</strong> &bull; {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: '1.15rem' }}>
                        Rp {Number(order.agreed_price).toLocaleString('id-ID')}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--foreground)', opacity: 0.6, fontWeight: 600 }}>
                        {order.payment_method === 'cod' ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Icons.Handshake size={14} /> COD</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Icons.CreditCard size={14} /> Transfer Bank</span>}
                      </div>
                      {order.has_payment_proof && (
                        <span style={{ fontSize: '0.75rem', background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid rgba(13, 148, 136, 0.2)', padding: '4px 10px', borderRadius: '8px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Icons.CheckCircle size={14} /> Bukti bayar
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {order.notes && (
                  <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--input)', borderRadius: '12px', fontSize: '0.85rem', color: 'var(--foreground)', opacity: 0.8, display: 'flex', alignItems: 'flex-start', gap: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ marginTop: '2px', flexShrink: 0 }}><Icons.MessageCircle size={16} /></div> 
                    <span style={{ lineHeight: 1.5 }}>&quot;{order.notes}&quot;</span>
                  </div>
                )}

                {/* Actions */}
                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '12px', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                  {order.status === 'pending' && (
                    <>
                      <Button onClick={() => handleConfirm(order.id, 'confirm')} disabled={isBusy} variant="primary" size="md">
                        {isBusy ? 'Memproses...' : <><Icons.Check size={16} /> Konfirmasi</>}
                      </Button>
                      <Button onClick={() => handleConfirm(order.id, 'reject')} disabled={isBusy} variant="danger" size="md">
                        {isBusy ? 'Memproses...' : <><Icons.X size={16} /> Tolak</>}
                      </Button>
                    </>
                  )}

                  {order.status === 'confirmed' && (
                    <>
                      {order.payment_method === 'bank_transfer' && order.has_payment_proof && (
                        <Button onClick={() => handleComplete(order.id)} disabled={isBusy} variant="primary" size="md">
                          {isBusy ? 'Memproses...' : <><Icons.CheckCircle size={16} /> Konfirmasi Selesai</>}
                        </Button>
                      )}
                      {order.payment_method === 'cod' && (
                        <Button onClick={() => handleComplete(order.id)} disabled={isBusy} variant="primary" size="md">
                          {isBusy ? 'Memproses...' : <><Icons.Handshake size={16} /> COD Selesai</>}
                        </Button>
                      )}
                      {order.payment_method === 'bank_transfer' && !order.has_payment_proof && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--foreground)', opacity: 0.6, alignSelf: 'center', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                          <Icons.Loader size={14} /> Menunggu pembeli upload bukti bayar
                        </span>
                      )}
                    </>
                  )}

                  <Link href={`/seller/orders/${order.id}`} style={{ marginLeft: 'auto', fontSize: '0.9rem', color: 'var(--foreground)', opacity: 0.7, fontWeight: 600, textDecoration: 'none', alignSelf: 'center', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Detail <Icons.ArrowRight size={14} />
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
