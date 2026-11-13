/**
 * TA-229 of the testing analysis of 13 November 2026: the nightly refresh (and the one a faculty page asks for) made
 * live what it had read earlier. It reads every live row once, then per school renders the snapshot's config and
 * swaps it in, clearing whatever is live: an Unpublish, or a Publish, that lands between the read and the swap was
 * silently undone (the site back up after the office was told it was down, or the version before the one published).
 *
 * The window is opened on purpose here: the module check the refresh makes for each school after its read is wrapped
 * (vi.mock of src/lib/modules) so that, once, the office's act runs exactly there. One scratch ZZ school of this
 * suite's own, through the owner connection, removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const race = vi.hoisted(() => ({ next: null as null | (() => Promise<unknown>) }));

vi.mock("@/lib/modules", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/modules")>();
  return {
    ...real,
    isModuleOn: async (...args: Parameters<typeof real.isModuleOn>) => {
      const act = race.next;
      if (act && args[1] === "WEBSITE") {
        race.next = null;
        await act();
      }
      return real.isModuleOn(...args);
    },
  };
});

import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { publishSite, saveSite, unpublishSite } from "@/lib/site-admin";
import { refreshPublishedSites, type SiteSnapshot } from "@/lib/site-publish";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-tawsr-${who}-${STAMP}@test.invalid`;
const ids = { school: "", admin: "" };
let pupils = 0;

async function as(userId: string, role: string, schoolId: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: role as never });
  return (await getSession())!;
}

/** One more pupil, so the refresh's numbers changed and it wants to cut a new version. */
async function anotherPupil(): Promise<void> {
  pupils += 1;
  const u = await db.user.create({ data: { name: `ZZ TA Race Pupil ${pupils}`, email: MAIL(`pupil${pupils}`), isTestFixture: true }, select: { id: true } });
  await db.membership.create({ data: { userId: u.id, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", studentCode: `ZTWR${pupils}${STAMP}` } });
}

const liveRows = () => db.schoolSiteVersion.findMany({ where: { schoolId: ids.school, liveAt: { not: null } }, select: { snapshotJson: true } });

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA Race ${STAMP}`, slug: `zz-tawsr-${STAMP}`, code: `ZTWR${String(STAMP).slice(-6)}`, contactEmail: MAIL("office"), timezone: "Asia/Kolkata", profileAbout: "A ZZ school for the refresh race.", isTestFixture: true }, select: { id: true } })).id;
  await db.schoolModule.create({ data: { schoolId: ids.school, module: "WEBSITE" } });
  ids.admin = (await db.user.create({ data: { name: "ZZ TA Race Admin", email: MAIL("admin"), isTestFixture: true }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: ids.admin, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" } });
});

afterAll(async () => {
  race.next = null;
  __resetCookies();
  __setHeaders({});
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-229: the refresh swaps in only over the version it read", () => {
  it("TA-229: an Unpublish between the refresh's read and its swap stays unpublished", async () => {
    await publishSite(await as(ids.admin, "ADMIN", ids.school));
    await anotherPupil();
    const ctx = await as(ids.admin, "ADMIN", ids.school);
    race.next = () => unpublishSite(ctx);
    await refreshPublishedSites(new Date(), { schoolIds: [ids.school] });
    expect(race.next).toBeNull();
    expect(await liveRows()).toHaveLength(0);
  });

  it("TA-229: a Publish between the refresh's read and its swap stays the live version", async () => {
    await publishSite(await as(ids.admin, "ADMIN", ids.school));
    await anotherPupil();
    const ctx = await as(ids.admin, "ADMIN", ids.school);
    expect(await saveSite(ctx, { motto: `The second draft ${STAMP}` })).toMatchObject({ ok: true });
    race.next = () => publishSite(ctx);
    await refreshPublishedSites(new Date(), { schoolIds: [ids.school] });
    expect(race.next).toBeNull();
    const live = await liveRows();
    expect(live).toHaveLength(1);
    expect((JSON.parse(live[0]!.snapshotJson) as SiteSnapshot).config.motto).toBe(`The second draft ${STAMP}`);
  });

  it("TA-229: with nothing in between, the refresh still cuts its new version", async () => {
    const before = await db.schoolSiteVersion.count({ where: { schoolId: ids.school } });
    await anotherPupil();
    expect(await refreshPublishedSites(new Date(), { schoolIds: [ids.school] })).toMatchObject({ checked: 1, refreshed: 1, failed: 0 });
    expect(await db.schoolSiteVersion.count({ where: { schoolId: ids.school } })).toBe(before + 1);
    expect(await liveRows()).toHaveLength(1);
  });
});
