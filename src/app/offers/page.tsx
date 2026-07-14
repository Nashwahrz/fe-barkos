'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { offerApi } from '@/services/api/offer.api';
import { Offer } from '@/types/offer';
import { useAuth } from '@/components/AuthProvider';
import { Icons } from '@/components/Icons';
import { getStorageUrl } from '@/lib/api';
import { Button } from '@/components/ui/Button';

export default function BuyerOffers() {
  const router = useRouter();
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
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
      const res = await offerApi.getBuyerOffers();
      setOffers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (offerId: number) => {
    if (!confirm('Yakin ingin membatalkan penawaran ini?')) return;
    try {
      await offerApi.updateStatus(offerId, 'cancel');
      alert('Penawaran berhasil dibatalkan.');
      loadOffers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Terjadi kesalahan.');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px', color: 'var(--foreground)', opacity: 0.5 }}>
      <Icons.Loader size={32} />
      <div style={{ fontWeight: 600 }}>Memuat penawaran...</div>
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '2.5rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Penawaran Saya</h1>
      
      {offers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'var(--card)', borderRadius: '24px', border: '1px dashed var(--border)' }}>
          <div style={{ width: '80px', height: '80px', background: 'var(--input)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--foreground)', opacity: 0.5 }}>
            <Icons.Zap size={32} />
          </div>
          <p style={{ color: 'var(--foreground)', opacity: 0.6, fontSize: '1.05rem', marginBottom: '2.5rem' }}>Kamu belum pernah menawar produk.</p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button href="/products" variant="primary" size="lg">
              Cari Produk
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {offers.map(offer => (
            <div key={offer.id} className="card" style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', border: '1px solid var(--border)', background: 'var(--card)' }}>
              <div style={{ width: '88px', height: '88px', borderRadius: '16px', overflow: 'hidden', background: 'var(--input)', flexShrink: 0, border: '1px solid var(--border)' }}>
                {offer.product?.foto ? (
                  <img src={getStorageUrl(offer.product.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Icons.Package size={32} color="var(--border)" />
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '6px', color: 'var(--foreground)' }}>{offer.product?.nama_barang}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--foreground)', opacity: 0.6, marginBottom: '12px' }}>
                  Penjual: <strong style={{ color: 'var(--foreground)' }}>{offer.seller?.name}</strong>
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
              
              <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', minWidth: '140px' }}>
                {offer.status === 'pending' && (
                  <Button onClick={() => handleCancel(offer.id)} variant="secondary" size="md">
                    Batalkan
                  </Button>
                )}
                {offer.status === 'accepted' && (
                  <Button href={`/products/${offer.product_id}`} variant="primary" size="md">
                    Beli Sekarang
                  </Button>
                )}
                <Button href={`/products/${offer.product_id}`} variant="secondary" size="md">
                  Lihat Produk
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
