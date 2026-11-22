/**
 * The operator's sentences for the subscription console (decision 0010; the brief's §2.1 to §2.4 and rule 12, "every
 * sentence is the server's"; the coordinating session's C2, C2a, C2b, C3 and C3a of 21 November 2026). Pure: each is worded
 * from a door's answer or the terms as read, so every branch is read here in English, and every key in Hindi and Marathi.
 *
 * The brief's own examples are held word for word where it gives them: the cells "₹80 · own 20 % off ₹100" and "₹100 ·
 * ours" (§2.1), the switch's toast "ZZ Banyan School gets premium for students now. It is billed from its renewal on 21 May
 * 2027: ₹50 more a student a year + GST (about ₹20,600 at last count), on top of its ₹80 subscription." (§2.1), the premium
 * column's "₹50 if on" and C2's "Premium on, not billed: terms not set", and C2's payment preview "from the renewal on record"
 * and "from today: no renewal is on record".
 */
import { describe, expect, it } from "vitest";
import type { OfferChange, PartFigure, PaymentAnswer, SchoolTerms } from "@edulink/contracts";
import { formatPaise } from "@edulink/i18n";
import { en } from "@edulink/i18n/en";
import { hi } from "@edulink/i18n/hi";
import { mr } from "@edulink/i18n/mr";
import { translator } from "@/lib/i18n/dictionary";
import { bulkSentence, datesSentence, notCountedLine, offerChangeSentence, partCell, partnerSentence, paymentSentence, premiumCell, premiumInfoLines, schoolTermsSentence, stateLabel, switchSentence, termsChangeSentence, type Fmt } from "@/lib/terms-sentences";

function fmtFor(locale: "en" | "hi" | "mr"): Fmt {
  return {
    t: translator(locale),
    money: (paise) => formatPaise(paise, locale),
    day: (key) => ({ "2027-05-21": "21 May 2027", "2028-05-21": "21 May 2028", "2026-11-21": "21 Nov 2026", "2026-11-01": "1 Nov 2026" })[key] ?? key,
    percent: (bps) => (bps / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 }),
  };
}
const f = fmtFor("en");

const OURS_SUB: PartFigure = { basePaise: 10_000, discountBps: 0, paysPaise: 10_000, source: "OURS", tierCode: null };
const OWN20_SUB: PartFigure = { basePaise: 10_000, discountBps: 2_000, paysPaise: 8_000, source: "OWN_DISCOUNT", tierCode: null };
const OWN_PRICE: PartFigure = { basePaise: 12_000, discountBps: 0, paysPaise: 12_000, source: "OWN_PRICE", tierCode: null };
const TIER: PartFigure = { basePaise: 19_900, discountBps: 0, paysPaise: 19_900, source: "OURS", tierCode: "college-affiliated" };
const FREE: PartFigure = { basePaise: 10_000, discountBps: 10_000, paysPaise: 0, source: "OWN_DISCOUNT", tierCode: null };
const OURS_PREMIUM: PartFigure = { basePaise: 5_000, discountBps: 0, paysPaise: 5_000, source: "OURS", tierCode: null };

/** A terms view of ZZ Banyan School: own 20 % off ours, premium off, free until 21 May 2027, 412 pupils. */
function view(over: Partial<SchoolTerms> = {}): SchoolTerms {
  return {
    schoolId: "s1",
    name: "ZZ Banyan School",
    kind: "SCHOOL",
    planCode: null,
    termsSet: true,
    termsSetAt: "2026-11-21T06:00:00.000Z",
    subscription: { mode: "OWN_DISCOUNT", discountBps: 2_000 },
    subscriptionFigure: OWN20_SUB,
    premiumStudents: false,
    premiumTeachers: false,
    premium: { mode: "OURS" },
    premiumFigure: OURS_PREMIUM,
    premiumBilled: false,
    premiumNotBilled: null,
    premiumWaitsFor: [],
    note: null,
    status: "TRIAL",
    startsOn: "2026-11-21",
    renewsOn: "2027-05-21",
    paidOn: null,
    state: "FREE",
    stateDay: "2027-05-21",
    noTierChosen: false,
    pupils: 412,
    bill: { pupils: 412, lines: [{ part: "SUBSCRIPTION", perStudentPaise: 8_000, totalPaise: 3_296_000 }], totalPaise: 3_296_000 },
    ...over,
  };
}
const ON_BILLED: Partial<SchoolTerms> = {
  premiumStudents: true,
  premiumBilled: true,
  bill: { pupils: 412, lines: [{ part: "SUBSCRIPTION", perStudentPaise: 8_000, totalPaise: 3_296_000 }, { part: "PREMIUM", perStudentPaise: 5_000, totalPaise: 2_060_000 }], totalPaise: 5_356_000 },
};

