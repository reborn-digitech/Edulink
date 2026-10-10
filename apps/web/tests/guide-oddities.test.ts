/**
 * The oddities the user-guide writers found (10 October 2026): three readers
 * walked every page for the guide and listed sentences that read as a
 * developer's note, menu labels that differ from the page they open, a button
 * that loops, a raw status, three buttons all called "Open", a label borrowed
 * from another form, and a hidden field a card implied could change. Each rule
 * here fails on the source or the dictionary as it stood before the fix.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DICTIONARIES, translator } from "@/lib/i18n/dictionary";
import { LOCALES } from "@/lib/i18n/locales";

const src = (path: string) => readFileSync(join(process.cwd(), "src", path), "utf8");
const APP = "app/(app)";
const t = translator("en");
const langs = LOCALES.map((l) => l.code);
const ts = langs.map((code) => [code, translator(code)] as const);

describe("developer notes are off the user pages (office items 2, 3, 4)", () => {
  it("the messaging page's template line names no command in any language", () => {
    for (const [code, tr] of ts) expect(tr("messaging.templatesCommand"), code).not.toMatch(/npm run|messages:templates/);
    expect(t("messaging.templatesCommand")).toContain(t("messaging.templateNone"));
  });

  it("the Tally page says what the file is and what to do with it; the untested note is the docs' (docs/college.md)", () => {
    expect(src(`${APP}/admin/fees/tally/page.tsx`)).toContain('t("tally.importHint")');
    expect(src(`${APP}/admin/fees/tally/page.tsx`)).not.toContain("tally.untested");
    expect((DICTIONARIES.en as { tally: Record<string, unknown> }).tally).not.toHaveProperty("untested");
    expect(t("tally.importHint")).toMatch(/import/);
    for (const [code, tr] of ts) expect(tr("tally.importHint"), code).not.toMatch(/not been imported|नहीं जाँचा|तपासलेल्या नाहीत/);
  });

  it("the alumni mentor hint says what exists, not what comes later", () => {
    for (const [code, tr] of ts) expect(tr("alumni.adminMentorHint"), code).not.toMatch(/comes later|बाद में आएगा|नंतर येईल/);
    expect(t("alumni.adminMentorHint")).toMatch(/one-to-one/);
  });
});

describe("a menu label is the page's title (office item 9, daily item 1)", () => {
  it("Reviews opens Teacher reviews, and the accounts desk's Fees entry opens Fees", () => {
    for (const [code, tr] of ts) {
      expect(tr("nav.reviews"), code).toBe(tr("reviews.title"));
      expect(tr("collegeOffice.navFeeLedger"), code).toBe(tr("fees.title"));
    }
  });
});

describe("the refunds page's Applications button is not a loop (daily item 2)", () => {
  it("is not drawn for the accounts desk, whom /admin/college-admissions sends straight back", () => {
    const page = src(`${APP}/admin/college-admissions/refunds/page.tsx`);
    const i = page.indexOf('href="/admin/college-admissions"');
    expect(i).toBeGreaterThan(0);
    expect(page.slice(0, i)).toMatch(/ctx\.role === "ACCOUNTS" \? undefined :/);
    expect(src(`${APP}/admin/college-admissions/page.tsx`)).toMatch(/if \(ctx\.role === "ACCOUNTS"\) redirect\("\/admin\/college-admissions\/refunds"\)/);
  });
});

describe("a mentoring booking's status is in words (daily item 3)", () => {
  it("the alumnus's college page translates every status mentorBookings returns", () => {
    const page = src(`${APP}/alumni/college/page.tsx`);
    expect(page).not.toContain("<Badge>{b.status}</Badge>");
    expect(page).toContain("<Badge>{bookingStatusLabel(t, b.status)}</Badge>");
    const statuses = /status: \{ in: \[([^\]]*)\] \}/.exec(src("lib/placement-alumni.ts").split("export async function mentorBookings")[1]!)![1]!;
    for (const status of statuses.match(/[A-Z_]+/g)!) {
      expect(page, status).toContain(`${status}: "gigs.bookingStatus${status}"`);
      for (const [code, tr] of ts) expect(tr(`gigs.bookingStatus${status}` as never), `${code} ${status}`).not.toBe(`gigs.bookingStatus${status}`);
    }
  });
});

describe("the hostel pages' buttons each have their own words (daily item 4)", () => {
  it("the visitor book's day, the roll-call sheet and the leave filter are three keys, and `hostel.open` is gone", () => {
    expect(src(`${APP}/hostel/visitors/page.tsx`)).toContain('t("hostel.showDay")');
    expect(src(`${APP}/hostel/rollcall/page.tsx`)).toContain('t("hostel.showSheet")');
    expect(src(`${APP}/hostel/leave/page.tsx`)).toContain('"hostel.showOpen"');
    expect((DICTIONARIES.en as { hostel: Record<string, unknown> }).hostel).not.toHaveProperty("open");
    for (const [code, tr] of ts) {
      const words = [tr("hostel.showDay"), tr("hostel.showSheet"), tr("hostel.showOpen")];
      expect(new Set(words).size, code).toBe(3);
      expect(tr("hostel.whichSlot"), code).not.toBe(tr("hostel.tabRollCall"));
    }
  });
});

describe("a former pupil's fee line names no Fees page (daily item 6)", () => {
  it("the shared request row reads feeDueOffice when the reader has no fees page, on both its lines", () => {
    const list = src("components/certificates/request-list.tsx");
    expect(list.match(/feesHref \? "certificateRequests\.feeDue" : "certificateRequests\.feeDueOffice"/g)).toHaveLength(2);
    expect(list).not.toMatch(/[^?] "certificateRequests\.feeDue"/);
    const feesPage = /Fees page|शुल्क पृष्ठ|शुल्क पानावर/;
    for (const [code, tr] of ts) {
      expect(tr("certificateRequests.feeDueOffice", { amount: "₹10" }), code).not.toMatch(feesPage);
      expect(tr("certificateRequests.feeDue", { amount: "₹10" }), code).toMatch(feesPage);
    }
  });
});

describe("the surveys form's kind has its own label (college item 1)", () => {
  it("is not the filings page's label", () => {
    expect(src(`${APP}/iqac/surveys/page.tsx`)).toContain('label={t("iqac.surveyKindField")}');
    expect(src(`${APP}/iqac/surveys/page.tsx`)).not.toContain("iqac.kindField");
    for (const [code, tr] of ts) expect(tr("iqac.surveyKindField"), code).not.toBe(tr("iqac.kindField"));
  });
});

describe("the transport toast is the right sentence (college item 2)", () => {
  it("transport.assignmentSaved speaks of the bus in every language; the assistant's assignmentSaved is another namespace", () => {
    for (const [code, tr] of ts) expect(tr("transport.assignmentSaved"), code).toMatch(/bus|बस/);
    expect(t("assistantUi.assignmentSaved")).not.toBe(t("transport.assignmentSaved"));
  });
});

describe("the supervision page decides what the library lets the reader decide (college item 5)", () => {
  it("passes the library's canDecide through instead of false", () => {
    const page = src(`${APP}/faculty/supervision/page.tsx`);
    expect(page).toContain("canDecide={internships.canDecide}");
    expect(page).not.toContain("canDecide={false}");
  });
});

describe("the HOD's visit pages have no stray blank line (college item 6)", () => {
  it.each(["hod/visits/page.tsx", "hod/visits/[visitId]/page.tsx"])("%s", (file) => {
    const page = src(`${APP}/${file}`);
    expect(page).not.toMatch(/\n\n\n/);
    const body = page.slice(page.lastIndexOf("  return (\n"));
    expect(body).not.toMatch(/\n[ \t]*\n/);
  });
});

describe("the exam session's fee head (college item 8)", () => {
  it("is chosen again while the session is a draft and said to be fixed once forms exist", () => {
    const page = src(`${APP}/exam-cell/sessions/[sessionId]/page.tsx`);
    expect(page).toMatch(/s\.status === "DRAFT" \? \(\s*<Labelled label=\{t\("examCell\.fieldFeeHead"\)\}>\s*<select name="feeHeadId"/);
    expect(page).toContain('t("examCell.feeHeadFixed")');
    expect(page).toMatch(/<input type="hidden" name="feeHeadId" value=\{s\.feeHeadId \?\? ""\} \/>\s*<p/);
    expect(src("lib/exam-cell.ts")).toMatch(/export async function updateSession[\s\S]*sessionData\(input\)/);
  });
});

describe("the placement tile names the tab it points at (college item 9)", () => {
  it("tileFinalYearNone says Placement table, the tab's label", () => {
    expect(t("placement.tileFinalYearNone", { batch: "2027" })).toContain(t("placement.tabAnalytics"));
    for (const [code, tr] of ts) expect(tr("placement.tileFinalYearNone", { batch: "2027" }), code).not.toMatch(/Analytics|विश्लेषण/);
  });
});
