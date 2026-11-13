import { z } from "zod";
import { realDateKey } from "./calendar-keys";

/**
 * admin: request and response schemas for the /api/v1/admin endpoints — the
 * office's navigation pages, one GET per page (what the page shows) and one
 * POST per primary action (thin over the same lib function the page's server
 * action calls). Dates are ISO strings, date keys are YYYY-MM-DD in the
 * school's timezone, ids are strings.
 */

const iso = z.string().datetime();
const isoOrNull = iso.nullable();
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");
const id = z.string().min(1).max(64);
const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max);

const schoolRoleSchema = z.enum(["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS", "FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS", "SUPPORT"]);
/** Staff for the staff register, leave and the staff list: the module roles that work at the school, not the alumnus, a college's six staff roles, and support staff (owner-batch-item2a). */
const staffRoleSchema = z.enum(["TEACHER", "PRINCIPAL", "ADMIN", "DRIVER", "LIBRARIAN", "WARDEN", "FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS", "SUPPORT"]);
const examKindSchema = z.enum(["UNIT_TEST", "MID_TERM", "FINAL"]);
const holidayKindSchema = z.enum(["HOLIDAY", "EXAM", "EVENT"]);
const periodKindSchema = z.enum(["LESSON", "BREAK"]);
const reviewAudienceSchema = z.enum(["STUDENTS", "PARENTS", "BOTH"]);
const employmentTypeSchema = z.enum(["FULL_TIME", "PART_TIME", "TEMPORARY"]);

/** A CSV row the parser could not use — a key and its numbers, never a sentence. */
const csvProblemSchema = z.object({
  line: z.number().int(),
  value: z.string(),
  reasonKey: z.string(),
  reasonVars: z.record(z.union([z.string(), z.number()])).optional(),
});

const nameOption = z.object({ membershipId: id, name: z.string() });

/* ---------------------------------------------------------------------- */
/* /admin — overview                                                       */
/* ---------------------------------------------------------------------- */

export const adminOverviewSchema = z.object({
  school: z.object({ name: z.string(), code: z.string(), timezone: z.string(), todayKey: dateKey }),
  academicYear: z.object({ id, name: z.string() }).nullable(),
  runningTerm: z.object({ id, name: z.string() }).nullable(),
  nextUp: z.object({ name: z.string(), startDateKey: dateKey }).nullable(),
  checklist: z.object({
    done: z.number().int(),
    total: z.number().int(),
    complete: z.boolean(),
    steps: z.array(
      z.object({
        id: z.string(),
        done: z.boolean(),
        href: z.string(),
        titleKey: z.string(),
        descriptionKey: z.string(),
        descriptionVars: z.record(z.union([z.string(), z.number()])).optional(),
        ctaKey: z.string(),
        blockedBy: z.string().nullable(),
      }),
    ),
  }),
  counts: z.object({
    teachers: z.number().int(),
    students: z.number().int(),
    classes: z.number().int(),
    pendingInvites: z.number().int(),
    registersTakenToday: z.number().int(),
    examSeries: z.number().int(),
    examSeriesPublished: z.number().int(),
    reportCardsPublished: z.number().int(),
  }),
  /** Null with no classes — the page shows a dash rather than 0%. */
  attendanceTakenPercent: z.number().int().nullable(),
  staffingGap: z.object({ slots: z.number().int(), classes: z.number().int() }),
  jobStory: z.object({
    attention: z.boolean(),
    entries: z.array(z.object({ job: z.string(), at: iso, counts: z.record(z.number()) })),
  }),
});
export type AdminOverview = z.infer<typeof adminOverviewSchema>;

/* ---------------------------------------------------------------------- */
/* /admin/people, /admin/invites, /admin/intake                            */
/* ---------------------------------------------------------------------- */

export const adminPeopleQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  role: schoolRoleSchema.optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "LEFT"]).default("ACTIVE"),
  classId: id.optional(),
  sort: z.enum(["name", "recent"]).default("name"),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});

const adminPersonSchema = z.object({
  membershipId: id,
  role: z.string(),
  status: z.string(),
  name: z.string(),
  preferredName: z.string().nullable(),
  email: z.string().nullable(),
  avatarKey: z.string().nullable(),
  birthdateKey: dateKey.nullable(),
  studentCode: z.string().nullable(),
  title: z.string().nullable(),
  subjects: z.array(z.string()),
  joinedAt: iso,
  leftAt: isoOrNull,
  suspendedAt: isoOrNull,
  suspendedReason: z.string().nullable(),
  /** Classes enrolled in (a pupil) and classes taught (a teacher). */
  enrolledIn: z.array(z.string()),
  teaches: z.array(z.string()),
  staffRecord: z.object({ designation: z.string().nullable(), joinedOnKey: dateKey.nullable() }).nullable(),
  schoolRecord: z.object({ id, destination: z.string().nullable() }).nullable(),
  scheduledDeparture: z.object({ leaveOnKey: dateKey }).nullable(),
  pendingParentInvites: z.array(z.object({ email: z.string(), name: z.string().nullable() })),
});

