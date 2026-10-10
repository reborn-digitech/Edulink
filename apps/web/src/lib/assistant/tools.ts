import "server-only";
import { ENDPOINTS } from "../api-catalog";
import { permits } from "../api-catalog/types";
import { endpointFor } from "../role-gate";
import { isModuleOn } from "../modules";
import { consume } from "../rate-limit";
import { HEAVY_READ_BUDGET } from "../api-v1";
import type { Role } from "../constants";
import { MAX_TOOLS_PER_QUESTION, TOOL_ANSWER_MAX_CHARS } from "./config";
import { policyFor, type ToolName } from "./policy";
import { stripIdentifiers, type NameEntry } from "./strip";
import { withoutInjectedLines } from "./refusals";

/**
 * THE TOOL ALLOW-LIST (the owner's rule 4): cheap GET doors of the catalog the person may already open,
 * called AS THE PERSON — the door's own handler, with the session of the request that asked, so the
 * tenant fence, the role gate and the module gate stay exactly as they are — and only when the
 * question asks about the thing the door holds. The model never reads tenant data any other way, and
 * never chooses a tool: the intent patterns below do, in code. A door's answer is stripped of
 * identifiers (strip.ts), cleared of instruction-shaped lines, cut short, and handed to the model as
 * <data>. Each call is counted against the person's heavy-read budget (api-v1.ts).
 */
type Handler = (request: Request) => Promise<Response>;

export type ToolSpec = {
  path: `/api/v1/${string}`;
  /** What in a question asks for this door, in en, hi and mr. */
  intent: RegExp;
  load: () => Promise<{ GET: Handler | (() => Promise<Response>) }>;
  /**
   * The page where this role sees what the door returns, named to the model beside the data (Phase D's pilot,
   * 10 Oct 2026: with no help passage the model sent a guardian to a "Payments" page that does not exist).
   * Absent where the page depends on the role or a card on the home carries it.
   */
  page?: `/${string}`;
};

const TIMETABLE = /\b(?:timetable|time table|schedule|periods?|lessons? (?:today|tomorrow)|what do i have)\b|समय ?सारणी|टाइम ?टेबल|वेळापत्रक|तासिका/;
const EXAMS = /\b(?:exams?|tests?|papers?|date ?sheet|marks)\b|परीक्षा|पेपर|गुण/;
const WORK = /\b(?:homework|assignments?|due|hand(?:ed)? in|submit)\b|गृहकार्य|होमवर्क|असाइनमेंट|स्वाध्याय/;
const ATTENDANCE = /\b(?:attendance|absent|present|absences?)\b|हाज़िरी|हाजिरी|उपस्थिति|उपस्थिती|गैरहाजर|अनुपस्थित/;
// `\b` is an ASCII word boundary: "फी बाकी" never matched `फी\b` (Phase D's pilot, 10 Oct 2026: a guardian's Marathi
// fees question reached no door and fell out of scope), so the Devanagari word ends where the script ends.
const FEES = /\b(?:fees?|dues|paid|payment|instal?ments?)\b|शुल्क|फीस|फी(?![\u0900-\u097F])|हप्ता/;
const REGISTERS = /\b(?:registers?|roll ?call|attendance|mark(?:ed|ing)? (?:the )?(?:register|attendance))\b|हाज़िरी|हाजिरी|हजेरी|उपस्थिती/;
const SYLLABUS = /\b(?:syllabus|coverage|behind|chapters? (?:done|covered))\b|पाठ्यक्रम|अभ्यासक्रम/;
const LECTURES = /\b(?:lectures?|my classes today|classes today)\b|व्याख्यान/;

export const TOOLS: Record<ToolName, ToolSpec> = {
  myTimetable: { path: "/api/v1/family/timetable", intent: TIMETABLE, load: () => import("@/app/api/v1/family/timetable/route") },
  myExams: { path: "/api/v1/family/exams", page: "/student/exams", intent: EXAMS, load: () => import("@/app/api/v1/family/exams/route") },
  // A college pupil's sessions, forms, seating and results (the exam-scope reader, 10 Oct 2026); a school's EXAMS module answers 403 or nothing.
  collegeExams: { path: "/api/v1/exam-cell/mine", page: "/student/exams", intent: EXAMS, load: () => import("@/app/api/v1/exam-cell/mine/route") },
  myAssignments: { path: "/api/v1/family/student/assignments", page: "/student/assignments", intent: WORK, load: () => import("@/app/api/v1/family/student/assignments/route") },
  childTimetable: { path: "/api/v1/family/timetable", page: "/parent/timetable", intent: TIMETABLE, load: () => import("@/app/api/v1/family/timetable/route") },
  childExams: { path: "/api/v1/family/exams", intent: EXAMS, load: () => import("@/app/api/v1/family/exams/route") },
  childAssignments: { path: "/api/v1/family/assignments", page: "/parent/assignments", intent: WORK, load: () => import("@/app/api/v1/family/assignments/route") },
  childAttendance: { path: "/api/v1/family/attendance", page: "/parent/attendance", intent: ATTENDANCE, load: () => import("@/app/api/v1/family/attendance/route") },
  childFees: { path: "/api/v1/fees/family", page: "/parent/fees", intent: FEES, load: () => import("@/app/api/v1/fees/family/route") },
  teacherTimetable: { path: "/api/v1/staff/timetable", intent: TIMETABLE, load: () => import("@/app/api/v1/staff/timetable/route") },
  registersDue: { path: "/api/v1/staff/attendance/classes", intent: REGISTERS, load: () => import("@/app/api/v1/staff/attendance/classes/route") },
  teacherAssignments: { path: "/api/v1/staff/assignments", page: "/teacher/assignments", intent: WORK, load: () => import("@/app/api/v1/staff/assignments/route") },
  officeSyllabusCoverage: { path: "/api/v1/office/syllabus/coverage", page: "/admin/syllabus", intent: SYLLABUS, load: () => import("@/app/api/v1/office/syllabus/coverage/route") },
  myLectures: { path: "/api/v1/academics/lectures", intent: LECTURES, load: () => import("@/app/api/v1/academics/lectures/route") },
};

