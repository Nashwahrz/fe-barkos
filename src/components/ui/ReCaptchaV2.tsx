'use client';

import { useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    grecaptcha: {
      render: (container: HTMLElement | string, params: {
        sitekey: string;
        callback: (token: string) => void;
        'expired-callback': () => void;
        'error-callback': () => void;
        theme?: 'light' | 'dark';
        size?: 'normal' | 'compact';
      }) => number;
      reset: (widgetId?: number) => void;
    };
    onRecaptchaLoad?: () => void;
  }
}

interface ReCaptchaV2Props {
  onVerify: (token: string | null) => void;
}

let scriptLoaded = false;
const readyCallbacks: Array<() => void> = [];

function loadRecaptchaScript(onReady: () => void) {
  if (scriptLoaded) {
    onReady();
    return;
  }
  readyCallbacks.push(onReady);
  if (document.getElementById('recaptcha-script')) return;

  window.onRecaptchaLoad = () => {
    scriptLoaded = true;
    readyCallbacks.forEach((cb) => cb());
    readyCallbacks.length = 0;
  };

  const script = document.createElement('script');
  script.id = 'recaptcha-script';
  script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

export function ReCaptchaV2({ onVerify }: ReCaptchaV2Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const onVerifyRef = useRef(onVerify);

  // Keep callback ref up-to-date without re-mounting
  useEffect(() => {
    onVerifyRef.current = onVerify;
  }, [onVerify]);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || widgetIdRef.current !== null) return;
    widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
      sitekey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!,
      callback: (token: string) => onVerifyRef.current(token),
      'expired-callback': () => onVerifyRef.current(null),
      'error-callback': () => onVerifyRef.current(null),
      theme: 'light',
    });
  }, []);

  useEffect(() => {
    loadRecaptchaScript(renderWidget);
    return () => {
      widgetIdRef.current = null;
    };
  }, [renderWidget]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--foreground)' }}>
        Verifikasi CAPTCHA
      </label>
      <div
        ref={containerRef}
        style={{ borderRadius: '8px', overflow: 'hidden', display: 'inline-block' }}
      />
    </div>
  );
}
