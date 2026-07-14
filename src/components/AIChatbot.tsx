'use client';

import { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';
import { fetchApi } from '@/lib/api';
import Image from 'next/image';

type Message = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  mood?: CatMood;
};

// Cat mood types mapped to images
type CatMood = 'happy' | 'thinking' | 'error' | 'surprised';

const CAT_IMAGES: Record<CatMood, string> = {
  happy: '/cat-happy.png',
  thinking: '/cat-thinking.png',
  error: '/cat-error.png',
  surprised: '/cat-surprised.png',
};

// Determine the cat mood based on the AI response text
function detectMood(text: string): CatMood {
  const lower = text.toLowerCase();

  // Error / apology patterns
  if (
    lower.includes('maaf') ||
    lower.includes('error') ||
    lower.includes('gagal') ||
    lower.includes('tidak bisa') ||
    lower.includes('tidak ditemukan') ||
    lower.includes('belum ada di database') ||
    lower.includes('koneksi terputus') ||
    lower.includes('⚠️')
  ) {
    return 'error';
  }

  // Recommendation / discovery patterns
  if (
    lower.includes('rekomendasi') ||
    lower.includes('cocok') ||
    lower.includes('produk') ||
    lower.includes('ditemukan') ||
    lower.includes('menemukan') ||
    lower.includes('berikut') ||
    lower.includes('cek') ||
    lower.includes('pilihan') ||
    text.includes('](/products/')
  ) {
    return 'surprised';
  }

  // Happy / greeting / success patterns
  if (
    lower.includes('halo') ||
    lower.includes('hai') ||
    lower.includes('selamat') ||
    lower.includes('berhasil') ||
    lower.includes('semoga') ||
    lower.includes('terima kasih') ||
    lower.includes('senang') ||
    lower.includes('lokasi') ||
    lower.includes('📍')
  ) {
    return 'happy';
  }

  // Default: happy
  return 'happy';
}

