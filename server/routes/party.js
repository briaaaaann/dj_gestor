import { Router } from 'express';
import { randomBytes } from 'crypto';
import QRCode from 'qrcode';
import { djAuth } from '../middleware/djAuth.js';
import { setParty, getParty, updateParty, flushParty } from '../redis.js';
import { deleteByTag } from '../cloudinary.js';

// TTL de 12 h en ms — mismo valor que el TTL de Redis
const PARTY_TTL_MS = 12 * 60 * 60 * 1000;

// Limpieza lazy cuando el TTL de Redis ya expiró pero Cloudinary aún tiene assets
async function cleanupExpired(party) {
  try { await deleteByTag(`party-${party.id}`); } catch { /* best-effort */ }
  await flushParty(party.id);
}

// Comprueba si la fiesta expiró por tiempo (por si Redis se reinició sin borrar Cloudinary)
function isExpired(party) {
  return Date.now() - party.createdAt > PARTY_TTL_MS;
}

export default function createPartyRouter(io) {
  const router = Router();

  // ── Crear fiesta (DJ) ───────────────────────────────────────────────────────
  router.post('/', djAuth, async (req, res) => {
    const { name = 'Mi Fiesta' } = req.body;
    const partyId = randomBytes(4).toString('hex');
    const party = {
      id: partyId,
      name: name.slice(0, 60),
      createdAt: Date.now(),
      branding: {
        primary: '#7c3aed',
        accent: '#f59e0b',
        bg: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)',
      },
    };
    await setParty(partyId, party);
    res.json({ partyId, name: party.name });
  });

  // ── Info pública (invitado + pantalla) ─────────────────────────────────────
  router.get('/:id/public', async (req, res) => {
    const party = await getParty(req.params.id);
    if (!party) return res.status(404).json({ error: 'Fiesta no encontrada' });

    if (isExpired(party)) {
      await cleanupExpired(party);
      return res.status(404).json({ error: 'La fiesta ha expirado' });
    }

    const { id, name, branding } = party;
    res.json({ id, name, branding });
  });

  // ── Info completa (DJ) ─────────────────────────────────────────────────────
  router.get('/:id', djAuth, async (req, res) => {
    const party = await getParty(req.params.id);
    if (!party) return res.status(404).json({ error: 'Fiesta no encontrada' });

    if (isExpired(party)) {
      await cleanupExpired(party);
      return res.status(404).json({ error: 'La fiesta ha expirado' });
    }

    res.json(party);
  });

  // ── Terminar fiesta (DJ) ───────────────────────────────────────────────────
  router.delete('/:id', djAuth, async (req, res) => {
    const { id } = req.params;
    const party = await getParty(id);
    if (!party) return res.status(404).json({ error: 'Fiesta no encontrada' });

    try { await deleteByTag(`party-${id}`); } catch (e) { console.warn('[Cloudinary]', e.message); }

    await flushParty(id);
    // Notifica a Screen que la fiesta terminó
    io.to(`screen:${id}`).emit('party:ended');
    res.json({ ok: true });
  });

  // ── Actualizar branding (DJ) ───────────────────────────────────────────────
  router.put('/:id/branding', djAuth, async (req, res) => {
    const { id } = req.params;
    const { primary, accent, bg } = req.body;

    const HEX = /^#[0-9a-fA-F]{3,8}$/;
    const branding = {};
    if (primary && HEX.test(primary)) branding.primary = primary;
    if (accent && HEX.test(accent)) branding.accent = accent;
    // bg puede ser un gradiente CSS — aceptamos hasta 300 chars
    if (typeof bg === 'string' && bg.length <= 300) branding.bg = bg;

    const updated = await updateParty(id, { branding });
    if (!updated) return res.status(404).json({ error: 'Fiesta no encontrada' });

    // Propaga a Pantalla e Invitados en tiempo real
    io.to(`screen:${id}`).emit('branding:update', updated.branding);
    io.to(`guest:${id}`).emit('branding:update', updated.branding);

    res.json({ ok: true, branding: updated.branding });
  });

  // ── QR para una mesa (PNG) ─────────────────────────────────────────────────
  router.get('/:id/qr/:table', async (req, res) => {
    const { id, table } = req.params;
    const tableNum = parseInt(table, 10);
    if (!tableNum || tableNum < 1 || tableNum > 100) return res.status(400).end();

    const party = await getParty(id);
    if (!party) return res.status(404).end();

    const base = `${req.protocol}://${req.hostname}`;
    const guestUrl = `${base}/party/${id}?mesa=${tableNum}`;

    try {
      const png = await QRCode.toBuffer(guestUrl, {
        type: 'png',
        width: 400,
        margin: 2,
        color: { dark: '#1a1a2e', light: '#ffffff' },
      });
      res.set('Content-Type', 'image/png');
      res.set('Cache-Control', 'no-store');
      res.send(png);
    } catch {
      res.status(500).end();
    }
  });

  return router;
}
