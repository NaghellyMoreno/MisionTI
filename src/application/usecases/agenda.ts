import { AGENDA } from "@/domain/data/agenda";
import { firstSlideOf } from "@/domain/data/lessons";
import { freshTimer, minutesToMs, remainingMs } from "@/domain/rules";
import type { GameState } from "@/domain/types";
import type { GameDependencies } from "../ports";

export type TimerCommand = "start" | "pause" | "reset" | "next" | "prev" | "plus1" | "minus1" | { goto: number };

/** Lleva el cronograma de la clase y el temporizador compartido. */
export class ControlAgenda {
  constructor(
    private readonly deps: Pick<GameDependencies, "state" | "notifier">,
    private readonly clock: () => number = Date.now,
  ) {}

  async execute(command: TimerCommand) {
    const now = this.clock();
    await this.deps.state.update((s) => apply(s, command, now));
    await this.deps.notifier.notify();
  }
}

function apply(s: GameState, command: TimerCommand, now: number): GameState {
  const t = s.timer;
  const goto = (index: number): GameState => {
    const i = Math.min(Math.max(index, 0), AGENDA.length - 1);
    // Al cambiar de actividad, la teoría salta a su primera diapositiva.
    const slide = firstSlideOf(i);
    return { ...s, agendaIndex: i, timer: freshTimer(i), slideIndex: slide ?? s.slideIndex };
  };

  if (typeof command === "object") return goto(command.goto);

  switch (command) {
    case "start":
      if (t.status === "running") return s;
      return { ...s, timer: { status: "running", startedAt: now, remainingMs: t.remainingMs } };
    case "pause":
      if (t.status !== "running") return s;
      return { ...s, timer: { status: "paused", startedAt: null, remainingMs: remainingMs(t, now) } };
    case "reset":
      return { ...s, timer: freshTimer(s.agendaIndex) };
    case "next":
      return goto(s.agendaIndex + 1);
    case "prev":
      return goto(s.agendaIndex - 1);
    case "plus1":
    case "minus1": {
      const delta = minutesToMs(command === "plus1" ? 1 : -1);
      if (t.status === "running") {
        return { ...s, timer: { status: "running", startedAt: now, remainingMs: remainingMs(t, now) + delta } };
      }
      return { ...s, timer: { ...t, remainingMs: t.remainingMs + delta } };
    }
  }
}
