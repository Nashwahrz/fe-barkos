'use client';

import React from 'react';

export function Skeleton({ 
  className = '', 
  width, 
  height, 
  borderRadius = '8px',
  style = {} 
}: { 
  className?: string; 
  width?: string | number; 
  height?: string | number; 
  borderRadius?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div 
      className={`skeleton-base ${className}`}
      style={{
        width: width,
        height: height,
        borderRadius: borderRadius,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-loading 1.5s infinite linear',
        ...style
      }}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div style={{
      background: 'white',
      borderRadius: '10px',
      border: '1px solid #e5e7eb',
      overflow: 'hidden',
      paddingBottom: '1rem'
    }}>
      <Skeleton height="190px" borderRadius="0" />
      <div style={{ padding: '0.875rem 1rem' }}>
        <Skeleton width="80%" height="1.2rem" style={{ marginBottom: '8px' }} />
        <Skeleton width="40%" height="1.5rem" style={{ marginBottom: '12px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton width="50px" height="20px" borderRadius="10px" />
          <Skeleton width="60px" height="15px" />
        </div>
      </div>
    </div>
  );
}

export function OrderItemSkeleton() {
  return (
    <div style={{ 
      display: 'flex', 
      gap: '1rem', 
      alignItems: 'center', 
      padding: '1rem',
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb'
    }}>
      <Skeleton width="72px" height="72px" borderRadius="12px" />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <Skeleton width="60%" height="1rem" />
          <Skeleton width="80px" height="20px" borderRadius="9999px" />
        </div>
        <Skeleton width="40%" height="0.8rem" style={{ marginBottom: '8px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton width="100px" height="1.2rem" />
          <Skeleton width="40px" height="0.8rem" />
        </div>
      </div>
    </div>
  );
}
