import { WEB_PATH_PATTERN } from "@edulink/contracts";

/**
 * The server writes web URLs into notifications (/teacher/attendance?classId=…,
 * /remarks/c/…). This maps them to the app's screens, so a push tap opens
 * the right place; a URL with no screen opens the web in the system browser.
 */
export type ScreenTarget = { pathname: string; params?: Record<string, string> };

/** Web paths that are one app screen, whatever the role — the role's route file picks the component. */
const FLAT: Record<string, string> = {
  // Inventory and payroll (3 Oct 2026): the notices of a payslip, an advance and an ask to the stores land here.
  "/account/payslips": "/(app)/payslips",
  "/admin/payroll": "/(app)/payroll",
  "/admin/payroll/advances": "/(app)/payroll",
  "/admin/inventory": "/(app)/inventory",
  "/admin/inventory/requests": "/(app)/inventory",
  "/teacher": "/(app)",
  "/parent": "/(app)",
  "/student": "/(app)",
  "/admin": "/(app)",
  "/principal": "/(app)",
  "/expert": "/(app)",
  "/teacher/attendance": "/(app)/attendance",
  "/parent/attendance": "/(app)/attendance",
  "/admin/attendance": "/(app)/attendance",
  "/attendance/history": "/(app)/attendance",
  "/remarks": "/(app)/messages",
  "/notifications": "/(app)/notifications",
  "/teacher/classes": "/(app)/classes",
  "/principal/classes": "/(app)/classes",
  "/admin/classes": "/(app)/classes",
  "/teacher/assignments": "/(app)/assignments",
  "/student/assignments": "/(app)/assignments",
  "/parent/assignments": "/(app)/assignments",
  "/teacher/exams": "/(app)/marks",
  "/admin/exams": "/(app)/exams",
  "/exams": "/(app)/exams",
  "/report-cards": "/(app)/exams",
  "/teacher/leave": "/(app)/leave",
  "/principal/leave": "/(app)/leave",
  "/principal/staff": "/(app)/staff",
  "/student/practice": "/(app)/practice",
  "/parent/practice": "/(app)/practice",
  "/teacher/practice": "/(app)/practice",
  "/parent/meetings": "/(app)/meetings",
  "/teacher/meetings": "/(app)/meetings",
  "/bulletin": "/(app)/bulletin",
  "/bulletin/global": "/(app)/bulletin",
  "/timetable": "/(app)/timetable",
  "/parent/timetable": "/(app)/timetable",
  "/principal/timetable": "/(app)/timetable",
  "/admin/timetable": "/(app)/timetable",
  "/admin/calendar": "/(app)/calendar",
  "/admin/reviews": "/(app)/reviews",
  "/reviews": "/(app)/reviews",
  "/admin/safety": "/(app)/safety",
  "/admin/settings": "/(app)/settings",
  "/parent/settings": "/(app)/settings",
  "/admin/people": "/(app)/people",
  "/teacher/profile": "/(app)/profile",
  "/student/profile": "/(app)/profile",
  "/expert/profile": "/(app)/profile",
  "/expert/availability": "/(app)/availability",
  "/experts": "/(app)/experts",
  "/vacancies": "/(app)/vacancies",
  "/admin/vacancies": "/(app)/vacancies",
  "/explore": "/(app)/explore",
  "/archive": "/(app)/archive",
  "/mentoring": "/(app)/mentoring",
  "/competitions": "/(app)/competitions",
  "/enquiries": "/(app)/enquiries",
  // People waiting for a yes: the staff's queue and a guardian's are one screen.
  "/joins": "/(app)/joins",
  "/parent/claims": "/(app)/joins",
  // An adult student's own: what each guardian sees, and somebody asking to be their guardian (TA-555).
  "/student/consent": "/(app)/consent",
  "/root": "/(app)/operator",
  "/appadmin": "/(app)/appadmin",
  // The screens that used to open the web (September 2026).
  "/account": "/(app)/account",
  "/parent/link": "/(app)/link-child",
  "/competitions/new": "/(app)/competition-new",
  "/appadmin/new": "/(app)/competition-new",
  "/appadmin/bank": "/(app)/question-bank",
  "/teacher/assignments/new": "/(app)/assignments",
  "/remarks/new": "/(app)/remark-new",
  "/remarks/people": "/(app)/people",
  "/admin/invites": "/(app)/invites",
  "/admin/invites/new": "/(app)/invites",
  "/admin/intake": "/(app)/intake",
  "/admin/directory": "/(app)/directory-profile",
  "/admin/classes/new": "/(app)/class-new",
  "/bulletin/new": "/(app)/post-new",
  // Their own screens since A3-inventory-14 (risks batch, 5 Oct 2026).
  "/bulletin/celebrations": "/(app)/celebrations",
  "/student/practice/journey": "/(app)/practice-journey",
  "/teacher/worksheets": "/(app)/worksheets",
  "/root/new": "/(app)/operator-new-school",
  "/root/experts": "/(app)",
  "/root/audit": "/(app)",
  "/root/jobs": "/(app)",
  "/root/content-team": "/(app)",
  // Fees (September 2026): the family's page and the office's overview, dues and claims.
  "/parent/fees": "/(app)/fees",
  "/admin/fees": "/(app)/fees",
  "/admin/fees/claims": "/(app)/fee-claims",
  "/admin/fees/dues": "/(app)/fees-dues",
  // Texts & WhatsApp (September 2026): the office's overview; a notice's report needs its id (BY_ID).
  "/admin/messaging": "/(app)/messaging",
  "/admin/messaging/new": "/(app)/messaging-new",
  // Admissions (September 2026): the office's cycles and pipeline, the family's applications; an application needs its id (BY_ID).
  "/admin/admissions": "/(app)/admissions",
  "/admin/admissions/applications": "/(app)/applications",
  "/admin/admissions/applications/new": "/(app)/application-new",
  "/parent/applications": "/(app)/my-applications",
  // Filings (September 2026): the UDISE+ and board returns, for the office and the head.
  "/admin/filings": "/(app)/filings",
  // Gigs (September 2026): sessions are one screen for the family, the provider and the office; a teacher's questions for the bank are two.
  "/sessions": "/(app)/sessions",
  "/expert/sessions": "/(app)/sessions",
  "/teacher/guidance": "/(app)/sessions",
  "/admin/sessions": "/(app)/sessions",
  "/teacher/contributions": "/(app)/contributions",
  "/teacher/contributions/new": "/(app)/contribution",
  // Transport (3 Oct 2026): the family's "bus is near" lands on the child's bus; the driver's home is the home.
  "/parent/transport": "/(app)/transport",
  // owner-batch-item5: the pupil's own bus is the same screen, read as the pupil.
  "/student/transport": "/(app)/transport",
  "/driver": "/(app)",
  // The college exam cell (G4-13, risks batch 5 Oct 2026): a form decided, grace marks granted and results published land
  // on the student's exams, a guardian's on the child's results (one screen, the role's route picks); a duty on the duties.
  "/student/exams": "/(app)/college-exams",
  "/parent/results": "/(app)/college-exams",
  "/faculty/exams": "/(app)/exam-duties",
  // The college desks' parity batch (10 Oct 2026, R-4): the desks' pages, native.
  "/placement/drives": "/(app)/placement-drives",
  "/placement/students": "/(app)/placement-students",
  "/placement/companies": "/(app)/placement-companies",
  "/placement/internships": "/(app)/supervision",
  "/placement/analytics": "/(app)/placement-table",
  "/faculty/supervision": "/(app)/supervision",
  "/hod/projects": "/(app)/supervision",
  "/accounts/structures": "/(app)/fee-structures",
  "/accounts/scholarships": "/(app)/scholarship-claims",
  "/accounts/no-dues": "/(app)/no-dues",
  "/accounts/concessions": "/(app)/concessions",
  "/accounts/students": "/(app)/accounts-lookup",
  "/exam-cell/after": "/(app)/exam-after",
  "/iqac/grievances": "/(app)/iqac-grievances",
  "/iqac/surveys": "/(app)/iqac-surveys",
  "/iqac/documents": "/(app)/iqac-filings",
  "/iqac/registers": "/(app)/research",
  "/faculty/research": "/(app)/research",
  "/hod/research": "/(app)/research",
  "/iqac/predictor": "/(app)/iqac-predictor",
  "/admin/faculty-records": "/(app)/faculty-records",
  "/faculty/profile": "/(app)/faculty-profile",
  "/hostel/expulsions": "/(app)/hostel-expulsions",
  "/hostel/squad": "/(app)/hostel-squad",
  "/account/items": "/(app)/my-items",
  "/admin/stream-records": "/(app)/stream-records",
  "/admin/transport": "/(app)/office-transport",
  "/admin/alumni": "/(app)/office-alumni",
  "/admin/hostel": "/(app)/office-hostel",
  "/admin/academics": "/(app)/office-academics",
  "/admin/college-admissions": "/(app)/office-admissions",
  "/accounts": "/(app)/accounts",
  "/exam-cell": "/(app)/exam-cell",
  "/placement": "/(app)/placement-cell",
  // A student's placement notices (QA-70: an invitation, a round's result, an offer) carry the web's /student/placement:
  // the student's own placement screen.
  "/student/placement": "/(app)/placement",
  "/iqac": "/(app)/iqac-desk",
  // Notices whose page the phone has, which opened the web in the system browser, signed out (TA-499, 13 Nov 2026).
  // The query (?child=, ?incident=, ?membershipId=) goes with each, as everywhere above.
  "/parent/hostel": "/(app)/hostel",
  "/student/hostel": "/(app)/hostel",
  "/parent/incidents": "/(app)/family-incidents",
  "/student/academics": "/(app)/academics",
  "/parent/academics": "/(app)/academics",
  "/student/registration": "/(app)/registration",
  "/student/voice": "/(app)/voice",
  "/parent/record": "/(app)/record",
  "/student/record": "/(app)/record",
  "/student/clinical": "/(app)/clinical-logbook",
  "/student/certificates": "/(app)/certificates",
  "/parent/certificates": "/(app)/certificates",
  "/student/studios": "/(app)/student-studios",
  "/faculty/studios": "/(app)/studios",
  "/student/placement/talks": "/(app)/placement-talks",
  "/parent/library": "/(app)/library",
  "/faculty/mentoring": "/(app)/academics-mentoring",
  "/alumni/college": "/(app)/alumni-college",
  "/admin/website": "/(app)/website",
  "/admin/certificates/issue": "/(app)/certificate-issue",
  // The homes of the roles the web names (WEB_HOME below), and the site's root: the phone's home tab.
  "/": "/(app)",
  "/faculty": "/(app)",
  "/hod": "/(app)",
  "/alumni": "/(app)",
  "/recruiter": "/(app)",
  "/library": "/(app)",
  "/hostel": "/(app)",
};

