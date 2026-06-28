import { io } from 'socket.io-client';

// autoConnect: false — cada vista conecta explícitamente cuando lo necesita.
// Los valores de reconexión cubren el cold-start del free tier de Render (~30 s).
const socket = io({
  autoConnect: false,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 8000,
  reconnectionAttempts: Infinity,
  timeout: 20000,
});

export default socket;
