import type { Metadata } from "next";
import { requireParent } from "@/lib/tenancy";
import { listContexts } from "@/lib/session";
import { getT } from "@/lib/i18n/server";
import { FamilyHostelView } from "@/components/hostel/family";
import { ChildSwitcher } from "../child-switcher";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("modules.hostelName"), robots: { index: false, follow: false } };
}

/** A boarder's hostel, for the guardian: the room, tonight's roll call, the menu, and leave — asked for, or consented to when the child asked. */
export default async function ParentHostelPage({ searchParams }: { searchParams: Promise<{ child?: string; ok?: string; error?: string }> }) {
  const session = await requireParent();
  const { child, ok, error } = await searchParams;
  const { children } = await listContexts(session.user.id);
  const selected = children.find((c) => c.studentMembershipId === child) ?? children[0]!;
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
