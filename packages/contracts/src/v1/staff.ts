import { z } from "zod";

/**
 * staff: the teacher's and the principal's pages as JSON — one response
 * schema per GET, faithful to what the page shows, and one request schema per
 * primary action the page's actions.ts exposes. Dates are ISO strings, date
 * keys are YYYY-MM-DD, ids are strings.
 */

const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
/** YYYY-MM-DD, and a day that exists: "2026-13-40" must never reach a date parser. */
const dateKey = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date")
  .refine((k) => {
    const ms = Date.parse(`${k}T00:00:00Z`);
    return !Number.isNaN(ms) && new Date(ms).toISOString().slice(0, 10) === k;
  }, "date");
const isoDate = z.string().datetime();

/* ------------------------------------------------------------------------- */
/* Shared pieces                                                              */
/* ------------------------------------------------------------------------- */

const attendanceStatusSchema = z.enum(["PRESENT", "LATE", "ABSENT", "EXCUSED"]);
const examKindSchema = z.enum(["UNIT_TEST", "MID_TERM", "FINAL"]);

/** One resolved timetable week — the same grid the web draws. */
const weekGridSchema = z.object({
  periods: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      startMinute: z.number().int(),
      endMinute: z.number().int(),
      kind: z.enum(["LESSON", "BREAK"]),
      position: z.number().int(),
    }),
  ),
  days: z.array(
    z.object({
      weekday: z.number().int(),
      dateKey: dateKey.nullable(),
      closed: z.boolean(),
      closedName: z.string().nullable(),
      isToday: z.boolean(),
    }),
  ),
  slots: z.array(
    z.object({
      id: z.string(),
      classId: z.string(),
      className: z.string(),
      periodId: z.string(),
      weekday: z.number().int(),
      subject: z.string(),
      room: z.string().nullable(),
      teacherMembershipId: z.string().nullable(),
      teacherName: z.string().nullable(),
      coveringMembershipId: z.string().nullable(),
      coveringName: z.string().nullable(),
      uncovered: z.boolean(),
      borrowed: z.boolean(),
    }),
  ),
});
export type WeekGridBody = z.infer<typeof weekGridSchema>;

const calendarNoticeSchema = z.object({
  closed: z.boolean(),
  entries: z.array(z.object({ name: z.string(), kind: z.string() })),
  /** The school week does not include this day (a Sunday). */
  nonTeachingDay: z.boolean(),
});

/* ------------------------------------------------------------------------- */
/* /teacher — today                                                           */
/* ------------------------------------------------------------------------- */

export const staffTodaySchema = z.object({
  dateKey,
  schoolName: z.string(),
  /** Papers sat and not yet fully marked. */
  marksTodo: z.array(
    z.object({
      classId: z.string(),
      className: z.string(),
      slotId: z.string(),
      seriesName: z.string(),
      kind: examKindSchema,
      subject: z.string(),
      dateKey,
      marked: z.number().int(),
      classSize: z.number().int(),
    }),
  ),
  /** Today's lessons in period order, empty when the school is closed. */
  lessons: z.object({
    closed: z.boolean(),
    closedName: z.string().nullable(),
    items: z.array(
      z.object({
        slotId: z.string(),
        periodId: z.string(),
        periodName: z.string().nullable(),
        startMinute: z.number().int().nullable(),
        endMinute: z.number().int().nullable(),
        subject: z.string(),
        classId: z.string(),
        className: z.string(),
        room: z.string().nullable(),
        borrowed: z.boolean(),
      }),
    ),
    coveringToday: z.number().int(),
    classesTaughtThisWeek: z.number().int(),
  }),
  /** Lessons the office has asked me to cover today, from the substitution board; absent on older servers. */
  covers: z
    .array(
      z.object({
        slotId: z.string(),
        periodName: z.string().nullable(),
        startMinute: z.number().int().nullable(),
        endMinute: z.number().int().nullable(),
        subject: z.string(),
        classId: z.string(),
        className: z.string(),
        room: z.string().nullable(),
        absentName: z.string(),
        note: z.string().nullable(),
      }),
    )
    .optional(),
  /** Present only for a form teacher — the register list and the marking pile. */
  formClasses: z
    .object({
      classes: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          color: z.string().nullable(),
          students: z.number().int(),
          registerTaken: z.boolean(),
        }),
      ),
      registersLeft: z.number().int(),
      toGrade: z.number().int(),
      dueSoon: z.array(
        z.object({ id: z.string(), title: z.string(), dueAt: isoDate.nullable(), className: z.string() }),
      ),
    })
    .nullable(),
});
export type StaffToday = z.infer<typeof staffTodaySchema>;

