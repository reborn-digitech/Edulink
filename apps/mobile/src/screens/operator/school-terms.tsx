import { useRef, useState } from "react";
import { AccessibilityInfo, Platform, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { COLLEGE_TIERS, isCollegeKind, schoolTermsAnswerSchema, termsChangeAnswerSchema, type PartFigure, type SchoolTerms, type TermsChangeAnswer } from "@edulink/contracts";
import { formatPaise, type TranslationKey } from "@edulink/i18n";
import { Button, Card, Failed, Loading, Text, useToast } from "@/components";
import { SwitchRow } from "@/components/switch-row";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { openWeb } from "../staff/shared";
import { Note } from "../family/shared";
import { OfflineDecisionNote, useOnline } from "../shared/desk";

type Role = "students" | "teachers";
/**
 * The question open: the switch, the terms it was asked against, which Confirm sends back (E2), and the server's sentence of
 * what it will do, where the door answers one (C7 point 7c): the phone composes nothing of price, bill or who is told.
 */
type Asking = { role: Role; on: boolean; expect: ReturnType<typeof termsAsRead>; sentence: string | null };

/** The terms as read, sent back with a switch so that a school changed meanwhile is refused by name (the review's B-3). */
export function termsAsRead(terms: SchoolTerms) {
  return { termsSetAt: terms.termsSetAt, premiumStudents: terms.premiumStudents, premiumTeachers: terms.premiumTeachers, subscription: terms.subscription, premium: terms.premium, note: terms.note };
}

/**
 * A request of the terms door that did not succeed, with the answer's status kept (C7 point 7g, as the coordinating session
 * reads it in its review of bace327b, P1 and P2): `refused`, a decision of the server's in its own words; `unanswered`, no
 * answer (offline, timed out or cut off: the client's status 0), or after Confirm any 5xx, since the door words its answer after
 * the save, and for a preview a 5xx carrying no sentence of the server's; `unreadable`, an answer the phone cannot read (a newer
 * server's value, a 4xx that is no sentence of the server's), after which a write may also have landed; `erred`, after Confirm a
 * 5xx carrying the server's own sentence: it answered, with an error, and the switch may have been saved (C7b point 5, E4).
 */
class DoorFailure extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly kind: "refused" | "unanswered" | "erred" | "unreadable",
  ) {
    super(message);
  }
}
/** What the card says of a failure: the server's own sentence, or what is known where no answer came (C7 point 7g). */
type Said = { text: string; status: number; unanswered: boolean };

/**
 * THE SCHOOL'S SUBSCRIPTION AND PREMIUM ON THE PHONE (decision 0010; the brief's §7; phase 8; C7 point 7). What the school
 * pays for its Shalaghar subscription and its premium add-on, in the web card's own words (a student a year + GST and how it
 * is priced; premium off, what it would be if on; on and not billed, why alone in the price's place), premium's line once,
 * as the school's; the premium add-on's two switches (Teachers never at a college), with C2's lines the terms door words
 * beside them (the plans not asked for, the features switched off for everyone, Vidura not switched on). A switch is asked
 * first with what it will do, from the door's preview, and written on Confirm against the terms the question was asked
 * with, with no Undo, as the web's switching off is; the card then shows the terms the door answered. While the phone is
 * offline the switches wait and the house's note says why, since a switch is sent live and never queued; a Confirm that got
 * no answer says the switch may have been saved and reads the terms again. Prices, Record payment and changes for many
 * schools are the web's.
 */
