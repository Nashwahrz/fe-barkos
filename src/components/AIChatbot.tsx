'use client';

import { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';
import { fetchApi } from '@/lib/api';

type Message = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
};

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
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', text: 'Halo! Saya LapakBot ✨. Ada yang bisa saya bantu? Kalau bingung membandingkan dua barang, tanya aja ke saya!' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  
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
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: '📍 Lokasi kamu berhasil didapatkan! Sekarang kamu bisa tanyakan jarak barang ke lokasimu.' }]);
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newUserMsg: Message = { id: Date.now().toString(), sender: 'user', text: inputValue };
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true);

    // Send to Laravel Backend
    try {
      // Exclude the initial greeting from history if desired, but here we just map all except the newly added user message which we send separately.
      // Actually `messages` in state hasn't updated yet with `newUserMsg`? Wait, `setMessages` is async.
      // The current `messages` state holds everything BEFORE `newUserMsg`.
      const history = messages.slice(1).map(msg => ({
        role: msg.sender === 'ai' ? 'model' : 'user',
        text: msg.text
      }));

      const response = await fetchApi('/chatbot', {
        method: 'POST',
        body: JSON.stringify({ 
          message: inputValue,
          history: history,
          lat: userLocation?.lat,
          lng: userLocation?.lng 
        })
      });
      
      const aiResponseText = response.reply || 'Maaf, saya gagal memproses pesan tersebut.';
      
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: aiResponseText }]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        sender: 'ai', 
        text: error.message || 'Koneksi terputus. Pastikan server backend Anda sedang berjalan ya!' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '80px', right: '16px', zIndex: 999 }}>
      
      {/* Panel Chat */}
      {isOpen && (
        <div style={{
          position: 'absolute', bottom: '70px', right: '0',
          width: '340px', height: '450px',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '16px',
          border: '1px solid rgba(0, 170, 91, 0.2)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px', background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icons.Sparkles size={18} color="white" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>LapakBot AI</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.9 }}>Asisten Belanja Kos</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
              <Icons.X size={20} />
            </button>
          </div>

          {/* Chat Area */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.sender === 'user' ? 'var(--primary)' : 'white',
                color: msg.sender === 'user' ? 'white' : 'var(--foreground)',
                boxShadow: msg.sender === 'user' ? 'none' : '0 2px 8px rgba(0,0,0,0.05)',
                border: msg.sender === 'user' ? 'none' : '1px solid var(--border)',
                fontSize: '0.85rem', lineHeight: 1.4
              }}>
                {renderMessageWithCards(msg.text)}
              </div>
            ))}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', background: 'white', padding: '12px 14px', borderRadius: '16px 16px 16px 4px', border: '1px solid var(--border)', display: 'flex', gap: '4px' }}>
                <div className="typing-dot" style={{ width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%' }}></div>
                <div className="typing-dot" style={{ width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%', animationDelay: '0.2s' }}></div>
                <div className="typing-dot" style={{ width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%', animationDelay: '0.4s' }}></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.9)', borderTop: '1px solid var(--border)' }}>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Tanya perbandingan..."
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: '20px', border: '1px solid var(--border)',
                  background: 'var(--background)', outline: 'none', fontSize: '0.85rem',
                  color: 'var(--foreground)', transition: 'border-color 0.2s'
                }}
              />
              <button type="button" onClick={handleShareLocation} title="Bagikan Lokasi" style={{
                background: userLocation ? 'var(--primary)' : 'rgba(0,0,0,0.05)',
                color: userLocation ? 'white' : 'var(--foreground)', border: 'none', borderRadius: '50%', width: '38px', height: '38px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                {isLocating ? <div className="typing-dot" style={{width: 6, height: 6, background: 'currentColor', borderRadius: '50%'}}></div> : <Icons.MapPin size={16} />}
              </button>
              <button type="submit" disabled={!inputValue.trim() || isTyping} style={{
                background: inputValue.trim() ? 'var(--primary)' : '#ccc',
                color: 'white', border: 'none', borderRadius: '50%', width: '38px', height: '38px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: inputValue.trim() ? 'pointer' : 'default',
                transition: 'background 0.2s, transform 0.1s'
              }}>
                <Icons.Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
          color: 'white', border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0, 170, 91, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s',
          transform: isOpen ? 'scale(0.9)' : 'scale(1)',
          animation: !isOpen ? 'pulseAI 2s infinite' : 'none'
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 170, 91, 0.4)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 170, 91, 0.3)';
        }}
      >
        {isOpen ? <Icons.X size={24} /> : <Icons.Sparkles size={24} />}
      </button>

    </div>
  );
}
