import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatPaise } from "@edulink/i18n";
import { requireRole } from "@/lib/tenancy";
import { owedForQuestionsPaise, payeeDoorOpen, savedPayee } from "@/lib/question-gig";
import { getLocale, getT } from "@/lib/i18n/server";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { PayeeForm } from "../contributions/payee-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("gigPayee.title"), robots: { index: false, follow: false } };
}

/**
 * WHERE A TEACHER IS PAID, while the question gig is closed (quiz-board, 11 October 2026). The gig's
 * pages answer 404 (QUESTION_GIG_FOR_TEACHERS is false), but a teacher the company still owes for
 * questions the bank took earlier must be able to correct their UPI id before the operator pays it. This
 * page and its one door (POST /api/v1/gigs/payee) stay open for that teacher alone; anyone else, and this
 * teacher once paid in full, gets the gig's 404. The teacher's home links here while money is owed.
 */
export default async function TeacherPayeePage() {
  const ctx = await requireRole("TEACHER");
  if (!(await payeeDoorOpen(ctx.user.id))) notFound();
  const t = await getT();
  const locale = await getLocale();
  const [owed, payee] = await Promise.all([owedForQuestionsPaise(ctx.user.id), savedPayee(ctx.user.id)]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("gigPayee.title")} description={t("gigPayee.intro")} />
      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <StatTile label={t("gigs.standingDue")} value={formatPaise(owed, locale)} tone="accent" />
      </div>
      <Card>
        <CardHeader title={t("gigPayee.formTitle")} description={payee ? t("gigPayee.formSaved") : t("gigPayee.formNone")} />
        <CardBody>
          <PayeeForm payee={payee} />
        </CardBody>
      </Card>
    </div>
  );
}
