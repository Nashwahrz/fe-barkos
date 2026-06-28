'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { offerApi } from '@/services/api/offer.api';
import { Offer } from '@/types/offer';
import { useAuth } from '@/components/AuthProvider';
import { Icons } from '@/components/Icons';
import { getStorageUrl } from '@/lib/api';

export default function SellerOffers() {
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
      const res = await offerApi.getSellerOffers();
      setOffers(res.data);
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

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat penawaran...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Penawaran Masuk</h1>
      
      {offers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px' }}>
          <Icons.Folder size={48} color="#d1d5db" />
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Belum ada penawaran masuk.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {offers.map(offer => (
            <div key={offer.id} className="card" style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                {offer.product?.foto ? (
                  <img src={getStorageUrl(offer.product.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Icons.Package size={40} color="#d1d5db" style={{ margin: '20px' }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>{offer.product?.nama_barang}</h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '8px' }}>
                  Ditawar oleh: <strong>{offer.buyer?.name}</strong>
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
              
              {offer.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleStatus(offer.id, 'accept')} className="btn btn-primary" style={{ background: '#10b981', borderColor: '#10b981', padding: '8px 16px', fontSize: '0.875rem' }}>
                    <Icons.CheckCircle size={16} color="white" /> Terima
                  </button>
                  <button onClick={() => handleStatus(offer.id, 'reject')} className="btn btn-secondary" style={{ color: '#ef4444', borderColor: '#ef4444', background: '#fef2f2', padding: '8px 16px', fontSize: '0.875rem' }}>
                    <Icons.X size={16} color="#ef4444" /> Tolak
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
