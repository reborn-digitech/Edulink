import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { institutionKindOf } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";

/**
 * THE SCHOOL'S ADMISSIONS ARE NOT A COLLEGE'S (TA-269). The nav hid /admin/admissions at a college (DS-4), but every
 * page under it still opened, and a cycle made there admitted students with no CET list, no scrutiny, no anti-ragging
 * undertakings and no academic seat. A college admits from its own desk; here every page answers as not found, as the
 * office's admission doors do at a college (role-gate.ts rule 4), and the library refuses the writes whatever calls them.
 */
export default async function AdmissionsLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (session?.schoolId && isCollegeKind(await institutionKindOf(session.schoolId))) notFound();
  return children;
}