/** Paths under these prefixes whose second segment is an id, and the screen and param that id becomes. */
const BY_ID: { prefix: string; pathname: string; param: string; not?: string[] }[] = [
  { prefix: "/teacher/assignments/", pathname: "/(app)/assignment", param: "assignmentId", not: ["new"] },
  { prefix: "/explore/", pathname: "/(app)/school", param: "schoolId" },
  { prefix: "/vacancies/", pathname: "/(app)/vacancy", param: "postingId" },
  { prefix: "/experts/bookings/", pathname: "/(app)/booking", param: "bookingId" },
  { prefix: "/expert/bookings/", pathname: "/(app)/booking", param: "bookingId" },
  { prefix: "/bulletin/", pathname: "/(app)/post", param: "postId", not: ["new", "global", "celebrations"] },
  { prefix: "/root/", pathname: "/(app)/operator-school", param: "schoolId", not: ["new", "experts", "audit", "jobs", "content-team"] },
  { prefix: "/admin/messaging/", pathname: "/(app)/messaging-broadcast", param: "broadcastId", not: ["new"] },
  { prefix: "/admin/admissions/applications/", pathname: "/(app)/application", param: "id", not: ["new"] },
  { prefix: "/parent/applications/", pathname: "/(app)/my-application", param: "id" },
  { prefix: "/teacher/contributions/", pathname: "/(app)/contribution", param: "id", not: ["new"] },
  // The parity batch (10 Oct 2026): a session and a drive by id.
  { prefix: "/exam-cell/sessions/", pathname: "/(app)/exam-session", param: "sessionId" },
  { prefix: "/placement/drives/", pathname: "/(app)/placement-drive", param: "driveId" },
  // TA-499: a lecture to cover, a course file reviewed, a certificate issued, a pupil's record or fees to see.
  { prefix: "/faculty/lectures/", pathname: "/(app)/lecture", param: "id" },
  { prefix: "/faculty/offerings/", pathname: "/(app)/offering", param: "id" },
  { prefix: "/certificates/", pathname: "/(app)/certificate", param: "id" },
  { prefix: "/admin/records/", pathname: "/(app)/pupil-record", param: "membershipId" },
  { prefix: "/admin/fees/pupils/", pathname: "/(app)/fee-pupil", param: "studentMembershipId" },
];

