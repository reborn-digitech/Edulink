// eslint-disable-next-line @typescript-eslint/no-require-imports
const verify = require("../../scripts/bundle-verify.cjs") as {
  verifyBundle: (code: string, expected?: { wanted?: Iterable<string>; dictionaries?: Record<string, Map<string, string>> }) => { ok: boolean; problems: string[]; facts: Record<string, number> };
  modulesOf: (code: string) => Map<number, { source: string; deps: number[] }>;
};

/**
 * The check the bundle gate runs on its own export (scripts/bundle-verify.cjs),
 * on bundles written here in miniature as Metro writes one, a module a line:
 * zod, @edulink/i18n with a dictionary in the compact form, and the contracts
 * index, plain or, as Expo's live bindings would write it, through getters.
 */
const ZOD = '__d(function(g,r,i,a,m,e,d){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var o={object:function(){return{safeParse:function(x){return{success:x.code!=="NOT_A_CODE"}}}}};e.z=o;e.ZodType=function(){}},1,[]);';
const I18N = '__d(function(g,r,i,a,m,e,d){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var x=r(d[0]).en;e.LOCALES=["en"];e.translatorFor=function(){return function(k){return k}}},2,[5]);';
const LOCALE = '__d(function(g,r,i,a,m,e,d){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var t=r(d[0]).LOCALES;e.localeSchema={locales:t}},3,[2]);';
const SHAPE = '__d(function(g,r,i,a,m,e,d){e.shape="a(b),c";e.inflate=function(t,s){return{a:{b:s[0]},c:s[1]}}},4,[]);';
const EN = '__d(function(g,r,i,a,m,e,d){var n=r(d[0]);e.en=n.inflate(n.shape,"B|C".split("|"))},5,[4]);';
const PLAIN = '__d(function(g,r,i,a,m,e,d){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var n=r(d[0]).z,l=r(d[1]).localeSchema,o=n.object({});e.apiErrorSchema=o,e.localeSchema=l},0,[1,3]);';
const GETTERS = '__d(function(g,r,i,a,m,e,d){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),Object.defineProperty(e,"apiErrorSchema",{enumerable:!0,get:function(){return o}}),Object.defineProperty(e,"localeSchema",{enumerable:!0,get:function(){return l.localeSchema}});var t=r(d[0]),l=r(d[1]),o=t.z.object({})},0,[1,3]);';

const bundle = (index: string) => ["var __BUNDLE_START_TIME__=0;", ZOD, I18N, LOCALE, SHAPE, EN, index, "__r(0);"].join("\n");
const wanted = ["apiErrorSchema", "localeSchema"];
const dictionaries = { en: new Map([["a.b", "B"], ["c", "C"]]) };

describe("the bundle gate's check of its own export", () => {
  it("passes a bundle whose contracts export plainly and whose dictionary is its share", () => {
    const { ok, problems, facts } = verify.verifyBundle(bundle(PLAIN), { wanted, dictionaries });
    expect(problems).toEqual([]);
    expect(ok).toBe(true);
    // The index and locale.ts are the package; zod's module and @edulink/i18n's three are not.
    expect(facts).toMatchObject({ indexExports: 2, wanted: 2, contractsModules: 2, contractsWithGetters: 0, en: 2 });
  });

  it("fails a bundle whose contracts export through getters", () => {
    const { ok, problems, facts } = verify.verifyBundle(bundle(GETTERS), { wanted, dictionaries });
    expect(ok).toBe(false);
    expect(facts.contractsWithGetters).toBe(1);
    expect(problems).toEqual([expect.stringMatching(/1 of the contracts package's 2 modules export through getters/)]);
  });

  it("fails a bundle that lacks a value the phone imports, or a sentence of the share", () => {
    expect(verify.verifyBundle(bundle(PLAIN), { wanted: [...wanted, "notInTheBundle"] }).problems).toEqual([expect.stringMatching(/1 of the 3 values the phone imports .* undefined in the bundle: notInTheBundle/)]);
    const other = { en: new Map([["a.b", "B"], ["c", "Not C"], ["d", "D"]]) };
    expect(verify.verifyBundle(bundle(PLAIN), { wanted, dictionaries: other }).problems).toEqual([expect.stringMatching(/2 of the 3 en keys are missing or not their sentence: c, d/)]);
  });

  it("fails a bundle with no contracts index", () => {
    const { ok, problems } = verify.verifyBundle(["var __BUNDLE_START_TIME__=0;", ZOD, "__r(1);"].join("\n"), { wanted });
    expect(ok).toBe(false);
    expect(problems).toEqual([expect.stringMatching(/the contracts index .* is not in the bundle/)]);
  });

  it("reads a module that runs over several lines, as a template string with a line break makes one", () => {
    const modules = verify.modulesOf(["__d(function(g,r,i,a,m,e,d){e.t=`one", "two`},7,[3,4]);", "__d(function(g,r,i,a,m,e,d){},8,[]);", "__r(7);"].join("\n"));
    expect([...modules.keys()]).toEqual([7, 8]);
    expect(modules.get(7)).toEqual({ source: "function(g,r,i,a,m,e,d){e.t=`one\ntwo`}", deps: [3, 4] });
  });
});
