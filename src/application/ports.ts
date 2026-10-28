import type { GameState, LedgerEntry, Purchase, Team, TeamId, Vote } from "@/domain/types";

/*
 * Puertos de la aplicación (Dependency Inversion + Interface Segregation).
 * Los casos de uso dependen de estas interfaces pequeñas, nunca de Supabase.
 * Hay dos implementaciones: en memoria (desarrollo y pruebas) y Supabase (producción).
 */

export interface TeamDirectory {
  list(): Promise<Team[]>;
}

export interface AccessCodes {
  verify(teamId: TeamId, pin: string): Promise<boolean>;
  all(): Promise<Record<TeamId, string>>;
}

export type NewLedgerEntry = Omit<LedgerEntry, "id" | "createdAt">;

export interface LedgerRepository {
  list(): Promise<LedgerEntry[]>;
  append(entries: NewLedgerEntry[]): Promise<void>;
}

export type NewPurchase = Pick<Purchase, "teamId" | "itemId" | "legalRoute" | "justification">;

export interface PurchaseRepository {
  list(): Promise<Purchase[]>;
  create(input: NewPurchase): Promise<Purchase>;
  /** Resuelve solo si sigue pendiente. Devuelve false si otra persona ya la resolvió. */
  resolve(id: string, patch: Pick<Purchase, "status" | "staffNote" | "resolvedBy">): Promise<boolean>;
}

export interface VoteRepository {
  list(): Promise<Vote[]>;
  /** Un voto por grupo y ronda: votar de nuevo reemplaza el anterior. */
  upsert(vote: Omit<Vote, "createdAt">): Promise<void>;
}

export interface GameStateRepository {
  get(): Promise<GameState>;
  update(mutate: (state: GameState) => GameState): Promise<GameState>;
}

/** Repositorios que se pueden vaciar al reiniciar la partida. */
export interface Resettable {
  clear(): Promise<void>;
}

/** Avisa a todas las pantallas conectadas que el estado cambió. */
export interface ChangeNotifier {
  notify(): Promise<void>;
}

export interface GameDependencies {
  teams: TeamDirectory;
  access: AccessCodes;
  ledger: LedgerRepository & Resettable;
  purchases: PurchaseRepository & Resettable;
  votes: VoteRepository & Resettable;
  state: GameStateRepository;
  notifier: ChangeNotifier;
}
