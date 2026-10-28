import { INITIAL_BALANCE } from "@/domain/data/catalog";
import { TEAMS } from "@/domain/data/teams";
import { initialGameState } from "@/domain/rules";
import type { GameState, LedgerEntry, Purchase, Team, Vote } from "@/domain/types";
import type {
  AccessCodes,
  ChangeNotifier,
  GameDependencies,
  GameStateRepository,
  LedgerRepository,
  NewLedgerEntry,
  NewPurchase,
  PurchaseRepository,
  Resettable,
  TeamDirectory,
  VoteRepository,
} from "@/application/ports";

/**
 * Implementación en memoria de todos los puertos.
 * Se usa en desarrollo local (sin Supabase) y en las pruebas automáticas.
 * Gracias a la inversión de dependencias, los casos de uso no notan la diferencia.
 */

const DEV_PINS: Record<string, string> = {
  EQ01: "8946", EQ02: "9267", EQ04: "7715", EQ05: "6698", EQ06: "1985", EQ07: "6569",
  EQ09: "2866", EQ10: "2273", EQ11: "2916", EQ12: "8167", EQ13: "1900",
};

let seq = 0;
const id = () => `${Date.now().toString(36)}-${(seq++).toString(36)}`;
const stamp = () => new Date(Date.now() + seq / 1000).toISOString();

class MemoryTeams implements TeamDirectory, AccessCodes {
  constructor(private readonly teams: Team[], private readonly pins: Record<string, string>) {}
  async list() { return this.teams; }
  async verify(teamId: string, pin: string) { return this.pins[teamId] === pin; }
  async all() { return { ...this.pins }; }
}

class MemoryLedger implements LedgerRepository, Resettable {
  private rows: LedgerEntry[] = [];
  async list() { return [...this.rows]; }
  async append(entries: NewLedgerEntry[]) {
    for (const e of entries) this.rows.push({ ...e, id: id(), createdAt: stamp() });
  }
  async clear() { this.rows = []; }
}

class MemoryPurchases implements PurchaseRepository, Resettable {
  private rows: Purchase[] = [];
  async list() { return this.rows.map((r) => ({ ...r })); }
  async create(input: NewPurchase) {
    const row: Purchase = {
      ...input, id: id(), status: "pendiente", staffNote: null, resolvedBy: null, createdAt: stamp(), resolvedAt: null,
    };
    this.rows.push(row);
    return { ...row };
  }
  async resolve(purchaseId: string, patch: Pick<Purchase, "status" | "staffNote" | "resolvedBy">) {
    const row = this.rows.find((r) => r.id === purchaseId && r.status === "pendiente");
    if (!row) return false;
    Object.assign(row, patch, { resolvedAt: stamp() });
    return true;
  }
  async clear() { this.rows = []; }
}

class MemoryVotes implements VoteRepository, Resettable {
  private rows: Vote[] = [];
  async list() { return [...this.rows]; }
  async upsert(vote: Omit<Vote, "createdAt">) {
    this.rows = this.rows.filter((v) => !(v.round === vote.round && v.teamId === vote.teamId));
    this.rows.push({ ...vote, createdAt: stamp() });
  }
  async clear() { this.rows = []; }
}

class MemoryState implements GameStateRepository {
  private state: GameState = initialGameState();
  async get() { return structuredClone(this.state); }
  async update(mutate: (s: GameState) => GameState) {
    this.state = { ...mutate(structuredClone(this.state)), version: this.state.version + 1 };
    return structuredClone(this.state);
  }
}

class SilentNotifier implements ChangeNotifier {
  async notify() {}
}

export function createInMemoryGame(teams: Team[] = TEAMS, pins: Record<string, string> = DEV_PINS): GameDependencies {
  const directory = new MemoryTeams(teams, pins);
  const ledger = new MemoryLedger();
  void ledger.append(
    teams.map((t) => ({ teamId: t.id, amount: INITIAL_BALANCE, kind: "inicial" as const, note: "Presupuesto inicial" })),
  );
  return {
    teams: directory,
    access: directory,
    ledger,
    purchases: new MemoryPurchases(),
    votes: new MemoryVotes(),
    state: new MemoryState(),
    notifier: new SilentNotifier(),
  };
}
