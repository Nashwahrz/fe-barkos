'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { USER_ROLES } from '@/lib/constants';
import { Icons } from '@/components/Icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { ssr: false });

export default function CreateProduct() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Error per-field untuk validasi inline
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({
    nama_barang: '',
    harga: '',
    category_id: '',
    kondisi: 'baru',
    durasi_pemakaian: '',
    deskripsi: '',
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
    if (user?.bank_accounts && user.bank_accounts.length > 0) {
      setBankName(user.bank_accounts[0].bank_name);
      setAccountNumber(user.bank_accounts[0].account_number);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== USER_ROLES.PENJUAL) {
        router.replace('/auth/login');
      } else {
        loadCategories();
      }
    }
  }, [user, authLoading, router]);

  async function loadCategories() {
    try {
      const data = await fetchApi('/categories');
      setCategories(data.data || data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
          }, 'image/jpeg', 0.7); // 70% quality
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
      // Hapus error foto saat gambar sudah dipilih
      setFieldErrors(p => ({ ...p, foto: '' }));
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

  /**
   * Validasi semua field wajib.
   * Jika ada yang kosong: tampilkan error inline dan scroll+focus ke field pertama yang kosong.
   * Return true jika semua valid, false jika ada yang kosong.
   */
  const validateAndFocus = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.nama_barang.trim()) errors.nama_barang = 'Nama barang wajib diisi.';
    if (!formData.harga) errors.harga = 'Harga wajib diisi.';
    if (isOfferEnabled && formData.minimum_offer_price) {
      if (Number(formData.minimum_offer_price) > Number(formData.harga)) {
        errors.minimum_offer_price = 'Minimal harga tawar tidak boleh melebihi harga asli.';
      }
    }
    if (!formData.category_id) errors.category_id = 'Kategori wajib dipilih.';
    if (!formData.durasi_pemakaian.trim()) errors.durasi_pemakaian = 'Durasi pemakaian wajib diisi.';
    if (!formData.deskripsi.trim()) errors.deskripsi = 'Deskripsi barang wajib diisi.';
    if (!formData.latitude || !formData.longitude) errors.lokasi = 'Lokasi barang wajib ditentukan (pin peta atau GPS).';
    if (!foto) errors.foto = 'Foto barang wajib diunggah.';
    if (['bank_transfer', 'both'].includes(paymentMethod)) {
      if (!bankName.trim()) errors.bank_name = 'Nama Bank wajib diisi untuk transfer.';
      if (!accountNumber.trim()) errors.account_number = 'Nomor Rekening wajib diisi.';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Urutan field yang dicek — scroll ke yang pertama kosong
      const fieldOrder = ['nama_barang', 'harga', 'minimum_offer_price', 'category_id', 'durasi_pemakaian', 'deskripsi', 'lokasi', 'foto'];
      const firstError = fieldOrder.find(f => errors[f]);
      if (firstError) {
        const el = document.getElementById(`field-${firstError}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Fokus ke input di dalamnya jika ada
          const input = el.querySelector<HTMLElement>('input, select, textarea');
          input?.focus();
        }
      }
      return false;
    }
    return true;
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
    // Validasi dulu sebelum submit
    if (!validateAndFocus()) return;

    setLoading(true);
    setError(null);

    try {
      const submitData = new FormData();
      submitData.append('nama_barang', formData.nama_barang);
      submitData.append('harga', formData.harga);
      submitData.append('category_id', formData.category_id);
      submitData.append('kondisi', formData.kondisi);
      submitData.append('deskripsi', formData.deskripsi);
      if (formData.durasi_pemakaian) {
        submitData.append('durasi_pemakaian', formData.durasi_pemakaian);
      }
      submitData.append('is_offer_enabled', isOfferEnabled ? '1' : '0');
      if (isOfferEnabled && formData.minimum_offer_price) {
        submitData.append('minimum_offer_price', formData.minimum_offer_price);
      }

      if (formData.latitude && formData.longitude) {
        submitData.append('latitude', formData.latitude);
        submitData.append('longitude', formData.longitude);
      }

      submitData.append('payment_method', paymentMethod);
      if (['bank_transfer', 'both'].includes(paymentMethod)) {
        submitData.append('bank_name', bankName);
        submitData.append('account_number', accountNumber);
      }

      if (foto) {
        submitData.append('foto', foto);
      }

      await fetchApi('/products', {
        method: 'POST',
        body: submitData,
        // Don't set Content-Type header when sending FormData, browser will handle boundary automatically
      });

      alert('Barang jualan berhasil ditambahkan!');
      router.push('/seller/products');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal menambahkan produk. Silakan periksa kembali input Anda.');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) return null;

  return (
    <div className="container" style={{ padding: '60px 1rem', maxWidth: '800px' }}>
      <Link href="/seller/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '2rem', fontWeight: 600, color: 'var(--foreground)', opacity: 0.7, textDecoration: 'none' }}>
        <Icons.ArrowLeft size={16} /> Kembali ke Dashboard
      </Link>

      <div className="card" style={{ padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Jual Barang Bekas</h1>
        <p style={{ color: 'var(--foreground)', opacity: 0.6, marginBottom: '2.5rem', fontSize: '0.95rem' }}>Masukkan rincian barang keperluan kos yang ingin Anda jual.</p>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)', color: 'var(--danger)', borderRadius: '12px', marginBottom: '2rem', fontWeight: 500, fontSize: '0.95rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={onFormSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div id="field-nama_barang">
            <Input
              type="text"
              name="nama_barang"
              label="Nama Barang"
              placeholder="Contoh: Kipas Angin Bekas"
              value={formData.nama_barang}
              onChange={(e) => { handleInputChange(e); setFieldErrors(p => ({ ...p, nama_barang: '' })); }}
            />
            {fieldErrors.nama_barang && (
              <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', fontWeight: 500 }}>
                ⚠ {fieldErrors.nama_barang}
              </p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div id="field-harga">
              <Input
                type="number"
                name="harga"
                label="Harga (Rp)"
                placeholder="Contoh: 500000"
                min={0}
                value={formData.harga}
                onChange={(e) => { handleInputChange(e); setFieldErrors(p => ({ ...p, harga: '' })); }}
              />
              {fieldErrors.harga && (
                <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', fontWeight: 500 }}>
                  ⚠ {fieldErrors.harga}
                </p>
              )}
            </div>

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
                    handleInputChange(e);
                    if (formData.harga && Number(e.target.value) > Number(formData.harga)) {
                      setFieldErrors(p => ({ ...p, minimum_offer_price: 'Minimal harga tawar tidak boleh melebihi harga asli.' }));
                    } else {
                      setFieldErrors(p => ({ ...p, minimum_offer_price: '' }));
                    }
                  }}
                />
                {fieldErrors.minimum_offer_price && (
                  <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', fontWeight: 500 }}>
                    ⚠ {fieldErrors.minimum_offer_price}
                  </p>
                )}
              </div>
            )}

            <div id="field-category_id" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--foreground)' }}>Kategori Pilihan</label>
              <select
                name="category_id"
                className="input-field"
                value={formData.category_id}
                onChange={(e) => { handleInputChange(e); setFieldErrors(p => ({ ...p, category_id: '' })); }}
              >
                <option value="" disabled>-- Pilih Kategori --</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {fieldErrors.category_id && (
                <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0px', fontWeight: 500 }}>
                  ⚠ {fieldErrors.category_id}
                </p>
              )}
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

            <div id="field-durasi_pemakaian">
              <Input
                type="text"
                name="durasi_pemakaian"
                label="Durasi Pemakaian"
                placeholder="Contoh: 6 Bulan, 1 Tahun"
                value={formData.durasi_pemakaian}
                onChange={(e) => { handleInputChange(e); setFieldErrors(p => ({ ...p, durasi_pemakaian: '' })); }}
              />
              {fieldErrors.durasi_pemakaian && (
                <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', fontWeight: 500 }}>
                  ⚠ {fieldErrors.durasi_pemakaian}
                </p>
              )}
            </div>

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
                <div id="field-bank_name">
                  <Input
                    type="text"
                    name="bank_name"
                    label="Nama Bank"
                    placeholder="Contoh: BCA, BNI, Mandiri"
                    value={bankName}
                    onChange={(e) => { setBankName(e.target.value); setFieldErrors(p => ({ ...p, bank_name: '' })); }}
                  />
                  {fieldErrors.bank_name && (
                    <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', fontWeight: 500 }}>
                      ⚠ {fieldErrors.bank_name}
                    </p>
                  )}
                </div>
                <div id="field-account_number">
                  <Input
                    type="text"
                    name="account_number"
                    label="Nomor Rekening"
                    placeholder="Contoh: 1234567890"
                    value={accountNumber}
                    onChange={(e) => { setAccountNumber(e.target.value); setFieldErrors(p => ({ ...p, account_number: '' })); }}
                  />
                  {fieldErrors.account_number && (
                    <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', fontWeight: 500 }}>
                      ⚠ {fieldErrors.account_number}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <div id="field-deskripsi" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--foreground)' }}>Deskripsi Barang</label>
            <textarea
              name="deskripsi"
              className="input-field"
              rows={6}
              style={{ height: 'auto', resize: 'vertical' }}
              placeholder="Jelaskan spesifikasi, merek, atau minus dari barang yang Anda jual."
              value={formData.deskripsi}
              onChange={(e) => { handleInputChange(e); setFieldErrors(p => ({ ...p, deskripsi: '' })); }}
            />
            {fieldErrors.deskripsi && (
              <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px', fontWeight: 500 }}>
                ⚠ {fieldErrors.deskripsi}
              </p>
            )}
          </div>

          <div id="field-lokasi" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--foreground)' }}>Lokasi Barang (Pin Point Peta)</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <Input
                  type="text"
                  placeholder="Koordinat terpilih..."
                  readOnly
                  value={formData.latitude && formData.longitude ? `${formData.latitude}, ${formData.longitude}` : ''}
                />
              </div>
              <Button type="button" onClick={getLocation} variant="secondary" style={{ whiteSpace: 'nowrap' }}>
                <Icons.Compass size={16} /> Gunakan GPS Saya
              </Button>
            </div>
            {fieldErrors.lokasi && (
              <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '-4px', fontWeight: 500 }}>
                ⚠ {fieldErrors.lokasi}
              </p>
            )}

            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <LocationPicker
                lat={formData.latitude ? parseFloat(formData.latitude) : -0.947083}
                lng={formData.longitude ? parseFloat(formData.longitude) : 100.417181}
                onChange={(lat, lng) => { handleLocationChange(lat, lng); setFieldErrors(p => ({ ...p, lokasi: '' })); }}
              />
            </div>
          </div>

          <div id="field-foto" style={{ marginBottom: '1.5rem' }}>
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
                // Remove direct click, show options instead
                const optionsDiv = document.getElementById('photo-options-modal');
                if (optionsDiv) optionsDiv.style.display = 'flex';
              }}
            >
              {fotoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', objectFit: 'contain' }} />
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
            {fieldErrors.foto && (
              <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '8px', fontWeight: 500 }}>
                ⚠ {fieldErrors.foto}
              </p>
            )}
          </div>

          <div style={{ marginTop: '2rem' }}>
            <Button type="submit" disabled={loading} variant="primary" size="lg" fullWidth>
              {loading ? 'Menyimpan Barang...' : 'Upload Barang Bekas'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
