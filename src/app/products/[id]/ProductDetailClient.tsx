'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetchApi, getStorageUrl, swrFetcher } from '@/lib/api';
import { offerApi } from '@/services/api/offer.api';
import { useAuth } from '@/components/AuthProvider';
import { Icons } from '@/components/Icons';

function calculateDistanceKM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type BuyStep = 'method' | 'confirm' | 'upload' | 'done';

export default function ProductDetailClient({ initialProduct, productId }: { initialProduct: any, productId: string }) {
  const id = productId;
  const router = useRouter();
  const { user } = useAuth();

  const { data: productData, isLoading: loading, mutate } = useSWR(`/products/${id}`, swrFetcher, {
    fallbackData: initialProduct ? { data: initialProduct } : undefined
  });
  const product = productData?.data || productData || initialProduct;

  const [distanceInfo, setDistanceInfo] = useState<string | null>(null);
  const [buyerLocation, setBuyerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [calculating, setCalculating] = useState(false);

  // Buy flow state
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyStep, setBuyStep] = useState<BuyStep>('method');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank_transfer'>('cod');
  const [notes, setNotes] = useState('');
  const [buyLoading, setBuyLoading] = useState(false);
  const [transaction, setTransaction] = useState<any>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [buyError, setBuyError] = useState('');

  // Report modal
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState({ reason: '', description: '' });
  const [reportLoading, setReportLoading] = useState(false);

  // Offer modal
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerError, setOfferError] = useState('');

  const { data: offersData } = useSWR(user ? 'buyer-offers' : null, () => offerApi.getBuyerOffers());
  const acceptedOffer = offersData?.data?.find((o: any) => o.product_id === Number(id) && o.status === 'accepted');

  const calculateDistance = () => {
    if (!product?.latitude || !product?.longitude) {
      alert('Penjual belum menyisipkan lokasi untuk barang ini.');
      return;
    }
    setCalculating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const startLng = pos.coords.longitude;
          const startLat = pos.coords.latitude;
          const endLng = parseFloat(product.longitude);
          const endLat = parseFloat(product.latitude);

          setBuyerLocation({ lat: startLat, lng: startLng });

          // Call OSRM Public API (longitude,latitude format)
          const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=false`;
          const res = await fetch(osrmUrl);
          const data = await res.json();

          if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const distanceMeters = data.routes[0].distance;
            const durationSeconds = data.routes[0].duration;
            const distanceKm = (distanceMeters / 1000).toFixed(1);
            const durationMins = Math.ceil(durationSeconds / 60);

            setDistanceInfo(`Berjarak ${distanceKm} km (±${durationMins} mnt berkendara)`);
          } else {
            // Fallback to straight-line if OSRM can't find a route
            const km = calculateDistanceKM(startLat, startLng, endLat, endLng);
            setDistanceInfo(km < 1 ? `Kurang dari 1 km` : `Sekitar ${km.toFixed(1)} km (garis lurus)`);
          }
        } catch (err) {
          console.error('OSRM error:', err);
          // Fallback to straight-line if network error occurs
          const km = calculateDistanceKM(pos.coords.latitude, pos.coords.longitude, parseFloat(product.latitude), parseFloat(product.longitude));
          setDistanceInfo(km < 1 ? `Kurang dari 1 km` : `Sekitar ${km.toFixed(1)} km (garis lurus)`);
        } finally {
          setCalculating(false);
        }
      },
      () => { alert('Gagal mendapat lokasi. Pastikan izin GPS aktif.'); setCalculating(false); }
    );
  };

  const isSeller = user && (user.id === product?.user_id || user.id === product?.user?.id);
  const isAdmin = user?.role === 'super_admin';

  // Step 1 — place order (POST /transactions)
  const handlePlaceOrder = async () => {
    if (!user) { router.push('/auth/login'); return; }
    setBuyLoading(true);
    setBuyError('');
    try {
      const res = await fetchApi('/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          payment_method: paymentMethod,
          agreed_price: acceptedOffer ? acceptedOffer.offered_price : product.harga,
          notes,
        }),
      });
      setTransaction(res.data);
      setBuyStep(paymentMethod === 'cod' ? 'done' : 'upload');
    } catch (err: any) {
      setBuyError(err.message || 'Gagal membuat pesanan.');
    } finally {
      setBuyLoading(false);
    }
  };

  // Step 2 — upload payment proof (PATCH /transactions/:id/payment)
  const handleUploadProof = async () => {
    if (!proofFile || !transaction) return;
    setUploadLoading(true);
    setBuyError('');
    try {
      const form = new FormData();
      form.append('payment_proof', proofFile);
      await fetchApi(`/transactions/${transaction.id}/payment`, { method: 'PATCH', body: form });
      setBuyStep('done');
    } catch (err: any) {
      setBuyError(err.message || 'Gagal mengunggah bukti bayar.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/auth/login'); return; }
    setReportLoading(true);
    try {
      await fetchApi('/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: id, ...reportData }) });
      alert('Laporan berhasil dikirim. Terima kasih!');
      setShowReport(false);
    } catch { alert('Gagal mengirim laporan.'); }
    finally { setReportLoading(false); }
  };

  const handleOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/auth/login'); return; }
    if (!offerPrice || Number(offerPrice) <= 0) {
      setOfferError('Masukkan nominal penawaran yang valid.');
      return;
    }
    setOfferLoading(true);
    setOfferError('');
    try {
      await offerApi.create(product.id, { offered_price: Number(offerPrice) });
      alert('Penawaran berhasil dikirim! Silakan tunggu respon penjual.');
      setShowOfferModal(false);
      setOfferPrice('');
    } catch (err: any) {
      setOfferError(err.response?.data?.message || err.message || 'Gagal mengirim penawaran.');
    } finally {
      setOfferLoading(false);
    }
  };

  const resetBuy = () => { setShowBuyModal(false); setBuyStep('method'); setPaymentMethod('cod'); setNotes(''); setTransaction(null); setProofFile(null); setBuyError(''); };

  if (!product) return (
    <div style={{ textAlign: 'center', padding: '80px 0', opacity: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <Icons.Loader size={32} color="#16a34a" />
      Memuat produk...
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem', maxWidth: '1100px' }}>
      <div className="md-grid-1" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1fr)', gap: '2.5rem', alignItems: 'flex-start' }}>

        {/* ── Left: Image & Map ────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ width: '100%', aspectRatio: '4/3', maxHeight: '400px', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', background: '#fff', position: 'relative' }}>
            {product.foto
              ? <img src={getStorageUrl(product.foto) || ''} alt={product.nama_barang} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Package size={64} color="#d1d5db" /></div>}
            {product.is_promoted && (
              <span style={{ position: 'absolute', top: '12px', left: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'linear-gradient(135deg,#f59e0b,#ef4444)', color: 'white', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 800 }}>
                <Icons.Zap size={11} color="white" /> PROMO
              </span>
            )}
          </div>

          {/* Location Map */}
          {product.latitude && product.longitude && (
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <iframe width="100%" height="220" frameBorder="0" title="Peta Penjual" src={`https://maps.google.com/maps?q=${product.latitude},${product.longitude}&hl=id&z=15&output=embed`} />
              {!distanceInfo ? (
                <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
                  <button onClick={calculateDistance} disabled={calculating} className="btn btn-secondary" style={{ width: '100%', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Icons.Compass size={15} color="white" />
                    {calculating ? 'Menghitung...' : 'Hitung Jarak dari Lokasi Saya'}
                  </button>
                </div>
              ) : (
                <div style={{ padding: '1rem', background: 'var(--primary-light)', borderTop: '1px solid var(--border)' }}>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--primary)', fontSize: '0.875rem', marginBottom: buyerLocation ? '0.75rem' : 0 }}>
                    <Icons.CheckCircle size={15} color="var(--primary)" /> {distanceInfo}
                  </p>
                  {buyerLocation && (
                    <a href={`https://www.google.com/maps/dir/?api=1&origin=${buyerLocation.lat},${buyerLocation.lng}&destination=${product.latitude},${product.longitude}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
                      <Icons.MapPin size={13} color="var(--primary)" /> Buka Google Maps
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Product Info ───────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Badges */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 12px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700 }}>{product.category?.name || 'Umum'}</span>
            {product.kondisi && (
              <span style={{ padding: '4px 12px', background: product.kondisi === 'baru' ? '#D8F3DC' : '#FEF3C7', color: product.kondisi === 'baru' ? '#2D6A4F' : '#92400E', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700 }}>
                {product.kondisi === 'baru' ? 'Baru' : 'Bekas'}
              </span>
            )}
            {product.status_terjual && (
              <span style={{ padding: '4px 12px', background: '#FEE2E2', color: '#991B1B', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700 }}>TERJUAL</span>
            )}
          </div>

          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem', lineHeight: 1.2 }}>{product.nama_barang}</h1>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.5rem' }}>
            Rp {Number(product.harga).toLocaleString('id-ID')}
          </div>
          
          {acceptedOffer && (
            <div style={{ padding: '0.75rem', background: '#D8F3DC', border: '1px solid #2D6A4F', borderRadius: '8px', color: '#2D6A4F', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.CheckCircle size={18} color="#2D6A4F" />
              Penawaran kamu sebesar Rp {Number(acceptedOffer.offered_price).toLocaleString('id-ID')} telah disetujui penjual!
            </div>
          )}
          
          <hr style={{ border: 'none', borderBottom: '1px solid var(--border)', margin: '1.5rem 0' }} />

          {/* Description */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--foreground)', marginBottom: '0.75rem' }}>Deskripsi Produk</h3>
            <p style={{ lineHeight: 1.7, color: '#6b7280', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{product.deskripsi || '—'}</p>
          </div>

          {/* Seller Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', flexShrink: 0, overflow: 'hidden' }}>
              {product.user?.foto ? (
                <img src={getStorageUrl(product.user.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                product.user?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{product.user?.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{product.user?.asal_kampus || 'Mahasiswa'}</div>
            </div>
          </div>

          {/* ── Action Buttons ── */}
          {!isSeller && !isAdmin && !product.status_terjual && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => { if (!user) { router.push('/auth/login'); return; } setShowBuyModal(true); }}
                  className="btn btn-primary"
                  style={{ flex: 1, height: '52px', fontSize: '1rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Icons.ShoppingBag size={18} color="white" />
                  Beli
                </button>
                <button
                  onClick={() => { if (!user) { router.push('/auth/login'); return; } setShowOfferModal(true); }}
                  className="btn"
                  style={{ flex: 1, height: '52px', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', borderRadius: 'var(--radius)', fontWeight: 700 }}
                >
                  <Icons.Zap size={18} color="var(--primary)" />
                  Tawar
                </button>
              </div>
              <button
                onClick={() => {
                  if (!user) { router.push('/auth/login'); return; }
                  const sellerId = product.user_id || product.user?.id;
                  if (user.id === sellerId) { alert('Tidak bisa chat dengan diri sendiri.'); return; }
                  router.push(`/chat/${product.id}/${sellerId}`);
                }}
                className="btn"
                style={{ height: '46px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '2px solid var(--primary)', background: 'white', color: 'var(--primary)', borderRadius: 'var(--radius)', fontWeight: 700 }}
              >
                <Icons.MessageCircle size={16} color="var(--primary)" />
                Tanya Penjual
              </button>
            </div>
          )}

          {product.status_terjual && (
            <div style={{ textAlign: 'center', padding: '1.5rem', background: '#FEE2E2', borderRadius: '12px', color: '#991B1B', fontWeight: 700 }}>
              Produk ini sudah terjual
            </div>
          )}

          {isSeller && (
            <button onClick={() => router.push(`/seller/products/${product.id}/edit`)} className="btn btn-secondary" style={{ width: '100%', height: '46px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Icons.Edit size={16} color="white" />
              Edit Produk
            </button>
          )}

          {/* Report */}
          {!isSeller && (
            <button onClick={() => user ? setShowReport(true) : router.push('/auth/login')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: '#6b7280', marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Icons.Flag size={13} color="#6b7280" />
              Laporkan produk ini
            </button>
          )}
          {isAdmin && (
            <button onClick={async () => { if (!confirm('Hapus produk ini?')) return; await fetchApi(`/products/${id}`, { method: 'DELETE' }); router.push('/products'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: '#ef4444', marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Icons.Trash2 size={13} color="#ef4444" />
              Hapus Produk (Admin)
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          BUY MODAL
      ═══════════════════════════════════════════════ */}
      {showBuyModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative', borderRadius: '16px' }}>
            <button onClick={resetBuy} style={{ position: 'absolute', top: '16px', right: '20px', background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#6b7280' }}>✕</button>

            {/* STEP: method */}
            {buyStep === 'method' && (
              <>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>Konfirmasi Pembelian</h2>
                <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '1.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.nama_barang}</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--card)', borderRadius: '12px', marginBottom: '1.5rem' }}>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total Pembayaran {acceptedOffer && '(Sesuai Penawaran)'}</span>
                  <span style={{ fontWeight: 800, color: 'var(--primary)' }}>Rp {Number(acceptedOffer ? acceptedOffer.offered_price : product.harga).toLocaleString('id-ID')}</span>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem' }}>Metode Pembayaran</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { value: 'cod', Icon: Icons.Handshake, title: 'COD (Bayar di Tempat)', desc: 'Bertemu langsung, bayar tunai' },
                      { value: 'bank_transfer', Icon: Icons.CreditCard, title: 'Transfer Bank', desc: 'Upload bukti transfer setelah dikonfirmasi' },
                    ].map(m => (
                      <button key={m.value} onClick={() => setPaymentMethod(m.value as any)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem',
                          border: `2px solid ${paymentMethod === m.value ? 'var(--primary)' : 'var(--border)'}`,
                          borderRadius: '12px', background: paymentMethod === m.value ? 'var(--primary-light)' : 'white',
                          cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%'
                        }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: paymentMethod === m.value ? 'rgba(22,163,74,0.15)' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <m.Icon size={18} color={paymentMethod === m.value ? 'var(--primary)' : '#6b7280'} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: paymentMethod === m.value ? 'var(--primary)' : 'var(--foreground)' }}>{m.title}</div>
                        </div>
                        {paymentMethod === m.value ? <Icons.CheckCircle size={20} color="var(--primary)" /> : <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--border)' }} />}
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod === 'bank_transfer' && (
                  <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '0.75rem' }}>Daftar Rekening Penjual:</h3>
                    {product.user?.bank_accounts && product.user.bank_accounts.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {product.user.bank_accounts.map((acc: any) => (
                          <div key={acc.id} style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{acc.bank_name}</div>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700 }}>{acc.account_number}</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>a.n. {acc.account_name}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                        Penjual belum menambahkan rekening. Hubungi penjual melalui chat untuk meminta nomor rekening tujuan.
                      </div>
                    )}
                  </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Catatan untuk Penjual (opsional)</label>
                  <textarea className="input" rows={2} style={{ height: 'auto', padding: '12px', resize: 'none', fontSize: '0.875rem', borderRadius: '12px' }} placeholder="Kapan bisa COD?" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>

                {buyError && <div style={{ padding: '0.75rem', background: '#FEF2F2', color: '#ef4444', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>{buyError}</div>}

                {paymentMethod === 'bank_transfer' ? (
                  <button 
                    onClick={() => {
                      const sellerId = product.user_id || product.user?.id;
                      router.push(`/chat/${product.id}/${sellerId}?template=transfer_check`);
                    }} 
                    className="btn btn-primary" 
                    style={{ width: '100%', height: '48px', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Icons.MessageCircle size={16} color="white" /> Tanya Stok (Transfer)
                  </button>
                ) : (
                  <button onClick={handlePlaceOrder} disabled={buyLoading} className="btn btn-primary" style={{ width: '100%', height: '48px', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {buyLoading ? <><Icons.Loader size={16} color="white" /> Memproses...</> : <>Kirim Pesanan <Icons.ArrowRight size={16} color="white" /></>}
                  </button>
                )}
              </>
            )}

            {/* STEP: upload proof */}
            {buyStep === 'upload' && (
              <>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{ width: '56px', height: '56px', background: '#DBEAFE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <Icons.CreditCard size={26} color="#1D4ED8" />
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '8px' }}>Pesanan Dibuat!</h2>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Pesanan sedang menunggu konfirmasi penjual. Setelah dikonfirmasi, unggah bukti transfer di halaman <strong>Pesanan Saya</strong>.</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button onClick={() => router.push('/orders')} className="btn btn-primary" style={{ width: '100%', height: '48px' }}>Lihat Pesanan Saya</button>
                  <button onClick={resetBuy} className="btn btn-secondary" style={{ width: '100%', height: '44px' }}>Tutup</button>
                </div>
              </>
            )}

            {/* STEP: done (COD) */}
            {buyStep === 'done' && (
              <>
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <div style={{ width: '64px', height: '64px', background: '#D8F3DC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <Icons.CheckCircle size={30} color="#2D6A4F" />
                  </div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.75rem' }}>Pesanan Dikirim!</h2>
                  <p style={{ color: '#6b7280', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                    Pesanan COD kamu sudah masuk. Penjual akan segera mengkonfirmasi dan menghubungimu untuk mengatur waktu & tempat pertemuan.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button onClick={() => router.push('/orders')} className="btn btn-primary" style={{ width: '100%', height: '48px' }}>Lihat Status Pesanan</button>
                    <button onClick={resetBuy} className="btn btn-secondary" style={{ width: '100%', height: '44px' }}>Tutup</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          REPORT MODAL
      ═══════════════════════════════════════════════ */}
      {showReport && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
            <h2 style={{ fontWeight: 900, fontSize: '1.25rem', marginBottom: '0.5rem' }}>Laporkan Produk</h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '2rem' }}>Bantu kami menjaga keamanan komunitas.</p>
            <form onSubmit={handleReport} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="label">Alasan</label>
                <select className="input" required value={reportData.reason} onChange={e => setReportData({ ...reportData, reason: e.target.value })}>
                  <option value="">Pilih alasan...</option>
                  <option value="Spam">Spam / Iklan tidak relevan</option>
                  <option value="Penipuan">Indikasi Penipuan</option>
                  <option value="Konten Tidak Layak">Konten tidak pantas</option>
                  <option value="Salah Kategori">Salah Kategori</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="label">Keterangan Tambahan</label>
                <textarea className="input" rows={3} style={{ height: 'auto', padding: '12px', resize: 'none' }} placeholder="Jelaskan singkat alasan pelaporan..." value={reportData.description} onChange={e => setReportData({ ...reportData, description: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowReport(false)} className="btn btn-secondary" style={{ flex: 1, height: '44px' }}>Batal</button>
                <button type="submit" disabled={reportLoading} className="btn btn-primary" style={{ flex: 1, height: '44px', background: '#ef4444' }}>
                  {reportLoading ? 'Mengirim...' : 'Kirim Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ═══════════════════════════════════════════════
          OFFER MODAL
      ═══════════════════════════════════════════════ */}
      {showOfferModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', borderRadius: '16px', position: 'relative' }}>
            <button onClick={() => setShowOfferModal(false)} style={{ position: 'absolute', top: '16px', right: '20px', background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#6b7280' }}>✕</button>
            <h2 style={{ fontWeight: 900, fontSize: '1.25rem', marginBottom: '0.5rem' }}>Tawar Harga</h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Berikan penawaran harga terbaikmu untuk <strong>{product.nama_barang}</strong> (Harga asli: Rp {Number(product.harga).toLocaleString('id-ID')}).</p>
            
            <form onSubmit={handleOffer} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="label">Nominal Penawaran (Rp)</label>
                <input 
                  type="number" 
                  className="input" 
                  required 
                  min="1"
                  placeholder="Contoh: 50000" 
                  value={offerPrice} 
                  onChange={e => setOfferPrice(e.target.value)} 
                />
              </div>
              
              {offerError && <div style={{ padding: '0.75rem', background: '#FEF2F2', color: '#ef4444', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>{offerError}</div>}
              
              <button type="submit" disabled={offerLoading} className="btn btn-primary" style={{ width: '100%', height: '48px' }}>
                {offerLoading ? 'Mengirim...' : 'Kirim Penawaran'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