export const adminPeopleSchema = z.object({
  members: z.array(adminPersonSchema),
  total: z.number().int(),
  page: z.number().int(),
  pages: z.number().int(),
  pageSize: z.number().int(),
  classes: z.array(z.object({ id, name: z.string() })),
  roleCounts: z.array(z.object({ role: z.string(), count: z.number().int() })),
  suspendedCount: z.number().int(),
  leftCount: z.number().int(),
  filters: z.object({
    q: z.string(),
    role: schoolRoleSchema.nullable(),
    status: z.enum(["ACTIVE", "SUSPENDED", "LEFT"]),
    classId: id.nullable(),
    sort: z.enum(["name", "recent"]),
  }),
});
export type AdminPeople = z.infer<typeof adminPeopleSchema>;

export const adminInvitesQuerySchema = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "REVOKED"]).default("PENDING"),
  role: schoolRoleSchema.optional(),
  q: z.string().trim().max(120).optional(),
  /** Pending only: just the ones whose link has lapsed. */
  expired: z.enum(["1"]).optional(),
});

export const adminInvitesSchema = z.object({
  invites: z.array(
    z.object({
      id,
      role: z.string(),
      email: z.string().nullable(),
      name: z.string().nullable(),
      classId: id.nullable(),
      status: z.string(),
      expiresAt: iso,
      expired: z.boolean(),
      createdAt: iso,
      acceptedAt: isoOrNull,
    }),
  ),
  counts: z.object({ PENDING: z.number().int(), ACCEPTED: z.number().int(), REVOKED: z.number().int() }),
});
export type AdminInvites = z.infer<typeof adminInvitesSchema>;

/** Who the office may invite: every school role but the alumnus, who is made only by a departure. */
const invitableRoleSchema = z.enum(["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "DRIVER", "LIBRARIAN", "WARDEN", "FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS"]);

export const inviteCreateBodySchema = z.object({
  role: invitableRoleSchema,
  /** A pasted list or CSV: one email per line, optionally "name, email, subjects". */
  csv: z.string().min(1).max(500_000),
  classId: id.optional(),
});

export const inviteCreatedSchema = z.object({
  sent: z.number().int(),
  outcomes: z.array(
    z.object({
      email: z.string(),
      name: z.string(),
      status: z.enum(["sent", "skipped", "failed"]),
      reasonKey: z.string().optional(),
    }),
  ),
  problems: z.array(csvProblemSchema),
});

export const intakeBodySchema = z.object({ csv: z.string().min(1).max(500_000) });

export const intakeResultSchema = z.object({
  admitted: z.number().int(),
  guardiansInvited: z.number().int(),
  /** R-61 Q1 (10 Oct 2026): the admitted rows that carried no admission date; the record's date stays blank for the office to fill. */
  withoutAdmissionDate: z.number().int().default(0),
  outcomes: z.array(
    z.object({
      line: z.number().int(),
      name: z.string(),
      status: z.enum(["admitted", "skipped", "failed"]),
      reasonKey: z.string().optional(),
      studentCode: z.string().optional(),
      handle: z.string().optional(),
      firstSignInCode: z.string().optional(),
      className: z.string().nullable().optional(),
      guardian: z.enum(["invited", "none", "notSent"]).optional(),
      guardianReasonKey: z.string().optional(),
      linked: z.boolean().optional(),
      warnKey: z.string().optional(),
    }),
  ),
  problems: z.array(csvProblemSchema),
});

/* ---------------------------------------------------------------------- */
/* /admin/classes, /admin/promotion                                        */
/* ---------------------------------------------------------------------- */

export const adminClassesQuerySchema = z.object({
  archived: z.enum(["1"]).optional(),
  q: z.string().trim().max(80).optional(),
  sort: z.enum(["name", "size"]).default("name"),
  filter: z.enum(["leaderless"]).optional(),
});

const adminClassSchema = z.object({
  id,
  name: z.string(),
  subject: z.string().nullable(),
  gradeLevel: z.string().nullable(),
  section: z.string().nullable(),
  room: z.string().nullable(),
  color: z.string().nullable(),
  joinCode: z.string(),
  archivedAt: isoOrNull,
  pupils: z.number().int(),
  teachers: z.array(z.object({ membershipId: id, name: z.string(), role: z.string() })),
  /** Running, with pupils, and nobody in the LEAD seat. */
  leaderless: z.boolean(),
});

export const adminClassesSchema = z.object({
  classes: z.array(adminClassSchema),
  activeCount: z.number().int(),
  archivedCount: z.number().int(),
  leaderlessCount: z.number().int(),
});
export type AdminClasses = z.infer<typeof adminClassesSchema>;

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "color");

export const classCreateBodySchema = z.object({
  name: trimmed(1, 100),
  subject: trimmed(0, 80).optional(),
  gradeLevel: trimmed(0, 24).optional(),
  section: trimmed(0, 24).optional(),
  room: trimmed(0, 40).optional(),
  color: hexColor.optional().or(z.literal("")),
});
export const classCreatedSchema = z.object({ classId: id, joinCode: z.string() });

/** `archived: true` archives (reversible), `false` restores. */
export const classArchiveBodySchema = z.object({ archived: z.boolean() });

/** `assigned: true` puts the teacher in charge, `false` takes them off the class. */
export const classTeacherBodySchema = z.object({ teacherMembershipId: id, assigned: z.boolean() });

const promotionDestinationSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("CLASS"), classId: id }),
  z.object({
    kind: z.literal("NEW"),
    key: z.string().optional(),
    name: z.string(),
    gradeLevel: z.string().nullable(),
    section: z.string().nullable().optional(),
  }),
  z.object({ kind: z.literal("LEAVE") }),
  z.object({ kind: z.literal("STAY") }),
]);

