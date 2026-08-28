const PREFIX = 'studiq_';
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

export function cacheSet(key, data, ttlMs = DEFAULT_TTL_MS) {
  try {
    const payload = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs
    };
    localStorage.setItem(PREFIX + key, JSON.stringify(payload));
  } catch {}
}

export function cacheGet(key, ttlMs = DEFAULT_TTL_MS) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      localStorage.removeItem(PREFIX + key);
      return null;
    }
    if (Date.now() - parsed.timestamp > ttlMs) {
      localStorage.removeItem(PREFIX + key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function cacheDelete(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {}
}

export function cacheHas(key) {
  return cacheGet(key) !== null;
}
