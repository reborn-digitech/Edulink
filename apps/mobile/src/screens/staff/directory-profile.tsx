import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminSettingsSchema, okSchema, type AdminSettings } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Screen, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Pill } from "../family/shared";
import { Chips, roleLabel } from "./shared";

export type DirectoryProfileBody = { about: string; admissionsContactMembershipId: string | null };

/**
 * The school's public directory profile — the card the web keeps on
 * /admin/settings#directory: the school in its own words, the person
 * admissions enquiries land on, and the switch that puts the school in the
 * platform-wide directory. Publishing saves the words on screen first, as on
 * the web; taking the school out asks first and leaves the words alone, so a
 * cleared contact cannot trip the published-needs-a-contact rule on the way out.
 */
export function SchoolDirectoryProfile() {
  const t = useT();
  const query = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => adminSettingsSchema.parse(unwrap(await api().get("/api/v1/admin/settings"))),
  });
  const d = query.data;
  return (
    <Screen title={t("explore.directoryTitle")} description={t("explore.directoryBody")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? <ProfileForm key={d.school.code} d={d} /> : null}
    </Screen>
  );
}

function ProfileForm({ d }: { d: AdminSettings }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const router = useRouter();
  const [about, setAbout] = useState(d.directory.about);
  const [contactId, setContactId] = useState(d.directory.admissionsContactMembershipId ?? "");
  const [confirmingOut, setConfirmingOut] = useState(false);
  const published = d.directory.published;
  const body = (): DirectoryProfileBody => ({ about: about.trim(), admissionsContactMembershipId: contactId || null });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    void qc.invalidateQueries({ queryKey: ["admin", "overview"] });
  };
  const save = useMutation({
    mutationFn: async (next: DirectoryProfileBody) => okSchema.parse(unwrap(await api().post("/api/v1/office/directory", next))),
    onSuccess: () => {
      toast.show(t("explore.saved"));
      refresh();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const publish = useMutation({
    mutationFn: async (next: boolean) => {
      if (next) okSchema.parse(unwrap(await api().post("/api/v1/office/directory", body())));
      return okSchema.parse(unwrap(await api().post("/api/v1/office/directory/publish", { published: next })));
    },
    onSuccess: (_r, next) => {
      setConfirmingOut(false);
      toast.show(next ? t("explore.published") : t("explore.unpublished"));
      refresh();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const busy = save.isPending || publish.isPending;
  return (
    <Card title={t("explore.detailsTitle")} action={<Pill label={published ? t("explore.publishedBadge") : t("explore.unpublishedBadge")} tone={published ? "ok" : "muted"} />}>
      <Field label={t("explore.aboutLabel")} value={about} onChangeText={setAbout} placeholder={t("explore.aboutHint")} multiline maxLength={4000} style={{ minHeight: 140, textAlignVertical: "top" }} />
      {d.contactCandidates.length === 0 ? (
        <Empty icon="users" title={t("staff.rosterEmpty")} body={t("explore.contactHint")} action={<Button label={t("invites.invitePeople")} variant="secondary" onPress={() => router.push("/(app)/invites" as never)} />} />
      ) : (
        <>
          <Chips
            label={t("explore.contactLabel")}
            value={contactId}
            options={[{ value: "", label: t("explore.noContact") }, ...d.contactCandidates.map((c) => ({ value: c.membershipId, label: `${c.name} · ${roleLabel(t, c.role)}` }))]}
            onChange={setContactId}
          />
          <Text variant="xs" tone="subtle">
            {t("explore.contactHint")}
          </Text>
        </>
      )}
      {d.directory.admissionsContactMembershipId && !d.directory.contactStillValid ? (
        <Text variant="sm" tone="warn">
          {t("explore.contactGoneWarning")}
        </Text>
      ) : null}
      <Button label={t("explore.saveCta")} busy={save.isPending} disabled={busy} onPress={() => save.mutate(body())} />
      {published ? (
        confirmingOut ? (
          <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
            <Button label={t("explore.unpublishCta")} variant="danger" busy={publish.isPending} onPress={() => publish.mutate(false)} accessibilityLabel={`${t("common.confirm")}: ${t("explore.unpublishCta")}`} style={{ flexGrow: 1 }} />
            <Button label={t("common.cancel")} variant="ghost" onPress={() => setConfirmingOut(false)} />
          </View>
        ) : (
          <Button label={t("explore.unpublishCta")} variant="secondary" disabled={busy} onPress={() => setConfirmingOut(true)} />
        )
      ) : (
        <Button label={t("explore.publishCta")} variant="secondary" busy={publish.isPending} disabled={busy} onPress={() => publish.mutate(true)} />
      )}
    </Card>
  );
}