export const promotionPlanSchema = z.object({
  academicYear: z.object({ id, name: z.string() }).nullable(),
  classes: z.array(
    z.object({
      id,
      name: z.string(),
      gradeLevel: z.string().nullable(),
      section: z.string().nullable(),
      pupils: z.array(z.object({ membershipId: id, name: z.string() })),
      suggested: promotionDestinationSchema,
      candidates: z.array(z.object({ id, name: z.string(), section: z.string().nullable(), pupils: z.number().int() })),
    }),
  ),
});
export type PromotionPlan = z.infer<typeof promotionPlanSchema>;

/* ---------------------------------------------------------------------- */
/* /admin/timetable                                                        */
/* ---------------------------------------------------------------------- */

export const adminTimetableQuerySchema = z.object({ classId: id.optional() });

const timetablePeriodSchema = z.object({
  id,
  name: z.string(),
  startMinute: z.number().int(),
  endMinute: z.number().int(),
  kind: periodKindSchema,
  position: z.number().int(),
  archivedAt: isoOrNull,
});

const timetableSlotSchema = z.object({
  id,
  classId: id,
  className: z.string(),
  periodId: id,
  weekday: z.number().int(),
  subject: z.string(),
  room: z.string().nullable(),
  teacherMembershipId: id.nullable(),
  teacherName: z.string().nullable(),
  coveringMembershipId: id.nullable(),
  coveringName: z.string().nullable(),
  uncovered: z.boolean(),
  borrowed: z.boolean(),
});

const weekGridSchema = z.object({
  periods: z.array(timetablePeriodSchema),
  days: z.array(
    z.object({
      weekday: z.number().int(),
      dateKey: dateKey.nullable(),
      closed: z.boolean(),
      closedName: z.string().nullable(),
      isToday: z.boolean(),
    }),
  ),
  slots: z.array(timetableSlotSchema),
});

export const adminTimetableSchema = z.object({
  /** Every period, archived ones included — the day panel shows both. */
  periods: z.array(timetablePeriodSchema),
  classes: z.array(
    z.object({ id, name: z.string(), gradeLevel: z.string().nullable(), section: z.string().nullable(), room: z.string().nullable() }),
  ),
  selectedClassId: id.nullable(),
  grid: weekGridSchema.nullable(),
  staff: z.array(z.object({ membershipId: id, name: z.string(), load: z.number().int() })),
  /** teacherMembershipId → "weekday:periodId" → class name, for the other classes. */
  busy: z.record(z.record(z.string())),
});
export type AdminTimetable = z.infer<typeof adminTimetableSchema>;

export const periodCreateBodySchema = z.object({
  name: trimmed(1, 60),
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(1).max(1440),
  kind: periodKindSchema,
});

export const slotSaveBodySchema = z.object({
  classId: id,
  periodId: id,
  weekday: z.number().int().min(1).max(6),
  subject: trimmed(1, 80),
  teacherMembershipId: id.nullable().optional(),
  room: z.string().trim().max(40).nullable().optional(),
});

