"use client";

import type { Snapshot } from "@/application/snapshot";
import { FINAL_QUIZ } from "@/domain/data/questions";
import { useTick } from "@/ui/useLive";
import { controlQuiz } from "../actions";
import type { ActionApi } from "./ControlApp";

const LETTERS = ["A", "B", "C", "D"];

export function QuizAdmin({ snapshot, action, serverNow }: { snapshot: Snapshot; action: ActionApi; serverNow: () => number }) {
  useTick(500);
  const q = snapshot.quiz;
  const online = snapshot.roster.filter((r) => r.online).length;
  const left = q.openedAt ? Math.max(0, Math.ceil((q.openedAt + q.durationMs - serverNow()) / 1000)) : 0;
  const answer = q.index >= 0 ? FINAL_QUIZ[q.index] : null;

  return (
    <section className="stack">
      <div className="board row between wrap">
        <div className="stack-sm" style={{ gap: 2 }}>
          <span className="label">Quiz final individual · {q.total} preguntas</span>
          <strong style={{ fontFamily: "var(--display)", fontSize: 20 }}>
            {q.status === "cerrado" ? "Sin iniciar" : q.status === "terminado" ? "Terminado" : `Pregunta ${q.index + 1} de ${q.total}`}
          </strong>
        </div>
        {q.status === "abierto" && <span className="coins" style={{ fontSize: 44 }}>{left}<span className="unit">s</span></span>}
        <span className="mono muted">{q.answered}/{online} respondieron</span>
      </div>

      {answer && q.status !== "cerrado" && (
        <div className="panel tick stack-sm">
          <p className="scenario-text" style={{ fontSize: 18 }}>{answer.text}</p>
          <div className="stack-sm">
            {answer.options.map((o, i) => (
              <div key={i} className={`quiz-admin-opt ${i === answer.answer ? "right" : ""}`}>
                <span className="mono">{LETTERS[i]}</span>
                <span className="grow">{o}</span>
                {q.tally && <span className="mono">{q.tally[i]}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="row wrap" style={{ gap: 8 }}>
        {q.status === "cerrado" && (
          <button className="btn primary" onClick={() => action.run(() => controlQuiz("start"))}>Iniciar quiz</button>
        )}
        {q.status === "abierto" && (
          <button className="btn primary" onClick={() => action.run(() => controlQuiz("reveal"))}>Revelar respuesta</button>
        )}
        {q.status === "revelado" && (
          <button className="btn primary" onClick={() => action.run(() => controlQuiz("next"))}>
            {q.index + 1 >= q.total ? "Terminar quiz" : "Siguiente pregunta"}
          </button>
        )}
        {(q.status === "abierto" || q.status === "revelado") && (
          <button className="btn ghost" onClick={() => action.run(() => controlQuiz("finish"))}>Terminar ya</button>
        )}
        {q.status !== "cerrado" && (
          <button className="btn danger" onClick={() => action.run(() => controlQuiz("reset"))}>Volver a empezar</button>
        )}
      </div>

      {q.leaderboard && q.leaderboard.length > 0 && (
        <div className="panel stack-sm">
          <span className="label">Top 5</span>
          {q.leaderboard.map((l, i) => (
            <div key={i} className="row between">
              <span>{i + 1}. {l.name} <span className="dim">· G·{l.teamLabel}</span></span>
              <span className="mono">{l.points}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
