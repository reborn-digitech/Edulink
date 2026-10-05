import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { collegeOfferingWorkSchema, collegeWorkCreatedSchema, collegeWorkHomeSchema, type RoleCode } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { formatMilli, Pill } from "../family/shared";
import { relativeTime } from "../teacher/support";

/**
 * HOMEWORK AT A COLLEGE ON THE PHONE (R-48, the risks batch of 5 Oct 2026),
 * the web's /faculty/work: the offerings I teach (an HOD: the department's
 * too) with their work and what waits to be marked; one offering's work, and
 * a piece of work set on it — published to its registered students or kept
 * as a draft. Marking is the next screen (college-work-item). The student
 * reads and hands the work in on their ordinary Assignments screens.
 */
const TEACHERS: readonly RoleCode[] = ["FACULTY", "HOD"];

export function CollegeWorkScreen() {
  const t = useT();
  const router = useRouter();
  const session = useSession();
  const me = session.status === "signed-in" ? session.me : null;
  const role = me?.active.role ?? null;
  const teaches = role !== null && TEACHERS.includes(role);
  const on = (me?.modules ?? []).includes("ACADEMICS");
  const [offeringId, setOfferingId] = useState<string | null>(null);
  const home = useQuery({ queryKey: ["college-work", "home"], enabled: teaches && on, queryFn: async () => collegeWorkHomeSchema.parse(unwrap(await api().get("/api/v1/academics/work"))) });
  const title = t("collegeWork.title");
  const toMore = <Button label={t("nav.more")} variant="secondary" onPress={() => router.push("/(app)/more" as never)} />;
  if (!teaches || !on) {
    return (
      <Screen title={title}>
        <Empty icon="clipboard" title={title} body={teaches ? t("duties.moduleOff") : t("collegeWork.noOfferingsBody")} action={toMore} />
      </Screen>
    );
  }
  if (offeringId) return <OfferingWork offeringId={offeringId} onBack={() => setOfferingId(null)} />;
  const d = home.data;
  return (
    <Screen title={title} description={t("collegeWork.intro")} refreshing={home.isRefetching} onRefresh={() => void home.refetch()}>
      {home.isPending ? <Loading /> : null}
      {home.isError ? <Failed message={home.error.message} onRetry={() => void home.refetch()} /> : null}
      {d && d.offerings.length === 0 ? <Empty icon="clipboard" title={t("collegeWork.noOfferings")} body={t("collegeWork.noOfferingsBody")} action={toMore} /> : null}
      {d && d.offerings.length > 0 ? (
        <Card title={t("collegeWork.offeringsTitle")}>
          {d.offerings.map((o) => (
            <Row
              key={o.offeringId}
              icon="clipboard"
              title={`${o.courseCode} · ${o.courseName}`}
              caption={[o.termName, o.divisionName ?? t("collegeWork.elective"), t("collegeWork.registeredCount", { count: o.registered }), t("collegeWork.workCount", { count: o.work })].join(" · ")}
              right={o.toMark > 0 ? <Pill label={t("collegeWork.toMarkCount", { count: o.toMark })} tone="warn" /> : undefined}
              onPress={() => setOfferingId(o.offeringId)}
            />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

/** One offering: its work, newest first, and the form that sets a piece of work on it. */
function OfferingWork({ offeringId, onBack }: { offeringId: string; onBack: () => void }) {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const query = useQuery({ queryKey: ["college-work", "offering", offeringId], queryFn: async () => collegeOfferingWorkSchema.parse(unwrap(await api().get(`/api/v1/academics/offerings/${offeringId}/work`))) });
  const d = query.data;
  return (
    <Screen title={d ? `${d.courseCode} · ${d.courseName}` : t("collegeWork.title")} description={d ? [d.termName, d.divisionName ?? t("collegeWork.elective"), t("collegeWork.registeredCount", { count: d.registered })].join(" · ") : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Button label={t("collegeWork.allOfferings")} variant="ghost" onPress={onBack} />
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? <SetWork offeringId={offeringId} onSet={() => query.refetch()} /> : null}
      {d && d.items.length === 0 ? <Empty icon="clipboard" title={t("collegeWork.noWork")} body={t("collegeWork.noWorkBody")} action={<Button label={t("collegeWork.allOfferings")} variant="secondary" onPress={onBack} />} /> : null}
      {d && d.items.length > 0 ? (
        <Card title={t("collegeWork.listTitle")}>
          {d.items.map((w) => (
            <Row
              key={w.id}
              title={w.title}
              caption={[
                w.publishedAt ? null : t("collegeWork.draft"),
                w.pointsMilli ? t("collegeWork.outOf", { points: formatMilli(w.pointsMilli) }) : null,
                w.dueAt ? t("collegeWork.due", { when: relativeTime(w.dueAt, locale) }) : t("collegeWork.noDue"),
                t("collegeWork.handedIn", { done: w.submitted, of: w.registered }),
                t("collegeWork.marked", { done: w.graded, of: w.registered }),
              ]
                .filter(Boolean)
                .join(" · ")}
              onPress={() => router.push({ pathname: "/(app)/college-work-item", params: { assignmentId: w.id } } as never)}
            />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

/** "YYYY-MM-DD" at four in the afternoon on the phone's clock, as the web's form defaults its time. */
export function dueOf(day: string): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day.trim())) return undefined;
  const at = new Date(`${day.trim()}T16:00:00`);
  return Number.isNaN(at.getTime()) ? undefined : at.toISOString();
}

function SetWork({ offeringId, onSet }: { offeringId: string; onSet: () => unknown }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [points, setPoints] = useState("");
  const [day, setDay] = useState("");
  // A due date already past: the server says so, and the teacher may send it again meaning it.
  const [pastDue, setPastDue] = useState(false);
  const save = useMutation({
    mutationFn: async (input: { publish: boolean; confirmPastDue: boolean }) =>
      collegeWorkCreatedSchema.parse(
        unwrap(
          await api().post(`/api/v1/academics/offerings/${offeringId}/work`, {
            title: title.trim(),
            body: body.trim(),
            ...(points.trim() ? { points: Number(points) } : {}),
            ...(dueOf(day) ? { dueAt: dueOf(day) } : {}),
            publish: input.publish,
            ...(input.confirmPastDue ? { confirmPastDue: true } : {}),
          }),
        ),
      ),
    onSuccess: async (_r, input) => {
      toast.show(t(input.publish ? "collegeWork.published" : "collegeWork.drafted"), "ok");
      setTitle("");
      setBody("");
      setPoints("");
      setDay("");
      setPastDue(false);
      await qc.invalidateQueries({ queryKey: ["college-work", "home"] });
      await onSet();
    },
    onError: (e: Error & { status?: number }) => setPastDue(e.status === 422 && Boolean(dueOf(day)) && new Date(dueOf(day)!).getTime() < Date.now()),
  });
  const ready = title.trim().length >= 2 && (!points.trim() || Number.isFinite(Number(points))) && (!day.trim() || Boolean(dueOf(day)));
  return (
    <Card title={t("collegeWork.setTitle")}>
      <Text variant="sm" tone="muted">
        {t("collegeWork.setBody")}
      </Text>
      <Field label={t("collegeWork.fieldTitle")} value={title} onChangeText={setTitle} maxLength={200} />
      <Field label={t("collegeWork.fieldBody")} value={body} onChangeText={setBody} maxLength={20000} multiline />
      <Field label={t("collegeWork.fieldPoints")} hint={t("collegeWork.fieldPointsHint")} value={points} onChangeText={(v) => setPoints(v.replace(/[^0-9.]/g, ""))} keyboardType="decimal-pad" />
      <Field label={t("collegeWork.fieldDue")} value={day} onChangeText={setDay} placeholder="YYYY-MM-DD" autoCapitalize="none" keyboardType="numbers-and-punctuation" />
      {save.isError ? (
        <Text tone="danger" accessibilityRole="alert">
          {save.error.message}
        </Text>
      ) : null}
      <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
        <Button label={t("collegeWork.publishNow")} busy={save.isPending} disabled={!ready} onPress={() => save.mutate({ publish: true, confirmPastDue: false })} style={{ flexGrow: 1 }} />
        <Button label={t("collegeWork.saveDraft")} variant="secondary" disabled={!ready || save.isPending} onPress={() => save.mutate({ publish: false, confirmPastDue: false })} style={{ flexGrow: 1 }} />
      </View>
      {pastDue ? <Button label={t("collegeWork.confirmPastDue")} variant="ghost" onPress={() => save.mutate({ publish: true, confirmPastDue: true })} /> : null}
    </Card>
  );
}
