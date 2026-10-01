/**
 * The icons' weights the phone draws, and no others.
 *
 * Each Phosphor icon file (phosphor-react-native/src/defs/<Name>.tsx) holds
 * the icon drawn six ways: thin, light, regular, bold, fill and duotone. The
 * phone asks for four of them (regular, bold, fill, duotone; see the Icon
 * calls under src/), so a third of the icons' weight in the bundle was
 * drawings no screen could show: 69 KB of the 236 KB phosphor brought in on
 * 1 Oct 2026, measured from the export's source map.
 *
 * This is Metro's Babel transformer with one step in front of it: the source
 * of an icon file is handed on without its thin and light entries, and those
 * two names are given the regular drawing, so that an icon asked for in a
 * weight left out is drawn regular and never blank. Every other file goes
 * through untouched. metro.config.js sets it as the transformer for every
 * bundle, the development server's too, so what a screen shows while it is
 * written is what a release shows. test/components/icon-weights.test.ts holds
 * the phone's source to the four weights and every icon file the phone imports
 * to the shape this trims.
 *
 * Plain CommonJS, because Metro's transform workers load it by path.
 */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

/** The weights a screen asks for; each other weight is drawn as REGULAR. */
const KEPT = ["bold", "duotone", "fill", "regular"];
const DROPPED = ["light", "thin"];

/** Expo's own Babel transformer, which this hands every file on to. */
const UPSTREAM = require.resolve("@expo/metro-config/build/babel-transformer", { paths: [path.dirname(require.resolve("expo/package.json"))] });

const ICON_FILE = /[\\/]phosphor-react-native[\\/]src[\\/]defs[\\/]\w+\.tsx$/;

/**
 * An icon file is `export default new Map<…>([ ['bold', …], …, ['thin', …], ]);`
 * as Phosphor's generator writes it, one entry per weight, each opening with
 * `  [\n    '<weight>',` and closing with `  ],` on lines of their own.
 */
function trimWeights(src, filename = "icon") {
  let out = src;
  for (const weight of DROPPED) {
    const entry = new RegExp(`\\n  \\[\\n    '${weight}',\\n[\\s\\S]*?\\n  \\],`);
    if (!entry.test(out)) throw new Error(`icon-weights: ${filename} has no '${weight}' entry where Phosphor's generator writes one; the icons' file shape has changed`);
    out = out.replace(entry, "");
  }
  for (const weight of KEPT) {
    if (!out.includes(`\n  [\n    '${weight}',\n`)) throw new Error(`icon-weights: ${filename} lost its '${weight}' entry`);
  }
  if (!/export default new Map</.test(out)) throw new Error(`icon-weights: ${filename} does not export its weights as \`export default new Map<…>\``);
  const aliases = DROPPED.map((weight) => `weights.set('${weight}', weights.get('regular'));`).join("\n");
  return out.replace("export default new Map<", "const weights = new Map<") + `\n${aliases}\nexport default weights;\n`;
}

const upstream = () => require(UPSTREAM);

function transform(args) {
  return upstream().transform(ICON_FILE.test(args.filename) ? { ...args, src: trimWeights(args.src, args.filename) } : args);
}

/** Expo's key, with this file's own text: a change here is a change to every icon's output. */
function getCacheKey(options) {
  const own = crypto.createHash("sha1").update(fs.readFileSync(__filename)).digest("hex");
  const theirs = upstream().getCacheKey ? upstream().getCacheKey(options) : "";
  return `${own}-${theirs}`;
}

module.exports = { DROPPED, ICON_FILE, KEPT, UPSTREAM, getCacheKey, transform, trimWeights };
