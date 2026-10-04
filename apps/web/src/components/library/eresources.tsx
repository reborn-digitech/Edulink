import { ArrowSquareOutIcon, GlobeIcon } from "@phosphor-icons/react/ssr";
import type { LIBRARY_ERESOURCE_KINDS } from "@edulink/contracts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import type { Translate } from "@/lib/i18n/dictionary";

type Item = { id: string; name: string; kind: (typeof LIBRARY_ERESOURCE_KINDS)[number] };

/** Where a member opens an e-resource: the app counts the open, then sends them on (app/(app)/library/e-resources/[resourceId]/open). */
export const eResourceOpenHref = (id: string) => `/library/e-resources/${encodeURIComponent(id)}/open`;

/**
 * A college's e-resources for its members (campaign 2026-10-04, G-3): the
 * active links, each opened THROUGH the app so the open is counted for the
 * library's criterion-4 return — never the publisher's link itself. A plain
 * anchor, not next/link: a prefetch must not count as an open.
 */
export function EResourceList({ items, t }: { items: readonly Item[]; t: Translate }) {
  return (
    <Card>
      <CardHeader icon={<GlobeIcon weight="duotone" className="size-5" />} title={t("collegeOffice.eResourcesTitle")} description={t("collegeOffice.eResourcesIntro")} />
      <CardBody>
        {items.length === 0 ? (
          <EmptyState title={t("collegeOffice.eResourcesEmpty")} description={t("collegeOffice.eResourcesEmptyBody")} />
        ) : (
          <ul className="divide-y divide-border" data-testid="eresource-list">
            {items.map((e) => (
              <li key={e.id} className="flex min-h-11 items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{e.name}</p>
                  <p className="text-xs text-fg-muted">{t(`collegeOffice.ekind${e.kind}`)}</p>
                </div>
                <Button asChild variant="secondary" size="sm">
                  <a href={eResourceOpenHref(e.id)} target="_blank" rel="noopener noreferrer" aria-label={t("collegeOffice.eResourceOpenLabel", { name: e.name })}>
                    {t("collegeOffice.eResourceOpen")}
                    <ArrowSquareOutIcon className="size-4" aria-hidden />
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
