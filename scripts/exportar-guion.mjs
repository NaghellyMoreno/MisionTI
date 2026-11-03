// Empaqueta los datos de la teoría (diapositivas, guion, agenda, fuentes) en un JSON
// para que scripts/generar-guion.py arme el PDF de estudio.
// Uso: node scripts/exportar-guion.mjs <salida.json>
import { build } from "esbuild";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const out = process.argv[2];
if (!out) {
  console.error("Uso: node scripts/exportar-guion.mjs <salida.json>");
  process.exit(1);
}
const dir = mkdtempSync(join(tmpdir(), "guion-"));
const entry = join(dir, "entry.ts");
const bundle = join(dir, "bundle.mjs");
const root = process.cwd().replaceAll("\\", "/");
writeFileSync(
  entry,
  `export { SLIDES } from "${root}/src/domain/data/lessons";
export { GUION } from "${root}/src/domain/data/guion";
export { AGENDA, agendaClock } from "${root}/src/domain/data/agenda";
export { SOURCES } from "${root}/src/domain/data/sources";`,
);
await build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", outfile: bundle, logLevel: "error" });
const m = await import(pathToFileURL(bundle).href);
const agenda = m.AGENDA.map((a, i) => ({ ...a, clock: m.agendaClock(i) }));
writeFileSync(out, JSON.stringify({ slides: m.SLIDES, guion: m.GUION, agenda, sources: m.SOURCES }, null, 1));
console.log(`OK: ${m.SLIDES.length} diapositivas → ${out}`);
