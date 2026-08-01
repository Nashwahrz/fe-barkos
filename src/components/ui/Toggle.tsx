import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
}

export function Toggle({ checked, onChange, disabled, label }: ToggleProps) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
      <span
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        style={{
          width: '42px',
          height: '24px',
          borderRadius: '999px',
          background: checked ? 'var(--primary)' : 'var(--border)',
          position: 'relative',
          transition: 'background 0.2s ease',
          flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute',
          top: '3px',
          left: checked ? '21px' : '3px',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }} />
      </span>
      {label && <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--foreground)' }}>{label}</span>}
    </label>
  );
}
