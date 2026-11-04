import { SLIDES } from "@/domain/data/lessons";
import { FINAL_QUIZ, POP_BANK, POP_SECONDS, QUIZ_MINUTES, findPopQuestion } from "@/domain/data/questions";
import type { PopSection } from "@/domain/data/agenda";
import { GameRuleError, freshTimer } from "@/domain/rules";
import { validWeights } from "@/domain/grading";
import { isOnline, studentsOf } from "@/domain/students";
import { optionOrderFor, pickFairly, type Random } from "@/domain/selection";
import type { GuestQuestionStatus, StudentId, TeamId } from "@/domain/types";
import type { GameDependencies } from "../ports";

type Deps<K extends keyof GameDependencies> = Pick<GameDependencies, K>;
type Clock = () => number;

/** Margen para respuestas que llegan tarde por una reconexión. */
export const POP_GRACE_MS = 3_000;
export const QUIZ_GRACE_MS = 3_000;

/* ---------- Asistencia ---------- */

export class Heartbeat {
  constructor(private readonly deps: Deps<"presence" | "notifier">, private readonly clock: Clock = Date.now) {}

  async execute(studentId: StudentId, teamId: TeamId) {
    const now = this.clock();
    const previous = (await this.deps.presence.list()).find((p) => p.studentId === studentId);
    await this.deps.presence.touch({ studentId, teamId, lastSeen: now });
    // Solo se avisa cuando alguien se (re)conecta, para no saturar el canal en vivo.
    if (!isOnline(previous, now)) await this.deps.notifier.notify();
  }
}

/* ---------- Teoría ---------- */

export class ControlSlides {
  constructor(private readonly deps: Deps<"state" | "notifier">, private readonly clock: Clock = Date.now) {}

  async execute(command: "next" | "prev" | { goto: number }) {
    const now = this.clock();
    await this.deps.state.update((s) => {
      const target = typeof command === "object" ? command.goto : s.slideIndex + (command === "next" ? 1 : -1);
      const slideIndex = Math.min(Math.max(target, 0), SLIDES.length - 1);
      const next = { ...s, slideIndex, screen: "teoria" as const };
      // Si la diapositiva es de una actividad posterior, la actividad avanza con ella.
      // Hacia atrás no se mueve, para que un clic de más no reinicie el cronómetro.
      const agendaIndex = SLIDES[slideIndex].agenda;
      if (agendaIndex <= s.agendaIndex) return next;
      const timer = freshTimer(agendaIndex);
      return {
        ...next,
        agendaIndex,
        timer: s.timer.status === "running" ? { status: "running" as const, startedAt: now, remainingMs: timer.remainingMs } : timer,
      };
    });
    await this.deps.notifier.notify();
  }
}

/* ---------- Preguntas sorpresa ---------- */

export class LaunchPop {
  constructor(
    private readonly deps: Deps<"teams" | "presence" | "answers" | "state" | "notifier">,
    private readonly clock: Clock = Date.now,
    private readonly random: Random = Math.random,
  ) {}

