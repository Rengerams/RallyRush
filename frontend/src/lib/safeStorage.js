export function getSafeStorage() {
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}
