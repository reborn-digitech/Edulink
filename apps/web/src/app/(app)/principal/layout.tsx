import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROUTE_HEADER } from "@/lib/route-header";
import { getSession } from "@/lib/session";
import { institutionKindOf } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";

/**
 * A COLLEGE'S HEAD OPENING /principal IS SENT ON BEFORE ANYTHING STREAMS (QA-57, QA campaign of 24 October 2026).
 * /principal is the school's dashboard; its page sends a college on to /principal/college, but from inside this
 * section's loading boundary, so a full load drew the skeleton and then navigated a second time. This layout sits
 * outside that boundary: for the dashboard's own path (the middleware's route stamp) a college is answered with a
 * redirect at once. Sign-in already lands a college's head there (role-home.ts); the page keeps its own redirect
 * for a navigation inside the section, where this layout is not drawn again.
 */
export default async function PrincipalLayout({ children }: { children: ReactNode }) {
  if ((await headers()).get(ROUTE_HEADER) === "GET /principal") {
    const session = await getSession();
    if (session?.schoolId && isCollegeKind(await institutionKindOf(session.schoolId))) redirect("/principal/college");
  }
  return children;
}
