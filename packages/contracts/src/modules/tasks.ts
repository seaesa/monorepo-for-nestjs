import { z } from 'zod';

import { okResponseSchema, paginated, paginationQuerySchema, zDateTime, zId } from '../common';
import { geoBounds, limits } from '../limits';
import { defineRoute } from '../route';

export const taskStatuses = ['TODO', 'IN_PROGRESS', 'DONE'] as const;
export const taskStatusSchema = z.enum(taskStatuses);
export type TaskStatus = z.output<typeof taskStatusSchema>;

export const geoPointSchema = z.object({
  latitude: z.number().min(-geoBounds.latitude).max(geoBounds.latitude),
  longitude: z.number().min(-geoBounds.longitude).max(geoBounds.longitude),
});
export type GeoPoint = z.output<typeof geoPointSchema>;

export const taskSchema = z
  .object({
    id: zId,
    title: z.string(),
    description: z.string().nullable(),
    status: taskStatusSchema,
    /** When set and the task is not done, the owner gets a reminder push at this time. */
    dueAt: zDateTime.nullable(),
    /** Where the task was created or should happen; optional. */
    location: geoPointSchema.nullable(),
    createdAt: zDateTime,
    updatedAt: zDateTime,
  })
  .meta({ id: 'Task' });
export type Task = z.output<typeof taskSchema>;

const taskFields = {
  title: z.string().trim().min(1).max(limits.taskTitle.max),
  description: z.string().trim().max(limits.taskDescription.max).nullable(),
  status: taskStatusSchema,
  dueAt: z.iso.datetime().nullable(),
  location: geoPointSchema.nullable(),
};

export const createTaskSchema = z.object({
  title: taskFields.title,
  description: taskFields.description.optional(),
  status: taskFields.status.default('TODO'),
  dueAt: taskFields.dueAt.optional(),
  location: taskFields.location.optional(),
});
export type CreateTaskInput = z.input<typeof createTaskSchema>;

/** Every field optional; `null` clears a nullable field. */
export const updateTaskSchema = z.object(taskFields).partial();
export type UpdateTaskInput = z.input<typeof updateTaskSchema>;

export const listTasksQuerySchema = paginationQuerySchema.extend({
  status: taskStatusSchema.optional(),
});
export type ListTasksQuery = z.input<typeof listTasksQuerySchema>;

export const tasksRoutes = {
  list: defineRoute({
    method: 'GET',
    path: '/tasks',
    query: listTasksQuerySchema,
    response: paginated(taskSchema),
  }),
  get: defineRoute({ method: 'GET', path: '/tasks/:id', response: taskSchema }),
  create: defineRoute({
    method: 'POST',
    path: '/tasks',
    body: createTaskSchema,
    response: taskSchema,
  }),
  update: defineRoute({
    method: 'PATCH',
    path: '/tasks/:id',
    body: updateTaskSchema,
    response: taskSchema,
  }),
  remove: defineRoute({ method: 'DELETE', path: '/tasks/:id', response: okResponseSchema }),
};
