/**
 * A3-journeys-21, the pages (risks batch, 5 Oct 2026): a grade card is checked by typing its code. /certificates/exam
 * has a code field (it showed none without ?school=) and asks the library by the code alone; the shared
 * /certificates/check names a college's exam paper by its kind instead of saying no certificate carries the code.
 * The library's half (code-readable under RLS, checkExamDocument and verifyByCode) is package 1's, tested with it.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { translator } from "@/lib/i18n/dictionary";

// Vitest compiles the app's .tsx with the classic JSX runtime (React.createElement), which Next does not.
(globalThis as { React?: typeof React }).React = React;

const seen = vi.hoisted(() => ({ exam: [] as unknown[][] }));
vi.mock("@/lib/rate-limit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rate-limit")>()),
  consumeByCaller: async () => ({ allowed: true, retryAfterSeconds: 0 }),
}));
vi.mock("@/lib/exam-cell-after", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/exam-cell-after")>()),
  checkExamDocument: async (...args: unknown[]) => {
    seen.exam.push(args);
    return { valid: true, kind: "GRADE_CARD", serial: "ZZ/GC/2026/0001", schoolName: "ZZ Vidya College", issuedAt: "2026-06-01T00:00:00.000Z", revokedAt: null };
  },
}));
vi.mock("@/lib/certificates", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/certificates")>()),
  verifyByCode: async () => ({ valid: true, kind: null, serial: "ZZ/GC/2026/0001", title: null, schoolName: "ZZ Vidya College", issuedAt: "2026-06-01T00:00:00.000Z", revokedAt: null, examKind: "GRADE_CARD" }),
}));

import ExamCheckPage from "@/app/certificates/exam/page";
import CertificateCheckPage from "@/app/certificates/check/page";

const t = translator("en");
const render = async (node: Promise<React.ReactElement>) => renderToStaticMarkup(await node);

beforeEach(() => {
  seen.exam.length = 0;
});

describe("checking a grade card by typing its code (A3-journeys-21)", () => {
  it("/certificates/exam shows a code field with no ?school=, and asks by the code alone", async () => {
    const empty = await render(ExamCheckPage({ searchParams: Promise.resolve({}) }));
    expect(empty).toContain('data-testid="exam-check-form"');
    expect(empty).toMatch(/<input[^>]*name="code"/);
    expect(empty).not.toContain('name="school"');
    expect(seen.exam).toEqual([]);

    const typed = await render(ExamCheckPage({ searchParams: Promise.resolve({ code: "zzgc1234" }) }));
    expect(seen.exam).toEqual([["", "ZZGC1234"]]);
    expect(typed).toContain(t("examCell.checkValid"));
    expect(typed).toContain(t("examCell.docGradeCard"));
  });

  it("a hall ticket's QR keeps its college on the form", async () => {
    const html = await render(ExamCheckPage({ searchParams: Promise.resolve({ school: "zz-college-id", code: "ZZHT1234" }) }));
    expect(html).toMatch(/<input type="hidden" name="school" value="zz-college-id"/);
    expect(seen.exam).toEqual([["zz-college-id", "ZZHT1234"]]);
  });

  it("/certificates/check names a grade card typed there by its kind, with no certificate heading", async () => {
    const html = await render(CertificateCheckPage({ searchParams: Promise.resolve({ code: "ZZGC1234" }) }));
    expect(html).toContain(t("certificates.verifyValid"));
    expect(html).toContain(t("examCell.docGradeCard"));
    expect(html).not.toContain(t("certificates.verifyNotFound"));
    expect(html).not.toContain(`>${t("certificates.heading")}<`);
  });
});
