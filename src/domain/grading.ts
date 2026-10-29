import type { Answer, GradeWeights, StudentId, TeamId } from "./types";

export const DEFAULT_WEIGHTS: GradeWeights = { sorpresa: 25, quiz: 30, lienzo: 30, juego: 15 };

export const COMPONENT_LABELS: Record<keyof GradeWeights, string> = {
  sorpresa: "Preguntas sorpresa (individual)",
  quiz: "Quiz final (individual)",
  lienzo: "Lienzo con rúbrica (grupo)",
  juego: "Manejo del presupuesto (grupo)",
};

export interface GradeInput {
  studentId: StudentId;
  teamId: TeamId;
  answers: Answer[];
  quizQuestionsOpened: number;
  canvasScore: number | undefined;
  teamBalance: number;
  balances: number[];
  weights: GradeWeights;
}

export interface GradeRow {
  studentId: StudentId;
  teamId: TeamId;
  components: Partial<Record<keyof GradeWeights, number>>;
  /** Nota final 0–5 con un decimal, o null si no hay ningún componente. */
  final: number | null;
  /** Faltan componentes: la nota se calculó con los que sí hay. */
  partial: boolean;
  sorpresa: { asked: number; correct: number };
  quiz: { answered: number; correct: number; points: number };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Política de calificación (0 a 5). Si un componente no existe (por ejemplo,
 * a alguien nunca le tocó pregunta sorpresa), se excluye y los pesos se reparten
 * entre los demás, para no castigar al estudiante por algo que no dependió de él.
 */
export function gradeStudent(input: GradeInput): GradeRow {
  const pops = input.answers.filter((a) => a.kind === "sorpresa");
  const quiz = input.answers.filter((a) => a.kind === "quiz");
  const popCorrect = pops.filter((a) => a.correct).length;
  const quizCorrect = quiz.filter((a) => a.correct).length;

  const components: GradeRow["components"] = {};
  if (pops.length) components.sorpresa = (5 * popCorrect) / pops.length;
  if (input.quizQuestionsOpened) components.quiz = (5 * quizCorrect) / input.quizQuestionsOpened;
  if (input.canvasScore !== undefined) components.lienzo = input.canvasScore;
  components.juego = budgetScore(input.teamBalance, input.balances);

  const keys = Object.keys(components) as (keyof GradeWeights)[];
  const weightSum = keys.reduce((s, k) => s + input.weights[k], 0);
  const final = weightSum
    ? round1(keys.reduce((s, k) => s + (components[k] ?? 0) * input.weights[k], 0) / weightSum)
    : null;

  for (const k of keys) components[k] = round1(components[k] ?? 0);

  return {
    studentId: input.studentId,
    teamId: input.teamId,
    components,
    final,
    partial: keys.length < 4,
    sorpresa: { asked: pops.length, correct: popCorrect },
    quiz: { answered: quiz.filter((a) => a.choice !== null).length, correct: quizCorrect, points: quiz.reduce((s, a) => s + a.points, 0) },
  };
}

/** Presupuesto: 3,0 para el saldo más bajo y 5,0 para el más alto del curso. */
export function budgetScore(balance: number, all: number[]): number {
  const min = Math.min(...all);
  const max = Math.max(...all);
  if (max === min) return 5;
  return 3 + (2 * (balance - min)) / (max - min);
}
