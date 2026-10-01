import { z } from "zod";
import { roleSchema } from "./auth";
import { expertRatingSchema } from "./experts";

/**
 * shared: the pages every role reads — the bulletin, the inbox, notifications,
 * competitions, enquiries, mentoring, the year archive, the vacancies board —
 * and the expert's own pages. One schema per endpoint, faithful to what the
 * page renders: dates as ISO strings, ids as strings.
 */

const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const iso = z.string().datetime();
const isoOrNull = iso.nullable();
const count = z.number().int().nonnegative();

/** Cursor paging for the lists a phone scrolls. Same cap as the root pageQuerySchema. */
export const sharedPageQuerySchema = z.object({
  cursor: z.string().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

/* -------------------------------------------------------------------------- */
/* Bulletin                                                                    */
/* -------------------------------------------------------------------------- */

export const bulletinScopeSchema = z.enum(["CLASS", "SCHOOL", "GLOBAL"]);
export const bulletinCategorySchema = z.enum(["PEOPLE", "CAMPUS", "EVENTS", "LEARNING", "UPDATES"]);
export const bulletinStatusSchema = z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED"]);
export const bulletinAudienceSchema = z.enum(["ALL", "PARENTS", "TEACHERS", "STUDENTS"]);
export const bulletinReactionKindSchema = z.enum(["CLAP", "STAR", "IDEA", "HEART", "CELEBRATE", "PROUD", "THANKS"]);

export const bulletinMediaItemSchema = z.object({
  fileId: z.string().min(1).max(80),
  kind: z.enum(["image", "video", "file"]),
  /** Required — a bulletin picture with no words is unreadable to a screen reader. */
  alt: z.string().trim().min(1).max(300),
});

export const bulletinFeedPostSchema = z.object({
  id: z.string(),
  scope: bulletinScopeSchema,
  category: bulletinCategorySchema,
  /** The typeface the post is set in, by the web's key; "default" for the reader's own. */
  font: z.string().default("default"),
  title: z.string(),
  body: z.string(),
  tags: z.array(z.string()),
  media: z.array(bulletinMediaItemSchema),
  status: bulletinStatusSchema,
  rejectionReason: z.string().nullable(),
  pinned: z.boolean(),
  createdAt: iso,
  authorName: z.string(),
  authorAvatar: z.string().nullable(),
  authorRole: roleSchema.nullable(),
  className: z.string().nullable(),
  commentCount: count,
  reactions: z.record(count),
  myReactions: z.array(bulletinReactionKindSchema),
  canModerate: z.boolean(),
  mine: z.boolean(),
  audience: bulletinAudienceSchema,
  audienceGrade: z.string().nullable(),
  requiresAck: z.boolean(),
  acked: z.boolean(),
  ackCount: count,
});

/** GET /api/v1/shared/bulletin */
export const bulletinFeedSchema = z.object({
  /** Null only for a guardian with no child at any school — the page's empty state. */
  schoolId: z.string().nullable(),
  schoolName: z.string().nullable(),
  /** A guardian's children's schools, for the picker; empty for everyone else. */
  schools: z.array(z.object({ id: z.string(), name: z.string() })),
  filter: z.enum(["pending", "mine"]).nullable(),
  pendingCount: count,
  /** Comments held at this school that the reader may approve or remove; 0 for anybody who reviews nothing. */
  heldCommentCount: count,
  items: z.array(bulletinFeedPostSchema),
  nextCursor: z.string().nullable(),
});

export const bulletinGlobalPostSchema = z.object({
  id: z.string(),
  category: bulletinCategorySchema,
  font: z.string().default("default"),
  title: z.string(),
  body: z.string(),
  media: z.array(bulletinMediaItemSchema),
  tags: z.array(z.string()),
  reactions: z.record(count),
  myReactions: z.array(z.string()),
  commentCount: count,
  createdAt: iso,
  authorName: z.string(),
  schoolName: z.string(),
  schoolId: z.string(),
  ours: z.boolean(),
  hiddenHere: z.boolean(),
});

/** GET /api/v1/shared/bulletin/global */
export const globalFeedSchema = z.object({ items: z.array(bulletinGlobalPostSchema), nextCursor: z.string().nullable() });

export const bulletinCommentSchema = z.object({
  id: z.string(),
  body: z.string(),
  status: z.string(),
  parentCommentId: z.string().nullable(),
  createdAt: iso,
  mine: z.boolean(),
  /** True on a held comment the reader may approve or remove. */
  canReview: z.boolean(),
  author: z.object({ id: z.string(), name: z.string(), avatarKey: z.string().nullable(), membershipId: z.string().nullable() }),
});

export const bulletinAckGroupSchema = z.object({
  classId: z.string().nullable(),
  className: z.string().nullable(),
  reached: count,
  total: count,
  outstanding: z.array(z.string()),
});

/** GET /api/v1/shared/bulletin/{postId} */
export const bulletinPostDetailSchema = z.object({
  id: z.string(),
  scope: bulletinScopeSchema,
  category: bulletinCategorySchema,
  font: z.string().default("default"),
  title: z.string(),
  body: z.string(),
  tags: z.array(z.string()),
  media: z.array(bulletinMediaItemSchema),
  status: bulletinStatusSchema,
  rejectionReason: z.string().nullable(),
  pinned: z.boolean(),
  createdAt: iso,
  schoolId: z.string().nullable(),
  className: z.string().nullable(),
  audience: bulletinAudienceSchema,
  audienceGrade: z.string().nullable(),
  requiresAck: z.boolean(),
  /** Whether the reader may press "seen and understood" — their own school's circular, approved. */
  canAck: z.boolean(),
  acked: z.boolean(),
  ackCount: count,
  author: z.object({
    id: z.string(),
    name: z.string(),
    avatarKey: z.string().nullable(),
    membershipId: z.string().nullable(),
    role: roleSchema.nullable(),
  }),
  reactions: z.record(count),
  myReactions: z.array(z.string()),
  /** A child's comment is held for review inside a school; on a global post everybody's is. */
  commentsWillBeHeld: z.boolean(),
  comments: z.array(bulletinCommentSchema),
  /** The delivery checklist, class by class — staff only, else empty. */
  ackReport: z.array(bulletinAckGroupSchema),
});

/** POST /api/v1/shared/bulletin */
export const bulletinCreatePostSchema = z.object({
  scope: bulletinScopeSchema,
  category: bulletinCategorySchema.default("UPDATES"),
  font: z.string().trim().regex(/^[a-z]{1,40}$/).default("default"),
  classId: cuid.optional(),
  title: z.string().trim().min(2).max(200),
  body: z.string().trim().max(20_000).default(""),
  tags: z.array(z.string().trim().min(1).max(30)).max(8).default([]),
  /** Ids from POST /api/v1/uploads — pictures and videos only. */
  media: z.array(bulletinMediaItemSchema).max(10).default([]),
  audience: bulletinAudienceSchema.default("ALL"),
  audienceGrade: z.string().trim().max(20).optional(),
  requiresAck: z.boolean().default(false),
});
export const bulletinPostCreatedSchema = z.object({ postId: z.string(), status: bulletinStatusSchema });

/** POST /api/v1/shared/bulletin/{postId}/react — toggles; the same kind twice removes it. */
export const bulletinReactBodySchema = z.object({ kind: bulletinReactionKindSchema });
export const bulletinReactResultSchema = z.object({ added: z.boolean() });

/** POST /api/v1/shared/bulletin/{postId}/comments */
export const bulletinCommentBodySchema = z.object({
  body: z.string().trim().min(1).max(4_000),
  parentCommentId: cuid.optional(),
});
export const bulletinCommentResultSchema = z.object({ held: z.boolean() });

/** POST /api/v1/shared/bulletin/{postId}/review — staff decide a pending pupil post. */
export const bulletinReviewBodySchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().trim().max(500).optional(),
});