export function screenFor(url: string): ScreenTarget | null {
  const u = new URL(url, "https://app.local");
  const p = u.pathname.replace(/\/$/, "") || "/";
  const q = Object.fromEntries(u.searchParams.entries());
  const withQuery = (pathname: string): ScreenTarget => (Object.keys(q).length ? { pathname, params: q } : { pathname });
  const flat = FLAT[p];
  if (flat) return withQuery(flat);
  const seg = p.split("/");
  if (p === "/student/practice/revision") return { pathname: "/(app)/quiz", params: { ...q, mode: "revision" } };
  if (p.startsWith("/student/practice/") && seg[3] && seg.length === 4) return { pathname: "/(app)/quiz", params: { ...q, mode: "topic", slug: seg[3] } };
  if (p.startsWith("/teacher/classes/") && seg[3] && seg[4] === "report-cards") return { pathname: "/(app)/report-cards", params: { classId: seg[3] } };
  if (p.startsWith("/competitions/") && seg[2] && seg[3] === "entries") return { pathname: "/(app)/competition-entries", params: { competitionId: seg[2] } };
  if (p.startsWith("/appadmin/bank/") && seg[3]) return { pathname: "/(app)/question-bank", params: seg[4] ? { topicId: seg[3], questionId: seg[4] } : { topicId: seg[3] } };
  for (const rule of BY_ID) {
    if (!p.startsWith(rule.prefix)) continue;
    const rest = p.slice(rule.prefix.length).split("/");
    if (rest.length === 1 && rest[0] && !(rule.not ?? []).includes(rest[0])) return { pathname: rule.pathname, params: { [rule.param]: rest[0] } };
  }
  if (p.startsWith("/remarks/c/") && seg[3]) return { pathname: "/(app)/messages/room", params: { conversationId: seg[3] } };
  if (p.startsWith("/remarks/") && seg[2] && seg.length === 3) return { pathname: "/(app)/messages/thread", params: { threadId: seg[2] } };
  if ((p.startsWith("/teacher/classes/") || p.startsWith("/principal/classes/") || p.startsWith("/admin/classes/")) && seg[3] && seg.length === 4 && seg[3] !== "new") return { pathname: "/(app)/classes/detail", params: { classId: seg[3] } };
  if (p.startsWith("/mentoring/") && seg[2]) return { pathname: "/(app)/mentoring/thread", params: { threadId: seg[2] } };
  // The query goes with it (TA-168): a guardian's agenda names the child (?child=), whose Enrol the detail draws.
  if (p.startsWith("/competitions/") && seg[2] && seg[2] !== "new") return { pathname: "/(app)/competitions/detail", params: { ...q, competitionId: seg[2] } };
  if (p.startsWith("/enquiries/") && seg[2]) return { pathname: "/(app)/enquiries/detail", params: { enquiryId: seg[2] } };
  if (p.startsWith("/report-cards/") && seg[2]) return { pathname: "/(app)/exams", params: { cardId: seg[2] } };
  return null;
}

