"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { OWN_DISCOUNT_CHIPS_BPS, type PartTermsBody } from "@edulink/contracts";
import { formatPaise, parsePercentBps, parseRupees } from "@edulink/i18n";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { DateField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "@/lib/navigation";
import { useLocale, useT } from "@/lib/i18n";
import { paymentAction, termsAction } from "../subscriptions/actions";
import { setSchoolModuleAction } from "../colleges/actions";
import { Said, Sheet } from "../subscriptions/sheet";
import { drawnOn, usePendingWrites, whenAnswered, type DoorAnswer, type HeldSwitch } from "../subscriptions/pending-writes";
import { PremiumSwitch } from "../subscriptions/premium-switch";

/** The terms as read, sent back with every save (compare-and-set; the review's B-3: the note too). */
type Expect = { termsSetAt: string | null; premiumStudents: boolean; premiumTeachers: boolean; subscription: PartTermsBody; premium: PartTermsBody; note: string | null };
type Role = "students" | "teachers";
type SheetName = "subscription" | "premium" | "payment" | null;
type Chips = { mode: PartTermsBody["mode"]; discount: string; price: string };
/** The subscription's status and renewal as a payment is reckoned from them (the payment body's fromStatus and fromDueAt). */
type Standing = { fromStatus: string | null; fromDueAt: string | null };
const standingOf = (payment: Standing): Standing => ({ fromStatus: payment.fromStatus, fromDueAt: payment.fromDueAt });

/** What the card's controls need: the terms as read, our offer's figures for the sheets' chips and warnings, and the payment's starting values. */
export type TermsControlsProps = {
  schoolId: string;
  school: string;
  college: boolean;
  expect: Expect;
  ours: { subscriptionPaise: number | null; subscriptionDiscountBps: number; premiumPaise: number; premiumDiscountBps: number };
  premiumLines: string[];
  payment: { fromStatus: string | null; fromDueAt: string | null; today: string; billPaise: number | null };
  viduraOff: boolean;
  initialSheet: SheetName;
};

const rupees = (paise: number | null) => (paise === null ? "" : String(Math.round(paise / 100)));
const percentOf = (bps: number) => (bps % 100 === 0 ? String(bps / 100) : (bps / 100).toFixed(2));

/** A part's chip as the sheet holds it, back to the body (null when a figure is not one). */
function chipOf(mode: PartTermsBody["mode"], discount: string, price: string): PartTermsBody | null {
  if (mode === "OURS") return { mode: "OURS" };
  if (mode === "OWN_DISCOUNT") {
    const bps = parsePercentBps(discount);
    return bps === null ? null : { mode: "OWN_DISCOUNT", discountBps: bps };
  }
  const paise = parseRupees(price);
  return paise === null ? null : { mode: "OWN_PRICE", pricePaise: paise };
}
const sameChip = (a: PartTermsBody, b: PartTermsBody) => JSON.stringify(a) === JSON.stringify(b);

/** A part's chip as a sheet shows it: the mode, and its own discount or price as typed. */
function chipFields(chip: PartTermsBody): Chips {
  return { mode: chip.mode, discount: chip.mode === "OWN_DISCOUNT" ? percentOf(chip.discountBps) : "", price: chip.mode === "OWN_PRICE" ? rupees(chip.pricePaise) : "" };
}
const subOf = (expect: Expect) => chipFields(expect.subscription);
const premOf = (expect: Expect) => ({ ...chipFields(expect.premium), students: expect.premiumStudents, teachers: expect.premiumTeachers });

/**
 * THE SCHOOL CARD'S CONTROLS (§2.3, §2.4; the coordinating session's C5). The premium switches (on: the server's sentence in a
 * toast with Undo, written when it goes; off: a sheet first, its sentence in the future); the two sheets "Shalaghar
 * subscription: {school}" and "Premium add-on: {school}" (exclusive chips, ours, an own discount or an own price; a note
 * only the operator sees and a reason the school can read); and Record payment (Paid on, reference, the amount before GST
 * filled with the bill; where the renewal moves and from where; an amount unlike the bill needs the tick).
 *
 * A sheet shows the server's sentence for its values as they stand, asked for as the operator chooses, with no Review press
 * (C5 point 3); Save is enabled once the sentence shown is for the values as they stand, and shows it in a toast with Undo.
 * A write held in a toast is never lost (C5 point 1, usePendingWrites); a save refused at its commit opens its sheet again
 * with what was typed (the review, C6); a refusal because the terms changed meanwhile refreshes the card, keeping what was
 * typed (C5 point 2). Every sentence is the server's (../subscriptions/actions.ts), but two: a commit whose answer is lost
 * (whenAnswered) is said as such, since whether it was saved is not known, and what it held is let go; and Record payment's
 * line below. While any write is held, the switches, the sheets and Record payment wait; an Undo lets them go only where it
 * took the write back, never once the write has gone.
 *
 * RECORD PAYMENT IS PINNED TO THE STANDING IT WAS OPENED ON. Its preview and its save send the status and the renewal as they
 * stood when the sheet was opened (or when the page opened it itself), and nothing moves them: not a redraw, not a refusal of
 * the save (its commit's or its early send's), not a lost answer, after each of which the sheet opens again with what was
 * typed and on the same standing. Only closing the sheet, or opening it afresh, lets it go. For this sheet alone this replaces
 * C5 point 2's redraw: after a stale refusal the card is still drawn again, but the sheet stays on the standing it was opened
 * on, says so in a line of its own under the server's sentence, and its Save waits. The cost: after
 * root.paymentChangedMeanwhile the operator closes Record payment and opens it again, and types the reference, a Paid on that
 * is not today, an amount that is not the bill and the tick again, where the redrawn sheet used to take Save again. It is
 * borne because that refusal can hide a payment already recorded (missedPayment in src/lib/subscriptions.ts judges "already
 * recorded" with our own paid-on day), and a lost COMMIT acknowledgement still comes back from the server as a refusal: a
 * sheet that followed the redraw would then take Save for a second year.
 */
export function TermsControls(props: TermsControlsProps) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { toast, dismiss } = useToast();
  const hold = usePendingWrites();
  const [pending, startTransition] = useTransition();
  const [sheet, setSheet] = useState<SheetName>(props.initialSheet);
  const [error, setError] = useState<string | null>(null);
  // Whether Record payment's last answer, its preview's or its save's refusal, was stale: the sheet then says, in a line of
  // its own, that it stays on the standing it was opened on. Set only at those two refusals. Cleared by opening a sheet and
  // by closing one; by a preview that passes, or is refused without being stale; at the start of the payment's save, by its
  // lost answer, its early refusal and its commit's refusal that is not stale; and on the switch's off sheet, by its opening,
  // its Confirm's refusal, its close and its Cancel. saveTerms never meets it set: its sheet's opening cleared it.
  const [stale, setStale] = useState(false);
  const [off, setOff] = useState<{ role: Role; sentence: string } | null>(null);
  // Any write held on the screen (a switch's, a sheet's save, a payment), held or in flight: the switches, the sheets and
  // Record payment wait, so a second act cannot cross the first's commit.
  const [waiting, setWaiting] = useState(false);
  // A switch shown moved while its write is held, and after its save until the card is drawn again (drawnOn; the review, C4).
  const [moved, setMoved] = useState<({ role: Role } & HeldSwitch) | null>(null);
  // The terms as last drawn, for an answer's handler, which runs in a closure from the press.
  const drawn = useRef(props.expect);
  useEffect(() => {
    drawn.current = props.expect;
  });
  const money = (paise: number) => formatPaise(paise, locale);
  const failed = (message: string) => toast({ tone: "danger", title: t("root.didNotWork"), description: message, duration: null });
  /** A commit whose answer was lost: it may or may not have been saved, so said as such, pinned, naming the school. */
  const notKnown = () => toast({ tone: "danger", title: t("subs.noClearAnswer", { school: props.school }), duration: null });
  /** A refusal: its sentence, and, where the terms changed meanwhile, the card drawn again from the server (C5 point 2). */
  const refused = (result: { error: string; stale?: boolean }, show: (message: string) => void = setError) => {
    show(result.error);
    if (result.stale) router.refresh();
  };

  // The subscription sheet's chip, the premium sheet's chip and switches, the note, the reason and the payment's fields.
  const [sub, setSub] = useState<Chips>(() => subOf(props.expect));
  const [prem, setPrem] = useState(() => premOf(props.expect));
  const [note, setNote] = useState(props.expect.note ?? "");
  const [reason, setReason] = useState("");
  const [pay, setPay] = useState(() => ({ paidOn: props.payment.today, ref: "", amount: rupees(props.payment.billPaise), full: false }));
  // The standing Record payment was opened on (pinned): its preview and its save send it. Opening the sheet, or the page
  // opening it itself, pins the card's standing as drawn then; only closing the sheet or opening it afresh lets it go.
  const [payFrom, setPayFrom] = useState<Standing | null>(() => (props.initialSheet === "payment" ? standingOf(props.payment) : null));

  function open(name: SheetName) {
    setError(null);
    setStale(false);
    setReason("");
    // Each opening starts from the terms as read: edits left in a sheet that was cancelled are not carried into the next.
    setSub(subOf(props.expect));
    setPrem(premOf(props.expect));
    setNote(props.expect.note ?? "");
    setPay({ paidOn: props.payment.today, ref: "", amount: rupees(props.payment.billPaise), full: false });
    setPayFrom(name === "payment" ? standingOf(props.payment) : null);
    setSheet(name);
  }
  /** A sheet closed: Record payment's pinned standing goes with it, and so do its sentence, which a sheet opened again asks anew, and its stale line. */
  function close() {
    setSheet(null);
    setPayFrom(null);
    setSaid(null);
    setStale(false);
  }

  /** The body of a sheet's save: what the sheet changed, the terms as read, the note, and the reason where asked. */
  function termsBody(preview: boolean, withReason: boolean): Record<string, unknown> | null {
    const body: Record<string, unknown> = { expect: props.expect, preview };
    if (sheet === "subscription") {
      const chip = chipOf(sub.mode, sub.discount, sub.price);
      if (!chip) return null;
      // Only a chip the operator moved, or any chip where the terms are not set yet (a save of a part sets them, §2.4).
      if (!sameChip(chip, props.expect.subscription) || props.expect.termsSetAt === null) body.subscription = chip;
    }
    if (sheet === "premium") {
      const chip = chipOf(prem.mode, prem.discount, prem.price);
      if (!chip) return null;
      const premium: Record<string, unknown> = {};
      // A chip the operator moved, or any chip where the terms are not set yet: any save of a sheet sets the terms (§2.4).
      if (!sameChip(chip, props.expect.premium) || props.expect.termsSetAt === null) premium.terms = chip;
      if (prem.students !== props.expect.premiumStudents) premium.students = prem.students;
      if (!props.college && prem.teachers !== props.expect.premiumTeachers) premium.teachers = prem.teachers;
      if (Object.keys(premium).length) body.premium = premium;
    }
    const n = note.trim() || null;
    if (n !== (props.expect.note ?? null)) body.note = n;
    if (withReason && reason.trim()) body.reason = reason.trim();
    return body;
  }

  function payBody(preview: boolean, differs: boolean) {
    const amount = parseRupees(pay.amount);
    // The standing the sheet was opened on, never the card as drawn now.
    if (amount === null || !pay.paidOn || !payFrom) return null;
    return { fromStatus: payFrom.fromStatus, fromDueAt: payFrom.fromDueAt, paidOn: pay.paidOn, ref: pay.ref.trim() || null, amountPaise: amount, ...(differs && pay.full ? { acceptDifference: true } : {}), preview };
  }

  // The server's sentence for the open sheet's values as they stand (C5 point 3): asked for a moment after a change, kept with
  // the values it was worded for, so Save is enabled only while the sentence shown is theirs. The payment's preview also
  // answers the bill it reckoned, against which the tick is judged (the review, C5).
  const previewBody = sheet === "subscription" || sheet === "premium" ? termsBody(true, false) : sheet === "payment" ? payBody(true, false) : null;
  const previewKey = previewBody ? `${sheet}:${JSON.stringify(previewBody)}` : null;
  const [said, setSaid] = useState<{ key: string; sentence: string; bill: number | null } | null>(null);
  useEffect(() => {
    if (!previewKey || !previewBody) return;
    let live = true;
    const timer = setTimeout(() => {
      const ask = sheet === "payment" ? paymentAction(props.schoolId, previewBody) : termsAction(props.schoolId, previewBody);
      void ask.then((result) => {
        if (!live) return;
        if (result.ok) {
          setError(null);
          setStale(false);
          setSaid({ key: previewKey, sentence: result.sentence, bill: result.bill ?? null });
        } else {
          refused(result);
          setStale(sheet === "payment" && Boolean(result.stale));
          // A stale refusal: a sentence kept from an earlier preview was worded for a standing that no longer holds, so it
          // goes, and putting the fields back to its values cannot arm Save with it.
          if (result.stale) setSaid(null);
        }
      });
    }, 300);
    return () => {
      live = false;
      clearTimeout(timer);
    };
    // previewKey names everything the preview depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewKey]);
  const sentence = said && said.key === previewKey ? said.sentence : null;
  const bill = said && said.key === previewKey ? said.bill : props.payment.billPaise;
  const differs = bill !== null && parseRupees(pay.amount) !== bill;

  function saveTerms() {
    setError(null);
    const body = termsBody(false, true);
    if (!body) return setError(t("subs.invalid"));
    const movesTerms = Boolean(body.subscription) || Boolean((body.premium as { terms?: unknown } | undefined)?.terms);
    if (movesTerms && !reason.trim()) return setError(t("subs.reasonNeeded"));
    const draft = { sheet, sub, prem, note, reason };
    close();
    setWaiting(true);
    const reopen = () => {
      setSub(draft.sub);
      setPrem(draft.prem);
      setNote(draft.note);
      setReason(draft.reason);
      setSheet(draft.sheet);
    };
    // No clear answer: said, the sheet open again with what was typed, the card drawn again; reckoned against the terms as
    // they then stand, a save that did land leaves nothing to change.
    const lost = () => {
      notKnown();
      reopen();
      router.refresh();
    };
    let toastId = "";
    const write = hold(
      () =>
        whenAnswered(
          termsAction(props.schoolId, body),
          (saved) => {
            setWaiting(false);
            if (!saved.ok) {
              // Refused at its commit: the sheet opens again with what was typed (the review, C6).
              failed(saved.error);
              reopen();
              refused(saved);
              return;
            }
            router.refresh();
          },
          () => {
            setWaiting(false);
            lost();
          },
        ),
      // The page hidden or left before the toast goes: the same save to the terms door (C5 point 1).
      () => ({ url: `/api/v1/operator/schools/${props.schoolId}/terms`, method: "PUT", body }),
      {
        onSending: () => dismiss(toastId),
        onSent: (answer: DoorAnswer) => {
          setWaiting(false);
          if (answer === "unknown") return lost();
          if (answer === "refused") {
            failed(t("subs.earlyNotSaved"));
            reopen();
          }
          router.refresh();
        },
      },
    );
    toastId = toast({
      tone: "ok",
      title: sentence ?? t("subs.cardTitle"),
      // An Undo that came after the write had gone takes nothing back: the controls wait for its answer.
      onUndo: () => {
        if (write.undo()) setWaiting(false);
      },
      onCommit: write.commit,
    });
  }

  function savePayment() {
    setError(null);
    setStale(false);
    const body = payBody(false, differs);
    if (!body) return setError(t("subs.invalid"));
    if (differs && !pay.full) return setError(t("root.paymentDiffers"));
    const draft = pay;
    // The standing the sheet was opened on, which the save carries: the sheet opens again on it after any refusal or lost
    // answer. A save that was taken leaves the pin as it is; the next opening pins afresh, so a taken save never moves a sheet.
    const sentFrom = { fromStatus: body.fromStatus, fromDueAt: body.fromDueAt };
    setSheet(null);
    setSaid(null);
    setWaiting(true);
    /** The sheet open again with what was typed, on the standing it was opened on. */
    const reopen = () => {
      setPay(draft);
      setPayFrom(sentFrom);
      setSheet("payment");
    };
    // No clear answer: said, and the sheet open again as after a refusal.
    const lost = () => {
      notKnown();
      setError(null);
      setStale(false);
      reopen();
      router.refresh();
    };
    let toastId = "";
    const write = hold(
      () =>
        whenAnswered(
          paymentAction(props.schoolId, body),
          (saved) => {
            setWaiting(false);
            if (!saved.ok) {
              failed(saved.error);
              reopen();
              refused(saved);
              setStale(Boolean(saved.stale));
              return;
            }
            router.refresh();
          },
          () => {
            setWaiting(false);
            lost();
          },
        ),
      // The page hidden or left before the toast goes: the same payment to the payment door, which the operator has read
      // as done ("Status becomes Paid"; the walk of 22 November 2026).
      () => ({ url: `/api/v1/operator/schools/${props.schoolId}/payment`, method: "POST", body }),
      {
        onSending: () => dismiss(toastId),
        onSent: (answer: DoorAnswer) => {
          setWaiting(false);
          if (answer === "unknown") return lost();
          if (answer === "refused") {
            failed(t("subs.earlyNotSaved"));
            setStale(false);
            reopen();
          }
          router.refresh();
        },
      },
    );
    toastId = toast({
      tone: "ok",
      title: sentence ?? t("subs.recordPayment"),
      // An Undo that came after the payment had gone takes nothing back: Record payment waits for its answer.
      onUndo: () => {
        if (write.undo()) setWaiting(false);
      },
      onCommit: write.commit,
    });
  }

  const isOn = (role: Role) => {
    const holds = role === "students" ? props.expect.premiumStudents : props.expect.premiumTeachers;
    return drawnOn(moved && moved.role === role ? moved : undefined, props.expect, holds);
  };
  /** The switch's write answered as saved: drawn as set until the first redraw after this answer (drawnOn). */
  const markSaved = (role: Role) => setMoved((m) => (m && m.role === role ? { ...m, savedOn: drawn.current } : m));

  function flip(role: Role) {
    const on = !isOn(role);
    const body = { premium: { [role]: on }, expect: props.expect };
    startTransition(async () => {
      const preview = await termsAction(props.schoolId, { ...body, preview: true });
      if (!preview.ok) return refused(preview, failed);
      if (!on) {
        setError(null);
        setStale(false);
        setOff({ role, sentence: preview.sentence });
        return;
      }
      setMoved({ role, on: true });
      setWaiting(true);
      let toastId = "";
      const write = hold(
        () =>
          whenAnswered(
            termsAction(props.schoolId, body),
            (answer) => {
              setWaiting(false);
              if (!answer.ok) {
                setMoved(null);
                return refused(answer, failed);
              }
              markSaved(role);
              router.refresh();
            },
            () => {
              setWaiting(false);
              setMoved(null);
              notKnown();
              router.refresh();
            },
          ),
        () => ({ url: `/api/v1/operator/schools/${props.schoolId}/terms`, method: "PUT", body }),
        {
          onSending: () => dismiss(toastId),
          onSent: (answer: DoorAnswer) => {
            setWaiting(false);
            if (answer === "taken") markSaved(role);
            else {
              setMoved(null);
              if (answer === "refused") failed(t("subs.earlyNotSaved"));
              else notKnown();
            }
            router.refresh();
          },
        },
      );
      toastId = toast({
        tone: "ok",
        title: preview.sentence,
        // An Undo that came after the write had gone takes nothing back: the switch stays drawn and the controls wait.
        onUndo: () => {
          if (write.undo()) {
            setMoved(null);
            setWaiting(false);
          }
        },
        onCommit: write.commit,
      });
    });
  }

  function confirmOff() {
    if (!off) return;
    startTransition(async () => {
      const saved = await termsAction(props.schoolId, { premium: { [off.role]: false }, expect: props.expect });
      if (!saved.ok) {
        // The off sheet's refusal is never drawn with Record payment's line.
        setStale(false);
        return refused(saved);
      }
      setOff(null);
      toast({ tone: "ok", title: saved.sentence });
      router.refresh();
    });
  }

  function switchVidura() {
    startTransition(async () => {
      const result = await setSchoolModuleAction(props.schoolId, { module: "ASSISTANT", on: true });
      if (!result.ok) {
        failed(result.error ?? t("root.didNotWork"));
        return;
      }
      toast({ tone: "ok", title: t("subs.viduraSwitched") });
      router.refresh();
    });
  }

  const switchFor = (role: Role) => {
    if (role === "teachers" && props.college) return null;
    return (
      <span className="inline-flex items-center gap-1 text-sm text-fg">
        {t(role === "students" ? "subs.colStudents" : "subs.colTeachers")}
        <PremiumSwitch
          on={isOn(role)}
          label={t(role === "students" ? "subs.switchStudents" : "subs.switchTeachers", { school: props.school })}
          disabled={pending || waiting}
          onToggle={() => flip(role)}
          testId={`card-premium-${role}`}
        />
      </span>
    );
  };

  /** A part's three exclusive chips and their fields (§2.4); a college pays its tier, so no own price there. */
  const partChips = (value: Chips, set: (patch: Partial<Chips>) => void, oursPaise: number | null, oursDiscountBps: number, tier: boolean) => {
    const discountBps = parsePercentBps(value.discount);
    const pricePaise = parseRupees(value.price);
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Chip pressed={value.mode === "OURS"} onClick={() => set({ mode: "OURS" })}>
            {tier ? t("subs.chipOursTier", { price: oursPaise === null ? "—" : money(oursPaise) }) : t("subs.chipOurs", { price: oursPaise === null ? "—" : money(oursPaise) })}
          </Chip>
          <Chip pressed={value.mode === "OWN_DISCOUNT"} onClick={() => set({ mode: "OWN_DISCOUNT" })}>
            {t("subs.chipOwnDiscount")}
          </Chip>
          {!tier && (
            <Chip pressed={value.mode === "OWN_PRICE"} onClick={() => set({ mode: "OWN_PRICE" })}>
              {t("subs.chipOwnPrice")}
            </Chip>
          )}
        </div>
        {value.mode === "OWN_DISCOUNT" && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {OWN_DISCOUNT_CHIPS_BPS.map((bps) => (
                <Chip key={bps} pressed={discountBps === bps} onClick={() => set({ discount: percentOf(bps) })}>
                  {`${percentOf(bps)} %`}
                </Chip>
              ))}
            </div>
            <TextField label={t("subs.ownDiscountLabel")} inputMode="decimal" value={value.discount} onChange={(e) => set({ discount: e.target.value })} />
            {discountBps !== null && discountBps < oursDiscountBps && <p className="text-xs font-medium text-warn">{t("subs.warnDiscountSmaller", { ours: percentOf(oursDiscountBps) })}</p>}
          </div>
        )}
        {value.mode === "OWN_PRICE" && !tier && (
          <div className="space-y-2">
            <TextField label={t("subs.ownPriceLabel")} inputMode="numeric" value={value.price} onChange={(e) => set({ price: e.target.value })} />
            {oursPaise !== null && (
              <Button type="button" size="sm" variant="ghost" onClick={() => set({ price: rupees(oursPaise) })}>
                {t("subs.fixAt", { price: money(oursPaise) })}
              </Button>
            )}
            {pricePaise !== null && oursPaise !== null && pricePaise > oursPaise && <p className="text-xs font-medium text-warn">{t("subs.warnPriceAbove", { ours: money(oursPaise) })}</p>}
          </div>
        )}
        {tier && <p className="text-xs text-fg-muted">{t("subs.collegeTierOnly")}</p>}
      </div>
    );
  };

  const fields = (
    <>
      <TextField label={t("subs.noteLabel")} hint={t("subs.noteOnlyYou")} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
      <TextField label={t("subs.reason")} hint={t("subs.reasonSchoolReads")} value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} />
    </>
  );
  // No Review press (C5 point 3): Save, once the sentence shown is for the values as they stand.
  const footer = (save: () => void, saveLabel: string) => (
    <>
      <Button variant="ghost" onClick={close}>
        {t("common.cancel")}
      </Button>
      <Button loading={pending} disabled={!sentence || waiting} onClick={save}>
        {saveLabel}
      </Button>
    </>
  );
  const alert = error && (
    <p role="alert" className="text-sm font-medium text-danger">
      {error}
    </p>
  );
  // Record payment's alert: the server's sentence, and under it, while the sheet's last answer was stale, a line of its own
  // saying that the sheet stays on the standing it was opened on.
  const paymentAlert = error && (
    <p role="alert" className="text-sm font-medium text-danger">
      {error}
      {stale && (
        <span className="mt-1 block" data-testid="payment-pinned">
          {t("subs.paymentSheetPinned")}
        </span>
      )}
    </p>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {switchFor("students")}
        {switchFor("teachers")}
        <Button type="button" size="sm" variant={props.expect.termsSetAt === null ? "secondary" : "ghost"} disabled={waiting} onClick={() => open("subscription")} data-testid="change-subscription">
          {/* §2.3: terms not set, Set terms. */}
          {props.expect.termsSetAt === null ? t("subs.setTermsCard") : `${t("subs.partSubscription")} · ${t("subs.change")}`}
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={waiting} onClick={() => open("premium")} data-testid="change-premium">
          {t("subs.partPremium")} · {t("subs.change")}
        </Button>
        {/* Record payment also waits while a switch's preview is out, so its sheet and the switch's off sheet are never open together. */}
        <Button type="button" size="sm" variant="secondary" disabled={waiting || pending} onClick={() => open("payment")} data-testid="record-payment">
          {t("subs.recordPayment")}
        </Button>
      </div>
      {props.viduraOff && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-fg">
          <span>{t("subs.viduraOff")}</span>
          <Button type="button" size="sm" variant="secondary" loading={pending} onClick={switchVidura}>
            {t("subs.viduraOn")}
          </Button>
        </p>
      )}

      <Sheet open={sheet === "subscription"} title={t("subs.sheetSubscription", { school: props.school })} onClose={close} testId="subscription-sheet" footer={footer(saveTerms, t("common.save"))}>
        {partChips(sub, (patch) => setSub((s) => ({ ...s, ...patch })), props.ours.subscriptionPaise, props.ours.subscriptionDiscountBps, props.college)}
        {fields}
        <Said sentence={sentence} />
        {alert}
      </Sheet>

      <Sheet open={sheet === "premium"} title={t("subs.sheetPremium", { school: props.school })} onClose={close} testId="premium-sheet" footer={footer(saveTerms, t("common.save"))}>
        {props.premiumLines.map((line) => (
          <p key={line} className="text-xs text-fg-muted">
            {line}
          </p>
        ))}
        <div className="flex flex-wrap gap-3 text-sm">
          {(["students", "teachers"] as const)
            .filter((role) => role === "students" || !props.college)
            .map((role) => (
              <label key={role} className="flex min-h-11 items-center gap-2">
                <input type="checkbox" className="size-5 accent-accent" checked={prem[role]} onChange={(e) => setPrem((p) => ({ ...p, [role]: e.target.checked }))} />
                {t(role === "students" ? "subs.colStudents" : "subs.colTeachers")}
              </label>
            ))}
        </div>
        {partChips(prem, (patch) => setPrem((p) => ({ ...p, ...patch })), props.ours.premiumPaise, props.ours.premiumDiscountBps, false)}
        {fields}
        <Said sentence={sentence} />
        {alert}
      </Sheet>

      <Sheet open={sheet === "payment"} title={t("subs.paymentTitle", { school: props.school })} onClose={close} testId="payment-sheet" footer={footer(savePayment, t("subs.recordPayment"))}>
        <DateField label={t("subs.paidOn")} value={pay.paidOn} onChange={(e) => setPay((p) => ({ ...p, paidOn: e.target.value }))} />
        <TextField label={t("subs.reference")} value={pay.ref} maxLength={120} onChange={(e) => setPay((p) => ({ ...p, ref: e.target.value }))} />
        <TextField
          label={t("subs.amount")}
          hint={props.payment.billPaise !== null ? t("subs.amountPrefilled") : undefined}
          inputMode="numeric"
          value={pay.amount}
          onChange={(e) => setPay((p) => ({ ...p, amount: e.target.value, full: false }))}
        />
        {/* The tick, judged against the bill the preview reckoned (the review, C5), and cleared when the amount moves. */}
        {differs && (
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" className="size-5 accent-accent" checked={pay.full} onChange={(e) => setPay((p) => ({ ...p, full: e.target.checked }))} />
            {t("subs.paidInFull")}
          </label>
        )}
        <Said sentence={sentence} />
        {paymentAlert}
      </Sheet>

      <Sheet
        open={off !== null}
        title={off ? t(off.role === "students" ? "subs.offTitleStudents" : "subs.offTitleTeachers", { school: props.school }) : ""}
        onClose={() => {
          setOff(null);
          setError(null);
          setStale(false);
        }}
        testId="card-premium-off-sheet"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setOff(null);
                setError(null);
                setStale(false);
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button loading={pending} onClick={confirmOff}>
              {t("common.confirm")}
            </Button>
          </>
        }
      >
        <Said sentence={off?.sentence ?? null} />
        {alert}
      </Sheet>
    </div>
  );
}
