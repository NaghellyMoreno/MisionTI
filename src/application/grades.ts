import { FINAL_QUIZ } from "@/domain/data/questions";
import { gradeStudent, rubricScore, type GradeRow } from "@/domain/grading";
import { balances } from "@/domain/rules";
import { studentsOf } from "@/domain/students";
import type { GameDependencies } from "./ports";

export interface GradeView extends GradeRow {
  name: string;
  teamLabel: string;
  attended: boolean;
}

/** Calcula la nota 0–5 de cada estudiante con los datos de la partida. */
export class GetGrades {
  constructor(private readonly deps: Pick<GameDependencies, "teams" | "ledger" | "answers" | "presence" | "state">) {}

  async execute(): Promise<GradeView[]> {
    const [teams, ledger, answers, presence, state] = await Promise.all([
      this.deps.teams.list(),
      this.deps.ledger.list(),
      this.deps.answers.list(),
      this.deps.presence.list(),
      this.deps.state.get(),
    ]);
    const bal = balances(teams, ledger);
    const all = [...bal.values()];
    const opened = quizQuestionsOpened(state.quiz);
    const seen = new Set(presence.map((p) => p.studentId));
    const label = new Map(teams.map((t) => [t.id, t.label]));

    return studentsOf(teams).map((s) => ({
      ...gradeStudent({
        studentId: s.id,
        teamId: s.teamId,
        answers: answers.filter((a) => a.studentId === s.id),
        quizQuestionsOpened: opened,
        canvasScore: rubricScore(state.rubric[s.teamId]) ?? state.canvasScores[s.teamId],
        teamBalance: bal.get(s.teamId) ?? 0,
        balances: all,
        weights: state.weights,
      }),
      name: s.name,
      teamLabel: label.get(s.teamId) ?? s.teamId,
      attended: seen.has(s.id),
    }));
  }
}

export function quizQuestionsOpened(quiz: { index: number; status: string }): number {
  if (quiz.index < 0) return 0;
  return Math.min(quiz.index + 1, FINAL_QUIZ.length);
}
