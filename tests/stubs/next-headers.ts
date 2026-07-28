/**
 * Minimal stand-ins for next/headers.
 *
 * `headers()` and `cookies()` require a live request context. The units under
 * test (attendance merge, audit logging) only read a couple of header values,
 * so an empty Headers object exercises the same code paths without needing a
 * whole Next request.
 */
export async function headers(): Promise<Headers> {
  return new Headers();
}

export async function cookies() {
  const store = new Map<string, string>();
  return {
    get: (name: string) => (store.has(name) ? { name, value: store.get(name)! } : undefined),
    set: (name: string, value: string) => void store.set(name, value),
    delete: (name: string) => void store.delete(name),
  };
}