  async execute(input: { section: PopSection; questionId?: string; count: number }) {
    const bank = POP_BANK[input.section];
    if (!bank) throw new GameRuleError("Bloque de preguntas desconocido.");
    if (!Number.isInteger(input.count) || input.count < 1 || input.count > 10)
      throw new GameRuleError("Elijan entre 1 y 10 estudiantes.");

    const now = this.clock();
    const [teams, presence, answers] = await Promise.all([
      this.deps.teams.list(),
      this.deps.presence.list(),
      this.deps.answers.list(),
    ]);

    // Las anuladas no cuentan: quien perdió la señal vuelve a la fila para otra pregunta.
    const pops = answers.filter((a) => a.kind === "sorpresa" && !a.voided);
    const question = input.questionId
      ? bank.find((q) => q.id === input.questionId)
      : leastUsed(bank, pops.map((p) => p.questionId), this.random);
    if (!question) throw new GameRuleError("Esa pregunta no está en este bloque.");

    const presenceById = new Map(presence.map((p) => [p.studentId, p]));
    const online = studentsOf(teams).filter((s) => isOnline(presenceById.get(s.id), now));
    if (!online.length) throw new GameRuleError("No hay estudiantes conectados en este momento.");

    // No se le repite la misma pregunta a quien ya la recibió.
    const alreadyGot = new Set(pops.filter((p) => p.questionId === question.id).map((p) => p.studentId));
    const candidates = online.filter((s) => !alreadyGot.has(s.id));
    const asked = new Map<StudentId, number>();
    for (const p of pops) asked.set(p.studentId, (asked.get(p.studentId) ?? 0) + 1);

    const chosen = pickFairly((candidates.length ? candidates : online).map((s) => s.id), asked, input.count, this.random);
    const deadline = now + POP_SECONDS * 1000;
    const byId = new Map(online.map((s) => [s.id, s]));

    await this.deps.answers.createMany(
      chosen.map((studentId) => ({
        kind: "sorpresa" as const,
        questionId: question.id,
        studentId,
        teamId: byId.get(studentId)!.teamId,
        choice: null,
        correct: false,
        points: 0,
        sentAt: new Date(now).toISOString(),
        answeredAt: null,
        deadline,
        voided: false,
      })),
    );
    await this.deps.state.update((s) => ({
      ...s,
      pop: { questionId: question.id, studentIds: chosen, launchedAt: now, deadline },
      screen: "sorpresa",
    }));
    await this.deps.notifier.notify();
    return chosen.length;
  }
}

function leastUsed<T extends { id: string }>(bank: T[], used: string[], random: Random): T {
  const count = (id: string) => used.filter((u) => u === id).length;
  const min = Math.min(...bank.map((q) => count(q.id)));
  const tier = bank.filter((q) => count(q.id) === min);
  return tier[Math.floor(random() * tier.length)];
}

export class AnswerPop {
  constructor(private readonly deps: Deps<"answers" | "notifier">, private readonly clock: Clock = Date.now) {}

  async execute(input: { studentId: StudentId; answerId: string; choice: number }) {
    const row = (await this.deps.answers.list()).find((a) => a.id === input.answerId);
    if (!row || row.studentId !== input.studentId || row.kind !== "sorpresa") throw new GameRuleError("Esta pregunta no es para ti.");
    if (row.choice !== null) throw new GameRuleError("Ya respondiste esta pregunta.");
    if (row.voided) throw new GameRuleError("El equipo docente anuló esta pregunta: no cuenta en tu nota.");
    if (!Number.isInteger(input.choice) || input.choice < 0 || input.choice > 3) throw new GameRuleError("Opción no válida.");
    const now = this.clock();
    if (row.deadline !== null && now > row.deadline + POP_GRACE_MS) throw new GameRuleError("Se acabó el tiempo para esta pregunta.");

    const question = findPopQuestion(row.questionId)!;
    // El estudiante elige la posición en su pantalla; se guarda el índice original de la opción.
    const order = optionOrderFor(input.studentId, question.id, question.options.length);
    const choice = order[input.choice];
    const correct = choice === question.answer;
    const ok = await this.deps.answers.respond(row.id, {
      choice,
      correct,
      points: correct ? 1 : 0,
      answeredAt: new Date(now).toISOString(),
    });
    if (!ok) throw new GameRuleError("Ya respondiste esta pregunta.");
    await this.deps.notifier.notify();
    // La respuesta correcta se devuelve en la posición en que la ve este estudiante.
    return { correct, explanation: question.explanation, answer: order.indexOf(question.answer) };
  }
}

/** El equipo docente anula (o restaura) una pregunta sorpresa: deja de contar en la nota. */
export class VoidPopAnswer {
  constructor(private readonly deps: Deps<"answers" | "notifier">) {}