/* ------------------------------------------------------------------------- */
/* /teacher/attendance — the register                                         */
/* ------------------------------------------------------------------------- */

export const attendanceClassesQuerySchema = z.object({ date: dateKey.optional() });

export const attendanceClassesSchema = z.object({
  dateKey,
  today: dateKey,
  calendar: calendarNoticeSchema,
  classes: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      subject: z.string().nullable(),
      color: z.string().nullable(),
      students: z.number().int(),
      taken: z.boolean(),
    }),
  ),
  unmarkedCount: z.number().int(),
});
export type AttendanceClasses = z.infer<typeof attendanceClassesSchema>;

export const registerQuerySchema = z.object({ classId: cuid, date: dateKey.optional() });

export const registerSchema = z.object({
  class: z.object({ id: z.string(), name: z.string(), subject: z.string().nullable(), color: z.string().nullable() }),
  dateKey,
  roster: z.array(
    z.object({
      membershipId: z.string(),
      name: z.string(),
      fullName: z.string(),
      avatarKey: z.string().nullable(),
      status: attendanceStatusSchema.nullable(),
      note: z.string().nullable(),
    }),
  ),
  finalizedAt: isoDate.nullable(),
  takenAt: isoDate.nullable(),
  /** Why this person may mark it, and until when if it is a cover. */
  duty: z.object({ reason: z.enum(["ADMIN", "COVER", "CLASS_TEACHER"]), coverUntil: dateKey.nullable() }),
  /** A register cannot be taken for a future date. */
  readOnly: z.boolean(),
  calendar: calendarNoticeSchema,
});
export type RegisterBody = z.infer<typeof registerSchema>;

/* ------------------------------------------------------------------------- */
/* /teacher/classes                                                           */
/* ------------------------------------------------------------------------- */

export const staffClassesSchema = z.object({
  classes: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      subject: z.string().nullable(),
      room: z.string().nullable(),
      color: z.string().nullable(),
      students: z.number().int(),
      assignments: z.number().int(),
      registerTaken: z.boolean(),
    }),
  ),
  students: z.number().int(),
});
export type StaffClasses = z.infer<typeof staffClassesSchema>;

export const staffClassDetailSchema = z.object({
  class: z.object({
    id: z.string(),
    name: z.string(),
    subject: z.string().nullable(),
    gradeLevel: z.string().nullable(),
    room: z.string().nullable(),
    color: z.string().nullable(),
    joinCode: z.string(),
    archived: z.boolean(),
  }),
  today: z.object({
    dateKey,
    registerTakenAt: isoDate.nullable(),
    recordsToday: z.number().int(),
  }),
  /** Attendance over the last 28 days, per pupil. */
  roster: z.array(
    z.object({
      membershipId: z.string(),
      name: z.string(),
      fullName: z.string(),
      avatarKey: z.string().nullable(),
      percent: z.number().nullable(),
      absences: z.number().int(),
      hasGuardian: z.boolean(),
    }),
  ),
  ofConcern: z.number().int(),
  withoutGuardian: z.number().int(),
  toGrade: z.number().int(),
  recentAssignments: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      dueAt: isoDate.nullable(),
      publishedAt: isoDate.nullable(),
      graded: z.number().int(),
    }),
  ),
  weights: z.array(z.object({ id: z.string(), name: z.string(), weightBps: z.number().int(), position: z.number().int() })),
  categoriesInUse: z.array(z.string()),
});
export type StaffClassDetail = z.infer<typeof staffClassDetailSchema>;

/** Percentages as the teacher types them; the server turns them into basis points. */
export const classWeightsSchema = z.object({
  rows: z.array(z.object({ name: z.string().trim().max(60), percent: z.number().min(0).max(100) })).max(20),
});
export type ClassWeightsBody = z.infer<typeof classWeightsSchema>;

