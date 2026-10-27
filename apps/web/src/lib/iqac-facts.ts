import "server-only";
import { IQAC_ENTERED_INPUTS, type IqacEnteredInput } from "@edulink/contracts";
import { db } from "./db";
import { readJsonArray } from "./json";
import { SURVEY_MIN_RESPONSES, type Facts } from "./iqac-rules";

/**
 * WHERE THE PREDICTOR'S FACTS COME FROM (the IQAC module, 4 October 2026).
 *
 * Every fact a NAAC formula reads (lib/iqac-rules.ts) is counted here from
 * the college's own rows, over the cycle's window: students on the roll from
 * memberships; teachers from FACULTY and HOD memberships and their faculty
 * records; programmes, schemes, courses and mentoring from ACADEMICS;
 * results and revaluations from EXAMS; the placement table from PLACEMENT;
 * scholarships from SCHOLARSHIPS; assets from INVENTORY; purchases from the
 * office's finance table (accounts.ts financeTable); research,
 * activities, committees, surveys and grievances from this module's own
 * registers. A figure the platform does not hold is one the IQAC entered for
 * the cycle (`enteredJson`, IQAC_ENTERED_INPUTS) with evidence; where neither
 * exists the fact is null, its metric reads 0, and `reasons` says why.
 *
 * Most modules' rows are counted directly — each fact is a count of rows
 * those modules own (one writer each), the same count their own pages make.
 * Where a module exposes the figure as a function, that function is read:
 * placement's `placementTable` (placement-analytics.ts) and the office's
 * `financeTable` (accounts.ts).
 */

export type FactSource = "ROWS" | "ENTERED" | "MISSING";
export type FactReason = "entered" | "zero" | `module:${string}`;
export type EvidenceRow = { type: string; id: string; label: string };
export type GatheredFacts = { facts: Facts; source: Record<string, FactSource>; reasons: Record<string, FactReason>; evidence: Record<string, EvidenceRow[]> };

/** Which entered input stands for which fact; `fallback` ones are used only where the rows give nothing. */
export const ENTERED_FACT: Record<IqacEnteredInput, { fact: string; fallback: boolean }> = {
  SANCTIONED_POSTS: { fact: "sanctionedPosts", fallback: false },
  BANDWIDTH_MBPS: { fact: "bandwidthMbps", fallback: false },
  COMPUTERS: { fact: "computers", fallback: true },
  NON_SALARY_EXPENDITURE_LAKHS: { fact: "nonSalaryLakhs", fallback: false },
  INFRA_EXPENDITURE_LAKHS: { fact: "infraLakhs", fallback: true },
  MAINTENANCE_EXPENDITURE_LAKHS: { fact: "maintenanceLakhs", fallback: false },
  RESERVED_SEATS_EARMARKED: { fact: "reservedEarmarked", fallback: true },
  GREEN_OPTIONS: { fact: "greenOptions", fallback: false },
  QA_CERTIFICATIONS: { fact: "qaCertifications", fallback: false },
  EMPLOYABILITY_COURSES: { fact: "employabilityCourses", fallback: false },
  NEW_COURSES: { fact: "newCourses", fallback: true },
  TOTAL_COURSES: { fact: "totalCourses", fallback: true },
};

export type Entered = Partial<Record<IqacEnteredInput, { value: number | null; byUserId?: string; at?: string; fileIds?: string[] }>>;

export function readEntered(raw: string | null | undefined): Entered {
  try {
    const parsed = JSON.parse(raw || "{}") as Record<string, unknown>;
    const out: Entered = {};
    for (const k of IQAC_ENTERED_INPUTS) {
      const v = parsed[k] as { value?: unknown } | undefined;
      if (v && (typeof v.value === "number" || v.value === null)) out[k] = v as Entered[IqacEnteredInput];
    }
    return out;
  } catch {
    return {};
  }
}

