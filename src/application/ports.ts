import type { Answer, CanvasEntry, GameState, GuestQuestion, GuestQuestionStatus, LedgerEntry, Presence, Purchase, StudentId, Team, TeamId, Vote } from "@/domain/types";

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

/** Señal de vida de cada estudiante conectado (lista de asistencia). */
export interface PresenceRepository {
  touch(presence: Presence): Promise<void>;
  list(): Promise<Presence[]>;
}

export type NewAnswer = Omit<Answer, "id">;

/** Respuestas individuales: preguntas sorpresa y quiz final. */
export interface AnswerRepository {
  list(): Promise<Answer[]>;
  createMany(rows: NewAnswer[]): Promise<void>;
  /** Registra la respuesta solo si aún no había respondido. Devuelve false si ya respondió. */
  respond(id: string, patch: Pick<Answer, "choice" | "correct" | "points" | "answeredAt">): Promise<boolean>;
  /** Marca o desmarca una respuesta como anulada. */
  setVoided(id: string, voided: boolean): Promise<void>;
}

/** Preguntas que cada grupo le hará al invitado. */
export interface GuestQuestionRepository {
  list(): Promise<GuestQuestion[]>;
  save(input: { teamId: TeamId; studentId: StudentId; text: string }): Promise<void>;
  setStatus(id: string, status: GuestQuestionStatus): Promise<void>;
  /** Corrige el texto sin cambiar su estado (lo usa el equipo docente). */
  setText(id: string, text: string): Promise<void>;
}

/** Lienzo digital: una fila por grupo y casilla (dos personas en casillas distintas no se pisan). */
export interface CanvasRepository {
  list(): Promise<CanvasEntry[]>;
  save(entry: Omit<CanvasEntry, "updatedAt">): Promise<void>;
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
  presence: PresenceRepository & Resettable;
  answers: AnswerRepository & Resettable;
  guestQuestions: GuestQuestionRepository & Resettable;
  canvas: CanvasRepository & Resettable;
  state: GameStateRepository;
  notifier: ChangeNotifier;
}
