import { useCallback } from 'react';

function timeAgo(ms) {
  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  return `hace ${Math.floor(diff / 3600)} h`;
}

function SongBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium">
      Cancion
    </span>
  );
}

function ShoutoutBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium">
      Saludo
    </span>
  );
}

export default function RequestQueue({ requests, onMarkDone }) {
  const pending = requests.filter((r) => !r.done);
  const done = requests.filter((r) => r.done);

  if (!requests.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <span className="text-4xl opacity-30">🎵</span>
        <p className="text-white/40 text-sm">Sin peticiones aun</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-2">
      {/* Pendientes */}
      {pending.length > 0 && (
        <>
          <p className="text-white/40 text-xs uppercase tracking-widest px-1">
            Pendientes ({pending.length})
          </p>
          {pending.map((req) => (
            <RequestCard key={req.id} req={req} onMarkDone={onMarkDone} />
          ))}
        </>
      )}

      {/* Atendidas */}
      {done.length > 0 && (
        <>
          <p className="text-white/30 text-xs uppercase tracking-widest px-1 mt-4">
            Atendidas ({done.length})
          </p>
          {done.map((req) => (
            <RequestCard key={req.id} req={req} onMarkDone={onMarkDone} dimmed />
          ))}
        </>
      )}
    </div>
  );
}

function RequestCard({ req, onMarkDone, dimmed = false }) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl border transition-opacity ${
        dimmed
          ? 'bg-white/3 border-white/5 opacity-40'
          : 'bg-white/8 border-white/10'
      }`}
    >
      {/* Icono */}
      <div className="text-xl mt-0.5 select-none">
        {req.type === 'song' ? '🎵' : '💬'}
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {req.type === 'song' ? <SongBadge /> : <ShoutoutBadge />}
          <span className="text-white/30 text-xs">{timeAgo(req.sentAt)}</span>
        </div>

        {req.type === 'song' ? (
          <p className="text-white text-sm font-medium truncate">
            {req.song}
            {req.artist && (
              <span className="text-white/50 font-normal"> — {req.artist}</span>
            )}
          </p>
        ) : (
          <p className="text-white text-sm leading-snug break-words">{req.message}</p>
        )}
      </div>

      {/* Botón */}
      {!dimmed && (
        <button
          onClick={() => onMarkDone(req.id)}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-green-600/70 text-white text-xs font-medium hover:bg-green-600 transition"
        >
          Listo
        </button>
      )}
    </div>
  );
}