/* ------------------------------------------------------------------------- */
/* /teacher/assignments                                                       */
/* ------------------------------------------------------------------------- */

export const assignmentsQuerySchema = z.object({
  years: z.enum(["all"]).optional(),
  classId: cuid.optional(),
  state: z.enum(["tomark", "draft", "overdue"]).optional(),
});

export const staffAssignmentsSchema = z.object({
  year: z.object({ name: z.string(), thisYearCount: z.number().int(), allCount: z.number().int() }).nullable(),
  showingAllYears: z.boolean(),
  classOptions: z.array(z.object({ id: z.string(), name: z.string() })),
  filters: z.object({ classId: z.string().nullable(), state: z.enum(["tomark", "draft", "overdue"]).nullable() }),
  total: z.number().int(),
  assignments: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      category: z.string().nullable(),
      pointsMilli: z.number().int().nullable(),
      dueAt: isoDate.nullable(),
      publishedAt: isoDate.nullable(),
      createdAt: isoDate,
      class: z.object({ id: z.string(), name: z.string(), color: z.string().nullable(), students: z.number().int() }),
      submissions: z.number().int(),
      graded: z.number().int(),
    }),
  ),
});
export type StaffAssignments = z.infer<typeof staffAssignmentsSchema>;

/** A new piece of work, without handouts — those go through the upload route. */
export const newAssignmentSchema = z.object({
  classId: cuid,
  title: z.string().trim().min(2).max(200),
  body: z.string().trim().max(20_000).default(""),
  category: z.string().trim().max(60).optional(),
  points: z.number().min(0).max(10_000).optional(),
  dueAt: isoDate.optional(),
  publish: z.boolean().default(true),
});
export type NewAssignmentBody = z.infer<typeof newAssignmentSchema>;

export const assignmentCreatedSchema = z.object({ assignmentId: z.string(), notified: z.number().int() });

export const publishAssignmentSchema = z.object({ assignmentId: cuid });

/* ------------------------------------------------------------------------- */
/* /teacher/exams — the marks grid                                            */
/* ------------------------------------------------------------------------- */

export const staffExamsSchema = z.object({
  classes: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      gradeLevel: z.string().nullable(),
      series: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          kind: examKindSchema,
          publishedAt: isoDate.nullable(),
          slots: z.array(
            z.object({
              id: z.string(),
              subject: z.string(),
              dateKey,
              startMinute: z.number().int().nullable(),
              endMinute: z.number().int().nullable(),
              maxMarks: z.number(),
            }),
          ),
        }),
      ),
    }),
  ),
});
export type StaffExams = z.infer<typeof staffExamsSchema>;

export const marksGridQuerySchema = z.object({ classId: cuid, slotId: cuid.optional() });

export const marksGridSchema = z.object({
  classId: z.string(),
  slotId: z.string().nullable(),
  grid: z
    .object({
      seriesName: z.string(),
      subject: z.string(),
      maxMarks: z.number(),
      assignmentId: z.string().nullable(),
      pupils: z.array(z.object({ membershipId: z.string(), name: z.string(), marks: z.number().nullable() })),
    })
    .nullable(),
  /** The class weights its work and has no "Exam" weight, so these marks do not count. */
  examUnweighted: z.boolean(),
});
export type MarksGridBody = z.infer<typeof marksGridSchema>;

/** The shared /exams page for staff: every date sheet, and the classes whose cards they may build. */
export const staffExamSheetsSchema = z.object({
  sheets: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      kind: examKindSchema,
      gradeLevel: z.string(),
      schoolName: z.string(),
      slots: z.array(
        z.object({
          id: z.string(),
          subject: z.string(),
          dateKey,
          startMinute: z.number().int().nullable(),
          endMinute: z.number().int().nullable(),
          maxMarks: z.number(),
        }),
      ),
    }),
  ),
  classes: z.array(z.object({ id: z.string(), name: z.string(), publishedCards: z.number().int() })),
});
export type StaffExamSheets = z.infer<typeof staffExamSheetsSchema>;

/* ------------------------------------------------------------------------- */
/* /timetable — the teacher's week                                            */
/* ------------------------------------------------------------------------- */

export const weekQuerySchema = z.object({ week: dateKey.optional() });

