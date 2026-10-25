const CACHE_NAMESPACE = 'barbell-battles:query-cache:v1';
const CACHE_INDEX_KEY = `${CACHE_NAMESPACE}:index`;

export const QUERY_CACHE_MAX_AGE_MS = 5 * 60 * 1000;

export type CachedQuery<T> = {
  data: T;
  savedAt: number;
};

function storageKey(key: string) {
  return `${CACHE_NAMESPACE}:${key}`;
}

function readIndex() {
  try {
    return JSON.parse(globalThis.localStorage.getItem(CACHE_INDEX_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function writeIndex(keys: string[]) {
  globalThis.localStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(keys));
}

export function readQueryCache<T>(key: string): CachedQuery<T> | null {
  try {
    const value = globalThis.localStorage.getItem(storageKey(key));
    return value ? JSON.parse(value) as CachedQuery<T> : null;
  } catch {
    return null;
  }
}

export function writeQueryCache<T>(key: string, data: T) {
  try {
    globalThis.localStorage.setItem(storageKey(key), JSON.stringify({ data, savedAt: Date.now() }));
    const keys = readIndex();
    if (!keys.includes(key)) writeIndex([...keys, key]);
  } catch {
    // A full or unavailable cache must never prevent the live query from working.
  }
}

export function isQueryCacheFresh(entry: CachedQuery<unknown>) {
  return Date.now() - entry.savedAt < QUERY_CACHE_MAX_AGE_MS;
}

export function invalidateQueryCache(prefix: string) {
  try {
    const keys = readIndex();
    const retainedKeys = keys.filter((key) => {
      if (!key.startsWith(prefix)) return true;
      globalThis.localStorage.removeItem(storageKey(key));
      return false;
    });
    writeIndex(retainedKeys);
  } catch {
    // Cache invalidation is best effort; server-side authorization remains authoritative.
  }
}

export function clearQueryCache() {
  try {
    readIndex().forEach((key) => globalThis.localStorage.removeItem(storageKey(key)));
    globalThis.localStorage.removeItem(CACHE_INDEX_KEY);
  } catch {
    // Ignore storage errors during logout or account changes.
  }
}

export const queryKeys = {
  exercises: (userId: string) => `user:${userId}:exercises`,
  groups: (userId: string) => `user:${userId}:groups`,
  leaderboard: (userId: string, groupId: string | null, exerciseId: string | null) =>
    `user:${userId}:leaderboard:${groupId ?? 'all'}:${exerciseId ?? 'all'}`,
  lifts: (userId: string) => `user:${userId}:lifts`,
  userPrefix: (userId: string) => `user:${userId}:`,
};
