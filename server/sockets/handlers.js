export function registerHandlers(io) {
  io.on('connection', (socket) => {
    socket.on('join:dj', ({ partyId }) => {
      if (!partyId) return;
      socket.join(`dj:${partyId}`);
    });

    socket.on('join:screen', ({ partyId }) => {
      if (!partyId) return;
      socket.join(`screen:${partyId}`);
    });

    // Invitados se unen para recibir actualizaciones de branding en vivo
    socket.on('join:guest', ({ partyId }) => {
      if (!partyId) return;
      socket.join(`guest:${partyId}`);
    });
  });
}
