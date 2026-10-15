import Link from "next/link";
import { ToggleRightIcon } from "@phosphor-icons/react/ssr";
import { featuresOn, PLATFORM_FEATURES } from "@/lib/platform-features";
import { FEATURE_META } from "@/lib/feature-meta";
import { getT } from "@/lib/i18n/server";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/** The operator's home (/root): the platform's features with their state, linking to /root/features (15 Oct 2026). */
export async function FeaturesCard() {
  const t = await getT();
  const on = await featuresOn();
  return (
    <Card data-testid="features-card">
      <CardHeader
        icon={<ToggleRightIcon weight="duotone" className="size-5" />}
        title={t("platformFeatures.cardTitle")}
        description={t("platformFeatures.cardIntro")}
        action={
          <Button asChild size="sm" variant="ghost">
            <Link href="/root/features">{t("platformFeatures.cardOpen")}</Link>
          </Button>
        }
      />
      <CardBody>
        <ul className="flex flex-wrap gap-2">
          {PLATFORM_FEATURES.map((code) => (
            <li key={code} className="flex items-center gap-1.5 rounded-[var(--radius-md)] border border-border px-2.5 py-1.5 text-sm">
              <span className="text-fg">{t(FEATURE_META[code].nameKey)}</span>
              <Badge size="sm" tone={on.includes(code) ? "ok" : "neutral"}>
                {on.includes(code) ? t("platformFeatures.running") : t("platformFeatures.off")}
              </Badge>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
