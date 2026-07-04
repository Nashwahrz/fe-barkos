'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants';
import { Icons } from '@/components/Icons';

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
    if (file) {
      setAdMediaFile(file);
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
      setPreviewError(false);
    }
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
      const [packagesRes, productsRes, promosRes] = await Promise.all([
        fetchApi('/promotions/packages'),
        fetchApi('/my-products'),
        fetchApi('/promotions/my')
      ]);
      setPackages(packagesRes.data || packagesRes);
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
    if (adType !== 'none') {
      if (mediaSource === 'file' && !adMediaFile) return showMessage('Pilih file media iklan terlebih dahulu', 'error');
      if (mediaSource === 'url' && !adMediaUrl.trim()) return showMessage('Masukkan URL media iklan', 'error');
    }

    if (!confirm('Simulasi Pembayaran: Apakah Anda yakin ingin mengaktifkan paket promosi ini? (Anggap pembayaran berhasil)')) return;

    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('product_id', selectedProduct);
      formData.append('package_id', selectedPackage);
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

      await fetchApi('/promotions', {
        method: 'POST',
        body: formData
      });
      showMessage('Promosi berhasil diaktifkan!', 'success');
      setSelectedProduct('');
      setSelectedPackage('');
      setAdType('none');
      setAdMediaUrl('');
      setAdMediaFile(null);
      setFilePreviewUrl('');
      setAdTitle('');
      setPreviewError(false);
      await loadData();
    } catch (err: any) {
      showMessage(err.message || 'Gagal mengaktifkan promosi', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || authLoading) return <div className="p-8 text-center">Memuat data promosi...</div>;

  const adTypeOptions: { value: 'none' | 'image' | 'video'; label: string; icon: string; desc: string }[] = [
    { value: 'none',  label: 'Tanpa Iklan',  icon: '🚫', desc: 'Hanya boost posisi produk tanpa banner iklan.' },
    { value: 'image', label: 'Iklan Gambar', icon: '🖼️', desc: 'Tampilkan banner gambar di halaman utama.' },
    { value: 'video', label: 'Iklan Video',  icon: '🎬', desc: 'Tampilkan video promosi di halaman utama.' },
  ];

  return (
    <div className="container" style={{ padding: '60px 1rem', maxWidth: '1100px' }}>
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
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
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#111827' }}>
            <Icons.ShoppingBag size={24} color="#111827" /> Beli Paket Promosi
          </h2>

          <form onSubmit={handlePurchase} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

            {/* Step 1: Produk */}
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

            {/* Step 2: Paket */}
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

            {/* Step 3: Pasang Iklan (opsional) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.6rem', fontWeight: 700, color: '#374151' }}>
                3. Pasang Iklan <span style={{ fontWeight: 500, color: '#9ca3af' }}>(opsional)</span>
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
              <p style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: '1rem', fontStyle: 'italic' }}>
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
                        color: mediaSource === 'file' ? 'var(--primary)' : '#6b7280',
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
                        color: mediaSource === 'url' ? 'var(--primary)' : '#6b7280',
                      }}
                    >
                      🔗 URL Publik
                    </button>
                  </div>

                  {mediaSource === 'file' ? (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>
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
                          Maksimal 500MB (PNG, JPG, MP4, MOV, dll.)
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
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem' }}>
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
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem' }}>Judul Iklan (opsional)</label>
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
                            style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }}
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
                    <strong>💡 Tips:</strong> Anda dapat mengunggah file media dari perangkat Anda atau menggunakan URL eksternal. Untuk gambar disarankan rasio 16:9 (misal 1280×720px). Untuk video, format MP4 paling kompatibel. Iklan ini akan tampil di halaman utama.
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '1.125rem', fontWeight: 800, fontSize: '1.05rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)', marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              disabled={actionLoading || myProducts.length === 0}
            >
              {actionLoading ? <><Icons.Loader size={20} color="white" /> Memproses...</> : <><Icons.Zap size={20} color="white" /> Aktifkan Boost Sekarang</>}
            </button>
          </form>
        </div>

        {/* ── Riwayat Promosi ── */}
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
                      <div style={{ flexShrink: 0 }}>
                        {isActive ? (
                          <span style={{ padding: '5px 12px', borderRadius: '20px', background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>AKTIF <Icons.Zap size={12} color="#16a34a" /></span>
                        ) : (
                          <span style={{ padding: '5px 12px', borderRadius: '20px', background: 'rgba(107, 114, 128, 0.08)', color: '#6b7280', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em' }}>EXPIRED</span>
                        )}
                      </div>
                    </div>

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
  );
}