describe("the Schools tab's cells (§2.1)", () => {
  it("a part's price and how, short: ours, an own discount, an own price, a tier, free by agreement", () => {
    expect(partCell(f, OURS_SUB)).toBe("₹100 · ours");
    expect(partCell(f, OWN20_SUB)).toBe("₹80 · own 20 % off ₹100");
    expect(partCell(f, OWN_PRICE)).toBe("₹120 · own price");
    expect(partCell(f, TIER)).toBe("₹199 · tier (Affiliated college)");
    expect(partCell(f, FREE)).toBe("Free by agreement");
  });

  it("the premium column: off, its price if on; on and billed, its price; on and not billed, why, the terms first (C2, C3, C3a)", () => {
    expect(premiumCell(f, view())).toBe("₹50 if on");
    expect(premiumCell(f, view(ON_BILLED))).toBe("₹50 · ours");
    expect(premiumCell(f, view({ premiumStudents: true, premiumNotBilled: "TERMS_NOT_SET", premiumWaitsFor: ["STUDENT"] }))).toBe("Premium on, not billed: terms not set");
    expect(premiumCell(f, view({ premiumStudents: true, premiumNotBilled: "PLAN_NOT_ASKED", premiumWaitsFor: ["STUDENT"] }))).toBe("Premium on, not billed: the Student plan is not asked for");
    expect(premiumCell(f, view({ premiumStudents: true, premiumTeachers: true, premiumNotBilled: "PLAN_NOT_ASKED", premiumWaitsFor: ["STUDENT", "TEACHER"] }))).toBe(
      "Premium on, not billed: the Student and Teacher plans are not asked for",
    );
  });
});

