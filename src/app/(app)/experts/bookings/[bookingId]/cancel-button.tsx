"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cancel } from "../../actions";

/**
 * Releasing a booked hour.
 *
 * ⚠ NOTHING COULD CANCEL A BOOKING UNTIL THIS EXISTED. `cancelBooking` has been
 * in `lib/experts.ts` since the feature was built and `cancel` has been exported
 * as a server action beside it — and no component imported either. A school that
 * booked the wrong hour, or an expert who fell ill, had no way to release it:
 * the slot stayed consumed and the booking stayed CONFIRMED forever. Found by
 * walking §12al of the checklist while writing it, which is the whole argument
 * for writing those sections by walking them.
 *
 * ONE BUTTON, ON THE PAGE BOTH SIDES REACH. The school comes here from *Your
 * bookings* and the expert from their own list, and this page already branches
 * on `isExpert` for everything else. A control on each list instead would be two
 * places to keep in step, and would let somebody cancel without seeing the
 * conversation they are cancelling.
 *
 * TWO STEPS, because the hour goes back to the marketplace the moment this
 * lands and the other party sees the booking turn red. That is not a keystroke's
 * worth of consequence. It is a plain inline confirm rather than a dialog, which
 * is what the rest of this codebase does.
 *
 * IT IS CONVENIENCE, NOT AUTHORISATION. `cancelBooking` independently checks
 * that the caller is staff of that school or the expert on the booking; hiding
 * the button is for the person reading the page, not for the person forging a
 * request.
 */
export function CancelButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!asking) {
    return (
      <div className="space-y-2">
        {error && (
          <p
            role="alert"
            className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger"
          >
            {error}
          </p>
        )}
        <Button size="sm" variant="ghost" onClick={() => setAsking(true)}>
          Cancel this booking
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-[--radius-md] border border-border bg-surface-muted p-3">
      <p className="text-sm leading-relaxed text-fg">
        {/* Says what actually happens, to both parties, before they press it. */}
        This frees the time for another school to book, and the other side will
        see that it was cancelled. You cannot undo it.
      </p>

      {error && (
        <p
          role="alert"
          className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="danger"
          loading={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await cancel(bookingId);
              if (result?.ok === false) {
                setError(result.error ?? "That did not work.");
                return;
              }
              setAsking(false);
              router.refresh();
            })
          }
        >
          Yes, cancel it
        </Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => setAsking(false)}>
          Keep the booking
        </Button>
      </div>
    </div>
  );
}