export const savedIdSchema = z.object({ ok: z.literal(true), id: id.optional() });

/* ---------------------------------------------------------------------- */
/* /admin/exams                                                            */
/* ---------------------------------------------------------------------- */

export const adminExamsQuerySchema = z.object({
  kind: examKindSchema.optional(),
  grade: z.string().trim().max(20).optional(),
  state: z.enum(["draft", "published"]).optional(),
});

const examSlotSchema = z.object({
  id,
  subject: z.string(),
  dateKey,
  startMinute: z.number().int().nullable(),
  endMinute: z.number().int().nullable(),
  maxMarks: z.number(),
  position: z.number().int(),
});

const examSeriesSchema = z.object({
  id,
  name: z.string(),
  gradeLevel: z.string(),
  kind: z.string(),
  term: z.object({ id, name: z.string() }).nullable(),
  publishedAt: isoOrNull,
  createdAt: iso,
  slots: z.array(examSlotSchema),
});

const termSchema = z.object({
  id,
  name: z.string(),
  startDateKey: dateKey,
  endDateKey: dateKey,
  current: z.boolean(),
  finished: z.boolean(),
});

export const adminExamsSchema = z.object({
  series: z.array(examSeriesSchema),
  total: z.number().int(),
  grades: z.array(z.string()),
  terms: z.array(termSchema),
});
export type AdminExams = z.infer<typeof adminExamsSchema>;

export const examSeriesCreateBodySchema = z.object({
  name: trimmed(2, 120),
  gradeLevel: trimmed(1, 20),
  kind: examKindSchema.optional(),
  termId: id.nullable().optional(),
});
export const examSeriesCreatedSchema = z.object({ seriesId: id });

export const examSlotCreateBodySchema = z.object({
  subject: trimmed(1, 80),
  dateKey,
  maxMarks: z.number().positive().max(1000),
  startMinute: z.number().int().min(0).max(1439).nullable().optional(),
  endMinute: z.number().int().min(0).max(1439).nullable().optional(),
  evenIfClosed: z.boolean().optional(),
});

/* ---------------------------------------------------------------------- */
/* /admin/attendance, /attendance/history                                  */
/* ---------------------------------------------------------------------- */

export const adminAttendanceQuerySchema = z.object({
  window: z.enum(["30", "60", "90"]).default("30"),
  sort: z.enum(["percent", "run", "name"]).default("percent"),
});

const absenceFlagSchema = z.object({
  studentMembershipId: id,
  name: z.string(),
  className: z.string(),
  percent: z.number(),
  marks: z.number().int(),
  currentRun: z.number().int(),
  chronic: z.boolean(),
  consecutive: z.boolean(),
  guardianCount: z.number().int(),
});

export const adminAttendanceSchema = z.object({
  windowDays: z.number().int(),
  trend: z.array(z.object({ label: z.string(), percent: z.number().nullable(), marks: z.number().int() })),
  flags: z.array(absenceFlagSchema),
  classes: z.array(z.object({ id, name: z.string() })),
});
export type AdminAttendance = z.infer<typeof adminAttendanceSchema>;

export const attendanceHistoryQuerySchema = z.object({
  classId: id.optional(),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "month").optional(),
});

const attendanceStatusSchema = z.enum(["PRESENT", "LATE", "ABSENT", "EXCUSED"]);
const historyClassSchema = z.object({ id, name: z.string(), color: z.string().nullable(), archived: z.boolean() });

export const attendanceHistorySchema = z.object({
  classes: z.array(historyClassSchema),
  month: z.string(),
  history: z
    .object({
      class: historyClassSchema,
      month: z.string(),
      days: z.array(
        z.object({
          dateKey,
          present: z.number().int(),
          late: z.number().int(),
          absent: z.number().int(),
          excused: z.number().int(),
          // A register opened and left without marks is a blank day, not a
          // 0 % day: null, like a pupil's and the month's percent below.
          percent: z.number().nullable(),
        }),
      ),
      pupils: z.array(
        z.object({
          membershipId: id,
          name: z.string(),
          marks: z.record(attendanceStatusSchema),
          present: z.number().int(),
          late: z.number().int(),
          absent: z.number().int(),
          excused: z.number().int(),
          percent: z.number().nullable(),
        }),
      ),
      percent: z.number().nullable(),
    })
    .nullable(),
});
export type AttendanceHistoryResponse = z.infer<typeof attendanceHistorySchema>;

/* ---------------------------------------------------------------------- */
/* /admin/calendar                                                         */
/* ---------------------------------------------------------------------- */