export const staffTimetableSchema = z.object({
  weekOf: dateKey,
  today: dateKey,
  isThisWeek: z.boolean(),
  grid: weekGridSchema,
});
export type StaffTimetable = z.infer<typeof staffTimetableSchema>;

/* ------------------------------------------------------------------------- */
/* /teacher/practice                                                          */
/* ------------------------------------------------------------------------- */

export const practiceQuerySchema = z.object({ classId: cuid.optional() });

export const staffPracticeSchema = z.object({
  classes: z.array(z.object({ id: z.string(), name: z.string(), gradeLevel: z.string().nullable() })),
  selectedClassId: z.string().nullable(),
  heatmap: z
    .object({
      pupilCount: z.number().int(),
      rows: z.array(
        z.object({
          slug: z.string(),
          name: z.string(),
          subject: z.string(),
          classLevel: z.number().int(),
          atLevel: z.array(z.number().int()),
          tried: z.number().int(),
        }),
      ),
    })
    .nullable(),
  assignments: z.array(
    z.object({
      id: z.string(),
      topicSlug: z.string(),
      topicName: z.string(),
      subject: z.string(),
      classLevel: z.number().int(),
      targetLevel: z.number().int(),
      targetTierName: z.string(),
      note: z.string().nullable(),
      dueAt: isoDate.nullable(),
      createdAt: isoDate,
      reached: z.number().int(),
      pupilCount: z.number().int(),
      pupils: z.array(z.object({ name: z.string(), level: z.number().int(), reached: z.boolean() })),
    }),
  ),
  weekly: z
    .object({
      pupilCount: z.number().int(),
      practiced: z.number().int(),
      answers: z.number().int(),
      climbs: z.number().int(),
      misses: z.number().int(),
    })
    .nullable(),
  gaps: z.array(
    z.object({ slug: z.string(), name: z.string(), subject: z.string(), level: z.number().int(), stuckCount: z.number().int() }),
  ),
  topicOptions: z.array(z.object({ slug: z.string(), name: z.string(), subject: z.string(), classLevel: z.number().int() })),
});
export type StaffPractice = z.infer<typeof staffPracticeSchema>;

export const setPracticeSchema = z.object({
  classId: cuid,
  topicSlug: z.string().trim().min(1).max(120),
  targetLevel: z.number().int().min(1).max(10),
  note: z.string().trim().max(300).optional(),
  /** YYYY-MM-DD; the day's end in the server's reading, as the form does. */
  dueDate: dateKey.optional(),
});
export type SetPracticeBody = z.infer<typeof setPracticeSchema>;

export const practiceCreatedSchema = z.object({ id: z.string() });

export const archivePracticeSchema = z.object({ id: cuid });

/* ------------------------------------------------------------------------- */
/* /teacher/meetings                                                          */
/* ------------------------------------------------------------------------- */

export const staffMeetingsSchema = z.object({
  timezone: z.string(),
  slots: z.array(
    z.object({
      id: z.string(),
      startsAt: isoDate,
      endsAt: isoDate,
      location: z.string().nullable(),
      note: z.string().nullable(),
      booking: z.object({ childName: z.string(), parentName: z.string(), note: z.string().nullable() }).nullable(),
    }),
  ),
});
export type StaffMeetings = z.infer<typeof staffMeetingsSchema>;

/** A run of back-to-back slots from a wall-clock time in the school's zone. */
export const publishSlotsSchema = z.object({
  date: dateKey,
  time: z.string().regex(/^\d{1,2}:\d{2}$/, "time"),
  durationMinutes: z.number().int().min(5).max(120).default(15),
  count: z.number().int().min(1).max(20).default(1),
  location: z.string().trim().max(120).optional(),
});
export type PublishSlotsBody = z.infer<typeof publishSlotsSchema>;

export const slotsPublishedSchema = z.object({ created: z.number().int() });

export const cancelSlotSchema = z.object({ slotId: cuid });

/* ------------------------------------------------------------------------- */
/* /teacher/leave                                                             */
/* ------------------------------------------------------------------------- */

export const leaveKindSchema = z.enum(["CASUAL", "SICK", "UNPAID", "OTHER"]);

