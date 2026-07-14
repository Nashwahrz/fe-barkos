'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { offerApi } from '@/services/api/offer.api';
import { Offer } from '@/types/offer';
import { useAuth } from '@/components/AuthProvider';
import { Icons } from '@/components/Icons';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { Button } from '@/components/ui/Button';

export default function SellerOffers() {
  const router = useRouter();
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    loadOffers();
  }, [user]);

  const loadOffers = async () => {
    try {
      const [offersData, ordersData] = await Promise.all([
        offerApi.getSellerOffers(),
        fetchApi('/transactions?as=seller').catch(() => ({ data: [] }))
      ]);
      const offersRes = offersData.data || offersData;
      setOffers(offersRes);
      
      const ordersRes = ordersData.data || ordersData;
      setPendingOrdersCount(ordersRes.filter((o: any) => o.status === 'pending').length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (offerId: number, action: 'accept' | 'reject') => {
    if (!confirm(`Yakin ingin ${action === 'accept' ? 'menerima' : 'menolak'} penawaran ini?`)) return;
    try {
      await offerApi.updateStatus(offerId, action);
      alert(`Penawaran berhasil di${action === 'accept' ? 'terima' : 'tolak'}.`);
      loadOffers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Terjadi kesalahan.');
    }
  };

  const pendingOffersCount = offers.filter(o => o.status === 'pending').length;

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px', color: 'var(--foreground)', opacity: 0.5 }}>
      <Icons.Loader size={32} />
      <div style={{ fontWeight: 600 }}>Memuat penawaran...</div>
    </div>
  );

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem', maxWidth: '900px' }}>
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
      <div style={{ display: 'flex', gap: '4px', marginBottom: '2.5rem', background: 'var(--input)', padding: '6px', borderRadius: '14px', width: 'fit-content' }}>
        <Link href="/seller/orders" style={{
          padding: '10px 24px', borderRadius: '10px', fontWeight: 600, fontSize: '0.95rem',
          background: 'transparent', color: 'var(--foreground)', opacity: 0.6, textDecoration: 'none', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', gap: '8px'
        }} onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; }} onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.background = 'transparent'; }}>
          <Icons.ShoppingBag size={18} /> Pesanan Masuk
        </Link>
        <Link href="/seller/offers" style={{
          padding: '10px 24px', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem',
          background: 'var(--card)', color: 'var(--foreground)', boxShadow: 'var(--shadow-sm)', textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <Icons.Zap size={18} /> Tawaran Masuk
        </Link>
      </div>
      
      {offers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'var(--card)', borderRadius: '24px', border: '1px dashed var(--border)' }}>
          <div style={{ width: '80px', height: '80px', background: 'var(--input)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--foreground)', opacity: 0.5 }}>
            <Icons.Zap size={32} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)' }}>Belum ada tawaran masuk.</h2>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {offers.map(offer => (
            <div key={offer.id} className="card" style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', border: '1px solid var(--border)', background: 'var(--card)' }}>
              <div style={{ width: '88px', height: '88px', borderRadius: '16px', overflow: 'hidden', background: 'var(--input)', flexShrink: 0, border: '1px solid var(--border)' }}>
                {offer.product?.foto ? (
                  <img src={getStorageUrl(offer.product.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Icons.Package size={32} color="var(--border)" />
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '6px', color: 'var(--foreground)' }}>{offer.product?.nama_barang}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--foreground)', opacity: 0.6, marginBottom: '12px' }}>
                  Ditawar oleh: <strong style={{ color: 'var(--foreground)' }}>{offer.buyer?.name}</strong>
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--foreground)' }}>
                    Rp {Number(offer.offered_price).toLocaleString('id-ID')}
                  </span>
                  <span style={{ 
                    padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                    background: offer.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : offer.status === 'accepted' ? 'var(--primary-light)' : 'rgba(220, 38, 38, 0.1)',
                    color: offer.status === 'pending' ? 'var(--warning)' : offer.status === 'accepted' ? 'var(--primary)' : 'var(--danger)',
                    border: `1px solid ${offer.status === 'pending' ? 'rgba(245, 158, 11, 0.2)' : offer.status === 'accepted' ? 'rgba(13, 148, 136, 0.2)' : 'rgba(220, 38, 38, 0.2)'}`
                  }}>
                    {offer.status.toUpperCase()}
                  </span>
                </div>
              </div>
              
              {offer.status === 'pending' && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Button onClick={() => handleStatus(offer.id, 'accept')} variant="primary" size="md">
                    <Icons.CheckCircle size={16} /> Terima
                  </Button>
                  <Button onClick={() => handleStatus(offer.id, 'reject')} variant="danger" size="md">
                    <Icons.X size={16} /> Tolak
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
