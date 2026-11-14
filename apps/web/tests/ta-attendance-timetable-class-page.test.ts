/**
 * The web's class page, a finding of the testing analysis of 13 November 2026 (attendance-timetable batch), drawn to
 * markup on the server with its reads stood in for; nothing touches the database.
 *
 *   TA-032  A register only an attendance device had started (a pupil's punch: a session with no taker) was shown to
 *           its class teacher as taken. The lists and the phone's class page were mended first; a second reader found
 *           the web's class page still read any session of the day as Done, "n marked", with "Edit today's attendance".
 */
import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { translator } from "@/lib/i18n/dictionary";

(globalThis as { React?: typeof React }).React = React;
const t = translator("en");
const CLASS_ID = "czzclasspage000000000001";
const state = vi.hoisted(() => ({
  session: null as null | { takenAt: Date; takenByMembershipId: string | null; _count: { records: number } },
}));

vi.mock("@/lib/tenancy", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/tenancy")>()),
  requireRole: async () => ({ user: { id: "zz-u" }, role: "TEACHER", schoolId: "zz-school", membershipId: "zz-m" }),
  assertClassAccess: async () => ({ id: CLASS_ID, schoolId: "zz-school", name: "ZZ 6A", subject: null, room: null, color: null, joinCode: "ZZCODE" }),
  teachesClass: async () => null,
}));
vi.mock("@/lib/db", () => ({
  db: {
    school: { findUniqueOrThrow: async () => ({ timezone: "Asia/Kolkata" }) },
    enrollment: { findMany: async () => [] },
    attendanceSession: { findUnique: async () => state.session },
    assignment: { findMany: async () => [] },
    submission: { count: async () => 0 },
  },
}));
vi.mock("@/lib/i18n/server", () => ({ getT: async () => t, getRelativeTime: async () => () => "ZZ a moment ago" }));
vi.mock("@/lib/grading", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/grading")>()), listGradeCategories: async () => [] }));
vi.mock("@/lib/health", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/health")>()), healthFlagsFor: async () => new Map() }));
vi.mock("@/lib/incidents", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/incidents")>()), openIncidentCounts: async () => new Map() }));
vi.mock("@/app/(app)/teacher/classes/[classId]/class-code", () => ({ ClassCode: () => null }));
vi.mock("@/app/(app)/teacher/classes/[classId]/weights", () => ({ GradeWeights: () => null }));

import ClassDetailPage from "@/app/(app)/teacher/classes/[classId]/page";

const draw = async () =>
  // The markup escapes an apostrophe ("Edit today's attendance"); the sentence is compared as a reader sees it.
  renderToStaticMarkup(await ClassDetailPage({ params: Promise.resolve({ classId: CLASS_ID }), searchParams: Promise.resolve({}) })).replace(/&#x27;/g, "'");

describe("TA-032: the web's class page and a register a device started", () => {
  it("TA-032: a session only a pupil's punch made is still to take on the class page, with Mark the attendance", async () => {
    state.session = { takenAt: new Date(), takenByMembershipId: null, _count: { records: 1 } };
    const html = await draw();
    expect(html).toContain(t("teacher.toDo"));
    expect(html).toContain(t("teacher.nobodyMarkedYet"));
    expect(html).toContain(t("teacher.takeRegister"));
    expect(html).not.toContain(t("teacher.editTodaysRegister"));
    expect(html).not.toContain(t("teacher.markedAgo", { count: 1, when: "ZZ a moment ago" }));
  });

  it("TA-032: a register a person took is still Done, with its count and Edit today's attendance", async () => {
    state.session = { takenAt: new Date(), takenByMembershipId: "zz-m", _count: { records: 2 } };
    const html = await draw();
    expect(html).toContain(t("teacher.markedAgo", { count: 2, when: "ZZ a moment ago" }));
    expect(html).toContain(t("teacher.editTodaysRegister"));
    expect(html).not.toContain(t("teacher.nobodyMarkedYet"));
  });
});
