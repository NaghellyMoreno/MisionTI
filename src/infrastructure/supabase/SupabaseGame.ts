import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { initialGameState } from "@/domain/rules";
import type { Answer, GameState, GuestQuestion, GuestQuestionStatus, LedgerEntry, Presence, Purchase, Team, Vote } from "@/domain/types";
import type {
  AccessCodes,
  AnswerRepository,
  GameDependencies,
  GuestQuestionRepository,
  NewAnswer,
  PresenceRepository,
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

class SupabasePresence implements PresenceRepository, Resettable {
  constructor(private readonly db: SupabaseClient) {}

  async touch(p: Presence) {
    check(
      await this.db
        .from("presence")
        .upsert({ student_id: p.studentId, team_id: p.teamId, last_seen: new Date(p.lastSeen).toISOString() }, { onConflict: "student_id" }),
    );
  }

  async list(): Promise<Presence[]> {
    const rows = check(await this.db.from("presence").select("*"));
    return (rows ?? []).map((r) => ({ studentId: r.student_id, teamId: r.team_id, lastSeen: Date.parse(r.last_seen) }));
  }

  async clear() {
    check(await this.db.from("presence").delete().not("student_id", "is", null));
  }
}

const toAnswer = (r: Record<string, unknown>): Answer => ({
  id: r.id as string,
  kind: r.kind as Answer["kind"],
  questionId: r.question_id as string,
  studentId: r.student_id as string,
  teamId: r.team_id as string,
  choice: (r.choice as number | null) ?? null,
  correct: !!r.correct,
  points: (r.points as number) ?? 0,
  sentAt: r.sent_at as string,
  answeredAt: (r.answered_at as string) ?? null,
  deadline: r.deadline ? Date.parse(r.deadline as string) : null,
});

class SupabaseAnswers implements AnswerRepository, Resettable {
  constructor(private readonly db: SupabaseClient) {}

  async list() {
    const rows = check(await this.db.from("answers").select("*").order("sent_at"));
    return (rows ?? []).map(toAnswer);
  }

  async createMany(rows: NewAnswer[]) {
    if (!rows.length) return;
    check(
      await this.db.from("answers").insert(
        rows.map((a) => ({
          kind: a.kind,
          question_id: a.questionId,
          student_id: a.studentId,
          team_id: a.teamId,
          choice: a.choice,
          correct: a.correct,
          points: a.points,
          sent_at: a.sentAt,
          answered_at: a.answeredAt,
          deadline: a.deadline ? new Date(a.deadline).toISOString() : null,
        })),
      ),
    );
  }

  async respond(id: string, patch: Pick<Answer, "choice" | "correct" | "points" | "answeredAt">) {
    const rows = check(
      await this.db
        .from("answers")
        .update({ choice: patch.choice, correct: patch.correct, points: patch.points, answered_at: patch.answeredAt })
        .eq("id", id)
        .is("choice", null)
        .select("id"),
    );
    return (rows ?? []).length > 0;
  }

  async clear() {
    check(await this.db.from("answers").delete().not("id", "is", null));
  }
}

class SupabaseGuestQuestions implements GuestQuestionRepository, Resettable {
  constructor(private readonly db: SupabaseClient) {}

  async list(): Promise<GuestQuestion[]> {
    const rows = check(await this.db.from("guest_questions").select("*"));
    return (rows ?? []).map((r) => ({
      id: r.id, teamId: r.team_id, studentId: r.student_id, text: r.text, status: r.status, updatedAt: r.updated_at,
    }));
  }

  async save(input: { teamId: string; studentId: string; text: string }) {
    check(
      await this.db
        .from("guest_questions")
        .upsert(
          { team_id: input.teamId, student_id: input.studentId, text: input.text, updated_at: new Date().toISOString() },
          { onConflict: "team_id" },
        ),
    );
  }

  async setStatus(id: string, status: GuestQuestionStatus) {
    check(await this.db.from("guest_questions").update({ status, updated_at: new Date().toISOString() }).eq("id", id));
  }

  async clear() {
    check(await this.db.from("guest_questions").delete().not("id", "is", null));
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
    presence: new SupabasePresence(db),
    answers: new SupabaseAnswers(db),
    guestQuestions: new SupabaseGuestQuestions(db),
    state: new SupabaseState(db),
    notifier: new BroadcastNotifier(env.url, env.serviceKey),
  };
}
