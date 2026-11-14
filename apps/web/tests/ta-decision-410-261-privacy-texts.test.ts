/**
 * The owner's decisions on TA-410 and TA-261 of the testing analysis of 13 November 2026 (both taken 14 November
 * 2026), in the part that is words: one rewrite of every public privacy text, in English, Hindi and Marathi.
 *
 * Before, the privacy page, the account-closing page, the home page, the school's sign-up note, the three store
 * listings, the store forms' answers and decision 0002 said that the company's team sees nothing inside a school
 * without a reason, that the app holds no location and asks one permission, that texts carry only reset codes and
 * that nobody outside the school sees a pupil's data, and promised "no tracking"; the product does otherwise.
 *
 * Nothing here touches the database. It reads the dictionaries, the pages' source, the store folder and the
 * decision records, so that a later edit cannot put a false promise back without a test failing. Counsel still
 * reads the text before a school sees it: these cases hold what the text must and must not say, not its law.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { RETENTION_DEFAULTS } from "@/lib/env";
import { en } from "@/lib/i18n/en";
import { hi } from "@/lib/i18n/hi";
import { mr } from "@/lib/i18n/mr";

const ROOT = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");
const all = (section: Record<string, string>) => Object.values(section).join("\n");

const PRIVACY = { en: all(en.privacy), hi: all(hi.privacy), mr: all(mr.privacy) };
const DELETION = { en: all(en.deletion), hi: all(hi.deletion), mr: all(mr.deletion) };
const LISTING = { en: read("apps/mobile/store/listing.en.md"), hi: read("apps/mobile/store/listing.hi.md"), mr: read("apps/mobile/store/listing.mr.md") };
const ANSWERS = read("apps/mobile/store/privacy-answers.md");
const POLICY = read("docs/decisions/0002-minors-data-policy.md");

/** The row of a store form's table whose first cell starts with `label`. */
function row(label: string): string {
  const line = ANSWERS.split("\n").find((l) => l.startsWith(`| ${label}`));
  expect(line, `no row "${label}" in privacy-answers.md`).toBeTruthy();
  return line!;
}
/** The second cell of that row: the form's Collected? answer. */
const collected = (label: string) => row(label).split("|")[2]!.trim();

