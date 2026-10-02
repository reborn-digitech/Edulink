import type { Translate } from "@/lib/i18n/dictionary";

/** The words the dashboard, the school page and the partners page share for a subscription. */

/** The status in the reader's words; a status not in the list (an older row) reads as itself. */
export function statusLabel(t: Translate, status: string | null): string {
  switch (status) {
    case "TRIAL":
      return t("root.statusTRIAL");
    case "ACTIVE":
      return t("root.statusACTIVE");
    case "DUE":
      return t("root.statusDUE");
    case "SUSPENDED":
      return t("root.statusSUSPENDED");
    case "ENDED":
      return t("root.statusENDED");
    default:
      return status ?? t("root.subscriptionNotRecorded");
  }
}

/** "Due in 12 days" / "Due today" / "3 days overdue", for a row with a due date. */
export function dueLabel(t: Translate, days: number | null): string | null {
  if (days === null) return null;
  if (days === 0) return t("root.subscriptionDueToday");
  return days > 0 ? t("root.subscriptionDueIn", { days }) : t("root.subscriptionOverdue", { days: -days });
}
