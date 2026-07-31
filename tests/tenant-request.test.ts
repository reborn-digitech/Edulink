import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * What the database is told about the current request.
 *
 * This module exists because the thing it replaced worked in exactly one of the
 * four places it had to. The tenant used to be PUSHED out of `getSession()` into
 * a store built on React's `cache()`, which memoises per RENDER — so a server
 * component saw the write and a route handler, a server action and the offline
 * outbox's replay each got a fresh, empty object. Postgres was then correctly
 * told nothing, returned nothing, and: every member of staff who logged in
 * landed on "Join your school", the register 403'd, every attachment 404'd and
 * the directory export 403'd for the admin who owns it.
 *
 * THIS SUITE HAS NO RENDER SCOPE AT ALL — vitest is not React — which is the
 * whole point. If any of this starts depending on one again, these fail here
 * rather than in a school's afternoon.
 *
 * The policies themselves are proven separately, against a real Postgres, by
 * `npm run rls:verify`. This proves the input they are given.
 */

const cookieJar = new Map<string, string>();

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({
    get: (name: string) =>
      cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined,
    set: (name: string, value: string) => void cookieJar.set(name, value),
    delete: (name: string) => void cookieJar.delete(name),
  }),
}));

const { resolveRequestTenant } = await import("../src/lib/tenant-request");
type SessionReadableClient = Parameters<typeof resolveRequestTenant>[0];
const { hashToken } = await import("../src/lib/crypto");
const { SESSION_COOKIE } = await import("../src/lib/constants");

type SessionRow = {
  userId: string;
  activeSchoolId: string | null;
  activeRole: string | null;
  revokedAt: Date | null;
  expiresAt: Date;
};

const HOUR = 3_600_000;

function fakeClient(opts: {
  sessions?: Record<string, SessionRow>;
  guardianSchools?: string[];
  memberships?: { userId: string; schoolId: string }[];
}) {
  const calls = { membershipUserIdBound: null as string | null };
  const client = {
    session: {
      async findUnique(args: unknown) {
        const where = (args as { where: { tokenHash: string } }).where;
        return opts.sessions?.[where.tokenHash] ?? null;
      },
    },
    guardianship: {
      async findMany() {
        return (opts.guardianSchools ?? []).map((studentSchoolId) => ({
          studentSchoolId,
        }));
      },
    },
    async $transaction<R>(fn: (tx: unknown) => Promise<R>): Promise<R> {
      return fn({
        async $executeRawUnsafe(_sql: string, ...values: unknown[]) {
          // The membership read is only allowed to see its own rows because
          // this is set. If it stops being set, the read stops working — so
          // the test records it rather than trusting the SQL.
          calls.membershipUserIdBound = String(values[0]);
          return 1;
        },
        membership: {
          async findFirst(args: unknown) {
            const where = (
              args as { where: { userId: string; schoolId: string } }
            ).where;
            const found = (opts.memberships ?? []).find(
              (m) => m.userId === where.userId && m.schoolId === where.schoolId,
            );
            return found ? { id: "m1" } : null;
          },
        },
      });
    },
  };
  return { calls, client: client as unknown as SessionReadableClient };
}

function signIn(token: string) {
  cookieJar.set(SESSION_COOKIE, token);
}

const live = (over: Partial<SessionRow> = {}): SessionRow => ({
  userId: "u1",
  activeSchoolId: "school-a",
  activeRole: "TEACHER",
  revokedAt: null,
  expiresAt: new Date(Date.now() + HOUR),
  ...over,
});

describe("resolveRequestTenant", () => {
  beforeEach(() => cookieJar.clear());

  it("⚠ resolves a tenant with no React render scope anywhere in sight", async () => {
    signIn("tok");
    const { client } = fakeClient({
      sessions: { [hashToken("tok")]: live() },
      memberships: [{ userId: "u1", schoolId: "school-a" }],
    });

    const tenant = await resolveRequestTenant(client);

    expect(tenant.schoolIds).toEqual(["school-a"]);
    expect(tenant.userId).toBe("u1");
  });

  it("binds the user, which is what lets a login read its own memberships", async () => {
    signIn("tok");
    const { client, calls } = fakeClient({
      sessions: { [hashToken("tok")]: live() },
      memberships: [{ userId: "u1", schoolId: "school-a" }],
    });

    await resolveRequestTenant(client);

    expect(calls.membershipUserIdBound).toBe("u1");
  });

  it("gives a signed-out request nothing to see", async () => {
    const { client } = fakeClient({});
    expect(await resolveRequestTenant(client)).toEqual({
      schoolIds: [],
      userId: null,
    });
  });

  it("gives an unknown token nothing to see", async () => {
    signIn("forged");
    const { client } = fakeClient({
      sessions: { [hashToken("real")]: live() },
    });
    expect(await resolveRequestTenant(client)).toEqual({
      schoolIds: [],
      userId: null,
    });
  });

  it("⚠ refuses a revoked session, so signing out closes the database too", async () => {
    signIn("tok");
    const { client } = fakeClient({
      sessions: { [hashToken("tok")]: live({ revokedAt: new Date() }) },
      memberships: [{ userId: "u1", schoolId: "school-a" }],
    });
    expect((await resolveRequestTenant(client)).schoolIds).toEqual([]);
  });

  it("⚠ refuses an expired session", async () => {
    signIn("tok");
    const { client } = fakeClient({
      sessions: {
        [hashToken("tok")]: live({ expiresAt: new Date(Date.now() - HOUR) }),
      },
      memberships: [{ userId: "u1", schoolId: "school-a" }],
    });
    expect((await resolveRequestTenant(client)).schoolIds).toEqual([]);
  });

  it("⚠ treats the school on the session as a claim and checks it", async () => {
    // A teacher removed from the school this morning still holds a cookie that
    // names it. The membership is gone, so the database is told about no school
    // at all — RLS is meant to be the answer even where a code path forgets to
    // ask getSession() first.
    signIn("tok");
    const { client } = fakeClient({
      sessions: { [hashToken("tok")]: live() },
      memberships: [],
    });

    const tenant = await resolveRequestTenant(client);

    expect(tenant.schoolIds).toEqual([]);
    expect(tenant.userId).toBe("u1");
  });

  it("gives a parent every school their children are at", async () => {
    // The role that made this a set rather than one id: a parent has no school
    // of their own and legitimately spans them.
    signIn("tok");
    const { client } = fakeClient({
      sessions: {
        [hashToken("tok")]: live({
          activeRole: "PARENT",
          activeSchoolId: null,
        }),
      },
      guardianSchools: ["school-a", "school-b", "school-a"],
    });

    const tenant = await resolveRequestTenant(client);

    expect(tenant.schoolIds).toEqual(["school-a", "school-b"]);
    expect(tenant.userId).toBe("u1");
  });

  it("gives a signed-in user with no school chosen no school", async () => {
    signIn("tok");
    const { client } = fakeClient({
      sessions: {
        [hashToken("tok")]: live({ activeSchoolId: null, activeRole: null }),
      },
    });

    const tenant = await resolveRequestTenant(client);

    // Still carries the user: they can read their own memberships, which is
    // exactly what the role switcher and the login bootstrap need.
    expect(tenant.schoolIds).toEqual([]);
    expect(tenant.userId).toBe("u1");
  });
});
