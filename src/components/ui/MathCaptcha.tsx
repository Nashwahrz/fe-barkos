'use client';

import { useState, useEffect, useCallback } from 'react';

interface MathCaptchaProps {
  onVerify: (verified: boolean) => void;
}

type Operator = '+' | '-' | '×';

function generateQuestion(): { question: string; answer: number } {
  const operators: Operator[] = ['+', '-', '×'];
  const op = operators[Math.floor(Math.random() * operators.length)];

  let a: number, b: number, answer: number;

  if (op === '+') {
    a = Math.floor(Math.random() * 20) + 1;
    b = Math.floor(Math.random() * 20) + 1;
    answer = a + b;
  } else if (op === '-') {
    a = Math.floor(Math.random() * 20) + 10;
    b = Math.floor(Math.random() * 10) + 1;
    answer = a - b;
  } else {
    a = Math.floor(Math.random() * 9) + 2;
    b = Math.floor(Math.random() * 9) + 2;
    answer = a * b;
  }

  return { question: `${a} ${op} ${b}`, answer };
}

export function MathCaptcha({ onVerify }: MathCaptchaProps) {
  const [captcha, setCaptcha] = useState<{ question: string; answer: number }>({ question: '', answer: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [shakeKey, setShakeKey] = useState(0);

  const refresh = useCallback(() => {
    setCaptcha(generateQuestion());
    setUserAnswer('');
    setStatus('idle');
    onVerify(false);
  }, [onVerify]);

  useEffect(() => {
    refresh();
  }, []);  // run once on mount

  const handleChange = (value: string) => {
    setUserAnswer(value);
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) {
      if (parsed === captcha.answer) {
        setStatus('correct');
        onVerify(true);
      } else {
        setStatus('wrong');
        onVerify(false);
        if (value.length >= captcha.answer.toString().length) {
          setShakeKey((k) => k + 1);
        }
      }
    } else {
      setStatus('idle');
      onVerify(false);
    }
  };

  const borderColor =
    status === 'correct'
      ? 'var(--success, #16a34a)'
      : status === 'wrong'
      ? 'var(--danger, #dc2626)'
      : 'var(--input-border)';

  const bgColor =
    status === 'correct'
      ? 'rgba(22, 163, 74, 0.06)'
      : status === 'wrong'
      ? 'rgba(220, 38, 38, 0.06)'
      : 'var(--input)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label
        style={{
          fontSize: '0.875rem',
          fontWeight: 500,
          color: 'var(--foreground)',
        }}
      >
        Verifikasi CAPTCHA
      </label>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 14px',
          background: 'var(--input)',
          border: '1px solid var(--input-border)',
          borderRadius: '10px',
        }}
      >
        {/* Shield icon area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            flexShrink: 0,
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        {/* Question */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--foreground)',
              opacity: 0.55,
              marginBottom: '2px',
              fontWeight: 500,
              letterSpacing: '0.02em',
            }}
          >
            Jawab pertanyaan berikut:
          </div>
          <div
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--foreground)',
              letterSpacing: '-0.01em',
              fontFamily: 'monospace',
            }}
          >
            {captcha.question} = ?
          </div>
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={refresh}
          title="Ganti soal"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            color: 'var(--foreground)',
            opacity: 0.4,
            transition: 'opacity 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.4')}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>

      {/* Answer input */}
      <div
        key={shakeKey}
        style={{
          animation: status === 'wrong' && shakeKey > 0 ? 'captchaShake 0.35s ease' : 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '0 14px',
            height: '46px',
            background: bgColor,
            border: `1.5px solid ${borderColor}`,
            borderRadius: '10px',
            transition: 'border-color 0.2s, background 0.2s',
          }}
        >
          <input
            type="number"
            placeholder="Masukkan jawaban…"
            value={userAnswer}
            onChange={(e) => handleChange(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '0.9rem',
              color: 'var(--foreground)',
              appearance: 'textfield',
            }}
          />

          {status === 'correct' && (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#16a34a"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {status === 'wrong' && (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#dc2626"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </div>

        {status === 'wrong' && (
          <p
            style={{
              marginTop: '4px',
              fontSize: '0.75rem',
              color: 'var(--danger, #dc2626)',
              fontWeight: 500,
            }}
          >
            Jawaban salah. Coba lagi atau klik ikon refresh untuk soal baru.
          </p>
        )}
        {status === 'correct' && (
          <p
            style={{
              marginTop: '4px',
              fontSize: '0.75rem',
              color: '#16a34a',
              fontWeight: 500,
            }}
          >
            ✓ Verifikasi berhasil!
          </p>
        )}
      </div>

      <style>{`
        @keyframes captchaShake {
          0%   { transform: translateX(0); }
          20%  { transform: translateX(-6px); }
          40%  { transform: translateX(6px); }
          60%  { transform: translateX(-4px); }
          80%  { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
