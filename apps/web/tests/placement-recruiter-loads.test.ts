/**
 * QA-75 (QA campaign of 24 October 2026, L1-06): the placement library could not be loaded by a script. Its static
 * import of placement-pdf pulled in @react-pdf, whose `@react-pdf/hyphenate/en-us` subpath tsx cannot resolve
 * (ERR_PACKAGE_PATH_NOT_EXPORTED), so demo:accounts had to repeat addColleague's and answerInvitation's writes by
 * hand. The PDF renderer is now imported inside recruiterResume, the one function that draws a resume.
 */
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const WEB = process.cwd();

describe("the placement library under a script runner", () => {
  it("keeps @react-pdf out of its top-level imports", () => {
    const src = readFileSync(join(WEB, "src", "lib", "placement-recruiter.ts"), "utf8");
    expect(src).not.toMatch(/^import [^;]*from "\.\/placement-pdf";/m);
    expect(src).toMatch(/await import\("\.\/placement-pdf"\)/);
  });

  it("loads under tsx with the scripts' tsconfig, as experts and superuser do", () => {
    const dir = mkdtempSync(join(tmpdir(), "zz-placement-load-"));
    try {
      const file = join(dir, "load.ts");
      writeFileSync(file, `import * as m from ${JSON.stringify(join(WEB, "src", "lib", "placement-recruiter"))};\nconsole.log("loaded", typeof m.addColleague, typeof m.answerInvitation, typeof m.recruiterResume);\n`);
      const out = execFileSync("npx", ["tsx", "--tsconfig", join(WEB, "scripts", "tsconfig.json"), file], { cwd: WEB, encoding: "utf8", timeout: 90_000, stdio: ["ignore", "pipe", "pipe"] });
      expect(out.trim()).toBe("loaded function function function");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 120_000);
});
