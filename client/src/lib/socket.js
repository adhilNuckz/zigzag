import { io } from 'socket.io-client';
import useAuthStore from '../stores/authStore';

let socket = null;

export function connectSocket() {
  const token = useAuthStore.getState().token;
  if (!token || socket?.connected) return socket;

  socket = io(window.location.origin, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('[ZZ] Socket connected');
  });

  socket.on('connect_error', (err) => {
    console.log('[ZZ] Socket error:', err.message);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
