import { AGENDA } from "@/domain/data/agenda";
import { GUEST_TOPICS, guestTopicOf, type GuestTopic } from "@/domain/data/guest";
import { FINAL_QUIZ, QUIZ_SECONDS, findPopQuestion } from "@/domain/data/questions";
import { SCENARIOS } from "@/domain/data/semaforo";
import { findCrisis } from "@/domain/crisis/deck";
import { GALLERY_ROUND, balanceOf, parseGalleryChoice, ranking, semaforoRound } from "@/domain/rules";
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
    question: QuestionView | null;
    answered: number;
    answer?: number;
    explanation?: string;
    tally?: number[];
    leaderboard?: { name: string; teamLabel: string; points: number }[];
  };
  guest: {
    current: null | { teamLabel: string; levelName: string; topic: string; text: string };
    queue: { teamId: TeamId; teamLabel: string; level: number; levelName: string; status: "sin-pregunta" | GuestQuestion["status"] }[];
  };
  team?: {
    team: Team;
    student: { id: StudentId; name: string };
    balance: number;
    purchases: Purchase[];
    ledger: LedgerEntry[];
    myLight: Light | null;
    myGallery: TeamId[];
    pendingPops: { answerId: string; deadline: number; question: QuestionView }[];
    popScore: { asked: number; correct: number };
    quizChoice: number | null;
    quizPoints: number;
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
    popDetail: { studentId: StudentId; name: string; teamLabel: string; questionId: string; choice: number | null; correct: boolean; sentAt: string }[];
    grades: GradeView[];
  };
}

/** Lado de consulta: arma la vista que le corresponde a cada tipo de usuario. */
export class GetSnapshot {
  constructor(
    private readonly deps: Pick<
      GameDependencies,
      "teams" | "ledger" | "purchases" | "votes" | "presence" | "answers" | "guestQuestions" | "state"
    >,
    private readonly clock: () => number = Date.now,
  ) {}

  async execute(viewer: Viewer): Promise<Snapshot> {
    const now = this.clock();
    const [teams, ledger, purchases, votes, presence, answers, guestQuestions, state] = await Promise.all([
      this.deps.teams.list(),
      this.deps.ledger.list(),
      this.deps.purchases.list(),
      this.deps.votes.list(),
      this.deps.presence.list(),
      this.deps.answers.list(),
      this.deps.guestQuestions.list(),
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

    /* Quiz final */
    const qz = state.quiz;
    const quizQuestion = qz.index >= 0 ? FINAL_QUIZ[qz.index] : undefined;
    const quizRows = quizQuestion ? answers.filter((a) => a.kind === "quiz" && a.questionId === quizQuestion.id) : [];
    const showAnswer = qz.status === "revelado" || qz.status === "terminado";
    const quiz: Snapshot["quiz"] = {
      index: qz.index,
      total: FINAL_QUIZ.length,
      status: qz.status,
      openedAt: qz.openedAt,
      durationMs: QUIZ_SECONDS * 1000,
      question: quizQuestion && qz.status !== "cerrado" ? { id: quizQuestion.id, text: quizQuestion.text, options: [...quizQuestion.options] } : null,
      answered: quizRows.length,
    };
    if (quizQuestion && showAnswer) {
      quiz.answer = quizQuestion.answer;
      quiz.explanation = quizQuestion.explanation;
      quiz.tally = [0, 1, 2, 3].map((i) => quizRows.filter((a) => a.choice === i).length);
      const totals = new Map<StudentId, number>();
      for (const a of answers) if (a.kind === "quiz") totals.set(a.studentId, (totals.get(a.studentId) ?? 0) + a.points);
      quiz.leaderboard = [...totals.entries()]
        .filter(([, points]) => points > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, points]) => ({ name: studentName.get(id) ?? id, teamLabel: teamLabel.get(id.split("-")[0]) ?? "", points }));
    }

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

    const snapshot: Snapshot = { serverNow: now, viewer, state, ranking: rows, roster, scenario, gallery, pop, quiz, guest };

    if (viewer.role === "team") {
      const team = teams.find((t) => t.id === viewer.teamId);
      if (team) {
        const mine = <T extends { teamId: TeamId }>(list: T[]) => list.filter((x) => x.teamId === team.id);
        const myAnswers = answers.filter((a) => a.studentId === viewer.studentId);
        const myPops = myAnswers.filter((a) => a.kind === "sorpresa");
        snapshot.team = {
          team,
          student: { id: viewer.studentId, name: studentName.get(viewer.studentId) ?? "" },
          balance: balanceOf(team.id, ledger),
          purchases: mine(purchases).sort(byNewest),
          ledger: mine(ledger).sort(byNewest),
          myLight: (scVotes.find((v) => v.teamId === team.id)?.choice as Light) ?? null,
          myGallery: parseGalleryChoice(galleryVotes.find((v) => v.teamId === team.id)?.choice ?? ""),
          pendingPops: myPops
            .filter((a) => a.choice === null && a.deadline !== null && now <= a.deadline + POP_GRACE_MS)
            .map((a) => {
              const q = findPopQuestion(a.questionId)!;
              return { answerId: a.id, deadline: a.deadline!, question: { id: q.id, text: q.text, options: [...q.options] } };
            }),
          popScore: { asked: myPops.length, correct: myPops.filter((a) => a.correct).length },
          quizChoice: quizQuestion ? (myAnswers.find((a) => a.kind === "quiz" && a.questionId === quizQuestion.id)?.choice ?? null) : null,
          quizPoints: myAnswers.filter((a) => a.kind === "quiz").reduce((s, a) => s + a.points, 0),
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
        popDetail: answers
          .filter((a) => a.kind === "sorpresa")
          .sort(byNewestSent)
          .map((a) => ({
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
