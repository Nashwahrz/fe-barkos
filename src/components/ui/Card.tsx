import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  accent?: string;
}

const paddingMap: Record<string, string> = {
  none: '0',
  sm: '1.25rem',
  md: '1.75rem',
  lg: '2.25rem',
};

export function Card({ padding = 'md', hoverable = false, accent, style, className, children, ...props }: CardProps) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '18px',
        padding: paddingMap[padding],
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease',
        ...style,
      }}
      onMouseEnter={hoverable ? (e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'var(--primary)';
      } : undefined}
      onMouseLeave={hoverable ? (e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--border)';
      } : undefined}
      {...props}
    >
      {accent && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: accent, borderRadius: '4px 0 0 4px' }} />
      )}
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, style }: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      padding: '1.5rem 1.75rem',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '1rem',
      flexWrap: 'wrap',
      background: 'var(--card)',
      ...style,
    }}>
      <div>
        <h3 style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--foreground)', letterSpacing: '-0.01em' }}>{title}</h3>
        {subtitle && <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
