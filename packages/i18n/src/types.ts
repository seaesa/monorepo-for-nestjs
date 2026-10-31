/** Same shape as the source dictionary, any string values: what every other locale must fill. */
export type Dictionary<T> = {
  [K in keyof T]: T[K] extends string ? string : Dictionary<T[K]>;
};
