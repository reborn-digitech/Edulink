import { useRef, useState, type RefObject } from "react";
import { TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminVacanciesSchema, okSchema, vacanciesBoardSchema, vacancyCreatedSchema, type AdminVacancies } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Icon, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useRole, useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Pill, relativeTime } from "../family/shared";
import { Chips, Notice } from "./shared";

type EmploymentType = "FULL_TIME" | "PART_TIME" | "TEMPORARY";
type TypeFilter = "" | EmploymentType;
type Status = "open" | "closed" | "all";
export type VacancyCreateBody = { title: string; body: string; subjects: string[]; employmentType: EmploymentType; hiringContactMembershipId: string };

const EMPLOYMENT_TYPE: Record<EmploymentType, TranslationKey> = { FULL_TIME: "vacancies.typeFullTime", PART_TIME: "vacancies.typePartTime", TEMPORARY: "vacancies.typeTemporary" };
const TYPES: EmploymentType[] = ["FULL_TIME", "PART_TIME", "TEMPORARY"];

function typeLabel(t: ReturnType<typeof useT>, type: string): string {
  return t(EMPLOYMENT_TYPE[type as EmploymentType] ?? "vacancies.typeFullTime");
}

/**
 * Vacancies: a teacher reads the platform-wide board and opens a post to ask;
 * the office and the head read their school's desk — what it has posted, what
 * each post has drawn — and may read the board too; posting a new one with
 * themselves as the hiring contact, and closing one after a confirm, are the
 * admin's, so the head sees neither the form nor the button.
 */
export function Vacancies() {
  const role = useRole();
  const t = useT();
  const [tab, setTab] = useState<"desk" | "board">("desk");
  if (role === null)
    return (
      <Screen title={t("vacancies.title")}>
        <Loading />
      </Screen>
    );
  if (role === "TEACHER") return <Board />;
  return tab === "desk" ? <Desk onBoard={() => setTab("board")} /> : <Board onDesk={() => setTab("desk")} />;
}

function DeskTabs({ tab, onTab }: { tab: "desk" | "board"; onTab: (next: "desk" | "board") => void }) {
  const t = useT();
  return (
    <Chips
      label={t("nav.vacancies")}
      value={tab}
      options={[
        { value: "desk", label: t("vacancies.ourDeskTitle") },
        { value: "board", label: t("vacancies.title") },
      ]}
      onChange={onTab}
    />
  );
}

function Board({ onDesk }: { onDesk?: () => void }) {
  const t = useT();
  const router = useRouter();
  const th = useTheme();
  const { locale } = useLocale();
  const [type, setType] = useState<TypeFilter>("");
  const [q, setQ] = useState("");
  const query = useQuery({
    queryKey: ["shared", "vacancies"],
    queryFn: async () => vacanciesBoardSchema.parse(unwrap(await api().get("/api/v1/shared/vacancies"))),
  });
  const d = query.data;
  const needle = q.trim().toLowerCase();
  const postings = (d?.items ?? []).filter((p) => (!type || p.employmentType === type) && (!needle || [p.title, p.schoolName, p.city ?? ""].join(" ").toLowerCase().includes(needle)));
  const narrowed = Boolean(type || needle);
  return (
    <Screen title={t("vacancies.title")} description={t("vacancies.boardIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {onDesk ? <DeskTabs tab="board" onTab={() => onDesk()} /> : null}
      <Field label={t("common.searchLabel")} placeholder={t("vacancies.searchPlaceholder")} value={q} onChangeText={setQ} autoCapitalize="none" returnKeyType="search" />
      <Chips label={t("vacancies.typeFilter")} value={type} options={[{ value: "" as TypeFilter, label: t("vacancies.filterAll") }, ...TYPES.map((k) => ({ value: k as TypeFilter, label: t(EMPLOYMENT_TYPE[k]) }))]} onChange={setType} />
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} planFrom={query.error} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        postings.length === 0 ? (
          narrowed ? (
            <Empty
              title={t("common.noResultsTitle")}
              body={t("common.noResultsBody")}
              action={
                <Button
                  label={t("common.clearAll")}
                  variant="secondary"
                  onPress={() => {
                    setType("");
                    setQ("");
                  }}
                />
              }
            />
          ) : (
            <Empty title={t("vacancies.emptyTitle")} body={t("vacancies.emptyBody")} action={onDesk ? <Button label={t("vacancies.postCta")} variant="secondary" onPress={onDesk} /> : <Button label={t("explore.title")} variant="secondary" onPress={() => router.push("/(app)/explore" as never)} />} />
          )
        ) : (
          <Card title={t("vacancies.title")}>
            {postings.map((p) => (
              <Row
                key={p.id}
                title={p.title}
                caption={[typeLabel(t, p.employmentType), [p.schoolName, p.city, p.region].filter(Boolean).join(", "), p.subjects.join(", ") || null, t("vacancies.postedAgo", { when: relativeTime(p.createdAt, locale) })].filter(Boolean).join(" · ")}
                right={p.ours ? <Pill label={t("explore.yourSchool")} tone="accent" /> : <Icon name="caretRight" color={th.fgSubtle} size={20} />}
                onPress={() => router.push({ pathname: "/(app)/vacancy", params: { postingId: p.id } } as never)}
              />
            ))}
          </Card>
        )
      ) : null}
    </Screen>
  );
}

