'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';
import { Icons } from '@/components/Icons';
import Script from 'next/script';
import { paymentSettingsApi } from '@/services/api/paymentSettings.api';
import { PaymentSettings } from '@/types/paymentSettings';

declare global {
  interface Window {
    snap: any;
  }
}

export default function SellerPromotions() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [packages, setPackages] = useState<any[]>([]);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [myPromotions, setMyPromotions] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');

  // Payment method
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'midtrans' | 'manual_transfer'>('midtrans');

  // Manual transfer proof upload (per pending promotion)
  const proofInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [proofFiles, setProofFiles] = useState<Record<number, File | null>>({});
  const [uploadingProofId, setUploadingProofId] = useState<number | null>(null);

  // Iklan fields
  const [adType, setAdType] = useState<'none' | 'image' | 'video'>('none');
  const [adMediaUrl, setAdMediaUrl] = useState('');
  const [adTitle, setAdTitle] = useState('');
  const [previewError, setPreviewError] = useState(false);

  // File Upload states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaSource, setMediaSource] = useState<'file' | 'url'>('file');
  const [adMediaFile, setAdMediaFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Uploaded as-is, no forced crop/aspect ratio — the ad shows at its natural size.
    setAdMediaFile(file);
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    const url = URL.createObjectURL(file);
    setFilePreviewUrl(url);
    setPreviewError(false);
    // Allow re-selecting the same file later
    e.target.value = '';
  };

  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

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
      const [packagesRes, productsRes, promosRes, settingsRes] = await Promise.all([
        fetchApi('/promotions/packages'),
        fetchApi('/my-products'),
        fetchApi('/promotions/my'),
        paymentSettingsApi.get(),
      ]);
      setPackages(packagesRes.data || packagesRes);
      const activeProducts = (productsRes.data || productsRes).filter((p: any) => !p.status_terjual);
      setMyProducts(activeProducts);
      setMyPromotions(promosRes.data || promosRes);
      setPaymentSettings(settingsRes.data);
      if (!settingsRes.data.midtrans_enabled && settingsRes.data.manual_transfer_enabled) {
        setPaymentMethod('manual_transfer');
      } else {
        setPaymentMethod('midtrans');
      }
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
    if (adType !== 'none') {
      if (mediaSource === 'file' && !adMediaFile) return showMessage('Pilih file media iklan terlebih dahulu', 'error');
      if (mediaSource === 'url' && !adMediaUrl.trim()) return showMessage('Masukkan URL media iklan', 'error');
    }

    // if (!confirm('Simulasi Pembayaran: Apakah Anda yakin ingin mengaktifkan paket promosi ini? (Anggap pembayaran berhasil)')) return;

    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('product_id', selectedProduct);
      formData.append('package_id', selectedPackage);
      formData.append('payment_method', paymentMethod);
      formData.append('ad_type', adType);
      if (adTitle.trim()) {
        formData.append('ad_title', adTitle.trim());
      }
      
      if (adType !== 'none') {
        if (mediaSource === 'file' && adMediaFile) {
          formData.append('ad_media_file', adMediaFile);
        } else if (mediaSource === 'url' && adMediaUrl.trim()) {
          formData.append('ad_media_url', adMediaUrl.trim());
        }
      }

      const res = await fetchApi('/promotions', {
        method: 'POST',
        body: formData
      });

      if (paymentMethod === 'manual_transfer') {
        showMessage('Promosi dibuat. Silakan upload bukti transfer di daftar Riwayat Boost.', 'success');
        resetForm();
        await loadData();
        setActionLoading(false);
        return;
      }

      const snapToken = res.data?.snap_token;
      const orderId = res.data?.order_id;

      if (snapToken && window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: async function (result: any) {
            try {
              await fetchApi('/promotions/force-paid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: orderId })
              });
            } catch(e) { console.error('Force paid failed', e); }

            showMessage('Pembayaran berhasil! Promosi akan segera aktif.', 'success');
            resetForm();
            await loadData();
            setActionLoading(false);
          },
          onPending: async function (result: any) {
            showMessage('Menunggu pembayaran diselesaikan.', 'success');
            resetForm();
            await loadData();
            setActionLoading(false);
          },
          onError: function (result: any) {
            showMessage('Pembayaran gagal atau dibatalkan.', 'error');
            setActionLoading(false);
          },
          onClose: function () {
            showMessage('Anda menutup popup tanpa menyelesaikan pembayaran.', 'error');
            setActionLoading(false);
          }
        });
      } else {
        showMessage('Gagal memuat sistem pembayaran.', 'error');
        setActionLoading(false);
      }
      
      function resetForm() {
        setSelectedProduct('');
        setSelectedPackage('');
        setAdType('none');
        setAdMediaUrl('');
        setAdMediaFile(null);
        setFilePreviewUrl('');
        setAdTitle('');
        setPreviewError(false);
      }
    } catch (err: any) {
      showMessage(err.message || 'Gagal mengaktifkan promosi', 'error');
      setActionLoading(false);
    }
  };

  if (loading || authLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 70px)', gap: '12px', color: 'var(--foreground)', opacity: 0.5 }}>
      <Icons.Loader size={32} />
      <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Memuat data promosi...</div>
    </div>
  );

  const adTypeOptions: { value: 'none' | 'image' | 'video'; label: string; icon: string; desc: string }[] = [
    { value: 'none',  label: 'Tanpa Iklan',  icon: '🚫', desc: 'Hanya boost posisi produk tanpa banner iklan.' },
    { value: 'image', label: 'Iklan Gambar', icon: '🖼️', desc: 'Tampilkan banner gambar di halaman utama.' },
    { value: 'video', label: 'Iklan Video',  icon: '🎬', desc: 'Tampilkan video promosi di halaman utama.' },
  ];

  return (
    <>
      <Script 
        src="https://app.sandbox.midtrans.com/snap/snap.js" 
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="lazyOnload"
      />
      <div className="container" style={{ padding: '60px 1rem', maxWidth: '1100px' }}>
        <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
          <Icons.Zap size={36} color="#f59e0b" /> Pusat Promosi
        </h1>
        <p style={{ opacity: 0.7, maxWidth: '650px', margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Tingkatkan visibilitas produk Anda agar selalu tampil di urutan teratas. <br/>Dapatkan lebih banyak calon pembeli dengan fitur <strong>Boost</strong> + pasang <strong>Iklan</strong> berupa gambar atau video.
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

        {/* ── Form Beli Promosi ── */}
        <div className="card" style={{ padding: '2.5rem', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground)' }}>
            <Icons.ShoppingBag size={24} color="var(--foreground)" /> Beli Paket Promosi
          </h2>

          <form onSubmit={handlePurchase} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

            {/* Step 1: Produk */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.6rem', fontWeight: 700, color: 'var(--foreground)' }}>1. Pilih Produk</label>
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

            {/* Step 2: Paket */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.6rem', fontWeight: 700, color: 'var(--foreground)' }}>2. Pilih Paket Durasi</label>
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
                      <div style={{ fontSize: '0.85rem', opacity: 0.7, fontWeight: 500 }}>
                        Durasi Aktif: {pkg.duration_days} Hari
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icons.Users size={12} /> Estimasi Jangkauan: {(pkg.duration_days * 500).toLocaleString('id-ID')} - {(pkg.duration_days * 1500).toLocaleString('id-ID')} User
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Pasang Iklan (opsional) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.6rem', fontWeight: 700, color: 'var(--foreground)' }}>
                3. Pasang Iklan <span style={{ fontWeight: 500, color: 'var(--foreground)', opacity: 0.5 }}>(opsional)</span>
              </label>

              {/* Ad type picker */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                {adTypeOptions.map(opt => {
                  const sel = adType === opt.value;
                  return (
                    <button type="button" key={opt.value} onClick={() => { setAdType(opt.value); setPreviewError(false); }}
                      style={{
                        padding: '0.9rem 0.5rem', borderRadius: '10px', border: '2px solid',
                        borderColor: sel ? 'var(--primary)' : 'var(--border)',
                        background: sel ? 'var(--primary-light)' : 'white',
                        cursor: 'pointer', textAlign: 'center',
                        transition: 'all 0.18s', fontWeight: sel ? 800 : 600,
                        color: sel ? 'var(--primary)' : '#374151',
                        transform: sel ? 'scale(1.04)' : 'scale(1)',
                      }}>
                      <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>{opt.icon}</div>
                      <div style={{ fontSize: '0.75rem' }}>{opt.label}</div>
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--foreground)', opacity: 0.6, marginBottom: '1rem', fontStyle: 'italic' }}>
                {adTypeOptions.find(o => o.value === adType)?.desc}
              </p>
              {/* URL or File upload choice & preview — only shown if image or video */}
              {adType !== 'none' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  
                  {/* Media Source Tab Selection */}
                  <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => { setMediaSource('file'); setPreviewError(false); }}
                      style={{
                        padding: '6px 12px', fontSize: '0.85rem', fontWeight: 700, borderRadius: '6px',
                        background: mediaSource === 'file' ? 'var(--primary-light)' : 'transparent',
                        color: mediaSource === 'file' ? 'var(--primary)' : 'var(--foreground)',
                      }}
                    >
                      📁 Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMediaSource('url'); setPreviewError(false); }}
                      style={{
                        padding: '6px 12px', fontSize: '0.85rem', fontWeight: 700, borderRadius: '6px',
                        background: mediaSource === 'url' ? 'var(--primary-light)' : 'transparent',
                        color: mediaSource === 'url' ? 'var(--primary)' : 'var(--foreground)',
                      }}
                    >
                      🔗 URL Publik
                    </button>
                  </div>

                  {mediaSource === 'file' ? (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.5rem' }}>
                        Pilih {adType === 'image' ? 'Gambar' : 'Video'} dari Komputer Anda
                        <span style={{ color: '#ef4444' }}> *</span>
                      </label>
                      
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          border: '2px dashed var(--border)',
                          borderRadius: '8px',
                          padding: '2rem 1rem',
                          textAlign: 'center',
                          cursor: 'pointer',
                          background: '#f9fafb',
                          transition: 'all 0.2s',
                        }}
                        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          style={{ display: 'none' }}
                          accept={adType === 'image' ? 'image/*' : 'video/*'}
                          onChange={handleFileChange}
                        />
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                          {adType === 'image' ? '🖼️' : '🎬'}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#374151' }}>
                          {adMediaFile ? adMediaFile.name : `Klik untuk memilih ${adType === 'image' ? 'gambar' : 'video'}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                          Maksimal 2GB (PNG, JPG, MP4, MOV, dll.)
                        </div>
                      </div>

                      {adMediaFile && (
                        <button
                          type="button"
                          onClick={() => { setAdMediaFile(null); setFilePreviewUrl(''); }}
                          style={{
                            marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#ef4444',
                            display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', background: 'none', border: 'none'
                          }}
                        >
                          ❌ Hapus File Terpilih
                        </button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.4rem' }}>
                        {adType === 'image' ? 'URL Gambar Iklan' : 'URL Video Iklan'}
                        <span style={{ color: '#ef4444' }}> *</span>
                      </label>
                      <input
                        type="url"
                        className="input-field"
                        placeholder={adType === 'image' ? 'https://example.com/iklan.jpg' : 'https://example.com/iklan.mp4'}
                        value={adMediaUrl}
                        onChange={e => { setAdMediaUrl(e.target.value); setPreviewError(false); }}
                        style={{ height: '44px', borderRadius: '8px', fontSize: '0.875rem' }}
                      />
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.4rem' }}>Judul Iklan (opsional)</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Mis. Laptop bekas murah, kondisi mulus!"
                      value={adTitle}
                      onChange={e => setAdTitle(e.target.value)}
                      maxLength={200}
                      style={{ height: '44px', borderRadius: '8px', fontSize: '0.875rem' }}
                    />
                  </div>

                  {/* Media Preview */}
                  {((mediaSource === 'file' && filePreviewUrl) || (mediaSource === 'url' && adMediaUrl)) && (
                    <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)', background: '#000' }}>
                      <div style={{ padding: '8px 12px', background: '#f9fafb', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280' }}>
                        Preview Iklan
                      </div>
                      {adType === 'image' ? (
                        previewError ? (
                          <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444', fontSize: '0.85rem' }}>
                            ⚠️ Media tidak dapat dimuat.
                          </div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={mediaSource === 'file' ? filePreviewUrl : adMediaUrl}
                            alt="Preview iklan"
                            onError={() => setPreviewError(true)}
                            style={{ width: '100%', maxHeight: '260px', objectFit: 'contain', display: 'block' }}
                          />
                        )
                      ) : (
                        <video
                          ref={videoRef}
                          src={mediaSource === 'file' ? filePreviewUrl : adMediaUrl}
                          controls
                          onError={() => setPreviewError(true)}
                          style={{ width: '100%', maxHeight: '200px', display: 'block' }}
                        >
                          {previewError && <p style={{ color: '#ef4444' }}>⚠️ Media video tidak valid.</p>}
                        </video>
                      )}
                    </div>
                  )}

                  <div style={{ padding: '0.75rem 1rem', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '0.78rem', color: '#92400e' }}>
                    <strong>💡 Tips:</strong> Anda dapat mengunggah file media dari perangkat Anda atau menggunakan URL eksternal. Foto/video akan ditampilkan apa adanya tanpa dipotong, jadi tidak perlu mengatur rasio tertentu. Untuk video, format MP4 paling kompatibel. Iklan ini akan tampil di halaman utama.
                  </div>
                </div>
              )}
            </div>

            {/* Step 4: Metode Pembayaran — only shown if both methods are enabled */}
            {paymentSettings && paymentSettings.midtrans_enabled && paymentSettings.manual_transfer_enabled && (
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.6rem', fontWeight: 700, color: 'var(--foreground)' }}>4. Pilih Metode Pembayaran</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {([
                    { value: 'midtrans' as const, label: 'Midtrans', desc: 'Bayar otomatis (kartu, e-wallet, dll.)' },
                    { value: 'manual_transfer' as const, label: 'Transfer Manual', desc: 'QRIS / transfer bank, verifikasi admin' },
                  ]).map(opt => {
                    const sel = paymentMethod === opt.value;
                    return (
                      <button type="button" key={opt.value} onClick={() => setPaymentMethod(opt.value)}
                        style={{
                          padding: '0.9rem', borderRadius: '10px', border: '2px solid',
                          borderColor: sel ? 'var(--primary)' : 'var(--border)',
                          background: sel ? 'var(--primary-light)' : 'white',
                          cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s',
                        }}>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: sel ? 'var(--primary)' : '#111827' }}>{opt.label}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {paymentSettings && !paymentSettings.midtrans_enabled && !paymentSettings.manual_transfer_enabled && (
              <div style={{ padding: '0.9rem 1rem', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>
                ⚠️ Belum ada metode pembayaran yang aktif. Hubungi admin untuk mengaktifkan Midtrans atau Transfer Manual.
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '1.125rem', fontWeight: 800, fontSize: '1.05rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)', marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              disabled={actionLoading || myProducts.length === 0 || (paymentSettings ? (!paymentSettings.midtrans_enabled && !paymentSettings.manual_transfer_enabled) : false)}
            >
              {actionLoading ? <><Icons.Loader size={20} color="white" /> Memproses...</> : <><Icons.Zap size={20} color="white" /> Aktifkan Boost Sekarang</>}
            </button>
          </form>
        </div>

        {/* ── Riwayat Promosi ── */}
        <div className="card" style={{ padding: '2.5rem', background: '#ffffff', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground)' }}>
            <Icons.Clock size={24} color="var(--foreground)" /> Riwayat Boost
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
                const hasAd = promo.ad_type && promo.ad_type !== 'none' && promo.ad_media_url;
                return (
                  <div key={promo.id} style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '10px', background: isActive ? 'white' : '#f9fafb' }}>
                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                      {/* Thumbnail */}
                      <div style={{ width: '70px', height: '70px', borderRadius: '8px', background: 'var(--input)', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' }}>
                        {promo.product?.foto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={getStorageUrl(promo.product.foto) || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Package size={28} color="#d1d5db" /></div>}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, color: '#111827', marginBottom: '0.2rem', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{promo.product?.nama_barang || 'Produk dihapus'}</div>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 600, marginBottom: '0.4rem' }}>{promo.package?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 }}>
                          Sampai: {new Date(promo.end_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>

                      {/* Status badge */}
                      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        {promo.payment_method === 'manual_transfer' && promo.payment_status === 'pending' ? (
                          <>
                            {promo.manual_review_status === 'rejected' ? (
                              <span style={{ padding: '5px 12px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.05em' }}>BUKTI DITOLAK</span>
                            ) : promo.manual_review_status === 'ocr_checked' ? (
                              <span style={{ padding: '5px 12px', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.05em' }}>DITINJAU ADMIN</span>
                            ) : promo.manual_proof_path ? (
                              <span style={{ padding: '5px 12px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.05em' }}>MEMERIKSA BUKTI</span>
                            ) : (
                              <span style={{ padding: '5px 12px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.05em' }}>MENUNGGU BUKTI TRANSFER</span>
                            )}
                          </>
                        ) : promo.payment_status === 'pending' ? (
                          <>
                            <span style={{ padding: '5px 12px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.05em' }}>MENUNGGU PEMBAYARAN</span>
                            {promo.snap_token && (
                              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <button
                                  onClick={() => {
                                    if (window.snap) {
                                      window.snap.pay(promo.snap_token, {
                                        onSuccess: async function () {
                                          try {
                                            await fetchApi('/promotions/force-paid', {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ order_id: promo.order_id })
                                            });
                                          } catch(e) {}
                                          showMessage('Pembayaran berhasil!', 'success');
                                          loadData();
                                        },
                                        onPending: function () {
                                          showMessage('Menunggu pembayaran diselesaikan.', 'success');
                                        },
                                        onError: function () {
                                          showMessage('Pembayaran gagal.', 'error');
                                        },
                                        onClose: function () {
                                          showMessage('Popup pembayaran ditutup.', 'error');
                                        }
                                      });
                                    }
                                  }}
                                  style={{ fontSize: '0.7rem', background: 'var(--primary)', color: 'white', padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <Icons.CreditCard size={12} /> Lanjutkan
                                </button>

                                <button
                                  onClick={async () => {
                                    if (!confirm('Yakin ingin mengganti metode pembayaran? Ini akan membuat tagihan baru.')) return;
                                    try {
                                      const res = await fetchApi(`/promotions/${promo.id}/recreate-snap`, { method: 'PATCH' });
                                      const newSnap = res.snap_token || res.data?.snap_token;
                                      if (newSnap && window.snap) {
                                        window.snap.pay(newSnap, {
                                          onSuccess: async function () {
                                            try {
                                              await fetchApi('/promotions/force-paid', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ order_id: res.order_id || res.data?.order_id })
                                              });
                                            } catch(e) {}
                                            showMessage('Pembayaran berhasil!', 'success');
                                            loadData();
                                          },
                                          onPending: function () {
                                            showMessage('Menunggu pembayaran diselesaikan.', 'success');
                                          },
                                          onError: function () {
                                            showMessage('Pembayaran gagal.', 'error');
                                          },
                                          onClose: function () {
                                            showMessage('Popup ditutup.', 'error');
                                          }
                                        });
                                      }
                                    } catch (err: any) {
                                      showMessage(err.message || 'Gagal mengubah metode pembayaran', 'error');
                                    }
                                  }}
                                  style={{ fontSize: '0.7rem', background: '#f3f4f6', color: '#374151', padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <Icons.RefreshCw size={12} /> Ganti Metode
                                </button>
                              </div>
                            )}
                          </>
                        ) : promo.payment_status === 'failed' ? (
                          <span style={{ padding: '5px 12px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.05em' }}>GAGAL</span>
                        ) : isActive ? (
                          <span style={{ padding: '5px 12px', borderRadius: '20px', background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>AKTIF <Icons.Zap size={12} color="#16a34a" /></span>
                        ) : (
                          <span style={{ padding: '5px 12px', borderRadius: '20px', background: 'rgba(107, 114, 128, 0.08)', color: '#6b7280', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em' }}>EXPIRED</span>
                        )}
                      </div>
                    </div>

                    {/* Manual transfer panel */}
                    {promo.payment_method === 'manual_transfer' && promo.payment_status === 'pending' && (
                      <div style={{ marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px solid var(--border)' }}>
                        {paymentSettings && (paymentSettings.qris_image_url || paymentSettings.bank_accounts.length > 0) && (
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                            {paymentSettings.qris_image_url && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={getStorageUrl(paymentSettings.qris_image_url) || ''} alt="QRIS" style={{ width: '90px', height: '90px', objectFit: 'contain', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }} />
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: '#374151' }}>
                              {paymentSettings.bank_accounts.map(acc => (
                                <div key={acc.id}><strong>{acc.bank_name}</strong> — {acc.account_number} a.n. {acc.account_name}</div>
                              ))}
                              <div style={{ fontWeight: 700, color: 'var(--primary)' }}>Total: Rp {Number(promo.amount_paid).toLocaleString('id-ID')}</div>
                            </div>
                          </div>
                        )}

                        {promo.manual_review_status === 'ocr_checked' && promo.ocr_note && (
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem', fontStyle: 'italic' }}>
                            Catatan sistem: {promo.ocr_note.startsWith('[MATCH]') ? 'Nominal terdeteksi cocok, menunggu review admin.' : 'Nominal tidak terdeteksi cocok otomatis, admin akan meninjau manual.'}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <input
                            type="file"
                            accept="image/*"
                            ref={el => { proofInputRefs.current[promo.id] = el; }}
                            style={{ display: 'none' }}
                            onChange={e => setProofFiles(prev => ({ ...prev, [promo.id]: e.target.files?.[0] || null }))}
                          />
                          <button
                            type="button"
                            onClick={() => proofInputRefs.current[promo.id]?.click()}
                            style={{ fontSize: '0.75rem', background: '#f3f4f6', color: '#374151', padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer', fontWeight: 700 }}
                          >
                            {proofFiles[promo.id] ? proofFiles[promo.id]?.name : 'Pilih Bukti Transfer'}
                          </button>
                          <button
                            type="button"
                            disabled={!proofFiles[promo.id] || uploadingProofId === promo.id}
                            onClick={async () => {
                              const file = proofFiles[promo.id];
                              if (!file) return;
                              setUploadingProofId(promo.id);
                              try {
                                const fd = new FormData();
                                fd.append('proof_image', file);
                                await fetchApi(`/promotions/${promo.id}/upload-proof`, { method: 'POST', body: fd });
                                showMessage('Bukti transfer berhasil diupload dan sedang diperiksa.', 'success');
                                setProofFiles(prev => ({ ...prev, [promo.id]: null }));
                                await loadData();
                              } catch (err: any) {
                                showMessage(err.message || 'Gagal upload bukti transfer.', 'error');
                              } finally {
                                setUploadingProofId(null);
                              }
                            }}
                            style={{ fontSize: '0.75rem', background: 'var(--primary)', color: 'white', padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 700, opacity: (!proofFiles[promo.id] || uploadingProofId === promo.id) ? 0.5 : 1 }}
                          >
                            {uploadingProofId === promo.id ? 'Mengupload...' : 'Upload Bukti'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Ad media badge */}
                    {hasAd && (
                      <div style={{ marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: promo.ad_type === 'video' ? 'rgba(109, 40, 217, 0.1)' : 'rgba(37, 99, 235, 0.1)', color: promo.ad_type === 'video' ? '#7c3aed' : '#2563eb', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {promo.ad_type === 'video' ? '🎬' : '🖼️'} Iklan {promo.ad_type === 'video' ? 'Video' : 'Gambar'} Aktif
                          </span>
                          {promo.ad_title && (
                            <span style={{ fontSize: '0.78rem', color: '#6b7280', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>"{promo.ad_title}"</span>
                          )}
                        </div>

                        {/* Mini preview */}
                        {promo.ad_type === 'image' ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={getStorageUrl(promo.ad_media_url) || ''} alt="iklan" style={{ marginTop: '0.6rem', width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)' }} />
                        ) : (
                          <video src={getStorageUrl(promo.ad_media_url) || ''} muted loop playsInline controls={false}
                            onMouseEnter={e => {
                              const playPromise = (e.currentTarget as HTMLVideoElement).play();
                              if (playPromise !== undefined) {
                                playPromise.catch(() => {});
                              }
                            }}
                            onMouseLeave={e => (e.currentTarget as HTMLVideoElement).pause()}
                            style={{ marginTop: '0.6rem', width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)', display: 'block' }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  </>
  );
}
