import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { redis } from './redis.js';
import createPartyRouter from './routes/party.js';
import createGuestRouter from './routes/guest.js';
import createDjRouter, { authRouter } from './routes/dj.js';
import { registerHandlers } from './sockets/handlers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  // En producción el frontend y la API comparten origen → no se necesita CORS
  cors: isProd ? false : { origin: '*' },
  // Mantiene conexiones vivas a través del proxy de Render (timeout 60 s)
  pingInterval: 20000,
  pingTimeout: 15000,
});

app.set('trust proxy', 1); // Render pone la IP real en X-Forwarded-For
app.use(express.json());

// ── Health check (Render lo usa para saber si el servicio está vivo) ──────────
app.get('/api/health', async (_req, res) => {
  try {
    await redis.ping();
    res.json({ ok: true, ts: Date.now() });
  } catch {
    res.status(503).json({ ok: false, redis: 'unreachable' });
  }
});

// ── API ───────────────────────────────────────────────────────────────────────
app.use('/api/party', createPartyRouter(io));
app.use('/api/guest', createGuestRouter(io));
app.use('/api/dj', authRouter());
app.use('/api/dj', createDjRouter(io));

// ── Frontend estático (build de Vite) ─────────────────────────────────────────
const publicDir = join(__dirname, 'public');
const indexHtml = join(publicDir, 'index.html');

app.use(express.static(publicDir));
app.get('*', (_req, res) => {
  if (existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.status(503).send('Frontend no compilado. Ejecuta: npm run build');
  }
});

// ── Socket.IO ─────────────────────────────────────────────────────────────────
registerHandlers(io);

// ── Inicio ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`[server] http://localhost:${PORT}  (${isProd ? 'production' : 'development'})`);
});

// ── Apagado limpio (Render envía SIGTERM antes de reiniciar) ──────────────────
const shutdown = () => {
  console.log('[server] SIGTERM recibido, cerrando...');
  httpServer.close(() => {
    redis.quit().catch(() => {}).finally(() => process.exit(0));
  });
  // Fuerza salida si httpServer.close() tarda más de 10 s
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('unhandledRejection', (reason) => {
  console.error('[server] unhandledRejection:', reason);
});
