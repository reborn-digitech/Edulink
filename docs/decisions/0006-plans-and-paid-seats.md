# 0006 — Plans sold per person, and sessions sold per seat

Status: accepted by the owner (16 October 2026), from the owner's decisions of 15 and 16 October 2026. Amends decision 0004 in two places (below). Governs `apps/web/src/lib/person-plans.ts`, the `mayUse` seam in `apps/web/src/lib/platform-features.ts`, the `PersonPlan` and `Entitlement` tables, the plan card (`apps/web/src/components/plan-card.tsx`), `/account/plan`, the Plans section of `/root/features`, the `/api/v1/operator/person-plans` and `/api/v1/operator/entitlements` doors and the `plans:expire` job. Decision 0003 is unchanged and still governs school fees: nothing here touches a school's money.

## Decision

The platform sells three plans, each to one person.

| Plan | What it opens | Who pays |
|---|---|---|
| **STUDENT** | the question bank's practice, the assistant | a guardian for a pupil under eighteen; a college student for themselves |
| **TEACHER** | the teachers' question gig, offering teaching sessions, the job board as a reader, the assistant | the teacher |
| **EXPERT** | offering any time as an expert (sessions and mentoring); required before an expert may offer time | the expert |

- **Sessions are sold per seat, for everyone, and are in no plan.** A plan lets a teacher or an expert *offer* sessions; a family pays for each seat it books.
- **A school posting a vacancy needs no plan.** Only reading the board as a job seeker is the teacher's plan.
- **The platform's feature switches stay above the plans** (`/root/features`, decision of 15 October 2026). A feature the operator has off is off for everyone, plan or not.

## Amendments to decision 0004

1. **A one-to-one may be priced.** 0004's second amendment of 2 October 2026 said a one-to-one is never priced; that is withdrawn. How a priced one-to-one is sold is the second half of this work (Razorpay, per seat).
2. **A teacher's sessions may be sold.** 0004 kept a teacher's one-to-one guidance always free. A teacher may now offer sessions under the TEACHER plan, and a family pays per seat for them as for an expert's. The rule that a teacher's guidance is for their own school's pupils and that the school switches it on is unchanged.

## How it is built (first half, 16 October 2026)

- **A person is entitled to a feature while an unrevoked `Entitlement` row covers now.** A row names one feature, a window (`validFrom` ≤ now < `validTo`), where it came from (`ORDER` a paid pass, `GRANT` the operator's grant, `SEAT` one paid seat), the plan it came from, and, for an order or a seat, the payment order behind it.
- **Who needs a plan is one table**, by the role on the session (`PLAN_TABLE` in `person-plans.ts`): a STUDENT needs the STUDENT plan for practice and the assistant; a TEACHER the TEACHER plan for the gig, offering sessions, reading the job board and the assistant; an EXPERT the EXPERT plan for offering time. Every other role needs none. A guardian needs none of their own, but reads a child's practice only while the child holds the plan.
- **A plan is asked for only while the operator has made it active.** The three plan rows start inactive at no price, so that the migration locks nobody out; an inactive plan's features follow the platform switch alone. (The owner's model said "active"; reading it as "asked for" is the builder's, to be confirmed.)
- **What a person without the plan meets:** the page shows the plan card (its name, what it includes, the monthly and yearly price, Subscribe); a door answers `402` with code `PLAN_REQUIRED` and the plan; the menu keeps the entry so the card can be reached.
- **What a lapsed plan keeps open:** an expert's earnings, invoices, payout details and the sessions already booked with them; a provider marking or cancelling what they already offered; a teacher's payee details while they are owed for questions.
- **No payment yet.** Subscribe leads to a page that says payment opens soon and that the office or the operator can switch a plan on. The operator grants a plan for 1, 3, 6 or 12 months from `/root/features`, and can revoke any entitlement; both are audited.
- **When a window ends** the `plans:expire` job (04:20 daily) writes one audit line and tells the person in the app, once.

## The second half (not built)

Razorpay passes and seats: an order for a plan's month or year writes `ORDER` entitlements with the order's id when the payment is confirmed; a paid seat writes a `SEAT` row. Both go through the same `Entitlement` table and the same seam, so no gated page or door changes.