// Helper function to render message and extract markdown links into mini-cards
const renderMessageWithCards = (text: string) => {
  const cards: { title: string, url: string }[] = [];
  
  // Extract links and replace with bold text
  const cleanText = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, title, url) => {
    // Avoid duplicates if AI mentions the same product twice
    if (!cards.find(c => c.url === url)) {
      cards.push({ title, url });
    }
    return `**${title}**`; 
  });

  // Simple bold parser
  const parts = cleanText.split(/(\*\*[^*]+\*\*)/g);
  const textElements = parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}</span>;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div>{textElements}</div>
      {cards.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
          {cards.map((card, i) => (
            <a key={i} href={card.url} className="ai-product-card" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px', background: 'rgba(255, 255, 255, 0.9)', 
              border: '1px solid rgba(0, 170, 91, 0.3)',
              borderRadius: '8px', textDecoration: 'none', color: 'var(--primary)',
              fontSize: '0.8rem', fontWeight: 600, boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
            }}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '85%' }}>
                {card.title}
              </span>
              <Icons.ChevronRight size={16} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', text: 'Halo! Saya Miu 🐱✨ Kucing pintar yang siap bantu kamu cari barang bekas di sekitar kos! Tanya aja ya~', mood: 'happy' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [currentMood, setCurrentMood] = useState<CatMood>('happy');
  
  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolokasi tidak didukung oleh browser Anda.');
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
        const locMsg: Message = { id: Date.now().toString(), sender: 'ai', text: '📍 Lokasi kamu berhasil didapatkan! Sekarang kamu bisa tanyakan jarak barang ke lokasimu.', mood: 'happy' };
        setMessages(prev => [...prev, locMsg]);
        setCurrentMood('happy');
      },
      (error) => {
        setIsLocating(false);
        alert('Gagal mendapatkan lokasi: ' + error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Update current mood when isTyping changes
  useEffect(() => {
    if (isTyping) {
      setCurrentMood('thinking');
    }
  }, [isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newUserMsg: Message = { id: Date.now().toString(), sender: 'user', text: inputValue };
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true);
    setCurrentMood('thinking');

    try {
      const history = messages.slice(1).map(msg => ({
        role: msg.sender === 'ai' ? 'model' : 'user',
        text: msg.text
      }));

      // Panggil backend api-barkos, biarkan backend yang menghubungi Gemini
      const response = await fetchApi('/chatbot', {
        method: 'POST',
        body: JSON.stringify({
          message: inputValue,
          history,
          lat: userLocation?.lat,
          lng: userLocation?.lng
        })
      });

      // Misalkan backend mengembalikan { text: "jawaban AI" }
      const aiText = response.text || response.answer || 'Maaf, Miu tidak mendapat jawaban dari server. Coba lagi ya! 🙏';

      const mood = detectMood(aiText);
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: aiText, mood }]);
      setCurrentMood(mood);

    } catch (error: any) {
      console.error(error);
      const errorMood: CatMood = 'error';
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'ai',
        text: error.message || 'Koneksi terputus. Pastikan server backend Anda sedang berjalan ya!',
        mood: errorMood
      }]);
      setCurrentMood('error');
    } finally {
      setIsTyping(false);
    }
  };


  return (
    <>
      {/* Responsive styles for the chatbot */}
      <style>{`
        .miu-chatbot-wrapper {
          position: fixed;
          bottom: 24px;
          right: 16px;
          z-index: 999;
        }
        .miu-chat-panel {
          position: fixed;
          bottom: 96px;
          right: 16px;
          width: 370px;
          height: 520px;
          max-height: calc(100vh - 120px);
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 20px;
          border: 1px solid rgba(0, 170, 91, 0.2);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          z-index: 1000;
        }
        @media (max-width: 480px) {
          .miu-chatbot-wrapper {
            bottom: 16px;
            right: 12px;
          }
          .miu-chat-panel {
            position: fixed;
            bottom: 0;
            right: 0;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            max-height: 100%;
            border-radius: 0;
          }
        }
        @media (min-width: 481px) and (max-width: 640px) {
          .miu-chat-panel {
            width: calc(100vw - 32px);
            max-width: 370px;
            height: 480px;
          }
        }
      `}</style>

      <div className="miu-chatbot-wrapper">
        
        {/* Panel Chat */}
        {isOpen && (
          <div className="miu-chat-panel">
            {/* Header with Cat Character */}
            <div style={{
              padding: '14px 16px', background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
              color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              position: 'relative', overflow: 'visible', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Cat Avatar in header */}
                <div style={{
                  width: '40px', height: '40px',
                  background: 'rgba(255,255,255,0.25)',
                  borderRadius: '50%', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid rgba(255,255,255,0.4)',
                  flexShrink: 0,
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={CAT_IMAGES[currentMood]}
                    alt="Miu"
                    width={36}
                    height={36}
                    style={{ objectFit: 'cover', transition: 'opacity 0.3s' }}
                  />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Miu AI</h3>
                  <p style={{ margin: 0, fontSize: '0.72rem', opacity: 0.9 }}>
                    {isTyping ? '🤔 Sedang berpikir...' : currentMood === 'error' ? '😿 Ada masalah...' : '😺 Siap membantu!'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icons.X size={18} />
              </button>
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
              {messages.map(msg => (
                <div key={msg.id} style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  display: 'flex',
                  flexDirection: msg.sender === 'ai' ? 'row' : 'row-reverse',
                  gap: '8px',
                  alignItems: 'flex-end'
                }}>
                  {/* Cat avatar for AI messages */}
                  {msg.sender === 'ai' && (
                    <div style={{
                      width: '28px', height: '28px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      flexShrink: 0,
                      background: 'var(--primary-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1.5px solid var(--primary)',
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={CAT_IMAGES[msg.mood || 'happy']}
                        alt=""
                        width={24}
                        height={24}
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  )}
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.sender === 'user' ? 'var(--primary)' : 'white',
                    color: msg.sender === 'user' ? 'white' : 'var(--foreground)',
                    boxShadow: msg.sender === 'user' ? 'none' : '0 2px 8px rgba(0,0,0,0.05)',
                    border: msg.sender === 'user' ? 'none' : '1px solid var(--border)',
                    fontSize: '0.85rem', lineHeight: 1.4,
                    wordBreak: 'break-word' as const,
                  }}>
                    {renderMessageWithCards(msg.text)}
                  </div>
                </div>
              ))}
              {/* Typing indicator with cat */}
              {isTyping && (
                <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <div style={{
                    width: '28px', height: '28px',
                    borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                    background: 'var(--primary-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1.5px solid var(--primary)',
                    animation: 'pulseAI 1.5s infinite',
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={CAT_IMAGES.thinking} alt="" width={24} height={24} style={{ objectFit: 'cover' }} />
                  </div>
                  <div style={{ background: 'white', padding: '12px 14px', borderRadius: '16px 16px 16px 4px', border: '1px solid var(--border)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <div className="typing-dot" style={{ width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%' }}></div>
                    <div className="typing-dot" style={{ width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%', animationDelay: '0.2s' }}></div>
                    <div className="typing-dot" style={{ width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%', animationDelay: '0.4s' }}></div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', marginLeft: '6px', fontWeight: 500 }}>Mikir dulu...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.95)', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
              <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder="Tanya perbandingan..."
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: '20px', border: '1px solid var(--border)',
                    background: 'var(--background)', outline: 'none', fontSize: '0.85rem',
                    color: 'var(--foreground)', transition: 'border-color 0.2s',
                    minWidth: 0,
                  }}
                />
                <button type="button" onClick={handleShareLocation} title="Bagikan Lokasi" style={{
                  background: userLocation ? 'var(--primary)' : 'rgba(0,0,0,0.05)',
                  color: userLocation ? 'white' : 'var(--foreground)', border: 'none', borderRadius: '50%', width: '38px', height: '38px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  transition: 'all 0.2s', flexShrink: 0,
                }}>
                  {isLocating ? <div className="typing-dot" style={{width: 6, height: 6, background: 'currentColor', borderRadius: '50%'}}></div> : <Icons.MapPin size={16} />}
                </button>
                <button type="submit" disabled={!inputValue.trim() || isTyping} style={{
                  background: inputValue.trim() ? 'var(--primary)' : '#ccc',
                  color: 'white', border: 'none', borderRadius: '50%', width: '38px', height: '38px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: inputValue.trim() ? 'pointer' : 'default',
                  transition: 'background 0.2s, transform 0.1s', flexShrink: 0,
                }}>
                  <Icons.Send size={16} />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tooltip Pemberitahuan */}
        {!isOpen && showTooltip && (
          <div style={{
            position: 'absolute',
            bottom: '75px',
            right: '0',
            background: 'white',
            padding: '10px 16px',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'slideUpFade 0.5s ease-out forwards',
            whiteSpace: 'nowrap',
            zIndex: 10
          }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--foreground)' }}>
              Tanya Miu yuk! 🐱✨
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}
              style={{
                background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%',
                width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--muted-foreground)'
              }}
            >
              <Icons.X size={12} />
            </button>
            {/* Segitiga panah ke bawah */}
            <div style={{
              position: 'absolute',
              bottom: '-6px',
              right: '24px',
              width: '12px',
              height: '12px',
              background: 'white',
              transform: 'rotate(45deg)',
              borderBottom: '1px solid var(--border)',
              borderRight: '1px solid var(--border)',
            }} />
          </div>
        )}

        {/* FAB Button with Cat */}
        <button 
          onClick={() => { setIsOpen(!isOpen); setShowTooltip(false); }}
          style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            color: 'white', border: '3px solid rgba(255,255,255,0.8)', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0, 170, 91, 0.35)',
            display: isOpen ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s',
            transform: isOpen ? 'scale(0.9)' : 'scale(1)',
            animation: !isOpen ? 'pulseAI 2s infinite' : 'none',
            overflow: 'hidden', padding: 0,
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            if (!isOpen) e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 25px rgba(0, 170, 91, 0.45)';
          }}
          onMouseLeave={(e) => {
            if (!isOpen) e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 170, 91, 0.35)';
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={CAT_IMAGES[currentMood]}
            alt="Miu"
            width={44}
            height={44}
            style={{ objectFit: 'cover' }}
          />
        </button>

      </div>
    </>
  );
}
