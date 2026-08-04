/**
 * Client-safe half of the safety centre: types and label maps only.
 *
 * Deliberately has NO "server-only" marker and imports nothing from the data
 * layer, because the report cards and the audit table are client components and
 * need these. Keeping them here rather than in safety.ts is what stops a client
 * bundle pulling in Prisma — which is a build error, not a type error, so
 * `tsc --noEmit` will not warn you about it.
 */

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

const REASON_LABELS: Record<string, string> = {
  BULLYING: "Unkind or bullying",
  UNSAFE: "Someone might be unsafe",
  PRIVACY: "Shares private information",
  WRONG_INFO: "Not true",
  SPAM: "Spam",
  OTHER: "Something else",
};

export function reasonLabel(reason: string): string {
  return REASON_LABELS[reason] ?? reason;
}

/** Reasons that sort to the top of the queue regardless of age or count. */
export const URGENT_REASONS = new Set(["UNSAFE", "BULLYING"]);

/** Human wording for an audit action key. Unknown keys fall back to the key. */
export function describeAction(action: string): string {
  const map: Record<string, string> = {
    "school.create": "Created the school",
    "auth.login": "Signed in",
    "auth.login.failed": "Failed sign-in attempt",
    "invite.create": "Sent invitations",
    "invite.accept": "Accepted an invitation",
    "invite.revoke": "Withdrew an invitation",
    "invite.resend": "Resent an invitation",
    "class.create": "Created a class",
    "class.archive": "Archived a class",
    "class.restore": "Restored a class",
    "class.code.rotate": "Changed a class join code",
    "class.teacher.assign": "Assigned a teacher to a class",
    "class.teacher.remove": "Removed a teacher from a class",
    "attendance.mark": "Took a register",
    "assignment.publish": "Published an assignment",
    "assignment.draft": "Saved an assignment draft",
    "grade.save": "Saved marks",
    "submission.create": "A student handed work in",
    "remark.create": "Started a private message thread",
    "student.join": "A student joined with a code",
    "parent.signup": "A parent created an account",
    "parent.claim": "A parent linked to a child",
    "parent.claim.failed": "Failed attempt to link to a child",
    "directory.export": "Exported the directory",
    "post.publish": "Published a bulletin post",
    "post.submit": "Submitted a post for review",
    "post.approve": "Approved a student post",
    "post.reject": "Sent a student post back",
    "post.pin": "Pinned a post",
    "post.unpin": "Unpinned a post",
    "content.report": "Reported content",
    "report.action": "Removed reported content",
    "report.dismiss": "Dismissed a report",
    "prefs.update": "Changed their settings",
    "push.subscribe": "Turned on notifications",
    "session.revoke": "Signed out a device",
    "session.revoke.others": "Signed out all other devices",
    // Written with schoolId NULL, so no school's Safety Centre ever shows one.
    // They are read by /root/audit, which shares this map so the operator's log
    // and a school's log describe the same event the same way.
    "superuser.school.create": "Added a school to this server",
    "superuser.school.update": "Changed a school's details",
    "superuser.invite.admin": "Invited a school administrator",
    "superuser.invite.revoke": "Withdrew an administrator invitation",
    "expert.profile.update": "An expert edited their profile",
  };
  return map[action] ?? action;
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
