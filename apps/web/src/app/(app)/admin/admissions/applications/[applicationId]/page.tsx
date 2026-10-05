import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ExamIcon,
  FilesIcon,
  GraduationCapIcon,
  HandshakeIcon,
  ScalesIcon,
  StudentIcon,
  UserIcon,
} from "@phosphor-icons/react/ssr";
import { AccessError, requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { applicationView } from "@/lib/admissions";
import { formatDate, formatDateKey, formatInZone } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getT } from "@/lib/i18n/server";
import {
  ADMISSION_STATUS_KEY,
  ADMISSION_STATUS_TONE,
  relationKey,
} from "@/components/admissions/labels";
import { DocumentList } from "@/components/admissions/document-upload";
import {
  AdmitForm,
  DecideButtons,
  OfferForm,
  TestForm,
  VerifyButton,
} from "./office-steps";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("admissions.pipelineTitle") };
}

const CUID = /^c[a-z0-9]{20,}$/;

/**
 * One application as the office sees it: the child and the family, the
 * documents and whether they are checked, the entrance test, the offer,
 * the decision, and the seat. Every step shows only when the library says
 * this reader may take it — `can.*` is the truth, the page merely draws it.
 */
export default async function OfficeApplicationPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const { applicationId } = await params;
  if (!CUID.test(applicationId)) notFound();
  let view;
  try {
    view = await applicationView(ctx, applicationId);
  } catch (error) {
    if (error instanceof AccessError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
  const [school, classes, structures] = await Promise.all([
    db.school.findUniqueOrThrow({
      where: { id: ctx.schoolId },
      select: { timezone: true },
    }),
    view.can.admit
      ? db.class.findMany({
          // Only a class of the grade applied for (or one given no grade): admit() refuses any other (A3-journeys-40).
          where: { schoolId: ctx.schoolId, archivedAt: null, OR: [{ gradeLevel: { equals: view.gradeApplied, mode: "insensitive" } }, { gradeLevel: null }] },
          orderBy: { name: "asc" },
          select: { id: true, name: true, gradeLevel: true },
        })
      : Promise.resolve([]),
    view.can.admit || view.can.offer
      ? db.feeStructure.findMany({
          where: {
            schoolId: ctx.schoolId,
            publishedAt: { not: null },
            archivedAt: null,
          },
          orderBy: { name: "asc" },
          select: { id: true, name: true, gradeLevel: true },
        })
      : Promise.resolve([]),
  ]);
  const timezone = school.timezone;
  const when = (iso: string) => formatDate(new Date(iso), timezone);
  const dash = "—";

  const detail = (label: string, value: string | null | undefined) => (
    <div key={label}>
      <dt className="text-xs uppercase tracking-wide text-fg-muted">{label}</dt>
      <dd className="text-sm text-fg">{value || dash}</dd>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={t("admissions.applicationTitle", { serial: view.serial })}
        description={[
          view.childName,
          `${t("admissions.grade")} ${view.gradeApplied}`,
          view.cycle.name,
          view.cycle.academicYearName,
        ].join(" · ")}
        meta={
          <Badge tone={ADMISSION_STATUS_TONE[view.status]} size="sm">
            {t(ADMISSION_STATUS_KEY[view.status])}
          </Badge>
        }
        back={{
          href: "/admin/admissions/applications",
          label: t("admissions.pipelineTitle"),
        }}
      />

      <Card>
        <CardHeader
          icon={<StudentIcon weight="duotone" className="size-5" />}
          title={t("admissions.child")}
          description={t("admissions.appliedOn", {
            date: when(view.createdAt),
          })}
        />
        <CardBody>
          <dl className="grid gap-3 sm:grid-cols-2">
            {detail(t("admissions.childName"), view.childName)}
            {detail(
              t("admissions.childBirthdate"),
              view.childBirthdate
                ? formatDateKey(view.childBirthdate, {
                    day: "numeric",
                    month: "numeric",
                    year: "numeric",
                  })
                : null,
            )}
            {detail(t("admissions.gradeApplied"), view.gradeApplied)}
            {detail(t("admissions.previousSchool"), view.previousSchool)}
            {view.penNumber && detail(t("pupilRecord.penNumber"), view.penNumber)}
            {detail(t("admissions.address"), view.addressLine)}
            {detail(t("admissions.city"), view.city)}
          </dl>
          {view.note && (
            <p className="mt-3 whitespace-pre-wrap text-sm text-fg-muted">
              {view.note}
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<UserIcon weight="duotone" className="size-5" />}
          title={t("admissions.applicant")}
          description={
            view.applicantUserId ? undefined : t("admissions.noAccount")
          }
        />
        <CardBody>
          <dl className="grid gap-3 sm:grid-cols-2">
            {detail(t("admissions.applicantName"), view.applicantName)}
            {detail(t("admissions.relation"), t(relationKey(view.relation)))}
            {detail(t("admissions.applicantPhone"), view.applicantPhone)}
            {detail(t("admissions.applicantEmail"), view.applicantEmail)}
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<FilesIcon weight="duotone" className="size-5" />}
          title={t("admissions.documentsTitle")}
          action={
            view.can.verifyDocuments ? (
              <VerifyButton applicationId={view.id} />
            ) : undefined
          }
        />
        <CardBody>
          <DocumentList
            applicationId={view.id}
            documents={view.cycle.documents}
            attached={view.documents}
            missing={view.documentsMissing}
            canUpload={view.can.uploadDocuments}
            verifiedAt={view.documentsVerifiedAt}
          />
        </CardBody>
      </Card>

      {view.cycle.testRequired && (
        <Card>
          <CardHeader
            icon={<ExamIcon weight="duotone" className="size-5" />}
            title={t("admissions.testTitle")}
            description={
              view.testedAt
                ? t("admissions.testedOn", { date: when(view.testedAt) })
                : undefined
            }
          />
          <CardBody className="space-y-4">
            <dl className="grid gap-3 sm:grid-cols-2">
              {detail(
                t("admissions.testSlot"),
                view.testSlot
                  ? [
                      `${formatInZone(new Date(view.testSlot.startsAt), timezone)} – ${formatInZone(new Date(view.testSlot.endsAt), timezone, { timeStyle: "short" })}`,
                      view.testSlot.location,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : t("admissions.noSlotBooked"),
              )}
              {view.testedAt
                ? detail(t("admissions.score"), view.testScore)
                : null}
              {view.testedAt && view.testNote
                ? detail(t("admissions.testNote"), view.testNote)
                : null}
            </dl>
            {view.can.recordTest && (
              <TestForm
                applicationId={view.id}
                score={view.testScore}
                note={view.testNote}
              />
            )}
          </CardBody>
        </Card>
      )}

      {(view.can.offer ||
        view.offeredAt ||
        view.status === "ACCEPTED" ||
        view.status === "DECLINED" ||
        view.status === "ADMITTED") && (
        <Card>
          <CardHeader
            icon={<HandshakeIcon weight="duotone" className="size-5" />}
            title={t("admissions.offerTitle")}
            description={
              view.status === "OFFERED" && view.offeredAt
                ? [
                    t("admissions.offeredOn", { date: when(view.offeredAt) }),
                    view.offerExpiresAt
                      ? t("admissions.respondBy", {
                          date: when(view.offerExpiresAt),
                        })
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : view.status === "ACCEPTED" && view.respondedAt
                  ? t("admissions.acceptedOn", { date: when(view.respondedAt) })
                  : view.status === "DECLINED" && view.respondedAt
                    ? t("admissions.declinedOn", {
                        date: when(view.respondedAt),
                      })
                    : undefined
            }
          />
          <CardBody className="space-y-4">
            {(view.offeredAt ||
              view.status === "ACCEPTED" ||
              view.status === "ADMITTED") && (
              <dl className="grid gap-3 sm:grid-cols-2">
                {view.offerNote
                  ? detail(t("admissions.offerNote"), view.offerNote)
                  : null}
                {detail(
                  t("admissions.feeStructure"),
                  view.feeStructureName ?? t("admissions.noFeeStructure"),
                )}
              </dl>
            )}
            {view.can.offer && (
              <OfferForm applicationId={view.id} structures={structures} />
            )}
          </CardBody>
        </Card>
      )}

      {(view.can.decide || view.decidedAt) && (
        <Card>
          <CardHeader
            icon={<ScalesIcon weight="duotone" className="size-5" />}
            title={t("admissions.decideTitle")}
            description={
              view.decidedAt
                ? t("admissions.decidedOn", { date: when(view.decidedAt) })
                : undefined
            }
          />
          <CardBody className="space-y-4">
            {view.decisionNote && (
              <p className="text-sm text-fg-muted">{view.decisionNote}</p>
            )}
            {view.can.decide && (
              <DecideButtons applicationId={view.id} status={view.status} />
            )}
          </CardBody>
        </Card>
      )}

      {(view.can.admit || view.status === "ADMITTED") && (
        <Card>
          <CardHeader
            icon={<GraduationCapIcon weight="duotone" className="size-5" />}
            title={t("admissions.admitTitle")}
            description={
              view.admittedAt
                ? t("admissions.admittedOn", { date: when(view.admittedAt) })
                : t("admissions.admitHint")
            }
          />
          <CardBody className="space-y-4">
            {view.status === "ADMITTED" && view.admittedMembershipId && (
              <div className="space-y-2">
                <p className="text-sm text-fg">
                  {view.feeStructureName
                    ? t("admissions.feePlanCreated")
                    : t("admissions.feePlanNone")}
                </p>
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/people/${view.admittedMembershipId}`}>
                    {t("admissions.openRoll")}
                  </Link>
                </Button>
              </div>
            )}
            {/* Mounted while ADMITTED too, so the one-time codes the action returned survive the refresh that hides the form. */}
            {(view.can.admit || view.status === "ADMITTED") && (
              <AdmitForm
                applicationId={view.id}
                childName={view.childName}
                classes={classes}
                structures={structures}
                canAdmit={view.can.admit}
              />
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