describe("TA-410: the published words about the company's team", () => {
  it("TA-410: the privacy page says the team can open any school at any time and that every visit is recorded and shown", () => {
    expect(en.privacy.s1b).toMatch(/can open any school at any time/);
    expect(en.privacy.s1b).toMatch(/every visit is recorded/i);
    expect(en.privacy.s1b).toMatch(/Safety Centre/);
    // The list of a school's people by name, and search, are said in so many words.
    expect(en.privacy.s1b).toMatch(/by name/);
    expect(en.privacy.s1b).toMatch(/search/);
    expect(hi.privacy.s1b).toMatch(/किसी भी समय/);
    expect(mr.privacy.s1b).toMatch(/कोणत्याही वेळी/);
  });

  it("TA-410: no public text still says the team sees nothing inside, or looks only with a reason and for a limited time", () => {
    expect(PRIVACY.en).not.toMatch(/nothing inside a school|time-limited|recorded with a reason/);
    expect(PRIVACY.hi).not.toMatch(/स्कूल के भीतर कुछ भी नहीं|समय-सीमित|कारण के साथ दर्ज/);
    expect(PRIVACY.mr).not.toMatch(/शाळेच्या आत काहीही नाही|वेळमर्यादित|कारणासह नोंदवली/);
    expect(DELETION.en).not.toMatch(/cannot read a school's records/);
    expect(DELETION.hi).not.toMatch(/रिकॉर्ड नहीं पढ़ सकता/);
    expect(DELETION.mr).not.toMatch(/नोंदी वाचू शकत नाही/);
    expect(en.privacy.s3d).not.toMatch(/^Nobody outside the school sees a pupil's data\./);
  });

  it("TA-410: the school's sign-up note tells the school the same thing before it signs up", () => {
    expect(en.register.dataNote).toMatch(/at any time/);
    expect(en.register.dataNote).toMatch(/Safety Centre/);
    expect(hi.register.dataNote).toMatch(/किसी भी समय/);
    expect(mr.register.dataNote).toMatch(/कोणत्याही वेळी/);
  });

  it("TA-410: decision 0002 no longer calls a look inside a time-boxed, reasoned grant, and a decision record states that access is always on", () => {
    expect(POLICY).not.toMatch(/a look inside a school is a time-boxed, reasoned `OperatorAccess` row/);
    expect(POLICY).toMatch(/0009-operator-access-always-on\.md/);
    const name = readdirSync(resolve(ROOT, "docs/decisions")).find((f) => f.startsWith("0009-"));
    expect(name).toBe("0009-operator-access-always-on.md");
    const record = read(`docs/decisions/${name}`);
    expect(record).toMatch(/always on/i);
    expect(record).toMatch(/by name/);
    expect(record).toMatch(/search/);
    expect(record).toMatch(/14 November 2026/);
    expect(record).toMatch(/Yes, say so/);
    expect(record).toMatch(/counsel/i);
  });
});

describe("TA-261: the privacy page says what is kept, where it goes and for how long", () => {
  it("TA-261: the page's date is the day of the rewrite, in the three languages", () => {
    expect(en.privacy.updated).toMatch(/14 November 2026/);
    expect(hi.privacy.updated).toMatch(/14 नवंबर 2026/);
    expect(mr.privacy.updated).toMatch(/14 नोव्हेंबर 2026/);
  });

  it("TA-261: the three sentences that said the opposite are gone", () => {
    expect(PRIVACY.en).not.toMatch(/No location, no contacts/);
    expect(PRIVACY.en).not.toMatch(/asks for one permission/);
    expect(PRIVACY.en).not.toMatch(/It does not ask for the camera/);
    expect(en.privacy.s5b).not.toMatch(/^Text messages, through Twilio, for a reset code sent to a mobile number\.$/);
    expect(PRIVACY.hi).not.toMatch(/न स्थान, न संपर्क|केवल एक अनुमति माँगता है/);
    expect(PRIVACY.mr).not.toMatch(/स्थान नाही, संपर्क नाहीत|एकच परवानगी मागते/);
  });

  it("TA-261: the bare promise of no tracking is gone from every public text, in the three languages", () => {
    const english = [PRIVACY.en, DELETION.en, en.landing.dataMinors, en.register.dataNote, en.safety.operatorBody, LISTING.en];
    for (const text of english) expect(text).not.toMatch(/no tracking/i);
    for (const text of [PRIVACY.hi, hi.landing.dataMinors, hi.register.dataNote, LISTING.hi]) expect(text).not.toMatch(/ट्रैकिंग नहीं|न ट्रैकिंग/);
    for (const text of [PRIVACY.mr, mr.landing.dataMinors, mr.register.dataNote, LISTING.mr]) expect(text).not.toMatch(/ट्रॅकिंग नाही|मागोवा नाही/);
  });

  it("TA-261: the bus's position, each pupil's boarding times and their keeping periods are stated as the code's defaults", () => {
    expect(RETENTION_DEFAULTS.tripPositionDays).toBe(30);
    expect(RETENTION_DEFAULTS.tripBoardingDays).toBe(365);
    expect(RETENTION_DEFAULTS.textMessageDays).toBe(365);
    expect(PRIVACY.en).toMatch(/driver's phone/);
    expect(PRIVACY.en).toMatch(/30 days/);
    expect(PRIVACY.en).toMatch(/boarded|boarding/);
    expect(PRIVACY.en).toMatch(/one year/);
    // Defaults the operator may change, said as such.
    expect(en.privacy.s7defaults).toMatch(/may change/);
    expect(PRIVACY.hi).toMatch(/30 दिन/);
    expect(PRIVACY.mr).toMatch(/30 दिवस/);
  });

  it("TA-261: the camera, files, texts and WhatsApp, Meta, map pictures, the payment gateway and the people a consent opens the record to are named", () => {
    for (const word of [/camera/, /Twilio/, /WhatsApp/, /absence/, /fee/, /circular/, /incident/, /Meta/, /OpenStreetMap/, /Razorpay/, /recruiter/, /expert/, /competition/, /religion/, /caste/, /income/, /disability/, /health/i]) {
      expect(PRIVACY.en, String(word)).toMatch(word);
    }
    for (const text of [PRIVACY.hi, PRIVACY.mr]) {
      for (const name of ["Twilio", "WhatsApp", "Meta", "OpenStreetMap", "Razorpay"]) expect(text, name).toContain(name);
    }
  });

  it("TA-261: the assistant is off unless a school turns it on and runs on the company's own machine; no outside AI company is named for it", () => {
    expect(en.privacy.s5assistant).toMatch(/off unless/);
    expect(en.privacy.s5assistant).toMatch(/own machine/);
    expect(en.privacy.s5assistant).not.toMatch(/Anthropic|OpenAI|Google|Microsoft|Gemini|Claude/);
    expect(hi.privacy.s5assistant).not.toMatch(/Anthropic|OpenAI|Google|Microsoft/);
    expect(mr.privacy.s5assistant).not.toMatch(/Anthropic|OpenAI|Google|Microsoft/);
  });

  it("TA-261: the page draws every sentence of the privacy section, and the account-closing page every sentence of its own", () => {
    const privacyPage = read("apps/web/src/app/privacy/page.tsx");
    for (const key of Object.keys(en.privacy)) {
      if (key === "metaTitle") continue;
      expect(privacyPage.includes(`privacy.${key}`) || privacyPage.includes(`"${key}"`), `privacy.${key} is not drawn`).toBe(true);
    }
    const closingPage = read("apps/web/src/app/delete-account/page.tsx");
    for (const key of Object.keys(en.deletion)) {
      if (key === "metaTitle") continue;
      expect(closingPage.includes(`deletion.${key}`) || closingPage.includes(`"${key}"`), `deletion.${key} is not drawn`).toBe(true);
    }
  });

  it("TA-261: the account-closing page says which of a leaver's texts and bus times go, and when", () => {
    expect(DELETION.en).toMatch(/text/i);
    expect(DELETION.en).toMatch(/one year/);
  });
});

describe("TA-261: the store listings, the store forms' answers and decision 0002", () => {
  it("TA-261: the three listings say what the bus trip and the camera are for, and that the team's visits are shown to the school", () => {
    expect(LISTING.en).toMatch(/driver/);
    expect(LISTING.en).toMatch(/camera/);
    expect(LISTING.en).toMatch(/at any time/);
    expect(LISTING.hi).toMatch(/ड्राइवर|चालक/);
    expect(LISTING.mr).toMatch(/चालक/);
  });

  it("TA-261: the store answers say Yes for location, health, files and the sensitive fields the phone sends", () => {
    expect(collected("Location — Precise")).toMatch(/^Yes/);
    expect(collected("Health & Fitness — Health")).toMatch(/^Yes/);
    expect(collected("Sensitive Info")).toMatch(/^Yes/);
    expect(collected("Location — Approximate, Precise")).toMatch(/^Yes/);
    expect(collected("Health and fitness")).toMatch(/^Yes/);
    expect(collected("Files and docs")).toMatch(/^Yes/);
    expect(collected("Personal info — Race and ethnicity")).toMatch(/^Yes/);
    expect(ANSWERS).not.toMatch(/Never requested/);
    expect(ANSWERS).not.toMatch(/No location anywhere/);
    expect(ANSWERS).not.toMatch(/Hand-ins are text \(row 8\)/);
  });

  it("TA-261: decision 0002 is corrected first: location, the ticked permissions line and rows for what was added", () => {
    expect(POLICY).not.toMatch(/\*\*No location\*\*/);
    expect(POLICY).not.toMatch(/match shipped features: notifications only/);
    expect(POLICY).toMatch(/Amendment of 14 November 2026 — what the public texts say/);
    for (const word of [/`TripPosition`/, /`TripBoarding`/, /WhatsApp/, /Meta/, /OpenStreetMap/, /Razorpay/, /recruiter/i, /expo-location/]) expect(POLICY, String(word)).toMatch(word);
    // The assistant's endpoint is the company's own machine; the policy names no outside AI host for it.
    expect(POLICY).toMatch(/Yes to all six/);
    expect(POLICY).toMatch(/counsel/i);
  });

  it("TA-261: the phone's own test of app.json against the store answers exists", () => {
    expect(existsSync(resolve(ROOT, "apps/mobile/test/lib/ta-decision-261-store-permissions.test.ts"))).toBe(true);
  });
});

/**
 * The second reading's two corrections (14 November 2026). Two published sentences were not true to the code: the
 * Razorpay sentence said the payer's name and email go only for a paid session, and the Anthropic sentence that only
 * the content team's question text is sent. Each case first holds the code path that sends, so that a change there
 * fails here until the sentence is read again, and then the sentence in the three languages and decision 0002's row.
 */
describe("TA-261: the sentences about Razorpay and Anthropic are held to the code that sends", () => {
  /** A source file with its white space folded, so a reformatted line still matches. */
  const source = (path: string) => read(path).replace(/\s+/g, " ");
  /** The row of decision 0002's table of outside companies that names `company`. */
  function policyRow(company: string): string {
    const line = POLICY.split("\n").find((l) => l.startsWith(`| **${company}**`));
    expect(line, `no row for ${company} in decision 0002`).toBeTruthy();
    return line!;
  }
  /** Every source file under apps/web/src, tests left out, whose text holds `needle`. */
  function filesHolding(needle: string): string[] {
    const found: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(resolve(ROOT, dir), { withFileTypes: true })) {
        const path = `${dir}/${entry.name}`;
        if (entry.isDirectory()) walk(path);
        else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) && read(path).includes(needle)) found.push(path);
      }
    };
    walk("apps/web/src");
    return found.sort();
  }

  it("TA-261: Razorpay's page is given the payer's name and email and the pupil's name on a school fee and a plan as well as a paid session, and the sentence says so", () => {
    // The code path. A school fee's panel, and the one panel a paid session and a plan share, hand Razorpay's page
    // the pupil's name as the line under the title and the payer's name and email to fill its form.
    const fee = source("apps/web/src/app/(app)/parent/fees/online-flow.tsx");
    expect(fee).toContain("description: order.pupilName");
    expect(fee).toContain("prefill: { name: order.payerName, email: order.payerEmail");
    const seat = source("apps/web/src/components/gigs/seat-checkout.tsx");
    expect(seat).toContain("description: theOrder.pupilName");
    expect(seat).toContain("prefill: { name: theOrder.payerName, email: theOrder.payerEmail");
    // A plan is paid on the same panel, the person the plan is for standing where the pupil does.
    const plan = source("apps/web/src/app/account/plan/buy.tsx");
    expect(plan).toContain("<SeatCheckout");
    expect(plan).toContain("pupilName: c.holderName");
    // These two are the only panels that open Razorpay's page; the phone opens the web's pages for a fee and a seat.
    expect(filesHolding("new window.Razorpay(")).toEqual(["apps/web/src/app/(app)/parent/fees/online-flow.tsx", "apps/web/src/components/gigs/seat-checkout.tsx"]);
    expect(read("apps/mobile/src/screens/family/fees.tsx")).toContain("/parent/fees?checkout=");
    expect(read("apps/mobile/src/screens/family/sessions.tsx")).toContain("/sessions?checkout=");
    // An expert who links a payout account: the details Razorpay is sent to open it.
    const gateway = source("apps/web/src/lib/gig-gateway.ts");
    for (const sent of ["email: input.email", "phone: input.phone", "legal_business_name: input.name", "addresses: { registered:", "kyc: { pan: input.pan }", "account_number: bank.accountNumber"]) expect(gateway, sent).toContain(sent);

    // The sentence, in the three languages.
    expect(en.privacy.s5pay).not.toMatch(/for a paid session, the payer's name and email as well/);
    expect(en.privacy.s5pay).toMatch(/a school fee, a plan and a paid session alike/);
    expect(en.privacy.s5pay).toMatch(/the payer's name and email/);
    expect(en.privacy.s5pay).toMatch(/the name of the pupil/);
    expect(en.privacy.s5pay).toMatch(/the person the plan is for/);
    expect(en.privacy.s5pay).toMatch(/expert/);
    expect(en.privacy.s5pay).toMatch(/PAN and bank account/);
    expect(hi.privacy.s5pay).not.toMatch(/सशुल्क सत्र के लिए भुगतान करने वाले का नाम और ईमेल भी/);
    for (const words of ["स्कूल के शुल्क, योजना और सशुल्क सत्र, तीनों में", "भुगतान करने वाले का नाम और ईमेल", "उस विद्यार्थी का नाम", "विशेषज्ञ", "PAN और बैंक खाता"]) expect(hi.privacy.s5pay, words).toContain(words);
    expect(hi.privacy.s5pay.endsWith("।")).toBe(true);
    expect(mr.privacy.s5pay).not.toMatch(/सशुल्क सत्रासाठी पैसे भरणाऱ्याचे नाव आणि ईमेलही/);
    for (const words of ["शाळेचे शुल्क, योजना आणि सशुल्क सत्र या तिन्हींमध्ये", "पैसे भरणाऱ्याचे नाव आणि ईमेल", "त्या विद्यार्थ्याचे नाव", "तज्ज्ञ", "PAN आणि बँक खाते"]) expect(mr.privacy.s5pay, words).toContain(words);
    expect(mr.privacy.s5pay.endsWith(".")).toBe(true);
    expect(mr.privacy.s5pay).not.toMatch(/स्कूल/);

    // Decision 0002's row says the same.
    const row0002 = policyRow("Razorpay");
    expect(row0002).not.toMatch(/for a paid session, the payer's name and e-mail as prefill/);
    expect(row0002).toMatch(/a school fee, a plan and a paid session alike/);
    expect(row0002).toMatch(/pupil's name/);
    expect(row0002).toMatch(/PAN and bank account/);
    expect(row0002).toMatch(/online-flow\.tsx/);
  });

  it("TA-261: Anthropic is sent a question's words by the content team's save and by a teacher's request for a draft, and the sentence names both", () => {
    // The code path. One module holds the client, and two callers reach it: the content team's save of a bank
    // question, and a teacher's draft of the Hindi and Marathi of a question written for the bank.
    expect(filesHolding("@anthropic-ai/sdk")).toEqual(["apps/web/src/lib/translate.ts"]);
    expect(filesHolding("translateQuestion(")).toEqual(["apps/web/src/lib/app-admin.ts", "apps/web/src/lib/gig-questions.ts", "apps/web/src/lib/translate.ts"]);
    const contributions = read("apps/web/src/lib/gig-questions.ts");
    const from = contributions.indexOf("export async function draftTranslations(ctx: ActiveContext, english: QuestionText)");
    expect(from, "draftTranslations is not where the sentence was read from").toBeGreaterThan(-1);
    const draft = contributions.slice(from, contributions.indexOf("\n}\n", from));
    expect(draft).toContain("const me = teacher(ctx);");
    expect(draft).toContain("const drafted = await translateQuestion(text);");
    // What is sent is the question alone: its stem, its choices and its solution.
    expect(source("apps/web/src/lib/translate.ts")).toContain("export type QuestionText = { stem: string; choices: string[]; solution: string; };");

    // The sentence, in the three languages.
    expect(en.privacy.s5e).toMatch(/Anthropic/);
    expect(en.privacy.s5e).toMatch(/the content team types/);
    expect(en.privacy.s5e).toMatch(/a teacher writes for the bank/);
    expect(en.privacy.s5e).toMatch(/asks for a draft/);
    expect(en.privacy.s5e).toMatch(/nothing from a pupil's record/);
    for (const words of ["Anthropic", "सामग्री टीम", "शिक्षक", "मसौदा"]) expect(hi.privacy.s5e, words).toContain(words);
    expect(hi.privacy.s5e.endsWith("।")).toBe(true);
    for (const words of ["Anthropic", "सामग्री गटाने", "शिक्षकाने", "मसुदा"]) expect(mr.privacy.s5e, words).toContain(words);
    expect(mr.privacy.s5e.endsWith(".")).toBe(true);

    // Decision 0002's row, and its older list of destinations, say the same.
    expect(policyRow("Anthropic")).toMatch(/a teacher writes for the bank/);
    expect(policyRow("Anthropic")).toMatch(/gig-questions\.ts/);
    const older = POLICY.split("\n").find((l) => l.startsWith("- **Every third-party destination the server talks to:**"));
    expect(older).toMatch(/a teacher writes for the bank/);
    // The assistant is still said to run on the company's own machine, with no outside AI company named for it.
    expect(en.privacy.s5assistant).toMatch(/own machine/);
    expect(en.privacy.s5assistant).not.toMatch(/Anthropic/);
  });
});
