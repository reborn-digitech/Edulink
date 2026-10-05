import Link from "next/link";
import { FolderUserIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/**
 * A small card on the family's home while the pupil record lacks something
 * a certificate needs. It names the fields and goes away only when they are
 * filled: there is no dismiss, because the school will ask again until the
 * record is complete, and a card that can be swiped away is a request that
 * gets forgotten.
 */
export async function CompleteRecordCard({ missing, href }: { missing: string[]; href: string }) {
  if (missing.length === 0) return null;
  const t = await getT();
  const fields = missing.map((f) => t(`pupilRecord.${f}` as TranslationKey)).join(", ");
  return (
    <Card className="border-warn/40" data-testid="complete-record-card">
      <CardBody className="flex flex-wrap items-center justify-between gap-3 pt-5">
        <div className="flex min-w-0 flex-1 basis-56 items-start gap-3">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-warn-soft text-warn">
            <FolderUserIcon weight="duotone" className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-fg">{t("pupilRecord.completeCard")}</p>
            <p className="mt-0.5 text-sm text-fg-muted">{t("pupilRecord.completeCardBody", { fields })}</p>
          </div>
        </div>
        <Button asChild size="sm" variant="secondary">
          <Link href={href}>{t("pupilRecord.completeCardAction")}</Link>
        </Button>
      </CardBody>
    </Card>
  );
}
