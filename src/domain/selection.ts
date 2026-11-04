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

/** Número pseudoaleatorio reproducible (mulberry32). */
function seeded(seed: number): Random {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hash = (text: string) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
};

/**
 * Orden de las preguntas del quiz para un estudiante: aleatorio, pero siempre el mismo
 * para esa persona (si recarga la página no se le reordena ni se le repite nada).
 */
export function quizOrderFor(studentId: string, questionIds: string[]): string[] {
  const random = seeded(hash(`quiz:${studentId}`));
  const order = [...questionIds];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export interface QuizResult {
  studentId: StudentId;
  correct: number;
  answered: number;
  /** Milisegundos desde que se abrió el quiz hasta su última respuesta. */
  timeMs: number;
}

/** Ranking: más aciertos primero; a igualdad de aciertos, gana quien tardó menos. */
export function rankQuiz(results: QuizResult[]): QuizResult[] {
  return results
    .filter((r) => r.answered > 0)
    .sort((a, b) => b.correct - a.correct || a.timeMs - b.timeMs);
}
