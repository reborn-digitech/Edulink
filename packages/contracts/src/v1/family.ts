import { z } from "zod";
import { cardExtrasSchema } from "./report-cards";

/**
 * family: the pupil's and the guardian's pages as JSON — what each page
 * shows, in the shape the page computes, plus the bodies of the few actions
 * a family takes (hand work in, save a profile, rate a teacher, book a
 * meeting, save notification settings). Dates are ISO strings, day keys are
 * YYYY-MM-DD in the school's zone, ids are strings.
 */

const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const iso = z.string().datetime();
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");
const monthKey = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "month");

/* ------------------------------------------------------------------------- */
/* Pieces several pages share                                                */
/* ------------------------------------------------------------------------- */

const attendanceStatusSchema = z.enum(["PRESENT", "LATE", "ABSENT", "EXCUSED"]);
const examKindSchema = z.enum(["UNIT_TEST", "MID_TERM", "FINAL"]);

/** A guardian's child, as the child switcher lists them. */
export const familyChildSchema = z.object({
  guardianshipId: z.string(),
  studentMembershipId: z.string(),
  studentUserId: z.string(),
  name: z.string(),
  schoolId: z.string(),
  schoolName: z.string(),
  /** The child has LEFT this school; the pages say so rather than render an ordinary day. */
  leftAt: iso.nullable(),
  relation: z.string(),
});
export type FamilyChild = z.infer<typeof familyChildSchema>;

export const familyChildrenSchema = z.object({ children: z.array(familyChildSchema) });

/** The child a guardian page is about. Query `childId`; the first child when omitted. */
export const familyChildQuerySchema = z.object({ childId: cuid.optional() });

const attendanceSummarySchema = z.object({
  counts: z.object({ PRESENT: z.number().int(), LATE: z.number().int(), ABSENT: z.number().int(), EXCUSED: z.number().int() }),
  total: z.number().int(),
  /** Whole percent of days there (late counts as there); null with no records. */
  percent: z.number().int().nullable(),
  recent: z.array(z.object({ dateKey, status: attendanceStatusSchema, note: z.string().nullable() })),
});

/** One lesson of the day, in period order. */
const lessonSchema = z.object({
  id: z.string(),
  periodId: z.string(),
  periodName: z.string().nullable(),
  startMinute: z.number().int().nullable(),
  endMinute: z.number().int().nullable(),
  subject: z.string(),
  room: z.string().nullable(),
  teacherMembershipId: z.string().nullable(),
  teacherName: z.string().nullable(),
  coveringMembershipId: z.string().nullable(),
  coveringName: z.string().nullable(),
  uncovered: z.boolean(),
});

const weekGridSchema = z.object({
  periods: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      startMinute: z.number().int(),
      endMinute: z.number().int(),
      kind: z.string(),
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

const examMarksSchema = z.object({
  studentMembershipId: z.string(),
  studentName: z.string(),
  schoolName: z.string(),
  className: z.string(),
  series: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      kind: examKindSchema,
      papers: z.array(z.object({ subject: z.string(), dateKey, marks: z.number().nullable(), maxMarks: z.number() })),
      totalMarks: z.number(),
      totalMax: z.number(),
      percent: z.number().nullable(),
    }),
  ),
});

/** Homework still owed, as the two overviews list it. */
const dueItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  className: z.string(),
  dueAt: iso.nullable(),
  /** Due within two days — "soon", never "OVERDUE" in red. */
  dueSoon: z.boolean(),
});

const reportCardRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  publishedAt: iso.nullable(),
  overallPercentMilli: z.number().int().nullable(),
});

const attachmentSchema = z.object({ fileId: z.string(), name: z.string(), size: z.number(), mime: z.string() });

/* ------------------------------------------------------------------------- */
/* STUDENT                                                                   */
/* ------------------------------------------------------------------------- */

/** GET /api/v1/family/student/overview — the pupil's Today page. */
export const familyStudentOverviewSchema = z.object({
  name: z.string(),
  avatarKey: z.string().nullable(),
  today: dateKey,
  className: z.string().nullable(),
  todayStatus: attendanceStatusSchema.nullable(),
  streak: z.number().int(),
  attendance: attendanceSummarySchema,
  closedToday: z.boolean(),
  closedName: z.string().nullable(),
  lessonsToday: z.array(lessonSchema),
  upcoming: z.array(dueItemSchema),
  examMarks: z.array(examMarksSchema),
});

const studentWorkItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  category: z.string().nullable(),
  className: z.string(),
  classColor: z.string().nullable(),
  pointsMilli: z.number().int().nullable(),
  dueAt: iso.nullable(),
  submittedAt: iso.nullable(),
  submissionId: z.string().nullable(),
  submissionBody: z.string(),
  attachments: z.array(attachmentSchema),
  submissionAttachments: z.array(attachmentSchema),
  scoreMilli: z.number().int().nullable(),
  comment: z.string().nullable(),
  overdue: z.boolean(),
});

/** GET /api/v1/family/student/assignments — to do, handed in, marked. */
export const familyStudentAssignmentsSchema = z.object({
  todo: z.array(studentWorkItemSchema),
  handedIn: z.array(studentWorkItemSchema),
  marked: z.array(studentWorkItemSchema),
});

/** POST /api/v1/family/student/submissions — hand a piece of work in (again, until it is marked). */
export const familyStudentSubmissionSchema = z
  .object({
    assignmentId: cuid,
    body: z.string().trim().max(20_000),
    /**
     * The hand-in's files after this delivery, in order: ids already on the
     * hand-in are kept, new ids must be this pupil's own unspent uploads
     * (POST /api/v1/uploads), and anything on the hand-in but not listed is
     * removed. Omitted, the files stay as they are — an older phone that
     * sends text alone changes nothing it cannot see.
     */
    attachments: z.array(z.object({ fileId: z.string().min(1).max(80), name: z.string().trim().min(1).max(200) })).max(5).optional(),
  })
  // Words or a photograph of the work: an empty hand-in with no files says nothing.
  .refine((v) => v.body.length > 0 || (v.attachments?.length ?? 0) > 0, { message: "body", path: ["body"] });
export const familyStudentSubmittedSchema = z.object({ submittedAt: iso, attachments: z.array(attachmentSchema) });

const badgeSchema = z.object({
  id: z.string(),
  labelKey: z.string(),
  descriptionKey: z.string(),
  earned: z.boolean(),
  progress: z.object({ current: z.number(), target: z.number() }).optional(),
  icon: z.string(),
});

/** GET /api/v1/family/student/profile — how the pupil looks, and what they have done. */
export const familyStudentProfileSchema = z.object({
  name: z.string(),
  preferredName: z.string().nullable(),
  bio: z.string().nullable(),
  avatarKey: z.string().nullable(),
  birthdate: dateKey.nullable(),
  birthdateEditable: z.boolean(),
  /** A self-joined pupil's sign-in handle; null for a real email. */
  handle: z.string().nullable(),
  studentCode: z.string().nullable(),
  schoolName: z.string(),
  className: z.string().nullable(),
  previousSchools: z.array(
    z.object({
      id: z.string(),
      schoolName: z.string(),
      gradeLevel: z.string().nullable(),
      joinedAt: iso,
      leftAt: iso,
      reason: z.string(),
      attendancePercent: z.number().nullable(),
      reportCardCount: z.number().int(),
    }),
  ),
  practice: z.object({ topicsPractised: z.number().int(), topicsCompleted: z.number().int() }),
  competitions: z.array(z.object({ id: z.string(), title: z.string(), status: z.string(), rank: z.number().int().nullable() })),
  badges: z.array(badgeSchema),
});

/** POST /api/v1/family/student/profile — the same fields the profile form saves. */
export const familyStudentProfileSaveSchema = z.object({
  preferredName: z.string().trim().max(60).default(""),
  bio: z.string().trim().max(600).default(""),
  /** One of the preset avatars; the server refuses anything else. */
  avatarKey: z.string().min(1).max(80),
  /** YYYY-MM-DD; saved only when it changed and the pupil may still set it. */
  birthdate: dateKey.optional(),
});

const practiceTopicSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  chapter: z.string(),
  subject: z.string(),
  classLevel: z.number().int(),
  summary: z.string(),
  questionCount: z.number().int(),
  level: z.number().int(),
  seenCount: z.number().int(),
  correctCount: z.number().int(),
  completed: z.boolean(),
  badgeEarned: z.boolean(),
  tierCount: z.number().int(),
});

/** GET /api/v1/family/student/practice — the topic list and the cards above it. */
export const familyStudentPracticeSchema = z.object({
  topics: z.array(practiceTopicSchema),
  enrolledGrade: z.number().int().nullable(),
  /** The grade the page opens on: the pupil's own when the bank has it. */
  defaultGrade: z.number().int().nullable(),
  resume: z
    .object({
      slug: z.string(),
      name: z.string(),
      subject: z.string(),
      level: z.number().int(),
      tierCount: z.number().int(),
      remainingForBadge: z.number().int().nullable(),
      nextTierName: z.string().nullable(),
    })
    .nullable(),
  weekly: z.number().int(),
  weeklyGoal: z.number().int(),
  revision: z.array(z.object({ questionId: z.string(), topicSlug: z.string(), topicName: z.string(), subject: z.string() })),
  assigned: z.array(
    z.object({
      id: z.string(),
      topicSlug: z.string(),
      topicName: z.string(),
      subject: z.string(),
      classLevel: z.number().int(),
      targetLevel: z.number().int(),
      targetTierName: z.string(),
      note: z.string().nullable(),
      dueAt: iso.nullable(),
      myLevel: z.number().int(),
      reached: z.boolean(),
    }),
  ),
});

/* ------------------------------------------------------------------------- */
/* PARENT                                                                    */
/* ------------------------------------------------------------------------- */

const childHeaderSchema = z.object({
  studentMembershipId: z.string(),
  studentUserId: z.string(),
  name: z.string(),
  avatarKey: z.string().nullable(),
  schoolId: z.string(),
  schoolName: z.string(),
  gradeLevel: z.string().nullable(),
  leftAt: iso.nullable(),
});

/** GET /api/v1/family/overview?childId= — the guardian's dashboard for one child. */
export const familyParentOverviewSchema = z.object({
  children: z.array(familyChildSchema),
  child: childHeaderSchema,
  /** True when the child has left: the day-to-day sections below are empty on purpose. */
  left: z.boolean(),
  today: dateKey,
  todayRecord: z.object({ status: attendanceStatusSchema, note: z.string().nullable() }).nullable(),
  attendance: attendanceSummarySchema.nullable(),
  streak: z.number().int(),
  averagePercent: z.number().nullable(),
  scoredCount: z.number().int(),
  recentGrades: z.array(
    z.object({
      assignmentTitle: z.string(),
      category: z.string().nullable(),
      scoreMilli: z.number().int().nullable(),
      pointsMilli: z.number().int().nullable(),
      gradedAt: iso,
    }),
  ),
  closedToday: z.boolean(),
  closedName: z.string().nullable(),
  lessonsToday: z.array(lessonSchema),
  upcoming: z.array(dueItemSchema),
  threads: z.array(
    z.object({
      id: z.string(),
      subject: z.string(),
      teacherName: z.string(),
      teacherAvatarKey: z.string().nullable(),
      lastMessageAt: iso,
    }),
  ),
  awaitingConsent: z.array(
    z.object({
      entryId: z.string(),
      competitionId: z.string(),
      title: z.string(),
      organizerName: z.string(),
      closesAt: iso.nullable(),
      childName: z.string(),
    }),
  ),
  examMarks: z.array(examMarksSchema),
});

/** GET /api/v1/family/attendance?childId=&month= — one month, any month up to this one. */
export const familyParentAttendanceQuerySchema = familyChildQuerySchema.extend({ month: monthKey.optional() });
export const familyParentAttendanceSchema = z.object({
  children: z.array(familyChildSchema),
  child: childHeaderSchema,
  month: monthKey,
  thisMonth: monthKey,
  previousMonth: monthKey,
  /** Null on the current month — there is no next month to page to. */
  nextMonth: monthKey.nullable(),
  summary: attendanceSummarySchema,
  /** Only days with a record, newest first. */
  days: z.array(z.object({ dateKey, status: attendanceStatusSchema, note: z.string().nullable(), teachingDay: z.boolean() })),
});

const childWorkItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string().nullable(),
  className: z.string(),
  pointsMilli: z.number().int().nullable(),
  dueAt: iso.nullable(),
  submittedAt: iso.nullable(),
  returned: z.boolean(),
  scoreMilli: z.number().int().nullable(),
  comment: z.string().nullable(),
  overdue: z.boolean(),
});

/** GET /api/v1/family/assignments?childId= — the child's three tabs, read-only. */
export const familyParentAssignmentsSchema = z.object({
  children: z.array(familyChildSchema),
  childName: z.string(),
  todo: z.array(childWorkItemSchema),
  handedIn: z.array(childWorkItemSchema),
  marked: z.array(childWorkItemSchema),
});

/** GET /api/v1/family/practice?childId= — every chapter the child has touched. */
export const familyParentPracticeSchema = z.object({
  children: z.array(familyChildSchema),
  childName: z.string(),
  weeklyCount: z.number().int(),
  topics: z.array(
    z.object({
      slug: z.string(),
      name: z.string(),
      subject: z.string(),
      classLevel: z.number().int(),
      level: z.number().int(),
      seenCount: z.number().int(),
      correctCount: z.number().int(),
      tierCount: z.number().int(),
      cleanCompletion: z.boolean(),
    }),
  ),
});

/** GET /api/v1/family/meetings — open windows of the children's teachers, and the family's bookings. */
export const familyParentMeetingsSchema = z.object({
  /** Times render in the school's zone — the meeting happens at the school. */
  timezone: z.string(),
  children: z.array(familyChildSchema),
  open: z.array(
    z.object({
      id: z.string(),
      teacherName: z.string(),
      startsAt: iso,
      endsAt: iso,
      location: z.string().nullable(),
      note: z.string().nullable(),
      forStudentMembershipIds: z.array(z.string()),
    }),
  ),
  mine: z.array(
    z.object({
      bookingId: z.string(),
      teacherName: z.string(),
      childName: z.string(),
      startsAt: iso,
      endsAt: iso,
      location: z.string().nullable(),
      note: z.string().nullable(),
    }),
  ),
});

/** POST /api/v1/family/meetings — claim a slot for one child. */
export const familyBookMeetingSchema = z.object({
  slotId: cuid,
  studentMembershipId: cuid,
  note: z.string().trim().max(300).optional(),
});

/** POST /api/v1/family/meetings/cancel — step back from a booking. */
export const familyCancelMeetingSchema = z.object({ bookingId: cuid });

const quietHoursSchema = z
  .object({
    start: z.string().regex(/^\d{1,2}:\d{2}$/, "refusal.useHHMM"),
    end: z.string().regex(/^\d{1,2}:\d{2}$/, "refusal.useHHMM"),
  })
  .nullable();

/** GET /api/v1/family/settings — the channels a guardian is reached on, and the children they hear about. */
export const familySettingsSchema = z.object({
  channels: z.object({ push: z.boolean(), email: z.boolean(), sms: z.boolean().optional(), whatsapp: z.boolean().optional() }),
  quietHours: quietHoursSchema,
  children: z.array(familyChildSchema),
});

/** POST /api/v1/family/settings — the notifications section of the preferences. */
export const familySettingsSaveSchema = z.object({
  channels: z.object({ push: z.boolean(), email: z.boolean(), sms: z.boolean().optional(), whatsapp: z.boolean().optional() }),
  quietHours: quietHoursSchema,
});

/* ------------------------------------------------------------------------- */
/* Shared by pupil and guardian                                              */
/* ------------------------------------------------------------------------- */

/** GET /api/v1/family/timetable?childId=&week= — the pupil's own week, or the guardian's child's. */
export const familyTimetableQuerySchema = familyChildQuerySchema.extend({ week: dateKey.optional() });
export const familyTimetableSchema = z.object({
  /** Null for a pupil; the child a guardian is reading. */
  child: childHeaderSchema.nullable(),
  children: z.array(familyChildSchema),
  today: dateKey,
  weekOf: dateKey,
  previous: dateKey,
  next: dateKey,
  isThisWeek: z.boolean(),
  /** Name the class on each lesson only when the week spans more than one. */
  spansClasses: z.boolean(),
  grid: weekGridSchema,
});

