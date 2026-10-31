import { authRoutes } from './modules/auth';
import { devicesRoutes } from './modules/devices';
import { healthRoutes } from './modules/health';
import { tasksRoutes } from './modules/tasks';

export * from './common';
export * from './errors';
export * from './limits';
export * from './route';
export * from './socket';
export * from './validation';
export * from './modules/auth';
export * from './modules/devices';
export * from './modules/health';
export * from './modules/tasks';

/** All REST endpoints, grouped by module. `contract.<module>.<action>`. */
export const contract = {
  auth: authRoutes,
  devices: devicesRoutes,
  health: healthRoutes,
  tasks: tasksRoutes,
};
