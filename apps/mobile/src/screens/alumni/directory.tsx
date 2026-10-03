import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { ALUMNI_CONTACT_PREFS, alumniDirectoryMeSchema, alumniDirectorySchema, type AlumniContactPref } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Chips } from "@/screens/staff/shared";

type AlumniDirectoryMe = z.infer<typeof alumniDirectoryMeSchema>;

/**
 * The alumni directory (the alumni module, 3 Oct 2026) — the web's
 * /alumni/directory: the former pupils who chose to be listed, newest batch
 * first, and for an adult alumnus their own entry to join, change or leave.
 * Nothing is shown about anyone until they join; a minor is told when they may.
 */
export function AlumniDirectory() {
  const t = useT();
  const router = useRouter();
  const query = useQuery({
    queryKey: ["alumni", "directory"],
    queryFn: async () => alumniDirectorySchema.parse(unwrap(await api().get("/api/v1/alumni/directory"))),
  });
  const d = query.data;
  return (
    <Screen title={t("alumni.directoryTitle")} description={t("alumni.directoryIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d?.me ? (
        <Card title={t("alumni.directoryJoinTitle")}>
          <Text variant="sm" tone="muted">
            {d.canJoin ? t("alumni.directoryJoinIntro") : t("alumni.directoryMinor")}
          </Text>
          {d.canJoin ? <EntryForm me={d.me} /> : null}
        </Card>
      ) : null}
      {d ? (
        d.entries.length === 0 ? (
          <Empty icon="users" title={t("alumni.directoryEmpty")} body={t("alumni.directoryIntro")} action={<Button label={t("modules.alumniName")} variant="secondary" onPress={() => router.push("/(app)" as never)} />} />
        ) : (
          <Card>
            {d.entries.map((e) => (
              <Row
                key={e.membershipId}
                title={e.mentor ? `${e.name} · ${t("alumni.mentorBadge")}` : e.name}
                caption={[t("alumni.batchOf", { year: e.batchYear }), e.occupation, e.city, e.contactPref === "EMAIL" ? e.email : e.contactPref === "OFFICE" ? t("alumni.viaOffice") : null].filter(Boolean).join(" · ")}
              />
            ))}
          </Card>
        )
      ) : null}
    </Screen>
  );
}

/** The alumnus's own entry: what they wrote, how to reach them, join or save, and leave. */
function EntryForm({ me }: { me: AlumniDirectoryMe }) {
  const t = useT();
  const th = useTheme();
  const client = useQueryClient();
  const [city, setCity] = useState(me.city ?? "");
  const [occupation, setOccupation] = useState(me.occupation ?? "");
  const [contactPref, setContactPref] = useState<AlumniContactPref>(me.contactPref);
  const [saved, setSaved] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: async (leave: boolean) => {
      const result = leave ? await api().request("DELETE", "/api/v1/alumni/directory") : await api().request("PUT", "/api/v1/alumni/directory", { city, occupation, contactPref });
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return { leave, me: alumniDirectoryMeSchema.parse(result.data) };
    },
    onSuccess: ({ leave }) => {
      if (leave) {
        setCity("");
        setOccupation("");
        setContactPref("OFFICE");
      }
      setSaved(leave ? t("alumni.directoryLeft") : t("alumni.directoryJoined"));
      void client.invalidateQueries({ queryKey: ["alumni"] });
    },
  });
  return (
    <View style={{ gap: th.space[3], marginTop: th.space[2] }}>
      <Field label={t("alumni.directoryCity")} value={city} onChangeText={setCity} maxLength={80} />
      <Field label={t("alumni.directoryOccupation")} value={occupation} onChangeText={setOccupation} maxLength={120} />
      <Chips label={t("alumni.directoryContact")} value={contactPref} options={ALUMNI_CONTACT_PREFS.map((p) => ({ value: p, label: t(`alumni.contact${p}`) }))} onChange={setContactPref} />
      {save.isError ? <Failed message={save.error.message} /> : null}
      {saved ? (
        <Text variant="sm" tone="ok">
          {saved}
        </Text>
      ) : null}
      <Button label={me.listed ? t("alumni.directorySave") : t("alumni.directoryJoin")} busy={save.isPending && save.variables === false} onPress={() => save.mutate(false)} />
      {me.listed ? <Button label={t("alumni.directoryLeave")} variant="secondary" onPress={() => save.mutate(true)} /> : null}
    </View>
  );
}