const leaveRowSchema = z.object({
  id: z.string(),
  status: z.string(),
  kind: z.string(),
  fromDateKey: dateKey,
  toDateKey: dateKey,
  reason: z.string(),
  decisionNote: z.string().nullable(),
  applicantName: z.string(),
  applicantMembershipId: z.string(),
  nominatedName: z.string().nullable(),
  decidedByName: z.string().nullable(),
  decidedAt: isoDate.nullable(),
});

export const staffLeaveSchema = z.object({
  today: dateKey,
  balance: z.object({
    entitlement: z.number().nullable(),
    used: z.number(),
    pending: z.number(),
    remaining: z.number().nullable(),
    yearName: z.string().nullable(),
  }),
  requests: z.array(leaveRowSchema),
  /** Colleagues who could be nominated to cover. */
  staff: z.array(z.object({ membershipId: z.string(), name: z.string() })),
});
export type StaffLeave = z.infer<typeof staffLeaveSchema>;

export const applyLeaveSchema = z.object({
  fromDateKey: dateKey,
  toDateKey: dateKey,
  kind: leaveKindSchema,
  reason: z.string().trim().min(3).max(1000),
  nominatedCoverMembershipId: cuid.nullable().optional(),
});
export type ApplyLeaveBody = z.infer<typeof applyLeaveSchema>;

export const leaveAppliedSchema = z.object({ id: z.string() });

/* ------------------------------------------------------------------------- */
/* /teacher/profile                                                           */
/* ------------------------------------------------------------------------- */

export const staffProfileSchema = z.object({
  schoolName: z.string(),
  title: z.string().nullable(),
  classes: z.array(z.object({ id: z.string(), name: z.string() })),
  pupilsTaught: z.number().int(),
  sinceYear: z.number().int(),
  subjects: z.array(z.string()),
  user: z.object({
    name: z.string(),
    preferredName: z.string().nullable(),
    bio: z.string().nullable(),
    avatarKey: z.string().nullable(),
    email: z.string().nullable(),
    birthdate: dateKey.nullable(),
    birthdateEditable: z.boolean(),
  }),
  reviews: z.object({
    responseCount: z.number().int(),
    byQuestion: z.record(z.number()),
    overall: z.number().nullable(),
  }),
  record: z
    .object({
      staffNumber: z.string().nullable(),
      designation: z.string().nullable(),
      qualification: z.string().nullable(),
      joinedOnKey: dateKey.nullable(),
      leaveDaysPerYear: z.number().int().nullable(),
    })
    .nullable(),
  balance: z.object({
    entitlement: z.number().nullable(),
    used: z.number(),
    pending: z.number(),
    remaining: z.number().nullable(),
    yearName: z.string().nullable(),
  }),
});
export type StaffProfile = z.infer<typeof staffProfileSchema>;

export const saveProfileSchema = z.object({
  preferredName: z.string().trim().max(60),
  bio: z.string().trim().max(600),
  avatarKey: z.string().min(1).max(80),
  birthdate: dateKey.optional(),
});
export type SaveProfileBody = z.infer<typeof saveProfileSchema>;

/* ------------------------------------------------------------------------- */
/* /experts                                                                   */
/* ------------------------------------------------------------------------- */

export const expertsQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  offering: z.enum(["SESSIONS", "MENTORING", "BOTH"]).optional(),
  specialism: z.string().trim().max(80).optional(),
});

export const staffExpertsSchema = z.object({
  specialisms: z.array(z.string()),
  experts: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      headline: z.string(),
      bio: z.string(),
      organisation: z.string().nullable(),
      specialisms: z.array(z.string()),
      verified: z.boolean(),
      offering: z.enum(["SESSIONS", "MENTORING", "BOTH"]),
      mentorCapacity: z.number().int().nullable(),
      mentoringOpen: z.boolean(),
      openSlots: z.array(z.object({ id: z.string(), startsAt: isoDate, endsAt: isoDate, note: z.string().nullable() })),
    }),
  ),
  bookings: z.array(
    z.object({
      id: z.string(),
      topic: z.string(),
      status: z.string(),
      startsAt: isoDate,
      endsAt: isoDate,
      expertName: z.string(),
      schoolName: z.string(),
      unread: z.number().int(),
    }),
  ),
});
export type StaffExperts = z.infer<typeof staffExpertsSchema>;

