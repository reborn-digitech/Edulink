/**
 * THE TERMS REPORT (decision 0010; the brief's phase 3, with the coordinating session's C4 and C4a of 21 November 2026):
 * what each school and college would follow at our prices, so that the operator sets terms knowingly. It sets none: under
 * the owner's "No change until I set terms" that stays the operator's own act, one school or many, on the Subscriptions page.
 *
 * IT WRITES NOTHING, and that is made certain, not assumed: its own client on the owner's connection (npm run terms:report,
 * through with-admin-db, which prints the database first), every read inside one interactive transaction whose first
 * statement is SET TRANSACTION READ ONLY, with an explicit timeout, and none of the library's readers (activePlans reads
 * through planRows, which creates the plan rows that are missing: src/lib/person-plans.ts). The plans asked for are read
 * from their rows, a missing row being not asked for, and every sum is a pure function of the contracts. A pure source test
 * (tests/terms-report.test.ts) holds that nothing here creates, updates, deletes, upserts or sends a raw statement but that
 * SET. The tenant-transaction rule (CLAUDE.md: `$tenantTransaction`, never a bare `$transaction`) fences a request's writes
 * to its tenant; this is an owner-connection report bound to no tenant that writes nothing, so a read-only transaction is
 * the fence it needs.
 *
 *   npm run terms:report -- --fixtures        ZZ and demo schools: School.isTestFixture, or School.contactEmail ending
 *                                             "@demo.relay.test" (the data audit's rule: the demo colleges are not
 *                                             flagged on purpose); each school says which rule picked it
 *   npm run terms:report -- --school <id>     one school
 *   npm run terms:report -- --all             every school: the operator's, at their own terminal
 *
 * One scope is required. Removed schools are left out. Output goes to the terminal alone. A partner has no fixture flag and
 * may be a real person typed by hand, so --fixtures prints a partner's name only when it starts with "ZZ", and otherwise
 * "a partner" with the percent.
 *
 * For each school: its kind and status, partner and percent, plan with its old monthly price or tier, whether its terms are
 * set; what it follows (its own terms where set, our prices where not: what "Put on our prices" would give), each part's
 * price a student a year, the newest count and its month, the year "if terms were set at today's prices, last count"; the
 * partner's month under decision 6 beside today's reading, with the reason where decision 6's is nothing (in its free months,
 * a year owed, renewal date reached, no count, no tier, not Active, free by agreement); premium as off, or on and billed, or
 * on and not billed with the reason. Then every college without a tier, on an ordinary plan or on no plan, terms set or not
 * (C4f): those that read, or will read once their terms are set, "No tier chosen".
 */
import { PrismaClient } from "@prisma/client";
import {
  OFFER_START,
  PREMIUM_PLANS,
  billFor,
  collegeTierOf,
  isCollegeKind,
  partnerMonth,
  premiumBilling,
  premiumTerms,
  subscriptionTerms,
  tierMonthPaise,
  type PartTerms,
} from "@edulink/contracts";
import { safeTimeZone, todayKey } from "../src/lib/dates";

type Scope = { kind: "fixtures" } | { kind: "school"; id: string } | { kind: "all" };

/** One scope, and only one (C4: "Scopes, one required"): two given is refused, never one chosen silently. */
function scopeOf(argv: readonly string[]): Scope | null {
  if (["--fixtures", "--all", "--school"].filter((flag) => argv.includes(flag)).length !== 1) return null;
  if (argv.includes("--fixtures")) return { kind: "fixtures" };
  if (argv.includes("--all")) return { kind: "all" };
  const at = argv.indexOf("--school");
  if (at >= 0 && argv[at + 1]) return { kind: "school", id: argv[at + 1]! };
  return null;
}

const DEMO_OFFICE = "@demo.relay.test";
const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const twelfthShare = (monthPaise: number, percentTenths: number) => Math.round((monthPaise * percentTenths) / 1000);
const sourceWords = (t: PartTerms) => (t.source === "OWN_PRICE" ? "its own price" : t.source === "OWN_DISCOUNT" ? `its own discount of ${t.discountBps / 100} %` : t.discountBps ? `our price less our ${t.discountBps / 100} %` : "our price");

