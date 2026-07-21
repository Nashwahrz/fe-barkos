import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, style, ...props }, ref) => {
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', ...style }} className={className}>
        {label && (
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--foreground)' }}>
            {label}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {icon && (
            <div style={{ position: 'absolute', left: '12px', color: 'var(--foreground)', opacity: 0.5, display: 'flex' }}>
              {icon}
            </div>
          )}
          <input
            ref={ref}
            {...props}
            style={{
              width: '100%',
              padding: '10px 14px',
              paddingLeft: icon ? '40px' : '14px',
              borderRadius: '8px',
              border: `1px solid ${error ? 'var(--danger)' : 'var(--input-border)'}`,
              background: 'var(--input)',
              color: 'var(--foreground)',
              fontSize: '0.875rem',
              transition: 'all 0.2s ease',
              outline: 'none',
              ...style
            }}
            onFocus={(e) => {
              if (!error) {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.boxShadow = '0 0 0 3px var(--ring)';
              }
              if (props.onFocus) props.onFocus(e);
            }}
            onBlur={(e) => {
              if (!error) {
                e.currentTarget.style.borderColor = 'var(--input-border)';
                e.currentTarget.style.boxShadow = 'none';
              }
              if (props.onBlur) props.onBlur(e);
            }}
          />
        </div>
        {error && (
          <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 500 }}>
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