const dateSheetSchema = z.object({
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
});

const reportCardGroupSchema = z.object({
  studentMembershipId: z.string(),
  /** Named per child only when a guardian has more than one. */
  name: z.string().nullable(),
  rows: z.array(reportCardRowSchema),
});

/** GET /api/v1/family/exams — marks as they come in, the sittings still ahead, the report cards. */
export const familyExamsSchema = z.object({
  marks: z.array(examMarksSchema),
  /** Only sheets with a paper still to sit, in each school's own zone. */
  upcoming: z.array(dateSheetSchema),
  cards: z.array(reportCardGroupSchema),
  /** With no cards yet: a term is still running, so cards are coming. */
  termIsRunning: z.boolean(),
  awaitingTermName: z.string().nullable(),
});

/** GET /api/v1/family/report-cards — the pupil's own published cards, or each child's. */
export const familyReportCardsSchema = z.object({ groups: z.array(reportCardGroupSchema) });

/** GET /api/v1/family/report-cards/{cardId} — one card, as it will be printed. */
export const familyReportCardSchema = z.object({
  id: z.string(),
  status: z.string(),
  title: z.string(),
  remark: z.string().nullable(),
  studentMembershipId: z.string(),
  studentName: z.string(),
  className: z.string(),
  classSection: z.string().nullable(),
  fromDateKey: dateKey,
  toDateKey: dateKey,
  attendancePresent: z.number().int(),
  attendanceTotal: z.number().int(),
  attendancePercent: z.number().nullable(),
  overallPercent: z.number().nullable(),
  gradingMethod: z.string(),
  publishedAt: iso.nullable(),
  authorName: z.string().nullable(),
  items: z.array(z.object({ title: z.string(), category: z.string().nullable(), scoreMilli: z.number().int().nullable(), pointsMilli: z.number().int().nullable(), subject: z.string().nullable().optional(), letter: z.string().nullable().optional() })),
  school: z.object({
    name: z.string(),
    logoPath: z.string().nullable(),
    addressLine: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    region: z.string().nullable().optional(),
    postalCode: z.string().nullable().optional(),
    contactPhone: z.string().nullable().optional(),
    contactEmail: z.string().nullable().optional(),
    website: z.string().nullable().optional(),
    brandPrimary: z.string().nullable().optional(),
  }),
  practice: z.array(z.object({ subject: z.string(), name: z.string(), level: z.number().int(), tiers: z.number().int() })).nullable(),
}).merge(cardExtrasSchema);

/** GET /api/v1/family/reviews — every open questionnaire about a teacher who teaches them (or their child). */
export const familyReviewsSchema = z.object({
  pending: z.array(
    z.object({
      roundId: z.string(),
      closesDateKey: dateKey,
      teacherMembershipId: z.string(),
      teacherName: z.string(),
      /** Their previous answer in this round, if any — editable while it is open. */
      myScores: z.record(z.number()).nullable(),
    }),
  ),
});

/** POST /api/v1/family/reviews — answer (or amend) one teacher's questionnaire; every question, 1–5. */
export const familyReviewSubmitSchema = z.object({
  roundId: cuid,
  teacherMembershipId: cuid,
  scores: z.record(z.number().int().min(1).max(5)),
});

/** GET /api/v1/family/explore?q=&country=&region= — the directory of published schools. */
export const familyExploreQuerySchema = z.object({
  q: z.string().max(80).optional(),
  country: z.string().max(80).optional(),
  region: z.string().max(80).optional(),
});
export const familyExploreSchema = z.object({
  schools: z.array(
    z.object({
      schoolId: z.string(),
      name: z.string(),
      city: z.string().nullable(),
      region: z.string().nullable(),
      country: z.string().nullable(),
      logoPath: z.string().nullable(),
      gradeLow: z.string().nullable(),
      gradeHigh: z.string().nullable(),
      about: z.string(),
      openVacancies: z.number().int(),
      ours: z.boolean(),
    }),
  ),
  countries: z.array(z.string()),
  regionsByCountry: z.record(z.array(z.string())),
});
