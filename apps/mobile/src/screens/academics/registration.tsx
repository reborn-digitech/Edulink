import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { registrationViewSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Screen, SwitchRow, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { Notice } from "../staff/shared";
import { KIND_KEY } from "./words";
import { formatDate } from "@/lib/dates";

/**
 * A student's course registration on the phone (4 Oct 2026) — the web's
 * /student/registration: core courses on and fixed, the electives, minors
 * and honours to choose within the scheme's credits, while the window (or a
 * late registration the principal approved) is open.
 */
export function RegistrationScreen() {
  const t = useT();
  const qc = useQueryClient();
  const view = useQuery({ queryKey: ["academics", "registration"], queryFn: async () => registrationViewSchema.parse(unwrap(await api().get("/api/v1/academics/registration"))) });
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const save = useMutation({
    mutationFn: async () => {
      const v = view.data!;
      const offeringIds = v.offerings.filter((o) => !o.required && (picked[o.offeringId] ?? o.chosen)).map((o) => o.offeringId);
      return registrationViewSchema.parse(unwrap(await api().post("/api/v1/academics/registration", { termId: v.term!.id, offeringIds })));
    },
    onSuccess: (data) => {
      qc.setQueryData(["academics", "registration"], data);
      setPicked({});
      setNotice({ tone: "ok", text: t("academics.registered") });
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  const v = view.data;
  const credits = v ? v.offerings.filter((o) => o.required || (picked[o.offeringId] ?? o.chosen)).reduce((n, o) => n + o.credits, 0) : 0;
  return (
    <Screen title={t("academics.registrationTitle")} description={v?.term?.name}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {view.isPending ? <Loading /> : null}
      {view.isError ? <Failed message={view.error.message} onRetry={() => void view.refetch()} /> : null}
      {v && (!v.programme || !v.term) ? <Empty icon="graduationCap" title={t(v.programme ? "academics.noTermTitle" : "academics.noSeatTitle")} body={t(v.programme ? "academics.noTermBody" : "academics.noSeatBody")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void view.refetch()} />} /> : null}
      {v?.programme && v.term ? (
        <Card title={t("academics.chooseCourses")}>
          <Text variant="sm" tone="muted">
            {v.open ? (v.lateUntil ? t("academics.lateOpenUntil", { until: formatDate(v.lateUntil) }) : t("academics.windowOpen", { to: formatDate(v.term.registrationClosesOn) })) : t("academics.windowShut", { from: formatDate(v.term.registrationOpensOn), to: formatDate(v.term.registrationClosesOn) })}
          </Text>
          <Text variant="sm">{t("academics.creditsBand", { chosen: credits, min: v.minCredits, max: v.maxCredits })}</Text>
          {v.offerings.map((o) => (
            <SwitchRow
              key={o.offeringId}
              label={`${o.courseCode} · ${o.courseName}`}
              hint={[t(KIND_KEY[o.kind]!), t("academics.creditsN", { n: o.credits }), o.required ? t("academics.required") : null, o.seatsLeft === null ? null : t("academics.seatsLeft", { n: o.seatsLeft })].filter(Boolean).join(" · ")}
              value={o.required || (picked[o.offeringId] ?? o.chosen)}
              disabled={o.required || !v.open}
              onChange={(next) => setPicked((p) => ({ ...p, [o.offeringId]: next }))}
            />
          ))}
          {v.open ? <Button label={t("academics.register")} busy={save.isPending} onPress={() => save.mutate()} /> : null}
        </Card>
      ) : null}
    </Screen>
  );
}