/** GET /api/v1/shared/bulletin/comments/held — the comments waiting on the reader, oldest first. */
export const bulletinHeldCommentSchema = z.object({
  id: z.string(),
  postId: z.string(),
  postTitle: z.string(),
  /** On the cross-school feed: held here because its author is one of this school's people. */
  shared: z.boolean(),
  className: z.string().nullable(),
  reply: z.boolean(),
  body: z.string(),
  createdAt: iso,
  authorName: z.string(),
});
export const bulletinHeldCommentsSchema = z.object({ items: z.array(bulletinHeldCommentSchema) });
export type BulletinHeldComment = z.infer<typeof bulletinHeldCommentSchema>;

/** POST /api/v1/shared/bulletin/comments/{commentId}/review — staff approve or remove a held comment; removing needs a reason the author is told. */
export const bulletinCommentReviewBodySchema = z.object({
  decision: z.enum(["APPROVE", "REMOVE"]),
  reason: z.string().trim().max(500).optional(),
});
export type BulletinCommentReviewBody = z.infer<typeof bulletinCommentReviewBodySchema>;

/** POST /api/v1/shared/bulletin/{postId}/hide — an admin hides a global post from their school, or unhides it. */
export const bulletinHideBodySchema = z.object({ hidden: z.boolean(), reason: z.string().trim().max(500).optional() });

