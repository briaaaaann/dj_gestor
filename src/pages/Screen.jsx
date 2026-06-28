import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../socket.js';
import Carousel from '../components/screen/Carousel.jsx';

export default function Screen() {
  const { partyId } = useParams();
  const [photos, setPhotos] = useState([]);
  const [partyName, setPartyName] = useState('');

  useEffect(() => {
    // Datos iniciales en paralelo
    Promise.all([
      fetch(`/api/dj/${partyId}/approved`).then((r) => r.ok ? r.json() : { photos: [] }),
      fetch(`/api/party/${partyId}/public`).then((r) => r.ok ? r.json() : null),
    ]).then(([approvedData, publicData]) => {
      setPhotos(approvedData.photos || []);
      if (publicData) {
        setPartyName(publicData.name || '');
        if (publicData.branding) applyBranding(publicData.branding);
      }
    });

    // Socket
    socket.connect();
    socket.emit('join:screen', { partyId });

    socket.on('photo:approved', (photo) => {
      setPhotos((prev) => prev.some((p) => p.id === photo.id) ? prev : [...prev, photo]);
    });

    // Recibe actualizaciones de branding en vivo (F4)
    socket.on('branding:update', applyBranding);

    return () => {
      socket.off('photo:approved');
      socket.off('branding:update');
      socket.disconnect();
    };
  }, [partyId]);

  return (
    <div
      className="w-screen h-screen overflow-hidden relative select-none"
      style={{ background: 'var(--color-bg, #000)' }}
    >
      {photos.length > 0 ? (
        <Carousel photos={photos} partyName={partyName} />
      ) : (
        <WaitingScreen partyName={partyName} />
      )}
    </div>
  );
}

function WaitingScreen({ partyName }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8"
         style={{ background: 'var(--color-bg, linear-gradient(135deg,#0f0c29,#302b63,#24243e))' }}>
      {/* Anillos animados */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-40 h-40 rounded-full border border-white/5 animate-ping" />
        <div className="absolute w-28 h-28 rounded-full border border-white/10" />
        <span className="text-7xl">🎵</span>
      </div>

      {partyName && (
        <h1 className="text-white text-5xl font-bold text-center tracking-tight">
          {partyName}
        </h1>
      )}

      <p className="text-white/30 text-xl">
        Escanea el QR de tu mesa para participar
      </p>
    </div>
  );
}

function applyBranding({ primary, accent, bg }) {
  const s = document.documentElement.style;
  if (primary) s.setProperty('--color-primary', primary);
  if (accent) s.setProperty('--color-accent', accent);
  if (bg) s.setProperty('--color-bg', bg);
}
