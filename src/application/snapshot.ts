import { AGENDA } from "@/domain/data/agenda";
import { GUEST_TOPICS, guestTopicOf, type GuestTopic } from "@/domain/data/guest";
import { FINAL_QUIZ, QUIZ_MINUTES, findPopQuestion } from "@/domain/data/questions";
import { SCENARIOS } from "@/domain/data/semaforo";
import { findCrisis } from "@/domain/crisis/deck";
import { GALLERY_ROUND, balanceOf, parseGalleryChoice, ranking, semaforoRound } from "@/domain/rules";
import { quizOrderFor, rankQuiz, type QuizResult } from "@/domain/selection";
import { isOnline, studentsOf } from "@/domain/students";
import type { GameState, GuestQuestion, LedgerEntry, Light, Purchase, StaffName, StudentId, Team, TeamId } from "@/domain/types";
import { POP_GRACE_MS } from "./usecases/classroom";
import { GetGrades, type GradeView } from "./grades";
import type { GameDependencies } from "./ports";

export type Viewer =
  | { role: "staff"; name: StaffName }
  | { role: "team"; teamId: TeamId; studentId: StudentId }
  | { role: "public" };

export interface RankingView {
  teamId: TeamId;
  label: string;
  caseId: string;
  balance: number;
  position: number;
  assets: number;
}

export interface RosterView {
  id: StudentId;
  teamId: TeamId;
  name: string;
  online: boolean;
}

export interface QuestionView {
  id: string;
  text: string;
  options: string[];
}

export interface CanvasView {
  teamId: TeamId;
  label: string;
  caseId: string;
  /** Texto de cada casilla y quién la escribió por última vez. */
  fields: Record<string, { text: string; by: string | null }>;
  filled: number;
}

export interface Snapshot {
  serverNow: number;
  viewer: Viewer;
  state: GameState;
  ranking: RankingView[];
  roster: RosterView[];
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
  /** Ronda de preguntas sorpresa en curso (sin revelar la respuesta antes de tiempo). */
  pop: null | {
    section: string;
    deadline: number;
    students: { id: StudentId; name: string; teamLabel: string; answered: boolean }[];
    reveal?: { text: string; answer: string; correct: number; total: number };
  };
  quiz: {
    index: number;
    total: number;
    status: GameState["quiz"]["status"];
    openedAt: number | null;
    durationMs: number;
    /** Cuántos estudiantes participan (conectados o con alguna respuesta) y cuántos ya contestaron todo. */
    participants: number;
    finished: number;
    /** Todos los participantes terminaron antes de que se acabara el tiempo: el monitor lo avisa. */
    allDone: boolean;
    /** Ranking final (solo al terminar): más aciertos y, a igualdad, menor tiempo. */
    leaderboard?: { name: string; teamLabel: string; correct: number; total: number; timeMs: number }[];
  };
  guest: {
    current: null | { teamLabel: string; levelName: string; topic: string; text: string };
    queue: { teamId: TeamId; teamLabel: string; level: number; levelName: string; status: "sin-pregunta" | GuestQuestion["status"] }[];
  };
  /** Lienzos de todos los grupos: siempre para el equipo docente; para los demás, desde que abre la Galería. */
  canvases?: CanvasView[];
  team?: {
    canvas: CanvasView;
    team: Team;
    student: { id: StudentId; name: string };
    balance: number;
    purchases: Purchase[];
    ledger: LedgerEntry[];
    myLight: Light | null;
    myGallery: TeamId[];
    pendingPops: { answerId: string; deadline: number; question: QuestionView }[];
    popScore: { asked: number; correct: number };
    /** Quiz de este estudiante: preguntas en SU orden (sin respuesta correcta) y lo que ya contestó. */
    quiz: null | {
      questions: QuestionView[];
      answered: Record<string, number>;
      /** Solo al terminar. */
      result?: { correct: number; total: number; timeMs: number; rank: number | null };
    };
    guestTopic: GuestTopic | null;
    guestQuestion: GuestQuestion | null;
  };
  staff?: {
    teams: Team[];
    purchases: Purchase[];
    ledger: LedgerEntry[];
    scenarioVotes: { teamId: TeamId; choice: Light }[];
    galleryVoters: TeamId[];
    guestQuestions: GuestQuestion[];
    /** Enlace de Meet con el invitado (variable GUEST_MEET_URL). Solo lo recibe el equipo docente. */
    meetUrl: string | null;
    popDetail: { id: string; studentId: StudentId; name: string; teamLabel: string; questionId: string; choice: number | null; correct: boolean; voided: boolean; sentAt: string }[];
    grades: GradeView[];
  };
}

