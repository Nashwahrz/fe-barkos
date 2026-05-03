'use client';

import { useState, useEffect } from 'react';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';
import { Icons } from '@/components/Icons';

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
    <div className="container" style={{ padding: '60px 1rem', maxWidth: '1100px' }}>
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
          <Icons.Zap size={36} color="#f59e0b" /> Pusat Promosi
        </h1>
        <p style={{ opacity: 0.7, maxWidth: '650px', margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Tingkatkan visibilitas produk Anda agar selalu tampil di urutan teratas. <br/>Dapatkan lebih banyak calon pembeli dengan fitur <strong>Boost</strong>.
        </p>
      </header>

      {message && (
        <div style={{
          padding: '1.25rem', borderRadius: '10px', marginBottom: '2.5rem',
          background: message.type === 'success' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: message.type === 'success' ? '#16a34a' : '#ef4444',
          fontWeight: 700, textAlign: 'center', border: message.type === 'success' ? '1px solid rgba(22, 163, 74, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            {message.type === 'success' ? <Icons.CheckCircle size={20} color="#16a34a" /> : <Icons.X size={20} color="#ef4444" />}
            {message.text}
          </span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        
        {/* Form Beli Promosi */}
        <div className="card" style={{ padding: '2.5rem', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#111827' }}>
            <Icons.ShoppingBag size={24} color="#111827" /> Beli Paket Promosi
          </h2>
          
          <form onSubmit={handlePurchase} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.6rem', fontWeight: 700, color: '#374151' }}>1. Pilih Produk</label>
              <select className="input-field" style={{ height: '48px', borderRadius: '8px' }} value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} required>
                <option value="">-- Pilih Produk Aktif --</option>
                {myProducts.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nama_barang} {p.is_promoted ? '(Sedang Promo)' : ''}
                  </option>
                ))}
              </select>
              {myProducts.length === 0 && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.6rem' }}>Kamu belum memiliki produk aktif untuk dipromosikan.</p>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.6rem', fontWeight: 700, color: '#374151' }}>2. Pilih Paket Durasi</label>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {packages.map(pkg => {
                  const isSelected = selectedPackage === pkg.id.toString();
                  return (
                    <div key={pkg.id} 
                      onClick={() => setSelectedPackage(pkg.id.toString())}
                      style={{ 
                        padding: '1.25rem', 
                        border: '2.5px solid',
                        borderColor: isSelected ? 'var(--primary)' : 'var(--border)', 
                        background: isSelected ? 'var(--primary-light)' : 'white',
                        borderRadius: '10px', 
                        cursor: 'pointer', 
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                        boxShadow: isSelected ? '0 10px 15px -3px rgba(0, 0, 0, 0.05)' : 'none'
                      }}>
                      <div className="flex justify-between items-center" style={{ marginBottom: '0.4rem' }}>
                        <div style={{ fontWeight: 800, color: isSelected ? 'var(--primary)' : '#111827', fontSize: '1rem' }}>{pkg.name}</div>
                        <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '1.1rem' }}>Rp {Number(pkg.price).toLocaleString('id-ID')}</div>
                      </div>
                      <div style={{ fontSize: '0.85rem', opacity: 0.7, fontWeight: 500 }}>Durasi Aktif: {pkg.duration_days} Hari</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '1.125rem', fontWeight: 800, fontSize: '1.05rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)', marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={actionLoading || myProducts.length === 0}>
              {actionLoading ? <><Icons.Loader size={20} color="white" /> Memproses...</> : <><Icons.Zap size={20} color="white" /> Aktifkan Boost Sekarang</>}
            </button>
          </form>
        </div>

        {/* Riwayat Promosi */}
        <div className="card" style={{ padding: '2.5rem', background: '#ffffff', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#111827' }}>
            <Icons.Clock size={24} color="#111827" /> Riwayat Boost
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {myPromotions.length === 0 ? (
              <div style={{ opacity: 0.6, textAlign: 'center', padding: '4rem 0', background: 'var(--background)', borderRadius: '10px', border: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <Icons.Folder size={48} color="#9ca3af" />
                <p style={{ fontWeight: 500 }}>Belum ada riwayat promosi.</p>
              </div>
            ) : (
              myPromotions.map(promo => {
                const isActive = promo.status === 'active' && new Date(promo.end_at) > new Date();
                return (
                  <div key={promo.id} style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '10px', display: 'flex', gap: '1.25rem', alignItems: 'center', background: isActive ? 'white' : '#f9fafb' }}>
                    <div style={{ width: '70px', height: '70px', borderRadius: '8px', background: 'var(--input)', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' }}>
                       {promo.product?.foto ? (
                         // eslint-disable-next-line @next/next/no-img-element
                         <img src={getStorageUrl(promo.product.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                       ) : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Package size={28} color="#d1d5db" /></div>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, color: '#111827', marginBottom: '0.2rem', fontSize: '1rem' }}>{promo.product?.nama_barang || 'Produk dihapus'}</div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 600, marginBottom: '0.4rem' }}>{promo.package?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 }}>
                        Sampai: {new Date(promo.end_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div>
                      {isActive ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <span style={{ padding: '5px 12px', borderRadius: '20px', background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>AKTIF <Icons.Zap size={12} color="#16a34a" /></span>
                        </div>
                      ) : (
                        <span style={{ padding: '5px 12px', borderRadius: '20px', background: 'rgba(107, 114, 128, 0.08)', color: '#6b7280', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em' }}>EXPIRED</span>
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
