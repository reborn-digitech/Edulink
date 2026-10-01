import { useRef, useState } from "react";
import { usePrivateScreen } from "@/lib/private-screen";
import { View, type GestureResponderEvent, type LayoutChangeEvent } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import Svg, { Path } from "react-native-svg";
import { okSchema, paperSignatureDecidedSchema, signaturesViewSchema, type SignaturesView } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Screen, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { SIGNATURE_SIZE, signatureDataUrl, type Point, type Stroke } from "@/lib/signature-png";
import { formatInstant, Pill } from "@/screens/family/shared";
import { must, openWeb } from "./shared";

/**
 * The signatures page of whoever signs the school's papers — the web's
 * /admin/signatures and /teacher/signatures: the papers that wait for the
 * reader's signature first, because they are somebody else's work held up;
 * then the reader's own signature, signed here with a finger; then, for an
 * admin and the head, the school's seal, which the phone reads and the web
 * sets (a seal is a picture, and taking the paper out of a photograph is
 * the web's canvas work). A teacher signs report cards and has no seal to
 * read.
 *
 * What is sent is a PNG, the same strip the web's canvas makes, written on
 * the phone (lib/signature-png.ts); the row keeps the picture, never a URL.
 */
export const SIGNATURES_KEY = ["office", "signatures"] as const;
/** The box and the pictures are white in both themes, because the paper they are printed on is. */
const PAPER = "#ffffff";

export function Signatures() {
  // A paper names a pupil: private while on screen (no screenshots or screen recording on the phone).
  usePrivateScreen();
  const t = useT();
  const role = useRole();
  const query = useQuery({ queryKey: SIGNATURES_KEY, queryFn: async () => signaturesViewSchema.parse(unwrap(await api().get("/api/v1/office/signatures"))) });
  const view = query.data;
  return (
    <Screen title={t("signatures.title")} description={role === "TEACHER" ? t("signatures.teacherIntro") : t("signatures.intro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {view ? (
        <>
          <Waiting view={view} />
          <Mine view={view} />
          {role !== "TEACHER" ? <Seal view={view} /> : null}
        </>
      ) : null}
    </Screen>
  );
}

