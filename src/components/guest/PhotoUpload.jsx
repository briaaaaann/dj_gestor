import { useState, useRef } from 'react';
import { compressImage } from '../../utils/compress.js';

const MAX_FILE_MB = 50; // Fotos de cámara modernas pesan 15–25 MB; se comprimen antes de subir

export default function PhotoUpload({ partyId }) {
  const [preview, setPreview] = useState(null);
  const [blob, setBlob] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | compressing | ready | uploading | done | error
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`El archivo supera ${MAX_FILE_MB} MB.`);
      return;
    }

    setError('');
    setStatus('compressing');

    try {
      const compressed = await compressImage(file);
      const url = URL.createObjectURL(compressed);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(url);
      setBlob(compressed);
      setStatus('ready');
    } catch (err) {
      const msg = err?.message || String(err);
      console.error('[PhotoUpload] compress error:', msg, err);
      setError(`Compresión: ${msg}`);
      setStatus('idle');
    }
  };

  const handleSend = async () => {
    if (!blob) return;
    setStatus('uploading');

    const form = new FormData();
    form.append('photo', blob, 'photo.jpg');

    try {
      const res = await fetch(`/api/guest/${partyId}/photo`, {
        method: 'POST',
        body: form,
      });

      if (res.status === 429) {
        setError('Ya enviaste una foto. Espera 5 minutos.');
        setStatus('ready');
        return;
      }
      if (!res.ok) {
        let serverMsg = `HTTP ${res.status}`;
        try { const d = await res.json(); serverMsg = d.error || serverMsg; } catch {}
        throw new Error(serverMsg);
      }

      setStatus('done');
    } catch (err) {
      const msg = err?.message || String(err);
      console.error('[PhotoUpload] upload error:', msg, err);
      setError(`Upload: ${msg}`);
      setStatus('ready');
    }
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setBlob(null);
    setStatus('idle');
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  if (status === 'done') {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-4xl">
          ✓
        </div>
        <p className="text-white text-xl font-semibold text-center">
          ¡Foto enviada!
        </p>
        <p className="text-white/60 text-center text-sm">
          El DJ la revisará y la proyectará si la aprueba.
        </p>
        <button
          onClick={reset}
          className="mt-2 px-6 py-3 rounded-full bg-white/10 text-white text-sm hover:bg-white/20 transition"
        >
          Enviar otra foto
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!preview ? (
        <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/30 rounded-2xl p-10 cursor-pointer hover:border-white/60 transition">
          <span className="text-5xl">📷</span>
          <span className="text-white text-lg font-medium">Tomar o elegir foto</span>
          <span className="text-white/50 text-sm">Foto o cámara · máx. {MAX_FILE_MB} MB</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
        </label>
      ) : (
        <div className="relative rounded-2xl overflow-hidden aspect-square w-full max-w-sm mx-auto">
          <img src={preview} alt="Vista previa" className="w-full h-full object-cover" />
          <button
            onClick={reset}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white text-lg flex items-center justify-center"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}

      {status === 'compressing' && (
        <p className="text-white/60 text-sm text-center">Procesando imagen...</p>
      )}

      {(status === 'ready' || status === 'uploading') && (
        <button
          onClick={handleSend}
          disabled={status === 'uploading'}
          className="w-full py-4 rounded-2xl bg-primary text-white text-lg font-bold disabled:opacity-50 hover:opacity-90 transition"
        >
          {status === 'uploading' ? 'Enviando...' : 'Enviar foto'}
        </button>
      )}
    </div>
  );
}
