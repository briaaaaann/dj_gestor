import { useState, useEffect, useRef } from 'react';

const SLIDE_DURATION = 10000;

export default function Carousel({ photos, partyName }) {
  const [current, setCurrent] = useState(0);
  const countRef = useRef(photos.length);

  useEffect(() => { countRef.current = photos.length; }, [photos.length]);

  // Avance automático — solo reinicia el intervalo cuando hay fotos por primera vez
  useEffect(() => {
    if (!photos.length) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % countRef.current);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [photos.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!photos.length) return null;

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* Slides */}
      {photos.map((photo, i) => {
        const isActive = i === current;
        return (
          <div
            key={photo.id}
            className="carousel-slide absolute inset-0"
            style={{ opacity: isActive ? 1 : 0 }}
          >
            {/* Ken Burns: zoom lento en la foto activa */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${photo.url})`,
                animation: isActive ? `kenBurns ${SLIDE_DURATION}ms linear forwards` : 'none',
              }}
            />
            {/* Viñeta sutil */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>
        );
      })}

      {/* Barra de progreso */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
        <div
          key={current}
          className="h-full bg-white/50 origin-left"
          style={{ animation: `progressFill ${SLIDE_DURATION}ms linear forwards` }}
        />
      </div>

      {/* Indicadores de posición */}
      {photos.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {photos.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-700 ${
                i === current
                  ? 'w-5 h-1.5 bg-white'
                  : 'w-1.5 h-1.5 bg-white/30'
              }`}
            />
          ))}
        </div>
      )}

      {/* Nombre del evento (esquina) */}
      {partyName && (
        <div className="absolute top-4 left-4 right-4 flex justify-end pointer-events-none">
          <span className="text-white/40 text-sm font-medium tracking-wide">
            {partyName}
          </span>
        </div>
      )}
    </div>
  );
}
