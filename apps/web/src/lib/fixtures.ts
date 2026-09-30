import "server-only";
import { db } from "./db";

/**
 * The test fixtures, kept out of what real schools read.
 *
 * The ZZ schools and people exist for the tests and the sweeps, and they are
 * published like anybody else so that the tests see what a real school
 * would: a listed expert, a school in the directory, an open time. Which
 * meant a real school's Experts page listed seven of them, each saying it
 * described nobody (the walk of 2026-10-01). The flag is on the row
 * (School.isTestFixture, User.isTestFixture), and a directory leaves the
 * flagged out unless the reader is a fixture too — the tests still see
 * everything, a real school sees only what is real.
 */
export async function readerIsFixture(schoolId: string | null | undefined): Promise<boolean> {
  if (!schoolId) return false;
  const school = await db.school.findUnique({ where: { id: schoolId }, select: { isTestFixture: true } });
  return Boolean(school?.isTestFixture);
}

/** A where-fragment for a table that carries the flag itself (School). */
export function realSchoolsOnly(readerIsFixtureSchool: boolean): { isTestFixture?: false } {
  return readerIsFixtureSchool ? {} : { isTestFixture: false };
}

/** A where-fragment for a row whose person carries the flag (an expert's profile, a provider's slot). */
export function realPeopleOnly(readerIsFixtureSchool: boolean): { user?: { isTestFixture: false } } {
  return readerIsFixtureSchool ? {} : { user: { isTestFixture: false } };
}
