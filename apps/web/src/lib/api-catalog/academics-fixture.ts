/**
 * The fixed ids of the ZZ academics at ZZ Vidya College
 * (scripts/zz-academics.ts writes the rows with them), so the API catalog's
 * samples, the suite and the coordinator can name a term, an offering or a
 * lecture without a field of their own in the sweep's fixture. Each is in
 * the shape the contracts' cuid check accepts. Only ZZ data.
 *
 *   term              this odd term, registration open
 *   department(1|2)   Physics (HOD zz.hod01), Chemistry
 *   programme(1|2)    BSc Physics, BSc Chemistry
 *   scheme(1)         BSc Physics 2024 (internal 40 of 100, 16–26 credits a term)
 *   course(1..8)      semesters 1 and 2; 1–4 are semester 1
 *   offering(1)       PHY101 by zz.faculty01 — the twenty lectures, the locked internal marks
 *   offering(2)       CHE101 by zz.faculty02 — marks entered, not yet countersigned
 *   offering(3)       PHY103 elective (shared) by zz.hod01
 *   lecture(1..20)    PHY101's past lectures, zz.cstudent03 under 75 %
 *   component(1|2)    PHY101's unit test and assignment, countersigned and released
 *   condonation       zz.cstudent03's ask, waiting for the HOD
 */
const pad = (prefix: string, n: number) => `c${prefix}${String(n).padStart(20 - prefix.length, "0")}`;

export const ACADEMICS_FIXTURE = {
  term: pad("zzacterm", 1),
  department: (n: number) => pad("zzacdept", n),
  programme: (n: number) => pad("zzacprog", n),
  scheme: (n: number) => pad("zzacscheme", n),
  course: (n: number) => pad("zzaccourse", n),
  room: (n: number) => pad("zzacroom", n),
  division: (n: number) => pad("zzacdiv", n),
  offering: (n: number) => pad("zzacoffer", n),
  slot: (n: number) => pad("zzacslot", n),
  lecture: (n: number) => pad("zzaclect", n),
  component: (n: number) => pad("zzaccomp", n),
  condonation: pad("zzaccond", 1),
  lateRegistration: pad("zzaclate", 1),
  mentoringGroup: pad("zzacmgroup", 1),
  /** The clientId the fixture's marks went in under: sending it again is a replay. */
  clientId: (n: number) => `zz-fixture-batch-${String(n).padStart(2, "0")}`,
} as const;

/** The fixture college's academic dials, sent back unchanged by the sweep. */
export const ACADEMICS_FIXTURE_SETTINGS = { loadMinHours: 4, loadMaxHours: 18, studentsPerFaculty: 20, menteesPerMentor: 20 };
