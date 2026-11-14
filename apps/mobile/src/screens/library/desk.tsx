import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { libraryLookupSchema, libraryLoanSchema, libraryMemberSearchSchema, libraryNoticesResultSchema, libraryOverdueSchema, libraryReservationsSchema, libraryReturnResultSchema, libraryStockTakeSchema, type LibraryLookup, type LibraryStockTake } from "@edulink/contracts";
import { formatPaise } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Chips, Notice } from "../staff/shared";
import { Confirm } from "../family/shared";
import { ModuleRoleHome } from "../modules/role-home";
import { COPY_STATUS_KEY, dayOf } from "./words";

type Mode = "desk" | "overdue" | "queue" | "stock";

/**
 * The library desk on the phone (module LIBRARY, 3 Oct 2026) — the
 * LIBRARIAN's home, the web's /library. A scan field (typed, or filled by a
 * barcode reader that types): a copy on loan is taken back, a copy on the
 * shelf is lent to a member found by name; the overdue list with one button
 * that tells the borrowers; the queue; and the stock-take, marking copies
 * seen. The camera scan is not here: it waits for a barcode module whose
 * weight the bundle can carry. Switched off, the home says so.
 */
export function LibraryDesk() {
  const session = useSession();
  const t = useT();
  const [mode, setMode] = useState<Mode>("desk");
  const on = session.status === "signed-in" && (session.me.modules ?? []).includes("LIBRARY");
  if (!on) return <ModuleRoleHome role="LIBRARIAN" />;
  return (
    <Screen title={t("modules.libraryName")} description={t("library.deskIntro")}>
      <Chips
        label={t("library.deskNav")}
        value={mode}
        onChange={setMode}
        options={[
          { value: "desk", label: t("library.tabDesk") },
          { value: "overdue", label: t("library.tabOverdue") },
          { value: "queue", label: t("library.tabReservations") },
          { value: "stock", label: t("library.tabStockTake") },
        ]}
      />
      {mode === "desk" ? <Desk /> : mode === "overdue" ? <Overdue onDesk={() => setMode("desk")} /> : mode === "queue" ? <Queue onDesk={() => setMode("desk")} /> : <StockTake />}
    </Screen>
  );
}