export const adminCalendarQuerySchema = z.object({ when: z.enum(["all"]).optional() });

const leaveRowSchema = z.object({
  id,
  status: z.string(),
  kind: z.string(),
  fromDateKey: dateKey,
  toDateKey: dateKey,
  /** Only on the pending cards; the calendar and the decided list omit the reason on purpose. */
  reason: z.string().optional(),
  decisionNote: z.string().nullable().optional(),
  applicantName: z.string(),
  applicantMembershipId: id,
  nominatedName: z.string().nullable(),
  decidedByName: z.string().nullable(),
  decidedAt: isoOrNull,
});

export const adminCalendarSchema = z.object({
  todayKey: dateKey,
  years: z.array(
    z.object({ id, name: z.string(), startDateKey: dateKey, endDateKey: dateKey, isCurrent: z.boolean(), closedAt: isoOrNull }),
  ),
  currentYearId: id.nullable(),
  terms: z.array(termSchema),
  entries: z.array(
    z.object({
      id,
      name: z.string(),
      startDateKey: dateKey,
      endDateKey: dateKey,
      kind: z.string(),
      note: z.string().nullable(),
      academicYearId: id.nullable(),
      /** A COMPETITION row's competition (decision 0007); null on every other kind. Optional for an older server. */
      competitionId: id.nullable().optional(),
    }),
  ),
  /** Approved staff leave over the next 120 days. */
  leave: z.array(leaveRowSchema),
  /** Birthdays over the same window — staff-only by construction, see birthdays.ts. */
  birthdays: z.array(
    z.object({
      membershipId: id,
      name: z.string(),
      role: z.string(),
      dateKey,
      turning: z.number().int().nullable(),
      movedFromLeapDay: z.boolean(),
    }),
  ),
});
export type AdminCalendar = z.infer<typeof adminCalendarSchema>;

/** Days that exist, the end not before the start, each refused naming its field (QA-54, QA-55). */
export const closureCreateBodySchema = z
  .object({
    name: trimmed(1, 120),
    startDateKey: realDateKey,
    endDateKey: realDateKey,
    kind: holidayKindSchema,
    note: z.string().trim().max(500).optional(),
  })
  .refine((b) => b.startDateKey <= b.endDateKey, { path: ["endDateKey"], message: "date" });
export const createdIdSchema = z.object({ id });

/* ---------------------------------------------------------------------- */
/* /admin/reviews                                                          */
/* ---------------------------------------------------------------------- */

export const adminReviewsQuerySchema = z.object({ status: z.enum(["open", "closed", "all"]).default("open") });

const reviewAggregateSchema = z.object({
  responseCount: z.number().int(),
  byQuestion: z.record(z.number()),
  overall: z.number().nullable(),
});

export const adminReviewsSchema = z.object({
  rounds: z.array(
    z.object({
      id,
      audience: reviewAudienceSchema,
      closesDateKey: dateKey,
      status: z.string(),
      createdAt: iso,
      teacherCount: z.number().int(),
      responseCount: z.number().int(),
    }),
  ),
  counts: z.object({ open: z.number().int(), closed: z.number().int() }),
  dashboard: z.array(
    z.object({
      membershipId: id,
      name: z.string(),
      allTime: reviewAggregateSchema,
      latest: z.object({ overall: z.number(), count: z.number().int() }).nullable(),
      previous: z.object({ overall: z.number(), count: z.number().int() }).nullable(),
      delta: z.number().nullable(),
    }),
  ),
  teacherOptions: z.array(nameOption),
  /** Two weeks out, the form's default. */
  defaultCloseDateKey: dateKey,
});
export type AdminReviews = z.infer<typeof adminReviewsSchema>;

export const reviewRoundOpenBodySchema = z.object({
  teacherMembershipIds: z.array(id).min(1).max(200),
  audience: reviewAudienceSchema,
  closesDateKey: dateKey,
});
export const reviewRoundOpenedSchema = z.object({ roundId: id.optional() });

/* ---------------------------------------------------------------------- */
/* /admin/safety                                                           */
/* ---------------------------------------------------------------------- */

export const adminSafetyQuerySchema = z.object({
  tab: z.enum(["open", "closed", "audit"]).default("open"),
  /** The audit trail's next page: the last row of the page read, as auditNext named it (TA-109). */
  before: id.optional(),
  /** Only actions that start with this (directory., fees.), asked of the whole trail. */
  action: z.string().trim().max(80).regex(/^[A-Za-z0-9._]*$/).optional(),
});