export function TermsCard({ schoolId, name, onDone }: { schoolId: string; name: string; onDone: () => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const qc = useQueryClient();
  const toast = useToast();
  const online = useOnline();
  const money = (paise: number) => formatPaise(paise, locale);
  const queryKey = ["operator", "school", schoolId, "terms"];
  const terms = useQuery({ queryKey, queryFn: async () => schoolTermsAnswerSchema.parse(unwrap(await api().get(`/api/v1/operator/schools/${schoolId}/terms`))) });
  const [asking, setAsking] = useState<Asking | null>(null);
  const [said, setSaid] = useState<Said | null>(null);

  const change = async (role: Role, on: boolean, preview: boolean, expect: ReturnType<typeof termsAsRead>): Promise<TermsChangeAnswer> => {
    const result = await api().request("PUT", `/api/v1/operator/schools/${schoolId}/terms`, { premium: { [role]: on }, expect, preview });
    if (!result.ok) {
      const unanswered = result.status === 0 || (result.status >= 500 && !result.said);
      const erred = !unanswered && result.status >= 500 && !preview;
      throw new DoorFailure(errorText(result, t("root.didNotWork")), result.status, unanswered ? "unanswered" : erred ? "erred" : result.said ? "refused" : "unreadable");
    }
    const answer = termsChangeAnswerSchema.safeParse(result.data);
    if (!answer.success) throw new DoorFailure(t("mobile.answerUnreadable"), 200, "unreadable");
    return answer.data;
  };
  /** The lists that badge this school read again: the dashboard's, and the overview's rows (C7 point 7a). */
  const badgesMoved = () => {
    void qc.invalidateQueries({ queryKey: ["operator", "dashboard"] });
    void qc.invalidateQueries({ queryKey: ["operator", "overview"] });
  };
  const ask = useMutation({
    mutationFn: async ({ role, on }: { role: Role; on: boolean }) => {
      const expect = termsAsRead(terms.data!);
      return { answer: await change(role, on, true, expect), expect };
    },
    onSuccess: ({ answer, expect }, { role, on }) => {
      setSaid(null);
      setAsking({ role, on, expect, sentence: answer.sentence ?? null });
      // Said aloud on an iPhone as the question opens, the server's sentence under it, in one announcement; TalkBack hears the
      // two live regions and is not told twice (C7b point 5, E5; as components/field.tsx does).
      if (Platform.OS !== "android") {
        const question = t(on ? "subs.phoneSwitchOnAsk" : "subs.phoneSwitchOffAsk", { who: t(role === "students" ? "subs.whoStudents" : "subs.whoTeachers"), school: name });
        AccessibilityInfo.announceForAccessibility?.(answer.sentence ? `${question} ${answer.sentence}` : question);
      }
    },
    onError: (e) => {
      // A preview writes nothing: one that got no answer says only that the server could not be reached, and one the phone
      // cannot read says so in the house's sentence, never an issue list or a page's text.
      const failure = e instanceof DoorFailure ? e : null;
      const text = failure?.kind === "unanswered" ? t("subs.phoneNotReached") : failure?.kind === "unreadable" || !failure ? t("mobile.answerUnreadable") : e.message;
      setSaid({ text, status: failure?.status ?? 0, unanswered: failure?.kind !== "refused" });
      void terms.refetch();
    },
  });
  // Set at the first press of Confirm and let go when its save settles: two taps inside one frame send one write (the review of
  // bace327b, P3), since `busy` takes hold only after the render.
  const confirming = useRef(false);
  const save = useMutation({
    // Sent against the terms the question was asked with, not as they stand at the press: a re-read while the question was
    // open must not let another's change pass unseen (the second review of phase 8, E2).
    mutationFn: ({ role, on, expect }: { role: Role; on: boolean; expect: ReturnType<typeof termsAsRead> }) => change(role, on, false, expect),
    onSettled: () => {
      confirming.current = false;
    },
    onSuccess: (answer) => {
      setAsking(null);
      setSaid(null);
      // The terms the door answered, with their lines, shown at once, before any re-read lands (E4; C7 point 7f).
      qc.setQueryData(queryKey, answer.terms);
      toast.show(t("subs.premiumSwitchSaved"));
      badgesMoved();
      // The school's page is read again, these terms with it (their key lies under the page's).
      onDone();
    },
    onError: (e) => {
      setAsking(null);
      const failure = e instanceof DoorFailure ? e : null;
      if (!failure || failure.kind !== "refused") {
        // The switch may have been saved: say so (and, where the answer could not be read, that the app may need updating), and
        // read the page again, these terms with it, and the badges (C7 point 7g; the review of bace327b, P1 and P2).
        const key = failure?.kind === "unanswered" ? "subs.phoneSwitchMayBeSaved" : failure?.kind === "erred" ? "subs.phoneSwitchServerError" : "subs.phoneSwitchUnreadable";
        setSaid({ text: t(key), status: failure?.status ?? 0, unanswered: true });
        badgesMoved();
        onDone();
      } else {
        // Refused, in the server's words: the terms are read again and the next press is asked against them (C5 point 2).
        setSaid({ text: e.message, status: failure?.status ?? 0, unanswered: false });
        void terms.refetch();
      }
    },
  });

  const percent = (bps: number) => (bps / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  const tierName = (code: string | null) => {
    const tier = COLLEGE_TIERS.find((each) => each.code === code);
    return tier ? t(tier.code === "college-affiliated" ? "operatorCollege.tierAffiliated" : "operatorCollege.tierAutonomous") : "";
  };
  /** How a part is priced, in the card's brackets, as the web card says it (src/lib/terms-sentences.ts partHow). */
  const how = (figure: PartFigure) => {
    if (figure.tierCode !== null) {
      const tier = tierName(figure.tierCode);
      return figure.source === "OWN_DISCOUNT" ? t("subs.howTierOwnDiscount", { tier, percent: percent(figure.discountBps) }) : t("subs.howTier", { tier });
    }
    if (figure.source === "OWN_PRICE") return t("subs.howOwnPrice");
    if (figure.source === "OWN_DISCOUNT") return t("subs.howOwnDiscount", { percent: percent(figure.discountBps), base: money(figure.basePaise) });
    return t("subs.howOurs");
  };
  /** Why premium is on and not billed (C3a's order: the terms first, then the plans not asked for). */
  const whyKey = (view: SchoolTerms): TranslationKey => {
    if (view.premiumNotBilled === "TERMS_NOT_SET") return "subs.notBilledTerms";
    const student = view.premiumWaitsFor.includes("STUDENT");
    const teacher = view.premiumWaitsFor.includes("TEACHER");
    return student && teacher ? "subs.notBilledBothPlans" : student ? "subs.notBilledStudentPlan" : "subs.notBilledTeacherPlan";
  };
  /** Premium's line, as the web card's (C2b, C3): off, its price if switched on; on and billed, its price + GST and how; on and not billed, why alone. */
  const premiumLine = (view: SchoolTerms) => {
    const on = view.premiumStudents || view.premiumTeachers;
    if (!on) return view.premiumFigure.paysPaise === 0 ? t("root.freeByAgreement") : t("subs.premiumIfOn", { price: money(view.premiumFigure.paysPaise) });
    // The terms first, then a college with no tier, which has no bill whatever its plan, then the plan (the review of bace327b, T1).
    if (view.premiumNotBilled !== "TERMS_NOT_SET" && view.subscriptionFigure === null) return t("subs.premiumOnNotBilled", { why: t("subs.notBilledTier") });
    if (!view.premiumBilled) return t("subs.premiumOnNotBilled", { why: t(whyKey(view)) });
    return view.premiumFigure.paysPaise === 0 ? t("root.freeByAgreement") : t("subs.cardPremium", { price: money(view.premiumFigure.paysPaise), how: how(view.premiumFigure) });
  };

  const view = terms.data;
  const college = isCollegeKind(view?.kind);
  // Terms not set and no tier chosen read as before; the old amount of a school whose terms are not set is the web's.
  const subscriptionLine = !view
    ? ""
    : !view.termsSet
      ? t("subs.badgeTermsNotSet")
      : !view.subscriptionFigure
        ? t("operatorCollege.noTierChosen")
        : view.subscriptionFigure.paysPaise === 0
          ? t("root.freeByAgreement")
          : t("subs.cardSubscription", { price: money(view.subscriptionFigure.paysPaise), how: how(view.subscriptionFigure) });
  const busy = ask.isPending || save.isPending;
  const roles: Role[] = college ? ["students"] : ["students", "teachers"];

  return (
    <Card title={t("subs.cardTitle")}>
      {terms.isPending ? <Loading /> : null}
      {terms.isError ? <Failed error={terms.error} onRetry={() => void terms.refetch()} /> : null}
      {view ? (
        <>
          <Text variant="sm">
            {t("subs.partSubscription")}: {subscriptionLine}
          </Text>
          <Text variant="sm">
            {t("subs.partPremium")}: {premiumLine(view)}
          </Text>
          {said ? (
            <Text variant="sm" tone={said.unanswered ? "warn" : "danger"} accessibilityRole="alert">
              {said.text}
            </Text>
          ) : null}
          {roles.map((role) => (
            <SwitchRow
              key={role}
              label={t(role === "students" ? "subs.switchStudents" : "subs.switchTeachers", { school: name })}
              value={role === "students" ? view.premiumStudents : view.premiumTeachers}
              disabled={!online || busy || asking !== null}
              onChange={(on) => ask.mutate({ role, on })}
            />
          ))}
          {asking ? (
            <Note tone="accent">
              {/* Said aloud as the question opens, with the server's sentence under it (the review of bace327b, P5). */}
              <Text variant="sm" bold accessibilityLiveRegion="polite">
                {t(asking.on ? "subs.phoneSwitchOnAsk" : "subs.phoneSwitchOffAsk", { who: t(asking.role === "students" ? "subs.whoStudents" : "subs.whoTeachers"), school: name })}
              </Text>
              {/* Under its own question, the server's sentence of what the switch will do; price, bill and who is told are the
                  server's to word, never the phone's. Where a server sends none, the question stands alone (C7 point 7c). */}
              {asking.sentence ? (
                <Text variant="sm" accessibilityLiveRegion="polite">
                  {asking.sentence}
                </Text>
              ) : null}
              <View style={{ flexDirection: "row", gap: th.space[2] }}>
                <Button label={t("common.confirm")} busy={save.isPending} disabled={!online} onPress={() => {
                    if (confirming.current) return;
                    confirming.current = true;
                    save.mutate({ role: asking.role, on: asking.on, expect: asking.expect });
                  }} style={{ flexGrow: 1 }} />
                {/* Keep waits while the save is out: closing the question then would leave a write unsaid (E11). */}
                <Button label={t("common.keep")} variant="secondary" disabled={save.isPending} onPress={() => setAsking(null)} style={{ flexGrow: 1 }} />
              </View>
            </Note>
          ) : null}
          {view.lines.map((line) => (
            <Text key={line} variant="xs" tone="muted">
              {line}
            </Text>
          ))}
          <OfflineDecisionNote />
          <Text variant="xs" tone="muted">
            {t("subs.phoneWebOnly")}
          </Text>
          <Button label={t("mobile.openOnWeb")} variant="ghost" onPress={() => openWeb(`/root/${schoolId}`)} />
        </>
      ) : null}
    </Card>
  );
}
