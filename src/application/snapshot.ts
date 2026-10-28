import { AGENDA } from "@/domain/data/agenda";
import { SCENARIOS } from "@/domain/data/semaforo";
import { findCrisis } from "@/domain/crisis/deck";
import { GALLERY_ROUND, balanceOf, parseGalleryChoice, ranking, semaforoRound } from "@/domain/rules";
import type { GameState, LedgerEntry, Light, Purchase, StaffName, Team, TeamId } from "@/domain/types";
import type { GameDependencies } from "./ports";

export type Viewer = { role: "staff"; name: StaffName } | { role: "team"; teamId: TeamId } | { role: "public" };

export interface RankingView {
  teamId: TeamId;
  label: string;
  caseId: string;
  balance: number;
  position: number;
  assets: number;
}

export interface Snapshot {
  serverNow: number;
  viewer: Viewer;
  state: GameState;
  ranking: RankingView[];
  scenario: null | {
    id: string;
    text: string;
    status: GameState["semaforo"]["status"];
    voted: number;
    answer?: Light;
    explanation?: string;
    tally?: Record<Light, number>;
  };
  gallery: { status: GameState["gallery"]["status"]; voted: number; results?: { teamId: TeamId; label: string; votes: number }[] };
  team?: {
    team: Team;
    balance: number;
    purchases: Purchase[];
    ledger: LedgerEntry[];
    myLight: Light | null;
    myGallery: TeamId[];
  };
  staff?: {
    teams: Team[];
    purchases: Purchase[];
    ledger: LedgerEntry[];
    scenarioVotes: { teamId: TeamId; choice: Light }[];
    galleryVoters: TeamId[];
  };
}

/** Lado de consulta: arma la vista que le corresponde a cada tipo de usuario. */
export class GetSnapshot {
  constructor(
    private readonly deps: Pick<GameDependencies, "teams" | "ledger" | "purchases" | "votes" | "state">,
    private readonly clock: () => number = Date.now,
  ) {}

  async execute(viewer: Viewer): Promise<Snapshot> {
    const [teams, ledger, purchases, votes, state] = await Promise.all([
      this.deps.teams.list(),
      this.deps.ledger.list(),
      this.deps.purchases.list(),
      this.deps.votes.list(),
      this.deps.state.get(),
    ]);

    const rows: RankingView[] = ranking(teams, ledger, purchases).map((r) => ({
      teamId: r.team.id,
      label: r.team.label,
      caseId: r.team.caseId,
      balance: r.balance,
      position: r.position,
      assets: r.assets,
    }));

    // Semáforo: los votos de los demás se ocultan hasta revelar.
    const sc = SCENARIOS.find((s) => s.id === state.semaforo.scenarioId);
    const scVotes = sc ? votes.filter((v) => v.round === semaforoRound(sc.id)) : [];
    const revealed = state.semaforo.status === "revelado";
    const scenario: Snapshot["scenario"] = sc
      ? {
          id: sc.id,
          text: sc.text,
          status: state.semaforo.status,
          voted: scVotes.length,
          ...(revealed && {
            answer: sc.answer,
            explanation: sc.explanation,
            tally: {
              verde: scVotes.filter((v) => v.choice === "verde").length,
              amarillo: scVotes.filter((v) => v.choice === "amarillo").length,
              rojo: scVotes.filter((v) => v.choice === "rojo").length,
            },
          }),
        }
      : null;

    const galleryVotes = votes.filter((v) => v.round === GALLERY_ROUND);
    const gallery: Snapshot["gallery"] = { status: state.gallery.status, voted: galleryVotes.length };
    if (state.gallery.status === "revelada") {
      const count = new Map<TeamId, number>(teams.map((t) => [t.id, 0]));
      for (const v of galleryVotes) for (const id of parseGalleryChoice(v.choice)) count.set(id, (count.get(id) ?? 0) + 1);
      gallery.results = teams
        .map((t) => ({ teamId: t.id, label: t.label, votes: count.get(t.id) ?? 0 }))
        .sort((a, b) => b.votes - a.votes || a.teamId.localeCompare(b.teamId));
    }

    const snapshot: Snapshot = { serverNow: this.clock(), viewer, state, ranking: rows, scenario, gallery };

    if (viewer.role === "team") {
      const team = teams.find((t) => t.id === viewer.teamId);
      if (team) {
        const mine = <T extends { teamId: TeamId }>(list: T[]) => list.filter((x) => x.teamId === team.id);
        snapshot.team = {
          team,
          balance: balanceOf(team.id, ledger),
          purchases: mine(purchases).sort(byNewest),
          ledger: mine(ledger).sort(byNewest),
          myLight: (scVotes.find((v) => v.teamId === team.id)?.choice as Light) ?? null,
          myGallery: parseGalleryChoice(galleryVotes.find((v) => v.teamId === team.id)?.choice ?? ""),
        };
      }
    }

    if (viewer.role === "staff") {
      snapshot.staff = {
        teams,
        purchases: [...purchases].sort(byNewest),
        ledger: [...ledger].sort(byNewest).slice(0, 80),
        scenarioVotes: scVotes.map((v) => ({ teamId: v.teamId, choice: v.choice as Light })),
        galleryVoters: galleryVotes.map((v) => v.teamId),
      };
    }

    return snapshot;
  }
}

const byNewest = (a: { createdAt: string }, b: { createdAt: string }) => b.createdAt.localeCompare(a.createdAt);

export const currentAgenda = (state: GameState) => ({
  index: state.agendaIndex,
  total: AGENDA.length,
  current: AGENDA[state.agendaIndex],
  next: AGENDA[state.agendaIndex + 1] ?? null,
});

export const activeCrisis = (state: GameState) => findCrisis(state.activeCrisisId);
