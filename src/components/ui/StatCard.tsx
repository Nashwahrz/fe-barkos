import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  accent: string;
  accentBg: string;
  footer?: React.ReactNode;
}

export function StatCard({ label, value, icon, accent, accentBg, footer }: StatCardProps) {
  return (
    <Card padding="lg" accent={accent} hoverable>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </div>
        <div style={{ background: accentBg, padding: '9px', borderRadius: '12px', color: accent, display: 'flex' }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '2.35rem', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
        {value}
      </div>
      {footer && <div style={{ fontSize: '0.85rem', marginTop: '0.75rem', fontWeight: 500 }}>{footer}</div>}
    </Card>
  );
}