/** The academic years (June to May) a window covers, by starting year. */
export function academicYears(windowFrom: string, windowTo: string): number[] {
  const from = Number(windowFrom.slice(0, 4)) - (Number(windowFrom.slice(5, 7)) < 6 ? 1 : 0);
  const to = Number(windowTo.slice(0, 4)) - (Number(windowTo.slice(5, 7)) < 6 ? 1 : 0);
  const out: number[] = [];
  for (let y = from; y <= to; y += 1) out.push(y);
  return out.length ? out : [from];
}
const yearStart = (y: number) => new Date(Date.UTC(y, 5, 1));
const yearEnd = (y: number) => new Date(Date.UTC(y + 1, 4, 31, 23, 59, 59));
const keyIn = (key: string, from: string, to: string) => key >= from && key <= to;

const TEACHER_ROLES = ["FACULTY", "HOD"];
const STAFF_ROLES = ["ADMIN", "PRINCIPAL", "FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS", "LIBRARIAN", "WARDEN", "DRIVER", "TEACHER", "SUPPORT"]; // SUPPORT: owner-batch-item2a

export async function gatherFacts(schoolId: string, windowFrom: string, windowTo: string, entered: Entered, now = new Date()): Promise<GatheredFacts> {
  const years = academicYears(windowFrom, windowTo);
  const facts: Facts = {};
  const source: Record<string, FactSource> = {};
  const reasons: Record<string, FactReason> = {};
  const evidence: Record<string, EvidenceRow[]> = {};
  const fromDate = yearStart(years[0]!);
  const toDate = yearEnd(years[years.length - 1]!);
  const latest = Math.min(years[years.length - 1]!, now.getUTCFullYear() - (now.getUTCMonth() < 5 ? 1 : 0));

  const set = (key: string, value: number | null, opts: { module?: string; evidence?: EvidenceRow[] } = {}) => {
    facts[key] = value;
    source[key] = value === null ? "MISSING" : "ROWS";
    if (value === null && opts.module) reasons[key] = `module:${opts.module}`;
    if (opts.evidence?.length) evidence[key] = opts.evidence.slice(0, 50);
  };

  const [students, teachers, staff, records, research, activities, committees, meetings, surveys, grievances, atrs, modules, filings] = await Promise.all([
    db.membership.findMany({ where: { schoolId, role: "STUDENT" }, select: { id: true, joinedAt: true, leftAt: true } }),
    db.membership.findMany({ where: { schoolId, role: { in: TEACHER_ROLES }, status: "ACTIVE", leftAt: null }, select: { id: true, joinedAt: true, user: { select: { name: true } } } }),
    db.membership.count({ where: { schoolId, role: { in: STAFF_ROLES }, status: "ACTIVE", leftAt: null } }),
    db.facultyRecord.findMany({ where: { schoolId }, select: { membershipId: true, appointment: true, highestQualification: true, netSetQualified: true, joinedOn: true, experienceBeforeYears: true } }),
    db.researchItem.findMany({ where: { schoolId, year: { gte: years[0]!, lte: years[years.length - 1]! + 1 } }, select: { id: true, kind: true, title: true, indexing: true, amountLakhs: true, facultyMembershipId: true } }),
    db.activity.findMany({ where: { schoolId, at: { gte: windowFrom, lte: windowTo } }, select: { id: true, kind: true, title: true, at: true, participants: true, participantIdsJson: true, theme: true } }),
    db.committee.findMany({ where: { schoolId }, select: { id: true, kind: true, name: true } }),
    db.committeeMeeting.findMany({ where: { schoolId, at: { gte: windowFrom, lte: windowTo } }, select: { id: true, at: true, committee: { select: { kind: true, name: true } } } }),
    db.survey.findMany({ where: { schoolId, opensOn: { lte: windowTo }, closesOn: { gte: windowFrom } }, select: { id: true, kind: true, title: true, closesOn: true, closedAt: true, _count: { select: { responses: true } } } }),
    db.grievance.findMany({ where: { schoolId, filedAt: { gte: fromDate, lte: toDate } }, select: { id: true, status: true, dueOn: true, resolvedAt: true, filedAt: true } }),
    db.actionTakenReport.findMany({ where: { schoolId }, select: { id: true, surveyId: true, publishedAt: true } }),
    db.schoolModule.findMany({ where: { schoolId }, select: { module: true } }),
    // The window's own years (DS-10, 6 Oct 2026): a NIRF filed for a later year never counts toward an earlier AQAR.
    db.collegeFiling.findMany({ where: { schoolId, year: { gte: years[0]!, lte: years[years.length - 1]! } }, select: { id: true, kind: true, year: true } }),
  ]);

  /* --- students ---------------------------------------------------------- */
  const onRoll = (y: number) => students.filter((s) => s.joinedAt <= yearEnd(y) && (!s.leftAt || s.leftAt >= yearStart(y))).length;
  const studentYears = years.reduce((a, y) => a + onRoll(y), 0);
  set("studentYears", studentYears || null, { module: "STUDENTS" });
  set("studentsLatest", onRoll(latest) || null, { module: "STUDENTS" });
  set("windowYears", years.length);

  /* --- teachers ---------------------------------------------------------- */
  const recordOf = new Map(records.map((r) => [r.membershipId, r]));
  const fullTime = teachers.filter((t) => (recordOf.get(t.id)?.appointment ?? "REGULAR") !== "VISITING");
  set("fullTimeTeachers", fullTime.length || null, { module: "FACULTY", evidence: fullTime.map((t) => ({ type: "Membership", id: t.id, label: t.user.name })) });
  const phdNet = fullTime.filter((t) => { const r = recordOf.get(t.id); return !!r && (r.highestQualification === "PHD" || r.netSetQualified); });
  set("phdNetTeachers", fullTime.length ? phdNet.length : null, { module: "FACULTY", evidence: phdNet.map((t) => ({ type: "FacultyRecord", id: t.id, label: t.user.name })) });
  const nowYears = (d: Date) => Math.max(0, (now.getTime() - d.getTime()) / (365.25 * 86_400_000));
  const experience = fullTime.reduce((a, t) => {
    const r = recordOf.get(t.id);
    const joined = r?.joinedOn ? new Date(`${r.joinedOn}T00:00:00Z`) : t.joinedAt;
    return a + nowYears(joined);
  }, 0);
  set("experienceTotalYears", fullTime.length ? Math.round(experience * 10) / 10 : null, { module: "FACULTY" });
  set("staffTotal", staff || null, { module: "STAFF" });

  /* --- research register --------------------------------------------------- */
  const inWindow = research;
  const ofKind = (...kinds: string[]) => inWindow.filter((r) => kinds.includes(r.kind));
  const rows = (xs: { id: string; title: string }[], type = "ResearchItem") => xs.map((x) => ({ type, id: x.id, label: x.title }));
  const papers = ofKind("PUBLICATION").filter((r) => r.indexing === "UGC_CARE" || r.indexing === "SCOPUS" || r.indexing === "WEB_OF_SCIENCE");
  set("papers", papers.length, { evidence: rows(papers) });
  const books = ofKind("BOOK", "CONFERENCE");
  set("books", books.length, { evidence: rows(books) });
  const lakhs = (xs: { amountLakhs: number | null }[]) => Math.round(xs.reduce((a, x) => a + (x.amountLakhs ?? 0), 0) * 100) / 100;
  set("grantLakhs", lakhs(ofKind("PROJECT")), { evidence: rows(ofKind("PROJECT")) });
  set("seedLakhs", lakhs(ofKind("SEED_MONEY")), { evidence: rows(ofKind("SEED_MONEY")) });
  set("consultancyLakhs", lakhs(ofKind("CONSULTANCY")), { evidence: rows(ofKind("CONSULTANCY")) });
  set("mous", ofKind("MOU").length, { evidence: rows(ofKind("MOU")) });
  const awarded = new Set(ofKind("AWARD").map((r) => r.facultyMembershipId).filter(Boolean));
  set("teachersAwarded", awarded.size, { evidence: rows(ofKind("AWARD")) });
  const supported = new Set(ofKind("CONFERENCE").filter((r) => (r.amountLakhs ?? 0) > 0).map((r) => r.facultyMembershipId).filter(Boolean));
  set("teachersSupported", supported.size, { evidence: rows(ofKind("CONFERENCE").filter((r) => (r.amountLakhs ?? 0) > 0)) });

  /* --- activity register ----------------------------------------------------- */
  const acts = (...kinds: string[]) => activities.filter((a) => kinds.includes(a.kind));
  const actRows = (xs: { id: string; title: string; at: string }[]) => xs.map((x) => ({ type: "Activity", id: x.id, label: x.title + " (" + x.at + ")" }));
  const heads = (xs: { participants: number }[]) => xs.reduce((a, x) => a + x.participants, 0);
  set("valueAddedCourses", acts("VALUE_ADDED_COURSE").length, { evidence: actRows(acts("VALUE_ADDED_COURSE")) });
  set("valueAddedParticipants", heads(acts("VALUE_ADDED_COURSE")), { evidence: actRows(acts("VALUE_ADDED_COURSE")) });
  const extension = acts("EXTENSION", "NSS", "NCC");
  set("extensionProgrammes", extension.length, { evidence: actRows(extension) });
  set("extensionParticipants", heads(extension), { evidence: actRows(extension) });
  set("extensionAwards", acts("EXTENSION_AWARD").length, { evidence: actRows(acts("EXTENSION_AWARD")) });
  set("collaborations", acts("COLLABORATION", "INDUSTRIAL_VISIT").length, { evidence: actRows(acts("COLLABORATION", "INDUSTRIAL_VISIT")) });
  set("iprWorkshops", acts("IPR_WORKSHOP").length, { evidence: actRows(acts("IPR_WORKSHOP")) });
  set("careerGuidanceParticipants", heads(acts("CAREER_GUIDANCE")), { evidence: actRows(acts("CAREER_GUIDANCE")) });
  set("competitiveQualified", heads(acts("COMPETITIVE_EXAM")), { evidence: actRows(acts("COMPETITIVE_EXAM")) });
  set("studentAwards", acts("STUDENT_AWARD").length, { evidence: actRows(acts("STUDENT_AWARD")) });
  set("sportsCulturalEvents", acts("SPORTS", "CULTURAL").length, { evidence: actRows(acts("SPORTS", "CULTURAL")) });
  const themes = new Set(acts("CAPACITY_BUILDING").map((a) => a.theme).filter(Boolean));
  set("capacityThemes", themes.size, { evidence: actRows(acts("CAPACITY_BUILDING")) });
  const auditKinds = new Set(acts("AUDIT_GREEN", "AUDIT_ENERGY", "AUDIT_GENDER", "AUDIT_ACADEMIC").map((a) => a.kind));
  set("auditOptions", Math.min(4, auditKinds.size), { evidence: actRows(acts("AUDIT_GREEN", "AUDIT_ENERGY", "AUDIT_GENDER", "AUDIT_ACADEMIC")) });
  const fdpPeople = new Set(acts("FDP").flatMap((a) => readJsonArray<string>(a.participantIdsJson)));
  set("staffInFdp", fdpPeople.size, { evidence: actRows(acts("FDP")) });

  /* --- committees, grievances, surveys ----------------------------------------- */
  const hasCommittee = (k: string) => committees.some((c) => c.kind === k);
  const decided = grievances.filter((g) => g.status === "RESOLVED");
  const inTime = decided.filter((g) => g.resolvedAt && g.resolvedAt.toISOString().slice(0, 10) <= g.dueOn).length;
  const timely = grievances.length === 0 ? hasCommittee("GRIEVANCE") : decided.length > 0 && inTime / Math.max(1, grievances.length) >= 0.9;
  set("grievanceOptions", [hasCommittee("GRIEVANCE"), hasCommittee("ANTI_RAGGING"), hasCommittee("ICC"), timely].filter(Boolean).length, { evidence: committees.filter((c) => ["GRIEVANCE", "ANTI_RAGGING", "ICC"].includes(c.kind)).map((c) => ({ type: "Committee", id: c.id, label: c.name })) });
  const answered = surveys.filter((s) => s._count.responses > 0);
  const stakeholder = (...kinds: string[]) => answered.some((s) => kinds.includes(s.kind));
  set("feedbackStakeholders", [stakeholder("SSS", "COURSE_FEEDBACK", "EXIT"), stakeholder("TEACHER"), stakeholder("EMPLOYER"), stakeholder("ALUMNI")].filter(Boolean).length, { evidence: answered.map((s) => ({ type: "Survey", id: s.id, label: s.title })) });
  const atrBySurvey = new Map(atrs.map((a) => [a.surveyId, a]));
  const closed = answered.filter((s) => s.closedAt || s.closesOn < now.toISOString().slice(0, 10));
  set("feedbackProcess", [answered.length > 0, closed.length > 0, answered.some((s) => atrBySurvey.has(s.id)), answered.some((s) => atrBySurvey.get(s.id)?.publishedAt)].filter(Boolean).length, { evidence: answered.map((s) => ({ type: "Survey", id: s.id, label: s.title })) });
  // The SSS mean is the survey's anonymity floor's as much as its counts are (campaign S-17): only a
  // CLOSED survey — so the figure cannot move answer by answer, which would let two readings a
  // response apart difference out one student's answers — and only with SURVEY_MIN_RESPONSES or more.
  const sss = closed.filter((s) => s.kind === "SSS").sort((a, b) => b.closesOn.localeCompare(a.closesOn))[0];
  if (sss) {
    const responses = await db.surveyResponse.findMany({ where: { surveyId: sss.id }, select: { answersJson: true } });
    const all = responses.flatMap((r) => Object.values(JSON.parse(r.answersJson) as Record<string, number>)).filter((v) => typeof v === "number");
    const enough = responses.length >= SURVEY_MIN_RESPONSES && all.length > 0;
    set("sssMean", enough ? Math.round((all.reduce((a, b) => a + b, 0) / all.length) * 100) / 100 : null, { module: "SSS", evidence: [{ type: "Survey", id: sss.id, label: sss.title }] });
  } else set("sssMean", null, { module: "SSS" });
  const iqacMeetings = meetings.filter((m) => m.committee.kind === "IQAC");
  const filedNirf = filings.some((f) => f.kind === "NIRF");
  set("qaOptions", 0);
  const qaCert = entered.QA_CERTIFICATIONS?.value ?? 0;
  facts.qaOptions = [iqacMeetings.length >= years.length * 2, auditKinds.has("AUDIT_ACADEMIC"), filedNirf, qaCert > 0].filter(Boolean).length;
  evidence.qaOptions = [...iqacMeetings.map((m) => ({ type: "CommitteeMeeting", id: m.id, label: m.committee.name + " (" + m.at + ")" })), ...filings.filter((f) => f.kind === "NIRF").map((f) => ({ type: "Filing", id: f.id, label: "NIRF " + f.year }))].slice(0, 50);

  /* --- e-governance: the platform itself ------------------------------------- */
  const on = new Set(modules.map((m) => m.module));
  const feeHeads = await db.feeHead.count({ where: { schoolId } });
  set("egovOptions", [on.has("ACADEMICS"), on.has("PAYROLL") || feeHeads > 0, on.has("ADMISSIONS"), on.has("EXAMS")].filter(Boolean).length);

  /* --- ACADEMICS -------------------------------------------------------------- */
  const [programmes, schemes, courses, mentorGroups, seats, enrolments] = await Promise.all([
    db.programme.findMany({ where: { schoolId, archivedAt: null }, select: { id: true, code: true, intake: true } }),
    db.scheme.findMany({ where: { schoolId }, select: { id: true, programmeId: true, effectiveYear: true } }),
    db.course.findMany({ where: { schoolId }, select: { id: true, code: true, kind: true, schemeId: true } }),
    db.mentoringGroup.findMany({ where: { schoolId }, select: { facultyMembershipId: true } }),
    db.studentProgramme.findMany({ where: { schoolId, entryYear: { gte: years[0]!, lte: years[years.length - 1]! } }, select: { id: true, entryYear: true } }),
    db.programmeEnrolment.findMany({ where: { schoolId, yearOfEntry: { gte: years[0]!, lte: years[years.length - 1]! } }, select: { category: true } }),
  ]);
  set("programmes", programmes.length || null, { module: "ACADEMICS" });
  const schemeOf = new Map(schemes.map((s) => [s.id, s]));
  const revised = new Set(schemes.filter((s) => years.includes(s.effectiveYear)).map((s) => s.programmeId));
  set("programmesRevised", programmes.length ? revised.size : null, { module: "ACADEMICS" });
  const cbcs = new Set(courses.filter((c) => c.kind !== "CORE").map((c) => schemeOf.get(c.schemeId)?.programmeId).filter(Boolean));
  set("cbcsProgrammes", programmes.length ? cbcs.size : null, { module: "ACADEMICS" });
  set("totalCourses", courses.length || null, { module: "ACADEMICS" });
  const olderCodes = new Set(courses.filter((c) => !years.includes(schemeOf.get(c.schemeId)?.effectiveYear ?? -1)).map((c) => c.code));
  set("newCourses", courses.length ? courses.filter((c) => years.includes(schemeOf.get(c.schemeId)?.effectiveYear ?? -1) && !olderCodes.has(c.code)).length : null, { module: "ACADEMICS" });
  const mentors = new Set(mentorGroups.map((g) => g.facultyMembershipId));
  set("mentors", mentors.size || null, { module: "ACADEMICS" });
  const intake = programmes.reduce((a, p) => a + p.intake, 0);
  set("sanctionedSeats", intake ? intake * years.length : null, { module: "ACADEMICS" });
  set("admitted", programmes.length ? seats.length : null, { module: "ACADEMICS" });
  set("reservedAdmitted", enrolments.length ? enrolments.filter((e) => e.category !== "OPEN").length : null, { module: "ADMISSIONS" });
  const rounds = await db.admissionRound.findMany({ where: { schoolId, intakeYear: { gte: years[0]!, lte: years[years.length - 1]! } }, select: { seatsJson: true } });
  const earmarked = rounds.reduce((a, r) => {
    try {
      const seatsBy = JSON.parse(r.seatsJson) as Record<string, number>;
      return a + Object.entries(seatsBy).filter(([k]) => k !== "OPEN").reduce((s, [, v]) => s + (Number(v) || 0), 0);
    } catch {
      return a;
    }
  }, 0);
  set("reservedEarmarked", earmarked || null, { module: "ADMISSIONS" });

  /* --- project work: internships, projects, field projects (latest year) ------ */
  const ly = { from: yearStart(latest), to: yearEnd(latest) };
  const [internships, projects] = await Promise.all([
    db.internship.findMany({ where: { schoolId, fromKey: { gte: ly.from.toISOString().slice(0, 10), lte: ly.to.toISOString().slice(0, 10) } }, select: { id: true, studentMembershipId: true, companyName: true } }),
    db.project.findMany({ where: { schoolId, createdAt: { gte: ly.from, lte: ly.to } }, select: { id: true, title: true, studentMembershipIds: true } }),
  ]);
  const projectStudents = new Set([...internships.map((i) => i.studentMembershipId), ...projects.flatMap((p) => readJsonArray<string>(p.studentMembershipIds))]);
  const fieldHeads = heads(acts("FIELD_PROJECT").filter((a) => keyIn(a.at, ly.from.toISOString().slice(0, 10), ly.to.toISOString().slice(0, 10))));
  set("projectStudents", projectStudents.size + fieldHeads, { evidence: [...internships.map((i) => ({ type: "Internship", id: i.id, label: i.companyName })), ...projects.map((p) => ({ type: "Project", id: p.id, label: p.title }))] });

  /* --- EXAMS ------------------------------------------------------------------ */
  const runs = await db.resultRun.findMany({ where: { schoolId, status: "PUBLISHED", publishedAt: { gte: fromDate, lte: toDate } }, select: { id: true, sessionId: true, number: true, publishedAt: true }, orderBy: [{ sessionId: "asc" }, { number: "desc" }] });
  const latestRun = new Map<string, (typeof runs)[number]>();
  for (const r of runs) if (!latestRun.has(r.sessionId)) latestRun.set(r.sessionId, r);
  const runIds = [...latestRun.values()].map((r) => r.id);
  if (runIds.length) {
    const termResults = await db.termResult.findMany({ where: { runId: { in: runIds } }, select: { status: true } });
    set("appeared", termResults.length || null, { module: "EXAMS" });
    set("passed", termResults.length ? termResults.filter((t) => t.status === "PASS").length : null, { module: "EXAMS", evidence: [...latestRun.values()].map((r) => ({ type: "ResultRun", id: r.id, label: "#" + r.number })) });
    set("examAppeared", termResults.length || null, { module: "EXAMS" });
    const days: number[] = [];
    for (const r of latestRun.values()) {
      const last = await db.examSchedule.findFirst({ where: { sessionId: r.sessionId }, orderBy: { at: "desc" }, select: { at: true } });
      if (last && r.publishedAt) days.push(Math.max(0, Math.round((r.publishedAt.getTime() - last.at.getTime()) / 86_400_000)));
    }
    set("resultDaysAvg", days.length ? Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10 : null, { module: "EXAMS" });
    set("evalGrievances", await db.revaluation.count({ where: { schoolId, sessionId: { in: [...latestRun.keys()] } } }));
  } else {
    for (const k of ["appeared", "passed", "examAppeared", "resultDaysAvg", "evalGrievances"]) set(k, null, { module: "EXAMS" });
  }

  /* --- PLACEMENT: the placement module's own table, computed on read (placementTable) --- */
  const { placementTable } = await import("./placement-analytics");
  const tables = await Promise.all(years.map((y) => placementTable(schoolId, y + 1)));
  const withBatch = tables.filter((x) => x.finalYear > 0);
  if (withBatch.length) {
    const ev = withBatch.map((x) => ({ type: "PlacementTable", id: String(x.batchYear), label: String(x.batchYear) }));
    set("outgoing", withBatch.reduce((a, x) => a + x.finalYear, 0), { module: "PLACEMENT", evidence: ev });
    set("placed", withBatch.reduce((a, x) => a + x.placed, 0), { evidence: ev });
    set("higherStudies", withBatch.reduce((a, x) => a + x.higherStudies, 0), { evidence: ev });
  } else for (const k of ["outgoing", "placed", "higherStudies"]) set(k, null, { module: "PLACEMENT" });

  /* --- SCHOLARSHIPS ------------------------------------------------------------ */
  const yearLabels = years.map((y) => `${y}-${String((y + 1) % 100).padStart(2, "0")}`);
  const claims = await db.scholarshipClaim.findMany({ where: { schoolId, academicYear: { in: yearLabels }, status: { in: ["SANCTIONED", "DISBURSED"] } }, select: { id: true, studentMembershipId: true, academicYear: true, scheme: true } });
  const beneficiaries = new Set(claims.map((c) => `${c.academicYear}|${c.studentMembershipId}`));
  set("scholarshipBeneficiaries", beneficiaries.size, { evidence: claims.map((c) => ({ type: "ScholarshipClaim", id: c.id, label: c.scheme + " " + c.academicYear })) });

  /* --- INVENTORY: assets bought in the window, computers in use --------------- */
  const assets = await db.asset.findMany({ where: { schoolId }, select: { id: true, name: true, costPaise: true, purchaseDate: true, disposedAt: true, category: { select: { name: true } } } });
  const bought = assets.filter((a) => a.purchaseDate && a.purchaseDate >= fromDate && a.purchaseDate <= toDate);
  set("infraLakhs", bought.length ? Math.round((bought.reduce((a, x) => a + x.costPaise, 0) / 100 / 100_000) * 100) / 100 : null, { module: "INVENTORY", evidence: bought.map((a) => ({ type: "Asset", id: a.id, label: a.name })) });
  const computers = assets.filter((a) => !a.disposedAt && /computer|laptop|desktop|संगणक/i.test(`${a.category?.name ?? ""} ${a.name}`));
  set("computers", computers.length || null, { module: "INVENTORY" });

  /* --- ACCOUNTS: expenditure other than salaries, from the office's finance table (financeTable) --- */
  const { financeTable } = await import("./accounts");
  const finance = (await financeTable(schoolId, 5)).years.filter((y) => years.includes(Number(y.academicYear.slice(0, 4))));
  const purchases = finance.reduce((a, y) => a + y.purchasesPaise, 0);
  set("nonSalaryLakhs", purchases > 0 ? Math.round((purchases / 100 / 100_000) * 100) / 100 : null, { module: "ACCOUNTS", evidence: finance.map((y) => ({ type: "FinanceYear", id: y.academicYear, label: y.academicYear })) });

  /* --- the figures only the IQAC can enter --------------------------------- */
  for (const k of ["sanctionedPosts", "bandwidthMbps", "maintenanceLakhs", "greenOptions", "qaCertifications", "employabilityCourses"]) if (!(k in facts)) { facts[k] = null; source[k] = "MISSING"; reasons[k] = "entered"; }
  for (const [input, { fact, fallback }] of Object.entries(ENTERED_FACT) as [IqacEnteredInput, { fact: string; fallback: boolean }][]) {
    const v = entered[input]?.value;
    if (v === null || v === undefined) continue;
    if (fallback && facts[fact] !== null && facts[fact] !== undefined && facts[fact] !== 0) continue;
    facts[fact] = v;
    source[fact] = "ENTERED";
    delete reasons[fact];
  }
  if (facts.greenOptions !== null && facts.greenOptions !== undefined) facts.greenOptions = Math.min(4, facts.greenOptions);
  for (const [k, v] of Object.entries(facts)) if (v === 0 && source[k] === "ROWS") reasons[k] = reasons[k] ?? "zero";
  return { facts, source, reasons, evidence };
}

