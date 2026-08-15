// A.E.G.I.S. – Socket.IO Client (web-app)
import { io, Socket } from 'socket.io-client';
import type { SocketEvents } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type ServerToClientEvents = {
  [K in keyof SocketEvents]: (payload: SocketEvents[K]) => void;
};

let socket: Socket<ServerToClientEvents, Record<string, never>> | null = null;

export function getSocket(): Socket<ServerToClientEvents, Record<string, never>> {
  if (!socket) {
    socket = io(BASE_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
    });
    socket.on('connect', () => console.log('[AEGIS Socket] Connected'));
    socket.on('disconnect', (r) => console.warn('[AEGIS Socket] Disconnected:', r));
  }
  return socket;
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
