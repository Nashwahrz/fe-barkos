'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { fetchApi, getStorageUrl, swrFetcher } from '@/lib/api';
import { offerApi } from '@/services/api/offer.api';
import { useAuth } from '@/components/AuthProvider';
import { Icons } from '@/components/Icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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
  const searchParams = useSearchParams();
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

  useEffect(() => {
    if (searchParams.get('checkout') === 'true') {
      setShowBuyModal(true);
      const payment = searchParams.get('payment');
      if (payment === 'transfer') {
        setPaymentMethod('bank_transfer');
      }
    }
  }, [searchParams]);

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
    <div style={{ textAlign: 'center', padding: '80px 0', opacity: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--foreground)' }}>
      <Icons.Loader size={32} />
      Memuat produk...
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem', maxWidth: '1100px' }}>
      <div className="product-detail-layout" style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start' }}>

        {/* ── Left: Image & Map ────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ width: '100%', aspectRatio: '4/3', maxHeight: '400px', borderRadius: '24px', border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--card)', position: 'relative' }}>
            {product.foto
              ? <img src={getStorageUrl(product.foto) || ''} alt={product.nama_barang} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Package size={64} color="var(--border)" /></div>}
            {product.is_promoted && (
              <span style={{ position: 'absolute', top: '16px', left: '16px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--foreground)', color: 'var(--background)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600 }}>
                <Icons.Zap size={14} color="var(--background)" /> Rekomendasi
              </span>
            )}
          </div>

          {/* Location Map */}
          {product.latitude && product.longitude && (
            <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <iframe width="100%" height="220" frameBorder="0" title="Peta Penjual" src={`https://maps.google.com/maps?q=${product.latitude},${product.longitude}&hl=id&z=15&output=embed`} />
              {!distanceInfo ? (
                <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border)', background: 'var(--card)' }}>
                  <Button onClick={calculateDistance} disabled={calculating} variant="secondary" size="md" fullWidth>
                    <Icons.Compass size={16} />
                    {calculating ? 'Menghitung...' : 'Hitung Jarak dari Lokasi Saya'}
                  </Button>
                </div>
              ) : (
                <div style={{ padding: '1.25rem', background: 'var(--primary-light)', borderTop: '1px solid var(--border)' }}>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--primary)', fontSize: '0.9rem', marginBottom: buyerLocation ? '0.75rem' : 0 }}>
                    <Icons.CheckCircle size={16} /> {distanceInfo}
                  </p>
                  {buyerLocation && (
                    <a href={`https://www.google.com/maps/dir/?api=1&origin=${buyerLocation.lat},${buyerLocation.lng}&destination=${product.latitude},${product.longitude}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', opacity: 0.9 }}>
                      <Icons.MapPin size={14} /> Buka Google Maps
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Product Info ───────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          {/* Badges */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span style={{ padding: '6px 12px', border: '1px solid var(--border)', color: 'var(--foreground)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, opacity: 0.8 }}>{product.category?.name || 'Umum'}</span>
            {product.kondisi && (
              <span style={{ padding: '6px 12px', background: product.kondisi === 'baru' ? 'var(--primary-light)' : 'rgba(245, 158, 11, 0.1)', color: product.kondisi === 'baru' ? 'var(--primary)' : 'var(--warning)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600 }}>
                {product.kondisi === 'baru' ? 'Baru' : 'Bekas'}
              </span>
            )}
            {product.durasi_pemakaian && (
              <span style={{ padding: '6px 12px', background: 'var(--input)', color: 'var(--foreground)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, opacity: 0.8 }}>
                Lama pakai: {product.durasi_pemakaian}
              </span>
            )}
            {product.status_terjual && (
              <span style={{ padding: '6px 12px', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>TERJUAL</span>
            )}
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.75rem', lineHeight: 1.2, color: 'var(--foreground)' }}>{product.nama_barang}</h1>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
            Rp {Number(product.harga).toLocaleString('id-ID')}
          </div>
          
          {acceptedOffer && (
            <div style={{ padding: '1rem', background: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: '12px', color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Icons.CheckCircle size={20} />
              Penawaran kamu sebesar Rp {Number(acceptedOffer.offered_price).toLocaleString('id-ID')} telah disetujui!
            </div>
          )}
          
          <hr style={{ border: 'none', borderBottom: '1px solid var(--border)', margin: '1.5rem 0', opacity: 0.5 }} />

          {/* Description */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--foreground)', marginBottom: '1rem' }}>Deskripsi Produk</h3>
            <p style={{ lineHeight: 1.8, color: 'var(--foreground)', opacity: 0.7, fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{product.deskripsi || '—'}</p>
          </div>

          {/* Seller Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--input)', color: 'var(--foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '1.2rem', flexShrink: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
              {product.user?.foto ? (
                <img src={getStorageUrl(product.user.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                product.user?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--foreground)' }}>{product.user?.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--foreground)', opacity: 0.6 }}>{product.user?.asal_kampus || 'Mahasiswa'}</div>
            </div>
          </div>

          {/* ── Action Buttons ── */}
          {!isSeller && !isAdmin && !product.status_terjual && (
            <div className="fixed-bottom-action" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button
                  onClick={() => { if (!user) { router.push('/auth/login'); return; } setShowBuyModal(true); }}
                  variant="primary"
                  size="lg"
                  style={{ flex: 1 }}
                >
                  <Icons.ShoppingBag size={18} />
                  Beli
                </Button>
                <Button
                  onClick={() => { if (!user) { router.push('/auth/login'); return; } setShowOfferModal(true); }}
                  variant="secondary"
                  size="lg"
                  style={{ flex: 1 }}
                >
                  <Icons.Zap size={18} />
                  Tawar
                </Button>
              </div>
              <Button
                onClick={() => {
                  if (!user) { router.push('/auth/login'); return; }
                  const sellerId = product.user_id || product.user?.id;
                  if (user.id === sellerId) { alert('Tidak bisa chat dengan diri sendiri.'); return; }
                  router.push(`/chat/${product.id}/${sellerId}`);
                }}
                variant="ghost"
                size="md"
                style={{ border: '1px solid var(--border)' }}
              >
                <Icons.MessageCircle size={16} />
                Tanya Penjual
              </Button>
            </div>
          )}

          {product.status_terjual && (
            <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)', borderRadius: '12px', color: 'var(--danger)', fontWeight: 600 }}>
              Produk ini sudah terjual
            </div>
          )}

          {isSeller && (
            <Button onClick={() => router.push(`/seller/products/${product.id}/edit`)} variant="secondary" size="lg" fullWidth>
              <Icons.Edit size={16} />
              Edit Produk
            </Button>
          )}

          {/* Report */}
          {!isSeller && (
            <button onClick={() => user ? setShowReport(true) : router.push('/auth/login')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--foreground)', opacity: 0.5, marginTop: '2rem', display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
              <Icons.Flag size={14} />
              Laporkan produk ini
            </button>
          )}
          {isAdmin && (
            <button onClick={async () => { if (!confirm('Hapus produk ini?')) return; await fetchApi(`/products/${id}`, { method: 'DELETE' }); router.push('/products'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--danger)', marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
              <Icons.Trash2 size={14} />
              Hapus Produk (Admin)
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          BUY MODAL
      ═══════════════════════════════════════════════ */}
      {showBuyModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', position: 'relative', borderRadius: '20px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', maxHeight: 'calc(100vh - 3rem)', overflowY: 'auto' }}>
            <button onClick={resetBuy} style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--input)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--foreground)' }}>
              <Icons.X size={16} />
            </button>

            {/* STEP: method */}
            {buyStep === 'method' && (
              <>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: 'var(--foreground)' }}>Konfirmasi Pembelian</h2>
                <p style={{ color: 'var(--foreground)', opacity: 0.6, fontSize: '0.9rem', marginBottom: '1.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.nama_barang}</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '1.5rem' }}>
                  <span style={{ color: 'var(--foreground)', opacity: 0.8, fontSize: '0.9rem' }}>Total Bayar {acceptedOffer && '(Disetujui)'}</span>
                  <span style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: '1.1rem' }}>Rp {Number(acceptedOffer ? acceptedOffer.offered_price : product.harga).toLocaleString('id-ID')}</span>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--foreground)' }}>Metode Pembayaran</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { value: 'cod', Icon: Icons.Handshake, title: 'COD (Bayar di Tempat)' },
                      { value: 'bank_transfer', Icon: Icons.CreditCard, title: 'Transfer Bank' },
                    ].map(m => (
                      <button key={m.value} onClick={() => setPaymentMethod(m.value as any)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem',
                          border: `1px solid ${paymentMethod === m.value ? 'var(--primary)' : 'var(--border)'}`,
                          borderRadius: '12px', background: paymentMethod === m.value ? 'var(--primary-light)' : 'transparent',
                          cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', width: '100%'
                        }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: paymentMethod === m.value ? 'rgba(22,163,74,0.1)' : 'var(--input)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <m.Icon size={18} color={paymentMethod === m.value ? 'var(--primary)' : 'var(--foreground)'} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: paymentMethod === m.value ? 'var(--primary)' : 'var(--foreground)' }}>{m.title}</div>
                        </div>
                        {paymentMethod === m.value ? <Icons.CheckCircle size={20} color="var(--primary)" /> : <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1px solid var(--border)' }} />}
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod === 'bank_transfer' && (
                  <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--input)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '0.75rem' }}>Daftar Rekening Penjual:</h3>
                    {product.user?.bank_accounts && product.user.bank_accounts.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {product.user.bank_accounts.map((acc: any) => (
                          <div key={acc.id} style={{ background: 'var(--card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--foreground)' }}>{acc.bank_name}</div>
                            <div style={{ fontFamily: 'monospace', fontSize: '1rem', color: 'var(--foreground)', fontWeight: 700, margin: '4px 0' }}>{acc.account_number}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--foreground)', opacity: 0.6 }}>a.n. {acc.account_name}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: 'var(--foreground)', opacity: 0.6, lineHeight: 1.5 }}>
                        Penjual belum menambahkan rekening. Hubungi penjual melalui chat untuk meminta nomor rekening tujuan.
                      </div>
                    )}
                  </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Catatan untuk Penjual (opsional)</label>
                  <textarea className="input-field" rows={2} style={{ height: 'auto', padding: '12px', resize: 'none', borderRadius: '12px' }} placeholder="Kapan bisa COD?" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>

                {buyError && <div style={{ padding: '0.75rem', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 500, border: '1px solid rgba(220, 38, 38, 0.2)' }}>{buyError}</div>}

                {paymentMethod === 'bank_transfer' ? (
                  <Button 
                    onClick={() => {
                      const sellerId = product.user_id || product.user?.id;
                      router.push(`/chat/${product.id}/${sellerId}?template=transfer_check`);
                    }} 
                    variant="primary"
                    size="lg"
                    fullWidth
                  >
                    <Icons.MessageCircle size={16} /> Tanya Stok (Transfer)
                  </Button>
                ) : (
                  <Button onClick={handlePlaceOrder} disabled={buyLoading} variant="primary" size="lg" fullWidth>
                    {buyLoading ? 'Memproses...' : 'Kirim Pesanan'}
                  </Button>
                )}
              </>
            )}

            {/* STEP: upload proof */}
            {buyStep === 'upload' && (
              <>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{ width: '64px', height: '64px', background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <Icons.CreditCard size={32} color="var(--primary)" />
                  </div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px', color: 'var(--foreground)' }}>Pesanan Dibuat!</h2>
                  <p style={{ color: 'var(--foreground)', opacity: 0.7, fontSize: '0.95rem', lineHeight: 1.6 }}>Pesanan sedang menunggu konfirmasi penjual. Setelah dikonfirmasi, unggah bukti transfer di halaman <strong>Pesanan Saya</strong>.</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Button onClick={() => router.push('/orders')} variant="primary" size="lg" fullWidth>Lihat Pesanan Saya</Button>
                  <Button onClick={resetBuy} variant="secondary" size="lg" fullWidth>Tutup</Button>
                </div>
              </>
            )}

            {/* STEP: done (COD) */}
            {buyStep === 'done' && (
              <>
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ width: '64px', height: '64px', background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <Icons.CheckCircle size={32} color="var(--primary)" />
                  </div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px', color: 'var(--foreground)' }}>Pesanan Dikirim!</h2>
                  <p style={{ color: 'var(--foreground)', opacity: 0.7, lineHeight: 1.6, marginBottom: '2rem', fontSize: '0.95rem' }}>
                    Pesanan COD kamu sudah masuk. Penjual akan segera mengkonfirmasi dan menghubungimu.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Button onClick={() => router.push('/orders')} variant="primary" size="lg" fullWidth>Lihat Status Pesanan</Button>
                    <Button onClick={resetBuy} variant="secondary" size="lg" fullWidth>Tutup</Button>
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', borderRadius: '20px', boxShadow: 'var(--shadow-lg)', maxHeight: 'calc(100vh - 3rem)', overflowY: 'auto' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--foreground)' }}>Laporkan Produk</h2>
            <p style={{ color: 'var(--foreground)', opacity: 0.6, fontSize: '0.9rem', marginBottom: '2rem' }}>Bantu kami menjaga keamanan komunitas.</p>
            <form onSubmit={handleReport} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Alasan</label>
                <select className="input-field" required value={reportData.reason} onChange={e => setReportData({ ...reportData, reason: e.target.value })} style={{ width: '100%' }}>
                  <option value="">Pilih alasan...</option>
                  <option value="Spam">Spam / Iklan tidak relevan</option>
                  <option value="Penipuan">Indikasi Penipuan</option>
                  <option value="Konten Tidak Layak">Konten tidak pantas</option>
                  <option value="Salah Kategori">Salah Kategori</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Keterangan Tambahan</label>
                <textarea className="input-field" rows={3} style={{ height: 'auto', padding: '12px', resize: 'none', borderRadius: '12px', width: '100%' }} placeholder="Jelaskan singkat alasan pelaporan..." value={reportData.description} onChange={e => setReportData({ ...reportData, description: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button type="button" onClick={() => setShowReport(false)} variant="secondary" size="lg" style={{ flex: 1 }}>Batal</Button>
                <Button type="submit" disabled={reportLoading} variant="danger" size="lg" style={{ flex: 1 }}>
                  {reportLoading ? 'Mengirim...' : 'Kirim Laporan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          OFFER MODAL
      ═══════════════════════════════════════════════ */}
      {showOfferModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', borderRadius: '20px', position: 'relative', boxShadow: 'var(--shadow-lg)', maxHeight: 'calc(100vh - 3rem)', overflowY: 'auto' }}>
            <button onClick={() => setShowOfferModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--input)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--foreground)' }}>
              <Icons.X size={16} />
            </button>
            <h2 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--foreground)' }}>Tawar Harga</h2>
            <p style={{ color: 'var(--foreground)', opacity: 0.7, fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>Berikan penawaran harga terbaikmu untuk <strong>{product.nama_barang}</strong> (Harga asli: Rp {Number(product.harga).toLocaleString('id-ID')}).</p>
            
            <form onSubmit={handleOffer} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Input 
                type="number" 
                label="Nominal Penawaran (Rp)"
                required 
                placeholder="Contoh: 50000" 
                value={offerPrice} 
                onChange={e => setOfferPrice(e.target.value)} 
              />
              
              {offerError && <div style={{ padding: '0.75rem', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 500, border: '1px solid rgba(220, 38, 38, 0.2)' }}>{offerError}</div>}
              
              <Button type="submit" disabled={offerLoading} variant="primary" size="lg" fullWidth>
                {offerLoading ? 'Mengirim...' : 'Kirim Penawaran'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
