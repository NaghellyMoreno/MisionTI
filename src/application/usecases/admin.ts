import { INITIAL_BALANCE } from "@/domain/data/catalog";
import { GameRuleError, initialGameState } from "@/domain/rules";
import type { ProjectorScreen, StaffName, TeamId } from "@/domain/types";
import type { GameDependencies } from "../ports";

type Deps<K extends keyof GameDependencies> = Pick<GameDependencies, K>;

export class SetMarket {
  constructor(private readonly deps: Deps<"state" | "notifier">) {}

  async execute(open: boolean) {
    await this.deps.state.update((s) => ({ ...s, marketOpen: open }));
    await this.deps.notifier.notify();
  }
}

export class SetScreen {
  constructor(private readonly deps: Deps<"state" | "notifier">) {}

  async execute(screen: ProjectorScreen) {
    await this.deps.state.update((s) => ({ ...s, screen }));
    await this.deps.notifier.notify();
  }
}

/** Bonos y descuentos manuales (p. ej. la carta "Oportunidad inesperada"). */
export class AdjustBalance {
  constructor(private readonly deps: Deps<"teams" | "ledger" | "notifier">) {}

  async execute(input: { teamIds: TeamId[]; amount: number; note: string; staff: StaffName }) {
    if (!Number.isInteger(input.amount) || input.amount === 0 || Math.abs(input.amount) > 100)
      throw new GameRuleError("El ajuste debe ser un número entero entre −100 y 100, distinto de 0.");
    if (!input.teamIds.length) throw new GameRuleError("Elijan al menos un grupo.");
    if (input.note.trim().length < 3) throw new GameRuleError("Escriban el motivo del ajuste.");
    const valid = new Set((await this.deps.teams.list()).map((t) => t.id));
    if (input.teamIds.some((id) => !valid.has(id))) throw new GameRuleError("Grupo no válido.");

    await this.deps.ledger.append(
      input.teamIds.map((teamId) => ({
        teamId,
        amount: input.amount,
        kind: "ajuste" as const,
        note: `${input.note.trim()} · ${input.staff}`,
      })),
    );
    await this.deps.notifier.notify();
  }
}

/** Deja la partida como al inicio: 100 TC por grupo y sin compras ni votos. */
export class ResetGame {
  constructor(private readonly deps: Deps<"teams" | "ledger" | "purchases" | "votes" | "state" | "notifier">) {}

  async execute() {
    await Promise.all([this.deps.ledger.clear(), this.deps.purchases.clear(), this.deps.votes.clear()]);
    const teams = await this.deps.teams.list();
    await this.deps.ledger.append(
      teams.map((t) => ({ teamId: t.id, amount: INITIAL_BALANCE, kind: "inicial" as const, note: "Presupuesto inicial" })),
    );
    await this.deps.state.update((s) => ({ ...initialGameState(), version: s.version + 1 }));
    await this.deps.notifier.notify();
  }
}
