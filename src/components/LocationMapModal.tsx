'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, CircleMarker, Popup, useMap } from 'react-leaflet';

interface LocationMapModalProps {
  lat: number;
  lng: number;
  products?: any[];
  onClose: () => void;
  onSearch: (lat: number, lng: number, radius: number) => void;
}

function MapCenterUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 13);
    }
  }, [lat, lng, map]);
  return null;
}

export default function LocationMapModal({ lat, lng, products = [], onClose, onSearch }: LocationMapModalProps) {
  const [radius, setRadius] = useState(5000); // 5km default
  const [showMap, setShowMap] = useState(false);
  const [currentLat, setCurrentLat] = useState(lat);
  const [currentLng, setCurrentLng] = useState(lng);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Delay map rendering slightly to avoid React StrictMode double-mount crashes with Leaflet
  useEffect(() => {
    const timer = setTimeout(() => setShowMap(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Need to fix leaflet default icon issue dynamically
  useEffect(() => {
    import('leaflet').then(L => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    });
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowDropdown(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=id`);
      const data = await res.json();
      setSearchResults(data || []);
    } catch (err) {
      console.error('Failed to search address:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (item: any) => {
    const newLat = parseFloat(item.lat);
    const newLng = parseFloat(item.lon);
    if (!isNaN(newLat) && !isNaN(newLng)) {
      setCurrentLat(newLat);
      setCurrentLng(newLng);
      setShowDropdown(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, 
      background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '600px', padding: '1.5rem', background: 'var(--card)', color: 'var(--foreground)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Lokasi Pencarian</h2>
        <p style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '1.25rem' }}>Cari alamat atau atur radius titik pencarian kos/barang bekas.</p>
        
        {/* Address Search Bar */}
        <div style={{ position: 'relative', width: '100%', marginBottom: '1rem', zIndex: 100 }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                placeholder="Ketik alamat / nama tempat (misal: UI Depok, Kelapa Gading)..."
                style={{
                  width: '100%',
                  padding: '8px 30px 8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: '0.85rem'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSearchResults([]); setShowDropdown(false); }}
                  style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: '0.9rem', color: 'var(--foreground)' }}
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => handleSearch(e)}
              disabled={isSearching || !searchQuery.trim()}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                opacity: (isSearching || !searchQuery.trim()) ? 0.6 : 1
              }}
            >
              {isSearching ? 'Mencari...' : 'Cari Alamat'}
            </button>
          </div>

          {/* Search Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <ul style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '0 0 8px 8px',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
              listStyle: 'none',
              margin: 0,
              padding: '4px 0',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 1000
            }}>
              {searchResults.map((result, idx) => (
                <li 
                  key={result.place_id || idx}
                  onClick={() => handleSelectResult(result)}
                  style={{
                    padding: '10px 12px',
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                    borderBottom: idx < searchResults.length - 1 ? '1px solid var(--border)' : 'none',
                    color: 'var(--foreground)'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ fontWeight: 600, marginBottom: '2px' }}>📍 {result.display_name.split(',')[0]}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {result.display_name}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ width: '100%', height: '300px', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem', border: '1px solid var(--border)', position: 'relative' }}>
          {!showMap && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', zIndex: 10 }}>
              <span>Memuat Peta...</span>
            </div>
          )}
          {showMap && (
            <MapContainer center={[currentLat, currentLng]} zoom={13} style={{ width: '100%', height: '100%', zIndex: 1 }}>
              <MapCenterUpdater lat={currentLat} lng={currentLng} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* User Location Marker */}
              <Marker position={[currentLat, currentLng]} />
              <Circle center={[currentLat, currentLng]} pathOptions={{ fillColor: 'var(--primary)', color: 'var(--primary)' }} radius={radius} />

              {/* Product Markers */}
              {products.map(p => {
                if (!p.latitude || !p.longitude) return null;
                const pLat = parseFloat(p.latitude);
                const pLng = parseFloat(p.longitude);
                if (isNaN(pLat) || isNaN(pLng)) return null;

                return (
                  <CircleMarker 
                    key={p.id} 
                    center={[pLat, pLng]}
                    radius={7}
                    pathOptions={{ color: 'white', fillColor: 'var(--primary)', fillOpacity: 0.9, weight: 2 }}
                  >
                    <Popup>
                    <div style={{ padding: '4px', textAlign: 'left', minWidth: '180px' }}>
                      <strong style={{ display: 'block', marginBottom: '4px', fontSize: '0.95rem' }}>{p.nama_barang}</strong>
                      
                      {p.deskripsi && (
                         <p style={{ 
                           fontSize: '0.8rem', margin: '6px 0', color: 'gray', 
                           display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' 
                         }}>
                           {p.deskripsi}
                         </p>
                      )}
                      
                      <span style={{ color: 'var(--primary)', fontWeight: 'bold', display: 'block', margin: '8px 0' }}>
                        Rp {Number(p.harga).toLocaleString('id-ID')}
                      </span>

                      <a href={`/products/${p.id}`} style={{ 
                        display: 'block', textAlign: 'center', background: 'var(--primary)', 
                        color: 'white', padding: '8px 12px', borderRadius: '6px', 
                        textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
                        marginTop: '12px'
                      }}>
                        Lihat Detail
                      </a>
                    </div>
                  </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 600 }}>Radius Pencarian</span>
            <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{radius / 1000} km</span>
          </div>
          <input 
            type="range" 
            min="1000" max="20000" step="1000"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={onClose} className="btn" style={{ flex: 1, border: '1px solid var(--border)', background: 'transparent' }}>
            Batal
          </button>
          <button onClick={() => onSearch(currentLat, currentLng, radius)} className="btn btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            Cari Sekitar Sini
          </button>
        </div>
      </div>
    </div>
  );
}
