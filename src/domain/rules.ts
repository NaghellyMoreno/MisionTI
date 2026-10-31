import { CASES, CATALOG } from "./data/catalog";
import type { TeamContext } from "./crisis/CrisisEffect";
import type { CatalogItem, GameState, LedgerEntry, Purchase, Team, TeamId, TimerState } from "./types";
import { AGENDA } from "./data/agenda";
import { DEFAULT_WEIGHTS } from "./grading";

/** Error de negocio: su mensaje se muestra tal cual al usuario. */
export class GameRuleError extends Error {}

export const findItem = (id: string): CatalogItem => {
  const item = CATALOG.find((i) => i.id === id);
  if (!item) throw new GameRuleError("Ese recurso no existe en el catálogo.");
  return item;
};

export const findCase = (id: string) => {
  const c = CASES.find((x) => x.id === id);
  if (!c) throw new GameRuleError("Caso de empresa desconocido.");
  return c;
};

export function balanceOf(teamId: TeamId, ledger: LedgerEntry[]): number {
  return ledger.reduce((sum, e) => (e.teamId === teamId ? sum + e.amount : sum), 0);
}

export function balances(teams: Team[], ledger: LedgerEntry[]): Map<TeamId, number> {
  const map = new Map(teams.map((t) => [t.id, 0]));
  for (const e of ledger) map.set(e.teamId, (map.get(e.teamId) ?? 0) + e.amount);
  return map;
}

export interface RankingRow {
  team: Team;
  balance: number;
  position: number;
  assets: number;
}

export function ranking(teams: Team[], ledger: LedgerEntry[], purchases: Purchase[]): RankingRow[] {
  const bal = balances(teams, ledger);
  const sorted = [...teams].sort((a, b) => (bal.get(b.id) ?? 0) - (bal.get(a.id) ?? 0) || a.id.localeCompare(b.id));
  let lastBalance: number | null = null;
  let lastPosition = 0;
  return sorted.map((team, i) => {
    const balance = bal.get(team.id) ?? 0;
    const position = balance === lastBalance ? lastPosition : i + 1;
    lastBalance = balance;
    lastPosition = position;
    const assets = purchases.filter((p) => p.teamId === team.id && p.status === "aprobada").length;
    return { team, balance, position, assets };
  });
}

/** Reglas para solicitar y aprobar compras (Single Responsibility). */
export const PurchasePolicy = {
  MIN_JUSTIFICATION: 15,

  assertCanRequest(input: {
    item: CatalogItem;
    justification: string;
    balance: number;
    teamPurchases: Purchase[];
    marketOpen: boolean;
  }) {
    if (!input.marketOpen) throw new GameRuleError("El Mercado Tecnológico está cerrado en este momento.");
    if (input.justification.trim().length < this.MIN_JUSTIFICATION)
      throw new GameRuleError("Escriban una justificación de al menos 15 caracteres.");
    const active = input.teamPurchases.filter((p) => p.status !== "rechazada");
    if (active.some((p) => p.itemId === input.item.id))
      throw new GameRuleError("Ya tienen o solicitaron este recurso.");
    const reserved = active
      .filter((p) => p.status === "pendiente")
      .reduce((sum, p) => sum + findItem(p.itemId).price, 0);
    if (input.balance - reserved < input.item.price)
      throw new GameRuleError("No les alcanza: revisen su saldo y las solicitudes pendientes.");
  },

  assertCanApprove(purchase: Purchase, balance: number) {
    if (purchase.status !== "pendiente") throw new GameRuleError("Esta solicitud ya fue resuelta.");
    if (balance < findItem(purchase.itemId).price)
      throw new GameRuleError("El grupo ya no tiene saldo suficiente para esta compra.");
  },
};

export function buildTeamContext(team: Team, ledger: LedgerEntry[], purchases: Purchase[]): TeamContext {
  const approvedPurchases = purchases.filter((p) => p.teamId === team.id && p.status === "aprobada");
  return {
    team,
    company: findCase(team.caseId),
    balance: balanceOf(team.id, ledger),
    inventory: approvedPurchases.map((p) => findItem(p.itemId)),
    approvedPurchases,
  };
}

/* ---------- Temporizador ---------- */

export const minutesToMs = (m: number) => m * 60_000;

export function freshTimer(agendaIndex: number): TimerState {
  return { status: "idle", startedAt: null, remainingMs: minutesToMs(AGENDA[agendaIndex]?.minutes ?? 0) };
}

export function remainingMs(timer: TimerState, now: number): number {
  if (timer.status !== "running" || timer.startedAt === null) return timer.remainingMs;
  return timer.remainingMs - (now - timer.startedAt);
}

export function initialGameState(): GameState {
  return {
    agendaIndex: 0,
    timer: freshTimer(0),
    marketOpen: false,
    activeCrisisId: null,
    appliedCrises: [],
    semaforo: { scenarioId: null, status: "cerrado" },
    awardedScenarios: [],
    gallery: { status: "cerrada" },
    screen: "sala",
    slideIndex: 0,
    pop: null,
    quiz: { index: -1, status: "cerrado", openedAt: null },
    guestCurrent: null,
    canvasScores: {},
    rubric: {},
    galleryFocus: null,
    weights: { ...DEFAULT_WEIGHTS },
    version: 1,
  };
}

/* ---------- Galería ---------- */

export const GALLERY_ROUND = "galeria";
export const GALLERY_VOTES = 2;
export const semaforoRound = (scenarioId: string) => `semaforo:${scenarioId}`;

export function parseGalleryChoice(choice: string): TeamId[] {
  return choice.split(",").filter(Boolean);
}