export const bookExpertSchema = z.object({ slotId: cuid, topic: z.string().trim().min(3).max(300) });
export const expertBookedSchema = z.object({ bookingId: z.string() });

/* ------------------------------------------------------------------------- */
/* /principal                                                                 */
/* ------------------------------------------------------------------------- */

export const spanQuerySchema = z.object({ days: z.enum(["7", "30", "90", "year"]).optional() });

const classInsightSchema = z.object({
  classId: z.string(),
  name: z.string(),
  section: z.string().nullable(),
  gradeLevel: z.string().nullable(),
  pupils: z.number().int(),
  sessionsTaken: z.number().int(),
  attendance: z.object({
    counts: z.object({ PRESENT: z.number().int(), LATE: z.number().int(), ABSENT: z.number().int(), EXCUSED: z.number().int() }),
    marks: z.number().int(),
    percent: z.number().nullable(),
  }),
  progress: z.object({ percent: z.number().nullable(), pupilsCounted: z.number().int(), pupilsWithNoMarks: z.number().int() }),
  reportCards: z.array(z.object({ title: z.string(), published: z.number().int(), drafts: z.number().int() })),
});

const reviewAggregateSchema = z.object({
  responseCount: z.number().int(),
  byQuestion: z.record(z.number()),
  overall: z.number().nullable(),
});

export const principalOverviewSchema = z.object({
  span: z.union([z.literal(7), z.literal(30), z.literal(90), z.literal("year")]),
  window: z.object({ fromDateKey: dateKey, toDateKey: dateKey }),
  summary: z.object({
    pupils: z.number().int(),
    classes: z.number().int(),
    attendancePercent: z.number().nullable(),
    registersMissingToday: z.number().int(),
    pendingLeave: z.number().int(),
    concerns: z.number().int(),
  }),
  academicYear: z.object({ id: z.string(), name: z.string() }).nullable(),
  runningTerm: z.object({ id: z.string(), name: z.string(), endDateKey: dateKey }).nullable(),
  /** Classes under the attendance concern line. */
  concerns: z.array(classInsightSchema),
  classes: z.array(classInsightSchema),
  reviews: z.array(
    z.object({
      membershipId: z.string(),
      name: z.string(),
      allTime: reviewAggregateSchema,
      latest: z.object({ overall: z.number(), count: z.number().int() }).nullable(),
      previous: z.object({ overall: z.number(), count: z.number().int() }).nullable(),
      delta: z.number().nullable(),
    }),
  ),
  /** Syllabus coverage across the school, when any list exists: done chapters over all, and classes two or more chapters behind the year. */
  syllabus: z.object({ overallPercent: z.number().int().nullable(), classesBehind: z.number().int(), yearElapsedPercent: z.number().int() }).nullable().optional(),
});
export type PrincipalOverview = z.infer<typeof principalOverviewSchema>;

export const principalClassesQuerySchema = spanQuerySchema.extend({
  sort: z.enum(["name", "attendance", "progress"]).optional(),
  grade: z.string().trim().max(20).optional(),
});

export const principalClassesSchema = z.object({
  span: z.union([z.literal(7), z.literal(30), z.literal(90), z.literal("year")]),
  window: z.object({ fromDateKey: dateKey, toDateKey: dateKey }),
  sort: z.enum(["name", "attendance", "progress"]),
  grades: z.array(z.string()),
  gradeFilter: z.string().nullable(),
  concernPercent: z.number(),
  classes: z.array(classInsightSchema),
});
export type PrincipalClasses = z.infer<typeof principalClassesSchema>;

export const principalTimetableQuerySchema = weekQuerySchema.extend({ classId: cuid.optional() });

export const principalTimetableSchema = z.object({
  weekOf: dateKey,
  today: dateKey,
  isThisWeek: z.boolean(),
  classes: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      gradeLevel: z.string().nullable(),
      section: z.string().nullable(),
      room: z.string().nullable(),
    }),
  ),
  selectedClassId: z.string().nullable(),
  grid: weekGridSchema.nullable(),
  /** Lessons whose teacher is on approved leave with nobody arranged. */
  gaps: z.number().int(),
  /** Lessons on the board with no teacher at all. */
  unstaffed: z.number().int(),
});
export type PrincipalTimetable = z.infer<typeof principalTimetableSchema>;
