import { describe, expect, it } from "vitest";
import { INDIA, INDIAN_STATES, isIndia, matchIndianState, normaliseLocation } from "./places";

describe("normaliseLocation", () => {
  it("⚠ moves a state typed into the country box into the region box", () => {
    // The exact mistake three schools made: country "Maharashtra", region empty.
    expect(normaliseLocation({ country: "Maharashtra", region: "" })).toEqual({
      country: INDIA,
      region: "Maharashtra",
    });
    expect(normaliseLocation({ country: "Himachal Pradesh", region: null })).toEqual({
      country: INDIA,
      region: "Himachal Pradesh",
    });
  });

  it("spells India one way whatever was typed", () => {
    for (const typed of ["india", "INDIA", " India ", "IN", "Bharat", "भारत"]) {
      expect(normaliseLocation({ country: typed, region: "Gujarat" }).country).toBe(INDIA);
    }
  });

  it("canonicalises a state's casing and old spellings so filters bucket together", () => {
    expect(normaliseLocation({ country: "India", region: "gujarat" }).region).toBe("Gujarat");
    expect(normaliseLocation({ country: "India", region: "TAMIL NADU" }).region).toBe("Tamil Nadu");
    expect(normaliseLocation({ country: "India", region: "Orissa" }).region).toBe("Odisha");
    expect(normaliseLocation({ country: "India", region: "New Delhi" }).region).toBe("Delhi");
    expect(normaliseLocation({ country: "India", region: "Pondicherry" }).region).toBe("Puducherry");
  });

  it("infers India from a state alone when the country was left blank", () => {
    expect(normaliseLocation({ country: "", region: "Karnataka" })).toEqual({
      country: INDIA,
      region: "Karnataka",
    });
  });

  it("lets the region box win when both boxes hold a recognised state", () => {
    expect(normaliseLocation({ country: "Gujarat", region: "Rajasthan" })).toEqual({
      country: INDIA,
      region: "Rajasthan",
    });
  });

  it("keeps an Indian region it does not recognise, rather than blanking it", () => {
    // A district, a city, a spelling we have not met: still worth keeping.
    expect(normaliseLocation({ country: "India", region: "Vidarbha" })).toEqual({
      country: INDIA,
      region: "Vidarbha",
    });
  });

  it("leaves another country's free text alone", () => {
    expect(normaliseLocation({ country: "Nepal", region: "Bagmati" })).toEqual({
      country: "Nepal",
      region: "Bagmati",
    });
    expect(normaliseLocation({ country: "United Arab Emirates", region: "" })).toEqual({
      country: "United Arab Emirates",
      region: null,
    });
  });

  it("turns blanks into nulls, the shape the row stores", () => {
    expect(normaliseLocation({ country: "  ", region: "" })).toEqual({ country: null, region: null });
    expect(normaliseLocation({})).toEqual({ country: null, region: null });
  });
});

describe("the state list", () => {
  it("holds every state and union territory once, sorted, and matches itself", () => {
    expect(INDIAN_STATES.length).toBe(36);
    expect(new Set(INDIAN_STATES).size).toBe(36);
    expect([...INDIAN_STATES].sort()).toEqual([...INDIAN_STATES]);
    for (const state of INDIAN_STATES) expect(matchIndianState(state)).toBe(state);
  });

  it("does not mistake a country or a city for a state", () => {
    expect(matchIndianState("India")).toBeNull();
    expect(matchIndianState("Surat")).toBeNull();
    expect(matchIndianState("")).toBeNull();
    expect(isIndia("Indiana")).toBe(false);
    expect(isIndia("Indonesia")).toBe(false);
  });
});
