import { beforeEach, describe, expect, it } from "vitest";
import { createInMemoryGame } from "@/infrastructure/memory/InMemoryGame";
import type { GameDependencies } from "@/application/ports";
import {
  AnswerPop,
  AnswerQuiz,
  ControlSlides,
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
import { optionOrderFor, pickFairly, quizOrderFor, rankQuiz } from "@/domain/selection";

/** Posición en que un estudiante ve la opción original `original` de una pregunta. */
const shown = (studentId: string, questionId: string, original: number) => optionOrderFor(studentId, questionId).indexOf(original);
import { budgetScore, gradeStudent, DEFAULT_WEIGHTS } from "@/domain/grading";
import { findPopQuestion, FINAL_QUIZ, QUIZ_MINUTES, POP_SECONDS } from "@/domain/data/questions";
import { SLIDES, firstSlideOf } from "@/domain/data/lessons";
import { AGENDA, agendaClock } from "@/domain/data/agenda";
import { GUEST_MEETING, GUEST_TOPICS } from "@/domain/data/guest";
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
  it("el cronograma dura 180 minutos y la conexión con el invitado es lo último, de 3:30 a 4:00 p. m.", () => {
    expect(AGENDA.reduce((s, a) => s + a.minutes, 0)).toBe(180);
    expect(agendaClock(0)).toBe("1:00 p. m.");
    const live = AGENDA.length - 1;
    expect(AGENDA[live].title).toContain("Conexión en vivo");
    expect(agendaClock(live)).toBe("3:30 p. m.");
    expect(GUEST_MEETING.start).toBe(agendaClock(live));
    expect(AGENDA[live].minutes).toBe(30);
  });

  it("cada grupo tiene un tema distinto para el invitado", () => {
    expect(new Set(GUEST_TOPICS.map((t) => t.teamId))).toEqual(new Set(TEAMS.map((t) => t.id)));
  });

  it("toda actividad con teoría tiene su diapositiva", () => {
    expect(firstSlideOf(0)).toBe(0);
    expect(firstSlideOf(AGENDA.length - 1)).not.toBeNull();
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
    now += POP_SECONDS * 1000 + 2_000; // pasó el límite, pero dentro del margen de 3 s por señal
    const r = await answer.execute({ studentId: "EQ01-1", answerId: row.id, choice: shown("EQ01-1", "F4", findPopQuestion("F4")!.answer) });
    expect(r.correct).toBe(true);
    await expect(answer.execute({ studentId: "EQ01-1", answerId: row.id, choice: 0 })).rejects.toThrow(/Ya respondiste/);
  });

  it("sin nadie conectado no se lanza", async () => {
    await expect(new LaunchPop(game, clock).execute({ section: "fuente", count: 3 })).rejects.toThrow(/conectados/);
  });

  it("el celular o computador no recibe la respuesta correcta antes de contestar", async () => {
    await new Heartbeat(game, clock).execute("EQ01-1", "EQ01");
    await new LaunchPop(game, clock, seq([0])).execute({ section: "fuente", count: 1 });
    const snap = await new GetSnapshot(game, clock).execute({ role: "team", teamId: "EQ01", studentId: "EQ01-1" });
    expect(snap.team!.pendingPops).toHaveLength(1);
    expect(JSON.stringify(snap.team!.pendingPops)).not.toContain('"answer"');
  });
});

describe("Límite de tiempo", () => {
  it("la pregunta sorpresa acepta respuesta hasta 3 s después del límite y no más", async () => {
    await new Heartbeat(game, clock).execute("EQ01-1", "EQ01");
    await new Heartbeat(game, clock).execute("EQ02-1", "EQ02");
    await new LaunchPop(game, clock, seq([0])).execute({ section: "fuente", count: 2 });
    const [a, b] = await game.answers.list();
    now += POP_SECONDS * 1000 + 2_000;
    await new AnswerPop(game, clock).execute({ studentId: a.studentId, answerId: a.id, choice: 0 });
    now += 2_000;
    await expect(new AnswerPop(game, clock).execute({ studentId: b.studentId, answerId: b.id, choice: 0 })).rejects.toThrow(/tiempo/);
  });
});

