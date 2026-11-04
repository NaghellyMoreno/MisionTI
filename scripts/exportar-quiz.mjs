// Exporta el quiz final (src/domain/data/questions.ts) a JSON para scripts/generar-quiz-impreso.py.
// Uso: node scripts/exportar-quiz.mjs <salida.json>
import { build } from "esbuild";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const out = process.argv[2];
if (!out) {
  console.error("Uso: node scripts/exportar-quiz.mjs <salida.json>");
  process.exit(1);
}
const dir = mkdtempSync(join(tmpdir(), "quiz-"));
const entry = join(dir, "entry.ts");
const bundle = join(dir, "bundle.mjs");
const root = process.cwd().replaceAll("\\", "/");
writeFileSync(entry, `export { FINAL_QUIZ, QUIZ_MINUTES } from "${root}/src/domain/data/questions";`);
await build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", outfile: bundle, logLevel: "error" });
const m = await import(pathToFileURL(bundle).href);
writeFileSync(out, JSON.stringify({ quiz: m.FINAL_QUIZ, minutes: m.QUIZ_MINUTES }, null, 1));
console.log(`OK: ${m.FINAL_QUIZ.length} preguntas → ${out}`);