/* -------------------------------------------------------------------------- */
/* Inbox: conversations and remark threads                                      */
/* -------------------------------------------------------------------------- */

export const inboxPersonSchema = z.object({
  userId: z.string(),
  membershipId: z.string().nullable(),
  name: z.string(),
  avatarKey: z.string().nullable(),
  role: roleSchema.nullable(),
});

export const inboxConversationSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  others: z.array(inboxPersonSchema),
  lastMessageAt: iso,
  preview: z.string(),
  previewMine: z.boolean(),
  unread: z.boolean(),
  messageCount: count,
});

export const inboxThreadSchema = z.object({
  id: z.string(),
  subject: z.string(),
  studentMembershipId: z.string(),
  teacherMembershipId: z.string(),
  studentName: z.string(),
  studentAvatar: z.string().nullable(),
  teacherName: z.string(),
  teacherAvatar: z.string().nullable(),
  lastMessageAt: iso,
  preview: z.string(),
  unread: z.boolean(),
  messageCount: count,
});

/** GET /api/v1/shared/inbox */
export const inboxSchema = z.object({
  conversations: z.array(inboxConversationSchema),
  threads: z.array(inboxThreadSchema),
  unreadTotal: count,
});

/** GET /api/v1/shared/conversations/{conversationId} — opening it marks it read, as the page does. */
export const inboxConversationDetailSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  others: z.array(inboxPersonSchema),
  myLastReadAt: isoOrNull,
  messages: z.array(
    z.object({
      id: z.string(),
      body: z.string(),
      createdAt: iso,
      mine: z.boolean(),
      authorMembershipId: z.string().nullable(),
      authorName: z.string(),
      authorAvatar: z.string().nullable(),
      readByOthers: z.boolean(),
    }),
  ),
});

/** GET /api/v1/shared/threads/{threadId} — opening it marks it read, as the page does. */
export const inboxThreadDetailSchema = z.object({
  id: z.string(),
  subject: z.string(),
  schoolId: z.string(),
  closedAt: isoOrNull,
  student: z.object({ membershipId: z.string(), name: z.string(), fullName: z.string(), avatarKey: z.string().nullable() }),
  teacher: z.object({ membershipId: z.string(), name: z.string(), avatarKey: z.string().nullable() }),
  messages: z.array(
    z.object({
      id: z.string(),
      body: z.string(),
      createdAt: iso,
      authorId: z.string(),
      authorMembershipId: z.string().nullable(),
      authorName: z.string(),
      authorAvatar: z.string().nullable(),
      mine: z.boolean(),
      readByOthers: z.boolean(),
    }),
  ),
});

