'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { USER_ROLES } from '@/lib/constants';

export default function EditProduct() {
  const router = useRouter();
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFoto, setCurrentFoto] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nama_barang: '',
    harga: '',
    category_id: '',
    kondisi: 'baru',
    deskripsi: '',
    status_terjual: '0',
    latitude: '',
    longitude: '',
  });
  const [foto, setFoto] = useState<File | null>(null);

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
        nama_barang: p.nama_barang,
        harga: p.harga.toString(),
        category_id: p.category_id.toString(),
        kondisi: p.kondisi,
        deskripsi: p.deskripsi,
        status_terjual: p.status_terjual ? '1' : '0',
        latitude: p.latitude || '',
        longitude: p.longitude || '',
      });
      setCurrentFoto(p.foto);

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
      submitData.append('status_terjual', formData.status_terjual);
      
      if (formData.latitude && formData.longitude) {
        submitData.append('latitude', formData.latitude);
        submitData.append('longitude', formData.longitude);
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
    <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 70px)' }}>
      <div style={{ fontSize: '1.2rem', fontWeight: 600, opacity: 0.5 }}>Memuat Formulir Edit...</div>
    </div>
  );

  if (error && error.includes('ditemukan')) return (
    <div className="container" style={{ padding: '60px 1rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️ Ops!</h1>
      <p>{error}</p>
      <Link href="/seller/products" className="btn btn-primary" style={{ marginTop: '2rem' }}>Kembali ke Dashboard</Link>
    </div>
  );

  return (
    <div className="container" style={{ padding: '60px 1rem', maxWidth: '800px' }}>
      <Link href="/seller/products" style={{ display: 'inline-block', marginBottom: '2rem', fontWeight: 600, opacity: 0.7 }}>
        &larr; Kembali ke Dashboard
      </Link>

      <div className="card">
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Edit Lapak Barang</h1>
        <p style={{ opacity: 0.6, marginBottom: '2rem' }}>Perbarui informasi terkait barang bekas yang Anda jual.</p>

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
               required
               value={formData.deskripsi}
               onChange={handleInputChange}
            />
          </div>

          <div className="flex-col gap-2">
            <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Status Penjualan / Ketersediaan</label>
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
                📍 Perbarui Lokasi
              </button>
            </div>
          </div>

          <div className="flex-col gap-2">
            <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Ubah Foto Barang (Max 2MB)</label>
            {currentFoto && (
              <div style={{ marginBottom: '0.5rem', width: '150px', height: '100px', borderRadius: 'var(--radius)', overflow: 'hidden', background: '#f5f5f5' }}>
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`http://localhost:8000/storage/${currentFoto}`} alt="Current Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <input 
               type="file" 
               accept="image/*" 
               className="input-field" 
               style={{ padding: '0.5rem' }}
               onChange={handleFileChange}
            />
            <small style={{ opacity: 0.6 }}>Abaikan jika Anda tidak ingin mengubah foto</small>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button type="submit" disabled={saving || !formData.latitude} className="btn btn-primary" style={{ width: '100%', padding: '15px' }}>
              {saving ? 'Menyimpan Perubahan...' : 'Simpan Perubahan ✅'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
