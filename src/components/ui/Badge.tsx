import React from 'react';

type BadgeTone = 'primary' | 'success' | 'danger' | 'warning' | 'neutral';

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

const toneVars: Record<BadgeTone, { color: string; bg: string; border: string }> = {
  primary: { color: 'var(--primary)', bg: 'var(--primary-light)', border: 'rgba(13, 148, 136, 0.25)' },
  success: { color: 'var(--success)', bg: 'rgba(5, 150, 105, 0.1)', border: 'rgba(5, 150, 105, 0.25)' },
  danger: { color: 'var(--danger)', bg: 'rgba(220, 38, 38, 0.1)', border: 'rgba(220, 38, 38, 0.25)' },
  warning: { color: 'var(--warning)', bg: 'rgba(217, 119, 6, 0.1)', border: 'rgba(217, 119, 6, 0.25)' },
  neutral: { color: 'var(--muted-foreground)', bg: 'var(--input)', border: 'var(--border)' },
};

export function Badge({ tone = 'neutral', children, icon, style }: BadgeProps) {
  const t = toneVars[tone];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '5px 12px',
      borderRadius: '999px',
      fontSize: '0.72rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      color: t.color,
      background: t.bg,
      border: `1px solid ${t.border}`,
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {icon}
      {children}
    </span>
  );
}
