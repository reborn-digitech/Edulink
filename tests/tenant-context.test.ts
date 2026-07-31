import { describe, expect, it } from "vitest";
import {
  forOwnSchools,
  forSchool,
  forTenant,
  forUser,
  isInTenantTransaction,
  markInTransaction,
  tenantOverride,
} from "../src/lib/tenant-context";

/**
 * The deliberate overrides, and — the point of this file — that they end.
 *
 * `forOwnSchools` is the only widening in the codebase. The role switcher needs
 * it because its whole job is to show the other doors: somebody with a post at
 * two schools could not otherwise load ANY page, since the nav shell asks "where
 * else do you belong?" on every one of them.
 *
 * A widening that outlived its call would be the worst kind of bug here — every
 * query for the rest of that request would silently have the other school within
 * reach, and nothing would look wrong. The app's own `WHERE schoolId` clauses
 * would go on hiding it for exactly as long as none of them was ever forgotten,
 * which is the situation row-level security exists to not depend on.
 *
 * Testing it here rather than through the app is deliberate: through the app,
 * those `WHERE` clauses mask the difference. `npm run sweep` checks the
 * user-visible half (a two-school teacher acting for one school cannot reach the
 * other school's class); this checks the half underneath it.
 */

describe("tenant overrides", () => {
  it("binds the schools it is given", async () => {
    const seen = await forOwnSchools("u1", ["a", "b"], async () => tenantOverride());
    expect(seen).toEqual({ schoolIds: ["a", "b"], userId: "u1" });
  });

  it("dedupes, because a user with two roles at one school is the ordinary case", async () => {
    const seen = await forOwnSchools("u1", ["a", "a", "b", "a"], async () => tenantOverride());
    expect(seen?.schoolIds).toEqual(["a", "b"]);
  });

  it("⚠ does not outlive its call", async () => {
    await forOwnSchools("u1", ["a", "b"], async () => tenantOverride());
    expect(tenantOverride()).toBeUndefined();
  });

  it("⚠ does not outlive a call that threw", async () => {
    await expect(
      forOwnSchools("u1", ["a", "b"], async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(tenantOverride()).toBeUndefined();
  });

  it("⚠ is invisible to work running alongside it", async () => {
    // Two requests are served at once all the time. An override held anywhere
    // shared — a module variable, a per-request store reused across them — is a
    // bug that stays invisible until two schools use the app in the same second.
    const [inside, outside] = await Promise.all([
      forOwnSchools("u1", ["a"], async () => {
        await new Promise((r) => setTimeout(r, 5));
        return tenantOverride()?.schoolIds;
      }),
      (async () => {
        await new Promise((r) => setTimeout(r, 1));
        return tenantOverride()?.schoolIds;
      })(),
    ]);

    expect(inside).toEqual(["a"]);
    expect(outside).toBeUndefined();
  });

  it("⚠ narrows rather than accumulates when nested", async () => {
    // forSchool inside a widening must REPLACE it, not add to it — otherwise
    // "do this bit for one school only" quietly means "and the others too".
    const seen = await forOwnSchools("u1", ["a", "b"], () =>
      forSchool("a", async () => tenantOverride()?.schoolIds),
    );
    expect(seen).toEqual(["a"]);
  });

  it("keeps the user bound through a narrowing, so own-row reads still work", async () => {
    const seen = await forOwnSchools("u1", ["a", "b"], () =>
      forSchool("a", async () => tenantOverride()?.userId),
    );
    expect(seen).toBe("u1");
  });

  it("forUser binds nobody's schools — the login bootstrap has none", async () => {
    const seen = await forUser("u1", async () => tenantOverride());
    expect(seen).toEqual({ schoolIds: [], userId: "u1" });
  });

  it("forTenant is the general form the others are written in", async () => {
    const tenant = { schoolIds: ["x"], userId: null };
    expect(await forTenant(tenant, async () => tenantOverride())).toEqual(tenant);
  });
});

describe("the in-transaction flag", () => {
  it("is off by default, so the first query opens its own transaction", () => {
    expect(isInTenantTransaction()).toBe(false);
  });

  it("propagates downward into nested work", async () => {
    const seen = await markInTransaction(async () => {
      return (async () => isInTenantTransaction())();
    });
    expect(seen).toBe(true);
  });

  it("⚠ is NOT visible to the siblings of the call that set it", async () => {
    // Pages run their queries with Promise.all. Held per request rather than
    // per call, the first query to open a transaction set this and its siblings
    // then skipped opening their own, ran with no tenant, and returned nothing.
    const [inside, sibling] = await Promise.all([
      markInTransaction(async () => {
        await new Promise((r) => setTimeout(r, 5));
        return isInTenantTransaction();
      }),
      (async () => {
        await new Promise((r) => setTimeout(r, 1));
        return isInTenantTransaction();
      })(),
    ]);

    expect(inside).toBe(true);
    expect(sibling).toBe(false);
  });
});
