import { findCrisis } from "@/domain/crisis/deck";
import { GameRuleError, buildTeamContext } from "@/domain/rules";
import type { GameDependencies, NewLedgerEntry } from "../ports";

type Deps<K extends keyof GameDependencies> = Pick<GameDependencies, K>;

/**
 * Lanza una carta: aplica su efecto a cada grupo y la pone en pantalla.
 * No conoce las reglas de ninguna carta en particular: delega en su estrategia.
 */
export class TriggerCrisis {
  constructor(private readonly deps: Deps<"teams" | "ledger" | "purchases" | "state" | "notifier">) {}

  async execute(crisisId: string) {
    const card = findCrisis(crisisId);
    if (!card) throw new GameRuleError("Carta de crisis desconocida.");

    const state = await this.deps.state.get();
    if (state.appliedCrises.includes(card.id)) throw new GameRuleError("Esta carta ya se jugó.");

    const [teams, ledger, purchases] = await Promise.all([
      this.deps.teams.list(),
      this.deps.ledger.list(),
      this.deps.purchases.list(),
    ]);

    const entries: NewLedgerEntry[] = [];
    for (const team of teams) {
      const adjustment = card.effect.resolve(buildTeamContext(team, ledger, purchases));
      if (adjustment) entries.push({ teamId: team.id, amount: adjustment.amount, kind: "crisis", note: `${card.title} — ${adjustment.note}` });
    }
    if (entries.length) await this.deps.ledger.append(entries);

    await this.deps.state.update((s) => ({
      ...s,
      activeCrisisId: card.id,
      appliedCrises: [...s.appliedCrises, card.id],
      screen: "crisis",
    }));
    await this.deps.notifier.notify();
    return entries.length;
  }
}

export class DismissCrisis {
  constructor(private readonly deps: Deps<"state" | "notifier">) {}

  async execute() {
    await this.deps.state.update((s) => ({
      ...s,
      activeCrisisId: null,
      screen: s.screen === "crisis" ? "ranking" : s.screen,
    }));
    await this.deps.notifier.notify();
  }
}