  async execute(answerId: string, voided: boolean) {
    const row = (await this.deps.answers.list()).find((a) => a.id === answerId);
    if (!row || row.kind !== "sorpresa") throw new GameRuleError("Pregunta sorpresa no encontrada.");
    await this.deps.answers.setVoided(answerId, voided);
    await this.deps.notifier.notify();
  }
}

/* ---------- Quiz final ---------- */

export class ControlQuiz {
  constructor(private readonly deps: Deps<"state" | "answers" | "notifier">, private readonly clock: Clock = Date.now) {}

  /** "start" abre el quiz para todos; "finish" lo cierra y muestra el ranking; "reset" borra sus respuestas y lo deja sin iniciar. */
  async execute(command: "start" | "finish" | "reset") {
    const now = this.clock();
    // Sin las respuestas viejas, al reiniciar todos pueden volver a responder y la nota y el ranking no las usan.
    if (command === "reset") await this.deps.answers.deleteKind("quiz");
    await this.deps.state.update((s) => {
      switch (command) {
        case "start":
          if (s.quiz.status !== "cerrado") return s;
          return { ...s, quiz: { index: 0, status: "abierto", openedAt: now }, screen: "quiz" };
        case "finish":
          if (s.quiz.status === "cerrado") return s;
          return { ...s, quiz: { ...s.quiz, status: "terminado" }, screen: "quiz" };
        case "reset":
          return { ...s, quiz: { index: -1, status: "cerrado", openedAt: null } };
      }
    });
    await this.deps.notifier.notify();
  }
}

export class AnswerQuiz {
  constructor(private readonly deps: Deps<"answers" | "state" | "notifier">, private readonly clock: Clock = Date.now) {}

  async execute(input: { studentId: StudentId; teamId: TeamId; questionId: string; choice: number }) {
    const { quiz } = await this.deps.state.get();
    if (quiz.status !== "abierto" || quiz.openedAt === null) throw new GameRuleError("El quiz no está abierto.");
    const question = FINAL_QUIZ.find((q) => q.id === input.questionId);
    if (!question) throw new GameRuleError("Esa pregunta no existe.");
    if (!Number.isInteger(input.choice) || input.choice < 0 || input.choice > 3) throw new GameRuleError("Opción no válida.");

    const now = this.clock();
    const duration = QUIZ_MINUTES * 60_000;
    if (now - quiz.openedAt > duration + QUIZ_GRACE_MS) throw new GameRuleError("Se acabó el tiempo.");

    const existing = (await this.deps.answers.list()).some(
      (a) => a.kind === "quiz" && a.questionId === question.id && a.studentId === input.studentId,
    );
    if (existing) throw new GameRuleError("Ya respondiste esta pregunta.");

    // El estudiante elige la posición en su pantalla; se guarda el índice original de la opción.
    const choice = optionOrderFor(input.studentId, question.id, question.options.length)[input.choice];
    const correct = choice === question.answer;
    await this.deps.answers.createMany([
      {
        kind: "quiz",
        questionId: question.id,
        studentId: input.studentId,
        teamId: input.teamId,
        choice,
        correct,
        // Un punto por acierto: el desempate es el tiempo (answeredAt menos la apertura del quiz).
        points: correct ? 1 : 0,
        sentAt: new Date(quiz.openedAt).toISOString(),
        answeredAt: new Date(now).toISOString(),
        deadline: quiz.openedAt + duration,
        voided: false,
      },
    ]);
    await this.deps.notifier.notify();
  }
}

/* ---------- Preguntas al invitado ---------- */

export const GUEST_QUESTION_MIN = 10;
export const GUEST_QUESTION_MAX = 240;