function Desk({ onBoard }: { onBoard: () => void }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const session = useSession();
  const role = useRole();
  const canPost = role === "ADMIN";
  const { locale } = useLocale();
  const [status, setStatus] = useState<Status>("open");
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "danger" } | null>(null);
  /** Bumped when a post lands, so the form starts blank again — and only then: a refused post keeps what was typed. */
  const [formKey, setFormKey] = useState(0);
  const titleRef = useRef<TextInput>(null);
  const query = useQuery({
    queryKey: ["admin", "vacancies", status],
    placeholderData: keepPreviousData,
    queryFn: async () => adminVacanciesSchema.parse(unwrap(await api().get(`/api/v1/admin/vacancies?status=${status}`))),
  });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "vacancies"] });
    void qc.invalidateQueries({ queryKey: ["shared", "vacancies"] });
  };
  const post = useMutation({
    mutationFn: async (body: VacancyCreateBody) => vacancyCreatedSchema.parse(unwrap(await api().post("/api/v1/admin/vacancies", body))),
    onSuccess: () => {
      setNotice({ tone: "ok", text: t("vacancies.posted") });
      setFormKey((k) => k + 1);
      refresh();
    },
    onError: (e) => setNotice({ tone: "danger", text: e.message }),
  });
  const close = useMutation({
    mutationFn: async (postingId: string) => okSchema.parse(unwrap(await api().post(`/api/v1/admin/vacancies/${postingId}/close`))),
    onSuccess: () => {
      setNotice({ tone: "ok", text: t("vacancies.closed") });
      refresh();
    },
    onError: (e) => setNotice({ tone: "danger", text: e.message }),
  });
  const d = query.data;
  const me = session.status === "signed-in" ? session.me : null;
  const contactId = me?.active.membershipId ?? "";
  return (
    <Screen title={t("vacancies.ourDeskTitle")} description={t("vacancies.ourDeskIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <DeskTabs tab="desk" onTab={() => onBoard()} />
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} planFrom={query.error} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat label={t("vacancies.openBadge")} value={d.counts.open} tone={d.counts.open > 0 ? "ok" : "fg"} />
            <Stat label={t("vacancies.closedBadge")} value={d.counts.closed} />
          </View>
          <Chips
            label={t("vacancies.filterLabel")}
            value={status}
            options={[
              { value: "open", label: t("invites.tabCount", { label: t("vacancies.openBadge"), count: d.counts.open }) },
              { value: "closed", label: t("invites.tabCount", { label: t("vacancies.closedBadge"), count: d.counts.closed }) },
              { value: "all", label: t("vacancies.filterAll") },
            ]}
            onChange={setStatus}
          />
          {d.postings.length === 0 ? (
            status === "open" && d.counts.closed > 0 ? (
              <Empty title={t("vacancies.emptyOpenTitle")} body={t("vacancies.emptyOpenBody")} action={<Button label={t("vacancies.closedBadge")} variant="secondary" onPress={() => setStatus("closed")} />} />
            ) : (
              <Empty title={t("vacancies.emptyTitle")} body={t("vacancies.emptyOwnBody")} action={canPost ? <Button label={t("vacancies.postCta")} variant="secondary" onPress={() => titleRef.current?.focus()} /> : undefined} />
            )
          ) : (
            <Card title={t("vacancies.ourDeskTitle")}>
              {d.postings.map((p) => (
                <PostingRow key={p.id} posting={p} locale={locale} busy={close.isPending && close.variables === p.id} onClose={canPost ? () => close.mutate(p.id) : null} />
              ))}
            </Card>
          )}
          {canPost ? <NewVacancy key={formKey} titleRef={titleRef} contactName={me?.user.name ?? ""} busy={post.isPending} disabled={!contactId} onPost={(body) => post.mutate({ ...body, hiringContactMembershipId: contactId })} /> : null}
        </>
      ) : null}
    </Screen>
  );
}

