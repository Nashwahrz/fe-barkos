'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { offerApi } from '@/services/api/offer.api';
import { Offer } from '@/types/offer';
import { useAuth } from '@/components/AuthProvider';
import { Icons } from '@/components/Icons';
import { getStorageUrl } from '@/lib/api';

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

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat penawaran...</div>;

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1.5rem' }}>Penawaran Saya</h1>
      
      {offers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px' }}>
          <Icons.Zap size={48} color="#d1d5db" />
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Kamu belum pernah menawar produk.</p>
          <button onClick={() => router.push('/products')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Cari Produk
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {offers.map(offer => (
            <div key={offer.id} className="card" style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                {offer.product?.foto ? (
                  <img src={getStorageUrl(offer.product.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Icons.Package size={40} color="#d1d5db" style={{ margin: '20px' }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>{offer.product?.nama_barang}</h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '8px' }}>
                  Penjual: <strong>{offer.seller?.name}</strong>
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                    Rp {Number(offer.offered_price).toLocaleString('id-ID')}
                  </span>
                  <span style={{ 
                    padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                    background: offer.status === 'pending' ? '#FEF3C7' : offer.status === 'accepted' ? '#D8F3DC' : '#FEE2E2',
                    color: offer.status === 'pending' ? '#92400E' : offer.status === 'accepted' ? '#2D6A4F' : '#991B1B'
                  }}>
                    {offer.status.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', minWidth: '140px' }}>
                {offer.status === 'pending' && (
                  <button onClick={() => handleCancel(offer.id)} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
                    Batalkan
                  </button>
                )}
                {offer.status === 'accepted' && (
                  <button 
                    onClick={() => router.push(`/products/${offer.product_id}`)} 
                    className="btn btn-primary" 
                    style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                  >
                    Beli Sekarang
                  </button>
                )}
                <button onClick={() => router.push(`/products/${offer.product_id}`)} className="btn" style={{ padding: '8px 16px', fontSize: '0.875rem', border: '1px solid var(--border)', background: 'white' }}>
                  Lihat Produk
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
