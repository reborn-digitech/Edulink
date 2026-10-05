import type { DecisionKind } from "@edulink/contracts";
import type { TranslationKey } from "./i18n/dictionary";

/** What each kind of decision is called on a page. Client-safe: no server-only import, so the list and the page share it. */
export const DECISION_KIND_KEY: Record<DecisionKind, TranslationKey> = {
  leave: "decisions.kindLeave",
  pen: "decisions.kindPen",
  record: "decisions.kindRecord",
  certificate: "decisions.kindCertificate",
  join: "decisions.kindJoin",
  admission: "decisions.kindAdmission",
  grace: "decisions.kindGrace",
  condonation: "decisions.kindCondonation",
  concession: "decisions.kindConcession",
  lateRegistration: "decisions.kindLateRegistration",
  refundException: "collegeDesks.kindRefundException",
  expulsion: "collegeDesks.kindExpulsion",
};
