'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

function calculateDistanceKM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180)
}

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState({ reason: '', description: '' });
  const [reportLoading, setReportLoading] = useState(false);
  const [buyerLocation, setBuyerLocation] = useState<{lat: number, lng: number} | null>(null);
  const [distanceInfo, setDistanceInfo] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        const data = await fetchApi(`/products/${id}`);
        setProduct(data.data || data);
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  const calculateDistance = () => {
    if (!product.latitude || !product.longitude) {
      alert("Maaf, penjual belum menyisipkan lokasi spesifik untuk barang ini.");
      return;
    }
    
    setCalculating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const bLat = position.coords.latitude;
          const bLng = position.coords.longitude;
          setBuyerLocation({ lat: bLat, lng: bLng });
          
          const sLat = parseFloat(product.latitude);
          const sLng = parseFloat(product.longitude);
          
          const km = calculateDistanceKM(bLat, bLng, sLat, sLng);
          
          if (km < 1) {
            setDistanceInfo(`Hanya ${(km * 1000).toFixed(0)} meter dari Anda! Sangat dekat dan cocok untuk COD.`);
          } else {
            setDistanceInfo(`Kira-kira ${km.toFixed(1)} kilometer dari lokasi Anda.`);
          }
          setCalculating(false);
        },
        (error) => {
          console.error(error);
          alert('Gagal mendapatkan lokasi. Pastikan GPS aktif dan izin diberikan pada browser.');
          setCalculating(false);
        }
      );
    } else {
      alert('Sistem navigasi tidak didukung oleh browser ini.');
      setCalculating(false);
    }
  };

  async function handleReport(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setReportLoading(true);
    try {
      await fetchApi('/reports', {
        method: 'POST',
        body: JSON.stringify({
          product_id: id,
          ...reportData
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      alert('Laporan berhasil dikirim. Terima kasih atas bantuanmu!');
      setIsReportModalOpen(false);
    } catch (err) {
      alert('Gagal mengirim laporan.');
    } finally {
      setReportLoading(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 70px)' }}>
      <div style={{ fontSize: '1.2rem', fontWeight: 600, opacity: 0.5 }}>Memuat detail produk...</div>
    </div>
  );

  async function handleDeleteProduct() {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
    try {
      await fetchApi(`/products/${id}`, { method: 'DELETE' });
      alert('Produk berhasil dihapus.');
      router.push('/products');
    } catch (err) {
      alert('Gagal menghapus produk.');
    }
  }

  return (
    <div className="container" style={{ padding: '60px 1rem' }}>
      <div className="flex flex-col md-flex-row gap-8" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem' }}>
        {/* Gallery Placeholder */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--input)', fontSize: '5rem' }}>
          {product?.foto ? (
             // eslint-disable-next-line @next/next/no-img-element
            <img src={`http://localhost:8000/storage/${product.foto}`} alt={product.nama_barang} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : '📦'}
        </div>

        {/* Product Info */}
        <div className="flex-col gap-6">
          <header>
            <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
                <div className="flex items-center gap-2">
                    <span style={{ padding: '4px 12px', background: 'var(--primary)', color: 'white', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>{product.category?.name || 'Kategori'}</span>
                    <span style={{ opacity: 0.5, fontSize: '0.85rem' }}>Dilihat 120 kali</span>
                </div>
                {user?.role === 'super_admin' && (
                    <button onClick={handleDeleteProduct} style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.85rem' }}>🗑️ Hapus Produk</button>
                )}
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.75rem', lineHeight: 1.1 }}>{product.nama_barang}</h1>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>Rp {product.harga.toLocaleString('id-ID')}</div>
          </header>

          <div style={{ padding: '1.5rem', background: 'var(--input)', borderRadius: 'var(--radius)', marginTop: '1rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Deskripsi</h3>
            <p style={{ lineHeight: 1.6, opacity: 0.8, whiteSpace: 'pre-wrap' }}>{product.deskripsi}</p>
          </div>

          {/* Location Area */}
          <div style={{ padding: '1.5rem', background: 'var(--input)', borderRadius: 'var(--radius)', marginTop: '1rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📍</span> Lokasi COD & Radius Jarak
            </h3>
            
            {product.latitude && product.longitude ? (
              <div className="flex-col gap-4">
                <div style={{ width: '100%', height: '250px', borderRadius: 'calc(var(--radius) - 4px)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    scrolling="no" 
                    title="Peta Penjual"
                    marginHeight={0} 
                    marginWidth={0} 
                    src={`https://maps.google.com/maps?q=${product.latitude},${product.longitude}&hl=id&z=15&output=embed`}
                  ></iframe>
                </div>

                {!distanceInfo ? (
                  <button onClick={calculateDistance} disabled={calculating} className="btn" style={{ background: 'white', color: 'var(--primary)', border: '1px solid var(--primary)', width: '100%', fontWeight: 700 }}>
                    {calculating ? '🧭 Menghitung Orbit Satelit...' : '📍 Berapa Jarak COD Saya ke Penjual?'}
                  </button>
                ) : (
                  <div style={{ padding: '1.25rem', background: 'rgba(34, 197, 94, 0.08)', color: '#15803d', borderRadius: 'var(--radius)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.25rem' }}>✅ Hitungan Radius Berhasil!</div>
                    <p style={{ opacity: 0.9, marginBottom: '1rem' }}>{distanceInfo}</p>
                    
                    {buyerLocation && (
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&origin=${buyerLocation.lat},${buyerLocation.lng}&destination=${product.latitude},${product.longitude}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="btn btn-primary" 
                        style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                      >
                        🧭 Buka Rute & Navigasi di Google Maps
                      </a>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', opacity: 0.6, border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
                Lokasi spesifik belum diatur oleh penjual. Anda bisa menanyakan langsung via chat.
              </div>
            )}
          </div>

          <div className="flex-col gap-4" style={{ marginTop: '1rem' }}>
            <div className="flex items-center gap-3">
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{product.user?.name.charAt(0)}</div>
              <div>
                <div style={{ fontWeight: 700 }}>{product.user?.name}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{product.user?.asal_kampus}</div>
              </div>
            </div>
            
            <div className="flex gap-4" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-primary flex-1" style={{ height: '55px', fontSize: '1.1rem' }}>Chat Penjual</button>
              <button 
                onClick={() => user ? setIsReportModalOpen(true) : router.push('/auth/login')}
                className="btn" 
                style={{ border: '1px solid #ef4444', color: '#ef4444', fontWeight: 700 }}
              >
                🚩 Laporkan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {isReportModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <h2 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Laporkan Produk</h2>
            <p style={{ opacity: 0.6, marginBottom: '1.5rem' }}>Mengapa Anda melaporkan produk ini?</p>
            
            <form onSubmit={handleReport} className="flex-col gap-4">
              <div className="flex-col gap-2">
                <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Alasan Utama</label>
                <select 
                  className="input-field" 
                  required
                  value={reportData.reason}
                  onChange={(e) => setReportData({ ...reportData, reason: e.target.value })}
                >
                  <option value="">Pilih alasan...</option>
                  <option value="Spam">Spam / Iklan tidak relevan</option>
                  <option value="Penipuan">Indikasi Penipuan</option>
                  <option value="Konten Tidak Layak">Konten tidak pantas</option>
                  <option value="Salah Kategori">Salah Kategori</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              
              <div className="flex-col gap-2">
                <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Detail (Opsional)</label>
                <textarea 
                  className="input-field" 
                  rows={4} 
                  placeholder="Berikan bukti atau penjelasan detail..."
                  value={reportData.description}
                  onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                />
              </div>

              <div className="flex gap-3" style={{ marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsReportModalOpen(false)} className="btn flex-1" style={{ border: '1px solid var(--border)' }}>Batal</button>
                <button type="submit" disabled={reportLoading} className="btn btn-primary flex-2" style={{ background: '#ef4444' }}>
                  {reportLoading ? 'Mengirim...' : 'Kirim Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
