/**
 * The server writes web URLs into notifications (/teacher/attendance?classId=…,
 * /remarks/c/…). This maps them to the app's screens, so a push tap opens
 * the right place; a URL with no screen opens the web in the system browser.
 */
export type ScreenTarget = { pathname: string; params?: Record<string, string> };

export function screenFor(url: string): ScreenTarget | null {
  const u = new URL(url, "https://app.local");
  const p = u.pathname;
  const q = Object.fromEntries(u.searchParams.entries());
  if (p === "/teacher" || p === "/parent" || p === "/student" || p === "/admin" || p === "/principal" || p === "/expert") return { pathname: "/(app)" };
  if (p === "/teacher/attendance" || p === "/parent/attendance") return { pathname: "/(app)/attendance", params: q };
  if (p.startsWith("/remarks/c/")) return { pathname: "/(app)/messages/room", params: { conversationId: p.split("/")[3]! } };
  if (p.startsWith("/remarks/")) return { pathname: "/(app)/messages/thread", params: { threadId: p.split("/")[2]! } };
  if (p === "/remarks") return { pathname: "/(app)/messages" };
  if (p === "/notifications") return { pathname: "/(app)/notifications" };
  if (p.startsWith("/teacher/classes/")) return { pathname: "/(app)/classes/detail", params: { classId: p.split("/")[3]! } };
  if (p === "/teacher/classes" || p === "/principal/classes") return { pathname: "/(app)/classes" };
  if (p === "/teacher/assignments" || p === "/student/assignments" || p === "/parent/assignments") return { pathname: "/(app)/assignments", params: q };
  if (p === "/teacher/exams") return { pathname: "/(app)/marks", params: q };
  if (p === "/teacher/leave" || p === "/principal/leave") return { pathname: "/(app)/leave" };
  if (p === "/student/practice" || p === "/parent/practice") return { pathname: "/(app)/practice", params: q };
  if (p === "/exams" || p === "/report-cards") return { pathname: "/(app)/exams" };
  if (p === "/parent/meetings" || p === "/teacher/meetings") return { pathname: "/(app)/meetings" };
  if (p === "/bulletin" || p === "/bulletin/global") return { pathname: "/(app)/bulletin", params: q };
  return null;
}
