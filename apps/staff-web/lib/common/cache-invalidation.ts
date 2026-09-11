export type CacheScope = string | readonly string[];

function scopesOf(scope: CacheScope) {
  return typeof scope === "string" ? [scope] : scope;
}

export function matchesCacheScope(namespace: string, scope: CacheScope) {
  return scopesOf(scope).some((prefix) => namespace === prefix || namespace.startsWith(`${prefix}:`));
}

export function createCacheInvalidation() {
  let sequence = 0;
  let globalVersion = 0;
  const versions = new Map<string, number>();
  const listeners = new Set<() => void>();

  return {
    getVersion(scope?: CacheScope) {
      if (scope === undefined) return sequence;
      let version = globalVersion;
      for (const [changed, changedVersion] of versions) {
        if (scopesOf(scope).some((namespace) => matchesCacheScope(namespace, changed))) {
          version = Math.max(version, changedVersion);
        }
      }
      return version;
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    invalidate(scope: CacheScope | undefined, clear: () => void) {
      sequence += 1;
      if (scope === undefined) {
        globalVersion = sequence;
        versions.clear();
      } else {
        for (const namespace of scopesOf(scope)) versions.set(namespace, sequence);
      }
      clear();
      listeners.forEach((listener) => listener());
    },
  };
}
