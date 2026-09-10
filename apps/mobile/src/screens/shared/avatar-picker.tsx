import { useState } from "react";
import { Pressable, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { familyStudentProfileSchema, staffProfileSchema } from "@edulink/contracts";
import { Button, Card, Failed, Loading, Screen, Text, useToast } from "@/components";
import { Avatar, AVATAR_PRESETS, describeAvatar } from "@/components/avatar";
import { api, errorText } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useRole, useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";

/**
 * Choose your avatar — the web's picker from /student/profile and
 * /teacher/profile: the 72 preset drawings as a radio grid, the chosen one
 * large at the top with its name, and one Save. It is saved the way the
 * person's own profile saves it — a pupil's and a teacher's with the rest of
 * their profile (their words sent back unchanged), anyone else's (an expert,
 * the office, a guardian) through /api/v1/account/avatar. Nothing but a
 * preset is ever sent; the server refuses anything else.
 */
export function AvatarPicker() {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const session = useSession();
  const role = useRole();
  const me = session.status === "signed-in" ? session.me.user : null;
  const student = useQuery({
    queryKey: ["family", "student", "profile"],
    enabled: role === "STUDENT",
    queryFn: async () => familyStudentProfileSchema.parse(unwrap(await api().get("/api/v1/family/student/profile"))),
  });
  const teacher = useQuery({
    queryKey: ["staff", "profile"],
    enabled: role === "TEACHER",
    queryFn: async () => staffProfileSchema.parse(unwrap(await api().get("/api/v1/staff/profile"))),
  });
  const profile = role === "STUDENT" ? student : role === "TEACHER" ? teacher : null;
  const current = role === "STUDENT" ? (student.data?.avatarKey ?? null) : role === "TEACHER" ? (teacher.data?.user.avatarKey ?? null) : (me?.avatarKey ?? null);
  const name = me?.name ?? "";
  const [chosen, setChosen] = useState<string | null>(null);
  const selected = chosen ?? current;
  const save = useMutation({
    mutationFn: async (avatarKey: string) => {
      const result =
        role === "STUDENT" && student.data
          ? await api().post("/api/v1/family/student/profile", { preferredName: student.data.preferredName ?? "", bio: student.data.bio ?? "", avatarKey })
          : role === "TEACHER" && teacher.data
            ? await api().post("/api/v1/staff/profile", { preferredName: teacher.data.user.preferredName ?? "", bio: teacher.data.user.bio ?? "", avatarKey })
            : await api().post("/api/v1/account/avatar", { avatarKey });
      if (!result.ok) throw new Error(errorText(result, t("student.notSaved")));
    },
    onSuccess: async () => {
      toast.show(t("student.saved"));
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["family", "student", "profile"] }),
        qc.invalidateQueries({ queryKey: ["staff", "profile"] }),
        qc.invalidateQueries({ queryKey: ["account"] }),
      ]);
      // The shell draws the avatar from /me (More's header, the profile screens).
      await session.refresh();
      setChosen(null);
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const ready = profile === null ? me !== null : Boolean(profile.data);
  return (
    <Screen title={t("student.chooseAvatar")} refreshing={profile?.isRefetching} onRefresh={profile ? () => void profile.refetch() : undefined}>
      {profile?.isPending ? <Loading /> : null}
      {profile?.isError ? <Failed message={profile.error.message} onRetry={() => void profile.refetch()} /> : null}
      {ready ? (
        <>
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[4] }}>
              <Avatar avatarKey={selected} name={name} size={96} />
              <View style={{ flex: 1, gap: th.space[1] }}>
                <Text variant="lg" bold>
                  {me?.preferredName ?? name}
                </Text>
                <Text variant="sm" tone="muted">
                  {describeAvatar(selected, t)}
                </Text>
              </View>
            </View>
            <Button label={t("student.save")} busy={save.isPending} disabled={!chosen || chosen === current} onPress={() => (chosen ? save.mutate(chosen) : undefined)} />
          </Card>
          <View accessibilityRole="radiogroup" accessibilityLabel={t("student.chooseAvatar")} style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: th.space[2] }}>
            {AVATAR_PRESETS.map((preset) => {
              const on = preset === selected;
              return (
                <Pressable
                  key={preset}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  aria-checked={on}
                  accessibilityLabel={describeAvatar(preset, t)}
                  onPress={() => {
                    haptics.tap();
                    setChosen(preset);
                  }}
                  style={({ pressed }) => ({ padding: th.space[1], borderRadius: th.radius.xl, borderWidth: 3, borderColor: on ? th.accent : th.bg, opacity: pressed ? 0.7 : 1 })}
                >
                  <Avatar avatarKey={preset} name={describeAvatar(preset, t)} size={th.tap} decorative />
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}
    </Screen>
  );
}
