import type { AcademicsStructure } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { saveOfferingAction } from "@/app/(app)/admin/academics/actions";
import type { Translate } from "@/lib/i18n/dictionary";

/** A new offering: the office's for any course, an HOD's for their department's (the courses passed in). */
export function OfferingForm({ t, s, termId, back, departmentId }: { t: Translate; s: AcademicsStructure; termId: string; back: string; departmentId?: string | null }) {
  const programmes = new Set(s.programmes.filter((p) => !departmentId || p.departmentId === departmentId).map((p) => p.id));
  const schemes = new Set(s.schemes.filter((sc) => programmes.has(sc.programmeId)).map((sc) => sc.id));
  const courses = s.courses.filter((k) => schemes.has(k.schemeId));
  const faculty = s.faculty.filter((f) => !departmentId || f.departmentId === departmentId);
  if (!courses.length) return null;
  return (
    <form action={saveOfferingAction} className="grid gap-3 sm:grid-cols-4">
      <input type="hidden" name="termId" value={termId} />
      <input type="hidden" name="back" value={back} />
      <SelectField label={t("academics.fieldCourse")} name="courseId" required>
        {courses.map((k) => <option key={k.id} value={k.id}>{`${k.code} ${k.name} · ${t("academics.semesterShort", { semester: k.semester })}`}</option>)}
      </SelectField>
      <SelectField label={t("academics.fieldDivision")} name="divisionId" defaultValue="">
        <option value="">{t("academics.sharedAcrossDivisions")}</option>
        {s.divisions.filter((d) => programmes.has(d.programmeId)).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </SelectField>
      <SelectField label={t("academics.fieldFaculty")} name="facultyMembershipId" defaultValue="">
        <option value="">{t("academics.none")}</option>
        {faculty.map((f) => <option key={f.membershipId} value={f.membershipId}>{f.name}</option>)}
      </SelectField>
      <SelectField label={t("academics.fieldRoom")} name="roomId" defaultValue="">
        <option value="">{t("academics.none")}</option>
        {s.rooms.map((r) => <option key={r.id} value={r.id}>{`${r.name} (${r.capacity})`}</option>)}
      </SelectField>
      <TextField label={t("academics.fieldLectureHours")} name="lectureHours" type="number" min={0} max={20} defaultValue={3} />
      <TextField label={t("academics.fieldTutorialHours")} name="tutorialHours" type="number" min={0} max={20} defaultValue={0} />
      <TextField label={t("academics.fieldPracticalHours")} name="practicalHours" type="number" min={0} max={20} defaultValue={2} />
      <TextField label={t("academics.fieldCapacity")} name="capacity" type="number" min={1} max={2000} hint={t("academics.fieldCapacityHint")} />
      <div>
        <Button type="submit">{t("academics.addOffering")}</Button>
      </div>
    </form>
  );
}
