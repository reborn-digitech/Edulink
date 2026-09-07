/**
 * `server-only` throws on import outside a React Server Component. That guard
 * is correct in the app and useless in a test runner, so vitest aliases the
 * package to this empty module.
 */
export {};
