import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { facultyRecordsSchema } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, ShowMore, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { usePrivateScreen } from "@/lib/private-screen";
import { Pill } from "../family/shared";
import { ModuleOffScreen, useModuleOn } from "@/screens/shared/desk";

/**
 * The faculty records on the phone (the parity batch, 10 Oct 2026, R-4),
 * the web's /admin/faculty-records read only: what NAAC, NIRF and AICTE
 * count about each teacher — designation, appointment, qualification,
 * NET/SET, years, the API score, publications and FDPs — and the
 * student-to-teacher ratio. The PAN is never here (the server sends its
 * last four to the office alone, and the phone does not draw them). The
 * office writes a record on the web.
 */
export function FacultyRecordsScreen() {
  // No screenshots while it is up (A3-S-12): teachers' records.
  usePrivateScreen();
  const t = useT();
  const on = useModuleOn("IQAC");
  const [q, setQ] = useState("");
  const query = useQuery({ queryKey: ["iqac", "faculty-records"], enabled: on, queryFn: async () => facultyRecordsSchema.parse(unwrap(await api().get("/api/v1/iqac/faculty-records"))) });
  if (!on) return <ModuleOffScreen title={t("iqac.facultyRecordsTitle")} module="IQAC" />;
  const d = query.data;
  const needle = q.trim().toLowerCase();
  const shown = (d?.items ?? []).filter((r) => !needle || r.name.toLowerCase().includes(needle));
  return (
    <Screen title={t("iqac.facultyRecordsTitle")} description={t("iqac.facultyRecordsIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <Text variant="sm" tone="muted">
          {t("iqac.ratioLine", { students: d.ratio.students, fullTime: d.ratio.fullTime })}
        </Text>
      ) : null}
      <Field label={t("common.searchLabel")} value={q} onChangeText={setQ} autoCorrect={false} returnKeyType="search" maxLength={60} />
      {d && d.items.length === 0 ? <Empty icon="users" title={t("deskParity.recordsNone")} body={t("deskParity.recordsNoneBody")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void query.refetch()} />} /> : null}
      {shown.length > 0 ? (
        <Card>
          <ShowMore items={shown}>
            {(page) =>
              page.map((r) => (
                <Row
                  key={r.membershipId}
                  title={r.name}
                  caption={[
                    r.designation ? t(`iqac.designation.${r.designation}` as TranslationKey) : null,
                    r.appointment ? t(`iqac.appointment.${r.appointment}` as TranslationKey) : null,
                    r.highestQualification ? t(`iqac.qualification.${r.highestQualification}` as TranslationKey) : null,
                    r.netSetQualified ? t("deskParity.netSet") : null,
                    r.experienceYears === null ? null : t("deskParity.yearsN", { n: r.experienceYears }),
                    t("deskParity.apiScore", { score: r.apiScore }),
                    t("deskParity.publicationsN", { n: r.publications }),
                    t("deskParity.fdpsN", { n: r.fdps }),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  right={r.complete ? undefined : <Pill label={t("deskParity.recordIncomplete")} tone="warn" />}
                />
              ))
            }
          </ShowMore>
        </Card>
      ) : null}
    </Screen>
  );
}
