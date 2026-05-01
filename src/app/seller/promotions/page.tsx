'use client';

import { useState, useEffect } from 'react';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';

export default function SellerPromotions() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [packages, setPackages] = useState<any[]>([]);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [myPromotions, setMyPromotions] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== USER_ROLES.PENJUAL) {
        router.push('/');
      } else {
        loadData();
      }
    }
  }, [user, authLoading, router]);

  async function loadData() {
    try {
      const [packagesRes, productsRes, promosRes] = await Promise.all([
        fetchApi('/promotions/packages'),
        fetchApi('/my-products'),
        fetchApi('/promotions/my')
      ]);
      setPackages(packagesRes.data || packagesRes);
      // Only show products that are not sold
      const activeProducts = (productsRes.data || productsRes).filter((p: any) => !p.status_terjual);
      setMyProducts(activeProducts);
      setMyPromotions(promosRes.data || promosRes);
    } catch (err) {
      console.error('Failed to load promotion data:', err);
    } finally {
      setLoading(false);
    }
  }

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedPackage) return showMessage('Pilih produk dan paket terlebih dahulu', 'error');
    
    if (!confirm('Simulasi Pembayaran: Apakah Anda yakin ingin mengaktifkan paket promosi ini? (Anggap pembayaran berhasil)')) return;
    
    setActionLoading(true);
    try {
      await fetchApi('/promotions', {
        method: 'POST',
        body: JSON.stringify({
          product_id: selectedProduct,
          package_id: selectedPackage
        })
      });
      showMessage('Promosi berhasil diaktifkan!', 'success');
      setSelectedProduct('');
      setSelectedPackage('');
      await loadData();
    } catch (err: any) {
      showMessage(err.message || 'Gagal mengaktifkan promosi', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || authLoading) return <div className="p-8 text-center">Memuat data promosi...</div>;

  return (
    <div className="container" style={{ padding: '40px 1rem', maxWidth: '1000px' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '2rem' }}>Pusat Promosi (Boost Produk)</h1>
      <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
        Tingkatkan visibilitas barang daganganmu agar selalu tampil di urutan paling atas dan lebih cepat laku.
      </p>

      {message && (
        <div style={{
          padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '2rem',
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: message.type === 'success' ? '#10b981' : '#ef4444',
          fontWeight: 600
        }}>
          {message.text}
        </div>
      )}

      <div className="flex gap-8 flex-wrap items-start">
        
        {/* Form Beli Promosi */}
        <div className="card" style={{ flex: '1 1 400px', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Beli Paket Promosi</h2>
          
          <form onSubmit={handlePurchase} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>1. Pilih Produk</label>
              <select className="input-field" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} required>
                <option value="">-- Pilih Produk Aktif --</option>
                {myProducts.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nama_barang} {p.is_promoted ? '(Sedang Dipromosikan)' : ''}
                  </option>
                ))}
              </select>
              {myProducts.length === 0 && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem' }}>Kamu belum memiliki produk aktif untuk dipromosikan.</p>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>2. Pilih Paket</label>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {packages.map(pkg => (
                  <div key={pkg.id} 
                    onClick={() => setSelectedPackage(pkg.id.toString())}
                    style={{ 
                      padding: '1rem', border: `2px solid ${selectedPackage === pkg.id.toString() ? 'var(--primary)' : 'var(--border)'}`, 
                      borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                    <div className="flex justify-between items-center mb-1">
                      <div style={{ fontWeight: 800 }}>{pkg.name}</div>
                      <div style={{ color: 'var(--primary)', fontWeight: 800 }}>Rp {Number(pkg.price).toLocaleString('id-ID')}</div>
                    </div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Durasi: {pkg.duration_days} Hari</div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '1rem' }} disabled={actionLoading || myProducts.length === 0}>
              {actionLoading ? 'Memproses...' : 'Bayar & Aktifkan'}
            </button>
          </form>
        </div>

        {/* Riwayat Promosi */}
        <div className="card" style={{ flex: '1 1 500px', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Riwayat & Status Promosi</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {myPromotions.length === 0 ? (
              <p style={{ opacity: 0.6, textAlign: 'center', padding: '2rem 0' }}>Belum ada riwayat promosi.</p>
            ) : (
              myPromotions.map(promo => {
                const isActive = promo.status === 'active' && new Date(promo.end_date) > new Date();
                return (
                  <div key={promo.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '4px', background: 'var(--input)', overflow: 'hidden', flexShrink: 0 }}>
                       {promo.product?.foto && (
                         // eslint-disable-next-line @next/next/no-img-element
                         <img src={getStorageUrl(promo.product.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                       )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800 }}>{promo.product?.nama_barang}</div>
                      <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.25rem' }}>{promo.package?.name}</div>
                      <div style={{ fontSize: '0.8rem' }}>
                        Hingga: {new Date(promo.end_date).toLocaleDateString('id-ID')} {new Date(promo.end_date).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                    <div>
                      {isActive ? (
                        <span style={{ padding: '4px 8px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '0.75rem', fontWeight: 800 }}>AKTIF</span>
                      ) : (
                        <span style={{ padding: '4px 8px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.75rem', fontWeight: 800 }}>BERAKHIR</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
