/**
 * THE MONTHLY TEXT CAP IN FORCE, one rule with one writer (QA-76): the plan's when the school is on a plan that states
 * one, else the school's own dial (`School.msgMonthlyCap`). messaging.ts (the cap every text is held to, through
 * `messagingSettings`) and subscriptions.ts (the operator's sum over live schools) both read it here, from the row
 * they have already loaded, so a school put on a smaller plan is held to it the same night and the two never differ.
 * No imports, so either may use it without pulling in the other's graph.
 */
export type MessageCapSource = { msgMonthlyCap: number; plan: { messageCap: number | null } | null };

export function messageCapOf(school: MessageCapSource): number {
  return school.plan?.messageCap ?? school.msgMonthlyCap;
}
