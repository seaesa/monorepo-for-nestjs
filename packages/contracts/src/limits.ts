/**
 * Business limits shared by the API (validation, storage) and the apps (input `maxLength`, copy).
 * Change a value here and every schema and form follows.
 */
export const limits = {
  /** argon2 has no byte limit, but long passwords are a cheap DoS; 72 matches common policy. */
  password: { min: 8, max: 72 },
  userName: { min: 2, max: 80 },
  taskTitle: { max: 200 },
  taskDescription: { max: 2000 },
  pageSize: { default: 20, max: 100 },
  pushToken: { max: 4096 },
} as const;

/** WGS84 bounds. */
export const geoBounds = { latitude: 90, longitude: 180 } as const;
