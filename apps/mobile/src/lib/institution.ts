import { isCollegeKind, type Me } from "@edulink/contracts";
import { useSessionIfAny } from "./session";
import type { Translate, TranslationKey } from "@edulink/i18n";

type Context = Me["contexts"][number];

/**
 * How a context's place reads wherever the phone lists a person's schools
 * (the switcher, the More sheet): a school as its bare name, as before; any
 * other kind of institution with its kind after it — "ZZ Vidya College ·
 * College" (4 Oct 2026, from /api/v1/me's per-context `institutionKind`).
 * An older server says no kind, which reads as a school. Null with no name.
 */
export function contextPlace(c: Pick<Context, "schoolName" | "institutionKind">, t: Translate): string | null {
  if (!c.schoolName) return null;
  if (!c.institutionKind || c.institutionKind === "SCHOOL") return c.schoolName;
  return `${c.schoolName} · ${t(`institution.kind.${c.institutionKind}` as TranslationKey)}`;
}

/**
 * Whether the person's active place is a college (QA-69, QA campaign of 24 October 2026): a screen says "college"
 * and "students" there, where it said "school" and "pupils" everywhere. False before /me has answered.
 */
export function useCollege(): boolean {
  const session = useSessionIfAny();
  return session?.status === "signed-in" ? isCollegeKind(session.me.institutionKind) : false;
}
