import type { IncidentView } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { formatInZone } from "@/lib/dates";
import { INCIDENT_KIND_KEY, INCIDENT_SEVERITY_KEY, INCIDENT_SEVERITY_TONE } from "@/lib/incident-labels";
import { getLocale, getT } from "@/lib/i18n/server";

/**
 * The parts of one incident that read the same for everybody who may see
 * it — the staff record at /incidents/[id] and the family's card on
 * /parent/incidents — so what the office wrote and what the family reads
 * are one rendering. Server components: the words come from getT.
 */

export async function IncidentBadges({ kind, severity }: Pick<IncidentView, "kind" | "severity">) {
  const t = await getT();
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Badge tone="accent" size="sm">
        {t(INCIDENT_KIND_KEY[kind])}
      </Badge>
      <Badge tone={INCIDENT_SEVERITY_TONE[severity]} size="sm">
        {t(INCIDENT_SEVERITY_KEY[severity])}
      </Badge>
    </span>
  );
}

/** When, where, who recorded it, whether the family was told, and the closing line. */
export async function IncidentMeta({ incident, timezone, showReporter = true }: { incident: IncidentView; timezone: string; showReporter?: boolean }) {
  const t = await getT();
  const locale = await getLocale();
  const when = (iso: string) => formatInZone(new Date(iso), timezone, { dateStyle: "medium", timeStyle: "short" }, locale);
  return (
    <div className="space-y-1.5 text-sm">
      <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[minmax(6rem,auto)_1fr]">
        <dt className="text-fg-muted">{t("incidents.occurredAt")}</dt>
        <dd className="text-fg">{when(incident.occurredAt)}</dd>
        {incident.place && (
          <>
            <dt className="text-fg-muted">{t("incidents.place")}</dt>
            <dd className="text-fg">{incident.place}</dd>
          </>
        )}
      </dl>
      {showReporter && <p className="text-fg-muted">{t("incidents.reportedBy", { name: incident.reportedByName })}</p>}
      <p>
        {incident.guardiansNotifiedAt ? (
          <Badge tone="ok" size="sm">
            {t("incidents.familyTold", { when: when(incident.guardiansNotifiedAt) })}
          </Badge>
        ) : (
          <Badge tone="warn" size="sm">
            {t("incidents.familyNotTold")}
          </Badge>
        )}
      </p>
      {incident.status === "CLOSED" && incident.closedAt && (
        <p className="text-fg-muted">{t("incidents.closed_by", { when: when(incident.closedAt), name: incident.closedByName ?? "" })}</p>
      )}
    </div>
  );
}

/** What happened and what was done, as written, line breaks kept. */
export async function IncidentBodies({ incident }: { incident: IncidentView }) {
  const t = await getT();
  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-sm font-semibold text-fg">{t("incidents.body")}</h3>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-fg">{incident.body}</p>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-fg">{t("incidents.actionTaken")}</h3>
        {incident.actionTaken ? (
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-fg">{incident.actionTaken}</p>
        ) : (
          <p className="mt-1 text-sm text-fg-subtle">{t("health.none")}</p>
        )}
      </section>
    </div>
  );
}

/** The follow-up notes, oldest first, read-only. */
export async function IncidentNotes({ notes, timezone }: { notes: IncidentView["notes"]; timezone: string }) {
  const t = await getT();
  const locale = await getLocale();
  if (notes.length === 0) return <p className="text-sm text-fg-subtle">{t("incidents.noNotes")}</p>;
  return (
    <ol className="space-y-3">
      {notes.map((note) => (
        <li key={note.id} className="rounded-[--radius-md] border border-border bg-surface/60 px-3.5 py-2.5">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">{note.body}</p>
          <p className="mt-1 text-xs text-fg-muted">
            {note.authorName ? `${note.authorName} · ` : ""}
            {formatInZone(new Date(note.createdAt), timezone, { dateStyle: "medium", timeStyle: "short" }, locale)}
          </p>
        </li>
      ))}
    </ol>
  );
}
