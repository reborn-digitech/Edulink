/**
 * Client-safe half of the safety centre: types and label maps only.
 *
 * Deliberately has NO "server-only" marker and imports nothing from the data
 * layer, because the report cards and the audit table are client components and
 * need these. Keeping them here rather than in safety.ts is what stops a client
 * bundle pulling in Prisma — which is a build error, not a type error, so
 * `tsc --noEmit` will not warn you about it.
 */

import type { TranslationKey } from "./i18n/dictionary";

export type ReportTarget =
  | {
      kind: "POST";
      available: true;
      title: string;
      body: string;
      status: string;
      authorName: string;
      authorRole: string | null;
      createdAt: Date;
      href: string;
    }
  | {
      kind: "COMMENT";
      available: true;
      body: string;
      status: string;
      authorName: string;
      postTitle: string;
      createdAt: Date;
      href: string;
    }
  | {
      kind: "USER";
      available: true;
      name: string;
      roles: string[];
      href: string | null;
      /** True when this school has already paused them. */
      suspended: boolean;
    }
  | { kind: "POST" | "COMMENT" | "USER"; available: false };

export type ReportGroup = {
  targetType: "POST" | "COMMENT" | "USER";
  targetId: string;
  target: ReportTarget;
  reportIds: string[];
  count: number;
  reasons: { reason: string; count: number }[];
  details: { reason: string; detail: string; reporterName: string; at: Date }[];
  firstAt: Date;
  latestAt: Date;
  status: "OPEN" | "ACTIONED" | "DISMISSED";
  resolutionNote: string | null;
};

export type AuditEntry = {
  id: string;
  action: string;
  actorName: string;
  targetType: string | null;
  targetId: string | null;
  meta: Record<string, unknown>;
  ip: string | null;
  at: Date;
};

/**
 * ⚠ KEYS, NOT WORDS — see `ROLE_META`. Both tables below are read by the
 * Safety Centre, which is a fully translated admin page; returning finished
 * English put "Unkind or bullying" and "Took a register" in the middle of it.
 *
 * The functions return a key or `null`. `null` means "no wording for this one",
 * and the caller falls back to the raw action key — which is a debugging aid
 * rather than prose, and is the same in every language.
 */
const REASON_KEYS: Record<string, TranslationKey> = {
  BULLYING: "safety.reasonBullying",
  UNSAFE: "safety.reasonUnsafe",
  PRIVACY: "safety.reasonPrivacy",
  WRONG_INFO: "safety.reasonWrongInfo",
  SPAM: "safety.reasonSpam",
  OTHER: "safety.reasonOther",
};

export function reasonKey(reason: string): TranslationKey | null {
  return REASON_KEYS[reason] ?? null;
}

/** Reasons that sort to the top of the queue regardless of age or count. */
export const URGENT_REASONS = new Set(["UNSAFE", "BULLYING"]);

