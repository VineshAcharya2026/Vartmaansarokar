/**
 * D1 store compatibility module.
 *
 * The project now uses feature modules under `server/modules/*`.
 * This file keeps the documented structure stable and can be used
 * as an import target for future consolidated D1 helpers.
 */

export type D1DatabaseLike = {
  prepare: (query: string) => {
    bind: (...args: unknown[]) => {
      run: () => Promise<unknown>;
      first: <T = unknown>() => Promise<T | null>;
      all: <T = unknown>() => Promise<{ results?: T[] }>;
    };
  };
};

export function assertD1(db: unknown): asserts db is D1DatabaseLike {
  if (!db || typeof db !== 'object' || !('prepare' in db)) {
    throw new Error('D1 database binding is not available.');
  }
}
