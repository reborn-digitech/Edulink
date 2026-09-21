/**
 * Numbers and dates in words, the way an Indian certificate writes a date of
 * birth twice: the figures and the words, in the document's own language.
 */
import { describe, expect, it } from "vitest";
import { dateInFigures, dateInWords, numberToWords } from "@/lib/words";

describe("numbers in words", () => {
  it("English", () => {
    expect(numberToWords(0)).toBe("zero");
    expect(numberToWords(16)).toBe("sixteen");
    expect(numberToWords(42)).toBe("forty-two");
    expect(numberToWords(100)).toBe("one hundred");
    expect(numberToWords(2016)).toBe("two thousand and sixteen");
    expect(numberToWords(2024)).toBe("two thousand and twenty-four");
    expect(numberToWords(1999)).toBe("one thousand nine hundred and ninety-nine");
    expect(numberToWords(12_345)).toBe("twelve thousand three hundred and forty-five");
  });

  it("Hindi", () => {
    expect(numberToWords(1, "hi")).toBe("एक");
    expect(numberToWords(19, "hi")).toBe("उन्नीस");
    expect(numberToWords(45, "hi")).toBe("पैंतालीस");
    expect(numberToWords(99, "hi")).toBe("निन्यानवे");
    expect(numberToWords(2016, "hi")).toBe("दो हज़ार सोलह");
    expect(numberToWords(1998, "hi")).toBe("एक हज़ार नौ सौ अट्ठानवे");
  });

  it("Marathi", () => {
    expect(numberToWords(1, "mr")).toBe("एक");
    expect(numberToWords(16, "mr")).toBe("सोळा");
    expect(numberToWords(21, "mr")).toBe("एकवीस");
    expect(numberToWords(99, "mr")).toBe("नव्व्याण्णव");
    expect(numberToWords(2016, "mr")).toBe("दोन हजार सोळा");
    expect(numberToWords(1998, "mr")).toBe("एक हजार नऊशे अठ्ठ्याण्णव");
  });

  it("refuses what it cannot say", () => {
    expect(numberToWords(100_000)).toBe("100000");
    expect(numberToWords(-3)).toBe("-3");
  });
});

describe("dates in words", () => {
  it("writes the day, month and year in the document's language", () => {
    expect(dateInWords("2016-03-10", "en")).toBe("Tenth March Two Thousand and Sixteen");
    expect(dateInWords("2011-08-22", "en")).toBe("Twenty-Second August Two Thousand and Eleven");
    expect(dateInWords("2016-03-10", "hi")).toBe("दस मार्च दो हज़ार सोलह");
    expect(dateInWords("2016-03-10", "mr")).toBe("दहा मार्च दोन हजार सोळा");
    expect(dateInFigures("2016-03-10")).toBe("10/03/2016");
    expect(dateInWords("not a date", "en")).toBe("not a date");
  });
});
