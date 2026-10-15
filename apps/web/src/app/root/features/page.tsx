import type { Metadata } from "next";
import { requireSuperuser } from "@/lib/tenancy";
import { listFeatures } from "@/lib/platform-features";
import { FEATURE_META } from "@/lib/feature-meta";
import { getRelativeTime, getT } from "@/lib/i18n/server";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { FeatureSwitch } from "./switch";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("platformFeatures.title") };
}

/**
 * THE PLATFORM'S FEATURE SWITCHES (the owner's ask of 15 October 2026): one row per feature with its name and
 * what it is, Running or Off, when and by whom it was last switched, one count that explains it, and the
 * switch. Every feature is off until switched on here; switching off deletes nothing. The operator's alone:
 * the app admin's desk has no such page. The library is src/lib/platform-features.ts.
 */
export default async function FeaturesPage() {
  const session = await requireSuperuser();
  const t = await getT();
  const relative = await getRelativeTime();
  const features = await listFeatures(session);

  return (
    <div className="space-y-5">
      <PageHeader title={t("platformFeatures.title")} description={t("platformFeatures.intro")} />
      <ul className="space-y-3" data-testid="platform-features">
        {features.map((f) => {
          const meta = FEATURE_META[f.code];
          const changed = f.changedAt
            ? f.changedByName
              ? t("platformFeatures.changedBy", { when: relative(new Date(f.changedAt)), name: f.changedByName })
              : t("platformFeatures.changedAt", { when: relative(new Date(f.changedAt)) })
            : t("platformFeatures.neverChanged");
          return (
            <li key={f.code}>
              <Card data-testid={`feature-${f.code}`} data-on={f.enabled ? "yes" : "no"}>
                <CardBody className="flex flex-wrap items-start justify-between gap-3 pt-5">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-fg">{t(meta.nameKey)}</span>
                      <Badge size="sm" tone={f.enabled ? "ok" : "neutral"}>
                        {f.enabled ? t("platformFeatures.running") : t("platformFeatures.off")}
                      </Badge>
                    </p>
                    <p className="text-sm text-fg-muted">{t(meta.whatKey)}</p>
                    <p className="text-sm text-fg">{t(meta.countKey, { count: f.count.toLocaleString() })}</p>
                    <p className="text-xs text-fg-subtle">{changed}</p>
                  </div>
                  <FeatureSwitch code={f.code} on={f.enabled} />
                </CardBody>
              </Card>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-fg-subtle">{t("platformFeatures.countNote")}</p>
    </div>
  );
}
