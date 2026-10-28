import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { initialGameState } from "@/domain/rules";
import type { GameState, LedgerEntry, Purchase, Team, Vote } from "@/domain/types";
import type {
  AccessCodes,
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
import { BroadcastNotifier } from "./BroadcastNotifier";

/**
 * Adaptadores de Supabase. Se ejecutan solo en el servidor con la clave de servicio;
 * las tablas tienen RLS activado sin políticas, así que nadie puede leerlas
 * ni modificarlas desde el navegador.
 */

function check<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(`Supabase: ${result.error.message}`);
  return result.data;
}

class SupabaseTeams implements TeamDirectory, AccessCodes {
  private cache: { at: number; teams: Team[] } | null = null;
  constructor(private readonly db: SupabaseClient) {}

  async list(): Promise<Team[]> {
    if (this.cache && Date.now() - this.cache.at < 30_000) return this.cache.teams;
    const rows = check(await this.db.from("teams").select("id,label,case_id,members").order("sort"));
    const teams = (rows ?? []).map((r) => ({ id: r.id, label: r.label, caseId: r.case_id, members: r.members as string[] }));
    this.cache = { at: Date.now(), teams };
    return teams;
  }

  async verify(teamId: string, pin: string) {
    const row = check(await this.db.from("team_pins").select("pin").eq("team_id", teamId).maybeSingle());
    return !!row && row.pin === pin;
  }

  async all() {
    const rows = check(await this.db.from("team_pins").select("team_id,pin"));
    return Object.fromEntries((rows ?? []).map((r) => [r.team_id, r.pin]));
  }
}

class SupabaseLedger implements LedgerRepository, Resettable {
  constructor(private readonly db: SupabaseClient) {}

  async list(): Promise<LedgerEntry[]> {
    const rows = check(await this.db.from("ledger").select("*").order("created_at"));
    return (rows ?? []).map((r) => ({
      id: r.id, teamId: r.team_id, amount: r.amount, kind: r.kind, note: r.note, createdAt: r.created_at,
    }));
  }

  async append(entries: NewLedgerEntry[]) {
    if (!entries.length) return;
    check(await this.db.from("ledger").insert(entries.map((e) => ({ team_id: e.teamId, amount: e.amount, kind: e.kind, note: e.note }))));
  }

  async clear() {
    check(await this.db.from("ledger").delete().not("id", "is", null));
  }
}

const toPurchase = (r: Record<string, unknown>): Purchase => ({
  id: r.id as string,
  teamId: r.team_id as string,
  itemId: r.item_id as string,
  legalRoute: r.legal_route as Purchase["legalRoute"],
  justification: r.justification as string,
  status: r.status as Purchase["status"],
  staffNote: (r.staff_note as string) ?? null,
  resolvedBy: (r.resolved_by as Purchase["resolvedBy"]) ?? null,
  createdAt: r.created_at as string,
  resolvedAt: (r.resolved_at as string) ?? null,
});

class SupabasePurchases implements PurchaseRepository, Resettable {
  constructor(private readonly db: SupabaseClient) {}

  async list() {
    const rows = check(await this.db.from("purchases").select("*").order("created_at"));
    return (rows ?? []).map(toPurchase);
  }

  async create(input: NewPurchase) {
    const row = check(
      await this.db
        .from("purchases")
        .insert({ team_id: input.teamId, item_id: input.itemId, legal_route: input.legalRoute, justification: input.justification })
        .select()
        .single(),
    );
    return toPurchase(row);
  }

  async resolve(id: string, patch: Pick<Purchase, "status" | "staffNote" | "resolvedBy">) {
    const rows = check(
      await this.db
        .from("purchases")
        .update({ status: patch.status, staff_note: patch.staffNote, resolved_by: patch.resolvedBy, resolved_at: new Date().toISOString() })
        .eq("id", id)
        .eq("status", "pendiente")
        .select("id"),
    );
    return (rows ?? []).length > 0;
  }

  async clear() {
    check(await this.db.from("purchases").delete().not("id", "is", null));
  }
}

class SupabaseVotes implements VoteRepository, Resettable {
  constructor(private readonly db: SupabaseClient) {}

  async list(): Promise<Vote[]> {
    const rows = check(await this.db.from("votes").select("*"));
    return (rows ?? []).map((r) => ({ round: r.round, teamId: r.team_id, choice: r.choice, createdAt: r.created_at }));
  }

  async upsert(vote: Omit<Vote, "createdAt">) {
    check(
      await this.db
        .from("votes")
        .upsert({ round: vote.round, team_id: vote.teamId, choice: vote.choice, created_at: new Date().toISOString() }, { onConflict: "round,team_id" }),
    );
  }

  async clear() {
    check(await this.db.from("votes").delete().not("round", "is", null));
  }
}

class SupabaseState implements GameStateRepository {
  constructor(private readonly db: SupabaseClient) {}

  async get(): Promise<GameState> {
    const row = check(await this.db.from("game_state").select("state").eq("id", 1).maybeSingle());
    return { ...initialGameState(), ...(row?.state as Partial<GameState> | undefined) };
  }

  async update(mutate: (s: GameState) => GameState) {
    const current = await this.get();
    const next = { ...mutate(current), version: current.version + 1 };
    check(await this.db.from("game_state").upsert({ id: 1, state: next }));
    return next;
  }
}

export function createSupabaseGame(env: { url: string; serviceKey: string }): GameDependencies {
  const db = createClient(env.url, env.serviceKey, { auth: { persistSession: false } });
  const teams = new SupabaseTeams(db);
  return {
    teams,
    access: teams,
    ledger: new SupabaseLedger(db),
    purchases: new SupabasePurchases(db),
    votes: new SupabaseVotes(db),
    state: new SupabaseState(db),
    notifier: new BroadcastNotifier(env.url, env.serviceKey),
  };
}
