import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccessError, requireUser } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { healthCardFor } from "@/lib/health";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { PrintButton } from "@/app/certificate/[recordId]/print-button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("health.printTitle"), robots: { index: false, follow: false } };
}

/**
 * The health card as a document: the laminated card in the school bag, the
 * sheet on the trip leader's clipboard. Only what somebody needs in the
 * minute that matters — blood group, allergies, conditions, medicines, who
 * to call, the doctor — and the date it was printed, because a card is only
 * as good as its date.
 *
 * WHO MAY OPEN IT is settled in `healthCardFor`: the office and the head,
 * the child's own teachers, and the child's guardians. Anybody else, and
 * any guessed id, gets the same 404; the signed-out are sent to sign in.
 * No shell, no nav: a document for printing.
 */
export default async function HealthCardPrintPage({ params }: { params: Promise<{ membershipId: string }> }) {
  const session = await requireUser();
  const t = await getT();
  const locale = await getLocale();
  const latin = locale === "en";
  const { membershipId } = await params;

  let view;
  try {
    view = await healthCardFor(session, membershipId);
  } catch (error) {
    if (error instanceof AccessError) notFound();
    throw error;
  }

  const member = await db.membership.findUnique({
    where: { id: membershipId },
    select: { school: { select: { name: true, timezone: true, city: true, contactPhone: true, logoPath: true } } },
  });
  if (!member) notFound();
  const school = member.school;
  const card = view.card;
  const dash = "—";
  const none = t("health.none");
  const backHref = session.role === "PARENT" ? `/parent/health?child=${membershipId}` : `/people/${membershipId}`;

  const facts: { label: string; value: string; strong?: boolean }[] = [
    { label: t("health.bloodGroup"), value: card?.bloodGroup ?? t("health.bloodGroupUnknown"), strong: true },
    { label: t("health.allergies"), value: card?.allergies || none, strong: Boolean(card?.allergies) },
    { label: t("health.conditions"), value: card?.conditions || none, strong: Boolean(card?.conditions) },
    { label: t("health.medications"), value: card?.medications || none },
    { label: t("health.dietary"), value: card?.dietary || none },
    { label: t("health.notes"), value: card?.notes || none },
  ];

  return (
    <div className="min-h-safe bg-bg px-4 py-6 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-3 print:hidden">
        <Link href={backHref} className="text-sm font-medium text-fg-muted underline underline-offset-2 hover:text-fg">
          ← {t("health.openCard")}
        </Link>
        <PrintButton label={t("health.print")} />
      </div>

      <article
        data-testid="health-card-print"
        className="mx-auto max-w-[210mm] rounded-[var(--radius-lg)] border border-border bg-white p-10 text-[#111] shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        <header className="flex items-start gap-4 border-b-2 border-[#111] pb-4">
          {school.logoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/files/${school.logoPath}`} alt="" className="size-16 object-contain" />
          ) : null}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{school.name}</h1>
            {school.city && <p className="text-sm text-[#444]">{school.city}</p>}
            {school.contactPhone && <p className="text-sm text-[#444]">{school.contactPhone}</p>}
          </div>
          <p className="text-right text-xs text-[#444]">{t("health.printedOn", { date: formatDate(new Date(), school.timezone) })}</p>
        </header>

        <h2 className={`mt-8 text-center text-xl font-bold uppercase ${latin ? "tracking-[0.2em]" : ""}`}>{t("health.printTitle")}</h2>

        <p className="mt-6 text-center">
          <span className="block text-2xl font-bold" data-testid="health-card-name">
            {view.studentName}
          </span>
          {view.className && <span className="block text-sm text-[#444]">{view.className}</span>}
        </p>

        {!card && <p className="mt-6 text-center text-sm text-[#444]">{t("health.nothingOnCard")}</p>}

        <dl className="mt-6 grid grid-cols-[minmax(10rem,auto)_1fr] border-t border-[#bbb] text-sm">
          {facts.map((row) => (
            <div key={row.label} className="contents">
              <dt className="border-b border-[#ddd] py-2 pr-4 text-[#444]">{row.label}</dt>
              <dd className={`whitespace-pre-wrap border-b border-[#ddd] py-2 ${row.strong ? "text-base font-bold" : "font-medium"}`}>{row.value}</dd>
            </div>
          ))}
        </dl>

        <h3 className={`mt-8 text-xs font-semibold uppercase text-[#444] ${latin ? "tracking-widest" : ""}`}>{t("health.contacts")}</h3>
        {card && card.contacts.length > 0 ? (
          <ol className="mt-2 list-decimal space-y-1 pl-6 text-sm">
            {card.contacts.map((c, i) => (
              <li key={i}>
                <span className="font-bold">{c.name}</span>
                {c.relation ? <span className="text-[#444]"> · {c.relation}</span> : null}
                <span className="text-[#444]"> · </span>
                <span className="font-mono">{c.phone}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-[#444]">{none}</p>
        )}

        <dl className="mt-6 grid grid-cols-[minmax(10rem,auto)_1fr] text-sm">
          <dt className="py-1 pr-4 text-[#444]">{t("health.doctor")}</dt>
          <dd className="py-1 font-medium">{card && (card.doctorName || card.doctorPhone) ? [card.doctorName, card.doctorPhone].filter(Boolean).join(" · ") : dash}</dd>
        </dl>

        {card && (
          <p className="mt-8 border-t border-[#bbb] pt-3 text-[0.7rem] leading-relaxed text-[#666]">
            {t("health.lastUpdated", { when: formatDate(new Date(card.updatedAt), school.timezone), by: card.updatedByName ? t("health.byName", { name: card.updatedByName }) : "" })}
          </p>
        )}
      </article>
    </div>
  );
}