function Desk() {
  const t = useT();
  const { locale } = useLocale();
  const th = useTheme();
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [who, setWho] = useState("");
  const [whoAsked, setWhoAsked] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const found = useQuery({
    queryKey: ["library", "lookup", asked],
    enabled: Boolean(asked),
    queryFn: async () => libraryLookupSchema.parse(unwrap(await api().get(`/api/v1/library/lookup?code=${encodeURIComponent(asked!)}`))),
  });
  const people = useQuery({
    queryKey: ["library", "members", whoAsked],
    enabled: Boolean(whoAsked),
    queryFn: async () => libraryMemberSearchSchema.parse(unwrap(await api().get(`/api/v1/library/members?q=${encodeURIComponent(whoAsked!)}`))),
  });
  const done = (text: string) => {
    setNotice({ tone: "ok", text });
    setWho("");
    setWhoAsked(null);
    void qc.invalidateQueries({ queryKey: ["library"] });
  };
  const refused = (e: Error) => setNotice({ tone: "danger", text: e.message });
  const giveBack = useMutation({
    mutationFn: async (accession: string) => libraryReturnResultSchema.parse(unwrap(await api().post("/api/v1/library/returns", { accession }))),
    onSuccess: (r) => done(r.heldFor ? t("library.returnedHeld", { title: r.loan.title, name: r.heldFor.memberName }) : r.fine ? t("library.returnedFine", { title: r.loan.title }) : t("library.returnedOk", { title: r.loan.title })),
    onError: refused,
  });
  const lend = useMutation({
    mutationFn: async (input: { accession: string; membershipId: string }) => libraryLoanSchema.parse(unwrap(await api().post("/api/v1/library/issues", input))),
    onSuccess: (l) => done(t("library.lentTo", { title: l.title, name: l.memberName, due: dayOf(l.dueOn, locale) })),
    onError: refused,
  });
  const copy: LibraryLookup["copy"] = found.data?.copy ?? null;
  // The box is emptied once a code is looked up (TA-355): a barcode reader that types added the next code to the last.
  const find = () => {
    setAsked(code.trim());
    setCode("");
  };
  return (
    <View style={{ gap: th.space[3] }}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      <Card title={t("library.scanTitle")}>
        <Field label={t("library.codeLabel")} hint={t("library.scanHint")} value={code} onChangeText={setCode} autoCapitalize="characters" autoCorrect={false} onSubmitEditing={() => code.trim() && find()} />
        <Button label={t("library.find")} disabled={!code.trim()} onPress={find} />
      </Card>
      {found.isPending && asked ? <Loading /> : null}
      {found.isError ? <Failed message={found.error.message} onRetry={() => void found.refetch()} /> : null}
      {found.data?.kind === "NONE" ? <Text tone="muted">{t("library.nothingHasCode", { code: asked ?? "" })}</Text> : null}
      {found.data?.kind === "MEMBER" && found.data.member ? (
        <Card title={found.data.member.name}>
          <Text variant="sm" tone="muted">
            {[found.data.member.className, t("library.holding", { count: found.data.member.onLoan, limit: found.data.member.limit }), found.data.member.owedPaise ? t("library.owes", { amount: formatPaise(found.data.member.owedPaise, locale) }) : null].filter(Boolean).join(" · ")}
          </Text>
        </Card>
      ) : null}
      {found.data?.kind === "TITLE" && found.data.title ? (
        <Card title={found.data.title.title}>
          <Text variant="sm" tone="muted">
            {t("library.onShelf", { count: found.data.title.available, of: found.data.title.copies })}
          </Text>
        </Card>
      ) : null}
      {copy ? (
        <Card title={`${copy.title} · ${copy.accession}`}>
          <Text variant="sm" tone="muted">
            {[t(COPY_STATUS_KEY[copy.status]), copy.borrowerName && copy.dueOn ? t("library.withDue", { name: copy.borrowerName, date: dayOf(copy.dueOn, locale) }) : null, copy.heldFor ? t("library.heldFor", { name: copy.heldFor }) : null].filter(Boolean).join(" · ")}
          </Text>
          {copy.status === "ISSUED" ? <Button label={t("library.takeBack")} busy={giveBack.isPending} onPress={() => giveBack.mutate(copy.accession)} /> : null}
          {copy.status === "AVAILABLE" ? (
            <View style={{ gap: th.space[2] }}>
              <Field label={t("library.lendToWho")} value={who} onChangeText={setWho} onSubmitEditing={() => who.trim() && setWhoAsked(who.trim())} />
              <Button label={t("library.findPerson")} variant="secondary" disabled={!who.trim()} onPress={() => setWhoAsked(who.trim())} />
              {people.data
                ? people.data.items.length === 0
                  ? <Text tone="muted">{t("library.noPeople")}</Text>
                  : people.data.items.map((p) => (
                      <Row
                        key={p.membershipId}
                        title={p.name}
                        caption={[p.className, t("library.holding", { count: p.onLoan, limit: p.limit })].filter(Boolean).join(" · ")}
                        right={<Button label={t("library.lend")} disabled={p.onLoan >= p.limit || lend.isPending} onPress={() => lend.mutate({ accession: copy.accession, membershipId: p.membershipId })} />}
                      />
                    ))
                : null}
            </View>
          ) : null}
        </Card>
      ) : null}
    </View>
  );
}

function Overdue({ onDesk }: { onDesk: () => void }) {
  const t = useT();
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const list = useQuery({ queryKey: ["library", "overdue"], queryFn: async () => libraryOverdueSchema.parse(unwrap(await api().get("/api/v1/library/overdue"))) });
  const send = useMutation({
    mutationFn: async () => libraryNoticesResultSchema.parse(unwrap(await api().post("/api/v1/library/overdue/notices", {}))),
    onSuccess: (r) => {
      setNotice(t("library.noticesSent", { sent: r.sent, already: r.already }));
      void qc.invalidateQueries({ queryKey: ["library", "overdue"] });
    },
  });
  if (list.isPending) return <Loading />;
  if (list.isError) return <Failed message={list.error.message} onRetry={() => void list.refetch()} />;
  if (list.data.items.length === 0) return <Empty icon="checks" title={t("library.nothingOverdue")} action={<Button label={t("library.tabDesk")} variant="secondary" onPress={onDesk} />} />;
  return (
    <>
      {notice ? <Notice text={notice} /> : null}
      {send.isError ? <Notice text={send.error.message} tone="danger" /> : null}
      <Button label={t("library.sendNotices")} busy={send.isPending} onPress={() => send.mutate()} />
      <Card title={t("library.overdueCount", { count: list.data.items.length })}>
        {list.data.items.map((l) => (
          <Row key={l.id} title={`${l.title} · ${l.accession}`} caption={`${l.memberName}${l.className ? ` (${l.className})` : ""} · ${t("library.dueOn", { date: dayOf(l.dueOn, locale) })} · ${t("library.daysLate", { days: l.overdueDays })}`} />
        ))}
      </Card>
    </>
  );
}

