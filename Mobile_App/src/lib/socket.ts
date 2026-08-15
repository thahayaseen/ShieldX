// ============================================================
// A.E.G.I.S. – Socket.IO Client (Mobile)
// Single singleton — connect once, reuse everywhere.
// ============================================================

import { io, Socket } from 'socket.io-client';
import type { SocketEvents } from '@/types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

type ServerToClientEvents = {
  [K in keyof SocketEvents]: (payload: SocketEvents[K]) => void;
};

type ClientToServerEvents = Record<string, never>;

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
let lastErrorLogged = 0;

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket) {
    socket = io(BASE_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
      timeout: 5000,
    });

    socket.on('connect', () => {
      console.log('[AEGIS Socket] Connected to Command Center:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      if (reason !== 'io client disconnect') {
        // quiet disconnect
      }
    });

    socket.on('connect_error', () => {
      // Throttle connection logs so console isn't spammed when backend is offline
      const now = Date.now();
      if (now - lastErrorLogged > 30000) {
        lastErrorLogged = now;
        console.log('[AEGIS Socket] Backend offline at ' + BASE_URL + ' — running in standalone simulator mode.');
      }
    });
  }

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function onSocketEvent<K extends keyof SocketEvents>(
  event: K,
  handler: (payload: SocketEvents[K]) => void
): () => void {
  const sock = getSocket();
  // @ts-expect-error typed socket cast
  sock.on(event, handler);
  return () => {
    // @ts-expect-error
    sock.off(event, handler);
  };
}