describe("Quiz final", () => {
  const ids = FINAL_QUIZ.map((q) => q.id);
  const answerAll = async (studentId: string, teamId: string, correct = true) => {
    for (const q of FINAL_QUIZ)
      await new AnswerQuiz(game, clock).execute({ studentId, teamId, questionId: q.id, choice: shown(studentId, q.id, correct ? q.answer : (q.answer + 1) % 4) });
  };

  it("cada estudiante tiene su propio orden, estable y sin repetir preguntas", () => {
    const a = quizOrderFor("EQ01-1", ids);
    expect(quizOrderFor("EQ01-1", ids)).toEqual(a);
    expect([...a].sort()).toEqual([...ids].sort());
    const others = ["EQ01-2", "EQ02-1", "EQ04-1", "EQ05-1"].map((id) => quizOrderFor(id, ids).join());
    expect(others.some((o) => o !== a.join())).toBe(true);
  });

  it("no deja responder dos veces ni fuera de los 15 minutos", async () => {
    await new ControlQuiz(game, clock).execute("start");
    const q = FINAL_QUIZ[0];
    await new AnswerQuiz(game, clock).execute({ studentId: "EQ01-1", teamId: "EQ01", questionId: q.id, choice: shown("EQ01-1", q.id, q.answer) });
    await expect(
      new AnswerQuiz(game, clock).execute({ studentId: "EQ01-1", teamId: "EQ01", questionId: q.id, choice: 0 }),
    ).rejects.toThrow(/Ya respondiste/);
    now += QUIZ_MINUTES * 60_000 + 10_000;
    await expect(
      new AnswerQuiz(game, clock).execute({ studentId: "EQ02-1", teamId: "EQ02", questionId: q.id, choice: 0 }),
    ).rejects.toThrow(/tiempo/);
  });

  it("avisa cuando todos terminan y arma el ranking por aciertos y tiempo", async () => {
    await new Heartbeat(game, clock).execute("EQ01-1", "EQ01");
    await new Heartbeat(game, clock).execute("EQ02-1", "EQ02");
    await new ControlQuiz(game, clock).execute("start");
    now += 60_000;
    await answerAll("EQ01-1", "EQ01");
    await new Heartbeat(game, clock).execute("EQ02-1", "EQ02");
    let snap = await new GetSnapshot(game, clock).execute({ role: "public" });
    expect(snap.quiz.allDone).toBe(false);
    expect(snap.quiz.leaderboard).toBeUndefined();

    now += 30_000;
    await answerAll("EQ02-1", "EQ02");
    await new Heartbeat(game, clock).execute("EQ01-1", "EQ01");
    snap = await new GetSnapshot(game, clock).execute({ role: "public" });
    expect(snap.quiz.allDone).toBe(true);

    await new ControlQuiz(game, clock).execute("finish");
    snap = await new GetSnapshot(game, clock).execute({ role: "public" });
    expect(snap.quiz.leaderboard!.map((l) => l.teamLabel)).toEqual(["01", "02"]);
    expect(snap.quiz.leaderboard![0].timeMs).toBe(60_000);
  });

  it("empata en aciertos: gana el más rápido; más aciertos pesan más que el tiempo", () => {
    const r = rankQuiz([
      { studentId: "a", correct: 10, answered: 12, timeMs: 100 },
      { studentId: "b", correct: 11, answered: 12, timeMs: 900 },
      { studentId: "c", correct: 11, answered: 12, timeMs: 500 },
      { studentId: "d", correct: 0, answered: 0, timeMs: 0 },
    ]);
    expect(r.map((x) => x.studentId)).toEqual(["c", "b", "a"]);
  });

  it("el celular o computador recibe las preguntas en su orden y sin la respuesta correcta", async () => {
    await new ControlQuiz(game, clock).execute("start");
    const snap = await new GetSnapshot(game, clock).execute({ role: "team", teamId: "EQ01", studentId: "EQ01-1" });
    expect(snap.team!.quiz!.questions.map((q) => q.id)).toEqual(quizOrderFor("EQ01-1", ids));
    expect(JSON.stringify(snap.team!.quiz)).not.toContain('"answer"');
  });
});