const reportTargetSchema = z.union([
  z.object({
    kind: z.literal("POST"),
    available: z.literal(true),
    title: z.string(),
    body: z.string(),
    status: z.string(),
    authorName: z.string(),
    authorRole: z.string().nullable(),
    createdAt: iso,
    href: z.string(),
  }),
  z.object({
    kind: z.literal("COMMENT"),
    available: z.literal(true),
    body: z.string(),
    status: z.string(),
    authorName: z.string(),
    postTitle: z.string(),
    createdAt: iso,
    href: z.string(),
  }),
  z.object({
    kind: z.literal("USER"),
    available: z.literal(true),
    name: z.string(),
    roles: z.array(z.string()),
    href: z.string().nullable(),
    suspended: z.boolean(),
  }),
  z.object({ kind: z.enum(["POST", "COMMENT", "USER"]), available: z.literal(false) }),
]);

export const adminSafetySchema = z.object({
  openCount: z.number().int(),
  /** Operators who opened this school's data, latest first. */
  visits: z.array(
    z.object({
      id,
      reason: z.string(),
      startedAt: iso,
      expiresAt: iso,
      endedAt: isoOrNull,
      operatorName: z.string(),
      live: z.boolean(),
    }),
  ),
  reports: z.array(
    z.object({
      targetType: z.enum(["POST", "COMMENT", "USER"]),
      targetId: z.string(),
      target: reportTargetSchema,
      reportIds: z.array(id),
      count: z.number().int(),
      reasons: z.array(z.object({ reason: z.string(), count: z.number().int() })),
      details: z.array(z.object({ reason: z.string(), detail: z.string(), reporterName: z.string(), at: iso })),
      firstAt: iso,
      latestAt: iso,
      status: z.enum(["OPEN", "ACTIONED", "DISMISSED"]),
      resolutionNote: z.string().nullable(),
    }),
  ),
  audit: z.array(
    z.object({
      id,
      action: z.string(),
      actorName: z.string(),
      targetType: z.string().nullable(),
      targetId: z.string().nullable(),
      meta: z.record(z.unknown()),
      ip: z.string().nullable(),
      at: iso,
    }),
  ),
  /** The audit trail's next page, for before=; null on the last page and outside the audit tab (TA-109). */
  auditNext: z.string().nullable().optional(),
});
export type AdminSafety = z.infer<typeof adminSafetySchema>;

/* ---------------------------------------------------------------------- */
/* /admin/settings                                                         */
/* ---------------------------------------------------------------------- */

export const adminSettingsSchema = z.object({
  school: z.object({
    name: z.string(),
    code: z.string(),
    logoPath: z.string().nullable(),
    brandPrimary: z.string().nullable(),
    contactEmail: z.string(),
    contactPhone: z.string().nullable(),
    website: z.string().nullable(),
    addressLine: z.string().nullable(),
    city: z.string().nullable(),
    region: z.string().nullable(),
    postalCode: z.string().nullable(),
    country: z.string().nullable(),
    gradeLow: z.string().nullable(),
    gradeHigh: z.string().nullable(),
    /** The weekday numbers the school teaches on, Monday first; absent on older servers. */
    teachingDays: z.array(z.number().int().min(0).max(6)).optional(),
    timezone: z.string(),
    notifAutoReadDays: z.number().int().nullable(),
    notifExpireDays: z.number().int().nullable(),
  }),
  directory: z.object({
    about: z.string(),
    published: z.boolean(),
    admissionsContactMembershipId: id.nullable(),
    contactName: z.string().nullable(),
    contactStillValid: z.boolean(),
  }),
  contactCandidates: z.array(z.object({ membershipId: id, name: z.string(), role: z.string() })),
  notifDefaults: z.object({ autoReadDays: z.number().int(), expireDays: z.number().int() }),
});
export type AdminSettings = z.infer<typeof adminSettingsSchema>;

/** Mirrors the web form's schoolDetailsSchema; the action re-validates. */
export const schoolDetailsBodySchema = z.object({
  name: trimmed(2, 120),
  contactEmail: z.string().trim().email().max(200),
  contactPhone: z.string().trim().max(40).optional(),
  website: z.string().trim().max(300).optional(),
  addressLine: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  region: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(24).optional(),
  country: z.string().trim().max(100).optional(),
  gradeLow: z.string().trim().max(12).optional(),
  gradeHigh: z.string().trim().max(12).optional(),
  about: z.string().trim().max(4000).optional(),
  timezone: z.string().trim().min(1).max(64).default("UTC"),
  brandPrimary: hexColor.optional().or(z.literal("")),
});

