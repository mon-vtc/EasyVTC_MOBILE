// ══════════════════════════════════════════════════════════════════════════════
// Socket.IO Client for Real-time Notifications
// ══════════════════════════════════════════════════════════════════════════════

import { io, Socket } from 'socket.io-client';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

let socket: Socket | null = null;

/**
 * Initializes and connects the Socket.IO client.
 * @param token The authentication token (JWT) for Socket.IO.
 */
export function initializeSocket(token: string) {
  console.log('initializeSocket called');
  console.log('token type:', typeof token);
  console.log('token value:', token ? token.substring(0, 20) + '...' : 'UNDEFINED/NULL/EMPTY');
  if (!API_URL) {
    console.error('EXPO_PUBLIC_API_URL is not defined. Cannot connect to Socket.IO.');
    return;
  }

  if (socket && socket.connected) {
    console.log('Socket already connected.');
    return;
  }

  socket = io(API_URL, {
    auth: {
      token: token,
    },
    transports: ['websocket'], // Prefer WebSocket for mobile
  });

  socket.on('connect', () => console.log('Socket.IO connected.'));
  socket.on('disconnect', () => console.log('Socket.IO disconnected.'));
  socket.on('connect_error', (err) => console.error('Socket.IO connection error:', err.message));
}

/** Disconnects the Socket.IO client. */
export function disconnectSocket() {
  if (socket) socket.disconnect();
  socket = null;
}

/** Returns the current Socket.IO instance. */
export function getSocket(): Socket | null {
  return socket;
}