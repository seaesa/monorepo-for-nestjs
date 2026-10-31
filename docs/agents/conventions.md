# Conventions

## Language

English for every identifier, file name, comment, log line, commit and doc. Only the
`packages/i18n/src/locales/<locale>` dictionaries contain other languages.

## Naming

| Thing                  | Rule                                                      | Examples                                                         |
| ---------------------- | --------------------------------------------------------- | ---------------------------------------------------------------- |
| Files, folders         | kebab-case; suffix states the role                        | `tasks.service.ts`, `task-list.tsx`, `use-current-location.ts`   |
| Feature folders        | the business noun, plural when it is a collection         | `tasks`, `auth`, `settings`, `devices`                           |
| Components             | PascalCase noun phrase, feature-prefixed inside a feature | `TaskList`, `TaskCreateForm`, `LoginForm`                        |
| Hooks                  | `use` + what it gives or does                             | `useCurrentLocation`, `usePushNotifications`, `useTasksRealtime` |
| Query hooks            | `use<Entity>Query`, `use<Verb><Entity>Mutation`           | `useTasksQuery`, `useCreateTaskMutation`                         |
| Query key factories    | `<entity>Keys`                                            | `taskKeys.list(query)`                                           |
| Functions              | verb + object, says the outcome                           | `registerForPush`, `reminderDelay`, `translateError`             |
| Booleans               | `is/has/can/should` or a past participle                  | `isReminderDue`, `signedIn`, `done`                              |
| Event handlers / props | `onX` for props, `handleX` only when a name adds meaning  | `onChange`, `onSubmit`                                           |
| Schemas                | `<thing>Schema`; types drop the suffix                    | `createTaskSchema` → `CreateTaskInput`                           |
| Constants / enums      | `UPPER_SNAKE` values, PascalCase const objects            | `ErrorCode.TASK_NOT_FOUND`, `QueueName.REMINDERS`                |
| i18n keys              | camelCase, grouped by concept, never by component         | `tasks.fields.dueAt`, `auth.login.submit`                        |
| Realtime events        | `<entity>.<pastTenseVerb>`                                | `task.changed`                                                   |
| Error codes            | `<ENTITY>_<PROBLEM>` or `<DOMAIN>_<PROBLEM>`              | `TASK_NOT_FOUND`, `AUTH_TOKEN_EXPIRED`                           |

Avoid: `utils2`, `helpers`, `manager`, `data`, `info`, `handleClick` on a list of 5 buttons,
abbreviations (`usr`, `cfg`), and names that describe the type instead of the meaning (`taskObj`).

## Placement: a worked example

> "I need a hook that gives the current GPS position for the task form on mobile."

1. Not API shape, not text, not a token. Not shareable (needs `expo-location`): not `packages/client`.
2. Is it task-specific? No: any feature could attach a location. So not `features/tasks`.
3. It is a device capability → `apps/mobile/src/device/location/use-current-location.ts`,
   exported as `useCurrentLocation()`, returning `{ locate, status }`.
4. The task form owns the UI around it (`features/tasks/components/location-field.tsx`).

Same reasoning for anything else: the most specific home that every user of the code can import
without breaking a boundary. If only one component uses it, keep it in that component's file.

## Exports and files

- Named exports only (except Next.js/Expo route files, which must default-export).
- One main export per file; small private helpers stay in the same file.
- A package exposes its public API from `src/index.ts` only.
- No barrel files inside apps.

## Comments

Write a comment only when it carries information the code can't:

- a business rule (`// Another owner's task is "not found": don't reveal it exists.`),
- a non-obvious constraint (`// Android has no combined date-time dialog.`),
- a workaround with its reason and, if any, the condition to remove it.

Use `/** … */` on exported functions/types only when the name and types don't fully explain the
contract. Never: restate the code, leave commented-out code, write TODOs without an owner/issue,
or keep change logs in comments.

## Code shape

- Prefer plain functions and data over classes, except where the framework needs them (Nest).
- Early returns over nested conditions. No `else` after `return`.
- Handle errors where you can do something about them; otherwise let them propagate to the global
  handler (API filter, react-query `onError`, form `setServerErrors`).
- No `any`; no `as` casts except at a verified boundary, with the reason.
- Pure business rules in their own module (`*.policy.ts`) so they can be tested in isolation.
