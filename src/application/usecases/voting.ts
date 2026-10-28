import { SCENARIOS, SEMAFORO_REWARD } from "@/domain/data/semaforo";
import { GALLERY_ROUND, GALLERY_VOTES, GameRuleError, semaforoRound } from "@/domain/rules";
import type { Light, TeamId } from "@/domain/types";
import type { GameDependencies } from "../ports";

type Deps<K extends keyof GameDependencies> = Pick<GameDependencies, K>;
const LIGHTS: Light[] = ["verde", "amarillo", "rojo"];

/* ---------- Semáforo ---------- */

export class OpenScenario {
  constructor(private readonly deps: Deps<"state" | "notifier">) {}

  async execute(scenarioId: string) {
    if (!SCENARIOS.some((s) => s.id === scenarioId)) throw new GameRuleError("Situación desconocida.");
    await this.deps.state.update((s) => ({
      ...s,
      semaforo: { scenarioId, status: "votando" },
      screen: "semaforo",
    }));
    await this.deps.notifier.notify();
  }
}

export class CastLight {
  constructor(private readonly deps: Deps<"votes" | "state" | "notifier">) {}

  async execute(teamId: TeamId, light: string) {
    if (!LIGHTS.includes(light as Light)) throw new GameRuleError("Color no válido.");
    const { semaforo } = await this.deps.state.get();
    if (semaforo.status !== "votando" || !semaforo.scenarioId)
      throw new GameRuleError("La votación del Semáforo está cerrada.");
    await this.deps.votes.upsert({ round: semaforoRound(semaforo.scenarioId), teamId, choice: light });
    await this.deps.notifier.notify();
  }
}

/** Revela la respuesta y paga la recompensa una sola vez por situación. */
export class RevealScenario {
  constructor(private readonly deps: Deps<"votes" | "ledger" | "state" | "notifier">) {}

  async execute() {
    const state = await this.deps.state.get();
    const id = state.semaforo.scenarioId;
    const scenario = SCENARIOS.find((s) => s.id === id);
    if (!scenario) throw new GameRuleError("No hay una situación abierta.");

    if (!state.awardedScenarios.includes(scenario.id)) {
      const votes = (await this.deps.votes.list()).filter((v) => v.round === semaforoRound(scenario.id));
      const winners = votes.filter((v) => v.choice === scenario.answer);
      if (winners.length) {
        await this.deps.ledger.append(
          winners.map((v) => ({
            teamId: v.teamId,
            amount: SEMAFORO_REWARD,
            kind: "semaforo" as const,
            note: `Semáforo ${scenario.id}: respuesta correcta`,
          })),
        );
      }
    }

    await this.deps.state.update((s) => ({
      ...s,
      semaforo: { scenarioId: scenario.id, status: "revelado" },
      awardedScenarios: s.awardedScenarios.includes(scenario.id)
        ? s.awardedScenarios
        : [...s.awardedScenarios, scenario.id],
    }));
    await this.deps.notifier.notify();
  }
}

export class CloseScenario {
  constructor(private readonly deps: Deps<"state" | "notifier">) {}

  async execute() {
    await this.deps.state.update((s) => ({ ...s, semaforo: { scenarioId: null, status: "cerrado" } }));
    await this.deps.notifier.notify();
  }
}

/* ---------- Galería ---------- */

export class SetGallery {
  constructor(private readonly deps: Deps<"state" | "notifier">) {}

  async execute(status: "cerrada" | "votando" | "revelada") {
    await this.deps.state.update((s) => ({
      ...s,
      gallery: { status },
      screen: status === "cerrada" ? s.screen : "galeria",
    }));
    await this.deps.notifier.notify();
  }
}

export class CastGalleryVote {
  constructor(private readonly deps: Deps<"teams" | "votes" | "state" | "notifier">) {}

  async execute(teamId: TeamId, picks: TeamId[]) {
    const { gallery } = await this.deps.state.get();
    if (gallery.status !== "votando") throw new GameRuleError("La votación de la Galería está cerrada.");

    const unique = [...new Set(picks)];
    const valid = new Set((await this.deps.teams.list()).map((t) => t.id));
    if (unique.length !== GALLERY_VOTES) throw new GameRuleError(`Elijan exactamente ${GALLERY_VOTES} lienzos.`);
    if (unique.includes(teamId)) throw new GameRuleError("No pueden votar por su propio lienzo.");
    if (unique.some((id) => !valid.has(id))) throw new GameRuleError("Grupo no válido.");

    await this.deps.votes.upsert({ round: GALLERY_ROUND, teamId, choice: unique.join(",") });
    await this.deps.notifier.notify();
  }
}
