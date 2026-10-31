import type { Task } from './modules/tasks';

/** Rooms are server-side only, documented here so both ends agree on naming. */
export const socketRooms = {
  user: (userId: string) => `user:${userId}`,
} as const;

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export type TaskChangedEvent = { type: 'upserted'; task: Task } | { type: 'deleted'; id: string };

/** Events the server pushes. Payloads are the same shapes the REST API returns. */
export interface ServerToClientEvents {
  notification: (notification: AppNotification) => void;
  /** Another session of the same user changed a task; refresh or patch the cache. */
  'task.changed': (event: TaskChangedEvent) => void;
}

/** Events the client may emit. Keep this small — mutations go through REST. */
export interface ClientToServerEvents {
  ping: (ack: (payload: { pong: true; at: string }) => void) => void;
}

export type ServerEvent = keyof ServerToClientEvents;
