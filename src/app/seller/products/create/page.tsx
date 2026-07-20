'use client';

import { useState, useEffect } from 'react';
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
  const [foto, setFoto] = useState<File | null>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFoto(e.target.files[0]);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      if (formData.minimum_offer_price) {
        submitData.append('minimum_offer_price', formData.minimum_offer_price);
      }
      
      if (formData.latitude && formData.longitude) {
        submitData.append('latitude', formData.latitude);
        submitData.append('longitude', formData.longitude);
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Input 
             type="text" 
             name="nama_barang" 
             label="Nama Barang"
             placeholder="Contoh: Kipas Angin Bekas" 
             required
             value={formData.nama_barang}
             onChange={handleInputChange}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <Input 
               type="number" 
               name="harga" 
               label="Harga (Rp)"
               placeholder="Contoh: 500000" 
               required
               min={0}
               value={formData.harga}
               onChange={handleInputChange}
            />
            
            <Input 
               type="number" 
               name="minimum_offer_price" 
               label="Minimal Harga Tawar (Rp)"
               placeholder="Opsional, misal: 450000" 
               min={0}
               value={formData.minimum_offer_price}
               onChange={handleInputChange}
            />
            
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
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--foreground)' }}>Deskripsi Barang</label>
            <textarea 
               name="deskripsi" 
               className="input-field" 
               rows={6}
               style={{ height: 'auto', resize: 'vertical' }}
               placeholder="Jelaskan spesifikasi, merek, atau minus dari barang yang Anda jual." 
               required
               value={formData.deskripsi}
               onChange={handleInputChange}
            />
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--foreground)' }}>Foto Barang Utama (Max 2MB)</label>
            <input 
               type="file" 
               accept="image/*" 
               className="input-field" 
               style={{ padding: '0.75rem', fontSize: '0.875rem' }}
               onChange={handleFileChange}
            />
          </div>

          <div style={{ marginTop: '2rem' }}>
            <Button type="submit" disabled={loading || !formData.latitude} variant="primary" size="lg" fullWidth>
              {loading ? 'Menyimpan Barang...' : 'Listing Barang Bekas'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
