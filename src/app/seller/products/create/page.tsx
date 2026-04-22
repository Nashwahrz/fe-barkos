'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { USER_ROLES } from '@/lib/constants';

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
    deskripsi: '',
    latitude: '',
    longitude: '',
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
      <Link href="/seller/products" style={{ display: 'inline-block', marginBottom: '2rem', fontWeight: 600, opacity: 0.7 }}>
        &larr; Kembali ke Dashboard
      </Link>

      <div className="card">
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Jual Barang Bekas</h1>
        <p style={{ opacity: 0.6, marginBottom: '2rem' }}>Masukkan rincian barang keperluan kos yang ingin Anda jual.</p>

        {error && (
          <div style={{ padding: '1rem', background: '#fef2f2', color: '#ef4444', borderRadius: 'var(--radius)', marginBottom: '2rem', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-col gap-5">
          <div className="flex-col gap-2">
            <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Nama Barang</label>
            <input 
               type="text" 
               name="nama_barang" 
               className="input-field" 
               placeholder="Contoh: Kipas Angin Bekas" 
               required
               value={formData.nama_barang}
               onChange={handleInputChange}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="flex-col gap-2">
              <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Harga (Rp)</label>
              <input 
                 type="number" 
                 name="harga" 
                 className="input-field" 
                 placeholder="Contoh: 500000" 
                 required
                 min="0"
                 value={formData.harga}
                 onChange={handleInputChange}
              />
            </div>
            
            <div className="flex-col gap-2">
              <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Kategori Pilihan</label>
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
            <div className="flex-col gap-2">
              <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Kondisi</label>
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
          </div>

          <div className="flex-col gap-2">
            <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Deskripsi Barang</label>
            <textarea 
               name="deskripsi" 
               className="input-field" 
               rows={6}
               placeholder="Jelaskan spesifikasi, merek, atau minus dari barang yang Anda jual." 
               required
               value={formData.deskripsi}
               onChange={handleInputChange}
            />
          </div>

          <div className="flex-col gap-2">
            <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Lokasi Barang (Wajib untuk jarak COD)</label>
            <div className="flex gap-2">
              <input 
                 type="text" 
                 className="input-field" 
                 style={{ flex: 1 }}
                 placeholder="Klik tombol di samping untuk otomatis mengambil koordinat..." 
                 readOnly
                 required
                 value={formData.latitude && formData.longitude ? `${formData.latitude}, ${formData.longitude}` : ''}
              />
              <button type="button" onClick={getLocation} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                📍 Lacak Lokasi
              </button>
            </div>
          </div>

          <div className="flex-col gap-2">
            <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Foto Barang Utama - Max 2MB</label>
            <input 
               type="file" 
               accept="image/*" 
               className="input-field" 
               style={{ padding: '0.5rem' }}
               onChange={handleFileChange}
            />
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button type="submit" disabled={loading || !formData.latitude} className="btn btn-primary" style={{ width: '100%', padding: '15px' }}>
              {loading ? 'Menyimpan Barang...' : 'Hosting Barang Bekas 🚀'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
