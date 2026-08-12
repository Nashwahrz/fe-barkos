'use client';

import { useState, type FormEvent } from 'react';
import useSWR from 'swr';
import { swrFetcher } from '@/lib/api';
import { testimoniApi } from '@/services/api/testimoni.api';
import { Button } from '@/components/ui/Button';

export default function TestimoniPage() {
    const { data, isLoading, mutate } = useSWR('/testimonis', swrFetcher);
    const testimonis = data?.data || [];

    const [form, setForm] = useState({
        nama: '',
        pekerjaan: '',
        jenis_kelamin: '',
        tanggal_lahir: '',
    });
    const [ editingId, setEditingId] = useState<number | null>(null);

   const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            await testimoniApi.update(editingId, form as any);
            
        } else {
            await testimoniApi.create(form as any);
        }
        setForm({
            nama: '',
            pekerjaan: '',
            jenis_kelamin: '',
            tanggal_lahir: ''
              
        });
        setEditingId(null);
        mutate(); // Refresh the list after submission
    };

    const handleDelete = async (id: number) => {
        // await testimoniApi.delete(id);
        // mutate(); // Refresh the list after deletion
        if (confirm('Are you sure you want to delete this testimoni?')) {
            await testimoniApi.delete(id);
            mutate(); // Refresh the list after deletion
        } 
    }

    const handleEditClick = (t: any) => {
        setForm({
            nama: t.nama, 
            pekerjaan: t.pekerjaan,
            jenis_kelamin: t.jenis_kelamin || '',
            tanggal_lahir: t.tanggal_lahir
              ? t.tanggal_lahir.split('T')[0]
              : '',
        });
        setEditingId(t.id);
    };
   

    return (
        <>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px', marginLeft: '120px', marginRight: '125px', paddingTop:'50px'} }>
                <input
                    type="text"
                    placeholder="Nama"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    required
                />
                <input
                    type="text"
                    placeholder="Pekerjaan"
                    value={form.pekerjaan}
                    onChange={(e) => setForm({ ...form, pekerjaan: e.target.value })}
                    required
                />
                <input
                    type="text"
                    placeholder="Jenis Kelamin"
                    value={form.jenis_kelamin}
                    onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })}
                    required
                />
                <input
                    type="date"
                    placeholder="Tanggal Lahir"
                    value={form.tanggal_lahir.split('T')[0]}
                    onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })}
                />
                <Button type="submit">{editingId ? 'Update' : 'Submit'}</Button>
            </form>

            <div className="container" style={{ padding: '48px 0' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Testimoni</h1>
                {isLoading ? (
                    <p>Loading...</p>
                ) : testimonis.length === 0 ? (
                    <p>No testimonis found.</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {testimonis.map((t: any) => (
                            <div key={t.id} style={{ border: '1px solid #643434ff', padding: '16px', borderRadius: '8px' }}>
                                <p><strong style={{color : 'var(--foreground)'}}>Name:</strong> {t.nama}</p>
                                <p><strong>Pekerjaan:</strong> {t.pekerjaan}</p>
                                <p><strong>Jenis Kelamin:</strong> {t.jenis_kelamin}</p>
                                <p><strong>Tanggal Lahir:</strong> {t.tanggal_lahir.split('T')[0]}</p>
                                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                    <button type="button" onClick={() => handleEditClick(t)}>Edit</button>
                                    <button type="button" onClick={() => handleDelete(t.id)}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}