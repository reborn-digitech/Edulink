/**
 * THE EXAM-SCOPE READER (docs/plans/assistant.md §1 and §8.4–8.5; built 10 October 2026 after Phase D's
 * pilot scored 6/55: the tutor never read the pupil's exams and help read them badly). Pure: the raw answer
 * of the pupil's own exams door (`/api/v1/family/exams` for a school, `/api/v1/exam-cell/mine` for a
 * college) becomes a few plain lines the model may read beside the passages: the sittings ahead with their
 * dates and subjects, or that none is scheduled, and the last series held. No pupil's name, no identifier:
 * the summary is still passed through the stripper by the service. The model is told (prompt.ts) to answer
 * "when is my exam" and "which subjects" from these lines exactly, and that which TOPICS a paper covers the
 * platform does not record, so that is still the teacher's to say.
 */
/** The name of the reader's lines in the help prompt's <data> block (service.ts). */
export const EXAMS_SUMMARY_NAME = "examsSummary";

type Envelope = { data?: unknown } & Record<string, unknown>;

function unwrap(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Envelope;
  const d = e.data && typeof e.data === "object" ? (e.data as Record<string, unknown>) : e;
  return d;
}

function clock(minute: unknown): string {
  if (typeof minute !== "number" || !Number.isInteger(minute) || minute < 0 || minute > 1440) return "";
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

const KIND: Record<string, string> = { UNIT_TEST: "unit test", MID_TERM: "mid-term", FINAL: "final" };

/** "24 November 2026": a date the stripper never reads as a phone number next to a clock time ("2026-11-24 09:00" it did). */
function longDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  return `${d} ${new Date(Date.UTC(y, m - 1, d)).toLocaleString("en-GB", { month: "long", timeZone: "UTC" })} ${y}`;
}

/** Indian school time, the product's one zone for now; the door's instants carry none. */
function whenIST(iso: unknown): string {
  if (typeof iso !== "string" || Number.isNaN(Date.parse(iso))) return "";
  const d = new Date(iso);
  const date = longDate(d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }));
  const time = d.toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });
  return `${date} at ${time}`;
}

/** The school door (`familyExamsSchema`): the date sheets still ahead and the marks' series. */
export function examSummaryFromFamily(raw: unknown): string | null {
  const d = unwrap(raw);
  if (!d || !Array.isArray(d.upcoming) || !Array.isArray(d.marks)) return null;
  const lines: string[] = [];
  for (const sheet of d.upcoming as { name?: string; kind?: string; slots?: { subject?: string; dateKey?: string; startMinute?: number | null; endMinute?: number | null }[] }[]) {
    const slots = (sheet.slots ?? []).filter((s): s is { subject: string; dateKey: string; startMinute?: number | null; endMinute?: number | null } => !!s.subject && !!s.dateKey);
    if (!slots.length) continue;
    const kind = sheet.kind && KIND[sheet.kind] ? ` (${KIND[sheet.kind]})` : "";
    const papers = slots.map((s) => {
      const from = clock(s.startMinute);
      const to = clock(s.endMinute);
      return `${s.subject} on ${longDate(s.dateKey)}${from ? ` at ${from}${to ? `–${to}` : ""}` : ""}`;
    });
    lines.push(`Sitting ahead: ${sheet.name ?? "exam"}${kind}: ${papers.join("; ")}.`);
  }
  if (!lines.length) lines.push("No sitting is scheduled ahead on the platform.");
  // The last series held, by its latest paper, so "when was my last exam" and "which subjects" have an answer.
  let last: { name: string; kind?: string; papers: { subject: string; dateKey: string }[]; latest: string } | null = null;
  for (const child of d.marks as { series?: { name?: string; kind?: string; papers?: { subject?: string; dateKey?: string }[] }[] }[]) {
    for (const series of child.series ?? []) {
      const papers = (series.papers ?? []).filter((p): p is { subject: string; dateKey: string } => !!p.subject && !!p.dateKey);
      if (!papers.length || !series.name) continue;
      const latest = papers.map((p) => p.dateKey).sort().at(-1)!;
      if (!last || latest > last.latest) last = { name: series.name, kind: series.kind, papers, latest };
    }
  }
  if (last) {
    const kind = last.kind && KIND[last.kind] ? ` (${KIND[last.kind]})` : "";
    lines.push(`Last held: ${last.name}${kind}: ${last.papers.map((p) => `${p.subject} on ${longDate(p.dateKey)}`).join("; ")}.`);
  }
  return lines.join("\n");
}

