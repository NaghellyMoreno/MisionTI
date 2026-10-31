import { CANVAS_MAX, RUBRIC, findCanvasField } from "@/domain/data/canvas";
import { GameRuleError } from "@/domain/rules";
import type { StudentId, TeamId } from "@/domain/types";
import type { GameDependencies } from "../ports";

type Deps<K extends keyof GameDependencies> = Pick<GameDependencies, K>;

/**
 * Guarda una casilla del lienzo del grupo. Se cierra cuando abre la Galería,
 * para que todos voten sobre la misma versión.
 * No avisa en tiempo real: se guarda mientras escriben y no debe saturar el canal.
 */
export class SaveCanvasField {
  constructor(private readonly deps: Deps<"canvas" | "state">) {}

  async execute(input: { teamId: TeamId; studentId: StudentId; field: string; text: string }) {
    if (!findCanvasField(input.field)) throw new GameRuleError("Casilla del lienzo desconocida.");
    const text = input.text.replace(/\s+$/g, "");
    if (text.length > CANVAS_MAX) throw new GameRuleError(`Máximo ${CANVAS_MAX} caracteres por casilla.`);
    const { gallery } = await this.deps.state.get();
    if (gallery.status !== "cerrada") throw new GameRuleError("El lienzo se cerró: ya empezó la Galería.");
    await this.deps.canvas.save({ teamId: input.teamId, field: input.field, text, updatedBy: input.studentId });
  }
}

/** José califica un criterio de la rúbrica (1 a 5) o lo borra (null). */
export class SetRubricScore {
  constructor(private readonly deps: Deps<"teams" | "state" | "notifier">) {}

  async execute(teamId: TeamId, criterion: string, score: number | null) {
    if (!(await this.deps.teams.list()).some((t) => t.id === teamId)) throw new GameRuleError("Grupo no válido.");
    if (!RUBRIC.some((c) => c.id === criterion)) throw new GameRuleError("Criterio de la rúbrica desconocido.");
    if (score !== null && (!Number.isInteger(score) || score < 1 || score > 5)) throw new GameRuleError("Cada criterio va de 1 a 5.");
    await this.deps.state.update((s) => {
      const team = { ...(s.rubric?.[teamId] ?? {}) };
      if (score === null) delete team[criterion];
      else team[criterion] = score;
      return { ...s, rubric: { ...(s.rubric ?? {}), [teamId]: team } };
    });
    await this.deps.notifier.notify();
  }
}

/** Pone un lienzo en el proyector durante la Galería (null = rotación automática). */
export class FocusGallery {
  constructor(private readonly deps: Deps<"teams" | "state" | "notifier">) {}

  async execute(teamId: TeamId | null) {
    if (teamId !== null && !(await this.deps.teams.list()).some((t) => t.id === teamId)) throw new GameRuleError("Grupo no válido.");
    await this.deps.state.update((s) => ({ ...s, galleryFocus: teamId, screen: "galeria" }));
    await this.deps.notifier.notify();
  }
}
