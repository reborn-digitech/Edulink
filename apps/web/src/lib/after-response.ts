import "server-only";
import { after } from "next/server";

/**
 * Work whose cost must not be the answer (fix-lows-A, 24 Oct 2026).
 *
 * A form that says the same sentence whether or not an account exists also has
 * to say it at the same moment: a reset code written and mailed, or an account
 * made, only for an address that is known, made the answer slower exactly then
 * (QA-24, QA-25). `afterResponse` runs such a task once the response has gone
 * out — Next's `after` inside a request; outside one (a test calling an action
 * directly) `after` throws, and the task runs detached instead, so the caller's
 * timing is still not the task's. A failure is logged under `label`, never
 * thrown into a response that has already been sent.
 *
 * A lib that defers takes a `Defer` from its caller, so its own tests can run
 * the work inline and look at what it did.
 */
export type Defer = (task: () => Promise<void>) => void;

export function afterResponse(label: string): Defer {
  return (task) => {
    const run = () => task().catch((error) => console.error(`[${label}] deferred work failed`, error));
    try {
      after(run);
    } catch {
      void run();
    }
  };
}
