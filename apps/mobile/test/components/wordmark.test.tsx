import { Pressable, Text } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
import { wordmarks } from "@edulink/tokens";
import { renderApp } from "../utils";
import { Wordmark } from "@/components";
import { useLocale } from "@/lib/i18n";

function Page() {
  const { setLocale } = useLocale();
  return (
    <>
      <Wordmark testID="mark" height={30} />
      <Pressable testID="to-mr" accessibilityRole="button" onPress={() => setLocale("mr")}>
        <Text>mr</Text>
      </Pressable>
    </>
  );
}

describe("the wordmark", () => {
  it("draws the name under its roof in the language the person reads in, and changes with the language", async () => {
    await renderApp(<Page />);
    const mark = screen.getByTestId("mark");
    expect(mark.props.accessibilityLabel).toBe("Shalaghar");
    const widthEn = Math.round((wordmarks.en.width / wordmarks.en.height) * 30);
    expect(mark.props.style).toMatchObject({ width: widthEn, height: 30 });
    // The Marathi mark is a different outline, so a different width at the same height.
    const widthMr = Math.round((wordmarks.mr.width / wordmarks.mr.height) * 30);
    expect(widthMr).not.toBe(widthEn);
    await fireEvent.press(screen.getByTestId("to-mr"));
    expect(screen.getByTestId("mark").props.style).toMatchObject({ width: widthMr, height: 30 });
  });

  it("the three outlines each carry the ridge dot in the brand's accent and a roof stroke in the text colour", () => {
    for (const locale of ["en", "hi", "mr"] as const) {
      expect(wordmarks[locale].accent).toMatch(/<circle .*fill="#f0a33a"/);
      expect(wordmarks[locale].ink).toMatch(/stroke-width/);
      expect(wordmarks[locale].ink).toMatch(/currentColor/);
    }
  });
});
