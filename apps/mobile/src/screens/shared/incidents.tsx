import type { ReactNode } from "react";
import { View } from "react-native";
import type { IncidentKind, IncidentSeverity, IncidentView } from "@edulink/contracts";
import type { Translate, TranslationKey } from "@edulink/i18n";
import { Card, Text } from "@/components";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { formatInstant, Pill } from "../family/shared";

/**
 * What the incident log looks like on both sides of the phone: the words
 * for a kind and a severity, the badges a row and a detail lead with, the
 * facts under the title (when, where, who recorded it, whether the family
 * was told), and the follow-up notes as the guardian reads them, read-only.
 * The staff detail adds the note form and the close button on top of this;
 * the family screen shows exactly this and nothing more.
 */
const KIND_KEY: Record<IncidentKind, TranslationKey> = {
  INJURY: "incidents.kindInjury",
  ILLNESS: "incidents.kindIllness",
  BEHAVIOUR: "incidents.kindBehaviour",
  SAFEGUARDING: "incidents.kindSafeguarding",
  OTHER: "incidents.kindOther",
};
const SEVERITY_KEY: Record<IncidentSeverity, TranslationKey> = {
  MINOR: "incidents.severityMinor",
  MODERATE: "incidents.severityModerate",
  SERIOUS: "incidents.severitySerious",
};
const SEVERITY_TONE: Record<IncidentSeverity, "muted" | "warn" | "danger"> = { MINOR: "muted", MODERATE: "warn", SERIOUS: "danger" };

export function kindLabel(t: Translate, kind: IncidentKind): string {
  return t(KIND_KEY[kind]);
}
export function severityLabel(t: Translate, severity: IncidentSeverity): string {
  return t(SEVERITY_KEY[severity]);
}
export function severityTone(severity: IncidentSeverity): "muted" | "warn" | "danger" {
  return SEVERITY_TONE[severity];
}

/** The day and the time, with the year: an incident is read months later. */
export function whenLabel(iso: string, locale: string): string {
  return formatInstant(iso, locale, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

/** Kind, severity and open/closed as three pills in a row. */
export function IncidentBadges({ kind, severity, status }: { kind: IncidentKind; severity: IncidentSeverity; status: "OPEN" | "CLOSED" }) {
  const t = useT();
  const th = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
      <Pill label={kindLabel(t, kind)} tone="accent" />
      <Pill label={severityLabel(t, severity)} tone={severityTone(severity)} />
      <Pill label={status === "OPEN" ? t("incidents.open") : t("incidents.closed")} tone={status === "OPEN" ? "ok" : "muted"} />
    </View>
  );
}

/** One labelled line, said as one thing to a screen reader. */
function Fact({ label, value }: { label: string; value: string }) {
  const th = useTheme();
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={{ gap: 2, paddingVertical: th.space[1] }}>
      <Text variant="xs" bold tone="subtle" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Text>
      <Text variant="base">{value}</Text>
    </View>
  );
}

/** The whole record below the badges: when and where, who recorded it, what happened, what was done, whether the family was told, and the closed line. */
export function IncidentRecord({ incident }: { incident: IncidentView }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  return (
    <View style={{ gap: th.space[1] }}>
      <Fact label={t("incidents.occurredAt")} value={whenLabel(incident.occurredAt, locale)} />
      {incident.place ? <Fact label={t("incidents.place")} value={incident.place} /> : null}
      <Fact label={t("incidents.body")} value={incident.body} />
      {incident.actionTaken ? <Fact label={t("incidents.actionTaken")} value={incident.actionTaken} /> : null}
      <Text variant="xs" tone="muted">
        {t("incidents.reportedBy", { name: incident.reportedByName })}
      </Text>
      <Text variant="xs" tone={incident.guardiansNotifiedAt ? "ok" : "warn"} bold>
        {incident.guardiansNotifiedAt ? t("incidents.familyTold", { when: whenLabel(incident.guardiansNotifiedAt, locale) }) : t("incidents.familyNotTold")}
      </Text>
      {incident.status === "CLOSED" && incident.closedAt ? (
        <Text variant="xs" tone="muted">
          {t("incidents.closed_by", { when: whenLabel(incident.closedAt, locale), name: incident.closedByName ?? "" })}
        </Text>
      ) : null}
    </View>
  );
}

/** The follow-up notes, oldest first as the server sends them; `footer` is the staff note form. `bare` draws them as a section inside a card the caller owns. */
export function IncidentNotes({ notes, footer, bare }: { notes: IncidentView["notes"]; footer?: ReactNode; bare?: boolean }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const body = (
    <>
      {notes.length === 0 ? (
        <Text variant="sm" tone="subtle">
          {t("incidents.noNotes")}
        </Text>
      ) : (
        notes.map((n) => (
          <View key={n.id} accessible accessibilityLabel={`${n.authorName}, ${whenLabel(n.createdAt, locale)}: ${n.body}`} style={{ gap: 2, paddingVertical: th.space[1], borderTopWidth: 1, borderTopColor: th.border }}>
            <Text variant="xs" tone="muted">
              {n.authorName} · {whenLabel(n.createdAt, locale)}
            </Text>
            <Text variant="sm">{n.body}</Text>
          </View>
        ))
      )}
      {footer}
    </>
  );
  if (bare) {
    return (
      <View style={{ gap: th.space[1], paddingTop: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
        <Text variant="base" bold accessibilityRole="header">
          {t("incidents.notes")}
        </Text>
        {body}
      </View>
    );
  }
  return <Card title={t("incidents.notes")}>{body}</Card>;
}
