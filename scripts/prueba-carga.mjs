#!/usr/bin/env node
/**
 * Prueba de carga de Misión TI: simula los celulares de la clase.
 *
 * Cada estudiante simulado:
 *   1. entra con el código de su grupo (POST /api/login),
 *   2. envía su señal de asistencia cada 15 s (POST /api/presence),
 *   3. pide el estado de la clase cada N segundos (GET /api/state), como hace el celular
 *      cuando el canal en vivo falla (el peor caso).
 *
 * Uso (desde la carpeta del proyecto, con Node 18 o superior):
 *   node scripts/prueba-carga.mjs --url https://su-app.vercel.app --codigos "EQ01=1234,EQ02=5678,..."
 *
 * Los códigos se copian desde Control → Ajustes → Mostrar códigos → "Copiar para la prueba de carga".
 * Opciones: --minutos 3   --intervalo 3   --estudiantes 27
 * Al terminar, reinicien la partida (Control → Ajustes) para borrar la asistencia de prueba.
 */

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const BASE = (args.url ?? process.env.URL ?? "http://localhost:3000").replace(/\/$/, "");
const MINUTES = Number(args.minutos ?? 3);
const POLL_S = Number(args.intervalo ?? 3);
const MAX_STUDENTS = Number(args.estudiantes ?? 27);
const CODES = Object.fromEntries(
  String(args.codigos ?? process.env.CODIGOS ?? "")
    .split(",")
    .map((p) => p.trim().split("="))
    .filter(([k, v]) => k && v),
);

const stats = new Map();
const record = (name, ms, ok) => {
  const s = stats.get(name) ?? { times: [], errors: 0 };
  s.times.push(ms);
  if (!ok) s.errors += 1;
  stats.set(name, s);
};

async function timed(name, fn) {
  const t0 = performance.now();
  try {
    const res = await fn();
    record(name, performance.now() - t0, res.ok);
    return res;
  } catch {
    record(name, performance.now() - t0, false);
    return null;
  }
}

const pct = (arr, p) => {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
};

async function student(s, endAt) {
  const pin = CODES[s.teamId];
  const login = await timed("Ingreso", () =>
    fetch(`${BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId: s.teamId, studentId: s.id, pin }),
    }),
  );
  if (!login?.ok) return { id: s.id, ok: false };
  const cookie = (login.headers.get("set-cookie") ?? "").split(";")[0];
  const headers = { cookie };

  let nextBeat = 0;
  // Arranques escalonados, como en un salón real.
  await new Promise((r) => setTimeout(r, Math.random() * POLL_S * 1000));
  while (Date.now() < endAt) {
    if (Date.now() >= nextBeat) {
      await timed("Asistencia", () => fetch(`${BASE}/api/presence`, { method: "POST", headers }));
      nextBeat = Date.now() + 15_000;
    }
    const res = await timed("Estado de la clase", () => fetch(`${BASE}/api/state`, { headers, cache: "no-store" }));
    if (res) await res.arrayBuffer().catch(() => {});
    await new Promise((r) => setTimeout(r, POLL_S * 1000));
  }
  return { id: s.id, ok: true };
}

async function main() {
  console.log(`\nMisión TI · prueba de carga contra ${BASE}`);
  const state = await fetch(`${BASE}/api/state`).then((r) => r.json()).catch(() => null);
  if (!state?.roster) {
    console.error("No se pudo leer /api/state. Revisen la URL.");
    process.exit(1);
  }
  const students = state.roster.filter((s) => CODES[s.teamId]).slice(0, MAX_STUDENTS);
  const missing = [...new Set(state.roster.map((s) => s.teamId))].filter((t) => !CODES[t]);
  if (missing.length) console.log(`Sin código (no se simulan): ${missing.join(", ")}`);
  if (!students.length) {
    console.error('Faltan los códigos. Usen --codigos "EQ01=1234,EQ02=5678,..."');
    process.exit(1);
  }
  console.log(`${students.length} estudiantes · ${MINUTES} min · estado cada ${POLL_S} s · asistencia cada 15 s\n`);

  const endAt = Date.now() + MINUTES * 60_000;
  const ticker = setInterval(() => {
    const total = [...stats.values()].reduce((s, x) => s + x.times.length, 0);
    const left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
    process.stdout.write(`\r  ${total} peticiones · faltan ${left} s   `);
  }, 1000);
  const results = await Promise.all(students.map((s) => student(s, endAt)));
  clearInterval(ticker);

  const failedLogins = results.filter((r) => !r.ok).length;
  console.log("\n\n| Operación | Peticiones | Errores | Mediana | p95 | Máximo |");
  console.log("| --- | --- | --- | --- | --- | --- |");
  let worstP95 = 0;
  let errors = 0;
  let total = 0;
  for (const [name, s] of stats) {
    const p95 = pct(s.times, 95);
    worstP95 = Math.max(worstP95, p95);
    errors += s.errors;
    total += s.times.length;
    console.log(
      `| ${name} | ${s.times.length} | ${s.errors} | ${Math.round(pct(s.times, 50))} ms | ${Math.round(p95)} ms | ${Math.round(Math.max(...s.times))} ms |`,
    );
  }
  const errorRate = total ? errors / total : 1;
  const ok = failedLogins === 0 && errorRate < 0.01 && worstP95 < 1500;
  console.log(`\nIngresos fallidos: ${failedLogins} · tasa de error: ${(errorRate * 100).toFixed(2)} %`);
  console.log(
    ok
      ? "RESULTADO: la app aguanta la clase con margen (p95 < 1,5 s y menos de 1 % de errores)."
      : "RESULTADO: hay riesgo. Revisen los errores, el plan de Supabase/Vercel o la conexión desde donde corrieron la prueba.",
  );
  console.log("Recuerden: Control → Ajustes → Reiniciar partida, para borrar la asistencia de prueba.\n");
  process.exit(ok ? 0 : 2);
}

main();
