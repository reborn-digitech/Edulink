import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

/**
 * Three policies, proved AS THE APP ROLE against the development database.
 *
 * Every other suite here connects as the owner, which bypasses row security
 * (tests/setup.ts says so in as many words), so none of them can show that a
 * policy refuses anything. `npm run rls:verify` can, on a scratch database of
 * its own; this file does the same for the three rules the security audit
 * changed, against the policies and grants actually applied to the database
 * the app runs on — because a rule that holds on the scratch database and was
 * never re-applied here is the failure `npm run db:grants` exists to catch.
 *
 *   1. AuditLog is append-only for the application: INSERT and SELECT work
 *      with a school bound; UPDATE and DELETE are refused, whether by the
 *      missing policy (count 0) or the revoked privilege (42501).
 *   2. OperatorAccess: the operator may CLOSE a visit (`endedAt`) and may not
 *      rewrite its reason, start or expiry — the generated trigger refuses
 *      every role but the owner, and the column grant refuses the app role.
 *   3. SchoolRecord: the issuing school, the pupil and an active guardian
 *      read the certificate; a school where the child is on the roll NOW as
 *      a pupil reads it too (the transfer flow, kept on purpose and asserted
 *      by name in rls:verify); a school that merely employs the same person,
 *      or that the child has left, reads nothing.
 *
 * Fixtures are written as the owner and every read below is a fresh app-role
 * transaction with the settings the app would have set. Skipped, and says so,
 * when the configuration has a single role: there is no app role to be refused.
 */

const owner = new PrismaClient();

function appRoleUrl(): string | null {
  // tests/setup.ts keeps the app role's URL as DATABASE_APP_URL before it
  // points DATABASE_URL at the owner; both are what dotenv resolved, the
  // environment winning over .env, so CI's real URLs are read and not the
  // example file's placeholders.
  const app = process.env.DATABASE_APP_URL;
  const admin = process.env.DATABASE_ADMIN_URL ?? app;
  if (!app || !admin) return null;
  try {
    if (new URL(app).username === new URL(admin).username) return null;
  } catch {
    return null;
  }
  return app;
}

const APP_URL = appRoleUrl();
const app = APP_URL ? new PrismaClient({ datasourceUrl: APP_URL }) : null;

type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];
type Settings = { schoolIds?: string[]; userId?: string; superuser?: boolean };

/** One app-role transaction, bound the way src/lib/db.ts binds a request. */
async function asApp<T>(settings: Settings, work: (tx: Tx) => Promise<T>): Promise<T> {
  if (!app) throw new Error("no app role");
  return app.$transaction(async (tx) => {
    const ids = (settings.schoolIds ?? []).join(",");
    await tx.$executeRaw`SELECT set_config('app.school_ids', ${ids}, true)`;
    await tx.$executeRaw`SELECT set_config('app.user_id', ${settings.userId ?? ""}, true)`;
    await tx.$executeRaw`SELECT set_config('app.is_superuser', ${settings.superuser ? "1" : ""}, true)`;
    return work(tx as unknown as Tx);
  });
}

/** "Refused" is either a thrown 42501 or a matched-nothing count; both are a pass. */
async function refused(run: () => Promise<{ count: number }>): Promise<boolean> {
  try {
    return (await run()).count === 0;
  } catch (error) {
    const code = (error as { code?: string; meta?: { code?: string } }).meta?.code ?? (error as { code?: string }).code;
    return code === "42501" || /permission denied|insufficient_privilege|append-only/.test(String(error));
  }
}

const SUFFIX = "@zzrlsapp.test";
const SLUGS = ["zz-rls-app-a", "zz-rls-app-b", "zz-rls-app-c", "zz-rls-app-d"];

let issuer: string; // A: wrote the certificate
let receiver: string; // B: the child is a pupil here now
let employer: string; // C: the same person works here now
let former: string; // D: the child was a pupil here and left
let pupilUserId: string;
let guardianUserId: string;
let strangerUserId: string;
let operatorUserId: string;
let recordId: string;
let visitId: string;
let auditId: string;

