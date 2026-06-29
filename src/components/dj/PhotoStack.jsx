import { useState, useEffect, useRef, useCallback } from 'react';

const SWIPE_THRESHOLD = 80;

export default function PhotoStack({ pending, onApprove, onReject }) {
  const [stack, setStack] = useState([]);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragState = useRef({ active: false, startX: 0, startY: 0, x: 0, photo: null });

  useEffect(() => {
    setStack((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const fresh = pending.filter((p) => !existingIds.has(p.id));
      return fresh.length ? [...fresh, ...prev] : prev;
    });
  }, [pending]);

  const swipeOut = useCallback(
    (dir, photo) => {
      setStack((s) => s.filter((p) => p.id !== photo.id));
      setOffset({ x: 0, y: 0 });
      dragState.current = { active: false, startX: 0, startY: 0, x: 0, photo: null };
      if (dir === 'right') onApprove(photo);
      else onReject(photo);
    },
    [onApprove, onReject],
  );

  const topPhoto = stack[stack.length - 1] ?? null;

  useEffect(() => {
    const handler = (e) => {
      if (!topPhoto) return;
      if (e.key === 'ArrowRight') swipeOut('right', topPhoto);
      if (e.key === 'ArrowLeft') swipeOut('left', topPhoto);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [topPhoto, swipeOut]);

  const handlePointerDown = (e, photo) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { active: true, startX: e.clientX, startY: e.clientY, x: 0, photo };
    setDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!dragState.current.active) return;
    const x = e.clientX - dragState.current.startX;
    const y = e.clientY - dragState.current.startY;
    dragState.current.x = x;
    setOffset({ x, y });
  };

  const handlePointerUp = () => {
    if (!dragState.current.active) return;
    const { x, photo } = dragState.current;
    dragState.current.active = false;
    setDragging(false);
    if (!photo) return;
    if (x > SWIPE_THRESHOLD) swipeOut('right', photo);
    else if (x < -SWIPE_THRESHOLD) swipeOut('left', photo);
    else setOffset({ x: 0, y: 0 });
  };

  if (!stack.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <span className="text-4xl opacity-30">📭</span>
        <p className="text-white/40 text-sm">Sin fotos pendientes</p>
      </div>
    );
  }

  const rotation = offset.x / 10;

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-white/50 text-xs">
        {stack.length} foto{stack.length !== 1 ? 's' : ''} pendiente{stack.length !== 1 ? 's' : ''}
      </p>

      <div className="relative" style={{ width: 280, height: 320 }}>
        {/* Cartas de fondo */}
        {stack.slice(0, -1).map((photo, i) => (
          <div
            key={photo.id}
            style={{
              position: 'absolute', width: 280, height: 320,
              backgroundImage: `url(${photo.url})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              transform: `scale(${0.93 + i * 0.035}) translateY(${(stack.length - 2 - i) * -8}px)`,
              zIndex: i,
            }}
          />
        ))}

        {/* Carta superior — arrastrable */}
        {topPhoto && (
          <div
            onPointerDown={(e) => handlePointerDown(e, topPhoto)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              position: 'absolute', width: 280, height: 320,
              backgroundImage: `url(${topPhoto.url})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
              transition: dragging ? 'none' : 'transform 0.3s ease',
              zIndex: stack.length,
              cursor: dragging ? 'grabbing' : 'grab',
              touchAction: 'none', userSelect: 'none',
            }}
          >
            {offset.x > 30 && (
              <div style={{ position: 'absolute', inset: 0, borderRadius: 20, background: 'rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 48, fontWeight: 900, transform: 'rotate(-15deg)', border: '4px solid #fff', borderRadius: 12, padding: '4px 16px' }}>✓</span>
              </div>
            )}
            {offset.x < -30 && (
              <div style={{ position: 'absolute', inset: 0, borderRadius: 20, background: 'rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 48, fontWeight: 900, transform: 'rotate(15deg)', border: '4px solid #fff', borderRadius: 12, padding: '4px 16px' }}>✗</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-8 mt-2">
        <button
          onClick={() => topPhoto && swipeOut('left', topPhoto)}
          className="w-16 h-16 rounded-full bg-red-500 text-white text-3xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
          title="Rechazar (←)"
        >✗</button>
        <div className="text-white/30 text-xs text-center leading-tight">← rechazar<br />aprobar →</div>
        <button
          onClick={() => topPhoto && swipeOut('right', topPhoto)}
          className="w-16 h-16 rounded-full bg-green-500 text-white text-3xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
          title="Aprobar (→)"
        >✓</button>
      </div>
    </div>
  );
}
