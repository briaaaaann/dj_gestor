import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../socket.js';
import PhotoUpload from '../components/guest/PhotoUpload.jsx';
import SongRequest from '../components/guest/SongRequest.jsx';
import Shoutout from '../components/guest/Shoutout.jsx';

function applyBranding({ primary, accent, bg }) {
  const s = document.documentElement.style;
  if (primary) s.setProperty('--color-primary', primary);
  if (accent) s.setProperty('--color-accent', accent);
  if (bg) s.setProperty('--color-bg', bg);
}

const TABS = [
  { id: 'photo', label: 'Foto', icon: '📷' },
  { id: 'song', label: 'Cancion', icon: '🎵' },
  { id: 'shoutout', label: 'Saludo', icon: '💬' },
];

export default function Guest() {
  const { partyId } = useParams();
  const [tab, setTab] = useState('photo');
  const [partyName, setPartyName] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/party/${partyId}/public`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setPartyName(data.name || 'Fiesta');
        if (data.branding) applyBranding(data.branding);
      });

    // Suscripción para cambios de branding en vivo
    socket.connect();
    socket.emit('join:guest', { partyId });
    socket.on('branding:update', applyBranding);
    socket.on('party:ended', () => setNotFound(true));

    return () => {
      socket.off('branding:update');
      socket.off('party:ended');
      socket.disconnect();
    };
  }, [partyId]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-party flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-white text-xl font-bold">Fiesta no encontrada</p>
          <p className="text-white/50 text-sm mt-2">Escanea el QR de tu mesa de nuevo.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--color-bg, linear-gradient(135deg,#0f0c29,#302b63,#24243e))' }}
    >
      {/* Header */}
      <header className="pt-safe px-4 pt-6 pb-4 text-center">
        {partyName && (
          <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Bienvenido a</p>
        )}
        <h1 className="text-white text-2xl font-bold">{partyName || 'DJ Party Live'}</h1>
      </header>

      {/* Tabs */}
      <nav className="flex mx-4 mb-6 bg-white/10 rounded-2xl p-1 gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center py-3 rounded-xl text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-primary text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span className="text-xl">{t.icon}</span>
            <span className="mt-0.5">{t.label}</span>
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 px-4 pb-8">
        {tab === 'photo' && <PhotoUpload partyId={partyId} />}
        {tab === 'song' && <SongRequest partyId={partyId} />}
        {tab === 'shoutout' && <Shoutout partyId={partyId} />}
      </main>
    </div>
  );
}
