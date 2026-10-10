import type { Metadata } from "next";
import { requireParent } from "@/lib/tenancy";
import { familyChildren, pickChild, childAccess } from "@/lib/family-child";
import { getT } from "@/lib/i18n/server";
import { FamilyHostelView } from "@/components/hostel/family";
import { PageHeader } from "@/components/ui/page-header";
import { ChildSwitcher } from "../child-switcher";
import { NotSharedState } from "@/components/family/not-shared";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("modules.hostelName"), robots: { index: false, follow: false } };
}

/** A boarder's hostel, for the guardian: the room, tonight's roll call, the menu, and leave — asked for, or consented to when the child asked. */
export default async function ParentHostelPage({ searchParams }: { searchParams: Promise<{ child?: string; ok?: string; error?: string }> }) {
  const session = await requireParent();
  const { child, ok, error } = await searchParams;
  // The children with what each lets the guardian see, opening on one the guardian may read (DS-1, 10 Oct 2026).
  const children = await familyChildren(session.user.id);
  const selected = pickChild(children, child) ?? children[0]!;
  // The hostel is shared under HOSTEL_TRANSPORT (hostel.ts asks the same): a refusal is a state here, not a 404.
  const access = await childAccess(session.user.id, selected.studentMembershipId, "HOSTEL_TRANSPORT");
  if (access.refused) {
    const t = await getT();
    return (
      <div className="space-y-5">
        <PageHeader title={t("modules.hostelName")} description={selected.schoolName} />
        {children.length > 1 && <ChildSwitcher pupils={children} selectedId={selected.studentMembershipId} basePath="/parent/hostel" />}
        <NotSharedState name={selected.name} />
      </div>
    );
  }
  return (
    <FamilyHostelView
      ctx={session}
      schoolId={selected.schoolId}
      childId={selected.studentMembershipId}
      path="/parent/hostel"
      ok={ok}
      error={error}
      switcher={children.length > 1 ? <ChildSwitcher pupils={children} selectedId={selected.studentMembershipId} basePath="/parent/hostel" /> : null}
    />
  );
}