/** POST /api/v1/shared/threads/{threadId}/reply */
export const inboxThreadReplyBodySchema = z.object({ body: z.string().trim().min(1).max(8_000) });
export const inboxThreadReplyResultSchema = z.object({ messageId: z.string() });

/** GET /api/v1/shared/people — who the caller may write to at one school. */
export const inboxPeopleSchema = z.object({
  schoolId: z.string(),
  schools: z.array(z.object({ id: z.string(), name: z.string() })),
  people: z.array(
    z.object({
      userId: z.string(),
      membershipId: z.string().nullable(),
      name: z.string(),
      avatarKey: z.string().nullable(),
      role: roleSchema,
      detail: z.string().nullable(),
    }),
  ),
});

/** POST /api/v1/shared/conversations — the one room with one person, found or made. */
export const inboxOpenConversationSchema = z.object({ schoolId: cuid, userId: cuid });
export const inboxConversationOpenedSchema = z.object({ conversationId: z.string(), created: z.boolean() });

/* -------------------------------------------------------------------------- */
/* Notifications                                                               */
/* -------------------------------------------------------------------------- */

export const notificationKindSchema = z.enum([
  "EXPERT",
  "ATTENDANCE",
  "GRADE",
  "ASSIGNMENT",
  "REMARK",
  "POST",
  "INVITE",
  "COMPETITION",
  "ENQUIRY",
  "FEES",
  "SYSTEM",
]);

export const notificationSchema = z.object({
  id: z.string(),
  kind: z.string(),
  title: z.string(),
  body: z.string(),
  url: z.string().nullable(),
  read: z.boolean(),
  createdAt: iso,
});

/** GET /api/v1/shared/notifications */
export const notificationsQuerySchema = sharedPageQuerySchema.extend({
  filter: z.enum(["unread"]).optional(),
  kind: notificationKindSchema.optional(),
});
export const notificationsSchema = z.object({
  items: z.array(notificationSchema),
  nextCursor: z.string().nullable(),
  unreadCount: count,
  totalCount: count,
});

/** POST /api/v1/shared/notifications/read-all */
export const notificationsReadAllSchema = z.object({ count: count });

/* -------------------------------------------------------------------------- */
/* Competitions                                                                */
/* -------------------------------------------------------------------------- */

export const competitionEntrySchema = z.object({
  id: z.string(),
  status: z.string(),
  awaitingConsent: z.boolean(),
  consentedAt: isoOrNull,
  studentMembershipId: z.string(),
  studentName: z.string(),
  submissionUrl: z.string().nullable(),
  scoreMilli: z.number().int().nullable(),
  rank: z.number().int().nullable(),
});

export const competitionCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  organizerName: z.string(),
  organizerSchoolId: z.string().nullable(),
  subject: z.string().nullable(),
  gradeLow: z.string().nullable(),
  gradeHigh: z.string().nullable(),
  verified: z.boolean(),
  requiresParentConsent: z.boolean(),
  registrationClosesAt: isoOrNull,
  startsAt: isoOrNull,
  endsAt: isoOrNull,
  entry: competitionEntrySchema.nullable(),
});

export const competitionConsentSchema = z.object({
  entryId: z.string(),
  competitionId: z.string(),
  title: z.string(),
  organizerName: z.string(),
  closesAt: isoOrNull,
  childName: z.string(),
});

/** GET /api/v1/shared/competitions */
export const competitionsPageSchema = z.object({
  school: z.array(competitionCardSchema),
  platform: z.array(competitionCardSchema),
  /** A guardian's children's entries waiting on their yes; empty for everyone else. */
  waiting: z.array(competitionConsentSchema),
});

