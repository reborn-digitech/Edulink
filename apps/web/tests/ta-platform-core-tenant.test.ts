import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * TA-504 (testing analysis of 13 November 2026): the database's tenant set opened a school on ANY active membership
 * the person held there, while getSession requires one in the session's own role. A person holding ADMIN and TEACHER
 * whose ADMIN membership was paused kept app.school_ids on the school under an ADMIN session the application treats as
 * having no school. The set is now asked in the session's role, as getSession asks, and a session with no role opens
 * no school. A fake client that honours the role, in the style of tests/tenant-request.test.ts.
 */

const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined),
    set: (name: string, value: string) => void cookieJar.set(name, value),
    delete: (name: string) => void cookieJar.delete(name),
  }),
}));

const { resolveRequestTenant } = await import("../src/lib/tenant-request");
type SessionReadableClient = Parameters<typeof resolveRequestTenant>[0];
const { hashToken } = await import("../src/lib/crypto");
const { SESSION_COOKIE } = await import("../src/lib/constants");

const HOUR = 3_600_000;
type Row = { userId: string; schoolId: string; role: string; status?: string };

function fakeClient(activeRole: string | null, memberships: Row[]) {
  const session = { userId: "u1", activeSchoolId: "school-a", activeRole, revokedAt: null, expiresAt: new Date(Date.now() + HOUR), createdAt: new Date(Date.now() - HOUR), user: { isSuperuser: false, disabledAt: null } };
  return {
    session: { findUnique: async (args: unknown) => ((args as { where: { tokenHash: string } }).where.tokenHash === hashToken("tok") ? session : null) },
    guardianship: { findMany: async () => [] },
    async $transaction<R>(fn: (tx: unknown) => Promise<R>): Promise<R> {
      return fn({
        $executeRawUnsafe: async () => 1,
        membership: {
          // As Postgres would: every field the where names must match, the role among them when it is asked.
          async findFirst(args: unknown) {
            const where = (args as { where: { userId: string; schoolId: string; role?: string; status?: string } }).where;
            const found = memberships.find((m) => m.userId === where.userId && m.schoolId === where.schoolId && (where.role === undefined || m.role === where.role) && (where.status === undefined || (m.status ?? "ACTIVE") === where.status));
            return found ? { id: "m1" } : null;
          },
        },
      });
    },
  } as unknown as SessionReadableClient;
}

describe("TA-504: the tenant set in the session's role", () => {
  beforeEach(() => {
    cookieJar.clear();
    cookieJar.set(SESSION_COOKIE, "tok");
  });

  it("TA-504: an ADMIN session whose ADMIN membership is paused opens no school, though a TEACHER one is active there", async () => {
    const memberships: Row[] = [
      { userId: "u1", schoolId: "school-a", role: "ADMIN", status: "SUSPENDED" },
      { userId: "u1", schoolId: "school-a", role: "TEACHER" },
    ];
    expect((await resolveRequestTenant(fakeClient("ADMIN", memberships))).schoolIds).toEqual([]);
    // The same person switched to their TEACHER membership reads the school.
    expect((await resolveRequestTenant(fakeClient("TEACHER", memberships))).schoolIds).toEqual(["school-a"]);
  });

  it("TA-504: a session with a school and no role opens none, as getSession gives it none", async () => {
    expect((await resolveRequestTenant(fakeClient(null, [{ userId: "u1", schoolId: "school-a", role: "TEACHER" }]))).schoolIds).toEqual([]);
  });
});