beforeAll(async () => {
  if (!app) return;
  await owner.school.deleteMany({ where: { slug: { in: SLUGS } } });
  await owner.user.deleteMany({ where: { email: { endsWith: SUFFIX } } });

  const mk = (slug: string, code: string) =>
    owner.school.create({ data: { name: `ZZ ${slug}`, slug, code, contactEmail: `${slug}${SUFFIX}` }, select: { id: true } });
  issuer = (await mk(SLUGS[0]!, "ZZRLA")).id;
  receiver = (await mk(SLUGS[1]!, "ZZRLB")).id;
  employer = (await mk(SLUGS[2]!, "ZZRLC")).id;
  former = (await mk(SLUGS[3]!, "ZZRLD")).id;

  const user = (email: string, name: string, extra: object = {}) =>
    owner.user.create({ data: { email: `${email}${SUFFIX}`, name, prefs: "{}", ...extra }, select: { id: true } });
  pupilUserId = (await user("pupil", "ZZ Pupil")).id;
  guardianUserId = (await user("guardian", "ZZ Guardian")).id;
  strangerUserId = (await user("stranger", "ZZ Stranger")).id;
  operatorUserId = (await user("operator", "ZZ Operator", { isSuperuser: true })).id;

  const left = new Date(Date.now() - 86_400_000);
  const joined = new Date(Date.now() - 400 * 86_400_000);
  const issuerMembership = await owner.membership.create({
    data: { userId: pupilUserId, schoolId: issuer, role: "STUDENT", status: "ACTIVE", joinedAt: joined, leftAt: left },
    select: { id: true },
  });
  await owner.membership.create({ data: { userId: pupilUserId, schoolId: receiver, role: "STUDENT", status: "ACTIVE" } });
  await owner.membership.create({ data: { userId: pupilUserId, schoolId: employer, role: "TEACHER", status: "ACTIVE" } });
  await owner.membership.create({
    data: { userId: pupilUserId, schoolId: former, role: "STUDENT", status: "ACTIVE", joinedAt: joined, leftAt: left },
  });
  await owner.guardianship.create({
    data: { parentUserId: guardianUserId, studentMembershipId: issuerMembership.id, studentSchoolId: issuer, status: "ACTIVE" },
  });

  recordId = (
    await owner.schoolRecord.create({
      data: {
        schoolId: issuer,
        studentUserId: pupilUserId,
        studentMembershipId: issuerMembership.id,
        schoolName: "ZZ Issuer",
        joinedAt: joined,
        leftAt: left,
        reason: "TRANSFERRED",
      },
      select: { id: true },
    })
  ).id;

  visitId = (
    await owner.operatorAccess.create({
      data: { schoolId: issuer, userId: operatorUserId, reason: "Operator access", expiresAt: new Date(Date.now() + 3_600_000) },
      select: { id: true },
    })
  ).id;

  auditId = (
    await owner.auditLog.create({
      data: { schoolId: issuer, actorUserId: operatorUserId, action: "zz.rls.fixture", meta: "{}" },
      select: { id: true },
    })
  ).id;
});

afterAll(async () => {
  if (app) {
    await owner.school.deleteMany({ where: { slug: { in: SLUGS } } });
    await owner.user.deleteMany({ where: { email: { endsWith: SUFFIX } } });
    await app.$disconnect();
  }
  await owner.$disconnect();
});