export const competitionStandingSchema = z.object({
  schoolId: z.string(),
  schoolName: z.string(),
  entrants: count,
  bestRank: z.number().int().nullable(),
  bestScoreMilli: z.number().int().nullable(),
  isOwnSchool: z.boolean(),
});

/** GET /api/v1/shared/competitions/{competitionId} */
export const competitionDetailSchema = competitionCardSchema.extend({
  body: z.string(),
  eligibility: z.string().nullable(),
  rules: z.string().nullable(),
  prizes: z.string().nullable(),
  externalUrl: z.string().nullable(),
  status: z.string(),
  leaderboardEnabled: z.boolean(),
  isOrganiser: z.boolean(),
  open: z.boolean(),
  acceptingWork: z.boolean(),
  enteredCount: count,
  waiting: z.array(competitionConsentSchema),
  board: z.array(competitionStandingSchema),
});

/** POST /api/v1/shared/competitions/{competitionId}/enter */
export const competitionEnterResultSchema = z.object({ entryId: z.string(), awaitingConsent: z.boolean() });

/* -------------------------------------------------------------------------- */
/* Enquiries                                                                   */
/* -------------------------------------------------------------------------- */

export const enquiryListItemSchema = z.object({
  id: z.string(),
  kind: z.string(),
  status: z.string(),
  schoolName: z.string(),
  subject: z.string(),
  fromName: z.string(),
  lastMessageAt: iso,
  lastMessagePreview: z.string(),
  unread: z.boolean(),
});

/** GET /api/v1/shared/enquiries */
export const enquiriesPageSchema = z.object({ sent: z.array(enquiryListItemSchema), inbox: z.array(enquiryListItemSchema) });

/** GET /api/v1/shared/enquiries/{enquiryId} */
export const enquiryThreadSchema = z.object({
  id: z.string(),
  kind: z.string(),
  status: z.string(),
  schoolId: z.string(),
  schoolName: z.string(),
  subject: z.string(),
  side: z.enum(["opener", "school"]),
  fromName: z.string(),
  createdAt: iso,
  messages: z.array(z.object({ id: z.string(), body: z.string(), mine: z.boolean(), authorName: z.string(), createdAt: iso })),
});

/** POST /api/v1/shared/enquiries — a parent asks about admission, a teacher about a vacancy. */
export const enquiryOpenBodySchema = z.object({
  schoolId: cuid,
  kind: z.enum(["ADMISSION", "JOB"]),
  jobPostingId: cuid.optional(),
  body: z.string().trim().min(1).max(5_000),
});
export const enquiryOpenedSchema = z.object({ enquiryId: z.string() });

/** POST /api/v1/shared/enquiries/{enquiryId}/reply */
export const enquiryReplyBodySchema = z.object({ body: z.string().trim().min(1).max(5_000) });

/* -------------------------------------------------------------------------- */
/* Mentoring                                                                   */
/* -------------------------------------------------------------------------- */

export const mentoringThreadSchema = z.object({
  id: z.string(),
  status: z.string(),
  purpose: z.string(),
  studentMembershipId: z.string(),
  studentName: z.string(),
  expertName: z.string(),
  schoolName: z.string(),
  awaitingConsent: z.boolean(),
  unread: count,
});

export const mentoringRequestSchema = z.object({
  threadId: z.string(),
  studentName: z.string(),
  studentMembershipId: z.string(),
  expertName: z.string(),
  expertHeadline: z.string(),
  expertVerified: z.boolean(),
  purpose: z.string(),
  askedAt: iso,
});

/** GET /api/v1/shared/mentoring */
export const mentoringPageSchema = z.object({
  threads: z.array(mentoringThreadSchema),
  /** Requests waiting on the school — the admin's and the principal's; empty for everyone else. */
  requests: z.array(mentoringRequestSchema),
});

