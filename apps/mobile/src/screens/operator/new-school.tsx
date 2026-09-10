import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { operatorSchoolCreatedSchema } from "@edulink/contracts";
import { Screen, useToast } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { BLANK_SCHOOL, SchoolForm, trimmedSchool, type SchoolFormValues } from "./school";

/**
 * The web's /root/new: add a school, then land on its page — creating a
 * school gives it nobody to run it, and inviting its administrator is the
 * first thing that page offers. The join code is said in the toast.
 */
export function OperatorNewSchool() {
  const t = useT();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const create = useMutation({
    mutationFn: async (values: SchoolFormValues) => {
      const result = await api().post("/api/v1/operator/schools", trimmedSchool(values));
      if (!result.ok) throw new Error(errorText(result, t("root.didNotWork")));
      return operatorSchoolCreatedSchema.parse(unwrap(result));
    },
    onSuccess: (made, values) => {
      toast.show(`${t("root.created", { name: values.name.trim() })} · ${t("root.joinCodeIs", { code: made.code })}`);
      void qc.invalidateQueries({ queryKey: ["operator", "overview"] });
      void qc.invalidateQueries({ queryKey: ["operator", "audit"] });
      router.replace({ pathname: "/(app)/operator-school", params: { schoolId: made.schoolId } } as never);
    },
  });
  return (
    <Screen title={t("root.addSchool")} description={t("root.newSchoolIntro")}>
      <SchoolForm initial={BLANK_SCHOOL} submitLabel={t("root.createSchool")} busy={create.isPending} error={create.isError ? create.error.message : null} onSubmit={(values) => create.mutate(values)} />
    </Screen>
  );
}
