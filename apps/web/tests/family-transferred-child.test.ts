/**
 * QA-52 and QA-58 (QA campaign of 24 October 2026): a guardian whose child moved schools.
 *
 *   - QA-52: the move is two guardianships, the first claimed at the school the child left. With no child asked for,
 *     every family page (pickChild) and family door (selectChild) opened on the departed one, so each sign-in showed
 *     "… left <school>" while the child's current school was a chip away. They now open on the child still enrolled;
 *     the departed membership stays in the switcher and opens when asked for.
 *   - QA-58: the departed child's panel, which stands in for the whole overview, carries the page's one <h1>.
 *
 * Two ZZ schools of the suite's own, people at @test.invalid; everything is deleted by id afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PrismaClient } from "@prisma/client";
import { familyChildren, pickChild } from "@/lib/family-child";
import { selectChild } from "@/lib/api-reads/family";
import type { ActiveContext } from "@/lib/session";

(globalThis as { React?: typeof React }).React = React;

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const ids = { left: "", now: "", parent: "", pupil: "", oldMembership: "", newMembership: "" };
const PREFS = { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } as const;
const guardian = (): ActiveContext => ({ sessionId: "t", membershipId: null, schoolId: null, role: "PARENT", user: { id: ids.parent, name: "ZZ", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: PREFS } }) as ActiveContext;

beforeAll(async () => {
  const school = (k: string) => db.school.create({ data: { name: `ZZ Transfer ${k} ${STAMP}`, slug: `zz-transfer-${k.toLowerCase()}-${STAMP}`, code: `ZT${k}${SUFFIX}`, contactEmail: `zz-transfer-${k.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } });
  ids.left = (await school("A")).id;
  ids.now = (await school("B")).id;
  ids.parent = (await db.user.create({ data: { name: "ZZ Transfer Guardian", email: `zz-transfer-guardian-${STAMP}@test.invalid` }, select: { id: true } })).id;
  ids.pupil = (await db.user.create({ data: { name: "ZZ Transfer Pupil", email: `zz-transfer-pupil-${STAMP}@test.invalid`, isMinor: true }, select: { id: true } })).id;
  ids.oldMembership = (await db.membership.create({ data: { userId: ids.pupil, schoolId: ids.left, role: "STUDENT", status: "ACTIVE", leftAt: new Date("2026-04-30T00:00:00Z") }, select: { id: true } })).id;
  ids.newMembership = (await db.membership.create({ data: { userId: ids.pupil, schoolId: ids.now, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
  // Claimed at the old school first: the order every family page opens on.
  await db.guardianship.create({ data: { parentUserId: ids.parent, studentMembershipId: ids.oldMembership, studentSchoolId: ids.left, relation: "PARENT", status: "ACTIVE", createdAt: new Date(STAMP - 60_000) } });
  await db.guardianship.create({ data: { parentUserId: ids.parent, studentMembershipId: ids.newMembership, studentSchoolId: ids.now, relation: "PARENT", status: "ACTIVE", createdAt: new Date(STAMP) } });
});

afterAll(async () => {
  await db.guardianship.deleteMany({ where: { studentSchoolId: { in: [ids.left, ids.now] } } });
  await db.school.deleteMany({ where: { id: { in: [ids.left, ids.now] } } });
  await db.user.deleteMany({ where: { id: { in: [ids.parent, ids.pupil] } } });
  await db.$disconnect();
});

describe("QA-52: a transferred pupil's guardian lands on the school the child is at", () => {
  it("opens the family pages and doors on the enrolment still running; the departed one opens when asked for", async () => {
    const children = await familyChildren(ids.parent);
    expect(children.map((c) => c.studentMembershipId)).toEqual([ids.oldMembership, ids.newMembership]);
    expect(pickChild(children)?.studentMembershipId).toBe(ids.newMembership);
    expect(pickChild(children, ids.oldMembership)?.studentMembershipId).toBe(ids.oldMembership);
    expect((await selectChild(guardian())).selectedId).toBe(ids.newMembership);
    expect((await selectChild(guardian(), ids.oldMembership)).selectedId).toBe(ids.oldMembership);
  });

  it("keeps the earlier rules: the first readable child, and a departed child when it is the only one", () => {
    const row = (id: string, readable: boolean, leftAt: Date | null = null) => ({ studentMembershipId: id, readable, leftAt });
    expect(pickChild([row("a", false), row("b", true, new Date()), row("c", true)])?.studentMembershipId).toBe("c");
    expect(pickChild([row("a", false), row("b", true, new Date())])?.studentMembershipId).toBe("b");
    expect(pickChild([row("a", true, new Date())])?.studentMembershipId).toBe("a");
    expect(pickChild([row("a", false)])?.studentMembershipId).toBe("a");
  });
});

describe("QA-58: the departed child's page has a heading", () => {
  it("draws the panel's title as the page's h1", async () => {
    const { ChildLeftPanel } = await import("@/app/(app)/parent/child-left");
    const panel = await ChildLeftPanel({ child: { studentMembershipId: ids.oldMembership, studentUserId: ids.pupil, name: "ZZ Transfer Pupil", schoolName: `ZZ Transfer A ${STAMP}`, leftAt: new Date("2026-04-30T00:00:00Z") } });
    const html = renderToStaticMarkup(panel);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>[^<]*ZZ Transfer Pupil[^<]*<\/h1>/);
  });
});
