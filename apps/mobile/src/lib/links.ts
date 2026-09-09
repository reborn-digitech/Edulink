/**
 * The server writes web URLs into notifications (/teacher/attendance?classId=…,
 * /remarks/c/…). This maps them to the app's screens, so a push tap opens
 * the right place; a URL with no screen opens the web in the system browser.
 */
export type ScreenTarget = { pathname: string; params?: Record<string, string> };

/** Web paths that are one app screen, whatever the role — the role's route file picks the component. */
const FLAT: Record<string, string> = {
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
  "/root": "/(app)/operator",
  "/appadmin": "/(app)/appadmin",
};

export function screenFor(url: string): ScreenTarget | null {
  const u = new URL(url, "https://app.local");
  const p = u.pathname.replace(/\/$/, "") || "/";
  const q = Object.fromEntries(u.searchParams.entries());
  const withQuery = (pathname: string): ScreenTarget => (Object.keys(q).length ? { pathname, params: q } : { pathname });
  const flat = FLAT[p];
  if (flat) return withQuery(flat);
  const seg = p.split("/");
  if (p.startsWith("/remarks/c/") && seg[3]) return { pathname: "/(app)/messages/room", params: { conversationId: seg[3] } };
  if (p.startsWith("/remarks/") && seg[2] && seg.length === 3) return { pathname: "/(app)/messages/thread", params: { threadId: seg[2] } };
  if ((p.startsWith("/teacher/classes/") || p.startsWith("/principal/classes/") || p.startsWith("/admin/classes/")) && seg[3] && seg.length === 4 && seg[3] !== "new") return { pathname: "/(app)/classes/detail", params: { classId: seg[3] } };
  if (p.startsWith("/mentoring/") && seg[2]) return { pathname: "/(app)/mentoring/thread", params: { threadId: seg[2] } };
  if (p.startsWith("/competitions/") && seg[2] && seg[2] !== "new") return { pathname: "/(app)/competitions/detail", params: { competitionId: seg[2] } };
  if (p.startsWith("/enquiries/") && seg[2]) return { pathname: "/(app)/enquiries/detail", params: { enquiryId: seg[2] } };
  if (p.startsWith("/report-cards/") && seg[2]) return { pathname: "/(app)/exams", params: { cardId: seg[2] } };
  return null;
}
