import type { OutboxStore } from "./outbox";

/** The web target and the test runner: no SQLite; the outbox lives in memory. */
export function platformOutbox(): OutboxStore | null {
  return null;
}
