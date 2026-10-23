import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import type { TranslationKey } from "@edulink/i18n";
import { siteSummarySchema, type SiteCheck, type SiteEnquiryStatus } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { formatDate, formatDateTime } from "@/lib/dates";
import { openWeb } from "@/screens/family/shared";

export const WEBSITE_SUMMARY_PATH = "/api/v1/admin/site/summary";
export const WEBSITE_SUMMARY_KEY = ["admin", "site", "summary"] as const;

/** The "Ready: n of 7" list's words, the web editor's own. */
const CHECK_KEY: Record<SiteCheck, TranslationKey> = {
  LOGO: "siteEditor.checkLogo",
  ABOUT: "siteEditor.checkAbout",
  HERO_PICTURE: "siteEditor.checkHero",
  CONTACT: "siteEditor.checkContact",
  ADMISSIONS: "siteEditor.checkAdmissions",
  PICTURE_CONSENT: "siteEditor.checkConsent",
  DOMAIN: "siteEditor.checkDomain",
};
const STATUS_KEY: Record<SiteEnquiryStatus, TranslationKey> = { NEW: "website.enquiryNew", REPLIED: "siteEditor.enquiryReplied", CLOSED: "siteEditor.enquiryClosed" };

/**
 * THE SCHOOL'S WEBSITE AT A GLANCE (website-three, 17 October 2026), for the office and the head, READ-ONLY: whether it
 * is a draft or published (and since when, with any changes not yet published), its live address on the school's own
 * domain, the "Ready: n of 7" list, the enquiries waiting with the newest three, and the page views of the last thirty
 * days — GET /api/v1/admin/site/summary. Building and changing the site is the web editor's, one tap away ("Edit on the
 * web"); the phone writes nothing here.
 */
export function StaffWebsite() {
  const t = useT();
  const role = useRole();
  const router = useRouter();
  // The office alone asks the server (23 Oct 2026): while the role is still unknown nothing is asked and the screen
  // waits, so another role's visit never sends the summary request (the test caught it firing once in that moment).
  const office = role === "ADMIN" || role === "PRINCIPAL";
  const query = useQuery({ queryKey: WEBSITE_SUMMARY_KEY, enabled: office, queryFn: async () => siteSummarySchema.parse(unwrap(await api().get(WEBSITE_SUMMARY_PATH))) });
  const d = query.data;
  const edit = <Button label={t("siteThree.phoneEdit")} onPress={() => openWeb(d?.editPath ?? "/admin/website")} />;
  if (role === null) {
    return (
      <Screen title={t("modules.websiteName")}>
        <Loading />
      </Screen>
    );
  }
  if (!office) {
    return (
      <Screen title={t("modules.websiteName")}>
        <Empty icon="globe" title={t("modules.websiteName")} body={t("siteThree.phoneNotOffice")} action={<Button label={t("nav.overview")} variant="secondary" onPress={() => router.push("/(app)" as never)} />} />
      </Screen>
    );
  }
  return (
    <Screen title={t("modules.websiteName")} description={t("siteThree.phoneIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <Card title={d.state === "PUBLISHED" && d.publishedAt ? t("siteThree.phoneStatePublished", { date: formatDate(d.publishedAt) }) : t("siteThree.phoneStateDraft")}>
            {d.state === "PUBLISHED" && d.unpublishedChanges ? (
              <Text variant="sm" tone="muted">
                {t("siteThree.phoneUnpublished")}
              </Text>
            ) : null}
            <Text variant="sm">{d.address ? t("siteThree.phoneAddress", { address: d.address }) : t("siteThree.phoneNoAddress")}</Text>
            {edit}
          </Card>
          <Card title={t("siteThree.phoneReady", { done: d.ready.done, total: d.ready.total })}>
            {d.checklist.map((c) => (
              <Row key={c.code} icon={c.done ? "check" : "circle"} title={t(CHECK_KEY[c.code])} label={`${t(c.done ? "siteEditor.checkDone" : "siteEditor.checkMissing")} ${t(CHECK_KEY[c.code])}`} />
            ))}
          </Card>
          <Card title={t("siteThree.phoneEnquiries")}>
            {d.enquiries.total === 0 ? (
              <Empty icon="envelope" title={t("siteThree.phoneEnquiriesNone")} body={t("siteThree.phoneIntro")} action={edit} />
            ) : (
              <>
                <Text variant="sm" bold>
                  {t("siteThree.phoneEnquiriesCount", { count: d.enquiries.newCount, total: d.enquiries.total })}
                </Text>
                {d.enquiries.newest.map((e) => (
                  <Row key={e.id} title={e.name} caption={[t(STATUS_KEY[e.status]), formatDateTime(e.createdAt), e.wantsVisit ? t("siteEditor.enquiryWantsVisit") : null].filter(Boolean).join(" · ")} />
                ))}
              </>
            )}
          </Card>
          <Card title={t("siteThree.phoneVisits")}>
            <Stat label={t("siteThree.phoneVisits")} value={t("siteThree.phoneVisitsTotal", { count: d.visits.total })} />
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