/** For NIRF's published formulas: the faculty and student shares the IQAC page shows. */
export async function nirfFacts(schoolId: string, gathered: GatheredFacts, now = new Date()) {
  const [teachers, records, studentRecords, staffRecords] = await Promise.all([
    db.membership.findMany({ where: { schoolId, role: { in: TEACHER_ROLES }, status: "ACTIVE", leftAt: null }, select: { id: true, joinedAt: true } }),
    db.facultyRecord.findMany({ where: { schoolId }, select: { membershipId: true, highestQualification: true, experienceBeforeYears: true, joinedOn: true } }),
    db.pupilRecord.findMany({ where: { schoolId, student: { role: "STUDENT", status: "ACTIVE", leftAt: null } }, select: { gender: true } }),
    db.staffRecord.findMany({ where: { schoolId, membership: { role: { in: TEACHER_ROLES }, status: "ACTIVE", leftAt: null } }, select: { gender: true } }),
  ]);
  const rec = new Map(records.map((r) => [r.membershipId, r]));
  const n = teachers.length;
  const exp = teachers.map((t) => {
    const r = rec.get(t.id);
    const joined = r?.joinedOn ? new Date(`${r.joinedOn}T00:00:00Z`) : t.joinedAt;
    return (r?.experienceBeforeYears ?? 0) + Math.max(0, (now.getTime() - joined.getTime()) / (365.25 * 86_400_000));
  });
  const frac = (p: (x: number) => boolean) => (n ? exp.filter(p).length / n : null);
  /** Gender as the record holds it (the UDISE+ codes M, F, T); a share over the records that say. */
  const women = (xs: { gender: string | null }[]) => { const known = xs.filter((x) => x.gender); return known.length ? (known.filter((x) => x.gender === "F").length / known.length) * 100 : null; };
  const intake = gathered.facts.sanctionedSeats && gathered.facts.windowYears ? gathered.facts.sanctionedSeats / gathered.facts.windowYears : null;
  const out = gathered.facts.outgoing;
  return {
    faculty: n || null,
    intake,
    phdPct: n ? (teachers.filter((t) => rec.get(t.id)?.highestQualification === "PHD").length / n) * 100 : null,
    f1: frac((x) => x <= 8),
    f2: frac((x) => x > 8 && x <= 15),
    f3: frac((x) => x > 15),
    placedPct: out ? ((gathered.facts.placed ?? 0) / out) * 100 : null,
    higherPct: out ? ((gathered.facts.higherStudies ?? 0) / out) * 100 : null,
    passInTimePct: gathered.facts.appeared ? ((gathered.facts.passed ?? 0) / gathered.facts.appeared) * 100 : null,
    womenStudentsPct: women(studentRecords),
    womenFacultyPct: women(staffRecords),
  };
}
