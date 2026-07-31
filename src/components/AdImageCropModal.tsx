'use client';

import { useEffect, useRef, useState } from 'react';
import { Icons } from '@/components/Icons';

interface AdImageCropModalProps {
  file: File;
  aspect?: number; // width / height, e.g. 16/9
  outputWidth?: number;
  onCancel: () => void;
  onConfirm: (croppedFile: File) => void;
}

const FRAME_WIDTH = 480;

export default function AdImageCropModal({
  file,
  aspect = 16 / 9,
  outputWidth = 1280,
  onCancel,
  onConfirm,
}: AdImageCropModalProps) {
  const frameHeight = FRAME_WIDTH / aspect;

  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSrc, setImgSrc] = useState('');
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const baseScale = natural.w > 0
    ? Math.max(FRAME_WIDTH / natural.w, frameHeight / natural.h)
    : 1;
  const scale = baseScale * zoom;
  const displayW = natural.w * scale;
  const displayH = natural.h * scale;

  function clampOffset(x: number, y: number, w = displayW, h = displayH) {
    const minX = FRAME_WIDTH - w;
    const minY = frameHeight - h;
    return {
      x: Math.min(0, Math.max(minX, x)),
      y: Math.min(0, Math.max(minY, y)),
    };
  }

  const handleImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setNatural({ w, h });
    const s = Math.max(FRAME_WIDTH / w, frameHeight / h);
    setOffset({ x: (FRAME_WIDTH - w * s) / 2, y: (frameHeight - h * s) / 2 });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, origX: offset.x, origY: offset.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setOffset(clampOffset(dragState.current.origX + dx, dragState.current.origY + dy));
  };

  const onPointerUp = () => {
    dragState.current = null;
  };

  const handleZoomChange = (newZoom: number) => {
    const oldScale = baseScale * zoom;
    const newScale = baseScale * newZoom;
    // keep the frame's center point anchored while zooming
    const cx = FRAME_WIDTH / 2;
    const cy = frameHeight / 2;
    const relX = (cx - offset.x) / oldScale;
    const relY = (cy - offset.y) / oldScale;
    const newOffset = clampOffset(cx - relX * newScale, cy - relY * newScale, natural.w * newScale, natural.h * newScale);
    setZoom(newZoom);
    setOffset(newOffset);
  };

  const handleConfirm = () => {
    if (!natural.w) return;
    setProcessing(true);
    const outputHeight = Math.round(outputWidth / aspect);
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;
    if (!ctx || !img) { setProcessing(false); return; }

    const srcX = -offset.x / scale;
    const srcY = -offset.y / scale;
    const srcW = FRAME_WIDTH / scale;
    const srcH = frameHeight / scale;

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outputWidth, outputHeight);

    canvas.toBlob((blob) => {
      setProcessing(false);
      if (!blob) return;
      const croppedFile = new File([blob], file.name.replace(/\.[^.]+$/, '') + '-cropped.jpg', { type: 'image/jpeg' });
      onConfirm(croppedFile);
    }, 'image/jpeg', 0.92);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '540px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>Atur Crop Foto Iklan</h3>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
            <Icons.X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
            Geser dan perbesar foto agar bagian yang penting berada di dalam bingkai. Bingkai ini merepresentasikan tampilan iklan di halaman utama.
          </p>

          <div
            style={{
              width: `${FRAME_WIDTH}px`,
              height: `${frameHeight}px`,
              maxWidth: '100%',
              margin: '0 auto',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '10px',
              background: '#111827',
              touchAction: 'none',
              cursor: dragState.current ? 'grabbing' : 'grab',
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            {imgSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imgRef}
                src={imgSrc}
                alt=""
                onLoad={handleImgLoad}
                draggable={false}
                style={{
                  position: 'absolute',
                  left: `${offset.x}px`,
                  top: `${offset.y}px`,
                  width: `${displayW}px`,
                  height: `${displayH}px`,
                  maxWidth: 'none',
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Icons.Search size={16} color="#9ca3af" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={e => handleZoomChange(Number(e.target.value))}
              style={{ flex: 1 }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onCancel} className="btn btn-secondary" style={{ padding: '0.6rem 1.2rem', borderRadius: '8px' }}>
              Batal
            </button>
            <button type="button" onClick={handleConfirm} disabled={processing || !natural.w} className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', borderRadius: '8px' }}>
              {processing ? 'Memproses...' : 'Gunakan Foto Ini'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
