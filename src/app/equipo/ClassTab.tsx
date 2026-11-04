"use client";

import type { Snapshot } from "@/application/snapshot";
import { SLIDES } from "@/domain/data/lessons";
import { useTick } from "@/ui/useLive";
import { SlideView } from "@/ui/SlideView";
import { formatClock } from "@/ui/time";
import { answerQuiz } from "../actions";
import type { ActionApi } from "./TeamApp";

const LETTERS = ["A", "B", "C", "D"];

export function ClassTab({ snapshot, action, serverNow }: { snapshot: Snapshot; action: ActionApi; serverNow: () => number }) {
  const me = snapshot.team!;
  const slide = SLIDES[snapshot.state.slideIndex] ?? SLIDES[0];
  const quizActive = snapshot.quiz.status !== "cerrado" && snapshot.team?.quiz;

  return (
    <section className="stack">
      {quizActive && <QuizCard snapshot={snapshot} action={action} serverNow={serverNow} />}

      <div className="row between">
        <span className="label">En la clase ahora</span>
        <span className="hint mono">
          {snapshot.state.slideIndex + 1}/{SLIDES.length}
        </span>
      </div>
      <div className="panel">
        <SlideView slide={slide} size="sm" clue={slide.clueFor?.includes(me.team.id)} />
      </div>
      <p className="hint" style={{ margin: 0, textAlign: "center" }}>
        Preguntas sorpresa respondidas: {me.popScore.correct} correctas de {me.popScore.asked}
      </p>
    </section>
  );
}

function QuizCard({ snapshot, action, serverNow }: { snapshot: Snapshot; action: ActionApi; serverNow: () => number }) {
  useTick(500);
  const q = snapshot.quiz;
  const mine = snapshot.team!.quiz;
  if (!mine) return null;

  if (q.status === "terminado") {
    const r = mine.result;
    return (
      <div className="panel tick quiz-card">
        <span className="label">Quiz final terminado</span>
        <p className="quiz-points mono">{r?.correct ?? 0}/{r?.total ?? q.total}</p>
        <span className="hint">
          {r && r.rank ? `Quedaste en el puesto ${r.rank} · ` : ""}
          {r && r.timeMs > 0 ? `Tiempo: ${formatClock(r.timeMs)} · ` : ""}
          Miren el proyector para el ranking.
        </span>
      </div>
    );
  }

  const left = q.openedAt ? Math.max(0, Math.ceil((q.openedAt + q.durationMs - serverNow()) / 1000)) : 0;
  const answeredCount = Object.keys(mine.answered).length;
  const next = mine.questions.find((x) => mine.answered[x.id] === undefined);

  const header = (
    <div className="row between">
      <span className="label">Quiz final · {Math.min(answeredCount + 1, q.total)}/{q.total}</span>
      <span className={`mono ${left <= 60 ? "coral" : ""}`}>{formatClock(left * 1000)}</span>
    </div>
  );

  if (!next) {
    return (
      <div className="panel tick quiz-card">
        {header}
        <p className="quiz-question">¡Terminaste! Respondiste las {q.total} preguntas.</p>
        <span className="hint">Esperen a que el resto termine. El ranking sale en el proyector.</span>
      </div>
    );
  }
  if (left <= 0) {
    return (
      <div className="panel tick quiz-card">
        {header}
        <p className="quiz-question">Se acabó el tiempo.</p>
        <span className="hint">Respondiste {answeredCount} de {q.total}. Esperen el ranking en el proyector.</span>
      </div>
    );
  }

  return (
    <div className="panel tick quiz-card">
      {header}
      <p className="quiz-question">{next.text}</p>
      <div className="pop-options">
        {next.options.map((o, i) => (
          <button key={`${next.id}-${i}`} className="pop-option" disabled={action.pending} onClick={() => action.run(() => answerQuiz(next.id, i))}>
            <span className="mono">{LETTERS[i]}</span>
            {o}
          </button>
        ))}
      </div>
      <span className="hint">Cada respuesta es definitiva. Gana quien más acierte y en menos tiempo.</span>
    </div>
  );
}