describe("Orden aleatorio de las opciones", () => {
  it("cada estudiante ve las opciones en su propio orden, estable, y la correcta no queda siempre en la misma letra", () => {
    const a = FINAL_QUIZ.map((q) => optionOrderFor("EQ01-1", q.id).join());
    expect(FINAL_QUIZ.map((q) => optionOrderFor("EQ01-1", q.id).join())).toEqual(a);
    for (const order of a) expect(order.split(",").sort().join()).toBe("0,1,2,3");
    expect(new Set(FINAL_QUIZ.map((q) => shown("EQ01-1", q.id, q.answer))).size).toBeGreaterThan(1);
    expect(FINAL_QUIZ.some((q) => optionOrderFor("EQ02-1", q.id).join() !== optionOrderFor("EQ01-1", q.id).join())).toBe(true);
  });

  it("el quiz muestra las opciones mezcladas y califica con el índice original", async () => {
    await new ControlQuiz(game, clock).execute("start");
    const q = FINAL_QUIZ[0];
    const snap = await new GetSnapshot(game, clock).execute({ role: "team", teamId: "EQ01", studentId: "EQ01-1" });
    const view = snap.team!.quiz!.questions.find((x) => x.id === q.id)!;
    const pos = view.options.indexOf(q.options[q.answer]);
    expect(pos).toBe(shown("EQ01-1", q.id, q.answer));
    await new AnswerQuiz(game, clock).execute({ studentId: "EQ01-1", teamId: "EQ01", questionId: q.id, choice: pos });
    const [row] = (await game.answers.list()).filter((x) => x.kind === "quiz");
    expect(row.choice).toBe(q.answer);
    expect(row.correct).toBe(true);
    const after = await new GetSnapshot(game, clock).execute({ role: "team", teamId: "EQ01", studentId: "EQ01-1" });
    expect(after.team!.quiz!.answered[q.id]).toBe(pos);
  });

  it("la pregunta sorpresa devuelve la correcta en la posición que ve el estudiante", async () => {
    await new Heartbeat(game, clock).execute("EQ01-1", "EQ01");
    await new LaunchPop(game, clock, seq([0])).execute({ section: "fuente", questionId: "F3", count: 1 });
    const snap = await new GetSnapshot(game, clock).execute({ role: "team", teamId: "EQ01", studentId: "EQ01-1" });
    const pending = snap.team!.pendingPops[0];
    const q = findPopQuestion("F3")!;
    const wrong = pending.question.options.findIndex((o) => o !== q.options[q.answer]);
    const r = await new AnswerPop(game, clock).execute({ studentId: "EQ01-1", answerId: pending.answerId, choice: wrong });
    expect(r.correct).toBe(false);
    expect(pending.question.options[r.answer]).toBe(q.options[q.answer]);
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
      quizStarted: false,
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

  const quizRow = (questionId: string, choice: number, at = "2026-11-04T19:00:00Z") => ({
    id: `${questionId}-${at}`, kind: "quiz" as const, questionId, studentId: "EQ01-1", teamId: "EQ01",
    choice, correct: true, points: 1, sentAt: at, answeredAt: at, deadline: null, voided: false,
  });
  const base = { studentId: "EQ01-1", teamId: "EQ01", quizStarted: true, teamBalance: 100, balances: [50, 100], weights: DEFAULT_WEIGHTS };

  it("con todo perfecto la nota es exactamente 5,0 y cada ponderado llega a su tope", () => {
    const row = gradeStudent({
      ...base,
      answers: [
        ...FINAL_QUIZ.map((q) => quizRow(q.id, q.answer)),
        { ...quizRow("F1", findPopQuestion("F1")!.answer), kind: "sorpresa" as const },
      ],
      canvasScore: 5,
    });
    expect(row.final).toBe(5);
    expect(row.contributions).toEqual({ sorpresa: 1.25, quiz: 1.5, lienzo: 1.5, juego: 0.75 });
  });

  it("los datos inconsistentes no inflan la nota: se descartan y se avisan", () => {
    const q = FINAL_QUIZ[0];
    const wrong = (q.answer + 1) % 4;
    const row = gradeStudent({
      ...base,
      answers: [
        quizRow(q.id, wrong, "2026-11-04T19:00:00Z"), // primera respuesta: incorrecta
        quizRow(q.id, q.answer, "2026-11-04T19:01:00Z"), // duplicada: no cuenta
        quizRow("Q99", 0), // pregunta inexistente: no cuenta
        { ...quizRow(FINAL_QUIZ[1].id, (FINAL_QUIZ[1].answer + 1) % 4), correct: true }, // marcada como correcta pero no lo es
      ],
      canvasScore: 9,
    });
    expect(row.quiz).toMatchObject({ answered: 2, correct: 0, total: FINAL_QUIZ.length });
    expect(row.components.quiz).toBe(0);
    expect(row.components.lienzo).toBeUndefined();
    expect(row.issues.length).toBe(2);
    expect(budgetScore(500, [50, 100])).toBe(5);
    expect(budgetScore(10, [50, 100])).toBe(3);
  });

  it("con datos al azar, ningún componente ni la nota pasa de 5,0 y los ponderados respetan su peso", () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let n = 0; n < 500; n++) {
      const answers = FINAL_QUIZ.filter(() => rnd() < 0.8).map((q) => quizRow(q.id, Math.floor(rnd() * 4)));
      const balances = Array.from({ length: 11 }, () => Math.floor(rnd() * 160));
      const row = gradeStudent({
        ...base,
        answers,
        quizStarted: rnd() < 0.9,
        canvasScore: rnd() < 0.7 ? Math.round(rnd() * 50) / 10 : undefined,
        teamBalance: balances[0],
        balances,
      });
      expect(row.final).not.toBeNull();
      expect(row.final!).toBeGreaterThanOrEqual(0);
      expect(row.final!).toBeLessThanOrEqual(5);
      for (const [k, c] of Object.entries(row.contributions)) {
        const used = row.weightsUsed[k as keyof typeof row.weightsUsed]!;
        expect(row.components[k as keyof typeof row.components]!).toBeLessThanOrEqual(5);
        expect(c).toBeLessThanOrEqual((5 * used) / 100 + 0.01);
      }
      const sumUsed = Object.values(row.weightsUsed).reduce((a, b) => a + b, 0);
      expect(Math.abs(sumUsed - 100)).toBeLessThanOrEqual(0.2);
      const sumContrib = Object.values(row.contributions).reduce((a, b) => a + b, 0);
      expect(Math.abs(sumContrib - row.final!)).toBeLessThanOrEqual(0.06);
    }
  });

  it("volver a empezar el quiz borra solo sus respuestas", async () => {
    await new Heartbeat(game, clock).execute("EQ01-1", "EQ01");
    await new LaunchPop(game, clock, seq([0])).execute({ section: "fuente", questionId: "F1", count: 1 });
    await new ControlQuiz(game, clock).execute("start");
    const q = FINAL_QUIZ[0];
    await new AnswerQuiz(game, clock).execute({ studentId: "EQ01-1", teamId: "EQ01", questionId: q.id, choice: shown("EQ01-1", q.id, q.answer) });
    await new ControlQuiz(game, clock).execute("reset");
    const kinds = (await game.answers.list()).map((a) => a.kind);
    expect(kinds).toEqual(["sorpresa"]);
    await new ControlQuiz(game, clock).execute("start");
    await new AnswerQuiz(game, clock).execute({ studentId: "EQ01-1", teamId: "EQ01", questionId: q.id, choice: shown("EQ01-1", q.id, q.answer) });
  });

  it("calcula la nota con datos reales de la partida", async () => {
    await new SetCanvasScore(game).execute("EQ01", 5);
    await new Heartbeat(game, clock).execute("EQ01-1", "EQ01");
    await new LaunchPop(game, clock, seq([0])).execute({ section: "fuente", questionId: "F1", count: 1 });
    const [pop] = await game.answers.list();
    await new AnswerPop(game, clock).execute({ studentId: "EQ01-1", answerId: pop.id, choice: shown("EQ01-1", "F1", findPopQuestion("F1")!.answer) });
    await new ControlQuiz(game, clock).execute("start");
    for (const q of FINAL_QUIZ) await new AnswerQuiz(game, clock).execute({ studentId: "EQ01-1", teamId: "EQ01", questionId: q.id, choice: shown("EQ01-1", q.id, q.answer) });

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

describe("Diapositivas y cronograma", () => {
  it("al pasar a una diapositiva de la siguiente actividad, la actividad y el cronómetro avanzan", async () => {
    await new ControlAgenda(game, clock).execute("start");
    const target = SLIDES.findIndex((sl) => sl.agenda === 1);
    await new ControlSlides(game, clock).execute({ goto: target });
    const s = await game.state.get();
    expect(s.agendaIndex).toBe(1);
    expect(s.timer.status).toBe("running");
    expect(s.timer.remainingMs).toBe(AGENDA[1].minutes * 60_000);
  });

  it("retroceder a una diapositiva de una actividad anterior no cambia la actividad", async () => {
    await new ControlAgenda(game, clock).execute({ goto: 1 });
    await new ControlSlides(game, clock).execute({ goto: 0 });
    const s = await game.state.get();
    expect(s.slideIndex).toBe(0);
    expect(s.agendaIndex).toBe(1);
  });
});