describe("a school's terms in sentences (§2.4)", () => {
  it("the whole school: its subscription and how, its premium, its year, and that figures are before GST", () => {
    expect(schoolTermsSentence(f, view({ ...ON_BILLED, subscriptionFigure: OWN_PRICE, subscription: { mode: "OWN_PRICE", pricePaise: 12_000 } }))).toBe(
      "ZZ Banyan School pays ₹120 a student a year for its Shalaghar subscription (its own price, fixed). Premium add-on for students: ₹50 more a student a year (ours; it moves with ours). Free until 21 May 2027, then it renews every year from that day. Figures are before GST.",
    );
  });

  it("free by agreement, no tier, premium off, premium on and not billed while the plan is not asked for", () => {
    expect(schoolTermsSentence(f, view({ subscriptionFigure: FREE }))).toContain("ZZ Banyan School's Shalaghar subscription is free by agreement.");
    expect(schoolTermsSentence(f, view({ subscriptionFigure: null, kind: "COLLEGE", noTierChosen: true }))).toContain("ZZ Banyan School has no tier chosen, so it has no Shalaghar price yet.");
    // C4a point 9 (i): the price being set always shows in a preview, and when it will be billed where it will not be yet.
    expect(schoolTermsSentence(f, view())).toContain("Premium add-on: off; if switched on, ₹50 more a student a year (ours; it moves with ours).");
    expect(schoolTermsSentence(f, view({ premiumStudents: true, premiumNotBilled: "PLAN_NOT_ASKED", premiumWaitsFor: ["STUDENT"] }))).toContain(
      "Premium add-on for students: ₹50 more a student a year (ours; it moves with ours), billed once the Student plan is asked for.",
    );
    expect(schoolTermsSentence(f, view({ premiumStudents: true, premiumTeachers: true, premiumNotBilled: "PLAN_NOT_ASKED", premiumWaitsFor: ["STUDENT", "TEACHER"] }))).toContain(
      "billed once the Student or the Teacher plan is asked for.",
    );
    expect(schoolTermsSentence(f, view({ termsSet: false, premiumStudents: true, premiumNotBilled: "TERMS_NOT_SET", premiumWaitsFor: ["STUDENT"] }))).toContain("billed once terms are set.");
  });

  it("terms not set: what it pays from before, no figure of ours and no GST line (rule 19)", () => {
    const notSet = view({ termsSet: false, termsSetAt: null });
    expect(schoolTermsSentence(f, notSet, 300_000)).toBe("ZZ Banyan School's terms are not set: it pays what was agreed before, ₹3,000 a month. Free until 21 May 2027, then it renews every year from that day.");
    expect(schoolTermsSentence(f, notSet)).toContain("is told of no price of ours");
    expect(schoolTermsSentence(f, notSet)).not.toContain("GST");
  });

  it("the year: free, paid, renewal passed, invoiced, no record, suspended from before", () => {
    expect(datesSentence(f, { state: "PAID", stateDay: "2027-05-21", renewsOn: "2027-05-21" })).toBe("Paid to 21 May 2027, when it renews.");
    expect(datesSentence(f, { state: "DUE_SINCE", stateDay: "2026-11-01", renewsOn: "2026-11-01" })).toBe("Its renewal on 1 Nov 2026 has passed with no payment recorded.");
    // C1c: Due with its day still ahead is owed from it, true of an early invoice and of a start still ahead alike.
    expect(datesSentence(f, { state: "INVOICED_UNPAID", stateDay: "2027-05-21", renewsOn: "2027-05-21" })).toBe("Owed from 21 May 2027.");
    expect(stateLabel(f, { state: "INVOICED_UNPAID", stateDay: "2027-05-21" })).toBe("Owed from 21 May 2027");
    expect(datesSentence(f, { state: "NO_RECORD", stateDay: null, renewsOn: null })).toBe("No renewal is on record.");
    // Until phase 13 a suspended school reads plain "Suspended" (the coordinator): "from before" is true only once a pause exists.
    expect(datesSentence(f, { state: "SUSPENDED_OPEN", stateDay: null, renewsOn: null })).toBe("Suspended.");
  });
});

