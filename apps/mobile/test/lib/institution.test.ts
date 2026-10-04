import { dictionaryFor, translatorFor } from "@edulink/i18n";
import { contextPlace } from "@/lib/institution";

const t = translatorFor(dictionaryFor("en"));

describe("a context's place (4 Oct 2026)", () => {
  it("reads a college with its kind and a school as its bare name", () => {
    expect(contextPlace({ schoolName: "ZZ Vidya College", institutionKind: "COLLEGE" }, t)).toBe("ZZ Vidya College · College");
    expect(contextPlace({ schoolName: "ZZ Shastri College", institutionKind: "AUTONOMOUS_COLLEGE" }, t)).toBe("ZZ Shastri College · Autonomous college");
    expect(contextPlace({ schoolName: "ZZ Junior", institutionKind: "JUNIOR_COLLEGE" }, t)).toBe("ZZ Junior · Junior college");
    expect(contextPlace({ schoolName: "ZZ School", institutionKind: "SCHOOL" }, t)).toBe("ZZ School");
  });

  it("reads an older server's context, with no kind, as before; and no name as none", () => {
    expect(contextPlace({ schoolName: "ZZ School" }, t)).toBe("ZZ School");
    expect(contextPlace({ schoolName: "ZZ School", institutionKind: null }, t)).toBe("ZZ School");
    expect(contextPlace({ schoolName: null, institutionKind: "COLLEGE" }, t)).toBeNull();
  });

  it("says the kind in the person's language", () => {
    expect(contextPlace({ schoolName: "ZZ Vidya College", institutionKind: "COLLEGE" }, translatorFor(dictionaryFor("mr")))).toBe("ZZ Vidya College · महाविद्यालय");
  });
});
