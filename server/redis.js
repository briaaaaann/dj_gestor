import IORedis from 'ioredis';

const TTL = 12 * 60 * 60; // 12 horas en segundos

export const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  enableReadyCheck: false,
  // Vuelve a intentar con backoff exponencial; se rinde tras 10 intentos (~10 s)
  retryStrategy: (times) => (times > 10 ? null : Math.min(times * 300, 3000)),
});

redis.on('error', (err) => console.error('[Redis]', err.message));

// ── Party config ──────────────────────────────────────────────────────────────

export const setParty = (id, data) =>
  redis.set(`party:${id}`, JSON.stringify(data), 'EX', TTL);

export const getParty = async (id) => {
  const raw = await redis.get(`party:${id}`);
  return raw ? JSON.parse(raw) : null;
};

// ── Pending photos (FIFO) ─────────────────────────────────────────────────────

export const pushPending = async (partyId, photo) => {
  const key = `party:${partyId}:pending`;
  await redis.rpush(key, JSON.stringify(photo));
  await redis.expire(key, TTL);
};

export const getPending = async (partyId) => {
  const raws = await redis.lrange(`party:${partyId}:pending`, 0, -1);
  return raws.map((r) => JSON.parse(r));
};

// Elimina la primera coincidencia exacta de la cadena original
export const removePending = async (partyId, photoId) => {
  const key = `party:${partyId}:pending`;
  const raws = await redis.lrange(key, 0, -1);
  const raw = raws.find((r) => JSON.parse(r).id === photoId);
  if (raw) await redis.lrem(key, 1, raw);
  return raw ? JSON.parse(raw) : null;
};

// ── Approved photos (para carrusel) ──────────────────────────────────────────

export const pushApproved = async (partyId, photo) => {
  const key = `party:${partyId}:approved`;
  await redis.rpush(key, JSON.stringify(photo));
  await redis.expire(key, TTL);
};

export const getApproved = async (partyId) => {
  const raws = await redis.lrange(`party:${partyId}:approved`, 0, -1);
  return raws.map((r) => JSON.parse(r));
};

// ── Flush de la fiesta (al terminarla) ───────────────────────────────────────

export const flushParty = (partyId) =>
  redis.del(
    `party:${partyId}`,
    `party:${partyId}:pending`,
    `party:${partyId}:approved`,
    `party:${partyId}:requests`,
    `party:${partyId}:requests:done`,
  );

// Actualiza campos de la party sin sobreescribir todo
export const updateParty = async (id, fields) => {
  const party = await getParty(id);
  if (!party) return null;
  const updated = { ...party, ...fields };
  await setParty(id, updated);
  return updated;
};

// ── Requests (canciones + saludos) ───────────────────────────────────────────

export const pushRequest = async (partyId, request) => {
  const key = `party:${partyId}:requests`;
  await redis.rpush(key, JSON.stringify(request));
  await redis.expire(key, TTL);
};

export const getRequests = async (partyId) => {
  const raws = await redis.lrange(`party:${partyId}:requests`, 0, -1);
  return raws.map((r) => JSON.parse(r));
};

// Guarda IDs "atendidos" en un Set separado para no reescribir la lista
export const markRequestDone = async (partyId, requestId) => {
  const key = `party:${partyId}:requests:done`;
  await redis.sadd(key, requestId);
  await redis.expire(key, TTL);
};

export const getDoneIds = async (partyId) => {
  const ids = await redis.smembers(`party:${partyId}:requests:done`);
  return new Set(ids);
};