/* ---------------------------------------------------------------------- */
/* /admin/vacancies                                                        */
/* ---------------------------------------------------------------------- */

export const adminVacanciesQuerySchema = z.object({ status: z.enum(["open", "closed", "all"]).default("open") });

export const adminVacanciesSchema = z.object({
  postings: z.array(
    z.object({
      id,
      title: z.string(),
      employmentType: z.string(),
      status: z.string(),
      createdAt: iso,
      closedAt: isoOrNull,
      contactName: z.string().nullable(),
      enquiryCount: z.number().int(),
    }),
  ),
  counts: z.object({ open: z.number().int(), closed: z.number().int() }),
});
export type AdminVacancies = z.infer<typeof adminVacanciesSchema>;

export const vacancyCreateBodySchema = z.object({
  title: trimmed(1, 160),
  body: trimmed(1, 8000),
  subjects: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  employmentType: employmentTypeSchema,
  hiringContactMembershipId: id,
});
export const vacancyCreatedSchema = z.object({ postingId: id });

/* ---------------------------------------------------------------------- */
/* /principal/leave, /principal/staff                                      */
/* ---------------------------------------------------------------------- */

const leaveBalanceSchema = z.object({
  entitlement: z.number().nullable(),
  used: z.number(),
  pending: z.number(),
  remaining: z.number().nullable(),
  yearName: z.string().nullable(),
});

const coverCandidateSchema = z.object({
  membershipId: id,
  name: z.string(),
  clashes: z.number().int(),
  load: z.number().int(),
  teachesSubject: z.boolean(),
});

export const adminLeaveSchema = z.object({
  pending: z.array(
    leaveRowSchema.extend({
      balance: leaveBalanceSchema.nullable(),
      /** Classes the applicant is due in — the number of cover rows approving writes. */
      dutyClasses: z.number().int(),
      suggestions: z.object({
        lessonCount: z.number().int(),
        candidates: z.array(coverCandidateSchema),
        groups: z.array(
          z.object({
            classId: id,
            className: z.string(),
            subject: z.string(),
            lessonCount: z.number().int(),
            candidates: z.array(coverCandidateSchema),
          }),
        ),
      }),
    }),
  ),
  decided: z.array(leaveRowSchema),
  staff: z.array(nameOption),
});
export type AdminLeave = z.infer<typeof adminLeaveSchema>;

export const leaveDecideBodySchema = z.object({
  decision: z.enum(["APPROVED", "DECLINED"]),
  note: z.string().trim().max(500).optional(),
  coverMembershipId: id.nullable().optional(),
  coverAssignments: z.array(z.object({ classId: id, subject: z.string().trim().min(1).max(80), coverMembershipId: id })).max(50).optional(),
});
export const leaveDecidedSchema = z.object({ ok: z.literal(true), coversCreated: z.number().int().optional() });

export const adminStaffQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  role: staffRoleSchema.optional(),
  subject: z.string().trim().max(80).optional(),
});

export const adminStaffSchema = z.object({
  staff: z.array(
    z.object({
      membershipId: id,
      role: z.string(),
      name: z.string(),
      preferredName: z.string().nullable(),
      avatarKey: z.string().nullable(),
      subjects: z.array(z.string()),
      staffRecord: z
        .object({
          staffNumber: z.string().nullable(),
          designation: z.string().nullable(),
          qualification: z.string().nullable(),
          joinedOnKey: dateKey.nullable(),
          leaveDaysPerYear: z.number().int().nullable(),
          /** The DCF's own two dates: date of birth, and the first day in service anywhere. */
          birthdateKey: dateKey.nullable().default(null),
          serviceJoinedOnKey: dateKey.nullable().default(null),
          gender: z.string().nullable().default(null),
          socialCategory: z.string().nullable().default(null),
          academicQualification: z.string().nullable().default(null),
          professionalQualification: z.string().nullable().default(null),
          appointmentType: z.string().nullable().default(null),
          appointedSubject: z.string().nullable().default(null),
        })
        .nullable(),
      leadClasses: z.array(z.string()),
      balance: leaveBalanceSchema.nullable(),
    }),
  ),
  total: z.number().int(),
  roleCounts: z.array(z.object({ role: z.string(), count: z.number().int() })),
  subjectOptions: z.array(z.object({ subject: z.string(), count: z.number().int() })),
});
export type AdminStaff = z.infer<typeof adminStaffSchema>;

/* -------------------------------------------------------------------------- */
/* Correcting a legal name                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Why the office corrected a legal name. A CODE, NOT A SENTENCE: it is kept
 * in the audit log, which holds no free text about a child.
 *   SPELLING          it was typed wrongly
 *   ADMISSION_RECORD  it did not match the admission register or the birth certificate
 *   LEGAL_CHANGE      the name itself changed: a gazette notice, a court order, a marriage
 */
