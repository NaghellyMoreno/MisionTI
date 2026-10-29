import type { StudentId } from "./types";

export type Random = () => number;

/**
 * Escoge al azar, pero de forma justa: primero entre quienes menos preguntas
 * sorpresa han recibido. Así nadie se salva y a nadie le toca todo.
 */
export function pickFairly(candidates: StudentId[], asked: Map<StudentId, number>, count: number, random: Random): StudentId[] {
  const pool = [...candidates];
  const chosen: StudentId[] = [];
  while (chosen.length < count && pool.length) {
    const min = Math.min(...pool.map((id) => asked.get(id) ?? 0));
    const tier = pool.filter((id) => (asked.get(id) ?? 0) === min);
    const pick = tier[Math.floor(random() * tier.length)];
    chosen.push(pick);
    pool.splice(pool.indexOf(pick), 1);
  }
  return chosen;
}

/** Puntaje estilo Kahoot: 1000 por acertar al instante, 500 al límite del tiempo. */
export function quizPoints(correct: boolean, elapsedMs: number, durationMs: number): number {
  if (!correct) return 0;
  const ratio = Math.min(Math.max(elapsedMs / durationMs, 0), 1);
  return Math.round(1000 - 500 * ratio);
}