/** Does the question ask about exams, tests or papers (the exam-scope reader runs the exams door in tutor mode too)? Pure. */
export function asksAboutExams(question: string): boolean {
  return EXAMS.test(question.toLowerCase());
}

/** The tools a question asks for, among the role's own, at most MAX_TOOLS_PER_QUESTION. Pure. */
export function toolsFor(role: Role, question: string): ToolName[] {
  const q = question.toLowerCase();
  return policyFor(role)
    .tools.filter((name) => TOOLS[name].intent.test(q))
    .slice(0, MAX_TOOLS_PER_QUESTION);
}

/**
 * A field whose whole value was an identifier ("teacher": "[PERSON_1]", "id": "[ID_3]") tells the model
 * nothing it may use and is the one thing it then repeats: in Phase D's pilot (10 Oct 2026) a pupil's
 * "what is on my timetable today" was answered "Mathematics, taught by [PERSON_1]" and the answer gate
 * discarded it, every time. Such fields are dropped before the model reads the door's answer.
 */
const PLACEHOLDER_ONLY_FIELD = /^\s*"[^"]*":\s*"(?:\s*\[(?:PERSON|SCHOOL|EMAIL|PHONE|LINK|ID|CODE)(?:_\d+)?\][\s,;/&]*)+",?\s*$/;

/**
 * The platform's own units, read as a person reads them (Phase D's pilot, 10 Oct 2026: a guardian was told
 * "1,250,000 paise" are due and a pupil's periods ran "480 to 525 minutes"): every `…Paise` amount becomes
 * `…Rupees` in rupees ("₹12,500"), every `…Minute` of the day (0–1440) becomes `…Time` ("08:00"). Pure.
 */
export function readableForModel(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(readableForModel);
  if (!value || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    const paise = /^(.*?)(?:P|p)aise$/.exec(key);
    const minute = /^(.*?)Minute$/.exec(key);
    if (paise && typeof v === "number" && Number.isFinite(v)) {
      out[paise[1] ? `${paise[1]}Rupees` : "rupees"] = `₹${(v / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
    } else if (minute && typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 1440) {
      out[`${minute[1]}Time`] = `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
    } else out[key] = readableForModel(v);
  }
  return out;
}

/** A door's JSON as the model may read it: amounts and times made readable, identifiers out, instruction-shaped lines out, fields that were only an identifier dropped, cut short. Pure. */
export function toolDataForModel(json: unknown, lexicon: NameEntry[]): string {
  const text = JSON.stringify(readableForModel(json), null, 1) ?? "";
  const stripped = withoutInjectedLines(stripIdentifiers(text, lexicon).text);
  return stripped
    .split("\n")
    .filter((line) => !PLACEHOLDER_ONLY_FIELD.test(line))
    .join("\n")
    .slice(0, TOOL_ANSWER_MAX_CHARS);
}

export type ToolRun = {
  name: ToolName;
  ok: boolean;
  data: string | null;
  status: number | null;
  /** The door's own JSON, for the code that reads a door by shape (the exam-scope reader, exams.ts); never the model's. */
  raw?: unknown;
};

/**
 * Call the question's tools as the person. A door the catalog says the role may not pass, behind a
 * module the school has off, over the person's heavy-read budget, or answering anything but 200 gives
 * nothing to the model (and says so in the run, for the tests).
 */
export async function runTools(input: { role: Role; schoolId: string | null; userId: string; duties?: readonly string[]; question: string; lexicon: NameEntry[] }): Promise<ToolRun[]> {
  const runs: ToolRun[] = [];
  for (const name of toolsFor(input.role, input.question)) {
    const spec = TOOLS[name];
    const entry = endpointFor("GET", spec.path, ENDPOINTS);
    if (!entry || !permits(entry, input.role, input.duties ?? [])) {
      runs.push({ name, ok: false, data: null, status: 403 });
      continue;
    }
    if (entry.module && input.schoolId && !(await isModuleOn(input.schoolId, entry.module))) {
      runs.push({ name, ok: false, data: null, status: 403 });
      continue;
    }
    const gate = await consume(`assistant-tool:${input.userId}`, HEAVY_READ_BUDGET.limit, HEAVY_READ_BUDGET.windowMs);
    if (!gate.allowed) {
      runs.push({ name, ok: false, data: null, status: 429 });
      continue;
    }
    try {
      const mod = await spec.load();
      const res = await (mod.GET as Handler)(new Request(new URL(spec.path, "http://assistant.internal")));
      if (res.status !== 200) {
        runs.push({ name, ok: false, data: null, status: res.status });
        continue;
      }
      const raw: unknown = await res.json();
      runs.push({ name, ok: true, data: toolDataForModel(raw, input.lexicon), status: 200, raw });
    } catch {
      runs.push({ name, ok: false, data: null, status: null });
    }
  }
  return runs;
}
