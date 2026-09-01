"use server";

import type { TranslationKey } from "@/lib/i18n/dictionary";
import { revalidatePath } from "next/cache";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import {
  createHoliday,
  updateHoliday,
  deleteHoliday,
  type HolidayKind,
} from "@/lib/holidays";
import { createAcademicYear, closeAcademicYear, reopenAcademicYear } from "@/lib/academic-year";
import { createTerm, deleteTerm, finishTerm, reopenTerm } from "@/lib/terms";

/**
 * The school calendar and the academic year, from the admin's side.
 *
 * Every action here re-reads the role and the school from the SESSION and never
 * from the form. A holiday carries no secrets, but a forged `schoolId` in a
 * hidden field would let anyone shut another school for the week, and the rule
 * is uniform across the app precisely so that nobody has to judge which writes
 * are worth protecting. (§6)
 */

/**
 * ⚠ `errorKey` AND `error`, and the split is honest rather than untidy.
 *
 * `errorKey` is everything this file decides itself, returned as a key so the
 * form resolves it in the reader's language. `error` is the one case it cannot:
 * an `AccessError` from the tenancy layer, whose message is minted app-wide.
 */
export type ActionResult = { ok: boolean; error?: string; id?: string;
  errorKey?: TranslationKey;
  errorVars?: Record<string, string | number>;
};

/** AccessError carries a message meant for a person; anything else does not. */
function failure(error: unknown): ActionResult {
  if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
  console.error("[calendar]", error);
  return { ok: false, errorKey: "common.tryAgain" };
}

function refresh() {
  revalidatePath("/admin/calendar");
  revalidatePath("/admin");
  // The register shows the closed-day banner, so it must not serve a cached
  // page that still thinks today is an ordinary Tuesday.
  revalidatePath("/teacher/attendance");
}

export async function addCalendarEntry(input: {
  name: string;
  startDateKey: string;
  endDateKey: string;
  kind: HolidayKind;
  note?: string;
}): Promise<ActionResult> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const id = await createHoliday(ctx, input);
    refresh();
    return { ok: true, id };
  } catch (error) {
    return failure(error);
  }
}

export async function editCalendarEntry(
  holidayId: string,
  input: { name: string; startDateKey: string; endDateKey: string; kind: HolidayKind; note?: string },
): Promise<ActionResult> {
  try {
    const ctx = await requireApiRole("ADMIN");
    await updateHoliday(ctx, holidayId, input);
    refresh();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function removeCalendarEntry(holidayId: string): Promise<ActionResult> {
  try {
    const ctx = await requireApiRole("ADMIN");
    await deleteHoliday(ctx, holidayId);
    refresh();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/* -------------------------------------------------------------------------- */
/* The academic year                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Dates arrive as YYYY-MM-DD from a date input and are read as UTC midnight.
 *
 * `new Date("2026-06-01")` is UTC midnight; `new Date(2026, 5, 1)` is LOCAL
 * midnight and would store the 31st of May for anyone east of Greenwich. The
 * year's start date is compared against attendance date keys, so an hours-level
 * slip here is a day-level slip in which badges a child appears to hold.
 */
function asUtcDate(dateKey: string): Date {
  const parsed = new Date(`${dateKey}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) throw new AccessError("access.thatIsNotARealDate");
  return parsed;
}

export async function startAcademicYear(input: {
  name: string;
  startDateKey: string;
  endDateKey: string;
}): Promise<ActionResult> {
  try {
    // The year's milestones are shared with the principal — starting, closing,
    // reopening, and the terms inside it. The holiday calendar above stays the
    // office's alone.
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const id = await createAcademicYear(ctx, {
      name: input.name.trim(),
      startDate: asUtcDate(input.startDateKey),
      endDate: asUtcDate(input.endDateKey),
    });
    refresh();
    // Badges are windowed on the year, so every page that shows one is stale.
    revalidatePath("/student");
    revalidatePath("/student/profile");
    return { ok: true, id };
  } catch (error) {
    return failure(error);
  }
}

/**
 * Closes the running year and moves into another one.
 *
 * Deliberately requires the next year to EXIST already rather than creating it
 * here. Closing a year archives every child's badges and empties the board; an
 * admin should have typed next year's dates and looked at them before that
 * happens, not had them invented as a side effect of pressing one button.
 */
export async function rollOverAcademicYear(
  closingYearId: string,
  nextYearId: string,
): Promise<ActionResult & { studentsArchived?: number; badgesArchived?: number; seriesArchived?: number; roundsClosed?: number }> {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const result = await closeAcademicYear(ctx, closingYearId, nextYearId);
    refresh();
    revalidatePath("/student");
    revalidatePath("/student/profile");
    return { ok: true, ...result };
  } catch (error) {
    return failure(error);
  }
}

/** The undo for a close pressed by mistake — the year runs again. */
export async function reopenYear(
  yearId: string,
): Promise<ActionResult & { seriesRestored?: number }> {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const result = await reopenAcademicYear(ctx, yearId);
    refresh();
    revalidatePath("/student");
    revalidatePath("/student/profile");
    revalidatePath("/archive");
    return { ok: true, ...result };
  } catch (error) {
    return failure(error);
  }
}

export async function markTermFinished(termId: string, finished: boolean): Promise<ActionResult> {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    // finishTerm/reopenTerm throw on a refusal (wrong role, or a term from
    // another school) — the catch below routes that AccessError to the toast.
    if (finished) await finishTerm(ctx, termId);
    else await reopenTerm(ctx, termId);
    refresh();
    revalidatePath("/admin/exams");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function addTerm(
  academicYearId: string,
  input: { name: string; startDateKey: string; endDateKey: string },
): Promise<ActionResult & { termId?: string }> {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const result = await createTerm(ctx, academicYearId, input);
    if (!result.ok) return { ok: false, errorKey: result.errorKey };
    refresh();
    revalidatePath("/admin/exams");
    return { ok: true, termId: result.termId };
  } catch (error) {
    return failure(error);
  }
}

export async function removeTerm(termId: string): Promise<ActionResult> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await deleteTerm(ctx, termId);
    if (!result.ok) return { ok: false, errorKey: result.errorKey };
    refresh();
    revalidatePath("/admin/exams");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