export const LEGAL_NAME_REASONS = ["SPELLING", "ADMISSION_RECORD", "LEGAL_CHANGE"] as const;
export const legalNameReasonSchema = z.enum(LEGAL_NAME_REASONS);
export type LegalNameReason = z.infer<typeof legalNameReasonSchema>;

/* -------------------------------------------------------------------------- */
/* The subject a teacher was appointed for                                     */
/* -------------------------------------------------------------------------- */

/**
 * UDISE+ DCF 3.2.18 and 3.2.19 subjects, by name; the filing holds the
 * number each prints (filings.ts). The office picks one on the staff record.
 */
export const STAFF_APPOINTED_SUBJECTS = ["MATHEMATICS", "EVS", "MUSIC", "SCIENCE", "SOCIAL_SCIENCE", "ACCOUNTANCY", "BIOLOGY", "BUSINESS_STUDIES", "CHEMISTRY", "COMPUTER_SCIENCE", "ECONOMICS", "GEOGRAPHY", "HISTORY", "PHYSICS", "POLITICAL_SCIENCE", "PSYCHOLOGY", "HINDI", "SANSKRIT", "URDU", "ENGLISH", "REGIONAL_LANGUAGE", "SOCIOLOGY", "STATISTICS", "ART", "PHYSICAL_EDUCATION", "WORK_EDUCATION"] as const;
export const staffAppointedSubjectSchema = z.enum(STAFF_APPOINTED_SUBJECTS);
export type StaffAppointedSubject = z.infer<typeof staffAppointedSubjectSchema>;

/* -------------------------------------------------------------------------- */
/* The staff record, and a pupil's leaving, from the phone                     */
/* -------------------------------------------------------------------------- */

const recordText = (max: number) => z.string().trim().max(max).nullable();
/**
 * POST /api/v1/admin/people/{membershipId}/staff-record — THE WHOLE RECORD,
 * every key present: a save replaces the record, so a body that leaves a key
 * out would clear it without anybody having meant to. A null or an empty
 * string is how a field is cleared on purpose.
 */
export const staffRecordSaveSchema = z.object({
  staffNumber: recordText(40),
  designation: recordText(80),
  qualification: recordText(200),
  joinedOnKey: dateKey.nullable(),
  birthdateKey: dateKey.nullable(),
  serviceJoinedOnKey: dateKey.nullable(),
  leaveDaysPerYear: z.number().int().min(0).max(365).nullable(),
  gender: recordText(8),
  socialCategory: recordText(16),
  academicQualification: recordText(4),
  professionalQualification: recordText(4),
  appointmentType: recordText(16),
  appointedSubject: recordText(32),
});
export type StaffRecordSave = z.infer<typeof staffRecordSaveSchema>;

/** GET the same path: who it is, and the record as it stands (every field null when the office has written none). */
export const staffRecordViewSchema = z.object({
  membershipId: id,
  name: z.string(),
  role: z.string(),
  canEdit: z.boolean(),
  record: staffRecordSaveSchema,
});
export type StaffRecordPage = z.infer<typeof staffRecordViewSchema>;

export const LEAVING_REASON_CODES = ["TRANSFERRED", "GRADUATED", "LEFT"] as const;
export const LEAVING_CONDUCTS = ["EXCELLENT", "GOOD", "SATISFACTORY"] as const;
/**
 * POST /api/v1/admin/people/{membershipId}/leaving — record that a pupil has
 * left, which issues their leaving certificate; a last day after today is
 * kept until the morning after it. Everything typed here is printed on a
 * paper the family hands to the next school.
 */
export const leavingBodySchema = z.object({
  reason: z.enum(LEAVING_REASON_CODES),
  conduct: z.enum(LEAVING_CONDUCTS).nullable().optional(),
  destination: z.string().trim().max(160).optional(),
  note: z.string().trim().max(500).optional(),
  /** The last day; left out or null, it is today in the school's zone. A day on the calendar (TA-601): 2026-13-01 is a 422 naming leftOn. */
  leftOn: realDateKey.nullable().optional(),
});
export type LeavingBody = z.infer<typeof leavingBodySchema>;
/** Recorded now (the certificate's id) or kept for a later day (the day). */
export const leavingResultSchema = z.object({ recordId: z.string().nullable(), scheduledFor: dateKey.nullable() });
export type LeavingResult = z.infer<typeof leavingResultSchema>;
