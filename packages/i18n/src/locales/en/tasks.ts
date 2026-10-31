export const tasks = {
  title: 'Tasks',
  empty: 'No tasks yet. Create the first one.',
  new: 'New task',
  fields: {
    title: 'Title',
    description: 'Description',
    status: 'Status',
    dueAt: 'Due',
    location: 'Location',
  },
  statuses: { TODO: 'To do', IN_PROGRESS: 'In progress', DONE: 'Done' },
  filters: { all: 'All' },
  location: {
    attach: 'Attach my location',
    remove: 'Remove location',
    denied: 'Location permission was denied.',
  },
  deleted: 'Task deleted.',
} as const;
