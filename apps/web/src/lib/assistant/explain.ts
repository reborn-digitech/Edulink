/**
 * "EXPLAIN THIS TO ME" (docs/plans/vidura.md, the coordinator's recommendation; pass 2, 17 Oct 2026): a link beside a
 * fee demand, a report card's line and an attendance figure on the family's and the staff's own pages, web and phone,
 * opens Vidura with that row named (`about` on the ask). The service reads the row AGAIN, through the person's own
 * door and as the person (router.ts runDoors: the door's own handler, its checks, the module and the heavy-read
 * budget), keeps only that row, sums it up by code (summary.ts) and hands it to the model as the first <data>: the
 * person can only ever be explained what they may already read. A row that is not there (another child's, gone, a
 * door the role does not pass) is no row, and the question is answered as asked.
 *
 * Pure: which door a kind is read from for a role, and how the row is picked out of the door's answer
 * (tests/vidura-two.test.ts).
 */
import type { AssistantAbout } from "@edulink/contracts";
import type { Role } from "../constants";
import type { DoorCall, DoorPath } from "./doors";
import { unwrapDoor } from "./summary";

/** The roles whose own month at work is on /account/attendance or /teacher/attendance/me (the staff self door's). */
const STAFF_SELF: readonly Role[] = ["ADMIN", "PRINCIPAL", "TEACHER", "DRIVER", "LIBRARIAN", "WARDEN", "FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS"];

const MONTH = /^\d{4}-(?:0[1-9]|1[0-2])$/;

/** The door an "Explain this" row is read from, for this role, with its call; null when the role has none for it. Pure. */
export function aboutCall(about: AssistantAbout, role: Role, children: readonly { id: string; className: string | null }[]): DoorCall | null {
  const child = about.childId ? children.findIndex((c) => c.id === about.childId) : -1;
  const childRef = child >= 0 ? { id: children[child]!.id, className: children[child]!.className, n: child + 1 } : null;
  if (about.kind === "FEE_DEMAND") {
    if (role !== "PARENT" || !childRef) return null;
    const door: DoorPath = "/api/v1/fees/family";
    return { door, url: `${door}?childId=${encodeURIComponent(childRef.id)}`, params: {}, child: childRef };
  }
  if (about.kind === "REPORT_LINE") {
    if (role !== "STUDENT" && role !== "PARENT") return null;
    const [cardId, line] = about.id.split(":");
    if (!cardId || !/^s?\d{1,3}$/.test(line ?? "")) return null;
    const door: DoorPath = "/api/v1/family/report-cards/{cardId}";
    return { door, url: `/api/v1/family/report-cards/${encodeURIComponent(cardId)}`, params: { cardId }, child: childRef };
  }
  if (!MONTH.test(about.id)) return null;
  if (role === "PARENT") {
    if (!childRef) return null;
    const door: DoorPath = "/api/v1/family/attendance";
    return { door, url: `${door}?childId=${encodeURIComponent(childRef.id)}&month=${about.id}`, params: {}, child: childRef };
  }
  if (STAFF_SELF.includes(role)) {
    const door: DoorPath = "/api/v1/staff/attendance/me";
    return { door, url: `${door}?month=${about.id}`, params: {}, child: null };
  }
  return null;
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);

/**
 * The one row out of the door's answer, with what a sentence about it needs and nothing else: a fee demand with its
 * lines; a report card's line with the card's title, class, period, overall figure and grading; a month of the
 * register with its summary and its days. Null when the row is not in the answer. Pure.
 */
export function aboutRow(about: AssistantAbout, raw: unknown): Obj | null {
  const data = unwrapDoor(raw);
  if (!isObj(data)) return null;
  if (about.kind === "FEE_DEMAND") {
    const child = isObj(data.child) ? data.child : null;
    const demands = Array.isArray(child?.demands) ? (child!.demands as unknown[]) : [];
    const row = demands.find((d) => isObj(d) && d.id === about.id);
    return isObj(row) ? { demand: row } : null;
  }
  if (about.kind === "REPORT_LINE") {
    // "<cardId>:<n>" is the card's n-th assessment line; "<cardId>:s<n>" its n-th subject row (a card by subject).
    const which = about.id.split(":")[1] ?? "";
    const list = which.startsWith("s") ? data.subjects : data.items;
    const item = Array.isArray(list) ? list[Number(which.replace(/^s/, ""))] : undefined;
    if (!isObj(item)) return null;
    const card: Obj = {};
    for (const k of ["title", "className", "classSection", "fromDateKey", "toDateKey", "overallPercent", "gradingMethod", "attendancePresent", "attendanceTotal", "attendancePercent"]) if (k in data) card[k] = data[k];
    return { line: item, card };
  }
  if (data.month !== about.id) return null;
  const out: Obj = { month: data.month };
  if ("summary" in data) out.summary = data.summary;
  if (Array.isArray(data.days)) out.days = data.days;
  if (Array.isArray(data.lectures)) out.lectures = data.lectures;
  return out;
}

/** What the <data> block holding the row is called for the model. Pure. */
export function aboutName(about: AssistantAbout): string {
  return about.kind === "FEE_DEMAND" ? "the fee demand the person asked about" : about.kind === "REPORT_LINE" ? "the report card line the person asked about" : "the month of attendance the person asked about";
}