/** Lado de consulta: arma la vista que le corresponde a cada tipo de usuario. */
export class GetSnapshot {
  constructor(
    private readonly deps: Pick<
      GameDependencies,
      "teams" | "ledger" | "purchases" | "votes" | "presence" | "answers" | "guestQuestions" | "canvas" | "state"
    >,
    private readonly clock: () => number = Date.now,
  ) {}

  async execute(viewer: Viewer): Promise<Snapshot> {
    const now = this.clock();
    const [teams, ledger, purchases, votes, presence, answers, guestQuestions, canvasRows, state] = await Promise.all([
      this.deps.teams.list(),
      this.deps.ledger.list(),
      this.deps.purchases.list(),
      this.deps.votes.list(),
      this.deps.presence.list(),
      this.deps.answers.list(),
      this.deps.guestQuestions.list(),
      this.deps.canvas.list(),
      this.deps.state.get(),
    ]);
    const teamLabel = new Map(teams.map((t) => [t.id, t.label]));
    const students = studentsOf(teams);
    const studentName = new Map(students.map((s) => [s.id, s.name]));
    const presenceById = new Map(presence.map((p) => [p.studentId, p]));

    const rows: RankingView[] = ranking(teams, ledger, purchases).map((r) => ({
      teamId: r.team.id,
      label: r.team.label,
      caseId: r.team.caseId,
      balance: r.balance,
      position: r.position,
      assets: r.assets,
    }));

    const roster: RosterView[] = students.map((s) => ({ ...s, online: isOnline(presenceById.get(s.id), now) }));

    /* Semáforo: los votos de los demás se ocultan hasta revelar. */
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

    /* Galería */
    const galleryVotes = votes.filter((v) => v.round === GALLERY_ROUND);
    const gallery: Snapshot["gallery"] = { status: state.gallery.status, voted: galleryVotes.length };
    if (state.gallery.status === "revelada") {
      const count = new Map<TeamId, number>(teams.map((t) => [t.id, 0]));
      for (const v of galleryVotes) for (const id of parseGalleryChoice(v.choice)) count.set(id, (count.get(id) ?? 0) + 1);
      gallery.results = teams
        .map((t) => ({ teamId: t.id, label: t.label, votes: count.get(t.id) ?? 0 }))
        .sort((a, b) => b.votes - a.votes || a.teamId.localeCompare(b.teamId));
    }

    /* Pregunta sorpresa en curso */
    let pop: Snapshot["pop"] = null;
    if (state.pop) {
      const q = findPopQuestion(state.pop.questionId);
      const rowsPop = answers.filter(
        (a) => a.kind === "sorpresa" && a.questionId === state.pop!.questionId && state.pop!.studentIds.includes(a.studentId),
      );
      const done = now > state.pop.deadline;
      pop = {
        section: q?.id ?? "",
        deadline: state.pop.deadline,
        students: state.pop.studentIds.map((id) => ({
          id,
          name: studentName.get(id) ?? id,
          teamLabel: teamLabel.get(id.split("-")[0]) ?? "",
          answered: rowsPop.some((a) => a.studentId === id && a.choice !== null),
        })),
        ...(done &&
          q && {
            reveal: {
              text: q.text,
              answer: q.options[q.answer],
              correct: rowsPop.filter((a) => a.correct).length,
              total: rowsPop.length,
            },
          }),
      };
    }

    /* Quiz final: cada estudiante avanza a su ritmo dentro de un tiempo común */
    const qz = state.quiz;
    const quizAnswers = answers.filter((a) => a.kind === "quiz" && a.choice !== null);
    const byStudent = new Map<StudentId, typeof quizAnswers>();
    for (const a of quizAnswers) byStudent.set(a.studentId, [...(byStudent.get(a.studentId) ?? []), a]);
    const results: QuizResult[] = [...byStudent.entries()].map(([studentId, rows]) => ({
      studentId,
      correct: rows.filter((r) => r.choice === FINAL_QUIZ.find((q) => q.id === r.questionId)?.answer).length,
      answered: rows.length,
      timeMs: Math.max(...rows.map((r) => Date.parse(r.answeredAt ?? r.sentAt))) - (qz.openedAt ?? 0),
    }));
    const participants = new Set<StudentId>([...roster.filter((r) => r.online).map((r) => r.id), ...byStudent.keys()]);
    const finishedCount = results.filter((r) => r.answered >= FINAL_QUIZ.length).length;
    const ranked = rankQuiz(results);
    const quiz: Snapshot["quiz"] = {
      index: qz.index,
      total: FINAL_QUIZ.length,
      status: qz.status,
      openedAt: qz.openedAt,
      durationMs: QUIZ_MINUTES * 60_000,
      participants: participants.size,
      finished: finishedCount,
      allDone: qz.status === "abierto" && participants.size > 0 && finishedCount >= participants.size,
    };
    if (qz.status === "terminado") {
      quiz.leaderboard = ranked.slice(0, 10).map((r) => ({
        name: studentName.get(r.studentId) ?? r.studentId,
        teamLabel: teamLabel.get(r.studentId.split("-")[0]) ?? "",
        correct: r.correct,
        total: FINAL_QUIZ.length,
        timeMs: r.timeMs,
      }));
    }

    const quizView = (studentId: StudentId): NonNullable<Snapshot["team"]>["quiz"] => {
      if (qz.status === "cerrado") return null;
      const order = quizOrderFor(studentId, FINAL_QUIZ.map((q) => q.id));
      const mine = byStudent.get(studentId) ?? [];
      const view: NonNullable<Snapshot["team"]>["quiz"] = {
        questions: order.map((id) => {
          const q = FINAL_QUIZ.find((x) => x.id === id)!;
          return { id: q.id, text: q.text, options: [...q.options] };
        }),
        answered: Object.fromEntries(mine.map((a) => [a.questionId, a.choice as number])),
      };
      if (qz.status === "terminado") {
        const r = results.find((x) => x.studentId === studentId);
        const pos = ranked.findIndex((x) => x.studentId === studentId);
        view.result = { correct: r?.correct ?? 0, total: FINAL_QUIZ.length, timeMs: r?.timeMs ?? 0, rank: pos >= 0 ? pos + 1 : null };
      }
      return view;
    };

    /* Invitado: orden de la entrevista por nivel del ciclo */
    const byTeam = new Map(guestQuestions.map((g) => [g.teamId, g]));
    const queue = [...GUEST_TOPICS]
      .filter((t) => teamLabel.has(t.teamId))
      .sort((a, b) => a.level - b.level)
      .map((t) => ({
        teamId: t.teamId,
        teamLabel: teamLabel.get(t.teamId)!,
        level: t.level,
        levelName: t.levelName,
        status: (byTeam.get(t.teamId)?.status ?? "sin-pregunta") as Snapshot["guest"]["queue"][number]["status"],
      }));
    const currentQ = guestQuestions.find((g) => g.id === state.guestCurrent);
    const currentTopic = currentQ ? guestTopicOf(currentQ.teamId) : null;
    const guest: Snapshot["guest"] = {
      current: currentQ
        ? {
            teamLabel: teamLabel.get(currentQ.teamId) ?? "",
            levelName: currentTopic?.levelName ?? "",
            topic: currentTopic?.topic ?? "",
            text: currentQ.text,
          }
        : null,
      queue,
    };

    const canvasOf = (team: Team): CanvasView => {
      const fields: CanvasView["fields"] = {};
      for (const e of canvasRows) if (e.teamId === team.id) fields[e.field] = { text: e.text, by: studentName.get(e.updatedBy) ?? null };
      return { teamId: team.id, label: team.label, caseId: team.caseId, fields, filled: Object.values(fields).filter((f) => f.text.trim()).length };
    };

    const snapshot: Snapshot = { serverNow: now, viewer, state, ranking: rows, roster, scenario, gallery, pop, quiz, guest };
    if (viewer.role === "staff" || state.gallery.status !== "cerrada") snapshot.canvases = teams.map(canvasOf);

    if (viewer.role === "team") {
      const team = teams.find((t) => t.id === viewer.teamId);
      if (team) {
        const mine = <T extends { teamId: TeamId }>(list: T[]) => list.filter((x) => x.teamId === team.id);
        const myAnswers = answers.filter((a) => a.studentId === viewer.studentId);
        const myPops = myAnswers.filter((a) => a.kind === "sorpresa");
        snapshot.team = {
          canvas: canvasOf(team),
          team,
          student: { id: viewer.studentId, name: studentName.get(viewer.studentId) ?? "" },
          balance: balanceOf(team.id, ledger),
          purchases: mine(purchases).sort(byNewest),
          ledger: mine(ledger).sort(byNewest),
          myLight: (scVotes.find((v) => v.teamId === team.id)?.choice as Light) ?? null,
          myGallery: parseGalleryChoice(galleryVotes.find((v) => v.teamId === team.id)?.choice ?? ""),
          pendingPops: myPops
            .filter((a) => a.choice === null && !a.voided && a.deadline !== null && now <= a.deadline + POP_GRACE_MS)
            .map((a) => {
              const q = findPopQuestion(a.questionId)!;
              return { answerId: a.id, deadline: a.deadline!, question: { id: q.id, text: q.text, options: [...q.options] } };
            }),
          popScore: { asked: myPops.filter((a) => !a.voided).length, correct: myPops.filter((a) => a.correct && !a.voided).length },
          quiz: quizView(viewer.studentId),
          guestTopic: guestTopicOf(team.id),
          guestQuestion: byTeam.get(team.id) ?? null,
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
        guestQuestions,
        meetUrl: process.env.GUEST_MEET_URL?.trim() || null,
        popDetail: answers
          .filter((a) => a.kind === "sorpresa")
          .sort(byNewestSent)
          .map((a) => ({
            id: a.id,
            voided: a.voided,
            studentId: a.studentId,
            name: studentName.get(a.studentId) ?? a.studentId,
            teamLabel: teamLabel.get(a.teamId) ?? "",
            questionId: a.questionId,
            choice: a.choice,
            correct: a.correct,
            sentAt: a.sentAt,
          })),
        grades: await new GetGrades(this.deps).execute(),
      };
    }

    return snapshot;
  }
}

const byNewest = (a: { createdAt: string }, b: { createdAt: string }) => b.createdAt.localeCompare(a.createdAt);
const byNewestSent = (a: { sentAt: string }, b: { sentAt: string }) => b.sentAt.localeCompare(a.sentAt);

export const currentAgenda = (state: GameState) => ({
  index: state.agendaIndex,
  total: AGENDA.length,
  current: AGENDA[state.agendaIndex],
  next: AGENDA[state.agendaIndex + 1] ?? null,
});

export const activeCrisis = (state: GameState) => findCrisis(state.activeCrisisId);
