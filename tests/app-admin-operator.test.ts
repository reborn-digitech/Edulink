import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import { assertAppAdmin, listPlatformCompetitions } from "@/lib/app-admin";
import { appointAppAdmin, dismissAppAdmin, listAppAdmins } from "@/lib/superuser";
import type { ActiveContext } from "@/lib/session";

/**
 * The operator inherits the content team, and appoints it.
 *
 * Same honest limit as tests/superuser.test.ts: this suite runs as the
 * database owner, so what it proves is the APPLICATION boundary — who
 * app-admin.ts and the appoint/dismiss pair will let call them. The tenant
 * negatives live in `npm run rls:verify`; nothing here touches school rows,
 * because nothing on the appadmin surface does.
 */

const db = new PrismaClient();

function ctx(over: {
  userId: string;
  isSuperuser?: boolean;
  isAppAdmin?: boolean;
}): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: null,
    schoolId: null,
    role: null,
    user: {
      id: over.userId,
      name: "Test",
      preferredName: null,
      email: null,
      avatarKey: null,
      isMinor: false,
      isSuperuser: over.isSuperuser ?? false,
      isAppAdmin: over.isAppAdmin ?? false,
      prefs: {
        theme: "system",
        contrast: "normal",
        font: "default",
        motion: "full",
        locale: "en",
        channels: { push: false, email: false },
        quietHours: null,
      },
    },
  };
}

// ZZ-prefixed fixtures, ours alone, torn down at the end.
const STAMP = Date.now();
const OPERATOR_EMAIL = `zz-op-${STAMP}@test.invalid`;
const CANDIDATE_EMAIL = `zz-cand-${STAMP}@test.invalid`;
const DISABLED_EMAIL = `zz-dis-${STAMP}@test.invalid`;

let operatorId = "";
let candidateId = "";

beforeAll(async () => {
  const operator = await db.user.create({
    data: { name: "ZZ Operator", email: OPERATOR_EMAIL, isSuperuser: true },
    select: { id: true },
  });
  operatorId = operator.id;

  const candidate = await db.user.create({
    data: { name: "ZZ Candidate", email: CANDIDATE_EMAIL },
    select: { id: true },
  });
  candidateId = candidate.id;

  await db.user.create({
    data: { name: "ZZ Disabled", email: DISABLED_EMAIL, disabledAt: new Date() },
  });
});

afterAll(async () => {
  await db.auditLog.deleteMany({
    where: { actorUserId: operatorId },
  });
  await db.user.deleteMany({
    where: { email: { in: [OPERATOR_EMAIL, CANDIDATE_EMAIL, DISABLED_EMAIL] } },
  });
  await db.$disconnect();
});

describe("the operator passes the content-team gate", () => {
  it("assertAppAdmin accepts a superuser with no appadmin flag", () => {
    expect(() => assertAppAdmin(ctx({ userId: operatorId, isSuperuser: true }))).not.toThrow();
  });

  it("…and the surface itself serves them", async () => {
    const rows = await listPlatformCompetitions(ctx({ userId: operatorId, isSuperuser: true }));
    expect(Array.isArray(rows)).toBe(true);
  });

  it("an ordinary account is still refused", () => {
    expect(() => assertAppAdmin(ctx({ userId: candidateId }))).toThrow(AccessError);
  });

  it("the inheritance is one-way: an app admin is NOT a superuser anywhere", async () => {
    // The claim the design note makes: nothing appadmin-flavoured grants
    // operator powers. listAppAdmins is an operator function; an appadmin
    // session must bounce off it.
    await expect(
      listAppAdmins(ctx({ userId: candidateId, isAppAdmin: true })),
    ).rejects.toThrow(AccessError);
  });
});

describe("appointing and dismissing from the web", () => {
  it("refuses a non-superuser caller outright", async () => {
    await expect(
      appointAppAdmin(ctx({ userId: candidateId, isAppAdmin: true }), CANDIDATE_EMAIL),
    ).rejects.toThrow(AccessError);
  });

  it("appoints an existing account by email, case-insensitively", async () => {
    const result = await appointAppAdmin(
      ctx({ userId: operatorId, isSuperuser: true }),
      CANDIDATE_EMAIL.toUpperCase(),
    );
    expect(result.ok).toBe(true);

    const row = await db.user.findUnique({
      where: { id: candidateId },
      select: { isAppAdmin: true },
    });
    expect(row?.isAppAdmin).toBe(true);
  });

  it("…audits the appointment with no school id", async () => {
    const entry = await db.auditLog.findFirst({
      where: { action: "superuser.appadmin.appoint", targetId: candidateId },
      select: { schoolId: true, actorUserId: true },
    });
    expect(entry).not.toBeNull();
    expect(entry?.schoolId).toBeNull();
    expect(entry?.actorUserId).toBe(operatorId);
  });

  it("appointing twice reports 'already', not success", async () => {
    const result = await appointAppAdmin(ctx({ userId: operatorId, isSuperuser: true }), CANDIDATE_EMAIL);
    expect(result.ok).toBe(false);
    expect(result.errorKey).toBe("root.contentTeamAlready");
  });

  it("an unknown email is an instruction, not a crash", async () => {
    const result = await appointAppAdmin(
      ctx({ userId: operatorId, isSuperuser: true }),
      `zz-nobody-${STAMP}@test.invalid`,
    );
    expect(result.ok).toBe(false);
    expect(result.errorKey).toBe("root.contentTeamNoAccount");
  });

  it("a disabled account cannot be appointed", async () => {
    const result = await appointAppAdmin(ctx({ userId: operatorId, isSuperuser: true }), DISABLED_EMAIL);
    expect(result.ok).toBe(false);
    expect(result.errorKey).toBe("root.contentTeamDisabledAccount");
  });

  it("the list shows the appointment", async () => {
    const admins = await listAppAdmins(ctx({ userId: operatorId, isSuperuser: true }));
    expect(admins.some((a) => a.id === candidateId)).toBe(true);
  });

  it("dismisses, leaving the account itself untouched", async () => {
    const result = await dismissAppAdmin(ctx({ userId: operatorId, isSuperuser: true }), candidateId);
    expect(result.ok).toBe(true);

    const row = await db.user.findUnique({
      where: { id: candidateId },
      select: { isAppAdmin: true, disabledAt: true },
    });
    expect(row?.isAppAdmin).toBe(false);
    expect(row?.disabledAt).toBeNull();
  });

  it("dismissing somebody who is not on the team says so", async () => {
    const result = await dismissAppAdmin(ctx({ userId: operatorId, isSuperuser: true }), candidateId);
    expect(result.ok).toBe(false);
    expect(result.errorKey).toBe("root.contentTeamNotAMember");
  });
});
