import { Router } from 'express';
import { djAuth } from '../middleware/djAuth.js';
import {
  getPending, getApproved, removePending, pushApproved,
  getRequests, getDoneIds, markRequestDone,
} from '../redis.js';
import { deleteAsset } from '../cloudinary.js';

// Ruta de auth simple: solo comprueba el PIN
export function authRouter() {
  const router = Router();
  router.post('/auth', djAuth, (_req, res) => res.json({ ok: true }));
  return router;
}

export default function createDjRouter(io) {
  const router = Router();

  // Fotos pendientes (carga inicial del panel)
  router.get('/:partyId/pending', djAuth, async (req, res) => {
    const photos = await getPending(req.params.partyId);
    res.json({ photos });
  });

  // Fotos aprobadas (carga inicial de la pantalla)
  router.get('/:partyId/approved', async (req, res) => {
    const photos = await getApproved(req.params.partyId);
    res.json({ photos });
  });

  // Aprobar foto
  router.post('/:partyId/photo/:photoId/approve', djAuth, async (req, res) => {
    const { partyId, photoId } = req.params;
    const photo = await removePending(partyId, photoId);
    if (!photo) return res.status(404).json({ error: 'Foto no encontrada' });

    await pushApproved(partyId, { id: photo.id, url: photo.url });

    // Emite a la pantalla para que aparezca en el carrusel sin reload
    io.to(`screen:${partyId}`).emit('photo:approved', { id: photo.id, url: photo.url });

    res.json({ ok: true });
  });

  // Cola de peticiones (carga inicial)
  router.get('/:partyId/requests', djAuth, async (req, res) => {
    const [requests, doneIds] = await Promise.all([
      getRequests(req.params.partyId),
      getDoneIds(req.params.partyId),
    ]);
    const withDone = requests.map((r) => ({ ...r, done: doneIds.has(r.id) }));
    res.json({ requests: withDone });
  });

  // Marcar petición como atendida
  router.post('/:partyId/request/:requestId/done', djAuth, async (req, res) => {
    const { partyId, requestId } = req.params;
    await markRequestDone(partyId, requestId);
    res.json({ ok: true });
  });

  // Rechazar foto
  router.post('/:partyId/photo/:photoId/reject', djAuth, async (req, res) => {
    const { partyId, photoId } = req.params;
    const photo = await removePending(partyId, photoId);
    if (!photo) return res.status(404).json({ error: 'Foto no encontrada' });

    // Borra de Cloudinary de inmediato
    try { await deleteAsset(photo.publicId); } catch (e) { console.warn('[Cloudinary delete]', e.message); }

    res.json({ ok: true });
  });

  return router;
}
