import { IdentificationCardIcon } from "@phosphor-icons/react/ssr";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ActionForm } from "@/components/ui/action-form";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import type { Translate } from "@/lib/i18n/dictionary";
import { rotateClaimCodeAction } from "./id-card-actions";

/**
 * The identity card's two notes for the office (R-52, risks batch): cards
 * printed before 5 October 2026 carry the student code, half of a family's
 * claim, so the year's cards are reprinted; and a lost card's code can be
 * replaced (ADMIN only, audited; the claim still needs the birthdate).
 */
export function IdCardPanel({ studentMembershipId, studentName, canRotate, t }: { studentMembershipId: string; studentName: string; canRotate: boolean; t: Translate }) {
  return (
    <Card data-testid="id-card-panel">
      <CardHeader icon={<IdentificationCardIcon weight="duotone" className="size-5" />} title={t("collegeDesks.idCardTitle")} description={t("riskDecisions.idCardsReprint")} />
      {canRotate ? (
        <CardBody className="pt-0">
          <ActionForm action={rotateClaimCodeAction} className="space-y-2">
            <input type="hidden" name="studentMembershipId" value={studentMembershipId} />
            <p className="text-sm text-fg-muted">{t("risksWeb.claimCodeRotateHint")}</p>
            <ConfirmSubmit size="sm" variant="secondary" confirm={t("risksWeb.claimCodeRotateConfirm", { name: studentName })} data-testid="rotate-claim-code">
              {t("risksWeb.claimCodeRotate")}
            </ConfirmSubmit>
          </ActionForm>
        </CardBody>
      ) : null}
    </Card>
  );
}