/** The papers somebody else issued on a template that asks for this reader's signature: open to read, sign or decline. */
function Waiting({ view }: { view: SignaturesView }) {
  const t = useT();
  const th = useTheme();
  const role = useRole();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const { locale } = useLocale();
  const decide = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => paperSignatureDecidedSchema.parse(must(await api().post(`/api/v1/office/signatures/${id}/decide`, { approve }), t("common.somethingWrong"))),
    onSuccess: (decided) => {
      toast.show(decided.status === "SIGNED" ? t("signatures.signedToast") : t("signatures.declinedToast"), "ok");
      void qc.invalidateQueries({ queryKey: SIGNATURES_KEY });
    },
  });
  const busy = (id: string) => decide.isPending && decide.variables?.id === id;
  return (
    <Card title={t("signatures.waitingTitle")} action={view.waiting.length > 0 ? <Pill label={t("signatures.waitingCount", { count: view.waiting.length })} tone="warn" /> : undefined}>
      <Text variant="sm" tone="muted">
        {t("signatures.waitingIntro")}
      </Text>
      {!view.mine.image && view.waiting.length > 0 ? (
        <Text variant="sm" tone="warn">
          {t("signatures.addYoursFirst")}
        </Text>
      ) : null}
      {decide.isError ? <Failed message={decide.error.message} /> : null}
      {view.waiting.length === 0 ? (
        <Empty icon="pencil" title={t("signatures.waitingNone")} action={role === "TEACHER" ? <Button label={t("nav.reportCards")} variant="secondary" onPress={() => router.push("/(app)/report-cards" as never)} /> : <Button label={t("nav.certificates")} variant="secondary" onPress={() => router.push("/(app)/staff-certificates" as never)} />} />
      ) : (
        view.waiting.map((paper) => {
          const set = paper.paperKind === "REPORT_CARD_SET";
          return (
            <View key={paper.id} style={{ gap: th.space[2], paddingVertical: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
              <Text variant="base" bold>
                {paper.studentName}
              </Text>
              <Text variant="sm">{[paper.title, paper.serial, set ? t("signatures.setCount", { count: paper.count }) : null].filter(Boolean).join(" · ")}</Text>
              <Text variant="xs" tone="muted">
                {t("signatures.issuedBy", { name: paper.requestedByName ?? "—", date: formatInstant(paper.createdAt, locale, { day: "numeric", month: "short", year: "numeric" }) })}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                {/* A certificate opens on the phone; a set of report cards is the web's page, signed in there. */}
                <Button label={t("signatures.openPaper")} variant="secondary" onPress={() => (set ? openWeb(`/report-cards/${paper.paperId}`) : router.push({ pathname: "/(app)/certificate", params: { id: paper.paperId } } as never))} />
                <Button label={t("signatures.sign")} accessibilityLabel={`${t("signatures.sign")}: ${paper.studentName}, ${paper.title}`} busy={busy(paper.id)} disabled={!view.mine.image} onPress={() => decide.mutate({ id: paper.id, approve: true })} />
                <Button label={t("signatures.decline")} accessibilityLabel={`${t("signatures.decline")}: ${paper.studentName}, ${paper.title}`} variant="ghost" busy={busy(paper.id)} onPress={() => decide.mutate({ id: paper.id, approve: false })} />
              </View>
            </View>
          );
        })
      )}
    </Card>
  );
}

/** The reader's own signature: as it stands, and the box to sign a new one in. */
function Mine({ view }: { view: SignaturesView }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [error, setError] = useState<string | null>(null);
  const refresh = () => void qc.invalidateQueries({ queryKey: SIGNATURES_KEY });
  const save = useMutation({
    mutationFn: async (image: string) => okSchema.parse(must(await api().post("/api/v1/office/signatures/mine", { image }), t("common.somethingWrong"))),
    onSuccess: () => {
      toast.show(t("signatures.saved"), "ok");
      setStrokes([]);
      setError(null);
      refresh();
    },
    onError: (e) => setError(e.message),
  });
  const remove = useMutation({
    mutationFn: async () => okSchema.parse(must(await api().post("/api/v1/office/signatures/mine/remove", {}), t("common.somethingWrong"))),
    onSuccess: () => {
      toast.show(t("signatures.removed"), "ok");
      refresh();
    },
    onError: (e) => setError(e.message),
  });
  const submit = () => {
    if (strokes.length === 0) {
      setError(t("signatures.drawSomething"));
      return;
    }
    setError(null);
    save.mutate(signatureDataUrl(strokes));
  };
  return (
    <Card title={t("signatures.mineTitle")}>
      <Text variant="sm" tone="muted">
        {t("signatures.mineIntro")}
      </Text>
      {view.mine.image ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[3], flexWrap: "wrap" }}>
          <Image source={{ uri: view.mine.image }} accessibilityLabel={t("signatures.current")} contentFit="contain" style={{ width: 180, height: 60, backgroundColor: PAPER, borderRadius: th.radius.md, borderWidth: 1, borderColor: th.border }} />
          <Button label={t("signatures.remove")} variant="secondary" busy={remove.isPending} onPress={() => remove.mutate()} />
        </View>
      ) : (
        <Text variant="sm" tone="muted">
          {t("signatures.none")}
        </Text>
      )}
      <Text variant="xs" tone="muted">
        {t("signatures.drawHint")}
      </Text>
      <SignaturePad strokes={strokes} onChange={setStrokes} />
      {error ? (
        <Text variant="sm" tone="danger" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
        <Button label={t("signatures.clear")} variant="secondary" disabled={strokes.length === 0} onPress={() => { setStrokes([]); setError(null); }} />
        <Button label={t("signatures.save")} busy={save.isPending} onPress={submit} />
      </View>
    </Card>
  );
}