/**
 * A link somebody typed into the server (a course file's URL, PH-7 of the
 * campaign of 4 October 2026), fit to hand to Linking.openURL: http or https
 * only. Any other scheme — intent:, sms:, tel:, another app's deep link, or
 * javascript: on the web target — is null, and the row opens nothing.
 */
export function webLinkOrNull(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? trimmed : null;
  } catch {
    return null;
  }
}

/**
 * One of our own web pages, by its path, as a URL on the API's origin (A3-S-14,
 * audit of 5 Oct 2026). Only a single-slash path is taken: no "//host", no
 * backslash, no space or control character (the URL parser drops a tab, so
 * "/\t/host" would become "//host"), nothing before the first "/" such as
 * "@evil.example"; and the URL parsed against `base` must still be on
 * `base`'s origin. Anything else is null, and nothing opens. The pattern is
 * the contracts' WEB_PATH_PATTERN, which the insights CTA's href is held to.
 */
export function webPathUrl(path: string, base: string): string | null {
  if (!WEB_PATH_PATTERN.test(path)) return null;
  try {
    const origin = new URL(base).origin;
    const url = new URL(path, origin);
    return url.origin === origin ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * The web page a phone screen stands for (Vidura pass 1, 17 Oct 2026: page awareness), read back from the table above:
 * the screen's own path ("/fees") is matched against FLAT's screens, and the first web page that opens it is the one
 * Vidura is told the person is beside; the home tab is the role's home. Null for a screen with no web page here, which
 * Vidura then reads as no page at all (the server keeps only the role's own pages). Pure.
 */
/** Each role's home page on the web (the web's ROLE_HOME, src/lib/constants.ts), which the phone's home tab stands for. */
export const WEB_HOME: Record<string, string> = {
  ADMIN: "/admin", PRINCIPAL: "/principal", TEACHER: "/teacher", STUDENT: "/student", PARENT: "/parent", EXPERT: "/expert",
  DRIVER: "/driver", LIBRARIAN: "/library", WARDEN: "/hostel", ALUMNUS: "/alumni", FACULTY: "/faculty", HOD: "/hod",
  EXAM_CONTROLLER: "/exam-cell", IQAC: "/iqac", TPO: "/placement", ACCOUNTS: "/accounts", RECRUITER: "/recruiter",
  SUPPORT: "/account/payslips", // owner-batch-item2a
};

export function webPageFor(pathname: string | null | undefined, home: string): string | null {
  if (!pathname) return null;
  const p = pathname.replace(/^\/\(app\)/, "").replace(/\/$/, "") || "/";
  if (p === "/" || p === "/index") return home;
  const screen = `/(app)${p}`;
  const pages = Object.entries(FLAT)
    .filter(([, s]) => s === screen)
    .map(([page]) => page);
  const homeSegment = home.split("/")[1] ?? "";
  return pages.find((page) => page.split("/")[1] === homeSegment) ?? pages[0] ?? null;
}
