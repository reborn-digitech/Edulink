import type { Metadata } from "next";
import { requireParent } from "@/lib/tenancy";
import { familyChildren, pickChild, childAccess } from "@/lib/family-child";
import { getT } from "@/lib/i18n/server";
import { MyLibrary } from "@/components/library/mine";
import { PageHeader } from "@/components/ui/page-header";
import { ChildSwitcher } from "../child-switcher";
import { NotSharedState } from "@/components/family/not-shared";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("modules.libraryName"), robots: { index: false, follow: false } };
}

/** A child's library, for the guardian: loans, dues, the queue, and the catalogue of the child's school to reserve from. */
export default async function ParentLibraryPage({ searchParams }: { searchParams: Promise<{ child?: string; q?: string; ok?: string; error?: string }> }) {
  const session = await requireParent();
  const { child, q = "", ok, error } = await searchParams;
  // The children with what each lets the guardian see, opening on one the guardian may read (DS-1, 10 Oct 2026).
  const children = await familyChildren(session.user.id);
  const selected = pickChild(children, child) ?? children[0]!;
  // Loans and dues are shared under MONEY (library.ts asks the same): a refusal is a state here, not a 404.
  const access = await childAccess(session.user.id, selected.studentMembershipId, "MONEY");
  if (access.refused) {
    const t = await getT();
    return (
      <div className="space-y-5">
        <PageHeader title={t("modules.libraryName")} description={selected.schoolName} />
        {children.length > 1 && <ChildSwitcher pupils={children} selectedId={selected.studentMembershipId} basePath="/parent/library" />}
        <NotSharedState name={selected.name} />
      </div>
    );
  }
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
