import { RUBRIC } from "./data/canvas";
import { FINAL_QUIZ, findPopQuestion } from "./data/questions";
import type { Answer, GradeWeights, StudentId, TeamId } from "./types";

export const DEFAULT_WEIGHTS: GradeWeights = { sorpresa: 25, quiz: 30, lienzo: 30, juego: 15 };

/** Nota máxima de cada componente y de la nota final. */
export const MAX_GRADE = 5;

export const COMPONENT_LABELS: Record<keyof GradeWeights, string> = {
  sorpresa: "Preguntas sorpresa (individual)",
  quiz: "Quiz final (individual)",
  lienzo: "Lienzo con rúbrica (grupo)",
  juego: "Manejo del presupuesto (grupo)",
};

const KEYS: (keyof GradeWeights)[] = ["sorpresa", "quiz", "lienzo", "juego"];

export interface GradeInput {
  studentId: StudentId;
  teamId: TeamId;
  answers: Answer[];
  /** El quiz se abrió: entonces cuenta sobre todas sus preguntas, aunque el estudiante no responda. */
  quizStarted: boolean;
  canvasScore: number | undefined;
  teamBalance: number;
  balances: number[];
  weights: GradeWeights;
}

export interface GradeRow {
  studentId: StudentId;
  teamId: TeamId;
  /** Nota de cada componente, de 0 a 5. */
  components: Partial<Record<keyof GradeWeights, number>>;
  /** Peso con que entró cada componente a la nota de ESTE estudiante (suma 100). */
  weightsUsed: Partial<Record<keyof GradeWeights, number>>;
  /** Cuánto aporta cada componente a la nota final: nota × peso usado. Nunca pasa de 5 × peso usado. */
  contributions: Partial<Record<keyof GradeWeights, number>>;
  /** Nota final 0–5 con un decimal, o null si no hay ningún componente. */
  final: number | null;
  /** Faltan componentes: la nota se calculó con los que sí hay. */
  partial: boolean;
  sorpresa: { asked: number; correct: number };
  quiz: { answered: number; correct: number; total: number; points: number };
  /** Datos descartados por estar fuera de rango (no deberían existir; se avisan en vez de ocultarse). */
  issues: string[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;
const inRange = (n: unknown, min: number, max: number): n is number => typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;

/** Pesos válidos: enteros de 0 a 100 que suman 100. */
export function validWeights(w: GradeWeights | undefined): w is GradeWeights {
  if (!w) return false;
  const values = KEYS.map((k) => w[k]);
  return values.every((v) => Number.isInteger(v) && v >= 0 && v <= 100) && values.reduce((a, b) => a + b, 0) === 100;
}

/**
 * Política de calificación (0 a 5). Cada componente se calcula con lo que el estudiante
 * realmente obtuvo, y por construcción queda entre 0 y 5:
 * - Sorpresa: 5 × aciertos / preguntas recibidas (sin las anuladas).
 * - Quiz: 5 × aciertos / total de preguntas del quiz (cada pregunta cuenta una sola vez).
 * - Lienzo: promedio de la rúbrica (cada criterio de 1 a 5) o la nota manual (0 a 5).
 * - Presupuesto: 3,0 para el saldo más bajo del curso y 5,0 para el más alto.
 * La nota final es un promedio ponderado de esos componentes, así que tampoco pasa de 5,0.
 * Si un componente no existe (por ejemplo, a alguien nunca le tocó pregunta sorpresa),
 * se excluye y su peso se reparte entre los demás, para no castigar al estudiante por
 * algo que no dependió de él.
 */
export function gradeStudent(input: GradeInput): GradeRow {
  const issues: string[] = [];

  // Sorpresa: la corrección se recalcula con la clave de respuestas, no con lo guardado.
  const pops = input.answers.filter((a) => a.kind === "sorpresa" && !a.voided && findPopQuestion(a.questionId));
  const popCorrect = pops.filter((a) => a.choice !== null && a.choice === findPopQuestion(a.questionId)!.answer).length;

  // Quiz: solo preguntas del quiz, la primera respuesta de cada una.
  const quizAnswers = new Map<string, Answer>();
  for (const a of input.answers) {
    if (a.kind !== "quiz" || a.choice === null) continue;
    if (!FINAL_QUIZ.some((q) => q.id === a.questionId)) {
      issues.push(`Respuesta de quiz a una pregunta que no existe (${a.questionId}).`);
      continue;
    }
    const prev = quizAnswers.get(a.questionId);
    if (!prev || (a.answeredAt ?? "") < (prev.answeredAt ?? "")) quizAnswers.set(a.questionId, a);
  }
  const quizCorrect = [...quizAnswers.values()].filter((a) => a.choice === FINAL_QUIZ.find((q) => q.id === a.questionId)!.answer).length;

  const components: GradeRow["components"] = {};
  if (pops.length) components.sorpresa = (MAX_GRADE * popCorrect) / pops.length;
  if (input.quizStarted) components.quiz = (MAX_GRADE * quizCorrect) / FINAL_QUIZ.length;
  if (input.canvasScore !== undefined) {
    if (inRange(input.canvasScore, 0, MAX_GRADE)) components.lienzo = input.canvasScore;
    else issues.push(`Nota de lienzo fuera de rango descartada (${input.canvasScore}).`);
  }
  components.juego = budgetScore(input.teamBalance, input.balances);

  let weights = input.weights;
  if (!validWeights(weights)) {
    issues.push("Los pesos guardados no suman 100 %: se usaron los pesos por defecto.");
    weights = DEFAULT_WEIGHTS;
  }

  const present = KEYS.filter((k) => components[k] !== undefined && weights[k] > 0);
  const weightSum = present.reduce((s, k) => s + weights[k], 0);

  const weightsUsed: GradeRow["weightsUsed"] = {};
  const contributions: GradeRow["contributions"] = {};
  let exact = 0;
  for (const k of present) {
    const share = weights[k] / weightSum; // fracción de la nota final
    weightsUsed[k] = round1(share * 100);
    const c = components[k]! * share; // ≤ 5 × share porque components[k] ≤ 5
    contributions[k] = round2(c);
    exact += c;
  }
  const final = weightSum ? round1(exact) : null;

  for (const k of KEYS) if (components[k] !== undefined) components[k] = round1(components[k]!);

  return {
    studentId: input.studentId,
    teamId: input.teamId,
    components,
    weightsUsed,
    contributions,
    final,
    partial: present.length < KEYS.filter((k) => weights[k] > 0).length,
    sorpresa: { asked: pops.length, correct: popCorrect },
    quiz: { answered: quizAnswers.size, correct: quizCorrect, total: FINAL_QUIZ.length, points: quizCorrect },
    issues,
  };
}

/** Nota del lienzo = promedio de los criterios calificados en la rúbrica (cada uno de 1 a 5). */
export function rubricScore(scores: Partial<Record<string, number>> | undefined): number | undefined {
  const values = RUBRIC.map((c) => scores?.[c.id]).filter((v): v is number => Number.isInteger(v) && inRange(v, 1, MAX_GRADE));
  if (!values.length) return undefined;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Presupuesto: 3,0 para el saldo más bajo y 5,0 para el más alto del curso (el saldo del grupo siempre entra al rango). */
export function budgetScore(balance: number, all: number[]): number {
  const range = [...all, balance];
  const min = Math.min(...range);
  const max = Math.max(...range);
  if (max === min) return MAX_GRADE;
  return 3 + (2 * (balance - min)) / (max - min);
}
