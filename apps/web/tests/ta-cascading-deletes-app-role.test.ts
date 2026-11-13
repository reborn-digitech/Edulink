/**
 * Cascading deletes that only show UNDER ROW SECURITY: two High findings of the
 * testing analysis of 13 November 2026, each held by a case that FAILS while
 * the defect stands and passes once it is fixed.
 *
 *   TA-008  `npm run files:reclaim` and `files:check` run as the application
 *           role with no request, so every policied reader of file references
 *           comes back empty and the sweep takes live files for orphans
 *           (src/lib/orphans.ts, package.json).
 *   TA-014  Erasing a school also deletes people who belong to another school:
 *           the orphan check after the cascade runs under the operator's own
 *           session, where row security hides their other memberships
 *           (src/lib/superuser.ts deleteSchoolEntirely).
 *
 * WHY A FILE OF ITS OWN. Every other suite talks to the database as the OWNER
 * (tests/setup.ts), where row security does not apply, so tests/orphans.test.ts
 * and tests/superuser.test.ts pass and can never see either defect. Here the
 * app's own `db` connects as the APPLICATION ROLE, the role every web process
 * and the two package scripts connect as: DATABASE_URL is put back to the app
 * role's before anything imports src/lib/db.ts. Fixtures are written and read
 * back through a second, owner client. Skipped, and says so, when the
 * configuration has one role (there is no row security to run under).
 *
 * Every row belongs to a scratch ZZ school or a ZZ person of this suite's own
 * (the stamp is in each name, slug and address); the stored files live in a
 * scratch directory under the system's temp folder, never the app's store, and
 * the delete run is refused unless the store is that directory.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const ENV = await vi.hoisted(async () => {
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const app = process.env.DATABASE_APP_URL;
  const admin = process.env.DATABASE_ADMIN_URL;
  let appUser: string | null = null;
  try {
    if (app && admin && new URL(app).username !== new URL(admin).username) appUser = new URL(app).username;
  } catch {
    appUser = null;
  }
  // The app's own client is the app role's from here on, as in a web process and in `npm run files:reclaim`.
  if (appUser) process.env.DATABASE_URL = app;
  for (const key of ["STORAGE_BUCKET", "STORAGE_S3_ENDPOINT", "STORAGE_S3_REGION", "STORAGE_S3_ACCESS_KEY_ID", "STORAGE_S3_SECRET_ACCESS_KEY"]) delete process.env[key];
  const store = join(tmpdir(), `zz-ta008-store-${Date.now()}`);
  process.env.STORAGE_DIR = store;
  return { appUser, admin, store };
});

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, stat, utimes, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { db } from "@/lib/db";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { blobStore } from "@/lib/blob-store";
import { reclaimOrphans, type OrphanReport } from "@/lib/orphans";
import { deleteSchoolEntirely } from "@/lib/superuser";

/** The owner: fixtures in, results read back, clean-up. Never the client under test. */
const owner = new PrismaClient(ENV.admin ? { datasourceUrl: ENV.admin } : undefined);
const STAMP = Date.now();
const MAIL = (who: string) => `zz-taar-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
const schools: string[] = [];

async function school(key: string, name: string): Promise<string> {
  const made = await owner.school.create({
    data: { name: `ZZ TA ${name} ${STAMP}`, slug: `zz-taar-${key.toLowerCase()}-${STAMP}`, code: `ZZTAAR${key}${STAMP}`, contactEmail: MAIL(`office-${key}`), timezone: "Asia/Kolkata", isTestFixture: true },
    select: { id: true, name: true },
  });
  ids[key] = made.id;
  ids[`${key}Name`] = made.name;
  schools.push(made.id);
  return made.id;
}

async function user(who: string, extra: object = {}): Promise<string> {
  ids[who] = (await owner.user.create({ data: { name: `ZZ TA ${who}`, email: MAIL(who), prefs: "{}", ...extra }, select: { id: true } })).id;
  return ids[who]!;
}

async function member(who: string, schoolId: string, role: string, extra: object = {}): Promise<string> {
  return (await owner.membership.create({ data: { userId: ids[who]!, schoolId, role, status: "ACTIVE", ...extra }, select: { id: true } })).id;
}

async function settle<T>(run: () => Promise<T>): Promise<{ value: T } | { error: unknown }> {
  try {
    return { value: await run() };
  } catch (error) {
    return { error };
  }
}

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await owner.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  await owner.session.deleteMany({ where: { userId: { in: userIds } } });
  await owner.notification.deleteMany({ where: { userId: { in: userIds } } });
  await owner.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { targetId: { in: schools } }, { actorUserId: { in: userIds } }] } });
  await owner.school.deleteMany({ where: { id: { in: schools } } });
  await owner.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await owner.$disconnect();
  await rm(ENV.store, { recursive: true, force: true });
});

describe.skipIf(!ENV.appUser)("as the application role, the way the web process and the package scripts connect", () => {
  it("arrange: the app's own client is the app role, which neither owns the tables nor bypasses row security", async () => {
    const [who] = await db.$queryRaw<{ name: string; bypass: boolean; superuser: boolean }[]>`SELECT current_user::text AS name, r.rolbypassrls AS bypass, r.rolsuper AS superuser FROM pg_roles r WHERE r.rolname = current_user`;
    expect(who).toEqual({ name: ENV.appUser, bypass: false, superuser: false });
  });

  /* ---------------------------------------------------------------- TA-008 */

  describe("TA-008: the file sweep run as `npm run files:check` and `files:reclaim` run it", () => {
    const HAND_IN = `${randomUUID()}.pdf`; // named by a pupil's hand-in
    const HANDOUT = `${randomUUID()}.pdf`; // named by the teacher's assignment
    const pathFor = (fileId: string) => join(ENV.store, fileId.slice(0, 2), fileId);
    const exists = (fileId: string) => stat(pathFor(fileId)).then(() => true, () => false);
    let seenByApp = { submissions: -1, assignments: -1 };
    let onRecord = { submissions: -1, assignments: -1 };
    let dry: { value: OrphanReport } | { error: unknown };
    let wet: { value: OrphanReport } | { error: unknown };

    /** A stored file two hours old: past the sweep's one-hour grace. */
    async function place(fileId: string): Promise<void> {
      await mkdir(join(ENV.store, fileId.slice(0, 2)), { recursive: true });
      await writeFile(pathFor(fileId), Buffer.from("%PDF-1.4\n% ZZ TA008\n"));
      const when = new Date(Date.now() - 2 * 60 * 60 * 1000);
      await utimes(pathFor(fileId), when, when);
    }

    beforeAll(async () => {
      const R = await school("R08", "Reclaim School");
      await user("teacher08");
      await user("pupil08");
      const teacherM = await member("teacher08", R, "TEACHER");
      const pupilM = await member("pupil08", R, "STUDENT");
      const klass = await owner.class.create({ data: { schoolId: R, name: "ZZ TA 7A", gradeLevel: "7", joinCode: `ZZTA008${STAMP}` }, select: { id: true } });
      const sheet = (fileId: string) => JSON.stringify([{ fileId, name: "zz.pdf", size: 20, mime: "application/pdf" }]);
      ids.assignment08 = (await owner.assignment.create({ data: { schoolId: R, classId: klass.id, authorMembershipId: teacherM, title: "ZZ TA008 homework", publishedAt: new Date(), attachments: sheet(HANDOUT) }, select: { id: true } })).id;
      ids.submission08 = (await owner.submission.create({ data: { schoolId: R, assignmentId: ids.assignment08!, studentMembershipId: pupilM, status: "SUBMITTED", submittedAt: new Date(), attachments: sheet(HAND_IN) }, select: { id: true } })).id;
      await mkdir(ENV.store, { recursive: true });
      await place(HAND_IN);
      await place(HANDOUT);

      // No request and no session, as in a script: the tenant is nobody's.
      __resetCookies();
      __setHeaders({});
      onRecord = { submissions: await owner.submission.count({ where: { id: ids.submission08 } }), assignments: await owner.assignment.count({ where: { id: ids.assignment08 } }) };
      seenByApp = { submissions: await db.submission.count({ where: { id: ids.submission08 } }), assignments: await db.assignment.count({ where: { id: ids.assignment08 } }) };

      // `npm run files:check`: reclaimOrphans({ dryRun: true }).
      dry = await settle(() => reclaimOrphans({ dryRun: true }));

      // `npm run files:reclaim`: reclaimOrphans({ dryRun: false }). Only ever against this suite's scratch directory holding exactly its two files.
      if (blobStore("files").describe() !== ENV.store) throw new Error(`the store is ${blobStore("files").describe()}, not this suite's scratch directory: nothing swept`);
      if ("value" in dry && dry.value.scanned !== 2) throw new Error(`the scratch store holds ${dry.value.scanned} files, not this suite's two: nothing swept`);
      wet = await settle(() => reclaimOrphans({ dryRun: false }));
    });

    it("arrange: the hand-in and the assignment are on record, and under the app role with no request the sweep's readers see neither", () => {
      expect(onRecord).toEqual({ submissions: 1, assignments: 1 });
      expect(seenByApp).toEqual({ submissions: 0, assignments: 0 });
    });

    it("⚠ files:check does not report a file a hand-in or an assignment names as unreferenced (or refuses to run on this connection)", () => {
      const listed = "value" in dry ? dry.value.orphans.map((o) => o.fileId) : [];
      const said = "value" in dry ? `ran: scanned ${dry.value.scanned}, referenced ${dry.value.referenced}, unreferenced ${dry.value.orphans.length}` : `refused: ${String(dry.error)}`;
      expect({ handIn: listed.includes(HAND_IN), handout: listed.includes(HANDOUT) }, said).toEqual({ handIn: false, handout: false });
    });

    it("⚠ files:reclaim leaves the hand-in's file and the teacher's handout in the store", async () => {
      const said = "value" in wet ? `ran: deleted ${wet.value.deleted.length} of ${wet.value.scanned}` : `refused: ${String(wet.error)}`;
      expect({ handIn: await exists(HAND_IN), handout: await exists(HANDOUT) }, said).toEqual({ handIn: true, handout: true });
    });

    it("⚠ every package script that runs reclaim-files.ts goes through with-admin-db.mjs, as `job` does", async () => {
      const scripts = (JSON.parse(await readFile(join(process.cwd(), "package.json"), "utf8")) as { scripts: Record<string, string> }).scripts;
      const sweeps = Object.entries(scripts).filter(([, command]) => command.includes("reclaim-files.ts"));
      expect(sweeps.map(([name]) => name).sort()).toEqual(["files:check", "files:reclaim"]);
      expect(sweeps.filter(([, command]) => !command.includes("with-admin-db.mjs")).map(([name]) => name)).toEqual([]);
    });
  });

  /* ---------------------------------------------------------------- TA-014 */

  describe("TA-014: erasing a school keeps the people who also belong to another school", () => {
    let result: { value: Awaited<ReturnType<typeof deleteSchoolEntirely>> } | { error: unknown };
    let otherSchoolRows = { onRecord: -1, seenByTheOperatorsSession: -1 };
    const kept: Record<string, string> = {};

    beforeAll(async () => {
      // A school registered twice by mistake: the duplicate is erased, the real one stays.
      const E = await school("E14", "Duplicate School");
      const K = await school("K14", "Real School");
      await user("operator14", { isSuperuser: true });
      await user("onlyHere"); // a pupil who exists only at the duplicate
      await user("teacherBoth"); // teaches at both
      await user("adminBoth"); // registered both, administers both
      await user("moved", { isMinor: true }); // left the duplicate, on the roll of the real school
      await member("onlyHere", E, "STUDENT");
      await member("teacherBoth", E, "TEACHER");
      kept.teacher = await member("teacherBoth", K, "TEACHER");
      await member("adminBoth", E, "ADMIN");
      kept.admin = await member("adminBoth", K, "ADMIN");
      await member("moved", E, "STUDENT", { joinedAt: new Date(Date.now() - 400 * 86_400_000), leftAt: new Date(Date.now() - 30 * 86_400_000) });
      kept.moved = await member("moved", K, "STUDENT");
      const klass = await owner.class.create({ data: { schoolId: K, name: "ZZ TA 5A", gradeLevel: "5", joinCode: `ZZTA014${STAMP}` }, select: { id: true } });
      kept.enrolment = (await owner.enrollment.create({ data: { schoolId: K, classId: klass.id, studentMembershipId: kept.moved!, rollNumber: 1 }, select: { id: true } })).id;

      // The operator's own session, with no school on it: what /root runs under.
      __resetCookies();
      __setHeaders({});
      await createSession(ids.operator14!);
      const session = (await getSession()) as ActiveContext;
      // What row security shows that session of the three people's memberships at the school that stays: nothing.
      const theirs = { id: { in: [kept.teacher!, kept.admin!, kept.moved!] } };
      otherSchoolRows = { onRecord: await owner.membership.count({ where: theirs }), seenByTheOperatorsSession: await db.membership.count({ where: theirs }) };
      result = await settle(() => deleteSchoolEntirely(session, E, ids.E14Name!));
      __resetCookies();
    });

    const account = (who: string) => owner.user.count({ where: { id: ids[who] } });
    const membership = (id: string) => owner.membership.count({ where: { id } });

    it("arrange: the erase ran as the operator and took the school and the one account that belonged only to it", async () => {
      expect("value" in result ? result.value.ok : String((result as { error: unknown }).error)).toBe(true);
      expect(await owner.school.count({ where: { id: ids.E14 } })).toBe(0);
      expect(await owner.school.count({ where: { id: ids.K14 } })).toBe(1);
      expect(await account("onlyHere")).toBe(0);
      expect(await account("operator14")).toBe(1);
      // The other school's memberships exist and are invisible to the operator's session: the `none` sub-selects cannot see them.
      expect(otherSchoolRows).toEqual({ onRecord: 3, seenByTheOperatorsSession: 0 });
    });

    it("⚠ keeps the teacher who also teaches at the other school, with the post there", async () => {
      expect({ account: await account("teacherBoth"), otherSchoolMembership: await membership(kept.teacher!) }).toEqual({ account: 1, otherSchoolMembership: 1 });
    });

    it("⚠ keeps the admin who also administers the real school, with that membership", async () => {
      expect({ account: await account("adminBoth"), otherSchoolMembership: await membership(kept.admin!) }).toEqual({ account: 1, otherSchoolMembership: 1 });
    });

    it("⚠ keeps the pupil who moved to the other school, with the membership and the class enrolment there", async () => {
      expect({ account: await account("moved"), otherSchoolMembership: await membership(kept.moved!), enrolment: await owner.enrollment.count({ where: { id: kept.enrolment } }) }).toEqual({ account: 1, otherSchoolMembership: 1, enrolment: 1 });
    });

    it("⚠ reports one removed account, the one that belonged only to the erased school", () => {
      expect("value" in result ? result.value.removedUsers : String((result as { error: unknown }).error)).toBe(1);
    });
  });
});

describe.skipIf(Boolean(ENV.appUser))("with a single database role", () => {
  it("is skipped: there is no application role to run under row security (DATABASE_URL and DATABASE_ADMIN_URL name the same user)", () => {
    expect(ENV.appUser).toBeNull();
  });
});