/** `onClose` null is the head's row: the posting and its enquiries, and no button to close it. */
function PostingRow({ posting: p, locale, busy, onClose }: { posting: AdminVacancies["postings"][number]; locale: string; busy: boolean; onClose: (() => void) | null }) {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const open = p.status === "OPEN";
  const toPosting = () => router.push({ pathname: "/(app)/vacancy", params: { postingId: p.id } } as never);
  const enquiries = p.enquiryCount === 0 ? t("vacancies.enquiriesNone") : p.enquiryCount === 1 ? t("vacancies.enquiriesOne") : t("vacancies.enquiriesMany", { count: p.enquiryCount });
  return (
    <View style={{ gap: th.space[2] }}>
      <Row title={p.title} caption={[typeLabel(t, p.employmentType), enquiries, p.contactName ? t("vacancies.contactCell", { name: p.contactName }) : null, t("vacancies.postedAgo", { when: relativeTime(p.createdAt, locale) })].filter(Boolean).join(" · ")} right={<Pill label={open ? t("vacancies.openBadge") : t("vacancies.closedBadge")} tone={open ? "ok" : "muted"} />} onPress={toPosting} />
      <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
        {/* The count is the door to the enquiries, not a caption — as on the web. */}
        {p.enquiryCount > 0 ? <Button label={enquiries} variant="ghost" onPress={toPosting} /> : null}
        {open && onClose ? (
          confirming ? (
            <>
              <Button label={t("vacancies.closeCta")} variant="danger" busy={busy} onPress={onClose} accessibilityLabel={`${t("vacancies.closeCta")}: ${p.title}`} />
              <Button label={t("common.cancel")} variant="ghost" onPress={() => setConfirming(false)} />
            </>
          ) : (
            <Button label={t("vacancies.closeCta")} variant="secondary" onPress={() => setConfirming(true)} accessibilityLabel={`${t("vacancies.closeCta")} ${p.title}`} />
          )
        ) : null}
      </View>
    </View>
  );
}

function NewVacancy({ titleRef, contactName, busy, disabled, onPost }: { titleRef: RefObject<TextInput | null>; contactName: string; busy: boolean; disabled: boolean; onPost: (body: Omit<VacancyCreateBody, "hiringContactMembershipId">) => void }) {
  const t = useT();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [subjects, setSubjects] = useState("");
  const [type, setType] = useState<EmploymentType>("FULL_TIME");
  const ready = title.trim().length > 0 && body.trim().length > 0;
  return (
    <Card title={t("vacancies.newTitle")}>
      <Text variant="xs" tone="subtle">
        {t("vacancies.newIntro")}
      </Text>
      <Field ref={titleRef} label={t("vacancies.titleLabel")} value={title} onChangeText={setTitle} placeholder={t("vacancies.titlePlaceholder")} maxLength={160} />
      <Field label={t("vacancies.bodyLabel")} value={body} onChangeText={setBody} placeholder={t("vacancies.bodyPlaceholder")} multiline maxLength={8000} style={{ minHeight: 120 }} />
      <Field label={t("vacancies.subjectsLabel")} value={subjects} onChangeText={setSubjects} hint={t("vacancies.subjectsHint")} maxLength={400} />
      <Chips label={t("vacancies.typeLabel")} value={type} options={TYPES.map((k) => ({ value: k, label: t(EMPLOYMENT_TYPE[k]) }))} onChange={setType} />
      <Text variant="sm" tone="muted">
        {`${t("vacancies.contactLabel")}: ${contactName}`}
      </Text>
      <Text variant="xs" tone="subtle">
        {t("vacancies.contactHint")}
      </Text>
      <Button
        label={t("vacancies.postCta")}
        busy={busy}
        disabled={!ready || disabled}
        onPress={() => onPost({ title: title.trim(), body: body.trim(), subjects: subjects.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20), employmentType: type })}
      />
    </Card>
  );
}
