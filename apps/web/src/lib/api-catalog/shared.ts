import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

const SCHOOL_ROLES: c.RoleCode[] = ["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "PARENT"];

/**
 * shared: the pages every role reads, and the expert's own. Access says who
 * answers 2xx; where it is "signed-in" the lib function behind the handler
 * still refuses what a role may not see (a guardian cannot post, a pupil's
 * comment is held), which the suites prove and the sweep does not need to.
 */
export const SHARED: Endpoint[] = [
  // ---- bulletin -------------------------------------------------------------
  { method: "GET", path: "/api/v1/shared/bulletin", summary: "The school feed, filtered and cursor paged", access: "signed-in", limitedRoles: ["ALUMNUS"], response: c.bulletinFeedSchema, sample: "/api/v1/shared/bulletin?limit=20" },
  { method: "POST", path: "/api/v1/shared/bulletin", summary: "Compose a post (media ids from POST /api/v1/uploads)", access: "signed-in", request: c.bulletinCreatePostSchema, response: c.bulletinPostCreatedSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/shared/bulletin/global", summary: "Every school's shared posts, cursor paged", access: SCHOOL_ROLES, response: c.globalFeedSchema },
  { method: "GET", path: "/api/v1/shared/bulletin/{postId}", summary: "One post with its comments and reactions", access: "signed-in", limitedRoles: ["ALUMNUS"], response: c.bulletinPostDetailSchema, sample: (f) => (f.postId ? `/api/v1/shared/bulletin/${f.postId}` : null) },
  { method: "POST", path: "/api/v1/shared/bulletin/{postId}/react", summary: "Toggle a reaction on a post", access: "signed-in", request: c.bulletinReactBodySchema, response: c.bulletinReactResultSchema, emptyBodyStatus: 422, sample: (f) => (f.postId ? `/api/v1/shared/bulletin/${f.postId}/react` : null) },
  { method: "POST", path: "/api/v1/shared/bulletin/{postId}/comments", summary: "Comment on a post; a pupil's is held for review", access: "signed-in", request: c.bulletinCommentBodySchema, response: c.bulletinCommentResultSchema, emptyBodyStatus: 422, sample: (f) => (f.postId ? `/api/v1/shared/bulletin/${f.postId}/comments` : null) },
  { method: "POST", path: "/api/v1/shared/bulletin/{postId}/review", summary: "Approve or reject a pending pupil post", access: ["TEACHER", "ADMIN"], request: c.bulletinReviewBodySchema, response: c.okSchema, emptyBodyStatus: 422, sample: (f) => (f.postId ? `/api/v1/shared/bulletin/${f.postId}/review` : null) },
  { method: "GET", path: "/api/v1/shared/bulletin/comments/held", summary: "The held comments the reader may approve or remove, oldest first", access: ["TEACHER", "ADMIN"], response: c.bulletinHeldCommentsSchema },
  { method: "POST", path: "/api/v1/shared/bulletin/comments/{commentId}/review", summary: "Approve or remove a held comment; removing needs a reason the author is told", access: ["TEACHER", "ADMIN"], request: c.bulletinCommentReviewBodySchema, response: c.okSchema, emptyBodyStatus: 422, sample: (f) => (f.heldCommentId ? `/api/v1/shared/bulletin/comments/${f.heldCommentId}/review` : null) },
  { method: "POST", path: "/api/v1/shared/bulletin/{postId}/hide", summary: "Hide a global post from this school, or unhide it", access: ["ADMIN"], request: c.bulletinHideBodySchema, response: c.okSchema, emptyBodyStatus: 422, sample: (f) => (f.postId ? `/api/v1/shared/bulletin/${f.postId}/hide` : null) },
  // ---- people waiting for a yes ---------------------------------------------
  { method: "GET", path: "/api/v1/shared/joins", summary: "Everybody waiting on the reader: joins by code, and claims to be a child's guardian, oldest first", access: ["TEACHER", "ADMIN", "PRINCIPAL", "PARENT"], response: c.waitingQueueSchema },
  { method: "POST", path: "/api/v1/shared/joins/{requestId}/decide", summary: "Let somebody who typed a code in, or decline with an optional sentence for them: the office, or a teacher of the class the code named", access: ["TEACHER", "ADMIN"], request: c.joinDecisionBodySchema, response: c.okSchema, emptyBodyStatus: 422, sample: (f) => (f.joinRequestId ? `/api/v1/shared/joins/${f.joinRequestId}/decide` : null), probe: { body: () => ({ decision: "DECLINE" }) } },
  { method: "POST", path: "/api/v1/shared/claims/{claimId}/decide", summary: "Make a claimant a child's guardian, or decline with an optional sentence for them: the office, or a guardian the child already has", access: ["ADMIN", "PRINCIPAL", "PARENT"], request: c.joinDecisionBodySchema, response: c.okSchema, emptyBodyStatus: 422, sample: (f) => (f.guardianClaimId ? `/api/v1/shared/claims/${f.guardianClaimId}/decide` : null), probe: { body: () => ({ decision: "DECLINE" }) } },
  // ---- inbox ----------------------------------------------------------------
  { method: "GET", path: "/api/v1/shared/inbox", summary: "Conversations and remark threads in one list", access: "signed-in", limitedRoles: ["DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS"], response: c.inboxSchema },
  { method: "GET", path: "/api/v1/shared/conversations/{conversationId}", summary: "A conversation's messages; opening it marks it read", access: "signed-in", limitedRoles: ["ALUMNUS"], response: c.inboxConversationDetailSchema, sample: (f) => (f.conversationId ? `/api/v1/shared/conversations/${f.conversationId}` : null) },
  { method: "POST", path: "/api/v1/shared/conversations", summary: "Open (or find) the room with one person at one school", access: "signed-in", limitedRoles: ["ALUMNUS"], request: c.inboxOpenConversationSchema, response: c.inboxConversationOpenedSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/shared/threads/{threadId}", summary: "A remark thread about a pupil; opening it marks it read", access: "signed-in", response: c.inboxThreadDetailSchema, sample: (f) => (f.remarkThreadId ? `/api/v1/shared/threads/${f.remarkThreadId}` : null) },
  { method: "POST", path: "/api/v1/shared/threads/{threadId}/reply", summary: "Reply in a remark thread", access: "signed-in", request: c.inboxThreadReplyBodySchema, response: c.inboxThreadReplyResultSchema, emptyBodyStatus: 422, sample: (f) => (f.remarkThreadId ? `/api/v1/shared/threads/${f.remarkThreadId}/reply` : null) },
  { method: "GET", path: "/api/v1/shared/people", summary: "Who I may write to at a school", access: ["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "PARENT", "ALUMNUS"], response: c.inboxPeopleSchema },
  // ---- notifications --------------------------------------------------------
  { method: "GET", path: "/api/v1/shared/notifications", summary: "My notifications, newest first, cursor paged", access: "signed-in", limitedRoles: ["DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS"], response: c.notificationsSchema, sample: "/api/v1/shared/notifications?limit=20" },
  { method: "POST", path: "/api/v1/shared/notifications/{notificationId}/read", summary: "Mark one of my notifications read", access: "signed-in", limitedRoles: ["DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS"], response: c.okSchema, sample: (f) => (f.notificationId ? `/api/v1/shared/notifications/${f.notificationId}/read` : null) },
  { method: "POST", path: "/api/v1/shared/notifications/read-all", summary: "Mark all my notifications read", access: "signed-in", limitedRoles: ["DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS"], response: c.notificationsReadAllSchema },
  // ---- competitions ---------------------------------------------------------
  { method: "GET", path: "/api/v1/shared/competitions", summary: "The school's and the platform's competitions", access: "signed-in", response: c.competitionsPageSchema },
  { method: "GET", path: "/api/v1/shared/competitions/{competitionId}", summary: "One competition, my entry, and the schools' board", access: "signed-in", response: c.competitionDetailSchema, sample: (f) => (f.competitionId ? `/api/v1/shared/competitions/${f.competitionId}` : null) },
  { method: "POST", path: "/api/v1/shared/competitions/{competitionId}/enter", summary: "A pupil enters a competition", access: ["STUDENT"], response: c.competitionEnterResultSchema, sample: (f) => (f.competitionId ? `/api/v1/shared/competitions/${f.competitionId}/enter` : null) },
  // Pupil 01's entry, which their parent has already said yes to: saying it again is a no-op (200).
  { method: "POST", path: "/api/v1/shared/competitions/entries/{entryId}/consent", summary: "A guardian consents to their child's entry", access: ["PARENT"], response: c.okSchema, sample: (f) => (f.competitionEntryId ? `/api/v1/shared/competitions/entries/${f.competitionEntryId}/consent` : null) },
  // ---- enquiries ------------------------------------------------------------
  { method: "GET", path: "/api/v1/shared/enquiries", summary: "Enquiries I opened, and my school's inbox", access: "signed-in", response: c.enquiriesPageSchema },
  { method: "GET", path: "/api/v1/shared/enquiries/{enquiryId}", summary: "One enquiry thread", access: "signed-in", response: c.enquiryThreadSchema, sample: (f) => (f.enquiryId ? `/api/v1/shared/enquiries/${f.enquiryId}` : null) },
  { method: "POST", path: "/api/v1/shared/enquiries", summary: "Ask a school about admission or a vacancy", access: "signed-in", request: c.enquiryOpenBodySchema, response: c.enquiryOpenedSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/shared/enquiries/{enquiryId}/reply", summary: "Reply in an enquiry thread", access: "signed-in", request: c.enquiryReplyBodySchema, response: c.enquiryOpenedSchema, emptyBodyStatus: 422, sample: (f) => (f.enquiryId ? `/api/v1/shared/enquiries/${f.enquiryId}/reply` : null) },
  // ---- mentoring ------------------------------------------------------------
  { method: "GET", path: "/api/v1/shared/mentoring", summary: "My mentorships, and the requests waiting on the office", access: "signed-in", response: c.mentoringPageSchema },
  // Pupil 01's active mentorship (scripts/sweep-doors.ts): read by the office, the pupil's teacher, the pupil and their parent; another expert's is a 404. The write carries no sampleBody: a message is a row in a child's conversation with an outside adult.
  { method: "GET", path: "/api/v1/shared/mentoring/{threadId}", summary: "One mentorship and its messages", access: "signed-in", response: c.mentoringThreadDetailSchema, sample: (f) => (f.mentorThreadId ? `/api/v1/shared/mentoring/${f.mentorThreadId}` : null) },
  { method: "POST", path: "/api/v1/shared/mentoring/{threadId}/messages", summary: "The mentor or the pupil writes", access: "signed-in", request: c.mentoringMessageBodySchema, response: c.okSchema, emptyBodyStatus: 422, sample: (f) => (f.mentorThreadId ? `/api/v1/shared/mentoring/${f.mentorThreadId}/messages` : null) },
  // ---- the year archive, the vacancies board ----------------------------------
  { method: "GET", path: "/api/v1/shared/archive", summary: "The closed years, one opened as this role sees it", access: SCHOOL_ROLES, response: c.archivePageSchema },
  { method: "GET", path: "/api/v1/shared/vacancies", summary: "The platform-wide board of open vacancies", access: ["TEACHER", "ADMIN", "PRINCIPAL"], response: c.vacanciesBoardSchema },
  // ---- the expert's own pages -------------------------------------------------
  { method: "GET", path: "/api/v1/shared/expert/bookings", summary: "The expert's bookings", access: ["EXPERT"], response: c.expertBookingsSchema },
  { method: "GET", path: "/api/v1/shared/expert/availability", summary: "The windows the expert offers", access: ["EXPERT"], response: c.expertAvailabilitySchema },
  { method: "POST", path: "/api/v1/shared/expert/availability", summary: "Offer a window", access: ["EXPERT"], request: c.expertAddSlotSchema, response: c.okSchema, emptyBodyStatus: 422 },
  // A throwaway window of the sweep's expert, put back before each run (scripts/sweep-doors.ts): the expert withdraws it (200).
  { method: "DELETE", path: "/api/v1/shared/expert/availability/{slotId}", summary: "Withdraw an unbooked window", access: ["EXPERT"], response: c.okSchema, sample: (f) => (f.goneExpertSlotId ? `/api/v1/shared/expert/availability/${f.goneExpertSlotId}` : null) },
  { method: "GET", path: "/api/v1/shared/expert/profile", summary: "The expert's own profile and impact", access: ["EXPERT"], response: c.expertProfileSchema },
  { method: "POST", path: "/api/v1/shared/expert/profile", summary: "Save the expert's own profile", access: ["EXPERT"], request: c.expertSaveProfileSchema, response: c.okSchema, emptyBodyStatus: 422 },
  // ---- the expert's standing: papers, free duty, the calendar feed (src/lib/expert-kyc.ts) ----
  // The role alone opens these, listed or not: papers are sent before anybody is listed. The feed itself
  // is "anyone" because a calendar application holds no session; the token in its URL is the whole key.
  { method: "GET", path: "/api/v1/expert/kyc", summary: "Where the expert's identity papers stand: status, the note, the stored ids", access: ["EXPERT"], response: c.expertKycSchema, sample: "/api/v1/expert/kyc" },
  { method: "POST", path: "/api/v1/expert/kyc", summary: "Send identity papers: one to five file ids uploaded in the expert's own name, with a note for the operator; a waiting set is replaced", access: ["EXPERT"], request: c.expertKycSubmitBodySchema, response: c.expertKycSchema, emptyBodyStatus: 422, sample: "/api/v1/expert/kyc" },
  { method: "GET", path: "/api/v1/expert/free-duty", summary: "What the expert still owes free this period before a price may be asked (decision 0004)", access: ["EXPERT"], response: c.expertFreeDutySchema, sample: "/api/v1/expert/free-duty" },
  { method: "GET", path: "/api/v1/expert/calendar/token", summary: "The expert's calendar feed URL, or null until one is minted", access: ["EXPERT"], response: c.expertCalendarTokenSchema, sample: "/api/v1/expert/calendar/token" },
  // The feed BEFORE the rotate, on purpose: the sweep reads the token as the run starts, the feed answers it (200), and the rotate then moves the ZZ expert's token on, which the next run reads afresh.
  { method: "GET", path: "/api/v1/expert/calendar.ics", summary: "The expert's offered times and booked sessions as an iCalendar feed, by the token in the URL; school names and session kinds only, never a pupil", access: "anyone", response: c.expertCalendarFeedSchema, sample: (f) => (f.expertCalendarToken ? `/api/v1/expert/calendar.ics?token=${encodeURIComponent(f.expertCalendarToken)}` : null) },
  { method: "POST", path: "/api/v1/expert/calendar/token", summary: "Mint or rotate the calendar feed's token; the old URL stops answering at once", access: ["EXPERT"], response: c.expertCalendarTokenSchema, sample: "/api/v1/expert/calendar/token" },
  // ---- uploads ----------------------------------------------------------------
  { method: "POST", path: "/api/v1/uploads", summary: "Upload one file (multipart `file`); read it back via /api/files/{fileId}", access: "signed-in", response: c.uploadResultSchema, emptyBodyStatus: 422 },
  // ---- the app itself: the kill switch, and reporting a problem ---------------
  { method: "GET", path: "/api/v1/app/version", summary: "The oldest app build the API still serves, per platform, and where the newer one is", access: "anyone", response: c.appVersionSchema },
  {
    method: "POST",
    path: "/api/v1/app/report",
    summary: "Report a problem from the app, or the app's own crash report; answers a reference the person can quote",
    access: "signed-in",
    request: c.appReportBodySchema,
    response: c.appReportResultSchema,
    emptyBodyStatus: 422,
    sampleBody: () => ({ kind: "PROBLEM", message: "ZZ sweep: the sweep reporting a problem on purpose", screen: "sweep", device: { platform: "android", appVersion: "0.0.0" } }),
  },
  // ---- global search ----------------------------------------------------------
  { method: "GET", path: "/api/v1/search", summary: "One search across the people, posts, messages, papers and pages the caller may already see; `q` two to eighty characters", access: "signed-in", response: c.searchResultsSchema, sample: "/api/v1/search?q=zz" },
];