function Queue({ onDesk }: { onDesk: () => void }) {
  const t = useT();
  const list = useQuery({ queryKey: ["library", "queue"], queryFn: async () => libraryReservationsSchema.parse(unwrap(await api().get("/api/v1/library/reservations"))) });
  if (list.isPending) return <Loading />;
  if (list.isError) return <Failed message={list.error.message} onRetry={() => void list.refetch()} />;
  if (list.data.items.length === 0) return <Empty icon="calendar" title={t("library.noReservations")} action={<Button label={t("library.tabDesk")} variant="secondary" onPress={onDesk} />} />;
  return (
    <Card title={t("library.reservationsTitle")}>
      {list.data.items.map((r) => (
        <Row key={r.id} title={r.title} caption={`${r.memberName} · ${r.ready ? t("library.readyAtDesk", { accession: r.readyAccession ?? "" }) : t("library.inQueue", { position: r.position })}`} />
      ))}
    </Card>
  );
}

function StockTake() {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const [accession, setAccession] = useState("");
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  // Finish is asked first, and the copies its answer says were not seen stay on screen after it (TA-355): one tap ended
  // the take under Mark seen, and the list of missing copies went with it.
  const [asking, setAsking] = useState(false);
  const [missing, setMissing] = useState<LibraryStockTake["unseen"]>([]);
  const st = useQuery({ queryKey: ["library", "stocktake"], queryFn: async () => libraryStockTakeSchema.parse(unwrap(await api().get("/api/v1/library/stocktake"))) });
  const set = (data: unknown) => qc.setQueryData(["library", "stocktake"], libraryStockTakeSchema.parse(data));
  const action = useMutation({
    mutationFn: async (a: "START" | "FINISH") => unwrap(await api().post("/api/v1/library/stocktake", { action: a })),
    onSuccess: (data, a) => {
      set(data);
      setAsking(false);
      setMissing(a === "FINISH" ? libraryStockTakeSchema.parse(data).unseen : []);
      setNotice({ tone: "ok", text: a === "START" ? t("library.stockStarted") : t("library.stockFinished", { seen: (data as { seen: number }).seen, total: (data as { total: number }).total }) });
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  const seen = useMutation({
    mutationFn: async (a: string) => unwrap(await api().post("/api/v1/library/stocktake/seen", { accession: a })),
    onSuccess: (data, a) => {
      set(data);
      const d = data as { seen: number; total: number };
      setNotice({ tone: "ok", text: t("library.stockSeen", { accession: a, seen: d.seen, total: d.total }) });
      setAccession("");
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  if (st.isPending) return <Loading />;
  if (st.isError) return <Failed message={st.error.message} onRetry={() => void st.refetch()} />;
  const d = st.data;
  return (
    <View style={{ gap: th.space[3] }}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      <Card title={d.startedAt ? t("library.stockSeenCount") : t("library.stockNotRunning")}>
        <Text>{d.startedAt ? `${d.seen} / ${d.total}` : t("library.stockIntro")}</Text>
        {d.startedAt ? (
          <>
            <Field label={t("library.accession")} value={accession} onChangeText={setAccession} autoCapitalize="characters" autoCorrect={false} onSubmitEditing={() => accession.trim() && seen.mutate(accession.trim())} />
            <Button label={t("library.markSeen")} disabled={!accession.trim()} busy={seen.isPending} onPress={() => seen.mutate(accession.trim())} />
          </>
        ) : null}
        {d.startedAt && asking ? (
          <Confirm question={t("library.finishStockConfirm", { unseen: Math.max(0, d.total - d.seen) })} confirmLabel={t("library.finishStock")} cancelLabel={t("common.keep")} busy={action.isPending} onConfirm={() => action.mutate("FINISH")} onCancel={() => setAsking(false)} />
        ) : (
          <Button label={d.startedAt ? t("library.finishStock") : t("library.startStock")} variant={d.startedAt ? "secondary" : "primary"} busy={action.isPending} onPress={() => (d.startedAt ? setAsking(true) : action.mutate("START"))} />
        )}
      </Card>
      {!d.startedAt && missing.length > 0 ? (
        <Card title={t("library.stockMissingTitle")}>
          {missing.map((c) => (
            <Row key={c.accession} title={`${c.accession} · ${c.title}`} caption={c.rack ? t("library.rackShort", { rack: c.rack }) : undefined} />
          ))}
        </Card>
      ) : null}
      {d.startedAt && d.unseen.length > 0 ? (
        <Card title={t("library.notSeenYet")}>
          {d.unseen.map((c) => (
            <Row key={c.accession} title={`${c.accession} · ${c.title}`} caption={c.rack ? t("library.rackShort", { rack: c.rack }) : undefined} />
          ))}
        </Card>
      ) : null}
    </View>
  );
}
