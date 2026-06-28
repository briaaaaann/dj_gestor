import { useState } from 'react';

export default function SongRequest({ partyId }) {
  const [song, setSong] = useState('');
  const [artist, setArtist] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!song.trim()) { setError('Escribe el nombre de la canción.'); return; }
    setError('');
    setStatus('sending');

    try {
      const res = await fetch(`/api/guest/${partyId}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'song', song: song.trim(), artist: artist.trim() }),
      });

      if (res.status === 429) {
        setError('Demasiadas peticiones. Espera un momento.');
        setStatus('idle');
        return;
      }
      if (!res.ok) throw new Error();
      setStatus('done');
    } catch {
      setError('Error al enviar. Intenta de nuevo.');
      setStatus('idle');
    }
  };

  if (status === 'done') {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-4xl">
          ✓
        </div>
        <p className="text-white text-xl font-semibold text-center">¡Peticion enviada!</p>
        <p className="text-white/60 text-sm text-center">El DJ la vera en su cola.</p>
        <button
          onClick={() => { setSong(''); setArtist(''); setStatus('idle'); }}
          className="px-6 py-3 rounded-full bg-white/10 text-white text-sm hover:bg-white/20 transition"
        >
          Pedir otra cancion
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-white/70 text-sm">Nombre de la cancion *</label>
        <input
          type="text"
          placeholder="Ej: La Bamba"
          maxLength={100}
          value={song}
          onChange={(e) => setSong(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/30 border border-white/20 focus:outline-none focus:border-primary"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-white/70 text-sm">Artista (opcional)</label>
        <input
          type="text"
          placeholder="Ej: Ritchie Valens"
          maxLength={100}
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/30 border border-white/20 focus:outline-none focus:border-primary"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        onClick={handleSend}
        disabled={status === 'sending'}
        className="w-full py-4 rounded-2xl bg-primary text-white text-lg font-bold disabled:opacity-50 hover:opacity-90 transition"
      >
        {status === 'sending' ? 'Enviando...' : 'Pedir cancion'}
      </button>
    </div>
  );
}
