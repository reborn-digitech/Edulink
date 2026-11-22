/**
 * What a screen reader is told of a toast (src/components/ui/toast.tsx): its title and description as one passage. The
 * coordinating session's walk of 22 November 2026 read "That did not work.. This school's terms…": a title that already ends
 * a sentence was given a second full stop. In every language the title's own ending stands.
 */
import { describe, expect, it } from "vitest";
import { spokenText } from "@/components/ui/toast";

describe("a toast as it is spoken", () => {
  it("a title that ends a sentence keeps its own ending; one that does not is given a full stop", () => {
    expect(spokenText("That did not work.", "This school's terms were changed while this was open.")).toBe("That did not work. This school's terms were changed while this was open.");
    expect(spokenText("यह काम नहीं हुआ।", "फिर से देखें।")).toBe("यह काम नहीं हुआ। फिर से देखें।");
    expect(spokenText("Saved!", "It renews on 21/05/2027.")).toBe("Saved! It renews on 21/05/2027.");
    expect(spokenText("Saved", "It renews on 21/05/2027.")).toBe("Saved. It renews on 21/05/2027.");
    expect(spokenText("Saved")).toBe("Saved");
  });
});