describe("the switch's toast (§2.1)", () => {
  it("the brief's own sentence: when it is billed, the price, the amount at last count, the subscription beside it", () => {
    expect(switchSentence(f, { role: "students", on: true, before: view(), after: view(ON_BILLED), told: 0 })).toBe(
      "ZZ Banyan School gets premium for students now. It is billed from its renewal on 21 May 2027: ₹50 more a student a year + GST (about ₹20,600 at last count), on top of its ₹80 subscription.",
    );
  });

  it("not billed: the terms not set, or the plan not asked for (C3); free by agreement; who is told, at one and at more", () => {
    expect(switchSentence(f, { role: "students", on: true, before: view(), after: view({ premiumStudents: true, premiumNotBilled: "TERMS_NOT_SET", premiumWaitsFor: ["STUDENT"] }), told: 2 })).toBe(
      "ZZ Banyan School gets premium for students now. It is not billed: terms not set. 2 people at the school are told.",
    );
    expect(switchSentence(f, { role: "teachers", on: true, before: view(), after: view({ premiumTeachers: true, premiumNotBilled: "PLAN_NOT_ASKED", premiumWaitsFor: ["TEACHER"] }), told: 1 })).toBe(
      "ZZ Banyan School gets premium for teachers now. It is not billed: the Teacher plan is not asked for. 1 person at the school is told.",
    );
    expect(switchSentence(f, { role: "students", on: true, before: view(), after: view({ ...ON_BILLED, premiumFigure: { ...FREE } }), told: 0 })).toBe("ZZ Banyan School gets premium for students now. It is free by agreement.");
  });

  it("premium already billed through the other role: one figure, so the bill does not move (C3); no tier: its price beside the reason (C2b); off with the other role still on, named", () => {
    const teachersBilled = view({ premiumTeachers: true, premiumBilled: true });
    expect(switchSentence(f, { role: "students", on: true, before: teachersBilled, after: view({ ...ON_BILLED, premiumTeachers: true }), told: 0 })).toBe(
      "ZZ Banyan School gets premium for students now. Premium is already on its bill: one figure, whichever of its students and teachers have it.",
    );
    expect(switchSentence(f, { role: "students", on: true, before: view(), after: view({ ...ON_BILLED, subscriptionFigure: null, bill: null }), told: 0 })).toBe(
      "ZZ Banyan School gets premium for students now. It is billed once the college's tier is chosen: ₹50 more a student a year + GST.",
    );
    expect(switchSentence(f, { role: "students", on: false, before: view({ ...ON_BILLED, premiumTeachers: true }), after: teachersBilled, told: 0 })).toBe(
      "ZZ Banyan School no longer has premium for students. Premium stays on its bill for its teachers.",
    );
  });

  it("a note alone, previewed, will be saved; saved, is", () => {
    expect(termsChangeSentence(f, { after: view(), changed: true, noteOnly: true, told: 0, preview: true })).toBe("Your note will be saved. Only you see it.");
    expect(termsChangeSentence(f, { after: view(), changed: true, noteOnly: true, told: 0, preview: false })).toBe("Your note is saved. Only you see it.");
  });

  it("no count yet: the price without an amount; off: the bill loses premium's price", () => {
    expect(switchSentence(f, { role: "students", on: true, before: view(), after: view({ ...ON_BILLED, pupils: null, bill: null }), told: 0 })).toContain("on top of its ₹80 subscription; there is no count of students yet.");
    expect(switchSentence(f, { role: "students", on: false, before: view(ON_BILLED), after: view(), told: 0 })).toBe(
      "ZZ Banyan School no longer has premium for students. Its bill no longer carries premium's ₹50 a student a year.",
    );
  });
});

/** Our offer before a change, as readOffer gives it: ₹100 and ₹50, no discounts. */
const OFFER_BEFORE = { subscriptionPricePaise: 10_000, subscriptionDiscountBps: 0, premiumPricePaise: 5_000, premiumDiscountBps: 0 };

