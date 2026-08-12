'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { fetchApi, getStorageUrl } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { USER_ROLES } from '@/lib/constants';
import { Icons } from '@/components/Icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { ssr: false });

export default function EditProduct() {
  const router = useRouter();
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [currentFoto, setCurrentFoto] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({
    nama_barang: '',
    harga: '',
    category_id: '',
    kondisi: 'baru',
    durasi_pemakaian: '',
    deskripsi: '',
    status_terjual: '0',
    latitude: '',
    longitude: '',
    minimum_offer_price: '',
  });
  const [isOfferEnabled, setIsOfferEnabled] = useState(true);
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== USER_ROLES.PENJUAL) {
        router.replace('/auth/login');
      } else {
        loadData();
      }
    }
  }, [user, authLoading, router]);

  async function loadData() {
    try {
      setLoading(true);
      const [categoriesRes, productRes] = await Promise.all([
        fetchApi('/categories'),
        fetchApi(`/products/${id}`)
      ]);
      
      setCategories(categoriesRes.data || categoriesRes);
      
      const p = productRes.data || productRes;
      setFormData({
        nama_barang: p.nama_barang || '',
        harga: p.harga ? Math.round(Number(p.harga)).toString() : '',
        category_id: p.category?.id?.toString() || p.category_id?.toString() || '',
        kondisi: p.kondisi || 'baru',
        durasi_pemakaian: p.durasi_pemakaian || '',
        deskripsi: p.deskripsi || '',
        status_terjual: p.status_terjual ? '1' : '0',
        latitude: p.latitude?.toString() || '',
        longitude: p.longitude?.toString() || '',
        minimum_offer_price: p.minimum_offer_price ? Math.round(Number(p.minimum_offer_price)).toString() : '',
      });
      setIsOfferEnabled(p.is_offer_enabled !== false);
      setCurrentFoto(p.foto);
      setPaymentMethod(p.payment_method || 'cod');
      
      if (p.user?.bank_accounts && p.user.bank_accounts.length > 0) {
        setBankName(p.user.bank_accounts[0].bank_name);
        setAccountNumber(p.user.bank_accounts[0].account_number);
      } else if (user?.bank_accounts && user.bank_accounts.length > 0) {
        setBankName(user.bank_accounts[0].bank_name);
        setAccountNumber(user.bank_accounts[0].account_number);
      }

    } catch (err) {
      console.error('Failed to load data', err);
      setError('Produk tidak ditemukan atau Anda tidak memiliki akses.');
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new globalThis.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + "_compressed.jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(newFile);
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.7);
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        const compressed = await compressImage(file);
        setFoto(compressed);
        setFotoPreview(URL.createObjectURL(compressed));
      } else {
        setFoto(file);
        setFotoPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString()
    }));
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }));
          alert('Lokasi berhasil didapatkan!');
        },
        (error) => {
          console.error(error);
          alert('Gagal mendapatkan lokasi. Pastikan GPS aktif dan izin diberikan.');
        }
      );
    } else {
      alert('Sistem Anda tidak mendukung Geolocation.');
    }
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      executeSubmit();
    }, 500);
  };

  async function executeSubmit() {
    if (isOfferEnabled && formData.minimum_offer_price) {
      if (Number(formData.minimum_offer_price) > Number(formData.harga)) {
        setError('Minimal harga tawar tidak boleh melebihi harga asli.');
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      const submitData = new FormData();
      // Required to trick Laravel into interpreting a POST request as PUT when using FormData
      submitData.append('_method', 'PUT'); 
      submitData.append('nama_barang', formData.nama_barang);
      submitData.append('harga', formData.harga);
      submitData.append('category_id', formData.category_id);
      submitData.append('kondisi', formData.kondisi);
      submitData.append('deskripsi', formData.deskripsi);
      if (formData.durasi_pemakaian) {
        submitData.append('durasi_pemakaian', formData.durasi_pemakaian);
      }
      submitData.append('status_terjual', formData.status_terjual);
      
      if (formData.latitude && formData.longitude) {
        submitData.append('latitude', formData.latitude);
        submitData.append('longitude', formData.longitude);
      }

      submitData.append('is_offer_enabled', isOfferEnabled ? '1' : '0');
      if (isOfferEnabled && formData.minimum_offer_price !== undefined) {
        submitData.append('minimum_offer_price', formData.minimum_offer_price);
      }

      submitData.append('payment_method', paymentMethod);
      if (['bank_transfer', 'both'].includes(paymentMethod)) {
        submitData.append('bank_name', bankName);
        submitData.append('account_number', accountNumber);
      }

      if (foto) {
        submitData.append('foto', foto);
      }

      await fetchApi(`/products/${id}`, {
        method: 'POST', // Sent as POST but with _method=PUT to support multipart/form-data
        body: submitData,
      });

      alert('Detail barang berhasil diperbarui!');
      router.push('/seller/products');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal memperbarui barang. Silakan periksa kembali input Anda.');
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) return (
    <div className="flex flex-col items-center justify-center" style={{ height: 'calc(100vh - 70px)', gap: '12px', color: 'var(--foreground)' }}>
      <Icons.Loader size={32} />
      <div style={{ fontSize: '1.2rem', fontWeight: 600, opacity: 0.5 }}>Memuat Formulir Edit...</div>
    </div>
  );

  if (error && error.includes('ditemukan')) return (
    <div className="container" style={{ padding: '60px 1rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--danger)' }}><Icons.X size={32} /> Ops!</h1>
      <p style={{ color: 'var(--foreground)', opacity: 0.8, fontSize: '1rem' }}>{error}</p>
      <div style={{ marginTop: '2rem' }}>
        <Button href="/seller/products" variant="primary" size="lg">Kembali ke Dashboard</Button>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ padding: '60px 1rem', maxWidth: '800px' }}>
      <Link href="/seller/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '2rem', fontWeight: 600, color: 'var(--foreground)', opacity: 0.7, textDecoration: 'none' }}>
        <Icons.ArrowLeft size={16} /> Kembali ke Dashboard
      </Link>

      <div className="card" style={{ padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Edit Lapak Barang</h1>
        <p style={{ color: 'var(--foreground)', opacity: 0.6, marginBottom: '2.5rem', fontSize: '0.95rem' }}>Perbarui informasi terkait barang bekas yang Anda jual.</p>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)', color: 'var(--danger)', borderRadius: '12px', marginBottom: '2rem', fontWeight: 500, fontSize: '0.95rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={onFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Input 
             type="text" 
             name="nama_barang" 
             label="Nama Barang"
             required
             value={formData.nama_barang}
             onChange={handleInputChange}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <Input 
               type="number" 
               name="harga" 
               label="Harga (Rp)"
               required
               min={0}
               value={formData.harga}
               onChange={handleInputChange}
            />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--foreground)' }}>Terima Tawaran?</label>
              <label style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input)', cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={isOfferEnabled}
                  onChange={(e) => setIsOfferEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>
                  {isOfferEnabled ? 'Ya, pembeli boleh menawar harga' : 'Tidak, harga sudah pas (fixed)'}
                </span>
              </label>
            </div>

            {isOfferEnabled && (
              <div id="field-minimum_offer_price">
                <Input
                  type="number"
                  name="minimum_offer_price"
                  label="Minimal Harga Tawar (Rp)"
                  placeholder="Opsional, misal: 450000"
                  min={0}
                  max={formData.harga ? Number(formData.harga) : undefined}
                  value={formData.minimum_offer_price}
                  onChange={(e) => {
                    if (formData.harga && Number(e.target.value) > Number(formData.harga)) {
                      alert('Minimal harga tawar tidak boleh melebihi harga asli.');
                      setFormData(prev => ({ ...prev, minimum_offer_price: prev.harga }));
                      setFieldErrors(p => ({ ...p, minimum_offer_price: 'Harga tawar otomatis disesuaikan dengan harga maksimal.' }));
                      return;
                    }
                    handleInputChange(e);
                    setFieldErrors(p => ({ ...p, minimum_offer_price: '' }));
                  }}
                />
                {fieldErrors.minimum_offer_price && (
                  <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', fontWeight: 500 }}>
                    ⚠ {fieldErrors.minimum_offer_price}
                  </p>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--foreground)' }}>Kategori Pilihan</label>
              <select 
                 name="category_id" 
                 className="input-field" 
                 required
                 value={formData.category_id}
                 onChange={handleInputChange}
              >
                <option value="" disabled>-- Pilih Kategori --</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--foreground)' }}>Kondisi</label>
              <select 
                 name="kondisi" 
                 className="input-field" 
                 required
                 value={formData.kondisi}
                 onChange={handleInputChange}
              >
                <option value="baru">Baru</option>
                <option value="sangat baik">Sangat Baik</option>
                <option value="layak pakai">Layak Pakai</option>
              </select>
            </div>
            
            <Input 
               type="text" 
               name="durasi_pemakaian" 
               label="Durasi Pemakaian"
               placeholder="Contoh: 6 Bulan, 1 Tahun" 
               required
               value={formData.durasi_pemakaian}
               onChange={handleInputChange}
            />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--foreground)' }}>Metode Pembayaran</label>
              <select 
                 name="payment_method" 
                 className="input-field" 
                 value={paymentMethod}
                 onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cod">COD (Bayar di Tempat)</option>
                <option value="bank_transfer">Transfer Bank</option>
                <option value="both">Keduanya (COD & Transfer)</option>
              </select>
            </div>

            {['bank_transfer', 'both'].includes(paymentMethod) && (
              <>
                <Input 
                   type="text" 
                   name="bank_name" 
                   label="Nama Bank"
                   placeholder="Contoh: BCA, BNI, Mandiri"
                   required
                   value={bankName}
                   onChange={(e) => setBankName(e.target.value)}
                />
                <Input 
                   type="text" 
                   name="account_number" 
                   label="Nomor Rekening"
                   placeholder="Contoh: 1234567890"
                   required
                   value={accountNumber}
                   onChange={(e) => setAccountNumber(e.target.value)}
                />
              </>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--foreground)' }}>Deskripsi Barang</label>
            <textarea 
               name="deskripsi" 
               className="input-field" 
               rows={6}
               style={{ height: 'auto', resize: 'vertical' }}
               required
               value={formData.deskripsi}
               onChange={handleInputChange}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--foreground)' }}>Status Penjualan / Ketersediaan</label>
            <select 
               name="status_terjual" 
               className="input-field" 
               value={formData.status_terjual}
               onChange={handleInputChange}
            >
              <option value="0">Tersedia (Bisa Dipesan)</option>
              <option value="1">Telah Terjual (Habis / Sembunyikan)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--foreground)' }}>Lokasi Barang (Pin Point Peta)</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <Input 
                   type="text" 
                   placeholder="Koordinat terpilih..." 
                   readOnly
                   required
                   value={formData.latitude && formData.longitude ? `${formData.latitude}, ${formData.longitude}` : ''}
                />
              </div>
              <Button type="button" onClick={getLocation} variant="secondary" style={{ whiteSpace: 'nowrap' }}>
                <Icons.Compass size={16} /> Gunakan GPS Saya
              </Button>
            </div>

            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <LocationPicker 
                lat={formData.latitude ? parseFloat(formData.latitude) : -0.947083} 
                lng={formData.longitude ? parseFloat(formData.longitude) : 100.417181} 
                onChange={handleLocationChange} 
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, color: 'var(--foreground)' }}>Foto Barang Utama</label>
            <div 
              style={{
                border: '2px dashed var(--border)',
                borderRadius: '12px',
                padding: '2.5rem 1rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'var(--card)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              onClick={() => {
                const optionsDiv = document.getElementById('photo-options-modal');
                if (optionsDiv) optionsDiv.style.display = 'flex';
              }}
            >
              {fotoPreview || currentFoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoPreview || getStorageUrl(currentFoto) || ''} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', objectFit: 'contain' }} />
              ) : (
                <div style={{ color: 'var(--foreground)', opacity: 0.6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ padding: '12px', background: 'var(--background)', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <Icons.Image size={24} color="var(--primary)" />
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Sentuh di sini untuk Menambahkan Foto</span>
                  <span style={{ fontSize: '0.75rem' }}>Format: JPG, PNG, WEBP</span>
                </div>
              )}
            </div>
            
            {/* Hidden Inputs */}
            <input 
               id="foto-upload-camera"
               type="file" 
               accept="image/jpeg, image/png, image/webp" 
               capture="environment"
               style={{ display: 'none' }}
               onChange={(e) => {
                 handleFileChange(e);
                 const optionsDiv = document.getElementById('photo-options-modal');
                 if (optionsDiv) optionsDiv.style.display = 'none';
               }}
            />
            <input 
               id="foto-upload-gallery"
               type="file" 
               accept="image/jpeg, image/png, image/webp" 
               style={{ display: 'none' }}
               onChange={(e) => {
                 handleFileChange(e);
                 const optionsDiv = document.getElementById('photo-options-modal');
                 if (optionsDiv) optionsDiv.style.display = 'none';
               }}
            />

            {/* Photo Source Options Modal (Simple Overlay) */}
            <div id="photo-options-modal" style={{ display: 'none', position: 'fixed', inset: 0, zIndex: 9999, alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }} onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.style.display = 'none'; }}>
              <div style={{ background: 'var(--card)', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', textAlign: 'center' }}>Pilih Sumber Foto</h3>
                <Button type="button" variant="primary" onClick={() => document.getElementById('foto-upload-camera')?.click()} style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <Icons.Camera size={18} /> Buka Kamera
                </Button>
                <Button type="button" variant="secondary" onClick={() => document.getElementById('foto-upload-gallery')?.click()} style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <Icons.Image size={18} /> Pilih dari Galeri
                </Button>
                <Button type="button" variant="ghost" onClick={() => { const el = document.getElementById('photo-options-modal'); if (el) el.style.display = 'none'; }} style={{ marginTop: '8px' }}>
                  Batal
                </Button>
              </div>
            </div>
            
            <small style={{ color: 'var(--foreground)', opacity: 0.5, fontSize: '0.8rem', textAlign: 'center', marginTop: '4px', display: 'block' }}>Abaikan jika Anda tidak ingin mengubah foto</small>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <Button type="submit" disabled={saving || !formData.latitude} variant="primary" size="lg" fullWidth>
              {saving ? 'Menyimpan Perubahan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
