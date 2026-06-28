import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { randomBytes } from 'crypto';
import { getParty, pushPending, pushRequest } from '../redis.js';
import { uploadBuffer } from '../cloudinary.js';

const photoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas fotos enviadas. Espera antes de enviar otra.' },
});

const requestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Espera un momento.' },
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB máx (ya viene comprimida del cliente)
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(Object.assign(new Error('Solo imágenes'), { status: 400 }));
  },
});

export default function createGuestRouter(io) {
  const router = Router();

  // POST /api/guest/:partyId/photo
  router.post(
    '/:partyId/photo',
    photoLimiter,
    upload.single('photo'),
    async (req, res) => {
      const { partyId } = req.params;

      const party = await getParty(partyId);
      if (!party) return res.status(404).json({ error: 'Fiesta no encontrada' });

      if (!req.file) return res.status(400).json({ error: 'No se recibió imagen' });

      let uploadResult;
      try {
        uploadResult = await uploadBuffer(req.file.buffer, {
          tags: [`party-${partyId}`],
          // Transformación: asegura máx 1600px en Cloudinary también
          transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
        });
      } catch (e) {
        console.error('[Cloudinary upload]', e.message);
        return res.status(500).json({ error: 'Error al guardar la imagen' });
      }

      const photo = {
        id: randomBytes(6).toString('hex'),
        partyId,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        uploadedAt: Date.now(),
      };

      await pushPending(partyId, photo);

      // Notifica al DJ en tiempo real
      io.to(`dj:${partyId}`).emit('photo:pending', photo);

      res.json({ ok: true, photoId: photo.id });
    }
  );

  // POST /api/guest/:partyId/request  { type, song?, artist?, message? }
  router.post('/:partyId/request', requestLimiter, async (req, res) => {
    const { partyId } = req.params;
    const { type, song, artist, message } = req.body;

    const party = await getParty(partyId);
    if (!party) return res.status(404).json({ error: 'Fiesta no encontrada' });

    if (type === 'song') {
      if (!song?.trim()) return res.status(400).json({ error: 'Falta el nombre de la cancion' });
    } else if (type === 'shoutout') {
      if (!message?.trim()) return res.status(400).json({ error: 'Falta el mensaje' });
    } else {
      return res.status(400).json({ error: 'Tipo inválido' });
    }

    const { randomBytes } = await import('crypto');
    const request = {
      id: randomBytes(6).toString('hex'),
      partyId,
      type,
      ...(type === 'song'
        ? { song: song.trim().slice(0, 100), artist: (artist || '').trim().slice(0, 100) }
        : { message: message.trim().slice(0, 280) }),
      sentAt: Date.now(),
    };

    await pushRequest(partyId, request);
    io.to(`dj:${partyId}`).emit('request:new', request);

    res.json({ ok: true });
  });

  // Manejador de error de multer/rate-limit
  router.use((err, req, res, _next) => {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Error interno' });
  });

  return router;
}