describe("our offer's change (rule 9)", () => {
  it("followers and own discounts move by name; own prices and terms not set do not; the year's difference; who is told; nothing charged", () => {
    const change: OfferChange = {
      preview: true,
      offer: { subscription: { pricePaise: 12_000, discountBps: 0 }, premium: { pricePaise: 5_000, discountBps: 0 }, freeMonths: 6, studentsByDefault: true, teachersByDefault: false, updatedAt: null, starting: false },
      moves: [
        ...Array.from({ length: 27 }, (_, i) => ({ schoolId: `f${i}`, name: `F${i}`, part: "SUBSCRIPTION" as const, beforePaise: 10_000, afterPaise: 12_000, source: "OURS" as const })),
        { schoolId: "b", name: "ZZ Banyan", part: "SUBSCRIPTION", beforePaise: 8_000, afterPaise: 9_600, source: "OWN_DISCOUNT" },
        { schoolId: "c", name: "ZZ Cedar", part: "SUBSCRIPTION", beforePaise: 9_000, afterPaise: 10_800, source: "OWN_DISCOUNT" },
      ],
      unchanged: { ownPrice: 1, notSet: 3 },
      premiumNotBilled: 0,
      yearDeltaPaise: 21_000_000,
      told: 29,
    };
    expect(offerChangeSentence(f, change, { ...OFFER_BEFORE, freeMonths: 6, studentsByDefault: true, teachersByDefault: false })).toBe(
      "Shalaghar subscription, our price: ₹100 → ₹120 a student a year. Shalaghar subscription: 27 schools that follow it will pay ₹120 (was ₹100). Shalaghar subscription: 2 schools with their own discount move too: ZZ Banyan ₹96 (was ₹80), ZZ Cedar ₹108 (was ₹90). Not moving: on their own price, 1; with no terms set, 3. About ₹2,10,000 a year more at last count. 29 people at these schools will be told. Nothing is charged.",
    );
  });

  it("at one; no move at all; the free months and the onboarding ticks", () => {
    const one: OfferChange = {
      preview: true,
      offer: { subscription: { pricePaise: 10_000, discountBps: 0 }, premium: { pricePaise: 5_000, discountBps: 0 }, freeMonths: 3, studentsByDefault: false, teachersByDefault: false, updatedAt: null, starting: false },
      moves: [],
      unchanged: { ownPrice: 0, notSet: 0 },
      premiumNotBilled: 0,
      yearDeltaPaise: 0,
      told: 0,
    };
    expect(offerChangeSentence(f, one, { ...OFFER_BEFORE, freeMonths: 6, studentsByDefault: true, teachersByDefault: false })).toBe(
      "No school's figure moves. Free months for a new school: 3 (was 6). Onboarding starts with premium unticked. Nothing is charged.",
    );
    const single: OfferChange = { ...one, offer: { ...one.offer, premium: { pricePaise: 6_000, discountBps: 0 }, freeMonths: 6, studentsByDefault: true }, moves: [{ schoolId: "f", name: "F", part: "PREMIUM", beforePaise: 5_000, afterPaise: 6_000, source: "OURS" }], yearDeltaPaise: -100, told: 1 };
    expect(offerChangeSentence(f, single, { ...OFFER_BEFORE, freeMonths: 6, studentsByDefault: true, teachersByDefault: false })).toBe(
      "Premium add-on, our price: ₹50 → ₹60 more a student a year. Premium add-on: 1 school that follows it will pay ₹60 more a student a year (was ₹50). About ₹1 a year less at last count. 1 person at these schools will be told. Nothing is charged.",
    );
  });
});

describe("record payment's preview (§2.3; C2)", () => {
  const answer: PaymentAnswer = { preview: true, renewalBefore: "2027-05-21", renewalAfter: "2028-05-21", statusAfter: "ACTIVE", billPaise: 5_356_000, differencePaise: 0 };
  it("where the twelve months run from: the renewal on record, or today, or the day paid, when none is on record", () => {
    expect(paymentSentence(f, { answer, view: view(ON_BILLED), paidOn: "2026-11-21", today: "2026-11-21", amountPaise: 5_356_000 })).toBe(
      "Renewal moves from 21 May 2027 to 21 May 2028: the twelve months run from the renewal on record. Status becomes Paid.",
    );
    const none = { ...answer, renewalBefore: null, renewalAfter: "2027-11-21" };
    expect(paymentSentence(f, { answer: none, view: view(ON_BILLED), paidOn: "2026-11-21", today: "2026-11-21", amountPaise: 5_356_000 })).toContain("the twelve months run from today, since no renewal is on record.");
    expect(paymentSentence(f, { answer: { ...none, renewalAfter: "2027-11-01" }, view: view(ON_BILLED), paidOn: "2026-11-01", today: "2026-11-21", amountPaise: 5_356_000 })).toContain(
      "the twelve months run from the day it was paid, 1 Nov 2026, since no renewal is on record.",
    );
  });

  it("a renewal on record with no status on record: the year runs from the day paid, as the library reckons it (rule 5)", () => {
    const none = { ...answer, renewalBefore: "2027-05-21", renewalAfter: "2027-11-21" };
    expect(paymentSentence(f, { answer: none, view: view({ status: null }), paidOn: "2026-11-21", today: "2026-11-21", amountPaise: 5_356_000 })).toContain("the twelve months run from today, since no renewal is on record.");
  });

  it("an amount unlike the bill is named by line, more or less; no bill is said so", () => {
    expect(paymentSentence(f, { answer: { ...answer, differencePaise: -1_000_000 }, view: view(ON_BILLED), paidOn: "2026-11-21", today: "2026-11-21", amountPaise: 4_356_000 })).toBe(
      "Renewal moves from 21 May 2027 to 21 May 2028: the twelve months run from the renewal on record. Status becomes Paid. The bill at today's prices, last count, before GST: Shalaghar subscription ₹32,960 and premium add-on ₹20,600 for 412 students, ₹53,560 in all. The amount is ₹10,000 less than the bill before GST.",
    );
    expect(paymentSentence(f, { answer: { ...answer, billPaise: null, differencePaise: null }, view: view(), paidOn: "2026-11-21", today: "2026-11-21", amountPaise: 1 })).toContain("There is no bill to compare it with");
  });
});