/** GET /api/v1/shared/mentoring/{threadId} */
export const mentoringThreadDetailSchema = z.object({
  id: z.string(),
  status: z.string(),
  purpose: z.string(),
  schoolName: z.string(),
  studentMembershipId: z.string(),
  studentName: z.string(),
  expertName: z.string(),
  awaitingConsent: z.boolean(),
  canPost: z.boolean(),
  isGuardian: z.boolean(),
  isStaff: z.boolean(),
  messages: z.array(z.object({ id: z.string(), body: z.string(), createdAt: iso, authorName: z.string(), mine: z.boolean() })),
});

/** POST /api/v1/shared/mentoring/{threadId}/messages */
export const mentoringMessageBodySchema = z.object({ body: z.string().trim().min(1).max(5_000) });

/* -------------------------------------------------------------------------- */
/* The year archive                                                            */
/* -------------------------------------------------------------------------- */

export const archiveYearSchema = z.object({
  id: z.string(),
  name: z.string(),
  startDate: iso,
  endDate: iso,
  closedAt: iso,
});

export const pupilYearArchiveSchema = z.object({
  reportCards: z.array(z.object({ id: z.string(), title: z.string(), publishedAt: isoOrNull, className: z.string() })),
  attendance: z.object({ marked: count, present: count }),
  badges: z.array(z.object({ badgeId: z.string(), label: z.string(), description: z.string(), permanent: z.boolean() })),
  marks: z.object({ graded: count, averagePercent: z.number().nullable() }),
});

export const teacherYearArchiveSchema = z.object({
  classes: z.array(
    z.object({ classId: z.string(), className: z.string(), registersTaken: count, assignmentsSet: count, reportCardsPublished: count }),
  ),
});

export const schoolYearArchiveSchema = z.object({
  pupilsOnRoll: count,
  attendance: z.object({ marked: count, present: count }),
  reportCardsPublished: count,
  leavers: count,
  badgesArchived: count,
  examSeries: z.array(z.object({ id: z.string(), name: z.string(), gradeLevel: z.string() })),
});

/** GET /api/v1/shared/archive — the closed years, and one of them opened by role. */
export const archivePageSchema = z.object({
  schoolId: z.string(),
  schoolName: z.string(),
  timezone: z.string(),
  /** A guardian's children (for the picker); the chosen one is `child`. */
  children: z.array(z.object({ studentMembershipId: z.string(), name: z.string(), schoolId: z.string() })),
  child: z.string().nullable(),
  years: z.array(archiveYearSchema),
  /** Null when no year has been closed yet. Exactly one of the three slices is set. */
  selected: z
    .object({
      year: archiveYearSchema,
      pupil: pupilYearArchiveSchema.nullable(),
      teacher: teacherYearArchiveSchema.nullable(),
      school: schoolYearArchiveSchema.nullable(),
    })
    .nullable(),
});

/* -------------------------------------------------------------------------- */
/* The vacancies board                                                         */
/* -------------------------------------------------------------------------- */

export const vacancyBoardPostingSchema = z.object({
  id: z.string(),
  title: z.string(),
  subjects: z.array(z.string()),
  employmentType: z.string(),
  createdAt: iso,
  schoolId: z.string(),
  schoolName: z.string(),
  city: z.string().nullable(),
  region: z.string().nullable(),
  logoPath: z.string().nullable(),
  ours: z.boolean(),
});

/** GET /api/v1/shared/vacancies */
export const vacanciesBoardSchema = z.object({ items: z.array(vacancyBoardPostingSchema) });

/* -------------------------------------------------------------------------- */
/* The expert's own pages                                                      */
/* -------------------------------------------------------------------------- */

export const expertBookingSchema = z.object({
  id: z.string(),
  topic: z.string(),
  status: z.string(),
  startsAt: iso,
  endsAt: iso,
  expertName: z.string(),
  schoolName: z.string(),
  unread: count,
});

/** GET /api/v1/shared/expert/bookings */
export const expertBookingsSchema = z.object({ bookings: z.array(expertBookingSchema) });

