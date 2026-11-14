/**
 * AN EXPECTED ACTOR THE FIXTURE DID NOT HOLD (TA-460, testing analysis of 13 November 2026). global-setup.ts added a
 * module or college actor only `if (member)`, so a fixture change that left no ACTIVE warden at ZZ Northgate, or no
 * zz.faculty01 at ZZ Vidya, took that role out of the axe walk with every job green. Under CI the set-up now stops,
 * naming the role; on a laptop, where a partial fixture is ordinary, it says so and the walk goes on without it.
 *
 * No side effects at import, and no imports: tests/ta-ops-ci-dr-ci.test.ts calls it without a database.
 */
export function missingActor(who: string, env: Record<string, string | undefined> = process.env): void {
  const message = `e2e: the fixture has no ${who} actor — run npm run zz:fixtures`;
  const ci = env.CI;
  if (ci && ci !== "false" && ci !== "0") throw new Error(message);
  console.warn(`${message}; the axe walk leaves it out`);
}
