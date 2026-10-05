/**
 * THE WARM PASS (R-29, 5 Oct 2026, risks batch). On a cold `next dev` the first
 * request to each route compiles it, and the shared layout, the middleware, the
 * Prisma client and the dictionary compile on the first request of all; a page
 * whose interactive transaction was open across that compile timed out, so a
 * single sweep run went red on `/root` and its neighbours though each answered
 * 200 alone (STREAMS-6, W-16). Before it counts anything the sweep now asks for
 * the cheap pages once, signed out first and then each signed-in actor's home,
 * and throws every answer away: nothing here is a result, a timing or a
 * failure. The real check stays the sweep run twice (warm-up, then count).
 */

/** Signed out, in this order: the health probe, then pages that need no person. */
export const WARM_PUBLIC = ["/api/health", "/login", "/", "/offline"] as const;

export type WarmActor = { label: string; cookie: string; home: string };
export type WarmStep = { who: string; cookie: string | null; path: string };

/** The order of the pass: the public pages signed out, then one home per distinct home, each once. */
export function warmPlan(actors: readonly WarmActor[]): WarmStep[] {
  const steps: WarmStep[] = WARM_PUBLIC.map((path) => ({ who: "anonymous", cookie: null, path }));
  const homes = new Set<string>();
  for (const a of actors) {
    if (homes.has(a.home)) continue;
    homes.add(a.home);
    steps.push({ who: a.label, cookie: a.cookie, path: a.home });
  }
  return steps;
}

type Fetcher = (url: string, init: { headers: Record<string, string>; redirect: "manual" }) => Promise<{ status: number; arrayBuffer(): Promise<ArrayBuffer> }>;

/** One request per step, in order; answers and errors are swallowed. Returns how many answered and how long it took. */
export async function warmUp(base: string, steps: readonly WarmStep[], fetcher: Fetcher = fetch as unknown as Fetcher): Promise<{ answered: number; ms: number }> {
  const started = Date.now();
  let answered = 0;
  for (const step of steps) {
    try {
      const res = await fetcher(base + step.path, { headers: step.cookie ? { cookie: step.cookie } : {}, redirect: "manual" });
      await res.arrayBuffer().catch(() => null);
      answered += 1;
    } catch {
      // A socket the compiling server dropped: the counted pass retries its own.
    }
  }
  return { answered, ms: Date.now() - started };
}