/** The dictionary key for an audit action, or null if it has no wording yet. */
const ACTION_KEYS: Record<string, TranslationKey> = {
  "exam.seriesCreate": "audit.examSeriesCreate",
  "exam.seriesPublish": "audit.examSeriesPublish",
  "exam.seriesArchive": "audit.examSeriesArchive",
  "exam.slotChange": "audit.examSlotChange",
  "exam.marksSave": "audit.examMarksSave",
  "school.create": "audit.schoolCreate",
  "auth.login": "audit.authLogin",
  "auth.login.failed": "audit.authLoginFailed",
  "invite.create": "audit.inviteCreate",
  "invite.accept": "audit.inviteAccept",
  "invite.revoke": "audit.inviteRevoke",
  "invite.resend": "audit.inviteResend",
  "class.create": "audit.classCreate",
  "class.archive": "audit.classArchive",
  "class.restore": "audit.classRestore",
  "class.code.rotate": "audit.classCodeRotate",
  "class.teacher.assign": "audit.classTeacherAssign",
  "class.teacher.remove": "audit.classTeacherRemove",
  "attendance.mark": "audit.attendanceMark",
  "assignment.publish": "audit.assignmentPublish",
  "assignment.draft": "audit.assignmentDraft",
  "grade.save": "audit.gradeSave",
  "submission.create": "audit.submissionCreate",
  "remark.create": "audit.remarkCreate",
  "student.join": "audit.studentJoin",
  "parent.signup": "audit.parentSignup",
  "parent.claim": "audit.parentClaim",
  "parent.claim.failed": "audit.parentClaimFailed",
  "directory.export": "audit.directoryExport",
  "post.publish": "audit.postPublish",
  "post.submit": "audit.postSubmit",
  "post.approve": "audit.postApprove",
  "post.reject": "audit.postReject",
  "post.pin": "audit.postPin",
  "post.unpin": "audit.postUnpin",
  "content.report": "audit.contentReport",
  "report.action": "audit.reportAction",
  "report.dismiss": "audit.reportDismiss",
  "prefs.update": "audit.prefsUpdate",
  "push.subscribe": "audit.pushSubscribe",
  "session.revoke": "audit.sessionRevoke",
  "session.revoke.others": "audit.sessionRevokeOthers",
  "superuser.school.create": "audit.superuserSchoolCreate",
  "superuser.school.update": "audit.superuserSchoolUpdate",
  "superuser.invite.admin": "audit.superuserInviteAdmin",
  "superuser.invite.revoke": "audit.superuserInviteRevoke",
  "account.email.code": "audit.accountEmailCode",
  "account.email.confirm": "audit.accountEmailConfirm",
  "account.merge": "audit.accountMerge",
  "account.merge.failed": "audit.accountMergeFailed",
  "account.mobile.code": "audit.accountMobileCode",
  "account.mobile.confirm": "audit.accountMobileConfirm",
  "account.mobile.remove": "audit.accountMobileRemove",
  "assignment.attach": "audit.assignmentAttach",
  "attendance.cover.cancel": "audit.attendanceCoverCancel",
  "attendance.cover.create": "audit.attendanceCoverCreate",
  "auth.email.verified": "audit.authEmailVerified",
  "auth.email.verify.resent": "audit.authEmailVerifyResent",
  "auth.reset.completed": "audit.authResetCompleted",
  "auth.reset.failed": "audit.authResetFailed",
  "auth.reset.requested": "audit.authResetRequested",
  "class.cohort.add": "audit.classCohortAdd",
  "class.cohort.remove": "audit.classCohortRemove",
  "competition.consent": "audit.competitionConsent",
  "competition.create": "audit.competitionCreate",
  "competition.enter": "audit.competitionEnter",
  "competition.submit": "audit.competitionSubmit",
  "competition.withdraw": "audit.competitionWithdraw",
  "expert.book": "audit.expertBook",
  "expert.cancel": "audit.expertCancel",
  "expert.invite": "audit.expertInvite",
  "holiday.create": "audit.holidayCreate",
  "holiday.delete": "audit.holidayDelete",
  "holiday.update": "audit.holidayUpdate",
  "leave.apply": "audit.leaveApply",
  "leave.cancel": "audit.leaveCancel",
  "membership.reinstate": "audit.membershipReinstate",
  "membership.remove": "audit.membershipRemove",
  "membership.suspend": "audit.membershipSuspend",
  "mentorship.close": "audit.mentorshipClose",
  "mentorship.consent": "audit.mentorshipConsent",
  "mentorship.create": "audit.mentorshipCreate",
  "mentorship.request": "audit.mentorshipRequest",
  "mentorship.request.approve": "audit.mentorshipRequestApprove",
  "mentorship.request.decline": "audit.mentorshipRequestDecline",
  "operator.post.takedown": "audit.operatorPostTakedown",
  "operator.school.close": "audit.operatorSchoolClose",
  "operator.school.open": "audit.operatorSchoolOpen",
  "profile.update": "audit.profileUpdate",
  "quiz.badge": "audit.quizBadge",
  "quiz.tierBadge": "audit.quizTierBadge",
  "practice.assign": "audit.practiceAssign",
  "school.logo.remove": "audit.schoolLogoRemove",
  "school.logo.update": "audit.schoolLogoUpdate",
  "school.settings.update": "audit.schoolSettingsUpdate",
  "student.leave": "audit.studentLeave",
  "student.leave.undo": "audit.studentLeaveUndo",
  "submission.attach": "audit.submissionAttach",
  "timetable.day.copy": "audit.timetableDayCopy",
  "timetable.period.archive": "audit.timetablePeriodArchive",
  "timetable.period.create": "audit.timetablePeriodCreate",
  "timetable.period.restore": "audit.timetablePeriodRestore",
  "timetable.period.seed": "audit.timetablePeriodSeed",
  "timetable.period.update": "audit.timetablePeriodUpdate",
  "timetable.slot.clear": "audit.timetableSlotClear",
  "timetable.slot.set": "audit.timetableSlotSet",
  "year.close": "audit.yearClose",
  "year.create": "audit.yearCreate",
  "expert.profile.update": "audit.expertProfileUpdate",
};

export function actionKey(action: string): TranslationKey | null {
  return ACTION_KEYS[action] ?? null;
}

/** Actions worth flagging in the log at a glance. */
export function isSensitiveAction(action: string): boolean {
  return (
    action === "directory.export" ||
    action === "auth.login.failed" ||
    action === "parent.claim.failed" ||
    action.startsWith("report.") ||
    action === "content.report"
  );
}
