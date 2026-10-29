import { GetGrades } from "@/application/grades";
import { COMPONENT_LABELS } from "@/domain/grading";
import { getGame } from "@/infrastructure/container";
import { readViewer } from "@/infrastructure/session";

export const dynamic = "force-dynamic";

const cell = (v: string | number | null | undefined) => {
  const s = v === null || v === undefined ? "" : typeof v === "number" ? String(v).replace(".", ",") : v;
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Descarga las notas en CSV listo para abrir en Excel (separador ; y coma decimal). */
export async function GET() {
  const viewer = await readViewer();
  if (viewer.role !== "staff") return new Response("No autorizado", { status: 401 });
  const game = getGame();
  const [grades, state] = await Promise.all([new GetGrades(game).execute(), game.state.get()]);
  const w = state.weights;

  const header = [
    "Grupo",
    "Estudiante",
    "Asistió",
    `${COMPONENT_LABELS.sorpresa} (${w.sorpresa} %)`,
    "Sorpresa aciertos",
    `${COMPONENT_LABELS.quiz} (${w.quiz} %)`,
    "Quiz aciertos",
    "Quiz puntos",
    `${COMPONENT_LABELS.lienzo} (${w.lienzo} %)`,
    `${COMPONENT_LABELS.juego} (${w.juego} %)`,
    "Nota final",
    "Observación",
  ];
  const rows = grades.map((g) => [
    g.teamLabel,
    g.name,
    g.attended ? "Sí" : "No",
    g.components.sorpresa ?? null,
    `${g.sorpresa.correct}/${g.sorpresa.asked}`,
    g.components.quiz ?? null,
    String(g.quiz.correct),
    g.quiz.points,
    g.components.lienzo ?? null,
    g.components.juego ?? null,
    g.final,
    g.partial ? "Nota calculada con los componentes disponibles" : "",
  ]);
  const csv = "﻿" + [header, ...rows].map((r) => r.map(cell).join(";")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="notas-mision-ti.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
