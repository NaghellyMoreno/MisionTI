import { beforeEach, describe, expect, it } from "vitest";
import { createInMemoryGame } from "@/infrastructure/memory/InMemoryGame";
import type { GameDependencies } from "@/application/ports";
import {
  AnswerPop,
  AnswerQuiz,
  ControlQuiz,
  Heartbeat,
  LaunchPop,
  SaveGuestQuestion,
  SetCanvasScore,
  SetGuestQuestionStatus,
  SetWeights,
} from "@/application/usecases/classroom";
import { ControlAgenda } from "@/application/usecases/agenda";
import { GetGrades } from "@/application/grades";
import { GetSnapshot } from "@/application/snapshot";
import { pickFairly, quizPoints } from "@/domain/selection";
import { budgetScore, gradeStudent, DEFAULT_WEIGHTS } from "@/domain/grading";
import { findPopQuestion, FINAL_QUIZ } from "@/domain/data/questions";
import { firstSlideOf } from "@/domain/data/lessons";
import { AGENDA, agendaClock } from "@/domain/data/agenda";
import { GUEST_TOPICS } from "@/domain/data/guest";
import { TEAMS } from "@/domain/data/teams";

let game: GameDependencies;
let now: number;
const clock = () => now;
const seq = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

beforeEach(() => {
  game = createInMemoryGame();
  now = 1_000_000;
});

describe("Contenido", () => {
  it("el cronograma dura 175 minutos y la entrevista empieza a las 2:47 p. m.", () => {
    expect(AGENDA.reduce((s, a) => s + a.minutes, 0)).toBe(175);
    expect(agendaClock(0)).toBe("1:00 p. m.");
    expect(agendaClock(13)).toBe("2:47 p. m.");
  });

  it("cada grupo tiene un tema distinto para el invitado", () => {
    expect(new Set(GUEST_TOPICS.map((t) => t.teamId))).toEqual(new Set(TEAMS.map((t) => t.id)));
  });

  it("toda actividad con teoría tiene su diapositiva", () => {
    expect(firstSlideOf(0)).toBe(0);
    expect(firstSlideOf(13)).not.toBeNull();
  });
});

describe("Asistencia y preguntas sorpresa", () => {
  it("solo escoge entre conectados y reparte de forma justa", async () => {
    await new Heartbeat(game, clock).execute("EQ01-1", "EQ01");
    await new Heartbeat(game, clock).execute("EQ02-1", "EQ02");
    await new Heartbeat(game, clock).execute("EQ04-1", "EQ04");
    now -= 0;
    // EQ09-1 se conectó hace mucho: no cuenta
    await game.presence.touch({ studentId: "EQ09-1", teamId: "EQ09", lastSeen: now - 120_000 });

    const launch = new LaunchPop(game, clock, seq([0]));
    expect(await launch.execute({ section: "nivel1", count: 2 })).toBe(2);
    expect(await launch.execute({ section: "nivel1", count: 2 })).toBe(2);
    const asked = (await game.answers.list()).map((a) => a.studentId);
    expect(asked).not.toContain("EQ09-1");
    // Con 3 conectados y 4 preguntas, nadie recibe 3 antes que otro reciba 1.
    const counts = ["EQ01-1", "EQ02-1", "EQ04-1"].map((id) => asked.filter((a) => a === id).length);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });

  it("acepta la respuesta dentro del tiempo (con margen) y una sola vez", async () => {
    await new Heartbeat(game, clock).execute("EQ01-1", "EQ01");
    await new LaunchPop(game, clock, seq([0])).execute({ section: "fuente", questionId: "F4", count: 1 });
    const [row] = await game.answers.list();
    const answer = new AnswerPop(game, clock);
    await expect(answer.execute({ studentId: "EQ02-1", answerId: row.id, choice: 2 })).rejects.toThrow(/no es para ti/);
    now += 50_000; // pasó el límite, pero dentro del margen por reconexión
    const r = await answer.execute({ studentId: "EQ01-1", answerId: row.id, choice: findPopQuestion("F4")!.answer });
    expect(r.correct).toBe(true);
    await expect(answer.execute({ studentId: "EQ01-1", answerId: row.id, choice: 0 })).rejects.toThrow(/Ya respondiste/);
  });

  it("sin nadie conectado no se lanza", async () => {
    await expect(new LaunchPop(game, clock).execute({ section: "fuente", count: 3 })).rejects.toThrow(/conectados/);
  });

  it("el celular no recibe la respuesta correcta antes de contestar", async () => {
    await new Heartbeat(game, clock).execute("EQ01-1", "EQ01");
    await new LaunchPop(game, clock, seq([0])).execute({ section: "fuente", count: 1 });
    const snap = await new GetSnapshot(game, clock).execute({ role: "team", teamId: "EQ01", studentId: "EQ01-1" });
    expect(snap.team!.pendingPops).toHaveLength(1);
    expect(JSON.stringify(snap.team!.pendingPops)).not.toContain('"answer"');
  });
});

