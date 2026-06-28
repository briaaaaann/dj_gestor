import { useState } from 'react';

const BG_PRESETS = [
  { label: 'Noche',     value: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' },
  { label: 'Fiesta',    value: 'linear-gradient(135deg,#f093fb,#f5576c,#4776e6)' },
  { label: 'Elegante',  value: 'linear-gradient(135deg,#0d0d0d,#1a1a2e,#16213e)' },
  { label: 'Tropical',  value: 'linear-gradient(135deg,#00b09b,#096250)' },
  { label: 'Llamas',    value: 'linear-gradient(135deg,#f7971e,#c0392b)' },
  { label: 'Oceano',    value: 'linear-gradient(135deg,#2c3e50,#3498db)' },
  { label: 'Amanecer',  value: 'linear-gradient(135deg,#fc4a1a,#f7b733)' },
  { label: 'Bosque',    value: 'linear-gradient(135deg,#134e5e,#71b280)' },
];

export default function BrandingEditor({ partyId, pin, initialBranding, onSave }) {
  const [primary, setPrimary] = useState(initialBranding?.primary ?? '#7c3aed');
  const [accent, setAccent] = useState(initialBranding?.accent ?? '#f59e0b');
  const [bg, setBg] = useState(initialBranding?.bg ?? BG_PRESETS[0].value);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/party/${partyId}/branding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-dj-pin': pin },
        body: JSON.stringify({ primary, accent, bg }),
      });
      if (res.ok) {
        const data = await res.json();
        onSave?.(data.branding);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6">

      {/* Colores */}
      <section className="flex flex-col gap-3">
        <h3 className="text-white/50 text-xs uppercase tracking-widest">Colores</h3>
        <div className="flex gap-4">
          <ColorPicker label="Principal" value={primary} onChange={setPrimary} />
          <ColorPicker label="Acento" value={accent} onChange={setAccent} />
        </div>
      </section>

      {/* Fondo */}
      <section className="flex flex-col gap-3">
        <h3 className="text-white/50 text-xs uppercase tracking-widest">Fondo</h3>
        <div className="grid grid-cols-4 gap-2">
          {BG_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setBg(p.value)}
              className={`relative h-12 rounded-xl border-2 transition-all ${
                bg === p.value ? 'border-white scale-105 shadow-lg' : 'border-transparent hover:border-white/40'
              }`}
              style={{ background: p.value }}
              title={p.label}
            >
              {bg === p.value && (
                <span className="absolute inset-0 flex items-center justify-center text-white text-sm">✓</span>
              )}
            </button>
          ))}
        </div>
        <p className="text-white/30 text-xs">
          Preset seleccionado: <span className="text-white/50">
            {BG_PRESETS.find((p) => p.value === bg)?.label ?? 'Personalizado'}
          </span>
        </p>
      </section>

      {/* Vista previa */}
      <section className="flex flex-col gap-2">
        <h3 className="text-white/50 text-xs uppercase tracking-widest">Vista previa</h3>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: bg, minHeight: 120, padding: '16px 12px' }}
        >
          <p className="text-white/50 text-xs text-center mb-3">Bienvenido a</p>
          <p className="text-white text-lg font-bold text-center mb-4">Nombre del evento</p>
          {/* Tabs de muestra */}
          <div className="flex gap-1 bg-white/10 rounded-xl p-1">
            {['Foto', 'Cancion', 'Saludo'].map((t, i) => (
              <div
                key={t}
                className="flex-1 py-2 rounded-lg text-center text-xs font-medium"
                style={i === 0 ? { background: primary, color: '#fff' } : { color: 'rgba(255,255,255,0.5)' }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guardar */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-4 rounded-2xl text-white text-base font-bold transition ${
          saved
            ? 'bg-green-600'
            : 'bg-purple-600 hover:bg-purple-700 disabled:opacity-50'
        }`}
      >
        {saved ? 'Aplicado en pantalla' : saving ? 'Guardando...' : 'Guardar y aplicar'}
      </button>
    </div>
  );
}

function ColorPicker({ label, value, onChange }) {
  return (
    <label className="flex flex-col gap-1.5 cursor-pointer">
      <span className="text-white/60 text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <div
          className="relative w-10 h-10 rounded-xl border border-white/20 overflow-hidden shrink-0 cursor-pointer"
          style={{ background: value }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
        <span className="text-white/50 text-xs font-mono">{value}</span>
      </div>
    </label>
  );
}
