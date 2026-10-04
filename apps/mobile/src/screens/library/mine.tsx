import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { familyChildrenSchema, isCollegeKind, libraryCatalogueSchema, libraryMineSchema, libraryReservationSchema } from "@edulink/contracts";
import { formatPaise } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useRole, useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Notice } from "../staff/shared";
import { ChildSwitcher, childQuery } from "../family/shared";
import { FINE_REASON_KEY, FINE_STATUS_KEY, dayOf } from "./words";

/**
 * A member's own library on the phone (module LIBRARY, 3 Oct 2026) — the
 * web's /student/library, /teacher/library and /parent/library: what is out
 * and when it is due, fines and how they are paid, the place in the queue
 * (to leave), and the catalogue to search and reserve from. A guardian picks
 * the child; the server reaches only their own.
 */
export function MyLibraryScreen() {
  const t = useT();
  const { locale } = useLocale();
  const th = useTheme();
  const role = useRole();
  const router = useRouter();
  const session = useSession();
  const qc = useQueryClient();
  const [childId, setChildId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [asked, setAsked] = useState("");
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const parent = role === "PARENT";
  const children = useQuery({ queryKey: ["family", "children"], enabled: parent, queryFn: async () => familyChildrenSchema.parse(unwrap(await api().get("/api/v1/family/children"))) });
  const qs = childQuery(childId);
  const mine = useQuery({ queryKey: ["library", "mine", childId], queryFn: async () => libraryMineSchema.parse(unwrap(await api().get(`/api/v1/library/mine${qs}`))) });
  const catalogue = useQuery({
    queryKey: ["library", "catalogue", childId, asked],
    queryFn: async () => libraryCatalogueSchema.parse(unwrap(await api().get(`/api/v1/library/titles${childQuery(childId, { q: asked || null })}`))),
  });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["library"] });
  const reserve = useMutation({
    mutationFn: async (titleId: string) => libraryReservationSchema.parse(unwrap(await api().post("/api/v1/library/reservations", { titleId, ...(childId ? { childId } : {}) }))),
    onSuccess: (r) => {
      setNotice({ tone: "ok", text: r.ready ? t("library.reservedReady", { title: r.title }) : t("library.reservedPlace", { title: r.title, position: r.position }) });
      refresh();
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  const leave = useMutation({
    mutationFn: async (id: string) => libraryReservationSchema.parse(unwrap(await api().post(`/api/v1/library/reservations/${id}/cancel`, {}))),
    onSuccess: () => {
      setNotice({ tone: "ok", text: t("library.reservationCancelled") });
      refresh();
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  const offHere = session.status === "signed-in" && !parent && !(session.me.modules ?? []).includes("LIBRARY");
  if (offHere) {
    return (
      <Screen title={t("modules.libraryName")}>
        <Empty icon="puzzle" title={t("modules.offTitle", { module: t("modules.libraryName") })} body={t("modules.offBody", { module: t("modules.libraryName") })} action={<Button label={t("nav.more")} variant="secondary" onPress={() => router.push("/(app)/more" as never)} />} />
      </Screen>
    );
  }
  const d = mine.data;
  const open = d?.loans.filter((l) => !l.returnedAt) ?? [];
  return (
    <Screen title={t("modules.libraryName")} description={d ? (parent ? t("library.childIntro", { name: d.name }) : t("library.mineIntro", { limit: d.limit })) : undefined} refreshing={mine.isRefetching} onRefresh={() => void mine.refetch()}>
      {parent ? <ChildSwitcher pupils={children.data?.children ?? []} selectedId={childId} onSelect={setChildId} /> : null}
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {mine.isPending ? <Loading /> : null}
      {mine.isError ? <Failed message={mine.error.message} onRetry={() => void mine.refetch()} /> : null}
      {d ? (
        <>
          <Card title={t("library.onLoanTitle")}>
            {open.length === 0 ? <Text tone="muted">{t("library.noLoans")}</Text> : null}
            {open.map((l) => (
              <Row key={l.id} title={l.title} caption={`${t("library.dueOn", { date: dayOf(l.dueOn, locale) })}${l.overdueDays > 0 ? ` · ${t("library.daysLate", { days: l.overdueDays })}` : ""}`} />
            ))}
          </Card>
          {d.reservations.length > 0 ? (
            <Card title={t("library.reservationsTitle")}>
              {d.reservations.map((r) => (
                <Row
                  key={r.id}
                  title={r.title}
                  caption={r.ready ? t("library.readyAtDesk", { accession: r.readyAccession ?? "" }) : t("library.inQueue", { position: r.position })}
                  right={<Button label={t("library.leaveQueue")} variant="ghost" disabled={leave.isPending} onPress={() => leave.mutate(r.id)} />}
                />
              ))}
            </Card>
          ) : null}
          {d.fines.length > 0 ? (
            <Card title={t("library.finesTitle")}>
              <Text variant="sm" tone="muted">
                {t("library.finesFamilyHint")}
              </Text>
              {d.fines.map((f) => (
                <Row key={f.id} title={`${formatPaise(f.paise, locale)} · ${t(FINE_REASON_KEY[f.reason])}`} caption={`${f.title} · ${t(FINE_STATUS_KEY[f.status])}${f.status === "DUE" ? ` · ${f.onLedger ? t("library.onLedger") : t("library.atCounter")}` : ""}`} />
              ))}
            </Card>
          ) : null}
        </>
      ) : null}
      <Card title={t("library.catalogueTitle")}>
        <View style={{ gap: th.space[2] }}>
          <Field label={t("library.searchLabel")} hint={t("library.catalogueHint")} value={q} onChangeText={setQ} returnKeyType="search" onSubmitEditing={() => setAsked(q.trim())} />
          <Button label={t("library.search")} variant="secondary" onPress={() => setAsked(q.trim())} />
        </View>
        {catalogue.isPending ? <Loading /> : null}
        {catalogue.isError ? <Failed message={catalogue.error.message} onRetry={() => void catalogue.refetch()} /> : null}
        {catalogue.data && catalogue.data.items.length === 0 ? <Text tone="muted">{asked ? t("library.noTitlesSearch") : t("library.noTitlesBody")}</Text> : null}
        {catalogue.data?.items.map((b) => (
          <Row
            key={b.id}
            title={b.title}
            caption={[b.author, b.available > 0 ? t("library.onShelf", { count: b.available, of: b.copies }) : t("library.allOut", { of: b.copies }), b.waiting > 0 ? t("library.waiting", { count: b.waiting }) : null].filter(Boolean).join(" · ")}
            right={b.copies > 0 ? <Button label={t("library.reserve")} variant="secondary" disabled={reserve.isPending} onPress={() => reserve.mutate(b.id)} /> : undefined}
          />
        ))}
      </Card>
      {role === "STUDENT" && session.status === "signed-in" && isCollegeKind(session.me.institutionKind) ? (
        // A college student's e-resources, opened through the app so each open counts (campaign 2026-10-04, G-3).
        <Button label={t("collegeOffice.eResourcesTitle")} variant="secondary" onPress={() => router.push("/(app)/e-resources" as never)} />
      ) : null}
    </Screen>
  );
}