describe("Quiz final", () => {
  it("puntúa por acierto y rapidez, y no deja responder dos veces", async () => {
    const quiz = new ControlQuiz(game, clock);
    await quiz.execute("start");
    now += 4_000;
    await new AnswerQuiz(game, clock).execute({ studentId: "EQ01-1", teamId: "EQ01", choice: FINAL_QUIZ[0].answer });
    await expect(new AnswerQuiz(game, clock).execute({ studentId: "EQ01-1", teamId: "EQ01", choice: 0 })).rejects.toThrow(/Ya respondiste/);
    const [row] = await game.answers.list();
    expect(row.points).toBe(quizPoints(true, 4_000, 20_000));
    expect(quizPoints(false, 1, 20_000)).toBe(0);
    now += 30_000;
    await expect(new AnswerQuiz(game, clock).execute({ studentId: "EQ02-1", teamId: "EQ02", choice: 0 })).rejects.toThrow(/tiempo/);
  });
});

describe("Invitado", () => {
  it("cada grupo guarda una pregunta y el docente la pone en pantalla", async () => {
    await new SaveGuestQuestion(game).execute({ teamId: "EQ01", studentId: "EQ01-2", text: "¿Cómo hacen el diagnóstico integral?" });
    await new SaveGuestQuestion(game).execute({ teamId: "EQ01", studentId: "EQ01-1", text: "¿Cómo diagnostican a un cliente nuevo?" });
    const [q] = await game.guestQuestions.list();
    expect(q.text).toMatch(/cliente nuevo/);
    await new SetGuestQuestionStatus(game).execute(q.id, "en-pantalla");
    const snap = await new GetSnapshot(game).execute({ role: "public" });
    expect(snap.guest.current?.teamLabel).toBe("01");
    expect(snap.guest.queue[0].level).toBe(1);
    await new SetGuestQuestionStatus(game).execute(q.id, "hecha");
    await expect(new SaveGuestQuestion(game).execute({ teamId: "EQ01", studentId: "EQ01-1", text: "Otra pregunta distinta" })).rejects.toThrow(/ya se hizo/);
  });
});

describe("Nota 0 a 5", () => {
  it("excluye componentes faltantes y reparte su peso", () => {
    const row = gradeStudent({
      studentId: "EQ01-1",
      teamId: "EQ01",
      answers: [],
      quizQuestionsOpened: 0,
      canvasScore: 4,
      teamBalance: 50,
      balances: [50, 100],
      weights: DEFAULT_WEIGHTS,
    });
    // lienzo 4 (30 %) y juego 3 (15 %) → (4·30 + 3·15) / 45 = 3,7
    expect(row.final).toBe(3.7);
    expect(row.partial).toBe(true);
    expect(budgetScore(100, [50, 100])).toBe(5);
  });

  it("calcula la nota con datos reales de la partida", async () => {
    await new SetCanvasScore(game).execute("EQ01", 5);
    await new Heartbeat(game, clock).execute("EQ01-1", "EQ01");
    await new LaunchPop(game, clock, seq([0])).execute({ section: "fuente", questionId: "F1", count: 1 });
    const [pop] = await game.answers.list();
    await new AnswerPop(game, clock).execute({ studentId: "EQ01-1", answerId: pop.id, choice: 1 });
    await new ControlQuiz(game, clock).execute("start");
    await new AnswerQuiz(game, clock).execute({ studentId: "EQ01-1", teamId: "EQ01", choice: FINAL_QUIZ[0].answer });

    const grades = await new GetGrades(game).execute();
    const g = grades.find((x) => x.studentId === "EQ01-1")!;
    expect(g.final).toBe(5);
    expect(g.attended).toBe(true);
    expect(grades.find((x) => x.studentId === "EQ02-1")!.attended).toBe(false);
    await expect(new SetWeights(game).execute({ sorpresa: 50, quiz: 50, lienzo: 10, juego: 0 })).rejects.toThrow(/100/);
  });

  it("al cambiar de actividad la teoría salta a su diapositiva", async () => {
    await new ControlAgenda(game).execute({ goto: 3 });
    expect((await game.state.get()).slideIndex).toBe(firstSlideOf(3));
  });

  it("pickFairly prioriza a quien menos preguntas tiene", () => {
    const asked = new Map([["a", 2], ["b", 0], ["c", 1]]);
    expect(pickFairly(["a", "b", "c"], asked, 2, () => 0)).toEqual(["b", "c"]);
  });
});
