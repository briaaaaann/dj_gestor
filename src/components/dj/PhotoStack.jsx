import { useState, useEffect, useRef, useCallback } from 'react';
import TinderCard from 'react-tinder-card';

export default function PhotoStack({ pending, onApprove, onReject }) {
  const [stack, setStack] = useState([]);
  const topRef = useRef(null);

  // Añade fotos nuevas al stack sin duplicar
  useEffect(() => {
    setStack((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const fresh = pending.filter((p) => !existingIds.has(p.id));
      return fresh.length ? [...fresh, ...prev] : prev;
    });
  }, [pending]);

  const removeFromStack = useCallback((photoId) => {
    setStack((s) => s.filter((p) => p.id !== photoId));
  }, []);

  const handleSwipe = useCallback(
    (dir, photo) => {
      removeFromStack(photo.id);
      if (dir === 'right') onApprove(photo);
      else if (dir === 'left') onReject(photo);
    },
    [onApprove, onReject, removeFromStack]
  );

  // Atajos de teclado
  useEffect(() => {
    const handler = (e) => {
      if (!topRef.current) return;
      if (e.key === 'ArrowRight') topRef.current.swipe('right');
      if (e.key === 'ArrowLeft') topRef.current.swipe('left');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!stack.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <span className="text-4xl opacity-30">📭</span>
        <p className="text-white/40 text-sm">Sin fotos pendientes</p>
      </div>
    );
  }

  const topPhoto = stack[stack.length - 1];

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Badge contador */}
      <p className="text-white/50 text-xs">
        {stack.length} foto{stack.length !== 1 ? 's' : ''} pendiente{stack.length !== 1 ? 's' : ''}
      </p>

      {/* Pila de tarjetas */}
      <div className="relative" style={{ width: 280, height: 320 }}>
        {stack.map((photo, i) => {
          const isTop = i === stack.length - 1;
          return (
            <TinderCard
              key={photo.id}
              ref={isTop ? topRef : null}
              onSwipe={(dir) => handleSwipe(dir, photo)}
              onCardLeftScreen={() => removeFromStack(photo.id)}
              preventSwipe={['up', 'down']}
            >
              <div
                style={{
                  width: 280,
                  height: 320,
                  position: 'absolute',
                  backgroundImage: `url(${photo.url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: 20,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  transform: `scale(${0.96 + i * 0.013}) translateY(${(stack.length - 1 - i) * -6}px)`,
                  zIndex: i,
                  userSelect: 'none',
                  pointerEvents: isTop ? 'auto' : 'none',
                }}
              />
            </TinderCard>
          );
        })}
      </div>

      {/* Botones */}
      <div className="flex items-center gap-8 mt-2">
        <button
          onClick={() => topRef.current?.swipe('left')}
          className="w-16 h-16 rounded-full bg-red-500 text-white text-3xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
          title="Rechazar (←)"
        >
          ✗
        </button>
        <div className="text-white/30 text-xs text-center leading-tight">
          ← rechazar<br />aprobar →
        </div>
        <button
          onClick={() => topRef.current?.swipe('right')}
          className="w-16 h-16 rounded-full bg-green-500 text-white text-3xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
          title="Aprobar (→)"
        >
          ✓
        </button>
      </div>
    </div>
  );
}
