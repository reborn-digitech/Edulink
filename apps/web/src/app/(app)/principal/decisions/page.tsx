import type { Metadata } from "next";
import { ScalesIcon } from "@phosphor-icons/react/ssr";
import { DECISION_KINDS, type DecisionKind } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { listDecisions } from "@/lib/decision-log";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { getLocale, getT } from "@/lib/i18n/server";
import { dateKeyInZone } from "@/lib/dates";
import { DECISION_KIND_KEY } from "@/lib/decision-kinds";
import { DecisionList } from "./decision-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("decisions.title") };
}

const MONTH = /^\d{4}-\d{2}$/;

/** The first and last day keys of a YYYY-MM month. */
function monthBounds(month: string): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, "0")}` };
}

/**
 * The head's decision log: what they decided, one sentence per decision,
 * newest first. Read-only — the rows are the audit log's, written by the
 * decisions themselves (lib/decision-log.ts). The office reads the head's.
 */
export default async function PrincipalDecisionsPage({ searchParams }: { searchParams: Promise<{ kind?: string; month?: string }> }) {
  const { kind: rawKind, month: rawMonth } = await searchParams;
  const t = await getT();
  const locale = await getLocale();
  const ctx = await requireRole("PRINCIPAL", "ADMIN");
  const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } });

  const kind = (DECISION_KINDS as readonly string[]).includes(rawKind ?? "") ? (rawKind as DecisionKind) : undefined;
  const month = rawMonth && MONTH.test(rawMonth) ? rawMonth : undefined;
  const range = month ? monthBounds(month) : {};
  const query = { ...range, ...(kind ? { kind } : {}) };
  const page = await listDecisions(ctx, { ...query, limit: 30 });

  // The last twelve months, in the school's day, newest first.
  const today = dateKeyInZone(new Date(), school.timezone);
  const [ty, tm] = today.split("-").map(Number) as [number, number];
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(ty, tm - 1 - i, 1));
    const key = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString(locale === "en" ? "en-IN" : `${locale}-IN-u-nu-latn`, { month: "long", year: "numeric", timeZone: "UTC" });
    return { value: key, label };
  });

  const narrowed = Boolean(kind || month);

  return (
    <div className="space-y-5">
      <PageHeader title={page.own ? t("decisions.title") : t("decisions.headsTitle")} description={page.own ? t("decisions.intro") : t("decisions.headsIntro")} />

      <DataToolbar
        facets={[
          {
            key: "kind",
            label: t("decisions.kindFilter"),
            value: kind ?? "",
            as: "select",
            options: [{ value: "", label: t("decisions.allKinds") }, ...DECISION_KINDS.map((k) => ({ value: k, label: t(DECISION_KIND_KEY[k]) }))],
          },
          {
            key: "month",
            label: t("decisions.monthFilter"),
            value: month ?? "",
            as: "select",
            options: [{ value: "", label: t("decisions.allMonths") }, ...months],
          },
        ]}
        labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
      />

      {page.items.length === 0 ? (
        <EmptyState
          icon={<ScalesIcon weight="duotone" className="size-8" />}
          title={narrowed ? t("common.noResultsTitle") : page.own ? t("decisions.empty") : t("decisions.emptyHeads")}
          description={narrowed ? t("common.noResultsBody") : page.own ? t("decisions.emptyBody") : undefined}
        />
      ) : (
        <Card>
          <DecisionList initial={page} query={query} />
        </Card>
      )}
    </div>
  );
}
