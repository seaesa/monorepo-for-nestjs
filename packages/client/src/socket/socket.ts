import { useEffect, useEffectEvent } from 'react';
import { io, type Socket } from 'socket.io-client';

import type { ClientToServerEvents, ServerToClientEvents } from '@repo/contracts';

import { getClientConfig } from '../http/client';
import { useIsAuthenticated } from '../session/auth-store';
import { tokenStorage } from '../session/token-storage';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | undefined;

export function getSocket(): AppSocket {
  const { apiUrl, auth } = getClientConfig();
  // Web sends the httpOnly access cookie with the handshake; mobile sends the bearer token.
  socket ??= io(apiUrl, {
    autoConnect: false,
    transports: ['websocket'],
    withCredentials: auth.mode === 'cookie',
    auth: (cb) => cb({ token: tokenStorage.get()?.accessToken }),
  });
  return socket;
}

/** Keeps the socket connected while signed in. Mount once. */
export function useRealtimeConnection(): void {
  const signedIn = useIsAuthenticated();

  useEffect(() => {
    if (!signedIn) return;
    const s = getSocket();
    s.connect();
    return () => {
      s.disconnect();
    };
  }, [signedIn]);
}

/** Subscribe to a server event for the component's lifetime. */
export function useSocketEvent<E extends keyof ServerToClientEvents>(
  event: E,
  handler: ServerToClientEvents[E],
): void {
  const onEvent = useEffectEvent((...args: unknown[]) =>
    (handler as (...a: unknown[]) => void)(...args),
  );

  useEffect(() => {
    const s = getSocket();
    const listener = ((...args: unknown[]) => onEvent(...args)) as never;
    s.on(event, listener);
    return () => {
      s.off(event, listener);
    };
  }, [event]);
}
