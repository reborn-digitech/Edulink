import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { EmptyState } from "@/components/ui/states";
import { ChalkboardTeacherIcon } from "@phosphor-icons/react/ssr";

export const metadata: Metadata = { title: "Classes" };

/**
 * Placeholder. The real thing — attendance by class, academic progress and
 * report cards — is the next commit. A nav entry that 404s is worse than a page
 * that says what it is not yet.
 */
export default async function PrincipalClassesPage() {
  await requireRole("PRINCIPAL", "ADMIN");
  return (
    <EmptyState
      icon={<ChalkboardTeacherIcon weight="duotone" className="size-8" />}
      title="Class insights are not built yet"
      description="Attendance by class, academic progress and report cards land here next. Staff leave already works."
    />
  );
}