describe("a bulk change (§2.1)", () => {
  it("Put on our prices: each school's terms before; those already so; who is told", () => {
    const before = new Map([
      ["b", { subscription: OWN20_SUB, premium: OURS_PREMIUM, termsSet: true }],
      ["k", { subscription: OURS_SUB, premium: OURS_PREMIUM, termsSet: false }],
    ]);
    expect(bulkSentence(f, { action: "OUR_PRICES", answer: { preview: true, changed: [{ schoolId: "b", name: "ZZ Banyan" }, { schoolId: "k", name: "ZZ Kestrel" }], unchanged: 1, told: 4 }, before })).toBe(
      "2 schools will follow our prices for both parts, their terms set: ZZ Banyan, from ₹80 · own 20 % off ₹100 and premium ₹50 · ours; ZZ Kestrel, whose terms are not set. 1 school is already so and is left as it is. 4 people at these schools will be told.",
    );
  });

  it("teachers' premium where it does not apply is left, said so; Put on our prices names each partner's month it touches (C4a point 9 (iii))", () => {
    expect(bulkSentence(f, { action: "TEACHERS_ON", answer: { preview: true, changed: [], unchanged: 2, told: 0 }, before: new Map() })).toContain(
      "2 schools are left as they are: they have premium for teachers already, or they are colleges, whose teachers hold no plan.",
    );
    const partners = [{ school: "ZZ Kestrel", partner: "ZZ Partner", today: { monthPaise: 300_000, earns: true, renewalReached: false, unpriced: false, freeByAgreement: false }, once: { monthPaise: null, earns: false, renewalReached: false, unpriced: false, freeByAgreement: false } }];
    expect(bulkSentence(f, { action: "OUR_PRICES", answer: { preview: true, changed: [{ schoolId: "k", name: "ZZ Kestrel" }], unchanged: 0, told: 0 }, before: new Map(), partners })).toContain(
      "At ZZ Kestrel: ZZ Partner's share is reckoned today on ₹3,000 a month from this school. Once these terms are set: on nothing until the school is paid up to date.",
    );
  });

  it("a switch over several schools, done; nothing to change", () => {
    expect(bulkSentence(f, { action: "STUDENTS_ON", answer: { preview: false, changed: [{ schoolId: "b", name: "ZZ Banyan" }], unchanged: 0, told: 0 }, before: new Map() })).toBe("1 school has premium for students now: ZZ Banyan.");
    expect(bulkSentence(f, { action: "TEACHERS_OFF", answer: { preview: true, changed: [], unchanged: 3, told: 0 }, before: new Map() })).toBe(
      "No school changes: every one chosen is already so. 3 schools are already so and are left as they are.",
    );
  });
});

describe("the partner's month in the terms sheet (C2b)", () => {
  const reading = (over: Partial<{ monthPaise: number | null; earns: boolean; renewalReached: boolean; unpriced: boolean; freeByAgreement: boolean }>) => ({
    monthPaise: null,
    earns: false,
    renewalReached: false,
    unpriced: false,
    freeByAgreement: false,
    ...over,
  });
  it("what the partner is reckoned on today and once these terms are set, nothing until paid up to date where so", () => {
    expect(partnerSentence(f, { partner: "ZZ Partner", today: reading({ monthPaise: 300_000, earns: true }), once: reading({ monthPaise: 274_667 }) })).toBe(
      "ZZ Partner's share is reckoned today on ₹3,000 a month from this school. Once these terms are set: on nothing until the school is paid up to date.",
    );
    expect(partnerSentence(f, { partner: "ZZ Partner", today: reading({ unpriced: true }), once: reading({ monthPaise: 274_667, earns: true }) })).toBe(
      "ZZ Partner's share is reckoned today on nothing from this school. Once these terms are set: on ₹2,746.67 a month.",
    );
  });
});

