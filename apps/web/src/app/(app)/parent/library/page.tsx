import type { Metadata } from "next";
import { requireParent } from "@/lib/tenancy";
import { listContexts } from "@/lib/session";
import { getT } from "@/lib/i18n/server";
import { MyLibrary } from "@/components/library/mine";
import { ChildSwitcher } from "../child-switcher";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("modules.libraryName"), robots: { index: false, follow: false } };
}

/** A child's library, for the guardian: loans, dues, the queue, and the catalogue of the child's school to reserve from. */
export default async function ParentLibraryPage({ searchParams }: { searchParams: Promise<{ child?: string; q?: string; ok?: string; error?: string }> }) {
  const session = await requireParent();
  const { child, q = "", ok, error } = await searchParams;
  const { children } = await listContexts(session.user.id);
  const selected = children.find((c) => c.studentMembershipId === child) ?? children[0]!;
  return (
    <MyLibrary
      ctx={session}
      schoolId={selected.schoolId}
      childId={selected.studentMembershipId}
      path="/parent/library"
      q={q}
      ok={ok}
      error={error}
      switcher={children.length > 1 ? <ChildSwitcher pupils={children} selectedId={selected.studentMembershipId} basePath="/parent/library" /> : null}
    />
  );
}
