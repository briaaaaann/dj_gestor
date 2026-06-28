import { useState, useEffect, useCallback } from 'react';
import socket from '../socket.js';
import PhotoStack from '../components/dj/PhotoStack.jsx';
import RequestQueue from '../components/dj/RequestQueue.jsx';
import QRGenerator from '../components/dj/QRGenerator.jsx';
import BrandingEditor from '../components/dj/BrandingEditor.jsx';

const STORED_PIN = 'dj_pin';
const STORED_PARTY = 'dj_partyId';

export default function DJ() {
  const [pin, setPin] = useState('');
  const [authed, setAuthed] = useState(false);
  const [pinError, setPinError] = useState('');

  const [partyId, setPartyId] = useState(() => sessionStorage.getItem(STORED_PARTY) || '');
  const [partyName, setPartyName] = useState('');
  const [partyActive, setPartyActive] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');

  const [pending, setPending] = useState([]);
  const [requests, setRequests] = useState([]);
  const [branding, setBranding] = useState(null);
  const [tab, setTab] = useState('photos');

  const [status, setStatus] = useState('');

  // Restaura PIN de sesión
  useEffect(() => {
    const saved = sessionStorage.getItem(STORED_PIN);
    if (saved) { setPin(saved); setAuthed(true); }
  }, []);

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/dj/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-dj-pin': pin },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      sessionStorage.setItem(STORED_PIN, pin);
      setAuthed(true);
      setPinError('');
    } else {
      setPinError('PIN incorrecto.');
    }
  };

  // Conecta socket y une a la sala del DJ cuando hay una fiesta activa
  useEffect(() => {
    if (!authed || !partyId) return;

    socket.connect();
    socket.emit('join:dj', { partyId, pin });

    socket.on('photo:pending', (photo) => {
      setPending((p) => [...p, photo]);
    });

    socket.on('request:new', (req) => {
      setRequests((r) => [...r, req]);
    });

    const headers = { 'x-dj-pin': pin };

    fetch(`/api/dj/${partyId}/pending`, { headers })
      .then((r) => r.ok ? r.json() : { photos: [] })
      .then((data) => setPending(data.photos || []));

    fetch(`/api/dj/${partyId}/requests`, { headers })
      .then((r) => r.ok ? r.json() : { requests: [] })
      .then((data) => setRequests(data.requests || []));

    fetch(`/api/party/${partyId}/public`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setPartyName(data.name);
          setPartyActive(true);
          if (data.branding) setBranding(data.branding);
        }
      });

    return () => {
      socket.off('photo:pending');
      socket.off('request:new');
      socket.disconnect();
    };
  }, [authed, partyId, pin]);

  const createParty = async () => {
    if (!newPartyName.trim()) return;
    const res = await fetch('/api/party', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-dj-pin': pin },
      body: JSON.stringify({ name: newPartyName.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      sessionStorage.setItem(STORED_PARTY, data.partyId);
      setPartyId(data.partyId);
      setPartyName(data.name);
      setPartyActive(true);
      setNewPartyName('');
    }
  };

  const endParty = async () => {
    if (!confirm('¿Terminar la fiesta? Se borrarán todas las fotos.')) return;
    await fetch(`/api/party/${partyId}`, {
      method: 'DELETE',
      headers: { 'x-dj-pin': pin },
    });
    sessionStorage.removeItem(STORED_PARTY);
    setPartyId('');
    setPartyName('');
    setPartyActive(false);
    setPending([]);
    socket.disconnect();
  };

  const handleApprove = useCallback(async (photo) => {
    setPending((p) => p.filter((x) => x.id !== photo.id));
    await fetch(`/api/dj/${partyId}/photo/${photo.id}/approve`, {
      method: 'POST',
      headers: { 'x-dj-pin': pin },
    });
  }, [partyId, pin]);

  const handleBrandingSave = useCallback((newBranding) => {
    setBranding(newBranding);
  }, []);

  const handleMarkDone = useCallback(async (requestId) => {
    setRequests((r) => r.map((x) => (x.id === requestId ? { ...x, done: true } : x)));
    await fetch(`/api/dj/${partyId}/request/${requestId}/done`, {
      method: 'POST',
      headers: { 'x-dj-pin': pin },
    });
  }, [partyId, pin]);

  const handleReject = useCallback(async (photo) => {
    setPending((p) => p.filter((x) => x.id !== photo.id));
    await fetch(`/api/dj/${partyId}/photo/${photo.id}/reject`, {
      method: 'POST',
      headers: { 'x-dj-pin': pin },
    });
  }, [partyId, pin]);

  // --- PIN gate ---
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-6">
        <form onSubmit={handlePinSubmit} className="w-full max-w-sm flex flex-col gap-4">
          <h1 className="text-white text-2xl font-bold text-center">Panel DJ</h1>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full px-4 py-4 rounded-xl bg-white/10 text-white text-center text-2xl tracking-widest border border-white/20 focus:outline-none focus:border-purple-500"
            autoFocus
          />
          {pinError && <p className="text-red-400 text-sm text-center">{pinError}</p>}
          <button className="w-full py-4 rounded-xl bg-purple-600 text-white text-lg font-bold hover:bg-purple-700 transition">
            Entrar
          </button>
        </form>
      </div>
    );
  }

  // --- Sin fiesta activa ---
  if (!partyActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-6">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div className="text-center">
            <span className="text-5xl">🎛️</span>
            <h1 className="text-white text-2xl font-bold mt-3">Nueva fiesta</h1>
            <p className="text-white/40 text-sm mt-1">Dale un nombre al evento para comenzar</p>
          </div>
          <input
            type="text"
            placeholder="Ej: Boda de Ana y Carlos"
            value={newPartyName}
            onChange={(e) => setNewPartyName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createParty()}
            className="w-full px-4 py-4 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:border-purple-500 placeholder-white/30"
            autoFocus
          />
          <button
            onClick={createParty}
            disabled={!newPartyName.trim()}
            className="w-full py-4 rounded-xl bg-purple-600 text-white text-lg font-bold hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Crear fiesta
          </button>
        </div>
      </div>
    );
  }

  // --- Panel principal ---
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-white/10">
        <div>
          <p className="text-white font-bold">{partyName}</p>
          <p className="text-white/40 text-xs font-mono">ID: {partyId}</p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/screen/${partyId}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition"
          >
            Pantalla
          </a>
          <button
            onClick={endParty}
            className="px-3 py-1.5 rounded-lg bg-red-600/80 text-white text-xs hover:bg-red-600 transition"
          >
            Terminar
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="flex border-b border-white/10 overflow-x-auto">
        {[
          { id: 'photos', label: `Fotos${pending.length ? ` (${pending.length})` : ''}` },
          { id: 'queue', label: `Cola${requests.filter((r) => !r.done).length ? ` (${requests.filter((r) => !r.done).length})` : ''}` },
          { id: 'qr', label: 'QR' },
          { id: 'estilo', label: 'Estilo' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 min-w-[70px] py-3 text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t.id
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 p-4 overflow-y-auto flex flex-col items-center">
        {tab === 'photos' && (
          <PhotoStack
            pending={pending}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
        {tab === 'queue' && (
          <RequestQueue requests={requests} onMarkDone={handleMarkDone} />
        )}
        {tab === 'qr' && <QRGenerator partyId={partyId} />}
        {tab === 'estilo' && branding && (
          <BrandingEditor
            partyId={partyId}
            pin={pin}
            initialBranding={branding}
            onSave={handleBrandingSave}
          />
        )}
      </main>
    </div>
  );
}