describe.skipIf(!app)("as the app role", () => {
  describe("⚠ the audit log is append-only", () => {
    it("a school reads and writes its own lines", async () => {
      const seen = await asApp({ schoolIds: [issuer] }, (tx) => tx.auditLog.count({ where: { id: auditId } }));
      expect(seen).toBe(1);
      const written = await asApp({ schoolIds: [issuer] }, (tx) =>
        tx.auditLog.create({ data: { schoolId: issuer, action: "zz.rls.written", meta: "{}" }, select: { id: true } }),
      );
      expect(written.id).toBeTruthy();
    });

    it("⚠ …and cannot UPDATE one, however it is bound", async () => {
      expect(
        await refused(() =>
          asApp({ schoolIds: [issuer], superuser: true }, (tx) =>
            tx.auditLog.updateMany({ where: { id: auditId }, data: { action: "zz.rls.rewritten" } }),
          ),
        ),
      ).toBe(true);
      expect((await owner.auditLog.findUniqueOrThrow({ where: { id: auditId } })).action).toBe("zz.rls.fixture");
    });

    it("⚠ …and cannot DELETE one", async () => {
      expect(
        await refused(() =>
          asApp({ schoolIds: [issuer], superuser: true }, (tx) => tx.auditLog.deleteMany({ where: { id: auditId } })),
        ),
      ).toBe(true);
      expect(await owner.auditLog.count({ where: { id: auditId } })).toBe(1);
    });
  });

  describe("⚠ a visit in the operator's book can be closed and nothing else", () => {
    it("the operator cannot rewrite the reason, the start or the expiry", async () => {
      for (const data of [
        { reason: "Nothing to see" },
        { startedAt: new Date(0) },
        { expiresAt: new Date(Date.now() + 86_400_000 * 30) },
      ]) {
        expect(
          await refused(() =>
            asApp({ schoolIds: [issuer], superuser: true, userId: operatorUserId }, (tx) =>
              tx.operatorAccess.updateMany({ where: { id: visitId }, data }),
            ),
          ),
          `rewrote ${Object.keys(data)[0]}`,
        ).toBe(true);
      }
      const row = await owner.operatorAccess.findUniqueOrThrow({ where: { id: visitId } });
      expect(row.reason).toBe("Operator access");
      expect(row.startedAt.getTime()).toBeGreaterThan(0);
    });

    it("…and can set endedAt", async () => {
      const closed = await asApp({ schoolIds: [issuer], superuser: true, userId: operatorUserId }, (tx) =>
        tx.operatorAccess.updateMany({ where: { id: visitId }, data: { endedAt: new Date() } }),
      );
      expect(closed.count).toBe(1);
      expect((await owner.operatorAccess.findUniqueOrThrow({ where: { id: visitId } })).endedAt).not.toBeNull();
    });
  });

  describe("⚠ who reads a leaving certificate", () => {
    const sees = (settings: Settings) =>
      asApp(settings, (tx) => tx.schoolRecord.count({ where: { id: recordId } }));

    it("the school that wrote it", async () => {
      expect(await sees({ schoolIds: [issuer] })).toBe(1);
    });

    it("the pupil, with no school bound", async () => {
      expect(await sees({ userId: pupilUserId })).toBe(1);
    });

    it("an active guardian, with no school bound", async () => {
      expect(await sees({ userId: guardianUserId })).toBe(1);
    });

    it("the school where the child is a pupil NOW — the transfer flow, kept on purpose", async () => {
      expect(await sees({ schoolIds: [receiver] })).toBe(1);
    });

    it("⚠ NOT a school that merely employs the same person", async () => {
      expect(await sees({ schoolIds: [employer] })).toBe(0);
    });

    it("⚠ NOT a school the child has left", async () => {
      expect(await sees({ schoolIds: [former] })).toBe(0);
    });

    it("⚠ NOT a stranger, and not the operator's key on its own", async () => {
      expect(await sees({ userId: strangerUserId })).toBe(0);
      expect(await sees({ superuser: true })).toBe(0);
    });

    it("⚠ and the receiving school cannot change or remove it", async () => {
      expect(
        await refused(() =>
          asApp({ schoolIds: [receiver] }, (tx) => tx.schoolRecord.updateMany({ where: { id: recordId }, data: { note: "x" } })),
        ),
      ).toBe(true);
      expect(
        await refused(() => asApp({ schoolIds: [receiver] }, (tx) => tx.schoolRecord.deleteMany({ where: { id: recordId } }))),
      ).toBe(true);
    });
  });
});
