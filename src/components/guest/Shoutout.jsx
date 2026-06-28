import { useState } from 'react';

const MAX_CHARS = 280;

export default function Shoutout({ partyId }) {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!message.trim()) { setError('Escribe tu saludo.'); return; }
    setError('');
    setStatus('sending');

    try {
      const res = await fetch(`/api/guest/${partyId}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'shoutout', message: message.trim() }),
      });

      if (res.status === 429) {
        setError('Demasiados mensajes. Espera un momento.');
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
        <p className="text-white text-xl font-semibold text-center">¡Saludo enviado!</p>
        <p className="text-white/60 text-sm text-center">El DJ lo vera en su panel.</p>
        <button
          onClick={() => { setMessage(''); setStatus('idle'); }}
          className="px-6 py-3 rounded-full bg-white/10 text-white text-sm hover:bg-white/20 transition"
        >
          Mandar otro saludo
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-white/70 text-sm">Tu saludo</label>
        <textarea
          placeholder="Ej: Feliz cumple Ana! Con amor, tus amigos."
          rows={4}
          maxLength={MAX_CHARS}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/30 border border-white/20 focus:outline-none focus:border-primary resize-none"
        />
        <p className="text-white/30 text-xs text-right">{message.length}/{MAX_CHARS}</p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        onClick={handleSend}
        disabled={status === 'sending'}
        className="w-full py-4 rounded-2xl bg-primary text-white text-lg font-bold disabled:opacity-50 hover:opacity-90 transition"
      >
        {status === 'sending' ? 'Enviando...' : 'Mandar saludo'}
      </button>
    </div>
  );
}