/** The school's seal, read on the phone; the admin sets it on the web, where a photograph's paper can be taken out. */
function Seal({ view }: { view: SignaturesView }) {
  const t = useT();
  const th = useTheme();
  return (
    <Card title={t("signatures.sealTitle")}>
      <Text variant="sm" tone="muted">
        {t("signatures.sealIntro")}
      </Text>
      {view.seal.image ? (
        <Image source={{ uri: view.seal.image }} accessibilityLabel={t("signatures.sealCurrent")} contentFit="contain" style={{ width: 112, height: 112, backgroundColor: PAPER, borderRadius: th.radius.md, borderWidth: 1, borderColor: th.border }} />
      ) : (
        <Text variant="sm" tone="muted">
          {t("signatures.sealNone")}
        </Text>
      )}
      <Text variant="xs" tone="muted">
        {view.canSetSeal ? t("mobile.sealOnWeb") : t("signatures.sealOnlyAdmin")}
      </Text>
      {view.canSetSeal ? <Button label={t("mobile.openOnWeb")} variant="secondary" onPress={() => openWeb("/admin/signatures")} /> : null}
    </Card>
  );
}

/** The SVG path of a stroke: a move, then a line to each point; a one-point stroke is drawn as a dot by the round cap. */
export function strokePath(stroke: Stroke): string {
  if (stroke.length === 0) return "";
  const [first, ...rest] = stroke as [Point, ...Point[]];
  return `M ${first.x} ${first.y}${rest.map((p) => ` L ${p.x} ${p.y}`).join("")}${rest.length === 0 ? ` L ${first.x} ${first.y}` : ""}`;
}

/**
 * The box to sign in: a white strip of the web's proportions, drawn with
 * react-native-svg as the finger moves. The box takes the touch from the
 * screen's scroll at the first contact and keeps it, so a stroke that
 * wanders is a stroke and not a scroll. Points are kept in the PNG's own
 * coordinates (600 by 200), whatever width the box is drawn at.
 */
export function SignaturePad({ strokes, onChange }: { strokes: Stroke[]; onChange: (next: Stroke[]) => void }) {
  const t = useT();
  const th = useTheme();
  const [width, setWidth] = useState(0);
  const current = useRef<Stroke | null>(null);
  const scale = width > 0 ? SIGNATURE_SIZE.width / width : 1;
  const height = width > 0 ? width / (SIGNATURE_SIZE.width / SIGNATURE_SIZE.height) : 0;
  const at = (event: GestureResponderEvent): Point => ({ x: event.nativeEvent.locationX * scale, y: event.nativeEvent.locationY * scale });
  const start = (event: GestureResponderEvent) => {
    current.current = [at(event)];
    onChange([...strokes, current.current]);
  };
  const move = (event: GestureResponderEvent) => {
    if (!current.current) return;
    current.current = [...current.current, at(event)];
    onChange([...strokes.slice(0, -1), current.current]);
  };
  const end = () => {
    current.current = null;
  };
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t("signatures.drawBox")}
      testID="signature-pad"
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={start}
      onResponderMove={move}
      onResponderRelease={end}
      onResponderTerminate={end}
      style={{ width: "100%", height: height || 120, backgroundColor: PAPER, borderRadius: th.radius.md, borderWidth: 1, borderStyle: "dashed", borderColor: th.borderStrong, overflow: "hidden" }}
    >
      {width > 0 ? (
        <Svg width={width} height={height} viewBox={`0 0 ${SIGNATURE_SIZE.width} ${SIGNATURE_SIZE.height}`}>
          {strokes.map((stroke, i) => (
            <Path key={i} d={strokePath(stroke)} stroke="#1a1a2e" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          ))}
        </Svg>
      ) : null}
    </View>
  );
}
