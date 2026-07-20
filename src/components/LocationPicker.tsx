'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet + Next.js
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface LocationPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

function MapEvents({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapUpdater({ lat, lng }: { lat: number, lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      try {
        map.setView([lat, lng], 15, { animate: false });
      } catch (e) {
        // ignore leaflet_pos errors on initial render
      }
    }
  }, [lat, lng, map]);
  return null;
}

export default function LocationPicker({ lat, lng, onChange }: LocationPickerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reverse Geocoding to get address name on map click/drag
  useEffect(() => {
    if (!lat || !lng) return;

    const fetchAddress = async () => {
      try {
        // Adding accept-language id to get results in Indonesian if possible
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=id`);
        const data = await res.json();
        if (data && data.display_name) {
          setSearchQuery(data.display_name);
        }
      } catch (err) {
        console.error('Failed to reverse geocode:', err);
      }
    };

    const timeout = setTimeout(fetchAddress, 500);
    return () => clearTimeout(timeout);
  }, [lat, lng]);

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
      onChange(newLat, newLng);
      setShowDropdown(false);
    }
  };

  if (!isMounted) return <div style={{ height: '340px', background: '#f5f5f5', borderRadius: '8px' }} />;

  const position: [number, number] = [lat || -0.947083, lng || 100.417181]; // Default to Padang if null

  return (
    <div style={{ width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--card)' }}>
      {/* Address Search Bar */}
      <div style={{ position: 'relative', width: '100%', zIndex: 1000 }}>
        <div style={{ display: 'flex', gap: '8px', padding: '8px 10px', background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
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
              placeholder="Cari alamat / lokasi (misal: UI Depok, Margonda)..."
              style={{
                width: '100%',
                padding: '8px 30px 8px 12px',
                borderRadius: '6px',
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
              borderRadius: '6px',
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

        {/* Dropdown Results */}
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
            maxHeight: '220px',
            overflowY: 'auto'
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

        {showDropdown && !isSearching && searchResults.length === 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '0 0 8px 8px',
            padding: '12px',
            fontSize: '0.825rem',
            textAlign: 'center',
            opacity: 0.8
          }}>
            Lokasi tidak ditemukan. Coba ketik nama jalan, kampus, atau kota yang lebih spesifik.
          </div>
        )}
      </div>

      <div style={{ height: '300px', width: '100%', position: 'relative', zIndex: 1 }}>
        <MapContainer 
          center={position} 
          zoom={13} 
          scrollWheelZoom={false} 
          style={{ height: '100%', width: '100%' }}
        >
          <MapUpdater lat={position[0]} lng={position[1]} />
          <TileLayer
            attribution='&copy; Google Maps'
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          />
          <Marker position={position} icon={defaultIcon} draggable={true} eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const newPos = marker.getLatLng();
              onChange(newPos.lat, newPos.lng);
            }
          }} />
          <MapEvents onChange={onChange} />
        </MapContainer>
      </div>

      <div style={{ padding: '0.5rem', fontSize: '0.8rem', opacity: 0.7, textAlign: 'center', background: 'var(--background)' }}>
        Ketik alamat di atas, klik pada peta, atau geser pin merah untuk menentukan lokasi.
      </div>
    </div>
  );
}
