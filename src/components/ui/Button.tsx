import React from 'react';
import Link from 'next/link';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', href, fullWidth, children, className, style, ...props }, ref) => {
    
    // Base styles
    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      borderRadius: '8px',
      fontWeight: 500,
      transition: 'all 0.2s ease',
      cursor: props.disabled ? 'not-allowed' : 'pointer',
      opacity: props.disabled ? 0.6 : 1,
      textDecoration: 'none',
      width: fullWidth ? '100%' : 'auto',
      border: '1px solid transparent',
    };

    // Variant styles
    const variantStyles: Record<string, React.CSSProperties> = {
      primary: {
        background: 'var(--primary)',
        color: '#FFFFFF',
      },
      secondary: {
        background: 'var(--card)',
        color: 'var(--foreground)',
        borderColor: 'var(--border)',
      },
      ghost: {
        background: 'transparent',
        color: 'var(--foreground)',
      },
      danger: {
        background: 'var(--danger)',
        color: '#FFFFFF',
      },
    };

    // Size styles
    const sizeStyles: Record<string, React.CSSProperties> = {
      sm: {
        padding: '8px 16px',
        fontSize: '0.8125rem',
      },
      md: {
        padding: '10px 20px',
        fontSize: '0.875rem',
      },
      lg: {
        padding: '14px 28px',
        fontSize: '1rem',
        borderRadius: '12px',
        fontWeight: 600,
      },
    };

    const combinedStyle: React.CSSProperties = {
      ...baseStyle,
      ...variantStyles[variant],
      ...sizeStyles[size],
      ...style,
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      if (props.disabled) return;
      if (variant === 'primary') {
        e.currentTarget.style.background = 'var(--primary-hover)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      } else if (variant === 'secondary') {
        e.currentTarget.style.background = 'var(--background)';
      } else if (variant === 'ghost') {
        e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
      } else if (variant === 'danger') {
        e.currentTarget.style.opacity = '0.9';
      }
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      if (props.disabled) return;
      if (variant === 'primary') {
        e.currentTarget.style.background = 'var(--primary)';
        e.currentTarget.style.transform = 'translateY(0)';
      } else if (variant === 'secondary') {
        e.currentTarget.style.background = 'var(--card)';
      } else if (variant === 'ghost') {
        e.currentTarget.style.background = 'transparent';
      } else if (variant === 'danger') {
        e.currentTarget.style.opacity = '1';
      }
    };

    if (href) {
      return (
        <Link 
          href={href} 
          style={combinedStyle as any} 
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={className}
        >
          {children}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        style={combinedStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={className}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