async function main(): Promise<void> {
  const scope = scopeOf(process.argv.slice(2));
  if (!scope) {
    console.error("terms:report needs one scope, and only one: --fixtures, --school <id>, or --all (the operator's, at their own terminal).");
    process.exitCode = 2;
    return;
  }
  const db = new PrismaClient();
  const now = new Date();
  const thisUtcMonth = now.toISOString().slice(0, 7);
  try {
    const lines = await db.$transaction(
      async (tx) => {
        await tx.$executeRaw`SET TRANSACTION READ ONLY`;
        const [offerRow, planRows, schools] = await Promise.all([
          tx.schoolOffer.findUnique({ where: { id: "offer" } }),
          tx.personPlan.findMany({ select: { code: true, active: true } }),
          tx.school.findMany({
            where: {
              removedAt: null,
              ...(scope.kind === "school" ? { id: scope.id } : {}),
              ...(scope.kind === "fixtures" ? { OR: [{ isTestFixture: true }, { contactEmail: { endsWith: DEMO_OFFICE } }] } : {}),
            },
            orderBy: { name: "asc" },
            select: {
              id: true,
              name: true,
              kind: true,
              timezone: true,
              isTestFixture: true,
              contactEmail: true,
              subscriptionStatus: true,
              subscriptionDueAt: true,
              termsSetAt: true,
              subscriptionPricePaise: true,
              subscriptionDiscountBps: true,
              premiumStudents: true,
              premiumTeachers: true,
              premiumPricePaise: true,
              premiumDiscountBps: true,
              plan: { select: { code: true, name: true, priceMonthlyPaise: true } },
              commissionPartner: { select: { name: true, percentTenths: true } },
            },
          }),
        ]);
        const ids = schools.map((s) => s.id);
        const [newest, thisMonth] = await Promise.all([
          tx.usageSample.findMany({ where: { schoolId: { in: ids } }, orderBy: [{ schoolId: "asc" }, { month: "desc" }, { computedAt: "desc" }], distinct: ["schoolId"], select: { schoolId: true, month: true, pupils: true } }),
          tx.usageSample.findMany({ where: { schoolId: { in: ids }, month: thisUtcMonth }, select: { schoolId: true, pupils: true } }),
        ]);
        const offer = offerRow ?? { ...OFFER_START };
        const asked = new Set(planRows.filter((p) => p.active && (PREMIUM_PLANS as readonly string[]).includes(p.code)).map((p) => p.code));
        const count = new Map(newest.map((u) => [u.schoolId, u]));
        const roll = new Map(thisMonth.map((u) => [u.schoolId, u.pupils]));
        const out: string[] = [];
        out.push(`Our offer: subscription ${rupees(offer.subscriptionPricePaise)} a student a year${offer.subscriptionDiscountBps ? ` less ${offer.subscriptionDiscountBps / 100} %` : ""}, premium ${rupees(offer.premiumPricePaise)} more${offer.premiumDiscountBps ? ` less ${offer.premiumDiscountBps / 100} %` : ""}, ${offer.freeMonths} free months${offerRow ? "" : " (the starting values: no offer saved)"}.`);
        out.push(`Plans asked for: ${asked.size ? [...asked].join(", ") : "none"}. ${schools.length} school(s) in scope (${scope.kind === "school" ? "one school" : scope.kind === "all" ? "every school" : "fixtures"}).`);
        const nonTierColleges: string[] = [];
        for (const s of schools) {
          const status = s.subscriptionStatus;
          const termsSet = s.termsSetAt !== null;
          const zone = safeTimeZone(s.timezone);
          const today = todayKey(zone, now);
          const renewal = s.subscriptionDueAt ? s.subscriptionDueAt.toISOString().slice(0, 10) : null;
          const sample = count.get(s.id) ?? null;
          const pupils = sample ? sample.pupils : null;
          const college = isCollegeKind(s.kind);
          const tier = collegeTierOf(s.plan?.code);
          if (college && !tier) nonTierColleges.push(`${s.name} (${s.plan ? `on ${s.plan.name}` : "on no plan"}, terms ${termsSet ? "set" : "not set"})`);
          // What it follows: its own terms where set; our prices where not (what "Put on our prices" would give).
          const own = termsSet
            ? { sub: { pricePaise: s.subscriptionPricePaise, discountBps: s.subscriptionDiscountBps }, prem: { pricePaise: s.premiumPricePaise, discountBps: s.premiumDiscountBps } }
            : { sub: null, prem: null };
          const sub = subscriptionTerms({ kind: s.kind, planCode: s.plan?.code ?? null, own: own.sub }, { pricePaise: offer.subscriptionPricePaise, discountBps: offer.subscriptionDiscountBps });
          const prem = premiumTerms(own.prem, { pricePaise: offer.premiumPricePaise, discountBps: offer.premiumDiscountBps });
          const billing = premiumBilling({ termsSet: true, students: s.premiumStudents, teachers: s.premiumTeachers }, asked);
          const year = billFor({ pupils, termsSet: true, renewalDay: renewal ?? today, subscription: sub, premium: prem, premiumOn: billing.billed });
          // The partner's month: decision 6's reading as if the terms were set, beside today's.
          const oldMonth = tier ? (roll.has(s.id) ? tierMonthPaise(s.plan?.code, roll.get(s.id)!) : null) : (s.plan?.priceMonthlyPaise ?? null);
          const set6 = partnerMonth({ termsSet: true, status, renewalDay: renewal, todayDay: today, subscription: sub, pupils, oldMonthPaise: null });
          const today6 = partnerMonth({ termsSet: false, status, renewalDay: renewal, todayDay: today, subscription: null, pupils: null, oldMonthPaise: oldMonth });
          // Why decision 6's month is nothing, in the order a reader looks for it (C4; C4a point 7).
          const nothing =
            status === "TRIAL"
              ? "in its free months"
              : status === "DUE"
                ? "a year owed"
                : status !== "ACTIVE"
                  ? `not Active (${status === "SUSPENDED" ? "Suspended" : status === "ENDED" ? "Ended" : "no status on record"})`
                  : set6.freeByAgreement
                    ? "free by agreement (₹0)"
                    : [set6.renewalReached ? "renewal date reached, no payment recorded yet" : null, set6.unpriced ? (college && !tier ? "no tier chosen" : "no count yet") : null, !set6.renewalReached && !set6.unpriced && !set6.earns ? "no pupils on the count" : null]
                        .filter(Boolean)
                        .join("; ") || null;
          const partner = s.commissionPartner
            ? `${scope.kind === "fixtures" && !s.commissionPartner.name.startsWith("ZZ") ? "a partner" : s.commissionPartner.name} (${s.commissionPartner.percentTenths / 10} %)`
            : "none";
          const share = (month: number | null, earns: boolean) => (!s.commissionPartner ? "no partner" : !earns || !month ? "nothing" : rupees(twelfthShare(month, s.commissionPartner.percentTenths)));
          const picked = scope.kind !== "fixtures" ? "" : ` [${s.isTestFixture ? "isTestFixture" : `office address ${DEMO_OFFICE}`}]`;
          out.push("");
          out.push(`${s.name} (${s.kind ?? "SCHOOL"})${picked}`);
          out.push(`  status ${status ?? "none on record"}; renewal ${renewal ?? "none on record"}; terms ${termsSet ? "set" : "not set"}; partner ${partner}`);
          out.push(`  plan ${s.plan ? `${s.plan.name}${tier ? ` (tier ${rupees(tier.perStudentYearPaise)} a student a year)` : s.plan.priceMonthlyPaise !== null ? ` (old monthly price ${rupees(s.plan.priceMonthlyPaise)})` : " (no old price)"}` : "none"}`);
          out.push(`  ${termsSet ? "follows" : "would follow at our prices"}: Shalaghar subscription ${sub ? `${rupees(sub.paysPaise)} a student a year + GST (${sourceWords(sub)})` : "no tier chosen"}; premium add-on ${!s.premiumStudents && !s.premiumTeachers ? `off (${rupees(prem.paysPaise)} more if on)` : billing.billed ? `on, billed: ${rupees(prem.paysPaise)} more a student a year (${sourceWords(prem)})` : `on, not billed: the ${billing.waitsFor.map((p) => (p === "STUDENT" ? "Student" : "Teacher")).join(" and ")} plan${billing.waitsFor.length > 1 ? "s" : ""} not asked for`}`);
          out.push(`  newest count ${sample ? `${sample.pupils} pupils (${sample.month})` : "none yet"}; the year if terms were set at today's prices, last count: ${year ? `${rupees(year.totalPaise)} (${year.lines.map((l) => `${l.part === "SUBSCRIPTION" ? "subscription" : "premium"} ${rupees(l.totalPaise)}`).join(", ") || "nothing to bill"})` : sub ? "no count yet" : "no tier chosen"}`);
          out.push(`  partner's month under decision 6: ${nothing ? `nothing (${nothing})` : share(set6.monthPaise, set6.earns)}; by today's reading: ${today6.unpriced ? "nothing (no price to take a share of)" : status !== "ACTIVE" ? "nothing (not Active)" : share(today6.monthPaise, today6.earns)}`);
        }
        out.push("");
        out.push(`Colleges without a tier (each reads, or will read once its terms are set, "No tier chosen"): ${nonTierColleges.length ? nonTierColleges.join("; ") : "none"}.`);
        return out;
      },
      { timeout: 120_000, maxWait: 10_000 },
    );
    for (const line of lines) console.log(line);
  } finally {
    await db.$disconnect();
  }
}

void main();