describe("Hindi and Marathi", () => {
  it("every subs key is in all three languages, Hindi ending with the danda where English ends a sentence, Marathi with a full stop, and Marathi saying शाळा", () => {
    const keys = Object.keys((en as unknown as { subs: Record<string, string> }).subs);
    expect(keys.length).toBeGreaterThan(50);
    const h = (hi as unknown as { subs: Record<string, string> }).subs;
    const m = (mr as unknown as { subs: Record<string, string> }).subs;
    for (const key of keys) {
      expect(h[key], `hi ${key}`).toBeTruthy();
      expect(m[key], `mr ${key}`).toBeTruthy();
      const english = (en as unknown as { subs: Record<string, string> }).subs[key]!;
      if (english.endsWith(".")) {
        expect(h[key]!.endsWith("।"), `hi ${key}`).toBe(true);
        expect(m[key]!.endsWith("."), `mr ${key}`).toBe(true);
      }
      expect(m[key]!.includes("स्कूल"), `mr ${key}`).toBe(false);
    }
  });

  it("a sentence worded in Hindi and Marathi leaves no key and no placeholder unfilled", () => {
    for (const locale of ["hi", "mr"] as const) {
      const g = fmtFor(locale);
      const all = [
        schoolTermsSentence(g, view(ON_BILLED)),
        switchSentence(g, { role: "students", on: true, before: view(), after: view(ON_BILLED), told: 3 }),
        premiumCell(g, view({ premiumStudents: true, premiumNotBilled: "TERMS_NOT_SET", premiumWaitsFor: ["STUDENT"] })),
        paymentSentence(g, { answer: { preview: true, renewalBefore: "2027-05-21", renewalAfter: "2028-05-21", statusAfter: "ACTIVE", billPaise: 5_356_000, differencePaise: 100 }, view: view(ON_BILLED), paidOn: "2026-11-21", today: "2026-11-21", amountPaise: 1 }),
      ];
      for (const s of all) {
        expect(s, `${locale}: ${s}`).not.toMatch(/subs\.|\{[a-z]+\}/i);
      }
    }
  });
});