/** Normaliza y valida el texto de una pregunta al invitado. */
export function cleanGuestQuestion(raw: string): string {
  const text = raw.trim().replace(/\s+/g, " ");
  if (text.length < GUEST_QUESTION_MIN) throw new GameRuleError("Escriban una pregunta un poco más completa.");
  if (text.length > GUEST_QUESTION_MAX) throw new GameRuleError(`Máximo ${GUEST_QUESTION_MAX} caracteres: debe caber en 30 segundos.`);
  return text;
}

export class SaveGuestQuestion {
  constructor(private readonly deps: Deps<"guestQuestions" | "notifier">) {}

  async execute(input: { teamId: TeamId; studentId: StudentId; text: string }) {
    const text = cleanGuestQuestion(input.text);
    const current = (await this.deps.guestQuestions.list()).find((q) => q.teamId === input.teamId);
    if (current?.status === "hecha") throw new GameRuleError("Su pregunta ya se hizo en la entrevista.");
    await this.deps.guestQuestions.save({ teamId: input.teamId, studentId: input.studentId, text });
    await this.deps.notifier.notify();
  }
}

/** El equipo docente corrige la redacción de una pregunta antes de ponerla en pantalla. */
export class EditGuestQuestion {
  constructor(private readonly deps: Deps<"guestQuestions" | "notifier">) {}

  async execute(id: string, rawText: string) {
    const text = cleanGuestQuestion(rawText);
    if (!(await this.deps.guestQuestions.list()).some((q) => q.id === id)) throw new GameRuleError("Pregunta no encontrada.");
    await this.deps.guestQuestions.setText(id, text);
    await this.deps.notifier.notify();
  }
}

export class SetGuestQuestionStatus {
  constructor(private readonly deps: Deps<"guestQuestions" | "state" | "notifier">) {}

  async execute(id: string, status: GuestQuestionStatus) {
    const all = await this.deps.guestQuestions.list();
    if (!all.some((q) => q.id === id)) throw new GameRuleError("Pregunta no encontrada.");
    if (status === "en-pantalla") {
      // La que estaba en pantalla se da por hecha.
      for (const q of all) if (q.status === "en-pantalla" && q.id !== id) await this.deps.guestQuestions.setStatus(q.id, "hecha");
    }
    await this.deps.guestQuestions.setStatus(id, status);
    await this.deps.state.update((s) => ({
      ...s,
      guestCurrent: status === "en-pantalla" ? id : s.guestCurrent === id ? null : s.guestCurrent,
      screen: status === "en-pantalla" ? "invitado" : s.screen,
    }));
    await this.deps.notifier.notify();
  }
}

/* ---------- Notas ---------- */

export class SetCanvasScore {
  constructor(private readonly deps: Deps<"teams" | "state" | "notifier">) {}

  async execute(teamId: TeamId, score: number | null) {
    if (!(await this.deps.teams.list()).some((t) => t.id === teamId)) throw new GameRuleError("Grupo no válido.");
    if (score !== null && (!Number.isFinite(score) || score < 0 || score > 5)) throw new GameRuleError("La nota del lienzo va de 0 a 5.");
    await this.deps.state.update((s) => {
      const canvasScores = { ...s.canvasScores };
      if (score === null) delete canvasScores[teamId];
      else canvasScores[teamId] = Math.round(score * 10) / 10;
      return { ...s, canvasScores };
    });
    await this.deps.notifier.notify();
  }
}

export class SetWeights {
  constructor(private readonly deps: Deps<"state" | "notifier">) {}

  async execute(weights: { sorpresa: number; quiz: number; lienzo: number; juego: number }) {
    const values = Object.values(weights);
    if (values.some((v) => !Number.isInteger(v) || v < 0 || v > 100)) throw new GameRuleError("Cada peso es un entero entre 0 y 100.");
    if (!validWeights(weights)) throw new GameRuleError("Los pesos deben sumar 100 %.");
    await this.deps.state.update((s) => ({ ...s, weights: { ...weights } }));
    await this.deps.notifier.notify();
  }
}
