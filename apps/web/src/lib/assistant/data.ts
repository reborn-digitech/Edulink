import "server-only";
import { parseDuties } from "@edulink/contracts";
import { db } from "../db";
import { enabledModules } from "../modules";
import type { Role } from "../constants";
import type { DataContext } from "./doors";
import { childNamed } from "./data-privacy";
import { pageIsRoles } from "./pages";
import { dateKeyInZone, todayKey } from "../dates";
import type { CalendarTerm, SchoolCalendar } from "./when";

/**
 * THE SCHOOL'S CALENDAR FOR THE WINDOW OF DAYS (Vidura pass 2): its today in its own zone, and the terms its office
 * recorded — a school's terms of the current year (Term), a college's academic terms (AcademicTerm) — each with its
 * place in the year. None recorded, none: "this term" then names no window.
 */
export async function calendarFor(schoolId: string, timezone: string, now: Date): Promise<SchoolCalendar> {
  const today = todayKey(timezone, now);
  const [terms, academic] = await Promise.all([
    db.term.findMany({ where: { schoolId, academicYear: { isCurrent: true } }, select: { id: true, startDate: true, endDate: true }, orderBy: [{ startDate: "asc" }, { position: "asc" }], take: 12 }),
    db.academicTerm.findMany({ where: { schoolId }, select: { id: true, academicYear: true, startsOn: true, endsOn: true }, orderBy: { startsOn: "asc" }, take: 40 }),
  ]);
  const out: CalendarTerm[] = terms.map((t, i) => ({ id: t.id, n: i + 1, from: dateKeyInZone(t.startDate, timezone), to: dateKeyInZone(t.endDate, timezone) }));
  for (const t of academic) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t.startsOn) || !/^\d{4}-\d{2}-\d{2}$/.test(t.endsOn)) continue;
    const n = academic.filter((x) => x.academicYear === t.academicYear && x.startsOn <= t.startsOn).length;
    out.push({ id: t.id, n, from: t.startsOn, to: t.endsOn });
  }
  return { today, terms: out };
}

/**
 * THE PERSON'S CONTEXT FOR THE DATA QUESTIONS (11 October 2026): what fills a door's parameters — the person's
 * own membership, a college teacher's duties (a duty's desk is theirs only holding it), the modules the school
 * has on, and for a guardian their children AT THE CONVERSATION'S SCHOOL (each by its class, never a name to
 * the model; the names are read here only to tell which child a question names). A child at another school is
 * left out: the conversation's name lexicon is that school's, and nothing of another school is stripped.
 */
export async function dataContextFor(input: { role: Role; userId: string; membershipId: string | null; schoolId: string; question: string; now: Date; timezone?: string }): Promise<DataContext & { childNames: string[] }> {
  let duties: string[] = [];
  if (input.membershipId && (input.role === "FACULTY" || input.role === "HOD")) {
    const m = await db.membership.findUnique({ where: { id: input.membershipId }, select: { dutiesJson: true } });
    duties = parseDuties(m?.dutiesJson ?? null);
  }
  const modules = new Set<string>(await enabledModules(input.schoolId));
  let children: { id: string; className: string | null; names: string[] }[] = [];
  if (input.role === "PARENT") {
    const links = await db.guardianship.findMany({
      where: { parentUserId: input.userId, studentSchoolId: input.schoolId, status: "ACTIVE", student: { status: "ACTIVE", leftAt: null } },
      select: {
        studentMembershipId: true,
        student: { select: { user: { select: { name: true, preferredName: true } }, enrollments: { where: { status: "ACTIVE" }, select: { class: { select: { name: true } } }, orderBy: { enrolledAt: "desc" }, take: 1 } } },
      },
      orderBy: { createdAt: "asc" },
    });
    children = links.map((l) => ({
      id: l.studentMembershipId,
      className: l.student.enrollments[0]?.class.name ?? null,
      names: [l.student.user.name, l.student.user.preferredName].filter((n): n is string => !!n),
    }));
  }
  const named = childNamed(input.question, children);
  return {
    role: input.role,
    membershipId: input.membershipId,
    children: children.map((c) => ({ id: c.id, className: c.className })),
    childId: named?.id ?? (children.length === 1 ? children[0]!.id : null),
    duties,
    modules,
    now: input.now,
    calendar: await calendarFor(input.schoolId, input.timezone ?? "Asia/Kolkata", input.now),
    childNames: children.flatMap((c) => c.names),
  };
}

/**
 * The page a door's data is seen on, for the roles whose menu opens it: named to the model beside the data so an
 * answer from <data> alone names a page that exists (Phase D's pilot: a guardian was sent to a "Payments" page
 * that does not exist). A door not here is named by the help passages, or not at all.
 */
const DOOR_PAGES: Record<string, Partial<Record<Role, `/${string}`>>> = {
  "/api/v1/family/exams": { STUDENT: "/student/exams" },
  "/api/v1/exam-cell/mine": { STUDENT: "/student/exams" },
  "/api/v1/family/student/assignments": { STUDENT: "/student/assignments" },
  "/api/v1/family/timetable": { PARENT: "/parent/timetable" },
  "/api/v1/family/assignments": { PARENT: "/parent/assignments" },
  "/api/v1/family/attendance": { PARENT: "/parent/attendance" },
  "/api/v1/fees/family": { PARENT: "/parent/fees" },
  "/api/v1/staff/assignments": { TEACHER: "/teacher/assignments" },
  "/api/v1/office/syllabus/coverage": { ADMIN: "/admin/syllabus", PRINCIPAL: "/admin/syllabus" },
  "/api/v1/office/certificate-requests": { ADMIN: "/admin/certificates/issue" },
  "/api/v1/fees/overview": { ADMIN: "/admin/fees", ACCOUNTS: "/admin/fees" },
  "/api/v1/shared/inbox": { STUDENT: "/remarks", PARENT: "/remarks", TEACHER: "/remarks", ADMIN: "/remarks", PRINCIPAL: "/remarks" },
  "/api/v1/shared/bulletin": { STUDENT: "/bulletin", PARENT: "/bulletin", TEACHER: "/bulletin", ADMIN: "/bulletin", PRINCIPAL: "/bulletin" },
};

/**
 * Doors whose data a page also draws, named as that page beside their data (F-1, 18 Oct 2026: a guardian's "this
 * term" fee question read the plans and the payment calendar, both drawn on /parent/fees, and was given no "where to
 * see it"); not read for a question pointing at the page, which reads the page's own door (doorsShownOn).
 */
const ALSO_SHOWN_ON: Record<string, Partial<Record<Role, `/${string}`>>> = {
  "/api/v1/family/fees/plans": { PARENT: "/parent/fees" },
  "/api/v1/family/fees/calendar": { PARENT: "/parent/fees" },
};

export function pageForDoor(door: string, role: Role): string | null {
  const page = DOOR_PAGES[door]?.[role] ?? ALSO_SHOWN_ON[door]?.[role] ?? null;
  return page && pageIsRoles(page, role) ? page : null;
}

/**
 * The doors whose data is seen on `page` for this role (Vidura pass 1, page awareness): the reverse of DOOR_PAGES, so
 * "what is due here?" asked beside /parent/fees reads the family's fees door.
 */
export function doorsShownOn(page: string, role: Role): string[] {
  return Object.entries(DOOR_PAGES)
    .filter(([, pages]) => pages[role] === page)
    .map(([door]) => door)
    .filter(() => pageIsRoles(page, role));
}