describe("the review of phase 5 and C5 (22 November 2026)", () => {
  const BASE: OfferChange = {
    preview: true,
    offer: { subscription: { pricePaise: 10_000, discountBps: 0 }, premium: { pricePaise: 6_000, discountBps: 0 }, freeMonths: 6, studentsByDefault: true, teachersByDefault: false, updatedAt: null, starting: false },
    moves: [],
    unchanged: { ownPrice: 0, notSet: 0 },
    premiumNotBilled: 0,
    yearDeltaPaise: 0,
    told: 0,
  };
  const BEFORE = { subscriptionPricePaise: 10_000, subscriptionDiscountBps: 0, premiumPricePaise: 5_000, premiumDiscountBps: 0, freeMonths: 6, studentsByDefault: true, teachersByDefault: false };

  it("A1: our premium price moved where no premium is billed says how many schools' price moves, not that no figure moves", () => {
    const sentence = offerChangeSentence(f, { ...BASE, premiumNotBilled: 29 }, BEFORE);
    expect(sentence).toContain("Premium add-on: the price moves with ours at 29 schools where it is not billed yet.");
    expect(sentence).not.toContain("No school's figure moves.");
  });

  it("C5 point 9 (B1): a box ticked while its plan is not asked for starts ticked once it is, unticked until then", () => {
    const ticked = { ...BASE, offer: { ...BASE.offer, premium: { pricePaise: 5_000, discountBps: 0 }, studentsByDefault: true, teachersByDefault: true } };
    const before = { ...BEFORE, studentsByDefault: false, teachersByDefault: false };
    expect(offerChangeSentence(f, ticked, before)).toContain("Onboarding will start with premium ticked for students once the Student plan is asked for; until then it starts unticked.");
    expect(offerChangeSentence(f, ticked, before, new Set(["STUDENT"]))).toContain("Onboarding starts with premium ticked for students.");
    expect(offerChangeSentence(f, ticked, before, new Set(["STUDENT"]))).toContain("once the Teacher plan is asked for");
  });

  it("A4: a running status with no renewal on record names none, with no hole", () => {
    expect(datesSentence(f, { state: "FREE", stateDay: null, renewsOn: null })).toBe("Free, with no renewal on record.");
    expect(datesSentence(f, { state: "PAID", stateDay: null, renewsOn: null })).toBe("Paid, with no renewal on record.");
    expect(datesSentence(f, { state: "INVOICED_UNPAID", stateDay: null, renewsOn: null })).toBe("Owed, with no renewal on record.");
    expect(stateLabel(f, { state: "INVOICED_UNPAID", stateDay: null })).toBe("Owed");
  });

  it("A6: a payment whose moved renewal has still passed does not say Paid alone", () => {
    const passed: PaymentAnswer = { preview: true, renewalBefore: "2024-05-21", renewalAfter: "2025-05-21", statusAfter: "ACTIVE", billPaise: null, differencePaise: null };
    expect(paymentSentence(f, { answer: passed, view: view(), paidOn: "2026-11-21", today: "2026-11-21", amountPaise: 1 })).toContain("has passed already, so it reads Renewal passed.");
  });

  it("A8, B10: the switch on at a school whose subscription is free by agreement says so, never its ₹0 subscription", () => {
    const sentence = switchSentence(f, { role: "students", on: true, before: view(), after: view({ ...ON_BILLED, subscriptionFigure: FREE }), told: 0 });
    expect(sentence).toContain("its Shalaghar subscription is free by agreement.");
    expect(sentence).not.toContain("₹0");
  });

  it("A10: the off sheet's preview and its told are the future; the switch on's toast is its act", () => {
    expect(switchSentence(f, { role: "students", on: false, before: view(ON_BILLED), after: view(), told: 2, preview: true })).toBe(
      "ZZ Banyan School will no longer have premium for students. Its bill will no longer carry premium's ₹50 a student a year. 2 people at the school will be told.",
    );
    expect(termsChangeSentence(f, { after: view(), changed: true, noteOnly: false, told: 1, preview: true })).toContain("1 person at the school will be told.");
  });

  it("B7: premium for teachers over colleges alone says one thing", () => {
    const sentence = bulkSentence(f, { action: "TEACHERS_ON", answer: { preview: true, changed: [], unchanged: 2, told: 0 }, before: new Map() });
    expect(sentence).not.toContain("No school changes");
    expect(sentence).toContain("they are colleges, whose teachers hold no plan.");
  });

  it("A9, C5 point 5: not counted names a count with no renewal as that, and the test schools", () => {
    const line = notCountedLine(f, { notCounted: { notSet: 0, noTier: 0, noCount: 0, notRunning: 0, noRenewal: 1, test: 2 } });
    expect(line).toBe("Not counted: no renewal on record, 1; test schools, 2.");
  });

  it("C5 point 6: two lines at most, the plans' line true while features are off; the card's features line only with premium on", () => {
    const both = premiumInfoLines(f, { notAsked: ["STUDENT", "TEACHER"], offForAll: ["Question bank practice", "Vidura (assistant)"] });
    expect(both).toEqual([
      "The Student and Teacher plans are not asked for, so premium makes no difference yet: their features are open to everyone wherever they are switched on.",
      "Switched off for everyone, so premium does not open them: Question bank practice, Vidura (assistant).",
    ]);
    expect(premiumInfoLines(f, { notAsked: ["STUDENT", "TEACHER"], offForAll: ["Vidura (assistant)"], college: true, premiumOn: false })).toEqual([
      "The Student plan is not asked for, so premium for students makes no difference yet: its features are open to every student wherever they are switched on.",
    ]);
    expect(premiumInfoLines(f, { notAsked: [], offForAll: [] })).toEqual([]);
  });
});