/** The college door (`myExamsSchema`): the sessions' forms, the papers seated ahead, the results out. */
export function examSummaryFromCollege(raw: unknown): string | null {
  const d = unwrap(raw);
  if (!d || !Array.isArray(d.forms) || !Array.isArray(d.seating)) return null;
  const lines: string[] = [];
  const now = Date.now();
  const published = new Map<string, string>();
  for (const r of (Array.isArray(d.results) ? d.results : []) as { sessionName?: string; publishedAt?: string | null }[]) {
    if (r.sessionName && r.publishedAt) published.set(r.sessionName, whenIST(r.publishedAt).replace(/ at .*$/, ""));
  }
  // Newest session first, so "when does my session start" reads the one that matters.
  const forms = [...(d.forms as { sessionName?: string; status?: string; opensAt?: string | null; closesAt?: string | null; courses?: { code?: string; name?: string }[] }[])]
    .filter((f) => f.sessionName)
    .sort((a, b) => Date.parse(b.opensAt ?? "") - Date.parse(a.opensAt ?? ""));
  for (const form of forms) {
    const courses = (form.courses ?? []).map((c) => (c.name && c.code ? `${c.name} (${c.code})` : c.name ?? c.code ?? "")).filter(Boolean);
    const papers = courses.length ? `; papers: ${courses.join(", ")}` : "";
    const out = published.get(form.sessionName!);
    if (out) {
      lines.push(`Exam session ${form.sessionName}: already sat, results published on ${out}${papers}.`);
      continue;
    }
    const closed = form.closesAt ? Date.parse(form.closesAt) < now : false;
    const window = form.opensAt && form.closesAt ? `, forms ${closed ? "were open" : "open"} ${whenIST(form.opensAt).replace(/ at .*$/, "")} to ${whenIST(form.closesAt).replace(/ at .*$/, "")}` : "";
    lines.push(`Exam session ${form.sessionName}: form ${(form.status ?? "").toLowerCase() || "on record"}${window}${papers}.`);
  }
  const ahead = (d.seating as { courseCode?: string; courseName?: string; at?: string; roomName?: string }[])
    .filter((s) => s.at && Date.parse(s.at) >= now)
    .sort((a, b) => Date.parse(a.at!) - Date.parse(b.at!));
  if (ahead.length) lines.push(`Papers scheduled: ${ahead.map((s) => `${s.courseName ?? s.courseCode ?? "paper"}${s.courseCode && s.courseName ? ` (${s.courseCode})` : ""} on ${whenIST(s.at)}${s.roomName ? ` in ${s.roomName}` : ""}`).join("; ")}.`);
  else if (lines.length) lines.push("No paper is scheduled ahead on the platform; the exam cell announces the next session's dates.");
  return lines.length ? lines.join("\n") : null;
}

/** The exams doors the reader reads, by their catalog path (the data questions' router, 11 Oct 2026) or the names the harness gives them. */
export const COLLEGE_EXAMS_DOOR = "/api/v1/exam-cell/mine";
export const FAMILY_EXAMS_DOOR = "/api/v1/family/exams";
const COLLEGE_NAMES = new Set(["collegeExams", COLLEGE_EXAMS_DOOR]);
const FAMILY_NAMES = new Set(["myExams", "childExams", FAMILY_EXAMS_DOOR]);

/** The lines from whichever exams doors answered, in the order they ran; null when none did. */
export function examSummary(runs: readonly { name?: string; door?: string; ok: boolean; raw?: unknown }[]): string | null {
  const parts: string[] = [];
  for (const run of runs) {
    if (!run.ok || run.raw === undefined) continue;
    const name = run.door ?? run.name ?? "";
    const text = COLLEGE_NAMES.has(name) ? examSummaryFromCollege(run.raw) : FAMILY_NAMES.has(name) ? examSummaryFromFamily(run.raw) : null;
    if (text) parts.push(text);
  }
  return parts.length ? parts.join("\n") : null;
}