export const expertSlotSchema = z.object({
  id: z.string(),
  startsAt: iso,
  endsAt: iso,
  note: z.string().nullable(),
  bookedAt: isoOrNull,
  booking: z.object({ id: z.string(), topic: z.string(), schoolName: z.string() }).nullable(),
});

/** GET /api/v1/shared/expert/availability */
export const expertAvailabilitySchema = z.object({ slots: z.array(expertSlotSchema) });

/** POST /api/v1/shared/expert/availability — offer a window. */
export const expertAddSlotSchema = z.object({
  startsAt: iso,
  endsAt: iso,
  note: z.string().trim().max(500).optional(),
});

export const expertOfferingSchema = z.enum(["SESSIONS", "MENTORING", "BOTH"]);

/** GET /api/v1/shared/expert/profile */
export const expertProfileSchema = z.object({
  profile: z.object({
    headline: z.string(),
    bio: z.string(),
    organisation: z.string().nullable(),
    specialisms: z.array(z.string()),
    timezone: z.string(),
    offering: expertOfferingSchema,
    mentorCapacity: z.number().int().nullable(),
    published: z.boolean(),
    verified: z.boolean(),
  }),
  impact: z.object({
    sessionsDone: count,
    sessionsBooked: count,
    schoolsServed: count,
    activeMentorships: count,
    mentorCapacity: z.number().int().nullable(),
    upcomingSlots: count,
    /** Families' ratings of their sessions, from three on; null reads as "New". Absent from older servers. */
    rating: expertRatingSchema.default(null),
  }),
});

/** POST /api/v1/shared/expert/profile — the expert's own words, never their standing. */
export const expertSaveProfileSchema = z.object({
  headline: z.string().trim().min(3).max(120),
  bio: z.string().trim().max(4_000).default(""),
  organisation: z.string().trim().max(200).nullable().optional(),
  specialisms: z.array(z.string().trim().max(60)).max(12).default([]),
  timezone: z.string().trim().min(1).max(80),
  offering: expertOfferingSchema,
  mentorCapacity: z.number().int().min(0).max(1_000).nullable().optional(),
});

/* -------------------------------------------------------------------------- */
/* Uploads                                                                     */
/* -------------------------------------------------------------------------- */

/** POST /api/v1/uploads — multipart, one `file` field; read back through /api/files/{fileId}. */
export const uploadResultSchema = z.object({ fileId: z.string(), mime: z.string(), size: count });

/** POST /api/v1/files/{fileId}/link — a five-minute URL (relative to the API) that opens one file outside the app. */
export const fileLinkSchema = z.object({ url: z.string().startsWith("/api/files/"), expiresAt: z.string().datetime() });

// ---- app release ------------------------------------------------------------
/** The kill switch: the oldest app version the API still serves, per platform, and where the newer one is. */
export const appVersionSchema = z.object({
  minimum: z.object({ ios: z.string(), android: z.string() }),
  latest: z.object({ ios: z.string(), android: z.string() }),
  storeUrls: z.object({ ios: z.string().nullable(), android: z.string().nullable() }),
  /** An operator's sentence for the update screen, or null for the standard one. */
  message: z.string().nullable(),
});

/** "Report a problem" from the app, and the app's own crash report on its next start. */
export const appReportBodySchema = z.object({
  kind: z.enum(["PROBLEM", "CRASH"]),
  message: z.string().trim().min(1).max(2000),
  screen: z.string().max(200).optional(),
  stack: z.string().max(8000).optional(),
  device: z.object({
    platform: z.enum(["ios", "android", "web"]),
    os: z.string().max(60).optional(),
    model: z.string().max(80).optional(),
    appVersion: z.string().max(30),
    build: z.string().max(30).optional(),
  }),
});
export const appReportResultSchema = z.object({ reportId: z.string(), reference: z.string() });
