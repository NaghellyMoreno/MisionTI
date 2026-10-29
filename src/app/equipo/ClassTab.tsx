"use client";

import type { Snapshot } from "@/application/snapshot";
import { SLIDES } from "@/domain/data/lessons";
import { useTick } from "@/ui/useLive";
import { SlideView } from "@/ui/SlideView";
import { answerQuiz } from "../actions";
import type { ActionApi } from "./TeamApp";

const LETTERS = ["A", "B", "C", "D"];

export function ClassTab({ snapshot, action, serverNow }: { snapshot: Snapshot; action: ActionApi; serverNow: () => number }) {
  const me = snapshot.team!;
  const slide = SLIDES[snapshot.state.slideIndex] ?? SLIDES[0];
  const quizActive = snapshot.quiz.status !== "cerrado" && snapshot.quiz.question;

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
  useTick(250);
  const me = snapshot.team!;
  const q = snapshot.quiz;
  const question = q.question!;

  if (q.status === "terminado") {
    return (
      <div className="panel tick quiz-card">
        <span className="label">Quiz final terminado</span>
        <p className="quiz-points mono">{me.quizPoints} pts</p>
        <span className="hint">Miren el proyector para el podio.</span>
      </div>
    );
  }

  const left = q.openedAt ? Math.max(0, Math.ceil((q.openedAt + q.durationMs - serverNow()) / 1000)) : 0;
  const open = q.status === "abierto" && left > 0;
  const mine = me.quizChoice;

  return (
    <div className="panel tick quiz-card">
      <div className="row between">
        <span className="label">Quiz final · {q.index + 1}/{q.total}</span>
        {q.status === "abierto" ? <span className={`mono ${left <= 5 ? "coral" : ""}`}>{left}s</span> : <span className="chip">Revelada</span>}
      </div>
      <p className="quiz-question">{question.text}</p>
      <div className="pop-options">
        {question.options.map((o, i) => {
          const state =
            q.status === "revelado" ? (i === q.answer ? "right" : mine === i ? "wrong" : "") : mine === i ? "picked" : "";
          return (
            <button
              key={i}
              className={`pop-option ${state}`}
              disabled={!open || mine !== null || action.pending}
              onClick={() => action.run(() => answerQuiz(i))}
            >
              <span className="mono">{LETTERS[i]}</span>
              {o}
            </button>
          );
        })}
      </div>
      <span className="hint">
        {mine !== null && q.status === "abierto" && "Respuesta enviada. Esperen la revelación."}
        {mine === null && q.status === "abierto" && (open ? "Acertar rápido da más puntos." : "Se acabó el tiempo.")}
        {q.status === "revelado" && `${q.explanation ?? ""} · Llevas ${me.quizPoints} pts`}
      </span>
    </div>
  );
}
